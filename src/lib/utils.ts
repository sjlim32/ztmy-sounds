import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css @theme의 반지름·그림자 토큰(--radius-*, --shadow-*, --drop-shadow-*) —
// tailwind-merge는 기본 크기 이름(sm·lg 등)만 알아서, 등록해야 rounded-card와 rounded-none,
// shadow-card와 shadow-none이 겹칠 때 뒤의 것만 남는다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["card", "control", "tag"],
      shadow: ["card", "float", "thumb"],
      "drop-shadow": ["legible", "legible-sm"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
