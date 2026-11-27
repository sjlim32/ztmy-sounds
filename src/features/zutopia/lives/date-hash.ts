import type { TourDateEntry } from "@/features/zutopia/lives/types";

/**
 * 투어 상세에서 고른 공연일 ↔ 주소 해시(`#2023-04-21`) — 그날 세트리스트 링크를 공유하고
 * 뒤로 가기로 돌아올 수 있게(TourOverview). 해시 값은 사람이 읽을 수 있는 공연 날짜,
 * 같은 날짜의 공연일(하루 여러 회차·같은 날 두 도시)은 목록 순서로 둘째부터 `-2`, `-3`.
 * 취소된 공연일은 고를 수 없어 해시도 없고 번호도 세지 않는다.
 */
type HashableDate = Pick<TourDateEntry, "id" | "startDate" | "canceled">;

/** 공연일 id → 해시 값(`#` 없이). */
export function dateHashes(
  dates: readonly HashableDate[],
): Map<string, string> {
  const hashes = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const date of dates) {
    if (date.canceled) continue;
    const day = date.startDate.slice(0, 10);
    const count = (seen.get(day) ?? 0) + 1;
    seen.set(day, count);
    hashes.set(date.id, count === 1 ? day : `${day}-${count}`);
  }
  return hashes;
}

/** location.hash(앞 `#`은 있어도 없어도) → 공연일 id, 모르는 해시면 null. */
export function dateIdFromHash(
  dates: readonly HashableDate[],
  hash: string,
): string | null {
  const value = decodeURIComponent(hash.replace(/^#/, ""));
  if (!value) return null;
  for (const [id, item] of dateHashes(dates)) if (item === value) return id;
  return null;
}

/**
 * 고른 날짜를 바꿀 때 주소 기록을 어떻게 할지. depth = 지금 기록이 날짜를 연달아 골라 우리가
 * 쌓은 몇 번째 기록인지(0 = 우리가 쌓지 않음 — 처음 들어온·공유 링크 기록).
 * - 같은 해시면 그대로.
 * - 날짜를 고르면 새 기록(depth + 1) — 뒤로 가기 = 이전 선택.
 * - 우리가 쌓은 기록에서 닫으면(next = "") 새 기록 없이 고르기 전 기록까지 한 번에 뒤로
 *   (4/20 → 4/21을 고른 뒤 닫으면 4/20이 아니라 공통으로, 닫고 뒤로 가기를 눌러도 시트가
 *   다시 열리지 않게). depth 0에서 닫으면 뒤로 가면 페이지를 떠나므로 새 기록(depth 0).
 */
export type HistoryStep =
  | { kind: "none" }
  | { kind: "go"; delta: number }
  | { kind: "push"; depth: number };

export function historyStep(
  current: { hash: string; depth: number },
  next: string,
): HistoryStep {
  if (next === current.hash) return { kind: "none" };
  if (next === "")
    return current.depth > 0
      ? { kind: "go", delta: -current.depth }
      : { kind: "push", depth: 0 };
  return { kind: "push", depth: current.depth + 1 };
}
