import type { LiveSetlistEntry } from "@/features/zutopia/lives/types";

type DiffEntry = Pick<LiveSetlistEntry, "songId" | "trackNumber" | "isEncore">;

/** 세트리스트 줄 위에 붙이는 변경 메모 하나 — 고른 판에 있는 곡에만 붙는다. */
export interface SetlistChangeNote {
  label: "추가됨" | "빠짐" | "순서 변경";
  /** 첫 판에서 다음 판의 변화를 알릴 때의 시기("후반기에"). 앞 판과 비교하면 null. */
  timing: string | null;
  /** 순서 변경의 "5번 → 8번". 그 밖엔 없다. */
  detail: string | null;
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

/** "5번 → 8번", 본편·앙코르를 넘나들면 "본편 13번 → 앙코르 17번". */
function moveText(from: DiffEntry, to: DiffEntry) {
  const place = (entry: DiffEntry) =>
    from.isEncore === to.isEncore
      ? `${entry.trackNumber}번`
      : `${entry.isEncore ? "앙코르" : "본편"} ${entry.trackNumber}번`;
  return `${place(from)} → ${place(to)}`;
}

/**
 * 판 사이에 공통 세트리스트가 어떻게 바뀌었나 — 고른 판에 있는 곡에만, 추가됨·빠짐·순서
 * 변경 셋으로. 변화의 방향은 늘 앞 판 → 뒤 판이다.
 * - nextName 없음: other는 바로 앞 판. 새로 들어온 곡은 "추가됨", 옮긴 곡은 "순서 변경".
 * - nextName 있음(첫 판): other는 다음 판. 다음 판에 없는 곡은 "후반기에 빠짐", 옮길 곡은
 *   "후반기에 순서 변경".
 * 고른 판에 줄이 없는 곡(앞 판에서 빠진 곡, 다음 판에 들어올 곡)은 표시하지 않고, 곡 하나가
 * 끼어들어 번호만 밀린 곡도 표시하지 않는다. 고정곡이 일부 공연의 선택곡이 되면 공통
 * 세트리스트에선 빠진 것으로 본다.
 */
export function diffSetlistVersions(
  entries: readonly DiffEntry[],
  other: readonly DiffEntry[],
  nextName: string | null = null,
): SetlistChangeNote[] {
  const here = inOrder(entries);
  const there = inOrder(other);
  const thereById = new Map(there.map((entry) => [entry.songId, entry]));
  const kept = new Set(keptPairs(here, there).map(([index]) => index));
  const timing = nextName ? `${nextName}에` : null;
  return here.flatMap((entry, index) => {
    if (kept.has(index)) return [];
    const counterpart = thereById.get(entry.songId);
    const note: SetlistChangeNote = {
      label: counterpart ? "순서 변경" : nextName ? "빠짐" : "추가됨",
      timing,
      detail: counterpart
        ? nextName
          ? moveText(entry, counterpart)
          : moveText(counterpart, entry)
        : null,
      songId: entry.songId,
      isEncore: entry.isEncore,
    };
    return [note];
  });
}
