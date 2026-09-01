import type { Notice } from "@/features/notice/lib/types";
import SlamContent from "@/features/notice/content/slam.mdx";

const notice: Notice = {
  id: "slam",
  type: "guide",
  title: "슬램 가이드",
  version: 1,
  content: SlamContent,
  visible: true,
  isAlwaysOpen: false,
  isSlamVisible: true,
};

export default notice;
