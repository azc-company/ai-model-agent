import React, { useState } from 'react';
import { 
  Sparkles, Code, Database, Headset, Globe, Cpu, Check, Copy, Download, 
  Zap, CheckCircle2, ChevronRight, Layers, X, Loader2
} from 'lucide-react';
import type { RecommendationRequest, ArchitectureRecommendationResult, TrendingTemplate } from '../types';
import { API_BASE_URL } from '../api';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_SAMPLE_RESULT: ArchitectureRecommendationResult = {
  service_name: "sampleServiceName",
  monthly_requests: 100000,
  total_monthly_input_tokens_m: 200.0,
  total_monthly_output_tokens_m: 100.0,
  combos: [
    {
      id: "smart_balanced",
      name: "smartRouterName",
      tag: "RECOMMENDED",
      description: "smartRouterDesc",
      items: [
        {
          role: "Router & Classifier (70% traffic)",
          model_id: "groq-llama-3.3-70b",
          model_name: "Llama 3.3 70B (Groq LPU)",
          provider_name: "Groq",
          allocation_percent: 70.0,
          monthly_estimated_cost: 82.60
        },
        {
          role: "Primary Reasoning Engine (30% traffic)",
          model_id: "deepseek-r1",
          model_name: "DeepSeek R1 (Reasoning)",
          provider_name: "DeepSeek",
          allocation_percent: 30.0,
          monthly_estimated_cost: 65.70
        }
      ],
      total_monthly_cost: 148.30,
      avg_arena_elo: 1358,
      key_advantages: ["advCost60", "advP95", "advCircuit"]
    },
    {
      id: "best_quality",
      name: "bestName",
      tag: "FRONTIER",
      description: "bestDesc",
      items: [
        {
          role: "Frontier Single Engine (100% traffic)",
          model_id: "claude-3-5-sonnet",
          model_name: "Claude 3.5 Sonnet",
          provider_name: "Anthropic",
          allocation_percent: 100.0,
          monthly_estimated_cost: 2100.00
        }
      ],
      total_monthly_cost: 2100.00,
      avg_arena_elo: 1365,
      key_advantages: ["advTopReason", "advSimple", "advElo"]
    },
    {
      id: "ultra_budget",
      name: "budgetName",
      tag: "BUDGET",
      description: "budgetDesc",
      items: [
        {
          role: "Open-Weight Engine (100% traffic)",
          model_id: "deepseek-v3",
          model_name: "DeepSeek V3",
          provider_name: "DeepSeek",
          allocation_percent: 100.0,
          monthly_estimated_cost: 41.40
        }
      ],
      total_monthly_cost: 41.40,
      avg_arena_elo: 1320,
      key_advantages: ["advExtremeSave", "advHighVolume", "advOpenFlex"]
    }
  ],
  hosting_options: [
    {
      provider: "Vercel + Render.com (Serverless & PaaS)",
      category: "Serverless PaaS",
      estimated_monthly_cost: 20.0,
      description: "프론트엔드는 Vercel CDN, 백엔드는 Render.com Python PaaS에 자동 배포. 100% 무료 시작 가능.",
      recommended_for: "초기 스타트업, MVP 검증 및 빠른 프로덕션 배포"
    },
    {
      provider: "AWS ECS Fargate + Amazon Bedrock",
      category: "Cloud Native (Enterprise)",
      estimated_monthly_cost: 80.0,
      description: "보안 및 프라이빗 VPC 내에 백엔드 컨테이너 구축. 엔터프라이즈 IAM 권한 및 오토스케일링 적용.",
      recommended_for: "보안 규정이 엄격한 기업 및 대규모 프로덕션"
    },
    {
      provider: "RunPod / Modal GPU Instance (Self-Hosted)",
      category: "GPU Serverless / Self-Hosted",
      estimated_monthly_cost: 120.0,
      description: "Llama/Qwen 등 오픈웨이트 모델을 독립 GPU(NVIDIA A10G/L40S) 서버리스로 직접 서빙.",
      recommended_for: "자체 데이터 보안 및 오픈웨이트 직접 파인튜닝 서비스"
    }
  ],
  markdown_spec: `# 🚀 자율 코딩 에이전트 서비스 AI 시스템 개발 명세서 (Sample)\n\n## 1. Executive Summary\n본 아키텍처는 월 100,000건의 자율 코딩 요구사항을 처리하기 위한 최적의 2-Tier 라우터 구조입니다.\n`,
  spec_bundle: {
    agents_md: `# 🤖 [AGENTS.md] AI Coding Agent Directive & Execution Rules\n\n> **Target Agent**: Cursor IDE, Claude Code, GitHub Copilot Workspace, Devin\n> **Service**: 자율 코딩 에이전트 서비스 (CODE_AGENT)\n\n---\n\n## 1. 📌 Primary Directives & Architecture Pattern\n- **Routing Pattern**: Smart 2-Tier Multi-Model Routing (Llama 3.3 70B (Groq LPU) + DeepSeek R1 (Reasoning))\n- **Circuit Breaker**: Implement automatic fallback to secondary model on timeout (>15s) or HTTP 5xx.\n- **Async Non-Blocking**: All I/O operations MUST use \`async/await\` with \`httpx.AsyncClient\`.\n\n## 2. 🛡️ Coding Guidelines & Safety Rules\n1. **No Superfluous Dependencies**: Use standard library or \`fastapi\`, \`httpx\`, \`pydantic\`, \`python-dotenv\`.\n2. **Type Hinting**: All functions MUST have PEP 484 type annotations and Google-style docstrings.\n3. **Guardrails**: Validate input prompts for length (<500 chars) and sanitization before calling LLM APIs.\n4. **Environment Variables**: Load secrets exclusively via \`.env\` (Never hardcode API keys).\n`,
    architecture_md: `# 🏗️ [ARCHITECTURE.md] System Design & Flow Specifications\n\n> **System**: 자율 코딩 에이전트 서비스\n> **Target SLA**: Latency P95 < 400ms (Simple) / < 2.5s (Complex), Availability 99.9%\n\n---\n\n## 1. Sequence Diagram (Request Flow)\n\n\`\`\`mermaid\nsequenceDiagram\n    autonumber\n    actor Client as 👤 Client / Frontend\n    participant GW as 🌐 API Gateway (FastAPI)\n    participant Router as ⚡ Router (Groq LPU)\n    participant Primary as 🧠 Primary (DeepSeek R1)\n    participant Fallback as 🛡️ Fallback Backup\n\n    Client->>GW: POST /api/v1/generate\n    GW->>Router: Classify Query Complexity (Simple vs Complex)\n    alt Simple Query (70% traffic)\n        Router-->>GW: Direct Fast Response\n    else Complex Query (30% traffic)\n        GW->>Primary: Execute Reasoning Inference\n        alt Primary Success\n            Primary-->>GW: High Quality Result\n        else Primary Timeout / Failure\n            GW->>Fallback: Route to Backup Engine\n            Fallback-->>GW: Fallback Result\n        end\n    end\n    GW-->>Client: 200 OK (Response)\n\`\`\`\n`,
    database_schema_md: `# 🗄️ [DATABASE_SCHEMA.md] Database ERD & DDL Specification\n\n> **Target DB**: PostgreSQL / MariaDB + Redis Cache\n> **Domain**: 자율 코딩 에이전트 서비스 (CODE_AGENT)\n\n---\n\n## 1. Entity Relationship Diagram (Mermaid ERD)\n\n\`\`\`mermaid\nerDiagram\n    USERS ||--o{ REQUEST_LOGS : "executes"\n    USERS ||--o{ API_KEYS : "owns"\n    REQUEST_LOGS }|--|| MODEL_ROUTING_EVENTS : "triggers"\n\`\`\`\n\n## 2. PostgreSQL DDL Schemas\n\`\`\`sql\nCREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE);\nCREATE TABLE request_logs (id UUID PRIMARY KEY, latency_ms NUMERIC(8,2));\n\`\`\`\n`,
    tasks_md: `# 📝 [TASKS.md] Step-by-Step Agent Implementation Checklist\n\nExecute the following tasks sequentially. Check off items as they pass automated verification.\n\n---\n\n### Phase 1: Environment & Guardrails Setup\n- [ ] **Task 1.1**: Create \`requirements.txt\` with \`fastapi\`, \`uvicorn\`, \`httpx\`, \`pydantic\`, \`python-dotenv\`.\n- [ ] **Task 1.2**: Create \`.env.example\` with API keys template (\`GROQ_API_KEY\`, \`OPENAI_API_KEY\`, \`DEEPSEEK_API_KEY\`).\n- [ ] **Task 1.3**: Implement \`app/guardrails.py\` for Prompt Injection & Off-Topic regex filtering.\n\n### Phase 2: Multi-Model Router Pipeline Implementation\n- [ ] **Task 2.1**: Build \`GenerateRequest\` and \`GenerateResponse\` Pydantic schemas.\n- [ ] **Task 2.2**: Implement \`ProductionAIRouter\` class with Async HTTP Client and Circuit Breaker pattern.\n- [ ] **Task 2.3**: Wire primary model (\`DeepSeek R1\`) and router model (\`Groq LPU\`) fallback routes.\n\n### Phase 3: Verification & Deployment\n- [ ] **Task 3.1**: Write FastAPI \`/api/v1/generate\` POST endpoint in \`app/main.py\`.\n- [ ] **Task 3.2**: Create production \`Dockerfile\` and \`docker-compose.yml\`.\n- [ ] **Task 3.3**: Run \`pytest\` or curl verification script to ensure < 400ms latency on simple queries.\n`,
    deployment_md: `# 🐳 [DEPLOYMENT.md] Infrastructure & Deployment Specification\n\n> **Hosting**: Vercel + Render.com (Serverless & PaaS)\n> **Est. Monthly OpEx**: $20.00/mo\n\n---\n\n## 1. Environment Variables (\`.env.example\`)\n\`\`\`env\nPORT=8080\nENV=production\nGROQ_API_KEY=gsk_your_groq_api_key\nDEEPSEEK_API_KEY=sk_your_deepseek_api_key\nOPENAI_API_KEY=sk-proj-your_openai_api_key\n\`\`\`\n\n## 2. Production Dockerfile\n\`\`\`dockerfile\nFROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8080\nCMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]\n\`\`\`\n`
  }
};

export const ArchitectureAdvisor: React.FC = () => {
  const { language, t: g } = useLanguage();
  // 모듈 상수(SERVICE_TEMPLATES, INITIAL_SAMPLE_RESULT)는 사전 키를 담는다.
  const L = (v?: string) => (v && (g.advisorModal as any)[v]) || v || '';

  const I18N_ADVISOR: Record<string, any> = {
    ko: {
      title: "맞춤형 AI 서비스 모델 조합 & 호스팅 시뮬레이터",
      subtitle: "구현하려는 서비스의 트래픽과 요구사항을 입력하세요. 최고 성능, 스마트 최적 라우팅, 극가성비 3가지 조합과 개발명세서 Markdown(.md)을 생성해 드립니다.",
      topRankingTitle: "요즘 가장 많이 구현하는 AI 서비스 TOP 5 (인기 랭킹)",
      rankingInfoBtn: "랭킹 근거 & 갱신 주기",
      instantResultNotice: "⚡ 미리 준비된 정밀 결과 즉시 노출",
      customInputHeading: "💡 내 서비스 요구사항 맞춤형 아키텍처 생성하기",
      calcBtn: "⚡ 5대 개발명세서 아티팩트 자동 생성",
      resultHeading: "🎯 추천 아키텍처 모델 조합 & 호스팅 산출 결과",
      artifactBtn: "📦 5대 명세서 아티팩트 보기",
      rankSuffix: "위",
      moreRanking: "➕ 랭킹 더보기",
      moreRankingDesc: "의료, 금융, 법률, 게임 NPC 등 추가 인기 시나리오 탐색",
      moreRankingFull: "➕ 랭킹 더보기 (Top 6~10+ 추가 인기 서비스)",
      liveMarkdown: "⚡ 실시간 마크다운 생성",
      calculating: "고객 요구사항을 바탕으로 최적의 LLM 조합과 OpEx 호스팅 인프라 비용을 산출하고 있습니다...",
      serviceLabel: "서비스:",
      monthlyRequestsShort: "월간 예상 요청",
      freeformHeading: "💬 서비스 요구사항 자유 묘사 & 커스터마이저 입력창",
      intentAuto: "AI 의도 자동분석",
      freeformPlaceholder: "자유로운 문장으로 구현하려는 AI 서비스와 조건을 입력하세요 (자연어 프롬프트 입력)",
      chipRag: "💡 사내 문서 RAG 챗봇",
      chipCode: "💡 코드 수정 에이전트",
      chipCs: "💡 멀티모달 CS 챗봇",
      serviceType: "서비스 유형",
      monthlyRequests: "월간 예상 요청 수",
      req10k: "1만",
      req500k: "50만",
      req1m: "100만 회",
      specialOptions: "특수 기능 옵션",
      needMultimodal: "🖼️ 멀티모달 (비전/이미지) 필요",
      needCoding: "⚡ 복잡 추론 & 코드 생성 필요",
      recalcBtn: "⚡ 추천 아키텍처 재산출 & 5대 명세서 마크다운 생성하기",
      researchProgress: {
        step1: "1. 유저 요구사항 자연어 의도 파악 및 도메인 분석",
        step2: "2. 전세계 LLM Leaderboard (Elo/MMLU) 상위 100개 모델 지표 검증",
        step3: "3. 트래픽 토큰량 기반 OpEx 비용 및 GPU 인프라 가성비 산출",
        step4: "4. 3-Tier Multi-Model 라우팅 조합 및 호스팅 옵션 매핑",
        step5: "5. 실리콘밸리 표준 BigTech 5대 Markdown 설계 아티팩트 명세서 작성 중..."
      }
    },
    en: {
      title: "Custom AI Architecture & Hosting Simulator",
      subtitle: "Input your service traffic and requirements. Generates Top Performance, Smart Router, and Ultra-Budget combos along with 5 Markdown (.md) Architecture Specs.",
      topRankingTitle: "TOP 5 Most Popular AI Architectures Implemented Today",
      rankingInfoBtn: "Ranking Criteria & Update Schedule",
      instantResultNotice: "⚡ Pre-calculated Precision Recommendations Ready",
      customInputHeading: "💡 Custom Architecture Generator for Your Requirements",
      calcBtn: "⚡ Generate 5 Architecture Spec Artifacts",
      resultHeading: "🎯 Recommended Architecture Combinations & Cost Results",
      artifactBtn: "📦 View 5 Spec Artifacts",
      rankSuffix: "",
      moreRanking: "➕ More rankings",
      moreRankingDesc: "Explore more popular scenarios: healthcare, finance, legal, game NPCs and more",
      moreRankingFull: "➕ More rankings (Top 6–10+ popular services)",
      liveMarkdown: "⚡ Live Markdown generation",
      calculating: "Computing the best LLM combination and OpEx hosting costs from your requirements...",
      serviceLabel: "Service:",
      monthlyRequestsShort: "Est. monthly requests",
      freeformHeading: "💬 Describe your service requirements freely",
      intentAuto: "Auto intent analysis",
      freeformPlaceholder: "Describe the AI service you want to build and its constraints in plain language",
      chipRag: "💡 Internal-docs RAG chatbot",
      chipCode: "💡 Code-fixing agent",
      chipCs: "💡 Multimodal support chatbot",
      serviceType: "Service type",
      monthlyRequests: "Estimated monthly requests",
      req10k: "10K",
      req500k: "500K",
      req1m: "1M calls",
      specialOptions: "Special capability options",
      needMultimodal: "🖼️ Needs multimodal (vision/image)",
      needCoding: "⚡ Needs complex reasoning & code generation",
      recalcBtn: "⚡ Recalculate architecture & generate the 5 Markdown specs",
      researchProgress: {
        step1: "1. Analyzing user requirements & domain intent",
        step2: "2. Verifying top 100 LLM leaderboard (Elo/MMLU) metrics",
        step3: "3. Calculating OpEx costs & GPU cost-efficiency based on traffic tokens",
        step4: "4. Mapping 3-Tier Multi-Model routing combos & hosting options",
        step5: "5. Generating Silicon Valley standard BigTech 5 Markdown design artifacts..."
      }
    },
    ja: {
      title: "カスタム AI アーキテクチャ & ホスティング シミュレーター",
      subtitle: "トラフィックと要件を入力してください。最高性能、スマート最適ルーティング、超コスパの3つの構成と5つのマークダウン設計書を自動生成します。",
      topRankingTitle: "最近よく実装されている AI サービス TOP 5",
      rankingInfoBtn: "ランキング根拠と更新周期",
      instantResultNotice: "⚡ 事前計算された精密結果を即時表示",
      customInputHeading: "💡 要件に合わせたカスタムアーキテクチャ生成",
      calcBtn: "⚡ 5大設計仕様書アーティファクトを自動生成",
      resultHeading: "🎯 推奨アーキテクチャモデル構成 & ホスティング試算結果",
      artifactBtn: "📦 5大仕様書アーティファクトを見る",
      rankSuffix: "位",
      moreRanking: "➕ ランキングをもっと見る",
      moreRankingDesc: "医療・金融・法務・ゲームNPCなど、さらに人気のシナリオを見る",
      moreRankingFull: "➕ ランキングをもっと見る (Top 6〜10+ の人気サービス)",
      liveMarkdown: "⚡ リアルタイム Markdown 生成",
      calculating: "ご要望をもとに最適なLLM構成とOpExホスティング費用を算出しています...",
      serviceLabel: "サービス:",
      monthlyRequestsShort: "月間想定リクエスト",
      freeformHeading: "💬 サービス要件を自由に記述",
      intentAuto: "AI 意図自動分析",
      freeformPlaceholder: "作りたいAIサービスと条件を自然な文章で入力してください",
      chipRag: "💡 社内ドキュメント RAG チャットボット",
      chipCode: "💡 コード修正エージェント",
      chipCs: "💡 マルチモーダル CS チャットボット",
      serviceType: "サービス種別",
      monthlyRequests: "月間想定リクエスト数",
      req10k: "1万",
      req500k: "50万",
      req1m: "100万回",
      specialOptions: "特殊機能オプション",
      needMultimodal: "🖼️ マルチモーダル(視覚/画像)が必要",
      needCoding: "⚡ 複雑な推論とコード生成が必要",
      recalcBtn: "⚡ アーキテクチャを再計算し5つのMarkdown仕様を生成",
      researchProgress: {
        step1: "1. ユーザー要件の分析",
        step2: "2. Top 100 LLM リーダーボード指標の検証",
        step3: "3. OpEx コストおよび GPU コスパの算出",
        step4: "4. 3-Tier マルチモデルルーティング構成のマッピング",
        step5: "5. BigTech 標準 5大設計ドキュメントの生成中..."
      }
    },
    zh: {
      title: "定制 AI 架构组合与托管模拟器",
      subtitle: "输入您的服务流量和需求。自动生成最高性能、智能路由器和极性价比 3 种组合以及 5 份 Markdown 设计文档。",
      topRankingTitle: "近期最常实现的 AI 服务 TOP 5 热门排名",
      rankingInfoBtn: "排名依据与更新周期",
      instantResultNotice: "⚡ 即时展示预先准备的精确定制结果",
      customInputHeading: "💡 根据您的需求定制 AI 架构生成",
      calcBtn: "⚡ 自动生成 5 大架构设计规范产物",
      resultHeading: "🎯 推荐架构模型组合与托管演算结果",
      artifactBtn: "📦 查看 5 大规范产物",
      rankSuffix: "名",
      moreRanking: "➕ 查看更多排名",
      moreRankingDesc: "探索更多热门场景：医疗、金融、法律、游戏 NPC 等",
      moreRankingFull: "➕ 查看更多排名（第 6~10+ 名热门服务）",
      liveMarkdown: "⚡ 实时生成 Markdown",
      calculating: "正在根据您的需求计算最优 LLM 组合与 OpEx 托管成本...",
      serviceLabel: "服务：",
      monthlyRequestsShort: "每月预计请求",
      freeformHeading: "💬 自由描述你的服务需求",
      intentAuto: "AI 意图自动分析",
      freeformPlaceholder: "请用自然语言描述你想构建的 AI 服务及其条件",
      chipRag: "💡 内部文档 RAG 聊天机器人",
      chipCode: "💡 代码修复智能体",
      chipCs: "💡 多模态客服机器人",
      serviceType: "服务类型",
      monthlyRequests: "每月预计请求数",
      req10k: "1万",
      req500k: "50万",
      req1m: "100万次",
      specialOptions: "特殊功能选项",
      needMultimodal: "🖼️ 需要多模态（视觉/图像）",
      needCoding: "⚡ 需要复杂推理与代码生成",
      recalcBtn: "⚡ 重新计算架构并生成 5 份 Markdown 规范",
      researchProgress: {
        step1: "1. 分析用户需求与意图",
        step2: "2. 验证前 100 大 LLM 排行榜指标",
        step3: "3. 计算 OpEx 成本与 GPU 性价比",
        step4: "4. 映射 3-Tier 多模型路由组合",
        step5: "5. 正在生成 5 大架构规范文档..."
      }
    },
    es: {
      title: "Simulador de Arquitectura e Hospedaje de IA Personalizado",
      subtitle: "Ingrese el tráfico y requisitos de su servicio. Genera combinaciones de Alto Rendimiento, Enrutador Inteligente y Ultra-Económico junto con 5 especificaciones Markdown.",
      topRankingTitle: "TOP 5 Arquitecturas de IA Más Implementadas",
      rankingInfoBtn: "Criterios de Clasificación",
      instantResultNotice: "⚡ Resultados De Alta Precisión Disponibles Al Instante",
      customInputHeading: "💡 Generador de Arquitectura Personalizado",
      calcBtn: "⚡ Generar 5 Artefactos de Especificación",
      resultHeading: "🎯 Combinaciones de Modelos Recomendadas",
      artifactBtn: "📦 Ver 5 Artefactos de Especificación",
      rankSuffix: ".º",
      moreRanking: "➕ Ver más del ranking",
      moreRankingDesc: "Explora más escenarios populares: salud, finanzas, legal, NPC de videojuegos y más",
      moreRankingFull: "➕ Ver más del ranking (Top 6-10+ servicios populares)",
      liveMarkdown: "⚡ Generación de Markdown en vivo",
      calculating: "Calculando la mejor combinación de LLM y los costes de alojamiento OpEx...",
      serviceLabel: "Servicio:",
      monthlyRequestsShort: "Solicitudes mensuales est.",
      freeformHeading: "💬 Describe libremente los requisitos de tu servicio",
      intentAuto: "Análisis automático de intención",
      freeformPlaceholder: "Describe en lenguaje natural el servicio de IA que quieres construir y sus condiciones",
      chipRag: "💡 Chatbot RAG de documentos internos",
      chipCode: "💡 Agente de corrección de código",
      chipCs: "💡 Chatbot de soporte multimodal",
      serviceType: "Tipo de servicio",
      monthlyRequests: "Solicitudes mensuales estimadas",
      req10k: "10 mil",
      req500k: "500 mil",
      req1m: "1 M llamadas",
      specialOptions: "Opciones de capacidades especiales",
      needMultimodal: "🖼️ Requiere multimodal (visión/imagen)",
      needCoding: "⚡ Requiere razonamiento complejo y generación de código",
      recalcBtn: "⚡ Recalcular la arquitectura y generar las 5 especificaciones Markdown",
      researchProgress: {
        step1: "1. Analizando requisitos del usuario",
        step2: "2. Verificando métricas de clasificación de LLM",
        step3: "3. Calculando costos de OpEx y rentabilidad de GPU",
        step4: "4. Mapeando combinaciones de enrutamiento",
        step5: "5. Generando 5 especificaciones de arquitectura..."
      }
    },
    de: {
      title: "Individueller KI-Architektur & Hosting Simulator",
      subtitle: "Geben Sie Daten zu Ihrem Dienst ein. Generiert Top-Leistung, Smart-Router und Budget-Kombinationen sowie 5 Markdown-Architektur-Spezifikationen.",
      topRankingTitle: "TOP 5 am häufigsten implementierte KI-Architekturen",
      rankingInfoBtn: "Kriterien & Aktualisierungsintervall",
      instantResultNotice: "⚡ Präzise Empfehlungen sofort verfügbar",
      customInputHeading: "💡 Individueller Architektur-Generator",
      calcBtn: "⚡ 5 Architektur-Spezifikationen generieren",
      resultHeading: "🎯 Empfohlene Modellkombinationen & Ergebnisse",
      artifactBtn: "📦 5 Spezifikations-Artefakte anzeigen",
      rankSuffix: ".",
      moreRanking: "➕ Mehr Rankings",
      moreRankingDesc: "Weitere beliebte Szenarien entdecken: Gesundheit, Finanzen, Recht, Spiel-NPCs und mehr",
      moreRankingFull: "➕ Mehr Rankings (Top 6–10+ beliebte Dienste)",
      liveMarkdown: "⚡ Live-Markdown-Generierung",
      calculating: "Berechne die beste LLM-Kombination und die OpEx-Hostingkosten ...",
      serviceLabel: "Service:",
      monthlyRequestsShort: "Gesch. monatliche Anfragen",
      freeformHeading: "💬 Beschreiben Sie Ihre Anforderungen frei",
      intentAuto: "Automatische Absichtsanalyse",
      freeformPlaceholder: "Beschreiben Sie in natürlicher Sprache den gewünschten KI-Dienst und seine Anforderungen",
      chipRag: "💡 RAG-Chatbot für interne Dokumente",
      chipCode: "💡 Agent zur Codekorrektur",
      chipCs: "💡 Multimodaler Support-Chatbot",
      serviceType: "Diensttyp",
      monthlyRequests: "Geschätzte monatliche Anfragen",
      req10k: "10 Tsd.",
      req500k: "500 Tsd.",
      req1m: "1 Mio. Aufrufe",
      specialOptions: "Optionen für Spezialfunktionen",
      needMultimodal: "🖼️ Multimodal (Vision/Bild) erforderlich",
      needCoding: "⚡ Komplexes Reasoning & Codegenerierung erforderlich",
      recalcBtn: "⚡ Architektur neu berechnen & die 5 Markdown-Spezifikationen erzeugen",
      researchProgress: {
        step1: "1. Analyse der Benutzeranforderungen",
        step2: "2. Überprüfung der Top-100-LLM-Metriken",
        step3: "3. Berechnung von OpEx-Kosten und GPU-Effizienz",
        step4: "4. Zuordnung von Multi-Modell-Routing",
        step5: "5. Erstellung von 5 Architektur-Dokumenten..."
      }
    },
    fr: {
      title: "Simulateur d’architecture IA et d’hébergement sur mesure",
      subtitle: "Indiquez le trafic et les exigences de votre service. Génère trois combinaisons — performance maximale, routage intelligent et budget minimal — ainsi que cinq spécifications Markdown (.md).",
      topRankingTitle: "TOP 5 des architectures IA les plus déployées aujourd’hui",
      rankingInfoBtn: "Critères de classement et fréquence de mise à jour",
      instantResultNotice: "⚡ Recommandations précalculées disponibles",
      customInputHeading: "💡 Générer une architecture adaptée à vos besoins",
      calcBtn: "⚡ Générer les 5 artefacts de spécification",
      resultHeading: "🎯 Combinaisons d’architecture recommandées et coûts estimés",
      artifactBtn: "📦 Voir les 5 artefacts",
      rankSuffix: "e",
      moreRanking: "➕ Voir plus du classement",
      moreRankingDesc: "Découvrez d’autres scénarios populaires : santé, finance, juridique, PNJ de jeux et plus",
      moreRankingFull: "➕ Voir plus du classement (Top 6 à 10+ services populaires)",
      liveMarkdown: "⚡ Génération Markdown en direct",
      calculating: "Calcul de la meilleure combinaison de LLM et des coûts d’hébergement OpEx...",
      serviceLabel: "Service :",
      monthlyRequestsShort: "Requêtes mensuelles estimées",
      freeformHeading: "💬 Décrivez librement les besoins de votre service",
      intentAuto: "Analyse automatique de l’intention",
      freeformPlaceholder: "Décrivez en langage naturel le service IA souhaité et ses contraintes",
      chipRag: "💡 Chatbot RAG sur documents internes",
      chipCode: "💡 Agent de correction de code",
      chipCs: "💡 Chatbot de support multimodal",
      serviceType: "Type de service",
      monthlyRequests: "Requêtes mensuelles estimées",
      req10k: "10 k",
      req500k: "500 k",
      req1m: "1 M appels",
      specialOptions: "Options de capacités spéciales",
      needMultimodal: "🖼️ Multimodal requis (vision/image)",
      needCoding: "⚡ Raisonnement complexe et génération de code requis",
      recalcBtn: "⚡ Recalculer l’architecture et générer les 5 spécifications Markdown",
      researchProgress: {
        step1: "1. Analyse des besoins utilisateur et du domaine",
        step2: "2. Vérification des 100 premiers modèles du classement LLM (Elo/MMLU)",
        step3: "3. Calcul des coûts OpEx et du rapport coût/performance GPU selon le trafic",
        step4: "4. Association des combinaisons de routage multi-modèles et des options d’hébergement",
        step5: "5. Rédaction des cinq artefacts de conception Markdown..."
      }
    },
  };

  const t = I18N_ADVISOR[language as keyof typeof I18N_ADVISOR] || I18N_ADVISOR.en;

  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('code_agent');
  const [monthlyRequests, setMonthlyRequests] = useState<number>(100000);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(2000);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(1000);
  const [requiresMultimodal, setRequiresMultimodal] = useState<boolean>(false);
  const [requiresCoding, setRequiresCoding] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [researchProgress, setResearchProgress] = useState<number>(0);
  const [researchStep, setResearchStep] = useState<number>(0);
  const [result, setResult] = useState<ArchitectureRecommendationResult | null>(INITIAL_SAMPLE_RESULT);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('code_agent');

  const [showSpecBundleModal, setShowSpecBundleModal] = useState<boolean>(false);
  const [showMoreRankingModal, setShowMoreRankingModal] = useState<boolean>(false);
  const [showRankingInfoModal, setShowRankingInfoModal] = useState<boolean>(false);

  const trending: TrendingTemplate[] = [
    {
      id: "code_agent",
      rank: 1,
      title: "tplCodeTitle",
      category: "AI Agent",
      icon: "code",
      description: "tplCodeDesc",
      request: {
        service_type: "code_agent",
        monthly_requests: 100000,
        avg_input_tokens: 2000,
        avg_output_tokens: 1000,
        requires_multimodal: false,
        requires_coding: true
      }
    },
    {
      id: "rag",
      rank: 2,
      title: "tplRagTitle",
      category: "Enterprise RAG",
      icon: "database",
      description: "tplRagDesc",
      request: {
        service_type: "rag",
        monthly_requests: 200000,
        avg_input_tokens: 3000,
        avg_output_tokens: 600,
        requires_multimodal: false,
        requires_coding: false
      }
    },
    {
      id: "multimodal",
      rank: 3,
      title: "tplMultiTitle",
      category: "Multimodal CS",
      icon: "headset",
      description: "tplMultiDesc",
      request: {
        service_type: "multimodal",
        monthly_requests: 150000,
        avg_input_tokens: 3000,
        avg_output_tokens: 600,
        requires_multimodal: true,
        requires_coding: false
      }
    },
    {
      id: "translation",
      rank: 4,
      title: "tplTransTitle",
      category: "Translation API",
      icon: "globe",
      description: "tplTransDesc",
      request: {
        service_type: "translation",
        monthly_requests: 500000,
        avg_input_tokens: 1000,
        avg_output_tokens: 1000,
        requires_multimodal: false,
        requires_coding: false
      }
    },
    {
      id: "content_creation",
      rank: 5,
      title: "tplContentTitle",
      category: "Content Creation",
      icon: "sparkles",
      description: "tplContentDesc",
      request: {
        service_type: "content_creation",
        monthly_requests: 80000,
        avg_input_tokens: 2500,
        avg_output_tokens: 1500,
        requires_multimodal: false,
        requires_coding: false
      }
    }
  ];

  const applyTemplate = (tpl: TrendingTemplate) => {
    setSelectedTemplateId(tpl.id);
    setServiceType(tpl.request.service_type);
    setMonthlyRequests(tpl.request.monthly_requests);
    setAvgInputTokens(tpl.request.avg_input_tokens);
    setAvgOutputTokens(tpl.request.avg_output_tokens);
    setRequiresMultimodal(tpl.request.requires_multimodal);
    setRequiresCoding(tpl.request.requires_coding);
    fetchRecommendation(tpl.request);
  };

  const fetchRecommendation = (overrideReq?: RecommendationRequest) => {
    setLoading(true);
    setResearchProgress(10);
    setResearchStep(0);

    const timer1 = setTimeout(() => { setResearchProgress(30); setResearchStep(1); }, 400);
    const timer2 = setTimeout(() => { setResearchProgress(55); setResearchStep(2); }, 800);
    const timer3 = setTimeout(() => { setResearchProgress(80); setResearchStep(3); }, 1200);
    const timer4 = setTimeout(() => { setResearchProgress(95); setResearchStep(4); }, 1500);

    const payload: RecommendationRequest = overrideReq || {
      custom_prompt: customPrompt,
      service_type: serviceType,
      monthly_requests: monthlyRequests,
      avg_input_tokens: avgInputTokens,
      avg_output_tokens: avgOutputTokens,
      requires_multimodal: requiresMultimodal,
      requires_coding: requiresCoding,
      // 서버가 고정 문구를 이 언어로 내려준다 — 안 보내면 항상 한국어로 돌아온다
      language
    };

    fetch(`${API_BASE_URL}/recommend/architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((data: ArchitectureRecommendationResult) => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        setResearchProgress(100);
        setResearchStep(4);
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        console.error("Failed to fetch recommendation", err);
        setLoading(false);
      });
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'code': return <Code className="w-5 h-5 text-emerald-400" />;
      case 'database': return <Database className="w-5 h-5 text-blue-400" />;
      case 'headset': return <Headset className="w-5 h-5 text-purple-400" />;
      case 'globe': return <Globe className="w-5 h-5 text-amber-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-pink-400" />;
      default: return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-24 lg:pb-16">
      {/* Header Banner */}
      <div className="surface-tint relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> AI Architecture Advisor
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {t.title}
          </h1>
          <p className="mt-3 text-slate-300 text-base leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Top 5 Trending Templates Ranking */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-warn text-sm font-black">🏆</span>
              {t.topRankingTitle}
            </h2>
            <button
              onClick={() => setShowRankingInfoModal(true)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-extrabold flex items-center gap-1 transition-all shadow-sm"
              title="Information"
            >
              <span>ℹ️</span> {t.rankingInfoBtn}
            </button>
          </div>
          <span className="text-xs text-muted font-extrabold">{t.instantResultNotice}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {trending.slice(0, 5).map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className={`relative group text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-md ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/90 text-slate-900 border border-white'
                        : tpl.rank === 1 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' :
                          tpl.rank === 2 ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700' :
                          'bg-amber-100/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                    }`}>
                      #{tpl.rank}{t.rankSuffix}
                    </span>
                    {getTemplateIcon(tpl.icon)}
                  </div>
                  <h3 className={`font-black text-sm line-clamp-1 transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}>
                    {L(tpl.title).split('(')[0]}
                  </h3>
                  <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed font-semibold ${
                    isSelected ? 'text-indigo-100' : 'text-muted'
                  }`}>
                    {L(tpl.description)}
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs font-black ${
                  isSelected ? 'border-indigo-400/40 text-indigo-100' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <span>{tpl.request.monthly_requests.toLocaleString()} req/mo</span>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setShowMoreRankingModal(true)}
            className="group text-left p-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 transition-all duration-300 flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                  TOP 6~10+
                </span>
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-600">
                {t.moreRanking}
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed font-bold text-indigo-700 dark:text-indigo-300/80">
                {t.moreRankingDesc}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs font-black text-indigo-900 dark:text-indigo-300">
              <span>{t.liveMarkdown}</span>
              <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Main Results View (Top Section) */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-slate-900/90 p-6 sm:p-8 space-y-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/40 shadow-2xl text-left relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-100">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                {t.calculating}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black text-base">{researchProgress}% ANALYZING</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-300 dark:border-slate-800 p-0.5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-700 to-pink-500 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                style={{ width: `${researchProgress}%` }}
              ></div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                t.researchProgress.step1,
                t.researchProgress.step2,
                t.researchProgress.step3,
                t.researchProgress.step4,
                t.researchProgress.step5
              ].map((stepText, idx) => {
                const isDone = idx < researchStep;
                const isCurrent = idx === researchStep;
                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
                      isDone 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-extrabold shadow-sm' 
                        : isCurrent 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500/50 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/50 dark:ring-indigo-500/40 animate-pulse font-black shadow-md'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/60 text-muted font-bold'
                    }`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black">{stepText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {t.serviceLabel} {L(result.service_name)}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {g.advisorModal.resultHeading}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted font-bold">{t.monthlyRequestsShort}</div>
                    <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{result.monthly_requests.toLocaleString()} {g.advisorModal.callsSuffix}</div>
                  </div>
                  <button
                    onClick={() => setShowSpecBundleModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    {g.advisorModal.artifactBtn}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {result.combos.map((combo) => (
                  <div 
                    key={combo.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      combo.tag === 'RECOMMENDED'
                        ? 'bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950 text-white border-indigo-500/50 shadow-xl ring-2 ring-indigo-500/40'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-2xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                          combo.tag === 'RECOMMENDED' ? 'bg-indigo-500 text-white' :
                          combo.tag === 'FRONTIER' ? 'bg-purple-700 text-white' : 'bg-emerald-700 text-white'
                        }`}>
                          {combo.tag}
                        </span>
                      </div>
                      <h3 className="font-black text-base leading-tight">{L(combo.name)}</h3>
                      <p className="text-xs leading-relaxed opacity-90">{L(combo.description)}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/40 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>{g.advisorModal.monthlyApiCost}</span>
                        <span className="text-base font-black text-accent">${combo.total_monthly_cost.toFixed(2)}/mo</span>
                      </div>
                      <div className="space-y-1">
                        {combo.key_advantages.map((adv, idx) => (
                          <div key={idx} className="text-2xs flex items-center gap-1.5 opacity-90">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {L(adv)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Section: Requirements Customizer Input Form & Chat Bar (12 Cols Full Width) */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 font-black text-xl text-slate-900 dark:text-white">
            <Layers className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span>{t.freeformHeading}</span>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {t.intentAuto}
          </span>
        </div>

        <div className="space-y-5 text-sm">
          {/* Natural Language Prompt Chat Bar */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-900 dark:text-slate-200">
              {t.freeformPlaceholder}
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="예: 사내 PDF 문서를 RAG로 검색하여 보안 답변을 주는 챗봇을 만들려고 합니다. 월 10만 건 정도 사용 예상됩니다."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
              />
            </div>

            {/* Sample Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCustomPrompt("사내 Confluence/PDF 문서를 RAG로 답변하는 보안 챗봇 구축")}
                className="text-xs bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl transition-colors font-semibold shadow-sm"
              >
                {t.chipRag}
              </button>
              <button
                type="button"
                onClick={() => setCustomPrompt("Python/JS 버그 자동 수정 및 리팩토링 에이전트")}
                className="text-xs bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl transition-colors font-semibold shadow-sm"
              >
                {t.chipCode}
              </button>
              <button
                type="button"
                onClick={() => setCustomPrompt("영수증 이미지 OCR 해석 및 24/7 고객응대 멀티모달 CS봇")}
                className="text-xs bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl transition-colors font-semibold shadow-sm"
              >
                {t.chipCs}
              </button>
            </div>
          </div>

          {/* 3-Column Fine-Tuning Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label htmlFor="advisor-service-type" className="block font-bold mb-1.5 text-slate-900 dark:text-slate-200">{t.serviceType}</label>
              <select
                id="advisor-service-type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                <option value="code_agent">👨‍💻 자율 코딩 에이전트 (Code Agent)</option>
                <option value="rag">📚 기업용 사내 RAG 챗봇 (Enterprise RAG)</option>
                <option value="multimodal">🎧 멀티모달 고객지원 봇 (Multimodal CS)</option>
                <option value="translation">🌐 글로벌 실시간 번역 API (Translation)</option>
                <option value="content_creation">✍️ 마케팅 콘텐츠 코파일럿 (Content Copilot)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1.5 text-slate-900 dark:text-slate-200">
                <span>{t.monthlyRequests}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{monthlyRequests.toLocaleString()} {g.advisorModal.callsSuffix}</span>
              </div>
              <input
                aria-label={t.monthlyRequests}
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className="w-full accent-indigo-600 rounded-lg cursor-pointer h-2.5 mt-2"
              />
              <div className="flex justify-between text-2xs text-muted font-semibold mt-1">
                <span>{t.req10k}</span>
                <span>{t.req500k}</span>
                <span>{t.req1m}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold mb-1 text-slate-900 dark:text-slate-200">{t.specialOptions}</label>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 dark:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={requiresMultimodal}
                    onChange={(e) => setRequiresMultimodal(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>{t.needMultimodal}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 dark:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={requiresCoding}
                    onChange={(e) => setRequiresCoding(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>{t.needCoding}</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setSelectedTemplateId(null); fetchRecommendation(); }}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-700 hover:from-indigo-500 hover:to-purple-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 text-base"
          >
            {loading ? <Sparkles className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            {t.recalcBtn}
          </button>
        </div>
      </div>

      {showSpecBundleModal && result && (
        <SpecBundleModal
          result={result}
          onClose={() => setShowSpecBundleModal(false)}
        />
      )}

      {showMoreRankingModal && (
        <MoreRankingModal
          onClose={() => setShowMoreRankingModal(false)}
          onSelectScenario={(req, title) => {
            setShowMoreRankingModal(false);
            setCustomPrompt(`[추가 랭킹 시나리오] ${title}`);
            setServiceType(req.service_type);
            setMonthlyRequests(req.monthly_requests);
            setAvgInputTokens(req.avg_input_tokens);
            setAvgOutputTokens(req.avg_output_tokens);
            setRequiresMultimodal(req.requires_multimodal);
            setRequiresCoding(req.requires_coding);
            setSelectedTemplateId(null);
            fetchRecommendation();
          }}
        />
      )}

      {showRankingInfoModal && (
        <RankingCriteriaModal
          onClose={() => setShowRankingInfoModal(false)}
        />
      )}
    </div>
  );
};

const SpecBundleModal: React.FC<{
  result: ArchitectureRecommendationResult;
  onClose: () => void;
}> = ({ result, onClose }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'arch' | 'db_schema' | 'tasks' | 'deploy' | 'full'>('agents');
  const [copied, setCopied] = useState<boolean>(false);

  const bundle = result.spec_bundle || {
    agents_md: `# AGENTS.md Directive\n${result.markdown_spec.slice(0, 500)}`,
    architecture_md: `# ARCHITECTURE.md Specification\n${result.markdown_spec}`,
    database_schema_md: `# DATABASE_SCHEMA.md Specification\n# DB ERD & DDL Schemas`,
    tasks_md: `# TASKS.md Checklist\n- [ ] Task 1: Environment Setup\n- [ ] Task 2: AI Pipeline Implementation`,
    deployment_md: `# DEPLOYMENT.md Specification\n# Docker & .env Setup`
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'agents': return { filename: 'AGENTS.md', content: bundle.agents_md };
      case 'arch': return { filename: 'ARCHITECTURE.md', content: bundle.architecture_md };
      case 'db_schema': return { filename: 'DATABASE_SCHEMA.md', content: bundle.database_schema_md };
      case 'tasks': return { filename: 'TASKS.md', content: bundle.tasks_md };
      case 'deploy': return { filename: 'DEPLOYMENT.md', content: bundle.deployment_md };
      case 'full': return { filename: 'architecture_full_spec.md', content: result.markdown_spec };
      default: return { filename: 'AGENTS.md', content: bundle.agents_md };
    }
  };

  const activeData = getActiveContent();

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'advisor');
    navigator.clipboard.writeText(url.toString());
    alert('🔗 AI 아키텍처 명세서 공유 링크가 클립보드에 복사되었습니다!');
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeData.filename} - LLM COMPASS Architecture Spec</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; line-height: 1.6; }
            h1, h2, h3 { color: #0f172a; }
            pre { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>📌 LLM COMPASS AI Architecture Specification</h1>
          <h2>${result.service_name}</h2>
          <pre>${activeData.content}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([activeData.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    const files = [
      { name: 'AGENTS.md', content: bundle.agents_md },
      { name: 'ARCHITECTURE.md', content: bundle.architecture_md },
      { name: 'DATABASE_SCHEMA.md', content: bundle.database_schema_md },
      { name: 'TASKS.md', content: bundle.tasks_md },
      { name: 'DEPLOYMENT.md', content: bundle.deployment_md }
    ];

    files.forEach((f, i) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = f.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, i * 300);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚀 BigTech Standard AI Coding Agent Spec Package</span>
            </h3>
            <p className="text-xs text-muted font-semibold mt-0.5">
              실리콘밸리 AI 파이프라인 규격 5대 Markdown 설계 아티팩트 명세서
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'agents', name: '🤖 AGENTS.md', desc: 'AI 지시서 & 규칙' },
            { id: 'arch', name: '🏗️ ARCHITECTURE.md', desc: '시스템 설계 & Sequence' },
            { id: 'db_schema', name: '🗄️ DATABASE_SCHEMA.md', desc: 'DB ERD & DDL 스키마' },
            { id: 'tasks', name: '📝 TASKS.md', desc: '구현 WBS 체크리스트' },
            { id: 'deploy', name: '🐳 DEPLOYMENT.md', desc: 'Docker & .env 스펙' },
            { id: 'full', name: '📄 FULL_SPEC.md', desc: '통합 전체 명세서' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-t-2xl text-xs font-black transition-all whitespace-nowrap flex flex-col items-start gap-0.5 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 border-t-2 border-x border-indigo-500 border-x-slate-200 dark:border-x-slate-800 shadow-sm' 
                    : 'text-muted hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/50'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`text-2xs ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-muted'}`}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-200 space-y-4 flex-1">
          <div className="flex items-center justify-between text-2xs text-muted border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {activeData.filename}
            </span>
            <span className="text-muted font-bold">Lines: {activeData.content.split('\n').length} | Chars: {activeData.content.length.toLocaleString()}</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed select-all font-semibold">
            {activeData.content}
          </pre>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted font-bold hidden sm:block">
            💡 <strong className="text-slate-900 dark:text-white">Cursor / Claude Code 활용법</strong>: <span>`AGENTS.md`와 `TASKS.md`를 프로젝트 루트에 복사하면 AI가 자동 개발합니다.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleShareLink}
              className="surface-tint px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1"
            >
              🔗 공유 링크 복사
            </button>

            <button
              onClick={handlePrintPdf}
              className="surface-tint px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1"
            >
              📄 PDF/프린트
            </button>

            <button
              onClick={handleCopy}
              className="surface-tint px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              {copied ? '복사 완료!' : `${activeData.filename} 복사`}
            </button>

            <button
              onClick={handleDownloadSingle}
              className="surface-tint px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              {activeData.filename} 저장
            </button>

            <button
              onClick={handleDownloadAllBundle}
              className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-white" />
              📦 5개 아티팩트 전체 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoreRankingModal: React.FC<{
  onClose: () => void;
  onSelectScenario: (req: RecommendationRequest, title: string) => void;
}> = ({ onClose, onSelectScenario }) => {
  const { t: g } = useLanguage();
  const moreScenarios = [
    {
      rank: 6,
      title: g.advisorModal.scMedTitle,
      category: "Medical AI Assistant",
      requests: 120000,
      req: {
        service_type: "rag",
        monthly_requests: 120000,
        avg_input_tokens: 4000,
        avg_output_tokens: 800,
        requires_multimodal: false,
        requires_coding: false
      },
      desc: g.advisorModal.scMedDesc
    },
    {
      rank: 7,
      title: g.advisorModal.scFinTitle,
      category: "Financial Market Analytics",
      requests: 300000,
      req: {
        service_type: "content_creation",
        monthly_requests: 300000,
        avg_input_tokens: 1500,
        avg_output_tokens: 500,
        requires_multimodal: false,
        requires_coding: false
      },
      desc: g.advisorModal.scFinDesc
    },
    {
      rank: 8,
      title: g.advisorModal.scLawTitle,
      category: "Legal Tech Reviewer",
      requests: 60000,
      req: {
        service_type: "rag",
        monthly_requests: 60000,
        avg_input_tokens: 5000,
        avg_output_tokens: 1200,
        requires_multimodal: false,
        requires_coding: false
      },
      desc: g.advisorModal.scLawDesc
    },
    {
      rank: 9,
      title: g.advisorModal.scGameTitle,
      category: "Gaming AI NPC Agent",
      requests: 400000,
      req: {
        service_type: "content_creation",
        monthly_requests: 400000,
        avg_input_tokens: 1000,
        avg_output_tokens: 500,
        requires_multimodal: false,
        requires_coding: false
      },
      desc: g.advisorModal.scGameDesc
    },
    {
      rank: 10,
      title: g.advisorModal.scEcomTitle,
      category: "E-Commerce Recommendation",
      requests: 250000,
      req: {
        service_type: "multimodal",
        monthly_requests: 250000,
        avg_input_tokens: 1500,
        avg_output_tokens: 600,
        requires_multimodal: true,
        requires_coding: false
      },
      desc: g.advisorModal.scEcomDesc
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{g.advisorModal.moreTitle}</span>
            </h3>
            <p className="text-xs text-muted font-bold mt-0.5">
              {g.advisorModal.moreNotice}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {moreScenarios.map((sc) => (
            <div
              key={sc.rank}
              onClick={() => onSelectScenario(sc.req, sc.title)}
              className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    #{sc.rank}{g.advisorModal.rankSuffix}
                  </span>
                  <span className="text-xs font-bold text-muted">{sc.category}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {sc.title}
                </h4>
                <p className="text-xs text-muted font-semibold">
                  {sc.desc}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-3">
                <span>{g.advisorModal.liveGenerate}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RankingCriteriaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏆 인기 서비스 TOP 랭킹 산출 근거 & 갱신 주기</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-1.5">
            <h4 className="font-black text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-1.5">
              <span>📊</span> 1. 랭킹 산출 근거 (Ranking Criteria)
            </h4>
            <p>
              2026년 기준 글로벌 10,000+개 Enterprise AI 서비스 구축 사례와 실리콘밸리 AI 템플릿 사용 통계, GitHub Star 수, LMSYS Arena Elo 가중치를 종합 계산하여 인기 순위를 반영합니다.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
            <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
              <span>🔄</span> 2. 데이터 갱신 주기 (Update Schedule)
            </h4>
            <p>
              <strong className="text-success font-extrabold">매월 1일</strong> 글로벌 신규 출시 모델 및 LMSYS Arena 벤치마크 점수, API 단가 변동 내역을 자동으로 수집하여 실시간 인기 순위를 갱신합니다.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};
