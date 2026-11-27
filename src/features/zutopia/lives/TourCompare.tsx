import { SidePanel } from "@/components/SidePanel";
import { cn } from "@/lib/utils";
import { formatKoreanMonthDay } from "@/lib/ymd";
import { FOCUS_RING } from "@/components/button-styles";
import { STAMP_TONE } from "@/features/zutopia/lives/SetlistChangeLine";
import { songRowTint } from "@/features/zutopia/lives/SongLink";
import { matchSetlists } from "@/features/zutopia/lives/setlist-diff";
import { setlistTitles } from "@/features/zutopia/song-db/song-title";
import { formatDayShow } from "@/features/zutopia/lives/shows";
import { comparableDates } from "@/features/zutopia/lives/tour-compare";
import type {
  LiveSetlistEntry,
  TourDateEntry,
} from "@/features/zutopia/lives/types";

/** 고르기 목록·칼럼 머리의 공연일 이름 — "오사카 4월 21일 DAY 2". */
function dateName(date: TourDateEntry) {
  return [
    date.city,
    formatKoreanMonthDay(date.startDate),
    formatDayShow(date.dayNumber, date.showLabel),
  ]
    .filter(Boolean)
    .join(" ");
}

const byPosition = (a: LiveSetlistEntry, b: LiveSetlistEntry) =>
  Number(a.isEncore) - Number(b.isEncore) || a.trackNumber - b.trackNumber;

type Mark = { label: string; tone: string; detail?: string };

/**
 * 투어 상세 "세트리스트 비교하기" — 공연일 두 개(A·B)를 골라 두 세트리스트를 나란히
 * 놓고, A에만 있는 곡은 "빠짐", B에만 있는 곡은 "추가", 둘 다 있는데 순서가 바뀐 곡은
 * B 쪽에 "순서 변경"(A n번 → B m번)을 붙인다(setlist-diff.ts matchSetlists — 번호만 밀린
 * 곡은 표시 안 함). 창은 SidePanel(모바일 아래 시트, 태블릿 이상 오른쪽 넓은 패널).
 */
export function TourCompare({
  open,
  dates,
  pair,
  onPairChange,
  onClose,
}: {
  open: boolean;
  dates: TourDateEntry[];
  pair: [string, string];
  onPairChange: (pair: [string, string]) => void;
  onClose: () => void;
}) {
  const options = comparableDates(dates);
  const a = options.find((date) => date.id === pair[0]);
  const b = options.find((date) => date.id === pair[1]);
  const aEntries = [...(a?.setlist ?? [])].sort(byPosition);
  const bEntries = [...(b?.setlist ?? [])].sort(byPosition);
  const { removed, added, moved } = matchSetlists(aEntries, bEntries);
  const marks = new Map<LiveSetlistEntry, Mark>();
  for (const entry of removed)
    marks.set(entry, { label: "빠짐", tone: STAMP_TONE["제거"] });
  for (const entry of added)
    marks.set(entry, { label: "추가", tone: STAMP_TONE["추가"] });
  for (const { from, to } of moved)
    marks.set(to, {
      label: "순서 변경",
      tone: STAMP_TONE["순서 변경"],
      detail: `A ${from.trackNumber}번 → B ${to.trackNumber}번`,
    });
  const same = !!a && !!b && marks.size === 0;

  const picker = (side: 0 | 1) => (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="font-mono text-sm text-white/60">
        {side === 0 ? "A" : "B"}
      </span>
      <select
        value={pair[side]}
        onChange={(event) => {
          const next: [string, string] = [...pair];
          next[side] = event.target.value;
          onPairChange(next);
        }}
        className={cn(
          "w-full min-w-0 rounded-control border border-white/15 bg-white/[0.04] px-2 py-1.5 text-sm text-white",
          FOCUS_RING,
        )}
      >
        {options.map((date) => (
          <option key={date.id} value={date.id} className="bg-background">
            {dateName(date)}
          </option>
        ))}
      </select>
    </label>
  );

  const column = (entries: LiveSetlistEntry[]) => (
    <ol className="flex min-w-0 flex-col divide-y divide-white/10">
      {entries.map((entry) => {
        const mark = marks.get(entry);
        return (
          <li
            key={`${entry.trackNumber}-${entry.songId}`}
            className={cn(
              "flex min-w-0 flex-col gap-0.5 px-2 py-1.5",
              songRowTint(entry.isEncore, false),
            )}
          >
            <span className="flex min-w-0 items-baseline gap-2 text-sm">
              <span
                className={cn(
                  "w-6 shrink-0 text-right font-mono text-white/45",
                  entry.isEncore && "text-ztmy-sun",
                )}
              >
                {entry.isEncore
                  ? "EN"
                  : String(entry.trackNumber).padStart(2, "0")}
              </span>
              <span className="truncate text-white">
                {entry.medley
                  ? `메들리 ${entry.medley.length}곡`
                  : setlistTitles(entry).primary}
              </span>
            </span>
            {mark && (
              <span className="flex flex-wrap items-center gap-x-1.5 pl-8 text-sm">
                <span className={cn("font-bold", mark.tone)}>{mark.label}</span>
                {mark.detail && (
                  <span className="text-white/65">{mark.detail}</span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <SidePanel
      open={open}
      title="세트리스트 비교"
      onClose={onClose}
      size="wide"
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          {picker(0)}
          {picker(1)}
        </div>
        {same && (
          <p className="text-sm text-white/65">같은 세트리스트입니다.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[a, b].map((date, side) => (
            <div key={side} className="min-w-0">
              <p className="mb-1 truncate px-2 text-sm font-semibold text-white">
                {side === 0 ? "A" : "B"} · {date ? dateName(date) : ""}
              </p>
              {column(side === 0 ? aEntries : bEntries)}
            </div>
          ))}
        </div>
      </div>
    </SidePanel>
  );
}
