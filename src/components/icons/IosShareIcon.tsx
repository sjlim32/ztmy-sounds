/**
 * iOS Safari 공유 버튼과 같은 모양(위로 향한 화살표 + 위가 뚫린 상자) —
 * "홈 화면에 추가" 안내에서 실제로 눌러야 할 버튼을 시각적으로 가리키기
 * 위한 용도라, 사이트의 일반 ShareIcon(점 3개 네트워크 아이콘)과는 다른
 * 모양이 필요하다.
 */
export function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
    </svg>
  );
}
