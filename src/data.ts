export const PROVIDERS = [
  {
    "id": "openai",
    "name": "OpenAI",
    "website": "https://openai.com",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
    "description": "최첨단 GPT 시리즈, o1/o3 추론, Realtime, Audio, Moderation 및 Embedding 전 모델 라인업",
    "official_docs_url": "https://platform.openai.com/docs/models"
  },
  {
    "id": "anthropic",
    "name": "Anthropic",
    "website": "https://anthropic.com",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg",
    "description": "코딩, 복잡한 추론 및 문서 분석 특화 Claude 3/3.5/4/5 시리즈 전체 라인업",
    "official_docs_url": "https://docs.anthropic.com/en/docs/about-claude/models"
  },
  {
    "id": "google",
    "name": "Google",
    "website": "https://deepmind.google",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    "description": "초대형 200만 컨텍스트 및 네이티브 멀티모달 Gemini / Gemma 전체 라인업",
    "official_docs_url": "https://ai.google.dev/gemini-api/docs/models/gemini"
  },
  {
    "id": "aws_bedrock",
    "name": "AWS Bedrock",
    "website": "https://aws.amazon.com/bedrock",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    "description": "Amazon Nova, Titan 및 Bedrock 관리형 Claude, Llama, Mistral, Command 전체 라인업",
    "official_docs_url": "https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html"
  },
  {
    "id": "deepseek",
    "name": "DeepSeek",
    "website": "https://deepseek.com",
    "logo_url": "https://chat.deepseek.com/favicon.ico",
    "description": "초고성능 오픈웨이트 MoE 및 추론 모델 (DeepSeek R1, V4, V3, Coder, Math, V2.5)",
    "official_docs_url": "https://api-docs.deepseek.com"
  },
  {
    "id": "meta",
    "name": "Meta",
    "website": "https://ai.meta.com",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    "description": "글로벌 오픈웨이트 생태계를 주도하는 Llama 4 / 3.3 / 3.2 / 3.1 / 3 / 2 및 Code Llama 전시리즈",
    "official_docs_url": "https://llama.meta.com/docs/model-cards-and-prompt-formats"
  },
  {
    "id": "qwen",
    "name": "Alibaba Qwen",
    "website": "https://qwenlm.github.io",
    "logo_url": "https://qwenlm.github.io/assets/logo.png",
    "description": "다국어, 코딩, VL 및 에이전트에 강력한 Qwen 3.6 / 2.5 / Coder / VL 전 시리즈",
    "official_docs_url": "https://qwenlm.github.io"
  },
  {
    "id": "mistral",
    "name": "Mistral AI",
    "website": "https://mistral.ai",
    "logo_url": "https://mistral.ai/images/logo-mistral-ai.svg",
    "description": "유럽 대표 오픈소스 Mistral Large/Small, Codestral, Mixtral 8x22B/8x7B, Pixtral 전 라인업",
    "official_docs_url": "https://docs.mistral.ai/getting-started/models/models_overview"
  },
  {
    "id": "microsoft",
    "name": "Microsoft",
    "website": "https://azure.microsoft.com",
    "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    "description": "엣지 및 소형 하드웨어 최적화 Phi-4 / Phi-3.5 / Phi-3 전 시리즈",
    "official_docs_url": "https://huggingface.co/microsoft"
  },
  {
    "id": "cohere",
    "name": "Cohere",
    "website": "https://cohere.com",
    "logo_url": "https://cohere.com/favicon.ico",
    "description": "기업용 검색/RAG 및 다국어 텍스트 처리에 특화된 Command R+ / R / Light / Embed",
    "official_docs_url": "https://docs.cohere.com/docs/models"
  },
  {
    "id": "perplexity",
    "name": "Perplexity",
    "website": "https://perplexity.ai",
    "logo_url": "https://perplexity.ai/favicon.ico",
    "description": "실시간 웹 검색 통합 및 논리 추론 특화 Sonar Pro / Reasoning / Small",
    "official_docs_url": "https://docs.perplexity.ai/guides/model-cards"
  },
  {
    "id": "z-ai",
    "name": "Z.ai",
    "website": "https://zhipuai.cn",
    "logo_url": "https://zhipuai.cn/logo.png",
    "description": "에이전트 코딩 및 중국어/영어 특화 GLM-5.2 / GLM-4 Plus / Air / Flash / Long",
    "official_docs_url": "https://open.bigmodel.cn/dev/howuse/model"
  },
  {
    "id": "moonshotai",
    "name": "Moonshot AI",
    "website": "https://moonshot.cn",
    "logo_url": "https://moonshot.cn/favicon.ico",
    "description": "초장문 200만 컨텍스트 및 MoE 추론 특화 Kimi K2.7 / K1.5 / v1-128k",
    "official_docs_url": "https://platform.moonshot.cn/docs/intro"
  }
];

export const GPU_SPECS = [
  {
    "id": "rtx_3090",
    "name": "NVIDIA RTX 3090",
    "vram_gb": 24,
    "memory_bandwidth_gbps": 936,
    "purchase_price_usd": 950,
    "cloud_hourly_on_demand": 0.45,
    "cloud_hourly_spot": 0.22,
    "power_watts": 350
  },
  {
    "id": "rtx_4090",
    "name": "NVIDIA RTX 4090",
    "vram_gb": 24,
    "memory_bandwidth_gbps": 1008,
    "purchase_price_usd": 1800,
    "cloud_hourly_on_demand": 0.75,
    "cloud_hourly_spot": 0.38,
    "power_watts": 450
  },
  {
    "id": "a100_80gb",
    "name": "NVIDIA A100 SXM4 (80GB)",
    "vram_gb": 80,
    "memory_bandwidth_gbps": 2039,
    "purchase_price_usd": 12000,
    "cloud_hourly_on_demand": 1.6,
    "cloud_hourly_spot": 0.85,
    "power_watts": 400
  },
  {
    "id": "h100_80gb",
    "name": "NVIDIA H100 SXM5 (80GB)",
    "vram_gb": 80,
    "memory_bandwidth_gbps": 3350,
    "purchase_price_usd": 28000,
    "cloud_hourly_on_demand": 2.8,
    "cloud_hourly_spot": 1.5,
    "power_watts": 700
  },
  {
    "id": "b200_192gb",
    "name": "NVIDIA B200 (192GB)",
    "vram_gb": 192,
    "memory_bandwidth_gbps": 8000,
    "purchase_price_usd": 38000,
    "cloud_hourly_on_demand": 5.2,
    "cloud_hourly_spot": 2.8,
    "power_watts": 1000
  }
];

export const TRENDING_TEMPLATES = [
  {
    "rank": 1,
    "id": "code_agent",
    "title": "자율 코딩 에이전트 (Autonomous Coding Agent)",
    "category": "DevTools / Code Generation",
    "description": "복잡한 코드 리팩토링, 버그 수정 및 풀스택 기능 자동 생성을 수행하는 개발 코파일럿 에이전트",
    "icon": "code",
    "typical_monthly_requests": 50000,
    "request": {
      "service_type": "code_agent",
      "monthly_requests": 50000,
      "avg_input_tokens": 3000,
      "avg_output_tokens": 1500,
      "primary_priority": "quality",
      "requires_multimodal": false,
      "requires_coding": true,
      "custom_prompt": null,
      "language": "ko"
    }
  },
  {
    "rank": 2,
    "id": "rag_chatbot",
    "title": "기업용 사내 지식 RAG 챗봇 (Enterprise RAG)",
    "category": "Enterprise SaaS / Knowledge Base",
    "description": "사내 PDF, Confluence 문서, Notion을 하이브리드 임베딩으로 검색하여 완벽 출처와 함께 답변하는 챗봇",
    "icon": "database",
    "typical_monthly_requests": 200000,
    "request": {
      "service_type": "rag",
      "monthly_requests": 200000,
      "avg_input_tokens": 2000,
      "avg_output_tokens": 600,
      "primary_priority": "balanced",
      "requires_multimodal": false,
      "requires_coding": false,
      "custom_prompt": null,
      "language": "ko"
    }
  },
  {
    "rank": 3,
    "id": "multimodal_cs",
    "title": "멀티모달 24/7 고객지원 CS 봇 (Multimodal Support)",
    "category": "Customer Service / Support",
    "description": "고객이 캡처한 이미지, 영수증, 텍스트 질문을 동시에 분석하여 환불/장애 처리를 자동화하는 봇",
    "icon": "headset",
    "typical_monthly_requests": 150000,
    "request": {
      "service_type": "multimodal",
      "monthly_requests": 150000,
      "avg_input_tokens": 1500,
      "avg_output_tokens": 400,
      "primary_priority": "balanced",
      "requires_multimodal": true,
      "requires_coding": false,
      "custom_prompt": null,
      "language": "ko"
    }
  },
  {
    "rank": 4,
    "id": "translation_api",
    "title": "글로벌 실시간 다국어 번역엔진 (Global Translator)",
    "category": "Localization / API Service",
    "description": "100개 이상의 언어로 문맥과 뉘앙스를 보존하며 초고속으로 실시간 번역을 제공하는 엔터프라이즈 API",
    "icon": "globe",
    "typical_monthly_requests": 500000,
    "request": {
      "service_type": "translation",
      "monthly_requests": 500000,
      "avg_input_tokens": 800,
      "avg_output_tokens": 800,
      "primary_priority": "cost",
      "requires_multimodal": false,
      "requires_coding": false,
      "custom_prompt": null,
      "language": "ko"
    }
  },
  {
    "rank": 5,
    "id": "content_copilot",
    "title": "마케팅 콘텐츠 생성 코파일럿 (Content Copilot)",
    "category": "Marketing / Creative Writing",
    "description": "블로그 포스팅, SNS 카피, 이메일 마케팅 문구를 페르소나별로 자동 생성하는 생성형 인공지능 도구",
    "icon": "sparkles",
    "typical_monthly_requests": 80000,
    "request": {
      "service_type": "content_creation",
      "monthly_requests": 80000,
      "avg_input_tokens": 1200,
      "avg_output_tokens": 1000,
      "primary_priority": "balanced",
      "requires_multimodal": true,
      "requires_coding": false,
      "custom_prompt": null,
      "language": "ko"
    }
  }
];
