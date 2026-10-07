import { describe, it, expect } from 'vitest';
import { parseFeedback, NOTE_MAX } from '../../src/feedback';

const S = 'sess-123';

describe('비공개 피드백 입력 검증', () => {
  it('정상 입력을 받는다', () => {
    expect(parseFeedback({ kind: 'article_helpful', target: 'synth-025b21c09425', value: 'up', session_id: S }))
      .toEqual({ kind: 'article_helpful', target: 'synth-025b21c09425', value: 'up', note: null, session_id: S });
    expect(parseFeedback({ kind: 'model_error', target: 'nex-agi-nex-n2.5-mini:free', value: 'price', note: '출력 단가가 공식 문서와 다릅니다', session_id: S })?.note)
      .toBe('출력 단가가 공식 문서와 다릅니다');
  });

  it('모르는 종류·값·형식은 받지 않는다', () => {
    expect(parseFeedback({ kind: 'comment', target: 'x', value: 'up', session_id: S })).toBeNull();
    expect(parseFeedback({ kind: 'article_helpful', target: 'x', value: 'love', session_id: S })).toBeNull();
    expect(parseFeedback({ kind: 'article_helpful', target: '<script>', value: 'up', session_id: S })).toBeNull();
    expect(parseFeedback({ kind: 'article_helpful', target: 'x', value: 'up', session_id: 'bad id!' })).toBeNull();
    expect(parseFeedback(null)).toBeNull();
  });

  it('메모에 링크가 있으면 메모만 버리고 신고는 받는다', () => {
    for (const note of ['싸게 팝니다 https://spam.example', 'www.casino-win.top 방문', '여기로 bit-coin.xyz']) {
      const r = parseFeedback({ kind: 'model_error', target: 'm', value: 'other', note, session_id: S });
      expect(r?.value).toBe('other');
      expect(r?.note).toBeNull();
    }
  });

  it('메모는 길이를 자르고 제어 문자를 지운다', () => {
    const r = parseFeedback({ kind: 'model_error', target: 'm', value: 'other', note: 'a\u0000b\n\n c' + 'x'.repeat(1000), session_id: S });
    expect(r!.note!.length).toBe(NOTE_MAX);
    expect(r!.note!.startsWith('a b c')).toBe(true);
  });

  it('자유 입력은 오류 신고에만 있다', () => {
    expect(parseFeedback({ kind: 'article_helpful', target: 'x', value: 'down', note: '아무 말', session_id: S })!.note).toBeNull();
    // 추천기는 정해진 이유 중 하나만
    expect(parseFeedback({ kind: 'advisor_helpful', target: 'coding', value: 'down', note: 'cost', session_id: S })!.note).toBe('cost');
    expect(parseFeedback({ kind: 'advisor_helpful', target: 'coding', value: 'down', note: '자유 입력', session_id: S })!.note).toBeNull();
  });
});
