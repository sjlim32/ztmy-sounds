import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/button-styles";

interface DrawerCloseButtonProps {
  onClick: () => void;
}

/**
 * 곡/앨범 드로어(SongDbDrawer) 오른쪽 위에 늘 떠 있는 닫기 버튼. 예전엔 제목 줄
 * 끝의 작은 ✕ 글자라 모바일에선 맨 위 커버 그림(높이 20rem) 아래에 묻혀 찾기
 * 어려웠다. 스크롤해도 같은 자리에 있고, 커버 그림 위에서도 보이게 어두운 바탕을
 * 깐다(40px, button-styles의 OVERLAY_ICON_BUTTON_CLASS).
 */
export function DrawerCloseButton({ onClick }: DrawerCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="닫기"
      className={cn(OVERLAY_ICON_BUTTON_CLASS, "h-10 w-10")}
    >
      <CloseIcon className="h-5 w-5" />
    </button>
  );
}
