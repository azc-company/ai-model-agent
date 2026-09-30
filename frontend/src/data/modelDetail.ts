// 모델 상세 화면이 목록 데이터에서 계산해 내는 값들.
//
// 설명 문단은 OpenRouter 가 200자 안팎으로 잘라서 준다(피드 464개 중 408개가 "..."
// 로 끝난다). 상세 화면의 세부 내용은 이미 가진 수치에서 뽑는다.
import type { ModelSpec } from '../types';

/** 벤치마크 값이 있는 모델들 가운데 몇 위인가. 값이 없으면 null. 동점은 같은 순위. */
export function rankOf(
  model: ModelSpec,
  all: ModelSpec[],
  pick: (m: ModelSpec) => number | null | undefined,
): { rank: number; of: number } | null {
  const mine = pick(model);
  if (mine == null) return null;
  const scored = all.map(pick).filter((v): v is number => v != null);
  return { rank: scored.filter((v) => v > mine).length + 1, of: scored.length };
}

// "(batch)", "(free)" 는 같은 모델의 과금 방식 변형이다. 대안으로 추천하면 사실상
// 같은 모델을 다시 보여주는 셈이라 뺀다.
const variantOf = (name: string) => name.replace(/\s*\((batch|free)\)\s*$/i, '').trim();

/** 같은 등급에서 출력 단가가 가장 가까운 모델들. 자기 자신과 그 변형은 뺀다. */
export function alternativesFor(model: ModelSpec, all: ModelSpec[], limit = 5): ModelSpec[] {
  const base = variantOf(model.name);
  const price = model.api_pricing?.output_price_per_1m;
  if (typeof price !== 'number') return [];
  return all
    .filter((m) => m.id !== model.id
      && m.tier === model.tier
      && !m.is_deprecated
      && variantOf(m.name) !== base
      && !/\((batch|free)\)\s*$/i.test(m.name)
      && typeof m.api_pricing?.output_price_per_1m === 'number')
    .sort((a, b) =>
      Math.abs(a.api_pricing.output_price_per_1m - price) - Math.abs(b.api_pricing.output_price_per_1m - price)
      || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** 피드가 준 설명이 잘린 요약인가. 잘렸으면 공식 문서로 안내한다. */
export const isTruncated = (text: string | undefined | null) => /(\.\.\.|…)\s*$/.test(text || '');

/** OpenRouter 모델 페이지 주소에서 호출용 슬러그를 뽑는다(모델 페이지 SEO 와 같은 규칙). */
export const apiModelIdOf = (m: ModelSpec) =>
  /openrouter\.ai\/models\/(.+)$/.exec(m.official_url || '')?.[1] || m.litellm_id || m.id;
