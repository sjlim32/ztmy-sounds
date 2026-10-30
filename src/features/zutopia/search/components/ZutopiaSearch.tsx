"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  GHOST_ICON_BUTTON_CLASS,
  LIST_ITEM_CLASS,
} from "@/components/button-styles";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { searchZutopia } from "@/features/zutopia/search/search";
import type {
  SearchHit,
  ZutopiaSearchResult,
} from "@/features/zutopia/search/search";
import type {
  SearchSong,
  ZutopiaSearchIndex,
} from "@/features/zutopia/search/types";

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
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-5 w-5 -translate-y-1/2 text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              writeQuery(event.target.value);
              setDropdownOpen(true);
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
            enterKeyHint="search"
            aria-label="곡·앨범·공연 검색"
            placeholder="ZUTOPIA 통합 검색 (곡·별명·앨범·공연 이름)"
            className={cn(
              // 모바일 Safari는 16px 미만 입력란에 포커스하면 화면을 확대해서 text-base.
              "h-12 w-full rounded-lg border-2 border-white/15 bg-black/50 pr-12 pl-11 text-base text-white backdrop-blur-sm transition-colors placeholder:text-white/40 hover:border-white/30 focus:border-white/60 focus:outline-none",
              // 브라우저 기본 지우기(×) 버튼 대신 아래 버튼을 쓴다.
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="검색어 지우기"
              className={cn(
                GHOST_ICON_BUTTON_CLASS,
                "absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2",
              )}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

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

function SearchResults({
  query,
  result,
}: {
  query: string;
  result: ZutopiaSearchResult;
}) {
  if (result.total === 0) {
    return (
      <p className="py-10 text-center text-sm text-white/60">
        「{query.trim()}」 검색 결과가 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-white/60" aria-live="polite">
        「{query.trim()}」 검색 결과 {result.total}개
      </p>
      <ResultGroup
        title="곡"
        hits={result.songs}
        render={({ item }) => (
          <ResultRow
            href={`/zutopia/songs?song=${item.slug}`}
            image={item.cover}
            title={item.title}
            subtitle={`${item.titleKo} · ${item.releaseYear}`}
            englishTitle={item.titleEn}
          />
        )}
      />
      <ResultGroup
        title="앨범"
        hits={result.albums}
        render={(hit) => (
          <ResultRow
            href={`/zutopia/albums?album=${hit.item.slug}`}
            image={hit.item.cover}
            title={hit.item.title}
            subtitle={`${hit.item.titleKo} · ${hit.item.releaseYear}`}
            englishTitle={hit.item.titleEn}
            reason={hit.related ? `${songList(hit.viaSongs)} 수록` : null}
          />
        )}
      />
      <ResultGroup
        title="공연"
        hits={result.lives}
        groupBy={(hit) => hit.item.year}
        render={(hit) => (
          <ResultRow
            href={`/zutopia/lives/${hit.item.slug}`}
            image={hit.item.thumbnail || null}
            title={hit.item.label}
            subtitle={hit.item.date}
            englishTitle={hit.item.titleEn}
            reason={hit.related ? `${songList(hit.viaSongs)} 세트리스트` : null}
          />
        )}
      />
    </div>
  );
}

// 「초침을 깨물다」, 여러 곡이면 「초침을 깨물다」 외 2곡.
function songList(songs: SearchSong[]): string {
  const first = `「${songs[0].titleKo}」`;
  return songs.length > 1 ? `${first} 외 ${songs.length - 1}곡` : first;
}

function ResultGroup<T extends { slug: string }>({
  title,
  hits,
  render,
  groupBy,
}: {
  title: string;
  hits: SearchHit<T>[];
  render: (hit: SearchHit<T>) => ReactNode;
  /** 주면 그 값(예: 공연 연도)으로 묶어 최신(큰 값)부터 소제목과 함께 보여준다. */
  groupBy?: (hit: SearchHit<T>) => string;
}) {
  if (hits.length === 0) return null;

  const renderList = (items: SearchHit<T>[]) => (
    <ul className="flex flex-col rounded-lg border border-white/10 bg-black/40 p-1.5 backdrop-blur-sm">
      {items.map((hit) => (
        <li key={hit.item.slug}>{render(hit)}</li>
      ))}
    </ul>
  );

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-white">
        {title}
        <span className="ml-1.5 text-sm font-medium text-white/50">
          {hits.length}
        </span>
      </h2>
      {groupBy
        ? groupHits(hits, groupBy).map(([key, items]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <h3 className="font-mono text-sm font-semibold text-white/70">
                {key}
              </h3>
              {renderList(items)}
            </div>
          ))
        : renderList(hits)}
    </section>
  );
}

// 같은 키끼리 묶고 키 내림차순(최신 연도 먼저)으로. 묶음 안 순서는 그대로 둔다.
function groupHits<T>(
  hits: SearchHit<T>[],
  keyOf: (hit: SearchHit<T>) => string,
): [string, SearchHit<T>[]][] {
  const groups = new Map<string, SearchHit<T>[]>();
  for (const hit of hits) {
    const key = keyOf(hit);
    groups.set(key, [...(groups.get(key) ?? []), hit]);
  }
  return [...groups].sort(([a], [b]) => b.localeCompare(a));
}

function ResultRow({
  href,
  image,
  title,
  subtitle,
  englishTitle,
  reason = null,
}: {
  href: string;
  image: string | null;
  title: string;
  subtitle: string;
  /** 영어 제목 — 없거나 위 제목과 같으면(영어 원제 공연 등) 줄을 생략한다. */
  englishTitle: string | null;
  reason?: string | null;
}) {
  const showEnglish = !!englishTitle && englishTitle !== title;

  return (
    <Link
      href={href}
      className={cn(LIST_ITEM_CLASS, "flex items-center gap-3 px-2 py-2")}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부(곡 DB) 이미지라 크기를 미리 알 수 없고, output: export라 최적화도 안 된다
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="block h-12 w-12 shrink-0 rounded-md bg-white/10" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-white">
          {title}
        </span>
        {showEnglish && (
          <span className="truncate text-xs text-white/45">{englishTitle}</span>
        )}
        <span className="truncate text-sm text-white/60">{subtitle}</span>
        {reason && (
          <span className="text-ztmy-pink truncate text-xs">{reason}</span>
        )}
      </span>
    </Link>
  );
}
