import { PlayerProvider } from "@/features/guide/player-context";
import { GuidePlayerArea } from "@/components/guide/detail/GuidePlayerArea";
import { SongPanel } from "@/components/guide/SongPanel";
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
