import { describe, it, expect, vi } from 'vitest';

vi.mock('@sentry/cloudflare', () => ({ withSentry: (_: unknown, h: unknown) => h, captureException: vi.fn() }));

import { buildArticle } from '../../src/worker';
import { newsPage, sitemap } from '../../src/seo';

const ROW = {
  id: 'a1',
  title: '에이전트 프레임워크 출시',
  report_type: '🔎 심층 리포트',
  executive_summary: '요약',
  analytical_deep_dive: '한국어 본문',
  key_takeaways: JSON.stringify(['에이전트 요약', '개발 팁', 'PM 팁', '비즈니스 팁', '연구 팁']),
  original_sources: JSON.stringify([{ title: 'Src', url: 'https://ex.com' }]),
  key_numbers: JSON.stringify([{ label: '수', value: '9개', source_url: 'https://ex.com' }]),
  our_take: '의견',
  open_questions: '[]',
  tags: JSON.stringify(['#에이전트']),
  created_at: '2026-11-01 00:00:00',
};
const EN = {
  lang: 'en',
  title: 'Framework released',
  report_type: '🔎 In-depth report',
  executive_summary: 'Summary',
  analytical_deep_dive: 'English body',
  key_takeaways: JSON.stringify(['Summary', 'Dev tip', 'PM tip', 'Biz tip', 'Research tip']),
  key_numbers: JSON.stringify([{ label: 'Count', value: '9', source_url: 'https://ex.com' }]),
  our_take: '',
  open_questions: null,
  tags: JSON.stringify(['#Agents']),
};

describe('기사 번역 적용', () => {
  it('번역이 없으면 원문 그대로다', () => {
    const a = buildArticle(ROW);
    expect(a.title).toBe(ROW.title);
    expect(a.blog_summary).toBe('한국어 본문');
  });

  it('번역 필드를 덮고 팁은 위치로 고른다', () => {
    const a = buildArticle(ROW, EN);
    expect(a.title).toBe('Framework released');
    expect(a.blog_summary).toBe('English body');
    expect(a.category).toBe('🔎 In-depth report');
    expect(a.tags).toEqual(['#Agents']);
    expect(a.actionable_insight.developer).toBe('Dev tip');
  });

  it('번역본에서 비어 있는 필드는 원문으로 남는다', () => {
    expect(buildArticle(ROW, EN).our_take).toBe('의견');
  });

  it('분류 탭은 언어와 무관하게 원문으로 판정한다', () => {
    expect(buildArticle(ROW, EN).matched_lenses).toEqual(buildArticle(ROW).matched_lenses);
    expect(buildArticle(ROW, EN).matched_lenses).toContain('agent');
  });
});

describe('기사 SEO', () => {
  const page = { ...ROW, ...EN, mentioned_models: [] };

  it('번역본 페이지는 영어로 선언하고 자기 주소를 표준으로 삼는다', () => {
    const html = newsPage(page, 'en', ['en']);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('rel="canonical" href="https://llmcompass.azclab.com/news/a1?lang=en"');
    expect(html).toContain('hreflang="ko"');
    expect(html).toContain('hreflang="en"');
    expect(html).not.toContain('hreflang="fr"');
    expect(html).not.toContain('>출처<');
  });

  it('번역이 없는 언어로 들어오면 한국어 페이지로 선언한다', () => {
    const html = newsPage({ ...ROW, mentioned_models: [] }, 'fr', ['en']);
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain('rel="canonical" href="https://llmcompass.azclab.com/news/a1"');
  });

  it('번역이 하나도 없으면 다른 언어를 광고하지 않는다', () => {
    const html = newsPage({ ...ROW, mentioned_models: [] }, 'ko');
    expect(html).toContain('hreflang="ko"');
    expect(html).not.toContain('hreflang="en"');
  });

  it('사이트맵도 번역이 있는 언어만 싣고 모델 페이지는 그대로다', () => {
    const xml = sitemap(['m1'], ['a1', 'a2'], [], { a1: ['en'] });
    const entry = (loc: string) => xml.split('<url>').find((u) => u.includes(`<loc>https://llmcompass.azclab.com${loc}</loc>`))!;
    expect(entry('/news/a1')).toContain('hreflang="en"');
    expect(entry('/news/a2')).not.toContain('hreflang="en"');
    expect(entry('/models/m1')).toContain('hreflang="fr"');
  });
});
