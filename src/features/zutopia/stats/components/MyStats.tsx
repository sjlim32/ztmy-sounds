"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThumbImage } from "@/components/ThumbImage";
import { cn } from "@/lib/utils";
import { FOCUS_RING, LINK_BUTTON_CLASS } from "@/components/button-styles";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";
import { useAttendedUnits } from "@/features/zutopia/attendance/useAttendedUnits";
import { summarizeMine, type MyStatSong, type MyStatsData } from "../my-stats";

const ATTENDANCE_HREF = "/zutopia/attendance";

// 처음 필요할 때 한 번 받는다(실패하면 다음에 다시).
let dataPromise: Promise<MyStatsData> | null = null;
function loadData() {
  dataPromise ??= fetch("/zutopia/stats-me.json")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<MyStatsData>;
    })
    .catch((error: unknown) => {
      dataPromise = null;
      throw error;
    });
  return dataPromise;
}

/**
 * 통계 페이지의 "내 기록" — 참전 기록에서 체크한 공연으로 다녀온 공연일, 라이브로
 * 들은 곡, 내가 들은 희귀곡(전체 라이브 횟수가 적은 곡), 아직 못 들은 인기곡(참가율이
 * 높은 곡)을 보여 준다. 체크가 없으면 참전 기록으로 가는 한 줄만. 체크는 이
 * 브라우저에만 있어서 정적 HTML 단계(ready false)에선 그리지 않는다.
 */
export function MyStats() {
  const { ready, attended } = useAttendedUnits();
  const [data, setData] = useState<MyStatsData | null>(null);
  const [failed, setFailed] = useState(false);
  const hasChecks = ready && attended.size > 0;

  useEffect(() => {
    if (!hasChecks || data || failed) return;
    let cancelled = false;
    loadData().then(
      (loaded) => !cancelled && setData(loaded),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [hasChecks, data, failed]);

  if (!ready) return null;
  if (!hasChecks)
    return (
      <p
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-white/70",
          ZUTOPIA_SURFACE_CLASS,
        )}
      >
        다녀온 공연을 체크하면 내가 들은 곡과 아직 못 들은 곡이 여기에 보여요.
        <Link href={ATTENDANCE_HREF} className={LINK_BUTTON_CLASS}>
          참전 기록 체크하기
        </Link>
      </p>
    );

  return (
    <section
      aria-labelledby="my-stats-title"
      className={cn(
        "flex flex-col gap-4 p-4",
        "tablet:p-5",
        ZUTOPIA_SURFACE_CLASS,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="my-stats-title"
          className="tablet:text-lg text-base font-semibold text-white"
        >
          내 기록
        </h2>
        <Link href={ATTENDANCE_HREF} className={LINK_BUTTON_CLASS}>
          참전 기록 고치기
        </Link>
      </header>

      {failed ? (
        <p role="status" className="text-sm text-white/60">
          내 기록을 불러오지 못했어요.{" "}
          <button
            type="button"
            onClick={() => setFailed(false)}
            className={cn(
              "rounded text-white underline decoration-white/40 underline-offset-4",
              FOCUS_RING,
            )}
          >
            다시 시도
          </button>
        </p>
      ) : !data ? (
        <p role="status" className="text-sm text-white/55">
          불러오는 중…
        </p>
      ) : (
        <MySummaryView data={data} attended={attended} />
      )}
    </section>
  );
}

function MySummaryView({
  data,
  attended,
}: {
  data: MyStatsData;
  attended: ReadonlySet<string>;
}) {
  const summary = summarizeMine(data, attended);
  const ratio = summary.total ? summary.heard / summary.total : 0;
  return (
    <div className="flex flex-col gap-5">
      <dl className="tablet:grid-cols-2 grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-white/60">다녀온 공연일</dt>
          <dd className="text-2xl font-semibold text-white tabular-nums">
            {summary.attended}회
          </dd>
          {summary.known < summary.attended && (
            <dd className="text-sm break-keep text-white/55">
              {summary.known > 0
                ? `${summary.attended - summary.known}회는 세트리스트가 없거나 투어 공통 곡만 있어요`
                : "체크한 공연은 아직 세트리스트가 없거나 투어 공통 곡만 있어요"}
            </dd>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-white/60">라이브로 들은 곡</dt>
          <dd className="text-2xl font-semibold text-white tabular-nums">
            {summary.heard}
            <span className="text-base text-white/55">
              {" "}
              / 발매곡 {summary.total}곡
            </span>
          </dd>
          <dd
            aria-hidden
            className="bg-ztmy-pink/20 mt-1 h-2 overflow-hidden rounded-full"
          >
            <span
              className="bg-ztmy-pink block h-full rounded-full"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </dd>
        </div>
      </dl>

      <div className="tablet:grid-cols-2 grid grid-cols-1 gap-5">
        <SongList
          title="내가 들은 희귀곡"
          empty="세트리스트를 아는 공연을 체크하면 보여요."
          songs={summary.rare}
          value={(song) => `전체 ${song.played}회`}
        />
        <SongList
          title="아직 못 들은 인기곡"
          empty={
            summary.known > 0
              ? "많이 부르는 곡은 다 들었어요."
              : "세트리스트를 아는 공연을 체크하면 보여요."
          }
          songs={summary.missed}
          value={(song) => `참가율 ${Math.round(song.rate! * 100)}%`}
          note={
            summary.known > 0 && summary.known < summary.attended
              ? `세트리스트를 모르는 ${summary.attended - summary.known}회에서 들었을 수도 있어요`
              : null
          }
        />
      </div>
    </div>
  );
}

function SongList({
  title,
  empty,
  songs,
  value,
  note = null,
}: {
  title: string;
  empty: string;
  songs: MyStatSong[];
  value: (song: MyStatSong) => string;
  /** 목록 아래 안내 한 줄 */
  note?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      {songs.length === 0 ? (
        <p className="text-sm text-white/50">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center gap-3 text-sm">
              {song.image ? (
                <ThumbImage
                  src={song.image}
                  displayWidth={32}
                  className="size-8 shrink-0 rounded bg-black/40 object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="size-8 shrink-0 rounded bg-white/5"
                />
              )}
              <Link
                href={song.href}
                className={cn(
                  "min-w-0 flex-1 truncate rounded-sm text-white/85 transition-colors hover:text-white hover:underline hover:decoration-white/40 hover:underline-offset-4",
                  FOCUS_RING,
                )}
              >
                {song.name}
              </Link>
              <span className="shrink-0 text-white/60 tabular-nums">
                {value(song)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {note && <p className="text-sm break-keep text-white/50">{note}</p>}
    </div>
  );
}
