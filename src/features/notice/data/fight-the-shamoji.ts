import type { Notice } from "@/features/notice/lib/types";
import FightTheShamojiContent from "@/features/notice/content/fight-the-shamoji.mdx";

const notice: Notice = {
  id: "fight-the-shamoji",
  type: "guide",
  title: "응원법 구분 방법",
  version: 1,
  content: FightTheShamojiContent,
  visible: true,
  isAlwaysOpen: false,
};

export default notice;
