import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken, handleApiError, updateMetaTags } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import ScoreGraph from "../components/ScoreGraph";
import AnalysisLoader from "../components/AnalysisLoader";
import ResumeRadarChart from "../components/RadarChart";

/* ── Animated Score Ring ─────────────────────────────── */
function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;
  const color = score >= 75 ? "hsl(142 71% 45%)" : score >= 50 ? "hsl(var(--primary))" : "hsl(38 92% 50%)";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="mt-2 index-label px-2 py-0.5 border border-primary/20 bg-primary/5">
        {score >= 75 ? "Strong" : score >= 50 ? "Good" : "Needs Work"}
      </span>
    </div>
  );
}

/* ── Metric Chip ─────────────────────────────────────── */
function MetricChip({ label, value, sub }) {
  return (
    <div className="brutalist-card p-4 animate-fade-in relative overflow-hidden bg-card">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── ToolCard ────────────────────────────────────────── */
function ToolCard({ title, subtitle, icon, endpoint, outputKey }) {
  const [jdText, setJdText] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    if (!jdText.trim()) { setErr("Please paste a job description first."); return; }
    setBusy(true); setErr(""); setOutput("");
    try {
      const { data } = await axios.post(
        `${API_BASE}${endpoint}`,
        new URLSearchParams({ jd: jdText }),
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setOutput(data[outputKey] || "Done.");
    } catch (e) {
      setErr(e.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="brutalist-card p-6 flex flex-col animate-fade-in relative bg-card">
      <span className="index-label absolute top-2 right-4">GEN.MODULE</span>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "hsl(var(--primary) / 0.1)" }}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <textarea
        value={jdText}
        onChange={e => setJdText(e.target.value)}
        placeholder="Paste the job description here..."
        className="tech-input resize-none h-32 text-sm mb-3"
      />

      {err && <p className="text-xs text-destructive mb-2">{err}</p>}

      <button
        onClick={run}
        disabled={busy}
        className="brutalist-btn brutalist-btn-primary py-2.5 px-4 text-sm font-semibold mb-3 disabled:opacity-50"
      >
        {busy ? "Generating…" : `Generate ${title}`}
      </button>

      {output && (
        <div className="mt-1 p-4 border-2 border-border bg-background text-sm text-foreground font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto animate-fade-in">
          {output}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────── */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [file, setFile]     = useState(null);
  const [jd, setJd]         = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [history, setHistory]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [user, setUser]     = useState({ username: "", email: "" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({ title: "SmartResume – Dashboard" });
    fetchProfile();
  }, []);

  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUser(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setHistory(data.analyses || []);
    } catch (e) {
      if (e.response?.status === 401) { removeAuthToken(); navigate("/login"); }
    } finally { setHistoryLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please select a PDF file."); return; }
    try {
      setLoading(true); setError(null);
      const fd = new FormData();
      fd.append("file", file);
      if (jd) fd.append("jd", jd);
      const { data } = await axios.post(`${API_BASE}/analyze-resume/`, fd, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setResult(data);
      setActiveTab("analysis");
    } catch (e) {
      setError(handleApiError(e));
      if (e.response?.status === 401) setTimeout(() => navigate("/login"), 1500);
    } finally { setLoading(false); }
  };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  };

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-background grid-bg">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { removeAuthToken(); navigate("/"); }} />

      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b-2 border-border bg-background/90 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold text-foreground capitalize">{activeTab === "dashboard" ? "System Input" : activeTab}</h1>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">&gt; User identified: <span className="text-primary font-bold">{user.username || "GUEST"}</span></p>
          </div>
          <span className="index-label border border-primary/30 px-2 py-0.5 bg-primary/5">FREE_TIER_ACCESS</span>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div className="animate-fade-in space-y-6">
              {loading ? (
                <div className="brutalist-card p-16 flex flex-col items-center gap-4 bg-card">
                  <AnalysisLoader />
                  <p className="text-sm text-muted-foreground animate-pulse">Running diagnostic modules…</p>
                </div>
              ) : (
                <>
                  {/* Drop zone */}
                  <div
                    className={`brutalist-card p-10 flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
                    style={{ minHeight: "220px" }}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                    {file ? (
                      <div className="flex flex-col items-center gap-3 animate-scale-in">
                        <div className="w-14 h-14 border-2 border-primary flex items-center justify-center bg-primary/10">
                          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="font-semibold text-foreground text-center">{file.name}</p>
                        <span className="index-label border border-primary/50 px-3 py-1 bg-primary/10">READY_FOR_PROCESSING</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 border border-border flex items-center justify-center">
                          <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <p className="text-foreground font-medium">Drop your PDF here, or click to browse</p>
                        <p className="text-xs text-muted-foreground">PDF only · max 10 MB</p>
                      </div>
                    )}
                  </div>

                  {/* JD box */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-foreground mb-3 uppercase tracking-wider">[02] TARGET_JD (OPTIONAL)</label>
                    <textarea
                      value={jd}
                      onChange={e => setJd(e.target.value)}
                      placeholder="Paste the job description to get tailored suggestions…"
                      className="tech-input resize-none h-36 leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="brutalist-btn brutalist-btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
                  >
                    <span>EXECUTE_ANALYSIS</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── ANALYSIS TAB ── */}
          {activeTab === "analysis" && (
            <div className="animate-fade-in">
              {!result ? (
                <div className="premium-card p-16 flex flex-col items-center gap-4 text-center">
                  <p className="text-muted-foreground">No analysis yet. Upload a resume on the Dashboard first.</p>
                  <button onClick={() => setActiveTab("dashboard")} className="brutalist-btn px-6 py-2.5 text-sm font-semibold uppercase">Return to Input</button>
                </div>
              ) : (
                <div className="space-y-6 stagger-children">
                  {/* Row 1: Score + Radar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="brutalist-card p-6 flex flex-col items-center gap-6 animate-fade-in bg-card">
                      <div className="w-full border-b border-border pb-4 mb-2 relative">
                        <span className="index-label absolute -top-1 left-0">001.TELEMETRY</span>
                        <h2 className="text-sm font-bold text-foreground pt-4">Diagnostic Score</h2>
                      </div>
                      <ScoreRing score={result.ats_score} />
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="border border-border bg-background p-3 text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-border"></div>
                          <p className="text-xs text-muted-foreground">ML Score</p>
                          <p className="text-lg font-bold text-foreground">{result.score_details?.breakdown?.ml_score ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">/ 70</p>
                        </div>
                        <div className="border border-primary/20 bg-primary/5 p-3 text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                          <p className="text-xs text-muted-foreground">AI Score</p>
                          <p className="text-lg font-bold text-primary">{result.score_details?.breakdown?.gemini_score ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">/ 30</p>
                        </div>
                      </div>
                    </div>

                    <div className="brutalist-card p-6 animate-fade-in bg-card relative" style={{ minHeight: "320px" }}>
                      <span className="index-label absolute top-2 right-4">VISUAL_RADAR</span>
                      <ResumeRadarChart data={result.score_details?.radar_data} />
                    </div>
                  </div>

                  {/* Row 2: Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricChip
                      label="Keyword Match"
                      value={`${result.score_details?.technical_metrics?.keyword_match?.percent ?? 0}%`}
                      sub={result.score_details?.technical_metrics?.keyword_match?.level}
                    />
                    <MetricChip
                      label="Sections Found"
                      value={result.score_details?.technical_metrics?.section_completeness ?? "—"}
                      sub="standard sections"
                    />
                    <MetricChip
                      label="Formatting"
                      value={`${result.score_details?.technical_metrics?.formatting?.score ?? 0}%`}
                      sub={result.score_details?.technical_metrics?.formatting?.level}
                    />
                    <MetricChip
                      label="Previous Score"
                      value={result.previous_score ? `${result.previous_score}` : "First scan"}
                      sub={result.score_diff > 0 ? `↑ +${result.score_diff}` : result.score_diff < 0 ? `↓ ${result.score_diff}` : ""}
                    />
                  </div>

                  {/* Row 3: Role Alignment */}
                  {result.score_details?.role_alignment && Object.keys(result.score_details.role_alignment).length > 0 && (
                    <div className="brutalist-card p-6 animate-fade-in bg-card relative">
                      <span className="index-label absolute top-2 right-4">ALIGNMENT_VECT</span>
                      <h3 className="text-sm font-semibold text-foreground mb-4">Role Alignment</h3>
                      <div className="space-y-3">
                        {Object.entries(result.score_details.role_alignment).map(([role, pct]) => (
                          <div key={role}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{role}</span>
                              <span className="font-semibold text-foreground">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-2 bg-muted border border-border overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.round(pct)}%`,
                                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                                  transition: "width 1s ease-out",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Suggestions */}
                  <div className="brutalist-card p-6 animate-fade-in bg-card relative">
                    <span className="index-label absolute top-2 right-4">TECH_RECOMMENDATIONS</span>
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-primary/10 border border-primary/30">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="text-sm font-bold text-foreground">IMPROVEMENT_DATA</h3>
                      {result.gemini_available && <span className="index-label ml-auto border border-primary/30 px-2 py-0.5 bg-primary/5">SYS.DIAGNOSTIC</span>}
                    </div>

                    {result.suggestions && result.suggestions.length > 0 ? (
                      <div className="space-y-3 stagger-children">
                        {result.suggestions.map((s, i) => (
                          <div key={i} className="flex gap-4 p-4 border border-border bg-background hover:border-primary/40 transition-colors animate-fade-in">
                            <span className="shrink-0 w-6 h-6 border border-primary/30 flex items-center justify-center text-[10px] font-mono font-bold text-primary bg-primary/5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-foreground leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">No specific suggestions — your resume looks solid!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <div className="animate-fade-in space-y-6">
              {historyLoading && (
                <div className="premium-card p-8 flex items-center justify-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading history…</p>
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <div className="premium-card p-16 flex flex-col items-center gap-4 text-center">
                  <p className="text-muted-foreground">No analyses yet. Upload a resume to get started!</p>
                  <button onClick={() => setActiveTab("dashboard")} className="brutalist-btn px-6 py-2.5 text-sm uppercase">INIT_UPLOAD</button>
                </div>
              )}

              {!historyLoading && history.length > 0 && (
                <>
                  <div className="premium-card p-6">
                    <ScoreGraph data={history} />
                  </div>

                  <div className="space-y-4">
                    {history.map((item, idx) => (
                      <div key={item.id} className="premium-card p-5 flex items-center gap-5 animate-fade-in">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}>
                          #{history.length - idx}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-sm text-foreground mt-0.5 truncate">{item.resume_preview || "Resume analysis"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-foreground">{Math.round(item.ats_score)}</p>
                          <span className={`badge ${item.ats_score >= 70 ? "badge-success" : "badge-warning"}`}>
                            {item.ats_score >= 70 ? "Strong" : "Needs work"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TOOLS TAB ── */}
          {activeTab === "tools" && (
            <div className="animate-fade-in space-y-6">
              {!result && (
                <div className="premium-card p-5 flex items-center gap-4 border-l-4 border-primary animate-fade-in">
                  <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">Analyze a resume first</p>
                    <p className="text-xs text-muted-foreground">Upload your resume on the Dashboard so these tools can tailor their output to you.</p>
                  </div>
                  <button onClick={() => setActiveTab("dashboard")} className="ml-auto brutalist-btn px-4 py-2 text-[10px] shrink-0">GOTO_DASHBOARD</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCard title="Cover Letter" subtitle="Generate a tailored document" icon="📄" endpoint="/generate-cover-letter" outputKey="cover_letter" />
                <ToolCard title="Interview Prep" subtitle="Technical questions & tips" icon="🛠️" endpoint="/generate-interview-prep" outputKey="interview_prep" />
              </div>
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="max-w-lg animate-fade-in">
              <div className="premium-card p-8">
                <div className="flex flex-col items-center mb-8 pb-8 border-b border-border">
                  <div className="w-20 h-20 border-2 border-primary flex items-center justify-center text-3xl font-bold text-primary mb-4 bg-primary/5">
                    {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{user.username || "User"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  <span className="index-label border border-primary/30 px-3 py-1 bg-primary/5 mt-3">FREE_TIER_USER</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Username</label>
                    <input className="tech-input" value={user.username} readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                    <input className="tech-input" value={user.email} readOnly />
                  </div>
                  <div className="pt-2">
                    <button className="w-full py-3 border border-border text-muted-foreground font-mono text-[10px] uppercase tracking-widest cursor-not-allowed opacity-50">
                      Profile editing coming soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
