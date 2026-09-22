import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

/**
 * /info, /credits, /zutopia 세 스크롤 페이지가 똑같이 반복하던 안쪽 레이아웃
 * — 모바일은 콘텐츠 바로 다음에 Footer가 일반 흐름으로 붙고, 태블릿
 * 이상은 콘텐츠가 짧으면 화면 하단에 고정되고 길어지면 그 뒤로 밀려난다.
 * 실제 스크롤 컨테이너(`<main>`, ref/id/스크롤바 스타일 등)는 계속 각
 * 페이지가 직접 소유하고, 이 컴포넌트는 그 안쪽 내용물 + Footer 배치만
 * 담당한다. `<Footer inline />`을 쓰는 페이지를 추가/제거할 때는
 * `Footer.tsx`의 `SELF_MANAGED_FOOTER_PREFIXES`도 함께 맞춰야 한다.
 */
export function PageScrollBody({
  innerClassName,
  children,
}: {
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("tablet:flex", "tablet:min-h-full tablet:flex-col")}>
      <div className={cn("tablet:flex-1", innerClassName)}>{children}</div>
      <Footer inline />
    </div>
  );
}
