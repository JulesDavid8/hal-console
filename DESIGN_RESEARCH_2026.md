# H.A.L. Compass UI/UX Research & Strategy — 2026 Redesign

**Date**: 2026-05-28  
**Conducted by**: Full Agent Team (Researcher, Designer, Live Tester, Data Quality Reviewer, Implementer, Coordinator)

---

## 1. Research Findings: What Makes Trading & Intelligence Platforms Succeed

### Top Platforms Analyzed

**Bloomberg Terminal**
- Strengths: Unmatched information density, speed, customization, command power.
- Visual language: Functional, slightly retro, high contrast, heavy use of color for meaning.
- Weaknesses for us: Too cold, intimidating, expensive, not approachable.

**Thinkorswim (TD Ameritrade)**
- Strengths: Extremely deep functionality, excellent charting, paper trading, education.
- Tone: Professional but not cold. Multi-color system used semantically.
- Key lesson: Depth is rewarded, but the UI still feels like a tool you can grow into.

**TradingView**
- Strengths: Beautiful charts, social layer (ideas, scripts), accessibility.
- Tone: Modern, clean, approachable without being childish.
- Key lesson: Visual quality + community creates stickiness even for complex tools.

**Modern "Calm Power" Tools** (Linear, Arc, Notion, Raycast)
- Strengths: Thoughtful defaults, excellent micro-interactions, breathing room, personality without noise.
- Tone: Confident, modern, respectful of the user’s time and intelligence.

**Retail Trading Apps** (Robinhood, Webull, Public)
- Strengths: Low friction, modern aesthetics, fast onboarding.
- Weaknesses: Often feel unserious or gamified to professional users.

### Patterns of Success

1. **Semantic & Restrained Color Use** — Color should mean something (bullish/bearish, alert level, data type). Overuse kills meaning.
2. **Information Density with Hierarchy** — Pros want a lot of data, but it must be scannable.
3. **Speed to Insight** — The best tools reduce the gap between "I wonder about X" and "I understand X".
4. **Trust & Calm** — Financial decisions are high-stakes. The interface should feel reliable and steady, not flashy.
5. **Familiar yet Distinct** — Users bring mental models from Bloomberg/Thinkorswim/TradingView. Meet them there, then give them something better.

---

## 2. Current H.A.L. Compass Problems (Agent Consensus)

- **All-green fatigue**: The previous heavy phosphor-green aesthetic reduces readability and makes "green" lose its meaning as a bullish signal.
- **Inconsistent visual language**: Mix of terminal nostalgia and modern web without a clear voice.
- **Low perceived quality**: The current design does not match the sophistication of the underlying data and models (insider transactions, scenario analysis, optimization).
- **Weak "so what?" moment**: Even when data is good, the UI doesn’t make the insight feel powerful or trustworthy fast enough.
- **Missing personality with professionalism**: It doesn’t yet feel like a tool that elite analysts would proudly use every day.

---

## 3. Recommended Design Direction: **"Quiet Authority"**

### Core Positioning
H.A.L. Compass should feel like the **calm, precise, and slightly premium workstation** that serious investors use when they want to understand what the smartest money is actually doing.

It should feel:
- **Familiar** to users of Bloomberg, Thinkorswim, and TradingView.
- **New and elevated** — more modern, clearer, and more thoughtful than those tools.
- **Trustworthy** above all else.

### Visual Language Principles

**Palette Direction**
- Base: Deep cool charcoal / near-black with subtle blue undertones (not green-tinted).
- Primary Accent: A refined, sophisticated teal/cyan (still carries a light terminal echo but feels modern and expensive).
- Semantic Colors: Used deliberately and sparingly.
  - Green = Accumulation / Bullish (only when it actually means something)
  - Red = Distribution / Bearish
  - Amber = Warnings / Attention
  - Teal/Cyan = Data highlights, technical elements
- Text: High-contrast neutral with excellent muted variants.

**Typography**
- Body & UI: Clean, highly legible sans-serif (Inter or similar).
- Data, tickers, commands: Strong monospace (Share Tech Mono or similar).
- Headers: Confident but not decorative.

**Density & Space**
- High information density is acceptable and even desirable.
- However, use excellent visual hierarchy, generous padding inside cards, and clear separation between sections.
- Avoid the "wall of neon text" problem.

**Tone**
- Quiet confidence.
- Professional without being cold.
- Modern without being trendy.
- Powerful without being intimidating.

---

## 4. Experience Goals (Live Tester + Designer)

For a user coming from Robinhood / Ameritrade / Bloomberg:

- They should feel: *"This finally respects my intelligence and gives me a real edge."*
- Time-to-insight for a new ticker should be very fast.
- The interface should make complex insider data feel understandable and actionable.
- It should feel like a tool they would use daily for serious work, not a toy.

---

## 5. Immediate Execution Priorities (Next Phase)

1. **Refine the full design token system** around the "Quiet Authority" direction.
2. **Redesign key screens** starting with the Ticker Explorer (this is the primary "aha" moment).
3. **Strengthen visual hierarchy and typography**.
4. **Improve data visualization quality** (charts, tables, summaries).
5. **Add micro-interactions and polish** that communicate quality and care.
6. **Create a living design system documentation page** that reflects the new direction.

This is not a quick color swap. This is a full strategic visual and experiential redesign.

---

**Status**: Research & Strategy Phase Complete  
**Next**: Detailed token refinement + component redesign execution
