/**
 * 투어 상세 정보 카드의 기간 — "2023년 4월 20일 ~ 5월 31일". 해가 같으면 연도는 맨 앞에만,
 * 해를 넘기면 양쪽 다. 끝 날짜가 없거나 같은 날이면 하루만. 날짜는 "YYYY-MM-DD"(뒤에
 * 시각이 붙어도 날짜 부분만).
 */
export function formatTourPeriod(start: string, end: string | null): string {
  const parse = (iso: string) => {
    const [year, month, day] = iso.split("T")[0].split("-");
    return { year, monthDay: `${Number(month)}월 ${Number(day)}일` };
  };
  const from = parse(start);
  const first = `${from.year}년 ${from.monthDay}`;
  if (!end || end.slice(0, 10) === start.slice(0, 10)) return first;
  const to = parse(end);
  return `${first} ~ ${to.year === from.year ? "" : `${to.year}년 `}${to.monthDay}`;
}
