# Prism — Data Science, Made Visual

A holistic, visual place to learn data science — from your first EDA to deploying
models in production. Every concept comes in a **Basic** (intuition + visuals) and
an **Advanced** (math, code, edge cases) depth, switchable with one toggle, and the
flagship lessons are built around **interactive visualizations** you can manipulate.

## What's inside

- **12 modules · ~80 concepts** spanning the whole field: foundations & EDA, math &
  optimization, probability & statistics, data wrangling & SQL, visualization,
  classical ML, deep learning, NLP & LLMs, time series, causal inference,
  MLOps & production, and career/communication.
- **11 live lessons** with custom interactive visualizations:
  - Distribution Explorer · Central Limit Theorem · Hypothesis Testing (p-values)
  - Gradient Descent (loss surface) · Linear Regression by gradient descent
  - Bias-Variance Tradeoff · k-Means · Classification Metrics + ROC
  - Neural Network forward pass · Activation Functions · Correlation / Anscombe
- **Global Basic/Advanced toggle** (persisted) and **per-concept progress** tracking.
- Dark-first design, light mode, full keyboard/focus support.

The remaining concepts render a structured "coming soon" preview with learning
objectives, so the curriculum already feels complete and is trivial to extend —
just add a content component in `src/content/concepts/` and register it.

## Tech

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-based theme tokens)
- **KaTeX** for math · **framer-motion** · **lucide-react**
- Visualizations are hand-built SVG (no chart lib) for full control.
- Fully static — every page is prerendered (SSG). No backend, no database.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (97 static pages)
npm run lint
```

## Project structure

```
src/
  app/                     # routes: /, /learn, /learn/[slug], /roadmap, /about
  components/
    content/               # Tiered (Basic/Advanced), Callout, Math, CodeBlock, Quiz…
    viz/                   # interactive visualizations
    layout/                # header, footer, toggles, logo
    learn/                 # curriculum explorer
    ui/                    # button, card, badge, icon
  content/
    curriculum.ts          # the spine: modules → concepts
    registry.tsx           # slug → live lesson component
    concepts/              # one file per live lesson
  lib/                     # difficulty + progress contexts, math helpers
```

## Adding a concept

1. Add/flip the entry in `src/content/curriculum.ts` (`status: "live"`, `hasViz`).
2. Write `src/content/concepts/<slug>.tsx` using the content primitives and any viz.
3. Register it in `src/content/registry.tsx`.

That's it — routing, metadata, prev/next, and the learn map update automatically.
