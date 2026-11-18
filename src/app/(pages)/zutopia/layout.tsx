import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";
import { ZutopiaScrollArea } from "@/features/zutopia/components/ZutopiaScrollArea";
import { ZutopiaNotice } from "@/features/zutopia/components/ZutopiaNotice";

export const metadata: Metadata = {
  // 문자열 title만 두면 그 아래 페이지에 루트의 "%s | 사이트명"이 이어지지 않아("공연"만
  // 나옴) 템플릿을 다시 건다(title.template은 바로 아래 세그먼트까지만 닿음).
  title: { default: "즛토피아", template: `%s | ${SITE_NAME}` },
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
    <>
      <ZutopiaScrollArea>{children}</ZutopiaScrollArea>
      {/* 들어올 때 한 번 띄우는 안내(세트리스트 채우는 중) */}
      <ZutopiaNotice />
    </>
  );
}
