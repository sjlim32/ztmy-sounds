/**
 * 투어 공통 행 번호를 그날 행(setlists.live_id) 번호와 겹치지 않게 뒤로 민다 — 투어
 * 상세(lives/data.ts mergeTourSetlist)와 라이브 기록·통계(live-history/units.ts)가
 * 같이 쓴다(순수 함수).
 *
 * 선택곡 자리(공통 행의 빈 번호)보다 많이 부른 날, 그날 행만 넣으면 넘친 선택곡이 뒤
 * 공통 곡과 번호가 겹친다(빈 7·8번에 3곡 → 9번이 優しくLAST SMILE과 겹침). 겹치면
 * 그 번호는 그날 행이 갖고, 그 공통 곡부터 뒤 공통 곡을 한 칸씩 민다(9→10, 10→11…).
 * 앙코르 번호는 본편에서 이어지므로(데이터 관례) 본편·앙코르를 한 줄로 보고 민다 —
 * 본편이 넘치면 앙코르도 밀린다. 그날 행에 밀린 공통 곡까지 실제 번호로 넣었으면 그
 * 곡은 공통 행이 아니라(mergeTourSetlist가 그날 행으로 대신) 겹칠 일이 없다.
 *
 * 결과는 tourRows와 같은 순서의 번호(번호 없는 원시 행은 undefined 그대로).
 */
interface NumberedRow {
  track_number?: number;
  is_encore?: boolean;
}

export function shiftedTrackNumbers(
  tourRows: readonly NumberedRow[],
  liveRows: readonly NumberedRow[],
): (number | undefined)[] {
  const numbers = tourRows.map((row) => row.track_number);
  const occupied = new Set(
    liveRows.flatMap((row) =>
      row.track_number == null ? [] : [row.track_number],
    ),
  );
  if (occupied.size === 0) return numbers;
  const order = tourRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.track_number != null)
    .sort(
      (a, b) =>
        Number(!!a.row.is_encore) - Number(!!b.row.is_encore) ||
        a.row.track_number! - b.row.track_number! ||
        a.index - b.index,
    );
  let shift = 0;
  for (const { row, index } of order) {
    let number = row.track_number! + shift;
    while (occupied.has(number)) {
      number += 1;
      shift += 1;
    }
    numbers[index] = number;
  }
  return numbers;
}

/** shiftedTrackNumbers를 행에 적용한 새 행들(번호가 그대로인 행은 같은 객체). */
export function shiftTourRows<T extends NumberedRow>(
  tourRows: readonly T[],
  liveRows: readonly NumberedRow[],
): T[] {
  const numbers = shiftedTrackNumbers(tourRows, liveRows);
  return tourRows.map((row, i) =>
    numbers[i] === row.track_number
      ? row
      : { ...row, track_number: numbers[i]! },
  );
}
