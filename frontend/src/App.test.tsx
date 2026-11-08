import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { App, matchesCatalog } from './App';


afterEach(cleanup);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
});

test('renders the application shell while data loads', () => {
  render(<App />);

  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /^주요 메뉴$/i })).toBeInTheDocument();
});

// 첫 화면은 AI 트렌드 뉴스 — ?tab= 없이 들어오면 뉴스 탭이 열린다 (2026-11-09 결정)
test('주소에 tab 이 없으면 AI 트렌드 뉴스 탭이 첫 화면이다', () => {
  localStorage.setItem('llm_compass_lang', 'ko');
  window.history.replaceState({}, '', '/');

  render(<App />);
  const nav = screen.getByRole('navigation', { name: /^주요 메뉴$/i });
  expect(within(nav).getByRole('button', { name: /AI 트렌드 뉴스/ })).toHaveAttribute('aria-current', 'page');
});

// 검색어 원문이 서버로 새는 걸 막는 게이트 — 자유 입력이라 PII 가 섞일 수 있다.
const MODELS = [{ name: 'Claude Opus 4.5', provider_name: 'Anthropic' }] as never;
const PROVIDERS = [{ name: 'OpenAI' }] as never;

test('카탈로그에 걸리는 검색어만 라벨로 내보낸다', () => {
  expect(matchesCatalog('claude', MODELS, PROVIDERS)).toBe(true);
  expect(matchesCatalog('anthropic', MODELS, PROVIDERS)).toBe(true);
  expect(matchesCatalog('openai', MODELS, PROVIDERS)).toBe(true);
});

test('카탈로그에 없는 자유 입력은 내보내지 않는다', () => {
  expect(matchesCatalog('azc2004@gmail.com', MODELS, PROVIDERS)).toBe(false);
  expect(matchesCatalog('010-1234-5678', MODELS, PROVIDERS)).toBe(false);
  expect(matchesCatalog('c', MODELS, PROVIDERS)).toBe(false); // 1글자는 아무거나 걸린다
});

// ?article= 은 뉴스 탭에서만 의미가 있다. 다른 탭으로 갔는데도 남아 있으면,
// 뉴스로 돌아왔을 때 NewsPulseView 가 URL 을 읽어 보던 기사를 다시 연다.
// 독자는 목록을 기대하는데 화면이 멈춘 것처럼 보인다.
test('뉴스 탭을 떠나면 URL 의 article 파라미터를 지운다', async () => {
  // jsdom 기본 언어는 en 이라 한국어 메뉴 이름을 찾으려면 명시해야 한다.
  localStorage.setItem('llm_compass_lang', 'ko');
  window.history.replaceState({}, '', '/?tab=news&article=synth-abc123');

  render(<App />);
  const nav = screen.getByRole('navigation', { name: /^주요 메뉴$/i });
  const target = within(nav).getByRole('button', { name: /모델 카탈로그/ });
  await userEvent.click(target);

  const params = new URLSearchParams(window.location.search);
  expect(params.get('tab')).toBe('dashboard');
  expect(params.get('article')).toBeNull();
});

test('뉴스 탭 안에서는 article 파라미터를 유지한다', async () => {
  localStorage.setItem('llm_compass_lang', 'ko');
  window.history.replaceState({}, '', '/?tab=dashboard&article=synth-abc123');

  render(<App />);
  const nav = screen.getByRole('navigation', { name: /^주요 메뉴$/i });
  await userEvent.click(within(nav).getByRole('button', { name: /AI 트렌드 뉴스/ }));

  expect(new URLSearchParams(window.location.search).get('article')).toBe('synth-abc123');
});
