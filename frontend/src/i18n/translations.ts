export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'de' | 'fr';

export interface TranslationDictionary {
  nav: {
    brandSubtitle: string;
    catalog: string;
    compare: string;
    tco: string;
    advisor: string;
    tutorial: string;
    news: string;
    leaderboard: string;
    gpus: string;
    sandbox: string;
    speed: string;
    groupCatalog: string;
    groupTools: string;
    groupInsights: string;
    compareBasket: string;
    collapseMenu: string;
    errorTitle: string;
    errorCatalog: string;
    retry: string;
    loadingView: string;
    updates: string;
    whatsNew: string;
    viewUpdate: string;
  };
  viewMode: {
    grid: string;
    table: string;
    compact: string;
  };
  quota: {
    title: string;
    rpm: string;
    tpm: string;
    rpd: string;
    concurrency: string;
  };
  researchProgress: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allProviders: string;
    allTiers: string;
    allLicenses: string;
    modelsFound: string;
    openWeight: string;
    proprietary: string;
    contextWindow: string;
    inputPrice: string;
    outputPrice: string;
    compareButton: string;
    compared: string;
    officialDocs: string;
    arenaElo: string;
    apiCode: string;
    specialFilters: string;
    filterNew: string;
    filterReasoning: string;
    filterWebSearch: string;
    filterLitellm: string;
    densityComfortable: string;
    densityCompact: string;
    densityComfortableAria: string;
    densityCompactAria: string;
    sortBy: string;
    sortAsc: string;
    sortDesc: string;
    sortAscTitle: string;
    sortDescTitle: string;
    kpiNewDesc: string;
    kpiContextDesc: string;
    kpiValueDesc: string;
  };
  tco: {
    title: string;
    subtitle: string;
    selectModel: string;
    inputTokens: string;
    outputTokens: string;
    quantization: string;
    recommendedOption: string;
    cheapest: string;
    apiCostMonthly: string;
    cloudGpuCostMonthly: string;
    onPremCostMonthly: string;
    powerCostEst: string;
    chartTitle: string;
    breakEvenPoint: string;
    breakEvenDesc: string;
    step1Provider: string;
    step2Model: string;
    modelsFound: string;
    vramNeeded: string;
    modelWeights: string;
    recommendedGpu: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    tabArenaElo: string;
    tabSweBench: string;
    tabMmluPro: string;
    tabGpqa: string;
    rank: string;
    model: string;
    provider: string;
    tier: string;
    score: string;
    scrollHint: string;
    tableCaption: string;
  };
  advisorModal: {
    moreTitle: string;
    moreNotice: string;
    rankSuffix: string;
    liveGenerate: string;
    scMedTitle: string;
    scMedDesc: string;
    scFinTitle: string;
    scFinDesc: string;
    scLawTitle: string;
    scLawDesc: string;
    scGameTitle: string;
    scGameDesc: string;
    scEcomTitle: string;
    scEcomDesc: string;
    tplCodeTitle: string;
    tplCodeDesc: string;
    tplRagTitle: string;
    tplRagDesc: string;
    tplMultiTitle: string;
    tplMultiDesc: string;
    tplTransTitle: string;
    tplTransDesc: string;
    tplContentTitle: string;
    tplContentDesc: string;
    sampleServiceName: string;
    smartRouterName: string;
    smartRouterDesc: string;
    advCost60: string;
    advP95: string;
    advCircuit: string;
    bestName: string;
    bestDesc: string;
    advTopReason: string;
    advSimple: string;
    advElo: string;
    budgetName: string;
    budgetDesc: string;
    advExtremeSave: string;
    advHighVolume: string;
    advOpenFlex: string;
    resultHeading: string;
    artifactBtn: string;
    monthlyApiCost: string;
    callsSuffix: string;
  };
  sandbox: {
    subtitle: string;
    description: string;
    promptInput: string;
    chars: string;
    approxInputTokens: string;
    approx: string;
    promptPlaceholder: string;
    loadSample: string;
    sampleRag: string;
    sampleCode: string;
    sampleExec: string;
    simSetup: string;
    outputTokens: string;
    outputTokensAria: string;
    outShort: string;
    outTypical: string;
    outLong: string;
    batchRequests: string;
    callOnce: string;
    callSuffix: string;
    totalTokensPerCall: string;
    inputLabel: string;
    outputLabel: string;
    monthlyTrafficTokens: string;
    tableTitle: string;
    tableDesc: string;
    searchPlaceholder: string;
    tierFilterAria: string;
    allTiers: string;
    colModel: string;
    colTier: string;
    colInput1M: string;
    colOutput1M: string;
    colPerCall: string;
    colMonthly: string;
    colCompare: string;
    openWeight: string;
    proprietary: string;
    comparing: string;
    addCompare: string;
  };
  speed: {
    badge: string;
    subtitle: string;
    description: string;
    targetModel: string;
    asOf: string;
    source: string;
    providerCount: string;
    metricOutput: string;
    metricInput: string;
    metricUptime: string;
    unitPer1M: string;
    chartTitle: string;
    rankTitle: string;
    colQuant: string;
    colCtx: string;
    colUptime: string;
    cheapest: string;
    speedNote: string;
    loading: string;
    empty: string;
    unknown: string;
  };
  compare: {
    emptyTitle: string;
    emptyDesc: string;
    tableAria: string;
  };
  gpu: {
    title: string;
    subtitle: string;
    tabAll: string;
    tabEnterprise: string;
    tabProsumer: string;
    tabConsumer: string;
    groupEnterprise: string;
    groupProsumer: string;
    groupConsumer: string;
    perfBandwidth: string;
    perfFp16: string;
    perfInt8: string;
    cudaCores: string;
    tensorCores: string;
    noCloud: string;
    recommendedUse: string;
    maxVram: string;
    topFp16: string;
    topInt8: string;
    vram: string;
    bandwidth: string;
    purchasePrice: string;
    cloudOnDemand: string;
    cloudSpot: string;
    useH200: string;
    useGH200: string;
    useH100: string;
    useL40S: string;
    useA100: string;
    useL4: string;
    useRtx6000: string;
    useA6000: string;
    useRtx5090: string;
    useRtx4090: string;
    useRtx3090: string;
    useM4Ultra: string;
    useMi300: string;
    formPcieWorkstation: string;
    formMacStudio: string;
    nameM4Ultra: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  ko: {
    nav: {
      brandSubtitle: "전세계 AI 모델 비용 & 스펙 비교",
      catalog: "모델 카탈로그",
      compare: "모델 비교",
      tco: "API vs 셀프호스팅 TCO",
      advisor: "🏆 AI 아키텍처 추천기",
      tutorial: "🎓 튜토리얼",
      news: "📰 AI 트렌드 뉴스",
      leaderboard: "리더보드",
      gpus: "GPU 스펙 & 비용",
      sandbox: "🧮 토크나이저 샌드박스",
      speed: "⚖️ 프로바이더 비교",
      groupCatalog: "메인 카탈로그",
      groupTools: "샌드박스 & 시뮬레이터",
      groupInsights: "AI 솔루션 & 리포트",
      compareBasket: "비교함",
      collapseMenu: "메뉴 접기",
      errorTitle: "오류가 발생했습니다",
      errorCatalog: "모델 카탈로그를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      retry: "다시 시도",
      loadingView: "화면 불러오는 중",
      updates: "업데이트 노트",
      whatsNew: "새로워진 점",
      viewUpdate: "자세히 보기"
    },
    viewMode: {
      grid: "카드 뷰",
      table: "스펙 테이블",
      compact: "요약 리스트"
    },
    quota: {
      title: "API 할당량 제한 (Rate Limits)",
      rpm: "RPM (분당 요청)",
      tpm: "TPM (분당 토큰)",
      rpd: "RPD (일일 요청)",
      concurrency: "동시 요청 수"
    },
    researchProgress: {
      title: "AI 솔루션 아키텍트 실시간 심층 분석 중",
      subtitle: "고객 요구사항을 바탕으로 최적의 LLM 조합과 OpEx 호스팅 인프라 비용을 산출하고 있습니다...",
      step1: "고객 자연어 요구사항 및 워크로드 스펙 분석 (Intent & SLA)",
      step2: "50+ 글로벌 LLM 모델 데이터베이스 & Arena Elo 벤치마크 스캔",
      step3: "3가지 라우팅 모델 조합 (Best, Smart, Budget) 트래픽 시뮬레이션",
      step4: "Vercel, Railway, Cloud GPU 월간 OpEx 호스팅 인프라 비용 산출",
      step5: "Gemini 2.5 Flash 기반 7대 섹션 아키텍처 및 Mermaid 다이어그램 명세서 작성"
    },
    dashboard: {
      title: "글로벌 LLM 모델 카탈로그",
      subtitle: "OpenAI, Anthropic, Google, AWS Bedrock, DeepSeek, Meta 등 580+ AI 전체 모델 공식 출처(Official Docs) 기반 스펙, 비용, 할당량 및 벤치마크 비교",
      searchPlaceholder: "모델명, 프로바이더, 라이선스 검색...",
      allProviders: "모든 프로바이더",
      allTiers: "모든 티어",
      allLicenses: "모든 라이선스",
      modelsFound: "개의 모델 검색됨",
      openWeight: "오픈웨이트",
      proprietary: "상용 API",
      contextWindow: "컨텍스트 윈도우",
      inputPrice: "입력 1M 토큰",
      outputPrice: "출력 1M 토큰",
      compareButton: "+ 비교하기",
      compared: "비교 중",
      officialDocs: "공식 문서 ↗",
      arenaElo: "Arena ELO 랭킹",
      apiCode: "API 코드",
      specialFilters: "⚡ 특수 기능 필터:",
      filterNew: "✨ 신규/최신 모델만 (NEW)",
      filterReasoning: "Reasoning (추론/CoT) 지원만",
      filterWebSearch: "실시간 Web Search 지원만",
      filterLitellm: "LiteLLM 검증 모델만",
      densityComfortable: "여유",
      densityCompact: "컴팩트",
      densityComfortableAria: "여유로운 밀도",
      densityCompactAria: "컴팩트 밀도",
      sortBy: "정렬 기준:",
      sortAsc: "▲ 오름차순",
      sortDesc: "▼ 내림차순",
      sortAscTitle: "오름차순 정렬",
      sortDescTitle: "내림차순 정렬",
      kpiNewDesc: "최근 30일 사이 카탈로그에 새로 들어온 모델",
      kpiContextDesc: "매주 동기화되는 모델 중 가장 긴 컨텍스트",
      kpiValueDesc: "주요 프로바이더 프론티어 모델 중 가장 저렴한 가격 (입력:출력 3:1 기준)"
    },
    tco: {
      title: "셀프호스팅 TCO 손익분기 시뮬레이터",
      subtitle: "SaaS API 호출 비용 vs Cloud GPU 서빙 vs 온프레미스 서버 인프라 도입 3년간 총 소요 비용(TCO) 정밀 계산",
      selectModel: "시뮬레이션 대상 모델 선택",
      inputTokens: "월간 입력 토큰 (Million Tokens)",
      outputTokens: "월간 출력 토큰 (Million Tokens)",
      quantization: "경량화 양자화 수준 (Quantization)",
      recommendedOption: "추천 인프라 운용 방식",
      cheapest: "최저 비용 방식",
      apiCostMonthly: "SaaS API 월 비용",
      cloudGpuCostMonthly: "Cloud GPU 대여 월 비용",
      onPremCostMonthly: "On-Premise 구매 감가상각 월 비용",
      powerCostEst: "월 추정 전력비",
      chartTitle: "인프라 구축 방식별 월간 비용 비교 ($)",
      breakEvenPoint: "손익분기점 토큰 사용량",
      breakEvenDesc: "해당 사용량 이상일 경우 SaaS API 대신 독립 인프라(Cloud GPU / On-Premise) 구축이 경제적으로 유리합니다.",
      step1Provider: "1단계: 프로바이더 (공급자) 선택",
      step2Model: "2단계: AI 모델 선택",
      modelsFound: "개 모델 검색됨",
      vramNeeded: "필요 VRAM 용량:",
      modelWeights: "- 모델 가중치 (Weights):",
      recommendedGpu: "추천 GPU 구성:"
    },
    leaderboard: {
      title: "글로벌 AI 모델 성능 랭킹 리더보드",
      subtitle: "LMArena 사용자 선호 평가와 Epoch AI GPQA Diamond 기준 순위 (매주 갱신)",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (코딩)",
      tabMmluPro: "MMLU-Pro (지식)",
      tabGpqa: "GPQA (추론)",
      rank: "순위",
      model: "모델명",
      provider: "프로바이더",
      tier: "티어",
      score: "점수",
      scrollHint: "표는 좌우로 스크롤할 수 있습니다.",
      tableCaption: "분석 데이터"
    },
    advisorModal: {
      moreTitle: "➕ 랭킹 더보기 (Top 6~10+ 추가 인기 서비스)",
      moreNotice: "선택 시 준비된 결과가 아닌, 생성 AI가 실시간 딥 리서치 마크다운 명세서 생성을 시작합니다.",
      rankSuffix: "위",
      liveGenerate: "실시간 생성",
      scMedTitle: "의료 & 헬스케어 임상 데이터 질의응답 챗봇",
      scMedDesc: "HIPAA 보안 준수 및 의학 논문/임상 데이터베이스 전용 보안 RAG",
      scFinTitle: "금융 & 주식 시장 실시간 감성 분석 API",
      scFinDesc: "뉴스 스트림 및 재무제표 0.1초 파싱 ➔ 실시간 매수/매도 감성 스코어링",
      scLawTitle: "법률 계약서 검토 & 판례 추천 서비스",
      scLawDesc: "계약서 독소 조항 자동 감지 및 대법원 판례 데이터베이스 연동 조항 추천",
      scGameTitle: "게임 NPC 지능형 대화 & 스크립트 에이전트",
      scGameDesc: "세계관 페르소나 보유 및 사용자 선택에 동적으로 변화하는 롤플레잉 NPC",
      scEcomTitle: "이커머스 개인화 상품 추천 & 검색 챗봇",
      scEcomDesc: "고객 착장 사진 검색 및 유저 구매 이력 기반 맞춤형 코디 제안",
      tplCodeTitle: "자율 코딩 에이전트 (Code Agent)",
      tplCodeDesc: "Cursor/Claude Code처럼 코드 분석, 버그 수정 및 자동 테스트를 수행하는 에이전트",
      tplRagTitle: "기업용 사내 RAG 챗봇 (Enterprise RAG)",
      tplRagDesc: "사내 Confluence, Notion, PDF 문서를 기반으로 정확한 지식 답변을 주는 보안 챗봇",
      tplMultiTitle: "멀티모달 24/7 고객지원 CS 봇",
      tplMultiDesc: "고객이 업로드한 이미지, 영수증, 화면 캡처를 분석하여 24시간 자동 응대하는 CS 봇",
      tplTransTitle: "글로벌 실시간 번역 & 로컬라이제이션",
      tplTransDesc: "다국어 사용자 메시지 및 고화질 웹페이지 콘텐츠를 0.1초 내 뉘앙스 손실 없이 번역",
      tplContentTitle: "마케팅 콘텐츠 코파일럿 (Copilot)",
      tplContentDesc: "블로그, SNS 포스트, 이메일 시퀀스 및 SEO 최적화 문구를 자동 생성하는 AI 도우미",
      sampleServiceName: "자율 코딩 에이전트 서비스 (미리 준비된 샘플)",
      smartRouterName: "Smart Orchestrated Router (스마트 최적 추천)",
      smartRouterDesc: "Groq/Llama-3.3 70B 분류기 + DeepSeek-R1 메인 엔진 조합으로 비용을 60% 절감하면서도 플래그십 95% 성능 구현",
      advCost60: "API 비용 60% 절감",
      advP95: "평균 응답 속도 P95 < 400ms",
      advCircuit: "Circuit Breaker 자동 장애 복구",
      bestName: "Frontier Premier Quality (최고 품질)",
      bestDesc: "복잡한 추론과 정확도가 최우선인 미션 크리티컬 서비스용 최상위 플래그십 조합",
      advTopReason: "최상위 추론/코딩 성능",
      advSimple: "단일 API로 단순한 구조",
      advElo: "최고 수치 Elo 랭킹",
      budgetName: "Open-Weight Ultra Budget (극가성비)",
      budgetDesc: "오픈웨이트 모델 및 저비용 서버리스 API 위주의 구성으로 대량 쿼리 처리 시 극단의 비용 절감 달성",
      advExtremeSave: "극단의 API 비용 절감",
      advHighVolume: "대용량 처리 최적화",
      advOpenFlex: "Open-Weight 유연성",
      resultHeading: "🎯 추천 아키텍처 모델 조합 & 호스팅 산출 결과",
      artifactBtn: "📦 5대 명세서 아티팩트 보기",
      monthlyApiCost: "월 예상 API 비용",
      callsSuffix: "회"
    },
    sandbox: {
      subtitle: "실시간 프롬프트 토크나이저 & 모델별 API 비용 계산기",
      description: "프롬프트를 입력하면 실시간으로 예상 토큰 수와 1회 호출 비용 및 월간 배치 호출 시의 정밀 산출 금액을 580+ AI 모델 전체와 비교합니다.",
      promptInput: "📝 프롬프트 입력 (Prompt Input)",
      chars: "글자",
      approxInputTokens: "입력 토큰",
      approx: "약",
      promptPlaceholder: "비용을 계산할 프롬프트를 자유롭게 입력하세요...",
      loadSample: "샘플 프롬프트 원클릭 로드:",
      sampleRag: "🔍 RAG 지식 기반 질의응답 (RAG Prompt)",
      sampleCode: "💻 코드 리팩토링 & 버그 검수 (Code Refactor)",
      sampleExec: "📊 비즈니스 요약 & TCO 분석 (Executive Summary)",
      simSetup: "⚙️ 배치 및 응답 토큰 설정 (Simulation Setup)",
      outputTokens: "예상 출력 토큰 (Output Tokens)",
      outputTokensAria: "예상 출력 토큰",
      outShort: "50 (짧은 응답)",
      outTypical: "1,000 (일반적)",
      outLong: "4,096 (긴 리포트)",
      batchRequests: "월간 총 API 호출 횟수 (Batch Requests)",
      callOnce: "1회",
      callSuffix: "회",
      totalTokensPerCall: "총 처리 토큰 (1회 호출 기준):",
      inputLabel: "- 입력 (Input):",
      outputLabel: "- 출력 (Output):",
      monthlyTrafficTokens: "월간 총 트래픽 토큰:",
      tableTitle: "📊 580+ AI 모델별 정밀 비용 산출표",
      tableDesc: "입력 및 예상 출력 토큰에 기반한 1회 호출 단위 비용 및 설정한 월간 트래픽 비용 비교",
      searchPlaceholder: "모델명, 프로바이더 검색...",
      tierFilterAria: "모델 등급 필터",
      allTiers: "모든 티어",
      colModel: "모델명 & 프로바이더",
      colTier: "티어 / 라이선스",
      colInput1M: "입력 1M 토큰 ($)",
      colOutput1M: "출력 1M 토큰 ($)",
      colPerCall: "1회 추정 비용 ($)",
      colMonthly: "월간 총 예상 비용 ($)",
      colCompare: "비교",
      openWeight: "오픈",
      proprietary: "상용",
      comparing: "비교 중",
      addCompare: "+ 비교"
    },
    speed: {
      badge: "프로바이더 서빙 비교",
      subtitle: "같은 모델, 어디서 돌리느냐에 따라 달라지는 것",
      description: "같은 가중치라도 프로바이더마다 양자화 방식·단가·가동률이 다릅니다. OpenRouter 가 실제로 연결해 둔 엔드포인트를 주 1회 받아 비교합니다.",
      targetModel: "대상 모델",
      asOf: "기준",
      source: "출처",
      providerCount: "개 프로바이더",
      metricOutput: "출력 단가",
      metricInput: "입력 단가",
      metricUptime: "가동률 (최근 30분)",
      unitPer1M: "$/100만 토큰",
      chartTitle: "프로바이더별",
      rankTitle: "프로바이더 상세",
      colQuant: "양자화",
      colCtx: "컨텍스트",
      colUptime: "가동률",
      cheapest: "최저가",
      speedNote: "첫 토큰 지연(TTFT)과 초당 토큰(TPS)은 OpenRouter 가 공개 API 로 내주지 않아 싣지 않았습니다. 값이 공개되면 이 화면에 그대로 붙습니다.",
      loading: "불러오는 중",
      empty: "표시할 데이터가 없습니다",
      unknown: "미공개",
    },
    compare: {
      emptyTitle: "비교할 모델이 선택되지 않았습니다.",
      emptyDesc: "모델 카탈로그 대시보드에서 비교하고 싶은 LLM 모델 카드의 '+ 비교하기' 버튼을 눌러 추가해주세요.",
      tableAria: "모델 비교표, 좌우로 스크롤 가능"
    },
    gpu: {
      title: "AI 추론용 GPU 스펙 및 클라우드 대여 비용",
      subtitle: "NVIDIA 데이터센터 & 컨슈머 GPU의 VRAM, 대역폭, 구매가, 클라우드 Hourly 인스턴스 비용 정보",
      vram: "VRAM 용량",
      bandwidth: "메모리 대역폭",
      purchasePrice: "하드웨어 권장 소비자가",
      cloudOnDemand: "클라우드 On-Demand",
      cloudSpot: "클라우드 Spot 인스턴스",
      tabAll: "전체 보기",
      tabEnterprise: "🏢 기업용 (Datacenter)",
      tabProsumer: "🔬 프로슈머 (Workstation)",
      tabConsumer: "💻 개인용 (Consumer)",
      groupEnterprise: "🏢 기업용 데이터센터",
      groupProsumer: "🔬 프로슈머 워크스테이션",
      groupConsumer: "💻 개인용 소비자",
      perfBandwidth: "메모리 대역폭",
      perfFp16: "FP16 연산 성능",
      perfInt8: "INT8 추론 성능",
      cudaCores: "CUDA 코어",
      tensorCores: "Tensor 코어",
      noCloud: "클라우드 서비스 미제공 (온프레미스 전용)",
      recommendedUse: "추천 용도",
      maxVram: "최대 VRAM",
      topFp16: "최고 FP16",
      topInt8: "최고 INT8",
      useH200: "초대형 LLM(70B+) 학습 · Mixture-of-Experts 풀스케일 추론 · 국가급 AI 인프라",
      useGH200: "CPU-GPU 통합 초저지연 추론 · HPC 워크로드 · 멀티모달 대규모 서빙",
      useH100: "GPT-4급 학습 · Batch 대규모 추론 · AI 스타트업 핵심 인프라",
      useL40S: "온프레미스 서버 랙 설치 · 멀티 GPU 클러스터 구성 · 중규모 추론 서빙",
      useA100: "검증된 엔터프라이즈 추론 · Llama2 70B 4-bit 서빙 · 가성비 클라우드 배치",
      useL4: "Real-time Agentic 추론 · 미드사이즈 LLM 서빙 · 그래픽 + AI 혼합 워크로드",
      useRtx6000: "로컬 Llama 70B 4-bit 실행 · 영상 생성 + LLM 동시 운용 · 개인 AI 연구실",
      useA6000: "NVLink 듀얼 구성 48GB 확장 · 13B~34B 모델 로컬 서빙 · 3D·시뮬레이션 + AI 병행",
      useRtx5090: "로컬 7B~13B 모델 빠른 추론 · LoRA 파인튜닝 · ComfyUI 이미지 생성",
      useRtx4090: "7B 모델 로컬 추론 · 가성비 개인 AI 서버 · Stable Diffusion XL",
      useRtx3090: "중고 가성비 최강 · 13B 모델 로컬 서빙 · NVLink 듀얼로 48GB 구성",
      useM4Ultra: "초저전력 70B 4-bit 로컬 추론 · macOS AI 개발환경 · 소음 없는 홈 AI 서버",
      useMi300: "ROCm 기반 오픈소스 LLM 추론 · Ollama + llama.cpp 최적화 · 가성비 대용량 VRAM",
      formPcieWorkstation: "PCIe 4.0 (워크스테이션)",
      formMacStudio: "Mac Studio (통합메모리)",
      nameM4Ultra: "Apple M4 Ultra (128GB 통합메모리)"
    }
  },
  en: {
    nav: {
      brandSubtitle: "Global AI Model TCO & Spec Comparison",
      catalog: "Model Catalog",
      compare: "Compare",
      tco: "TCO Simulator",
      advisor: "🏆 Architecture Advisor",
      tutorial: "🎓 Tutorial",
      news: "📰 AI Trends News",
      leaderboard: "Leaderboard",
      gpus: "GPU Specs & Costs",
      sandbox: "🧮 Tokenizer Sandbox",
      speed: "⚖️ Provider comparison",
      groupCatalog: "Main Catalog",
      groupTools: "Sandbox & Simulators",
      groupInsights: "AI Solutions & Reports",
      compareBasket: "Compare",
      collapseMenu: "Collapse menu",
      errorTitle: "Something went wrong",
      errorCatalog: "Could not load the model catalog. Please try again in a moment.",
      retry: "Retry",
      loadingView: "Loading view",
      updates: "Update notes",
      whatsNew: "What's new",
      viewUpdate: "Read more"
    },
    viewMode: {
      grid: "Card View",
      table: "Spec Table",
      compact: "Compact List"
    },
    quota: {
      title: "API Rate Limits & Quotas",
      rpm: "RPM (Req/Min)",
      tpm: "TPM (Tok/Min)",
      rpd: "RPD (Req/Day)",
      concurrency: "Concurrency"
    },
    researchProgress: {
      title: "AI Solutions Architect Live Deep Analysis",
      subtitle: "Calculating optimal LLM combos and OpEx hosting costs based on your requirements...",
      step1: "Analyzing Natural Language Requirements & Workload Specifications",
      step2: "Scanning 50+ Global LLM Model Database & Arena Elo Benchmarks",
      step3: "Simulating Traffic for 3 Model Combos (Best, Smart, Budget)",
      step4: "Calculating Monthly OpEx Infrastructure Costs (Vercel, Railway, Cloud GPU)",
      step5: "Synthesizing 7-Section Architecture & Mermaid Spec with Gemini 2.5 Flash"
    },
    dashboard: {
      title: "Global LLM Model Catalog",
      subtitle: "Compare official specs, pricing, rate limits, and benchmarks for 580+ LLMs with verified official documentation source links",
      searchPlaceholder: "Search model name, provider, license...",
      allProviders: "All Providers",
      allTiers: "All Tiers",
      allLicenses: "All Licenses",
      modelsFound: "models found",
      openWeight: "Open-Weight",
      proprietary: "Proprietary",
      contextWindow: "Context Window",
      inputPrice: "Input 1M Tokens",
      outputPrice: "Output 1M Tokens",
      compareButton: "+ Compare",
      compared: "Added",
      officialDocs: "Official Docs ↗",
      arenaElo: "Arena ELO rank",
      apiCode: "API code",
      specialFilters: "⚡ Capability filters:",
      filterNew: "✨ New models only",
      filterReasoning: "Reasoning (CoT) support only",
      filterWebSearch: "Live web search only",
      filterLitellm: "LiteLLM-verified only",
      densityComfortable: "Comfortable",
      densityCompact: "Compact",
      densityComfortableAria: "Comfortable density",
      densityCompactAria: "Compact density",
      sortBy: "Sort by:",
      sortAsc: "▲ Ascending",
      sortDesc: "▼ Descending",
      sortAscTitle: "Sort ascending",
      sortDescTitle: "Sort descending",
      kpiNewDesc: "Models added to the catalog in the last 30 days",
      kpiContextDesc: "Longest context window among weekly-synced models",
      kpiValueDesc: "Cheapest frontier model from a major provider (3:1 input:output blend)"
    },
    tco: {
      title: "Self-Hosting TCO Break-Even Simulator",
      subtitle: "Calculate total cost of ownership (TCO): SaaS API vs Cloud GPU sublease vs On-Premise hardware purchase amortized over 36 months",
      selectModel: "Select Target Model",
      inputTokens: "Monthly Input Tokens (Million)",
      outputTokens: "Monthly Output Tokens (Million)",
      quantization: "Quantization Level",
      recommendedOption: "Recommended Infrastructure",
      cheapest: "Cheapest Option",
      apiCostMonthly: "API Monthly Cost",
      cloudGpuCostMonthly: "Cloud GPU Monthly Cost",
      onPremCostMonthly: "On-Prem Amortized Monthly",
      powerCostEst: "Est. Monthly Electricity",
      chartTitle: "Monthly Infrastructure Cost Comparison ($)",
      breakEvenPoint: "Token Volume Break-Even Point",
      breakEvenDesc: "Above this token threshold, dedicated infrastructure (Cloud GPU / On-Premise) is more cost-effective than SaaS API calls.",
      step1Provider: "Step 1: Select Provider",
      step2Model: "Step 2: Select AI Model",
      modelsFound: "models found",
      vramNeeded: "Required VRAM:",
      modelWeights: "- Model weights:",
      recommendedGpu: "Recommended GPU setup:"
    },
    leaderboard: {
      title: "Global AI Model Leaderboard",
      subtitle: "Rankings by LMArena user-preference ratings and Epoch AI GPQA Diamond (updated weekly)",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (Coding)",
      tabMmluPro: "MMLU-Pro (Knowledge)",
      tabGpqa: "GPQA (Reasoning)",
      rank: "Rank",
      model: "Model Name",
      provider: "Provider",
      tier: "Tier",
      score: "Score",
      scrollHint: "This table scrolls horizontally.",
      tableCaption: "Analysis data"
    },
    advisorModal: {
      moreTitle: "➕ More rankings (Top 6–10+ popular services)",
      moreNotice: "Selecting one starts a live deep-research Markdown spec generation instead of showing a pre-computed result.",
      rankSuffix: "",
      liveGenerate: "Generate live",
      scMedTitle: "Healthcare clinical-data Q&A chatbot",
      scMedDesc: "HIPAA-compliant secure RAG over medical papers and clinical databases",
      scFinTitle: "Finance & stock market real-time sentiment API",
      scFinDesc: "Parses news streams and financial statements in 0.1s → live buy/sell sentiment scoring",
      scLawTitle: "Contract review & case-law recommendation service",
      scLawDesc: "Flags harmful clauses automatically and suggests wording backed by a supreme-court case database",
      scGameTitle: "Game NPC dialogue & scripting agent",
      scGameDesc: "Role-playing NPCs with a lore-consistent persona that shift dynamically with player choices",
      scEcomTitle: "E-commerce personalized recommendation & search chatbot",
      scEcomDesc: "Outfit-photo search plus styling suggestions based on each shopper’s purchase history",
      tplCodeTitle: "Autonomous coding agent",
      tplCodeDesc: "An agent that analyzes code, fixes bugs and runs tests automatically, like Cursor or Claude Code",
      tplRagTitle: "Enterprise internal RAG chatbot",
      tplRagDesc: "A secure chatbot answering from internal Confluence, Notion and PDF documents",
      tplMultiTitle: "Multimodal 24/7 customer support bot",
      tplMultiDesc: "Analyzes customer-uploaded images, receipts and screenshots to respond around the clock",
      tplTransTitle: "Global real-time translation & localization",
      tplTransDesc: "Translates multilingual messages and rich web content in under 0.1s without losing nuance",
      tplContentTitle: "Marketing content copilot",
      tplContentDesc: "An AI assistant that drafts blog posts, social copy, email sequences and SEO-optimized text",
      sampleServiceName: "Autonomous coding agent service (pre-computed sample)",
      smartRouterName: "Smart Orchestrated Router",
      smartRouterDesc: "A Groq/Llama-3.3 70B classifier paired with a DeepSeek-R1 main engine: 60% lower cost at 95% of flagship performance",
      advCost60: "60% lower API cost",
      advP95: "P95 latency under 400 ms",
      advCircuit: "Automatic failover via circuit breaker",
      bestName: "Frontier Premier Quality",
      bestDesc: "Top flagship combination for mission-critical services where complex reasoning and accuracy come first",
      advTopReason: "Best-in-class reasoning and coding",
      advSimple: "Simple architecture behind a single API",
      advElo: "Highest Elo ranking",
      budgetName: "Open-Weight Ultra Budget",
      budgetDesc: "Built around open-weight models and low-cost serverless APIs for extreme savings at high query volume",
      advExtremeSave: "Extreme API cost savings",
      advHighVolume: "Optimized for high volume",
      advOpenFlex: "Open-weight flexibility",
      resultHeading: "🎯 Recommended architecture combinations & cost results",
      artifactBtn: "📦 View 5 spec artifacts",
      monthlyApiCost: "Est. monthly API cost",
      callsSuffix: "calls"
    },
    sandbox: {
      subtitle: "Real-time prompt tokenizer & per-model API cost calculator",
      description: "Type a prompt to see estimated tokens, per-call cost and monthly batch cost compared across 580+ AI models in real time.",
      promptInput: "📝 Prompt input",
      chars: "characters",
      approxInputTokens: "input tokens",
      approx: "~",
      promptPlaceholder: "Type any prompt to price it...",
      loadSample: "Load a sample prompt:",
      sampleRag: "🔍 RAG knowledge Q&A",
      sampleCode: "💻 Code refactor & bug review",
      sampleExec: "📊 Executive summary & TCO analysis",
      simSetup: "⚙️ Batch & output token settings",
      outputTokens: "Expected output tokens",
      outputTokensAria: "Expected output tokens",
      outShort: "50 (short reply)",
      outTypical: "1,000 (typical)",
      outLong: "4,096 (long report)",
      batchRequests: "Monthly API calls (batch requests)",
      callOnce: "1 call",
      callSuffix: "calls",
      totalTokensPerCall: "Total tokens per call:",
      inputLabel: "- Input:",
      outputLabel: "- Output:",
      monthlyTrafficTokens: "Monthly traffic tokens:",
      tableTitle: "📊 Precise cost table across 580+ AI models",
      tableDesc: "Per-call and monthly cost comparison based on your input and expected output tokens",
      searchPlaceholder: "Search model or provider...",
      tierFilterAria: "Model tier filter",
      allTiers: "All tiers",
      colModel: "Model & provider",
      colTier: "Tier / license",
      colInput1M: "Input per 1M tokens ($)",
      colOutput1M: "Output per 1M tokens ($)",
      colPerCall: "Est. cost per call ($)",
      colMonthly: "Est. monthly cost ($)",
      colCompare: "Compare",
      openWeight: "Open",
      proprietary: "Proprietary",
      comparing: "Comparing",
      addCompare: "+ Compare"
    },
    speed: {
      badge: "Provider serving comparison",
      subtitle: "Same model, different places to run it",
      description: "The same weights are served with different quantization, pricing and uptime depending on the provider. Endpoints that OpenRouter actually routes to are pulled weekly.",
      targetModel: "Model",
      asOf: "As of",
      source: "Source",
      providerCount: " providers",
      metricOutput: "Output price",
      metricInput: "Input price",
      metricUptime: "Uptime (last 30m)",
      unitPer1M: "$/1M tokens",
      chartTitle: "By provider",
      rankTitle: "Provider detail",
      colQuant: "Quantization",
      colCtx: "Context",
      colUptime: "Uptime",
      cheapest: "Cheapest",
      speedNote: "Time to first token (TTFT) and tokens per second (TPS) are not exposed by OpenRouter's public API, so they are not shown. They will appear here if that changes.",
      loading: "Loading",
      empty: "No data to show",
      unknown: "Not disclosed",
    },
    compare: {
      emptyTitle: "No models selected for comparison.",
      emptyDesc: "Add models from the catalog dashboard using the '+ Compare' button on each model card.",
      tableAria: "Model comparison table, scrolls horizontally"
    },
    gpu: {
      title: "AI Inference GPU Specs & Cloud Hosting Rates",
      subtitle: "Hardware specs, VRAM bandwidth, MSRP, and hourly cloud rental rates for NVIDIA enterprise and consumer GPUs",
      vram: "VRAM Capacity",
      bandwidth: "Memory Bandwidth",
      purchasePrice: "MSRP Purchase Price",
      cloudOnDemand: "Cloud On-Demand Rate",
      cloudSpot: "Cloud Spot Rate",
      tabAll: "All GPUs",
      tabEnterprise: "🏢 Datacenter",
      tabProsumer: "🔬 Workstation",
      tabConsumer: "💻 Consumer",
      groupEnterprise: "🏢 Datacenter GPUs",
      groupProsumer: "🔬 Prosumer Workstation",
      groupConsumer: "💻 Consumer",
      perfBandwidth: "Memory Bandwidth",
      perfFp16: "FP16 Compute",
      perfInt8: "INT8 Inference",
      cudaCores: "CUDA Cores",
      tensorCores: "Tensor Cores",
      noCloud: "No cloud offering (on-premise only)",
      recommendedUse: "Recommended Use",
      maxVram: "Max VRAM",
      topFp16: "Peak FP16",
      topInt8: "Peak INT8",
      useH200: "Training 70B+ LLMs · full-scale Mixture-of-Experts inference · national-scale AI infrastructure",
      useGH200: "Ultra-low-latency CPU-GPU unified inference · HPC workloads · large-scale multimodal serving",
      useH100: "GPT-4-class training · large batch inference · core infrastructure for AI startups",
      useL40S: "On-premise rack deployment · multi-GPU clusters · mid-scale inference serving",
      useA100: "Proven enterprise inference · Llama 2 70B 4-bit serving · cost-effective cloud deployment",
      useL4: "Real-time agentic inference · mid-size LLM serving · mixed graphics + AI workloads",
      useRtx6000: "Local Llama 70B 4-bit · video generation alongside an LLM · personal AI lab",
      useA6000: "48GB via dual NVLink · local serving of 13B–34B models · 3D/simulation alongside AI",
      useRtx5090: "Fast local inference for 7B–13B models · LoRA fine-tuning · ComfyUI image generation",
      useRtx4090: "Local 7B inference · cost-effective personal AI server · Stable Diffusion XL",
      useRtx3090: "Best value on the used market · local 13B serving · 48GB via dual NVLink",
      useM4Ultra: "Ultra-low-power local 70B 4-bit inference · macOS AI development · silent home AI server",
      useMi300: "Open-source LLM inference on ROCm · tuned for Ollama and llama.cpp · large VRAM at low cost",
      formPcieWorkstation: "PCIe 4.0 (workstation)",
      formMacStudio: "Mac Studio (unified memory)",
      nameM4Ultra: "Apple M4 Ultra (128GB unified memory)"
    }
  },
  ja: {
    nav: {
      brandSubtitle: "世界AIモデルTCO・スペック比較",
      catalog: "モデルカタログ",
      compare: "カスタム比較",
      tco: "TCOシミュレーター",
      advisor: "🏆 AIアーキテクチャ推薦",
      tutorial: "🎓 チュートリアル",
      news: "📰 AI トレンドニュース",
      leaderboard: "リーダーボード",
      gpus: "GPUスペック・コスト",
      sandbox: "🧮 トークナイザーサンドボックス",
      speed: "⚖️ プロバイダー比較",
      groupCatalog: "メインカタログ",
      groupTools: "サンドボックス & シミュレーター",
      groupInsights: "AI ソリューション & レポート",
      compareBasket: "比較リスト",
      collapseMenu: "メニューを折りたたむ",
      errorTitle: "エラーが発生しました",
      errorCatalog: "モデルカタログを読み込めませんでした。しばらくしてから再度お試しください。",
      retry: "再試行",
      loadingView: "画面を読み込み中",
      updates: "アップデートノート",
      whatsNew: "新着情報",
      viewUpdate: "詳細を見る"
    },
    viewMode: {
      grid: "カード表示",
      table: "スペック表",
      compact: "リスト表示"
    },
    quota: {
      title: "APIレート制限・クォータ",
      rpm: "RPM (分間リクエスト)",
      tpm: "TPM (分間トークン)",
      rpd: "RPD (日間リクエスト)",
      concurrency: "同時実行数"
    },
    researchProgress: {
      title: "AIソリューションアーキテクトリアルタイム深層分析中",
      subtitle: "ご要件に基づき最適LLM構成とOpExホスティングコストを算出しています...",
      step1: "自然言語要件およびワークロードスペックの分析 (Intent & SLA)",
      step2: "50+ グローバルLLMモデルDB & Arena Eloベンチマークのスキャン",
      step3: "3つのルーティングモデル組合せ（Best, Smart, Budget）シミュレーション",
      step4: "Vercel, Railway, Cloud GPU 月額OpExインフラ費用算出",
      step5: "Gemini 2.5 Flashによる7セクションアーキテクチャ＆Mermaid仕様書生成"
    },
    dashboard: {
      title: "グローバルLLMモデルカタログ",
      subtitle: "OpenAI、Anthropic、Google、AWS Bedrockなど142以上のLLM公式ドキュメント（Official Docs）に基づく全数比較",
      searchPlaceholder: "モデル名、プロバイダー、ライセンスを検索...",
      allProviders: "すべてのプロバイダー",
      allTiers: "すべてのティア",
      allLicenses: "すべてのライセンス",
      modelsFound: "件のモデルが見つかりました",
      openWeight: "オープンウェイト",
      proprietary: "商用API",
      contextWindow: "コンテキストウィンドウ",
      inputPrice: "入力 1Mトークン",
      outputPrice: "出力 1Mトークン",
      compareButton: "+ 比較に追加",
      compared: "追加済み",
      officialDocs: "公式文書 ↗",
      arenaElo: "Arena ELO ランキング",
      apiCode: "API コード",
      specialFilters: "⚡ 特殊機能フィルター:",
      filterNew: "✨ 新着モデルのみ",
      filterReasoning: "推論 (CoT) 対応のみ",
      filterWebSearch: "リアルタイム Web 検索対応のみ",
      filterLitellm: "LiteLLM 検証済みのみ",
      densityComfortable: "ゆったり",
      densityCompact: "コンパクト",
      densityComfortableAria: "ゆったりした表示密度",
      densityCompactAria: "コンパクトな表示密度",
      sortBy: "並び替え:",
      sortAsc: "▲ 昇順",
      sortDesc: "▼ 降順",
      sortAscTitle: "昇順に並び替え",
      sortDescTitle: "降順に並び替え",
      kpiNewDesc: "過去30日間にカタログへ追加されたモデル",
      kpiContextDesc: "毎週同期されるモデルのうち最長のコンテキスト",
      kpiValueDesc: "主要プロバイダーのフロンティアモデルで最安 (入力:出力 3:1 換算)"
    },
    tco: {
      title: "セルフホスティングTCO損益分岐シミュレーター",
      subtitle: "SaaS API呼び出し vs クラウドGPUレンタル vs オンプレミスサーバー導入の3年間TCOを精緻に計算",
      selectModel: "対象モデルを選択",
      inputTokens: "月間入力トークン (1,000,000単位)",
      outputTokens: "月间出力トークン (1,000,000単位)",
      quantization: "量子化レベル (Quantization)",
      recommendedOption: "推奨インフラ構成",
      cheapest: "最安値オプション",
      apiCostMonthly: "SaaS API 月額コスト",
      cloudGpuCostMonthly: "Cloud GPU 月額コスト",
      onPremCostMonthly: "On-Premise 減価償却月額",
      powerCostEst: "推定月間電気代",
      chartTitle: "インフラ構成別月額費用比較 ($)",
      breakEvenPoint: "損益分岐点トークン量",
      breakEvenDesc: "この使用量を超えると、API利用よりも専用インフラ構築の方が経済的です。",
      step1Provider: "ステップ1: プロバイダー選択",
      step2Model: "ステップ2: AIモデル選択",
      modelsFound: "件のモデル",
      vramNeeded: "必要 VRAM 容量:",
      modelWeights: "- モデル重み (Weights):",
      recommendedGpu: "推奨 GPU 構成:"
    },
    leaderboard: {
      title: "グローバルAIモデル性能ランキング",
      subtitle: "LMArenaのユーザー評価とEpoch AI GPQA Diamondに基づく順位（毎週更新）",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (コーディング)",
      tabMmluPro: "MMLU-Pro (知識)",
      tabGpqa: "GPQA (推論)",
      rank: "順位",
      model: "モデル名",
      provider: "プロバイダー",
      tier: "ティア",
      score: "スコア",
      scrollHint: "表は左右にスクロールできます。",
      tableCaption: "分析データ"
    },
    advisorModal: {
      moreTitle: "➕ ランキングをもっと見る (Top 6〜10+ の人気サービス)",
      moreNotice: "選択すると、事前計算結果ではなく生成AIによるリアルタイムのディープリサーチ仕様書生成が始まります。",
      rankSuffix: "位",
      liveGenerate: "リアルタイム生成",
      scMedTitle: "医療・ヘルスケア臨床データQ&Aチャットボット",
      scMedDesc: "HIPAA準拠のセキュアRAG（医学論文・臨床データベース対象）",
      scFinTitle: "金融・株式市場のリアルタイム感情分析API",
      scFinDesc: "ニュースストリームと財務諸表を0.1秒で解析 ➔ リアルタイム売買感情スコアリング",
      scLawTitle: "契約書レビュー・判例推薦サービス",
      scLawDesc: "不利な条項を自動検出し、最高裁判例データベースに基づく条項を提案",
      scGameTitle: "ゲームNPCの知的会話・スクリプトエージェント",
      scGameDesc: "世界観に沿ったペルソナを持ち、プレイヤーの選択で動的に変化するロールプレイNPC",
      scEcomTitle: "ECパーソナライズ商品推薦・検索チャットボット",
      scEcomDesc: "着用写真検索と購買履歴に基づくコーディネート提案",
      tplCodeTitle: "自律コーディングエージェント",
      tplCodeDesc: "Cursor や Claude Code のようにコード解析・バグ修正・自動テストを行うエージェント",
      tplRagTitle: "企業向け社内RAGチャットボット",
      tplRagDesc: "社内のConfluence・Notion・PDF文書に基づき正確に回答するセキュアなチャットボット",
      tplMultiTitle: "マルチモーダル24時間カスタマーサポートボット",
      tplMultiDesc: "顧客がアップロードした画像・領収書・スクリーンショットを解析し24時間自動応答",
      tplTransTitle: "グローバル リアルタイム翻訳・ローカライズ",
      tplTransDesc: "多言語メッセージやWebコンテンツをニュアンスを保ったまま0.1秒以内に翻訳",
      tplContentTitle: "マーケティングコンテンツ コパイロット",
      tplContentDesc: "ブログ・SNS投稿・メールシーケンス・SEO最適化文を自動生成するAIアシスタント",
      sampleServiceName: "自律コーディングエージェントサービス（事前計算サンプル）",
      smartRouterName: "Smart Orchestrated Router (スマート最適推薦)",
      smartRouterDesc: "Groq/Llama-3.3 70B分類器とDeepSeek-R1メインエンジンの組み合わせで、コスト60%削減かつフラッグシップ95%の性能",
      advCost60: "APIコスト60%削減",
      advP95: "P95レイテンシ400ms未満",
      advCircuit: "サーキットブレーカーによる自動フェイルオーバー",
      bestName: "Frontier Premier Quality (最高品質)",
      bestDesc: "複雑な推論と正確性が最優先のミッションクリティカルなサービス向け最上位構成",
      advTopReason: "最高水準の推論・コーディング性能",
      advSimple: "単一APIによるシンプルな構成",
      advElo: "最高のEloランキング",
      budgetName: "Open-Weight Ultra Budget (超コスパ)",
      budgetDesc: "オープンウェイトモデルと低コストのサーバーレスAPI中心の構成で、大量クエリ時に極めて高いコスト削減を実現",
      advExtremeSave: "極めて高いAPIコスト削減",
      advHighVolume: "大量処理に最適化",
      advOpenFlex: "オープンウェイトの柔軟性",
      resultHeading: "🎯 推奨アーキテクチャ構成とコスト算出結果",
      artifactBtn: "📦 5つの仕様アーティファクトを見る",
      monthlyApiCost: "月間推定APIコスト",
      callsSuffix: "回"
    },
    sandbox: {
      subtitle: "リアルタイム プロンプト トークナイザー＆モデル別 API コスト計算機",
      description: "プロンプトを入力すると、推定トークン数・1回あたりのコスト・月間バッチ実行時の費用を580以上のAIモデルでリアルタイム比較します。",
      promptInput: "📝 プロンプト入力",
      chars: "文字",
      approxInputTokens: "入力トークン",
      approx: "約",
      promptPlaceholder: "コストを計算したいプロンプトを自由に入力してください...",
      loadSample: "サンプルプロンプトを読み込む:",
      sampleRag: "🔍 RAG ナレッジQ&A",
      sampleCode: "💻 コードリファクタリング＆バグ検査",
      sampleExec: "📊 ビジネス要約＆TCO分析",
      simSetup: "⚙️ バッチ・出力トークン設定",
      outputTokens: "想定出力トークン",
      outputTokensAria: "想定出力トークン",
      outShort: "50 (短い応答)",
      outTypical: "1,000 (標準)",
      outLong: "4,096 (長いレポート)",
      batchRequests: "月間API呼び出し回数 (バッチ)",
      callOnce: "1回",
      callSuffix: "回",
      totalTokensPerCall: "1回あたりの総トークン:",
      inputLabel: "- 入力 (Input):",
      outputLabel: "- 出力 (Output):",
      monthlyTrafficTokens: "月間トラフィック総トークン:",
      tableTitle: "📊 580以上のAIモデル別 精密コスト表",
      tableDesc: "入力および想定出力トークンに基づく、1回あたり／月間コストの比較",
      searchPlaceholder: "モデル名・プロバイダーを検索...",
      tierFilterAria: "モデル等級フィルター",
      allTiers: "すべての等級",
      colModel: "モデル名＆プロバイダー",
      colTier: "等級 / ライセンス",
      colInput1M: "入力 100万トークン ($)",
      colOutput1M: "出力 100万トークン ($)",
      colPerCall: "1回あたり推定コスト ($)",
      colMonthly: "月間推定コスト ($)",
      colCompare: "比較",
      openWeight: "オープン",
      proprietary: "商用",
      comparing: "比較中",
      addCompare: "+ 比較"
    },
    speed: {
      badge: "プロバイダー提供比較",
      subtitle: "同じモデルでも、どこで動かすかで変わるもの",
      description: "同じ重みでもプロバイダーごとに量子化方式・料金・稼働率が異なります。OpenRouter が実際に接続しているエンドポイントを週1回取得して比較します。",
      targetModel: "対象モデル",
      asOf: "基準",
      source: "出典",
      providerCount: "件のプロバイダー",
      metricOutput: "出力料金",
      metricInput: "入力料金",
      metricUptime: "稼働率 (直近30分)",
      unitPer1M: "$/100万トークン",
      chartTitle: "プロバイダー別",
      rankTitle: "プロバイダー詳細",
      colQuant: "量子化",
      colCtx: "コンテキスト",
      colUptime: "稼働率",
      cheapest: "最安",
      speedNote: "最初のトークンまでの遅延(TTFT)と毎秒トークン数(TPS)は OpenRouter の公開 API では提供されないため掲載していません。公開されればこの画面に反映されます。",
      loading: "読み込み中",
      empty: "表示するデータがありません",
      unknown: "非公開",
    },
    compare: {
      emptyTitle: "比較するモデルが選択されていません。",
      emptyDesc: "モデルカタログのダッシュボードで、比較したいモデルカードの「+ 比較」ボタンから追加してください。",
      tableAria: "モデル比較表、左右にスクロール可能"
    },
    gpu: {
      title: "AI推論用GPUスペック・クラウド利用料",
      subtitle: "NVIDIAデータセンター＆コンシューマーGPUのVRAM、帯域幅、価格、クラウドレンタル料金",
      vram: "VRAM容量",
      bandwidth: "メモリ帯域幅",
      purchasePrice: "推奨販売価格",
      cloudOnDemand: "クラウド On-Demand",
      cloudSpot: "クラウド Spot",
      tabAll: "すべて表示",
      tabEnterprise: "🏢 データセンター向け",
      tabProsumer: "🔬 ワークステーション向け",
      tabConsumer: "💻 個人向け",
      groupEnterprise: "🏢 データセンターGPU",
      groupProsumer: "🔬 プロシューマー ワークステーション",
      groupConsumer: "💻 コンシューマー",
      perfBandwidth: "メモリ帯域幅",
      perfFp16: "FP16 演算性能",
      perfInt8: "INT8 推論性能",
      cudaCores: "CUDA コア",
      tensorCores: "Tensor コア",
      noCloud: "クラウド提供なし（オンプレミス専用）",
      recommendedUse: "推奨用途",
      maxVram: "最大 VRAM",
      topFp16: "最高 FP16",
      topInt8: "最高 INT8",
      useH200: "超大規模LLM(70B+)の学習・MoEフルスケール推論・国家規模AIインフラ",
      useGH200: "CPU-GPU統合による超低遅延推論・HPCワークロード・大規模マルチモーダル配信",
      useH100: "GPT-4級の学習・大規模バッチ推論・AIスタートアップの中核インフラ",
      useL40S: "オンプレミスのラック設置・マルチGPUクラスタ構成・中規模推論配信",
      useA100: "実績あるエンタープライズ推論・Llama2 70B 4bit配信・コスパの良いクラウド配置",
      useL4: "リアルタイム エージェント推論・中規模LLM配信・グラフィックスとAIの混在ワークロード",
      useRtx6000: "ローカルでLlama 70B 4bit実行・動画生成とLLMの同時運用・個人AIラボ",
      useA6000: "NVLinkデュアル構成で48GB拡張・13B〜34Bモデルのローカル配信・3D/シミュレーションとAIの併用",
      useRtx5090: "ローカルでの7B〜13Bモデル高速推論・LoRAファインチューニング・ComfyUI画像生成",
      useRtx4090: "7Bモデルのローカル推論・コスパの良い個人AIサーバー・Stable Diffusion XL",
      useRtx3090: "中古で最高のコスパ・13Bモデルのローカル配信・NVLinkデュアルで48GB構成",
      useM4Ultra: "超低消費電力での70B 4bitローカル推論・macOS AI開発環境・静音ホームAIサーバー",
      useMi300: "ROCmベースのオープンソースLLM推論・Ollama + llama.cpp最適化・大容量VRAMを低コストで",
      formPcieWorkstation: "PCIe 4.0 (ワークステーション)",
      formMacStudio: "Mac Studio (ユニファイドメモリ)",
      nameM4Ultra: "Apple M4 Ultra (128GB ユニファイドメモリ)"
    }
  },
  zh: {
    nav: {
      brandSubtitle: "全球 AI 模型 TCO 与规格对比",
      catalog: "模型目录",
      compare: "自定义对比",
      tco: "TCO 模拟器",
      advisor: "🏆 AI 架构推荐器",
      tutorial: "🎓 教程",
      news: "📰 AI 趋势新闻",
      leaderboard: "排行榜",
      gpus: "GPU 规格与成本",
      sandbox: "🧮 Token 计算沙盒",
      speed: "⚖️ 供应商对比",
      groupCatalog: "主目录",
      groupTools: "沙盒与模拟器",
      groupInsights: "AI 解决方案与报告",
      compareBasket: "对比栏",
      collapseMenu: "收起菜单",
      errorTitle: "出错了",
      errorCatalog: "无法加载模型目录，请稍后重试。",
      retry: "重试",
      loadingView: "正在加载页面",
      updates: "更新说明",
      whatsNew: "最新动态",
      viewUpdate: "查看详情"
    },
    viewMode: {
      grid: "卡片视图",
      table: "规格表格",
      compact: "紧凑列表"
    },
    quota: {
      title: "API 速率限制与配额",
      rpm: "RPM (每分钟请求)",
      tpm: "TPM (每分钟 Token)",
      rpd: "RPD (每日请求)",
      concurrency: "并发限制"
    },
    researchProgress: {
      title: "AI 解决方案架构师实时深度分析中",
      subtitle: "正在根据您的需求计算最佳 LLM 组合与 OpEx 托管成本...",
      step1: "分析自然语言需求与工作负载 S specifications (Intent & SLA)",
      step2: "扫描 50+ 全球 LLM 模型数据库及 Arena Elo 跑分",
      step3: "模拟 3 种路由模型组合 (Best, Smart, Budget) 流量",
      step4: "计算 Vercel, Railway, Cloud GPU 月度 OpEx 基础设施成本",
      step5: "通过 Gemini 2.5 Flash 生成 7 大章节架构及 Mermaid 规范"
    },
    dashboard: {
      title: "全球大语言模型目录",
      subtitle: "基于官方文档 (Official Docs) 权威出处对比 OpenAI、Anthropic、Google 等 142+ 全部模型规格与价格",
      searchPlaceholder: "搜索模型名称、提供商、许可证...",
      allProviders: "所有提供商",
      allTiers: "所有梯队",
      allLicenses: "所有许可证",
      modelsFound: "个模型已找到",
      openWeight: "开源权重",
      proprietary: "商业 API",
      contextWindow: "上下文窗口",
      inputPrice: "输入 1M Tokens",
      outputPrice: "输出 1M Tokens",
      compareButton: "+ 加入对比",
      compared: "已加入",
      officialDocs: "官方文档 ↗",
      arenaElo: "Arena ELO 排名",
      apiCode: "API 代码",
      specialFilters: "⚡ 特殊功能筛选：",
      filterNew: "✨ 仅显示新模型",
      filterReasoning: "仅支持推理 (CoT)",
      filterWebSearch: "仅支持实时联网搜索",
      filterLitellm: "仅 LiteLLM 已验证",
      densityComfortable: "宽松",
      densityCompact: "紧凑",
      densityComfortableAria: "宽松密度",
      densityCompactAria: "紧凑密度",
      sortBy: "排序方式：",
      sortAsc: "▲ 升序",
      sortDesc: "▼ 降序",
      sortAscTitle: "按升序排序",
      sortDescTitle: "按降序排序",
      kpiNewDesc: "近 30 天新加入目录的模型",
      kpiContextDesc: "每周同步模型中最长的上下文窗口",
      kpiValueDesc: "主要厂商前沿模型中价格最低 (输入:输出 按 3:1 折算)"
    },
    tco: {
      title: "自托管 TCO 盈亏平衡模拟器",
      subtitle: "精确计算 SaaS API 调取、Cloud GPU 租赁与本地 On-Premise 硬件采购 3 年总拥有成本 (TCO)",
      selectModel: "选择目标模型",
      inputTokens: "月输入 Token (百万)",
      outputTokens: "月输出 Token (百万)",
      quantization: "量化等级 (Quantization)",
      recommendedOption: "推荐架构方式",
      cheapest: "最低成本方案",
      apiCostMonthly: "SaaS API 月度费用",
      cloudGpuCostMonthly: "Cloud GPU 月租费用",
      onPremCostMonthly: "本地硬件折旧月费用",
      powerCostEst: "预估月电费",
      chartTitle: "不同架构月度成本对比 ($)",
      breakEvenPoint: "盈亏平衡 Token 量",
      breakEvenDesc: "超过此使用量时，部署独立架构 (Cloud GPU / On-Premise) 比调用 API 更具性价比。",
      step1Provider: "第 1 步：选择供应商",
      step2Model: "第 2 步：选择 AI 模型",
      modelsFound: "个模型",
      vramNeeded: "所需显存:",
      modelWeights: "- 模型权重:",
      recommendedGpu: "推荐 GPU 配置:"
    },
    leaderboard: {
      title: "全球 AI 模型性能排行榜",
      subtitle: "基于 LMArena 用户偏好评分与 Epoch AI GPQA Diamond 的排名（每周更新）",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (代码)",
      tabMmluPro: "MMLU-Pro (知识)",
      tabGpqa: "GPQA (推理)",
      rank: "排名",
      model: "模型名称",
      provider: "提供商",
      tier: "梯队",
      score: "得分",
      scrollHint: "表格可左右滚动。",
      tableCaption: "分析数据"
    },
    advisorModal: {
      moreTitle: "➕ 查看更多排名（第 6~10+ 名热门服务）",
      moreNotice: "选择后将启动生成式 AI 的实时深度研究规范生成，而非展示预先计算的结果。",
      rankSuffix: "名",
      liveGenerate: "实时生成",
      scMedTitle: "医疗健康临床数据问答机器人",
      scMedDesc: "符合 HIPAA 的安全 RAG，覆盖医学论文与临床数据库",
      scFinTitle: "金融与股市实时情绪分析 API",
      scFinDesc: "0.1 秒解析新闻流与财报 ➔ 实时买卖情绪评分",
      scLawTitle: "合同审查与判例推荐服务",
      scLawDesc: "自动识别不利条款，并基于最高法院判例数据库推荐条款",
      scGameTitle: "游戏 NPC 智能对话与脚本智能体",
      scGameDesc: "拥有世界观人设、并随玩家选择动态变化的角色扮演 NPC",
      scEcomTitle: "电商个性化推荐与搜索聊天机器人",
      scEcomDesc: "基于穿搭照片搜索与用户购买历史的个性化搭配建议",
      tplCodeTitle: "自主编码智能体",
      tplCodeDesc: "像 Cursor / Claude Code 一样进行代码分析、缺陷修复与自动测试的智能体",
      tplRagTitle: "企业内部 RAG 聊天机器人",
      tplRagDesc: "基于内部 Confluence、Notion 与 PDF 文档给出准确答案的安全聊天机器人",
      tplMultiTitle: "多模态 7×24 客服机器人",
      tplMultiDesc: "分析客户上传的图片、票据与截图，全天候自动应答",
      tplTransTitle: "全球实时翻译与本地化",
      tplTransDesc: "在 0.1 秒内翻译多语种消息与网页内容，且不丢失语义细节",
      tplContentTitle: "营销内容副驾驶",
      tplContentDesc: "自动生成博客、社媒文案、邮件序列与 SEO 优化文本的 AI 助手",
      sampleServiceName: "自主编码智能体服务（预计算示例）",
      smartRouterName: "Smart Orchestrated Router（智能最优推荐）",
      smartRouterDesc: "Groq/Llama-3.3 70B 分类器 + DeepSeek-R1 主引擎组合，成本降低 60%，性能达旗舰的 95%",
      advCost60: "API 成本降低 60%",
      advP95: "P95 延迟低于 400 毫秒",
      advCircuit: "断路器自动故障转移",
      bestName: "Frontier Premier Quality（最高品质）",
      bestDesc: "面向以复杂推理与准确性为先的关键业务的顶级旗舰组合",
      advTopReason: "顶级推理与编码性能",
      advSimple: "单一 API 的简洁架构",
      advElo: "最高 Elo 排名",
      budgetName: "Open-Weight Ultra Budget（极致性价比）",
      budgetDesc: "以开放权重模型与低成本无服务器 API 为主，在大批量查询时实现极致成本节省",
      advExtremeSave: "极致的 API 成本节省",
      advHighVolume: "面向大规模处理优化",
      advOpenFlex: "开放权重的灵活性",
      resultHeading: "🎯 推荐架构组合与成本结果",
      artifactBtn: "📦 查看 5 份规范产物",
      monthlyApiCost: "每月预估 API 成本",
      callsSuffix: "次"
    },
    sandbox: {
      subtitle: "实时提示词分词器与各模型 API 成本计算器",
      description: "输入提示词，即可实时比较 580+ AI 模型的预估 token 数、单次调用成本与月度批量成本。",
      promptInput: "📝 提示词输入",
      chars: "字符",
      approxInputTokens: "输入 token",
      approx: "约",
      promptPlaceholder: "输入任意提示词以计算成本...",
      loadSample: "一键载入示例提示词：",
      sampleRag: "🔍 RAG 知识问答",
      sampleCode: "💻 代码重构与缺陷审查",
      sampleExec: "📊 业务摘要与 TCO 分析",
      simSetup: "⚙️ 批量与输出 token 设置",
      outputTokens: "预计输出 token",
      outputTokensAria: "预计输出 token",
      outShort: "50 (简短回复)",
      outTypical: "1,000 (常见)",
      outLong: "4,096 (长报告)",
      batchRequests: "每月 API 调用次数（批量）",
      callOnce: "1 次",
      callSuffix: "次",
      totalTokensPerCall: "单次调用总 token：",
      inputLabel: "- 输入:",
      outputLabel: "- 输出:",
      monthlyTrafficTokens: "每月流量总 token：",
      tableTitle: "📊 580+ AI 模型精确成本表",
      tableDesc: "基于输入与预计输出 token 的单次与月度成本比较",
      searchPlaceholder: "搜索模型或供应商...",
      tierFilterAria: "模型等级筛选",
      allTiers: "所有等级",
      colModel: "模型与供应商",
      colTier: "等级 / 许可",
      colInput1M: "输入每百万 token ($)",
      colOutput1M: "输出每百万 token ($)",
      colPerCall: "单次预估成本 ($)",
      colMonthly: "月度预估成本 ($)",
      colCompare: "比较",
      openWeight: "开源",
      proprietary: "商用",
      comparing: "比较中",
      addCompare: "+ 比较"
    },
    speed: {
      badge: "供应商服务对比",
      subtitle: "同一模型，在哪里运行会有差别",
      description: "即使权重相同，不同供应商的量化方式、价格和可用率也不同。每周获取 OpenRouter 实际接入的端点进行对比。",
      targetModel: "目标模型",
      asOf: "基准",
      source: "来源",
      providerCount: "家供应商",
      metricOutput: "输出价格",
      metricInput: "输入价格",
      metricUptime: "可用率（近30分钟）",
      unitPer1M: "$/百万 token",
      chartTitle: "按供应商",
      rankTitle: "供应商详情",
      colQuant: "量化",
      colCtx: "上下文",
      colUptime: "可用率",
      cheapest: "最低价",
      speedNote: "首个 token 延迟（TTFT）与每秒 token 数（TPS）未由 OpenRouter 公开 API 提供，故未展示。一旦公开将直接显示在此页。",
      loading: "加载中",
      empty: "暂无数据",
      unknown: "未公开",
    },
    compare: {
      emptyTitle: "尚未选择要比较的模型。",
      emptyDesc: "请在模型目录仪表板中，点击模型卡片上的“+ 比较”按钮添加。",
      tableAria: "模型比较表，可左右滚动"
    },
    gpu: {
      title: "AI 推理 GPU 规格与云端租用价格",
      subtitle: "NVIDIA 企业级与消费级 GPU 的 VRAM、内存带宽、官方指导价及云端按时计费价格",
      vram: "VRAM 容量",
      bandwidth: "内存带宽",
      purchasePrice: "官方指导价",
      cloudOnDemand: "云端 On-Demand",
      cloudSpot: "云端 Spot 实例",
      tabAll: "查看全部",
      tabEnterprise: "🏢 数据中心级",
      tabProsumer: "🔬 工作站级",
      tabConsumer: "💻 消费级",
      groupEnterprise: "🏢 数据中心 GPU",
      groupProsumer: "🔬 专业工作站",
      groupConsumer: "💻 消费级",
      perfBandwidth: "显存带宽",
      perfFp16: "FP16 算力",
      perfInt8: "INT8 推理性能",
      cudaCores: "CUDA 核心",
      tensorCores: "Tensor 核心",
      noCloud: "不提供云服务（仅限本地部署）",
      recommendedUse: "推荐用途",
      maxVram: "最大显存",
      topFp16: "最高 FP16",
      topInt8: "最高 INT8",
      useH200: "超大规模 LLM(70B+) 训练 · MoE 全量推理 · 国家级 AI 基础设施",
      useGH200: "CPU-GPU 统一架构超低延迟推理 · HPC 负载 · 大规模多模态服务",
      useH100: "GPT-4 级训练 · 大规模批量推理 · AI 初创公司核心基础设施",
      useL40S: "本地机架部署 · 多 GPU 集群 · 中等规模推理服务",
      useA100: "成熟的企业级推理 · Llama2 70B 4-bit 服务 · 高性价比云端部署",
      useL4: "实时智能体推理 · 中等规模 LLM 服务 · 图形与 AI 混合负载",
      useRtx6000: "本地运行 Llama 70B 4-bit · 视频生成与 LLM 并行 · 个人 AI 实验室",
      useA6000: "NVLink 双卡扩展至 48GB · 本地服务 13B~34B 模型 · 3D/仿真与 AI 并行",
      useRtx5090: "7B~13B 模型本地快速推理 · LoRA 微调 · ComfyUI 图像生成",
      useRtx4090: "7B 模型本地推理 · 高性价比个人 AI 服务器 · Stable Diffusion XL",
      useRtx3090: "二手市场性价比之王 · 本地服务 13B 模型 · NVLink 双卡组成 48GB",
      useM4Ultra: "超低功耗本地 70B 4-bit 推理 · macOS AI 开发环境 · 静音家用 AI 服务器",
      useMi300: "基于 ROCm 的开源 LLM 推理 · 针对 Ollama 与 llama.cpp 优化 · 低成本大显存",
      formPcieWorkstation: "PCIe 4.0（工作站）",
      formMacStudio: "Mac Studio（统一内存）",
      nameM4Ultra: "Apple M4 Ultra（128GB 统一内存）"
    }
  },
  es: {
    nav: {
      brandSubtitle: "Comparativa Global de Costes y Especificaciones de Modelos AI",
      catalog: "Catálogo de Modelos",
      compare: "Comparar Modelos",
      tco: "API vs TCO Autoalojado",
      advisor: "Recomendador de Arquitectura",
      tutorial: "🎓 Tutorial",
      news: "📰 Noticias de Tendencias IA",
      leaderboard: "Tabla de Clasificación",
      gpus: "Precios y Especificaciones GPU",
      sandbox: "🧮 Tokenizer Sandbox",
      speed: "⚖️ Comparación de proveedores",
      groupCatalog: "Catálogo principal",
      groupTools: "Sandbox y simuladores",
      groupInsights: "Soluciones e informes IA",
      compareBasket: "Comparador",
      collapseMenu: "Contraer menú",
      errorTitle: "Se ha producido un error",
      errorCatalog: "No se pudo cargar el catálogo de modelos. Vuelve a intentarlo en un momento.",
      retry: "Reintentar",
      loadingView: "Cargando la vista",
      updates: "Notas de actualización",
      whatsNew: "Novedades",
      viewUpdate: "Ver más"
    },
    viewMode: { grid: "Cuadrícula", table: "Tabla", compact: "Compacto" },
    quota: { title: "Límites de Tarifa", rpm: "RPM", tpm: "TPM", rpd: "RPD", concurrency: "Concurrencia" },
    researchProgress: {
      title: "Análisis Profundo en Vivo del Arquitecto AI",
      subtitle: "Calculando la combinación óptima de LLM y costes OpEx de alojamiento...",
      step1: "Analizando requisitos en lenguaje natural y especificaciones (Intent & SLA)",
      step2: "Escaneando base de datos de 50+ modelos LLM y benchmarks Arena Elo",
      step3: "Simulando tráfico para 3 combinaciones de modelos (Best, Smart, Budget)",
      step4: "Calculando costes OpEx mensuales de infraestructura (Vercel, Railway, Cloud GPU)",
      step5: "Sintetizando arquitectura de 7 secciones y Mermaid con Gemini 2.5 Flash"
    },
    dashboard: {
      title: "Explorador de Especificaciones y Precios de Modelos LLM",
      subtitle: "Compare precios API, ventana de contexto, benchmarks de rendimiento y especificaciones de más de 50 modelos LLM globales.",
      searchPlaceholder: "Buscar por nombre de modelo, proveedor...",
      allProviders: "Todos los Proveedores",
      allTiers: "Todos los Niveles",
      allLicenses: "Todas las Licencias",
      modelsFound: "modelos encontrados",
      openWeight: "Open Weight",
      proprietary: "Propietario",
      contextWindow: "Ventana de Contexto",
      inputPrice: "Precio Entrada / 1M",
      outputPrice: "Precio Salida / 1M",
      compareButton: "Comparar",
      compared: "En Comparación",
      officialDocs: "Docs Oficiales",
      arenaElo: "Ranking Arena ELO",
      apiCode: "Código de API",
      specialFilters: "⚡ Filtros de capacidades:",
      filterNew: "✨ Solo modelos nuevos",
      filterReasoning: "Solo con soporte de razonamiento (CoT)",
      filterWebSearch: "Solo con búsqueda web en vivo",
      filterLitellm: "Solo verificados por LiteLLM",
      densityComfortable: "Cómoda",
      densityCompact: "Compacta",
      densityComfortableAria: "Densidad cómoda",
      densityCompactAria: "Densidad compacta",
      sortBy: "Ordenar por:",
      sortAsc: "▲ Ascendente",
      sortDesc: "▼ Descendente",
      sortAscTitle: "Ordenar de forma ascendente",
      sortDescTitle: "Ordenar de forma descendente",
      kpiNewDesc: "Modelos añadidos al catálogo en los últimos 30 días",
      kpiContextDesc: "Mayor ventana de contexto entre los modelos sincronizados cada semana",
      kpiValueDesc: "Modelo frontera más barato de un proveedor principal (mezcla entrada:salida 3:1)"
    },
    tco: {
      title: "Simulador TCO: API SaaS vs GPU Autoalojada",
      subtitle: "Calcule el punto de equilibrio financiero entre el pago por uso de API y el autoalojamiento con instancias Cloud GPU u On-Premise.",
      selectModel: "Seleccionar Modelo Objetivo",
      inputTokens: "Tokens de Entrada Mensuales (Millones)",
      outputTokens: "Tokens de Salida Mensuales (Millones)",
      quantization: "Cuantización Objetivo",
      recommendedOption: "Opción Recomendada",
      cheapest: "La Más Económica",
      apiCostMonthly: "Coste API Mensual",
      cloudGpuCostMonthly: "Coste Mensual Cloud GPU",
      onPremCostMonthly: "Amortización Mensual On-Premise",
      powerCostEst: "Coste Eléctrico Estimado",
      chartTitle: "Comparativa Mensual por Arquitectura ($)",
      breakEvenPoint: "Punto de Equilibrio de Tokens",
      breakEvenDesc: "Superado este volumen, el autoalojamiento (Cloud GPU / On-Premise) resulta más rentable que las llamadas a la API SaaS.",
      step1Provider: "Paso 1: Seleccionar proveedor",
      step2Model: "Paso 2: Seleccionar modelo",
      modelsFound: "modelos encontrados",
      vramNeeded: "VRAM necesaria:",
      modelWeights: "- Pesos del modelo:",
      recommendedGpu: "Configuración de GPU recomendada:"
    },
    leaderboard: {
      title: "Clasificación Mundial de Rendimiento de Modelos AI",
      subtitle: "Clasificación según las valoraciones de LMArena y GPQA Diamond de Epoch AI (actualizada cada semana)",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (Código)",
      tabMmluPro: "MMLU-Pro (Conocimiento)",
      tabGpqa: "GPQA (Razonamiento)",
      rank: "Rango",
      model: "Nombre del Modelo",
      provider: "Proveedor",
      tier: "Nivel",
      score: "Puntuación",
      scrollHint: "Esta tabla se desplaza horizontalmente.",
      tableCaption: "Datos de análisis"
    },
    advisorModal: {
      moreTitle: "➕ Ver más del ranking (Top 6-10+ servicios populares)",
      moreNotice: "Al seleccionar uno se inicia la generación en vivo de una especificación Markdown, en lugar de mostrar un resultado precalculado.",
      rankSuffix: ".º",
      liveGenerate: "Generar en vivo",
      scMedTitle: "Chatbot de preguntas sobre datos clínicos",
      scMedDesc: "RAG seguro conforme a HIPAA sobre artículos médicos y bases de datos clínicas",
      scFinTitle: "API de análisis de sentimiento en tiempo real para finanzas y bolsa",
      scFinDesc: "Analiza flujos de noticias y estados financieros en 0,1 s → puntuación de sentimiento de compra/venta en vivo",
      scLawTitle: "Servicio de revisión de contratos y recomendación de jurisprudencia",
      scLawDesc: "Detecta cláusulas perjudiciales y sugiere redacción respaldada por jurisprudencia del tribunal supremo",
      scGameTitle: "Agente de diálogo y guiones para NPC de videojuegos",
      scGameDesc: "NPC de rol con una persona coherente con el lore que cambia según las decisiones del jugador",
      scEcomTitle: "Chatbot de recomendación personalizada y búsqueda para e-commerce",
      scEcomDesc: "Búsqueda por foto de vestimenta y sugerencias de estilo según el historial de compras",
      tplCodeTitle: "Agente de programación autónomo",
      tplCodeDesc: "Un agente que analiza código, corrige errores y ejecuta pruebas automáticamente, como Cursor o Claude Code",
      tplRagTitle: "Chatbot RAG interno para empresas",
      tplRagDesc: "Un chatbot seguro que responde a partir de documentos internos de Confluence, Notion y PDF",
      tplMultiTitle: "Bot de atención al cliente multimodal 24/7",
      tplMultiDesc: "Analiza imágenes, recibos y capturas subidas por el cliente para responder las 24 horas",
      tplTransTitle: "Traducción y localización global en tiempo real",
      tplTransDesc: "Traduce mensajes multilingües y contenido web en menos de 0,1 s sin perder matices",
      tplContentTitle: "Copiloto de contenido de marketing",
      tplContentDesc: "Un asistente de IA que redacta artículos, textos para redes, secuencias de correo y contenido optimizado para SEO",
      sampleServiceName: "Servicio de agente de programación autónomo (muestra precalculada)",
      smartRouterName: "Smart Orchestrated Router",
      smartRouterDesc: "Un clasificador Groq/Llama-3.3 70B con motor principal DeepSeek-R1: 60% menos coste con el 95% del rendimiento insignia",
      advCost60: "60 % menos coste de API",
      advP95: "Latencia P95 por debajo de 400 ms",
      advCircuit: "Conmutación por error automática con circuit breaker",
      bestName: "Frontier Premier Quality",
      bestDesc: "Combinación insignia para servicios críticos donde el razonamiento complejo y la precisión son prioritarios",
      advTopReason: "Razonamiento y codificación de primer nivel",
      advSimple: "Arquitectura simple tras una sola API",
      advElo: "La puntuación Elo más alta",
      budgetName: "Open-Weight Ultra Budget",
      budgetDesc: "Basada en modelos de pesos abiertos y APIs serverless de bajo coste para un ahorro extremo con alto volumen",
      advExtremeSave: "Ahorro extremo en costes de API",
      advHighVolume: "Optimizado para gran volumen",
      advOpenFlex: "Flexibilidad de pesos abiertos",
      resultHeading: "🎯 Combinaciones de arquitectura recomendadas y costes",
      artifactBtn: "📦 Ver los 5 artefactos de especificación",
      monthlyApiCost: "Coste mensual estimado de API",
      callsSuffix: "llamadas"
    },
    sandbox: {
      subtitle: "Tokenizador de prompts en tiempo real y calculadora de costes de API",
      description: "Escribe un prompt para ver los tokens estimados, el coste por llamada y el coste mensual comparados entre más de 580 modelos.",
      promptInput: "📝 Entrada del prompt",
      chars: "caracteres",
      approxInputTokens: "tokens de entrada",
      approx: "~",
      promptPlaceholder: "Escribe cualquier prompt para calcular su coste...",
      loadSample: "Cargar un prompt de ejemplo:",
      sampleRag: "🔍 Preguntas y respuestas con RAG",
      sampleCode: "💻 Refactorización de código y revisión de errores",
      sampleExec: "📊 Resumen ejecutivo y análisis de TCO",
      simSetup: "⚙️ Ajustes de lote y tokens de salida",
      outputTokens: "Tokens de salida previstos",
      outputTokensAria: "Tokens de salida previstos",
      outShort: "50 (respuesta breve)",
      outTypical: "1000 (típico)",
      outLong: "4096 (informe largo)",
      batchRequests: "Llamadas de API mensuales (lote)",
      callOnce: "1 llamada",
      callSuffix: "llamadas",
      totalTokensPerCall: "Tokens totales por llamada:",
      inputLabel: "- Entrada:",
      outputLabel: "- Salida:",
      monthlyTrafficTokens: "Tokens de tráfico mensual:",
      tableTitle: "📊 Tabla de costes precisa para más de 580 modelos",
      tableDesc: "Comparación de coste por llamada y mensual según tus tokens de entrada y salida",
      searchPlaceholder: "Buscar modelo o proveedor...",
      tierFilterAria: "Filtro de nivel de modelo",
      allTiers: "Todos los niveles",
      colModel: "Modelo y proveedor",
      colTier: "Nivel / licencia",
      colInput1M: "Entrada por 1M tokens ($)",
      colOutput1M: "Salida por 1M tokens ($)",
      colPerCall: "Coste estimado por llamada ($)",
      colMonthly: "Coste mensual estimado ($)",
      colCompare: "Comparar",
      openWeight: "Abierto",
      proprietary: "Propietario",
      comparing: "Comparando",
      addCompare: "+ Comparar"
    },
    speed: {
      badge: "Comparación de proveedores",
      subtitle: "El mismo modelo, según dónde se ejecute",
      description: "Los mismos pesos se sirven con distinta cuantización, precio y disponibilidad según el proveedor. Los endpoints que OpenRouter enruta realmente se descargan cada semana.",
      targetModel: "Modelo",
      asOf: "Datos del",
      source: "Fuente",
      providerCount: " proveedores",
      metricOutput: "Precio de salida",
      metricInput: "Precio de entrada",
      metricUptime: "Disponibilidad (últimos 30 min)",
      unitPer1M: "$/1M de tokens",
      chartTitle: "Por proveedor",
      rankTitle: "Detalle por proveedor",
      colQuant: "Cuantización",
      colCtx: "Contexto",
      colUptime: "Disponibilidad",
      cheapest: "Más barato",
      speedNote: "El tiempo hasta el primer token (TTFT) y los tokens por segundo (TPS) no los expone la API pública de OpenRouter, así que no se muestran. Aparecerán aquí si eso cambia.",
      loading: "Cargando",
      empty: "No hay datos que mostrar",
      unknown: "No divulgado",
    },
    compare: {
      emptyTitle: "No hay modelos seleccionados para comparar.",
      emptyDesc: "Añade modelos desde el catálogo con el botón '+ Comparar' de cada tarjeta.",
      tableAria: "Tabla comparativa de modelos, desplazamiento horizontal"
    },
    gpu: {
      title: "Especificaciones GPU y Precios de Alquiler en la Nube",
      subtitle: "VRAM, ancho de banda de memoria, MSRP y precios de alquiler por hora en la nube para GPUs NVIDIA.",
      vram: "VRAM",
      bandwidth: "Ancho de Banda",
      purchasePrice: "Precio MSRP",
      cloudOnDemand: "Cloud Bajo Demanda",
      cloudSpot: "Cloud Spot",
      tabAll: "Ver todas",
      tabEnterprise: "🏢 Centro de datos",
      tabProsumer: "🔬 Estación de trabajo",
      tabConsumer: "💻 Consumo",
      groupEnterprise: "🏢 GPUs de centro de datos",
      groupProsumer: "🔬 Estación de trabajo prosumer",
      groupConsumer: "💻 Consumo",
      perfBandwidth: "Ancho de banda de memoria",
      perfFp16: "Rendimiento FP16",
      perfInt8: "Inferencia INT8",
      cudaCores: "Núcleos CUDA",
      tensorCores: "Núcleos Tensor",
      noCloud: "Sin oferta en la nube (solo on-premise)",
      recommendedUse: "Uso recomendado",
      maxVram: "VRAM máxima",
      topFp16: "FP16 máximo",
      topInt8: "INT8 máximo",
      useH200: "Entrenamiento de LLM de 70B+ · inferencia MoE a escala completa · infraestructura de IA nacional",
      useGH200: "Inferencia unificada CPU-GPU de latencia ultrabaja · cargas HPC · servicio multimodal a gran escala",
      useH100: "Entrenamiento de clase GPT-4 · inferencia por lotes a gran escala · infraestructura clave para startups de IA",
      useL40S: "Despliegue en rack on-premise · clústeres multi-GPU · servicio de inferencia de escala media",
      useA100: "Inferencia empresarial probada · servicio de Llama 2 70B en 4 bits · despliegue en la nube rentable",
      useL4: "Inferencia agéntica en tiempo real · servicio de LLM medianos · cargas mixtas de gráficos e IA",
      useRtx6000: "Llama 70B en 4 bits en local · generación de vídeo junto a un LLM · laboratorio de IA personal",
      useA6000: "48 GB con NVLink dual · servicio local de modelos de 13B-34B · 3D/simulación junto a IA",
      useRtx5090: "Inferencia local rápida de modelos 7B-13B · ajuste fino LoRA · generación de imágenes con ComfyUI",
      useRtx4090: "Inferencia local de 7B · servidor de IA personal rentable · Stable Diffusion XL",
      useRtx3090: "La mejor relación calidad-precio de segunda mano · servicio local de 13B · 48 GB con NVLink dual",
      useM4Ultra: "Inferencia local de 70B en 4 bits con consumo ultrabajo · desarrollo de IA en macOS · servidor doméstico silencioso",
      useMi300: "Inferencia de LLM de código abierto sobre ROCm · optimizado para Ollama y llama.cpp · mucha VRAM a bajo coste",
      formPcieWorkstation: "PCIe 4.0 (estación de trabajo)",
      formMacStudio: "Mac Studio (memoria unificada)",
      nameM4Ultra: "Apple M4 Ultra (128 GB de memoria unificada)"
    }
  },
  de: {
    nav: {
      brandSubtitle: "Globaler KI-Modell Kosten- & Spezifikationsvergleich",
      catalog: "Modellkatalog",
      compare: "Modellvergleich",
      tco: "API vs Self-Host TCO",
      advisor: "Architektur-Empfehlungen",
      tutorial: "🎓 Tutorial",
      news: "📰 KI Trend-News",
      leaderboard: "Bestenliste",
      gpus: "GPU Preise & Specs",
      sandbox: "🧮 Tokenizer Sandbox",
      speed: "⚖️ Anbieter-Vergleich",
      groupCatalog: "Hauptkatalog",
      groupTools: "Sandbox & Simulatoren",
      groupInsights: "KI-Lösungen & Berichte",
      compareBasket: "Vergleich",
      collapseMenu: "Menü einklappen",
      errorTitle: "Ein Fehler ist aufgetreten",
      errorCatalog: "Der Modellkatalog konnte nicht geladen werden. Bitte versuchen Sie es gleich erneut.",
      retry: "Erneut versuchen",
      loadingView: "Ansicht wird geladen",
      updates: "Update-Notizen",
      whatsNew: "Neuigkeiten",
      viewUpdate: "Mehr erfahren"
    },
    viewMode: { grid: "Raster", table: "Tabelle", compact: "Kompakt" },
    quota: { title: "Ratenlimits", rpm: "RPM", tpm: "TPM", rpd: "RPD", concurrency: "Nebenläufigkeit" },
    researchProgress: {
      title: "AI Solution Architect Live-Tiefenanalyse",
      subtitle: "Berechnung der optimalen LLM-Kombinationen und OpEx-Hosting-Kosten...",
      step1: "Analyse der Anforderungsspezifikationen in natürlicher Sprache (Intent & SLA)",
      step2: "Scannen von 50+ globalen LLM-Datenbanken & Arena Elo Benchmarks",
      step3: "Simulation für 3 Modellkombinationen (Best, Smart, Budget)",
      step4: "Berechnung monatlicher OpEx-Infrastrukturkosten (Vercel, Railway, Cloud GPU)",
      step5: "Erstellung der 7-Kapitel-Architektur & Mermaid-Spezifikation mit Gemini 2.5 Flash"
    },
    dashboard: {
      title: "LLM Modell Spezifikationen & Preis-Explorer",
      subtitle: "Vergleichen Sie API-Preise, Kontextfenster, Performance-Benchmarks und Spezifikationen von über 50 globalen LLM-Modellen.",
      searchPlaceholder: "Nach Modellnamen, Anbieter suchen...",
      allProviders: "Alle Anbieter",
      allTiers: "Alle Stufen",
      allLicenses: "Alle Lizenzen",
      modelsFound: "Modelle gefunden",
      openWeight: "Open Weight",
      proprietary: "Proprietär",
      contextWindow: "Kontextfenster",
      inputPrice: "Input Preis / 1M",
      outputPrice: "Output Preis / 1M",
      compareButton: "Vergleichen",
      compared: "Im Vergleich",
      officialDocs: "Offizielle Doku",
      arenaElo: "Arena-ELO-Rang",
      apiCode: "API-Code",
      specialFilters: "⚡ Fähigkeitsfilter:",
      filterNew: "✨ Nur neue Modelle",
      filterReasoning: "Nur mit Reasoning-Unterstützung (CoT)",
      filterWebSearch: "Nur mit Live-Websuche",
      filterLitellm: "Nur LiteLLM-verifiziert",
      densityComfortable: "Komfortabel",
      densityCompact: "Kompakt",
      densityComfortableAria: "Komfortable Dichte",
      densityCompactAria: "Kompakte Dichte",
      sortBy: "Sortieren nach:",
      sortAsc: "▲ Aufsteigend",
      sortDesc: "▼ Absteigend",
      sortAscTitle: "Aufsteigend sortieren",
      sortDescTitle: "Absteigend sortieren",
      kpiNewDesc: "In den letzten 30 Tagen neu aufgenommene Modelle",
      kpiContextDesc: "Längstes Kontextfenster unter den wöchentlich synchronisierten Modellen",
      kpiValueDesc: "Günstigstes Frontier-Modell eines großen Anbieters (Input:Output 3:1)"
    },
    tco: {
      title: "TCO Simulator: SaaS API vs. Self-Hosted GPU",
      subtitle: "Berechnen Sie den Break-Even-Point zwischen API Pay-as-you-go und Self-Hosting auf Cloud-GPUs oder On-Premise-Hardware.",
      selectModel: "Zielmodell auswählen",
      inputTokens: "Monatliche Input-Tokens (Mio.)",
      outputTokens: "Monatliche Output-Tokens (Mio.)",
      quantization: "Ziel-Quantisierung",
      recommendedOption: "Empfohlene Option",
      cheapest: "Günstigste Option",
      apiCostMonthly: "Monatliche API-Kosten",
      cloudGpuCostMonthly: "Monatliche Cloud GPU-Kosten",
      onPremCostMonthly: "Monatliche On-Prem Abschreibung",
      powerCostEst: "Geschätzte Stromkosten",
      chartTitle: "Monatlicher Kostenvergleich nach Architektur ($)",
      breakEvenPoint: "Token Break-Even-Point",
      breakEvenDesc: "Ab diesem Volumen ist Self-Hosting (Cloud GPU / On-Premise) kostengünstiger als SaaS API-Aufrufe.",
      step1Provider: "Schritt 1: Anbieter wählen",
      step2Model: "Schritt 2: KI-Modell wählen",
      modelsFound: "Modelle gefunden",
      vramNeeded: "Benötigter VRAM:",
      modelWeights: "- Modellgewichte:",
      recommendedGpu: "Empfohlene GPU-Konfiguration:"
    },
    leaderboard: {
      title: "Globale KI-Modell Performance Bestenliste",
      subtitle: "Rangliste nach LMArena-Bewertungen und Epoch AI GPQA Diamond (wöchentlich aktualisiert)",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (Code)",
      tabMmluPro: "MMLU-Pro (Wissen)",
      tabGpqa: "GPQA (Logik)",
      rank: "Rang",
      model: "Modellname",
      provider: "Anbieter",
      tier: "Stufe",
      score: "Score",
      scrollHint: "Diese Tabelle lässt sich horizontal scrollen.",
      tableCaption: "Analysedaten"
    },
    advisorModal: {
      moreTitle: "➕ Mehr Rankings (Top 6–10+ beliebte Dienste)",
      moreNotice: "Bei Auswahl startet eine Live-Deep-Research-Generierung der Markdown-Spezifikation statt eines vorberechneten Ergebnisses.",
      rankSuffix: ".",
      liveGenerate: "Live generieren",
      scMedTitle: "Q&A-Chatbot für klinische Gesundheitsdaten",
      scMedDesc: "HIPAA-konformes sicheres RAG über medizinische Publikationen und klinische Datenbanken",
      scFinTitle: "Echtzeit-Sentiment-API für Finanzen und Aktienmarkt",
      scFinDesc: "Parst Nachrichtenströme und Bilanzen in 0,1 s → Live-Sentiment-Scoring für Kauf/Verkauf",
      scLawTitle: "Vertragsprüfung & Rechtsprechungsempfehlung",
      scLawDesc: "Erkennt nachteilige Klauseln automatisch und schlägt Formulierungen auf Basis einer Höchstgerichts-Datenbank vor",
      scGameTitle: "Dialog- und Skript-Agent für Spiel-NPCs",
      scGameDesc: "Rollenspiel-NPCs mit lore-konsistenter Persona, die sich dynamisch an Spielerentscheidungen anpassen",
      scEcomTitle: "E-Commerce-Chatbot für personalisierte Empfehlungen und Suche",
      scEcomDesc: "Outfit-Fotosuche und Styling-Vorschläge auf Basis der Kaufhistorie",
      tplCodeTitle: "Autonomer Coding-Agent",
      tplCodeDesc: "Ein Agent, der Code analysiert, Fehler behebt und Tests automatisch ausführt – wie Cursor oder Claude Code",
      tplRagTitle: "Interner Unternehmens-RAG-Chatbot",
      tplRagDesc: "Ein sicherer Chatbot, der aus internen Confluence-, Notion- und PDF-Dokumenten antwortet",
      tplMultiTitle: "Multimodaler 24/7-Kundensupport-Bot",
      tplMultiDesc: "Analysiert vom Kunden hochgeladene Bilder, Belege und Screenshots und antwortet rund um die Uhr",
      tplTransTitle: "Globale Echtzeit-Übersetzung & Lokalisierung",
      tplTransDesc: "Übersetzt mehrsprachige Nachrichten und Webinhalte in unter 0,1 s ohne Nuancenverlust",
      tplContentTitle: "Marketing-Content-Copilot",
      tplContentDesc: "Ein KI-Assistent, der Blogbeiträge, Social-Texte, E-Mail-Sequenzen und SEO-optimierte Texte entwirft",
      sampleServiceName: "Autonomer Coding-Agent-Dienst (vorberechnetes Beispiel)",
      smartRouterName: "Smart Orchestrated Router",
      smartRouterDesc: "Ein Groq/Llama-3.3-70B-Klassifizierer mit DeepSeek-R1 als Haupt-Engine: 60 % geringere Kosten bei 95 % der Flaggschiff-Leistung",
      advCost60: "60 % geringere API-Kosten",
      advP95: "P95-Latenz unter 400 ms",
      advCircuit: "Automatisches Failover per Circuit Breaker",
      bestName: "Frontier Premier Quality",
      bestDesc: "Top-Kombination für unternehmenskritische Dienste, bei denen komplexes Reasoning und Genauigkeit Vorrang haben",
      advTopReason: "Führende Reasoning- und Coding-Leistung",
      advSimple: "Einfache Architektur hinter einer einzigen API",
      advElo: "Höchste Elo-Wertung",
      budgetName: "Open-Weight Ultra Budget",
      budgetDesc: "Aufgebaut auf Open-Weight-Modellen und günstigen Serverless-APIs für extreme Einsparungen bei hohem Anfragevolumen",
      advExtremeSave: "Extreme Einsparungen bei API-Kosten",
      advHighVolume: "Für hohes Volumen optimiert",
      advOpenFlex: "Flexibilität durch offene Gewichte",
      resultHeading: "🎯 Empfohlene Architekturkombinationen & Kostenergebnisse",
      artifactBtn: "📦 Die 5 Spezifikations-Artefakte ansehen",
      monthlyApiCost: "Gesch. monatliche API-Kosten",
      callsSuffix: "Aufrufe"
    },
    sandbox: {
      subtitle: "Echtzeit-Prompt-Tokenizer & API-Kostenrechner pro Modell",
      description: "Geben Sie einen Prompt ein, um geschätzte Tokens, Kosten pro Aufruf und monatliche Batch-Kosten über 580+ Modelle hinweg zu vergleichen.",
      promptInput: "📝 Prompt-Eingabe",
      chars: "Zeichen",
      approxInputTokens: "Eingabe-Tokens",
      approx: "ca.",
      promptPlaceholder: "Geben Sie einen beliebigen Prompt ein, um die Kosten zu berechnen ...",
      loadSample: "Beispiel-Prompt laden:",
      sampleRag: "🔍 RAG-Wissens-Q&A",
      sampleCode: "💻 Code-Refactoring & Fehlerprüfung",
      sampleExec: "📊 Executive Summary & TCO-Analyse",
      simSetup: "⚙️ Batch- und Ausgabe-Token-Einstellungen",
      outputTokens: "Erwartete Ausgabe-Tokens",
      outputTokensAria: "Erwartete Ausgabe-Tokens",
      outShort: "50 (kurze Antwort)",
      outTypical: "1.000 (typisch)",
      outLong: "4.096 (langer Bericht)",
      batchRequests: "Monatliche API-Aufrufe (Batch)",
      callOnce: "1 Aufruf",
      callSuffix: "Aufrufe",
      totalTokensPerCall: "Gesamt-Tokens pro Aufruf:",
      inputLabel: "- Eingabe:",
      outputLabel: "- Ausgabe:",
      monthlyTrafficTokens: "Monatliche Traffic-Tokens:",
      tableTitle: "📊 Präzise Kostentabelle für 580+ Modelle",
      tableDesc: "Vergleich der Kosten pro Aufruf und pro Monat auf Basis Ihrer Eingabe- und Ausgabe-Tokens",
      searchPlaceholder: "Modell oder Anbieter suchen ...",
      tierFilterAria: "Modellstufen-Filter",
      allTiers: "Alle Stufen",
      colModel: "Modell & Anbieter",
      colTier: "Stufe / Lizenz",
      colInput1M: "Eingabe pro 1 Mio. Tokens ($)",
      colOutput1M: "Ausgabe pro 1 Mio. Tokens ($)",
      colPerCall: "Gesch. Kosten pro Aufruf ($)",
      colMonthly: "Gesch. Monatskosten ($)",
      colCompare: "Vergleich",
      openWeight: "Offen",
      proprietary: "Proprietär",
      comparing: "Im Vergleich",
      addCompare: "+ Vergleichen"
    },
    speed: {
      badge: "Anbieter-Vergleich",
      subtitle: "Dasselbe Modell – je nachdem, wo es läuft",
      description: "Dieselben Gewichte werden je nach Anbieter mit anderer Quantisierung, anderem Preis und anderer Verfügbarkeit ausgeliefert. Die Endpunkte, die OpenRouter tatsächlich ansteuert, werden wöchentlich abgerufen.",
      targetModel: "Modell",
      asOf: "Stand",
      source: "Quelle",
      providerCount: " Anbieter",
      metricOutput: "Ausgabepreis",
      metricInput: "Eingabepreis",
      metricUptime: "Verfügbarkeit (letzte 30 Min.)",
      unitPer1M: "$/1 Mio. Tokens",
      chartTitle: "Nach Anbieter",
      rankTitle: "Anbieterdetails",
      colQuant: "Quantisierung",
      colCtx: "Kontext",
      colUptime: "Verfügbarkeit",
      cheapest: "Günstigster",
      speedNote: "Zeit bis zum ersten Token (TTFT) und Tokens pro Sekunde (TPS) gibt die öffentliche API von OpenRouter nicht heraus und werden daher nicht angezeigt. Sobald sie verfügbar sind, erscheinen sie hier.",
      loading: "Wird geladen",
      empty: "Keine Daten vorhanden",
      unknown: "Nicht angegeben",
    },
    compare: {
      emptyTitle: "Keine Modelle zum Vergleich ausgewählt.",
      emptyDesc: "Fügen Sie Modelle im Katalog über die Schaltfläche '+ Vergleichen' auf jeder Karte hinzu.",
      tableAria: "Modellvergleichstabelle, horizontal scrollbar"
    },
    gpu: {
      title: "KI-Inferenz GPU Specs & Cloud-Mietpreise",
      subtitle: "VRAM, Speicherbandbreite, UVP und stündliche Cloud-Mietpreise für NVIDIA GPUs.",
      vram: "VRAM",
      bandwidth: "Speicherbandbreite",
      purchasePrice: "UVP Preis",
      cloudOnDemand: "Cloud On-Demand",
      cloudSpot: "Cloud Spot",
      tabAll: "Alle anzeigen",
      tabEnterprise: "🏢 Rechenzentrum",
      tabProsumer: "🔬 Workstation",
      tabConsumer: "💻 Consumer",
      groupEnterprise: "🏢 Rechenzentrums-GPUs",
      groupProsumer: "🔬 Prosumer-Workstation",
      groupConsumer: "💻 Consumer",
      perfBandwidth: "Speicherbandbreite",
      perfFp16: "FP16-Rechenleistung",
      perfInt8: "INT8-Inferenz",
      cudaCores: "CUDA-Kerne",
      tensorCores: "Tensor-Kerne",
      noCloud: "Kein Cloud-Angebot (nur On-Premise)",
      recommendedUse: "Empfohlener Einsatz",
      maxVram: "Max. VRAM",
      topFp16: "Max. FP16",
      topInt8: "Max. INT8",
      useH200: "Training von 70B+-LLMs · MoE-Inferenz in vollem Umfang · KI-Infrastruktur auf nationaler Ebene",
      useGH200: "CPU-GPU-vereinheitlichte Inferenz mit ultraniedriger Latenz · HPC-Workloads · multimodales Serving im großen Maßstab",
      useH100: "Training der GPT-4-Klasse · große Batch-Inferenz · Kerninfrastruktur für KI-Startups",
      useL40S: "On-Premise-Rack-Installation · Multi-GPU-Cluster · Inferenz-Serving mittlerer Größe",
      useA100: "Bewährte Enterprise-Inferenz · Llama-2-70B-4-Bit-Serving · kosteneffizientes Cloud-Deployment",
      useL4: "Echtzeit-Agenten-Inferenz · Serving mittelgroßer LLMs · gemischte Grafik- und KI-Workloads",
      useRtx6000: "Llama 70B 4-Bit lokal · Videogenerierung parallel zum LLM · persönliches KI-Labor",
      useA6000: "48 GB per Dual-NVLink · lokales Serving von 13B–34B-Modellen · 3D/Simulation parallel zur KI",
      useRtx5090: "Schnelle lokale Inferenz für 7B–13B-Modelle · LoRA-Feinabstimmung · ComfyUI-Bildgenerierung",
      useRtx4090: "Lokale 7B-Inferenz · kostengünstiger persönlicher KI-Server · Stable Diffusion XL",
      useRtx3090: "Bestes Preis-Leistungs-Verhältnis gebraucht · lokales 13B-Serving · 48 GB per Dual-NVLink",
      useM4Ultra: "Stromsparende lokale 70B-4-Bit-Inferenz · KI-Entwicklung unter macOS · lautloser Heim-KI-Server",
      useMi300: "Open-Source-LLM-Inferenz auf ROCm · optimiert für Ollama und llama.cpp · viel VRAM zu geringen Kosten",
      formPcieWorkstation: "PCIe 4.0 (Workstation)",
      formMacStudio: "Mac Studio (Unified Memory)",
      nameM4Ultra: "Apple M4 Ultra (128 GB Unified Memory)"
    }
  },
  fr: {
    nav: {
      brandSubtitle: "Comparatif Global de Coûts et Spécifications des Modèles IA",
      catalog: "Catalogue de Modèles",
      compare: "Comparer les Modèles",
      tco: "API vs TCO Auto-hébergé",
      advisor: "Recommandateur d'Architecture",
      tutorial: "🎓 Tutoriel",
      news: "📰 Actualités des Tendances IA",
      leaderboard: "Classement Général",
      gpus: "Spécifications & Prix GPU",
      sandbox: "🧮 Bac à sable Tokenizer",
      speed: "⚖️ Comparaison fournisseurs",
      groupCatalog: "Catalogue principal",
      groupTools: "Bac à sable & simulateurs",
      groupInsights: "Solutions & rapports IA",
      compareBasket: "Comparateur",
      collapseMenu: "Réduire le menu",
      errorTitle: "Une erreur est survenue",
      errorCatalog: "Impossible de charger le catalogue de modèles. Veuillez réessayer dans un instant.",
      retry: "Réessayer",
      loadingView: "Chargement de la vue",
      updates: "Notes de mise à jour",
      whatsNew: "Nouveautés",
      viewUpdate: "En savoir plus"
    },
    viewMode: { grid: "Grille", table: "Tableau", compact: "Compact" },
    quota: { title: "Limites de Débit", rpm: "RPM", tpm: "TPM", rpd: "RPD", concurrency: "Concurrence" },
    researchProgress: {
      title: "Analyse Approfondie en Direct par l'Architecte IA",
      subtitle: "Calcul des combinaisons LLM optimales et des coûts d'hébergement OpEx...",
      step1: "Analyse des exigences en langage naturel et des spécifications (Intent & SLA)",
      step2: "Balayage de la base de données de 50+ modèles LLM et benchmarks Arena Elo",
      step3: "Simulation de trafic pour 3 combinaisons de modèles (Best, Smart, Budget)",
      step4: "Calcul des coûts d'infrastructure OpEx mensuels (Vercel, Railway, Cloud GPU)",
      step5: "Synthèse de l'architecture en 7 sections et Mermaid avec Gemini 2.5 Flash"
    },
    dashboard: {
      title: "Explorateur de Tarifs et Spécifications des Modèles LLM",
      subtitle: "Comparez les prix des API, la fenêtre de contexte, les benchmarks et les spécifications de plus de 50 modèles LLM mondiaux.",
      searchPlaceholder: "Rechercher par nom de modèle, fournisseur...",
      allProviders: "Tous les Fournisseurs",
      allTiers: "Tous les Niveaux",
      allLicenses: "Toutes les Licences",
      modelsFound: "modèles trouvés",
      openWeight: "Open Weight",
      proprietary: "Propriétaire",
      contextWindow: "Fenêtre de Contexte",
      inputPrice: "Prix Entrée / 1M",
      outputPrice: "Prix Sortie / 1M",
      compareButton: "Comparer",
      compared: "Comparé",
      officialDocs: "Docs Officielles",
      arenaElo: "Classement Arena ELO",
      apiCode: "Code d’API",
      specialFilters: "⚡ Filtres de capacités :",
      filterNew: "✨ Nouveaux modèles uniquement",
      filterReasoning: "Uniquement avec raisonnement (CoT)",
      filterWebSearch: "Uniquement avec recherche web en direct",
      filterLitellm: "Uniquement vérifiés par LiteLLM",
      densityComfortable: "Confortable",
      densityCompact: "Compacte",
      densityComfortableAria: "Densité confortable",
      densityCompactAria: "Densité compacte",
      sortBy: "Trier par :",
      sortAsc: "▲ Croissant",
      sortDesc: "▼ Décroissant",
      sortAscTitle: "Trier par ordre croissant",
      sortDescTitle: "Trier par ordre décroissant",
      kpiNewDesc: "Modèles ajoutés au catalogue au cours des 30 derniers jours",
      kpiContextDesc: "Plus longue fenêtre de contexte parmi les modèles synchronisés chaque semaine",
      kpiValueDesc: "Modèle frontière le moins cher d'un grand fournisseur (mélange entrée:sortie 3:1)"
    },
    tco: {
      title: "Simulateur TCO : API SaaS vs GPU Auto-hébergé",
      subtitle: "Calculez le point d'équilibre financier entre la facturation API à l'usage et l'auto-hébergement sur Cloud GPU ou On-Premise.",
      selectModel: "Sélectionner le Modèle Cible",
      inputTokens: "Tokens d'Entrée Mensuels (Millions)",
      outputTokens: "Tokens de Sortie Mensuels (Millions)",
      quantization: "Quantification Cible",
      recommendedOption: "Option Recommandée",
      cheapest: "La Plus Économique",
      apiCostMonthly: "Coût Mensuel API",
      cloudGpuCostMonthly: "Coût Mensuel Cloud GPU",
      onPremCostMonthly: "Amortissement Mensuel On-Premise",
      powerCostEst: "Coût Électrique Estimé",
      chartTitle: "Comparatif Mensuel des Coûts par Architecture ($)",
      breakEvenPoint: "Seuil de Rentabilité en Tokens",
      breakEvenDesc: "Au-delà de ce volume, l'auto-hébergement (Cloud GPU / On-Premise) est plus rentable que les appels API SaaS.",
      step1Provider: "Étape 1 : Choisir le fournisseur",
      step2Model: "Étape 2 : Choisir le modèle",
      modelsFound: "modèles trouvés",
      vramNeeded: "VRAM requise :",
      modelWeights: "- Poids du modèle :",
      recommendedGpu: "Configuration GPU recommandée :"
    },
    leaderboard: {
      title: "Classement Mondial de Performance des Modèles IA",
      subtitle: "Classement selon les notes LMArena et GPQA Diamond d'Epoch AI (mis à jour chaque semaine)",
      tabArenaElo: "LMArena",
      tabSweBench: "SWE-bench (Code)",
      tabMmluPro: "MMLU-Pro (Savoir)",
      tabGpqa: "GPQA (Raisonnement)",
      rank: "Rang",
      model: "Nom du Modèle",
      provider: "Fournisseur",
      tier: "Niveau",
      score: "Score",
      scrollHint: "Ce tableau défile horizontalement.",
      tableCaption: "Données d’analyse"
    },
    advisorModal: {
      moreTitle: "➕ Voir plus du classement (Top 6 à 10+ services populaires)",
      moreNotice: "La sélection lance une génération en direct de la spécification Markdown au lieu d’afficher un résultat précalculé.",
      rankSuffix: "e",
      liveGenerate: "Générer en direct",
      scMedTitle: "Chatbot de questions-réponses sur les données cliniques",
      scMedDesc: "RAG sécurisé conforme HIPAA sur les publications médicales et bases cliniques",
      scFinTitle: "API d’analyse de sentiment en temps réel pour la finance et la bourse",
      scFinDesc: "Analyse les flux d’actualités et les états financiers en 0,1 s → scoring de sentiment achat/vente en direct",
      scLawTitle: "Service de revue de contrats et de recommandation de jurisprudence",
      scLawDesc: "Détecte les clauses défavorables et propose des formulations appuyées sur une base de jurisprudence",
      scGameTitle: "Agent de dialogue et de script pour PNJ de jeux",
      scGameDesc: "PNJ de jeu de rôle dotés d’une persona cohérente avec le lore, évoluant selon les choix du joueur",
      scEcomTitle: "Chatbot e-commerce de recommandation personnalisée et de recherche",
      scEcomDesc: "Recherche par photo de tenue et suggestions de style basées sur l’historique d’achat",
      tplCodeTitle: "Agent de codage autonome",
      tplCodeDesc: "Un agent qui analyse le code, corrige les bugs et lance les tests automatiquement, comme Cursor ou Claude Code",
      tplRagTitle: "Chatbot RAG interne d’entreprise",
      tplRagDesc: "Un chatbot sécurisé répondant à partir des documents internes Confluence, Notion et PDF",
      tplMultiTitle: "Bot de support client multimodal 24/7",
      tplMultiDesc: "Analyse les images, reçus et captures envoyés par le client pour répondre 24h/24",
      tplTransTitle: "Traduction et localisation mondiales en temps réel",
      tplTransDesc: "Traduit messages multilingues et contenus web en moins de 0,1 s sans perdre les nuances",
      tplContentTitle: "Copilote de contenu marketing",
      tplContentDesc: "Un assistant IA qui rédige articles, posts sociaux, séquences d’e-mails et textes optimisés SEO",
      sampleServiceName: "Service d’agent de codage autonome (exemple précalculé)",
      smartRouterName: "Smart Orchestrated Router",
      smartRouterDesc: "Un classifieur Groq/Llama-3.3 70B associé au moteur principal DeepSeek-R1 : 60 % de coût en moins pour 95 % des performances phares",
      advCost60: "60 % de coût d’API en moins",
      advP95: "Latence P95 inférieure à 400 ms",
      advCircuit: "Bascule automatique via disjoncteur",
      bestName: "Frontier Premier Quality",
      bestDesc: "Combinaison phare pour les services critiques où le raisonnement complexe et la précision priment",
      advTopReason: "Raisonnement et codage de premier plan",
      advSimple: "Architecture simple derrière une seule API",
      advElo: "Meilleur classement Elo",
      budgetName: "Open-Weight Ultra Budget",
      budgetDesc: "Fondée sur des modèles à poids ouverts et des API serverless peu coûteuses pour des économies extrêmes à fort volume",
      advExtremeSave: "Économies extrêmes sur les coûts d’API",
      advHighVolume: "Optimisé pour les gros volumes",
      advOpenFlex: "Flexibilité des poids ouverts",
      resultHeading: "🎯 Combinaisons d’architecture recommandées et coûts",
      artifactBtn: "📦 Voir les 5 artefacts de spécification",
      monthlyApiCost: "Coût mensuel estimé de l’API",
      callsSuffix: "appels"
    },
    sandbox: {
      subtitle: "Tokeniseur de prompt en temps réel et calculateur de coûts d’API",
      description: "Saisissez un prompt pour comparer en temps réel les tokens estimés, le coût par appel et le coût mensuel sur plus de 580 modèles.",
      promptInput: "📝 Saisie du prompt",
      chars: "caractères",
      approxInputTokens: "tokens d’entrée",
      approx: "~",
      promptPlaceholder: "Saisissez un prompt pour en calculer le coût...",
      loadSample: "Charger un exemple de prompt :",
      sampleRag: "🔍 Questions-réponses RAG",
      sampleCode: "💻 Refactorisation de code et revue de bugs",
      sampleExec: "📊 Synthèse exécutive et analyse du TCO",
      simSetup: "⚙️ Réglages du lot et des tokens de sortie",
      outputTokens: "Tokens de sortie attendus",
      outputTokensAria: "Tokens de sortie attendus",
      outShort: "50 (réponse courte)",
      outTypical: "1 000 (typique)",
      outLong: "4 096 (rapport long)",
      batchRequests: "Appels d’API mensuels (lot)",
      callOnce: "1 appel",
      callSuffix: "appels",
      totalTokensPerCall: "Tokens totaux par appel :",
      inputLabel: "- Entrée :",
      outputLabel: "- Sortie :",
      monthlyTrafficTokens: "Tokens de trafic mensuel :",
      tableTitle: "📊 Tableau de coûts précis pour 580+ modèles",
      tableDesc: "Comparaison du coût par appel et mensuel selon vos tokens d’entrée et de sortie",
      searchPlaceholder: "Rechercher un modèle ou un fournisseur...",
      tierFilterAria: "Filtre de niveau de modèle",
      allTiers: "Tous les niveaux",
      colModel: "Modèle et fournisseur",
      colTier: "Niveau / licence",
      colInput1M: "Entrée par 1 M tokens ($)",
      colOutput1M: "Sortie par 1 M tokens ($)",
      colPerCall: "Coût estimé par appel ($)",
      colMonthly: "Coût mensuel estimé ($)",
      colCompare: "Comparer",
      openWeight: "Ouvert",
      proprietary: "Propriétaire",
      comparing: "En comparaison",
      addCompare: "+ Comparer"
    },
    speed: {
      badge: "Comparaison des fournisseurs",
      subtitle: "Le même modèle, selon l'endroit où il tourne",
      description: "Les mêmes poids sont servis avec une quantification, un tarif et une disponibilité différents selon le fournisseur. Les points de terminaison réellement utilisés par OpenRouter sont récupérés chaque semaine.",
      targetModel: "Modèle",
      asOf: "Au",
      source: "Source",
      providerCount: " fournisseurs",
      metricOutput: "Prix de sortie",
      metricInput: "Prix d'entrée",
      metricUptime: "Disponibilité (30 dern. min)",
      unitPer1M: "$/1M de tokens",
      chartTitle: "Par fournisseur",
      rankTitle: "Détail par fournisseur",
      colQuant: "Quantification",
      colCtx: "Contexte",
      colUptime: "Disponibilité",
      cheapest: "Moins cher",
      speedNote: "Le délai avant le premier token (TTFT) et les tokens par seconde (TPS) ne sont pas exposés par l'API publique d'OpenRouter ; ils ne sont donc pas affichés. Ils apparaîtront ici le cas échéant.",
      loading: "Chargement",
      empty: "Aucune donnée à afficher",
      unknown: "Non communiqué",
    },
    compare: {
      emptyTitle: "Aucun modèle sélectionné pour la comparaison.",
      emptyDesc: "Ajoutez des modèles depuis le catalogue via le bouton « + Comparer » de chaque carte.",
      tableAria: "Tableau comparatif des modèles, défilement horizontal"
    },
    gpu: {
      title: "Spécifications GPU et Tarifs de Location Cloud",
      subtitle: "VRAM, bande passante mémoire, prix conseillé et tarifs de location horaire sur le Cloud pour les GPUs NVIDIA.",
      vram: "VRAM",
      bandwidth: "Bande Passante",
      purchasePrice: "Prix Conseillé",
      cloudOnDemand: "Cloud Sur Demande",
      cloudSpot: "Cloud Spot",
      tabAll: "Tout afficher",
      tabEnterprise: "🏢 Centre de données",
      tabProsumer: "🔬 Station de travail",
      tabConsumer: "💻 Grand public",
      groupEnterprise: "🏢 GPU de centre de données",
      groupProsumer: "🔬 Station de travail prosumer",
      groupConsumer: "💻 Grand public",
      perfBandwidth: "Bande passante mémoire",
      perfFp16: "Performance FP16",
      perfInt8: "Inférence INT8",
      cudaCores: "Cœurs CUDA",
      tensorCores: "Cœurs Tensor",
      noCloud: "Pas d’offre cloud (sur site uniquement)",
      recommendedUse: "Usage recommandé",
      maxVram: "VRAM max",
      topFp16: "FP16 max",
      topInt8: "INT8 max",
      useH200: "Entraînement de LLM 70B+ · inférence MoE à pleine échelle · infrastructure IA d’envergure nationale",
      useGH200: "Inférence unifiée CPU-GPU à très faible latence · charges HPC · service multimodal à grande échelle",
      useH100: "Entraînement de classe GPT-4 · inférence par lots à grande échelle · infrastructure clé pour startups IA",
      useL40S: "Déploiement en rack sur site · clusters multi-GPU · service d’inférence de taille moyenne",
      useA100: "Inférence d’entreprise éprouvée · service Llama 2 70B en 4 bits · déploiement cloud économique",
      useL4: "Inférence agentique en temps réel · service de LLM de taille moyenne · charges mixtes graphiques et IA",
      useRtx6000: "Llama 70B 4 bits en local · génération vidéo en parallèle d’un LLM · laboratoire IA personnel",
      useA6000: "48 Go via double NVLink · service local de modèles 13B–34B · 3D/simulation en parallèle de l’IA",
      useRtx5090: "Inférence locale rapide de modèles 7B–13B · fine-tuning LoRA · génération d’images ComfyUI",
      useRtx4090: "Inférence locale 7B · serveur IA personnel économique · Stable Diffusion XL",
      useRtx3090: "Meilleur rapport qualité-prix en occasion · service local 13B · 48 Go via double NVLink",
      useM4Ultra: "Inférence locale 70B 4 bits à très basse consommation · développement IA sous macOS · serveur IA domestique silencieux",
      useMi300: "Inférence de LLM open source sur ROCm · optimisé pour Ollama et llama.cpp · beaucoup de VRAM à bas coût",
      formPcieWorkstation: "PCIe 4.0 (station de travail)",
      formMacStudio: "Mac Studio (mémoire unifiée)",
      nameM4Ultra: "Apple M4 Ultra (128 Go de mémoire unifiée)"
    }
  }
};
