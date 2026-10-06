import { describe, it, expect } from 'vitest';
import { withEdgeCache } from '../../src/edgeCache';

// 워커 응답은 s-maxage 만으로는 엣지에 저장되지 않아 모델·기사 목록이 매번 D1 까지 갔다.
// 직접 캐시에 넣되, 잘못 넣으면 오래된 값이나 장애 순간의 오류가 한 시간 동안 나간다.
function fakeCache() {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (req: Request) => store.get(req.url)?.clone(),
    put: async (req: Request, res: Response) => { store.set(req.url, res); },
  };
}
const ctx = () => { const waits: Promise<unknown>[] = []; return { waits, waitUntil: (p: Promise<unknown>) => { waits.push(p); } }; };
const json = (status = 200, cc = 'public, max-age=60, s-maxage=3600') =>
  new Response('{"ok":1}', { status, headers: { 'Cache-Control': cc } });

describe('엣지 캐시', () => {
  it('목록 API 는 두 번째 요청부터 D1 을 거치지 않는다', async () => {
    const cache = fakeCache(); const c = ctx(); let computed = 0;
    const req = () => new Request('https://x.test/api/v1/models?lang=ko');
    await withEdgeCache(req(), c, async () => { computed++; return json(); }, cache);
    await Promise.all(c.waits);
    const res = await withEdgeCache(req(), c, async () => { computed++; return json(); }, cache);
    expect(computed).toBe(1);
    expect(await res.text()).toBe('{"ok":1}');
  });

  it('언어가 다르면 다른 캐시다', async () => {
    const cache = fakeCache(); const c = ctx(); let computed = 0;
    for (const lang of ['ko', 'en']) {
      await withEdgeCache(new Request(`https://x.test/api/v1/models?lang=${lang}`), c, async () => { computed++; return json(); }, cache);
      await Promise.all(c.waits);
    }
    expect(computed).toBe(2);
  });

  it('오류 응답은 저장하지 않는다', async () => {
    const cache = fakeCache(); const c = ctx();
    await withEdgeCache(new Request('https://x.test/api/v1/news/pulse'), c, async () => json(500), cache);
    await Promise.all(c.waits);
    expect(cache.store.size).toBe(0);
  });

  it('s-maxage 가 없는 응답은 저장하지 않는다', async () => {
    const cache = fakeCache(); const c = ctx();
    await withEdgeCache(new Request('https://x.test/api/v1/news/pulse'), c, async () => json(200, 'no-store'), cache);
    await Promise.all(c.waits);
    expect(cache.store.size).toBe(0);
  });

  it('목록에 없는 경로와 GET 이 아닌 요청은 캐시를 건드리지 않는다', async () => {
    const cache = fakeCache(); const c = ctx();
    for (const req of [
      new Request('https://x.test/health'),
      new Request('https://x.test/api/v1/admin/analytics/summary'),
      new Request('https://x.test/api/v1/analytics/track', { method: 'POST', body: '{}' }),
      new Request('https://x.test/api/v1/recommend/architecture', { method: 'POST', body: '{}' }),
    ]) await withEdgeCache(req, c, async () => json(), cache);
    await Promise.all(c.waits);
    expect(cache.store.size).toBe(0);
  });
});
