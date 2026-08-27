import { PlayerProvider } from "@/features/guide/player-context";
import { GuidePlayerArea } from "@/features/guide/components/GuidePlayerArea";
import { SongPanel } from "@/features/guide/components/SongPanel";
import { NoticePanel } from "@/components/guide/notice/NoticePanel";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <div className="tablet:contents flex min-h-0 flex-1 flex-col">
        <GuidePlayerArea />
        <SongPanel />
        <NoticePanel />
      </div>
      {children}
    </PlayerProvider>
  );
}
