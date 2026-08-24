"use client";

import { usePathname } from "next/navigation";
import { ARTIST } from "@/data/artist";
import clsx from "clsx";

type externalObj = {
  name: string;
  url: string;
};

const EXT_OBJ: externalObj[] = [
  { name: "OFFICIAL WEB", url: "https://zutomayo.net" },
  {
    name: "YOUTUBE",
    url: "https://www.youtube.com/channel/UCv6P5nsS9rP4tDtFlqLU_QQ",
  },
  { name: "INSTAGRAM", url: "https://www.instagram.com/zutomayo" },
  { name: "X", url: "https://x.com/zutomayo" },
  {
    name: "SPOTIFY",
    url: "https://open.spotify.com/artist/38WbKH6oKAZskBhqDFA8Uj?si=FaQ7gjMSQHyhYYjvebzajg",
  },
];

/**
 * 모바일 전용 전역 저작권 푸터. 고정/sticky가 아니라 각 페이지 콘텐츠
 * 맨 아래에 일반 흐름으로 붙습니다.
 * 노래 가사 페이지(/guide/[songId])는 화면을 전부 가사에 쓰므로 표시하지 않습니다.
 */
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/guide/")) return null;

  return (
    <footer
      className={clsx("", "tablet:items-end tablet:justify-end tablet:flex")}
    >
      {/* PC */}
      <div className="tablet:flex hidden w-fit flex-col items-end justify-end p-3 text-xs text-gray-300">
        <div className="mb-1 w-full border-b border-gray-400 pb-1 text-end tracking-[0.4rem]">
          <span>© {ARTIST.name.jp}</span>
          <span>UNOFFICIAL FAN PAGE</span>
        </div>

        <nav className="flex gap-8">
          {EXT_OBJ.map((obj) => (
            <a
              key={`${obj.name} ${obj.url}`}
              href={obj.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={obj.name}
              className="text-xs tracking-widest opacity-70 transition-opacity hover:opacity-100"
            >
              {obj.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Mobile */}
      <div className="tablet:hidden flex flex-col justify-center gap-0.5 border-t border-white/10 py-1 text-center text-xs text-white/50">
        <div className="flex justify-center gap-2 tracking-wide">
          <span>© {ARTIST.name.jp}</span>
          <span>UNOFFICIAL FAN PAGE</span>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-4 px-2">
          {EXT_OBJ.map((obj) => (
            <a
              key={`${obj.name} ${obj.url}`}
              href={obj.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={obj.name}
              className={clsx(
                "text-xs tracking-widest opacity-70 transition-opacity hover:opacity-100",
              )}
            >
              {obj.name}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
