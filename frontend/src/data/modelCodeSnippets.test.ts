import { describe, it, expect } from 'vitest';
import { getCodeSnippetForModel, resolveEndpoint } from './modelCodeSnippets';
import type { ModelSpec } from '../types';

const base = {
  name: 'X', provider_name: 'P', tier: 'Frontier', context_window: 1000,
} as unknown as ModelSpec;

const model = (over: Partial<ModelSpec>): ModelSpec => ({ ...base, ...over } as ModelSpec);

describe('API 코드 스니펫', () => {
  // 이 파일이 존재하는 이유. 예전 구현은 이름이 안 맞으면 'gpt-4o' 로 떨어졌고,
  // 그 키의 스니펫이 표에 있어서 그대로 반환됐다. GPT-5.6 Luna 를 열면
  // model="gpt-4o" 코드가 나왔다.
  it('알려진 이름이 아니어도 그 모델의 식별자를 쓴다', () => {
    const s = getCodeSnippetForModel(model({
      id: 'openai-gpt-5.6-luna',
      provider_id: 'openai',
      official_url: 'https://openrouter.ai/models/openai/gpt-5.6-luna',
    }));
    for (const code of [s.python, s.javascript, s.curl, s.langchain]) {
      expect(code).toContain('openai/gpt-5.6-luna');
      expect(code).not.toContain('gpt-4o');
    }
    expect(s.apiModelId).toBe('openai/gpt-5.6-luna');
  });

  it('카탈로그 내부 id 를 코드에 넣지 않는다', () => {
    const s = getCodeSnippetForModel(model({
      id: 'google-gemini-2.5-flash-image',
      provider_id: 'google',
      official_url: 'https://openrouter.ai/models/google/gemini-2.5-flash-image',
    }));
    // 하이픈으로 뭉갠 내부 id 는 어느 엔드포인트에서도 동작하지 않는다.
    expect(s.python).not.toContain('google-gemini-2.5-flash-image');
    expect(s.python).toContain('google/gemini-2.5-flash-image');
  });

  it('OpenRouter 모델은 OpenRouter 엔드포인트와 키를 안내한다', () => {
    const s = getCodeSnippetForModel(model({
      id: 'z-ai-glm-5.3', provider_id: 'z-ai',
      official_url: 'https://openrouter.ai/models/z-ai/glm-5.3',
    }));
    expect(s.python).toContain('https://openrouter.ai/api/v1');
    expect(s.python).toContain('OPENROUTER_API_KEY');
    expect(s.apiKeyUrl).toBe('https://openrouter.ai/keys');
  });

  it('시드 모델은 공급사 네이티브 SDK 로 간다', () => {
    const s = getCodeSnippetForModel(model({
      id: 'claude-3-opus-20240229', provider_id: 'anthropic',
      official_url: 'https://docs.anthropic.com/en/docs/about-claude/models',
    }));
    expect(s.python).toContain('anthropic.Anthropic');
    expect(s.python).toContain('claude-3-opus-20240229');
    expect(s.curl).toContain('anthropic-version');
  });

  it('~ 로 시작하는 최신 라우트 슬러그를 그대로 쓴다', () => {
    const { apiModelId } = resolveEndpoint(model({
      id: 'openai-gpt-astra-latest', provider_id: 'openai',
      official_url: 'https://openrouter.ai/models/~openai/gpt-astra-latest',
    }));
    expect(apiModelId).toBe('~openai/gpt-astra-latest');
  });

  it('매핑이 없는 공급사도 코드가 나온다', () => {
    const s = getCodeSnippetForModel(model({
      id: 'some-model', provider_id: 'nobody', official_url: '',
    }));
    expect(s.python).toContain('some-model');
    expect(s.apiModelId).toBe('some-model');
  });
});
