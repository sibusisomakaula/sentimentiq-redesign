# INNO-Tech SentimentIQ

> Customer signal, without the fog.

INNO-Tech SentimentIQ is a browser-first customer feedback analytics workspace. It imports review data and documents, classifies sentiment, analyzes scripts and transcripts, and presents the resulting evidence through a shared Dashboard, Reviews explorer, and Reports view.

The current implementation is designed as a local-first prototype. Sentiment scoring, file extraction, filtering, reporting, and persistence happen in the browser. The included Express server serves the compiled frontend; it does not provide application APIs, database storage, server-side authentication, or server-side sentiment inference.

## Product capabilities

| Capability | What is implemented |
|---|---|
| Dashboard | KPI cards, source/date/sentiment/product filters, sentiment distribution chart, trend surface, recent evidence, and navigation into Reports. |
| Reports | Filter-aware executive summary, positive/neutral/negative distribution chart, product breakdown, scope context, and report-oriented evidence surfaces. |
| CSV import | Header-aware parsing for review/comment/feedback text, optional sentiment, rating, product, and date fields. Text-only rows receive local sentiment classification. |
| PDF import | Multi-page text extraction using PDF.js. Text-bearing PDFs are supported; scanned image-only PDFs do not receive OCR. |
| DOCX import | Raw-text extraction using Mammoth.js. Formatting and document structure are not preserved. |
| Script analysis | Paste text or upload TXT/CSV, calculate an overall signed sentiment score, split content into segments, tag each segment, and surface positive/negative evidence. |
| Shared workspace data | Imported rows and analyzed transcript segments feed the same Dashboard, Reviews, and Reports collection. |
| Reviews explorer | Search, filter, inspect, and review imported evidence rows. |
| Theme system | Persistent light and dark modes with shared tokenized styling. |
| Local persistence | Reviews and the latest script analysis are stored in browser localStorage. |

## Technology stack

The frontend uses React 19 and TypeScript, bundled with Vite. Wouter provides client-side route matching. Tailwind CSS 4 and custom CSS variables define the visual system, while Lucide React supplies interface icons and Recharts renders the sentiment bar chart. Sonner provides toast notifications.

Browser-side document processing uses PDF.js for PDF text extraction and Mammoth.js for DOCX raw-text extraction. CSV parsing and sentiment classification are implemented in the React application.

The backend layer is a minimal Node.js and Express static server. It serves `dist/public`, falls back to `index.html` for client-side routes, and listens on `process.env.PORT` or port `3000`. No product-specific API routes are currently implemented.

## Requirements

Use Node.js with pnpm. The repository’s package metadata expects an ES module environment and includes the following standard development commands:

```bash
pnpm install
pnpm dev
```

The development server runs on port `3000` by default and binds to the host interface so it can be accessed from the local preview environment.

## Available commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies. |
| `pnpm dev` | Start the Vite development server. |
| `pnpm check` | Run TypeScript validation without emitting files. |
| `pnpm build` | Build the frontend and bundle the Express static server. |
| `pnpm start` | Start the bundled production server. |
| `pnpm preview` | Preview the built frontend through Vite. |
| `pnpm format` | Format the repository with Prettier. |

A typical production verification sequence is:

```bash
pnpm install
pnpm check
pnpm build
NODE_ENV=production pnpm start
```

## Application routes

The application uses a shallow route structure. Each route is handled by the main React application, which selects the active workspace view from the current location.

| Route | View | Purpose |
|---|---|---|
| `/` | Landing | Local demo sign-in experience and product introduction. |
| `/dashboard` | Dashboard | Main post-login workspace and filtered sentiment overview. |
| `/upload` | Upload data | Import CSV, PDF, and DOCX files. |
| `/analysis` | Script analysis | Analyze pasted or uploaded scripts, transcripts, chats, and reviews. |
| `/reviews` | Reviews explorer | Search and inspect row-level evidence. |
| `/reports` | Reports | Review the scoped sentiment distribution and product breakdown. |
| `/settings` | Admin settings | Static governance and access-management presentation. |

## Data flow

The main data flow is entirely client-side:

```text
CSV / PDF / DOCX / TXT input
        |
        v
Browser-side extraction and parsing
        |
        v
Review rows with source, text, date, product, rating, and sentiment
        |
        +--> local React state
        +--> localStorage persistence
        +--> Dashboard filters and KPIs
        +--> Reviews explorer
        +--> Reports distribution and product lens
```

Script analysis follows the same path. Pasted or uploaded text is segmented into lines or sentence-like units. Each segment becomes a review-shaped row and is merged into the same collection used by the Dashboard and Reports.

## CSV format

CSV files should contain a header row and at least one text-like column. The parser recognizes common names such as `text`, `review`, `comment`, `feedback`, and `content`. Optional fields include sentiment labels, ratings, product identifiers, and dates.

Example:

```csv
id,review,product,rating,date
1,"The food was delicious and the service was excellent.",Restaurant,5,2026-09-01
2,"The delivery was late and the package arrived damaged.",Delivery,2,2026-09-02
3,"The experience was acceptable but nothing stood out.",Restaurant,3,2026-09-03
```

If a sentiment column is present, recognized positive and negative labels are preserved. If the file has no sentiment column, the text is classified using the local sentiment lexicon. Rows with explicit labels are not forced through the inferred label unless the explicit value is unrecognized.

## PDF and DOCX support

PDF import loads the file in the browser, iterates through every page, extracts text items, and creates text segments for sentiment processing. It supports multi-page text PDFs but does not run OCR on scanned documents.

DOCX import passes the document’s binary contents to Mammoth.js and uses the returned raw text. Formatting, embedded images, tables, and speaker metadata are not retained as structured fields.

The upload view validates supported extensions and rejects files larger than 25 MB with a visible error message. Processing status includes reading, extraction, row creation, batch progress, completion, and error states.

## Sentiment scoring

The current sentiment engine is a deterministic browser-side lexicon heuristic. It does not call an LLM, external sentiment API, server-side model, or VADER service.

The classifier lowercases and normalizes the text, counts matching positive and negative vocabulary entries, and calculates a bounded signed score:

```text
score = ((positive_hits - negative_hits)
         / max(1, positive_hits + negative_hits)) * 100
```

The result is rounded and bounded to `-100` through `+100`:

| Score | Label |
|---:|---|
| `18` to `100` | Positive |
| `-17` to `17` | Neutral |
| `-100` to `-18` | Negative |

Scripts and transcripts use the same classifier for the overall document and for individual segments. The analysis view shows the signed score, overall classification, segment tags, and representative positive or negative evidence segments.

The Dashboard includes a VADER comparison surface for the product concept, but a separate VADER calculation is not currently implemented. The current primary classification remains the local lexicon result.

## Theme and branding

The visible product name is **INNO-Tech SentimentIQ**. The document title and workspace brand use this name, while the existing signal-mark asset remains the compact visual mark.

Light and dark modes are implemented through `ThemeContext.tsx` and CSS variables in `client/src/index.css`. The selected theme is persisted in localStorage under the `theme` key. Theme controls are available on the landing page and in the workspace sidebar/topbar.

The design uses Space Grotesk for display typography and DM Sans for body and control text. Semantic tokens are shared across cards, charts, status pills, filters, upload states, and sentiment labels so the light and dark modes remain consistent.

## Project structure

```text
client/
  index.html                 Document shell, fonts, title, favicon, analytics script
  src/
    App.tsx                  Providers and route declarations
    main.tsx                 React bootstrap
    index.css                Global tokens, responsive styles, and component styling
    pages/Home.tsx           Active product views, models, parsing, analysis, and orchestration
    contexts/ThemeContext.tsx Light/dark theme state and persistence
    components/              Error boundary, optional integrations, and UI primitives
    lib/                     Shared frontend utilities
server/
  index.ts                   Express static server and client-route fallback
shared/
  const.ts                   Minimal shared constants
vite.config.ts               Vite aliases, build output, debug collector, storage proxy
package.json                 Scripts and dependencies
```

## Persistence and authentication limitations

The current sign-in experience is a local demo gate. Submitting the landing form changes an in-memory React authentication state and routes to the Dashboard. It is not a security boundary and does not validate credentials against a server.

Imported rows and the latest script analysis are saved to browser localStorage. Data is therefore specific to the browser profile and is not shared across users, devices, or deployments. Clearing browser storage removes the locally persisted workspace data.

The current Express server does not expose database, authentication, file upload, export, invitation, or sentiment-analysis APIs. Settings actions and export controls that are not connected to backend services display informational toast messages.

## Known limitations

The application is currently best understood as a polished local-first prototype. Its main limitations are:

1. Authentication is a local demo flow rather than production identity management.
2. There is no database or server-side workspace persistence.
3. Sentiment scoring is lexicon-based and may miss context, negation, sarcasm, and domain-specific language.
4. PDF extraction does not OCR image-only or scanned PDFs.
5. DOCX extraction returns raw text without preserving document structure.
6. File extraction happens in the browser main thread; large documents may still use significant client memory.
7. CSV export, user invitations, audit persistence, and VADER comparison are not connected to backend services.
8. The active unmatched-route fallback renders the main application rather than a dedicated product 404 page.

## Development notes

Keep application behavior in `client/src/pages/Home.tsx` aligned with the shared token system in `client/src/index.css`. New data sources should produce the existing `Review` shape so Dashboard, Reviews, and Reports remain connected. New sentiment labels should use the existing `Positive`, `Neutral`, and `Negative` semantic values to preserve chart and filter behavior.

Before committing changes, run:

```bash
pnpm check
pnpm build
```

When modifying theme tokens, verify both light and dark modes on the landing page, Dashboard, Upload, Script analysis, and Reports views. When modifying ingestion, test a CSV with an explicit sentiment column and a text-only CSV so inferred labels continue to produce positive, neutral, and negative results.

## License and deployment note

No project-specific license is defined in the current repository. Deployment is managed through the project’s hosting environment; the application itself builds to static frontend assets plus the minimal Express server described above.
