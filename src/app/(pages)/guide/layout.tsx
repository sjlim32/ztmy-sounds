import { PlayerProvider } from "@/features/guide/player-context";
import { GuideModeProvider } from "@/features/guide/guide-mode-context";
import { GuidePlayerArea } from "@/features/guide/components/GuidePlayerArea";
import { GuideListScroll } from "@/features/guide/components/GuideListScroll";
import { SongPanel } from "@/features/guide/components/SongPanel";
import { NoticePanel } from "@/features/notice/components/NoticePanel";
import { cn } from "@/lib/utils";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <GuideModeProvider mode="cheer">
      <PlayerProvider>
        <GuideListScroll>
          {/* tablet 이상: 메인 영역(영상 또는 안내문) + SongPanel 사이드바를
              실제 flex row로 배치 — SongPanel이 실제로 차지하는 폭/오프셋을
              브라우저가 계산하므로, 예전처럼 그 폭을 pr-108 같은 매직 패딩값으로
              양쪽(GuidePlayerArea/NoticePanel)에 따로 맞춰 넣을 필요가 없음. */}
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
