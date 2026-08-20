import { notFound } from "next/navigation";
import { getSong } from "@/data/songs";
import { SongView } from "@/components/guide/SongView";

export default async function SongPage(props: PageProps<"/guide/[songId]">) {
  const { songId } = await props.params;
  const song = getSong(songId);

  if (!song) {
    notFound();
  }

  return <SongView song={song} />;
}
