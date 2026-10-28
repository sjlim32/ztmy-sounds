import { cn } from "@/lib/utils";
import { ARTIST } from "@/data/artist";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";
import { summarizeEntryTypes } from "@/features/zutopia/types";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";
import { getSongsCount, getAlbumsCount } from "@/features/zutopia/song-db/data";
import { getZutopiaSearchIndex } from "@/features/zutopia/search/data";
import { ZutopiaSearch } from "@/features/zutopia/search/components/ZutopiaSearch";

export default async function ZutopiaHubPage() {
  const [songCounts, albumCount, searchIndex, categoryCards] =
    await Promise.all([
      getSongsCount(),
      getAlbumsCount(),
      getZutopiaSearchIndex(),
      Promise.all(
        ZUTOPIA_CATEGORIES.map(async (category) => ({
          category,
          entries: await category.getEntries(),
        })),
      ),
    ]);

  return (
    <div className="flex flex-col gap-8">
      {/* 페이지 이름은 헤더(SiteHeader)에 있어서 본문 제목은 화면 읽기·검색
      노출용으로만 둔다. */}
      <h1 className="sr-only">{`즛토피아 — ${ARTIST.name.jp} 기록 저장소`}</h1>

      {/* 검색어가 있으면 아래 카드 대신 곡·앨범·공연 검색 결과가 나온다. */}
      <ZutopiaSearch index={searchIndex}>
        <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
          <li>
            <ZutopiaHubCard
              href="/zutopia/songs"
              title="디스코그래피"
              description="전체 곡과 앨범 목록"
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
        </ul>
      </ZutopiaSearch>
    </div>
  );
}
