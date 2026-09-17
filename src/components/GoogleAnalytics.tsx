import Script from "next/script";

const GA_MEASUREMENT_ID = "G-B8KKWQ1Z5W";

/**
 * 전역 Google Analytics(gtag.js) 로더. 서버 컴포넌트인 루트 레이아웃에서
 * BodyScrollGuard/CustomCursor 등과 동일하게 조립해서 쓴다 — Script
 * 컴포넌트는 이벤트 핸들러(onLoad 등)를 안 쓰는 한 클라이언트 컴포넌트가
 * 아니어도 동작한다.
 */
export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
