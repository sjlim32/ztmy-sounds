"use client";

import { CallIcon } from "@/features/guide/components/CallIcon";
import { useGuideMode } from "@/features/guide/guide-mode-context";
import {
  CALL_TAG_DESCRIPTION,
  CALL_TAG_LABEL,
  withAlpha,
} from "@/features/guide/lib/call-tag-style";

/**
 * tablet 이상: 영상 아래 "응원 표시 안내". 가사에 나오는 아이콘·배지가 무슨
 * 뜻인지 처음 온 사람도 바로 알 수 있게, 이 모드에서 보이는 응원 종류
 * (visibleTags — 응원 가이드는 스윙/클랩/콜, 슬램 가이드는 슬램)만 보여준다.
 */
export function CallLegend() {
  const { visibleTags } = useGuideMode();

  return (
    <section
      aria-label="응원 표시 안내"
      className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm"
    >
      <h3 className="mb-2 text-sm font-bold tracking-wide text-white/70">
        응원 표시 안내
      </h3>
      <ul className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <li
            key={tag}
            className="inline-flex items-center gap-2 rounded-xl border py-1 pr-3.5 pl-1.5 text-sm"
            style={{
              backgroundColor: withAlpha(tag, "1f"),
              borderColor: withAlpha(tag, "66"),
            }}
          >
            {/* 처음 온 사람도 뜻을 바로 알도록 한자·영문 라벨이 있는 큰 아이콘 */}
            <CallIcon name={tag} size={48} withLabel className="mr-0" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-white">
                {CALL_TAG_LABEL[tag]}
              </span>
              <span className="text-sm text-white/70">
                {CALL_TAG_DESCRIPTION[tag]}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
