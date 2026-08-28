# SentimentIQ redesign delivery summary

## Chosen direction

SentimentIQ now follows **Quiet Signal**, a contemporary editorial information-design direction for B2B analytics. The experience uses warm paper surfaces, deep blue-pine ink, Signal Teal as the ownable brand color, Space Grotesk for analytical hierarchy, and DM Sans for utilitarian controls and source details.

## Before and after

| Area | Before | After |
|---|---|---|
| Brand system | The deployed app mixed cream, teal, blue, purple, coral, and several neutral variants without a documented system. | All surfaces, controls, navigation, badges, charts, alerts, and empty states draw from explicit CSS variables in `client/src/index.css`. |
| Landing/auth | A clean split layout, but the first impression read mostly as a standard login screen. | The landing view now pairs the auth card with evidence-first copy, a recurring signal mark, source-context preview sheet, report-like rules, and the same typography/color language as the workspace. |
| Workspace shell | Persistent navigation existed, but the visual hierarchy was relatively uniform across cards. | The rail, topbar, page headers, scope bar, editorial eyebrows, signal motif, paper surfaces, and asymmetric analytical groupings create one consistent operating surface. |
| Reports | Executive summary and product lens were present, but there was no sentiment distribution visualization. | Reports now include a responsive Positive / Neutral / Negative bar chart with axis labels, semantic colors, visible values, a hover tooltip with exact counts and share, and a provenance note. |
| Empty states | Empty screens were informative but visually repetitive. | Empty states use the signal-bar motif, clearer action language, and preserved provenance cues, including upload affordances. |
| Responsive behavior | Existing pages were primarily desktop-oriented. | Sidebar, controls, cards, chart, landing/auth, explorer, and settings layouts adapt down to a 390px viewport without horizontal page overflow. |

## Report data wiring

The bar chart is not backed by placeholder counts. It receives the same `filteredReviews` collection used by the dashboard and reports scope. In the static demo, a user selects a CSV in **Upload data**; the client parses rows, stores them in browser `localStorage`, and routes to `/reports`. The chart derives each bar count from the imported rows' `sentiment` field, and the tooltip derives the percentage from the selected collection. When there are no rows, the component deliberately renders an empty state rather than fabricated values.

The lightweight CSV parser recognizes common headers for text (`review`, `comment`, `feedback`, `text`), sentiment (`sentiment`, `label`, `polarity`), product (`product`, `item`, `sku`), rating (`rating`, `score`, `stars`), and date (`date`, `created`, `time`, `timestamp`). This keeps the report behavior transparent while preserving the source filename on each imported row.

## Reusable color tokens

| Token | Hex | Intended use |
|---|---:|---|
| `--paper` | `#F5F3EE` | Warm workspace and landing base |
| `--paper-deep` | `#EAE8E0` | Soft controls, separators, and secondary surfaces |
| `--surface` | `#FFFDF9` | Paper report cards and input surfaces |
| `--surface-tint` | `#F9F8F4` | Quiet inset surfaces and filters |
| `--ink` | `#15323A` | Headings, primary text, and navigation anchor |
| `--ink-soft` | `#27464B` | Secondary dark text and code-like metadata |
| `--muted-ink` | `#5D6C70` | Body copy, helper text, and axis labels |
| `--faint-ink` | `#899497` | Low-priority metadata and disabled-adjacent copy |
| `--line` | `#DCDDD6` | Hairline borders and report rules |
| `--line-strong` | `#C8CEC8` | Input borders and emphasized separators |
| `--signal` | `#0F6260` | Primary brand/nav/action color |
| `--signal-deep` | `#0A4746` | Text on Signal Teal-soft surfaces and hover states |
| `--signal-soft` | `#DCEEEA` | Active nav, info notes, and brand-tinted surfaces |
| `--terracotta` | `#D96C4A` | Rare warmth accent and purposeful annotation |
| `--terracotta-deep` | `#9E422E` | Terracotta text on light surfaces |
| `--terracotta-soft` | `#F8E5DE` | Terracotta badge background |
| `--positive` | `#2A7F62` | Positive chart bar and positive indicator |
| `--positive-deep` | `#176044` | Positive badge text |
| `--positive-soft` | `#E1F0E8` | Positive badge background |
| `--neutral` | `#A36A00` | Neutral chart bar and neutral indicator |
| `--neutral-deep` | `#7C4E00` | Neutral badge text |
| `--neutral-soft` | `#F7EBCF` | Neutral badge background |
| `--negative` | `#B64B49` | Negative chart bar and negative indicator |
| `--negative-deep` | `#8D3437` | Negative badge text |
| `--negative-soft` | `#F7E2E0` | Negative badge background |
| `--grid` | `#E3E3DD` | Chart grid lines and analytical guides |

## Validation

The frontend passed `pnpm check` and the production `pnpm build`. Desktop and mobile screenshots were captured for the landing, dashboard, reports, and upload routes. The local preview smoke test confirmed sign-in routing, shared navigation, empty-state chart behavior, and responsive stacking. The generated brand mark is wired into the header and favicon; the generated hero and report texture assets are referenced through the project storage URLs.
