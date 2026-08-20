import { PlayerProvider } from "@/context/player-context";
import { YouTubePlayer } from "@/components/guide/YouTubePlayer";
import { GuideShell } from "@/components/guide/GuideShell";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <GuideShell player={<YouTubePlayer />}>{children}</GuideShell>
    </PlayerProvider>
  );
}
