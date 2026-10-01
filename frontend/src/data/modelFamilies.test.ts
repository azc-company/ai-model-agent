import { describe, it, expect } from 'vitest';
import { buildFamilies, collapseToFamilies, familyKey, variantKind } from './modelFamilies';
import type { ModelSpec } from '../types';

const m = (name: string, over: Partial<ModelSpec> = {}): ModelSpec =>
  ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, provider_name: 'P', ...over } as unknown as ModelSpec);

describe('모델 계열 묶기', () => {
  it('batch·free 변형은 같은 버전으로 묶인다', () => {
    const fam = buildFamilies([m('A: Opus 5.5'), m('A: Opus 5.5 (batch)'), m('A: Opus 5.5 (free)')]);
    const [f] = [...fam.values()];
    expect(f.versions).toHaveLength(1);
    expect(f.versions[0].model.name).toBe('A: Opus 5.5');
    expect(Object.keys(f.versions[0].variants).sort()).toEqual(['batch', 'free']);
    expect(variantKind(m('X (batch)'))).toBe('batch');
  });

  it('버전이 다르면 한 계열의 다른 버전이다', () => {
    const fam = buildFamilies([m('A: Opus 4.5'), m('A: Opus 5'), m('A: Opus 5.5')]);
    expect(fam.size).toBe(1);
    expect([...fam.values()][0].versions.map((v) => v.model.name)).toEqual(['A: Opus 5.5', 'A: Opus 5', 'A: Opus 4.5']);
  });

  it('날짜 표기가 붙은 옛 이름도 같은 계열이다', () => {
    expect(familyKey(m('Claude 3.5 Sonnet (20241022)'))).toBe(familyKey(m('A: Claude Sonnet 4.5')));
    expect(familyKey(m('Mistral Large 2407'))).toBe(familyKey(m('Mistral Large 3')));
  });

  it('크기가 다르면 다른 계열이다', () => {
    expect(familyKey(m('Llama 3.3 70B Instruct'))).not.toBe(familyKey(m('Llama 3.1 8B Instruct')));
    expect(familyKey(m('Llama 3.3 70B Instruct'))).toBe(familyKey(m('Llama 3.1 70B Instruct')));
  });

  it('공급사가 다르면 다른 계열이다', () => {
    expect(familyKey(m('Claude 3 Opus', { provider_name: 'Anthropic' })))
      .not.toBe(familyKey(m('Claude 3 Opus', { provider_name: 'AWS Bedrock' })));
  });

  it('최신은 출시 시각으로 정한다 — 버전 숫자로는 Grok 4.20 이 4.7 보다 커진다', () => {
    const fam = buildFamilies([
      m('X: Grok 4.20', { released_at: '2026-03-31 00:00:00' }),
      m('X: Grok 4.7', { released_at: '2026-09-21 00:00:00' }),
    ]);
    expect([...fam.values()][0].latest.name).toBe('X: Grok 4.7');
  });

  it('출시 시각이 없으면(시드) 버전 숫자로 정한다', () => {
    const fam = buildFamilies([m('GLM 4.5'), m('GLM 5.1'), m('GLM 4.7')]);
    expect([...fam.values()][0].latest.name).toBe('GLM 5.1');
  });
});

describe('목록 대표 고르기', () => {
  const all = [
    m('A: Opus 4.5', { released_at: '2026-01-01' }),
    m('A: Opus 5.5', { released_at: '2026-09-27' }),
    m('A: Opus 5.5 (batch)', { released_at: '2026-09-27' }),
    m('B: Other'),
  ];
  const fams = buildFamilies(all);

  it('필터가 없으면 계열마다 최신 표준 모델 하나', () => {
    expect(collapseToFamilies(all, fams).map((x) => x.name).sort()).toEqual(['A: Opus 5.5', 'B: Other']);
  });

  it('검색으로 구버전만 걸리면 그 버전이 대표가 된다', () => {
    expect(collapseToFamilies([all[0]], fams).map((x) => x.name)).toEqual(['A: Opus 4.5']);
  });

  it('같은 버전이면 batch 가 아니라 표준이 대표다', () => {
    expect(collapseToFamilies([all[2], all[1]], fams).map((x) => x.name)).toEqual(['A: Opus 5.5']);
  });
});
