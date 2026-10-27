import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ListIcon } from "@/components/icons/ListIcon";
import { BackLink } from "@/components/BackLink";
import { ShareButton } from "@/components/ShareButton";
import { NAV_BUTTON_CLASS } from "@/components/button-styles";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import { getNeighborIds } from "@/features/guide/components/PlayerControls";
import { PLAYER_COLUMN_CLASS } from "@/features/guide/lib/player-layout";

const buttonClass = cn(
  NAV_BUTTON_CLASS,
  "px-3.5 py-2 text-sm",
  "disabled:pointer-events-none disabled:opacity-35",
);

/**
 * tablet 이상: 영상 위 곡 이동 버튼 줄 — [곡 목록] … [공유] [뒤로가기] [이전 곡] [다음 곡].
 * 공유는 지금 곡 주소를 보낸다.
 * 곡 목록은 화면을 떠나지 않고 드로어(SongListDrawer)로 연다.
 * 모바일은 기존 영상 양옆 ◀▶ 버튼(PlayerControls)을 그대로 쓴다.
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
          "flex items-center justify-between gap-2",
        )}
      >
        <button
          type="button"
          onClick={onOpenList}
          aria-haspopup="dialog"
          className={buttonClass}
        >
          <ListIcon className="h-4 w-4" />곡 목록
        </button>

        <div className="flex items-center gap-2">
          <ShareButton
            className="h-10 w-10"
            tooltipClassName="top-full bottom-auto mt-2 mb-0"
          />
          {/* 브라우저 히스토리가 아니라 항상 곡 목록(/guide, /slam)으로 —
              곡 사이를 여러 번 오가거나 링크로 바로 들어와도 같은 곳으로 간다. */}
          <BackLink href={basePath} />
          <NeighborLink
            href={prevId && `${basePath}/${prevId}`}
            title={titleOf(prevId)}
            direction="prev"
          />
          <NeighborLink
            href={nextId && `${basePath}/${nextId}`}
            title={titleOf(nextId)}
            direction="next"
          />
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
      className={cn("h-4 w-4", direction === "next" && "rotate-180")}
    />
  );
  const content =
    direction === "prev" ? (
      <>
        {icon}
        {label}
      </>
    ) : (
      <>
        {label}
        {icon}
      </>
    );

  if (!href) {
    return (
      <button type="button" disabled className={buttonClass}>
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      title={title ? `${label}: ${title}` : label}
      className={buttonClass}
    >
      {content}
    </Link>
  );
}
