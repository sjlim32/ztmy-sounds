/**
 * /r2/<경로> → https://assets.ztmy-sounds.fans/<경로> 프록시 (Cloudflare Pages Function).
 *
 * R2 커스텀 도메인은 HTTP/3를 광고하지 않고(alt-svc 없음) CORS 헤더도 없다.
 * 메인 도메인 아래로 받아 오면 브라우저가 메인 사이트의 HTTP/3 연결을 그대로
 * 쓰고, 이미지가 같은 출처가 되어 canvas로 그려 저장할 수 있다.
 *
 * - /assets/는 public/assets/ 정적 파일 경로라 접두사로 쓰면 안 된다(Function이
 *   정적 파일보다 먼저 잡혀 기존 이미지가 깨진다).
 * - public/_routes.json이 이 Function을 /r2/*에만 연결한다.
 * - 요청마다 Function이 한 번씩 실행되어 Workers 무료 한도(하루 10만 요청)에
 *   잡힌다 — 브라우저 캐시(Cache-Control)로 재방문 요청을 줄인다.
 */
const R2_ORIGIN = "https://assets.ztmy-sounds.fans";
const CACHE_CONTROL = "public, max-age=86400";

interface Context {
  request: Request;
  params: { path?: string | string[] };
}

export async function onRequest({
  request,
  params,
}: Context): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const segments = Array.isArray(params.path)
    ? params.path
    : params.path
      ? [params.path]
      : [];
  const target = new URL(
    `/${segments.map(encodeURIComponent).join("/")}`,
    R2_ORIGIN,
  );
  target.search = new URL(request.url).search;

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers: { Accept: request.headers.get("Accept") ?? "*/*" },
    // Cloudflare 엣지 캐시에도 남긴다(표준 RequestInit에는 없는 Workers 전용 옵션).
    cf: { cacheEverything: true },
  } as RequestInit);

  const headers = new Headers(upstream.headers);
  if (upstream.ok) headers.set("Cache-Control", CACHE_CONTROL);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
