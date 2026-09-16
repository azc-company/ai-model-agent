export interface Provider {
  id: string;
  name: string;
  website: string;
  logo_url: string;
  description: string;
  official_docs_url: string;
}

export interface APIPricing {
  input_price_per_1m: number;
  output_price_per_1m: number;
  cached_input_price_per_1m?: number;
  batch_discount_percent?: number;
  notes?: string;
}

export interface QuotaInfo {
  rpm: number;
  tpm: number;
  rpd?: number;
  concurrency_limit?: number;
  notes?: string;
}

export interface BenchmarkScores {
  arena_elo?: number | null;      // LMArena 종합 레이팅 (최고 추론 설정 기준)
  arena_variant?: string | null;  // 점수를 가져온 아레나 항목 이름 (예: claude-fable-5.1-max)
  gpqa?: number | null;           // Epoch AI GPQA Diamond, 퍼센트
  // MMLU-Pro·SWE-bench 는 신선한 공개 수집원이 없어 동기화가 null 로 비운다. 화면에 쓰지 않는다.
  mmlu_pro?: number | null;
  swe_bench?: number | null;
  asof?: { arena?: string | null; gpqa?: string | null };
}

export interface ModelSpec {
  id: string;
  provider_id: string;
  provider_name: string;
  name: string;
  tier: string;
  is_open_weight: boolean;
  license_type: string;
  parameter_count_b?: number;
  architecture: string;
  context_window: number;
  max_output_tokens: number;
  modality: string[];
  description: string;
  official_url: string;
  source_docs_url: string;
  api_pricing: APIPricing;
  quota?: QuotaInfo;
  benchmarks: BenchmarkScores;
  // LiteLLM 검증 필드
  is_verified: boolean;
  litellm_id?: string;
  supports_reasoning: boolean;
  supports_web_search: boolean;
  is_deprecated: boolean;
  is_new?: boolean;
  first_seen_at?: string | null;   // 카탈로그 최초 발견일 (UTC)
  source?: string;                 // 'feed' = 주간 동기화, 'seed' = 초기 수작업 데이터
  updated_at?: string;
  hardware_requirements?: any;
}

export type GPUTier = 'enterprise' | 'prosumer' | 'consumer';

export interface GPUSpec {
  id: string;
  name: string;
  tier: GPUTier;
  vram_gb: number;
  memory_bandwidth_gbps: number;
  purchase_price_usd: number;
  cloud_hourly_on_demand: number | null;
  cloud_hourly_spot: number | null;
  power_watts: number;
  fp16_tflops: number;       // FP16 연산 성능 (TFLOPS)
  int8_tops: number;         // INT8 추론 성능 (TOPS)
  cuda_cores: number;
  tensor_cores: number;
  form_factor: string;       // 'SXM5' | 'PCIe' | 'Desktop' 등
  nvlink: boolean;           // NVLink 지원 여부
  recommended_use: string;   // 한국어 추천 용도 요약
}

export interface TCOInput {
  monthly_input_tokens_m: number;
  monthly_output_tokens_m: number;
  target_model_id: string;
  target_quantization?: string;
  kwh_cost_usd?: number;
  hardware_lifecycle_months?: number;
}

export interface APICostResult {
  input_cost: number;
  output_cost: number;
  total_monthly_cost: number;
}

export interface SelfHostedCostResult {
  recommended_gpu: string;
  gpu_count: number;
  total_vram_gb: number;
  cloud_on_demand_monthly: number;
  cloud_spot_monthly: number;
  on_prem_hardware_cost: number;
  on_prem_monthly_amortized: number;
  on_prem_monthly_power: number;
  on_prem_total_monthly: number;
  breakeven_months_vs_api?: number;
}

export interface TCOCalculationResult {
  model_id: string;
  model_name: string;
  monthly_input_tokens_m: number;
  monthly_output_tokens_m: number;
  api_cost: APICostResult;
  self_hosted: SelfHostedCostResult;
  recommendation: string;
}

export type TCOComparisonResult = TCOCalculationResult;

export interface RecommendationRequest {
  service_type: string;
  monthly_requests: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  primary_priority?: string;
  requires_multimodal: boolean;
  requires_coding: boolean;
  custom_prompt?: string;
  language?: string;
}

export interface ModelComboItem {
  role: string;
  model_id: string;
  model_name: string;
  provider_name: string;
  allocation_percent: number;
  monthly_estimated_cost: number;
}

export interface ModelCombo {
  id: string;
  name: string;
  tag: string;
  description: string;
  items: ModelComboItem[];
  total_monthly_cost: number;
  avg_arena_elo: number;
  key_advantages: string[];
}

export interface HostingOption {
  provider: string;
  category: string;
  estimated_monthly_cost: number;
  description: string;
  recommended_for: string;
}

export interface SpecBundle {
  agents_md: string;
  architecture_md: string;
  database_schema_md: string;
  tasks_md: string;
  deployment_md: string;
}

export interface ArchitectureRecommendationResult {
  service_name: string;
  monthly_requests: number;
  total_monthly_input_tokens_m: number;
  total_monthly_output_tokens_m: number;
  combos: ModelCombo[];
  hosting_options: HostingOption[];
  markdown_spec: string;
  spec_bundle?: SpecBundle;
}

export interface TrendingTemplate {
  rank: number;
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  typical_monthly_requests?: number;
  request: RecommendationRequest;
}
