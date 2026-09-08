import type { Img, SectionDef } from "@/features/info/lib/types";

// sections를 전역 상수가 아니라 인자로 받습니다 — 이벤트마다 섹션 구성이
// 달라질 수 있어서(InfoEvent.sections), 이 함수는 어떤 이벤트의 섹션인지
// 몰라도 되도록 순수하게 둡니다.
export function groupImagesBySection(
  images: Img[] = [],
  sections: SectionDef[],
): Record<string, Img[]> {
  const grouped: Record<string, Img[]> = {};
  for (const section of sections) {
    grouped[section.id] = [];
  }

  for (const img of images) {
    (grouped[img.section] ??= []).push(img);
  }

  return grouped;
}
