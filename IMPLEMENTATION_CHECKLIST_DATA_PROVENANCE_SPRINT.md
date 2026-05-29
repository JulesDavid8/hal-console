# Implementation Checklist: Data Provenance Bar Sprint

**Sprint Goal**: Deliver a production-grade, reusable `DataProvenanceBar` component that surfaces API freshness contract fields (`source_ts`, `pulled_ts`, `session`, `lag_seconds`, `level`, `source`, `fallback`). Wire it into Ticker Explorer, Live Market Board, and Market Context Strip with minimal, high-signal code changes.

**Core Principles (Non-Negotiable)**
- Contract-first: All shapes originate from or extend models in `services/common/app/contracts.py` (`model_config = ConfigDict(extra="forbid")`).
- Point-in-time correctness and explicit staleness > silent degradation.
- Non-dev backends return 503 on backend unavailability (no silent sample data).
- Changes are small, reviewable, and observable.
- Every delivery includes tests/verification steps.

**References (Read Before Starting)**
- [AGENTS.md](/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/Main/AGENTS.md)
- [docs/engineering_standards.md](/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/Main/docs/engineering_standards.md)
- [EXECUTION_STATUS.md](/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/Main/EXECUTION_STATUS.md)
- [RESEARCH_PLAYBOOK_2026-05-29.md](/Users/aciminillo/Library/Mobile Documents/com~apple~CloudDocs/deployed_code/Main/docs/RESEARCH_PLAYBOOK_2026-05-29.md) (sections on "Treat live as a strict contract" and "explicit data provenance")
- Frontend patterns: `src/design-system/primitives/*`, `src/lib/api/client.ts`, existing `pulled_at`/`asOf` usage in `TickerExplorer.tsx:218`, `LiveMarketBoard.tsx:60`, `MarketContextStrip.tsx:83`, `SignalCard.tsx:20`

---

## Phase 0: Alignment & Scoping (0.5 day)

- [ ] Review current ad-hoc freshness displays:
  - `src/features/explorer/TickerExplorer.tsx` (lines 218-222, 311, 329)
  - `src/features/market/LiveMarketBoard.tsx` (lines 24-29, 60, 112, 140)
  - `src/features/signals/SignalCard.tsx` (line 20)
  - `src/components/MarketContextStrip.tsx` (lines 80-84)
  - `src/components/MarketNews.tsx` (multiple asOf usages)
- [ ] Confirm `/signals/{ticker}/bundle` endpoint status:
  - Backend: Not present in `services/api/app/routes/signals.py` (as of latest audit). The shape is composed client-side or via mock.
  - Mock: `api/v1/signals/[ticker]/bundle.js` + `api/_lib/marketData.js:626` (`buildLiveSignalBundle`).
- [ ] Decide attachment strategy (recommendation):
  - Add `DataProvenance` model in contracts.
  - Attach `provenance: DataProvenance | null` to `LiveSignalBundle` (and future bundle responses).
  - Attach top-level `provenance` to `MarketContextResponse`.
  - Per-item provenance on `MarketContextItem` only if backend can provide differentiated freshness (otherwise top-level is acceptable for minimal change).
- [ ] Align on `level` enum values and lag thresholds (example):
  - `fresh`: lag_seconds < 60 (or exchange-appropriate)
  - `acceptable`: 60 <= lag < 300
  - `stale`: 300 <= lag < 900
  - `unavailable`: no usable timestamps
- [ ] Create or update ticket in project tracker with this checklist attached.

---

## Phase 1: Contract & Backend (Source of Truth)

### 1.1 Canonical Contract (services/common)

- [ ] Add `DataProvenance` model to `services/common/app/contracts.py` (place after imports, before existing models):

```python
class DataProvenance(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_ts: datetime
    pulled_ts: datetime
    session: str = Field(min_length=1, max_length=32)  # "regular" | "pre" | "post" | "extended" | "unknown"
    lag_seconds: int = Field(ge=0)
    level: Literal["fresh", "acceptable", "stale", "unavailable"]
    source: str = Field(min_length=1, max_length=64)   # "yahoo_finance", "polygon", "internal_materialized", ...
    fallback: bool = False
```

- [ ] Export the new model from `common.app.contracts`.
- [ ] (If bundle endpoint is added) Create `LiveSignalBundle` response model that embeds `provenance: DataProvenance | None` (or keep flat for minimal diff if preferred — document decision).

### 1.2 Real API Service (Python)

- [ ] Update `services/api/app/services/signal_service.py` (or create provenance helper) to compute and return provenance fields when building bundles or snapshots.
- [ ] Update relevant repositories (`query_repo.py`) to surface `source_ts`, `pulled_ts`, and session metadata from materialized tables or Redis cache metadata.
- [ ] For `/market/context` (when route exists) or equivalent, attach provenance at response root.
- [ ] Ensure 503 path is respected: if provenance cannot be determined due to backend failure, surface explicit error rather than invented timestamps.
- [ ] Add unit test for provenance computation (new or existing signal service test).
- [ ] Add integration test that asserts the new fields appear on a real bundle/context response (uses ephemeral Postgres/Redis harness).

### 1.3 Local Dev Mock Parity (Critical for UI Development)

- [ ] Update `api/_lib/marketData.js`:
  - Add `buildDataProvenance(quote, bars, source = 'yahoo_finance')` helper that computes all 7 fields from existing `quote.asOf`, `pulled_at`, etc.
  - Reasonable defaults: `session: 'regular'`, `fallback: false`, `source: 'yahoo_finance_proxy'`.
- [ ] Update `api/v1/signals/[ticker]/bundle.js` response payload to include `provenance` (flat or nested — match backend decision).
- [ ] Update `api/v1/market/context.js` response to include `provenance` at root.
- [ ] Verify mock still works: `npm run dev` → load Ticker Explorer with a real symbol.

---

## Phase 2: Frontend Component (Minimal, Production-Grade)

### 2.1 Types

- [ ] Update `src/features/market/types.ts`:
  - Add `DataProvenance` interface matching the contract (use `string` for datetimes; keep strict).
  - Extend `LiveSignalBundle` with optional `provenance?: DataProvenance | null`.
  - Extend `MarketContextResponse` with optional `provenance?: DataProvenance | null`.
  - (Optional) Add `provenance?: DataProvenance | null` to `MarketContextItem` only if per-item data is available.

### 2.2 Reusable Component

**Location recommendation (minimal change)**: `src/components/DataProvenanceBar.tsx` (shared component, not yet in design-system barrel until stable).

- [ ] Create component with these requirements:
  - Props: `{ provenance: DataProvenance | null | undefined; className?: string; compact?: boolean; showSource?: boolean }`
  - Uses only existing design tokens (`--hal-*` via Tailwind) and `cn()` utility.
  - Renders: relative time + absolute timestamps on hover/tooltip, level badge (color-coded: fresh=success, acceptable=neutral, stale=warning, unavailable=danger), session pill, lag seconds, source pill (subtle), fallback indicator (icon + text).
  - Graceful degradation: if `provenance` is null/undefined, render a single muted "Data freshness unavailable" state (never crash or show stale data as fresh).
  - Accessibility: `aria-label` describing the full provenance state, `title` attributes for timestamps, no reliance on color alone.
  - No external data fetching. Pure presentational + tiny formatting helpers.
  - Memoized (`React.memo`) if it receives objects.
  - JSDoc + clear TypeScript (no `any`).
- [ ] Add to `src/components/index.ts` barrel **only** after review (or keep direct import for minimal blast radius).
- [ ] Add usage example to `src/components/DesignSystemPlayground.tsx` (new section or tab) so designers/devs can visually QA variants.

### 2.3 Styling & Variants (Keep Minimal)

- Use existing `Badge` primitive for level/session/source.
- Compact mode for dense areas (Market Strip, Signal Cards).
- Full mode for explorer headers and board summaries.
- No new CSS variables unless justified (prefer existing `--hal-muted`, `--hal-success`, etc.).

---

## Phase 3: Integration (Three Target Surfaces)

### 3.1 Ticker Explorer (`src/features/explorer/TickerExplorer.tsx`)

- [ ] Import `DataProvenanceBar`.
- [ ] Replace ad-hoc `lastUpdateText` logic (lines 218-222, 311, 329) with the bar.
- [ ] Place the bar:
  - Once under the ticker price header (inside the main snapshot card).
  - Remove or deprecate the old text line to avoid duplication.
- [ ] Pass `bundle.provenance` (will be undefined until backend/mock updated — component must handle it).
- [ ] Preserve existing auto-refresh behavior (30s).

### 3.2 Live Market Board (`src/features/market/LiveMarketBoard.tsx`)

- [ ] Import `DataProvenanceBar`.
- [ ] Add provenance to the board header summary (replace `Last sync` + `asOfSummary` line).
- [ ] (Optional, low priority) Pass provenance down to `SignalCard` if per-row provenance becomes available. For minimal change, show one aggregate bar for the whole board.
- [ ] Keep the per-card `asOf` string for now (or remove it in the same diff if the bar makes it redundant).

### 3.3 Market Context Strip (`src/components/MarketContextStrip.tsx`)

- [ ] Import `DataProvenanceBar`.
- [ ] Replace the "Refreshed ..." text (line 83) + Live badge area with the bar (compact variant recommended).
- [ ] Use `data.provenance` once contract is extended.
- [ ] Keep the existing refresh interval logic driven by `refresh_hint_seconds`.

### 3.4 Cross-Cutting / Opportunistic

- [ ] `SignalCard.tsx`: Consider accepting optional `provenance` prop for future per-card use (do not wire in this sprint unless trivial).
- [ ] `MarketNews.tsx`: Audit for duplication; do not touch unless it blocks the three primary surfaces.

---

## Phase 4: Quality, Observability & Hardening

- [ ] **Lint & Type Safety**
  - Run `npm run lint` and `npm run typecheck` — zero errors/warnings on changed files.
- [ ] **Build**
  - `npm run build` must succeed cleanly.
- [ ] **Error Handling**
  - Component never throws on bad/partial provenance data.
  - API client errors on provenance-bearing endpoints still surface 503 correctly in UI (existing pattern in `LiveMarketBoard` and `MarketContextStrip`).
- [ ] **Observability (Minimal)**
  - If the component is interactive (e.g., click to expand full timestamps), add a lightweight console debug or future analytics hook. No new telemetry in this sprint unless already present.
- [ ] **Accessibility**
  - Keyboard focusable if expandable.
  - High-contrast friendly (leverages existing tokens).
- [ ] **Performance**
  - No `useEffect` with timers inside the bar itself (parent controls refresh).
  - No unnecessary re-renders (use `React.memo` + stable props).

---

## Phase 5: Test & Verification Checklist

### Automated Gates (Run on Every Change)

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] (Future) Add Vitest + React Testing Library + `@testing-library/jest-dom`:
  - Install as dev deps.
  - Add `vitest.config.ts`.
  - Write one unit test for `DataProvenanceBar` covering: null input, all four levels, fallback=true, very large lag.
  - Add script `"test": "vitest run"` to package.json.
  - Run `npm test` as part of CI gate (add to existing workflow if present).

### Manual / Visual QA (Required Before Merge)

Use both mock backend (`npm run dev`) and real backend (if available) on these surfaces:

1. **Ticker Explorer**
   - Load MSFT, AAPL, a low-liquidity symbol.
   - Verify bar appears below price with correct level color, lag value, session, source.
   - Trigger 30s auto-refresh — timestamps update.
   - Simulate missing provenance (temporarily force null in code) — shows graceful "unavailable" state.

2. **Live Market Board**
   - Board loads with 8 default tickers.
   - Header shows one provenance bar (or per-card if implemented).
   - Click a card (if `onSelectTicker` wired) — no breakage.

3. **Market Context Strip**
   - Strip at top of relevant page shows compact provenance.
   - Values update on the configured refresh interval.
   - Error state in strip still renders (existing error banner + provenance bar should coexist cleanly).

4. **Design System Playground**
   - New section renders 4 variants: fresh/compact, stale/full, unavailable, fallback=true.
   - Visual regression by screenshot (or team review).

5. **Edge Cases**
   - `lag_seconds: 0` (exactly now).
   - `fallback: true` — clear visual treatment (amber/warning treatment).
   - Future timestamps (clock skew) — component clamps or shows "negative lag — clock skew".
   - Very old data (lag > 1h) — "stale" level dominates.

### Contract Validation

- [ ] Python: `pydantic` round-trip test — a `DataProvenance(...)` serializes and the frontend can parse the JSON shape without extra fields.
- [ ] Frontend: Temporary "contract test" page or console assertion that `bundle.provenance` matches the interface exactly when present.

### Documentation Updates (Part of Delivery)

- [ ] Update `EXECUTION_STATUS.md` (root) with a one-line entry under "Completed".
- [ ] Add a 3-bullet "What's New" note to `frontend/console/README.md` or `WORKFLOW.md`.
- [ ] If provenance logic lives in a new backend helper, add a short comment block with the lag/level rules.

---

## Minimal Change Guardrails (Do NOT Do These in This Sprint)

- Do not introduce a full design-system "composed" folder or new barrel restructuring.
- Do not add Radix, floating UI, or new date libraries — use native `Intl` + existing date formatting patterns.
- Do not rewrite SignalCard or MarketNews unless they are the only way to deliver the three primary surfaces.
- Do not add feature flags or new env vars unless backend unavailability behavior requires it.
- Do not change the mock to call real external APIs beyond what it already does (Yahoo).

---

## Rollback / Hotfix Plan

- Component is purely additive + optional prop on existing data shapes.
- Safest rollback: remove the three integration call sites and the component file.
- Backend contract addition is additive (old clients ignore unknown fields if using `extra="ignore"` temporarily, but we use `forbid` — coordinate deployment).
- Keep the old `pulled_at` / `asOf` strings in responses for one release as a bridge if risk is high.

---

## Definition of Done

- [ ] All Phase 0–5 checkboxes complete and evidence attached (PR description or comment).
- [ ] `npm run build` + `typecheck` + `lint` green on the branch.
- [ ] Visual QA signed off by at least one other engineer/designer on the three primary surfaces (screenshots in PR).
- [ ] Backend contract test + one integration test covering the new `DataProvenance` shape pass in CI.
- [ ] Mock and real backend paths produce equivalent provenance shapes (within clock skew).
- [ ] No regressions in existing auto-refresh or error states.
- [ ] Checklist itself updated with "Actual vs Planned" notes for any deviations.

**Owner**: [Assign]
**Reviewers**: [Assign — at least one from platform + one from product]
**Target Merge**: [Date]

---

*This checklist was generated to satisfy H.A.L. Compass engineering standards for contract-first, observable, testable, minimal-but-complete delivery.*