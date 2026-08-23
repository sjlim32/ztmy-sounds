import type { Metadata } from "next";
import { Geist, Geist_Mono, RocknRoll_One } from "next/font/google";
import localFont from "next/font/local";
import { SerwistProvider } from "@serwist/turbopack/react";
import { GuideDimOverlay } from "@/components/GuideDimOverlay";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileFooter } from "@/components/mobile/MobileFooter";
import { ARTIST } from "@/data/artist";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
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
  src: "../../../public/fonts/851MkPOP_101.ttf",
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${rocknrollOne.variable} ${mkpop.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GuideDimOverlay />
        <SerwistProvider swUrl="/serwist/sw.js">
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            <MobileHeader />
            <div className="flex flex-1 flex-col">{children}</div>
            <MobileFooter />
          </div>
        </SerwistProvider>
      </body>
    </html>
  );
}
