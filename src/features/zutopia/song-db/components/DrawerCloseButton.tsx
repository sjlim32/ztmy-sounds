interface DrawerCloseButtonProps {
  onClick: () => void;
}

/** SongDetailPanel/AlbumDetailPanel이 공유하는 드로어 상단 닫기(✕) 버튼. */
export function DrawerCloseButton({ onClick }: DrawerCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="닫기"
      className="-m-2 shrink-0 p-2 text-white/60 transition-colors hover:text-white"
    >
      ✕
    </button>
  );
}
