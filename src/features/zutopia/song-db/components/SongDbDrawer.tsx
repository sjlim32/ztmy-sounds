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

// 정적 export라 서버 렌더 시점엔 document가 없어 createPortal은 클라이언트 하이드레이션이 끝난 뒤에만 호출해야함
// useSyncExternalStore로 서버/클라이언트 스냅샷이 다름을 알림 (마운트 됐는지 확인)
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

interface SongDbDrawerProps<T> {
  selected: T | null;
  onClose: () => void;
  renderContent: (item: T) => React.ReactNode;
  // 스크린 리더 다이얼로그 이름 — 곡/앨범 제목처럼 내용을 알 수 있는 값을
  // 호출부에서 넘겨준다. 생략하면 일반 문구로 대체된다.
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

  // 포커스 관리 — 열리면 패널로 포커스를 옮기고 Tab이 패널 밖으로 빠져나가지
  // 않도록 가둔다. 닫히면 원래 포커스가 있던 요소로 되돌린다 — 트리거마다
  // 별도로 ref를 넘겨받는 대신 이 effect가 실행되는 시점의
  // document.activeElement를 그대로 기억한다: 키보드로 Enter/Space를 눌러 연
  // 경우 그 요소가 항상 활성 요소라 정확하고, 마우스 클릭도 대부분의
  // 브라우저(사파리 macOS 기본 설정은 예외)는 클릭 시 버튼에 포커스를
  // 주므로 마찬가지로 맞는다. 여는 쪽(dialogRef.current?.focus())은
  // useLayoutEffect라 페인트 전에 동기적으로 끝난다 — 열리자마자 포커스가
  // 옮겨간 상태로 첫 프레임이 그려진다. 닫힐 때 포커스를 되돌리는 쪽은
  // cleanup 안에서 한 프레임 미룬다(아래 requestAnimationFrame 주석 참고).
  //
  // #app-root에 inert를 걸어 배경 전체를 비활성화하는 방법은 시도했다가
  // 되돌렸다 — 이 드로어는 열려 있는 채로 다른 곡/앨범 카드(data-song-db-item)
  // 를 눌러 선택을 바꿀 수 있도록 의도적으로 설계돼 있는데(아래 pointerdown
  // effect 주석 참고), inert는 그 서브트리 전체를 히트테스트에서 완전히
  // 제외해버려서 카드 클릭이 카드 자신에 도달하지 못하고 document로 그대로
  // 새버린다 — 그 결과 "바깥 클릭 시 닫힘" 핸들러가 이걸 진짜 바깥 클릭으로
  // 오인해 선택을 바꾸는 대신 드로어를 닫아버리는 회귀가 실제로 재현됐다.
  // 배경 전체 격리(스크린 리더 가상 커서 차단)보다 이 카드 전환 기능이
  // 우선이라 inert는 포기하고 Tab 트랩만 남긴다.
  //
  // MV 유튜브 iframe이 있는 경우, 포커스가 그 안(별도 브라우징 컨텍스트)으로
  // 들어가면 이 window keydown 핸들러는 더 이상 Tab을 볼 수 없다 — iframe
  // 내부 포커스 이동은 부모 document로 이벤트가 전파되지 않기 때문이다.
  // iframe 내부 탐색이 끝나 포커스가 그 다음으로 자연스럽게 넘어갈 때는
  // 여전히 parent document에서 focus 이벤트가 발생하므로, 다이얼로그 맨
  // 끝에 보이지 않는 sentinel(포커스를 받으면 바로 첫 요소로 돌려보냄)을
  // 하나 두어 "iframe을 빠져나가면 맨 앞으로 순환"만이라도 보장한다(실측:
  // sentinel 없이는 Tab이 실제로 다이얼로그 밖 배경 콘텐츠까지 새어나갔다).
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
      // 커밋이 끝나면 React-DOM이 자체적으로 "이 커밋 시작 시점에 포커스돼
      // 있던 요소"(=아직 다이얼로그였던 시점의 스냅샷)로 포커스를 되돌리려는
      // 내부 로직(restoreSelection)을 한 번 더 돌린다 — 그게 바로 지금
      // 이 줄이 실행된 *직후*라, 여기서 곧장 focus()를 호출해도 React가
      // 곧이어 다시 다이얼로그로 뺏어간다(실측: 두 focus() 호출이 같은
      // 커밋 안에서 1ms도 안 되는 간격으로 충돌). 다음 프레임으로 미뤄
      // React의 커밋이 완전히 끝난 뒤에 마지막으로 포커스를 주면 이 경합을
      // 피할 수 있다.
      requestAnimationFrame(() => previouslyFocused?.focus());
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          "pointer-events-auto absolute top-0 right-0 flex h-full w-full flex-col overflow-y-auto bg-black/50",
          "tablet:max-w-md",
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
