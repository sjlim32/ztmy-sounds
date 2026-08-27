import Image from "next/image";
import type { CallTag } from "@/features/guide/lib/types";

const ICON_LABEL: Record<CallTag, string> = {
  swing: "샤모지 흔들기",
  clap: "샤모지 박수",
  call: "떼창",
};

const ICON_SRC: Record<CallTag, string> = {
  swing: "/song/swing-notext.webp",
  clap: "/song/clap-notext.webp",
  call: "/song/call.svg",
};

export function CallIcon({ name }: { name: CallTag }) {
  return (
    <Image
      src={ICON_SRC[name]}
      alt={ICON_LABEL[name]}
      title={ICON_LABEL[name]}
      data-call-icon={name}
      width={24}
      height={24}
      className="mr-1 inline-block align-middle"
    />
  );
}
