import type { Notice } from "@/features/notice/lib/types";
import festivalContent from "@/features/notice/content/festival.mdx";

const notice: Notice = {
  id: "festival",
  title: "사운드 플래닛 관련 안내사항",
  version: 1,
  content: festivalContent,
  isAlwaysOpen: true,
};

export default notice;
