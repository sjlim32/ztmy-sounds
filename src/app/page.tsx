import { event } from "@/data/event";
import { Header } from "@/components/home/Header";
import { Countdown } from "@/components/home/Countdown";

export default function Home() {
  return (
    <>
      <Header artist={event.artist} />

      <main data-role="hero">
        <p data-role="eyebrow">{event.tourName}</p>

        <Countdown targetIso={event.showDateTime} />

        <p data-role="show-meta">
          {event.dateLabel} · {event.venue}
        </p>
      </main>
    </>
  );
}
