import type { Json } from "@/lib/supabase/database.types";

/**
 * 세트리스트 메모(setlists.note, jsonb)의 글자 값 하나 — 공연 상세(lives/data.ts)와
 * 라이브 기록·통계(live-history)가 같이 쓴다. 객체가 아니거나, 그 키가 없거나,
 * 빈 글자면 null.
 * - variation: 곡 버전("short", "acoustic", "열대 jazz" …)
 * - info: 덧붙임("Live debut", 커버곡은 "cover")
 * - title·title_kr·original_artist: 곡이 연결되지 않은 커버곡의 제목·한글 제목·원곡 가수
 */
export function parseSetlistNote(
  note: Json | null | undefined,
  key:
    "arrange" | "info" | "variation" | "title" | "title_kr" | "original_artist",
): string | null {
  if (!note || typeof note !== "object" || Array.isArray(note)) return null;
  const value = (note as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}
