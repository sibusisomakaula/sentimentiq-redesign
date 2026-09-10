# SentimentIQ dark theme checklist

- [x] Audit current light tokens and page-specific surface overrides.
- [x] Define layered near-black backgrounds, off-white text hierarchy, tuned complementary primary/accent, and distinct semantic colors.
- [x] Calculate WCAG contrast ratios for body text, muted text, links, buttons, badges, chart labels, and borders.
- [x] Apply the dark token system uniformly across landing, auth, dashboard, reports, Script analysis, upload, and settings.
- [x] Re-check charts, badges, inputs, progress bars, empty states, and navigation states on dark surfaces.
- [x] Verify desktop/mobile screenshots and interaction readability.
- [x] Write the final before/after summary and hex token list.

## CSV sentiment fix

- [x] Inspect the attached CSV headers and representative rows.
- [x] Reproduce the Neutral-only result through the current parser/classifier path.
- [x] Fix CSV field mapping and label normalization without breaking existing formats.
- [x] Ensure text-only rows receive sentiment classification.
- [x] Verify the attached file produces positive, neutral, and negative counts.
- [x] Run type/build checks.
