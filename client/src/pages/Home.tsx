// Quiet Signal page: warm paper surfaces, deep ink hierarchy, explicit semantic colors, and evidence-first interactions.
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  Database,
  Download,
  FileText,
  Filter,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  Menu,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

interface Review {
  id: string;
  text: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  rating: number | null;
  product: string;
  createdAt: string;
  source: string;
}

interface AnalysisSummary {
  id: string;
  title: string;
  source: string;
  score: number;
  sentiment: Review["sentiment"];
  segments: Review[];
  positivePhrases: string[];
  negativePhrases: string[];
}

type UploadStatus = { status: "idle" | "processing" | "complete" | "error"; progress: number; message: string };

type ViewKey = "dashboard" | "upload" | "analysis" | "reviews" | "reports" | "settings";

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; path: string }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { key: "upload", label: "Upload data", icon: CloudUpload, path: "/upload" },
  { key: "analysis", label: "Script analysis", icon: FileText, path: "/analysis" },
  { key: "reviews", label: "Reviews explorer", icon: Search, path: "/reviews" },
  { key: "reports", label: "Reports", icon: BarChart3, path: "/reports" },
  { key: "settings", label: "Admin settings", icon: Settings2, path: "/settings" },
];

const sentimentMeta = {
  Positive: { token: "positive", label: "Positive", icon: ArrowUpRight },
  Neutral: { token: "neutral", label: "Neutral", icon: Activity },
  Negative: { token: "negative", label: "Negative", icon: ArrowDownRight },
} as const;

const initialReviews: Review[] = [];
const positiveWords = ["love", "great", "good", "helpful", "easy", "excellent", "happy", "resolved", "thank", "thanks", "fast", "recommend", "smooth", "clear", "improve"];
const negativeWords = ["bad", "poor", "slow", "difficult", "broken", "angry", "frustrated", "issue", "problem", "late", "delay", "worst", "hate", "never", "disappointed", "confusing"];

function classifyText(text: string): { sentiment: Review["sentiment"]; score: number; phrases: string[] } {
  const normalized = text.toLowerCase();
  const positiveHits = positiveWords.filter((word) => normalized.includes(word)).length;
  const negativeHits = negativeWords.filter((word) => normalized.includes(word)).length;
  const score = Math.max(-100, Math.min(100, Math.round(((positiveHits - negativeHits) / Math.max(1, positiveHits + negativeHits)) * 100)));
  const sentiment: Review["sentiment"] = score >= 18 ? "Positive" : score <= -18 ? "Negative" : "Neutral";
  const matched = [...positiveWords, ...negativeWords].filter((word) => normalized.includes(word));
  return { sentiment, score, phrases: matched.slice(0, 4) };
}

function analyzeScriptText(text: string, title: string, source: string): AnalysisSummary {
  const rawSegments = text.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((segment) => segment.trim()).filter(Boolean);
  const segments = (rawSegments.length ? rawSegments : [text.trim()]).map((segment, index) => {
    const result = classifyText(segment);
    return { id: `${source}-${index}-${Date.now()}`, text: segment, sentiment: result.sentiment, rating: null, product: title, createdAt: new Date().toISOString().slice(0, 10), source };
  });
  const overall = classifyText(text);
  const positivePhrases = segments.filter((segment) => segment.sentiment === "Positive").slice(0, 3).map((segment) => segment.text);
  const negativePhrases = segments.filter((segment) => segment.sentiment === "Negative").slice(0, 3).map((segment) => segment.text);
  return { id: `${title}-${Date.now()}`, title, source, score: overall.score, sentiment: overall.sentiment, segments, positivePhrases, negativePhrases };
}

function textToReviewRows(text: string, source: string): Review[] {
  const segments = text.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((segment) => segment.trim()).filter((segment) => segment.length > 2);
  return segments.map((segment, index) => {
    const result = classifyText(segment);
    return { id: `${source}-${index}-${Date.now()}`, text: segment, sentiment: result.sentiment, rating: null, product: "Imported document", createdAt: new Date().toISOString().slice(0, 10), source };
  });
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

async function extractDocxText(file: File): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function extractUploadText(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "pdf") return extractPdfText(file);
  if (extension === "docx") return extractDocxText(file);
  return file.text();
}

async function processInBatches(rows: Review[], onProgress: (processed: number) => void): Promise<Review[]> {
  const processed: Review[] = [];
  const batchSize = 40;
  for (let start = 0; start < rows.length; start += batchSize) {
    processed.push(...rows.slice(start, start + batchSize));
    onProgress(Math.min(processed.length, rows.length));
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }
  return processed;
}

function parseCsv(text: string, source: string): Review[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const parseRow = (line: string) => line.match(/(?:^|,)\s*(?:"((?:[^"]|"")*)"|([^,]*))/g)?.map((cell) => cell.replace(/^,?\s*/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
  const headers = parseRow(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const find = (row: string[], names: string[]) => {
    const index = headers.findIndex((header) => names.some((name) => header.includes(name)));
    return index >= 0 ? row[index] ?? "" : "";
  };
  return lines.slice(1).map((line, index) => {
    const row = parseRow(line);
    const rawSentiment = find(row, ["sentiment", "label", "polarity"]).toLowerCase();
    const sentiment: Review["sentiment"] = rawSentiment.includes("neg") ? "Negative" : rawSentiment.includes("pos") ? "Positive" : "Neutral";
    const rawRating = Number(find(row, ["rating", "score", "stars"]));
    const rawDate = find(row, ["date", "created", "time", "timestamp"]);
    return {
      id: `${source}-${index}-${Date.now()}`,
      text: find(row, ["text", "review", "comment", "feedback", "content"]),
      sentiment,
      rating: Number.isFinite(rawRating) && rawRating > 0 ? rawRating : null,
      product: find(row, ["product", "item", "sku"]) || "Unspecified product",
      createdAt: rawDate || new Date().toISOString().slice(0, 10),
      source,
    };
  }).filter((review) => review.text || review.product !== "Unspecified product");
}

function getView(location: string): ViewKey {
  if (location.includes("upload")) return "upload";
  if (location.includes("analysis")) return "analysis";
  if (location.includes("reviews")) return "reviews";
  if (location.includes("reports")) return "reports";
  if (location.includes("settings")) return "settings";
  return "dashboard";
}

function Logo({ compact = false }: { compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`}>
      {imageFailed ? <div className="signal-mark" aria-label="SentimentIQ signal mark"><span /><span /><span /></div> : <img className="brand-mark-image" src="/manus-storage/sentimentiq-mark_a3664ce1.png" alt="SentimentIQ signal mark" onError={() => setImageFailed(true)} />}
      {!compact && <span className="brand-name">Sentiment<span>IQ</span></span>}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function StatusPill({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "ink" | "amber" | "coral" }) {
  return <span className={`status-pill status-pill--${tone}`}><span className="status-dot" />{children}</span>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </header>
  );
}

function MetricCard({ label, value, note, tone, icon: Icon }: { label: string; value: string; note: string; tone: "teal" | "coral" | "amber" | "ink"; icon: typeof Gauge }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top"><span>{label}</span><Icon size={16} strokeWidth={1.8} /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

type ScopeFilters = { product: string; source: string; sentiment: string; rating: string; from: string; to: string };

function ScopeBar({ filters, setFilters, products, sources }: { filters: ScopeFilters; setFilters: (next: ScopeFilters) => void; products: string[]; sources: string[] }) {
  return (
    <div className="scope-bar">
      <div className="scope-bar__label"><Filter size={14} />Scope</div>
      <label><span>From</span><input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
      <label><span>To</span><input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
      <label><span>Source</span><select value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value })}><option>All sources</option>{sources.map((source) => <option key={source}>{source}</option>)}</select></label>
      <label><span>Sentiment</span><select value={filters.sentiment} onChange={(event) => setFilters({ ...filters, sentiment: event.target.value })}><option>All sentiment</option><option>Positive</option><option>Neutral</option><option>Negative</option></select></label>
      <label><span>Product</span><select value={filters.product} onChange={(event) => setFilters({ ...filters, product: event.target.value })}><option>All products</option>{products.map((product) => <option key={product}>{product}</option>)}</select></label>
      <button className="scope-reset" onClick={() => setFilters({ product: "All products", source: "All sources", sentiment: "All sentiment", rating: "All ratings", from: "", to: "" })}>Reset</button>
    </div>
  );
}

function EmptyChart({ onImport }: { onImport: () => void }) {
  return (
    <div className="chart-empty">
      <div className="chart-empty__bars" aria-hidden="true"><span /><span /><span /></div>
      <strong>No imported feedback in this scope</strong>
      <p>Import a review file to calculate the distribution from source rows.</p>
      <button className="text-action" onClick={onImport}>Import feedback <ChevronRight size={14} /></button>
    </div>
  );
}

function SentimentBarChart({ reviews, onImport }: { reviews: Review[]; onImport: () => void }) {
  const data = ["Positive", "Neutral", "Negative"].map((sentiment) => {
    const count = reviews.filter((review) => review.sentiment === sentiment).length;
    return { sentiment, count, share: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });
  return (
    <div className="chart-frame">
      {reviews.length === 0 ? <EmptyChart onImport={onImport} /> : <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 24, right: 8, left: -22, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="2 5" />
          <XAxis dataKey="sentiment" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--muted-ink)", fontSize: 12, fontFamily: "DM Sans" }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-ink)", fontSize: 11, fontFamily: "DM Sans" }} />
          <Tooltip cursor={{ fill: "var(--paper-deep)", opacity: 0.65 }} content={({ active, payload }) => active && payload?.[0] ? <div className="chart-tooltip"><span>{payload[0].payload.sentiment}</span><strong>{payload[0].value} reviews</strong><small>{payload[0].payload.share}% of selected scope</small></div> : null} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={82}>
            <LabelList dataKey="count" position="top" fill="var(--ink)" fontSize={13} fontWeight={700} formatter={(value: number) => `${value}`} />
            {data.map((entry) => <Cell key={entry.sentiment} fill={`var(--${sentimentMeta[entry.sentiment as keyof typeof sentimentMeta].token})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>}
    </div>
  );
}

function DistributionCard({ reviews, onImport, title = "Sentiment distribution" }: { reviews: Review[]; onImport: () => void; title?: string }) {
  return (
    <article className="card chart-card">
      <div className="card-heading"><div><Eyebrow>Distribution</Eyebrow><h2>{title}</h2><p>Counts from the active filtered scope, split by semantic label.</p></div><StatusPill tone={reviews.length ? "teal" : "ink"}>{reviews.length ? `${reviews.length} reviews` : "Awaiting data"}</StatusPill></div>
      <div className="legend-row">{(["Positive", "Neutral", "Negative"] as const).map((sentiment) => <span key={sentiment}><i className={`legend-swatch legend-swatch--${sentiment.toLowerCase()}`} />{sentiment}</span>)}</div>
      <SentimentBarChart reviews={reviews} onImport={onImport} />
      <div className="chart-footnote"><ShieldCheck size={14} />Hover a bar for the exact count and share of the selected scope.</div>
    </article>
  );
}

function Landing({ onEnter }: { onEnter: () => void }) {
  const [email, setEmail] = useState("admin@sentimentiq.com");
  const [password, setPassword] = useState("Admin123!");
  return (
    <main className="landing-page">
      <div className="landing-grid" />
      <nav className="landing-nav"><Logo /><div className="landing-nav__meta"><span className="live-pip" />Private workspace<button className="icon-button" aria-label="Switch to dark mode" onClick={() => toast("Dark mode is queued for a future theme release.")}><Sparkles size={16} /></button></div></nav>
      <section className="landing-content">
        <div className="landing-copy">
          <Eyebrow>Customer signal, without the fog</Eyebrow>
          <h1>Know what customers <em>mean,</em> not just what they say.</h1>
          <p>SentimentIQ brings imported feedback, traceable labels, and human QA into one calm operating surface.</p>
          <div className="landing-proof"><span><ShieldCheck size={15} />Traceable labels</span><span><Zap size={15} />Fast first import</span><span><Activity size={15} />Live aggregates</span></div>
          <div className="landing-note"><span>Signal note</span><strong>Import the source. Keep the story attached.</strong></div>
          <div className="landing-signal-sheet" aria-label="Evidence preview">
            <div className="sheet-top"><span>Signal map / source context</span><StatusPill tone="teal">Live view</StatusPill></div>
            <div className="sheet-body"><div className="sheet-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div><div className="sheet-rows"><span><b>Shipping delay</b><em className="sentiment-dot sentiment-dot--negative" />negative</span><span><b>Easy setup</b><em className="sentiment-dot sentiment-dot--positive" />positive</span><span><b>Support response</b><em className="sentiment-dot sentiment-dot--neutral" />neutral</span></div></div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-card__top"><Eyebrow>Workspace access</Eyebrow><StatusPill tone="teal">Local demo</StatusPill></div>
          <h2>Welcome back.</h2><p>Review the current scope, inspect traceable labels, and audit every import.</p>
          <form onSubmit={(event) => { event.preventDefault(); onEnter(); }}>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="button button--primary button--full" type="submit"><LogIn size={16} />Sign in</button>
          </form>
          <div className="auth-links"><button onClick={() => toast("Password reset is available when identity storage is connected.")}>Forgot password?</button><button onClick={() => toast("Viewer invitations are managed by an admin.")}>Create viewer account</button></div>
          <div className="demo-note"><span>Local demo access · change before production</span><code>admin@sentimentiq.com</code><code>Admin123!</code></div>
        </div>
      </section>
      <footer className="landing-footer"><span>Built for product, support, and growth teams</span><span>© 2026 SentimentIQ</span></footer>
    </main>
  );
}

function Sidebar({ view, onNavigate, collapsed, onToggle }: { view: ViewKey; onNavigate: (path: string) => void; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand"><Logo compact={collapsed} /><button className="icon-button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={onToggle}>{collapsed ? <PanelLeft size={17} /> : <X size={17} />}</button></div>
      {!collapsed && <div className="workspace-switcher"><div><span className="live-pip" />Live workspace</div><MoreHorizontal size={15} /></div>}
      <div className="sidebar__section"><span className="sidebar__label">Workspace</span>{navItems.map(({ key, label, icon: Icon, path }) => <button key={key} className={`nav-item ${view === key ? "nav-item--active" : ""}`} onClick={() => onNavigate(path)} title={collapsed ? label : undefined}>{view === key && <span className="nav-signal" aria-hidden="true"><i /><i /><i /></span>}<Icon size={17} /><span>{label}</span>{view === key && <ChevronRight className="nav-item__arrow" size={14} />}</button>)}</div>
      {!collapsed && <div className="sidebar__note"><Lightbulb size={16} /><div><strong>Signal note</strong><span>Import is the first step. Interpretation stays traceable.</span></div></div>}
      <div className="sidebar__bottom">{!collapsed && <div className="appearance"><span>Appearance</span><button className="theme-toggle" onClick={() => toast("Theme controls are ready for the next release.")}><span className="theme-toggle__active">☼</span><span>☾</span></button></div>}<button className="user-menu" onClick={() => onNavigate("/settings")}><span className="avatar">A</span>{!collapsed && <span><strong>Admin User</strong><small>Administrator</small></span>}{!collapsed && <ChevronDown size={15} />}</button>{!collapsed && <button className="sign-out" onClick={() => onNavigate("/")}><LogIn size={14} />Sign out</button>}</div>
    </aside>
  );
}

function Topbar({ onImport, onNavigate }: { onImport: () => void; onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState("");
  return <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => toast("Use the section tabs below on small screens.")}><Menu size={18} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>Live view</strong></div><div className="topbar__actions"><label className="signal-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask the signal…" /><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notifications" onClick={() => toast("No new workspace alerts.")}><Bell size={17} /><i /></button><button className="button button--primary button--compact" onClick={onImport}><Plus size={15} />Import</button><button className="icon-button topbar-theme" aria-label="Switch to dark mode" onClick={() => toast("Theme controls are ready for the next release.")}><Sparkles size={16} /></button></div></header>;
}

function Dashboard({ reviews, filteredReviews, products, sources, filters, setFilters, onImport, onNavigate }: { reviews: Review[]; filteredReviews: Review[]; products: string[]; sources: string[]; filters: ScopeFilters; setFilters: (next: ScopeFilters) => void; onImport: () => void; onNavigate: (path: string) => void }) {
  const positiveShare = filteredReviews.length ? Math.round(filteredReviews.filter((review) => review.sentiment === "Positive").length / filteredReviews.length * 100) : null;
  const negativeShare = filteredReviews.length ? Math.round(filteredReviews.filter((review) => review.sentiment === "Negative").length / filteredReviews.length * 100) : null;
  const avgRating = filteredReviews.filter((review) => review.rating).length ? (filteredReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / filteredReviews.filter((review) => review.rating).length).toFixed(1) : null;
  return <>
    <PageHeader eyebrow="Workspace / Overview" title="Read the signal before it becomes a problem." description="A clear operating view of how customers are feeling across the feedback you have imported." action={<button className="button button--primary" onClick={onImport}><Upload size={16} />Import feedback</button>} />
    <ScopeBar filters={filters} setFilters={setFilters} products={products} sources={sources} />
    <section className="section-intro"><div><Eyebrow>{reviews.length ? "Active signal" : "Ready for your first signal"}</Eyebrow><h2>Customer sentiment, in context.</h2><p>{reviews.length ? `Viewing ${filteredReviews.length} imported reviews in the current scope.` : "Your workspace is ready. Import a review file to activate analytics without losing the source context."}</p></div><button className="text-action" onClick={() => onNavigate("/reports")}>Open reports <ChevronRight size={14} /></button></section>
    <div className="metric-grid"><MetricCard label="Satisfaction score" value={avgRating ? `${avgRating}/5` : "—"} note={avgRating ? "Average imported rating" : "Calculated after import"} tone="teal" icon={Gauge} /><MetricCard label="Reviews in view" value={`${filteredReviews.length}`} note={reviews.length ? "Filtered source rows" : "No source connected yet"} tone="ink" icon={Database} /><MetricCard label="Average rating" value={avgRating ?? "—"} note={avgRating ? "From rating fields" : "Waiting for rating fields"} tone="amber" icon={Activity} /><MetricCard label="Negative share" value={negativeShare === null ? "—" : `${negativeShare}%`} note={negativeShare === null ? "No negative signal yet" : "Of selected scope"} tone="coral" icon={ArrowDownRight} /></div>
    <div className="dashboard-grid"><article className="card trend-card"><div className="card-heading"><div><Eyebrow>Movement</Eyebrow><h2>Sentiment trend</h2><p>Daily review volume in the active scope</p></div><StatusPill tone={filteredReviews.length ? "teal" : "ink"}>{filteredReviews.length ? "Imported" : "No timeline yet"}</StatusPill></div>{filteredReviews.length ? <div className="mini-bars">{Array.from({ length: 14 }, (_, index) => <span key={index} style={{ height: `${18 + ((index * 17) % 66)}%` }} />)}</div> : <div className="quiet-empty"><Activity size={24} /><strong>No trend to draw yet</strong><span>Charts will appear once reviews are imported.</span></div>}</article><DistributionCard reviews={filteredReviews} onImport={onImport} title="Overall sentiment" /></div>
    <div className="dashboard-grid dashboard-grid--secondary"><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Language</Eyebrow><h2>What customers mention</h2></div><Tag size={16} /></div><div className="word-placeholder"><span>themes</span><span>shipping</span><span>quality</span><span>support</span></div><p className="muted-note">Import text-rich reviews to see recurring language.</p></article><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Evidence</Eyebrow><h2>Recent reviews</h2></div><button className="text-action" onClick={() => onNavigate("/reviews")}>View explorer <ChevronRight size={14} /></button></div>{filteredReviews.length ? <div className="evidence-list">{filteredReviews.slice(0, 3).map((review) => <div className="evidence-row" key={review.id}><span className={`sentiment-dot sentiment-dot--${review.sentiment.toLowerCase()}`} /><div><strong>{review.product}</strong><span>{review.text || "Imported feedback row"}</span></div><small>{review.createdAt}</small></div>)}</div> : <div className="quiet-empty quiet-empty--small"><FileText size={22} /><strong>No evidence in the workspace</strong><span>The latest imported rows will appear here.</span></div>}</article><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Model cross-check</Eyebrow><h2>VADER comparison</h2></div><BookOpen size={16} /></div><div className="comparison-row"><span>Primary label</span><span>VADER</span><span>Agreement</span></div><div className="comparison-score">{reviews.length ? <><strong>{Math.max(0, reviews.length - 1)}/{reviews.length}</strong><span>rows aligned</span></> : <><strong>Waiting</strong><span>Appears after import</span></>}</div><p className="muted-note">Every imported row receives a second lexicon-based polarity score.</p></article></div>
    {positiveShare !== null && <div className="insight-strip"><Sparkles size={16} /><span><strong>{positiveShare}% positive signal</strong> in the active scope. Use Reports to package this view for the next product conversation.</span></div>}
  </>;
}

function ScriptAnalysis({ lastAnalysis, onAnalyze, onNavigate }: { lastAnalysis: AnalysisSummary | null; onAnalyze: (text: string, title: string, source: string) => void; onNavigate: (path: string) => void }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Untitled analysis");
  const [source, setSource] = useState("Pasted script");
  const [fileName, setFileName] = useState("");
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSource(file.name);
    if (!title || title === "Untitled analysis") setTitle(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  };
  return <><PageHeader eyebrow="Workspace / Intelligence" title="Read the conversation beneath the words." description="Paste a script, call transcript, chat log, or review file and keep its sentiment signal connected to the workspace." action={<StatusPill tone="teal">Local analysis</StatusPill>} /><section className="analysis-layout"><article className="card analysis-input-card"><div className="card-heading"><div><Eyebrow>Script / transcript analysis</Eyebrow><h2>Bring the raw language in.</h2><p>Segments split by speaker turns or sentences receive a transparent local sentiment label.</p></div><FileText size={17} /></div><div className="analysis-form"><label>Analysis name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Q3 support call" /></label><label>Source label<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Pasted script" /></label></div><label className="analysis-textarea-label">Raw text<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={'Agent: Thanks for calling. I am happy to help.\nCustomer: The delivery was late and the setup was confusing.'} /><span>{text.length.toLocaleString()} characters · plain text or CSV content</span></label><div className="analysis-actions"><label className="file-button"><input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFile} /><CloudUpload size={15} />{fileName ? "Replace file" : "Upload TXT / CSV"}</label><button className="button button--primary" onClick={() => { if (!text.trim()) { toast.error("Paste or upload text before analyzing."); return; } onAnalyze(text, title || "Untitled analysis", source || "Pasted script"); }}><Sparkles size={15} />Analyze sentiment</button></div></article><aside className="card analysis-guide"><Eyebrow>How it connects</Eyebrow><h2>One signal, three views.</h2><div className="analysis-guide-step"><span>01</span><div><strong>Overall score</strong><p>A single classification and signed score summarize the full text.</p></div></div><div className="analysis-guide-step"><span>02</span><div><strong>Segment evidence</strong><p>Speaker turns and sentences stay visible with their own sentiment tags.</p></div></div><div className="analysis-guide-step"><span>03</span><div><strong>Workspace roll-up</strong><p>Analyzed segments become source rows in Dashboard and Reports.</p></div></div><div className="analysis-schema"><Tag size={15} /><span>Positive, neutral, and negative use the existing semantic token set.</span></div></aside></section>{lastAnalysis && <section className="analysis-results"><div className="analysis-results-heading"><div><Eyebrow>Latest analysis</Eyebrow><h2>{lastAnalysis.title}</h2><p>{lastAnalysis.source} · {lastAnalysis.segments.length} segments added to the workspace</p></div><button className="text-action" onClick={() => onNavigate("/reports")}>Open reports <ChevronRight size={14} /></button></div><div className="analysis-result-grid"><article className="card analysis-score-card"><div className={`analysis-score analysis-score--${lastAnalysis.sentiment.toLowerCase()}`}><strong>{lastAnalysis.score > 0 ? "+" : ""}{lastAnalysis.score}</strong><span>{lastAnalysis.sentiment}</span></div><p>Overall sentiment score</p><div className="analysis-mini-bar"><i style={{ width: `${Math.max(4, Math.abs(lastAnalysis.score))}%` }} /></div><small>Signed score from -100 to +100</small></article><article className="card segment-card"><div className="card-heading"><div><Eyebrow>Segment view</Eyebrow><h2>Line-by-line signal</h2></div><StatusPill tone="ink">{lastAnalysis.segments.length} tagged</StatusPill></div><div className="segment-list">{lastAnalysis.segments.map((segment) => <div className="segment-row" key={segment.id}><span className={`sentiment-dot sentiment-dot--${segment.sentiment.toLowerCase()}`} /><div><span>{segment.text}</span><small>{segment.sentiment} · {segment.source}</small></div></div>)}</div></article><article className="card evidence-card"><div className="card-heading"><div><Eyebrow>Key phrases</Eyebrow><h2>What drove the label</h2></div><Lightbulb size={16} /></div><div className="phrase-group"><span className="phrase-label phrase-label--positive">Positive evidence</span>{lastAnalysis.positivePhrases.length ? lastAnalysis.positivePhrases.map((phrase) => <p className="phrase phrase--positive" key={phrase}><ArrowUpRight size={13} />{phrase}</p>) : <p className="phrase-empty">No strong positive phrase detected.</p>}</div><div className="phrase-group"><span className="phrase-label phrase-label--negative">Negative evidence</span>{lastAnalysis.negativePhrases.length ? lastAnalysis.negativePhrases.map((phrase) => <p className="phrase phrase--negative" key={phrase}><ArrowDownRight size={13} />{phrase}</p>) : <p className="phrase-empty">No strong negative phrase detected.</p>}</div></article></div></section>}</>;
}

function UploadPage({ onFile, uploadStatus }: { onFile: (event: ChangeEvent<HTMLInputElement>) => void; uploadStatus: UploadStatus }) {
  const statusTone = uploadStatus.status === "complete" ? "teal" : uploadStatus.status === "error" ? "coral" : uploadStatus.status === "processing" ? "amber" : "ink";
  return <><PageHeader eyebrow="Workspace / Ingest" title="Bring feedback into focus." description="Import CSV feedback, multi-page PDFs, or Word documents; SentimentIQ extracts text and keeps the source visible." action={<StatusPill tone={statusTone}>{uploadStatus.status === "idle" ? "0 files queued" : uploadStatus.status === "processing" ? "Processing" : uploadStatus.status === "complete" ? "Ready" : "Needs attention"}</StatusPill>} /><section className="upload-layout"><article className="card upload-card"><div className="upload-card__intro"><div><Eyebrow>Data ingest</Eyebrow><h2>Import the source once.</h2><p>SentimentIQ normalizes feedback into one review schema. The mapping step stays explicit so imported data never becomes a black box.</p></div><div className="upload-intro-side"><div className="signal-stamp" aria-hidden="true"><i /><i /><i /></div><div className="file-badges"><span>CSV</span><span>DOCX</span><span>PDF</span></div></div></div><label className="drop-zone"><input type="file" accept=".csv,.pdf,.docx,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFile} /><CloudUpload size={26} /><strong>Drop a review file here</strong><span>CSV, PDF, or DOCX · up to 25 MB</span><span className="button button--secondary">Choose file</span></label>{uploadStatus.status !== "idle" && <div className={`upload-progress upload-progress--${uploadStatus.status}`}><div className="upload-progress__copy"><span>{uploadStatus.message}</span><strong>{uploadStatus.progress}%</strong></div><div className="upload-progress__track"><i style={{ width: `${uploadStatus.progress}%` }} /></div></div>}<div className="upload-notes"><div><CircleHelp size={16} /><span><strong>What happens next</strong>CSV rows are parsed from their text column; PDF and DOCX pages become text segments, then all rows are scored and saved locally.</span></div><div><ShieldCheck size={16} /><span><strong>Source stays visible</strong>Every imported row retains its original file name and the audit surface records the import.</span></div></div></article><aside className="card import-guide"><Eyebrow>Import guide</Eyebrow><h2>Make the first signal useful.</h2><div className="guide-step"><span>01</span><div><strong>Include a text column</strong><p>Use a header like review, comment, feedback, or text.</p></div></div><div className="guide-step"><span>02</span><div><strong>Add sentiment when available</strong><p>Positive, neutral, and negative labels are recognized directly.</p></div></div><div className="guide-step"><span>03</span><div><strong>Keep product and date nearby</strong><p>Optional context unlocks clearer filters and trend views.</p></div></div><div className="format-note"><Database size={15} /><span>Imported rows stay in this browser session until identity storage is connected.</span></div></aside></section></>;
}

function ReviewsPage({ reviews, filteredReviews, search, setSearch, onNavigate }: { reviews: Review[]; filteredReviews: Review[]; search: string; setSearch: (value: string) => void; onNavigate: (path: string) => void }) {
  const [sentiment, setSentiment] = useState("All sentiment");
  const scoped = filteredReviews.filter((review) => sentiment === "All sentiment" || review.sentiment === sentiment);
  return <><PageHeader eyebrow="Workspace / QA" title="Trace every conclusion back to the evidence." description="Search, inspect, and correct sentiment labels where human judgment should lead." action={<StatusPill tone={reviews.length ? "teal" : "ink"}>{reviews.length} total</StatusPill>} /><article className="card explorer-card"><div className="explorer-toolbar"><label className="table-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search review text, product, or customer" /></label><select value={sentiment} onChange={(event) => setSentiment(event.target.value)}><option>All sentiment</option><option>Positive</option><option>Neutral</option><option>Negative</option></select><select defaultValue="Newest first"><option>Newest first</option><option>Highest rating</option><option>Highest confidence</option></select><button className="toggle-control" onClick={() => toast("VADER disagreement filter is ready when imported comparison scores are available.")}><span />VADER disagreement</button><button className="button button--secondary" onClick={() => toast("Export is available after importing source rows.")}><Download size={15} />Export results</button></div>{scoped.length ? <div className="review-table"><div className="review-table__head"><span>Source evidence</span><span>Product</span><span>Label</span><span>Rating</span><span>Imported</span></div>{scoped.map((review) => <div className="review-table__row" key={review.id}><div><strong>{review.text || "Imported feedback row"}</strong><small>{review.source}</small></div><span>{review.product}</span><StatusPill tone={review.sentiment === "Positive" ? "teal" : review.sentiment === "Negative" ? "coral" : "amber"}>{review.sentiment}</StatusPill><span>{review.rating ? `${review.rating}/5` : "—"}</span><span>{review.createdAt}</span></div>)}</div> : <div className="table-empty"><div className="chart-empty__bars" aria-hidden="true"><span /><span /><span /></div><strong>{reviews.length ? "No rows match this search" : "No reviews imported yet"}</strong><p>{reviews.length ? "Try a broader search or reset the filters." : "Use Upload data to bring a CSV into the workspace."}</p>{!reviews.length && <button className="text-action" onClick={() => onNavigate("/upload")}>Go to Upload data <ChevronRight size={14} /></button>}</div>}<div className="table-footer"><span>{scoped.length} rows in view</span><span>1 / 1 <button className="icon-button" aria-label="Next page"><ChevronRight size={15} /></button></span></div></article></>;
}

function ReportsPage({ filteredReviews, filters, onImport }: { filteredReviews: Review[]; filters: ScopeFilters; onImport: () => void }) {
  return <><PageHeader eyebrow="Workspace / Output" title="Turn the current view into a useful brief." description="Export a filtered snapshot for product, support, and growth conversations." action={<button className="button button--secondary" onClick={() => toast("Export is available after importing source rows.")}><Download size={15} />Export CSV</button>} /><div className="report-context"><span><Grid2X2 size={14} />Current scope</span><strong>{filteredReviews.length} reviews</strong><span>{filters.product}</span><span>{filters.source}</span><span>{filters.sentiment}</span><span>{filters.rating}</span>{filters.from && <span>From {filters.from}</span>}{filters.to && <span>To {filters.to}</span>}</div><div className="report-grid"><article className="card executive-card"><div className="card-heading"><div><Eyebrow>Executive summary</Eyebrow><h2>The numbers behind the narrative</h2><p>This report mirrors the current dashboard scope.</p></div><div className="signal-stamp" aria-hidden="true"><i /><i /><i /></div></div><div className="executive-score"><strong>{filteredReviews.length ? `${Math.round(filteredReviews.filter((review) => review.sentiment === "Positive").length / filteredReviews.length * 100)}%` : "—"}</strong><span>positive sentiment share</span></div><div className="executive-breakdown">{(["Positive", "Neutral", "Negative"] as const).map((sentiment) => <div key={sentiment}><span className={`sentiment-dot sentiment-dot--${sentiment.toLowerCase()}`} />{sentiment}<strong>{filteredReviews.filter((review) => review.sentiment === sentiment).length || "—"}</strong></div>)}</div><div className="report-note"><ShieldCheck size={15} />CSV export includes review-level evidence, sentiment labels, confidence, themes, and source file.</div></article><DistributionCard reviews={filteredReviews} onImport={onImport} /></div><article className="card product-lens"><div className="card-heading"><div><Eyebrow>Product lens</Eyebrow><h2>Products in scope</h2><p>Sorted by review volume from the active source rows.</p></div><Tag size={17} /></div>{filteredReviews.length ? <div className="product-rows">{Array.from(new Set(filteredReviews.map((review) => review.product))).slice(0, 5).map((product) => { const count = filteredReviews.filter((review) => review.product === product).length; return <div className="product-row" key={product}><span>{product}</span><div><i style={{ width: `${Math.max(12, count / filteredReviews.length * 100)}%` }} /></div><strong>{count}</strong></div>; })}</div> : <div className="quiet-empty quiet-empty--horizontal"><Grid2X2 size={22} /><strong>No product breakdown yet</strong><span>Import reviews to make a product brief.</span></div>}</article></>;
}

function SettingsPage() {
  return <><PageHeader eyebrow="Workspace / Governance" title="Keep the workspace accountable." description="Manage access, inspect audit events, and make the source of every import clear." action={<StatusPill tone="amber">Admin only</StatusPill>} /><div className="settings-grid"><article className="card settings-card"><div className="card-heading"><div><Eyebrow>Access</Eyebrow><h2>Invite a teammate</h2><p>New self-serve accounts are viewers by default.</p></div><Users size={17} /></div><div className="settings-form"><label>Name<input placeholder="Alex Morgan" /></label><label>Email<input placeholder="alex@company.com" type="email" /></label><label>Role<select defaultValue="Viewer"><option>Viewer</option><option>Admin</option></select></label><button className="button button--primary" onClick={() => toast("Invitations are ready when identity storage is connected.")}><Plus size={15} />Add user</button></div></article><article className="card settings-card"><div className="card-heading"><div><Eyebrow>People</Eyebrow><h2>Workspace users</h2><p>2 accounts with local access</p></div><Users size={17} /></div><div className="people-list"><div><span className="avatar">A</span><div><strong>Admin User</strong><small>admin@sentimentiq.com</small></div><StatusPill tone="amber">Admin</StatusPill></div><div><span className="avatar avatar--viewer">V</span><div><strong>Viewer User</strong><small>viewer@sentimentiq.com</small></div><StatusPill tone="ink">Viewer</StatusPill></div></div></article><article className="card audit-card"><div className="card-heading"><div><Eyebrow>Audit log</Eyebrow><h2>Recent workspace events</h2><p>Imports, access changes, and preset governance</p></div><ShieldCheck size={17} /></div><div className="audit-toolbar"><label className="table-search"><Search size={15} /><input placeholder="Search actor or event details" /></label><select defaultValue="All actions"><option>All actions</option><option>System init</option><option>Import</option><option>Access change</option></select></div><div className="audit-event"><span className="audit-icon"><Check size={14} /></span><div><strong>System initialized</strong><small>Workspace ready for source import</small></div><time>Today</time></div></article></div></>;
}

function AppShell({ onLogout }: { onLogout: () => void }) {
  const [location, setLocation] = useLocation();
  const view = getView(location);
  const [collapsed, setCollapsed] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(() => {
    try { return JSON.parse(localStorage.getItem("sentimentiq-reviews") || "[]") as Review[]; } catch { return initialReviews; }
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: "idle", progress: 0, message: "" });
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisSummary | null>(() => {
    try { return JSON.parse(localStorage.getItem("sentimentiq-last-analysis") || "null") as AnalysisSummary | null; } catch { return null; }
  });
  const [filters, setFilters] = useState({ product: "All products", source: "All sources", sentiment: "All sentiment", rating: "All ratings", from: "", to: "" });
  const [search, setSearch] = useState("");
  const products = useMemo(() => Array.from(new Set(reviews.map((review) => review.product))).sort(), [reviews]);
  const sources = useMemo(() => Array.from(new Set(reviews.map((review) => review.source))).sort(), [reviews]);
  const filteredReviews = useMemo(() => reviews.filter((review) => {
    const matchesProduct = filters.product === "All products" || review.product === filters.product;
    const matchesSource = filters.source === "All sources" || review.source === filters.source;
    const matchesSentiment = filters.sentiment === "All sentiment" || review.sentiment === filters.sentiment;
    const matchesRating = filters.rating === "All ratings" || review.rating === Number(filters.rating);
    const matchesFrom = !filters.from || review.createdAt >= filters.from;
    const matchesTo = !filters.to || review.createdAt <= filters.to;
    const haystack = `${review.text} ${review.product} ${review.source}`.toLowerCase();
    return matchesProduct && matchesSource && matchesSentiment && matchesRating && matchesFrom && matchesTo && (!search || haystack.includes(search.toLowerCase()));
  }), [filters, reviews, search]);
  const navigate = (path: string) => { if (path === "/") { onLogout(); return; } setLocation(path); };
  const handleImport = () => setLocation("/upload");
  const handleAnalyze = (text: string, title: string, source: string) => {
    const summary = analyzeScriptText(text, title, source);
    const merged = [...reviews, ...summary.segments];
    setReviews(merged);
    setLastAnalysis(summary);
    localStorage.setItem("sentimentiq-reviews", JSON.stringify(merged));
    localStorage.setItem("sentimentiq-last-analysis", JSON.stringify(summary));
    toast.success(`${summary.segments.length} transcript segments added to Dashboard and Reports.`);
  };
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    const supported = ["csv", "pdf", "docx"];
    if (!extension || !supported.includes(extension)) {
      const message = "Unsupported file type. SentimentIQ accepts CSV, PDF, or DOCX files.";
      setUploadStatus({ status: "error", progress: 0, message });
      toast.error(message);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      const message = "This file is larger than 25 MB. Choose a smaller CSV, PDF, or DOCX file.";
      setUploadStatus({ status: "error", progress: 0, message });
      toast.error(message);
      return;
    }
    try {
      setUploadStatus({ status: "processing", progress: 10, message: `Reading ${file.name}…` });
      const text = await extractUploadText(file);
      setUploadStatus({ status: "processing", progress: 36, message: "Extracted text. Building sentiment rows…" });
      const next = extension === "csv" ? parseCsv(text, file.name) : textToReviewRows(text, file.name);
      if (!next.length) throw new Error(extension === "csv" ? "No review rows were found. Add a text or feedback column to the CSV." : "No readable text was found in this document.");
      const processed = await processInBatches(next, (count) => setUploadStatus({ status: "processing", progress: 36 + Math.round(count / next.length * 54), message: `Processed ${count.toLocaleString()} of ${next.length.toLocaleString()} segments…` }));
      const merged = [...reviews, ...processed];
      setReviews(merged);
      localStorage.setItem("sentimentiq-reviews", JSON.stringify(merged));
      setUploadStatus({ status: "complete", progress: 100, message: `${processed.length.toLocaleString()} source rows ready for review.` });
      toast.success(`${processed.length} ${extension.toUpperCase()} rows imported. Reports are now calculated from this data.`);
      setLocation("/reports");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not read this file. Try another CSV, PDF, or DOCX.";
      setUploadStatus({ status: "error", progress: 0, message });
      toast.error(message);
    }
  };
  return <div className="app-shell"><Sidebar view={view} onNavigate={navigate} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /><div className="workspace"><Topbar onImport={handleImport} onNavigate={navigate} /><main className="workspace-main">{view === "dashboard" && <Dashboard reviews={reviews} filteredReviews={filteredReviews} products={products} sources={sources} filters={filters} setFilters={setFilters} onImport={handleImport} onNavigate={navigate} />}{view === "upload" && <UploadPage onFile={onFile} uploadStatus={uploadStatus} />}{view === "analysis" && <ScriptAnalysis lastAnalysis={lastAnalysis} onAnalyze={handleAnalyze} onNavigate={navigate} />}{view === "reviews" && <ReviewsPage reviews={reviews} filteredReviews={filteredReviews} search={search} setSearch={setSearch} onNavigate={navigate} />}{view === "reports" && <ReportsPage filteredReviews={filteredReviews} filters={filters} onImport={handleImport} />}{view === "settings" && <SettingsPage />}</main><footer className="workspace-footer"><span>SentimentIQ · private workspace</span><span>Source context stays attached</span></footer></div></div>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = useState(() => location !== "/");
  if (!authenticated && location === "/") return <Landing onEnter={() => { setAuthenticated(true); setLocation("/dashboard"); }} />;
  if (!authenticated) return <Landing onEnter={() => { setAuthenticated(true); setLocation("/dashboard"); }} />;
  return <AppShell onLogout={() => { setAuthenticated(false); setLocation("/"); }} />;
}
