# StockFrame Frontend Specification

Status: Implementation specification  
Scope: Homepage, analysis flow, and research report experience  
Language: Bahasa Indonesia  
Target: Next.js App Router on Vercel

## 1. Product intent

StockFrame is an Indonesian equity-research and education experience. The frontend must introduce a way of reading a company before asking the visitor to run an analysis.

The page is not a conventional SaaS landing page. It must not lead with a generic dashboard window, pricing-style cards, social proof, customer logos, or repeated “try now” calls to action. StockFrame has no accounts, subscriptions, testimonials, watchlists, or collaboration features, so the interface must not imply them.

The intended first impression is:

> StockFrame helps me understand how company data becomes a cautious, traceable research narrative.

The analysis tool is the proof of that identity. It is not the identity itself.

## 2. Users and visitor mode

Primary users:

- students learning fundamental analysis;
- beginner investors who need a structured reading path;
- financial advisers using the page as a supporting research surface.

The homepage begins in **Read/Persuade mode**: visitors understand the product, its method, and its limitations. It transitions into **Operate mode** only after the visitor enters the research desk and starts an analysis.

Success means a first-time visitor can answer these questions before submitting anything:

1. What is StockFrame?
2. What data does it use?
3. What is calculated by the engine?
4. What does AI do and not do?
5. Why are there three risk perspectives?
6. How do I start reading a company?

## 3. Locked product boundaries

- One public page.
- No login, account, database, history, watchlist, payment, pricing, or onboarding flow.
- One active analysis at a time.
- `POST /api/analyze` is the only analysis API used by the browser.
- Business Quant and Gemini credentials remain server-side.
- The browser never calls providers directly.
- All primary interface copy is Bahasa Indonesia.
- Historical price data is not a forecast.
- The UI never shows target prices, future-price projections, trade instructions, guaranteed returns, or personalized position sizing.
- AI interpretation must remain visually distinct from market data and deterministic engine output.
- Illustrative values must be explicitly labeled `Contoh`, `Ilustrasi`, or `Data contoh`.

## 4. Experience thesis

### 4.1 Creative direction

The visual world is **Black Frame / Lime Signal**: bold contemporary fintech branding for the introduction, translated into a calmer research workspace after analysis. It is not a pale editorial report, generic SaaS template, brokerage interface, or trading terminal.

The recurring identity is a lime signal line passing through layers of evidence:

- a strong frame-shaped mark and one continuous signal line connect brand, data, calculation, and interpretation;
- near-black, acid lime, deep forest, and warm paper create the primary material system;
- lime owns large fields in the persuasive introduction but becomes a restrained state and emphasis color in the operational report;
- oversized bold typography carries the homepage identity, while the report uses a compact workhorse sans-serif hierarchy;
- layered evidence sheets may dramatize the mechanism in the hero without imitating a browser or dashboard screenshot;
- dense data appears only after the visitor intentionally enters the research workspace;
- the visual rhythm moves from high-impact brand introduction to structured, low-fatigue research.

Locked palette roles:

- signal lime `#C6FF00` — brand field, primary action, active selection, and key signal;
- near black `#080A08` — primary shell and dominant text;
- deep forest `#132510` — secondary dark surface;
- warm white `#F5F5EE` — reading surface and AI conclusion sheet;
- muted gray `#A4AA9E` — secondary copy and inactive states;
- semantic colors remain separate from decorative lime and always include text or icon labels.

The page should feel authored specifically for StockFrame. Removing the logo and replacing the copy must not make it suitable for a generic analytics, productivity, banking, or AI SaaS product.

### 4.2 Tone

- bold, credible, educational, and precise;
- confident without claiming certainty;
- visually energetic in the introduction and calm in the report;
- modern without decorative futurism or trading hype;
- accessible to beginners without hiding evidence from professionals.

### 4.3 Explicit visual anti-goals

Do not use:

- a hero made from headline + analysis form + generic dashboard window;
- a generic “trusted by” logo strip;
- equal icon-heading-description feature cards;
- pricing-card visual language for risk profiles;
- testimonial blocks or fabricated performance claims;
- lime used as an indiscriminate glow, cyberpunk HUD, or trading-terminal effect;
- excessive glassmorphism, gradient text, ornamental blur, or grid-pattern backgrounds;
- excessive rounded cards or cards nested inside cards;
- stock photos of traders, offices, or people looking at charts;
- charts that imply unsupported forecasts;
- decorative tickers or live-market claims when the values are fixtures.

## 5. Information architecture

The page uses one continuous route with two conceptual acts.

### Act I — Introduction

#### A. Minimal navigation

Content:

- StockFrame identity;
- `Tentang` anchor;
- `Metodologi` anchor;
- `Mulai riset` action.

The navigation must not resemble an enterprise product menu. No Products, Solutions, Customers, Pricing, Resources, Login, or Sign up items.

#### B. Identity hero

Purpose: establish what StockFrame believes and why it exists.

Required content:

- one distinctive, concise statement such as `Riset saham. Pahami perusahaannya.`;
- a short explanation of StockFrame as an educational research aid;
- one clear primary action that leads to the research desk and one quieter methodology link;
- a product-specific layered evidence artifact built from the frame, signal line, company sheet, a small number of readable metrics, and one interpretation fragment.

The hero must not contain the analysis form. The visual artifact must not look like a browser-window dashboard screenshot, dense chart, or technical report. Its purpose is to dramatize the StockFrame mechanism, not preview every report feature.

#### C. Positioning statement

Communicate the product boundary directly:

> Bukan menebak harga. Membantu membaca alasannya.

This statement occupies a committed lime field with large near-black typography. It is not a warning banner; it is the main brand manifesto.

#### D. Methodology narrative

Explain the three layers in one connected reading flow:

1. **Data** — company profile, financial statements, one-year closing prices, and Corporate Actions.
2. **Engine** — sixteen deterministic metrics, statuses, warnings, formula IDs, and evidence IDs.
3. **Interpretation** — one Gemini report that uses the processed evidence and provides conservative, moderate, and aggressive perspectives.

The layers must feel causally connected. Do not present them as three interchangeable feature cards.

#### E. How to read the result

Use one realistic, explicitly illustrative research fragment to teach the distinction between:

- source data;
- engine calculation;
- AI interpretation;
- uncertainty or limitation.

This section is a reading guide, not a product screenshot.

#### F. Research desk

Only after the identity and methodology are clear, present the analysis form.

Fields:

- company name or ticker, required, maximum 100 characters;
- research focus, optional, maximum 500 characters.

Required assistance:

- realistic placeholder or default example;
- explanation that focus changes emphasis, not canonical calculations;
- plain disclaimer that the result is an educational research aid;
- clear submit label such as `Susun analisis`.

### Act II — Active research

After a successful submission, the report appears on the same public route and becomes the main operational surface. It may use a dashboard-like local shell with report-section navigation, but it must not imply accounts, portfolios, saved history, or additional application routes. The introduction remains reachable through the StockFrame identity or a clear back-to-introduction action.

The report reading order is:

1. resolved company identity;
2. data date and quality status;
3. AI summary with grounded metric references;
4. selected risk perspective and model confidence explanation;
5. one-year historical closing-price chart;
6. deterministic metrics grouped by research purpose, including valid current-period visual comparisons;
7. strengths, risks, and uncertainties;
8. Corporate Actions;
9. limitations and evidence details;
10. educational disclaimer and start-another-analysis action.

## 6. API contract consumed by the frontend

### 6.1 Request

```ts
type AnalysisRequest = {
  query: string;
  focus?: string;
};
```

Send as JSON to `POST /api/analyze`.

### 6.2 Successful response

The frontend consumes the existing `AnalyzeResponse` contract. It must import or derive types from the domain contract instead of recreating an incompatible local interface.

Required top-level fields:

- `requestId`;
- `instrument`;
- `snapshot`;
- `metrics`;
- `quality`;
- `report`.

Important nested fields:

- `instrument`: symbol, name, exchange, currency, region;
- `snapshot`: `asOf`, current price when available, one-year `prices`, evidence, financial periods, and Corporate Actions enrichment;
- `metrics`: ID, value, unit, status, formula ID, warnings, and evidence IDs;
- `quality`: score, decision, flags, AI eligibility, and notes;
- `report`: summary, strengths, risks, uncertainties, limitations, Corporate Action claims, three profiles, and disclaimer.

### 6.3 Error response

Consume the existing typed error response:

```ts
type AnalyzeErrorResponse = {
  requestId: string;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    candidates?: Array<{
      instrument: Instrument;
      score: number;
    }>;
  };
};
```

The frontend must branch by `error.code`, not by matching message text.

## 7. Frontend state model

Use an explicit discriminated state model. Suggested states:

```ts
type AnalysisUiState =
  | { status: "idle" }
  | { status: "submitting"; query: string; focus?: string }
  | { status: "ambiguous"; requestId: string; candidates: InstrumentCandidate[] }
  | { status: "success"; data: AnalyzeResponse }
  | { status: "error"; requestId?: string; error: AnalyzeErrorResponse["error"] };
```

Do not invent server progress events. `POST /api/analyze` is synchronous. During `submitting`, the UI may explain the pipeline using neutral language, but it must not claim a specific backend stage is currently complete unless the API provides that information.

Required states:

- idle introduction;
- focused and editing form;
- submitting;
- successful sufficient-quality report;
- successful degraded-quality report;
- ambiguous instrument selection;
- invalid request;
- instrument not found;
- request rate limited;
- provider rate limited;
- provider key/configuration failure;
- provider timeout or unavailable;
- analysis timeout;
- malformed provider response;
- insufficient data;
- Gemini unavailable;
- invalid Gemini response;
- unexpected internal error.

Every error state must provide:

- a human-readable Indonesian title;
- a short explanation;
- one valid recovery action;
- the request ID in a secondary disclosure for debugging;
- preserved query and focus values.

## 8. Analysis report requirements

### 8.1 Company and quality header

Show:

- company name and ticker;
- exchange, region, and currency;
- `snapshot.asOf`;
- quality decision and score;
- quality flags and notes when degraded.

Do not imply real-time pricing. Use language such as `Data efektif` or `Harga penutupan terakhir dalam dataset`.

### 8.2 AI summary

- Label explicitly as `Interpretasi AI`.
- Render summary text as the primary conclusion on a warm-paper surface that is visually distinct from dark data panels.
- Expose cited metric IDs as readable evidence references.
- Confidence must be presented as bounded model confidence, not probability of profit.
- Degraded reports must keep limitations visible near the summary.
- Provide exactly one labeled risk-profile selector: konservatif, moderat, and agresif. Switching profile changes the reading of the same evidence; it does not trigger or imply separate AI agents.

### 8.3 Historical price chart

- Plot `snapshot.prices` for approximately one year.
- Use closing price only.
- Sort by date in the presentation layer without mutating the response.
- Include accessible chart title, textual start/end/change summary, and currency.
- Handle sparse, single-point, and unavailable series.
- Never extend the line into the future.
- Never label it as projection, forecast, expected value, EV, or terminal value.

### 8.4 Metric ledger

Support all sixteen deterministic metrics:

- DER;
- current ratio;
- ROA;
- ROE;
- EPS TTM;
- P/E;
- book value per share;
- PBV;
- gross margin;
- operating margin;
- net margin;
- free cash flow;
- FCF margin;
- ROIC;
- one-year price return;
- annualized volatility.

Group by purpose, not by arbitrary grid position:

- financial health;
- profitability;
- valuation;
- cash flow and capital return;
- market performance and risk.

Each metric must show:

- friendly Indonesian label;
- formatted value and unit;
- status: available, unavailable, or not meaningful;
- warning when present;
- formula/evidence disclosure on demand.

Do not require historical metric series in the current frontend scope. The price chart is the only required historical chart.

Current-period engine metrics may use graphics only when the comparison is mathematically honest:

- profitability percentages such as ROE, ROA, and net margin may share one horizontal bar chart with a common percentage axis;
- margin percentages may be compared only when they use the same period and denominator policy;
- capital structure may use a stacked composition bar only when valid debt and equity inputs are available and the derivation is explicit;
- unbounded or unit-incompatible ratios such as DER, P/E, PBV, and EPS remain formatted scalar values, not progress bars;
- revenue, net income, EPS, and cash flow remain a compact value strip unless a future contract explicitly provides validated period series;
- every current-period graphic is labeled `Periode terbaru · bukan data historis` and retains a text equivalent.

Do not turn every metric into a chart, progress bar, gauge, donut, or radar. Never mix percentages, currency, per-share values, and multiples on one axis. The frontend must not ask AI to manufacture missing metric history.

### 8.5 Risk perspectives

Render exactly:

- konservatif;
- moderat;
- agresif.

The three perspectives use the same evidence. They must not look like pricing plans, competing products, or separate AI agents.

Use one labeled segmented selector in the report header on desktop and mobile. Selecting a profile updates the visible verdict, thesis, confidence, and considerations in place. Preserve the selected profile while the visitor navigates report sections, announce the change accessibly, and keep all three options keyboard-operable.

Always pair rating color with text. Explain that profile differences represent risk tolerance applied to the same evidence.

### 8.6 Findings

Render strengths, risks, and uncertainties as distinct evidence sections. Each claim must retain access to its cited metric IDs.

Avoid decorative positive/negative cards. The content hierarchy must make uncertainty as visible as strengths.

### 8.7 Corporate Actions

- Render only when enrichment is `available` and events or claims exist.
- `empty` means no recorded event in the requested period, not a provider failure.
- `unavailable` must show a limitation without blocking the rest of the report.
- Display event date, kind, relevant party/value when available, and evidence reference.
- Do not label Corporate Actions as news.

### 8.8 Limitations and evidence

- Keep limitations visible without hiding them behind an obscure icon.
- Evidence and formula details may use progressive disclosure.
- Request ID, schema version, formula IDs, and evidence IDs are secondary technical metadata.
- The disclaimer is always visible at the end of the report.

## 9. Interaction behavior

### 9.1 Submission

- Validate required input before network submission.
- Disable duplicate submission while a request is active.
- Preserve query and focus during loading and errors.
- Allow canceling only if implemented through `AbortController`; cancellation affects the browser request and must not claim provider cancellation.
- On success, move focus to the report heading and scroll without disorienting motion.
- Announce loading, ambiguity, success, and error through an `aria-live` region.

### 9.2 Ambiguous instrument

When `AMBIGUOUS_INSTRUMENT` returns candidates:

- present a compact candidate list with company, ticker, exchange, and region;
- require one explicit selection;
- retain the original focus text;
- resubmit using the selected canonical ticker;
- provide a back action to edit the original query.

### 9.3 Retry behavior

- Show retry only when `retryable` is true.
- Rate-limit messages must not auto-retry in a loop.
- A retry uses the preserved request values.
- Configuration or invalid-key errors should advise that the service is temporarily unavailable, not expose provider details.

## 10. Responsive behavior

Desktop is the primary composition target. Mobile is a deliberate adaptation, not a scaled desktop.

Desktop:

- bold asymmetric introduction with large black/lime fields and one layered evidence composition;
- methodology may use connected horizontal flow;
- report uses a near-black operational shell, optional local section rail, and multi-column structure where comparison benefits from it;
- the warm-paper conclusion remains the report's primary focal surface;
- one dominant visual moment per viewport.

Mobile:

- single reading column;
- shortened navigation;
- full-width research controls;
- historical chart remains readable without horizontal page scroll;
- current-period metric charts and metric groups become stacked sections with text equivalents;
- risk comparison becomes selectable or sequential;
- evidence details remain reachable by keyboard and touch;
- touch targets are at least 44 × 44 CSS pixels.

Target checks:

- 1440 × 900 desktop;
- 1024 × 768 small laptop/tablet landscape;
- 390 × 844 mobile;
- 320 pixel minimum width without horizontal overflow.

## 11. Accessibility

- Semantic landmarks and heading hierarchy.
- A visible skip link.
- Full keyboard operation.
- Visible focus indicator with sufficient contrast.
- Minimum WCAG AA contrast for text and controls.
- Color never carries rating or status alone.
- Reduced-motion support.
- Form errors associated with their fields.
- Chart includes a text equivalent.
- Current-period metric visualizations include readable values and a textual equivalent.
- Tables or comparison matrices retain meaningful headers on screen readers.
- Disclosure controls announce expanded state.
- Loading and final results are announced without stealing focus repeatedly.

## 12. Copy rules

Preferred vocabulary:

- `alat bantu riset dan edukasi`;
- `data efektif`;
- `hasil perhitungan engine`;
- `interpretasi AI`;
- `perspektif risiko`;
- `keterbatasan data`;
- `bukti yang digunakan`.

Avoid:

- `rekomendasi beli/jual`;
- `sinyal`;
- `prediksi harga`;
- `target price`;
- `peluang profit`;
- `AI menjamin`;
- `real-time` unless the contract truly provides it;
- exaggerated marketing claims such as `revolutionary`, `best`, or `institutional-grade`.

## 13. Component and template policy

Visual authority comes from `PRODUCT.md`, this specification, the approved Black Frame / Lime Signal concepts, and the revised design system—not from a UI template.

- Kokonut UI may supply isolated primitives only when the component can be fully restyled into StockFrame’s system. Do not import its page templates or default visual language wholesale.
- Bklit UI may be used for the historical closing-price chart and current-period comparison bars if it supports required accessibility, custom styling, text equivalents, and empty states. Otherwise implement accessible chart components directly.
- Motion may be used for purposeful transitions: introduction-to-research handoff, report reveal, and disclosure expansion. Avoid repeated entrance animation on every section.
- shadcn/ui is optional and limited to low-level accessible primitives such as disclosure, tabs, or tooltip. It is not required if native semantic HTML is sufficient.
- Do not add a component dependency for something that can be implemented more clearly with native HTML and existing CSS.

## 14. Performance and privacy

- Keep provider keys and model keys out of client bundles.
- Avoid analytics, trackers, and third-party scripts unless explicitly approved.
- Prefer server-rendered introduction content.
- Load chart and report-only code when needed if the bundle impact is material.
- Avoid large hero video and unoptimized raster assets.
- Prevent layout shift during report loading.
- Do not cache personalized input in third-party services.

## 15. Acceptance criteria

The frontend is accepted when:

- the first viewport communicates StockFrame’s identity without a dashboard mockup or analysis form;
- the introduction expresses the Black Frame / Lime Signal identity rather than a generic SaaS or pale editorial site;
- lime is committed at page scale in the introduction and restrained to meaningful state and emphasis roles in the report;
- methodology clearly separates data, engine, and AI;
- the research form appears after the introduction and submits to `/api/analyze`;
- all success, degraded, ambiguous, insufficient, provider, rate-limit, AI, timeout, and unexpected-error states have explicit UI behavior;
- all sixteen metrics can be rendered with correct units and statuses;
- the price chart uses historical closing prices only and includes a text equivalent;
- current-period metric charts use only comparable units, are explicitly distinguished from historical data, and degrade to scalar values when required inputs are unavailable;
- the three risk perspectives use one evidence set and do not resemble pricing cards;
- Corporate Actions status and events are represented correctly;
- limitations, evidence, effective date, quality, and disclaimer remain visible;
- no key, token, or provider call is exposed to the browser;
- desktop and mobile layouts pass the target viewport checks;
- keyboard flow, focus, contrast, reduced motion, and live announcements pass accessibility review;
- lint, typecheck, unit tests, integration tests, build, and selected browser acceptance scenarios pass.

## 16. Out of scope

- login and registration;
- user profiles;
- saved reports and history;
- watchlists and portfolios;
- payments or subscriptions;
- social proof and testimonials;
- live trading or brokerage integration;
- push notifications;
- real-time streaming quotes;
- future-price, EV, or terminal-value prediction charts;
- historical series for engine-calculated metrics unless a future validated API contract adds them;
- multi-model or multi-agent debate UI;
- content-management system;
- additional routes unless separately approved.
