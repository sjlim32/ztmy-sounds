"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { usePresence } from "@/lib/use-presence";
import { FOCUS_RING, GHOST_BUTTON_CLASS } from "@/components/button-styles";
import { searchZutopia } from "@/features/zutopia/search/search";
import type { ZutopiaSearchIndex } from "@/features/zutopia/search/types";
import { SearchField, useSearchShortcut } from "./SearchField";
import { SearchResults } from "./SearchResults";
import {
  closeSearchDialog,
  openSearchDialog,
  useSearchDialogOpen,
} from "./search-dialog-store";

/**
 * 하위 페이지(곡·앨범·공연·참전·연혁 등)에서 쓰는 통합 검색 창. 헤더의 검색
 * 버튼(ZutopiaSearchButton, 태블릿 헤더·모바일 줄에 하나씩)이나 "/"·⌘K로 연다.
 * 열림 상태는 버튼 여럿과 창 하나가 같이 보도록 작은 공용 상태(search-dialog-store)에 둔다.
 *
 * 검색 데이터는 페이지에 싣지 않고, 창을 처음 열 때 빌드 때 만든
 * /zutopia/search-index.json을 한 번 받아 둔다(페이지 무게 그대로). 결과
 * 모양은 첫 화면 검색과 같은 SearchResults. 결과를 누르면 창을 닫는다.
 */
const PANEL_TRANSITION_MS = 200;

let indexPromise: Promise<ZutopiaSearchIndex> | null = null;
function loadIndex(): Promise<ZutopiaSearchIndex> {
  indexPromise ??= fetch("/zutopia/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<ZutopiaSearchIndex>;
    })
    .catch((error: unknown) => {
      // 실패하면 다음에 열 때 다시 받는다.
      indexPromise = null;
      throw error;
    });
  return indexPromise;
}

/** 검색 창 본체 + 단축키. 헤더에 한 번만 둔다. */
export function ZutopiaSearchDialog() {
  const isOpen = useSearchDialogOpen();
  useSearchShortcut(openSearchDialog);
  // 닫힌 뒤에도 움직임이 끝날 때까지 그려 둔다(SidePanel과 같은 usePresence).
  const present = usePresence(isOpen, PANEL_TRANSITION_MS);

  if (!present) return null;
  return createPortal(<DialogPanel open={isOpen} />, document.body);
}

function DialogPanel({ open }: { open: boolean }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<ZutopiaSearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadIndex().then(
      (loaded) => !cancelled && setIndex(loaded),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // 글자를 빨리 칠 때 입력이 밀리지 않게 결과 계산은 한 박자 늦게.
  const deferredQuery = useDeferredValue(query);
  const result = useMemo(
    () => (index ? searchZutopia(index, deferredQuery) : null),
    [index, deferredQuery],
  );

  // 열리면 검색창에, 닫히면 열었던 요소로 포커스. 창 안에서만 Tab이 돈다(SidePanel과 같은 훅).
  useDialogFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onClose: closeSearchDialog,
  });

  const clear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const isSearching = query.trim().length > 0;

  return (
    <div
      className={cn(
        "tablet:items-start tablet:justify-center tablet:pt-[10vh] fixed inset-0 z-50 flex bg-black/60",
        "transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0",
        !open && "pointer-events-none opacity-0",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeSearchDialog();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="통합 검색"
        className={cn(
          // 모바일은 화면 전체, 태블릿 이상은 위쪽 가운데 창.
          "bg-background flex h-full w-full flex-col",
          "tablet:h-auto tablet:max-h-[80dvh] tablet:w-[40rem] tablet:rounded-xl tablet:border tablet:border-white/15 tablet:shadow-2xl",
          "transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none starting:-translate-y-2 starting:opacity-0",
          !open && "-translate-y-2 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <div className="min-w-0 flex-1">
            <SearchField
              inputRef={inputRef}
              value={query}
              onChange={setQuery}
              onClear={clear}
            />
          </div>
          <button
            type="button"
            onClick={closeSearchDialog}
            className={cn(GHOST_BUTTON_CLASS, "h-14 shrink-0")}
          >
            닫기
          </button>
        </div>
        {/* 아이폰 홈 표시줄에 겹치지 않게 아래 여백을 넉넉히(RULES.md). */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8">
          {failed ? (
            <p
              role="status"
              className="py-10 text-center text-sm text-white/60"
            >
              검색 데이터를 불러오지 못했어요.{" "}
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
                className={cn(
                  "rounded text-white underline decoration-white/40 underline-offset-4",
                  FOCUS_RING,
                )}
              >
                다시 시도
              </button>
            </p>
          ) : !isSearching ? (
            <p className="py-10 text-center text-sm text-white/55">
              곡을 찾으면 그 곡이 실린 앨범과 부른 공연도 함께 나와요.
            </p>
          ) : !result ? (
            <p
              role="status"
              className="py-10 text-center text-sm text-white/55"
            >
              불러오는 중…
            </p>
          ) : (
            <SearchResults
              query={deferredQuery}
              result={result}
              onNavigate={closeSearchDialog}
            />
          )}
        </div>
      </div>
    </div>
  );
}
