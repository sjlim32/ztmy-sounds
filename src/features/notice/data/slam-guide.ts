import type { Notice } from "@/features/notice/lib/types";
import slamGuide from "@/features/notice/content/slam-guide.mdx";

const notice: Notice = {
  id: "slam-guide",
  type: "guide",
  title: "ZUTOMAYO 슬램 가이드",
  version: 1,
  content: slamGuide,
  visible: true,
  isAlwaysOpen: false,
};

export default notice;
