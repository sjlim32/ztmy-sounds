"use client";

import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

const FOCUSABLE_SELECTOR =
  'button, a[href], iframe, [tabindex]:not([tabindex="-1"])';

function getFocusableIn(container: HTMLElement | null): HTMLElement[] {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
  ).filter((el) => !el.hasAttribute("data-focus-sentinel"));
}

/**
 * 정적 export라 서버 렌더 시점엔 document가 없어 createPortal은
 * 하이드레이션 이후에만 호출해야 한다.
 * useSyncExternalStore로 마운트 여부를 알린다.
 */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * 곡/앨범 상세 정보를 우측에서 슬라이드로 여는 공용 드로어(모바일도 동일,
 * 바텀시트 아님).
 * selected가 바뀌면 드로어는 연 채로 내용만 바로 바뀌고, null이 되면
 * 슬라이드 아웃이 끝날 때까지 마지막 내용을 유지한 뒤 비운다 — 안 그러면
 * 닫히는 도중 빈 패널만 미끄러져 나가는 것처럼 보인다.
 *
 * document.body에 Portal로 렌더링한다 — ZutopiaScrollArea가 스크롤 페이드용
 * mask-image를 자신에 걸어두는데, mask가 걸린 요소는 transform/filter처럼
 * 자손의 position:fixed containing block이 되어버린다(CSS Masking 스펙).
 * 그 안에 그냥 자식으로 두면 뷰포트가 아니라 그 스크롤 박스 기준으로
 * 고정돼 잘리거나 엉뚱한 위치에 그려질 수 있어, Portal로 부모 체인을
 * 완전히 벗어난다.
 */

interface SongDbDrawerProps<T> {
  selected: T | null;
  onClose: () => void;
  renderContent: (item: T) => React.ReactNode;
  /**
   * 스크린 리더 다이얼로그 이름 — 곡/앨범 제목처럼 내용을 알 수 있는 값을
   * 호출부에서 넘겨준다.
   * 생략하면 일반 문구로 대체된다.
   */
  ariaLabel?: string;
}

export function SongDbDrawer<T>({
  selected,
  onClose,
  renderContent,
  ariaLabel = "상세 정보",
}: SongDbDrawerProps<T>) {
  const [displayed, setDisplayed] = useState<T | null>(null);
  const mounted = useMounted();
  const isOpen = selected !== null;
  const dialogRef = useRef<HTMLDivElement>(null);

  // selected가 바뀌면 렌더 중에 즉시 displayed를 맞춰 내용만 바로 스왑한다.
  // null이 되는(닫히는) 경우는 아래 effect가 슬라이드 아웃 후 비동기로
  // 처리한다.
  if (selected !== null && selected !== displayed) {
    setDisplayed(selected);
  }

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setDisplayed(null), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  /**
   * 포커스 관리 — 열리면 패널로 포커스를 옮기고 Tab을 패널 안에 가둔다,
   * 닫히면 원래 포커스로 되돌린다.
   *
   * 트리거 ref 대신 effect 실행 시점의 document.activeElement를 스냅샷으로
   * 쓴다(키보드/클릭 모두 정확). 여는 쪽은 useLayoutEffect라 페인트 전에
   * 포커스가 이미 옮겨간 채로 그려진다. 닫을 때 포커스를 되돌리는 쪽은
   * cleanup에서 rAF로 한 프레임 미룬다 — 커밋 직후 React-DOM이 자체
   * restoreSelection을 한 번 더 돌리는 타이밍과 겹쳐 곧바로 focus()하면
   * 그게 다시 뺏어간다(실측).
   *
   * #app-root에 inert를 걸어 배경을 통째로 비활성화하는 방법은 되돌렸다 —
   * 드로어가 열린 채로 다른 카드(data-song-db-item)를 눌러 선택을 바꿀 수
   * 있어야 하는데, inert는 히트테스트 자체를 막아 그 클릭이 document로
   * 새고 "바깥 클릭 시 닫힘" 핸들러가 오인해 드로어를 닫아버린다(실측).
   *
   * MV 유튜브 iframe에 포커스가 들어가면 그 안의 Tab 이동은 부모
   * document로 전파되지 않는다 — 다이얼로그 끝에 숨은 sentinel을 두어
   * iframe을 빠져나오면 맨 앞으로 순환하는 것만은 보장한다.
   */
  useLayoutEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusableIn(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [isOpen, onClose]);

  /**
   * "바깥 클릭 시 닫힘"을 배경 onClick이 아니라 document 레벨에서 처리한다.
   *
   * PC는 배경이 아예 없고(tablet:hidden), 있어도 전체 화면을 덮으면 다른
   * 카드 클릭이 배경에 막혀 카드 자신의 onClick(선택 전환)까지 못 간다.
   * 드로어 자신([role="dialog"])이나 다른 선택 가능한 항목
   * (data-song-db-item) 클릭은 무시한다 — 항목 클릭은 항목 자신의
   * onClick이 선택을 그대로 바꾸게 두고, 여기서 또 onClose를 부르면 같은
   * 틱에 두 번 갱신돼 방금 누른 새 항목이 도로 덮어써지는 경합이 생긴다.
   */
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
          "absolute inset-0 bg-black/90 transition-opacity duration-300",
          "tablet:hidden",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          "pointer-events-auto absolute top-0 right-0 flex h-full w-full flex-col overflow-y-auto bg-black/50 backdrop-blur-md",
          "tablet:max-w-md pc:max-w-xl",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out",
          "focus:outline-none",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {displayed && renderContent(displayed)}
        {isOpen && (
          <span
            data-focus-sentinel=""
            tabIndex={0}
            className="sr-only"
            onFocus={() => getFocusableIn(dialogRef.current)[0]?.focus()}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
