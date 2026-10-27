"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLastSongId } from "@/features/guide/lib/last-song";
import { LIST_ITEM_CLASS, NAV_BUTTON_CLASS } from "@/components/button-styles";
import { PlayIcon } from "@/components/icons/PlayIcon";

export interface PracticeSong {
  id: string;
  title: string;
  jpTitle: string;
  /** 곡/앨범 DB의 커버(곡 커버, 없으면 첫 앨범 커버). DB에 없는 곡이면 null. */
  cover: string | null;
  essential: boolean;
}

const CHIP_CLASS = cn(NAV_BUTTON_CLASS, "h-8 shrink-0 px-3 text-sm");

/**
 * 홈에서 곡 목록을 거치지 않고 바로 연습을 시작하는 바로가기 — 마지막으로
 * 연 곡(이어서)과 필수 숙지 곡.
 * 둘은 따로 묶어 구분한다.
 * - chips(모바일): 한 줄 가로 스크롤 — [이어서 칩] | 필수 숙지 [곡 칩…].
 * - list(태블릿 이상): 반투명 흐림 카드 안에 "이어서 연습하기" / "필수 숙지 곡"
 *   묶음, 각 곡은 앨범 커버 + 제목을 세로 한 줄로.
 *
 * memo: 홈이 카운트다운 때문에 매초 다시 그려지는데, songs는 서버에서 받은
 * 값이라 참조가 안 바뀐다.
 */
function PracticeShortcutsComponent({
  songs,
  layout,
  className,
}: {
  songs: PracticeSong[];
  layout: "chips" | "list";
  className?: string;
}) {
  const lastSongId = useLastSongId();
  const lastSong = songs.find((song) => song.id === lastSongId);
  // 이어서 연습하기와 필수 숙지 곡은 따로 묶는다 — 같은 곡이어도 필수 숙지
  // 목록에선 빼지 않는다.
  const essentialSongs = songs.filter((song) => song.essential);

  if (layout === "list") {
    return (
      <section
        aria-label="바로 연습하기"
        className={cn(
          "flex w-64 flex-col gap-1 rounded-lg border border-white/15 bg-black/45 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md",
          className,
        )}
      >
        {lastSong && (
          <>
            <GroupLabel>이어서 연습하기</GroupLabel>
            <CoverRow song={lastSong} isContinue />
            <div aria-hidden className="mx-2 my-1 h-px bg-white/10" />
          </>
        )}
        <GroupLabel>필수 숙지 곡</GroupLabel>
        <ul className="flex flex-col">
          {essentialSongs.map((song) => (
            <li key={song.id}>
              <CoverRow song={song} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    // 화면 오른쪽 가장자리까지 스크롤되도록 바깥 여백만큼 넓힌다.
    <ul
      className={cn(
        "-mr-4 flex min-w-0 scrollbar-none items-center gap-1.5 overflow-x-auto pr-4",
        className,
      )}
    >
      {lastSong && (
        <>
          <li className="shrink-0">
            <Link
              href={`/guide/${lastSong.id}`}
              className={cn(
                CHIP_CLASS,
                "border-ztmy-magenta/60 bg-ztmy-magenta/15 hover:border-ztmy-magenta",
              )}
            >
              <PlayIcon className="text-ztmy-magenta h-3 w-3" />
              <span className="text-white/60">이어서</span>
              {lastSong.title}
            </Link>
          </li>
          <li aria-hidden className="mx-1 h-5 w-px shrink-0 bg-white/25" />
        </>
      )}
      <li className="mr-0.5 shrink-0 text-sm font-medium text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        필수 숙지
      </li>
      {essentialSongs.map((song) => (
        <li key={song.id} className="shrink-0">
          <Link href={`/guide/${song.id}`} className={CHIP_CLASS}>
            {song.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const PracticeShortcuts = memo(PracticeShortcutsComponent);

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 pt-1 pb-0.5 text-sm font-semibold text-white/80">
      {children}
    </p>
  );
}

function CoverRow({
  song,
  isContinue = false,
}: {
  song: PracticeSong;
  isContinue?: boolean;
}) {
  return (
    <Link
      href={`/guide/${song.id}`}
      className={cn(
        LIST_ITEM_CLASS,
        "flex items-center gap-3 px-2 py-1.5",
        isContinue && "bg-ztmy-magenta/15 hover:bg-ztmy-magenta/25",
      )}
    >
      <span className="relative shrink-0">
        {song.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(곡 DB) 이미지라 크기를 미리 알 수 없고, output: export라 최적화도 안 된다
          <img
            src={song.cover}
            alt=""
            loading="lazy"
            className="h-10 w-10 rounded-md object-cover shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          />
        ) : (
          <span className="block h-10 w-10 rounded-md bg-white/10" />
        )}
        {isContinue && (
          <span className="bg-ztmy-magenta absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-2 ring-black/60">
            <PlayIcon className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-white">
          {song.title}
        </span>
        <span className="font-mkpop truncate text-xs text-white/55">
          {song.jpTitle}
        </span>
      </span>
    </Link>
  );
}
