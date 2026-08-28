# SentimentIQ file upload delivery summary

## Current behavior before the fix

The deployed upload flow was real but CSV-only. A representative CSV selected on the deployed app was parsed into two source rows, persisted locally, routed to Reports, and rendered in the sentiment distribution. Unsupported JSON was rejected with a visible message, but the message said to choose a CSV even though the UI displayed CSV, DOCX, and PDF badges. PDF and DOCX had no extraction path, and there was no visible progress state for document processing.

## Supported formats after the fix

| Format | Accepted input | Parsing behavior | Workspace result |
|---|---|---|---|
| CSV | `.csv` / `text/csv` | Uses the existing text-column-aware CSV parser. Fields such as date, source, text, review, feedback, comment, product, sentiment, and rating are recognized where present. | Rows are scored, persisted, and routed to Reports. |
| PDF | `.pdf` / `application/pdf` | Uses PDF.js in the browser and iterates through every page, extracting readable text from each page. | Text is segmented into imported document rows, scored, persisted, and routed to Reports. |
| Word | `.docx` / Office Open XML MIME type | Uses Mammoth in the browser to extract raw document text. | Text is segmented into imported document rows, scored, persisted, and routed to Reports. |

Unsupported extensions are rejected before parsing with: “Unsupported file type. SentimentIQ accepts CSV, PDF, or DOCX files.” Files larger than 25 MB are rejected before reading with a specific size message. The upload UI now lists all three supported formats and the size limit directly in the drop zone and supporting copy.

## End-to-end verification

The deployed baseline CSV test succeeded with two imported rows and a populated Reports distribution. The updated local implementation then passed the following end-to-end smoke tests:

| Test | Observed result |
|---|---|
| Multi-page PDF | Four rows imported from the PDF fixture; Reports updated to 9 total rows and showed Positive 4 / Neutral 2 / Negative 3. |
| DOCX | Three rows imported from the Word fixture; Reports updated to 12 total rows and showed Positive 5 / Neutral 3 / Negative 4. |
| Unsupported JSON | Stayed on Upload data and showed a specific rejection message plus a Needs attention state. |
| Over-limit 26 MB CSV | Rejected immediately before parsing with the 25 MB guidance message. |
| Processing feedback | Upload page showed status pill, progress percentage, and a progress bar while extracting and processing. |

## Processing and performance changes

The app remains frontend-only, so files are processed locally in the browser rather than uploaded to a server. PDF and DOCX extraction now use purpose-built browser parsers. Parsed rows are processed in batches of 40 with an event-loop yield between batches, preventing large result sets from monopolizing the UI thread during sentiment-row creation. Progress is updated after extraction and throughout batch processing, making slow work observable instead of looking hung. The 25 MB guard prevents unbounded local parsing. The remaining limitation is that raw CSV tokenization and PDF page extraction are still synchronous per file/page; a future backend worker or Web Worker could isolate very large inputs further.

## Integration

The resulting rows use the existing Review schema and are written to the same `localStorage` collection as Script analysis and CSV reviews. This means Dashboard KPIs, quick filters, recent evidence, Reports distribution, and product lens all use the imported document rows without a disconnected upload result screen.

## Validation

The frontend passed `pnpm check` and a production `pnpm build`. Final desktop screenshots were captured for Upload data, Dashboard, and Reports after the multi-format UI changes. The upload page renders the accepted file list, progress surface, error surface, and existing design tokens without visual drift.
