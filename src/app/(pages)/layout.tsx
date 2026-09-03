import type { Metadata } from "next";
import { Geist, Geist_Mono, RocknRoll_One } from "next/font/google";
import localFont from "next/font/local";
import { SerwistProvider } from "@serwist/turbopack/react";
import { GuideDimOverlay } from "@/components/GuideDimOverlay";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Footer } from "@/components/Footer";
import { ARTIST } from "@/data/artist";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { buildSiteJsonLdGraph } from "@/lib/structured-data";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rocknrollOne = RocknRoll_One({
  variable: "--font-rocknroll-one",
  weight: "400",
  subsets: ["latin"],
});

const mkpop = localFont({
  src: "../../fonts/851MkPOP_101.ttf",
  variable: "--font-mkpop-101",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    ARTIST.name.jp,
    ARTIST.name.kr,
    ARTIST.name.en,
    "내한",
    "JPOP",
    "제이팝",
    "콜 가이드",
    "떼창",
    "응원법",
    "콘서트 응원",
    "공연 정보",
    "샤모지",
    "아카네",
    "ACAね",
    "ACA",
  ],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og/og.webp", width: 600, height: 337, alt: SITE_NAME }],
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
      className={`${geistSans.variable} ${geistMono.variable} ${rocknrollOne.variable} ${mkpop.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildSiteJsonLdGraph()),
          }}
        />
        <GuideDimOverlay />
        <SerwistProvider swUrl="/serwist/sw.js">
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <MobileHeader />
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
