import { describe, expect, test } from "vitest";
import { diffSetlistVersions, matchSetlists } from "./setlist-diff";

const e = (songId: string, trackNumber: number, isEncore = false) => ({
  songId,
  trackNumber,
  isEncore,
});

const diff = (
  entries: ReturnType<typeof e>[],
  other: ReturnType<typeof e>[],
  compareWithNext = false,
) =>
  diffSetlistVersions(entries, other, {
    earlierName: "전반기",
    laterName: "후반기",
    compareWithNext,
  }).map((note) => [note.songId, note.label, note.detail]);

describe("diffSetlistVersions", () => {
  test("뒤 판: 새로 들어온 곡만 추가, 번호만 밀린 곡은 표시하지 않는다", () => {
    expect(
      diff(
        [e("a", 1), e("new", 2), e("b", 3), e("c", 4)],
        [e("a", 1), e("b", 2), e("c", 3)],
      ),
    ).toEqual([["new", "추가", "후반기부터"]]);
  });

  test("뒤 판: 앞 판에서 빠진 곡은 표시하지 않는다", () => {
    expect(
      diff([e("a", 1), e("c", 2)], [e("a", 1), e("gone", 2), e("c", 3)]),
    ).toEqual([]);
  });

  test("순서가 실제로 바뀐 곡만 순서 변경", () => {
    expect(
      diff(
        [e("b", 1), e("c", 2), e("a", 3)],
        [e("a", 1), e("b", 2), e("c", 3)],
      ),
    ).toEqual([["a", "순서 변경", "전반기 1번 → 후반기 3번"]]);
  });

  test("본편·앙코르를 넘나들어도 번호만 적는다", () => {
    expect(
      diff(
        [e("a", 1), e("c", 2), e("d", 3, true), e("b", 4, true)],
        [e("a", 1), e("b", 2), e("c", 3), e("d", 4, true)],
      ),
    ).toEqual([["b", "순서 변경", "전반기 2번 → 후반기 4번"]]);
  });

  test("첫 판: 다음 판에 없는 곡은 제거, 들어올 곡은 표시하지 않는다", () => {
    expect(
      diff(
        [e("a", 1), e("old", 2), e("c", 3)],
        [e("a", 1), e("new", 2), e("c", 3)],
        true,
      ),
    ).toEqual([["old", "제거", "후반기부터"]]);
  });

  test("첫 판: 옮길 곡은 이 판 번호 → 다음 판 번호", () => {
    expect(
      diff(
        [e("a", 1), e("b", 2), e("c", 3)],
        [e("b", 1), e("c", 2), e("a", 3)],
        true,
      ),
    ).toEqual([["a", "순서 변경", "전반기 1번 → 후반기 3번"]]);
  });

  test("같은 세트리스트면 메모 없음", () => {
    expect(diff([e("a", 1), e("b", 2)], [e("a", 1), e("b", 2)])).toEqual([]);
  });
});

describe("matchSetlists", () => {
  const ids = (list: { songId: string }[]) => list.map((x) => x.songId);
  const match = (a: ReturnType<typeof e>[], b: ReturnType<typeof e>[]) => {
    const { removed, added, moved } = matchSetlists(a, b);
    return {
      removed: ids(removed),
      added: ids(added),
      moved: moved.map(({ from, to }) => [
        from.songId,
        from.trackNumber,
        to.trackNumber,
      ]),
    };
  };

  test("B에만 있는 곡은 추가, 번호만 밀린 곡은 없음", () => {
    expect(
      match(
        [e("a", 1), e("b", 2), e("c", 3)],
        [e("a", 1), e("x", 2), e("b", 3), e("c", 4)],
      ),
    ).toEqual({ removed: [], added: ["x"], moved: [] });
  });

  test("A에만 있는 곡은 빠짐", () => {
    expect(
      match([e("a", 1), e("gone", 2), e("c", 3)], [e("a", 1), e("c", 2)]),
    ).toEqual({ removed: ["gone"], added: [], moved: [] });
  });

  test("순서가 실제로 바뀐 곡은 A 번호 → B 번호", () => {
    expect(
      match(
        [e("a", 1), e("b", 2), e("c", 3)],
        [e("b", 1), e("c", 2), e("a", 3)],
      ),
    ).toEqual({ removed: [], added: [], moved: [["a", 1, 3]] });
  });

  test("앙코르 번호만 밀리거나 같은 세트리스트면 차이 없음", () => {
    const none = { removed: [], added: [], moved: [] };
    expect(
      match([e("a", 1), e("e", 9, true)], [e("a", 1), e("e", 10, true)]),
    ).toEqual(none);
    expect(match([e("a", 1), e("b", 2)], [e("a", 1), e("b", 2)])).toEqual(none);
  });
});
