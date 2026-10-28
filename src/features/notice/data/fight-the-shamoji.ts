import type { Notice } from "@/features/notice/lib/types";
import FightTheShamojiContent from "@/features/notice/content/fight-the-shamoji.mdx";

const notice: Notice = {
  id: "fight-the-shamoji",
  type: "guide",
  title: "응원 가이드 공지사항",
  version: 1,
  content: FightTheShamojiContent,
  visible: true,
  isAlwaysOpen: true,
  isSlamVisible: false,
};

export default notice;
