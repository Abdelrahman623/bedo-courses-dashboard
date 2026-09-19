# 📐 DESIGN.md — Bedo Learn Design System (Impeccable Standard)

Crafted following the [pbakaus/impeccable](https://github.com/pbakaus/impeccable) design language: elimination of AI design clichés, high information density, calibrated contrast, and engineering-grade craftsmanship.

---

## 🚫 Anti-Patterns Eliminated (Impeccable Guardrails)

| AI Cliché / Anti-Pattern | Impeccable Solution Applied |
|---|---|
| **Gradient text on headings** (`text-gradient-amber`) | ❌ Banned. Headings use pure high-contrast `#FFFFFF` / `#F4F4F5` with subtle `tracking-tight`. |
| **Nested cards inside cards** | ❌ Banned. Replaced with single unified metric panels with 1px structural dividers (`divide-x divide-white/[0.08]`). |
| **Rounded icons in colored boxes next to every stat** | ❌ Banned. Replaced with crisp tabular typography, mono metrics (`tabular-nums font-mono`), and subtle status dots. |
| **Floaty hover scaling** (`whileHover: { scale: 1.05 }`) | ❌ Banned. Replaced with crisp 100ms micro-border transitions (`border-white/[0.08] → border-white/[0.16]`) and tactile `active:scale-[0.98]`. |
| **Bouncy / elastic spring easing** | ❌ Banned. Replaced with high-performance CSS transitions (`150ms ease-out`). |
| **Emojis in column headers** (`💡 Idea`, `🚀 Deployed`) | ❌ Banned. Replaced with clean, professional status pills and 2px colored status indicators. |

---

## 🎨 Color Tokens & Contrast

- **Base Canvas**: `#0A0D14` (Deep obsidian black, low glare)
- **Primary Surface**: `#131722` (Charcoal slate with 1px top highlight: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]`)
- **Border Default**: `rgba(255, 255, 255, 0.08)`
- **Border Hover**: `rgba(255, 255, 255, 0.16)`
- **Primary Accent (Warm Amber)**: `#F0A500` (Used with restraint for primary actions, active focus, and streak indicators)
- **Success Accent (Mint)**: `#00C896` (Used for completed topics and target milestones)
- **Information Accent (Sky)**: `#4FC3F7` (Used for active courses and live deployments)

---

## 🔤 Typography & Density

- **Headings**: Inter, `font-bold tracking-tight text-white`
- **Metrics / Numbers / Timers**: JetBrains Mono, `font-mono tabular-nums font-semibold`
- **Secondary Labels**: Inter, `text-xs text-zinc-400 font-medium`
- **Section Kickers**: `uppercase tracking-wider text-[11px] font-semibold text-zinc-500`
