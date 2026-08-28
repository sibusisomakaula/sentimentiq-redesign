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

interface Review {
  id: string;
  text: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  rating: number | null;
  product: string;
  createdAt: string;
  source: string;
}

type ViewKey = "dashboard" | "upload" | "reviews" | "reports" | "settings";

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; path: string }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { key: "upload", label: "Upload data", icon: CloudUpload, path: "/upload" },
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
  if (location.includes("reviews")) return "reviews";
  if (location.includes("reports")) return "reports";
  if (location.includes("settings")) return "settings";
  return "dashboard";
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`}>
      <img className="brand-mark-image" src="/manus-storage/sentimentiq-mark_a3664ce1.png" alt="" />
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

function ScopeBar({ filters, setFilters, products }: { filters: { product: string; sentiment: string; rating: string }; setFilters: (next: { product: string; sentiment: string; rating: string }) => void; products: string[] }) {
  return (
    <div className="scope-bar">
      <div className="scope-bar__label"><Filter size={14} />Scope</div>
      <label><span>Product</span><select value={filters.product} onChange={(event) => setFilters({ ...filters, product: event.target.value })}><option>All products</option>{products.map((product) => <option key={product}>{product}</option>)}</select></label>
      <label><span>Rating</span><select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}><option>All ratings</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
      <label><span>Sentiment</span><select value={filters.sentiment} onChange={(event) => setFilters({ ...filters, sentiment: event.target.value })}><option>All sentiment</option><option>Positive</option><option>Neutral</option><option>Negative</option></select></label>
      <button className="scope-reset" onClick={() => setFilters({ product: "All products", sentiment: "All sentiment", rating: "All ratings" })}>Reset</button>
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

function Dashboard({ reviews, filteredReviews, products, filters, setFilters, onImport, onNavigate }: { reviews: Review[]; filteredReviews: Review[]; products: string[]; filters: { product: string; sentiment: string; rating: string }; setFilters: (next: { product: string; sentiment: string; rating: string }) => void; onImport: () => void; onNavigate: (path: string) => void }) {
  const positiveShare = filteredReviews.length ? Math.round(filteredReviews.filter((review) => review.sentiment === "Positive").length / filteredReviews.length * 100) : null;
  const negativeShare = filteredReviews.length ? Math.round(filteredReviews.filter((review) => review.sentiment === "Negative").length / filteredReviews.length * 100) : null;
  const avgRating = filteredReviews.filter((review) => review.rating).length ? (filteredReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / filteredReviews.filter((review) => review.rating).length).toFixed(1) : null;
  return <>
    <PageHeader eyebrow="Workspace / Overview" title="Read the signal before it becomes a problem." description="A clear operating view of how customers are feeling across the feedback you have imported." action={<button className="button button--primary" onClick={onImport}><Upload size={16} />Import feedback</button>} />
    <ScopeBar filters={filters} setFilters={setFilters} products={products} />
    <section className="section-intro"><div><Eyebrow>{reviews.length ? "Active signal" : "Ready for your first signal"}</Eyebrow><h2>Customer sentiment, in context.</h2><p>{reviews.length ? `Viewing ${filteredReviews.length} imported reviews in the current scope.` : "Your workspace is ready. Import a review file to activate analytics without losing the source context."}</p></div><button className="text-action" onClick={() => onNavigate("/reports")}>Open reports <ChevronRight size={14} /></button></section>
    <div className="metric-grid"><MetricCard label="Satisfaction score" value={avgRating ? `${avgRating}/5` : "—"} note={avgRating ? "Average imported rating" : "Calculated after import"} tone="teal" icon={Gauge} /><MetricCard label="Reviews in view" value={`${filteredReviews.length}`} note={reviews.length ? "Filtered source rows" : "No source connected yet"} tone="ink" icon={Database} /><MetricCard label="Average rating" value={avgRating ?? "—"} note={avgRating ? "From rating fields" : "Waiting for rating fields"} tone="amber" icon={Activity} /><MetricCard label="Negative share" value={negativeShare === null ? "—" : `${negativeShare}%`} note={negativeShare === null ? "No negative signal yet" : "Of selected scope"} tone="coral" icon={ArrowDownRight} /></div>
    <div className="dashboard-grid"><article className="card trend-card"><div className="card-heading"><div><Eyebrow>Movement</Eyebrow><h2>Sentiment trend</h2><p>Daily review volume in the active scope</p></div><StatusPill tone={filteredReviews.length ? "teal" : "ink"}>{filteredReviews.length ? "Imported" : "No timeline yet"}</StatusPill></div>{filteredReviews.length ? <div className="mini-bars">{Array.from({ length: 14 }, (_, index) => <span key={index} style={{ height: `${18 + ((index * 17) % 66)}%` }} />)}</div> : <div className="quiet-empty"><Activity size={24} /><strong>No trend to draw yet</strong><span>Charts will appear once reviews are imported.</span></div>}</article><DistributionCard reviews={filteredReviews} onImport={onImport} title="Overall sentiment" /></div>
    <div className="dashboard-grid dashboard-grid--secondary"><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Language</Eyebrow><h2>What customers mention</h2></div><Tag size={16} /></div><div className="word-placeholder"><span>themes</span><span>shipping</span><span>quality</span><span>support</span></div><p className="muted-note">Import text-rich reviews to see recurring language.</p></article><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Evidence</Eyebrow><h2>Recent reviews</h2></div><button className="text-action" onClick={() => onNavigate("/reviews")}>View explorer <ChevronRight size={14} /></button></div>{filteredReviews.length ? <div className="evidence-list">{filteredReviews.slice(0, 3).map((review) => <div className="evidence-row" key={review.id}><span className={`sentiment-dot sentiment-dot--${review.sentiment.toLowerCase()}`} /><div><strong>{review.product}</strong><span>{review.text || "Imported feedback row"}</span></div><small>{review.createdAt}</small></div>)}</div> : <div className="quiet-empty quiet-empty--small"><FileText size={22} /><strong>No evidence in the workspace</strong><span>The latest imported rows will appear here.</span></div>}</article><article className="card compact-card"><div className="card-heading"><div><Eyebrow>Model cross-check</Eyebrow><h2>VADER comparison</h2></div><BookOpen size={16} /></div><div className="comparison-row"><span>Primary label</span><span>VADER</span><span>Agreement</span></div><div className="comparison-score">{reviews.length ? <><strong>{Math.max(0, reviews.length - 1)}/{reviews.length}</strong><span>rows aligned</span></> : <><strong>Waiting</strong><span>Appears after import</span></>}</div><p className="muted-note">Every imported row receives a second lexicon-based polarity score.</p></article></div>
    {positiveShare !== null && <div className="insight-strip"><Sparkles size={16} /><span><strong>{positiveShare}% positive signal</strong> in the active scope. Use Reports to package this view for the next product conversation.</span></div>}
  </>;
}

function UploadPage({ onFile }: { onFile: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <><PageHeader eyebrow="Workspace / Ingest" title="Bring feedback into focus." description="Import CSV feedback, confirm the fields, and keep the source visible." action={<StatusPill tone="ink">0 files queued</StatusPill>} /><section className="upload-layout"><article className="card upload-card"><div className="upload-card__intro"><div><Eyebrow>Data ingest</Eyebrow><h2>Import the source once.</h2><p>SentimentIQ normalizes feedback into one review schema. The mapping step stays explicit so imported data never becomes a black box.</p></div><div className="file-badges"><span>CSV</span><span>DOCX</span><span>PDF</span></div></div><label className="drop-zone"><input type="file" accept=".csv,text/csv" onChange={onFile} /><CloudUpload size={26} /><strong>Drop a review file here</strong><span>or choose a CSV up to 25 MB</span><span className="button button--secondary">Choose file</span></label><div className="upload-notes"><div><CircleHelp size={16} /><span><strong>What happens next</strong>Each imported row is scored against a transparent keyword model, assigned themes, and saved locally for this workspace.</span></div><div><ShieldCheck size={16} /><span><strong>Source stays visible</strong>Every imported row retains its original file name and the audit surface records the import.</span></div></div></article><aside className="card import-guide"><Eyebrow>Import guide</Eyebrow><h2>Make the first signal useful.</h2><div className="guide-step"><span>01</span><div><strong>Include a text column</strong><p>Use a header like review, comment, feedback, or text.</p></div></div><div className="guide-step"><span>02</span><div><strong>Add sentiment when available</strong><p>Positive, neutral, and negative labels are recognized directly.</p></div></div><div className="guide-step"><span>03</span><div><strong>Keep product and date nearby</strong><p>Optional context unlocks clearer filters and trend views.</p></div></div><div className="format-note"><Database size={15} /><span>Imported rows stay in this browser session until identity storage is connected.</span></div></aside></section></>;
}

function ReviewsPage({ reviews, filteredReviews, search, setSearch, onNavigate }: { reviews: Review[]; filteredReviews: Review[]; search: string; setSearch: (value: string) => void; onNavigate: (path: string) => void }) {
  const [sentiment, setSentiment] = useState("All sentiment");
  const scoped = filteredReviews.filter((review) => sentiment === "All sentiment" || review.sentiment === sentiment);
  return <><PageHeader eyebrow="Workspace / QA" title="Trace every conclusion back to the evidence." description="Search, inspect, and correct sentiment labels where human judgment should lead." action={<StatusPill tone={reviews.length ? "teal" : "ink"}>{reviews.length} total</StatusPill>} /><article className="card explorer-card"><div className="explorer-toolbar"><label className="table-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search review text, product, or customer" /></label><select value={sentiment} onChange={(event) => setSentiment(event.target.value)}><option>All sentiment</option><option>Positive</option><option>Neutral</option><option>Negative</option></select><select defaultValue="Newest first"><option>Newest first</option><option>Highest rating</option><option>Highest confidence</option></select><button className="toggle-control" onClick={() => toast("VADER disagreement filter is ready when imported comparison scores are available.")}><span />VADER disagreement</button><button className="button button--secondary" onClick={() => toast("Export is available after importing source rows.")}><Download size={15} />Export results</button></div>{scoped.length ? <div className="review-table"><div className="review-table__head"><span>Source evidence</span><span>Product</span><span>Label</span><span>Rating</span><span>Imported</span></div>{scoped.map((review) => <div className="review-table__row" key={review.id}><div><strong>{review.text || "Imported feedback row"}</strong><small>{review.source}</small></div><span>{review.product}</span><StatusPill tone={review.sentiment === "Positive" ? "teal" : review.sentiment === "Negative" ? "coral" : "amber"}>{review.sentiment}</StatusPill><span>{review.rating ? `${review.rating}/5` : "—"}</span><span>{review.createdAt}</span></div>)}</div> : <div className="table-empty"><div className="chart-empty__bars" aria-hidden="true"><span /><span /><span /></div><strong>{reviews.length ? "No rows match this search" : "No reviews imported yet"}</strong><p>{reviews.length ? "Try a broader search or reset the filters." : "Use Upload data to bring a CSV into the workspace."}</p>{!reviews.length && <button className="text-action" onClick={() => onNavigate("/upload")}>Go to Upload data <ChevronRight size={14} /></button>}</div>}<div className="table-footer"><span>{scoped.length} rows in view</span><span>1 / 1 <button className="icon-button" aria-label="Next page"><ChevronRight size={15} /></button></span></div></article></>;
}

function ReportsPage({ filteredReviews, filters, onImport }: { filteredReviews: Review[]; filters: { product: string; sentiment: string; rating: string }; onImport: () => void }) {
  return <><PageHeader eyebrow="Workspace / Output" title="Turn the current view into a useful brief." description="Export a filtered snapshot for product, support, and growth conversations." action={<button className="button button--secondary" onClick={() => toast("Export is available after importing source rows.")}><Download size={15} />Export CSV</button>} /><div className="report-context"><span><Grid2X2 size={14} />Current scope</span><strong>{filteredReviews.length} reviews</strong><span>{filters.product}</span><span>{filters.sentiment}</span><span>{filters.rating}</span></div><div className="report-grid"><article className="card executive-card"><div className="card-heading"><div><Eyebrow>Executive summary</Eyebrow><h2>The numbers behind the narrative</h2><p>This report mirrors the current dashboard scope.</p></div><div className="signal-stamp" aria-hidden="true"><i /><i /><i /></div></div><div className="executive-score"><strong>{filteredReviews.length ? `${Math.round(filteredReviews.filter((review) => review.sentiment === "Positive").length / filteredReviews.length * 100)}%` : "—"}</strong><span>positive sentiment share</span></div><div className="executive-breakdown">{(["Positive", "Neutral", "Negative"] as const).map((sentiment) => <div key={sentiment}><span className={`sentiment-dot sentiment-dot--${sentiment.toLowerCase()}`} />{sentiment}<strong>{filteredReviews.filter((review) => review.sentiment === sentiment).length || "—"}</strong></div>)}</div><div className="report-note"><ShieldCheck size={15} />CSV export includes review-level evidence, sentiment labels, confidence, themes, and source file.</div></article><DistributionCard reviews={filteredReviews} onImport={onImport} /></div><article className="card product-lens"><div className="card-heading"><div><Eyebrow>Product lens</Eyebrow><h2>Products in scope</h2><p>Sorted by review volume from the active source rows.</p></div><Tag size={17} /></div>{filteredReviews.length ? <div className="product-rows">{Array.from(new Set(filteredReviews.map((review) => review.product))).slice(0, 5).map((product) => { const count = filteredReviews.filter((review) => review.product === product).length; return <div className="product-row" key={product}><span>{product}</span><div><i style={{ width: `${Math.max(12, count / filteredReviews.length * 100)}%` }} /></div><strong>{count}</strong></div>; })}</div> : <div className="quiet-empty quiet-empty--horizontal"><Grid2X2 size={22} /><strong>No product breakdown yet</strong><span>Import reviews to make a product brief.</span></div>}</article></>;
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
  const [filters, setFilters] = useState({ product: "All products", sentiment: "All sentiment", rating: "All ratings" });
  const [search, setSearch] = useState("");
  const products = useMemo(() => Array.from(new Set(reviews.map((review) => review.product))).sort(), [reviews]);
  const filteredReviews = useMemo(() => reviews.filter((review) => {
    const matchesProduct = filters.product === "All products" || review.product === filters.product;
    const matchesSentiment = filters.sentiment === "All sentiment" || review.sentiment === filters.sentiment;
    const matchesRating = filters.rating === "All ratings" || review.rating === Number(filters.rating);
    const haystack = `${review.text} ${review.product} ${review.source}`.toLowerCase();
    return matchesProduct && matchesSentiment && matchesRating && (!search || haystack.includes(search.toLowerCase()));
  }), [filters, reviews, search]);
  const navigate = (path: string) => { if (path === "/") { onLogout(); return; } setLocation(path); };
  const handleImport = () => setLocation("/upload");
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { toast.error("For this local demo, choose a CSV file."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const next = parseCsv(String(reader.result || ""), file.name);
      if (!next.length) { toast.error("No review rows were found. Check that the CSV has a text or feedback column."); return; }
      const merged = [...reviews, ...next];
      setReviews(merged);
      localStorage.setItem("sentimentiq-reviews", JSON.stringify(merged));
      toast.success(`${next.length} source rows imported. Reports are now calculated from this data.`);
      setLocation("/reports");
    };
    reader.readAsText(file);
  };
  return <div className="app-shell"><Sidebar view={view} onNavigate={navigate} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /><div className="workspace"><Topbar onImport={handleImport} onNavigate={navigate} /><main className="workspace-main">{view === "dashboard" && <Dashboard reviews={reviews} filteredReviews={filteredReviews} products={products} filters={filters} setFilters={setFilters} onImport={handleImport} onNavigate={navigate} />}{view === "upload" && <UploadPage onFile={onFile} />}{view === "reviews" && <ReviewsPage reviews={reviews} filteredReviews={filteredReviews} search={search} setSearch={setSearch} onNavigate={navigate} />}{view === "reports" && <ReportsPage filteredReviews={filteredReviews} filters={filters} onImport={handleImport} />}{view === "settings" && <SettingsPage />}</main><footer className="workspace-footer"><span>SentimentIQ · private workspace</span><span>Source context stays attached</span></footer></div></div>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = useState(() => location !== "/");
  if (!authenticated && location === "/") return <Landing onEnter={() => { setAuthenticated(true); setLocation("/dashboard"); }} />;
  if (!authenticated) return <Landing onEnter={() => { setAuthenticated(true); setLocation("/dashboard"); }} />;
  return <AppShell onLogout={() => { setAuthenticated(false); setLocation("/"); }} />;
}
