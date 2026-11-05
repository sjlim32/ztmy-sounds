/**
 * 곡 목록(디스코그래피)과 공연 세트리스트가 같이 쓰는 곡 제목 둘째 줄 —
 * "한국어 · 영어". 첫째 줄은 원어 제목이다. 영어 제목이 비었거나 원어·한국어
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
