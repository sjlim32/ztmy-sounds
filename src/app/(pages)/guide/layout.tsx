import { PlayerProvider } from "@/context/player-context";
import { GuidePlayerArea } from "@/components/guide/detail/GuidePlayerArea";
import { SongPanel } from "@/components/guide/SongPanel";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <div className="tablet:contents flex min-h-0 flex-1 flex-col">
        <GuidePlayerArea />
        <SongPanel />
      </div>
      {children}
    </PlayerProvider>
  );
}
