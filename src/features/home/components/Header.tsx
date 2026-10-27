import Image from "next/image";
import { artist } from "@/data/artist";
import { cn } from "@/lib/utils";
import { LOGO } from "@/lib/seo";

export function Header({ artist }: { artist: artist }) {
  return (
    // 모바일에선 화면에 안 그리지만(로고는 MobileHeader가 보여줌) h1은 남겨서
    // 스크린 리더·검색엔진이 어느 화면 폭에서든 페이지 제목을 읽게 한다 —
    // hidden(display: none)이면 접근성 트리에서 빠진다.
    <header
      className={cn(
        "max-tablet:sr-only w-fit",
        "tablet:absolute tablet:top-8 tablet:left-8",
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
            "tablet:w-64 pc:w-72 h-auto",
            "[filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)_drop-shadow(0_4px_16px_rgba(0,0,0,0.6))]",
          )}
        />
        {/* 로고에 없는 아티스트명을 h1 텍스트에 포함시켜 검색 키워드로 잡히게 한다. */}
        <span className="sr-only">
          {` — ${artist.name.jp}(${artist.name.kr}) 비공식 팬페이지`}
        </span>
      </h1>
    </header>
  );
}
