"use client";

import { useMemo, useState } from "react";
import { parseTimestamp } from "@/features/guide/lib/timestamp";
import type { Timestamp } from "@/features/guide/lib/types";

const AUTO_TIME_STEP_SECONDS = 3;

interface TranscriptLine {
  time: string;
  original: string;
  pronunciation?: string;
  translation?: string;
}

interface TranscriptTrack {
  languageCode: string;
  label: string;
  isAuto: boolean;
}

function isTranscriptLine(value: unknown): value is TranscriptLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.time === "string" && typeof line.original === "string";
}

// youtu.be/<id>, youtube.com/watch?v=<id>, /embed/<id>, /shorts/<id> 링크에서
// videoId만 뽑아냅니다. 링크가 아니라 순수 id를 입력했으면 그대로 반환.
function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }

    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;

      const match = url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
      if (match) return match[1];
    }
  } catch {
    // URL이 아니면 이미 순수 id라고 간주
  }

  return trimmed;
}

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ToolsPage() {
  const [youtubeId, setYoutubeId] = useState("");
  const [tracks, setTracks] = useState<TranscriptTrack[]>([]);
  const [isFetchingTracks, setIsFetchingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [fetchingLang, setFetchingLang] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [rawCopied, setRawCopied] = useState(false);
  const [textData, setTextData] = useState("");
  const [mappedCopied, setMappedCopied] = useState(false);
  const [offsetSeconds, setOffsetSeconds] = useState("");

  const handleYoutubeIdChange = (value: string) => {
    setYoutubeId(value);
    // 목록은 이전 id에 대한 결과이므로, id가 바뀌면 다시 "가져오기"를
    // 눌러야만 새 목록을 받도록 비워둡니다.
    setTracks([]);
    setTracksError(null);
  };

  const handleFetchTracks = async () => {
    const videoId = extractYoutubeId(youtubeId);
    if (!videoId) return;

    setIsFetchingTracks(true);
    setTracksError(null);
    setTracks([]);

    try {
      const res = await fetch(
        `/api/transcript/tracks?videoId=${encodeURIComponent(videoId)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setTracksError(data.error ?? "언어 목록을 가져오지 못했습니다");
        return;
      }

      setTracks(data.tracks ?? []);
    } catch {
      setTracksError("요청 중 오류가 발생했습니다");
    } finally {
      setIsFetchingTracks(false);
    }
  };

  const handleFetchTranscript = async (lang: string) => {
    const videoId = extractYoutubeId(youtubeId);
    if (!videoId) return;

    setFetchingLang(lang);
    setFetchError(null);

    try {
      const res = await fetch(
        `/api/transcript?videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? "스크립트를 가져오지 못했습니다");
        return;
      }

      setRaw(JSON.stringify(data, null, 2));
    } catch {
      setFetchError("요청 중 오류가 발생했습니다");
    } finally {
      setFetchingLang(null);
    }
  };

  const { lines, error } = useMemo(() => {
    if (!raw.trim()) return { lines: [] as TranscriptLine[], error: null };

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(isTranscriptLine)) {
        return {
          lines: [] as TranscriptLine[],
          error:
            "형식이 맞지 않습니다 (time/original 필드를 가진 배열이어야 함)",
        };
      }
      return { lines: parsed as TranscriptLine[], error: null };
    } catch {
      return {
        lines: [] as TranscriptLine[],
        error: "JSON 파싱에 실패했습니다",
      };
    }
  }, [raw]);

  // 자막 JSON을 안 가져왔어도 textData만 있으면, 0:00부터
  // AUTO_TIME_STEP_SECONDS 간격으로 시간을 채운 목록을 자동으로 만듭니다.
  const baseList = useMemo(() => {
    if (lines.length > 0) return lines;
    if (!textData.trim()) return [] as TranscriptLine[];

    const textLineCount = textData
      .split("\n")
      .filter((line) => line.trim() !== "").length;
    const count = Math.floor(textLineCount / 3);

    return Array.from({ length: count }, (_, index) => ({
      time: formatSeconds(index * AUTO_TIME_STEP_SECONDS),
      original: "",
      pronunciation: "",
      translation: "",
    }));
  }, [lines, textData]);

  // 시간초 입력값만큼 모든 time을 보정합니다. baseList 자체를 고치는 대신
  // 매번 원본에서 다시 계산해서, 입력 중 값이 바뀌어도 누적으로 어긋나지
  // 않습니다.
  const shiftedBaseList = useMemo(() => {
    const offset = Number(offsetSeconds);
    if (!offsetSeconds.trim() || !Number.isFinite(offset) || offset === 0) {
      return baseList;
    }

    return baseList.map((line) => {
      try {
        return {
          ...line,
          time: formatSeconds(parseTimestamp(line.time as Timestamp) + offset),
        };
      } catch {
        return line;
      }
    });
  }, [baseList, offsetSeconds]);

  // shiftedBaseList에 textData(원문/발음/해석이 3줄 단위로 반복되는 텍스트)를
  // 순서대로 3줄씩 잘라 매핑합니다. textData가 모자라면 남는 항목은 그대로
  // 둡니다.
  const mappedList = useMemo(() => {
    if (!textData.trim() || shiftedBaseList.length === 0) return [];

    const textLines = textData.split("\n").filter((line) => line.trim() !== "");

    return shiftedBaseList.map((line, index) => {
      const startIndex = index * 3;
      if (startIndex + 2 < textLines.length) {
        return {
          ...line,
          original: textLines[startIndex].trim(),
          pronunciation: textLines[startIndex + 1].trim(),
          translation: textLines[startIndex + 2].trim(),
        };
      }
      return line;
    });
  }, [shiftedBaseList, textData]);

  const handleCopyRaw = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(shiftedBaseList, null, 2),
    );
    setRawCopied(true);
    setTimeout(() => setRawCopied(false), 1500);
  };

  const handleCopyMapped = async () => {
    await navigator.clipboard.writeText(JSON.stringify(mappedList, null, 2));
    setMappedCopied(true);
    setTimeout(() => setMappedCopied(false), 1500);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold text-white">가사 스크립트 미리보기</h1>
      <p className="text-sm text-white/50">
        youtubeId로 자막을 바로 가져오거나, JSON 배열을 아래에 붙여넣으면
        파싱해서 보여줍니다.
      </p>

      <div className="flex gap-2">
        <input
          value={youtubeId}
          onChange={(e) => handleYoutubeIdChange(e.target.value)}
          placeholder="youtubeId 또는 유튜브 링크"
          className="flex-1 rounded-md border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={handleFetchTracks}
          disabled={!youtubeId.trim() || isFetchingTracks}
          className="bg-ztmy-pink shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isFetchingTracks ? "목록 가져오는 중…" : "가져오기"}
        </button>
      </div>
      {tracksError && <p className="text-sm text-red-400">{tracksError}</p>}

      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tracks.map((track) => (
            <button
              key={track.languageCode}
              type="button"
              onClick={() => handleFetchTranscript(track.languageCode)}
              disabled={fetchingLang !== null}
              className="rounded-md border border-white/20 bg-black/40 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {fetchingLang === track.languageCode
                ? "가져오는 중…"
                : track.label}
            </button>
          ))}
        </div>
      )}
      {fetchError && <p className="text-sm text-red-400">{fetchError}</p>}

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder='[{"time":"0:05","original":"...","pronunciation":"","translation":""}, ...]'
        spellCheck={false}
        className="h-56 w-full resize-y rounded-md border border-white/20 bg-black/40 p-3 font-mono text-xs text-white placeholder:text-white/30"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopyRaw}
          disabled={!raw.trim()}
          className="bg-ztmy-purple rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          {rawCopied ? "복사됨!" : "원본 복사"}
        </button>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={offsetSeconds}
            onChange={(e) => setOffsetSeconds(e.target.value)}
            placeholder="±초"
            className="w-16 rounded-md border border-white/20 bg-black/40 px-2 py-2 font-mono text-sm text-white placeholder:text-white/30"
          />
          <span className="text-sm text-white/50">초 보정</span>
        </div>
        {error && <span className="text-sm text-red-400">{error}</span>}
        {!error && lines.length > 0 && (
          <span className="text-sm text-white/50">{lines.length}줄 파싱됨</span>
        )}
      </div>

      <p className="text-sm text-white/50">
        원문/발음/해석을 3줄 단위로 반복해서 붙여넣으면, 위 목록에 순서대로
        채워서 완전체 목록을 보여줍니다. 유튜브 자막 없이 텍스트만 채우면
        0:00부터 {AUTO_TIME_STEP_SECONDS}초 간격으로 시간을 자동 생성합니다.
      </p>

      <textarea
        value={textData}
        onChange={(e) => setTextData(e.target.value)}
        placeholder={"원문1\n발음1\n해석1\n원문2\n발음2\n해석2\n..."}
        spellCheck={false}
        className="h-56 w-full resize-y rounded-md border border-white/20 bg-black/40 p-3 font-mono text-xs text-white placeholder:text-white/30"
      />

      {mappedList.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyMapped}
              className="bg-ztmy-pink rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              {mappedCopied ? "복사됨!" : "완전체 복사"}
            </button>
            <span className="text-sm text-white/50">{mappedList.length}줄</span>
          </div>

          <pre className="max-h-96 overflow-auto rounded-md border border-white/10 bg-black/40 p-3 font-mono text-xs whitespace-pre-wrap text-white">
            {JSON.stringify(mappedList, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
