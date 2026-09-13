import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { LanguageProvider } from '../context/LanguageContext';
import { Dashboard } from './Dashboard';

vi.mock('../api', () => ({ fetchModels: vi.fn().mockResolvedValue([]), fetchProviders: vi.fn().mockResolvedValue([]) }));

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  // 라벨이 언어에 따라 달라진다. jsdom 의 navigator.language 에 기대면 en 으로 떨어지므로
  // 검사할 언어를 명시한다.
  localStorage.setItem('llm_compass_lang', 'ko');
});

test('persists the selected catalog density', async () => {
  render(<LanguageProvider><Dashboard /></LanguageProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: '컴팩트 밀도' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: '컴팩트 밀도' }));
  expect(localStorage.getItem('catalog-density')).toBe('compact');
});

// 상단 카드는 카탈로그 데이터에서 계산한다. 예전에는 모델명과 수치가 문자열로 박혀 있어
// 새 모델이 들어와도 첫 화면이 몇 달째 같았다.
const model = (over: Record<string, unknown>) => ({
  id: String(over.name), provider_id: 'x', provider_name: 'OpenAI', name: 'm', tier: 'Frontier',
  is_open_weight: false, license_type: 'Proprietary', parameter_count_b: 0, architecture: 'Dense',
  context_window: 128000, max_output_tokens: 4096, modality: ['text'], description: '',
  official_url: '', source_docs_url: '', api_pricing: { input_price_per_1m: 1, output_price_per_1m: 4, currency: 'USD' },
  quota: {}, benchmarks: { arena_elo: null }, is_verified: true, litellm_id: '', supports_reasoning: false,
  supports_web_search: false, is_deprecated: false, is_new: false, first_seen_at: '2026-08-01 00:00:00',
  source: 'feed', ...over,
}) as never;

test('highlight cards and default order come from catalog data, not hardcoded names', async () => {
  const models = [
    model({ name: 'Old Seed Leader', benchmarks: { arena_elo: 1400 }, source: 'seed', context_window: 10_000_000 }),
    model({ name: 'Brand New Frontier', is_new: true, first_seen_at: '2026-09-06 22:45:16', context_window: 2_000_000 }),
    model({ name: 'Cheap Frontier', provider_name: 'DeepSeek', api_pricing: { input_price_per_1m: 0.05, output_price_per_1m: 0.1, currency: 'USD' } }),
    model({ name: 'Auto Router', context_window: 5_000_000 }),
  ];
  render(<LanguageProvider><Dashboard models={models} providers={[]} /></LanguageProvider>);
  await waitFor(() => expect(screen.getByText('✨ JUST ADDED')).toBeInTheDocument());

  const card = (label: string) => screen.getByText(label).closest('.bento-card-2026') as HTMLElement;
  expect(within(card('✨ JUST ADDED')).getByText('Brand New Frontier')).toBeInTheDocument();
  expect(within(card('✨ JUST ADDED')).getByText('1 new')).toBeInTheDocument();
  // 시드 데이터(10M)와 라우터(5M)는 제외하고 동기화된 모델 중 최대
  expect(within(card('📏 LONGEST CONTEXT')).getByText('Brand New Frontier')).toBeInTheDocument();
  expect(within(card('💎 BEST FRONTIER VALUE')).getByText('Cheap Frontier')).toBeInTheDocument();
  expect(screen.queryByText(/DeepSeek R1 \/ GPT-4o|2,100 TPS/)).not.toBeInTheDocument();
});
