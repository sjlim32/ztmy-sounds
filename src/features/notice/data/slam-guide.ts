import type { Notice } from "@/features/notice/lib/types";
import slamContent from "@/features/notice/content/slam-guide.mdx";

const notice: Notice = {
  id: "slam-guide",
  type: "guide",
  title: "ZUTOMAYO 슬램 가이드",
  version: 1,
  content: slamContent,
  visible: true,
  isAlwaysOpen: false,
  isSlamVisible: true,
};

export default notice;
