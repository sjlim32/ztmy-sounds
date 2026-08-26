import type { Notice } from "@/lib/notice/types";
import FanPageDisclaimerContent from "@/content/notices/fan-page-disclaimer.mdx";

const notice: Notice = {
  id: "fan-page-disclaimer",
  title: "안내",
  version: 1,
  content: FanPageDisclaimerContent,
  isAlwaysOpen: true,
};

export default notice;
