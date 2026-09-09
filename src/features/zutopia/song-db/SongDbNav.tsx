"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ACTIVE_TAB_CLASS, TAB_CLASS } from "../components/tab-styles";

/**
 * 곡/앨범을 탭처럼 보이지만 실제로는 별도 라우트(/zutopia/songs,
 * /zutopia/albums)로 이동하는 nav — ZutopiaCategoryTabs와 동일한 패턴
 * (클라이언트 상태 토글이 아니라 진짜 URL이라 북마크/공유가 그대로 됨).
 */
export function SongDbNav({
  songCount,
  albumCount,
}: {
  songCount: number;
  albumCount: number;
}) {
  const pathname = usePathname();
  const isSongs = pathname === "/zutopia/songs";
  const isAlbums = pathname === "/zutopia/albums";

  return (
    <nav
      aria-label="노래 DB"
      className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
    >
      <Link
        href="/zutopia/songs"
        aria-current={isSongs ? "page" : undefined}
        className={cn(TAB_CLASS, isSongs && ACTIVE_TAB_CLASS)}
      >
        곡 ({songCount})
      </Link>
      <Link
        href="/zutopia/albums"
        aria-current={isAlbums ? "page" : undefined}
        className={cn(TAB_CLASS, isAlbums && ACTIVE_TAB_CLASS)}
      >
        앨범 ({albumCount})
      </Link>
    </nav>
  );
}
