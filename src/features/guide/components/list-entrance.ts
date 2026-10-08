import { cva } from "class-variance-authority";

// 지금 열려/선택되어 있는 항목을 표시하는 좌측 액센트 바. 선택 시 항상,
// 그 외에는 hover 시에만 나타남 (사이트 그라데이션 시그니처). SongList의
// 곡 항목과 NoticeAccordionItem(모바일)이 함께 씁니다.
export const accentBarStyles = cva(
  "from-ztmy-pink to-ztmy-purple absolute inset-y-1 left-0 w-1 origin-top scale-y-0 rounded-full bg-linear-to-b transition-transform duration-300",
  {
    variants: {
      selected: {
        true: "scale-y-100",
        false: "group-hover:scale-y-100",
      },
    },
  },
);
