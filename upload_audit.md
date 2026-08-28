# File upload audit

The deployed app has a real upload flow, but it is CSV-only. The upload page says “choose a CSV up to 25 MB,” and the file input accepts `.csv,text/csv`. Selecting a representative CSV succeeded end to end: the app parsed two source rows, persisted them locally, navigated to Reports, and rendered a 2-review sentiment distribution. In this test both rows were classified Neutral by the existing keyword model, so parsing worked but classification quality is intentionally basic.

Selecting an unsupported JSON file also triggered a visible toast: “For this local demo, choose a CSV file.” This is a clear rejection, but it does not match the upload page’s visible CSV/DOCX/PDF badges and does not support the advertised DOCX/PDF types. There is no PDF or DOCX extraction path, no progress state for large files, and processing is a single synchronous FileReader callback. The new implementation should accept CSV, PDF, and DOCX, reject other types with a specific supported-types message, extract text client-side, process rows in yielding batches, and preserve the current route into Reports.

## Updated upload UI verification

The local upload page now explicitly states support for CSV, PDF, and DOCX, shows the 25 MB limit, and explains that CSV rows are parsed from text columns while PDF and DOCX pages become text segments. The page renders successfully after dependency optimization and remains visually consistent with the existing workspace.

## PDF smoke test

The local multi-page PDF fixture uploaded successfully. The UI showed a visible processing state with progress, then the app navigated to Reports and displayed four imported document rows, proving page text extraction and sentiment row creation. Reports updated to 9 total rows (5 prior transcript segments plus 4 PDF-derived rows) with populated Positive 4 / Neutral 2 / Negative 3 distribution.

## DOCX smoke test

The local DOCX fixture uploaded successfully. Mammoth extracted the document text, the app created three imported document rows, and Reports updated to 12 total rows with Positive 5 / Neutral 3 / Negative 4. The success toast explicitly identified the DOCX row count, confirming that file selection, extraction, processing, persistence, and navigation all completed end to end.

## Unsupported-type smoke test

Selecting JSON locally now produces the specific message “Unsupported file type. SentimentIQ accepts CSV, PDF, or DOCX files.” The upload page keeps the user in place, changes the status pill to “Needs attention,” and renders the error message in the progress panel rather than failing silently.

## Size-limit smoke test

A 26 MB CSV was rejected immediately with “This file is larger than 25 MB. Choose a smaller CSV, PDF, or DOCX file.” No parsing or navigation occurred, and the UI stayed responsive with a Needs attention state.
