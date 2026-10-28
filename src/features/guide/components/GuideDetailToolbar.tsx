import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ListIcon } from "@/components/icons/ListIcon";
import { ShareButton } from "@/components/ShareButton";
import { GHOST_BUTTON_CLASS } from "@/components/button-styles";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getNeighborIds } from "@/features/guide/components/PlayerControls";
import { PLAYER_COLUMN_CLASS } from "@/features/guide/lib/player-layout";

/**
 * tablet 이상: 영상 위 버튼 줄 — [☰ 곡 목록] … [공유] [‹ 이전 곡 │ 다음 <제목> ›].
 * 영상이 주인공이라 버튼은 면·테두리 없이(GHOST_BUTTON_CLASS) 가볍게 둔다.
 * 곡 목록은 화면을 떠나지 않고 드로어(SongListDrawer)로 열고, 공유는 지금 곡
 * 주소를 보낸다. 목록으로 돌아가기는 헤더(SiteHeader)의 ‹ / 페이지 이름이 맡는다.
 * 모바일은 영상 양옆 ◀▶ 버튼(PlayerControls)을 그대로 쓴다.
 */
export function GuideDetailToolbar({ onOpenList }: { onOpenList: () => void }) {
  const segment = useSelectedLayoutSegment();
  const { songs, basePath } = useGuideMode();
  if (!segment) return null;

  const { prevId, nextId } = getNeighborIds(songs, segment);
  const titleOf = (id: string | null) =>
    songs.find((song) => song.id === id)?.title.kr;

  return (
    <nav
      aria-label="곡 이동"
      className="tablet:order-0 tablet:flex tablet:basis-full hidden justify-center"
    >
      <div
        className={cn(
          PLAYER_COLUMN_CLASS,
          // @container: 열이 아주 좁으면(27rem 미만) 이전/다음 곡 글자를 숨긴다.
          "@container flex items-center justify-between gap-2",
        )}
      >
        <button
          type="button"
          onClick={onOpenList}
          aria-haspopup="dialog"
          className={cn(GHOST_BUTTON_CLASS, "-ml-2.5")}
        >
          <ListIcon className="h-4 w-4" />곡 목록
        </button>

        <div className="-mr-2.5 flex min-w-0 items-center gap-1">
          <ShareButton
            // 공용 공유 버튼(이동 버튼 모양)을 이 줄에선 면·테두리 없이.
            className="border-0 bg-transparent text-white/70 backdrop-blur-none hover:bg-white/10"
            tooltipClassName="top-full bottom-auto mt-2 mb-0"
          />
          {/* 이전·다음은 한 묶음 — 다음 곡은 제목을 바로 보여준다. */}
          <div className="flex min-w-0 items-center">
            <NeighborLink
              href={prevId && `${basePath}/${prevId}`}
              title={titleOf(prevId)}
              direction="prev"
            />
            <span aria-hidden className="h-4 w-px shrink-0 bg-white/20" />
            <NeighborLink
              href={nextId && `${basePath}/${nextId}`}
              title={titleOf(nextId)}
              direction="next"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NeighborLink({
  href,
  title,
  direction,
}: {
  href: string | null;
  title?: string;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "이전 곡" : "다음 곡";
  const icon = (
    <ChevronLeftIcon
      className={cn("h-4 w-4 shrink-0", direction === "next" && "rotate-180")}
    />
  );
  // 열이 아주 좁으면 아이콘만 보인다(글자는 화면 읽기용으로 남김).
  const text =
    direction === "next" && title ? (
      <span className="flex min-w-0 items-baseline gap-1.5 @max-[27rem]:sr-only">
        <span className="shrink-0 text-xs text-white/45">다음</span>
        <span className="max-w-40 truncate">{title}</span>
      </span>
    ) : (
      <span className="@max-[27rem]:sr-only">{label}</span>
    );
  const content =
    direction === "prev" ? (
      <>
        {icon}
        {text}
      </>
    ) : (
      <>
        {text}
        {icon}
      </>
    );
  const className = cn(GHOST_BUTTON_CLASS, "min-w-0");

  if (!href) {
    return (
      <button type="button" disabled className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      aria-label={title ? `${label}: ${title}` : label}
      title={title ? `${label}: ${title}` : label}
      className={className}
    >
      {content}
    </Link>
  );
}
