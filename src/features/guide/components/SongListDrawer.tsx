import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons/CloseIcon";
import {
  ACTIVE_LIST_ITEM_CLASS,
  GHOST_ICON_BUTTON_CLASS,
  LIST_ITEM_CLASS,
} from "@/components/button-styles";
import { CallIcon } from "@/features/guide/components/CallIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getCachedSongCallTags } from "@/features/guide/lib/song-call-tags";

const subscribeNothing = () => () => {};

/**
 * tablet 이상 가이드 상세: 화면 왼쪽에서 열리는 곡 목록. 상세 화면을 떠나지
 * 않고 다른 곡으로 바로 이동하기 위한 것(목록 화면 /guide 는 그대로 둔다).
 *
 * document.body로 포털해서 그린다 — 조상에 backdrop-filter가 있으면 fixed
 * 요소가 뷰포트가 아니라 그 조상 박스 기준으로 갇히기 때문.
 * 닫힘: 배경 클릭, Esc, 곡 선택(라우트 이동).
 */
export function SongListDrawer({
  open,
  onClose,
  currentSongId,
}: {
  open: boolean;
  onClose: () => void;
  currentSongId: string | null;
}) {
  const { songs, basePath, visibleTags, label } = useGuideMode();
  const panelRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);
  // 서버 렌더에는 document.body가 없으니 브라우저에서만 포털을 연다.
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();
    currentRef.current?.scrollIntoView({ block: "center" });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!isClient) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        "max-tablet:hidden fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* 배경막 */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${label.title} 곡 목록`}
        tabIndex={-1}
        inert={!open}
        className={cn(
          "absolute inset-y-0 left-0 flex w-96 max-w-[85vw] flex-col border-r border-white/10 bg-[#140b22]/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out outline-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">{label.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="곡 목록 닫기"
            className={cn(GHOST_ICON_BUTTON_CLASS, "p-1")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-2">
          {songs.map((song) => {
            const isCurrent = song.id === currentSongId;
            return (
              <li key={song.id}>
                <Link
                  ref={isCurrent ? currentRef : undefined}
                  href={`${basePath}/${song.id}`}
                  onClick={onClose}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    LIST_ITEM_CLASS,
                    "mx-2 flex items-center justify-between gap-3 px-3 py-2.5",
                    isCurrent && ACTIVE_LIST_ITEM_CLASS,
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mkpop truncate text-lg leading-tight text-white">
                      {song.title.jp}
                    </span>
                    <span className="truncate text-sm text-white/60">
                      {song.title.kr}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {getCachedSongCallTags(song)
                      .filter((tag) => visibleTags.includes(tag))
                      .map((tag) => (
                        <CallIcon key={tag} name={tag} size={18} />
                      ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
