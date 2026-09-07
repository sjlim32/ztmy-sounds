import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getZutopiaCategory } from "@/features/zutopia/registry";

export async function generateMetadata(
  props: LayoutProps<"/zutopia/[category]">,
): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
  };
}

/**
 * 카테고리 하나(예: "지난 공연") 안에서 목록 페이지와 항목 상세 페이지가
 * 공유하는 레이아웃 — 탭처럼 보이는 nav로 그 카테고리 안의 항목들을
 * 전환합니다. 항목마다 실제 URL(/zutopia/[category]/[slug])이 따로 있는
 * "독립 라우트" 구조라, 북마크/공유가 그대로 되고 항목별 SEO 메타데이터도
 * 분리됩니다.
 */
export default async function ZutopiaCategoryLayout(
  props: LayoutProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase">
        {category.label}
      </p>

      <nav
        aria-label={category.label}
        className="mt-3 flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        <Link
          href={`/zutopia/${category.slug}`}
          className="hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white"
        >
          전체
        </Link>
        {category.entries.map((entry) => (
          <Link
            key={entry.slug}
            href={`/zutopia/${category.slug}/${entry.slug}`}
            className="hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{props.children}</div>
    </div>
  );
}
