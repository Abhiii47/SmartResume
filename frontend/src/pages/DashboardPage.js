import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken, handleApiError, updateMetaTags } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import ScoreGraph from "../components/ScoreGraph";
import AnalysisLoader from "../components/AnalysisLoader";
import ResumeRadarChart from "../components/RadarChart";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [user, setUser] = useState({ username: "", email: "" });

  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({
      title: "SmartResume Dashboard",
      description: "Premium Resume Analysis",
      url: window.location.href,
    });
    fetchProfile(); // Fetch user data on mount
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const { data } = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const { data } = await axios.get(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(data.analyses || []);
    } catch (err) {
      if (err.response?.status === 401) {
        removeAuthToken();
        navigate("/login");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a PDF.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      const fd = new FormData();
      fd.append("file", file);
      if (jd) fd.append("jd", jd);

      const { data } = await axios.post(
        `${API_BASE}/analyze-resume/`,
        fd,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(data);
      setActiveTab("analysis");
    } catch (err) {
      setError(handleApiError(err));
      if (err.response?.status === 401) {
        setTimeout(() => navigate("/login"), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold capitalize text-foreground tracking-tight">{activeTab}</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, {user.username || 'User'}</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="flex items-center bg-card border border-border px-4 py-2 rounded-2xl shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Free Plan</span>
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="bg-card p-10 rounded-3xl border border-border shadow-xl shadow-primary/5 space-y-8 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">Upload New Resume</h2>
              <p className="text-muted-foreground mb-8">Get instant AI feedback on your resume's ATS compatibility.</p>

              {/* Dashboard Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AnalysisLoader />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="relative group">
                    <input
                      type="file"
                      id="file-upload"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-500 ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30 hover:border-primary/50'}`}
                    >
                      {file ? (
                        <div className="flex flex-col items-center space-y-3 text-primary animate-bounce-in">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className="font-bold text-lg">{file.name}</span>
                          <span className="text-xs font-medium opacity-60">Ready for analysis</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                            <svg className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <span className="text-foreground font-bold text-lg">Click to upload PDF resume</span>
                          <span className="text-muted-foreground text-sm mt-1">or drag and drop here</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-foreground ml-1 uppercase tracking-widest opacity-70">Target Job Description (Optional)</label>
                    <textarea
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      className="w-full px-6 py-5 rounded-2xl border border-border bg-muted/30 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none resize-none h-40 font-sans leading-relaxed"
                      placeholder="Paste the job description here to get a tailored ATS score..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !file}
                      className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:bg-black hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 group"
                    >
                      <span>Run Smart AI Analysis</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* ANALYSIS */}
        {activeTab === "analysis" && (
          <div className="h-[calc(100vh-140px)] animate-fade-in flex flex-col md:flex-row gap-6 overflow-hidden">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-3xl m-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="text-lg font-medium">No analysis result yet.</p>
                <button onClick={() => setActiveTab("dashboard")} className="text-gray-900 font-bold mt-2 hover:underline">Upload a resume to get started</button>
              </div>
            ) : (
              <>
                {/* LEFT PANEL: DETAILED SCORING */}
                <div className="flex-1 h-full overflow-y-auto pr-2 custom-scrollbar">

                    {/* OVERALL SCORE & RADAR CHART */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-primary/5 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
                        <div className="relative z-10">
                          <h2 className="text-2xl font-display font-bold text-foreground">Overall ATS Score</h2>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${result.ats_score >= 70 ? 'bg-emerald-100 text-emerald-700' : result.ats_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-destructive/10 text-destructive'}`}>
                              {result.ats_score >= 70 ? 'Great' : result.ats_score >= 50 ? 'Average' : 'Needs Work'}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">Global Benchmark</span>
                          </div>
                        </div>
                        <div className="mt-10 flex items-center justify-between relative z-10">
                          <div className="relative">
                            <svg className="w-28 h-28 transform -rotate-90">
                              <circle cx="56" cy="56" r="50" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                              <circle cx="56" cy="56" r="50" stroke={result.ats_score >= 70 ? '#10b981' : result.ats_score >= 50 ? '#f59e0b' : 'hsl(var(--destructive))'} strokeWidth="10" fill="none" strokeDasharray={314} strokeDashoffset={314 - (314 * result.ats_score) / 100} className="transition-all duration-[1.5s] ease-out stroke-round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl font-display font-bold text-foreground tracking-tighter">{Math.round(result.ats_score)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">Percentile</div>
                            <div className="text-2xl font-display font-bold text-foreground">Top {100 - Math.round(result.ats_score / 1.1)}%</div>
                            <div className="text-[10px] text-muted-foreground mt-1">Among 10k+ applicants</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-card p-8 rounded-3xl border border-border shadow-lg shadow-primary/5">
                        <ResumeRadarChart data={result.score_details?.radar_data} />
                      </div>
                    </div>

                    {/* ROLE ALIGNMENT SCORECARD */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Role Alignment Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.score_details?.role_alignment && Object.entries(result.score_details.role_alignment).map(([role, score]) => (
                          <div key={role} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{role}</div>
                            <div className="flex items-end justify-between">
                              <div className="text-xl font-bold text-gray-900">{score}%</div>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 mb-1.5">
                                <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  {/* DETAILED CATEGORIES */}
                  <div className="space-y-6 pb-8">

                    {/* CATEGORY 1: IMPACT (Recruiter Impact) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center mr-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </span>
                          Impact & Quantifiability
                        </h3>
                        <span className="font-bold text-gray-900">{result.score_details?.details?.clarity_pts ? Math.round(result.score_details.details.clarity_pts * 10) : 0}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div className="bg-gray-800 h-2.5 rounded-full" style={{ width: `${(result.score_details?.details?.clarity_pts || 0) * 10}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500">Measures how effectively you quantify your achievements with numbers and metrics.</p>
                    </div>

                    {/* CATEGORY 2: BREVITY & STYLE */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center mr-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </span>
                          Brevity & Style
                        </h3>
                        <span className="font-bold text-gray-900">{result.score_details?.details?.bullets_pts ? Math.round(result.score_details.details.bullets_pts * 10) : 0}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div className="bg-gray-800 h-2.5 rounded-full" style={{ width: `${(result.score_details?.details?.bullets_pts || 0) * 10}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500">Evaluates word choice, sentence length, and use of strong action verbs.</p>
                    </div>

                    {/* CATEGORY 3: SECTIONS & STRUCTURE */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center mr-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </span>
                          Sections & Structure
                        </h3>
                        <span className="font-bold text-gray-900">{result.score_details?.details?.structure_pts ? Math.round(result.score_details.details.structure_pts * 10) : 0}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div className="bg-gray-800 h-2.5 rounded-full" style={{ width: `${(result.score_details?.details?.structure_pts || 0) * 10}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500">Checks for essential sections (Education, Skills, Experience) and standard formatting.</p>
                    </div>

                    {/* AI SUGGESTIONS */}
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center font-display">
                          <svg className="w-6 h-6 mr-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          AI Improvement Plan
                        </h3>
                        <span className="text-xs font-bold bg-white text-gray-900 px-3 py-1 rounded-full shadow-sm border border-gray-100 uppercase tracking-widest">High Priority</span>
                      </div>

                      <ul className="space-y-6">
                        {result.suggestions && result.suggestions.length > 0 ? (
                          result.suggestions.map((s, i) => (
                            <li key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-1 h-full bg-gray-900 rounded-l-2xl"></div>
                              <div className="flex items-start">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center text-sm font-bold mr-4 mt-1 border border-gray-200">{i + 1}</span>
                                <div className="flex-1">
                                  <div className="text-gray-800 text-base leading-relaxed font-medium">
                                    {/* Highlight Action Verbs logic - simplified for demo */}
                                    {s.split(" ").map((word, wIndex) => {
                                      const actionVerbs = ["Lead", "Managed", "Developed", "Created", "Designed", "Implemented", "Achieved", "Increased", "Reduced", "Spearheaded"];
                                      const cleanWord = word.replace(/[^a-zA-Z]/g, "");
                                      if (actionVerbs.includes(cleanWord)) {
                                        return <span key={wIndex} className="bg-yellow-100 text-yellow-800 px-1 rounded font-bold">{word} </span>;
                                      }
                                      return word + " ";
                                    })}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="text-emerald-500 font-bold text-lg mb-2">Excellent Work!</div>
                            <div className="text-gray-500">No critical issues found. Your resume looks strong.</div>
                          </div>
                        )}
                      </ul>
                    </div>

                  </div>
                </div>

                  {/* RIGHT PANEL: RESUME PREVIEW (Glassmorphism Style) */}
                  <div className="hidden lg:block w-1/2 h-full bg-primary/95 rounded-3xl overflow-hidden border border-border shadow-2xl relative group ring-1 ring-white/10 animate-fade-in">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 border-b border-white/5 z-10">
                      <span className="text-[10px] font-mono text-white/50 flex items-center uppercase tracking-[0.2em]">
                        <svg className="w-3 h-3 mr-2 text-primary-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        secure_preview.pdf
                      </span>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                      </div>
                    </div>
                    {file ? (
                      <iframe
                        src={`${URL.createObjectURL(file)}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full pt-12 grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
                        title="Resume Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/20 font-mono text-[10px] tracking-widest uppercase">
                        [READY_FOR_INPUT]
                      </div>
                    )}
                  </div>
              </>
            )}
          </div>
        )
        }

        {/* HISTORY */}
        {
          activeTab === "history" && (
            <div className="animate-fade-in space-y-6">
              {historyLoading && <div className="text-center p-8">Loading history...</div>}

              {/* Score Graph */}
              {!historyLoading && history.length > 0 && (
                <ScoreGraph data={history} />
              )}

              {/* History List with Resume Previews */}
              <div className="space-y-4">
                {history.length === 0 && !historyLoading && (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg font-medium">No analysis history yet</p>
                    <p className="text-gray-400 text-sm mt-2">Upload your first resume to see your score history here</p>
                  </div>
                )}

                {history.map((item, index) => (
                  <div key={item.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: Score Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-gray-900 border border-gray-200">
                                v{history.length - index}
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 font-medium">{new Date(item.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-2xl font-bold text-gray-900">{Math.round(item.ats_score)}</span>
                                  <span className="text-sm text-gray-500">/ 100</span>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.ats_score >= 70 ? 'bg-green-100 text-green-700' :
                                    item.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                    {item.ats_score >= 70 ? 'Great' : item.ats_score >= 50 ? 'Average' : 'Needs Work'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {index < history.length - 1 && history[index + 1] && (
                              <div className={`text-sm font-bold flex items-center gap-1 ${item.ats_score >= history[index + 1].ats_score ? "text-green-600" : "text-red-500"
                                }`}>
                                {item.ats_score >= history[index + 1].ats_score ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                                {Math.abs(Math.round(item.ats_score - history[index + 1].ats_score))} pts
                              </div>
                            )}
                          </div>
                          {item.resume_preview && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">{item.resume_preview}</p>
                          )}
                        </div>

                        {/* Right: Resume Preview */}
                        {item.pdf_url && (
                          <div className="md:w-80 h-64 bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl relative group">
                            <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 flex items-center px-3 border-b border-gray-700 z-10">
                              <span className="text-xs font-mono text-gray-400">resume.pdf</span>
                            </div>
                            <iframe
                              src={item.pdf_url}
                              className="w-full h-full pt-10 grayscale hover:grayscale-0 transition-all duration-500"
                              title={`Resume Preview ${index + 1}`}
                              style={{ pointerEvents: 'none' }}
                              sandbox="allow-scripts allow-same-origin"
                            />
                            <a
                              href={item.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-white font-bold bg-gray-900 px-4 py-2 rounded-lg">View Full Resume</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* TOOLS */}
        {activeTab === "tools" && (
          <div className="animate-fade-in h-full overflow-y-auto pb-12 custom-scrollbar pr-2">
            {!result && (
              <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-amber-900 font-bold">No Resume Analysis Found</h4>
                  <p className="text-amber-700 text-sm">Please upload and analyze your resume in the <strong>Dashboard</strong> first. These tools need your resume context to work.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Tool 1: Cover Letter */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-fit">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Cover Letter</h3>
              <p className="text-gray-500 mb-6">Generate a professional, tailored cover letter based on your latest resume and a target job description.</p>
              
              <div className="space-y-4">
                <textarea
                  id="cl-jd"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-500 transition-all outline-none resize-none h-40"
                  placeholder="Paste the Job Description here..."
                />
                <button
                  id="cl-btn"
                  onClick={async () => {
                    const btn = document.getElementById("cl-btn");
                    const jdText = document.getElementById("cl-jd").value;
                    const output = document.getElementById("cl-output");
                    if (!jdText) return alert("Please paste a Job Description first.");
                    
                    try {
                      btn.disabled = true;
                      btn.innerText = "Generating...";
                      const { data } = await axios.post(`${API_BASE}/generate-cover-letter`, 
                        new URLSearchParams({ jd: jdText }),
                        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
                      );
                      output.innerText = data.cover_letter;
                      output.classList.remove("hidden");
                    } catch (err) {
                      alert(err.response?.data?.detail || "Failed to generate cover letter.");
                    } finally {
                      btn.disabled = false;
                      btn.innerText = "Generate Cover Letter";
                    }
                  }}
                  className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
                >
                  Generate Cover Letter
                </button>
                <div id="cl-output" className="hidden p-6 bg-gray-900 text-gray-100 rounded-2xl font-mono text-sm whitespace-pre-wrap leading-relaxed border border-gray-800 max-h-[500px] overflow-y-auto"></div>
              </div>
            </div>

            {/* Tool 2: Interview Prep */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-fit">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Interview Prep</h3>
              <p className="text-gray-500 mb-6">Get 5-7 challenging interview questions tailored to your experience and winning tips on how to answer them.</p>
              
              <div className="space-y-4">
                <textarea
                  id="int-jd"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all outline-none resize-none h-40"
                  placeholder="Paste the Job Description here..."
                />
                <button
                  id="int-btn"
                  onClick={async () => {
                    const btn = document.getElementById("int-btn");
                    const jdText = document.getElementById("int-jd").value;
                    const output = document.getElementById("int-output");
                    if (!jdText) return alert("Please paste a Job Description first.");
                    
                    try {
                      btn.disabled = true;
                      btn.innerText = "Analyzing...";
                      const { data } = await axios.post(`${API_BASE}/generate-interview-prep`, 
                        new URLSearchParams({ jd: jdText }),
                        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
                      );
                      output.innerText = data.interview_prep;
                      output.classList.remove("hidden");
                    } catch (err) {
                      alert(err.response?.data?.detail || "Failed to generate interview prep.");
                    } finally {
                      btn.disabled = false;
                      btn.innerText = "Generate Interview Prep";
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Generate Interview Prep
                </button>
                <div id="int-output" className="hidden p-6 bg-gray-900 text-gray-100 rounded-2xl font-mono text-sm whitespace-pre-wrap leading-relaxed border border-gray-800 max-h-[500px] overflow-y-auto"></div>
              </div>
            </div>

          </div>
        </div>
        )}
        {activeTab === "profile" && (
            <div className="max-w-xl mx-auto animate-fade-in">
              <div className="glass-panel p-8 rounded-3xl border border-white/60 shadow-sm">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-gray-900">
                    {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user.username || "User"}</h2>
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold mt-2">Free Plan</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Username</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={user.username}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Email Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      value={user.email}
                      readOnly
                    />
                  </div>
                  <div className="pt-4">
                    <button className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed">
                      Edit Profile (Coming Soon)
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </main>
    </div>
  );
}
