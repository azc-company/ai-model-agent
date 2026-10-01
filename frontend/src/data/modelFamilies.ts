// 같은 모델의 변형·버전을 한 계열로 묶는다.
//
// 카탈로그 600개 중 두 겹의 중복이 있었다.
//   과금 방식 변형  "Claude Opus 5.5" / "Claude Opus 5.5 (batch)" / "… (free)"  — 85개 그룹
//   버전 계열       Claude Opus 4.1 → 4.5 → … → 5.5                          — 87개 계열
// 둘 다 묶으면 카드 600 → 377. 상세 화면에서 버전별 정보를 펼쳐 보인다.
//
// 계열 판정은 이름 규칙이다(공급사 + 숫자 버전을 뗀 이름). 크기 표기는 남겨서
// Llama 3.3 70B 와 8B 는 서로 다른 계열이 된다.
import type { ModelSpec } from '../types';

export type VariantKind = 'batch' | 'free' | 'beta';

const VARIANT = /\s*\((batch|free|beta)\)\s*$/i;

export const variantKind = (m: ModelSpec): VariantKind | null =>
  (VARIANT.exec(m.name)?.[1]?.toLowerCase() as VariantKind) ?? null;

/** 과금 방식 표기를 뗀 이름. 같은 값이면 같은 버전이다. */
export const baseName = (m: ModelSpec) => m.name.replace(VARIANT, '').trim();

/** 화면용 짧은 버전 이름. "Anthropic: Claude Opus 5.5" → "Claude Opus 5.5" */
export const shortName = (m: ModelSpec) => baseName(m).replace(/^[^:]+:\s*/, '');

export function familyKey(m: ModelSpec): string {
  let n = shortName(m);
  n = n.replace(/\s*\((?:\d{3,8}|\d{4}-\d{2}-\d{2})\)/g, '');   // (20240229) (002) (2024-05-13)
  n = n.replace(/\s+\d{4}$/, '');                               // "Mistral Large 2407", "V3 0324"
  n = n.replace(/\s*\d+(?:\.\d+)*\b/g, '');                      // 숫자 버전. "70B" 는 \b 가 없어 남는다
  return `${m.provider_name}::${n.trim().toLowerCase()}`;
}

// 이름 속 숫자를 순서대로 뽑아 버전처럼 비교한다. 출시 시각이 없는 시드 모델용이다.
const versionTuple = (m: ModelSpec) => (shortName(m).match(/\d+/g) || []).map(Number);
const cmpTuple = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d) return d;
  }
  return 0;
};

/** 최신이 앞. 출시 시각이 있으면 그것으로(Grok 4.20 은 숫자는 크지만 4.7 보다 먼저 나왔다). */
export function newerFirst(a: ModelSpec, b: ModelSpec): number {
  const ra = a.released_at || '', rb = b.released_at || '';
  if (ra && rb && ra !== rb) return rb.localeCompare(ra);
  if (ra !== rb) return ra ? -1 : 1;                 // 출시 시각이 있는 쪽(피드)을 앞으로
  return cmpTuple(versionTuple(b), versionTuple(a)) || a.name.localeCompare(b.name);
}

export interface FamilyVersion {
  /** 그 버전의 표준 모델. 표준이 없고 변형만 있으면 첫 변형. */
  model: ModelSpec;
  variants: Partial<Record<VariantKind, ModelSpec>>;
}

export interface ModelFamily {
  key: string;
  latest: ModelSpec;
  versions: FamilyVersion[];   // 최신이 앞
  size: number;                // 변형 포함 전체 모델 수
}

export function buildFamilies(models: ModelSpec[]): Map<string, ModelFamily> {
  const byKey = new Map<string, ModelSpec[]>();
  for (const m of models) {
    const k = familyKey(m);
    (byKey.get(k) || byKey.set(k, []).get(k)!).push(m);
  }
  const out = new Map<string, ModelFamily>();
  for (const [key, members] of byKey) {
    const byBase = new Map<string, ModelSpec[]>();
    for (const m of members) (byBase.get(baseName(m)) || byBase.set(baseName(m), []).get(baseName(m))!).push(m);
    const versions: FamilyVersion[] = [...byBase.values()].map((group) => {
      const standard = group.find((m) => !variantKind(m)) || group[0];
      const variants: FamilyVersion['variants'] = {};
      for (const m of group) {
        const v = variantKind(m);
        if (v && m !== standard) variants[v] = m;
      }
      return { model: standard, variants };
    }).sort((a, b) => newerFirst(a.model, b.model));
    out.set(key, { key, latest: versions[0].model, versions, size: members.length });
  }
  return out;
}

/**
 * 목록에 낼 대표 모델들. 필터·검색을 통과한 모델을 계열별로 하나씩만 남긴다 —
 * 계열에서 통과한 것 중 가장 최신. 그래서 "Opus 4.5" 로 검색하면 Opus 4.5 카드가 나온다.
 */
export function collapseToFamilies(passing: ModelSpec[], families: Map<string, ModelFamily>): ModelSpec[] {
  const best = new Map<string, ModelSpec>();
  for (const m of passing) {
    const k = familyKey(m);
    const cur = best.get(k);
    // 표준 모델을 변형보다 먼저 고른다. 같은 버전이면 batch 카드가 대표가 되지 않게.
    const better = !cur
      || (variantKind(cur) && !variantKind(m))
      || (!!variantKind(cur) === !!variantKind(m) && newerFirst(m, cur) < 0);
    if (better) best.set(k, m);
  }
  return [...best.values()].filter((m) => families.has(familyKey(m)));
}
