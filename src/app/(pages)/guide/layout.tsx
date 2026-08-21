import { PlayerProvider } from "@/context/player-context";
import { GuidePlayerArea } from "@/components/guide/detail/GuidePlayerArea";
import { SongPanel } from "@/components/guide/SongPanel";

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return (
    <PlayerProvider>
      {/* 모바일: 영상/패널을 진짜 flex-col로 쌓아 order로 배치. tablet 이상은
          contents로 박스를 없애 자식들의 기존 fixed 배치를 그대로 둠. */}
      <div className="tablet:contents flex min-h-0 flex-1 flex-col">
        <GuidePlayerArea />
        <SongPanel />
      </div>
      {children}
    </PlayerProvider>
  );
}
