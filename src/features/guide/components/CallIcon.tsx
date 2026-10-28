import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CallTag } from "@/features/guide/lib/types";
import { CALL_TAG_LABEL } from "@/features/guide/lib/call-tag-style";

// 스윙/클랩/노래/댄스는 샤모지 아이콘 세트(그림만 있는 256px 정사각형 버전).
// 같은 이름의 *-label.webp는 한자·영문이 들어간 큰 자리용 버전.
const ICON_SRC: Record<CallTag, string> = {
  swing: "/assets/guide/shamoji/swing.webp",
  clap: "/assets/guide/shamoji/clap.webp",
  call: "/assets/guide/shamoji/sing.webp",
  dance: "/assets/guide/shamoji/dance.webp",
  slam: "/assets/guide/slam.svg",
};

// 한자·영문 라벨이 들어간 큰 자리용(응원 표시 안내). 없는 종류는 기본 아이콘.
const LABEL_ICON_SRC: Partial<Record<CallTag, string>> = {
  swing: "/assets/guide/shamoji/swing-label.webp",
  clap: "/assets/guide/shamoji/clap-label.webp",
  call: "/assets/guide/shamoji/sing-label.webp",
  dance: "/assets/guide/shamoji/dance-label.webp",
};

export function CallIcon({
  name,
  size = 22,
  withLabel = false,
  className,
}: {
  name: CallTag;
  size?: number;
  /** true면 한자·영문 라벨이 들어간 버전(큰 자리용) */
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={(withLabel && LABEL_ICON_SRC[name]) || ICON_SRC[name]}
      alt={CALL_TAG_LABEL[name]}
      title={CALL_TAG_LABEL[name]}
      data-call-icon={name}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      className={cn("mr-1 inline-block align-middle", className)}
    />
  );
}
