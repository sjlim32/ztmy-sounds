import { artist } from "@/app/(pages)/page";

export function Header({ artist }: { artist: artist }) {
  return (
    <header className="flex items-start justify-between gap-4 px-10 py-6">
      <span className="text-3xl font-extrabold tracking-tight sm:text-6xl">
        {artist.name.jp}
      </span>
    </header>
  );
}
