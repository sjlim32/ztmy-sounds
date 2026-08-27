import type { Notice } from "@/features/guide/notice/lib/types";
import FanPageDisclaimerContent from "@/features/guide/notice/content/fan-page-disclaimer.mdx";

const notice: Notice = {
  id: "fan-page-disclaimer",
  title: "안내",
  version: 1,
  content: FanPageDisclaimerContent,
  isAlwaysOpen: true,
};

export default notice;
