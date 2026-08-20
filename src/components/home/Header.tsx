import Link from "next/link";
import { InfoPanel } from "@/components/guide/InfoPanel";

export function Header({ artist }: { artist: string }) {
  return (
    <header className="flex items-start justify-between gap-4 p-6">
      <span className="text-3xl font-extrabold tracking-tight sm:text-4xl">{artist}</span>
      <nav className="flex items-center gap-2">
        <Link href="/guide" className="rounded border border-white/30 px-4 py-2 font-medium">
          콜가이드
        </Link>
        <InfoPanel />
      </nav>
    </header>
  );
}
