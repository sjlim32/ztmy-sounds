import { cn } from "@/lib/utils";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";
import { ZutopiaHubCard } from "@/features/zutopia/components/ZutopiaHubCard";

export default function ZutopiaHubPage() {
  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      <li>
        <ZutopiaHubCard
          href="/zutopia/songs"
          title="노래 DB"
          description="전체 곡과 앨범 목록"
        />
      </li>

      {ZUTOPIA_CATEGORIES.map((category) => (
        <li key={category.slug}>
          <ZutopiaHubCard
            href={`/zutopia/${category.slug}`}
            title={category.label}
            description={category.description}
            meta={`${category.entries.length}개 항목`}
            imageUrl={category.entries[0]?.thumbnail}
          />
        </li>
      ))}
    </ul>
  );
}
