import { INFO_SECTIONS } from "@/features/info/info";

export function TableOfContents() {
  return (
    <nav
      aria-label="목차"
      className="tablet:top-4 tablet:flex-row fixed inset-x-0 top-14 z-20 mx-auto flex w-fit flex-col items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm"
    >
      <span className="tablet:block hidden text-sm text-white/70">
        바로가기
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {INFO_SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="hover:border-ztmy-magenta/60 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
