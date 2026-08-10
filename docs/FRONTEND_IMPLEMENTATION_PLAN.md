# StockFrame Frontend Implementation Plan

Status: Ready for implementation  
Source of truth: `PRODUCT.md`, `DESIGN.md`, `docs/FRONTEND_SPEC.md`, existing domain schemas, and `/api/analyze`  
Delivery model: One Next.js project deployed to Vercel

## 1. Objective

Replace the current visual baseline with the approved **Black Frame / Lime Signal** StockFrame experience. Build the bold introduction first, then translate the same identity into a calmer operational research dashboard. Do not polish the existing SaaS or pale editorial composition incrementally; treat its copy and fixture data as reference material, not as a layout contract.

The implementation must preserve the server-side analysis boundary and existing backend contracts. Frontend work must not modify metric formulas, Gemini validation, Business Quant normalization, or API error semantics.

## 2. Implementation principles

1. **Identity before operation.** A visitor understands StockFrame before seeing the analysis form; the introduction uses committed black/lime fields while the report uses restrained lime emphasis.
2. **Real contract before visual fixture.** Presentation types derive from existing domain contracts.
3. **Data provenance stays visible.** Data, engine output, AI interpretation, and limitations use different labels and treatments.
4. **Progressive complexity.** Introductory content is spacious; dense detail appears only in the active report.
5. **No template authority.** Component libraries solve isolated interaction problems, not page identity.
6. **Fixture-first, API-ready.** Components are developed against contract-valid fixtures, then connected to the live route.
7. **Accessibility is structural.** Semantic HTML, focus behavior, announcements, and text equivalents are implemented with the component, not added at the end.
8. **One state owner.** The analysis controller owns request, ambiguity, success, and error state.

## 3. Proposed structure

The AI coder may adjust filenames when a clearer local convention exists, but it must preserve these responsibilities.

```text
app/
  page.tsx                         # Server-rendered page shell and introduction
  globals.css                      # Global tokens, reset, and shared layout rules

components/
  identity/
    site-header.tsx
    identity-hero.tsx
    positioning-statement.tsx
    methodology-story.tsx
    reading-guide.tsx
  research/
    analysis-experience.tsx        # Client boundary and state owner
    research-desk.tsx
    analysis-loading.tsx
    candidate-selector.tsx
    analysis-error.tsx
  report/
    report-workspace.tsx           # Operate-mode shell and local report navigation
    report-header.tsx
    report-summary.tsx
    historical-price-chart.tsx
    current-metric-visuals.tsx
    profitability-bars.tsx
    capital-structure.tsx
    metric-ledger.tsx
    metric-row.tsx
    risk-perspectives.tsx
    findings.tsx
    corporate-actions.tsx
    limitations-and-evidence.tsx
    report-footer.tsx
  ui/
    disclosure.tsx
    status-label.tsx
    evidence-reference.tsx

lib/
  presentation/
    analysis-state.ts
    error-copy.ts
    metric-catalog.ts
    formatters.ts
    chart-data.ts
  fixtures/
    analyze-success.ts
    analyze-degraded.ts
    analyze-errors.ts

tests/
  unit/
    presentation.test.ts
    frontend-state.test.ts
  component/
    research-desk.test.tsx
    report-rendering.test.tsx
  e2e/
    homepage-and-analysis.spec.ts
```

Do not move server-only provider or Gemini modules into component folders. Client components must not import modules marked `server-only`.

## 4. Milestone F0 — freeze presentation contracts and reset direction

### Deliverables

- Treat `docs/FRONTEND_SPEC.md` as the frontend product contract.
- Review `PRODUCT.md` and revise `DESIGN.md` so its durable direction records Black Frame / Lime Signal, its palette roles, typography split, frame/signal-line motif, and distinct Persuade versus Operate color behavior.
- Remove Impeccable Live injection and temporary session artifacts before committing production code; retain only intentionally versioned design configuration.
- Create a frontend presentation map for:
  - metric labels and groups;
  - unit formatters;
  - quality decisions;
  - risk profile labels;
  - Corporate Action kinds and statuses;
  - API error copy and recovery actions.
- Define a metric-visualization policy that identifies:
  - comparable current-period percentages eligible for a shared bar chart;
  - capital-structure inputs and fallback behavior;
  - scalar-only metrics that must never be rendered as progress bars;
  - required labels and text equivalents for current-period graphics.
- Add contract-valid fixtures for:
  - sufficient report;
  - degraded report;
  - Corporate Actions available, empty, and unavailable;
  - unavailable and not-meaningful metrics;
  - ambiguous instrument;
  - insufficient data;
  - provider, rate-limit, timeout, AI, and internal failures.
- Decide dependencies before implementation:
  - use Bklit only if its chart API meets accessibility and bundle requirements;
  - use Motion only after static structure is complete;
  - do not add Kokonut or shadcn wholesale.

### Tests and validation

- Every fixture parses with existing response schemas.
- Metric catalog covers all sixteen IDs exactly once.
- Every API error code maps to a title, explanation, and recovery action.
- No fixture contains a secret or claims to be live data.
- `npm run lint`, `npm run typecheck`, and focused unit tests pass.

### Gate

F0 is complete when no frontend component needs to guess a metric label, unit, status, error behavior, or response shape.

## 5. Milestone F1 — identity and introduction

### Deliverables

- Replace the current hero and navigation.
- Build the minimal identity header.
- Build the identity hero without an analysis form or dashboard-window mockup.
- Create one StockFrame-specific layered evidence visual using HTML/CSS/SVG geometry, a lime frame, one continuous signal line, and a small number of honest illustrative labels.
- Build the full-width lime manifesto: `Bukan menebak harga. Membantu membaca alasannya.`
- Build the connected Data → Engine → Interpretation methodology narrative.
- Build the reading-guide fragment that visually distinguishes:
  - source data;
  - deterministic metric;
  - AI interpretation;
  - limitation.
- Add the research-desk transition point at the end of the introduction.
- Implement desktop and mobile composition together.

### Visual requirements

- One dominant visual idea per viewport: near-black hero with lime signal, followed by a committed lime manifesto field.
- Lime occupies a meaningful page-scale field in the introduction; it is not limited to buttons and badges.
- The hero uses bold neo-grotesk display hierarchy, while body and controls remain highly legible.
- No equal feature-card grid.
- No fake browser chrome.
- No testimonial, logo strip, pricing, login, or sign-up language.
- The page must remain identifiable as StockFrame when the analysis form is below the fold.

### Validation

- A first-time reviewer can explain StockFrame’s method from the introduction alone.
- Keyboard navigation reaches anchors and the research desk in logical order.
- At 390 pixels wide, no section has horizontal page overflow.
- Reduced-motion mode keeps all content understandable.
- Run one desktop and mobile visual review before proceeding.

### Gate

F1 is complete when the introduction communicates identity and method without relying on the report workspace.

## 6. Milestone F2 — research desk and request state

### Deliverables

- Add a focused client boundary around the research experience only.
- Implement controlled query and optional focus fields.
- Enforce client constraints consistent with `AnalysisRequestSchema`.
- Submit JSON to `POST /api/analyze`.
- Use `AbortController` for optional user cancellation.
- Disable duplicate submissions.
- Preserve field values through loading and error states.
- Implement an `aria-live` status region.
- Implement neutral loading copy without fabricated backend progress.
- Implement typed error mapping.
- Implement ambiguous-instrument selection and canonical-ticker resubmission.

### Error behavior matrix

| Error family | Primary recovery |
|---|---|
| Invalid request | Focus the invalid field and preserve values |
| Instrument not found | Edit company or ticker |
| Ambiguous instrument | Select one candidate or edit query |
| Request/provider rate limited | Retry manually when allowed |
| Provider timeout/unavailable | Retry when `retryable` is true |
| Provider invalid key/configuration | Explain temporary service unavailability; do not expose details |
| Analysis timeout | Retry or narrow the focus |
| Malformed provider response | Retry when allowed; show request ID |
| Insufficient data | Explain missing evidence; offer another company |
| AI unavailable/invalid response | Explain that data may be available but interpretation failed |
| Internal error | Safe generic recovery and request ID |

### Tests

- Input trimming and length boundaries.
- Duplicate-submit prevention.
- Abort behavior.
- Preserved values after failure.
- Error-code mapping for every current `ERROR_CODES` member.
- Ambiguous candidate selection and resubmission.
- Retry hidden when `retryable` is false.

### Gate

F2 is complete when every API outcome has deterministic, test-covered UI behavior before the full report renderer is connected.

## 7. Milestone F3 — report renderer

### Deliverables

#### Report identity and quality

- Near-black operational workspace with local report-section navigation that does not imply accounts or saved application state.
- Company identity, exchange, region, and currency.
- Effective date and last dataset price language.
- Quality decision, score, flags, and notes.
- Prominent degraded-data disclosure.

#### Summary and grounded claims

- Warm-paper AI conclusion surface labeled as interpretation and visually separated from data panels.
- Metric evidence references attached to grounded claims.
- Confidence explained as model confidence, never investment probability.
- Risk-profile selector for conservative, moderate, and aggressive readings of the same evidence.

#### Historical chart

- One-year closing-price series.
- Currency-aware axis and tooltip formatting.
- Text equivalent with start, end, period change, and missing-data note.
- Sparse and unavailable states.
- No projected segment.

#### Metric ledger

- Render all five metric groups.
- Unit-aware values.
- Available, unavailable, and not-meaningful treatments.
- Warnings visible at the metric level.
- Formula and evidence disclosure.
- Add current-period profitability bars only for comparable percentage metrics such as ROE, ROA, and net margin.
- Add capital-structure composition only when valid debt and equity inputs exist; otherwise render the relevant ratios as scalar values.
- Keep DER, P/E, PBV, EPS, currency values, and incompatible units out of progress bars and shared axes.
- Label engine graphics `Periode terbaru · bukan data historis` and provide text equivalents.
- Do not implement historical metric series or ask AI to generate missing points.

#### Risk perspectives

- One labeled segmented selector on desktop and mobile.
- Active rating, confidence, thesis, and considerations update in place.
- Selected profile persists while navigating report sections and is announced accessibly.
- Explanation that all profiles apply different risk tolerance to the same evidence and do not represent separate AI agents.

#### Findings and evidence

- Strengths, risks, and uncertainties.
- Corporate Actions status, events, and claims.
- Limitations.
- Evidence and technical metadata disclosure.
- Final educational disclaimer.

### Tests

- All sixteen metric IDs render in their expected groups.
- Ratios, percentages, currencies, per-share values, and unavailable values format correctly.
- Current-period metric graphics include only compatible units and fall back cleanly when inputs are unavailable.
- No engine-metric visualization is labeled historical or contains fabricated periods.
- Degraded quality shows score, flags, notes, and limitations.
- Grounded claim references remain connected to metric IDs.
- Corporate Actions available, empty, and unavailable states differ correctly.
- Risk profiles remain exactly conservative, moderate, and aggressive.
- Chart does not render future dates or forecast labels.

### Gate

F3 is complete when every valid success contract can be read without inspecting raw JSON and every provenance boundary remains visible.

## 8. Milestone F4 — integration and complete state coverage

### Deliverables

- Replace fixture-only rendering with the real `/api/analyze` request path.
- Keep fixtures available for automated tests and local component development.
- Integrate report reveal, focus movement, and scroll behavior.
- Handle a second analysis without a full page reload.
- Clear or replace the previous result only through explicit state transitions.
- Ensure query parameters are not used to store sensitive focus text unless separately approved.
- Verify no client bundle imports server configuration or provider adapters.
- Add a safe development-only mechanism for selecting fixture states if useful; exclude it from production.

### Acceptance scenarios

1. Valid ticker → sufficient report.
2. Company name → resolved report.
3. Ambiguous name → candidate selection → report.
4. Degraded data → report with visible limitations.
5. Insufficient data → no fabricated report.
6. Provider rate limit → clear manual recovery.
7. Gemini unavailable → data/AI boundary explained.
8. Corporate Actions empty → correct empty interpretation.
9. Corporate Actions unavailable → non-blocking limitation.
10. Second analysis → previous state replaced predictably.

### Gate

F4 is complete when the browser uses the real route safely and all important contracts have a demonstrated state.

## 9. Milestone F5 — accessibility, responsiveness, and polish

### Deliverables

- Keyboard and screen-reader pass.
- Contrast and focus-state pass.
- Reduced-motion pass.
- Desktop, small laptop/tablet, and mobile layout pass.
- 200% zoom and 320-pixel-width checks.
- Purposeful motion only for:
  - entry into the research desk;
  - loading-to-result handoff;
  - disclosures or profile changes.
- Remove redundant decoration, repeated labels, and unnecessary cards.
- Verify lime usage is committed and expressive in the introduction but does not overwhelm the operational dashboard.
- Audit client bundle and prevent avoidable chart or animation cost.
- Final copy review in Bahasa Indonesia.
- Re-run Impeccable critique after fixes, followed by a bounded polish pass.

### Required quality gates

```text
npm run lint
npm run typecheck
npm run test
npm run build
git diff --check
```

If component or browser tests introduce new scripts, include them in the final gate and CI documentation.

### Gate

F5 is complete when all criteria in `docs/FRONTEND_SPEC.md` section 15 pass and no known P0/P1 frontend issue remains.

## 10. Suggested implementation order inside each milestone

For each milestone:

1. inspect existing contracts and current affected files;
2. write or update contract-valid fixtures;
3. implement semantic structure without animation;
4. implement responsive layout;
5. implement interaction and state behavior;
6. add focused tests;
7. run focused validation;
8. inspect desktop and mobile together;
9. fix findings in one bounded pass;
10. run full quality gates before marking the milestone complete.

## 11. Two-developer split

If two frontend developers work in parallel, use disjoint ownership.

### Developer A — identity and shell

- F1 introduction and identity components;
- global tokens and responsive shell;
- reading guide and methodology narrative;
- shared low-level UI primitives;
- final visual integration.

### Developer B — research and report

- F0 fixtures and presentation mappings;
- F2 request state and typed errors;
- F3 report components and chart;
- component and integration tests.

### Shared boundaries

- `AnalysisUiState`, metric catalog, formatters, and fixtures are reviewed before parallel UI work.
- Avoid both developers editing `app/page.tsx` and `app/globals.css` simultaneously.
- Integrate at milestone gates rather than after all frontend work is complete.

## 12. Dependency policy

Before installing a package, record:

- the exact UI problem it solves;
- why native HTML/CSS or an existing dependency is insufficient;
- client bundle impact;
- accessibility behavior;
- whether it can be visually restyled without inheriting generic SaaS patterns.

Likely decisions:

- **Motion:** allowed for a small number of purposeful transitions.
- **Bklit:** allowed for the historical chart and current-period comparison bars only after contract, accessibility, text-equivalent, custom-styling, and zero-history checks.
- **Kokonut UI:** selective source of primitives, not a page template or default design system.
- **shadcn/ui:** optional low-level accessible primitives only.
- **Icon library:** one consistent library if icons are necessary; no emoji or mixed icon systems.

Do not add several overlapping component libraries.

## 13. Testing strategy

### Unit tests

- metric catalog completeness;
- unit and date formatting;
- price-series sorting and summary;
- metric-visualization eligibility and fallback mapping;
- profitability-bar and capital-structure derivation helpers;
- error-code presentation mapping;
- UI state transitions.

### Component tests

- form validation and submission;
- loading announcement;
- ambiguous candidate selection;
- degraded report rendering;
- metric statuses and warnings;
- current-period metric charts, accessible values, and scalar fallbacks;
- profile comparison;
- Corporate Actions states;
- evidence disclosure keyboard behavior.

### Browser acceptance

- introduction communicates identity before the tool;
- analysis can be completed with keyboard only;
- report focus and announcement are correct;
- no horizontal overflow at target widths;
- chart has a text equivalent;
- retry and edit-query paths work;
- no provider key appears in HTML, JS, network request payloads, or client-visible errors.

## 14. Documentation and logging

- Frontend planning documents remain under `docs/`.
- Do not append a development-log entry for planning or documentation-only work.
- Once implementation begins, append exactly one concise Indonesian entry to `devlog/DEVELOPMENT_LOG.md` for each implementation task that changes source, tests, runtime configuration, or infrastructure.
- Do not mark a frontend milestone complete until its implementation and required validation pass.
- If separate frontend checklists are created, use `checklists/F0_...` through `checklists/F5_...` so they do not collide with the existing backend M0–M6 sequence.

## 15. Immediate next task for the AI coder

Start with F0 only.

1. Read `PRODUCT.md`, `DESIGN.md`, `docs/FRONTEND_SPEC.md`, `docs/FRONTEND_IMPLEMENTATION_PLAN.md`, and the existing domain schemas.
2. Inspect the current page as a disposable baseline.
3. Record the approved Black Frame / Lime Signal direction in `DESIGN.md`, including the Persuade/Operate distinction and metric-chart policy.
4. Build presentation mappings, metric-visualization eligibility rules, and contract-valid fixtures.
5. Add focused unit tests for mappings, formatting, metric-visualization fallbacks, fixture validity, and error coverage.
6. Run lint, typecheck, focused tests, and build.
7. Stop after F0 and report decisions before implementing the new homepage.

Do not begin F1 until the design direction, presentation contracts, fixture coverage, and dependency decisions are explicit.
