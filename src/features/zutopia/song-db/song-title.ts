/**
 * 원어 제목이 첫 줄인 곳(참전 기록 곡 목록)의 곡 제목 둘째 줄 — "한국어 · 영어". 곡 목록
 * (디스코그래피)·공연 세트리스트는 한국어가 첫 줄인 setlistTitles를 쓴다. 영어 제목이 비었거나 원어·한국어
 * 제목과 같으면(예: "Ham") 반복하지 않는다. 곡 상세 패널은 공간이 넓어 세
 * 언어를 한 줄씩 따로 쓴다.
 */
export function secondaryTitle({
  title,
  titleKo,
  titleEn,
}: {
  title: string;
  titleKo: string;
  titleEn: string;
}): string {
  const en = titleEn.trim();
  const showEn = en !== "" && en !== title && en !== titleKo;
  return showEn ? `${titleKo} · ${en}` : titleKo;
}

/**
 * 공연 세트리스트·곡 목록의 곡(앨범) 제목 두 줄 — 한국어 제목이 첫 줄(한국 팬이 훑기 쉽게),
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
