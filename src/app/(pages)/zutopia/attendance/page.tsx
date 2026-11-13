import type { Metadata } from "next";
import { getLiveHistory } from "@/features/zutopia/live-history/data";
import {
  inPersonUnits,
  toClientUnit,
} from "@/features/zutopia/live-history/units";
import { getSongsWithAlbums } from "@/features/zutopia/song-db/data";
import { getSongCoverSrc } from "@/features/zutopia/song-db/song-album-grouping";
import { parseSongMetadata } from "@/features/zutopia/song-db/song-metadata";
import { AttendanceView } from "@/features/zutopia/attendance/components/AttendanceView";
import type { AttendanceSong } from "@/features/zutopia/attendance/summarize";

export const metadata: Metadata = {
  title: "라이브 참전 기록",
  description:
    "다녀온 즛토마요 공연을 체크하면 라이브로 들은 곡과 횟수, 아직 못 들은 곡을 보여줍니다.",
};

export default async function ZutopiaAttendancePage() {
  const [history, songs] = await Promise.all([
    getLiveHistory(),
    getSongsWithAlbums(),
  ]);

  // 원곡·발매곡만 — 라이브 기록은 원곡 기준으로 세고, 미공개곡은 넣지 않는다.
  // 협업곡은 넣되 collab 표시를 달아, 들었으면 들은 곡에만 들어가고 "못 들은 곡"엔
  // 들어가지 않게 한다(summarizeAttendance).
  const attendanceSongs: AttendanceSong[] = songs
    .filter(
      (song) =>
        !song.original_song_id &&
        !parseSongMetadata(song.metadata).isUnreleased,
    )
    .map((song) => ({
      id: song.id,
      slug: song.slug,
      title: song.title,
      titleKo: song.title_ko,
      titleEn: song.title_en,
      releaseDate: song.release_date,
      coverSrc: getSongCoverSrc(song),
      ...(parseSongMetadata(song.metadata).collab && { collab: true }),
    }));

  return (
    <div>
      <h1 className="sr-only">라이브 참전 기록</h1>
      <AttendanceView
        // 체크할 공연은 현장 공연만(온라인 공연은 참전 기록에서 뺀다).
        units={inPersonUnits(history.units).map(toClientUnit)}
        upcoming={inPersonUnits(history.upcoming).map(toClientUnit)}
        songs={attendanceSongs}
        liveCounts={Object.fromEntries(
          Object.entries(history.statsBySongId).map(([id, stat]) => [
            id,
            stat.count,
          ]),
        )}
      />
    </div>
  );
}
