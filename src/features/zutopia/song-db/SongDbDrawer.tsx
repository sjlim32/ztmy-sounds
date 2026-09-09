"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface SongDbDrawerProps<T> {
  selected: T | null;
  onClose: () => void;
  renderContent: (item: T) => React.ReactNode;
}

const noopSubscribe = () => () => {};

// 정적 export라 서버 렌더 시점엔 document가 없다 — createPortal은 클라이언트
// 하이드레이션이 끝난 뒤에만 호출해야 한다. useEffect+setState로 하면
// react-hooks/set-state-in-effect 린트에 걸리는데, 이 패턴(서버/클라이언트
// 스냅샷이 다름을 알리는 것) 자체가 useSyncExternalStore가 설계된 용도라
// 그걸 그대로 쓴다 — 별도 state/effect 없이 "마운트됐는가"를 안전하게 얻는다.
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * 곡/앨범 상세 정보를 우측에서 슬라이드로 여는 공용 드로어 — 모바일에서도
 * 동일하게 우측에서 열린다(바텀시트 아님). selected가 바뀌면(다른 곡/앨범을
 * 골랐을 때) 드로어는 열린 채로 내용만 즉시 바뀌고, null이 되면(바깥 클릭/
 * Esc/닫기 버튼) 슬라이드 아웃 트랜지션이 끝날 때까지 마지막 내용을 그대로
 * 보여준 뒤 비운다 — 아니면 닫히는 도중 내용이 먼저 사라져 빈 패널만 미끄러져
 * 나가는 것처럼 보인다.
 *
 * document.body에 Portal로 렌더링한다 — ZutopiaScrollArea(/zutopia 레이아웃의
 * 스크롤 컨테이너)가 상하 페이드 효과를 위해 JS로 자기 자신에 mask-image를
 * 직접 걸어두는데, mask가 걸린 요소는 transform/filter와 마찬가지로 그
 * 자손의 position:fixed containing block이 되어버린다(CSS Masking 스펙).
 * 이 드로어가 그 안에 그냥 자식으로 있으면 뷰포트가 아니라 그 스크롤
 * 박스 기준으로 고정되어, 박스의 overflow-y-auto에 잘리거나 스크롤 위치에
 * 따라 엉뚱한 곳에 그려질 수 있다 — Portal로 완전히 그 부모 체인을 벗어나야
 * position:fixed가 항상 실제 뷰포트 기준으로 동작함을 보장할 수 있다.
 */
export function SongDbDrawer<T>({
  selected,
  onClose,
  renderContent,
}: SongDbDrawerProps<T>) {
  const [displayed, setDisplayed] = useState<T | null>(null);
  const mounted = useMounted();
  const isOpen = selected !== null;

  // selected가 바뀌면(다른 항목 선택) 렌더 중에 즉시 displayed를 맞춘다 —
  // 이렇게 하면 드로어가 열린 채로 내용만 바로 스왑된다. selected가
  // null이 되는(닫히는) 경우는 아래 effect가 슬라이드 아웃 애니메이션이
  // 끝난 뒤 비동기로 처리한다.
  if (selected !== null && selected !== displayed) {
    setDisplayed(selected);
  }

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setDisplayed(null), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // "바깥 클릭 시 닫힘"을 배경(backdrop) 엘리먼트의 onClick이 아니라 document
  // 레벨에서 직접 처리한다 — PC에서는 배경이 아예 없어서(아래 tablet:hidden)
  // 클릭을 가로챌 요소가 없고, 있더라도 배경이 전체 화면을 덮으면 다른 곡/
  // 앨범 카드를 눌러도 그 클릭이 배경에 막혀 카드 자신의 onClick(선택 전환)
  // 까지 도달하지 못한다. 클릭 대상이 드로어 자신([role="dialog"]) 이거나
  // 다른 선택 가능한 항목(data-song-db-item)이면 무시하고, 그 경우가 아닐
  // 때만 닫는다 — 항목 클릭은 항목 자신의 onClick이 선택을 그대로 바꾸도록
  // 내버려 둔다(여기서 setSelected(null)을 호출하면 같은 틱에 두 번 갱신되어
  // 방금 누른 새 항목이 다시 null로 덮어써지는 경합이 생긴다).
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[role="dialog"]')) return;
      if (target.closest("[data-song-db-item]")) return;
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-50",
        !isOpen && "pointer-events-none",
        "tablet:pointer-events-none",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "tablet:hidden absolute inset-0 bg-black/90 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "pointer-events-auto absolute top-0 right-0 flex h-full w-full flex-col overflow-y-auto bg-black/50",
          "tablet:max-w-md",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {displayed && renderContent(displayed)}
      </div>
    </div>,
    document.body,
  );
}
