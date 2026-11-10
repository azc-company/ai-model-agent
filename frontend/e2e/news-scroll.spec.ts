import { expect, test, type Page } from '@playwright/test';
import { stubCatalog } from './fixtures';

// 목록이 비슷한 제목·같은 URL 을 중복으로 걸러내므로 서로 달라야 한다.
const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'Indigo', 'Juliet', 'Kilo', 'Lima'];
const articles = NAMES.map((name, i) => ({
  id: `a${i}`, title: `${name} ${i} launch`, source_name: 'Src', source_url: `https://example.com/${name}`,
  published_at: '2026-01-01T00:00:00Z', category: '심층', image_url: '', summary_bullets: ['요약', '요약'],
  actionable_insight: {}, impact_score: 80, tags: [], matched_lenses: [], is_synthesized: false,
}));

async function openNews(page: Page, path = '/?tab=news') {
  await page.addInitScript(() => localStorage.setItem('llm_compass_lang', 'ko'));
  await stubCatalog(page);
  await page.route('**/api/v1/changelog*', (r) => r.fulfill({ json: [] }));
  await page.route('**/api/v1/news/pulse*', (r) => r.fulfill({ json: { articles, total_count: 12, last_updated: '' } }));
  await page.route('**/api/v1/news/articles/*', (r) => r.fulfill({
    json: { blog_summary: '본문 문단입니다.\n\n'.repeat(400), key_numbers: [], our_take: '', open_questions: [], mentioned_models: [] },
  }));
  await page.goto(path);
}

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));
const backButton = (page: Page) => page.getByRole('button', { name: '목록으로 돌아가기' }).last();

async function openArticleFromMiddle(page: Page) {
  const heading = page.getByRole('heading', { name: /Indigo 8 launch/ });
  await heading.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  expect(before).toBeGreaterThan(300);
  await heading.click();
  await expect(backButton(page)).toBeVisible();
  await expect.poll(() => scrollY(page)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 500));   // 기사를 읽다가 돌아온다
  return { before, heading };
}

test('목록으로 돌아가면 보던 위치에 머문다', async ({ page }) => {
  test.setTimeout(120_000);
  await openNews(page);
  const { before, heading } = await openArticleFromMiddle(page);
  await backButton(page).click();
  await expect(heading).toBeVisible();
  await expect.poll(() => scrollY(page)).toBe(before);
});

test('브라우저 뒤로 가기도 보던 위치로 돌아온다', async ({ page }) => {
  test.setTimeout(120_000);
  await openNews(page);
  const { before, heading } = await openArticleFromMiddle(page);
  await page.goBack();
  await expect(heading).toBeVisible();
  await expect.poll(() => scrollY(page)).toBe(before);
});

test('공유 링크로 상세부터 열었다면 목록 맨 위로 간다', async ({ page }) => {
  test.setTimeout(120_000);
  await openNews(page, '/?tab=news&article=a8');
  await expect(backButton(page)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await backButton(page).click();
  await expect(page.getByRole('heading', { name: /Alpha 0 launch/ })).toBeVisible();
  await expect.poll(() => scrollY(page)).toBe(0);
});
