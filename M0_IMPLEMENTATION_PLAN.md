# Revised M0 Implementation Plan

## Objective

Create a minimal, runnable Next.js App Router foundation and freeze the first
TypeScript domain contracts without connecting providers, AI, persistence, or
the legacy Python artifacts.

## Locked decisions

- Node.js `22.16.0` and npm `10.9.2` are pinned in the runtime metadata and
  package manifest.
- Next.js `16.2.9`, React `19.2.7`, Zod `4.0.1`, and Vitest `4.1.6` are exact
  dependency versions. React `19.2.7` is selected because it is the available
  React 19 release accepted by Next.js `16.2.9`'s peer range.
- ESLint uses the Next.js 16 flat-config setup.
- `tests/` is reserved for TypeScript tests. No Python test directory exists in
  the current workspace, and no legacy artifact will be deleted or moved.

## Work slices

1. Add the root Next.js/TypeScript configuration and minimal page.
2. Add isolated domain contracts, strict Zod schemas, versions, canonical
   serialization, and SHA-256 hashing.
   Metric values are coherent with their status: `available` requires a finite
   number, while `not_available` and `not_meaningful` require `null`.
3. Add a server-only environment boundary that reads only the three approved
   variable names.
4. Add fixture-free unit tests for validation, profile invariants,
   serialization, and hashing.
5. Run lint, type-check, tests, and production build; update the M0 checklist
   and append one development-log entry.

## Explicitly deferred

Alpha Vantage, OpenRouter, financial formulas, `/api/analyze`, deployment,
provider adapters, AI adapters, and final frontend design remain outside M0.
