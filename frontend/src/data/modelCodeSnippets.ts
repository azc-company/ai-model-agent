// 모델별 API 호출 코드를 모델 데이터에서 생성한다.
//
// 예전에는 gpt-4o·o3-mini·claude-3-5-sonnet·gemini-2.5-flash·deepseek-r1 다섯 개의
// 스니펫을 손으로 써두고 modelId 에 그 문자열이 들어있는지로 골랐다. 문제가 둘이었다.
//
//   1. 못 찾으면 `|| 'gpt-4o'` 로 떨어졌고 그 키가 표에 있으니 그대로 반환했다.
//      그래서 GPT-5.6 Luna 를 열어도 model="gpt-4o" 코드가 나왔다. 아래쪽 범용
//      생성기는 도달할 수 없는 죽은 코드였다.
//   2. 카탈로그의 model.id 는 "openai-gpt-5.6-luna" 같은 내부 식별자다. 슬래시를
//      하이픈으로 바꾼 값이라 그대로 API 에 넣으면 어느 엔드포인트에서도 동작하지 않는다.
//
// 지금은 official_url 에서 진짜 슬러그를 뽑아 쓴다. 피드 모델은 OpenRouter 경유가
// 항상 동작하고(카탈로그 데이터의 출처가 거기다), 시드 모델은 공급사 네이티브
// 엔드포인트로 보낸다.

import type { ModelSpec } from '../types';

export interface CodeSnippet {
  python: string;
  javascript: string;
  curl: string;
  langchain: string;
  apiKeyUrl: string;
  /** 코드에 실제로 들어가는 모델 식별자. 모달 헤더에도 이 값을 보여준다. */
  apiModelId: string;
  tip: string;
}

type Sdk = 'openai' | 'anthropic' | 'google';

interface Endpoint {
  label: string;
  sdk: Sdk;
  /** OpenAI 호환 SDK 에 넘길 base_url. 공식 SDK 기본값을 쓰면 null. */
  baseUrl: string | null;
  envVar: string;
  keyUrl: string;
}

const OPENROUTER: Endpoint = {
  label: 'OpenRouter',
  sdk: 'openai',
  baseUrl: 'https://openrouter.ai/api/v1',
  envVar: 'OPENROUTER_API_KEY',
  keyUrl: 'https://openrouter.ai/keys',
};

// 시드 모델(OpenRouter 피드에 없는 것)용 공급사 네이티브 엔드포인트.
const NATIVE: Record<string, Endpoint> = {
  openai:     { label: 'OpenAI',     sdk: 'openai',    baseUrl: null, envVar: 'OPENAI_API_KEY',  keyUrl: 'https://platform.openai.com/api-keys' },
  anthropic:  { label: 'Anthropic',  sdk: 'anthropic', baseUrl: null, envVar: 'ANTHROPIC_API_KEY', keyUrl: 'https://console.anthropic.com/settings/keys' },
  google:     { label: 'Google AI',  sdk: 'google',    baseUrl: null, envVar: 'GEMINI_API_KEY',  keyUrl: 'https://aistudio.google.com/apikey' },
  deepseek:   { label: 'DeepSeek',   sdk: 'openai', baseUrl: 'https://api.deepseek.com',        envVar: 'DEEPSEEK_API_KEY',   keyUrl: 'https://platform.deepseek.com/api_keys' },
  mistralai:  { label: 'Mistral AI', sdk: 'openai', baseUrl: 'https://api.mistral.ai/v1',       envVar: 'MISTRAL_API_KEY',    keyUrl: 'https://console.mistral.ai/api-keys' },
  groq:       { label: 'Groq',       sdk: 'openai', baseUrl: 'https://api.groq.com/openai/v1',  envVar: 'GROQ_API_KEY',       keyUrl: 'https://console.groq.com/keys' },
  'x-ai':     { label: 'xAI',        sdk: 'openai', baseUrl: 'https://api.x.ai/v1',             envVar: 'XAI_API_KEY',        keyUrl: 'https://console.x.ai' },
  perplexity: { label: 'Perplexity', sdk: 'openai', baseUrl: 'https://api.perplexity.ai',       envVar: 'PERPLEXITY_API_KEY', keyUrl: 'https://www.perplexity.ai/settings/api' },
  together:   { label: 'Together AI',sdk: 'openai', baseUrl: 'https://api.together.xyz/v1',     envVar: 'TOGETHER_API_KEY',   keyUrl: 'https://api.together.ai/settings/api-keys' },
  fireworks:  { label: 'Fireworks',  sdk: 'openai', baseUrl: 'https://api.fireworks.ai/inference/v1', envVar: 'FIREWORKS_API_KEY', keyUrl: 'https://fireworks.ai/account/api-keys' },
  upstage:    { label: 'Upstage',    sdk: 'openai', baseUrl: 'https://api.upstage.ai/v1/solar', envVar: 'UPSTAGE_API_KEY',    keyUrl: 'https://console.upstage.ai/api-keys' },
};

// OpenRouter 모델 페이지 주소가 곧 슬러그다. "~openai/gpt-astra-latest" 처럼 ~ 로
// 시작하는 "항상 최신" 라우트도 호출에 그대로 쓰는 값이라 떼지 않는다.
function openRouterSlug(url: string | undefined | null): string | null {
  return /^https?:\/\/openrouter\.ai\/models\/(.+)$/.exec(url || '')?.[1] || null;
}

export function resolveEndpoint(model: ModelSpec): { apiModelId: string; ep: Endpoint } {
  const slug = openRouterSlug(model.official_url);
  if (slug) return { apiModelId: slug, ep: OPENROUTER };

  const native = NATIVE[model.provider_id];
  // 시드 모델의 id 는 대체로 공급사 모델명 그대로다(claude-3-opus-20240229).
  // 네이티브 매핑이 없으면 OpenAI 호환 규약을 따르는 범용 스니펫으로 둔다.
  return {
    apiModelId: model.litellm_id || model.id,
    ep: native || {
      label: model.provider_name || 'Provider',
      sdk: 'openai',
      baseUrl: null,
      envVar: 'LLM_API_KEY',
      keyUrl: model.official_url || model.source_docs_url || '#',
    },
  };
}

const PROMPT = 'FastAPI 기반 REST API 서비스 코드 작성해줘';

function openaiSnippet(id: string, ep: Endpoint): Omit<CodeSnippet, 'apiKeyUrl' | 'apiModelId' | 'tip'> {
  const pyBase = ep.baseUrl ? `\n    base_url="${ep.baseUrl}",` : '';
  const jsBase = ep.baseUrl ? `\n  baseURL: '${ep.baseUrl}',` : '';
  const curlUrl = `${ep.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
  const lcBase = ep.baseUrl ? `, base_url="${ep.baseUrl}"` : '';
  return {
    python: `import os
from openai import OpenAI

client = OpenAI(${pyBase}
    api_key=os.environ.get("${ep.envVar}"),
)

response = client.chat.completions.create(
    model="${id}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "${PROMPT}"},
    ],
    temperature=0.7,
    max_tokens=1024,
)

print(response.choices[0].message.content)`,
    javascript: `import OpenAI from 'openai';

const client = new OpenAI({${jsBase}
  apiKey: process.env.${ep.envVar},
});

const completion = await client.chat.completions.create({
  model: '${id}',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: '${PROMPT}' },
  ],
  max_tokens: 1024,
});

console.log(completion.choices[0].message.content);`,
    curl: `curl ${curlUrl} \\
  -H "Authorization: Bearer $${ep.envVar}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "${PROMPT}"}
    ],
    "max_tokens": 1024
  }'`,
    langchain: `import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

llm = ChatOpenAI(
    model="${id}"${lcBase},
    api_key=os.environ["${ep.envVar}"],
    temperature=0.7,
)

print(llm.invoke([
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="${PROMPT}"),
]).content)`,
  };
}

function anthropicSnippet(id: string, ep: Endpoint) {
  return {
    python: `import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("${ep.envVar}"))

message = client.messages.create(
    model="${id}",
    max_tokens=1024,
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": "${PROMPT}"}],
)

print(message.content[0].text)`,
    javascript: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.${ep.envVar} });

const message = await client.messages.create({
  model: '${id}',
  max_tokens: 1024,
  system: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: '${PROMPT}' }],
});

console.log(message.content[0].text);`,
    curl: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $${ep.envVar}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "max_tokens": 1024,
    "system": "You are a helpful assistant.",
    "messages": [{"role": "user", "content": "${PROMPT}"}]
  }'`,
    langchain: `import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

llm = ChatAnthropic(model="${id}", api_key=os.environ["${ep.envVar}"], max_tokens=1024)

print(llm.invoke([
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="${PROMPT}"),
]).content)`,
  };
}

function googleSnippet(id: string, ep: Endpoint) {
  return {
    python: `import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("${ep.envVar}"))

response = client.models.generate_content(
    model="${id}",
    contents="${PROMPT}",
    config=types.GenerateContentConfig(
        system_instruction="You are a helpful assistant.",
        max_output_tokens=1024,
    ),
)

print(response.text)`,
    javascript: `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.${ep.envVar} });

const response = await ai.models.generateContent({
  model: '${id}',
  contents: '${PROMPT}',
  config: {
    systemInstruction: 'You are a helpful assistant.',
    maxOutputTokens: 1024,
  },
});

console.log(response.text);`,
    curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent" \\
  -H "x-goog-api-key: $${ep.envVar}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "system_instruction": {"parts": [{"text": "You are a helpful assistant."}]},
    "contents": [{"parts": [{"text": "${PROMPT}"}]}],
    "generationConfig": {"maxOutputTokens": 1024}
  }'`,
    langchain: `import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

llm = ChatGoogleGenerativeAI(model="${id}", google_api_key=os.environ["${ep.envVar}"])

print(llm.invoke([
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="${PROMPT}"),
]).content)`,
  };
}

function tipFor(ep: Endpoint, id: string): string {
  if (ep === OPENROUTER) {
    return `OpenRouter 경유 예시입니다. OpenAI 호환 규약이라 기존 코드에서 base_url 과 모델명만 "${id}" 로 바꾸면 됩니다. 공급사와 직접 계약했다면 그쪽 엔드포인트의 모델명은 다를 수 있습니다.`;
  }
  if (ep.sdk === 'anthropic') {
    return 'Anthropic Messages API 는 system 을 messages 배열이 아니라 최상위 system 파라미터로 받고, max_tokens 가 필수입니다.';
  }
  if (ep.sdk === 'google') {
    return 'Gemini API 는 system 프롬프트를 system_instruction 으로 분리해 전달하며, 응답 본문은 response.text 에 담깁니다.';
  }
  return `${ep.label} 는 OpenAI 호환 엔드포인트를 제공합니다. base_url 과 API 키만 바꾸면 OpenAI SDK 를 그대로 쓸 수 있습니다.`;
}

export function getCodeSnippetForModel(model: ModelSpec): CodeSnippet {
  const { apiModelId, ep } = resolveEndpoint(model);
  const body =
    ep.sdk === 'anthropic' ? anthropicSnippet(apiModelId, ep)
    : ep.sdk === 'google' ? googleSnippet(apiModelId, ep)
    : openaiSnippet(apiModelId, ep);

  return { ...body, apiModelId, apiKeyUrl: ep.keyUrl, tip: tipFor(ep, apiModelId) };
}
