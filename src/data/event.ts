export interface EventInfo {
  artist: string;
  tourName: string;
  /** ISO 8601, e.g. "2026-12-31T18:00:00+09:00" */
  showDateTime: string;
  venue: string;
  dateLabel: string;
}

export const event: EventInfo = {
  artist: "ずっと真夜中でいいのに。(ZUTOMAYO)",
  tourName: "TOUR NAME 2026",
  showDateTime: "2026-12-31T18:00:00+09:00",
  venue: "VENUE NAME",
  dateLabel: "12.31",
};
