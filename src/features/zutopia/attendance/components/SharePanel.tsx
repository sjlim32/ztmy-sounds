"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FOCUS_RING,
  SOFT_PRIMARY_BUTTON_CLASS,
  SOFT_BUTTON_CLASS,
} from "@/components/button-styles";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import type { LiveUnit } from "@/features/zutopia/live-history/types";
import { importableIds } from "@/features/zutopia/attendance/share-import";
import {
  backupFileName,
  parseBackup,
  serializeAttendance,
} from "@/features/zutopia/attendance/storage";
import {
  decodeAttendance,
  encodeAttendance,
  extractCode,
} from "@/features/zutopia/attendance/share-code";

const PAGE_PATH = "/zutopia/attendance";

export interface PendingImport {
  ids: string[];
  source: string;
}

/**
 * 공유 · 불러오기 — 내 기록을 코드·링크·파일로 내보내고, 받은 코드·링크·
 * 백업 파일을 불러온다. 불러올 땐 지금 기록을 "바꾸기"와 "합치기" 중 고른다.
 * 공유 링크(#code=…)로 들어온 경우는 AttendanceView가 읽어 initialPending으로
 * 넘긴다(바로 확인을 띄운다). 모달(공유 · 불러오기) 안에 들어간다.
 */
export function SharePanel({
  units,
  attended,
  ready,
  onReplace,
  initialPending = null,
}: {
  units: LiveUnit[];
  attended: ReadonlySet<string>;
  ready: boolean;
  onReplace: (ids: string[]) => void;
  initialPending?: PendingImport | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(initialPending);
  const [dragging, setDragging] = useState(false);
  // 불러오기 직전 기록 — "되돌리기"로 한 번 되살릴 수 있게(바꾸기는 기록을 통째로 덮는다).
  const [previous, setPrevious] = useState<string[] | null>(null);
  const code = encodeAttendance(units, attended);

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setPrevious(null);
      setMessage(done);
    } catch {
      setMessage("복사하지 못했어요. 직접 선택해서 복사해 주세요.");
    }
  };

  const shareLink = async () => {
    const link = `${window.location.origin}${PAGE_PATH}#code=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ZUTOMAYO 라이브 참전 기록",
          url: link,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    await copy(link, "공유 링크를 복사했어요.");
  };

  const importText = (text: string, source: string) => {
    const found = extractCode(text);
    const ids = found ? decodeAttendance(found, units) : null;
    if (ids) {
      setPending({ ids, source });
      return;
    }
    const backup = parseBackup(text);
    if (backup) {
      setPending({ ids: backup.attended, source });
      return;
    }
    setPrevious(null);
    setMessage("참전 기록 코드나 백업 파일 형식이 아니에요.");
  };

  const importFile = async (file: File) => {
    importText(await file.text(), "백업 파일");
  };

  const apply = (mode: "replace" | "merge") => {
    if (!pending) return;
    setPrevious([...attended]);
    onReplace(mode === "replace" ? pending.ids : [...attended, ...pending.ids]);
    setMessage(
      mode === "replace"
        ? "불러온 기록으로 바꿨어요."
        : "불러온 기록을 합쳤어요.",
    );
    setPending(null);
    setInput("");
  };

  const backup = () => {
    const now = new Date();
    const blob = new Blob([serializeAttendance(attended, now)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = backupFileName(now);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const matched = pending ? importableIds(pending.ids, units) : [];

  return (
    <div className="flex flex-col gap-5">
      {pending && (
        <div
          role="alertdialog"
          aria-label="참전 기록 불러오기"
          className="border-ztmy-magenta/40 bg-ztmy-magenta/10 flex flex-col gap-3 rounded-md border p-3"
        >
          {matched.length === 0 ? (
            <>
              <p className="text-sm text-white">
                {pending.source}에 지금 공연 목록과 맞는 기록이 없어요. 페이지를
                새로고침해 최신 공연 목록을 받은 뒤 다시 시도해 보세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className={SOFT_BUTTON_CLASS}
                >
                  닫기
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-white">
                {pending.source}에서 공연 {matched.length}개 기록을 찾았어요.
                어떻게 불러올까요?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => apply("replace")}
                  className={cn(
                    SOFT_PRIMARY_BUTTON_CLASS,
                    "px-3.5 py-2 text-sm",
                  )}
                >
                  지금 기록을 이걸로 바꾸기
                </button>
                <button
                  type="button"
                  onClick={() => apply("merge")}
                  className={SOFT_BUTTON_CLASS}
                >
                  지금 기록에 합치기
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className={SOFT_BUTTON_CLASS}
                >
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 내보내기 */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-white/70">내 기록 보내기</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={ready ? code : ""}
            aria-label="참전 기록 코드"
            onFocus={(event) => event.target.select()}
            className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-3 font-mono text-sm text-white/90"
          />
          <button
            type="button"
            disabled={!ready}
            onClick={() => copy(code, "코드를 복사했어요.")}
            className={SOFT_BUTTON_CLASS}
          >
            코드 복사
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!ready}
            onClick={shareLink}
            className={SOFT_BUTTON_CLASS}
          >
            <ShareIcon className="size-4" />
            공유 링크 보내기
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={backup}
            className={SOFT_BUTTON_CLASS}
          >
            <DownloadIcon className="size-4" />
            백업 파일 저장
          </button>
        </div>
      </div>

      {/* 불러오기 */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-white/70">
          받은 기록 · 다른 기기 기록 불러오기
        </p>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            importText(input, "붙여넣은 코드");
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="코드(ZT1…)나 공유 링크 붙여넣기"
            aria-label="코드나 공유 링크"
            className="focus-visible:outline-ztmy-magenta h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/35 focus-visible:outline-2"
          />
          <button
            type="submit"
            disabled={!ready || !input.trim()}
            className={SOFT_BUTTON_CLASS}
          >
            불러오기
          </button>
        </form>
        <button
          type="button"
          disabled={!ready}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void importFile(file);
          }}
          className={cn(
            "rounded-md border border-dashed border-white/25 px-3 py-4 text-sm text-white/70 transition-colors hover:border-white/45 hover:text-white",
            dragging && "border-ztmy-magenta text-white",
          )}
        >
          백업 파일(.json)을 여기로 끌어다 놓거나 눌러서 선택
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importFile(file);
          }}
        />
      </div>

      {message && (
        <p role="status" className="text-sm text-white/70">
          {message}
          {previous && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => {
                  onReplace(previous);
                  setPrevious(null);
                  setMessage("불러오기 전 기록으로 되돌렸어요.");
                }}
                className={cn(
                  "rounded text-white underline decoration-white/40 underline-offset-4",
                  FOCUS_RING,
                )}
              >
                되돌리기
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
