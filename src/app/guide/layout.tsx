import { PlayerProvider } from "@/context/player-context";
import { YouTubePlayer } from "@/components/guide/YouTubePlayer";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      <YouTubePlayer />
      {children}
    </PlayerProvider>
  );
}
