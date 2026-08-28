# SentimentIQ dark theme delivery summary

## What changed

SentimentIQ now opens in a dark analytics workspace rather than the previous light/cream canvas. The new system uses a layered near-black base: `#0D1524` for the page, `#111D30` for deeper rails and recessed surfaces, `#162238` for cards, and `#1B2A43` for controls and elevated content. The dashboard, Reports, Script analysis, Upload data, landing/auth, reviews, and settings views all consume the same token system.

The primary action/navigation color is a readable sky blue, while the complementary orange is reserved for annotation, provenance, and emphasis. Positive, neutral, and negative sentiment colors were tuned separately for dark surfaces so they remain recognizable without becoming neon. The remaining light-mode assumptions in the import and analysis guide panels were replaced with dark elevated surfaces.

## Final token list

| Token | Hex value | Role |
|---|---|---|
| `--paper` | `#0D1524` | Main page background |
| `--paper-deep` | `#111D30` | Rail, recessed surfaces, deep panels |
| `--surface` | `#162238` | Cards and primary analytical surfaces |
| `--surface-tint` | `#1B2A43` | Inputs, filters, elevated controls |
| `--ink` | `#F4F7FB` | Primary text and headings |
| `--ink-soft` | `#D8E4F0` | Secondary strong text |
| `--muted-ink` | `#A9B9CB` | Body and supporting copy |
| `--faint-ink` | `#8295AB` | Quiet metadata and labels |
| `--line` | `#2E435E` | Subtle borders and dividers |
| `--line-strong` | `#45617F` | Focused/strong borders |
| `--primary` | `#62A8FF` | Primary action and navigation signal |
| `--primary-deep` | `#9BC7FF` | Hover/link emphasis |
| `--primary-soft` | `#1C3C66` | Primary tinted surfaces |
| `--accent` | `#FF9A5C` | Provenance and annotation signal |
| `--accent-deep` | `#FFB27A` | Accent text and highlighted labels |
| `--accent-soft` | `#5A2E1A` | Accent tinted surfaces |
| `--positive` | `#54D889` | Positive chart and status signal |
| `--positive-deep` | `#8EE7AF` | Positive badge text |
| `--positive-soft` | `#164A32` | Positive badge surface |
| `--neutral` | `#F5B942` | Neutral chart and status signal |
| `--neutral-deep` | `#FFD77A` | Neutral badge text |
| `--neutral-soft` | `#5A4310` | Neutral badge surface |
| `--negative` | `#FF6F73` | Negative chart and status signal |
| `--negative-deep` | `#FF9B9B` | Negative badge text |
| `--negative-soft` | `#5A2025` | Negative badge surface |
| `--grid` | `#21344D` | Chart grid and background structure |

## Contrast verification

The selected text and control pairings were checked programmatically using the WCAG relative-luminance formula. All text pairings below meet the WCAG AA 4.5:1 threshold for normal text; the primary body pairings are comfortably above the threshold.

| Pair | Ratio | Result |
|---|---:|---|
| `#D8E4F0` on `#0D1524` body text | 14.15:1 | Pass |
| `#F4F7FB` on `#162238` card text | 14.81:1 | Pass |
| `#A9B9CB` on `#162238` muted text | 7.95:1 | Pass |
| `#8295AB` on `#162238` faint text | 5.18:1 | Pass |
| `#FFB27A` on `#0D1524` accent links | 10.35:1 | Pass |
| `#07111F` on `#62A8FF` primary button | 7.72:1 | Pass |
| `#8EE7AF` on `#164A32` positive badge | 6.89:1 | Pass |
| `#FFD77A` on `#5A4310` neutral badge | 6.79:1 | Pass |
| `#FF9B9B` on `#5A2025` negative badge | 6.24:1 | Pass |

The `#2E435E` border against `#0D1524` is intentionally a subtle non-text boundary at 1.81:1; WCAG text contrast does not apply to decorative borders. Focused controls use the stronger border and blue focus treatment.

## Before and after

| Before | After |
|---|---|
| Light/cream page and card surfaces | Layered charcoal, navy, and elevated blue-black surfaces |
| Dark mode was optional and not the default | Dark mode is the default on first load |
| Light-mode blue/orange values reused in dark contexts | Primary, accent, and semantic colors tuned for dark backgrounds |
| Import and analysis guide panels assumed a light background | All major guide panels now remain dark and readable |
| Text hierarchy was optimized for light surfaces | Off-white primary text, cool-gray body text, and dimmer metadata create hierarchy |

## Validation

The frontend passed `pnpm check` and a production `pnpm build`. Desktop screenshots were captured for landing, Dashboard, Upload data, Script analysis, and Reports; mobile screenshots were captured for Dashboard, Upload data, and Script analysis. The existing upload, PDF/DOCX extraction, dashboard, Reports, and transcript-analysis flows were preserved.
