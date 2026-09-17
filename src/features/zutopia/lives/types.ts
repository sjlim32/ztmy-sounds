import type { Database } from "@/lib/supabase/database.types";

export type Live = Database["public"]["Tables"]["lives"]["Row"];

export interface LiveSetlistEntry {
  songId: string;
  title: string;
  titleKo: string;
  // 이 곡의 응원 가이드(/guide/[songId])가 있으면 그 경로, 없으면 null.
  guideHref: string | null;
}

export interface LiveDetail extends Live {
  setlist: LiveSetlistEntry[];
}
