import Link from "next/link";
import InfoContent from "@/content/info.mdx";

export default function InfoPage() {
  return (
    <main className="tablet:max-w-2xl mx-auto w-full px-6 py-16">
      <Link
        href="/"
        className="tablet:block hidden text-sm text-white/60 hover:text-white"
      >
        ← 홈으로
      </Link>

      <div className="mt-6 space-y-6">
        <InfoContent />
      </div>
    </main>
  );
}
