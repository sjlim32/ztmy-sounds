import { PlayerProvider } from "@/features/guide/player-context";
import { GuidePlayerArea } from "@/features/guide/components/GuidePlayerArea";
import { GuideListScroll } from "@/features/guide/components/GuideListScroll";
import { SongPanel } from "@/features/guide/components/SongPanel";
import { NoticePanel } from "@/features/notice/components/NoticePanel";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <GuideListScroll>
        <GuidePlayerArea />
        <SongPanel />
        <NoticePanel />
      </GuideListScroll>
      {children}
    </PlayerProvider>
  );
}
