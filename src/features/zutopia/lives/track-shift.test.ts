import { describe, expect, test } from "vitest";
import { shiftedTrackNumbers } from "./track-shift";

const r = (track_number?: number, is_encore = false) => ({
  track_number,
  is_encore,
});

describe("shiftedTrackNumbers", () => {
  // 공통: 6, (빈 7·8), 9, 10, 앙코르 11
  const tour = [r(6), r(9), r(10), r(11, true)];

  test("빈 번호 안에 들어가면 그대로", () => {
    expect(shiftedTrackNumbers(tour, [r(7), r(8)])).toEqual([6, 9, 10, 11]);
    expect(shiftedTrackNumbers(tour, [])).toEqual([6, 9, 10, 11]);
  });

  test("빈 2칸에 3곡이면 겹친 공통 곡부터 뒤를 한 칸씩(앙코르도)", () => {
    expect(shiftedTrackNumbers(tour, [r(7), r(8), r(9)])).toEqual([
      6, 10, 11, 12,
    ]);
  });

  test("밀린 공통 곡을 그날 실제 번호로 넣었으면(공통 행에서 빠짐) 그 번호도 피한다", () => {
    // 그날: 7·8·9 선택곡, 10 = 공통 9번 곡(그날 행으로 대신) → 남은 공통 10번 곡은 11
    expect(
      shiftedTrackNumbers(
        [r(6), r(10), r(11, true)],
        [r(7), r(8), r(9), r(10)],
      ),
    ).toEqual([6, 11, 12]);
  });

  test("순서는 입력 그대로, 번호 없는 행은 그대로", () => {
    expect(shiftedTrackNumbers([r(10), r(), r(9)], [r(9)])).toEqual([
      11,
      undefined,
      10,
    ]);
  });
});
