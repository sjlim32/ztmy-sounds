import Link from "next/link";
import { songs } from "@/data/songs";

export function SongList() {
  return (
    <ul data-role="song-list">
      {songs.map((song) => (
        <li key={song.id}>
          <Link href={`/guide/${song.id}`}>{song.title}</Link>
        </li>
      ))}
    </ul>
  );
}
