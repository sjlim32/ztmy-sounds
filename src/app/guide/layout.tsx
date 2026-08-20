import { PlayerProvider } from "@/context/player-context";
import { GuidePlayerArea } from "@/components/guide/GuidePlayerArea";
import { SongPanel } from "@/components/guide/SongPanel";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <GuidePlayerArea />
      <SongPanel />
      {children}
    </PlayerProvider>
  );
}
