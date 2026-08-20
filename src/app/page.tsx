import Link from "next/link";
import { event } from "@/data/event";
import { Countdown } from "@/components/guide/Countdown";
import { InfoPanel } from "@/components/guide/InfoPanel";

export default function Home() {
  return (
    <main data-role="hero">
      <p data-role="eyebrow">{event.tourName}</p>
      <h1>{event.artist}</h1>

      <Countdown targetIso={event.showDateTime} />

      <p data-role="show-meta">
        {event.dateLabel} · {event.venue}
      </p>

      <nav>
        <Link href="/guide">Call Guide</Link>
      </nav>

      <InfoPanel />
    </main>
  );
}
