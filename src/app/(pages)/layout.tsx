import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { GuideDimOverlay } from "@/components/GuideDimOverlay";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileFooter } from "@/components/mobile/MobileFooter";
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
