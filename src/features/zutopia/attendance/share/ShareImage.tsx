import { forwardRef } from "react";
import type {
  AttendanceSummary,
  HeardSong,
} from "@/features/zutopia/attendance/summarize";
import {
  LINE_HEIGHT,
  restAreaHeight,
  SECTION_GAP,
  SECTION_LABEL_HEIGHT,
  SHARE_COLUMN_GAP,
  SHARE_FOOTER_HEIGHT,
  SHARE_HEADER_HEIGHT,
  SHARE_PADDING,
  SHARE_QR_SIZE,
  SHARE_SIZE,
  TOP_COUNT,
  TOP_GAP,
  TOP_TEXT,
  type RestLayout,
  type ShareLayout,
} from "./layout";
import { Tally } from "./Tally";
import { QrCode } from "./QrCode";

/** 이미지 아래 주소·QR이 가리키는 곳 — 본 사람이 자기 기록을 만들러 온다. */
export const SHARE_PAGE_URL = "https://ztmy-sounds.fans/zutopia/attendance";

const BACKGROUND = "#050223";
const MAGENTA = "#e147bf";
const LOGO_SRC = "/assets/logo/ztmy-sounds-logo.webp";
// 모바일 상단 바 로고와 같은 4방향 흰 외곽선 — 작은 로고라 얇게.
const LOGO_OUTLINE =
  "drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)";

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
 * 만든다. 크기 값은 전부 layout.ts와 같은 상수라, 계산한 높이와 실제 그림이
 * 맞는다. 단색 배경 + 흰 테두리.
 * - 머리: 왼쪽에 작은 제목(닉네임)과 숫자, 오른쪽 위에 작은 사이트 로고
 * - TOP 5: 많이 들은 다섯 곡을 큰 앨범 표지 카드로(순위 · 횟수 강조, 늘 표지)
 * - 6위부터: 많이 들은 순 — 1열 위에서 아래로, 다음 열…(성불 50곡 미만이면 표지)
 * - 아래: 생성일 · 참전 기록 페이지 주소 · QR
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
  const owner = nickname.trim() ? `${nickname.trim()}의` : "나의";
  const top = summary.heard.slice(0, layout.topCount);
  const rest = summary.heard.slice(layout.topCount);
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
      {/* 머리 — 작은 제목 + 숫자, 오른쪽 위 작은 로고 */}
      <div
        style={{
          height: SHARE_HEADER_HEIGHT,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.8)",
              ...ellipsis,
            }}
          >
            {owner} ZUTOMAYO 라이브 참전 기록
          </div>
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "baseline",
              gap: 32,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{ display: "flex", alignItems: "baseline", gap: 10 }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: stat.label === "성불" ? MAGENTA : "#fff",
                  }}
                >
                  {stat.value}
                </span>
                <span style={{ fontSize: 22, opacity: 0.7 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt=""
          style={{
            height: 40,
            width: "auto",
            flex: "none",
            filter: LOGO_OUTLINE,
          }}
        />
      </div>

      <div style={{ height: SECTION_GAP }} />

      {/* TOP 5 */}
      <SectionLabel accent>TOP {layout.topCount}</SectionLabel>
      <div
        style={{
          display: "flex",
          justifyContent: layout.topCount < TOP_COUNT ? "center" : "flex-start",
          gap: TOP_GAP,
        }}
      >
        {top.map((song, index) => (
          <TopCard
            key={song.id}
            rank={index + 1}
            song={song}
            width={layout.topCardWidth}
          />
        ))}
      </div>

      {/* 6위부터 */}
      {layout.rest && (
        <>
          <div style={{ height: SECTION_GAP }} />
          <SectionLabel>
            {layout.topCount + 1}위부터 · {rest.length}곡
          </SectionLabel>
          <RestList
            songs={rest}
            layout={layout.rest}
            firstRank={layout.topCount + 1}
          />
        </>
      )}

      <div style={{ flex: 1 }} />
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

function SectionLabel({
  accent = false,
  children,
}: {
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: SECTION_LABEL_HEIGHT,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "0.12em",
        lineHeight: 1,
        color: accent ? MAGENTA : "rgba(255,255,255,0.55)",
      }}
    >
      {children}
    </div>
  );
}

function Cover({
  src,
  size,
  radius,
}: {
  src: string | null;
  size: number;
  radius: number;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shareImageSrc(src)}
      alt=""
      crossOrigin="anonymous"
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: radius,
        flex: "none",
        display: "block",
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "rgba(255,255,255,0.08)",
        flex: "none",
      }}
    />
  );
}

/** TOP 카드 — 큰 표지(왼쪽 위 순위 배지, 1위는 마젠타) + 원어 · 한국어 · 횟수 */
function TopCard({
  rank,
  song,
  width,
}: {
  rank: number;
  song: HeardSong;
  width: number;
}) {
  const badge = Math.round(width * 0.22);
  return (
    <div style={{ width, flex: "none", lineHeight: LINE_HEIGHT }}>
      <div style={{ position: "relative" }}>
        <Cover src={song.coverSrc} size={width} radius={10} />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: badge,
            height: badge,
            borderRadius: 8,
            background: rank === 1 ? MAGENTA : "rgba(5,2,35,0.82)",
            color: "#fff",
            fontSize: Math.round(badge * 0.58),
            fontWeight: 700,
            lineHeight: `${badge}px`,
            textAlign: "center",
          }}
        >
          {rank}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            ...ellipsis,
            fontSize: TOP_TEXT.titlePx,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {song.title}
        </div>
        <div style={{ ...ellipsis, fontSize: TOP_TEXT.subPx, opacity: 0.7 }}>
          {song.titleKo}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: TOP_TEXT.countPx,
            fontWeight: 700,
            color: MAGENTA,
          }}
        >
          {song.count}회
        </div>
      </div>
    </div>
  );
}

/** 6위부터 목록 — 순위 · (표지) · 원어 / 한국어(/ 영어) · 탤리 */
function RestList({
  songs,
  layout,
  firstRank,
}: {
  songs: HeardSong[];
  layout: RestLayout;
  firstRank: number;
}) {
  const rows = Math.max(1, Math.ceil(songs.length / layout.columns));
  const tallySize = Math.max(6, Math.round(layout.subPx * 0.95));
  return (
    <div
      style={{
        height: restAreaHeight(),
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
      {songs.map((song, index) => (
        <div
          key={song.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: Math.max(4, Math.round(layout.subPx * 0.5)),
            paddingBottom: layout.rowGapPx,
            minWidth: 0,
          }}
        >
          <span
            style={{
              flex: "none",
              minWidth: Math.round(layout.subPx * 1.4),
              fontSize: layout.subPx,
              fontWeight: 700,
              opacity: 0.45,
              textAlign: "right",
            }}
          >
            {firstRank + index}
          </span>
          {layout.showCover && (
            <Cover
              src={song.coverSrc}
              size={layout.coverPx}
              radius={Math.max(2, Math.round(layout.coverPx / 10))}
            />
          )}
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
            <div style={{ ...ellipsis, fontSize: layout.subPx, opacity: 0.75 }}>
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
  );
}

/**
 * 이미지 만들기에 쓰는 R2 커버 주소 — 페이지의 <img>가 CORS 헤더 없이 받아 둔
 * 캐시를 html-to-image의 fetch가 다시 쓰면 CORS에 막히므로, 주소에 표시를 붙여
 * 따로 받는다(RULES.md). 같은 출처(로고 등)는 그대로.
 */
function shareImageSrc(url: string): string {
  if (!/^https?:/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}share=1`;
}
