import type { Metadata } from "next";
import { ZutopiaScrollArea } from "@/features/zutopia/components/ZutopiaScrollArea";
import { ZutopiaTopNav } from "@/features/zutopia/components/ZutopiaTopNav";

export const metadata: Metadata = {
  title: "즛토피아",
  description: "즛토마요 팬을 위한 아카이브입니다.",
};

/**
 * /zutopia 전체(대분류 목록, 카테고리별 목록, 항목 상세)가 공유하는 최상위
 * 레이아웃. 대분류별 nav는 여기가 아니라 [category]/layout.tsx가 맡습니다 —
 * 카테고리마다 그 안의 항목 목록(탭)이 다르기 때문입니다.
 *
 * 앱 셸 전체(body, 그 안의 children 래퍼)가 overflow-hidden 고정 레이아웃이라,
 * 콘텐츠가 뷰포트보다 길어지는 페이지는 자기 <main>에서 직접 스크롤을 열어줘야
 * 합니다 — /info/page.tsx와 동일한 패턴. 실제 스크롤 박스(ref 필요)는
 * ZutopiaScrollArea로 분리되어 있습니다(이 파일은 metadata를 export해야 해서
 * 서버 컴포넌트로 남겨둠).
 */
export default function ZutopiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ZutopiaScrollArea>
      <ZutopiaTopNav />

      <div className="tablet:mt-8">{children}</div>
    </ZutopiaScrollArea>
  );
}
