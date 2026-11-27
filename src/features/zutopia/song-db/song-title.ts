/**
 * 사이트 전체의 곡(앨범) 제목 두 줄 — 세트리스트·곡 목록·곡 상세·앨범 수록곡·참전 기록 모두
 * 한국어 제목이 첫 줄(한국 팬이 훑기 쉽게),
 * 원제 · 영어가 둘째 줄. 한국어 제목이 비었으면 원제가 첫 줄. 겹치는 제목은 한 번만
 * (영어가 원제·한국어와 같거나 비면 빼고), 둘째 줄에 남는 게 없으면 null.
 */
export function setlistTitles({
  title,
  titleKo,
  titleEn,
}: {
  title: string;
  titleKo: string;
  titleEn: string;
}): { primary: string; secondary: string | null } {
  const primary = titleKo.trim() || title;
  const en = titleEn.trim();
  const rest = [
    title !== primary ? title : null,
    en && en !== title && en !== primary ? en : null,
  ].filter(Boolean);
  return { primary, secondary: rest.length ? rest.join(" · ") : null };
}
