import { forwardRef } from "react";
import type { AttendanceSummary } from "@/features/zutopia/attendance/summarize";
import {
  LINE_HEIGHT,
  SHARE_COLUMN_GAP,
  SHARE_FOOTER_HEIGHT,
  SHARE_HEADER_HEIGHT,
  SHARE_PADDING,
  SHARE_QR_SIZE,
  SHARE_SIZE,
  type ShareLayout,
} from "./layout";
import { Tally } from "./Tally";
import { QrCode } from "./QrCode";

/** 이미지 아래 주소·QR이 가리키는 곳 — 본 사람이 자기 기록을 만들러 온다. */
export const SHARE_PAGE_URL = "https://ztmy-sounds.fans/zutopia/attendance";

const BACKGROUND = "#050223";
const MAGENTA = "#e147bf";
const LOGO_SRC = "/assets/logo/ztmy-sounds-logo.webp";
// 모바일 상단 바 로고와 같은 4방향 흰 외곽선 — 1080px 이미지에 맞게 굵게.
const LOGO_OUTLINE =
  "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)";

/** "YYYY.MM.DD" (보는 사람의 로컬 날짜) */
function formatToday(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

const ellipsis = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/**
 * 참전 기록 이미지(1080×1080) — 화면 밖에 그려 두고 html-to-image로 PNG를
 * 만든다. 크기 값은 전부 layout.ts와 같은 상수라, 계산한 목록 높이와 실제
 * 그림이 맞는다. 단색 배경 + 흰 테두리, 위쪽 가운데 로고·제목(닉네임)·숫자,
 * 들은 곡 목록(많이 들은 순 — 1열 위에서 아래로, 다음 2열…), 아래 생성일 ·
 * 참전 기록 페이지 주소 · QR.
 */
export const ShareImage = forwardRef<
  HTMLDivElement,
  {
    summary: AttendanceSummary;
    layout: ShareLayout;
    /** 비우면 "나의" */
    nickname: string;
    createdAt: Date;
  }
>(function ShareImage({ summary, layout, nickname, createdAt }, ref) {
  const rows = Math.max(1, Math.ceil(summary.heard.length / layout.columns));
  const owner = nickname.trim() ? `${nickname.trim()}의` : "나의";
  const tallySize = Math.round(layout.subPx * 0.95);
  const stats = [
    { label: "참전", value: summary.attendedCount },
    { label: "성불", value: summary.heard.length },
  ];

  return (
    <div
      ref={ref}
      style={{
        width: SHARE_SIZE,
        height: SHARE_SIZE,
        boxSizing: "border-box",
        padding: SHARE_PADDING,
        background: BACKGROUND,
        boxShadow: "inset 0 0 0 10px #fff",
        color: "#ededed",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: SHARE_HEADER_HEIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt=""
          style={{ height: 76, width: "auto", filter: LOGO_OUTLINE }}
        />
        <div
          style={{
            marginTop: 18,
            maxWidth: "100%",
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#fff",
            ...ellipsis,
          }}
        >
          {owner} ZUTOMAYO 라이브 참전 기록
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 72 }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#fff",
                }}
              >
                {stat.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 24, opacity: 0.7 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          // 많이 들은 곡부터 1열을 위에서 아래로 채우고 다음 열로 넘어간다.
          gridTemplateRows: `repeat(${rows}, auto)`,
          gridAutoFlow: "column",
          columnGap: SHARE_COLUMN_GAP,
          alignContent: "start",
          overflow: "hidden",
        }}
      >
        {summary.heard.map((song) => (
          <div
            key={song.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(layout.subPx * 0.6),
              paddingBottom: layout.rowGapPx,
              minWidth: 0,
            }}
          >
            {layout.showCover &&
              (song.coverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shareImageSrc(song.coverSrc)}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    width: layout.coverPx,
                    height: layout.coverPx,
                    objectFit: "cover",
                    borderRadius: 6,
                    flex: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: layout.coverPx,
                    height: layout.coverPx,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    flex: "none",
                  }}
                />
              ))}
            <div style={{ minWidth: 0, flex: 1, lineHeight: LINE_HEIGHT }}>
              <div
                style={{
                  ...ellipsis,
                  fontSize: layout.titlePx,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {song.title}
              </div>
              <div
                style={{ ...ellipsis, fontSize: layout.subPx, opacity: 0.75 }}
              >
                {song.titleKo}
              </div>
              {layout.showEnglish && (
                <div
                  style={{ ...ellipsis, fontSize: layout.subPx, opacity: 0.55 }}
                >
                  {song.titleEn}
                </div>
              )}
            </div>
            <div style={{ flex: "none" }}>
              <Tally count={song.count} size={tallySize} color={MAGENTA} />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          height: SHARE_FOOTER_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          fontSize: 18,
        }}
      >
        <span style={{ opacity: 0.55 }}>{formatToday(createdAt)}</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <span style={{ opacity: 0.55 }}>
            ztmy-sounds.fans/zutopia/attendance
          </span>
          <QrCode value={SHARE_PAGE_URL} size={SHARE_QR_SIZE} />
        </div>
      </div>
    </div>
  );
});

/**
 * 이미지 만들기에 쓰는 R2 커버 주소 — 페이지의 <img>가 CORS 헤더 없이 받아 둔
 * 캐시를 html-to-image의 fetch가 다시 쓰면 CORS에 막히므로, 주소에 표시를 붙여
 * 따로 받는다(RULES.md). 같은 출처(로고 등)는 그대로.
 */
function shareImageSrc(url: string): string {
  if (!/^https?:/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}share=1`;
}
