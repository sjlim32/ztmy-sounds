"use client";

import { useEffect } from "react";

// 이 화면은 루트 레이아웃 대신 그려져서 전역 스타일·폰트가 없다 — 색은 globals.css의
// --background/--ztmy-magenta와 같은 값을 직접 적는다.
const BACKGROUND = "#050223";
const ACCENT = "#e147bf";

// 자동 복구를 마지막으로 시도한 시각(ms). 복구해도 같은 오류면 새로고침이 끝없이
// 반복되므로, 이 시간 안에는 다시 자동으로 시도하지 않는다.
const RECOVERY_KEY = "ztmy-error-recovery-at";
const RECOVERY_COOLDOWN_MS = 5 * 60_000;

/** 서비스워커와 그 캐시를 전부 지운다 — 다음 로드 때 SerwistProvider가 새로 등록한다. */
async function clearSiteCaches() {
  const registrations =
    (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
  await Promise.all(
    registrations.map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

function clearCachesAndReload() {
  clearSiteCaches()
    // 지우다 실패해도 새로고침은 해본다.
    .catch(() => {})
    .finally(() => window.location.reload());
}

/**
 * 페이지를 그리다 스크립트 오류가 났을 때의 화면.
 *
 * 홈 화면에 설치한 앱에서 옛 캐시가 남아 특정 페이지가 열리지 않고, 새로고침
 * 해도 그대로였던 적이 있다(앱을 지우고 다시 설치하니 해결됨). 사용자가 그렇게
 * 하지 않아도 되도록, 오류가 나면 서비스워커와 캐시를 지우고 한 번 다시
 * 불러온다. 그래도 같은 오류면 이 화면에 오류 내용을 그대로 보여줘서 캡처만
 * 받아도 추적할 수 있게 한다(Next 기본 화면은 무슨 오류인지 알려주지 않는다).
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    try {
      const lastAttempt = Number(sessionStorage.getItem(RECOVERY_KEY)) || 0;
      if (Date.now() - lastAttempt < RECOVERY_COOLDOWN_MS) return;
      sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
    } catch {
      // 시도 여부를 기록할 수 없으면 무한 새로고침을 막을 방법이 없어 자동 복구는 건너뛴다.
      return;
    }
    clearCachesAndReload();
  }, []);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          boxSizing: "border-box",
          background: BACKGROUND,
          color: "#ededed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <title>페이지를 불러오지 못했습니다</title>
        <h1 style={{ margin: 0, fontSize: 20 }}>
          페이지를 불러오지 못했습니다
        </h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>
          저장된 데이터를 지우고 다시 불러옵니다. 계속 같은 화면이 나오면 아래
          오류 내용을 캡처해서 건의로 보내주세요.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={clearCachesAndReload}
            style={{
              padding: "10px 16px",
              border: 0,
              borderRadius: 999,
              background: ACCENT,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            다시 시도
          </button>
          {/* 오류 상태에선 라우터가 망가졌을 수 있어 일반 링크로 새로 불러온다 */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              padding: "10px 16px",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              color: "#ededed",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            홈으로
          </a>
        </div>

        <pre
          style={{
            margin: 0,
            padding: 12,
            maxHeight: "40dvh",
            overflow: "auto",
            borderRadius: 8,
            background: "rgba(0,0,0,0.4)",
            fontSize: 11,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            opacity: 0.8,
          }}
        >
          {`${error.name}: ${error.message}`}
          {error.digest ? `\n(digest ${error.digest})` : ""}
          {error.stack
            ? `\n\n${error.stack.split("\n").slice(0, 8).join("\n")}`
            : ""}
        </pre>
      </body>
    </html>
  );
}
