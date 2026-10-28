import Image from "next/image";
import { artist } from "@/data/artist";
import { cn } from "@/lib/utils";
import { LOGO, SITE_TAGLINE } from "@/lib/seo";

export function Header({ artist }: { artist: artist }) {
  return (
    // 모바일에선 로고를 MobileHeader가 보여주므로 헤더 전체(로고·소개 문구)를
    // 화면에서만 감추고 h1은 남긴다 — hidden(display: none)이면 접근성
    // 트리에서 빠진다.
    <header
      className={cn(
        "max-tablet:sr-only",
        "tablet:absolute tablet:top-8 tablet:left-10 tablet:flex tablet:flex-col tablet:items-start",
      )}
    >
      <h1>
        {/* 로고 글자가 남색이라 어두운 배경에 묻혀서, 흰 테두리 + 그림자로
        스티커처럼 띄운다. */}
        <Image
          src={LOGO.src}
          alt={LOGO.alt}
          width={LOGO.width}
          height={LOGO.height}
          preload
          className={cn(
            "h-auto",
            // 화면이 낮으면(880px 이하) 아래 공연 카드 자리를 위해 한 단계 작게,
            // 700px 이하면 한 단계 더.
            "tablet:w-64 pc:w-80 pc:short:w-72",
            "tablet:xlow:w-52 pc:xlow:w-60",
            "[filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)_drop-shadow(0_4px_16px_rgba(0,0,0,0.6))]",
          )}
        />
        {/* 로고에 없는 아티스트명을 h1 텍스트에 포함시켜 검색 키워드로 잡히게 한다. */}
        <span className="sr-only">
          {` — ${artist.name.jp}(${artist.name.kr}) 비공식 팬페이지`}
        </span>
      </h1>

      {/* 처음 온 사람에게 사이트가 뭘 하는 곳인지 알려주는 한 줄. */}
      <p
        className={cn(
          "mt-1 pl-1 text-sm font-medium text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]",
          "pc:text-base",
        )}
      >
        {SITE_TAGLINE}
      </p>
    </header>
  );
}
