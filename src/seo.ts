// 크롤러가 읽을 수 있는 HTML. SPA 는 JS 실행 후에만 본문이 생기는데 AI 크롤러
// (GPTBot·ClaudeBot·PerplexityBot)는 JS 를 실행하지 않아 빈 페이지를 가져갔다.
// 워커가 자산보다 먼저 실행되고 D1 을 쥐고 있으므로 여기서 바로 렌더한다.
//
// 사람과 크롤러에게 같은 HTML 을 준다 — user-agent 로 내용을 바꾸면 클로킹이다.

export const SITE = 'https://llmcompass.azclab.com';
export const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'de', 'fr'] as const;
export type Lang = typeof LANGS[number];

const GA_ID = 'G-KE17316XRS';

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function pickLang(raw: string | null): Lang {
  return (LANGS as readonly string[]).includes(raw || '') ? (raw as Lang) : 'ko';
}

/** description_i18n 에서 언어를 고르고, 없으면 원문으로 떨어진다. */
export function localized(row: any, lang: Lang): string {
  try {
    const v = JSON.parse(row?.description_i18n || '{}')?.[lang];
    if (typeof v === 'string' && v.trim()) return v;
  } catch { /* 원문 폴백 */ }
  return row?.description || '';
}

const T: Record<Lang, Record<string, string>> = {
  ko: { provider: '프로바이더', tier: '등급', ctx: '컨텍스트 윈도우', out: '최대 출력', license: '라이선스',
        pricing: '' + 'API 가격 (100만 토큰당)', input: '입력', output: '출력', bench: '벤치마크',
        openApp: '전체 카탈로그에서 비교하기', updated: '갱신', tokens: '토큰', home: 'LLM COMPASS',
        allModels: '전체 모델', news: 'AI 트렌드 뉴스', source: '출처', backHome: '카탈로그로', mentioned: '기사에 언급된 모델', figures: '확인된 수치', ourTake: '우리 관점', openQ: '아직 확인되지 않은 것', changelog: '업데이트 노트', changesIn: '이번 기간 변경', allUpdates: '전체 업데이트', deprecated: '지원 중단', deprecatedNote: '이 모델은 더 이상 제공되지 않습니다. 아래 정보는 마지막으로 확인된 시점의 값입니다.' },
  en: { provider: 'Provider', tier: 'Tier', ctx: 'Context window', out: 'Max output', license: 'License',
        pricing: 'API pricing (per 1M tokens)', input: 'Input', output: 'Output', bench: 'Benchmarks',
        openApp: 'Compare in the full catalog', updated: 'Updated', tokens: 'tokens', home: 'LLM COMPASS',
        allModels: 'All models', news: 'AI trend news', source: 'Source', backHome: 'Back to catalog', mentioned: 'Models mentioned', figures: 'Verified figures', ourTake: 'Our take', openQ: 'Open questions', changelog: 'Update notes', changesIn: 'Changes in this period', allUpdates: 'All updates', deprecated: 'Discontinued', deprecatedNote: 'This model is no longer offered. The figures below are from the last time it was confirmed.' },
  ja: { provider: 'プロバイダー', tier: 'ティア', ctx: 'コンテキスト長', out: '最大出力', license: 'ライセンス',
        pricing: 'API 料金 (100万トークンあたり)', input: '入力', output: '出力', bench: 'ベンチマーク',
        openApp: 'カタログ全体で比較する', updated: '更新', tokens: 'トークン', home: 'LLM COMPASS',
        allModels: '全モデル', news: 'AIトレンドニュース', source: '出典', backHome: 'カタログへ', mentioned: '記事で言及されたモデル', figures: '確認された数値', ourTake: '編集部の見解', openQ: '未確認の点', changelog: 'アップデートノート', changesIn: 'この期間の変更', allUpdates: 'すべての更新', deprecated: '提供終了', deprecatedNote: 'このモデルは現在提供されていません。以下は最後に確認された時点の値です。' },
  zh: { provider: '供应商', tier: '等级', ctx: '上下文窗口', out: '最大输出', license: '许可',
        pricing: 'API 价格（每百万 token）', input: '输入', output: '输出', bench: '基准测试',
        openApp: '在完整目录中比较', updated: '更新', tokens: 'token', home: 'LLM COMPASS',
        allModels: '全部模型', news: 'AI 趋势新闻', source: '来源', backHome: '返回目录', mentioned: '文中提及的模型', figures: '已核实数据', ourTake: '我们的观点', openQ: '尚未确认', changelog: '更新说明', changesIn: '本期变更', allUpdates: '全部更新', deprecated: '已停止提供', deprecatedNote: '该模型已不再提供。以下为最后一次确认时的数据。' },
  es: { provider: 'Proveedor', tier: 'Nivel', ctx: 'Ventana de contexto', out: 'Salida máxima', license: 'Licencia',
        pricing: 'Precio de API (por 1M de tokens)', input: 'Entrada', output: 'Salida', bench: 'Benchmarks',
        openApp: 'Comparar en el catálogo completo', updated: 'Actualizado', tokens: 'tokens', home: 'LLM COMPASS',
        allModels: 'Todos los modelos', news: 'Noticias de IA', source: 'Fuente', backHome: 'Volver al catálogo', mentioned: 'Modelos mencionados', figures: 'Cifras verificadas', ourTake: 'Nuestra opinión', openQ: 'Preguntas abiertas', changelog: 'Notas de actualización', changesIn: 'Cambios del periodo', allUpdates: 'Todas las actualizaciones', deprecated: 'Descontinuado', deprecatedNote: 'Este modelo ya no se ofrece. Los datos siguientes corresponden a la última confirmación.' },
  de: { provider: 'Anbieter', tier: 'Stufe', ctx: 'Kontextfenster', out: 'Max. Ausgabe', license: 'Lizenz',
        pricing: 'API-Preis (pro 1 Mio. Tokens)', input: 'Eingabe', output: 'Ausgabe', bench: 'Benchmarks',
        openApp: 'Im vollständigen Katalog vergleichen', updated: 'Aktualisiert', tokens: 'Tokens', home: 'LLM COMPASS',
        allModels: 'Alle Modelle', news: 'KI-Trendnachrichten', source: 'Quelle', backHome: 'Zurück zum Katalog', mentioned: 'Erwähnte Modelle', figures: 'Belegte Zahlen', ourTake: 'Unsere Einschätzung', openQ: 'Offene Fragen', changelog: 'Update-Notizen', changesIn: 'Änderungen im Zeitraum', allUpdates: 'Alle Updates', deprecated: 'Eingestellt', deprecatedNote: 'Dieses Modell wird nicht mehr angeboten. Die Angaben stammen von der letzten Bestätigung.' },
  fr: { provider: 'Fournisseur', tier: 'Niveau', ctx: 'Fenêtre de contexte', out: 'Sortie max.', license: 'Licence',
        pricing: 'Tarif API (par million de tokens)', input: 'Entrée', output: 'Sortie', bench: 'Benchmarks',
        openApp: 'Comparer dans le catalogue complet', updated: 'Mis à jour', tokens: 'tokens', home: 'LLM COMPASS',
        allModels: 'Tous les modèles', news: 'Actualités IA', source: 'Source', backHome: 'Retour au catalogue', mentioned: 'Modèles mentionnés', figures: 'Chiffres vérifiés', ourTake: 'Notre avis', openQ: 'Questions ouvertes', changelog: 'Notes de mise à jour', changesIn: 'Changements de la période', allUpdates: 'Toutes les mises à jour', deprecated: 'Abandonné', deprecatedNote: 'Ce modèle n’est plus proposé. Les données ci-dessous datent de la dernière vérification.' },
};

const STYLE = `
:root{--bg:#f8fafc;--fg:#0f172a;--muted:#475569;--rule:#cbd5e1;--card:#fff;--accent:#0e7490}
@media(prefers-color-scheme:dark){:root{--bg:#020617;--fg:#e2e8f0;--muted:#94a3b8;--rule:#1e293b;--card:#0f172a;--accent:#22d3ee}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif}
.wrap{max-width:52rem;margin:0 auto;padding:2rem 1.25rem 4rem}
nav{font-size:.85rem;color:var(--muted);margin-bottom:2rem}
nav a{color:var(--accent);text-decoration:none}nav a:hover{text-decoration:underline}
h1{font-size:clamp(1.6rem,4.5vw,2.4rem);line-height:1.15;letter-spacing:-.02em;margin:0 0 .75rem}
.lede{font-size:1.05rem;color:var(--muted);margin:0 0 2rem;max-width:38rem}
h2{font-size:1.05rem;letter-spacing:.02em;text-transform:uppercase;color:var(--muted);margin:2.25rem 0 .75rem;font-weight:600}
table{border-collapse:collapse;width:100%;font-size:.95rem;background:var(--card);border:1px solid var(--rule)}
th,td{text-align:left;padding:.6rem .85rem;border-bottom:1px solid var(--rule)}
th{width:38%;font-weight:600;color:var(--muted)}
tr:last-child th,tr:last-child td{border-bottom:none}
.tbl-scroll{overflow-x:auto}
.numbers{margin:1.25rem 0;border:1px solid var(--rule);background:var(--card)}
.numbers li{list-style:none;padding:.55rem .9rem;border-bottom:1px solid var(--rule);font-size:.92rem}
.numbers li:last-child{border-bottom:none}
.numbers ul{margin:0;padding:0}
.numbers b{font-variant-numeric:tabular-nums}
.take{margin:1.5rem 0;padding:1rem 1.15rem;border-left:3px solid var(--accent);background:var(--card)}
.take h2{margin-top:0}
.openq{margin:1.25rem 0;color:var(--muted);font-size:.92rem}
.cta{display:inline-block;margin-top:2.25rem;padding:.65rem 1.1rem;background:var(--accent);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem}
article p{max-width:38rem}
footer{margin-top:3rem;padding-top:1.25rem;border-top:1px solid var(--rule);font-size:.8rem;color:var(--muted)}
footer a{color:var(--accent)}
`;

interface PageOpts {
  lang: Lang; title: string; description: string; path: string;
  jsonLd?: object; body: string; image?: string; noindex?: boolean;
}

function shell(o: PageOpts): string {
  const canonical = `${SITE}${o.path}`;
  const alts = LANGS.map((l) =>
    `<link rel="alternate" hreflang="${l}" href="${esc(canonical)}${canonical.includes('?') ? '&' : '?'}lang=${l}">`
  ).join('\n    ');
  return `<!doctype html>
<html lang="${o.lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}">
    <link rel="canonical" href="${esc(canonical)}">
    ${o.noindex ? '<meta name="robots" content="noindex, follow">' : ''}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    ${alts}
    <link rel="alternate" hreflang="x-default" href="${esc(canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="LLM COMPASS">
    <meta property="og:title" content="${esc(o.title)}">
    <meta property="og:description" content="${esc(o.description)}">
    <meta property="og:url" content="${esc(canonical)}">
    ${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ''}
    <meta name="twitter:card" content="${o.image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${esc(o.title)}">
    <meta name="twitter:description" content="${esc(o.description)}">
    ${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd)}</script>` : ''}
    <style>${STYLE}</style>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  </head>
  <body>
    <div class="wrap">${o.body}</div>
  </body>
</html>`;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US') : null);

function json(v: unknown, fallback: any = {}) {
  if (typeof v !== 'string') return v ?? fallback;
  try { return JSON.parse(v || 'null') ?? fallback; } catch { return fallback; }
}

export function modelPage(m: any, lang: Lang): string {
  const t = T[lang];
  const price = json(m.api_pricing);
  const bench = json(m.benchmarks);
  const desc = localized(m, lang) || `${m.name} — ${m.provider_name}`;
  const inP = typeof price?.input_price_per_1m === 'number' ? `$${price.input_price_per_1m}` : null;
  const outP = typeof price?.output_price_per_1m === 'number' ? `$${price.output_price_per_1m}` : null;

  // AI 답변에 인용되는 건 표가 아니라 문장이다. 사실만 담은 한 문단을 맨 위에 둔다.
  const facts = [
    `${m.name} — ${m.provider_name}.`,
    m.context_window ? `${t.ctx} ${num(m.context_window)} ${t.tokens}.` : '',
    inP && outP ? `${t.pricing}: ${t.input} ${inP}, ${t.output} ${outP}.` : '',
    m.license_type ? `${t.license}: ${m.license_type}.` : '',
  ].filter(Boolean).join(' ');

  const rows: Array<[string, string | null]> = [
    [t.provider, m.provider_name],
    [t.tier, m.tier],
    [t.ctx, m.context_window ? `${num(m.context_window)} ${t.tokens}` : null],
    [t.out, m.max_output_tokens ? `${num(m.max_output_tokens)} ${t.tokens}` : null],
    [t.license, m.license_type],
    [`${t.pricing} · ${t.input}`, inP],
    [`${t.pricing} · ${t.output}`, outP],
    // MMLU-Pro·SWE-bench 는 신선한 공개 수집원이 없어 동기화가 비운다. 행을 두지 않는다.
    ['LMArena', bench?.arena_elo != null ? `${num(bench.arena_elo)}${bench.arena_variant ? ` (${bench.arena_variant})` : ''}` : null],
    ['GPQA Diamond', bench?.gpqa != null ? `${bench.gpqa}%` : null],
  ];
  // CC-BY 4.0 출처 표기 의무. 값이 하나라도 있을 때만 붙인다.
  const benchSource = bench?.arena_elo != null || bench?.gpqa != null
    ? `<p style="font-size:.8em;color:var(--muted)">LMArena (CC-BY 4.0, best reasoning setting${bench?.asof?.arena ? `, ${esc(bench.asof.arena)}` : ''}) · GPQA Diamond: Epoch AI (CC-BY 4.0)</p>`
    : '';

  const deprecated = Boolean(m.is_deprecated);
  const body = `
    <nav><a href="/?lang=${lang}">${t.home}</a> › <a href="/?tab=dashboard&amp;lang=${lang}">${t.allModels}</a></nav>
    <h1>${esc(m.name)}${deprecated ? ` <span style="font-size:.5em;vertical-align:middle;color:#b45309">(${esc(t.deprecated)})</span>` : ''}</h1>
    ${deprecated ? `<p style="border-left:3px solid #b45309;padding-left:.9rem;color:var(--muted)">${esc(t.deprecatedNote)}</p>` : ''}
    <p class="lede">${esc(desc)}</p>
    <p>${esc(facts)}</p>
    <h2>${esc(t.bench)} · ${esc(t.pricing)}</h2>
    <div class="tbl-scroll"><table><tbody>
      ${rows.filter(([, v]) => v).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n      ')}
    </tbody></table></div>
    ${benchSource}
    <a class="cta" href="/?tab=dashboard&amp;lang=${lang}">${esc(t.openApp)}</a>
    <footer>${esc(t.updated)}: ${esc((m.updated_at || '').slice(0, 10))} · <a href="/sitemap.xml">sitemap</a></footer>`;

  const jsonLd: any = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: m.name, description: desc, category: 'Large Language Model',
    brand: { '@type': 'Brand', name: m.provider_name },
    url: `${SITE}/models/${m.id}`,
  };
  if (typeof price?.input_price_per_1m === 'number') {
    jsonLd.offers = {
      '@type': 'Offer', priceCurrency: price.currency || 'USD',
      price: price.input_price_per_1m,
      description: `${t.input} / 1M ${t.tokens}`,
      availability: 'https://schema.org/InStock',
    };
  }

  return shell({
    lang, path: `/models/${m.id}`, body, jsonLd, noindex: deprecated,
    title: `${m.name} — ${t.pricing.replace(/\s*\(.*\)/, '')} · ${m.provider_name} | LLM COMPASS`,
    description: facts.slice(0, 300),
  });
}

// 기사 본문의 마크다운을 크롤러가 읽을 HTML 로 바꾼다.
//
// 예전에는 빈 줄로 잘라 전부 <p> 로 감싸고 12블록만 내보냈다. 본문이 문단뿐일
// 때는 그럭저럭이었지만, 표·불릿·인용을 쓰기 시작하자 파이프 문자와
// [CHART:...] 가 날것으로 노출됐다. 화면(SPA)과 크롤러가 같은 본문을 서로 다르게
// 보면 안 된다.
//
// 프론트(NewsDetailView.tsx)가 파싱하는 문법과 같은 것을 다룬다. 다만 차트·흐름도는
// 크롤러에게 막대 그래프가 의미 없으므로 목록과 표로 평평하게 편다.
function inline(text: string): string {
  // esc 를 먼저 걸고, 그 위에서 **굵게** 만 태그로 되돌린다. 순서를 바꾸면
  // 사용자 입력이 그대로 HTML 이 된다.
  return esc(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderBody(md: string): string {
  const lines = (md || '').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    // 표: | 로 시작하는 연속 줄. |---| 구분줄은 버린다.
    if (t.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const raw = lines[i].trim();
        if (!/^\|[\s:|-]+\|$/.test(raw)) {
          rows.push(raw.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        }
        i++;
      }
      if (rows.length) {
        const [head, ...body] = rows;
        out.push(
          `<div class="tbl-scroll"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
          `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        );
      }
      continue;
    }

    // 차트: [CHART: 유형|라벨:값|...] — 막대 대신 표로 편다.
    if (t.startsWith('[CHART:')) {
      const parts = t.slice(7, -1).split('|').map((x) => x.trim());
      const pairs = parts.slice(1).map((x) => {
        const idx = x.lastIndexOf(':');
        return idx < 0 ? [x, ''] : [x.slice(0, idx).trim(), x.slice(idx + 1).trim()];
      });
      out.push(`<div class="tbl-scroll"><table><tbody>${pairs.map(
        ([k, v]) => `<tr><td>${inline(k)}</td><td>${inline(v)}</td></tr>`).join('')}</tbody></table></div>`);
      i++; continue;
    }

    // 흐름도: [FLOW: 유형|단계|단계] — 순서 있는 목록으로 편다.
    if (t.startsWith('[FLOW:')) {
      const steps = t.slice(6, -1).split('|').map((x) => x.trim()).slice(1);
      out.push(`<ol>${steps.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`);
      i++; continue;
    }

    // 불릿
    if (/^[-*]\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      continue;
    }

    // 인용
    if (t.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quote.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    // 제목
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length + 1, 4);   // ## → h3, 본문 h2 와 겹치지 않게
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    // 문단: 빈 줄이나 블록 문법을 만날 때까지 이어 붙인다.
    const para: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (!cur || cur.startsWith('|') || cur.startsWith('> ') || /^[-*]\s/.test(cur)
          || cur.startsWith('[CHART:') || cur.startsWith('[FLOW:') || /^#{2,4}\s/.test(cur)) break;
      para.push(cur);
      i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
  }

  return out.join('\n    ');
}

export function newsPage(n: any, lang: Lang): string {
  const t = T[lang];
  const takeaways: string[] = json(n.key_takeaways, []);
  const sources: any[] = json(n.original_sources, []);
  const summary = (Array.isArray(takeaways) && takeaways[0]) || n.executive_summary || n.title;
  const bodyText = (n.analytical_deep_dive || n.executive_summary || '').trim();
  const numbers = json(n.key_numbers, []);
  const openQ = json(n.open_questions, []);
  const mentioned = Array.isArray(n.mentioned_models) ? n.mentioned_models : [];

  const paragraphs = renderBody(bodyText);

  const body = `
    <nav><a href="/?lang=${lang}">${t.home}</a> › <a href="/?tab=news&amp;lang=${lang}">${t.news}</a></nav>
    <h1>${esc(n.title)}</h1>
    <p class="lede">${esc(summary)}</p>
    <article>${paragraphs}</article>
    ${numbers.length ? `<h2>${esc(t.figures)}</h2><div class="numbers"><ul>${numbers.map((k: any) =>
      `<li>${esc(k.label)} — <b>${esc(k.value)}</b> <a href="${esc(k.source_url)}" rel="nofollow noopener">출처</a></li>`).join('')}</ul></div>` : ''}
    ${n.our_take ? `<div class="take"><h2>${esc(t.ourTake)}</h2><p>${esc(n.our_take)}</p></div>` : ''}
    ${openQ.length ? `<div class="openq"><h2>${esc(t.openQ)}</h2><ul>${openQ.map((q: string) =>
      `<li>${esc(q)}</li>`).join('')}</ul></div>` : ''}
    ${mentioned.length ? `<h2>${esc(t.mentioned)}</h2><div class="tbl-scroll"><table><thead><tr>
      <th>${esc(t.provider)}</th><th>${esc(t.input)}</th><th>${esc(t.output)}</th><th>${esc(t.ctx)}</th></tr></thead><tbody>
      ${mentioned.map((m: any) => `<tr><td><a href="/models/${esc(m.id)}?lang=${lang}">${esc(m.name)}</a> · ${esc(m.provider_name)}</td>` +
        `<td>${m.api_pricing?.input_price_per_1m != null ? '$' + esc(m.api_pricing.input_price_per_1m) : '—'}</td>` +
        `<td>${m.api_pricing?.output_price_per_1m != null ? '$' + esc(m.api_pricing.output_price_per_1m) : '—'}</td>` +
        `<td>${m.context_window ? esc(Number(m.context_window).toLocaleString('en-US')) : '—'}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    ${sources.length ? `<h2>${esc(t.source)}</h2><ul>${sources.slice(0, 8).map((s: any) =>
      `<li><a href="${esc(s.url || '#')}" rel="nofollow noopener">${esc(s.title || s.name || s.url)}</a></li>`).join('')}</ul>` : ''}
    <a class="cta" href="/?tab=news&amp;article=${esc(n.id)}&amp;lang=${lang}">${esc(t.backHome)}</a>
    <footer>${esc(t.updated)}: ${esc((n.created_at || '').slice(0, 10))} · <a href="/sitemap.xml">sitemap</a></footer>`;

  return shell({
    lang, path: `/news/${n.id}`, body,
    title: `${n.title} | LLM COMPASS`,
    description: String(summary).slice(0, 300),
    image: n.image_url || undefined,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: n.title, description: String(summary).slice(0, 300),
      datePublished: n.created_at, dateModified: n.created_at,
      url: `${SITE}/news/${n.id}`,
      publisher: { '@type': 'Organization', name: 'LLM COMPASS', url: SITE },
    },
  });
}

export function changelogPage(c: any, lang: Lang): string {
  const t = T[lang];
  const items: Array<{ category?: string; text: string }> = json(c.items, []);
  const body = `
    <nav><a href="/?lang=${lang}">${t.home}</a> › <a href="/changelog?lang=${lang}">${t.changelog}</a></nav>
    <h1>${esc(c.title)}</h1>
    <p class="lede">${esc(c.summary)}</p>
    <h2>${esc(t.changesIn)} · ${esc(c.period_start)} ~ ${esc(c.period_end)}</h2>
    <ul>${items.map((i) =>
      `<li>${i.category ? `<strong>${esc(i.category)}</strong> — ` : ''}${esc(i.text)}</li>`).join('\n      ')}</ul>
    <a class="cta" href="/?lang=${lang}">${esc(t.openApp)}</a>
    <footer>${esc(t.updated)}: ${esc((c.created_at || '').slice(0, 10))} · <a href="/changelog?lang=${lang}">${esc(t.allUpdates)}</a> · <a href="/sitemap.xml">sitemap</a></footer>`;

  return shell({
    lang, path: `/changelog/${c.id}`, body,
    title: `${c.title} — ${t.changelog} | LLM COMPASS`,
    description: String(c.summary).slice(0, 300),
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: c.title, description: String(c.summary).slice(0, 300),
      datePublished: c.created_at, dateModified: c.created_at,
      url: `${SITE}/changelog/${c.id}`,
      publisher: { '@type': 'Organization', name: 'LLM COMPASS', url: SITE },
    },
  });
}

// 홈과 탭 URL 은 SPA 껍데기라 크롤러에게 텍스트 50자만 보였다. 사이트맵에서
// 우선순위 1.0 인 홈이 여기 포함돼, 색인 가치가 가장 큰 URL 이 비어 있었다.
// 여기서는 카탈로그 규모·주요 모델·최신 기사를 실제 텍스트로 내려준다.
// 기존 T 라벨만 조합해 쓴다 — 7개 언어에 새 문구를 추가하면 번역 누락이 생긴다.
export function homePage(
  stats: { models: number; providers: number; news: number },
  topModels: any[],
  latestNews: any[],
  lang: Lang,
): string {
  const t = T[lang];
  const tabs = ['dashboard', 'compare', 'tco', 'advisor', 'leaderboard', 'gpus', 'news', 'sandbox', 'speed', 'tutorial'];
  const body = `
    <h1>LLM COMPASS</h1>
    <p class="lede">${stats.models} ${esc(t.allModels)} · ${stats.providers} ${esc(t.provider)} · ${stats.news} ${esc(t.news)}</p>

    <h2>${esc(t.allModels)}</h2>
    <table><tr><th>${esc(t.home)}</th><th>${esc(t.provider)}</th><th>${esc(t.ctx)}</th></tr>
    ${topModels.map((m: any) =>
      `<tr><td><a href="/models/${esc(m.id)}?lang=${lang}">${esc(m.name)}</a></td>` +
      `<td>${esc(m.provider_name || '')}</td><td>${m.context_window ? Number(m.context_window).toLocaleString('en-US') : '-'}</td></tr>`
    ).join('\n    ')}</table>

    <h2>${esc(t.news)}</h2>
    <ul>${latestNews.map((n: any) =>
      `<li><a href="/news/${esc(n.id)}?lang=${lang}">${esc(n.title)}</a></li>`
    ).join('\n      ')}</ul>

    <nav>${tabs.map((tab) => `<a href="/?tab=${tab}&amp;lang=${lang}">${esc(tab)}</a>`).join(' · ')}</nav>
    <footer><a href="/changelog?lang=${lang}">${esc(t.changelog)}</a> · <a href="/sitemap.xml">sitemap</a> · <a href="/llms.txt">llms.txt</a></footer>`;

  return shell({
    lang, path: '/', body,
    title: 'LLM COMPASS - Global AI Model Spec & TCO Analytics',
    description: `${stats.models} ${t.allModels} · ${stats.providers} ${t.provider} · ${t.pricing}`,
  });
}

export function changelogIndex(rows: any[], lang: Lang): string {
  const t = T[lang];
  const body = `
    <nav><a href="/?lang=${lang}">${t.home}</a> › ${esc(t.changelog)}</nav>
    <h1>${esc(t.changelog)}</h1>
    <p class="lede">${esc(t.allUpdates)}</p>
    <ul>${rows.map((r) =>
      `<li><a href="/changelog/${esc(r.id)}?lang=${lang}">${esc(r.title)}</a> <span style="color:var(--muted)">— ${esc(r.period_end)}</span></li>`
    ).join('\n      ')}</ul>
    <footer><a href="/sitemap.xml">sitemap</a></footer>`;

  return shell({
    lang, path: '/changelog', body,
    title: `${t.changelog} | LLM COMPASS`,
    description: `LLM COMPASS ${t.allUpdates}`,
  });
}

export function sitemap(modelIds: string[], newsIds: string[], changelogIds: string[] = []): string {
  const urls: string[] = [];
  const push = (loc: string, priority: string, freq: string) => {
    // 탭 URL 은 이미 ?tab=... 을 달고 있다. 무조건 '?' 를 붙이면
    // "?tab=dashboard?lang=ko" 같은 무효 URL 이 나와 GSC 가 hreflang 오류로 잡는다.
    const sep = loc.includes('?') ? '&amp;' : '?';
    const alts = LANGS.map((l) =>
      `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${loc}${sep}lang=${l}"/>`).join('');
    // 언어를 지정하지 않은 방문자가 어디로 가야 하는지 검색엔진에 알린다.
    const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${loc}"/>`;
    urls.push(`<url><loc>${SITE}${loc}</loc><changefreq>${freq}</changefreq><priority>${priority}</priority>${alts}${xDefault}</url>`);
  };
  push('/', '1.0', 'daily');
  // 탭 URL(?tab=...)은 사이트맵에 넣지 않는다. SPA 의 클라이언트 뷰라 서버가
  // 홈과 똑같은 HTML 을 돌려주고 canonical 도 '/' 를 가리킨다. 사이트맵은
  // "색인해라", canonical 은 "얘는 홈이다" 라고 말하는 모순이라 GSC 가
  // "중복 페이지, Google이 다른 표준 페이지 선택" 으로 잡는다. 크롤링 예산도
  // 낭비된다. 홈의 <nav> 링크로 발견되고 canonical 로 홈에 합쳐지면 충분하다.
  for (const id of modelIds) push(`/models/${id}`, '0.8', 'weekly');
  for (const id of newsIds) push(`/news/${id}`, '0.6', 'monthly');
  if (changelogIds.length) push('/changelog', '0.7', 'weekly');
  for (const id of changelogIds) push(`/changelog/${id}`, '0.5', 'monthly');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

export function robots(): string {
  return `# LLM COMPASS
# AI 크롤러를 포함해 전면 허용한다. 이 사이트의 가치는 인용되는 데 있다.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/v1/admin

Sitemap: ${SITE}/sitemap.xml
`;
}

export function llmsTxt(modelCount: number, newsCount: number, providerCount: number): string {
  return `# LLM COMPASS

> ${modelCount}개 AI 언어모델의 API 가격·컨텍스트 길이·벤치마크 점수를 ${providerCount}개 프로바이더에 걸쳐 비교하는 레퍼런스. 자체 호스팅과 상용 API의 총소유비용(TCO)을 실제 GPU 단가로 계산한다. 모델 카탈로그는 매주, AI 트렌드 뉴스는 매일 갱신된다.

한국어·영어·일본어·중국어·스페인어·독일어·프랑스어를 지원하며, 각 페이지에 \`?lang=\` 을 붙이면 해당 언어로 반환된다.

## 데이터
- [전체 모델 카탈로그](${SITE}/?tab=dashboard): ${modelCount}개 모델의 가격·스펙·벤치마크
- [모델 상세](${SITE}/models/{model_id}): 모델별 가격표와 사양. id 목록은 sitemap 참조
- [벤치마크 리더보드](${SITE}/?tab=leaderboard): Arena ELO·MMLU-Pro·GPQA·SWE-bench
- [GPU 사양·클라우드 단가](${SITE}/?tab=gpus): VRAM·대역폭·시간당 임대료
- [TCO 시뮬레이터](${SITE}/?tab=tco): 트래픽 기준 API 대 자체 호스팅 비용 비교

## 뉴스
- [AI 트렌드 뉴스](${SITE}/?tab=news): ${newsCount}건의 분석 리포트, 매일 갱신
- [기사 상세](${SITE}/news/{article_id}): id 목록은 sitemap 참조

## 기계 판독용
- [sitemap.xml](${SITE}/sitemap.xml): 전체 URL 과 언어별 대체 링크
- [모델 API](${SITE}/api/v1/models): JSON. \`?lang=\` 지원
- [뉴스 API](${SITE}/api/v1/news/pulse): JSON
`;
}


// ─── 크롤러 식별 ──────────────────────────────────────────────────────────────
// 목적은 차단이 아니라 관측이다. "문을 열었는데 실제로 들어오고 있나" 를 본다.
// User-Agent 는 위조 가능하므로 이 수치는 정확한 감사 기록이 아니라 추세 지표다.
const BOTS: Array<[string, RegExp]> = [
  ['GPTBot',        /GPTBot/i],
  ['OAI-SearchBot', /OAI-SearchBot/i],
  ['ChatGPT-User',  /ChatGPT-User/i],
  ['ClaudeBot',     /ClaudeBot|Claude-Web|anthropic-ai/i],
  ['PerplexityBot', /PerplexityBot|Perplexity-User/i],
  ['Google-Extended', /Google-Extended/i],
  ['Googlebot',     /Googlebot/i],
  ['Bingbot',       /bingbot/i],
  ['Applebot',      /Applebot/i],
  ['Bytespider',    /Bytespider/i],
  ['Amazonbot',     /Amazonbot/i],
  ['MetaBot',       /meta-externalagent|FacebookBot/i],
  ['CCBot',         /CCBot/i],
  ['YandexBot',     /YandexBot/i],
  ['DuckDuckBot',   /DuckDuckBot/i],
];

export function classifyBot(ua: string | null): string | null {
  if (!ua) return null;
  for (const [name, re] of BOTS) if (re.test(ua)) return name;
  return null;
}
