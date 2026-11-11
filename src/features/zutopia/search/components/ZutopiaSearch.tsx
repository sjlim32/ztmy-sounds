"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { searchZutopia } from "@/features/zutopia/search/search";
import type { ZutopiaSearchIndex } from "@/features/zutopia/search/types";
import { SearchResults } from "./SearchResults";
import { SearchField, useSearchShortcut } from "./SearchField";

// 검색어는 주소의 ?q=에 둔다 — 결과를 눌러 들어갔다가 뒤로 오면 같은 검색
// 결과가 그대로 있고, 링크로 공유해도 같은 결과가 열린다.
const QUERY_PARAM = "q";
const QUERY_CHANGE_EVENT = "zutopia-search-change";

function readQuery(): string {
  return new URLSearchParams(window.location.search).get(QUERY_PARAM) ?? "";
}

function subscribeQuery(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(QUERY_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(QUERY_CHANGE_EVENT, onChange);
  };
}

function writeQuery(query: string) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set(QUERY_PARAM, query);
  else url.searchParams.delete(QUERY_PARAM);
  // 글자마다 방문 기록이 쌓이지 않게 replaceState로 주소만 바꾼다. URL
  // 객체가 아니라 문자열로 넘긴다 — 서비스워커(Serwist)가 주소 변경을
  // postMessage로 전달하는데 URL 객체는 복사되지 않아 에러가 난다.
  window.history.replaceState(window.history.state, "", url.toString());
  window.dispatchEvent(new Event(QUERY_CHANGE_EVENT));
}

const clearQuery = () => writeQuery("");

/**
 * 즛토피아 첫 화면 통합 검색. 곡이 걸리면 그 곡이 실린 앨범과 그 곡을 부른
 * 공연도 함께 나온다(search.ts). 결과는 묶음마다 전부 한 번에 보여준다.
 *
 * - 태블릿 이상: 결과가 검색창 바로 아래에 붙는 드롭다운으로 뜬다(배경막
 *   없음, 아래 카드는 그대로). 바깥을 누르거나 Esc면 닫히고 검색어는 남는다
 *   — 검색창을 다시 누르면 같은 결과가 열린다. ×는 검색어를 지운다.
 * - 모바일: 드롭다운 없이 카드 자리에 결과를 그대로 보여준다.
 * - 검색창은 SearchField(헤더 검색 창과 같은 모양), "/"·⌘K로 바로 들어간다.
 */
export function ZutopiaSearch({
  index,
  children,
}: {
  index: ZutopiaSearchIndex;
  children: ReactNode;
}) {
  const query = useSyncExternalStore(subscribeQuery, readQuery, () => "");
  const result = useMemo(() => searchZutopia(index, query), [index, query]);
  const isSearching = query.trim().length > 0;
  // 태블릿 이상 드롭다운 열림 여부. 처음엔 열린 상태라, 결과를 눌렀다가
  // 뒤로 오면(?q= 유지) 결과가 바로 다시 보인다.
  const [isDropdownOpen, setDropdownOpen] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // "/"·⌘K로 검색창에 바로 들어간다.
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  useSearchShortcut(focusInput);

  // 검색창·드롭다운 바깥을 누르면 드롭다운을 닫는다.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isDropdownOpen]);

  return (
    <div className="flex flex-col gap-6">
      <div ref={boxRef} className="relative">
        <SearchField
          inputRef={inputRef}
          value={query}
          onChange={(value) => {
            writeQuery(value);
            setDropdownOpen(true);
          }}
          onClear={() => {
            clearQuery();
            inputRef.current?.focus();
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            // type="search" 입력란은 Esc에 글자를 스스로 지워서, 지울지 말지를
            // 여기서 직접 정한다.
            event.preventDefault();
            // 태블릿 이상은 드롭다운만 닫고, 이미 닫혀 있으면(모바일 포함) 지운다.
            if (isDropdownOpen && isSearching) setDropdownOpen(false);
            else clearQuery();
          }}
        />

        {/* 태블릿 이상 드롭다운 — 검색창 바로 아래, 카드 위에 겹친다. 결과가
        길면 드롭다운 안에서만 스크롤된다. 높이는 화면 아래를 넘지 않게
        화면 높이에서 검색창 위쪽 몫(헤더·제목, 약 21rem)을 뺀 만큼. */}
        {isSearching && isDropdownOpen && (
          <div
            role="region"
            aria-label="곡·앨범·공연 검색 결과"
            className={cn(
              "max-tablet:hidden absolute inset-x-0 top-full z-20 mt-2",
              "bg-background/95 max-h-[max(15rem,calc(100dvh-21rem))] overflow-y-auto overscroll-contain rounded-xl border border-white/15 p-4 shadow-2xl backdrop-blur-md",
            )}
          >
            <SearchResults query={query} result={result} />
          </div>
        )}
      </div>

      {/* 모바일은 검색 중이면 카드 대신 결과를 보여준다. 태블릿 이상은 카드를
      그대로 두고 결과는 위 드롭다운에 띄운다. */}
      <div className={cn(isSearching && "max-tablet:hidden")}>{children}</div>
      {isSearching && (
        <div className="tablet:hidden">
          <SearchResults query={query} result={result} />
        </div>
      )}
    </div>
  );
}
