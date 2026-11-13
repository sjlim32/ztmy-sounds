import { cn } from "@/lib/utils";
import { ZUTOPIA_SURFACE_CLASS } from "@/features/zutopia/surface";

/**
 * 통계·라이브 참전 기록 맨 위에 늘 보이는 "데이터 추가 중!" 안내 — 세트리스트를
 * 채우는 중이라 곡 기록은 세트리스트가 있는 공연일만 반영된다는 것. 즛토피아 입장 팝업
 * (ZutopiaNotice)은 한 번 닫으면 안 보이니, 숫자를 보는 화면엔 이걸 둔다.
 * 세트리스트를 다 채우면 두 페이지에서 뺀다.
 *
 * 바탕은 공사 중 테이프처럼 옅은 분홍 사선 줄무늬 — 어두운 면 위에 겹쳐 글자는
 * 그대로 읽힌다. 색 띠·깜빡임 같은 장식은 쓰지 않는다.
 */
export function DataInProgressNotice() {
  return (
    <div
      role="note"
      className={cn(ZUTOPIA_SURFACE_CLASS, "overflow-hidden px-4 py-3")}
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-ztmy-pink) 16%, transparent) 0 12px, transparent 12px 24px)",
      }}
    >
      <p className={cn("text-base font-bold text-white", "tablet:text-lg")}>
        데이터 추가 중!
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm break-keep text-white/80",
          "tablet:text-base",
        )}
      >
        공연별 세트리스트를 하나씩 채우고 있어요. 곡 기록은 세트리스트가 있는
        공연일만 반영돼서 실제와 다를 수 있어요.
      </p>
    </div>
  );
}
