# StPeteMusic Design System

> Gritty, raw, warehouse-born — like a show flyer stapled to a concrete wall.

---

## Visual Theme

StPeteMusic leads with **cinematic imagery and bold type** — the Warehouse Arts District aesthetic made digital. Dark concrete backgrounds anchor everything while burnt orange punches through like stage lights, nature blue frames the edges like raw steel, and magenta fires for high-energy moments. Video and photography dominate; text earns its space. Grain texture adds tactile depth. Every section feels like you walked into a venue, not a website.

Dark mode is the only mode. Every surface is concrete at night.

---

## Color Palette & Roles

| Semantic Name | Hex | Role |
|---|---|---|
| Background | `#1C1C1C` | Page base — dark concrete |
| Surface | `#545454` | Cards, section fills, elevated surfaces |
| Surface Raised | `#3A3A3A` | Hover cards, inputs, newsletter section |
| Border | `#488DB5` | Nature blue — dividers, card frames, input outlines |
| Border Bright | `#B57048` | Burnt orange — focused/highlighted borders |
| Text Primary | `#FFFFFF` | Headings, primary body |
| Text Secondary | `#CCCCCC` | Captions, metadata |
| Text Muted | `#888888` | Placeholders, disabled |
| Brand Orange | `#B57048` | Primary — highlights, links, overlines, CTAs |
| Brand Blue | `#488DB5` | Accents, card borders, ghost buttons |
| Brand Magenta | `#d71679` | Energy — newsletter CTA, badge moments |

### Tailwind CSS Custom Colors

```js
// tailwind.config.ts
colors: {
  background: '#1C1C1C',
  surface: '#545454',
  'surface-raised': '#3A3A3A',
  border: '#488DB5',
  'border-bright': '#B57048',
  'text-primary': '#FFFFFF',
  'text-secondary': '#CCCCCC',
  'text-muted': '#888888',
  brand: {
    orange: '#B57048',
    blue: '#488DB5',
    magenta: '#d71679',
  },
},
```

---

## Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Brand Wordmark | Montserrat | 900 | Logo treatment |
| Display | Montserrat | 900 (Black) | Hero headlines, stat numbers |
| H1 | Montserrat | 800 (ExtraBold) | Page titles |
| H2 | Montserrat | 700 (Bold) | Section headers |
| H3 | Oswald | 600 (SemiBold) | Card titles, event names |
| Body | Open Sans | 400 (Regular) | Paragraphs, descriptions |
| Caption | Open Sans | 400 (Regular) | Dates, metadata, tags |
| Overline | Oswald | 500 | Category labels — **always orange, all-caps, wide tracking** |
| CTA | Montserrat | 700 (Bold) | Button labels |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Oswald:wght@400;500;600&family=Open+Sans:wght@400;600&display=swap');
```

---

## Gritty Design Elements

- **Grain texture** — `.grain` class (CSS noise overlay via SVG filter, ~4.5% opacity, `mix-blend-mode: overlay`) on surface-level sections
- **SlashDividers only** — no waves, no tron lines. One or two diagonal slashes max per page.
- **Raw card frames** — `border-radius: 2px` (near-square corners), `border: 1px solid #488DB5`, hover transitions to orange
- **Photo overlays** — `.photo-noise` class adds grain on top of all community photos
- **Concrete surfaces** — alternate between `#1C1C1C`, `#545454`, `#3A3A3A` to create depth

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

---

## Page Structure & Section Order

1. **Nav** — Logo + links + orange CTA button
2. **Hero** — Full-screen video loop, wordmark overlay, slash tagline
3. **Stats** — Surface grey, huge numbers, orange Oswald labels
4. **PhotoStrip** — Horizontal scroll, blue-framed cards, orange captions
5. **SlashDivider** — One diagonal cut
6. **Events** — Dark background, image-heavy split layout cards
7. **Vibes** — Surface grey with grain, cinematic asymmetric photo grid
8. **YouTube** — Surface raised with grain, blue-framed embed
9. **SlashDivider** — Flipped
10. **Newsletter** — Surface raised, magenta CTA
11. **Footer** — Near-black, orange overlines

---

## Component Patterns

### Section Overline (always this pattern)

```html
<p class="font-oswald text-sm tracking-[0.5em] uppercase" style="color: #B57048">
  — Section Label
</p>
```

### Section Header

```html
<div class="mb-12">
  <p class="font-oswald text-sm tracking-[0.5em] uppercase mb-4" style="color: #B57048">— Section Label</p>
  <h2 class="font-montserrat font-black text-white uppercase text-4xl md:text-5xl">
    Section Title
  </h2>
</div>
```

### Buttons

| Variant | Background | Text | Hover |
|---|---|---|---|
| Primary | `#B57048` (orange) | `#FFFFFF` | opacity-85 |
| Accent | `#d71679` (magenta) | `#FFFFFF` | opacity-90 |
| Ghost Blue | transparent | `#488DB5` | bg: blue fills, text: white |
| Ghost Orange | transparent | `#B57048` | bg: orange fills, text: white |

```html
<!-- Primary Orange -->
<button class="bg-brand-orange text-white px-8 py-3 font-montserrat font-bold text-sm uppercase tracking-widest hover:opacity-85 transition-opacity" style="border-radius: 2px">
  Get Tickets
</button>

<!-- Ghost Blue -->
<button class="border border-brand-blue text-brand-blue px-8 py-3 font-montserrat font-bold text-sm uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all" style="border-radius: 2px">
  Watch on YouTube
</button>
```

### Event Card

```html
<div class="overflow-hidden" style="background: #3A3A3A; border: 1px solid #488DB5; border-radius: 2px">
  <!-- Large photo — min 400px tall -->
  <div class="relative min-h-[400px]">
    <img class="object-cover w-full h-full" />
    <!-- Grain overlay -->
    <div class="absolute inset-0 photo-noise" style="background: linear-gradient(135deg, rgba(28,28,28,0.3) 0%, transparent 50%, rgba(28,28,28,0.5) 100%)"></div>
  </div>
  <div class="p-8">
    <p class="font-oswald text-xs tracking-widest uppercase mb-3" style="color: #B57048">Monthly · Last Friday</p>
    <h3 class="font-montserrat font-black text-white uppercase text-4xl mb-4">Final Friday.</h3>
    <p class="font-open-sans text-[#CCCCCC] text-lg">Three bands. One night. Suite E Studios.</p>
  </div>
</div>
```

### Navigation

```html
<nav style="background: rgba(28,28,28,0.96); backdrop-filter: blur(8px); border-bottom: 1px solid #488DB5">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
    <!-- Logo -->
    <a><img src="/images/brand/spm-logo-main.png" /></a>
    <!-- Links -->
    <div class="flex gap-10">
      <a class="text-[#CCCCCC] hover:text-white font-open-sans text-base transition-colors">Events</a>
    </div>
    <!-- CTA — ghost orange -->
    <a class="font-montserrat font-bold text-sm uppercase tracking-wide px-5 py-2 hover:bg-brand-orange hover:text-white transition-all"
       style="border: 1px solid #B57048; color: #B57048; border-radius: 2px">
      Get Tickets
    </a>
  </div>
</nav>
```

---

## Layout Principles

- **Max content width:** 1280px (`max-w-7xl mx-auto`)
- **Section padding:** `px-6`
- **Section vertical spacing:** `py-24` – `py-32` — be generous
- **Card corners:** `border-radius: 2px` — raw, industrial, not rounded
- **Card borders:** `1px solid #488DB5` (nature blue) — hover transitions to `#B57048` orange
- **Mobile-first always**

---

## Depth & Elevation (Surface System)

| Level | Hex | Usage |
|---|---|---|
| 0 — Page base | `#1C1C1C` | Overall background, dark sections |
| 1 — Surface | `#545454` | Stats, Vibes section |
| 2 — Surface Raised | `#3A3A3A` | Newsletter, YouTube, event text panels |
| 3 — Cards | `#2A2A2A` | Photo placeholders, artist cards |
| Footer | `#141414` | Deepest layer |

---

## Glow Effects (use sparingly)

```css
.glow-orange  { box-shadow: 0 0 28px rgba(181, 112, 72, 0.5); }
.glow-blue    { box-shadow: 0 0 28px rgba(72, 141, 181, 0.5); }
.glow-magenta { box-shadow: 0 0 28px rgba(215, 22, 121, 0.5); }
```

---

## Design Guardrails

**DO:**
- Use orange Oswald overlines on every section, all-caps, wide tracking
- Use blue (`#488DB5`) for all card borders and input outlines
- Use magenta only for the highest-energy CTA (newsletter subscribe button)
- Add `.grain` class to surface-level sections for texture
- Let photos be large and cinematic — minimum 400px tall for event photos
- Keep card corners `border-radius: 2px` — raw industrial feel
- Use slash taglines: `Live Music / Local Artists / Real Community`

**DON'T:**
- Use rounded-full corners on cards (only okay for pills/tags if needed)
- Use purple, lavender, or any cool-tone brand colors
- Compress photo sections — vibes and events need visual breathing room
- Use WaveDivider, TronDivider, or PalmDivider — SlashDivider only
- Use more than 2 brand accent colors in a single component

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
Background: #1C1C1C  |  Surface: #545454   |  Surface-raised: #3A3A3A
Orange:     #B57048  |  Blue:    #488DB5   |  Magenta: #d71679
Text:       #FFFFFF  |  Muted:   #888888
Border:     1px solid #488DB5, border-radius: 2px
Overlines:  Oswald, orange (#B57048), tracking-[0.5em], uppercase
Headlines:  Montserrat 700-900, uppercase, text-white
Tagline:    "X / Y / Z" separated by spaced slashes
Grain:      Add .grain class to surface sections
```

### Ready-to-use prompts

- "Build a hero section following DESIGN.md — video loop background, spm-logo-palm.png overlay, slash-separated tagline, orange primary CTA + blue ghost CTA"
- "Create an event card using surface-raised (#3A3A3A), blue border (1px solid #488DB5), orange Oswald overline, white Montserrat title, large photo panel"
- "Style a navbar with #1C1C1C/96% background, spm-logo-main.png, orange ghost CTA button"
- "Build a stats section with .grain on #545454 background, three huge white Montserrat numbers, orange Oswald overline labels"
- "Create a vibes photo grid — asymmetric 3-col layout, blue borders, grain overlay, orange accent labels"
- "Build a newsletter CTA section — #3A3A3A with .grain, orange overline, white Montserrat heading, magenta subscribe button"
