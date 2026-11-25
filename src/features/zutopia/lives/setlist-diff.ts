import type { LiveSetlistEntry } from "@/features/zutopia/lives/types";

type DiffEntry = Pick<LiveSetlistEntry, "songId" | "trackNumber" | "isEncore">;

/** 세트리스트 곡 제목 아래 도장 하나 — 고른 판에 있는 곡에만 붙는다. */
export interface SetlistChangeNote {
  label: "추가" | "제거" | "순서 변경";
  /** 도장 옆 상세 — 추가·제거는 "후반기부터", 순서 변경은 "전반기 5번 → 후반기 8번". */
  detail: string;
  songId: string;
  isEncore: boolean;
}

const inOrder = <T extends DiffEntry>(entries: readonly T[]) =>
  [...entries].sort(
    (a, b) =>
      Number(a.isEncore) - Number(b.isEncore) || a.trackNumber - b.trackNumber,
  );

/** 양쪽 순서가 유지된 곡(최장 공통 부분열)의 위치 쌍 — 번호만 밀린 곡은 여기 든다. */
function keptPairs(a: DiffEntry[], b: DiffEntry[]): [number, number][] {
  const lengths = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lengths[i][j] =
        a[i].songId === b[j].songId
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const pairs: [number, number][] = [];
  let [i, j] = [0, 0];
  while (i < a.length && j < b.length) {
    if (a[i].songId === b[j].songId) pairs.push([i++, j++]);
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/** "전반기 13번 → 후반기 17번" — 앞 판 번호 → 뒤 판 번호(본편·앙코르 구분 없이 번호만). */
function moveText(
  from: DiffEntry,
  to: DiffEntry,
  earlierName: string,
  laterName: string,
) {
  return `${earlierName} ${from.trackNumber}번 → ${laterName} ${to.trackNumber}번`;
}

/**
 * 판 사이에 공통 세트리스트가 어떻게 바뀌었나 — 고른 판에 있는 곡에만, 추가·제거·순서
 * 변경 셋으로. 변화는 늘 앞 판 → 뒤 판이라 상세도 두 탭에서 같은 말로 적는다(추가·제거는
 * "후반기부터", 순서 변경은 "전반기 13번 → 후반기 17번").
 * - 기본: other는 바로 앞 판(earlierName). 새로 들어온 곡은 "추가", 옮긴 곡은 "순서 변경".
 * - compareWithNext(첫 판): other는 다음 판(laterName). 다음 판에 없는 곡은 "제거".
 * 고른 판에 줄이 없는 곡(앞 판에서 빠진 곡, 다음 판에 들어올 곡)은 표시하지 않고, 곡 하나가
 * 끼어들어 번호만 밀린 곡도 표시하지 않는다. 고정곡이 일부 공연의 선택곡이 되면 공통
 * 세트리스트에선 제거된 것으로 본다.
 */
export function diffSetlistVersions(
  entries: readonly DiffEntry[],
  other: readonly DiffEntry[],
  {
    earlierName,
    laterName,
    compareWithNext = false,
  }: { earlierName: string; laterName: string; compareWithNext?: boolean },
): SetlistChangeNote[] {
  const here = inOrder(entries);
  const there = inOrder(other);
  const thereById = new Map(there.map((entry) => [entry.songId, entry]));
  const kept = new Set(keptPairs(here, there).map(([index]) => index));
  return here.flatMap((entry, index) => {
    if (kept.has(index)) return [];
    const counterpart = thereById.get(entry.songId);
    const note: SetlistChangeNote = {
      label: counterpart ? "순서 변경" : compareWithNext ? "제거" : "추가",
      detail: counterpart
        ? compareWithNext
          ? moveText(entry, counterpart, earlierName, laterName)
          : moveText(counterpart, entry, earlierName, laterName)
        : `${laterName}부터`,
      songId: entry.songId,
      isEncore: entry.isEncore,
    };
    return [note];
  });
}
