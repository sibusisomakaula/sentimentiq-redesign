# SentimentIQ upload hardening checklist

- [x] Test deployed CSV upload from file selection through parsed sentiment results.
- [x] Record currently supported types and the exact failure or hang point.
- [x] Add explicit CSV, PDF, and DOCX acceptance and rejection messaging.
- [x] Add client-side PDF multi-page text extraction and DOCX text extraction.
- [x] Process parsed segments in yielding batches with progress and cancellation-safe UI states.
- [x] Persist parsed rows into the existing Dashboard, Reports, and Reviews data model.
- [x] Verify successful uploads, malformed files, unsupported types, and large-file behavior.
- [x] Document findings, supported limits, and implementation notes.
