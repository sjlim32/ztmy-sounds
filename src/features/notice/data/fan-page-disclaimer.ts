import type { Notice } from "@/features/notice/lib/types";
import FanPageDisclaimerContent from "@/features/notice/content/fan-page-disclaimer.mdx";

const notice: Notice = {
  id: "fan-page-disclaimer",
  type: "notice",
  title: "안내",
  version: 1,
  content: FanPageDisclaimerContent,
  visible: false,
  isAlwaysOpen: false,
};

export default notice;
