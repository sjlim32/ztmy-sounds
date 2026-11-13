/**
 * 코드포인트 집합 → CSS unicode-range 값("U+AC00-AC02, U+AC05"). 이어진 값은
 * 구간으로 묶는다.
 */
export function toUnicodeRange(codes) {
  const sorted = [...new Set(codes)].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    let end = start;
    while (i + 1 < sorted.length && sorted[i + 1] === end + 1)
      end = sorted[++i];
    const hex = (code) => code.toString(16).toUpperCase();
    parts.push(
      start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`,
    );
  }
  return parts.join(", ");
}

/** [from, to] 구간들에 든 코드포인트 중 exclude에 없는 것. */
export function codesInRanges(ranges, exclude) {
  const codes = [];
  for (const [from, to] of ranges)
    for (let code = from; code <= to; code++)
      if (!exclude.has(code)) codes.push(code);
  return codes;
}
