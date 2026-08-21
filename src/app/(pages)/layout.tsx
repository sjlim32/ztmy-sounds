import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { GuideDimOverlay } from "@/components/GuideDimOverlay";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "콜가이드",
  description: "콘서트 떼창/응원 가이드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GuideDimOverlay />
        <SerwistProvider swUrl="/serwist/sw.js">
          {/* GuideDimOverlay(fixed + z-0)는 그 자체로 스태킹 컨텍스트를
              만들어서, position이 없는 일반 콘텐츠는 DOM 순서와 무관하게
              항상 그 뒤에 그려집니다. 페이지 콘텐츠를 z-index 있는
              래퍼로 감싸서 오버레이 위에 오도록 강제합니다. */}
          <div className="relative z-10 flex min-h-full flex-1 flex-col">
            {children}
          </div>
        </SerwistProvider>
      </body>
    </html>
  );
}
