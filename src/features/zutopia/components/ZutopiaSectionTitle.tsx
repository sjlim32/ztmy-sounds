/**
 * 즛토피아 화면의 묶음 제목 — 굵은 이름 + 오른쪽 가는 선(배경 위에서도 읽히게
 * 글자 그림자). 허브 첫 화면의 아카이브/플레이그라운드와 퀴즈 페이지가 같이 쓴다.
 */
export function ZutopiaSectionTitle({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2 id={id} className="drop-shadow-legible flex items-center gap-3">
      <span className="tablet:text-xl text-lg font-bold text-white">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-white/15" />
    </h2>
  );
}
