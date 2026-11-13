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
        "tablet:absolute tablet:top-8 tablet:left-10",
      )}
    >
      {/* 로고와 소개 문구를 한 덩어리로 — 폭은 로고 폭 그대로(w-fit). 문구는 로고
      그림 아래쪽 빈 칸(SOUNDS 글자 밑, 그림 높이의 약 19%)으로 끌어올려 오른쪽
      끝에 맞춰, SOUNDS에 붙은 부제처럼 보이게 한다. 끌어올리는 양은 퍼센트
      margin이라 로고 폭(=이 덩어리 폭) 기준으로 화면 크기와 함께 줄어든다. */}
      <div className="w-fit">
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

        {/* 처음 온 사람에게 사이트가 뭘 하는 곳인지 알려주는 한 줄 — 로고의
        굵고 기운 글자와 어울리게 굵은 헤드라인 글씨. */}
        <p
          className={cn(
            "relative -mt-[5.5%] pr-[1%] text-right text-sm leading-none font-extrabold tracking-tight text-white",
            // 아주 낮은 화면(xlow)에서 로고가 작아지면 글자도 한 단계 작게 — 왼쪽
            // 캐릭터 신발과 겹치지 않게(short 단계는 그대로 둬도 겹치지 않는다).
            "pc:text-base",
            "tablet:xlow:text-xs pc:xlow:text-sm",
            "[text-shadow:0_0_2px_#1d1a55,0_2px_8px_rgba(0,0,0,0.8)]",
          )}
        >
          {SITE_TAGLINE}
        </p>
      </div>
    </header>
  );
}
