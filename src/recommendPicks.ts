// 아키텍처 추천기의 모델 선택.
//
// 예전에는 모델 id 6개(Claude Sonnet 4.5·GPT-4o·Llama 3.3 70B·DeepSeek-V3 등)를 코드에
// 박아 두어, 카탈로그에 새 모델이 들어와도 추천이 바뀌지 않았고 성능·비용도 보지 않았다.
// 지금은 카탈로그와 LMArena 분야별 점수(CC-BY, 매주 동기화)에서 고른다.
//
// 종합 점수 하나로 고르면 코딩·RAG·콘텐츠·멀티모달이 모두 같은 모델이 됐다(2026-10-06
// 실측). 그래서 용도마다 그 분야 순위를 쓴다.
import type { ModelSpec } from '../frontend/src/types';
import { familyKey, newerFirst, variantKind } from '../frontend/src/data/modelFamilies';

export interface PickRequest {
  service_type?: string;
  requires_coding?: boolean;
  requires_multimodal?: boolean;
  language?: string;
  monthly_requests: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
}

// score 는 항상 Picks.category 의 점수다. 척도가 다른 점수(종합 vs 분야)를 한 표에 섞지 않는다.
export interface Pick { model: ModelSpec; score: number | null; monthlyCost: number }

export interface Picks {
  category: string;       // 쓴 점수의 분야 (coding, longer_query, vision …)
  asof: string | null;    // LMArena 기준일
  quality: Pick;          // 그 분야 1위
  balanced: Pick;         // 점수와 비용의 균형점
  router: Pick;           // 분류·전처리용 저가 모델
}

// 가성비 기준: 가격이 10배면 Elo 가 이만큼 높아야 값을 한다. Elo 60점 차는 높은 쪽이 약
// 58% 확률로 이기는 정도다. 40 으로 두면 RAG·콘텐츠에서 가성비 안이 최고 품질 안과
// 같아졌고(더 싼 대안을 못 고름), 60 에서 다섯 용도 모두 갈렸다.
export const ELO_PER_10X_PRICE = 60;

// 18개월 넘은 모델은 후보에서 뺀다. 계열별 최신만 남기므로 대부분 걸러지지만, 갱신이
// 끊긴 계열의 마지막 모델이 남는 것을 막는다.
const MAX_AGE_DAYS = 548;

const LANGUAGE_CATEGORY: Record<string, string> = {
  ko: 'korean', ja: 'japanese', zh: 'chinese', de: 'german', es: 'spanish', fr: 'french',
};

/** 요청을 LMArena 분야로. 영어 번역은 언어 분야가 없어 멀티턴 대화로 본다. */
export function categoryFor(req: PickRequest): string {
  if (req.requires_multimodal || req.service_type === 'multimodal') return 'vision';
  if (req.requires_coding || req.service_type === 'code_agent') return 'coding';
  if (req.service_type === 'rag') return 'longer_query';
  if (req.service_type === 'content_creation') return 'creative_writing';
  if (req.service_type === 'translation') return LANGUAGE_CATEGORY[req.language || ''] || 'multi_turn';
  return 'multi_turn';
}

const scoreIn = (m: ModelSpec, category: string): number | null => {
  const b: any = m.benchmarks || {};
  const v = category === 'vision' ? b.arena_vision : category === 'overall' ? b.arena_elo : b.arena_cat?.[category];
  return typeof v === 'number' ? v : null;
};

/** 후보군: 유료 표준 모델 · 지원 중단 아님 · 최근 출시 · 계열별 최신 버전. */
export function candidatePool(models: ModelSpec[], now = Date.now()): ModelSpec[] {
  const cutoff = new Date(now - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10);
  const eligible = models.filter((m) =>
    !m.is_deprecated
    && !variantKind(m)                                    // batch 는 비동기, free 는 하루 50회
    && !/latest|router/i.test(m.name)                     // 가리키는 모델이 바뀌는 별칭
    && (m.api_pricing?.output_price_per_1m ?? 0) > 0
    && !!m.released_at && m.released_at.slice(0, 10) >= cutoff,
  );
  const newest = new Map<string, ModelSpec>();
  for (const m of eligible) {
    const k = familyKey(m);
    const cur = newest.get(k);
    if (!cur || newerFirst(m, cur) < 0) newest.set(k, m);
  }
  return [...newest.values()];
}

export function pickModels(models: ModelSpec[], req: PickRequest, now = Date.now()): Picks | null {
  const pool = candidatePool(models, now);
  const cost = (m: ModelSpec) =>
    req.monthly_requests * (req.avg_input_tokens * m.api_pricing.input_price_per_1m
      + req.avg_output_tokens * m.api_pricing.output_price_per_1m) / 1_000_000;

  // 분야 점수가 있는 모델이 없으면 종합 점수로 내려간다.
  let category = categoryFor(req);
  let scored = pool.map((m) => ({ model: m, score: scoreIn(m, category) })).filter((x) => x.score != null);
  if (!scored.length) {
    category = 'overall';
    scored = pool.map((m) => ({ model: m, score: scoreIn(m, 'overall') })).filter((x) => x.score != null);
  }
  if (!scored.length) return null;
  const cands: Pick[] = scored.map((x) => ({ model: x.model, score: x.score as number, monthlyCost: cost(x.model) }));

  const sc = (p: Pick) => p.score as number;   // cands 는 점수가 있는 것만이다
  const quality = cands.reduce((a, b) => (sc(b) > sc(a) || (sc(b) === sc(a) && b.monthlyCost < a.monthlyCost) ? b : a));
  const value = (p: Pick) => sc(p) - ELO_PER_10X_PRICE * Math.log10(Math.max(p.monthlyCost, 0.01));
  const balanced = cands.reduce((a, b) => (value(b) > value(a) ? b : a));

  // 라우터는 짧은 분류·전처리라 분야보다 종합 점수로 본다. 고정 기준점(예: 1400)은 해마다
  // 점수가 올라 의미가 바뀌므로, 후보군 중간 이상 중 가장 싼 모델로 정한다.
  // 비전 용도면 라우터도 이미지를 받아야 한다.
  const routerBase = category === 'vision' ? pool.filter((m) => (m.modality || []).includes('vision')) : pool;
  const overall = routerBase.map((m) => ({ model: m, score: scoreIn(m, 'overall') }))
    .filter((x) => x.score != null) as { model: ModelSpec; score: number }[];
  const sortedScores = overall.map((x) => x.score).sort((a, b) => a - b);
  // 짝수 개면 아래쪽 중앙값 — 위쪽을 쓰면 후보 둘일 때 비싼 쪽만 남는다.
  const median = sortedScores[Math.floor((sortedScores.length - 1) / 2)] ?? 0;
  const routerPool = (overall.length ? overall : scored as { model: ModelSpec; score: number }[])
    .filter((x) => x.score >= median)
    .map((x) => ({ model: x.model, score: scoreIn(x.model, category), monthlyCost: cost(x.model) }));
  const router = routerPool.length
    ? routerPool.reduce((a, b) => (b.monthlyCost < a.monthlyCost ? b : a))
    : balanced;

  const asof = (quality.model.benchmarks as any)?.asof?.arena ?? null;
  return { category, asof, quality, balanced, router };
}
