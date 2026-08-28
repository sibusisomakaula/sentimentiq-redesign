# SentimentIQ redesign ideas

## Three visual approaches

### Approach 1
**Theme Name:** Quiet Signal

**Very Brief Intro:** A refined editorial instrument for teams that need to turn noisy customer language into calm decisions. Warm paper tones, deep ink, and one disciplined brand accent make the analytics feel considered rather than clinical.

**Probability:** 0.074

### Approach 2
**Theme Name:** Field Notes

**Very Brief Intro:** A tactile research notebook for customer-ops teams, using soft mineral neutrals, annotation-like dividers, and a more human evidence-first rhythm. Trust comes from showing the source beside the conclusion.

**Probability:** 0.031

### Approach 3
**Theme Name:** Signal Room

**Very Brief Intro:** A dark, high-contrast command surface with electric aqua and citrus markers for teams monitoring sentiment in motion. The direction is alert, fast, and operational without becoming playful.

**Probability:** 0.088

## Selected approach: Quiet Signal

### Design Movement
Contemporary editorialism fused with Swiss information design: generous negative space, typographic hierarchy, restrained surfaces, and analytical graphics treated as the primary visual language.

### Core Principles
1. Evidence before ornament: every visual detail should help a user scan, compare, or act.
2. Warm precision: cream surfaces and ink typography make dense analytics feel less sterile while preserving rigor.
3. One system, many states: brand, navigation, controls, and charts share explicit tokens rather than one-off colors.
4. Visible provenance: labels, source notes, and QA cues should feel like part of the core product—not secondary metadata.

### Color Philosophy
The base is the existing warm cream `#F5F3EE`, chosen to feel like a well-lit paper workspace rather than a blank white SaaS canvas. Deep blue-pine ink anchors navigation, headings, and primary actions. A single terracotta accent adds warmth to selected moments and calls to action. Sentiment colors are deliberately separate: positive is a cool evergreen, neutral is a grounded ochre, and negative is a controlled brick red. This keeps semantic meaning distinct from brand energy. All primary text pairings use dark ink or white against saturated semantic colors to meet WCAG AA targets.

### Layout Paradigm
A persistent left rail and offset main canvas create a studio-like workspace. The dashboard and reports pages use a 12-column editorial rhythm with asymmetric hero headers, full-width scope controls, and charts that alternate between wide analytical surfaces and compact evidence cards. On small screens the rail becomes a top utility bar and the content stacks into deliberate bands rather than shrinking a desktop grid.

### Signature Elements
- Hairline section rules with tiny uppercase eyebrow labels, inspired by research reports.
- A “signal mark” made from three offset vertical bars, used in the logo, chart legend, and empty states.
- Soft paper grain and low-elevation shadows on cards, with no excessive rounded-corner repetition.

### Interaction Philosophy
Interactions should feel like handling a precise instrument: clear focus rings, immediate pressed states, quiet hover lifts, and reversible filters. Tooltips expose exact chart values rather than decorative commentary. Buttons use direct, confident verbs. Placeholder actions use a small toast so a user never wonders whether a click registered.

### Animation
Use 160–220ms ease-out transitions for buttons, nav states, cards, and tooltips. Cards may enter with a subtle 12px upward translate plus opacity, staggered by 45ms. Chart bars should grow from the baseline only on first render and respect `prefers-reduced-motion`. Avoid bouncing, looping, and layout-shifting animation; the product should feel composed and trustworthy.

### Typography System
Use `DM Sans` for body, controls, tables, and chart labels because it remains highly legible at compact sizes. Use `Space Grotesk` for page titles, card headings, logo lettering, and large metric numerals to create a slightly engineered editorial voice. Eyebrows are 10–11px, 700 weight, 0.16em tracking. Page titles are clamp(2.25rem, 4vw, 4.5rem) with tight leading. Body copy stays between 13–16px with generous line-height.

### Brand Essence
SentimentIQ is the evidence-first customer signal workspace for product and support teams who need to decide faster without losing the source context. **Precise, calm, accountable.**

### Brand Voice
Headlines state the job to be done with clarity, never hype. CTAs are compact and operational. Microcopy explains what will happen next and names the data source.

Example lines:
- “See the pressure points before they become churn.”
- “Import the source. Keep the story attached.”

### Wordmark & Logo
A compact signal mark of three offset bars—positive rising, neutral steady, negative descending—sits inside a square paper-stamp frame. The wordmark uses a custom-feeling lockup with `Space Grotesk` at a tight tracking and a small teal signal bar replacing the dot of the “i”; it must never appear as plain default body text.

### Signature Brand Color
`#0F6260` — Signal Teal. It is grounded enough for navigation and primary actions, but warmer and more ownable than generic SaaS blue.

## Implementation notes

- All colors belong in `client/src/index.css` as CSS variables and Tailwind theme mappings.
- The reports bar chart must derive from the same `reviews` collection used by the dashboard filters. It should support real imported rows and show a clear empty state when there are none; no fabricated testimonials or user-generated content will be used.
- Component and page files should begin with a short style reminder specific to the file, preserving the Quiet Signal direction during future edits.

## Style Decisions

- Cards and panels should feel like paper report surfaces: hierarchy comes from section rules, labels, scale, and analytical grouping, never from generic SaaS card repetition.
- The three-bar signal mark must appear as a recurring system motif in logos, empty states, chart legends, nav states, and key navigation states so SentimentIQ remains recognizable without relying on the wordmark.
- Landing pages must show the evidence-first workspace idea visually, using signal/report motifs or source-context cues rather than behaving primarily as a standard centered login screen.
