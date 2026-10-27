import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CallTag } from "@/features/guide/lib/types";
import { CALL_TAG_LABEL } from "@/features/guide/lib/call-tag-style";

const ICON_SRC: Record<CallTag, string> = {
  swing: "/assets/song/swing-notext.webp",
  clap: "/assets/song/clap-notext.webp",
  call: "/assets/song/call.svg",
  slam: "/assets/song/slam.svg",
};

export function CallIcon({
  name,
  size = 22,
  className,
}: {
  name: CallTag;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={ICON_SRC[name]}
      alt={CALL_TAG_LABEL[name]}
      title={CALL_TAG_LABEL[name]}
      data-call-icon={name}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "cover" }}
      className={cn("mr-1 inline-block align-middle", className)}
    />
  );
}
