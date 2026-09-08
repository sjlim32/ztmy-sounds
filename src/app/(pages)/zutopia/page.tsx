import Link from "next/link";
import { cn } from "@/lib/utils";
import { ZUTOPIA_CATEGORIES } from "@/features/zutopia/registry";

export default function ZutopiaHubPage() {
  return (
    <ul className={cn("grid gap-4", "tablet:grid-cols-2")}>
      <li>
        <Link
          href="/zutopia/songs"
          className="hover:border-ztmy-magenta/60 group block rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
        >
          <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
            노래 DB
          </p>
          <p className="mt-1 text-sm text-white/50">전체 곡과 앨범 목록</p>
        </Link>
      </li>

      {ZUTOPIA_CATEGORIES.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/zutopia/${category.slug}`}
            className="hover:border-ztmy-magenta/60 group block rounded-lg border border-white/10 bg-black/30 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/40"
          >
            <p className="hover:text-ztmy-pink text-lg font-semibold text-white transition-colors">
              {category.label}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {category.description}
            </p>
            <p className="mt-2 font-mono text-xs text-white/40">
              {category.entries.length}개 항목
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
