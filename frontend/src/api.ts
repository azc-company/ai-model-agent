import type { ModelSpec, Provider, GPUSpec, TCOInput, TCOCalculationResult } from './types';

const rawBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const API_BASE_URL = rawBase 
  ? (rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchProviders(): Promise<Provider[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/providers`, 3500);
    if (!res.ok) throw new Error('Failed to fetch providers');
    return await res.json();
  } catch (err) {
    return [
      { id: "openai", name: "OpenAI", website: "https://openai.com", logo_url: "https://openai.com/favicon.ico", description: "Pioneer in LLM AI models", official_docs_url: "https://platform.openai.com/docs" },
      { id: "anthropic", name: "Anthropic", website: "https://anthropic.com", logo_url: "https://anthropic.com/favicon.ico", description: "Creator of Claude models", official_docs_url: "https://docs.anthropic.com" },
      { id: "google", name: "Google DeepMind", website: "https://deepmind.google", logo_url: "https://google.com/favicon.ico", description: "Creator of Gemini models", official_docs_url: "https://ai.google.dev" },
      { id: "meta", name: "Meta AI", website: "https://meta.com", logo_url: "https://meta.com/favicon.ico", description: "Creator of open-weight Llama models", official_docs_url: "https://llama.meta.com" }
    ];
  }
}

export async function fetchModels(params?: {
  provider_id?: string;
  tier?: string;
  is_open_weight?: boolean;
  search?: string;
  lang?: string;
}): Promise<ModelSpec[]> {
  const query = new URLSearchParams();
  if (params?.provider_id) query.append('provider_id', params.provider_id);
  if (params?.tier) query.append('tier', params.tier);
  if (params?.is_open_weight !== undefined) query.append('is_open_weight', String(params.is_open_weight));
  if (params?.search) query.append('search', params.search);
  // 서버가 이 언어의 모델 설명을 골라 내려준다 (없으면 원문 폴백)
  if (params?.lang) query.append('lang', params.lang);

  // Cloudflare D1 엣지 서빙 적용으로 sub-5ms 응답 보장
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/models?${query.toString()}`, 5000);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data: ModelSpec[] = await res.json();
    return data;
  } catch (err) {
    // 예전에는 번들에 얼려둔 580개 카탈로그를 대신 보여줬다. 가격·스펙이 갱신되지 않아
    // 장애 중에 낡은 값을 사실처럼 노출하게 되므로, 실패는 실패로 올린다.
    console.warn('Model catalog fetch failed:', err);
    throw err;
  }
}

export async function fetchModelDetail(id: string): Promise<ModelSpec> {
  const res = await fetch(`${API_BASE_URL}/models/${id}`);
  if (!res.ok) throw new Error('Failed to fetch model details');
  return await res.json();
}

export async function fetchGPUSpecs(): Promise<GPUSpec[]> {
  return [
    // 2026-10 웹 검색 기준. 메모리 대란으로 시세 변동이 크다.
    // 구매가: 신품 실거래가(단종 모델은 중고 시세). 데이터센터 GPU는 공개 정가가 없어 리셀러 시세다(GH200은 시세 미확인, 기존값 유지).
    // 클라우드: On-Demand는 시장 중앙값~전문 클라우드 수준, Spot은 중단 가능(spot·preemptible·community) 최저가 수준.
    // 성능은 Tensor 코어 Dense 기준. Apple M5는 공식 수치가 없어 추정치, 미공개는 0(N/A 표시).
    // ─── 🏢 기업용 (Enterprise Datacenter) ────────────────────────────────────
    {
      id: "b300-sxm",
      name: "NVIDIA B300 (Blackwell Ultra) 288GB",
      tier: "enterprise",
      vram_gb: 288,
      memory_bandwidth_gbps: 8000,
      purchase_price_usd: 53000,
      cloud_hourly_on_demand: 9.50,
      cloud_hourly_spot: 5.87,
      power_watts: 1400,
      fp16_tflops: 2250,
      int8_tops: 0,
      cuda_cores: 20480,
      tensor_cores: 640,
      form_factor: "SXM6",
      nvlink: true,
      recommended_use: "useB300"
    },
    {
      id: "b200-sxm",
      name: "NVIDIA B200 180GB",
      tier: "enterprise",
      vram_gb: 180,
      memory_bandwidth_gbps: 8000,
      purchase_price_usd: 47500,
      cloud_hourly_on_demand: 8.19,
      cloud_hourly_spot: 5.09,
      power_watts: 1000,
      fp16_tflops: 2250,
      int8_tops: 4500,
      cuda_cores: 18944,
      tensor_cores: 592,
      form_factor: "SXM6",
      nvlink: true,
      recommended_use: "useB200"
    },
    {
      id: "h200-sxm",
      name: "NVIDIA H200 SXM 141GB",
      tier: "enterprise",
      vram_gb: 141,
      memory_bandwidth_gbps: 4800,
      purchase_price_usd: 35000,
      cloud_hourly_on_demand: 5.70,
      cloud_hourly_spot: 3.32,
      power_watts: 700,
      fp16_tflops: 989,
      int8_tops: 1979,
      cuda_cores: 16896,
      tensor_cores: 528,
      form_factor: "SXM5",
      nvlink: true,
      recommended_use: "useH200"
    },
    {
      id: "gh200",
      name: "NVIDIA GH200 Grace Hopper 96GB",
      tier: "enterprise",
      vram_gb: 96,
      memory_bandwidth_gbps: 4000,
      purchase_price_usd: 38000,
      cloud_hourly_on_demand: 2.29,
      cloud_hourly_spot: 1.99,
      power_watts: 1000,
      fp16_tflops: 989,
      int8_tops: 1979,
      cuda_cores: 16896,
      tensor_cores: 528,
      form_factor: "SXM5 + Grace CPU",
      nvlink: true,
      recommended_use: "useGH200"
    },
    {
      id: "h100-sxm",
      name: "NVIDIA H100 SXM5 80GB",
      tier: "enterprise",
      vram_gb: 80,
      memory_bandwidth_gbps: 3350,
      purchase_price_usd: 31000,
      cloud_hourly_on_demand: 2.98,
      cloud_hourly_spot: 2.20,
      power_watts: 700,
      fp16_tflops: 989,
      int8_tops: 1979,
      cuda_cores: 16896,
      tensor_cores: 528,
      form_factor: "SXM5",
      nvlink: true,
      recommended_use: "useH100"
    },
    {
      id: "h100-pcie",
      name: "NVIDIA H100 PCIe 80GB",
      tier: "enterprise",
      vram_gb: 80,
      memory_bandwidth_gbps: 2000,
      purchase_price_usd: 27500,
      cloud_hourly_on_demand: 2.50,
      cloud_hourly_spot: 1.99,
      power_watts: 350,
      fp16_tflops: 756,
      int8_tops: 1513,
      cuda_cores: 16896,
      tensor_cores: 528,
      form_factor: "PCIe 5.0",
      nvlink: false,
      recommended_use: "useL40S"
    },
    {
      id: "a100-80gb",
      name: "NVIDIA A100 SXM 80GB",
      tier: "enterprise",
      vram_gb: 80,
      memory_bandwidth_gbps: 2039,
      purchase_price_usd: 9000,
      cloud_hourly_on_demand: 1.19,
      cloud_hourly_spot: 0.68,
      power_watts: 400,
      fp16_tflops: 312,
      int8_tops: 624,
      cuda_cores: 6912,
      tensor_cores: 432,
      form_factor: "SXM4",
      nvlink: true,
      recommended_use: "useA100"
    },
    {
      id: "l40s",
      name: "NVIDIA L40S 48GB",
      tier: "enterprise",
      vram_gb: 48,
      memory_bandwidth_gbps: 864,
      purchase_price_usd: 8000,
      cloud_hourly_on_demand: 0.97,
      cloud_hourly_spot: 0.79,
      power_watts: 350,
      fp16_tflops: 362,
      int8_tops: 733,
      cuda_cores: 18176,
      tensor_cores: 568,
      form_factor: "PCIe 4.0",
      nvlink: false,
      recommended_use: "useL4"
    },
    // ─── 🔬 프로슈머 / 워크스테이션 (Prosumer / Workstation) ────────────────────
    {
      id: "rtx-6000-ada",
      name: "NVIDIA RTX 6000 Ada 48GB",
      tier: "prosumer",
      vram_gb: 48,
      memory_bandwidth_gbps: 960,
      purchase_price_usd: 6800,
      cloud_hourly_on_demand: 0.74,
      cloud_hourly_spot: null,
      power_watts: 300,
      fp16_tflops: 91.1,
      int8_tops: 182,
      cuda_cores: 18176,
      tensor_cores: 568,
      form_factor: "formPcieWorkstation",
      nvlink: false,
      recommended_use: "useRtx6000"
    },
    {
      id: "a5000",
      name: "NVIDIA RTX A5000 24GB",
      tier: "prosumer",
      vram_gb: 24,
      memory_bandwidth_gbps: 768,
      purchase_price_usd: 2700,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 230,
      fp16_tflops: 27.8,
      int8_tops: 55.6,
      cuda_cores: 8192,
      tensor_cores: 256,
      form_factor: "formPcieWorkstation",
      nvlink: true,
      recommended_use: "useA6000"
    },
    {
      id: "rtx-pro-6000-blackwell",
      name: "NVIDIA RTX PRO 6000 Blackwell 96GB",
      tier: "prosumer",
      vram_gb: 96,
      memory_bandwidth_gbps: 1792,
      purchase_price_usd: 16000,
      cloud_hourly_on_demand: 1.80,
      cloud_hourly_spot: 0.79,
      power_watts: 600,
      fp16_tflops: 500,
      int8_tops: 1000,
      cuda_cores: 24064,
      tensor_cores: 752,
      form_factor: "PCIe 5.0 (Workstation)",
      nvlink: false,
      recommended_use: "useRtxPro6000"
    },
    {
      id: "dgx-station-gb300",
      name: "NVIDIA DGX Station GB300 (784GB)",
      tier: "prosumer",
      // 784GB = GPU HBM3e 288GB + CPU LPDDR5X 496GB 코히런트 메모리. 대역폭은 GPU HBM 기준.
      vram_gb: 784,
      memory_bandwidth_gbps: 8000,
      purchase_price_usd: 95000,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 1600,
      fp16_tflops: 2250,
      int8_tops: 0,
      cuda_cores: 20480,
      tensor_cores: 640,
      form_factor: "Desktop Tower (GB300 Superchip)",
      nvlink: false,
      recommended_use: "useDgxStation"
    },
    {
      id: "dgx-spark-128gb",
      name: "NVIDIA DGX Spark 128GB",
      tier: "prosumer",
      vram_gb: 128,
      memory_bandwidth_gbps: 273,
      // 출시가 $3,999 → 2026-02 $4,699 → 2026-10 $6,950 (메모리 가격 인상)
      purchase_price_usd: 6950,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 240,
      fp16_tflops: 125,
      int8_tops: 250,
      cuda_cores: 6144,
      tensor_cores: 192,
      form_factor: "Mini Desktop (GB10 Superchip)",
      nvlink: false,
      recommended_use: "useDgxSpark"
    },
    {
      id: "dgx-spark-64gb",
      name: "NVIDIA DGX Spark 64GB",
      tier: "prosumer",
      vram_gb: 64,
      memory_bandwidth_gbps: 273,
      purchase_price_usd: 4999,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 240,
      fp16_tflops: 125,
      int8_tops: 250,
      cuda_cores: 6144,
      tensor_cores: 192,
      form_factor: "Mini Desktop (GB10 Superchip)",
      nvlink: false,
      recommended_use: "useDgxSpark"
    },
    {
      id: "mac-studio-m5-ultra",
      name: "Apple Mac Studio M5 Ultra 256GB",
      tier: "prosumer",
      vram_gb: 256,
      memory_bandwidth_gbps: 1200,
      // 36코어 CPU·80코어 GPU 구성. 시작가는 96GB $5,499, 512GB는 2026-10 말 출하
      purchase_price_usd: 10799,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 385,
      fp16_tflops: 140,
      int8_tops: 0,
      cuda_cores: 0,
      tensor_cores: 0,
      form_factor: "formMacStudio",
      nvlink: false,
      recommended_use: "useM5Ultra"
    },
    {
      id: "mac-studio-m5-max",
      name: "Apple Mac Studio M5 Max 128GB",
      tier: "prosumer",
      vram_gb: 128,
      // 40코어 GPU 기준. 32코어 GPU는 460GB/s
      memory_bandwidth_gbps: 614,
      purchase_price_usd: 5099,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 200,
      fp16_tflops: 70,
      int8_tops: 0,
      cuda_cores: 0,
      tensor_cores: 0,
      form_factor: "formMacStudio",
      nvlink: false,
      recommended_use: "useM5Max"
    },
    // ─── 💻 개인용 (Consumer / Personal) ─────────────────────────────────────
    {
      id: "rtx-5090",
      name: "NVIDIA RTX 5090 32GB",
      tier: "consumer",
      vram_gb: 32,
      memory_bandwidth_gbps: 1792,
      // 정가 $1,999, 2026-10 미국 매장가 $4,299~5,300(대부분 품절, 온라인 리셀 $7,400+)
      purchase_price_usd: 5100,
      cloud_hourly_on_demand: 0.48,
      cloud_hourly_spot: null,
      power_watts: 575,
      fp16_tflops: 209.5,
      int8_tops: 838,
      cuda_cores: 21760,
      tensor_cores: 680,
      form_factor: "PCIe 5.0 (Desktop)",
      nvlink: false,
      recommended_use: "useRtx5090"
    },
    {
      id: "rtx-4090",
      name: "NVIDIA RTX 4090 24GB",
      tier: "consumer",
      vram_gb: 24,
      memory_bandwidth_gbps: 1008,
      purchase_price_usd: 2860,
      cloud_hourly_on_demand: 0.34,
      cloud_hourly_spot: 0.29,
      power_watts: 450,
      fp16_tflops: 82.6,
      int8_tops: 165,
      cuda_cores: 16384,
      tensor_cores: 512,
      form_factor: "PCIe 4.0 (Desktop)",
      nvlink: false,
      recommended_use: "useRtx5090"
    },
    {
      id: "rtx-4080",
      name: "NVIDIA RTX 4080 Super 16GB",
      tier: "consumer",
      vram_gb: 16,
      memory_bandwidth_gbps: 736,
      purchase_price_usd: 1644,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 320,
      fp16_tflops: 52.2,
      int8_tops: 104,
      cuda_cores: 10240,
      tensor_cores: 320,
      form_factor: "PCIe 4.0 (Desktop)",
      nvlink: false,
      recommended_use: "useRtx4090"
    },
    {
      id: "rtx-3090",
      name: "NVIDIA RTX 3090 24GB",
      tier: "consumer",
      vram_gb: 24,
      memory_bandwidth_gbps: 936,
      purchase_price_usd: 1374,
      cloud_hourly_on_demand: 0.22,
      cloud_hourly_spot: 0.18,
      power_watts: 350,
      fp16_tflops: 35.6,
      int8_tops: 71,
      cuda_cores: 10496,
      tensor_cores: 328,
      form_factor: "PCIe 4.0 (Desktop)",
      nvlink: true,
      recommended_use: "useRtx3090"
    },
    {
      id: "ryzen-ai-max-395",
      name: "AMD Ryzen AI Max+ 395 Mini PC 128GB",
      tier: "consumer",
      vram_gb: 128,
      memory_bandwidth_gbps: 256,
      purchase_price_usd: 3499,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 140,
      fp16_tflops: 59.4,
      int8_tops: 126,
      cuda_cores: 0,
      tensor_cores: 0,
      form_factor: "Mini PC (Strix Halo)",
      nvlink: false,
      recommended_use: "useStrixHalo"
    },
    {
      id: "rx-7900-xtx",
      name: "AMD Radeon RX 7900 XTX 24GB",
      tier: "consumer",
      vram_gb: 24,
      memory_bandwidth_gbps: 960,
      purchase_price_usd: 1400,
      cloud_hourly_on_demand: null,
      cloud_hourly_spot: null,
      power_watts: 355,
      fp16_tflops: 61.4,
      int8_tops: 123,
      cuda_cores: 0,
      tensor_cores: 0,
      form_factor: "PCIe 4.0 (Desktop)",
      nvlink: false,
      recommended_use: "useMi300"
    }
  ];
}


export async function simulateTCO(input: TCOInput): Promise<TCOCalculationResult> {
  const inputM = input.monthly_input_tokens_m || 100;
  const outputM = input.monthly_output_tokens_m || 20;

  const apiTotal = inputM * 0.50 + outputM * 1.50;
  const selfHostedTotal = 1440; // 2x H100 @ $1.00/hr

  return {
    model_id: input.target_model_id,
    model_name: "DeepSeek R1 / Llama 3.3 70B",
    monthly_input_tokens_m: inputM,
    monthly_output_tokens_m: outputM,
    api_cost: {
      input_cost: inputM * 0.50,
      output_cost: outputM * 1.50,
      total_monthly_cost: apiTotal
    },
    self_hosted: {
      recommended_gpu: "2x NVIDIA H100 80GB",
      gpu_count: 2,
      total_vram_gb: 160,
      cloud_on_demand_monthly: selfHostedTotal,
      cloud_spot_monthly: selfHostedTotal * 0.6,
      on_prem_hardware_cost: 64000,
      on_prem_monthly_amortized: 1777,
      on_prem_monthly_power: 200,
      on_prem_total_monthly: 1977,
      breakeven_months_vs_api: 18
    },
    recommendation: apiTotal < selfHostedTotal ? "SaaS API Calling" : "Self-Hosted Cloud GPU"
  };
}

export interface ChangelogEntry {
  id: string;
  period_start: string;
  period_end: string;
  title: string;
  summary: string;
  items: Array<{ category?: string; text: string }>;
  created_at: string;
}

/** 최신 업데이트 노트. 실패해도 화면을 막지 않도록 빈 배열을 돌려준다. */
export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/changelog`, 4000);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
