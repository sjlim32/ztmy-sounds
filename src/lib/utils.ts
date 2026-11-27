import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css @theme의 반지름 토큰(--radius-card/control/tag) — tailwind-merge가 기본
// 크기 이름(sm·lg 등)만 반지름으로 알아서, 등록해야 rounded-card와 rounded-none이 겹칠 때
// 뒤의 것만 남는다.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["card", "control", "tag"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
