import { cn } from "@/lib/utils";
import { ARTIST } from "@/data/artist";
import {
  ZUTOPIA_CATEGORIES,
  summarizeEntryTypes,
} from "@/features/zutopia/registry";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";
import { ZutopiaSectionHeader } from "@/features/zutopia/components/ZutopiaSectionHeader";
import { getSongsCount, getAlbumsCount } from "@/features/zutopia/song-db/data";

export default async function ZutopiaHubPage() {
  const [songCount, albumCount] = await Promise.all([
    getSongsCount(),
    getAlbumsCount(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <ZutopiaSectionHeader
        title="ZUTOPIA"
        description={`${ARTIST.name.jp} 기록 저장소`}
      />

      <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
        <li>
          <ZutopiaHubCard
            href="/zutopia/songs"
            title="디스코그래피"
            description="전체 곡과 앨범 목록"
            meta={`${songCount}곡 · ${albumCount}개 앨범`}
            imageUrl="/assets/zutopia/components/song_db.webp"
          />
        </li>

        {ZUTOPIA_CATEGORIES.map((category) => (
          <li key={category.slug}>
            <ZutopiaHubCard
              href={`/zutopia/${category.slug}`}
              title={category.label}
              description={category.description}
              meta={summarizeEntryTypes(category.entries)}
              imageUrl={category.image}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
