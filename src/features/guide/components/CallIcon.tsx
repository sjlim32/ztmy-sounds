import Image from "next/image";
import type { CallTag } from "@/features/guide/lib/types";

const ICON_LABEL: Record<CallTag, string> = {
  swing: "샤모지 흔들기",
  clap: "샤모지 박수",
  call: "떼창",
};

const ICON_SRC: Record<CallTag, string> = {
  swing: "/assets/song/swing-notext.webp",
  clap: "/assets/song/clap-notext.webp",
  call: "/assets/song/call.svg",
};

export function CallIcon({
  name,
  size = 24,
}: {
  name: CallTag;
  size?: number;
}) {
  return (
    <Image
      src={ICON_SRC[name]}
      alt={ICON_LABEL[name]}
      title={ICON_LABEL[name]}
      data-call-icon={name}
      width={size}
      height={size}
      className="mr-1 inline-block align-middle"
    />
  );
}
