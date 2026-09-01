import type { Notice } from "@/features/notice/lib/types";
import festivalContent from "@/features/notice/content/festival.mdx";

const notice: Notice = {
  id: "festival",
  type: "notice",
  title: "사운드 플래닛 관련 안내사항",
  version: 1,
  content: festivalContent,
  visible: true,
  isAlwaysOpen: true,
  isSlamVisible: false,
};

export default notice;
