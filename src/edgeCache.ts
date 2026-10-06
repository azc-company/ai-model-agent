// ─── 엣지 캐시 ───────────────────────────────────────────────────────────────
// 응답에 s-maxage 를 달아 두었지만 워커가 만든 응답은 그 헤더만으로는 엣지에 저장되지
// 않는다. 그래서 모델 목록·기사 목록이 매 요청 D1 까지 갔다(실측 300~800ms).
// 읽기 전용 공개 API 만 Cache API 로 직접 저장한다. 쿼리스트링(lang 등)까지 키에 들어간다.
// 배치가 쓴 새 데이터는 각 응답의 s-maxage(최대 1시간) 안에 반영된다.
const EDGE_CACHED = [
  /^\/api\/v1\/models$/, /^\/api\/v1\/models\/[^/]+$/,
  /^\/api\/v1\/news\/pulse$/, /^\/api\/v1\/news\/articles\/[^/]+$/,
  /^\/api\/v1\/providers$/, /^\/api\/v1\/provider-endpoints$/,
  /^\/api\/v1\/changelog$/, /^\/api\/v1\/gpus$/,
];

// 테스트에서 가짜 캐시를 넣을 수 있게 필요한 메서드만 받는다.
interface EdgeCache { match(req: Request): Promise<Response | undefined>; put(req: Request, res: Response): Promise<void> }

export async function withEdgeCache(
  request: Request, ctx: { waitUntil(p: Promise<unknown>): void }, compute: () => Promise<Response>,
  cache: EdgeCache | undefined = (globalThis as any).caches?.default,
): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method !== 'GET' || !cache || !EDGE_CACHED.some((re) => re.test(path))) return compute();
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await compute();
  // 오류 응답과 s-maxage 가 없는 응답은 저장하지 않는다 — 장애 순간의 500 이 한 시간 동안 남으면 안 된다.
  if (res.status === 200 && /s-maxage=\d+/.test(res.headers.get('Cache-Control') || '')) {
    ctx.waitUntil(cache.put(request, res.clone()));
  }
  return res;
}
