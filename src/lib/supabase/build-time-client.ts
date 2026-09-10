import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 빌드 타임(정적 export 생성 시)에만 호출하는 Supabase 클라이언트.
 * output: "export"라 런타임 서버가 없으므로, 이 함수는 서버 컴포넌트의
 * 최상위(page.tsx)에서만 호출해야 하며 클라이언트 컴포넌트로 전달하면 안 된다.
 */
let cachedClient: ReturnType<typeof createClient<Database>> | undefined;

export function createBuildTimeSupabaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUB_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUB_KEY 환경변수가 필요합니다 (빌드 타임 데이터 페칭용).",
    );
  }

  cachedClient = createClient<Database>(url, key);
  return cachedClient;
}
