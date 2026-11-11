import { cn } from "@/lib/utils";
import { thumbSrc } from "@/lib/thumb";
import { ARTIST } from "@/data/artist";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";
import { summarizeEntryTypes } from "@/features/zutopia/types";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";
import { getSongsCount, getAlbumsCount } from "@/features/zutopia/song-db/data";
import { getLiveHistory } from "@/features/zutopia/live-history/data";
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
    songCounts,
    albumCount,
    searchIndex,
    liveHistory,
    categoryCards,
    statSections,
  ] = await Promise.all([
    getSongsCount(),
    getAlbumsCount(),
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

  // 통계 카드 하단·그림 — 라이브 최다 곡(1위)과 그 곡 표지.
  const topSong = statSections
    .flatMap((section) => section.records)
    .find((record) => record.id === "song-most-played")?.rows[0];
  const statRecordCount = statSections.reduce(
    (sum, section) => sum + section.records.length,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 페이지 이름은 헤더(SiteHeader)에 있어서 본문 제목은 화면 읽기·검색
      노출용으로만 둔다. */}
      <h1 className="sr-only">{`즛토피아 — ${ARTIST.name.jp} 기록 저장소`}</h1>

      {/* 검색어가 있으면 아래 카드 대신 곡·앨범·공연 검색 결과가 나온다. */}
      <ZutopiaSearch index={searchIndex}>
        {/* 모바일도 2열 — 카드가 한 화면에 보이게. PC는 한 줄 다섯 장(정사각형이라
            두 줄로 두면 화면보다 커진다). */}
        <ul
          className={cn(
            "grid grid-cols-2 gap-3",
            "tablet:gap-4",
            "pc:grid-cols-5",
          )}
        >
          <li>
            <ZutopiaHubCard
              href="/zutopia/songs"
              title="디스코그래피"
              description="발매곡과 앨범, 곡별 라이브 기록"
              meta={`${songCounts.released}곡${
                songCounts.unreleased > 0
                  ? ` (미공개 ${songCounts.unreleased}곡)`
                  : ""
              } · ${albumCount}개 앨범`}
              imageUrl="/assets/zutopia/components/song_db.webp"
            />
          </li>

          {categoryCards.map(({ category, entries }) => (
            <li key={category.slug}>
              <ZutopiaHubCard
                href={`/zutopia/${category.slug}`}
                title={category.label}
                description={category.description}
                meta={summarizeEntryTypes(entries)}
                imageUrl={category.image}
              />
            </li>
          ))}

          <li>
            <ZutopiaHubCard
              href="/zutopia/attendance"
              title="라이브 참전 기록"
              description="참전한 라이브 체크하고 들은 곡 모아보기"
              meta={`공연 ${liveHistory.units.length}회 중 몇 번이나 참가했을까`}
              imageUrl={ATTENDANCE_CARD_IMAGE}
            />
          </li>
          <li>
            <ZutopiaHubCard
              href="/zutopia/timeline"
              title="활동 연혁"
              description="ZUTOMAYO 활동 총 정리"
              meta={`${firstYear} – ${thisYear} · ${thisYear - firstYear + 1}년`}
              imageUrl={TIMELINE_CARD_IMAGE}
            />
          </li>
          {/* 다섯째 카드 — 모바일·태블릿(2열)은 한 줄을 다 차지하는 가로 카드,
              PC는 다섯 장 한 줄. */}
          <li className="pc:col-span-1 col-span-2">
            <ZutopiaHubCard
              href="/zutopia/stats"
              title="통계"
              description="가장 많이 불린 곡부터 가장 긴 투어까지, 곡·앨범·공연·장소별 기록"
              meta={""}
              imageUrl={
                topSong?.image ? thumbSrc(topSong.image, 360) : undefined
              }
              className="pc:aspect-square aspect-[2/1]"
            />
          </li>
        </ul>
      </ZutopiaSearch>
    </div>
  );
}
