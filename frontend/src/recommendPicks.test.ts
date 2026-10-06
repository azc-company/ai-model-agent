import { describe, it, expect } from 'vitest';
import { pickModels, categoryFor, candidatePool } from '../../src/recommendPicks';
import type { ModelSpec } from './types';

const NOW = Date.parse('2026-10-06T00:00:00Z');
let n = 0;
const m = (name: string, price: [number, number], bench: Record<string, unknown>, over: Partial<ModelSpec> = {}): ModelSpec => ({
  id: `m${n++}`, name, provider_name: name.split(':')[0], is_deprecated: false, released_at: '2026-09-01 00:00:00',
  api_pricing: { input_price_per_1m: price[0], output_price_per_1m: price[1] }, benchmarks: bench,
  ...over,
} as unknown as ModelSpec);
const REQ = { monthly_requests: 100_000, avg_input_tokens: 2000, avg_output_tokens: 500 };

describe('추천기 모델 선택', () => {
  it('용도에 맞는 분야 점수를 쓴다', () => {
    expect(categoryFor({ ...REQ, service_type: 'code_agent' })).toBe('coding');
    expect(categoryFor({ ...REQ, service_type: 'rag' })).toBe('longer_query');
    expect(categoryFor({ ...REQ, requires_multimodal: true })).toBe('vision');
    expect(categoryFor({ ...REQ, service_type: 'translation', language: 'ko' })).toBe('korean');
    expect(categoryFor({ ...REQ, service_type: 'translation', language: 'en' })).toBe('multi_turn');
  });

  it('코딩 용도면 종합 1위가 아니라 코딩 1위를 고른다', () => {
    const general = m('A: General', [5, 25], { arena_elo: 1510, arena_cat: { coding: 1480 } });
    const coder = m('B: Coder', [1, 4], { arena_elo: 1480, arena_cat: { coding: 1530 } });
    const p = pickModels([general, coder], { ...REQ, service_type: 'code_agent' }, NOW)!;
    expect(p.category).toBe('coding');
    expect(p.quality.model.name).toBe('B: Coder');
  });

  it('가성비 안은 조금 낮은 점수를 훨씬 싼 값에 산다', () => {
    const top = m('A: Top', [5, 25], { arena_elo: 1510, arena_cat: { multi_turn: 1530 } });       // 월 $2,250
    const cheap = m('B: Cheap', [0.1, 0.4], { arena_elo: 1480, arena_cat: { multi_turn: 1500 } }); // 월 $40
    const p = pickModels([top, cheap], REQ, NOW)!;
    expect(p.quality.model.name).toBe('A: Top');
    expect(p.balanced.model.name).toBe('B: Cheap');   // 30점 낮지만 56배 싸다
  });

  it('점수 차가 크면 싸도 고르지 않는다', () => {
    const top = m('A: Top', [1, 4], { arena_elo: 1510, arena_cat: { multi_turn: 1530 } });
    const weak = m('B: Weak', [0.5, 2], { arena_elo: 1300, arena_cat: { multi_turn: 1300 } });
    expect(pickModels([top, weak], REQ, NOW)!.balanced.model.name).toBe('A: Top');
  });

  it('구버전·변형·별칭·오래된 모델·지원 중단은 후보가 아니다', () => {
    const pool = candidatePool([
      m('A: Opus 5.5', [5, 25], {}, { released_at: '2026-09-22' }),
      m('A: Opus 5', [5, 25], {}, { released_at: '2026-07-24' }),        // 같은 계열의 구버전
      m('A: Opus 5.5 (batch)', [2.5, 12.5], {}),                         // 과금 변형
      m('C: GPT Astra Latest', [1, 4], {}),                              // 별칭
      m('D: Old Model', [1, 4], {}, { released_at: '2024-01-01' }),      // 18개월 초과
      m('E: Gone', [1, 4], {}, { is_deprecated: true }),
      m('F: Seed', [1, 4], {}, { released_at: null }),                    // 출시 시각 없는 시드
      m('G: Free Only', [0, 0], {}),                                      // 유료 단가 없음
    ], NOW);
    expect(pool.map((x) => x.name)).toEqual(['A: Opus 5.5']);
  });

  it('분야 점수가 없으면 종합 점수로 내려간다', () => {
    const a = m('A: X', [1, 4], { arena_elo: 1450 });
    const p = pickModels([a], { ...REQ, service_type: 'code_agent' }, NOW)!;
    expect(p.category).toBe('overall');
    expect(p.quality.model.name).toBe('A: X');
  });

  it('점수 있는 후보가 없으면 null — 호출부가 처리한다', () => {
    expect(pickModels([m('A: X', [1, 4], {})], REQ, NOW)).toBeNull();
  });

  it('라우터 점수도 같은 분야 척도로 보고한다', () => {
    // 종합 1434 와 비전 1320 을 한 표에 적으면 라우터가 주력보다 좋아 보였다.
    const vis = (name: string, price: [number, number], overall: number, vision?: number) =>
      m(name, price, { arena_elo: overall, ...(vision ? { arena_vision: vision } : {}) }, { modality: ['text', 'vision'] } as any);
    const p = pickModels([vis('A: Top', [5, 25], 1510, 1320), vis('B: Cheap', [0.1, 0.4], 1450)],
      { ...REQ, requires_multimodal: true }, NOW)!;
    expect(p.category).toBe('vision');
    expect(p.router.model.name).toBe('B: Cheap');
    expect(p.router.score).toBeNull();            // 비전 점수가 없으면 비워 둔다
  });

  it('비전 용도의 라우터는 이미지를 받는 모델이어야 한다', () => {
    const textOnly = m('A: Text', [0.05, 0.1], { arena_elo: 1500 }, { modality: ['text'] } as any);
    const visual = m('B: Vision', [1, 4], { arena_elo: 1500, arena_vision: 1300 }, { modality: ['text', 'vision'] } as any);
    expect(pickModels([textOnly, visual], { ...REQ, requires_multimodal: true }, NOW)!.router.model.name).toBe('B: Vision');
  });

  it('라우터는 중간 이상 품질 중 가장 싼 모델', () => {
    const models = [
      m('A: Top', [5, 25], { arena_elo: 1510 }),
      m('B: Mid', [0.2, 0.8], { arena_elo: 1450 }),
      m('C: Low', [0.05, 0.1], { arena_elo: 1300 }),   // 가장 싸지만 중간 미만
    ];
    expect(pickModels(models, REQ, NOW)!.router.model.name).toBe('B: Mid');
  });
});
