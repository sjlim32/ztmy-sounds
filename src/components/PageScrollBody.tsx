import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

/**
 * /info, /credits, /zutopia 세 스크롤 페이지가 똑같이 반복하던 안쪽 레이아웃
 * — 콘텐츠가 짧으면 Footer가 화면 하단에 붙고, 길어지면 콘텐츠 뒤로
 * 밀려난다(모바일 포함 — 예전엔 모바일만 콘텐츠 바로 밑에 붙여서, 출처
 * 페이지처럼 내용이 짧으면 Footer가 화면 중간에 떠 있었다).
 * 실제 스크롤 컨테이너(`<main>`, ref/id/스크롤바 스타일 등)는 계속 각
 * 페이지가 직접 소유하고, 이 컴포넌트는 그 안쪽 내용물 + Footer 배치만
 * 담당한다.
 */
export function PageScrollBody({
  innerClassName,
  children,
}: {
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      {/* data-page-body / data-page-footer: 화면 높이를 꽉 채우는 화면(활동 연혁)이
          아래 여백·푸터 높이를 잴 때 찾는 표시 — 구조를 바꿔도 이 표시는 남겨 두세요. */}
      <div data-page-body className={cn("flex-1", innerClassName)}>
        {children}
      </div>
      <div data-page-footer>
        <Footer inline />
      </div>
    </div>
  );
}
