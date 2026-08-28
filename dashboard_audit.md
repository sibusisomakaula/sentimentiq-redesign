# Dashboard audit

The deployed SentimentIQ app already has a real `/dashboard` route and it is the post-login home view. It is not a placeholder: it includes a persistent sidebar, KPI cards, quick scope filters for product/rating/sentiment, a sentiment trend area, an overall sentiment distribution panel, recent evidence, language themes, VADER cross-check, and a navigation link into Reports.

The dashboard is currently an empty-data operating surface because no reviews are imported. Its KPI values intentionally show dashes or zero, and the sentiment distribution chart intentionally shows an empty state. The existing Reports route also exists and contains the responsive sentiment bar chart.

The requested Script / Transcript Analysis route does not exist in the visible navigation or deployed route audit. The new feature should therefore be added as a first-class workspace route between Upload data and Reports, while retaining the existing dashboard and reports data model. The implementation will use a shared review-like analysis row schema so script segments contribute to the same dashboard KPIs, distribution bar, recent activity, and reports scope.

## Script analysis smoke test

The local `/analysis` route exposes the shared workspace navigation, analysis name/source fields, a paste textarea, TXT/CSV upload control, and an Analyze sentiment action. A representative transcript produced five tagged segments, an overall Neutral score, Positive/Negative evidence phrase lists, and a success notice stating that the segments were added to Dashboard and Reports. The segment list preserved speaker turns and sentence boundaries, confirming the integration is not disconnected from the workspace.

## Dashboard roll-up smoke test

After analyzing the sample transcript, Dashboard showed five reviews in view, a 40% negative share, a populated sentiment distribution bar chart with Positive 2 / Neutral 1 / Negative 2, populated movement bars, and recent evidence rows from the transcript source. The dashboard quick filter now visibly includes From, To, Source, Sentiment, Product, and Reset. This confirms the dashboard was already a proper home view and is now connected to script analysis output.
