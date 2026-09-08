import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { ZUTOPIA_CATEGORIES, getZutopiaCategory } from "@/features/zutopia/registry";

export function generateStaticParams() {
  return ZUTOPIA_CATEGORIES.map((category) => ({ category: category.slug }));
}

export default async function ZutopiaCategoryPage(
  props: PageProps<"/zutopia/[category]">,
) {
  const { category: slug } = await props.params;
  const category = getZutopiaCategory(slug);
  if (!category) notFound();

  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      {category.entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/zutopia/${category.slug}/${entry.slug}`}
            className="group block overflow-hidden rounded-lg bg-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.thumbnail}
              alt={entry.name}
              loading="lazy"
              className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80"
            />
            <div className="p-4">
              <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
                {entry.label}
              </p>
              <p className="mt-1 text-sm text-white/50">{entry.date}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
