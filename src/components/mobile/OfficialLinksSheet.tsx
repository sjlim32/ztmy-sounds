"use client";

import { useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { OFFICIAL_ICON_LINKS } from "@/data/social-links";
import {
  GHOST_ICON_BUTTON_CLASS,
  LIST_ITEM_CLASS,
} from "@/components/button-styles";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { ExternalLinkIcon } from "@/components/icons/ExternalLinkIcon";

/**
 * 모바일 홈 상단 바의 "공식 링크" 버튼이 여는 시트. 아이콘만으로는 메인·
 * 스태프·mart 계정이 구분되지 않아서(모바일엔 hover title도 없다) 이름을
 * 함께 보여준다.
 *
 * MobileHeader의 <header> 밖에 렌더링해야 한다 — header의 backdrop-filter가
 * fixed 자식의 기준 상자가 되어, 안에 두면 시트가 헤더 높이 안에 갇힌다.
 */
export function OfficialLinksSheet({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="tablet:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <div
        id={id}
        role="dialog"
        aria-label="아티스트 공식 링크"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t border-white/15 pb-6 backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <h2 className="font-bold">
            공식 링크
            <span className="ml-2 font-mono text-xs font-normal tracking-[0.3em] text-white/60">
              OFFICIAL
            </span>
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className={cn(GHOST_ICON_BUTTON_CLASS, "h-8 w-8")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex flex-col px-2 pt-2">
          {OFFICIAL_ICON_LINKS.map(({ name, url, icon }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  LIST_ITEM_CLASS,
                  "flex items-center gap-3 px-2 py-2 text-sm text-white",
                )}
              >
                <Image
                  src={icon.src}
                  alt=""
                  width={Math.round(icon.width / 2)}
                  height={Math.round(icon.height / 2)}
                />
                <span className="flex-1">{name}</span>
                <ExternalLinkIcon className="h-3.5 w-3.5 text-white/50" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
