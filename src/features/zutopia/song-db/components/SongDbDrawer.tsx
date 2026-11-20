"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { getFocusableIn, useDialogFocus } from "@/lib/use-dialog-focus";
import { usePresence } from "@/lib/use-presence";
import { DrawerCloseButton } from "@/features/zutopia/song-db/components/DrawerCloseButton";

const noopSubscribe = () => () => {};

// 여닫는 움직임(duration-300)과 같은 길이.
const PANEL_TRANSITION_MS = 300;

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
  /** 항목을 구분하는 값(slug 등) — 바뀌면 내용이 새로 나타나는 애니메이션을 탄다. */
  contentKey: (item: T) => string;
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
  contentKey,
  ariaLabel = "상세 정보",
}: SongDbDrawerProps<T>) {
  const mounted = useMounted();
  const isOpen = selected !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  // 닫힌 뒤에도 슬라이드 아웃이 끝날 때까지 마지막 내용을 남겨 둔다(SidePanel과 같은 usePresence).
  // 패널 틀은 늘 그려 둔다 — 화면 밖(translate-x-full)에서 미끄러져 들어와야 해서.
  const present = usePresence(isOpen, PANEL_TRANSITION_MS);
  const [displayed, setDisplayed] = useState<T | null>(null);

  // selected가 바뀌면 렌더 중에 즉시 displayed를 맞춰 내용만 바로 스왑한다.
  if (selected !== null && selected !== displayed) {
    setDisplayed(selected);
  }
  const shown = present ? displayed : null;

  /**
   * 포커스 관리(useDialogFocus) — 열리면 패널로 포커스를 옮기고, 닫히면 원래
   * 포커스로 한 프레임 미뤄 되돌린다. trapOutside false — 열린 채 뒤의 다른 카드를
   * 눌러 포커스가 패널 밖에 있으면 Tab을 가로채지 않는다(예전처럼 패널 첫·끝
   * 요소에서만 감싼다).
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
  useDialogFocus({
    open: isOpen,
    containerRef: dialogRef,
    onClose,
    trapOutside: false,
  });

  // 열린 동안 뒤 페이지가 스크롤되지 않게 잠근다.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      // 닫힌 드로어는 화면 밖에 남아 있어 inert로 Tab·포커스도 막는다(닫힌 뒤 Tab이 숨은
      // 닫기 버튼으로 가지 않게). 닫혀 있을 땐 클릭도 받지 않아 히트테스트 문제는 없다.
      inert={!isOpen}
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
          // 화면이 넓어질수록 한 단계씩 넓힌다(512 → 576 → 672px). 순위표가 들어가는
          // SidePanel보다는 한 단계 좁다 — 세로 한 줄 구성이라 더 넓으면 여백만 는다.
          "tablet:max-w-lg pc:max-w-xl wide:max-w-2xl",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out",
          "focus:outline-none",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* 닫기 버튼은 내용 위에 겹쳐 오른쪽 위에 붙어 있는다(sticky + 높이 0이라
            내용을 밀어내지 않음) — 스크롤해도 늘 같은 자리. */}
        <div className="pointer-events-none sticky top-0 z-10 flex h-0 justify-end">
          <div className="pointer-events-auto mt-3 mr-3">
            <DrawerCloseButton onClick={onClose} />
          </div>
        </div>

        {/* 열린 채로 다른 항목을 고르면 내용이 툭 바뀌지 않고 살짝 올라오며
        바뀐다(key). 닫히는 동안엔 마지막 내용을 그대로 둔다. */}
        {shown && (
          <div
            key={contentKey(shown)}
            className="animate-content-in flex grow flex-col"
          >
            {renderContent(shown)}
          </div>
        )}
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
