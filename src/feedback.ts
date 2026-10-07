// 비공개 피드백. 화면에 숫자를 보여주지 않는다 — 공개 좋아요·댓글은 사람이 적을 때
// "♡ 0" 이 오히려 "아무도 안 쓰는 사이트" 라는 신호가 된다(2026-09-04 보류 결정).
// 이건 한 명만 눌러도 쓸모가 있는 신호다. 결과는 어드민에서만 본다.
//
//   model_error      모델 데이터가 틀렸다 (가격·컨텍스트·벤치마크·설명)
//   article_helpful  기사가 도움이 됐나 — 기사 생성 품질로 되돌릴 신호
//   advisor_helpful  추천기 결과가 도움이 됐나 — 선택 규칙(가격 10배당 60점) 조정 근거
//
// 인증 없는 공개 엔드포인트라 받는 값을 좁게 검증한다. 자유 입력은 오류 신고의 짧은
// 메모 하나뿐이고, 링크는 받지 않는다(스팸의 목적이 대개 링크다).

export type FeedbackKind = 'model_error' | 'article_helpful' | 'advisor_helpful';

export interface FeedbackRow {
  kind: FeedbackKind;
  target: string;
  value: string;
  note: string | null;
  session_id: string;
}

const RULES: Record<FeedbackKind, { target: RegExp; values: ReadonlySet<string>; reasons?: ReadonlySet<string> }> = {
  model_error: {
    target: /^[A-Za-z0-9._:~-]{1,120}$/,
    values: new Set(['price', 'context', 'benchmark', 'description', 'other']),
  },
  article_helpful: {
    target: /^[A-Za-z0-9-]{1,64}$/,
    values: new Set(['up', 'down']),
  },
  advisor_helpful: {
    target: /^[a-z_]{1,40}$/,                     // 쓴 LMArena 분야 (coding, longer_query …)
    values: new Set(['up', 'down']),
    reasons: new Set(['cost', 'quality', 'models', 'other']),
  },
};

export const NOTE_MAX = 300;
const URLISH = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ai|kr|xyz|ru|cn|info|biz|top)\b)/i;

/** 검증·정규화. 받을 수 없는 입력이면 null — 호출부는 조용히 204 를 돌려준다. */
export function parseFeedback(body: any): FeedbackRow | null {
  const kind = String(body?.kind || '') as FeedbackKind;
  const rule = RULES[kind];
  if (!rule) return null;
  const target = String(body?.target || '');
  const value = String(body?.value || '');
  const session_id = String(body?.session_id || '');
  if (!rule.target.test(target) || !rule.values.has(value) || !/^[a-zA-Z0-9-]{1,64}$/.test(session_id)) return null;

  let note: string | null = null;
  if (kind === 'model_error' && body?.note != null) {
    // 제어 문자를 지우고 공백을 접는다. 링크가 들어 있으면 메모째 버린다(신고 자체는 받는다).
    const text = String(body.note).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX);
    note = text && !URLISH.test(text) ? text : null;
  }
  if (kind === 'advisor_helpful' && body?.note != null) {
    note = rule.reasons!.has(String(body.note)) ? String(body.note) : null;
  }
  return { kind, target, value, note, session_id };
}
