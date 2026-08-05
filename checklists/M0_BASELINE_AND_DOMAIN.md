# M0 Baseline and Domain

## Legacy Python baseline — superseded

The prior Python baseline is no longer the active implementation contract. The
current workspace contains the existing `.venv`; any legacy `backend/`, Python
`tests/`, and completed Python checklist material must remain untouched if they
are restored or reintroduced. They are not imported by the Next.js application.

## Active revised M0 — Next.js foundation and contracts

- [x] Inspect the workspace and verify Node.js `22.16.0` and npm `10.9.2`.
- [x] Pin Node.js, npm, Next.js, React, TypeScript, schema, lint, and test versions.
- [x] Create a minimal Next.js App Router + TypeScript page at the workspace root.
- [x] Enable TypeScript strict mode and add dev/build/lint/typecheck/test scripts.
- [x] Add isolated TypeScript domain contracts and strict validation schemas.
- [x] Enforce MetricSchema status/value coherence for available and unavailable metrics.
- [x] Require exactly `conservative`, `moderate`, and `aggressive` report profiles.
- [x] Add domain, market snapshot, metric policy, AI prompt, and report versions.
- [x] Add deterministic canonical serialization and SHA-256 content hashing.
- [x] Add a server-only environment boundary for the approved credential names.
- [x] Add `.env.example` and Git ignores for secrets, build output, coverage, and dependencies.
- [x] Add unit tests for contracts, schemas, profiles, serialization, and hashing.
- [x] Pass lint, type-check, unit tests, and production build.

### Deferred after revised M0

Alpha Vantage, OpenRouter, metric formulas, `/api/analyze`, deployment, and
final frontend design remain deferred to later milestones.
