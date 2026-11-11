"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { cn } from "@/lib/utils";
import { LIST_ITEM_CLASS } from "@/components/button-styles";
import { findMatchRanges } from "@/features/zutopia/search/search";
import type {
  SearchHit,
  ZutopiaSearchResult,
} from "@/features/zutopia/search/search";
import type { SearchSong } from "@/features/zutopia/search/types";

/**
 * 통합 검색 결과(곡·앨범·공연 묶음) — 즛토피아 첫 화면 검색(ZutopiaSearch)과
 * 하위 페이지 헤더의 검색 창(ZutopiaSearchDialog)이 같이 쓴다. 제목·부제에서
 * 검색어와 맞는 글자는 마젠타 면으로 칠해 왜 걸렸는지 보이게 한다.
 * onNavigate는 결과를 눌렀을 때(검색 창을 닫을 때) 부른다.
 */
export function SearchResults({
  query,
  result,
  onNavigate,
}: {
  query: string;
  result: ZutopiaSearchResult;
  onNavigate?: () => void;
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
            query={query}
            onNavigate={onNavigate}
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
            query={query}
            onNavigate={onNavigate}
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
            query={query}
            onNavigate={onNavigate}
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
  query,
  onNavigate,
  href,
  image,
  title,
  subtitle,
  englishTitle,
  reason = null,
}: {
  query: string;
  onNavigate?: () => void;
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
      transitionTypes={["nav-forward"]}
      onClick={onNavigate}
      className={cn(LIST_ITEM_CLASS, "flex items-center gap-3 px-2 py-2")}
    >
      {image ? (
        <ThumbImage
          src={image}
          displayWidth={48}
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="block h-12 w-12 shrink-0 rounded-md bg-white/10" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-white">
          <Highlight text={title} query={query} />
        </span>
        {showEnglish && (
          <span className="truncate text-xs text-white/45">
            <Highlight text={englishTitle} query={query} />
          </span>
        )}
        <span className="truncate text-sm text-white/60">
          <Highlight text={subtitle} query={query} />
        </span>
        {reason && (
          <span className="text-ztmy-pink truncate text-xs">{reason}</span>
        )}
      </span>
    </Link>
  );
}

/** 검색어와 맞는 글자만 마젠타 면으로(<mark>) — 나머지 글자는 그대로. */
function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = findMatchRanges(text, query);
  if (ranges.length === 0) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="bg-ztmy-magenta/35 rounded-sm text-white">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <Fragment>{parts}</Fragment>;
}
