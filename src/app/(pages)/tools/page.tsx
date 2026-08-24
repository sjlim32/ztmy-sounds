"use client";

import { useMemo, useState } from "react";

interface TranscriptLine {
  time: string;
  original: string;
  pronunciation?: string;
  translation?: string;
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

export default function ToolsPage() {
  const [youtubeId, setYoutubeId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFetch = async () => {
    const videoId = extractYoutubeId(youtubeId);
    if (!videoId) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const res = await fetch(
        `/api/transcript?videoId=${encodeURIComponent(videoId)}`,
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
      setIsFetching(false);
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          onChange={(e) => setYoutubeId(e.target.value)}
          placeholder="youtubeId 또는 유튜브 링크"
          className="flex-1 rounded-md border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={!youtubeId.trim() || isFetching}
          className="bg-ztmy-pink shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isFetching ? "가져오는 중…" : "가져오기"}
        </button>
      </div>
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
          onClick={handleCopy}
          disabled={!raw.trim()}
          className="bg-ztmy-purple rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          {copied ? "복사됨!" : "복사"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
        {!error && lines.length > 0 && (
          <span className="text-sm text-white/50">{lines.length}줄 파싱됨</span>
        )}
      </div>

      {lines.length > 0 && (
        <ul className="divide-y divide-white/10 rounded-md border border-white/10">
          {lines.map((line, index) => (
            <li key={index} className="flex gap-3 p-2 text-sm text-white">
              <span className="w-14 shrink-0 font-mono text-white/50">
                {line.time}
              </span>
              <span className="flex-1">{line.original}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
