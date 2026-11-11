"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { usePresence } from "@/lib/use-presence";
import {
  GHOST_BUTTON_CLASS,
  SOFT_PRIMARY_BUTTON_CLASS,
} from "@/components/button-styles";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";

/**
 * 즛토피아에 들어오면 띄우는 안내 — 세트리스트 데이터를 채우는 중이라
 * 통계·참전 기록이 덜 채워져 보일 수 있다는 것. "확인"(바깥·Esc로 닫기 포함)은
 * 24시간, "다시 보지 않기"는 이 브라우저에서 계속 숨긴다 — 둘 다 localStorage에
 * { version, until }로 남긴다(until이 없으면 계속). 안내 내용이 바뀌면
 * NOTICE_VERSION을 올려 숨겨 둔 사람에게도 다시 보이게 한다.
 *
 * 정적 HTML엔 그리지 않고, 저장값을 읽은 뒤(effect)에만 연다 — 저장소를 못 쓰는
 * 환경(사생활 보호 창 등)이면 그냥 매번 보인다.
 */
const NOTICE_VERSION = "setlist-2026-11";
const STORAGE_KEY = "ztmy-sounds:zutopia-notice";
/** "확인"으로 숨기는 시간 */
const SNOOZE_MS = 24 * 60 * 60 * 1000;
const PANEL_TRANSITION_MS = 200;

type Dismissal = "snooze" | "forever";

function readDismissed(): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as {
      version?: string;
      until?: number;
    } | null;
    if (saved?.version !== NOTICE_VERSION) return false;
    return saved.until === undefined || Date.now() < saved.until;
  } catch {
    // 저장값이 깨졌거나(예전 형식 포함) 저장소를 못 쓰면 보여 준다.
    return false;
  }
}

function writeDismissed(dismissal: Dismissal) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        dismissal === "forever"
          ? { version: NOTICE_VERSION }
          : { version: NOTICE_VERSION, until: Date.now() + SNOOZE_MS },
      ),
    );
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 닫는다.
  }
}

export function ZutopiaNotice() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장값은 정적 HTML과 첫 렌더를 맞춘 뒤에만 읽을 수 있다.
    if (!readDismissed()) setOpen(true);
  }, []);

  const close = (dismissal: Dismissal) => {
    writeDismissed(dismissal);
    setOpen(false);
  };

  useDialogFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: confirmRef,
    onClose: () => close("snooze"),
  });
  const present = usePresence(open, PANEL_TRANSITION_MS);
  if (!present) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
        "transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0",
        !open && "pointer-events-none opacity-0",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) close("snooze");
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          ZUTOPIA_SURFACE_CLASS,
          "bg-background/95 tablet:max-w-xl tablet:p-8 w-full max-w-lg p-6",
          "transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0",
          !open && "translate-y-2 opacity-0",
        )}
      >
        <h2
          id={titleId}
          className="tablet:text-2xl text-xl font-bold text-white"
        >
          세트리스트를 채우는 중이에요
        </h2>
        {/* 문단을 나눠 한 문장씩 읽히게 — 무엇이 덜 됐는지 / 어디에 영향이 있는지 */}
        <div className="tablet:text-lg mt-4 flex flex-col gap-3 text-base leading-relaxed break-keep text-white/80">
          <p>
            공연 정보는 모두 등록했어요.
            <br />
            공연별{" "}
            <strong className="font-semibold text-white">세트리스트</strong>는
            아직 하나씩 채우고 있어요.
          </p>
          <p>
            <strong className="font-semibold text-white">통계</strong>와{" "}
            <strong className="font-semibold text-white">참전 기록</strong>은
            세트리스트가 있는 공연만 반영돼요.
            <br />
            실제와 다르게 보일 수 있으니 참고해 주세요.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => close("forever")}
            className={GHOST_BUTTON_CLASS}
          >
            다시 보지 않기
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => close("snooze")}
            className={cn(SOFT_PRIMARY_BUTTON_CLASS, "h-9 px-4")}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
