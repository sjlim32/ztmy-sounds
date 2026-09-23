import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ZUTOPIA_CATEGORIES,
  getZutopiaCategory,
} from "@/features/zutopia/registry";
import { LiveListView } from "@/features/zutopia/lives/components/LiveListView";

export function generateStaticParams() {
  return ZUTOPIA_CATEGORIES.map((category) => ({ category: category.slug }));
}

export default async function ZutopiaCategoryPage(
  props: PageProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  const entries = await category.getEntries();

  if (entries.length === 0) {
    return (
      <p className={cn("text-base text-white/50", "tablet:text-lg")}>
        아직 등록된 항목이 없습니다.
      </p>
    );
  }

  // "lives" 카테고리는 형식(페스티벌/단독 공연)·연도 필터가 있는 전용 목록
  // 뷰를 쓴다 — 다른 카테고리가 생기면 그때 자기 형식에 맞는 뷰를 고르면
  // 되고, 지금은 이 분기 하나로 충분하다(카테고리가 하나뿐이라 범용 플러그인
  // 구조를 미리 만들지 않는다).
  if (category.slug === "lives") {
    return <LiveListView categorySlug={category.slug} entries={entries} />;
  }

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2", "pc:grid-cols-3")}>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/zutopia/${category.slug}/${entry.slug}`}
            className="group relative block aspect-square overflow-hidden rounded-lg bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          >
            {entry.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.thumbnail}
                alt={entry.name}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
              />
            ) : (
              <div className="h-full w-full bg-white/5" />
            )}
            {/* 제목/날짜를 이미지 위에 얹으므로, 밑에서 위로 어두워지는
            스크림이 있어야 밝은 이미지 위에서도 글자가 읽힌다. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
                {entry.label}
              </p>
              <p className="mt-1 text-sm text-white/70">{entry.date}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
