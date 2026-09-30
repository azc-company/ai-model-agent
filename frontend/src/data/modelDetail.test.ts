import { describe, it, expect } from 'vitest';
import { rankOf, alternativesFor, isTruncated, apiModelIdOf } from './modelDetail';
import type { ModelSpec } from '../types';

const m = (id: string, over: Partial<ModelSpec> = {}): ModelSpec => ({
  id, name: id, tier: 'Frontier', provider_name: 'P', provider_id: 'p',
  is_deprecated: false, official_url: '',
  api_pricing: { input_price_per_1m: 1, output_price_per_1m: 1, currency: 'USD' },
  benchmarks: {},
  ...over,
} as unknown as ModelSpec);

describe('모델 상세 계산', () => {
  it('벤치마크 순위는 값이 있는 모델끼리만 센다', () => {
    const all = [
      m('a', { benchmarks: { arena_elo: 1500 } as any }),
      m('b', { benchmarks: { arena_elo: 1400 } as any }),
      m('c'),   // 값 없음 — 분모에 넣으면 순위가 부풀려진다
    ];
    const pick = (x: ModelSpec) => x.benchmarks?.arena_elo;
    expect(rankOf(all[1], all, pick)).toEqual({ rank: 2, of: 2 });
    expect(rankOf(all[2], all, pick)).toBeNull();
  });

  it('동점은 같은 순위', () => {
    const all = [m('a', { benchmarks: { gpqa: 90 } as any }), m('b', { benchmarks: { gpqa: 90 } as any })];
    expect(rankOf(all[1], all, (x) => x.benchmarks?.gpqa)?.rank).toBe(1);
  });

  it('대안은 같은 등급에서 출력 단가가 가까운 순', () => {
    const me = m('me', { api_pricing: { input_price_per_1m: 1, output_price_per_1m: 10 } as any });
    const all = [
      me,
      m('far', { api_pricing: { output_price_per_1m: 50 } as any }),
      m('near', { api_pricing: { output_price_per_1m: 11 } as any }),
      m('other-tier', { tier: 'Small', api_pricing: { output_price_per_1m: 10 } as any }),
    ];
    expect(alternativesFor(me, all).map((x) => x.id)).toEqual(['near', 'far']);
  });

  it('자기 자신의 batch·free 변형은 대안이 아니다', () => {
    const me = m('opus', { name: 'Anthropic: Claude Opus 5.5' });
    const all = [
      me,
      m('opus-batch', { name: 'Anthropic: Claude Opus 5.5 (batch)' }),
      m('x-free', { name: 'Other: X (free)' }),
      m('y', { name: 'Other: Y' }),
    ];
    expect(alternativesFor(me, all).map((x) => x.id)).toEqual(['y']);
  });

  it('지원 중단 모델은 대안으로 권하지 않는다', () => {
    const me = m('me');
    expect(alternativesFor(me, [me, m('old', { is_deprecated: true })])).toEqual([]);
  });

  it('잘린 요약을 알아본다', () => {
    expect(isTruncated('… large codebases, code...')).toBe(true);
    expect(isTruncated('대규모 코드베이스…')).toBe(true);
    expect(isTruncated('완결된 문장입니다.')).toBe(false);
  });

  it('호출용 모델 ID 는 OpenRouter 슬러그를 쓴다', () => {
    expect(apiModelIdOf(m('anthropic-claude-opus-5.5', {
      official_url: 'https://openrouter.ai/models/anthropic/claude-opus-5.5',
    }))).toBe('anthropic/claude-opus-5.5');
    expect(apiModelIdOf(m('claude-3-opus-20240229', { official_url: 'https://docs.anthropic.com' })))
      .toBe('claude-3-opus-20240229');
  });
});
