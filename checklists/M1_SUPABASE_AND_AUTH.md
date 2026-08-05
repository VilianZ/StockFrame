# M1 — Market data and instrument resolution

> Filename retained for checklist compatibility. Active revised M1 follows the
> Next.js/Alpha Vantage architecture in `docs/BACKEND_SPEC.md`.

## Active revised M1

- [x] Define a small `MarketDataProvider` interface for instrument resolution and raw market data.
- [x] Add the server-only Alpha Vantage adapter using server-side `fetch`.
- [x] Add AbortController timeouts and at most one retry for transient failures.
- [x] Classify invalid key, rate limit, timeout, malformed payload, not found, unsupported, network, and upstream errors.
- [x] Verify exact tickers against provider data.
- [x] Send short company names through `SYMBOL_SEARCH` instead of assuming they are tickers.
- [x] Prioritize exact-symbol matches and apply an explicit strong-score threshold and score-gap policy.
- [x] Resolve one strong company-name match and return candidates for ambiguity.
- [x] Reject unsupported instruments without guessing.
- [x] Fetch quote, overview, income statement, balance sheet, and cash-flow raw records.
- [x] Classify HTTP status before parsing JSON so non-JSON 5xx responses retry once.
- [x] Validate both overview and quote symbols against the requested instrument.
- [x] Keep provider keys and query values out of safe logs.
- [x] Add sanitized fixtures for successful and failure provider responses.
- [x] Prove all M1 tests use injected fetch functions and make no live network calls.
- [x] Pass lint, strict type-check, unit tests, and production build.

## Deferred after revised M1

Normalization, evidence assignment, financial metric formulas, quality gate,
OpenRouter, `/api/analyze`, and frontend analysis workflow remain deferred to
M2 and later milestones. Durable provider-result caching remains required before
public deployment and is intentionally not part of this fixture-first M1 slice.
