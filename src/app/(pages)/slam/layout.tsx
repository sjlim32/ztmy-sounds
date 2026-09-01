import { PlayerProvider } from "@/features/guide/player-context";
import { GuideModeProvider } from "@/features/guide/guide-mode-context";
import { GuidePlayerArea } from "@/features/guide/components/GuidePlayerArea";
import { GuideListScroll } from "@/features/guide/components/GuideListScroll";
import { SongPanel } from "@/features/guide/components/SongPanel";
import { NoticePanel } from "@/features/notice/components/NoticePanel";
import { cn } from "@/lib/utils";

/**
 * 응원 가이드(guide/layout.tsx)와 동일한 영상+가사 UI를 그대로 재사용하되,
 * GuideModeProvider의 mode만 "slam"으로 둬서 슬램 태그 곡만 노출합니다.
 * 자세한 배경은 guide/layout.tsx 주석 참고.
 */
export default function SlamLayout({ children }: LayoutProps<"/slam">) {
  return (
    <GuideModeProvider mode="slam">
      <PlayerProvider>
        <GuideListScroll>
          <div
            className={cn(
              "contents",
              "tablet:flex tablet:min-h-0 tablet:flex-1 tablet:flex-row tablet:items-center tablet:gap-6 tablet:pl-6 tablet:pr-6",
              "wide:pr-16",
            )}
          >
            <div
              className={cn(
                "contents",
                "tablet:flex tablet:min-h-0 tablet:min-w-0 tablet:flex-1 tablet:flex-col tablet:items-center tablet:justify-center tablet:self-stretch tablet:overflow-y-auto",
              )}
            >
              <GuidePlayerArea />
              <NoticePanel />
            </div>
            <SongPanel />
          </div>
        </GuideListScroll>
        {children}
      </PlayerProvider>
    </GuideModeProvider>
  );
}
