import type { RecommendationRequest, ArchitectureRecommendationResult, ModelCombo, ModelComboItem, ModelSpec } from '../frontend/src/types';
import { pickModels, ELO_PER_10X_PRICE, type Pick } from './recommendPicks';

// 추천 결과의 고정 문구. req.language 는 이미 받고 있었지만 LLM 프롬프트에만 쓰였고
// 이 문자열들은 항상 한국어로 나갔다 — 영어 UI 안에 한국어 카드가 섞여 보이던 원인.
const T: Record<string, Record<string, string>> = {
  ko: {
    specScore: "점수", specBasis: "근거: LMArena '{cat}' 분야 점수({d} 기준). 가성비 안은 가격이 10배면 점수가 {e}점 이상 높아야 값을 한다는 기준으로 고릅니다.",
    specNote: "이 명세서는 입력한 조건과 카탈로그의 실제 단가로 계산한 결과입니다(규칙 기반, 생성 AI 미사용).", specReq: "요구사항", specVolume: "월 요청 수", specTokens: "월 토큰 (입력 / 출력, 백만)", specCombos: "추천 모델 조합", specRole: "역할", specModel: "모델", specShare: "트래픽 비중", specMonthly: "월 예상 비용", specTotal: "합계", specHosting: "호스팅 옵션",
    svcDefault: "고객 맞춤형 AI 서비스", svcCode: "자율 코딩 에이전트 서비스", svcRag: "기업용 RAG 챗봇 시스템",
    svcMulti: "멀티모달 고객지원 CS 봇", svcTrans: "글로벌 실시간 번역 API", svcContent: "마케팅 콘텐츠 생성 코파일럿",
    svcCustom: "맞춤 분석",
    roleRouterPre: "분류 및 사전 가공 (Router)", rolePrimary: "메인 워크로드 추론 (Primary Engine)",
    roleFastRouter: "초고속 분류기 (Router)", roleMain: "고성능 답변 생성 (Main)",
    bestName: "Frontier Premier Quality (최고 품질)",
    bestDesc: "복잡한 추론과 정확도가 최우선인 미션 크리티컬 서비스용 최상위 플래그십 조합",
    bestAdv1: "업계 최고 수준의 지능", bestAdv2: "정교한 멀티스텝 추론",
    smartName: "Smart Balanced (가성비 최적화)", smartDesc: "비용과 응답속도를 최적화한 실용적인 조합",
    smartAdv1: "뛰어난 가성비", smartAdv2: "빠른 응답 속도",
    cfDesc: "엣지에서 매우 저렴하게 구동 가능", cfFor: "글로벌 유저 타겟 서비스",
    awsDesc: "엔터프라이즈 보안 및 관리형 API", awsFor: "엔터프라이즈 데이터 보안 필수 서비스"
  },
  en: {
    specScore: "Score", specBasis: "Basis: LMArena '{cat}' category scores (as of {d}). The value pick requires {e}+ points per 10× price.",
    specNote: "This spec is calculated from your inputs and real catalog prices (rule-based, no generative AI).", specReq: "Requirements", specVolume: "Monthly requests", specTokens: "Monthly tokens (input / output, millions)", specCombos: "Recommended model combos", specRole: "Role", specModel: "Model", specShare: "Traffic share", specMonthly: "Est. monthly cost", specTotal: "Total", specHosting: "Hosting options",
    svcDefault: "Custom AI service", svcCode: "Autonomous coding agent", svcRag: "Enterprise RAG chatbot",
    svcMulti: "Multimodal customer support bot", svcTrans: "Global real-time translation API", svcContent: "Marketing content copilot",
    svcCustom: "Custom analysis",
    roleRouterPre: "Classification & preprocessing (router)", rolePrimary: "Main workload inference (primary engine)",
    roleFastRouter: "High-speed classifier (router)", roleMain: "High-quality generation (main)",
    bestName: "Frontier Premier Quality",
    bestDesc: "Top flagship combination for mission-critical services where complex reasoning and accuracy come first",
    bestAdv1: "Best-in-class intelligence", bestAdv2: "Precise multi-step reasoning",
    smartName: "Smart Balanced", smartDesc: "A practical combination tuned for cost and response speed",
    smartAdv1: "Excellent value", smartAdv2: "Fast responses",
    cfDesc: "Runs very cheaply at the edge", cfFor: "Services targeting a global audience",
    awsDesc: "Enterprise security with a managed API", awsFor: "Services with strict enterprise data-security needs"
  },
  ja: {
    specScore: "スコア", specBasis: "根拠: LMArena の '{cat}' 分野スコア（{d} 時点）。コスパ案は価格が10倍なら {e} 点以上高いことを基準に選びます。",
    specNote: "この仕様書は入力条件とカタログの実際の料金から計算した結果です（ルールベース、生成AI不使用）。", specReq: "要件", specVolume: "月間リクエスト数", specTokens: "月間トークン（入力 / 出力、百万）", specCombos: "推奨モデル構成", specRole: "役割", specModel: "モデル", specShare: "トラフィック比率", specMonthly: "月額見込み", specTotal: "合計", specHosting: "ホスティング候補",
    svcDefault: "カスタムAIサービス", svcCode: "自律コーディングエージェント", svcRag: "企業向けRAGチャットボット",
    svcMulti: "マルチモーダル顧客サポートボット", svcTrans: "グローバルリアルタイム翻訳API", svcContent: "マーケティングコンテンツ・コパイロット",
    svcCustom: "カスタム分析",
    roleRouterPre: "分類・前処理 (ルーター)", rolePrimary: "メインワークロード推論 (プライマリエンジン)",
    roleFastRouter: "高速分類器 (ルーター)", roleMain: "高品質生成 (メイン)",
    bestName: "Frontier Premier Quality (最高品質)",
    bestDesc: "複雑な推論と正確性が最優先のミッションクリティカルなサービス向けの最上位構成",
    bestAdv1: "業界最高水準の知能", bestAdv2: "精緻なマルチステップ推論",
    smartName: "Smart Balanced (コスパ最適化)", smartDesc: "コストと応答速度を最適化した実用的な構成",
    smartAdv1: "優れたコストパフォーマンス", smartAdv2: "高速な応答",
    cfDesc: "エッジで非常に安価に稼働可能", cfFor: "グローバルユーザー向けサービス",
    awsDesc: "エンタープライズセキュリティとマネージドAPI", awsFor: "データセキュリティ要件が厳しいサービス"
  },
  zh: {
    specScore: "分数", specBasis: "依据：LMArena '{cat}' 分类得分（{d}）。性价比方案要求价格每高 10 倍，得分至少高 {e} 分。",
    specNote: "本说明书依据输入条件与目录中的实际价格计算得出（基于规则，未使用生成式 AI）。", specReq: "需求", specVolume: "每月请求数", specTokens: "每月 token（输入 / 输出，百万）", specCombos: "推荐模型组合", specRole: "角色", specModel: "模型", specShare: "流量占比", specMonthly: "预计月费用", specTotal: "合计", specHosting: "托管选项",
    svcDefault: "定制 AI 服务", svcCode: "自主编码智能体", svcRag: "企业内部 RAG 聊天机器人",
    svcMulti: "多模态客服机器人", svcTrans: "全球实时翻译 API", svcContent: "营销内容副驾驶",
    svcCustom: "定制分析",
    roleRouterPre: "分类与预处理（路由器）", rolePrimary: "主工作负载推理（主引擎）",
    roleFastRouter: "高速分类器（路由器）", roleMain: "高质量生成（主）",
    bestName: "Frontier Premier Quality (最高品质)",
    bestDesc: "面向以复杂推理与准确性为先的关键业务的顶级旗舰组合",
    bestAdv1: "业界顶尖智能", bestAdv2: "精确的多步推理",
    smartName: "Smart Balanced (性价比优化)", smartDesc: "针对成本与响应速度优化的实用组合",
    smartAdv1: "出色的性价比", smartAdv2: "快速响应",
    cfDesc: "可在边缘以极低成本运行", cfFor: "面向全球用户的服务",
    awsDesc: "企业级安全与托管 API", awsFor: "对数据安全要求严格的企业服务"
  },
  es: {
    specScore: "Puntuación", specBasis: "Base: puntuaciones de LMArena en la categoría '{cat}' (a {d}). La opción de valor exige {e}+ puntos por cada 10× de precio.",
    specNote: "Esta especificación se calcula con tus datos y los precios reales del catálogo (basada en reglas, sin IA generativa).", specReq: "Requisitos", specVolume: "Solicitudes mensuales", specTokens: "Tokens mensuales (entrada / salida, millones)", specCombos: "Combinaciones de modelos recomendadas", specRole: "Rol", specModel: "Modelo", specShare: "Cuota de tráfico", specMonthly: "Coste mensual est.", specTotal: "Total", specHosting: "Opciones de alojamiento",
    svcDefault: "Servicio de IA personalizado", svcCode: "Agente de programación autónomo", svcRag: "Chatbot RAG empresarial",
    svcMulti: "Bot de soporte multimodal", svcTrans: "API de traducción global en tiempo real", svcContent: "Copiloto de contenido de marketing",
    svcCustom: "Análisis personalizado",
    roleRouterPre: "Clasificación y preprocesamiento (router)", rolePrimary: "Inferencia de carga principal (motor primario)",
    roleFastRouter: "Clasificador de alta velocidad (router)", roleMain: "Generación de alta calidad (principal)",
    bestName: "Frontier Premier Quality",
    bestDesc: "Combinación insignia para servicios críticos donde el razonamiento complejo y la precisión son prioritarios",
    bestAdv1: "Inteligencia de primer nivel", bestAdv2: "Razonamiento preciso de varios pasos",
    smartName: "Smart Balanced", smartDesc: "Combinación práctica optimizada para coste y velocidad de respuesta",
    smartAdv1: "Excelente relación calidad-precio", smartAdv2: "Respuestas rápidas",
    cfDesc: "Funciona de forma muy económica en el edge", cfFor: "Servicios dirigidos a usuarios globales",
    awsDesc: "Seguridad empresarial con API gestionada", awsFor: "Servicios con requisitos estrictos de seguridad de datos"
  },
  de: {
    specScore: "Score", specBasis: "Grundlage: LMArena-Scores der Kategorie '{cat}' (Stand {d}). Die Preis-Leistungs-Wahl verlangt {e}+ Punkte je 10-fachem Preis.",
    specNote: "Diese Spezifikation wird aus Ihren Angaben und echten Katalogpreisen berechnet (regelbasiert, ohne generative KI).", specReq: "Anforderungen", specVolume: "Monatliche Anfragen", specTokens: "Monatliche Tokens (Eingabe / Ausgabe, Mio.)", specCombos: "Empfohlene Modellkombinationen", specRole: "Rolle", specModel: "Modell", specShare: "Traffic-Anteil", specMonthly: "Gesch. Monatskosten", specTotal: "Summe", specHosting: "Hosting-Optionen",
    svcDefault: "Individueller KI-Dienst", svcCode: "Autonomer Coding-Agent", svcRag: "Unternehmens-RAG-Chatbot",
    svcMulti: "Multimodaler Kundensupport-Bot", svcTrans: "Globale Echtzeit-Übersetzungs-API", svcContent: "Marketing-Content-Copilot",
    svcCustom: "Individuelle Analyse",
    roleRouterPre: "Klassifizierung & Vorverarbeitung (Router)", rolePrimary: "Haupt-Workload-Inferenz (Primär-Engine)",
    roleFastRouter: "Hochgeschwindigkeits-Klassifizierer (Router)", roleMain: "Hochwertige Generierung (Haupt)",
    bestName: "Frontier Premier Quality",
    bestDesc: "Top-Kombination für unternehmenskritische Dienste, bei denen komplexes Reasoning und Genauigkeit Vorrang haben",
    bestAdv1: "Führende Intelligenz", bestAdv2: "Präzises mehrstufiges Reasoning",
    smartName: "Smart Balanced", smartDesc: "Praktische Kombination, optimiert für Kosten und Antwortgeschwindigkeit",
    smartAdv1: "Hervorragendes Preis-Leistungs-Verhältnis", smartAdv2: "Schnelle Antworten",
    cfDesc: "Läuft am Edge sehr kostengünstig", cfFor: "Dienste mit globaler Nutzerbasis",
    awsDesc: "Unternehmenssicherheit mit verwalteter API", awsFor: "Dienste mit strengen Anforderungen an die Datensicherheit"
  },
  fr: {
    specScore: "Score", specBasis: "Base : scores LMArena de la catégorie « {cat} » (au {d}). L’option rapport qualité-prix exige {e}+ points par prix ×10.",
    specNote: "Cette spécification est calculée à partir de vos données et des prix réels du catalogue (à base de règles, sans IA générative).", specReq: "Exigences", specVolume: "Requêtes mensuelles", specTokens: "Tokens mensuels (entrée / sortie, millions)", specCombos: "Combinaisons de modèles recommandées", specRole: "Rôle", specModel: "Modèle", specShare: "Part du trafic", specMonthly: "Coût mensuel est.", specTotal: "Total", specHosting: "Options d'hébergement",
    svcDefault: "Service IA sur mesure", svcCode: "Agent de codage autonome", svcRag: "Chatbot RAG d’entreprise",
    svcMulti: "Bot de support client multimodal", svcTrans: "API de traduction mondiale en temps réel", svcContent: "Copilote de contenu marketing",
    svcCustom: "Analyse sur mesure",
    roleRouterPre: "Classification et prétraitement (routeur)", rolePrimary: "Inférence de la charge principale (moteur principal)",
    roleFastRouter: "Classifieur haute vitesse (routeur)", roleMain: "Génération de haute qualité (principal)",
    bestName: "Frontier Premier Quality",
    bestDesc: "Combinaison phare pour les services critiques où le raisonnement complexe et la précision priment",
    bestAdv1: "Intelligence de premier plan", bestAdv2: "Raisonnement multi-étapes précis",
    smartName: "Smart Balanced", smartDesc: "Combinaison pratique optimisée pour le coût et la vitesse de réponse",
    smartAdv1: "Excellent rapport qualité-prix", smartAdv2: "Réponses rapides",
    cfDesc: "Fonctionne à très faible coût en edge", cfFor: "Services destinés à un public mondial",
    awsDesc: "Sécurité d’entreprise avec API managée", awsFor: "Services aux exigences strictes de sécurité des données"
  }
};

export async function recommendArchitecture(req: RecommendationRequest, models: ModelSpec[]): Promise<ArchitectureRecommendationResult> {
  const L = T[req.language || "ko"] || T.ko;
  let service_title = L.svcDefault;
  if (req.service_type === 'code_agent') service_title = L.svcCode;
  else if (req.service_type === 'rag') service_title = L.svcRag;
  else if (req.service_type === 'multimodal') service_title = L.svcMulti;
  else if (req.service_type === 'translation') service_title = L.svcTrans;
  else if (req.service_type === 'content_creation') service_title = L.svcContent;

  if (req.custom_prompt) {
    const p = req.custom_prompt.toLowerCase();
    // 의도 감지 키워드. 한국어만 있어 다른 언어로 입력하면 요구사항이 잡히지 않았다.
    if (['코드', '코딩', '리팩토링', '개발', '에이전트', 'python', 'javascript', 'bug', 'code', 'coding', 'refactor', 'debug', 'agent', 'developer',
         'コード', 'エージェント', '开发', '代码', '智能体', 'código', 'programación', 'agente', 'entwickl', 'codage', 'développ'].some(w => p.includes(w))) req.requires_coding = true;
    if (['이미지', '비전', '캡처', '영수증', '사진', 'pdf 이미지', '음성', 'multimodal', 'image', 'vision', 'screenshot', 'receipt', 'photo', 'audio', 'voice',
         '画像', '音声', '图像', '语音', 'imagen', 'visión', 'voz', 'bild', 'sprache', 'imagerie', 'voix'].some(w => p.includes(w))) req.requires_multimodal = true;
    service_title = `${L.svcCustom}: "${req.custom_prompt.substring(0, 30)}"`;
  }

  // 토큰 수를 안 보내면 총량이 null 로 나갔다. 일반 대화 기준값을 쓴다.
  const inTok = req.avg_input_tokens || 2000;
  const outTok = req.avg_output_tokens || 500;
  const total_input_m = (req.monthly_requests * inTok) / 1000000;
  const total_output_m = (req.monthly_requests * outTok) / 1000000;

  // 모델은 카탈로그와 LMArena 분야별 점수로 고른다(src/recommendPicks.ts). 예전에는 id 6개를
  // 박아 두어 Sonnet 4.5·GPT-4o 같은 구세대 조합이 모든 용도에 나왔다.
  const picks = pickModels(models, { ...req, avg_input_tokens: inTok, avg_output_tokens: outTok });
  if (!picks) throw new Error('추천 후보 없음: 점수와 단가를 가진 최신 모델이 카탈로그에 없다');

  const item = (role: string, p: Pick, share: number): ModelComboItem => ({
    role, model_id: p.model.id, model_name: p.model.name, provider_name: p.model.provider_name,
    allocation_percent: share, monthly_estimated_cost: p.monthlyCost * share / 100,
    ...(p.score != null ? { score: p.score } : {}),
  });
  // 점수가 있는 항목만으로 가중 평균한다. 없는 것을 0 으로 치면 평균이 엉뚱하게 낮아진다.
  const weighted = (items: ModelComboItem[]) => {
    const scored = items.filter((i) => i.score != null);
    const share = scored.reduce((a, i) => a + i.allocation_percent, 0);
    return share ? Math.round(scored.reduce((a, i) => a + (i.score as number) * i.allocation_percent, 0) / share) : 0;
  };

  const best_items = [item(L.roleRouterPre, picks.router, 30), item(L.rolePrimary, picks.quality, 70)];
  const best_combo: ModelCombo = {
    id: "best_quality", name: L.bestName, tag: "Frontier Quality",
    description: L.bestDesc,
    items: best_items,
    total_monthly_cost: best_items.reduce((a, b) => a + b.monthly_estimated_cost, 0),
    avg_arena_elo: weighted(best_items),
    key_advantages: [L.bestAdv1, L.bestAdv2]
  };

  const smart_items = [item(L.roleFastRouter, picks.router, 40), item(L.roleMain, picks.balanced, 60)];
  const smart_combo: ModelCombo = {
    id: "smart_balanced", name: L.smartName, tag: "Recommended",
    description: L.smartDesc,
    items: smart_items,
    total_monthly_cost: smart_items.reduce((a, b) => a + b.monthly_estimated_cost, 0),
    avg_arena_elo: weighted(smart_items),
    key_advantages: [L.smartAdv1, L.smartAdv2]
  };

  const hosting_options = [
    { provider: "Cloudflare Workers AI", category: "Edge Serverless", estimated_monthly_cost: 0, description: L.cfDesc, recommended_for: L.cfFor },
    { provider: "AWS Bedrock", category: "Managed Cloud API", estimated_monthly_cost: smart_combo.total_monthly_cost, description: L.awsDesc, recommended_for: L.awsFor }
  ];

  // 예전에는 여기서 LLM 으로 명세서를 만들었다. 워커에 LLM 키가 설정된 적이 없고 부르던
  // 모델(llama-3.3-70b-versatile 등)도 사라져서, "실시간 생성" 을 누르면 명세서가
  // "# Error generating spec" 한 줄이었다. 위에서 계산한 실제 값으로 명세서를 만든다.
  const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const comboTable = (c: ModelCombo) => [
    `### ${c.name}`,
    c.description,
    '',
    `| ${L.specRole} | ${L.specModel} | ${L.specScore} | ${L.specShare} | ${L.specMonthly} |`,
    '|---|---|---:|---:|---:|',
    ...c.items.map((i) => `| ${i.role} | ${i.model_name} (${i.provider_name}) | ${i.score ?? '—'} | ${i.allocation_percent}% | ${usd(i.monthly_estimated_cost)} |`),
    `| **${L.specTotal}** | | | | **${usd(c.total_monthly_cost)}** |`,
  ].join('\n');
  const markdown_spec = [
    `# ${service_title}`,
    `> ${L.specNote}`,
    `> ${L.specBasis.replace('{cat}', picks.category).replace('{d}', picks.asof || '—').replace('{e}', String(ELO_PER_10X_PRICE))}`,
    '',
    `## ${L.specReq}`,
    `- ${L.specVolume}: ${req.monthly_requests.toLocaleString('en-US')}`,
    `- ${L.specTokens}: ${total_input_m.toLocaleString('en-US', { maximumFractionDigits: 1 })} / ${total_output_m.toLocaleString('en-US', { maximumFractionDigits: 1 })}`,
    ...(req.custom_prompt ? [`- ${req.custom_prompt.slice(0, 300)}`] : []),
    '',
    `## ${L.specCombos}`,
    comboTable(smart_combo),
    '',
    comboTable(best_combo),
    '',
    `## ${L.specHosting}`,
    ...hosting_options.map((h) => `- **${h.provider}** (${h.category}) — ${h.description}`),
  ].join('\n');

  return {
    service_name: service_title,
    monthly_requests: req.monthly_requests,
    total_monthly_input_tokens_m: total_input_m,
    total_monthly_output_tokens_m: total_output_m,
    combos: [smart_combo, best_combo],
    hosting_options,
    // spec_bundle 은 비워 두면 화면이 markdown_spec 으로 파일 묶음을 만든다.
    markdown_spec,
    // 어떤 LMArena 분야로 골랐는지. 화면의 '도움이 됐나요' 가 이 단위로 모인다.
    basis_category: picks.category,
  };
}
