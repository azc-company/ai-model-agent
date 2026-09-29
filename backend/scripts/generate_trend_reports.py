#!/usr/bin/env python3
"""
종합 트렌드 리포트 생성 스크립트
RSS 수집 → 클러스터링 → LiteLLM(gpt-4o-mini) → Cloudflare D1 저장
"""
import json, math, os, re, time, uuid, subprocess, urllib.error, urllib.request, urllib.parse
from collections import Counter
from dataclasses import dataclass, field
from typing import Mapping

from trend_report_validation import (
    REQUIRED_REPORT_FIELDS,
    deduplicate_sources,
    is_duplicate_report,
    validate_report,
)

# 원문 본문을 읽을 수 있는 피드만 남긴다. 스크래핑을 거부하는 곳(429/403)은
# 기사를 버리게 되므로 목록에 있어도 결과에 기여하지 못한다.
#   제거: blogs.microsoft.com  → 410 Gone. 피드 자체가 없어졌고 매일 0건이었다
#   유지: venturebeat(429) · openai.com(403) → 본문을 못 읽어 실제 기여는 없지만,
#         차단이 풀리면 자동으로 다시 잡히므로 남겨 둔다
# 신규는 RSS 파싱과 본문 추출이 모두 성공하는 것만 실측 후 추가했다.
RSS_FEEDS = [
    "https://feeds.feedburner.com/venturebeat/SZYF",
    "https://techcrunch.com/feed/",
    "https://www.technologyreview.com/feed/",
    "https://openai.com/news/rss.xml",
    "https://www.deepmind.com/blog/rss.xml",
    "https://huggingface.co/blog/feed.xml",
    "https://aws.amazon.com/blogs/machine-learning/feed/",
    "https://blog.google/technology/ai/rss/",
    # 실측 추가 (본문 평균 3,400~6,000자)
    "https://arstechnica.com/ai/feed/",
    "https://blogs.nvidia.com/feed/",
    "https://www.microsoft.com/en-us/research/feed/",
    "https://jack-clark.net/feed/",
    "https://magazine.sebastianraschka.com/feed",
    "https://simonwillison.net/atom/everything/",
    # 2026-09-07 추가. RSS 파싱과 본문 추출이 모두 되는 것만 실측 후 넣었다.
    # 발행량(하루 8건)은 MAX_CLUSTERS 가 정하므로 늘지 않는다. 노리는 것은
    # 같은 사건을 여러 매체가 다루는 클러스터다 — 09-06 발행분 8건 중 5건이
    # 단일 매체였고, 그러면 "종합 리포트" 가 이름값을 못 한다.
    #
    # 심층 분석 (본문 1만자 내외)
    "https://www.aisnakeoil.com/feed",
    "https://lilianweng.github.io/index.xml",
    "https://www.interconnects.ai/feed",
    "https://research.google/blog/rss/",
    # 기업 공식
    "https://www.together.ai/blog/rss.xml",
    "https://mistral.ai/rss.xml",
    # 미디어
    "https://news.mit.edu/rss/topic/artificial-intelligence2",
    "https://www.wired.com/feed/tag/ai/latest/rss",
    "https://www.theregister.com/software/ai_ml/headlines.atom",
    # 제외: blog.cloudflare.com — RSS·본문 모두 정상이지만 AI 외 인프라 글이
    #       많아 노이즈가 된다. 필요해지면 그때 넣는다.
]
TREND_REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "primary_topic": {"type": "string"},
        "tldr": {"type": "string"},
        "blog_body": {"type": "string"},
        "developer_tip": {"type": "string"},
        "pm_tip": {"type": "string"},
        "business_tip": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "impact_score": {"type": "integer"},
        # 원문에서 확인한 수치만. source_url 을 못 대면 넣지 못한다.
        "key_numbers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "value": {"type": "string"},
                    "source_url": {"type": "string"},
                },
                "required": ["label", "value", "source_url"],
                "additionalProperties": False,
            },
        },
        # 편집 의견. 사실이 아니라는 것을 UI 가 표시한다.
        "our_take": {"type": "string"},
        # 모르는 것을 모른다고 쓰는 자리. 없으면 추측이 사실처럼 본문에 섞인다.
        "open_questions": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "title",
        "primary_topic",
        "tldr",
        "blog_body",
        "developer_tip",
        "pm_tip",
        "business_tip",
        "tags",
        "impact_score",
        "key_numbers",
        "our_take",
        "open_questions",
    ],
    "additionalProperties": False,
}


@dataclass(frozen=True)
class BatchConfig:
    litellm_url: str
    litellm_key: str
    model: str
    fallback_model: str = ""


@dataclass
class BatchSummary:
    collected: int = 0
    source_rejected: int = 0
    clusters: int = 0
    generated: int = 0
    report_rejected: int = 0
    saved: int = 0
    failed: int = 0
    reasons: Counter[str] = field(default_factory=Counter)


def load_config(environ: Mapping[str, str] | None = None) -> BatchConfig:
    source = os.environ if environ is None else environ
    key = source.get("LITELLM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("LITELLM_API_KEY is required")
    return BatchConfig(
        litellm_url=source.get("LITELLM_URL", "https://ai-gateway.azclab.com/v1").rstrip("/"),
        litellm_key=key,
        model=source.get("LITELLM_MODEL", "gemini/gemini-3.7-flash"),
        # 폴백은 1순위(Google)와 다른 곳이어야 같은 장애·한도에 함께 걸리지 않는다.
        # 2026-09-29 실측 — 실제 기사 프롬프트(입력 7~10K 토큰, 원문 12,000자×5)로:
        #   groq/qwen/qwen3.6-27b        모델이 사라짐 (8/26 등록 후 조용히 죽어 있었다)
        #   groq qwen3.8-27b·gpt-oss-120b 무료 등급 분당 8K 토큰 한도 — 큰 클러스터 거부
        #   cf-gpt-oss-120b (무료)       대기열로 30~125초, 절반가량 타임아웃·524
        #   nemotron-3.5-lightning:free  60초 타임아웃
        #   paid-1 Mistral Small 3       반복에 빠져("…의 중요성" 되풀이) 12K 토큰까지 쓰다 524
        #   openai/gpt-4o-mini           6/6 통과, 평균 19초, 본문 1,000~1,900자
        #                                ($0.15/$0.60 per 1M — 1건 약 ₩5)
        # 긴 기사를 안정적으로 받아 주는 무료 폴백은 없었다. 1순위(Gemini)가 실패한
        # 날에만 쓰이므로 유료여도 비용은 무시할 수준이다. 본문은 Gemini 의 절반 이하다.
        fallback_model=source.get("LITELLM_FALLBACK_MODEL", "openai/gpt-4o-mini"),
    )

_IMG_PATTERNS = (
    r'<media:content[^>]+url="([^"]+)"',
    r'<media:thumbnail[^>]+url="([^"]+)"',
    r'<enclosure[^>]+type="image/[^"]*"[^>]+url="([^"]+)"',
    r'<enclosure[^>]+url="([^"]+)"[^>]+type="image/',
    r'<img[^>]+src="([^"]+)"',
)


def extract_image(item_xml):
    """RSS 항목에서 대표 이미지 URL을 뽑는다. 없으면 None."""
    for pattern in _IMG_PATTERNS:
        match = re.search(pattern, item_xml, re.IGNORECASE)
        if not match:
            continue
        url = match.group(1).strip().replace("&amp;", "&")
        if url.startswith("http") and not url.endswith(".svg"):
            return url[:500]
    return None


def fetch_rss(feed_url):
    try:
        req = urllib.request.Request(feed_url, headers={"User-Agent": "curl/8.7.1"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
        arts = []
        # RSS 2.0 은 <item>, Atom 은 <entry> 를 쓴다. <item> 만 보면 Atom 피드가
        # 조용히 0건으로 잡혀 좋은 출처를 놓친다.
        for item in re.finditer(r"<(?:item|entry)[\s\S]*?</(?:item|entry)>", text):
            t = item.group()
            title = (re.search(r"<title><!\[CDATA\[([\s\S]*?)\]\]></title>", t) or re.search(r"<title>([^<]*)</title>", t))
            link = (re.search(r"<link>([^<]*)</link>", t) or re.search(r'<link[^>]*href="([^"]+)"', t))
            desc = (re.search(r"<description><!\[CDATA\[([\s\S]*?)\]\]></description>", t)
                    or re.search(r"<description>([^<]*)</description>", t)
                    or re.search(r"<summary[^>]*>([\s\S]*?)</summary>", t)
                    or re.search(r"<content[^>]*>([\s\S]*?)</content>", t))
            if title and link:
                clean = re.sub(r"<[^>]+>", "", desc.group(1) if desc else "").strip()[:500]
                arts.append({"title": title.group(1).strip(), "link": link.group(1).strip(), "summary": clean, "source": urllib.parse.urlparse(feed_url).hostname, "image": extract_image(t)})
        return arts[:8]
    except Exception as e:
        print(f"  [RSS Skip] {feed_url}: {e}")
        return []

# 원문을 읽지 않고 RSS 요약 500자만 보고 쓰면, 모델이 빈칸을 채우는 것이 곧 환각이
# 된다. "개발 생산성 80% 향상" 같은 문장이 그렇게 나왔다. 링크를 따라가 본문을
# 가져오고, 못 가져온 기사는 아예 쓰지 않는다.
MIN_BODY_CHARS = 600      # 이보다 짧으면 추출 실패로 본다
# 수집 원문 중앙값이 10,267자다. 6000 으로 자르면 기사 85%가 잘리고, 잘려나간
# 구간에 인용할 수치가 몰려 있다 (AWS 클러스터 실측: 수치 1개 → 7개).
# 20000 은 수치를 1개 더 얻는 대신 입력 토큰이 배로 든다.
MAX_BODY_CHARS = 12000

_SKIP_EXT = (".pdf", ".zip", ".mp3", ".mp4")


def fetch_article_body(url):
    """원문 본문을 추출한다. 실패하면 빈 문자열 — 호출부가 그 기사를 버린다."""
    if not url or not url.startswith("http") or url.lower().endswith(_SKIP_EXT):
        return ""
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("  [본문추출] beautifulsoup4 없음 — 원문 없이 진행하지 않는다")
        return ""
    try:
        res = subprocess.run(
            ["curl", "-sL", "--max-time", "10", "-A",
             "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36", url],
            capture_output=True, timeout=13,
        )
        html = res.stdout.decode("utf-8", errors="ignore")
        if len(html) < 200:
            return ""
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "svg", "button", "noscript"]):
            tag.extract()
        main = (soup.find("article") or soup.find("main")
                or soup.find(class_=re.compile(r"content|post|entry|article|body", re.I)))
        target = main or soup
        parts = [el.get_text(separator=" ", strip=True)
                 for el in target.find_all(["p", "h2", "h3", "li"])
                 if len(el.get_text(strip=True)) > 20]
        text = " ".join(parts).strip()
        return text[:MAX_BODY_CHARS] if len(text) >= MIN_BODY_CHARS else ""
    except Exception as e:
        print(f"  [본문추출 실패] {url[:60]}: {e}")
        return ""


def attach_bodies(articles):
    """각 기사에 body 를 채우고, 실패한 것은 버린다."""
    kept, dropped = [], 0
    for a in articles:
        body = fetch_article_body(a.get("link", ""))
        if body:
            a["body"] = body
            kept.append(a)
        else:
            dropped += 1
        time.sleep(0.4)   # 같은 도메인을 연달아 때리지 않는다
    print(f"  본문 확보 {len(kept)}건 / 제외 {dropped}건")
    return kept


# ─── 클러스터링 ──────────────────────────────────────────────────────────────
# 고정 키워드 버킷은 같은 사건을 다룬 기사를 흩어 놓고(제목에 "gemini" 한 단어만
# 있어도 multimodal 행), 아무 패턴에도 안 걸린 기사를 general 한 덩어리에 몰아
# 넣었다. 서로 무관한 기사가 한 "종합 리포트" 로 묶이던 원인이다.
#
# 제목·요약의 어휘 겹침(TF-IDF 코사인)으로 바꾼다. 같은 사건을 다룬 기사는
# 모델명·회사명 같은 고유명사를 공유하므로 어휘 겹침만으로 충분히 갈린다.
# 임베딩 API 는 기사당 호출·비용·실패 지점을 늘리는 데 비해, 사건 단위 묶기라는
# 이 용도에서는 이득이 없었다.
STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "was", "were",
    "are", "its", "but", "not", "you", "all", "can", "will", "new", "now", "how", "why",
    "what", "who", "when", "more", "than", "into", "out", "about", "over", "after",
    "says", "said", "one", "two", "his", "her", "their", "our", "they", "them", "been",
    "also", "such", "which", "would", "could", "may", "make", "made", "get", "using",
    "use", "used", "via", "per", "inc", "ltd", "com", "https", "http", "www",
}
MIN_TOKEN_LEN = 3
CLUSTER_SIM = 0.16      # 실측 튜닝값. 낮추면 무관한 기사가 섞이고 높이면 전부 단일이 된다
MAX_CLUSTER_SIZE = 6
MAX_CLUSTERS = 8


# "Import AI 471:", "The Download:" 같은 연재물은 회차마다 내용이 전혀 다른데
# 접두어를 공유한다. 그대로 두면 무관한 회차 6건이 한 "종합 리포트" 로 묶인다.
SERIES_PREFIX = re.compile(r"^([^:]{3,40}):\s")
MIN_SERIES_REPEATS = 3


def _strip_series_prefixes(titles):
    """여러 번 반복되는 연재물 접두어를 제목에서 떼어낸다. 회차 번호는 무시한다."""
    matches, counts = [], Counter()
    for title in titles:
        match = SERIES_PREFIX.match(title)
        key = re.sub(r"\d+", "", match.group(1)).strip().lower() if match else ""
        matches.append((match, key))
        if key:
            counts[key] += 1
    return [title[match.end():] if key and counts[key] >= MIN_SERIES_REPEATS else title
            for title, (match, key) in zip(titles, matches)]


def _strip_boilerplate(summaries):
    """여러 기사에 토씨까지 똑같이 반복되는 문장을 걷어낸다.

    뉴스레터 요약문은 "Welcome to Import AI, a newsletter about..." 같은 상용구를
    회차마다 그대로 달고 온다. 접두어만 떼서는 이 상용구가 남아, 내용이 전혀 다른
    회차들이 여전히 한 덩어리로 묶인다.
    """
    sentences = [re.split(r"(?<=[.!?])\s+", summary or "") for summary in summaries]
    repeats = Counter()
    for sents in sentences:
        repeats.update({s.strip() for s in sents if len(s.strip()) > 20})
    return [
        " ".join(s for s in sents if repeats[s.strip()] < MIN_SERIES_REPEATS)
        for sents in sentences
    ]


def _tokenize(text):
    words = re.findall(r"[a-z0-9][a-z0-9.+-]*", text.lower())
    return [w for w in words if len(w) >= MIN_TOKEN_LEN and w not in STOPWORDS]


def _tfidf_vectors(docs):
    """문서마다 단위길이 TF-IDF 벡터를 만든다. 코사인 = 그냥 내적이 된다."""
    term_freqs = [Counter(_tokenize(d)) for d in docs]
    doc_freq = Counter()
    for tf in term_freqs:
        doc_freq.update(tf)

    total = len(docs)
    vectors = []
    for tf in term_freqs:
        # idf 에 +1 을 둬서 모든 문서에 나오는 단어도 음수 가중치가 되지 않게 한다.
        vec = {t: (1 + math.log(c)) * (1 + math.log(total / (1 + doc_freq[t])))
               for t, c in tf.items()}
        norm = math.sqrt(sum(w * w for w in vec.values()))
        vectors.append({t: w / norm for t, w in vec.items()} if norm else {})
    return vectors


def _cosine(a, b):
    if len(b) < len(a):
        a, b = b, a
    return sum(w * b[t] for t, w in a.items() if t in b)


def cluster_articles(raw, threshold=CLUSTER_SIM):
    """어휘가 겹치는 기사끼리 묶는다. 이웃이 없는 기사는 단독 클러스터가 된다."""
    if not raw:
        return []

    titles = _strip_series_prefixes([a["title"] for a in raw])
    summaries = _strip_boilerplate([a.get("summary", "") for a in raw])
    vectors = _tfidf_vectors([f"{t} {s}" for t, s in zip(titles, summaries)])
    # ponytail: O(n^2) 유사도 행렬. 하루 수집량이 수백 건이라 문제 없다.
    # 수천 건이 되면 역색인으로 후보를 좁혀라.
    sims = [[0.0] * len(raw) for _ in raw]
    for i in range(len(raw)):
        for j in range(i + 1, len(raw)):
            sims[i][j] = sims[j][i] = _cosine(vectors[i], vectors[j])

    remaining = set(range(len(raw)))
    clusters = []
    while remaining:
        # 임계값 넘는 이웃이 가장 많은 기사를 씨앗으로 삼는다. 가장 큰 덩어리부터
        # 떼어내야 남은 기사들이 억지로 섞이지 않는다.
        best_seed, best_group = None, []
        for i in sorted(remaining):
            near = sorted((sims[i][j], j) for j in remaining if j != i and sims[i][j] >= threshold)
            group = [j for _, j in near[::-1][:MAX_CLUSTER_SIZE - 1]]
            if best_seed is None or len(group) > len(best_group):
                best_seed, best_group = i, group
        chosen = [best_seed] + best_group
        remaining -= set(chosen)
        clusters.append([raw[k] for k in chosen])

    clusters.sort(key=len, reverse=True)
    return clusters[:MAX_CLUSTERS]


class ContentFiltered(Exception):
    """게이트웨이 콘텐츠 필터가 요청을 막았다.

    "users can download, customize and run them on their own hardware" 같은
    평범한 뉴스 문장도 "execution request detected" 로 막힌다. 오탐이지만
    게이트웨이 설정이라 여기서 끌 수 없다.
    """


def _is_qwen_model(model):
    return "qwen" in model.lower()


def _request_llm(prompt, config, model, max_tokens=12000, timeout=60):
    request_body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a senior AI tech journalist. Return ONLY valid JSON. Use formal Korean (합쇼체)."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        # 본문 3,500~5,000자를 지시하므로 본문만 ~7,000 토큰이다. key_numbers(URL
        # 포함)·our_take·open_questions·팁까지 더하면 6000 으로는 지시를 따를 수 없다.
        "max_tokens": max_tokens,
    }
    if "gpt-oss" in model:
        # 추론형이라 기본 강도에서는 같은 기사가 124초 걸렸다. low 로 42초.
        request_body["reasoning_effort"] = "low"
    if _is_qwen_model(model):
        request_body.update({
            "reasoning_effort": "none",
            "response_format": {"type": "json_object"},
        })
    else:
        request_body["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "trend_report",
                "strict": True,
                "schema": TREND_REPORT_SCHEMA,
            },
        }

    payload = json.dumps(request_body).encode()
    req = urllib.request.Request(f"{config.litellm_url}/chat/completions", data=payload,
        headers={"Authorization": f"Bearer {config.litellm_key}", "Content-Type": "application/json", "User-Agent": "curl/8.7.1"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read())
        choice = data["choices"][0]
        if choice.get("finish_reason") == "content_filter":
            raise ContentFiltered(choice["message"].get("content") or "blocked")
        raw = choice["message"]["content"]
        raw = re.sub(r"^```json\s*", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        report = json.loads(raw)
        return _normalize_qwen_report(report) if _is_qwen_model(model) else report


def _normalize_qwen_report(report):
    normalized = dict(report)
    aliases = {
        "primary_topic": ("theme", "core_theme"),
        "developer_tip": ("dev_tip",),
        "business_tip": ("biz_tip",),
        "impact_score": ("confidence", "score"),
    }
    for canonical, alternatives in aliases.items():
        if normalized.get(canonical) in (None, "", []):
            for alternative in alternatives:
                value = normalized.get(alternative)
                if value not in (None, "", []):
                    normalized[canonical] = value
                    break
        for alternative in alternatives:
            normalized.pop(alternative, None)
    return normalized


def _is_transient_llm_error(error):
    """폴백을 시도할 값어치가 있는 실패인가.

    응답이 비었거나 JSON 이 아닌 경우(JSONDecodeError)도 포함한다. 폴백은 바로
    이런 때 쓰라고 둔 것인데, 이걸 빼 두면 주 모델이 빈 응답 하나만 줘도 클러스터를
    통째로 버린다 — 매 회차 실패 1건이 전부 이 경로였다.
    HTTPError 는 URLError 의 하위 클래스라 첫 줄에서 함께 걸린다.
    """
    return isinstance(error, (TimeoutError, urllib.error.URLError, json.JSONDecodeError))


def _has_required_report_fields(report):
    # JSON 스키마의 required 는 "키가 있어야 한다" 는 뜻이고, 여기는 "값이 비면
    # 재시도한다" 는 뜻이라 기준이 다르다. 둘을 같이 쓰면 key_numbers: [] —
    # 원문에 수치가 없어 올바르게 비운 경우 — 가 실패로 판정돼 재시도를 유발한다.
    return all(report.get(field) not in (None, "", []) for field in REQUIRED_REPORT_FIELDS)


# 폴백 쪽이 느린 날이 있다(후보 실측 17~125초). 1순위와 같은 60초로 끊으면
# 원문이 많은 날 폴백까지 같이 죽는다. 게이트웨이 앞단이 약 125초에서 끊으므로 그 안.
FALLBACK_TIMEOUT = 120


def call_llm(prompt, config):
    # 어느 모델이 썼는지 남긴다. 예전에는 로그에도 D1 에도 없어서, 폴백이 한 달 넘게
    # 죽어 있어도 알 방법이 없었다. 저장 컬럼이 아니라 배치 요약에만 쓰인다.
    try:
        report = _request_llm(prompt, config, config.model)
        report["_model"] = config.model
        return report
    except Exception as error:
        if not config.fallback_model or not _is_transient_llm_error(error):
            raise
        print(f"  [폴백] {config.model} 실패({type(error).__name__}) → {config.fallback_model}")

    report = _request_llm(prompt, config, config.fallback_model, timeout=FALLBACK_TIMEOUT)
    if not _has_required_report_fields(report):
        report = _request_llm(prompt, config, config.fallback_model, timeout=FALLBACK_TIMEOUT)
    report["_model"] = config.fallback_model
    return report

def _is_filtered(article, config):
    """생성 없이 필터에 걸리는지만 확인한다 (출력 16토큰)."""
    try:
        _request_llm(build_prompt([article]), config, config.model, max_tokens=16)
    except ContentFiltered:
        return True
    except Exception:
        return False   # 필터 외의 실패는 여기서 판단하지 않는다
    return False


def drop_filtered_articles(cluster, config, checker=_is_filtered):
    """필터에 걸리는 기사만 빼고 남긴다. 클러스터를 통째로 버리지 않기 위해서다."""
    return [a for a in cluster if not checker(a, config)]


def build_prompt(cluster):
    combined = "\n\n---\n\n".join(
        f"Source: {a['source']}\nURL: {a.get('link', '')}\nTitle: {a['title']}\n"
        f"Full text:\n{a.get('body') or a['summary']}"
        for a in cluster
    )
    # 이웃이 없는 기사도 단독 클러스터로 온다. 1건짜리에 "종합 분석" 을 시키면
    # 있지도 않은 다른 기사를 지어내 엮는다.
    if len(cluster) == 1:
        lead = "다음 AI 관련 최신 기사 1건을 깊이 있게 파고들어 심층 리포트를 작성하세요."
        title_kind = "리포트"
    else:
        lead = (f"다음 {len(cluster)}개의 AI 관련 최신 기사를 종합 분석하여 "
                "깊이 있는 '종합 트렌드 리포트'를 작성하세요. "
                "기사들을 나열하지 말고, 이들을 관통하는 하나의 흐름으로 엮으세요.")
        title_kind = "종합 리포트"

    return f"""{lead}

[요구사항]
1. 단순 요약이 아닌 맥락(Context) 기반 심층 조사보도 형태여야 합니다.
2. 글의 흐름에 맞게 동적으로 섹션(##)을 구성하세요. 고정 템플릿 금지.
   blog_body 는 **3,500~5,000자**, 섹션 **4~6개**로 쓰세요. 짧게 끝내지 마세요.
   원문마다 최소 한 가지씩 구체적 사실(수치·인용·기능명)을 본문에 녹이세요.
   독자가 원문을 읽지 않아도 무슨 일이 있었는지 알 수 있어야 합니다.
3. 말투는 반드시 한국 기술 미디어 표준인 합쇼체(~습니다, ~입니다)를 사용하세요.

[읽는 글이 아니라 훑는 글로 — 가장 자주 놓치는 부분]
지금까지 생성된 기사는 문단만 15개씩 이어져 독자가 어디를 봐야 할지 알 수 없었습니다.
아래 문법은 화면에서 실제로 표·차트·목록으로 렌더링됩니다. 내용에 맞을 때 쓰세요.

- 표 — 수치를 나란히 비교할 때. 가격·스펙·전후 비교는 문장이 아니라 표로.
  | 모델 | 입력 $/1M | 출력 $/1M |
  |---|---|---|
  | Gemini 3.8 Flash | 0.75 | 3.75 |

- 막대 차트 — **같은 단위**의 수치 3~5개를 비교할 때만. 한 줄로 씁니다.
  [CHART: benchmark|GPT-5:88|Claude Opus 4.5:86|Gemini 3.8:84]
  단위가 다른 값을 한 차트에 넣지 마세요. "180개국 / 300개사 / 5개 파트너" 처럼
  세는 대상이 다르면 막대 길이 비교가 아무 의미도 없습니다. 그런 경우는 표나
  불릿을 쓰세요. 비교할 축이 하나로 정해지지 않으면 차트를 쓰지 않는 편이 낫습니다.

- 흐름도 — 단계가 있는 과정을 설명할 때. 한 줄로 씁니다.
  [FLOW: agent|데이터 수집|합성 라벨링|정책 학습|실기 배포]

- 목록 — 나열되는 사실 3개 이상은 문단이 아니라 불릿으로.
- 인용 — 원문의 핵심 발언은 "> " 로 시작하는 인용 블록으로.
- **굵게** — 처음 등장하는 핵심 용어와 결정적 수치에만. 남발하면 효과가 사라집니다.
- 소제목 — ## 아래 흐름이 갈리면 ### 를 씁니다. 제목에 번호를 붙이지 마세요.

원칙: 장식이 아니라 정보 구조입니다. 비교할 게 없는데 표를 만들거나, 단계가
아닌 것을 흐름도로 만들지 마세요. 좋은 기술 블로그는 이 요소들을 아껴 씁니다.
표는 1~2개, 차트나 흐름도는 있으면 1개면 충분합니다.
4. "So What?" — 이 내용이 개발자·기업·산업에 미치는 구체적 의미를 반드시 분석하세요.
5. 본문에는 원문에서 확인한 내용만 쓰세요.

[사실과 의견의 분리 — 가장 중요]
독자가 "이건 원문에 있던 사실", "이건 매체 의견"을 구분할 수 있어야 합니다.

- blog_body: 원문 근거가 있는 내용만. 추측·전망·평가를 섞지 마세요.
- key_numbers: 원문에 실제로 나온 수치만. 각 항목에 그 수치가 실린 원문 URL 을
  source_url 로 반드시 다세요. URL 을 댈 수 없는 수치는 **넣지 마세요**.
  원문에 수치가 없으면 빈 배열로 두세요. 지어내면 안 됩니다.
- our_take: 여기에만 의견·전망·평가를 쓰세요. 2~3문장.
- open_questions: 원문으로는 아직 알 수 없는 것을 적으세요. 2~3개.
  "모른다"고 쓰는 것이 추측을 사실처럼 쓰는 것보다 낫습니다.

원문에 없는 수치를 만들어내는 것이 이 작업에서 가장 큰 실패입니다.

[원문 정보]
{combined}

JSON으로만 응답하세요:
{{
  "title": "{title_kind} 한국어 제목 (30자 이내, 키워드 포함)",
  "primary_topic": "대표 핵심 테마 (10자 이내)",
  "tldr": "TL;DR 3~4문장 핵심 요약 (합쇼체)",
  "blog_body": "마크다운 본문 전문 (원문 근거가 있는 내용만, ## 섹션 자유 구성, 표·차트·불릿·인용을 내용에 맞게 사용, 합쇼체)",
  "key_numbers": [{{"label": "지표명", "value": "값", "source_url": "그 수치가 실린 원문 URL"}}],
  "our_take": "편집 의견·전망 2~3문장 (합쇼체)",
  "open_questions": ["원문으로 확인되지 않은 것 2~3개"],
  "developer_tip": "개발자 대상 실무 활용 팁 1문장",
  "pm_tip": "기획자/PM 대상 실전 팁 1문장",
  "business_tip": "비즈니스 리더 대상 TCO/보안/ROI 팁 1문장",
  "tags": ["#태그1", "#태그2", "#태그3", "#태그4"],
  "impact_score": 92
}}"""

def pick_image(cluster):
    """클러스터에서 첫 번째 실제 썸네일을 대표 이미지로 쓴다. 없으면 None."""
    for article in cluster:
        if article.get("image"):
            return article["image"]
    return None


# ─── 기사 ↔ 카탈로그 연결 ────────────────────────────────────────────────────
# 기사에 나온 모델을 자사 카탈로그와 잇는다. LLM 에게 모델 id 를 물어보면 지어낼
# 수 있으므로, 실제 카탈로그의 이름으로 본문을 훑는 결정론적 매칭만 쓴다.
#
# 짧은 이름은 오탐 지뢰다. "o3" 는 본문의 아무 곳에나 걸리고 "GPT-4" 는
# "GPT-4o" 안에도 들어 있다. 최소 길이와 단어 경계, 긴 이름 우선으로 막는다.
MIN_MODEL_NAME = 6
MAX_MENTIONS = 6


# 카탈로그 이름은 "Google: Gemini 3.5 Flash (batch)" 처럼 공급사 접두어와 괄호
# 접미사를 달고 있는데, 기사는 "Gemini 3.5 Flash" 라고만 쓴다. 둘 다 벗긴 별칭을
# 만들어 두지 않으면 카탈로그에 있는 모델도 전부 빗나간다.
PROVIDER_PREFIX = re.compile(r"^[A-Za-z][\w .-]{0,20}:\s*")
PAREN_SUFFIX = re.compile(r"\s*\([^)]*\)\s*$")

# "Fusion", "Weaver", "Uncensored" 같은 한 단어짜리 이름은 산문에서 그대로
# 오탐한다. 숫자도 공백도 하이픈도 없는 이름은 모델 지칭으로 보지 않는다.
SPECIFIC_NAME = re.compile(r"[\d\s-]")


def model_aliases(name):
    """공급사 접두어와 괄호 접미사를 벗긴 변형들. 원본 이름은 포함하지 않는다."""
    found = set()
    for candidate in (name, PROVIDER_PREFIX.sub("", name)):
        for variant in (candidate, PAREN_SUFFIX.sub("", candidate)):
            variant = variant.strip()
            if variant != name and len(variant) >= MIN_MODEL_NAME:
                found.add(variant)
    return found


def load_catalog_names(runner=subprocess.run):
    """D1 에서 (id, name) 을 읽는다. 실패하면 빈 목록 — 매칭을 건너뛴다."""
    try:
        res = runner(
            ["npx", "wrangler", "d1", "execute", "llm-compass-db", "--remote", "--json",
             "--command", "SELECT id, name FROM models WHERE is_deprecated = 0"],
            capture_output=True, text=True,
        )
        out = res.stdout
        data = json.loads(out[out.index("["):])
        rows = [r for blk in data for r in blk.get("results", []) if isinstance(r, dict) and r.get("name")]

        catalog = [(r["id"], r["name"]) for r in rows if len(r["name"]) >= MIN_MODEL_NAME]
        canonical = {name.lower() for _, name in catalog}

        # 같은 별칭이 여러 행에 걸리면(날짜·batch 변형들) 가장 짧은 정식명을 대표로
        # 삼는다. 이미 정식명으로 존재하는 별칭은 그쪽에 맡기고 건너뛴다.
        alias_owner = {}
        for r in rows:
            name = r["name"]
            for alias in model_aliases(name):
                key = alias.lower()
                if key in canonical:
                    continue
                prev = alias_owner.get(key)
                if prev is None or len(name) < prev[1]:
                    alias_owner[key] = (r["id"], len(name), alias)
        merged = catalog + [(mid, alias) for mid, _, alias in alias_owner.values()]
        return [(mid, name) for mid, name in merged if SPECIFIC_NAME.search(name)]
    except Exception as e:
        print(f"  [카탈로그 조회 실패] {e} — 모델 연결을 건너뜁니다")
        return []


def find_mentioned_models(text, catalog):
    """본문에 실제로 등장한 모델 id. 긴 이름을 먼저 잡아 부분 일치를 막는다."""
    if not text or not catalog:
        return []
    low = text.lower()
    hits, taken = [], []
    for mid, name in sorted(catalog, key=lambda x: -len(x[1])):
        n = name.lower()
        idx = low.find(n)
        if idx < 0:
            continue
        # 이미 더 긴 이름이 차지한 구간이면 건너뛴다 (GPT-4 vs GPT-4o)
        if any(a <= idx < b for a, b in taken):
            continue
        # 단어 경계 — 영숫자 한가운데 박힌 것은 우연이다
        before = low[idx - 1] if idx else " "
        after = low[idx + len(n)] if idx + len(n) < len(low) else " "
        if before.isalnum() or after.isalnum():
            continue
        hits.append(mid)
        taken.append((idx, idx + len(n)))
        if len(hits) >= MAX_MENTIONS:
            break
    return hits


def build_insert_sql(report, cluster, report_id, catalog=()):
    sources = json.dumps([{"title": a["source"], "url": a["link"]} for a in cluster])
    tags = json.dumps(report.get("tags", ["#AI트렌드", "#종합리포트"]))
    tldr = report.get("tldr", "")
    key_takeaways = json.dumps([tldr, report.get("developer_tip",""), report.get("pm_tip",""), report.get("business_tip","")])
    matched_lenses = json.dumps(["developer","agent","pm","business","researcher","synthesized"])

    def esc(s):
        return (s or "").replace("'", "''")

    # 원문이 1건뿐인데 "종합 트렌드 리포트" 라고 붙이면 독자를 속이는 라벨이 된다.
    report_type = "🔮 종합 트렌드 리포트" if len(cluster) > 1 else "🔎 심층 리포트"
    image = pick_image(cluster)
    image_sql = f"'{esc(image)}'" if image else "NULL"

    # 프롬프트로 "출처를 대라" 고 지시하는 것만으로는 지켜지지 않는다. 코드에서도
    # 거른다 — source_url 이 없거나 이 클러스터의 원문이 아니면 버린다.
    cluster_urls = {a.get("link", "") for a in cluster}
    numbers = []
    for n in (report.get("key_numbers") or []):
        if not isinstance(n, dict):
            continue
        url = str(n.get("source_url") or "").strip()
        if url and url in cluster_urls and n.get("label") and n.get("value"):
            numbers.append({"label": n["label"], "value": n["value"], "source_url": url})

    # 가격·벤치마크는 저장하지 않는다. 주간 동기화로 값이 바뀌므로 기사 작성 시점에
    # 얼려두면 곧 틀린 값이 된다. id 만 남기고 Worker 가 조회 시점에 조인한다.
    mentioned = json.dumps(
        find_mentioned_models(f"{report.get('title','')} {report.get('blog_body','')}", catalog),
        ensure_ascii=False,
    )

    key_numbers = json.dumps(numbers, ensure_ascii=False)
    our_take = report.get("our_take", "")
    open_q = json.dumps(
        [q for q in (report.get("open_questions") or []) if isinstance(q, str) and q.strip()],
        ensure_ascii=False,
    )

    return (f"INSERT OR REPLACE INTO trend_news "
           f"(id, title, report_type, executive_summary, analytical_deep_dive, key_takeaways, original_sources, tags, matched_lenses, image_url, key_numbers, our_take, open_questions, mentioned_models) VALUES ("
           f"'{esc(report_id)}', '{esc(report.get('title','종합 AI 트렌드 리포트'))}', "
           f"'{report_type}', '{esc(tldr)}', '{esc(report.get('blog_body',''))}', "
           f"'{esc(key_takeaways)}', '{esc(sources)}', '{esc(tags)}', '{esc(matched_lenses)}', {image_sql}, "
           f"'{esc(key_numbers)}', '{esc(our_take)}', '{esc(open_q)}', '{esc(mentioned)}')")


def write_report(sql, runner=subprocess.run):
    result = runner(["npx","wrangler","d1","execute","llm-compass-db","--remote","--command", sql],
        capture_output=True, text=True)
    if result.returncode != 0:
        print("    [D1 Error] report write failed")
        return False
    return True


def save_to_d1(report, cluster):
    report_id = f"synth-{uuid.uuid4().hex[:12]}"
    return write_report(build_insert_sql(report, cluster, report_id))


def run_batch(
    config,
    fetcher=fetch_rss,
    generator=call_llm,
    writer=write_report,
    feeds=RSS_FEEDS,
    body_attacher=attach_bodies,
    catalog_loader=load_catalog_names,
):
    summary = BatchSummary()
    raw_articles = []

    for feed_url in feeds:
        try:
            articles = fetcher(feed_url)
        except Exception:
            summary.failed += 1
            summary.reasons["rss_failure"] += 1
            continue
        raw_articles.extend(articles)

    summary.collected = len(raw_articles)
    accepted_articles, source_reasons = deduplicate_sources(raw_articles)
    summary.reasons.update(source_reasons)
    summary.source_rejected = sum(source_reasons.values())

    # 원문 본문을 확보하고 실패한 기사는 버린다. 요약만으로 쓰면 환각이 된다.
    before_body = len(accepted_articles)
    accepted_articles = body_attacher(accepted_articles)
    dropped_no_body = before_body - len(accepted_articles)
    if dropped_no_body:
        summary.reasons["no_body"] += dropped_no_body

    clusters = cluster_articles(accepted_articles)
    summary.clusters = len(clusters)
    seen_titles: set[str] = set()
    seen_sources: set[str] = set()
    catalog = catalog_loader()   # 회차당 1회만 조회한다

    for cluster in clusters:
        try:
            try:
                report = generator(build_prompt(cluster), config)
            except ContentFiltered:
                # 오탐으로 막힌 기사 하나 때문에 클러스터 전체를 버리지 않는다.
                kept = drop_filtered_articles(cluster, config)
                if not kept:
                    raise
                print(f"  [필터 회피] 차단된 원문 {len(cluster) - len(kept)}건 제외 후 재생성")
                cluster = kept
                report = generator(build_prompt(cluster), config)
            summary.generated += 1
            summary.reasons[f"생성 모델 {report.get('_model', '?')}"] += 1
        except Exception as error:
            # 원인을 삼키면 실패가 늘어도 왜인지 알 수 없다.
            print(f"  [LLM 실패] {type(error).__name__}: {str(error)[:200]}")
            summary.failed += 1
            summary.reasons["llm_failure"] += 1
            continue

        validation = validate_report(report, cluster)
        if not validation.valid:
            summary.report_rejected += 1
            summary.reasons.update(validation.reasons)
            continue
        if is_duplicate_report(report, cluster, seen_titles, seen_sources):
            summary.report_rejected += 1
            summary.reasons["duplicate_report"] += 1
            continue

        report_id = f"synth-{uuid.uuid4().hex[:12]}"
        if writer(build_insert_sql(report, cluster, report_id, catalog)):
            summary.saved += 1
        else:
            summary.failed += 1
            summary.reasons["d1_failure"] += 1

    return summary


def exit_code_for(summary):
    return 0 if summary.saved > 0 else 1


def _print_summary(summary):
    print("\n" + "=" * 60)
    print(
        "📊 배치 요약: "
        f"수집 {summary.collected}, 출처 제외 {summary.source_rejected}, "
        f"클러스터 {summary.clusters}, 생성 {summary.generated}, "
        f"리포트 제외 {summary.report_rejected}, 저장 {summary.saved}, 실패 {summary.failed}"
    )
    for reason, count in sorted(summary.reasons.items()):
        print(f"  - {reason}: {count}")


def main():
    try:
        config = load_config()
    except RuntimeError as error:
        print(f"❌ 설정 오류: {error}")
        return 1

    print("=" * 60)
    print("🚀 종합 트렌드 리포트 생성 파이프라인")
    print("=" * 60)
    summary = run_batch(config)
    _print_summary(summary)
    return exit_code_for(summary)

if __name__ == "__main__":
    raise SystemExit(main())
