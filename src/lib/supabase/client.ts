import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePubKey = process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY;

if (!supabaseUrl || !supabasePubKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUB_KEY 환경변수가 필요합니다.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePubKey);
