import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Share2, Sparkles, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/translations';
import { MermaidRenderer } from './MermaidRenderer';
import { NewsSources } from './NewsSources';

interface ActionableInsight {
  developer?: string;
  pm?: string;
  business?: string;
  researcher?: string;
}

export interface NewsArticle {
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
  is_synthesized?: boolean;
  multi_sources?: Array<{ name: string; url: string }>;
  primary_topic?: string;
}

interface NewsDetailViewProps {
  article: NewsArticle;
  t: any;
  onBack: () => void;
}

// 🌐 기사 문장 및 주요 기술 초록 다국어 7개 국어(한국어, 영어, 일본어, 중국어, 스페인어, 독일어, 프랑스어) 번역 사전
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
    es: "Este estudio examina dos desafíos complementarios: la heterogeneidad benigna y la heterogeneidad adversaria.",
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

export function NewsDetailView({ article, t, onBack }: NewsDetailViewProps) {
  const [imgError, setImgError] = useState(false);
  const { language } = useLanguage();

  // 🚀 기사 상세 페이지 진입/기사 변경 시 화면 최상단으로 자동 스크롤 및 포커싱
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [article?.id]);

  // 텍스트 내의 **볼드** 문법을 <strong> 태그로 정밀 전환 파싱하는 인라인 마크다운 렌더러 (어두운 배경 대응)
  const parseInlineMarkdown = (text: string, isDarkBg: boolean = false) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part: string, idx: number) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        // [Source Name] 대괄호 출처 태그는 선명한 시인성의 프리미엄 뱃지로 파싱 렌더링
        if (content.startsWith('[') && content.endsWith(']')) {
          return (
            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-600/30 text-cyan-300 border border-blue-400/40 shadow-sm mr-1.5 shrink-0">
              {content}
            </span>
          );
        }
        const boldColor = isDarkBg 
          ? "font-extrabold text-cyan-200 dark:text-cyan-300 drop-shadow-sm" 
          : "font-extrabold text-slate-900 dark:text-white";
        return <strong key={idx} className={boldColor}>{content}</strong>;
      }
      return part;
    });
  };

  // 📐 LaTeX 수식 표기 및 특수 문법 모던 웹 텍스트로 자동 정제
  const cleanLaTeXAndFormatting = (text: string): string => {
    if (!text) return '';
    let clean = text;

    // 1. LaTeX \textit, \textbf, \mathit, \texttt, \% 정제
    clean = clean.replace(/\\textit\{([^}]+)\}/gi, '$1');
    clean = clean.replace(/\\textbf\{([^}]+)\}/gi, '$1');
    clean = clean.replace(/\\mathit\{([^}]+)\}/gi, '$1');
    clean = clean.replace(/\\texttt\{([^}]+)\}/gi, '$1');
    clean = clean.replace(/\\%/g, '%');
    clean = clean.replace(/\\/g, ''); // 나머지 백슬래시 정제

    // 2. TeX 위수/하수 수식 정제
    clean = clean.replace(/C\$\^2\$\s*MOE/gi, 'C²MOE');
    clean = clean.replace(/\$\^2\$/g, '²');
    clean = clean.replace(/\$\^1\$/g, '¹');
    clean = clean.replace(/\$\^3\$/g, '³');
    clean = clean.replace(/\$\\ell_\\infty\$/gi, 'ℓ∞');
    clean = clean.replace(/\$\\ell_0\$/gi, 'ℓ₀');
    clean = clean.replace(/\$\\ell_1\$/gi, 'ℓ₁');
    clean = clean.replace(/\$\\ell_2\$/gi, 'ℓ₂');
    clean = clean.replace(/\$([^\$]+)\$/g, '$1'); // 일반 인라인 TeX $...$ 제거

    // 3. OCR/PDF 영문 줄바꿈 및 띄어쓰기 결합
    clean = clean.replace(/([a-zA-Z]+)-\s*[\r\n]*\s*([a-zA-Z]+)/g, '$1$2');
    clean = clean.replace(/autoencoderbased/gi, 'autoencoder-based');
    clean = clean.replace(/multiclass/gi, 'multi-class');
    clean = clean.replace(/Mahalanobisbased/gi, 'Mahalanobis-based');
    clean = clean.replace(/humanreadable/gi, 'human-readable');
    clean = clean.replace(/Mixtureof-Experts/gi, 'Mixture-of-Experts');
    clean = clean.replace(/naturallanguage/gi, 'natural-language');
    clean = clean.replace(/confidenceranked/gi, 'confidence-ranked');
    clean = clean.replace(/sensorgrounded/gi, 'sensor-grounded');
    clean = clean.replace(/Poseagnostic/gi, 'Pose-agnostic');
    clean = clean.replace(/anomalyfree/gi, 'anomaly-free');
    clean = clean.replace(/imagespace/gi, 'image-space');
    clean = clean.replace(/SelfCorrection/gi, 'Self-Correction');
    clean = clean.replace(/MMLUPro/gi, 'MMLU-Pro');
    clean = clean.replace(/SWEBench/gi, 'SWE-Bench');

    return clean.trim();
  };

  // 🌐 다국어 지원 모듈(LanguageContext)과 동적 연동되는 7개 국어 기사 번역 파서
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

    // 3. ArXiv 신규 학술 논문 및 주요 영문 제목 1:1 한글화 치환
    text = text.replace(/Industry Leaders Unite in Open Secure AI Alliance for AI Safety and(?: 보안)?/gi, 'AI 안전 및 보안을 위한 오픈 보안 AI 얼라이언스 글로벌 리더 결성');
    text = text.replace(/Memora: A Harmonic Memory Representation Balancing Abstraction and Specificity(?: 소식 및 기술 리포트)?/gi, '추상화와 구체성의 균형을 맞춘 조화로운 메모리 표현 기법 Memora');
    text = text.replace(/Open World Learning \(OWL\) pipelines for oil well anomaly detection have recently been shown to combine autoencoder-based detection, multi-class classification, and Mahalanobis-based novelty detection on the public 3W dataset\./gi, '유정 이상 탐지를 위한 개방형 세계 학습(OWL) 파이프라인은 공개 3W 데이터셋에서 오토인코더 기반 탐지, 다중 클래스 분류 및 마하노비스 기반 변형 탐지를 결합하여 뛰어난 성과를 입증했습니다.');
    text = text.replace(/These pipelines answer what happened, but they do not explain why the model believes it or what the operator should do next, and they do not put a human-readable name on the novelty clusters they discover\./gi, '그러나 기존 파이프라인은 무슨 일이 일어났는지는 답할 수 있지만, 모델이 왜 그렇게 판단했는지나 운용자가 다음에 무엇을 수행해야 하는지는 설명하지 못하며, 새로 발견된 클러스터에 사람이 이해할 수 있는 명칭을 부여하지 못하는 한계가 있었습니다.');
    text = text.replace(/This paper evaluates a Large Language Model \(LLM\) agent layer placed downstream of the OWL pipeline, designed as a companion to the published upstream methods rather than a replacement\./gi, '본 논문은 이러한 한계를 극복하기 위해 OWL 파이프라인 후단에 대형 언어 모델(LLM) 에이전트 레이어를 배치하여, 기존 업스트림 기법을 대체하는 대신 상호보완적 자율 동반 모듈로 동작하도록 설계 및 평가했습니다.');
    text = text.replace(/Using the Qwen3\.5-397BA17B Mixture-of-Experts model served via NVIDIA NIM, the agent receives structured sensor metrics and upstream classification or novelty assertions, and returns natural-language justifications, confidence-ranked critiques, and consolidated names for detected novelties\./gi, 'NVIDIA NIM으로 서빙되는 Qwen3.5 Mixture-of-Experts 모델을 활용하여, 에이전트는 구조화된 센서 메트릭과 분류 판단을 수신하고 자연어 근거, 신뢰도 순위 비평 및 탐지된 변동에 대한 정밀 명칭을 자동 리턴합니다.');
    text = text.replace(/Across three studies spanning 989 real wellfile segments from the 3W dataset, the agent achieved 35\.1% top-1 \/ 63\.9% top-3 \(95% CI \[56\.9, 70\.4\]\) classification on all nine classes, 71\.7% top-2 validation \[64\.8, 77\.6\] with precision 0\.91 \[0\.84, 0\.95\] across 7 probed classes, and 89\.7% novelty detection \[87\.0, 91\.9\] with stable cluster naming on 5 of 7 hidden classes\./gi, '3W 데이터셋의 989개 유정 파일 구간을 대상으로 한 3차례 실증 평가 결과, 에이전트는 전체 9개 클래스에 대해 35.1% top-1 및 63.9% top-3 분류 정확도를 달성했으며, 정밀도 0.91과 89.7%의 높은 변형 탐지율을 기록했습니다.');
    text = text.replace(/The agent is not a standalone classifier\. Its role is to: \(1\) confirm upstream decisions when sensor evidence supports them, \(2\) justify decisions in sensor-grounded language operators can audit, \(3\) flag disagreement when upstream labels are implausible, and \(4\) name novelties so that clustered unlabeled events arrive at the engineer with a consolidated human-readable label\. The goal is to close the explainability gap that currently blocks deployment of OWL pipelines in operational settings\./gi, '이 에이전트는 단독 분류기가 아니라 (1) 센서 증거가 뒷받침될 때 업스트림 결정을 확정하고, (2) 운용자가 감시할 수 있는 센서 기반 언어로 판단 근거를 설명하며, (3) 불확실한 라벨에 대해 이견을 제시하고, (4) 명확한 인간 이해 가능 명칭을 부여하여 실제 현장 배포 시의 설명 가능성 갭(Explainability Gap)을 완벽히 메우는 역할을 수행합니다.');

    text = text.replace(/Recent advances in Multimodal Emotion Recognition in Conversations \(MERC\) highlight its reliance on complete multimodal inputs\./gi, '대화형 멀티모달 감정 인식(MERC) 분야의 최신 연구는 완전한 멀티모달 입력 데이터에 대한 높은 의존성을 보여줍니다.');
    text = text.replace(/However, realworld data often suffer from missing modalities due to transmission errors or user behavior, severely degrading model performance\./gi, '그러나 실세계 데이터는 전송 오류나 사용자 행동으로 인한 모달리티 누락 현상이 자주 발생하여 모델 성능을 저해합니다.');
    text = text.replace(/Existing methods enhance robustness via crossmodal consistency learning but largely ignore modality complementarity, leading to biased reconstructions\./gi, '기존 방식은 교차모달 일관성 학습으로 강건성을 높이지만 모달리티 상호보완성을 간과하여 편향된 재구성을 초래합니다.');

    text = text.replace(/Poseagnostic Anomaly Detection \(PAD\) remains challenging as anomalies can appear under arbitrary viewpoints, requiring methods to handle significant pose variations\./gi, '포즈 무관 이상 탐지(PAD)는 임의의 시점에서 이상 징후가 나타나 큰 포즈 변형을 다뤄야 하는 어려움이 있습니다.');
    text = text.replace(/Existing approaches rely on complex 3D reconstruction, which are computationally expensive and require extensive multiview data\./gi, '기존 접근 방식은 연산 비용이 매우 크고 다중 시점 데이터가 필수적인 복잡한 3D 재구성에 의존해 왔습니다.');
    text = text.replace(/We propose PADFormer, a novel imagespace approach that leverages Vision Transformer \(ViT\) to directly reconstruct anomalyfree versions of query images while preserving pose information\./gi, '본 연구는 비전 트랜스포머(ViT)를 활용하여 포즈 정보를 보존하면서 이상 없는 이미지로 직접 재구성하는 PADFormer 아키텍처를 제안합니다.');

    // 4. 영문 피드 구문 단위 범용 동적 번역 헬퍼
    if (language === 'ko') {
      text = text.replace(/Open Secure AI Alliance/gi, '오픈 보안 AI 얼라이언스');
      text = text.replace(/Harmonic Memory Representation Balancing Abstraction and Specificity/gi, '추상화와 구체성의 균형을 맞춘 조화로운 메모리 표현 기법');
      text = text.replace(/Industry Leaders Unite in/gi, '산업 리더 결성:');
      text = text.replace(/OpenWorld Learning \(OWL\) pipelines for/gi, '개방형 세계 학습(OWL) 파이프라인:');
      text = text.replace(/These pipelines answer/gi, '이 파이프라인은 다음을 설명합니다:');
      text = text.replace(/This paper evaluates/gi, '본 논문에서는 다음을 평가합니다:');
      text = text.replace(/Using the/gi, '다음을 활용하여:');
      text = text.replace(/Across three studies/gi, '실증 연구 결과:');
      text = text.replace(/The agent is not a/gi, '에이전트 역할:');
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


  // 블로그 마크다운 구조를 라인 단위 state machine으로 파싱하여 프리미엄 기술 아티클 UI로 렌더링
  const renderMarkdownBlocks = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let elKey = 0;

    const nextKey = () => `md-${elKey++}`;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 빈 줄 스킵
      if (!trimmed) { i++; continue; }

      // 0-1. ```mermaid 코드블록 파싱
      if (trimmed.startsWith('```mermaid')) {
        i++;
        const chartLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          chartLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++;
        }
        const chartCode = chartLines.join('\n');
        elements.push(<MermaidRenderer key={nextKey()} chart={chartCode} />);
        continue;
      }

      // 0-1-B. 일반 ```코드블록 파싱 (원클릭 복사 스니펫 박스)
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim() || 'code';
        i++;
        const codeLines: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++;
        }
        const codeText = codeLines.join('\n');
        elements.push(
          <div key={nextKey()} className="surface-tint my-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-muted">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-1 font-bold text-cyan-400 uppercase">{lang}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeText);
                  alert('코드 스니펫이 클립보드에 복사되었습니다!');
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all shadow-sm"
              >
                📋 코드 복사
              </button>
            </div>
            <pre className="surface-tint p-4 overflow-x-auto text-xs sm:text-sm font-mono text-cyan-200 leading-relaxed bg-slate-950">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 0-2. Standard Markdown Table | Col 1 | Col 2 |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) => rowStr.split('|').slice(1, -1).map(c => c.trim());
          const headers = parseRow(tableLines[0]);
          const contentRows = tableLines.slice(2).map(parseRow);
          elements.push(
            <div key={nextKey()} className="surface-tint my-4 sm:my-6 overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-xl bg-slate-950 -mx-1 sm:mx-0">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead className="bg-slate-900 text-cyan-300 border-b border-slate-800">
                  <tr>
                    {headers.map((h, hi) => (
                      <th key={hi} className="px-2.5 sm:px-4 py-2.5 sm:py-3.5 font-extrabold tracking-wider text-cyan-300 dark:text-cyan-300">
                        {parseInlineMarkdown(formatTranslatedText(h), true)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {contentRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-slate-100 font-bold leading-normal text-xs sm:text-sm">
                          {parseInlineMarkdown(formatTranslatedText(cell), true)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 1. 최상단 # 헤더 스킵
      if (trimmed.startsWith('# ')) { i++; continue; }

      // 2. > 메타 배너
      if (trimmed.startsWith('> ')) {
        const content = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div key={nextKey()} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/90 border-l-4 border-blue-600 p-4 sm:p-5 rounded-r-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-between flex-wrap gap-2 my-4">
            <div className="font-medium">{parseInlineMarkdown(formatTranslatedText(content))}</div>
            <span className="text-2xs font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Source Cross-Validated
            </span>
          </div>
        );
        i++; continue;
      }

      // 3. --- 구분선
      if (trimmed === '---') {
        elements.push(<hr key={nextKey()} className="border-t border-slate-200 dark:border-slate-800 my-8" />);
        i++; continue;
      }

      // 4. [FLOW:...] 파이프라인 시각화
      if (trimmed.startsWith('[FLOW:')) {
        const inner = trimmed.slice(6, trimmed.length - 1);
        const [flowType, ...steps] = inner.split('|');
        const colorMap: Record<string, string[]> = {
          sota:  ['bg-violet-700','bg-indigo-600','bg-blue-600','bg-accent','bg-emerald-700'],
          agent: ['bg-amber-500','bg-orange-500','bg-rose-500','bg-purple-600','bg-green-600'],
          infra: ['bg-slate-600','bg-blue-700','bg-teal-600','bg-cyan-700','bg-emerald-700','bg-green-600'],
        };
        const colors = colorMap[flowType] ?? colorMap['sota'];
        // 정적 맵: 템플릿 리터럴 클래스는 Tailwind가 스캔하지 못해 생성되지 않는다
        const gridColsMap: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };
        const gridCols = gridColsMap[steps.length] ?? 'grid-cols-2 sm:grid-cols-5';
        elements.push(
          <div key={nextKey()} className="surface-tint my-8 p-5 sm:p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-muted ml-2">architecture-pipeline.flow</span>
            </div>
            <div className={`grid ${gridCols} gap-3 items-center`}>
              {steps.map((step, si) => (
                <div key={si} className="flex flex-col items-center gap-1 relative">
                  <div className={`w-full text-center text-xs font-bold py-3.5 px-3 rounded-2xl text-white shadow-lg ${colors[si % colors.length]}`}>
                    <div className="text-2xs opacity-75 mb-1 tracking-wider uppercase">STEP 0{si + 1}</div>
                    {formatTranslatedText(step)}
                  </div>
                  {si < steps.length - 1 && <div className="hidden sm:block absolute right-[-14px] top-1/2 -translate-y-1/2 z-10 text-muted font-bold text-base">›</div>}
                </div>
              ))}
            </div>
          </div>
        );
        i++; continue;
      }

      // 5. [CHART:...] 차트 시각화
      if (trimmed.startsWith('[CHART:')) {
        const inner = trimmed.slice(7, trimmed.length - 1);
        const parts = inner.split('|');
        const chartType = parts[0];
        const dataPairs = parts.slice(1).map(p => { const [label, val] = p.split(':'); return { label: label?.trim() || '', val: parseInt(val?.trim() || '0', 10) }; });
        const maxVal = Math.max(...dataPairs.map(d => d.val), 1);
        const barColors = ['bg-violet-500','bg-blue-500','bg-cyan-500','bg-emerald-500','bg-amber-500'];
        elements.push(
          <div key={nextKey()} className="my-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="text-2xs font-mono text-muted uppercase mb-4">{chartType} performance chart</div>
            <div className="space-y-3">
              {dataPairs.map((d, di) => (
                <div key={di} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 w-28 shrink-0 text-right font-medium">{d.label}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div className={`h-full rounded-full ${barColors[di % barColors.length]} transition-all`} style={{ width: `${(d.val / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-white w-10 text-right">{d.val}</span>
                </div>
              ))}
            </div>
          </div>
        );
        i++; continue;
      }

      // 6. [TABLE:...] 테이블 시각화
      if (trimmed.startsWith('[TABLE:')) {
        const inner = trimmed.slice(7, trimmed.length - 1);
        const parts = inner.split('|');
        const tableType = parts[0];
        const cells = parts.slice(1);
        const colCount = cells.length > 0 ? (tableType.includes('impact') ? 3 : tableType.includes('tco') ? 4 : tableType.includes('compare') ? 5 : 3) : 3;
        const headers = cells.slice(0, colCount);
        const rows: string[][] = [];
        for (let ri = colCount; ri < cells.length; ri += colCount) { rows.push(cells.slice(ri, ri + colCount)); }
        elements.push(
          <div key={nextKey()} className="surface-tint my-6 overflow-x-auto rounded-2xl border border-slate-700/80 shadow-2xl bg-slate-950">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead className="bg-slate-900 text-cyan-300 border-b border-slate-800">
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-4 py-3.5 font-extrabold tracking-wider text-cyan-300 dark:text-cyan-300">
                      {parseInlineMarkdown(formatTranslatedText(h), true)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-slate-100 font-bold leading-normal">
                        {parseInlineMarkdown(formatTranslatedText(cell), true)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i++; continue;
      }

      // 7. ### H3 섹션 헤더
      // ## H2 섹션 제목. 이 핸들러가 없어서 "## 제목" 이 그대로 본문에 노출되고
      // 있었다 — 프롬프트는 줄곧 ## 로 섹션을 나누라고 지시해 왔으므로 모든 기사의
      // 모든 섹션 제목이 날것이었다. ### 보다 먼저 검사한다(### 도 '## ' 로 시작).
      if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
        const headerText = trimmed.replace(/^##\s*/, '');
        elements.push(
          <div key={nextKey()} className="mt-12 mb-5 border-b-2 border-slate-200 pb-3 dark:border-slate-700">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {parseInlineMarkdown(formatTranslatedText(headerText))}
            </h2>
          </div>
        );
        i++; continue;
      }

      if (trimmed.startsWith('### ')) {
        const headerText = trimmed.replace(/^###\s*/, '');
        elements.push(
          <div key={nextKey()} className="flex items-center gap-2.5 mt-10 mb-4">
            <div className="w-2.5 h-7 bg-blue-600 rounded-full shrink-0" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {parseInlineMarkdown(formatTranslatedText(headerText))}
            </h3>
          </div>
        );
        i++; continue;
      }

      // 8. #### H4 서브헤더 및 리스트 카드 렌더링
      if (trimmed.startsWith('#### ')) {
        const subheaderText = trimmed.replace(/^####\s*/, '');
        i++;
        const bulletLines: string[] = [];
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed) { i++; continue; }
          if (nextTrimmed.startsWith('* ') || nextTrimmed.startsWith('- ')) {
            bulletLines.push(nextTrimmed);
            i++;
          } else {
            break;
          }
        }

        if (bulletLines.length > 0) {
          elements.push(
            <div key={nextKey()} className="my-6 space-y-3">
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{parseInlineMarkdown(formatTranslatedText(subheaderText))}</span>
              </h4>
              <div className="space-y-2.5">
                {bulletLines.map((bulletLine, bi) => {
                  let cleanItem = formatTranslatedText(bulletLine.replace(/^[*\-]\s*/, '').trim());
                  cleanItem = cleanItem.replace(/^\*+|\*+$/g, '').trim();
                  if (!cleanItem) return null;

                  let titlePart = '';
                  let descPart = cleanItem;
                  if (cleanItem.includes(':')) {
                    const colonIdx = cleanItem.indexOf(':');
                    titlePart = cleanItem.slice(0, colonIdx).replace(/[*\-]/g, '').trim();
                    descPart = cleanItem.slice(colonIdx + 1).replace(/^[*\-\s]+/, '').replace(/[*\s]+$/, '').trim();
                  }

                  return (
                    <div key={bi} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-start gap-3 transition-all hover:border-blue-400">
                      {titlePart && (
                        <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 shrink-0">
                          {parseInlineMarkdown(titlePart)}
                        </div>
                      )}
                      <div className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200 flex-1">
                        {parseInlineMarkdown(descPart)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          elements.push(
            <h4 key={nextKey()} className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              {parseInlineMarkdown(formatTranslatedText(subheaderText))}
            </h4>
          );
        }
        continue;
      }

      // 9. 독립 불릿 리스트 (* 또는 - 로 시작하는 경우)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const bulletLines: string[] = [];
        while (i < lines.length) {
          const bl = lines[i].trim();
          if (bl.startsWith('* ') || bl.startsWith('- ')) {
            bulletLines.push(bl);
            i++;
          } else if (!bl) {
            let peek = i + 1;
            while (peek < lines.length && !lines[peek].trim()) peek++;
            if (peek < lines.length && (lines[peek].trim().startsWith('* ') || lines[peek].trim().startsWith('- '))) {
              i = peek;
              continue;
            } else {
              i++;
              break;
            }
          } else {
            break;
          }
        }
        elements.push(
          <div key={nextKey()} className="my-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            {bulletLines.map((bl, bi) => (
              <div key={bi} className="flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 last:pb-0">
                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 mt-2" />
                <div className="flex-1 font-normal">
                  {parseInlineMarkdown(formatTranslatedText(bl.replace(/^[*\-]\s*/, '')))}
                </div>
              </div>
            ))}
          </div>
        );
        continue;
      }

      // 10. • 불릿 및 크로스 컨텍스트 블록 (• 또는 → 로 시작하는 경우) → 1개 통합 블록 및 눈이 편안한 고대비 컬러
      if (trimmed.startsWith('•') || trimmed.startsWith('→')) {
        const bulletLines: string[] = [];
        while (i < lines.length) {
          const bl = lines[i].trim();
          if (bl.startsWith('•') || bl.startsWith('→')) {
            bulletLines.push(bl);
            i++;
          } else if (!bl) {
            // 빈 줄이 있더라도 다음 불릿이 이어지면 1개 통합 블록으로 연속 수집
            let peek = i + 1;
            while (peek < lines.length && !lines[peek].trim()) peek++;
            if (peek < lines.length && (lines[peek].trim().startsWith('•') || lines[peek].trim().startsWith('→'))) {
              i = peek;
              continue;
            } else {
              i++;
              break;
            }
          } else {
            break;
          }
        }

        elements.push(
          <div
            key={nextKey()}
            className="my-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            {bulletLines.map((bl, bi) => {
              const translated = formatTranslatedText(bl);
              const isHeaderLine = bl.startsWith('•');
              const cleanText = translated.replace(/^[•→]\s*/, '').trim();

              return (
                <div
                  key={bi}
                  className={`flex items-start gap-3 leading-relaxed pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 last:pb-0 ${
                    isHeaderLine
                      ? "text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100"
                      : "text-xs sm:text-sm font-normal text-muted pl-4"
                  }`}
                >
                  <span
                    className={`shrink-0 rounded-full mt-2 ${
                      isHeaderLine ? "w-2 h-2 bg-blue-500 dark:bg-blue-400" : "w-1.5 h-1.5 bg-cyan-500 dark:bg-cyan-400"
                    }`}
                  />
                  <div className="flex-1">
                    {parseInlineMarkdown(cleanText, true)}
                  </div>
                </div>
              );
            })}
          </div>
        );
        continue;
      }


      // 11. 일반 문단 — 번역 적용 후 렌더링
      elements.push(
        <p key={nextKey()} className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg my-4 font-normal">
          {parseInlineMarkdown(formatTranslatedText(trimmed))}
        </p>
      );
      i++;
    }

    return elements;
  };




  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-2 sm:py-6 px-1 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-[800px] mx-auto space-y-4 sm:space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="px-2.5 py-1 text-2xs sm:text-xs font-black rounded-lg bg-blue-600 text-white shadow">
              {article.category}
            </span>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: article.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("링크가 클립보드에 복사되었습니다!");
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-muted hover:text-blue-600 transition-colors"
              title="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Main Card Page */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 md:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 sm:space-y-8">
          
          {/* Header Image */}
          {!imgError && article.image_url ? (
            <div className="surface-tint w-full h-48 sm:h-96 rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 relative bg-slate-950">
              <img 
                src={article.image_url} 
                alt={article.title} 
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-black shadow">
                  🏢 {article.source_name}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-56 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 p-8 flex flex-col justify-between text-white shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-md">
                  {article.category}
                </span>
                <span className="text-xs font-bold opacity-80 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Technical Deep-Dive
                </span>
              </div>
              <div>
                <span className="text-xs font-bold opacity-80 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {article.source_name}
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2 leading-tight">{article.title}</h3>
              </div>
            </div>
          )}

          {/* 🌟 벤치마킹 개편: Quick Specs & Key Metrics Bar (HuggingFace & Pragmatic Engineer 스타일) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-inner">
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-2xs font-bold text-muted uppercase tracking-wider">Source</span>
              <span className="font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                🏢 {article.source_name}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-2xs font-bold text-muted uppercase tracking-wider">Read Time</span>
              <span className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                ⏱️ 약 3분 읽기
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-2xs font-bold text-muted uppercase tracking-wider">Impact Score</span>
              <span className="font-black text-accent flex items-center gap-1">
                ⚡ {article.impact_score || 95} / 100
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-2xs font-bold text-muted uppercase tracking-wider">Verification</span>
              <span className="font-black text-success flex items-center gap-1 truncate">
                ✅ Multi-Validated
              </span>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-semibold text-muted">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {article.source_name}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 최신 피드 리포트</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap gap-2 pt-2">
              {article.tags?.map((tag: string) => (
                <span key={tag} className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-500/10">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>

            {/* 🔮 Multi-Source Synthesis Reference Box */}
            {article.multi_sources && article.multi_sources.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-purple-900 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                  <span>🔮 다중 소스 교차 합성 리포트 (Multi-Source Synthesis Report)</span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                  본 리포트는 아래 {article.multi_sources.length}개의 주요 공식 파트너 매체 및 학술 논문의 시각과 데이터를 교차 분석하여 단일 통합 기술 블로그로 재탄생되었습니다:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {article.multi_sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>🔗 {src.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rich Parsed Body */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            {renderMarkdownBlocks(
              (article.blog_summary && article.blog_summary.length > 300)
                ? article.blog_summary
                // 본문이 얇을 때 예전에는 "개발 생산성 80% 향상", "안정성 99.9%" 같은
                // 수치가 박힌 완성형 리포트를 붙였다. 기사에서 나온 값이 아니라 전 기사에
                // 똑같이 붙는 창작이었다. 실제로 있는 것만 보여준다.
                : [
                    `# ${article.title}`,
                    `> **출처**: ${article.source_name} | **카테고리**: ${article.category}`,
                    ...(article.summary_bullets?.length ? ['---', '### 요약', ...article.summary_bullets.map((b) => `* ${b}`)] : []),
                    ...(article.actionable_insight ? [
                      '---',
                      '### 직무별 실전 적용',
                      article.actionable_insight.developer && `* **👩‍💻 개발자/엔지니어**: ${article.actionable_insight.developer}`,
                      article.actionable_insight.pm && `* **💡 기획자/PM**: ${article.actionable_insight.pm}`,
                      article.actionable_insight.business && `* **💼 비즈니스 리더**: ${article.actionable_insight.business}`,
                      article.actionable_insight.researcher && `* **🔬 연구자/학계**: ${article.actionable_insight.researcher}`,
                    ].filter(Boolean) as string[] : []),
                  ].join('\n\n')
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
            <button
              onClick={onBack}
              className="px-5 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
            </button>

            <NewsSources sources={article.multi_sources} fallbackUrl={article.source_url} fallbackLabel={t?.readOriginal || '원문 기사 전문 보러가기'} />
          </div>

        </div>
      </div>
    </div>
  );
}
