import { cn } from "@/lib/utils";
import { thumbSrc } from "@/lib/thumb";
import { ARTIST } from "@/data/artist";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";
import { summarizeEntryTypes } from "@/features/zutopia/types";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";
import {
  getAlbumCounts,
  getReleasedSongCount,
} from "@/features/zutopia/song-db/data";
import {
  ALBUM_TYPE_ORDER,
  ALBUM_TYPE_SHORT_LABEL,
} from "@/features/zutopia/song-db/labels";
import { getLiveHistory } from "@/features/zutopia/live-history/data";
import { inPersonUnits } from "@/features/zutopia/live-history/units";
import { koreaDate } from "@/lib/korea-date";
import { getZutopiaSearchIndex } from "@/features/zutopia/search/data";
import { ZutopiaSearch } from "@/features/zutopia/search/components/ZutopiaSearch";
import { getStatSections } from "@/features/zutopia/stats/data";

// 참전 기록·연혁 카드 그림 — 투어 키 비주얼과 최신 정규 앨범 표지(R2, 줄여 받기).
const ATTENDANCE_CARD_IMAGE = thumbSrc(
  "https://assets.ztmy-sounds.fans/concert/2026/zomcra_kv.webp",
  360,
);
const TIMELINE_CARD_IMAGE = thumbSrc(
  "https://assets.ztmy-sounds.fans/full-album/04_keisoudo_jk.webp",
  360,
);

export default async function ZutopiaHubPage() {
  const [
    releasedSongCount,
    albumCounts,
    searchIndex,
    liveHistory,
    categoryCards,
    statSections,
  ] = await Promise.all([
    getReleasedSongCount(),
    getAlbumCounts(),
    getZutopiaSearchIndex(),
    getLiveHistory(),
    Promise.all(
      ZUTOPIA_CATEGORIES.map(async (category) => ({
        category,
        entries: await category.getEntries(),
      })),
    ),
    getStatSections(),
  ]);

  // 연혁 카드 하단 — 첫 발매 연도부터 올해까지. 검색 인덱스에 곡 발매 연도가
  // 이미 있어서 따로 조회하지 않는다.
  const firstYear = Math.min(
    ...searchIndex.songs
      .map((song) => Number(song.releaseYear))
      .filter(Boolean),
  );
  const thisYear = Number(koreaDate().slice(0, 4));

  // 통계 카드 그림 — 라이브 최다 곡(1위) 표지.
  const topSong = statSections
    .flatMap((section) => section.records)
    .find((record) => record.id === "song-most-played")?.rows[0];

  return (
    <div className="flex flex-col gap-8">
      {/* 페이지 이름은 헤더(SiteHeader)에 있어서 본문 제목은 화면 읽기·검색
      노출용으로만 둔다. */}
      <h1 className="sr-only">{`즛토피아 — ${ARTIST.name.jp} 기록 저장소`}</h1>

      {/* 검색어가 있으면 아래 카드 대신 곡·앨범·공연 검색 결과가 나온다. */}
      <ZutopiaSearch index={searchIndex}>
        {/* 아카이브(공식 기록 정리)와 플레이그라운드(직접 해 보는 것) 두 묶음을
            세로로 쌓는다. 한 줄 카드 수는 모바일·태블릿 2장, PC 4장으로 고정 —
            카드가 적은 묶음도 칸 크기는 같고 남는 칸은 비워 둔다. */}
        <div className="flex flex-col gap-8">
          <HubSection title="아카이브">
            <li>
              <ZutopiaHubCard
                href="/zutopia/songs"
                title="디스코그래피"
                // 미공개곡을 뺀 곡 수 + 앨범 종류별 수(없는 종류는 생략).
                meta={[
                  `${releasedSongCount}곡`,
                  ...ALBUM_TYPE_ORDER.filter(
                    (type) => albumCounts[type] > 0,
                  ).map(
                    (type) =>
                      `${ALBUM_TYPE_SHORT_LABEL[type]} ${albumCounts[type]}`,
                  ),
                ].join(" · ")}
                imageUrl="/assets/zutopia/components/song_db.webp"
              />
            </li>
            {categoryCards.map(({ category, entries }) => (
              <li key={category.slug}>
                <ZutopiaHubCard
                  href={`/zutopia/${category.slug}`}
                  title={category.label}
                  meta={summarizeEntryTypes(entries)}
                  imageUrl={category.image}
                />
              </li>
            ))}
            <li>
              <ZutopiaHubCard
                href="/zutopia/timeline"
                title="활동 연혁"
                meta={`${firstYear}–${thisYear} · ${thisYear - firstYear + 1}년간의 기록`}
                imageUrl={TIMELINE_CARD_IMAGE}
              />
            </li>
            <li>
              <ZutopiaHubCard
                href="/zutopia/stats"
                title="통계"
                meta="라이브에서 가장 많이 부른 곡 등 (스포 주의!)"
                imageUrl={
                  topSong?.image ? thumbSrc(topSong.image, 360) : undefined
                }
              />
            </li>
            <li>
              <ZutopiaHubCard href={null} title="블루레이" />
            </li>
            <li>
              <ZutopiaHubCard
                href="https://zutomayo.net/collabo/"
                title="콜라보"
                imageUrl="/assets/zutopia/components/collabo.webp"
              />
            </li>
          </HubSection>

          <HubSection title="플레이그라운드">
            <li>
              <ZutopiaHubCard
                href="/zutopia/attendance"
                title="라이브 참전 기록"
                meta={`${inPersonUnits(liveHistory.units).length}회 중 몇 번이나 참여했고, 어떤 곡을 들었을까?`}
                imageUrl={ATTENDANCE_CARD_IMAGE}
              />
            </li>
            <li>
              <ZutopiaHubCard href={null} title="퀴즈" />
            </li>
            <li>
              <ZutopiaHubCard href={null} title="퀴즈 통계" />
            </li>
          </HubSection>
        </div>
      </ZutopiaSearch>
    </div>
  );
}

/** 허브 카드 묶음 하나 — 이름 줄(통계 화면 묶음 제목과 같은 모양, 오른쪽 가는 선) + 카드 목록. */
function HubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        <span className="tablet:text-xl text-lg font-bold text-white">
          {title}
        </span>
        <span aria-hidden className="h-px flex-1 bg-white/15" />
      </h2>
      <ul
        className={cn(
          "grid grid-cols-2 gap-3",
          "tablet:gap-4",
          "pc:grid-cols-4",
        )}
      >
        {children}
      </ul>
    </section>
  );
}
