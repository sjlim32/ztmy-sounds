import { YoutubeTranscript } from "youtube-transcript";

// 개발 전용 도구(/tools)에서만 씁니다. output:"export"(정적 배포) 빌드는
// 요청마다 실행되는 서버 코드를 지원하지 않으므로, 배포 전엔 이 라우트와
// /tools 페이지를 제거하거나 next.config.ts의 output:"export"를 잠시 꺼야 합니다.

function formatTime(offsetMs: number) {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  // lang을 안 주면 YouTube가 반환하는 첫 자막 트랙을 그냥 쓰게 되어 일본어가
  // 아닐 수 있어서, 기본값을 일본어(ja)로 고정합니다.
  const lang = searchParams.get("lang") ?? "ja";

  if (!videoId) {
    return Response.json({ error: "videoId가 필요합니다" }, { status: 400 });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang,
    });

    const lines = transcript.map((item) => ({
      time: formatTime(item.offset),
      original: "",
      pronunciation: "",
      translation: item.text,
    }));

    return Response.json(lines);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
