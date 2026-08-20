import type { ReactNode } from "react";

/**
 * 콜가이드 섹션의 반응형 셸: 기본은 영상이 위, 가사가 아래로 쌓이고,
 * `lg`(PC) 브레이크포인트부터는 영상 좌측·가사 우측으로 나란히 배치됩니다.
 * 태블릿 전용 동작은 아직 조정 전이라, 디자인이 정해지기 전까지는
 * 모바일 기본값(세로 스택)으로 떨어집니다.
 */
export function GuideShell({
  player,
  children,
}: {
  player: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-role="guide-shell" className="flex flex-col lg:flex-row">
      <div data-role="guide-shell-player" className="lg:flex-1">
        {player}
      </div>
      <div data-role="guide-shell-content" className="lg:flex-1">
        {children}
      </div>
    </div>
  );
}
