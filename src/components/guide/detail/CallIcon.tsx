import Image from "next/image";
import type { CallTag } from "@/lib/guide/types";

const ICON_LABEL: Record<CallTag, string> = {
  swing: "샤모지 흔들기",
  clap: "샤모지 박수",
  call: "떼창",
};

const ICON_SRC: Record<CallTag, string> = {
  swing: "/swing.webp",
  clap: "/clap.webp",
  call: "/call.svg",
};

export function CallIcon({ name }: { name: CallTag }) {
  return (
    <Image
      src={ICON_SRC[name]}
      alt={ICON_LABEL[name]}
      title={ICON_LABEL[name]}
      data-call-icon={name}
      width={20}
      height={20}
      className="mr-1 inline-block align-middle"
    />
  );
}
