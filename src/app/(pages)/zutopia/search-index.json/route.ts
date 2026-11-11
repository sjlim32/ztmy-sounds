import { getZutopiaSearchIndex } from "@/features/zutopia/search/data";

// 정적 빌드(output: "export")에서 /zutopia/search-index.json 파일로 내보낸다 —
// 하위 페이지 헤더의 검색 창(ZutopiaSearchDialog)이 처음 열릴 때만 받아 간다.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getZutopiaSearchIndex());
}
