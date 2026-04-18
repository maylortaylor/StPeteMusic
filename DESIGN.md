# StPeteMusic Design System

> Dark, bold, typography-forward — like seeing your name on the marquee.

---

## Visual Theme

StPeteMusic leads with **typography as the visual identity** — oversized, spaced letterforms do the heavy lifting. Inspired by WantedForNothing.com's deliberate, confident layout: bold section headings, slash-separated descriptors, large numerics, and generous whitespace that lets the music breathe. Deep black backgrounds anchor everything while electric azure and magenta punch through like stage lights. Every section feels intentional — nothing added that doesn't earn its place.

Dark mode is the only mode. Every surface is a venue at night.

---

## Color Palette & Roles

| Semantic Name | Hex | Role |
|---|---|---|
| Background | `#121212` | Page backgrounds, dark base |
| Surface | `#1E1E1E` | Cards, modals, elevated sections |
| Surface Raised | `#2A2A2A` | Hover cards, nav dropdowns |
| Border | `#2E2E2E` | Dividers, input outlines, subtle separators |
| Border Bright | `#444444` | Focused states, highlighted borders |
| Text Primary | `#FFFFFF` | Headings, primary body copy |
| Text Secondary | `#A0A0A0` | Captions, metadata, muted labels |
| Text Muted | `#666666` | Placeholders, disabled |
| Brand Azure | `#59acc1` | Primary brand color — headers, highlights, links, CTAs |
| Brand Magenta | `#d71679` | Accent — CTAs, energy moments, badges, hover glow |
| Brand Salmon | `#FF7F72` | Secondary accent — warmth, tags, secondary highlights |
| Success | `#4CAF50` | Confirmations, newsletter signup success |
| Error | `#CF6679` | Errors, destructive actions |

### Tailwind CSS Custom Colors

```js
// tailwind.config.ts
colors: {
  background: '#121212',
  surface: '#1E1E1E',
  'surface-raised': '#2A2A2A',
  border: '#2E2E2E',
  'border-bright': '#444444',
  'text-primary': '#FFFFFF',
  'text-secondary': '#A0A0A0',
  'text-muted': '#666666',
  brand: {
    azure: '#59acc1',
    magenta: '#d71679',
    salmon: '#FF7F72',
  },
},
```

---

## Typography

| Role | Font | Weight | Size (Tailwind) | Usage |
|---|---|---|---|---|
| Brand Wordmark | Montserrat | 900 | `text-2xl tracking-[0.3em]` | Logo: `S T P E T E M U S I C` |
| Display | Montserrat | 900 (Black) | `text-6xl` – `text-8xl` | Hero headlines, stat numbers |
| H1 | Montserrat | 800 (ExtraBold) | `text-4xl` – `text-5xl` | Page titles |
| H2 | Montserrat | 700 (Bold) | `text-3xl` – `text-4xl` | Section headers |
| H3 | Oswald | 600 (SemiBold) | `text-xl` – `text-2xl` | Card titles, event names |
| Body | Open Sans | 400 (Regular) | `text-base` – `text-lg` | Paragraphs, descriptions |
| Caption | Open Sans | 400 (Regular) | `text-sm` | Dates, metadata, tags |
| Overline | Oswald | 500 | `text-xs tracking-widest uppercase` | Category labels |
| CTA | Montserrat | 700 (Bold) | `text-sm` – `text-base` | Button labels |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Oswald:wght@400;500;600&family=Open+Sans:wght@400;600&display=swap');
```

---

## Spacing Scale

Base unit: 4px (Tailwind default)

| Token | Value | Use |
|---|---|---|
| xs | 4px (`p-1`) | Icon gaps, tight inline spacing |
| sm | 8px (`p-2`) | Inner component padding |
| md | 16px (`p-4`) | Standard component padding |
| lg | 24px (`p-6`) | Card padding, section inner |
| xl | 32px (`p-8`) | Component separation |
| 2xl | 48px (`py-12`) | Section gaps |
| 3xl | 80px–120px (`py-20`–`py-32`) | Hero sections — use generously |

> WFN influence: sections breathe with large vertical padding. Don't compress.

---

## Page Structure & Section Order

Mirrors WantedForNothing's homepage flow, adapted to StPeteMusic:

1. **Nav** — Wordmark + links (Events, Discover, About) + CTA ("Get Tickets")
2. **Hero** — Full-screen, wordmark large, slash-separated tagline, scroll CTA
3. **Shows** — Grid of upcoming/recent events with image cards (like WFN's "Work" section)
4. **By the Numbers** — Large stat counters (100+ Shows, 50+ Artists, 5+ Years)
5. **Vibes** — Community culture photos, show moments, behind-the-scenes
6. **Discover** — Featured artists/bands from St. Pete scene
7. **Newsletter CTA** — Full-width dark section with email signup
8. **Footer** — Links, social icons, location (`St. Pete, FL — EST`)

---

## Component Patterns

### Brand Wordmark (Spaced Treatment)

The brand name uses wide letter-spacing à la WFN — this is the signature visual.

```html
<!-- Navbar wordmark -->
<a class="font-montserrat font-black text-white text-lg tracking-[0.25em] uppercase">
  StPeteMusic
</a>

<!-- Hero wordmark (large) -->
<h1 class="font-montserrat font-black text-white text-5xl md:text-7xl lg:text-8xl tracking-[0.15em] uppercase">
  StPeteMusic
</h1>
```

### Hero Section

```html
<section class="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-center px-4 py-32">
  <!-- Overline -->
  <p class="font-oswald text-[#59acc1] text-xs tracking-[0.4em] uppercase mb-6">
    St. Pete, FL
  </p>
  <!-- Wordmark -->
  <h1 class="font-montserrat font-black text-white text-6xl md:text-8xl tracking-[0.15em] uppercase mb-8">
    StPeteMusic
  </h1>
  <!-- Slash-separated tagline (WFN signature) -->
  <p class="font-open-sans text-[#A0A0A0] text-lg md:text-xl">
    Live Music&nbsp;&nbsp;/&nbsp;&nbsp;Local Artists&nbsp;&nbsp;/&nbsp;&nbsp;Real Community
  </p>
  <!-- Scroll or CTA -->
  <div class="mt-12 flex gap-4">
    <a class="bg-[#59acc1] text-white px-8 py-4 font-montserrat font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-all rounded-lg">
      See Events
    </a>
    <a class="border border-[#444] text-[#A0A0A0] px-8 py-4 font-montserrat font-bold text-sm uppercase tracking-wide hover:border-white hover:text-white transition-all rounded-lg">
      Discover Artists
    </a>
  </div>
</section>
```

### By the Numbers Section

```html
<section class="bg-[#121212] py-24 border-y border-[#2E2E2E]">
  <div class="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
    <div>
      <p class="font-montserrat font-black text-white text-6xl md:text-7xl mb-2">100+</p>
      <p class="font-oswald text-[#59acc1] text-xs tracking-[0.3em] uppercase">Shows Hosted</p>
    </div>
    <div>
      <p class="font-montserrat font-black text-white text-6xl md:text-7xl mb-2">50+</p>
      <p class="font-oswald text-[#59acc1] text-xs tracking-[0.3em] uppercase">Local Artists</p>
    </div>
    <div>
      <p class="font-montserrat font-black text-white text-6xl md:text-7xl mb-2">5+</p>
      <p class="font-oswald text-[#59acc1] text-xs tracking-[0.3em] uppercase">Years Running</p>
    </div>
  </div>
</section>
```

### Section Header (WFN-style)

```html
<div class="mb-12">
  <p class="font-oswald text-[#59acc1] text-xs tracking-[0.4em] uppercase mb-3">— Section Label</p>
  <h2 class="font-montserrat font-black text-white text-4xl md:text-5xl uppercase">
    Section Title
  </h2>
</div>
```

### Event / Show Card

```html
<div class="bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl overflow-hidden hover:border-[#59acc1] transition-colors group cursor-pointer">
  <div class="aspect-video bg-[#2A2A2A] overflow-hidden">
    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>
  <div class="p-6">
    <div class="flex items-center justify-between mb-3">
      <p class="font-oswald text-[#59acc1] text-xs tracking-widest uppercase">Final Friday</p>
      <p class="font-open-sans text-[#666] text-xs">Jan 31</p>
    </div>
    <h3 class="font-oswald text-white text-xl font-semibold mb-1">Band Name</h3>
    <p class="font-open-sans text-[#A0A0A0] text-sm">Suite E Studios · 8pm · $10</p>
  </div>
</div>
```

### Vibes Section (Culture / Community Photos)

```html
<section class="bg-[#121212] py-24">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="mb-12">
      <p class="font-oswald text-[#d71679] text-xs tracking-[0.4em] uppercase mb-3">— The Vibe</p>
      <h2 class="font-montserrat font-black text-white text-4xl md:text-5xl uppercase">
        Real Shows.<br />Real People.
      </h2>
    </div>
    <!-- Asymmetric photo grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div class="col-span-2 md:col-span-2 aspect-[16/9] bg-[#1E1E1E] rounded-xl overflow-hidden">
        <img class="w-full h-full object-cover" />
      </div>
      <div class="aspect-square bg-[#1E1E1E] rounded-xl overflow-hidden">
        <img class="w-full h-full object-cover" />
      </div>
      <div class="aspect-square bg-[#1E1E1E] rounded-xl overflow-hidden">
        <img class="w-full h-full object-cover" />
      </div>
      <div class="col-span-2 aspect-[16/7] bg-[#1E1E1E] rounded-xl overflow-hidden">
        <img class="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</section>
```

### Navigation

```html
<nav class="bg-[#121212]/90 border-b border-[#2E2E2E] sticky top-0 z-50 backdrop-blur-sm">
  <div class="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
    <a class="font-montserrat font-black text-white text-sm tracking-[0.3em] uppercase">
      StPeteMusic
    </a>
    <div class="hidden md:flex items-center gap-10">
      <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Events</a>
      <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Discover</a>
      <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">About</a>
    </div>
    <a class="border border-[#59acc1] text-[#59acc1] px-5 py-2 font-montserrat font-bold text-xs uppercase tracking-wide hover:bg-[#59acc1] hover:text-white transition-all rounded-lg">
      Get Tickets
    </a>
  </div>
</nav>
```

### Buttons

| Variant | Background | Text | Hover |
|---|---|---|---|
| Primary | `#59acc1` (azure) | `#FFFFFF` | opacity-90 |
| Accent | `#d71679` (magenta) | `#FFFFFF` | opacity-90, magenta glow |
| Ghost | transparent | `#59acc1` | bg: azure fills, text: white |
| Outline | transparent | `#FFFFFF` | bg: white/10 |

```html
<!-- Primary -->
<button class="bg-[#59acc1] text-white px-6 py-3 rounded-lg font-montserrat font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-all">
  See Events
</button>

<!-- Ghost / Outline -->
<button class="border border-[#59acc1] text-[#59acc1] px-6 py-3 rounded-lg font-montserrat font-bold text-sm uppercase tracking-wide hover:bg-[#59acc1] hover:text-white transition-all">
  Learn More
</button>
```

### Newsletter Signup

```html
<section class="bg-[#1E1E1E] border-y border-[#2E2E2E] py-24">
  <div class="max-w-2xl mx-auto px-4 text-center">
    <p class="font-oswald text-[#59acc1] text-xs tracking-[0.4em] uppercase mb-4">— Stay in the Loop</p>
    <h2 class="font-montserrat font-black text-white text-4xl md:text-5xl uppercase mb-4">
      Don't Miss a Show
    </h2>
    <p class="font-open-sans text-[#A0A0A0] mb-10">
      Monthly roundup of Final Friday lineups, new artists, and St. Pete scene news.
    </p>
    <form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        placeholder="your@email.com"
        class="flex-1 bg-[#121212] border border-[#2E2E2E] text-white placeholder-[#666] rounded-lg px-4 py-3 focus:outline-none focus:border-[#59acc1] transition-colors text-sm"
      />
      <button
        type="submit"
        class="bg-[#59acc1] text-white px-6 py-3 rounded-lg font-montserrat font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-all whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  </div>
</section>
```

### Footer

```html
<footer class="bg-[#121212] border-t border-[#2E2E2E] py-16">
  <div class="max-w-7xl mx-auto px-4 md:px-8">
    <div class="flex flex-col md:flex-row justify-between gap-12 mb-12">
      <div>
        <p class="font-montserrat font-black text-white text-sm tracking-[0.3em] uppercase mb-3">StPeteMusic</p>
        <p class="font-open-sans text-[#666] text-sm">St. Petersburg, FL — EST</p>
      </div>
      <div class="flex gap-16">
        <div>
          <p class="font-oswald text-[#59acc1] text-xs tracking-widest uppercase mb-4">Shows</p>
          <div class="flex flex-col gap-2">
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Final Friday</a>
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Instant Noodles</a>
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Art Walk</a>
          </div>
        </div>
        <div>
          <p class="font-oswald text-[#59acc1] text-xs tracking-widest uppercase mb-4">Follow</p>
          <div class="flex flex-col gap-2">
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Instagram</a>
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">YouTube</a>
            <a class="font-open-sans text-[#A0A0A0] text-sm hover:text-white transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-[#2E2E2E] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="font-open-sans text-[#666] text-xs">© 2025 StPeteMusic / Suite E Studios</p>
      <p class="font-oswald text-[#666] text-xs tracking-widest uppercase">Warehouse Arts District · St. Pete FL</p>
    </div>
  </div>
</footer>
```

---

## Layout Principles

- **Max content width:** 1280px (`max-w-7xl mx-auto`)
- **Section padding:** `px-4 sm:px-6 lg:px-8`
- **Section vertical spacing:** `py-20` – `py-32` — be generous (WFN influence)
- **Card grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- **Hero:** `min-h-screen`, centered content, large wordmark
- **Mobile-first always** — base styles for mobile, responsive overrides at `sm:` `md:` `lg:`

---

## Depth & Elevation

| Level | Usage | Class |
|---|---|---|
| 0 | Flat page elements | none |
| 1 | Cards, inputs | `shadow-sm shadow-black/50` |
| 2 | Dropdowns, hover cards | `shadow-lg shadow-black/50` |
| 3 | Modals | `shadow-2xl shadow-black/80` |

**Glow effects** (use sparingly on hero/CTA elements):
```css
.glow-azure { box-shadow: 0 0 20px rgba(89, 172, 193, 0.3); }
.glow-magenta { box-shadow: 0 0 20px rgba(215, 22, 121, 0.3); }
```

---

## Design Guardrails

**DO:**
- Use the spaced wordmark treatment (`tracking-[0.25em]` or more) on the brand name everywhere
- Use slash-separated taglines for hero subheads: `Live Music / Local Artists / St. Pete FL`
- Use large stat numbers (display-size, Montserrat Black) for social proof sections
- Use `#121212` for all page backgrounds — never pure `#000000`
- Keep overlines in Azure (`#59acc1`), small, all-caps, widely tracked
- Let typography do the heavy lifting — sections can be mostly text
- Keep vertical padding generous (`py-20`+) — breathing room is the design

**DON'T:**
- Compress sections — whitespace is intentional
- Use decorative or script fonts — Montserrat/Oswald/Open Sans only
- Use light backgrounds — dark-only brand
- Write hype copy ("SO EXCITED!", "AMAZING!!") — be direct and real
- Use more than 2 brand accent colors in a single component
- Skip the overline label on major sections — it anchors the hierarchy

---

## Voice & Copy Style

> "Laid-back, knowledgeable best friend who knows every band in St. Pete."

- **Direct:** "Movie Props live at Suite E. Feb 7. Go." — not "We are SO EXCITED to announce..."
- **Concise:** No filler. Every sentence earns its place.
- **Local:** St. Pete specific — not "Tampa Bay area" generic.
- **Inclusive:** All genres. All types. No gatekeeping.
- **Slash style for taglines:** `Live Music / Community / St. Pete FL`

---

## Agent Prompt Guide

Quick reference for building new components:

```
Background: #121212  |  Surface: #1E1E1E    |  Border: #2E2E2E
Azure:      #59acc1  |  Magenta: #d71679    |  Salmon: #FF7F72
Text:       #FFFFFF  |  Muted:   #A0A0A0
Headlines:  Montserrat 700–900 + tracking-[0.15em]  |  Accents: Oswald  |  Body: Open Sans
Tagline format: "X / Y / Z" separated by spaced slashes
```

### Ready-to-use prompts

- "Build a hero section following DESIGN.md — large spaced Montserrat wordmark, slash-separated tagline, two CTA buttons"
- "Create an event card using the surface color (#1E1E1E), azure overline label, Oswald event name, hover border to azure"
- "Style a navbar with #121212 background, spaced-tracking wordmark in Montserrat Black, ghost CTA button in azure"
- "Build a By the Numbers section with three large Montserrat Black counters (100+ Shows, 50+ Artists, 5+ Years) on dark background"
- "Create a Vibes photo grid — asymmetric layout, 5 photos, dark surface placeholder backgrounds, rounded-xl"
- "Build a newsletter CTA section — centered, azure overline, Montserrat Black heading, email input + azure subscribe button"
