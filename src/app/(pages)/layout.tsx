import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SerwistProvider } from "@serwist/turbopack/react";
import { BodyScrollGuard } from "@/components/BodyScrollGuard";
import { CustomCursor } from "@/components/CustomCursor";
import { DeferredFonts } from "@/components/DeferredFonts";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GuideDimOverlay } from "@/components/GuideDimOverlay";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { ARTIST } from "@/data/artist";
import { SITE_URL, SITE_NAME, SITE_BRAND, SITE_DESCRIPTION } from "@/lib/seo";
import { buildSiteJsonLdGraph } from "@/lib/structured-data";
import "../globals.css";

// 로컬 폰트는 원본이 아니라 scripts/subset-fonts.mjs가 만든 서브셋을 씁니다 —
// 원본을 그대로 preload하면 첫 로딩 전송량 대부분을 폰트가 차지합니다.
// LINE Seed KR은 두 조각입니다: 사이트 글자만 든 기본 조각(굵기당 약 90KB)은 여기서
// 미리 받고, 나머지 KS X 1001 음절·기호 조각은 subset-fonts.mjs가 만든 CSS
// (정확한 unicode-range)를 DeferredFonts가 첫 화면 뒤에 불러와 그 글자가 나올 때만 받습니다.
// 이 폰트는 세로 높이 값이 표마다 달라서(hhea 1050/274, typo 750/250 + 줄
// 간격 324, typo 우선 표시 켜짐) Mac은 hhea를, Windows는 typo를 써서 같은
// 줄 안에서 Windows 글자만 약 0.14em 위로 떴다(배지·버튼 글자가 위로 치우침).
// Mac 값으로 고정해 두 OS가 같게 그린다(나머지 조각 CSS에도 같은 값).
const lineSeedKR = localFont({
  src: [
    {
      path: "../../fonts/subset/LINESeedKR-Rg-core.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/subset/LINESeedKR-Rg-core.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/subset/LINESeedKR-Bd-core.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/subset/LINESeedKR-Bd-core.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/subset/LINESeedKR-Bd-core.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  display: "swap",
  declarations: [
    { prop: "ascent-override", value: "105%" },
    { prop: "descent-override", value: "27.4%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});

// 글꼴 목록: 기본 조각 → 나머지 조각 → 기본 조각의 대체 글꼴(local(Arial), 글꼴을
// 받는 동안 줄 높이를 맞춰 화면 흔들림을 줄임). 대체 글꼴이 나머지 조각보다 앞이면
// 나머지 조각의 그리스·키릴 문자·기호(™ ↑ ≤ 등)를 Arial이 가로챈다. globals.css의
// --font-sans가 이 변수를 쓴다.
const [lineSeedKRFamily, ...lineSeedKRFallbacks] =
  lineSeedKR.style.fontFamily.split(",");
const lineSeedKRStack = [
  lineSeedKRFamily,
  '"LINE Seed KR Rest"',
  ...lineSeedKRFallbacks,
].join(",");

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const mkpop = localFont({
  src: "../../fonts/subset/851MkPOP_101.woff2",
  variable: "--font-mkpop-101",
  display: "swap",
});

// 이 사이트는 어두운 화면 하나뿐이다. color-scheme을 dark로 알려두면 브라우저가
// 스타일을 적용하기 전의 빈 문서도 어둡게 칠한다 — 안 그러면 홈 화면 앱·인앱
// 브라우저를 켤 때 기본 흰 바탕이 잠깐 비쳐 화면이 번쩍인다.
export const viewport: Viewport = {
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    SITE_BRAND,
    ARTIST.name.jp,
    ARTIST.name.kr,
    ARTIST.name.en,
    "내한",
    "JPOP",
    "제이팝",
    "응원 가이드",
    "CALL GUIDE",
    // 화면에선 "응원 가이드"로 통일했지만, 이 표현으로 검색하는 사람을 위해 키워드엔 남긴다.
    "콜 가이드",
    "떼창",
    "응원법",
    "콘서트 응원",
    "공연 정보",
    "샤모지",
    "아카네",
    "ACAね",
    "즛토마요",
  ],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og/og.webp", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og/og.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "cNG2sZPOuRCDcSsSeizR7F3cCUGuEdzmRXN8l_g3v4c",
    other: {
      "naver-site-verification": ["fed7514db835b61bd6b783f7b12ef0df9e720ab0"],
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      // iOS용 Chrome 등 일부 브라우저·확장 프로그램이 React보다 먼저 <html>에
      // 자기 속성(예: __gcrremoteframetoken)을 붙여서 하이드레이션 경고가 난다.
      // 우리 코드가 만든 불일치가 아니라서 이 요소의 속성 경고만 끈다(자식
      // 요소에는 적용되지 않는다).
      suppressHydrationWarning
      style={{ "--font-line-seed-kr-stack": lineSeedKRStack } as CSSProperties}
      className={`${plexMono.variable} ${mkpop.variable} bg-background h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildSiteJsonLdGraph()),
          }}
        />
        <GoogleAnalytics />
        <DeferredFonts />
        <BodyScrollGuard />
        <CustomCursor />
        <GuideDimOverlay />
        <SerwistProvider swUrl="/serwist/sw.js">
          <div
            id="app-root"
            className="relative z-10 flex min-h-0 flex-1 flex-col"
          >
            <MobileHeader />
            <InstallPromptBanner />
            <SiteHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
            <Footer />
          </div>
        </SerwistProvider>
      </body>
    </html>
  );
}
