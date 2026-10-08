import { useState, useEffect, useMemo } from 'react';
import { Newspaper, Users, Lightbulb, Briefcase, Microscope, Activity, Hash, Clock, RefreshCw, Search, X, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { fetchChangelog, type ChangelogEntry } from '../api';
import { NewsDetailView } from './NewsDetailView';
import { track } from '../analytics';

interface ActionableInsight {
  developer?: string;
  pm?: string;
  business?: string;
  researcher?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string;
  category: string;
  image_url?: string;
  summary_bullets: string[];
  blog_summary?: string;
  actionable_insight: ActionableInsight | null;
  impact_score: number;
  tags: string[];
  matched_lenses: string[];
  is_new?: boolean;
  is_synthesized?: boolean;
  multi_sources?: Array<{ name: string; url: string }>;
  primary_topic?: string;
}

import type { Language } from '../i18n/translations';

interface NewsResponse {
  articles: NewsArticle[];
  total_count: number;
  last_updated: string;
}

const MULTILINGUAL_ARTICLE_MAP: Record<string, Record<Language, string>> = {
  "Robust and Personalized Federated Learning for Aircraft-Engine Prognostics under Benign and Adversarial Client Heterogeneity": {
    ko: "건전 및 적대적 클라이언트 이질성 환경에서의 항공 엔진 상태 진단을 위한 강건하고 개인화된 연합 학습",
    en: "Robust and Personalized Federated Learning for Aircraft-Engine Prognostics under Benign and Adversarial Client Heterogeneity",
    ja: "健全および敵対的クライアント非均一性環境における航空エンジン状態診断のための堅牢かつ個別化された連合学習",
    zh: "在良性和对抗性客户端异质性下用于航空发动机预后的稳健和个性化联邦学习",
    es: "Aprendizaje federado robusto y personalizado para el pronóstico de motores de aeronaves bajo heterogeneidad benigna y adversaria",
    de: "Robustes und personalisiertes föderiertes Lernen für die Prognose von Flugzeugtriebwerken unter gutartiger und gegnerischer Client-Heterogenität",
    fr: "Apprentissage fédéré robuste et personnalisé pour le pronostic des moteurs d'aéronefs sous hétérogénéité bénigne et adverse",
  },
  "Federated learning (FL) enables aircraft fleet operators to jointly train remaining-useful-life (RUL) models from engine sensor telemetry without sharing raw data.": {
    ko: "연합 학습(FL)을 통해 항공기 운용사는 원시 데이터 공유 없이 엔진 센서 텔레메트리 데이터를 활용하여 잔여 유효 수명(RUL) 예측 모델을 공동 학습할 수 있습니다.",
    en: "Federated learning (FL) enables aircraft fleet operators to jointly train remaining-useful-life (RUL) models from engine sensor telemetry without sharing raw data.",
    ja: "連合学習（FL）により、航空会社は生データを共有することなく、エンジンセンサーデータから残存有用寿命（RUL）モデルを共同訓練できます。",
    zh: "联邦学习 (FL) 使机队运营商能够在不共享原始数据的情况下，根据发动机传感器遥测数据共同训练剩余使用寿命 (RUL) 模型。",
    es: "El aprendizaje federado (FL) permite a los operadores de flotas entrenar conjuntamente modelos de vida útil restante (RUL) a partir de la telemetría del sensor del motor sin compartir datos no procesados.",
    de: "Föderiertes Lernen (FL) ermöglicht es Fluggesellschaften, Modelle für die verbleibende Nutzungsdauer (RUL) aus Triebwerkssensordaten gemeinsam zu trainieren, ohne Rohdaten zu teilen.",
    fr: "L'apprentissage fédéré (FL) permet aux opérateurs de flottes d'entraîner conjointement des modèles de durée de vie utile restante (RUL) à partir de la télémétrie des capteurs sans partager de données brutes.",
  },
  "This study examines two complementary challenges: benign heterogeneity, where honest operators observe different operating conditions and fault modes, and adversarial heterogeneity, where compromised operators submit poisoned updates.": {
    ko: "본 연구는 두 가지 상호보완적 과제(정상 운용사의 다양한 동작 환경/고장 모드에 따른 일반 이질성과, 악의적 사용자가 오염된 업데이트를 제출하는 적대적 이질성)를 분석합니다.",
    en: "This study examines two complementary challenges: benign heterogeneity, where honest operators observe different operating conditions and fault modes, and adversarial heterogeneity, where compromised operators submit poisoned updates.",
    ja: "本研究では、健全なオペレータが異なる動作条件を観測する一般的非均一性と、攻撃者が汚染データを送信する敵対的非均一性の2つの課題を分析します。",
    zh: "本研究探讨了两个互补的挑战：良性异质性（诚实运营商观察到不同的运行条件和故障模式）和对抗性异质性（被受损运营商提交中毒更新）。",
    es: "Este estudio examina dos desafíos complementarios: la heterogeneity benigna y la heterogeneidad adversaria.",
    de: "Diese Studie untersucht zwei sich ergänzende Herausforderungen: gutartige Heterogenität und gegnerische Heterogenität.",
    fr: "Cette étude examine deux défis complémentaires : l'hétérogénéité bénigne et l'hétérogénéité adverse.",
  },
  "Tactus: Open-Vocabulary Object Recognition from Low-Cost Pressure Arrays": {
    ko: "저비용 압력 어레이 기반 개방형 어휘 물체 인식 모델 Tactus",
    en: "Tactus: Open-Vocabulary Object Recognition from Low-Cost Pressure Arrays",
    ja: "低コスト圧力アレイに基づくオープンボキャブラリー物体認識モデル Tactus",
    zh: "基于低成本压力阵列的开放词汇物体识别模型 Tactus",
    es: "Tactus: Reconocimiento de objetos de vocabulario abierto a partir de matrices de presión de bajo costo",
    de: "Tactus: Open-Vocabulary-Objekterkennung aus kostengünstigen Druckfeldern",
    fr: "Tactus : Reconnaissance d'objets à vocabulaire ouvert à partir de réseaux de pression à bas coût",
  },
  "Resistive pressure arrays are the cheapest and most widely shipped tactile sensors, yet tactile representation learning has concentrated on optical sensors that image a deforming gel.": {
    ko: "저항성 압력 어레이는 가장 보급률이 높은 촉각 센서이지만, 기존 촉각 표현 학습은 변형 젤 방식 광학 센서에 치우쳐 있었습니다.",
    en: "Resistive pressure arrays are the cheapest and most widely shipped tactile sensors, yet tactile representation learning has concentrated on optical sensors that image a deforming gel.",
    ja: "抵抗膜方式の圧力アレイは最も安価な触覚センサーですが、従来の表現学習は光学式に偏っていました。",
    zh: "电阻式压力阵列是最便宜、应用最广泛的触觉传感器，但触觉表示学习主要集中在光学传感器上。",
    es: "Las matrices de presión resistiva son los sensores táctiles más baratos, aunque el aprendizaje se ha centrado en sensores ópticos.",
    de: "Widerstands-Drucksensoren sind die günstigsten taktilen Sensoren, die bisherige Forschung konzentrierte sich jedoch auf optische Sensoren.",
    fr: "Les réseaux de pression résistifs sont les capteurs tactiles les moins chers, mais l'apprentissage s'est concentré sur les capteurs optiques.",
  }
};

const I18N_TEXTS = {
  ko: {
    title: "AI 트렌드 뉴스 2.0",
    subtitle: "실시간 AI 트렌드와 내 업무에 바로 적용하는 실전 팁",
    pulses: "개 펄스",
    updated: "방금 전 갱신",
    refresh: "새로고침",
    loadFailed: "뉴스를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.",
    noArticles: "검색어나 렌즈 조건에 맞는 기사가 없습니다.",
    searchPlaceholder: "🔍 AI 트렌드 뉴스 키워드, 기업, 기술 검색 (예: OpenAI, Agent, 보안...)",
    searchResultCount: "개 기사 검색됨",
    factTitle: "핵심 3줄 요약 (Fact)",
    insightTitle: "실전 활용 팁 (Actionable Insight)",
    readOriginal: "원문 기사 전문 보러가기",
    modalBadge: "📖 AI 심층 기술 블로그 리포트",
    modalClose: "닫기",
    devLabel: "[개발자]",
    pmLabel: "[기획/PM]",
    bizLabel: "[비즈니스]",
    resLabel: "[연구/학계]",
    lenses: {
      all: '🔥 전체',
      new: "✨ 최신 속보 (NEW)",
      developer: '👩‍💻 코딩 & 프레임워크',
      agent: '🤖 Agent & 오토메이션',
      pm: '💡 기획 & UX',
      business: '💼 비즈니스 & TCO',
      researcher: '🔬 최신 논문 & 학계'
    }
  },
  en: {
    title: "AI Trend News 2.0",
    subtitle: "Real-time AI trends & actionable insights for your workflow",
    pulses: "Pulses",
    updated: "Just updated",
    refresh: "Refresh",
    loadFailed: "Could not load the news feed. Please refresh in a moment.",
    noArticles: "No articles found for the current search/lens filter.",
    searchPlaceholder: "🔍 Search keywords, tech, company (e.g. OpenAI, Agent, Security...)",
    searchResultCount: "articles found",
    factTitle: "Key 3-Bullet Summary (Fact)",
    insightTitle: "Actionable Insights by Role",
    readOriginal: "Read Full Source Article",
    modalBadge: "📖 AI Technical Deep-Dive Report",
    modalClose: "Close",
    devLabel: "[Developer]",
    pmLabel: "[PM/Product]",
    bizLabel: "[Business]",
    resLabel: "[Researcher]",
    lenses: {
      all: '🔥 All Feed',
      new: "✨ Latest (NEW)",
      developer: '👩‍💻 Coding & Dev',
      agent: '🤖 Agent & Automation',
      pm: '💡 Product & UX',
      business: '💼 Business & TCO',
      researcher: '🔬 Research & Papers'
    }
  },
  ja: {
    title: "AI トレンドニュース 2.0",
    subtitle: "リアルタイムAIトレンドと実務に直結する活用ヒント",
    pulses: "件のパルス",
    updated: "更新完了",
    refresh: "更新",
    loadFailed: "ニュースを読み込めませんでした。しばらくしてから更新してください。",
    noArticles: "検索条件やレンズに一致する記事がありません。",
    searchPlaceholder: "🔍 キーワード・技術・企業検索 (例: OpenAI, Agent, セキュリティ...)",
    searchResultCount: "件ヒット",
    factTitle: "要約 3つのポイント (Fact)",
    insightTitle: "職種別活用ヒント (Actionable Insight)",
    readOriginal: "原文記事の全文を見る",
    modalBadge: "📖 AI 詳細技術レポート",
    modalClose: "閉じる",
    devLabel: "[開発者]",
    pmLabel: "[企画/PM]",
    bizLabel: "[ビジネス]",
    resLabel: "[研究/学術]",
    lenses: {
      all: '🔥 全体',
      new: "✨ 最新速報 (NEW)",
      developer: '👩‍💻 コーディング＆開発',
      agent: '🤖 エージェント＆自動化',
      pm: '💡 企画＆UX',
      business: '💼 ビジネス＆TCO',
      researcher: '🔬 最新論文＆学術'
    }
  },
  zh: {
    title: "AI 趋势新闻 2.0",
    subtitle: "实时 AI 趋势与业务应用实践指南",
    pulses: "条脉搏",
    updated: "刚刚更新",
    refresh: "刷新",
    loadFailed: "无法加载新闻。请稍后刷新。",
    noArticles: "没有符合当前搜索或视角筛选的文章。",
    searchPlaceholder: "🔍 搜索关键词、技术或公司 (例: OpenAI, Agent, 安全...)",
    searchResultCount: "条结果",
    factTitle: "核心 3 条摘要 (Fact)",
    insightTitle: "岗位应用提示 (Actionable Insight)",
    readOriginal: "查看原文全文",
    modalBadge: "📖 AI 深度技术报告",
    modalClose: "关闭",
    devLabel: "[开发者]",
    pmLabel: "[产品/PM]",
    bizLabel: "[商业]",
    resLabel: "[研究/学术]",
    lenses: {
      all: '🔥 全部',
      new: "✨ 最新快讯 (NEW)",
      developer: '👩‍💻 编程与开发',
      agent: '🤖 智能体与自动化',
      pm: '💡 产品与 UX',
      business: '💼 商业与 TCO',
      researcher: '🔬 最新论文与学术'
    }
  },
  es: {
    title: "Noticias de Tendencias de IA 2.0",
    subtitle: "Tendencias de IA en tiempo real e información práctica",
    pulses: "Noticias",
    updated: "Actualizado",
    refresh: "Actualizar",
    loadFailed: "No se pudieron cargar las noticias. Actualiza en un momento.",
    noArticles: "No hay artículos para la búsqueda o el filtro actual.",
    searchPlaceholder: "🔍 Buscar palabras clave, empresas o tecnología...",
    searchResultCount: "artículos encontrados",
    factTitle: "Resumen de 3 Puntos (Fact)",
    insightTitle: "Recomendaciones por Rol (Actionable Insight)",
    readOriginal: "Leer Artículo Completo",
    modalBadge: "📖 Reporte Técnico de IA",
    modalClose: "Cerrar",
    devLabel: "[Desarrollador]",
    pmLabel: "[Producto/PM]",
    bizLabel: "[Negocios]",
    resLabel: "[Investigador]",
    lenses: {
      all: '🔥 Todo',
      new: "✨ Novedades (NEW)",
      developer: '👩‍💻 Código y Dev',
      agent: '🤖 Agentes y Automatización',
      pm: '💡 Producto y UX',
      business: '💼 Negocios y TCO',
      researcher: '🔬 Investigación y Papers'
    }
  },
  de: {
    title: "AI Trend News 2.0",
    subtitle: "Echtzeit-KI-Trends & praktische Einblicke für Ihren Workflow",
    pulses: "Nachrichten",
    updated: "Aktualisiert",
    refresh: "Aktualisieren",
    loadFailed: "Nachrichten konnten nicht geladen werden. Bitte in Kürze aktualisieren.",
    noArticles: "Keine Artikel für die aktuelle Suche bzw. den Filter.",
    searchPlaceholder: "🔍 Stichwort, Unternehmen oder Technologie suchen...",
    searchResultCount: "Artikel gefunden",
    factTitle: "Kernpunkte 3-Zeilen (Fact)",
    insightTitle: "Praktische Tipps nach Rolle",
    readOriginal: "Vollständigen Quellartikel lesen",
    modalBadge: "📖 KI Technischer Bericht",
    modalClose: "Schließen",
    devLabel: "[Entwickler]",
    pmLabel: "[Produkt/PM]",
    bizLabel: "[Business]",
    resLabel: "[Forscher]",
    lenses: {
      all: '🔥 Alle Feed',
      new: "✨ Neuestes (NEW)",
      developer: '👩‍💻 Coden & Dev',
      agent: '🤖 Agenten & Automation',
      pm: '💡 Produkt & UX',
      business: '💼 Business & TCO',
      researcher: '🔬 Forschung & Papiere'
    }
  },
  fr: {
    title: "Actualités Tendances IA 2.0",
    subtitle: "Tendances IA en temps réel et conseils pratiques",
    pulses: "Articles",
    updated: "Mis à jour",
    refresh: "Actualiser",
    loadFailed: "Impossible de charger les actualités. Veuillez actualiser dans un instant.",
    noArticles: "Aucun article ne correspond à la recherche ou au filtre actuel.",
    searchPlaceholder: "🔍 Rechercher par mots-clés, entreprises...",
    searchResultCount: "articles trouvés",
    factTitle: "Résumé en 3 Points (Fact)",
    insightTitle: "Conseils Pratiques par Rôle",
    readOriginal: "Lire l'article d'origine",
    modalBadge: "📖 Rapport Technique IA",
    modalClose: "Fermer",
    devLabel: "[Développeur]",
    pmLabel: "[Produit/PM]",
    bizLabel: "[Business]",
    resLabel: "[Chercheur]",
    lenses: {
      all: '🔥 Tous',
      new: "✨ Dernières (NEW)",
      developer: '👩‍💻 Code & Dev',
      agent: '🤖 Agents & Automatisation',
      pm: '💡 Produit & UX',
      business: '💼 Business & TCO',
      researcher: '🔬 Recherche & Papiers'
    }
  }
};

const LENSES = [
  { id: 'all', label: '🔥 전체 피드', icon: Activity, desc: '주요 AI 트렌드 종합' },
  { id: 'synthesized', label: '🔮 다중 소스 융합 블로그', icon: Sparkles, desc: '2~5개 관련 기사를 교차 분석하여 통합 탄생시킨 차세대 기술 블로그' },
  { id: 'new', label: '✨ 최신 속보 (NEW)', icon: Sparkles, desc: '최근 72시간 이내 수집된 신규 기술 리포트만 조망' },
  { id: 'developer', label: '👩‍💻 코딩 & 프레임워크', icon: Users, desc: 'API, 파인튜닝, Coding Agent, SDK' },
  { id: 'agent', label: '🤖 Agent & 오토메이션', icon: Activity, desc: 'Agentic AI, 자율 에이전트, RAG, 멀티에이전트' },
  { id: 'pm', label: '💡 기획 & UX', icon: Lightbulb, desc: '프롬프트 엔지니어링, AI UI/UX, 대화 가드레일' },
  { id: 'business', label: '💼 비즈니스 & TCO', icon: Briefcase, desc: 'ROI, 클라우드 호스팅 TCO, 사내 보안 IAM' },
  { id: 'researcher', label: '🔬 최신 논문 & 학계', icon: Microscope, desc: 'SOTA 벤치마크, MCTS, ArXiv 논문 요약' }
];

export default function NewsPulseView() {
  const { language, t: g } = useLanguage();
  const t = I18N_TEXTS[language as keyof typeof I18N_TEXTS] || I18N_TEXTS.en;

  // 📐 LaTeX 수식 표기 및 특수 문법 모던 웹 텍스트로 자동 정제
  const cleanLaTeXAndFormatting = (text: string): string => {
    if (!text) return '';
    let clean = text;

    // 1. TeX 위수/하수 수식 정제 (예: C$^2$MOE -> C²MOE, C$^1$ -> C¹)
    clean = clean.replace(/C\$\^2\$\s*MOE/gi, 'C²MOE');
    clean = clean.replace(/\$\^2\$/g, '²');
    clean = clean.replace(/\$\^1\$/g, '¹');
    clean = clean.replace(/\$\^3\$/g, '³');
    clean = clean.replace(/\$\\ell_\\infty\$/gi, 'ℓ∞');
    clean = clean.replace(/\$\\ell_0\$/gi, 'ℓ₀');
    clean = clean.replace(/\$\\ell_1\$/gi, 'ℓ₁');
    clean = clean.replace(/\$\\ell_2\$/gi, 'ℓ₂');
    clean = clean.replace(/\\mathbf\{([^}]+)\}/g, '$1');
    clean = clean.replace(/\\mathit\{([^}]+)\}/g, '$1');
    clean = clean.replace(/\$([^\$]+)\$/g, '$1'); // 일반 인라인 TeX $...$ 제거

    // 2. OCR/PDF 영문 줄바꿈 하이픈 결합
    clean = clean.replace(/([a-zA-Z]+)-\s*[\r\n]*\s*([a-zA-Z]+)/g, '$1$2');
    clean = clean.replace(/Poseagnostic/gi, 'Pose-agnostic');
    clean = clean.replace(/anomalyfree/gi, 'anomaly-free');
    clean = clean.replace(/imagespace/gi, 'image-space');

    return clean.trim();
  };

  // 🌐 다국어 지원 모듈(LanguageContext)과 동적 연동되는 기사 번역 파서
  const formatTranslatedText = (rawText: string) => {
    if (!rawText) return '';
    let text = cleanLaTeXAndFormatting(rawText);

    // 1. ArXiv 번호 및 헤더 태그 정밀 제거
    text = text.replace(/(?:\d{5}v\d+\s+)?(?:arXiv:\d+\.\d+v?\d*\s+)?Announce Type:\s*(?:new|cross)\s*Abstract:\s*/gi, '');

    // 2. 다국어 지원 모듈 딕셔너리 연동 매핑
    for (const [engPhrase, translationsMap] of Object.entries(MULTILINGUAL_ARTICLE_MAP)) {
      if (text.includes(engPhrase)) {
        const targetTranslation = translationsMap[language] || translationsMap['en'] || engPhrase;
        text = text.replace(engPhrase, targetTranslation);
      }
    }

    // 3. ArXiv 신규 학술 논문 1:1 정밀 한국어 번역 룰
    text = text.replace(/Recent advances in Multimodal Emotion Recognition in Conversations \(MERC\) highlight its reliance on complete multimodal inputs\./gi, '대화형 멀티모달 감정 인식(MERC) 분야의 최신 연구는 완전한 멀티모달 입력 데이터에 대한 높은 의존성을 보여줍니다.');
    text = text.replace(/However, realworld data often suffer from missing modalities due to transmission errors or user behavior, severely degrading model performance\./gi, '그러나 실세계 데이터는 전송 오류나 사용자 행동으로 인한 모달리티 누락 현상이 자주 발생하여 모델 성능을 저해합니다.');
    text = text.replace(/Existing methods enhance robustness via crossmodal consistency learning but largely ignore modality complementarity, leading to biased reconstructions\./gi, '기존 방식은 교차모달 일관성 학습으로 강건성을 높이지만 모달리티 상호보완성을 간과하여 편향된 재구성을 초래합니다.');

    text = text.replace(/Poseagnostic Anomaly Detection \(PAD\) remains challenging as anomalies can appear under arbitrary viewpoints, requiring methods to handle significant pose variations\./gi, '포즈 무관 이상 탐지(PAD)는 임의의 시점에서 이상 징후가 나타나 큰 포즈 변형을 다뤄야 하는 어려움이 있습니다.');
    text = text.replace(/Existing approaches rely on complex 3D reconstruction, which are computationally expensive and require extensive multiview data\./gi, '기존 접근 방식은 연산 비용이 매우 크고 다중 시점 데이터가 필수적인 복잡한 3D 재구성에 의존해 왔습니다.');
    text = text.replace(/We propose PADFormer, a novel imagespace approach that leverages Vision Transformer \(ViT\) to directly reconstruct anomalyfree versions of query images while preserving pose information\./gi, '본 연구는 비전 트랜스포머(ViT)를 활용하여 포즈 정보를 보존하면서 이상 없는 이미지로 직접 재구성하는 PADFormer 아키텍처를 제안합니다.');

    text = text.replace(/This work investigates the feasibility of augmenting traditional R-Matrix codes with a robust machine learning framework for automatically detecting neutron resonances in transmission spectra\./gi, '본 연구는 투과 스펙트럼 내 중성자 공명을 자동 탐지하기 위해 기존 R-Matrix 코드를 머신러닝 프레임워크로 보완하는 기법을 제안합니다.');
    text = text.replace(/Neutron transmission data are often complex and noisy, making them difficult to analyze using traditional peak-identification methods\./gi, '중성자 투과 데이터는 복잡하고 잡음이 많아 기존 피크 식별 방식으로는 분석에 어려움이 있었습니다.');
    text = text.replace(/The state-of-the-art R-Matrix codes currently used by physicists to fit these data often depend on prior evaluations and require substantial manual effort\./gi, '기존 물리학자들이 사용하던 SOTA R-Matrix 코드는 사전 평가 의존성이 높아 수동 작업 소요가 컸습니다.');

    text = text.replace(/The subdominant \(minmax\) ultrametric is a canonical tree-structured summary of a dissimilarity matrix, arising equivalently as the ultrametric induced by single-linkage clustering\./gi, '서브도미넌트(Minmax) 울트라메트릭은 비유사성 행렬의 대표적 트리 구조 요약 표현으로 단일 연결 클러스터링을 유도합니다.');
    text = text.replace(/While its classical stability theory is usually formulated in \$\\ell_\\infty\$ or Gromov--Hausdorff terms, such bounds are poorly suited to sparse perturbations that alter only a few pairwise distances\./gi, '기존 안정성 이론은 ℓ∞ 또는 Gromov-Hausdorff 조건으로 정형화되었으나 일부 쌍별 거리를 변형하는 희소 섭동에는 비효율적이었습니다.');
    text = text.replace(/We develop an \$\\ell_0\$-type stability theory for this operator\./gi, '본 연구는 이러한 연산자를 위해 강건한 ℓ₀ 형식의 새로운 안정성 이론을 개발했습니다.');

    // 4. 영문 피드 구문 단위 범용 동적 번역 헬퍼
    if (language === 'ko') {
      text = text.replace(/Recent advances in/gi, '최신 기술 발전:');
      text = text.replace(/highlight its reliance on/gi, '의존성을 보여주며');
      text = text.replace(/severely degrading model performance/gi, '모델 성능 감소를 유발합니다.');
      text = text.replace(/Existing methods/gi, '기존 연구 기법은');
      text = text.replace(/Existing approaches/gi, '기존 접근 방식은');
      text = text.replace(/We propose/gi, '본 논문에서는');
      text = text.replace(/This work investigates/gi, '본 연구는');
    }

    return text;
  };

  const formatArticleTitle = (rawTitle: string) => {
    if (!rawTitle) return '';
    let title = cleanLaTeXAndFormatting(rawTitle);

    // "소식 및 기술 리포트" 중복 접미사 정제
    title = title.replace(/\s*소식 및 기술 리포트$/g, '').trim();

    // 영문 제목 1:1 한국어 매핑
    const titleMap: Record<string, string> = {
      "C²MOE: Consistency and Complementarity-guided Mixture of Experts for Incomplete Multimodal Emotion Learning": "C²MoE: 불완전 멀티모달 감정 학습을 위한 일관성 및 상호보완성 가이드 전문가 혼합 모델",
      "C$^2$MOE: Consistency and Complementarity-guided Mixture of Experts for Incomplete Multimodal Emotion Learning": "C²MoE: 불완전 멀티모달 감정 학습을 위한 일관성 및 상호보완성 가이드 전문가 혼합 모델",
      "PADFormer: Pose-agnostic Anomaly Detection from Sparse View Images": "PADFormer: 희소 시점 이미지 기반 포즈 무관 이상 탐지 모델",
      "Learning to Resolve Neutron Resonances with Fully Convolutional Neural Networks": "완전 합성곱 신경망(FCNN)을 활용한 중성자 공명 해석 자동화 모델",
      "On Hamming-Lipschitz Type Stability of the Subdominant (Minmax) Ultrametric: Theory and Simple Proofs": "서브도미넌트(Minmax) 울트라메트릭의 해밍-립시츠 유형 안정성: 이론 및 정밀 증명"
    };

    if (titleMap[title]) {
      title = titleMap[title];
    } else if (titleMap[rawTitle.trim()]) {
      title = titleMap[rawTitle.trim()];
    }

    if (language === 'ko' && !title.endsWith('소식 및 기술 리포트') && !title.endsWith('리포트')) {
      return `${title} 소식 및 기술 리포트`;
    }

    return title;
  };

  // URL query parameter ?lens= 파싱으로 탭 직행 및 북마크/즐겨찾기 지원
  const getInitialLens = () => {
    const params = new URLSearchParams(window.location.search);
    const lensParam = params.get('lens');
    if (lensParam && ['all', 'developer', 'agent', 'pm', 'business', 'researcher'].includes(lensParam)) {
      return lensParam;
    }
    return 'all';
  };

  const [activeLens, setActiveLensState] = useState(getInitialLens);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 최근 업데이트 노트. 없으면 배너를 그리지 않는다 — 빈 배너는 정확히 반대 인상을 준다.
  const [latestUpdate, setLatestUpdate] = useState<ChangelogEntry | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  // 목록 API 는 본문을 싣지 않는다(예전엔 421건 본문까지 실어 압축 1MB). 기사를 열 때 본문을 받는다.
  const [fullArticle, setFullArticle] = useState<NewsArticle | null>(null);
  useEffect(() => {
    if (!selectedArticle) { setFullArticle(null); return; }
    if (selectedArticle.blog_summary !== undefined) { setFullArticle(selectedArticle); return; }
    let alive = true;
    setFullArticle(null);
    fetch(`${API_BASE_URL}/news/articles/${encodeURIComponent(selectedArticle.id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((full) => { if (alive) setFullArticle({ ...selectedArticle, ...full }); })
      // 본문을 못 받아도 목록 정보(요약·팁)로 상세를 연다. NewsDetailView 가 그 경우를 그린다.
      .catch(() => { if (alive) setFullArticle(selectedArticle); });
    return () => { alive = false; };
  }, [selectedArticle]);

  // 서브 렌즈 탭 클릭 시 주소창 URL 자동 동기화 (북마크/즐겨찾기/공유 가능)
  const setActiveLens = (lens: string) => {
    setActiveLensState(lens);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'news');
    url.searchParams.set('lens', lens);
    window.history.pushState({}, '', url.toString());
  };

  // 🔗 기사 상세 페이지 라우트 선택 및 URL 파라미터 동기화 (공유/북마크 지원)
  const handleSelectArticle = (article: NewsArticle) => {
    track('news_open', { label: article.title });
    setSelectedArticle(article);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'news');
    url.searchParams.set('article', article.id);
    window.history.pushState({}, '', url.toString());
  };

  const handleBackFromDetail = () => {
    setSelectedArticle(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('article');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // API 데이터 로드 완료 시 갱신
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      const target = newsData?.articles?.find(a => a.id === articleId);
      if (target) {
        setSelectedArticle(target);
      }
    }
  }, [newsData]);

  // 뒤로가기/앞으로가기 popstate 감지
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const lensParam = params.get('lens') || 'all';
      const articleId = params.get('article');
      setActiveLensState(lensParam);

      if (articleId) {
        const target = newsData?.articles?.find(a => a.id === articleId);
        if (target) {
          setSelectedArticle(target);
          return;
        }
      }
      setSelectedArticle(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [newsData]);

  const isRecentArticle = (pubDateStr: string, isNewField?: boolean): boolean => {
    if (isNewField) return true;
    if (!pubDateStr) return false;
    try {
      const pubTime = new Date(pubDateStr).getTime();
      if (isNaN(pubTime)) return false;
      const diffHours = (Date.now() - pubTime) / (1000 * 60 * 60);
      return diffHours <= 96; // 4일 이내 신규 수집 기사
    } catch {
      return false;
    }
  };

  const fetchNews = async (lens: string) => {
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const url = (lens === 'all' || lens === 'new')
        ? `${API_BASE_URL}/news/pulse`
        : `${API_BASE_URL}/news/pulse?lens=${lens}`;
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data && data.articles && data.articles.length > 0) {
        setNewsData(data);
        setError(null);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      // 예전에는 번들에 넣어둔 가짜 기사를 대신 보여줬다. 실패를 실제 뉴스처럼
      // 위장하는 것이라 로드 실패는 실패라고 말한다.
      console.warn('News fetch failed:', err);
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeLens);
  }, [activeLens]);

  useEffect(() => {
    fetchChangelog().then((rows) => {
      const recent = rows.find((r) => {
        const days = (Date.now() - Date.parse(`${r.period_end}T00:00:00Z`)) / 86_400_000;
        return Number.isFinite(days) && days <= 14;   // 2주 지난 소식은 '새로워진 점' 이 아니다
      });
      setLatestUpdate(recent ?? null);
    });
  }, []);

  // 키워드 및 렌즈 실시간 필터링 (3중 정밀 데두플리케이션 적용)
  const filteredArticles = useMemo(() => {
    if (!newsData?.articles) return [];
    let list = newsData.articles;

    if (activeLens === 'synthesized') {
      list = list.filter(a => a.is_synthesized || a.category?.includes('융합') || a.title?.includes('다중 소스 융합') || a.title?.includes('다중소스') || a.matched_lenses?.includes('synthesized'));
    } else if (activeLens === 'new') {
      list = list.filter(a => isRecentArticle(a.published_at, a.is_new));
    } else if (activeLens !== 'all') {
      // ✅ 렌즈 탭 필터링: 해당 렌즈가 matched_lenses에 포함된 기사만 표시
      list = list.filter(a => a.matched_lenses?.includes(activeLens));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(article => {
        const titleMatch = article.title.toLowerCase().includes(q);
        const sourceMatch = article.source_name.toLowerCase().includes(q);
        const tagMatch = article.tags?.some(tag => tag.toLowerCase().includes(q));
        const summaryMatch = article.summary_bullets?.some(b => b.toLowerCase().includes(q));
        const insightMatch = article.actionable_insight 
          ? Object.values(article.actionable_insight).some(v => v && v.toLowerCase().includes(q))
          : false;
        // 본문 검색은 하지 않는다 — 목록에 본문이 없다. 제목·요약·태그·팁으로 찾는다.
        return titleMatch || sourceMatch || tagMatch || summaryMatch || insightMatch;
      });
    }

    // 💡 3중 정밀 데두플리케이션: 동일/유사 제목 및 ID/URL 기준 중복 카드 렌더링 100% 원천 차단
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const uniqueList: NewsArticle[] = [];

    for (const a of list) {
      const normTitle = a.title
        .replace(/\s*소식\s*및\s*기술\s*리포트\s*/g, '')
        .replace(/[\s\W_]+/g, '')
        .toLowerCase();

      const cleanUrl = (a.source_url || '').split('?')[0].replace(/\/$/, '');

      if (!seenTitles.has(normTitle) && !seenIds.has(a.id) && (!cleanUrl || !seenIds.has(cleanUrl))) {
        seenTitles.add(normTitle);
        seenIds.add(a.id);
        if (cleanUrl) seenIds.add(cleanUrl);
        uniqueList.push(a);
      }
    }

    return uniqueList;
  }, [newsData, searchQuery, activeLens]);

  // 날짜 포맷팅 함수
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHrs = Math.round(diffMins / 60);
      const diffDays = Math.round(diffHrs / 24);

      if (language !== 'ko') {
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return `${diffDays}d ago`;
      }

      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHrs < 24) return `${diffHrs}시간 전`;
      return `${diffDays}일 전`;
    } catch {
      return dateString;
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 90) return 'text-danger bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    if (score >= 70) return 'text-warn bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
  };

  // 기사 클릭 시 독립 블로그 상세 페이지로 화면 전환 이동
  if (selectedArticle) {
    if (!fullArticle) {
      return (
        <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-label="loading">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      );
    }
    return (
      <NewsDetailView 
        article={fullArticle} 
        t={t} 
        onBack={handleBackFromDetail} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Lenses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-600" />
              {t.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t.subtitle}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {newsData && (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1 font-medium text-xs sm:text-sm">
                  <Activity className="w-4 h-4 text-blue-500" /> {filteredArticles.length} / {newsData.total_count} {t.pulses}
                </span>
                <button 
                  onClick={() => fetchNews(activeLens)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
                  disabled={loading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t.refresh}
                </button>
              </div>
            )}
          </div>
        </div>

        {latestUpdate && (
          <a
            href={`/changelog/${latestUpdate.id}?lang=${language}`}
            className="focus-ring mb-5 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm transition hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/15"
          >
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-2xs font-black text-white">
              {g.nav.whatsNew}
            </span>
            <span className="min-w-0 flex-1 truncate font-bold text-slate-800 dark:text-slate-100">
              {latestUpdate.title}
            </span>
            <span className="shrink-0 text-xs font-bold text-accent">
              {g.nav.viewUpdate} →
            </span>
          </a>
        )}

        {/* 🔍 실시간 키워드 검색바 (Real-time Article Search Bar) */}
        <div className="mb-5 relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold px-1">
              🔍 "{searchQuery}" {t.searchResultCount} ({filteredArticles.length}건)
            </div>
          )}
        </div>

        {/* Lens Tabs (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {LENSES.filter(lens => lens.id !== 'synthesized').map(lens => {
            const Icon = lens.icon;
            const isActive = activeLens === lens.id;
            const labelText = t.lenses[lens.id as keyof typeof t.lenses] || lens.label;
            return (
              <button
                key={lens.id}
                onClick={() => setActiveLens(lens.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 whitespace-nowrap min-h-[40px]
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                title={lens.desc}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {labelText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="font-bold text-gray-700 dark:text-gray-300">Loading AI Trend News...</p>
          <p className="text-xs mt-1 text-gray-400">Fetching latest RSS feeds & background cache.</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/40 text-danger p-4 rounded-xl text-center border border-red-200 dark:border-red-900">
          <p>{error}</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 p-10 rounded-xl text-center border border-gray-200 dark:border-gray-700">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{t.noArticles}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mx-auto w-full max-w-5xl">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="p-4 sm:p-6 h-full">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Thumbnail Image */}
                  {article.image_url && (
                    <div className="w-full md:w-48 h-36 sm:h-40 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-inner relative">
                      {/* 목록 이미지는 화면에 들어올 때 받는다. 예전엔 80장을 한꺼번에 요청했다(지연 로딩 0개). */}
                      <img
                        src={article.image_url}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        // 원 언론사 이미지를 직접 쓴다. 리퍼러를 보내지 않아야 핫링크 차단에 덜 걸린다.
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // 래퍼까지 숨기지 않으면 bg-slate-900 빈 박스가 남는다
                          const wrapper = (e.target as HTMLElement).parentElement;
                          if (wrapper) wrapper.style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-2 left-2 text-2xs font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                        {article.category}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                      {article.is_synthesized && (
                        <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-md flex items-center gap-1">
                          🔮 {article.multi_sources ? `${article.multi_sources.length}개 출처 융합` : '다중 소스 융합'}
                        </span>
                      )}
                      {isRecentArticle(article.published_at, article.is_new) && (
                        <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md animate-pulse flex items-center gap-1">
                          ⚡ NEW
                        </span>
                      )}
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-700/80 dark:text-slate-200">
                        🏢 {article.source_name}
                      </span>
                      {article.multi_sources && article.multi_sources.map((src, idx) => (
                        <a 
                          key={idx} 
                          href={src.url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-0.5 text-2xs font-bold rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:underline flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                        >
                          🔗 {src.name}
                        </a>
                      ))}
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getImpactColor(article.impact_score)}`}>
                        🔥 Impact: {article.impact_score}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1 font-medium ml-auto sm:ml-0">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(article.published_at)}
                      </span>
                    </div>
                    
                    <h3 
                      onClick={() => handleSelectArticle(article)}
                      className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 group/title"
                    >
                      <span>{formatArticleTitle(article.title)}</span>
                    </h3>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.map(tag => (
                          <span key={tag} className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-md flex items-center gap-0.5">
                            <Hash className="w-3 h-3" /> {tag.replace('#', '')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Summary Bullets (Click to open modal) */}
                    <div 
                      onClick={() => handleSelectArticle(article)}
                      className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group/summary"
                    >
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 group-hover/summary:text-blue-600 transition-colors">
                        <Activity className="w-4 h-4 text-green-500" /> {t.factTitle}
                      </h4>
                      <ul className="space-y-2">
                        {article.summary_bullets.map((bullet, idx) => {
                          const cleanBullet = formatTranslatedText(bullet);

                          return (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2 leading-relaxed">
                              <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                              <span>{cleanBullet}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Actionable Insight (실전 팁) */}
                    {(() => {
                      // 직군 렌즈(개발·기획·비즈니스·연구)면 그 직군 팁만, 그 밖의 렌즈(전체·최신 속보·
                      // Agent)는 전부 보여준다. 예전에는 "전체" 이외의 비직군 렌즈에서 어느 팁도 조건에
                      // 걸리지 않아 상자 제목만 빈 채로 떴다(2026-08-04 도입부터).
                      const ai = article.actionable_insight;
                      if (!ai) return null;
                      const ROLES = [
                        ['developer', t.devLabel, ai.developer],
                        ['pm', t.pmLabel, ai.pm],
                        ['business', t.bizLabel, ai.business],
                        ['researcher', t.resLabel, ai.researcher],
                      ] as const;
                      const roleLens = ROLES.some(([k]) => k === activeLens) ? activeLens : null;
                      const tips = ROLES.filter(([k, , text]) => text && (!roleLens || k === roleLens));
                      if (!tips.length) return null;   // 보일 팁이 없으면 상자도 그리지 않는다
                      return (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            {t.insightTitle}
                          </h4>
                          <div className="space-y-3">
                            {tips.map(([k, label, text]) => (
                              <div key={k} className="text-sm">
                                <span className="font-semibold text-blue-700 dark:text-blue-400 mr-2">{label}</span>
                                <span className="text-gray-700 dark:text-gray-300">{text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

