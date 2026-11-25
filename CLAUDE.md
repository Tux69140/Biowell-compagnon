# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server (localhost:5173)
pnpm build            # TypeScript check + Vite production build
pnpm test             # Unit tests (Vitest)
pnpm lint             # ESLint
pnpm format           # Prettier auto-format
pnpm typecheck        # TypeScript only
pnpm e2e              # Playwright E2E (needs: pnpm e2e:install)
pnpm check            # Full pipeline: format + lint + typecheck + test + build + e2e
```

Run a single unit test: `pnpm vitest run src/tests/core.test.ts -t "test name"`

## Architecture

Browser-only SPA that analyzes Bio-Well health CSV reports to find the most representative measurement from a series. No backend — all processing happens client-side.

**Core pipeline:**

1. User drops CSV files → `csvParser.ts` (RFC 4180, semicolon-delimited)
2. Parsed into metrics → `biowellParser.ts` (individual) or `aggregatedBiowellParser.ts` (multi-report CSV)
3. Statistical analysis → `representativity.ts` — computes per-metric means, scores each report by average deviation, selects closest to mean
4. Export results → `exportMeansCsv.ts` (simple) / `exportDetailed.ts` (CSV + colored XLS)

**Layout:**

- `src/app/App.tsx` — single React component handling all UI state
- `src/core/` — pure functions, no React dependencies, independently testable
- `src/core/metrics.ts` — shared types (`MetricKey`, `MetricValue`, `ParsedReport`, `MeanMetric`)

## Conventions

- All UI text, error messages, and CSV headers are in French
- Numbers use French locale (comma as decimal separator: `3,05` → 3.05)
- Metric keys are hierarchical strings built from section/subsection/group/label/column
- Metrics stored as `Map<string, MetricValue>` throughout
- Errors thrown from core carry extra properties (`rejectedReports`, `validCount`, `warnings`)
- ESLint: `no-console: warn`, React hooks rules enforced
- Prettier: double quotes, trailing commas (es5), 100 char width
- Test data lives in `rapports_exemple/`
