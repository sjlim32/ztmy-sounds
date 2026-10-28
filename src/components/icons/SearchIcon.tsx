export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="M16 16l4.5 4.5" />
    </svg>
  );
}
