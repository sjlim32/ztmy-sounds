import { artist } from "@/data/artist";
import clsx from "clsx";

export function Header({ artist }: { artist: artist }) {
  return (
    <header
      className={clsx(
        "font-mkpop hidden items-end font-extrabold tracking-tight",
        "tablet:flex tablet:absolute top-6 left-6 w-fit flex-col",
      )}
    >
      <span className="pc:text-6xl tablet:text-5xl">{artist.name.jp}</span>
      <span className="pc:text-4xl tablet:text-3xl">
        {artist.name.en} FAN PAGE
      </span>
    </header>
  );
}
