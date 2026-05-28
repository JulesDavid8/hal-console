# H.A.L. Console (Production)

**This is the real, production-grade frontend for H.A.L. Compass.**

It was built from day one with **long-term evolvability** as the primary constraint.

## Philosophy

This console exists so that in 2028, 2029, and beyond, adding major new capabilities feels exciting rather than painful.

We made deliberate architectural choices (documented in `/docs/adr` and `/docs/architecture`) to ensure the cost of change decreases over time.

## Current Status (Foundation Phase)

- Vite + React 19 + TypeScript (strict)
- Tailwind + H.A.L. design tokens (integrated from the original prototypes)
- Design System primitives foundation started
- Typed API client layer
- Strong folder structure (design-system, features, lib)

This is intentionally minimal right now. We are establishing the foundation before building significant user-facing surfaces.

## Key Directories

```
src/
├── design-system/     # The heart of long-term consistency and evolution
├── features/          # Domain features (one folder per major capability)
├── lib/
│   ├── api/           # All backend communication
│   └── utils/
├── stores/            # Zustand stores
└── types/
```

## Getting Started (Once Dependencies Are Installed)

```bash
cd frontend/console
npm install
npm run dev
```

## Important Rules (Non-Negotiable)

1. All new UI components must go through the design system first.
2. Features must not import directly from other features.
3. All API access goes through `src/lib/api`.
4. Visual decisions belong in `design-system/tokens` or the design system, never inline.

## Documentation

- [Frontend Foundation Architecture](../../docs/architecture/01-frontend-foundation.md)
- [ADR 0001](../../docs/adr/0001-frontend-architecture-2026.md)

---

Built with extreme care for the long term.
