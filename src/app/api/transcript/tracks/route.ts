// 개발 전용 도구(/tools)에서만 씁니다. youtube-transcript 패키지는 캡션
// 트랙 목록 조회를 공개 API로 노출하지 않아서(내부 private static 메서드),
// 같은 InnerTube 호출을 여기서 직접 재현합니다.

const INNERTUBE_API_URL =
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const INNERTUBE_CLIENT_VERSION = "20.10.38";
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;

interface CaptionTrack {
  languageCode: string;
  name?: { simpleText?: string; runs?: { text: string }[] };
  kind?: string;
}

// YouTube가 asr(자동생성) 트랙의 name에는 이미 자체적으로 표시를 넣어주므로
// (예: "English (auto-generated)") 여기서 따로 덧붙이지 않고 그대로
// 씁니다 — 자동생성 여부는 isAuto로 별도 전달해서 클라이언트가 원하는
// 형태로 표시하게 합니다.
function trackLabel(track: CaptionTrack): string {
  return (
    track.name?.simpleText ??
    track.name?.runs?.map((run) => run.text).join("") ??
    track.languageCode
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return Response.json({ error: "videoId가 필요합니다" }, { status: 400 });
  }

  try {
    const res = await fetch(INNERTUBE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": INNERTUBE_USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: INNERTUBE_CLIENT_VERSION,
          },
        },
        videoId,
      }),
    });

    if (!res.ok) {
      return Response.json(
        { error: "영상 정보를 가져오지 못했습니다" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const captionTracks: CaptionTrack[] =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (captionTracks.length === 0) {
      return Response.json(
        { error: "이 영상에는 자막이 없습니다" },
        { status: 404 },
      );
    }

    const tracks = captionTracks.map((track) => ({
      languageCode: track.languageCode,
      label: trackLabel(track),
      isAuto: track.kind === "asr",
    }));

    return Response.json({ tracks });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
