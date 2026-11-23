import { describe, expect, test } from "vitest";
import { diffSetlistVersions } from "./setlist-diff";

const e = (songId: string, trackNumber: number, isEncore = false) => ({
  songId,
  trackNumber,
  isEncore,
});

const diff = (
  entries: ReturnType<typeof e>[],
  other: ReturnType<typeof e>[],
  nextName?: string,
) =>
  diffSetlistVersions(entries, other, nextName).map((note) => [
    note.songId,
    note.timing,
    note.label,
    note.detail,
  ]);

describe("diffSetlistVersions", () => {
  test("뒤 판: 새로 들어온 곡만 추가됨, 번호만 밀린 곡은 표시하지 않는다", () => {
    expect(
      diff(
        [e("a", 1), e("new", 2), e("b", 3), e("c", 4)],
        [e("a", 1), e("b", 2), e("c", 3)],
      ),
    ).toEqual([["new", null, "추가됨", null]]);
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
    ).toEqual([["a", null, "순서 변경", "1번 → 3번"]]);
  });

  test("본편·앙코르를 넘나들면 구간을 함께 적는다", () => {
    expect(
      diff(
        [e("a", 1), e("c", 2), e("d", 3, true), e("b", 4, true)],
        [e("a", 1), e("b", 2), e("c", 3), e("d", 4, true)],
      ),
    ).toEqual([["b", null, "순서 변경", "본편 2번 → 앙코르 4번"]]);
  });

  test("첫 판: 다음 판에 없는 곡은 빠짐, 들어올 곡은 표시하지 않는다", () => {
    expect(
      diff(
        [e("a", 1), e("old", 2), e("c", 3)],
        [e("a", 1), e("new", 2), e("c", 3)],
        "후반기",
      ),
    ).toEqual([["old", "후반기에", "빠짐", null]]);
  });

  test("첫 판: 옮길 곡은 이 판 번호 → 다음 판 번호", () => {
    expect(
      diff(
        [e("a", 1), e("b", 2), e("c", 3)],
        [e("b", 1), e("c", 2), e("a", 3)],
        "후반기",
      ),
    ).toEqual([["a", "후반기에", "순서 변경", "1번 → 3번"]]);
  });

  test("같은 세트리스트면 메모 없음", () => {
    expect(diff([e("a", 1), e("b", 2)], [e("a", 1), e("b", 2)])).toEqual([]);
  });
});
