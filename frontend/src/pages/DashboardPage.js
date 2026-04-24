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
      description: "Technical Resume Analysis System",
      url: window.location.href,
    });
    fetchProfile();
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
      setError("UPLOAD_REQUIRED: Please select a PDF file.");
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
    <div className="flex h-screen bg-background overflow-hidden font-sans border-4 border-foreground">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth bg-[#f8fafc]">
        <div className="flex justify-between items-center mb-10 border-b-4 border-foreground pb-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">{activeTab}</h1>
            <p className="text-muted-foreground font-mono text-xs mt-2 uppercase tracking-widest">USER_STATUS: {user.username || 'AUTH_PENDING'}</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="flex items-center bg-foreground text-background border-2 border-foreground px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-2 h-2 bg-emerald-400 mr-2"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">FREE_TIER_ACTIVE</span>
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-100 border-4 border-red-600 text-red-600 px-6 py-4 font-bold font-mono text-sm uppercase">
            [ERROR]: {error}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8 animate-fade-in">
            <div className="relative z-10">
              <h2 className="text-3xl font-black uppercase tracking-tight text-foreground mb-2">SYSTEM_INPUT: UPLOAD_RESUME</h2>
              <p className="text-muted-foreground font-mono text-sm mb-8 uppercase">Drop your source file below for technical evaluation.</p>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-muted">
                  <AnalysisLoader />
                  <p className="mt-4 font-mono font-bold animate-pulse uppercase">PROCESSING_MODEL_DATA...</p>
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
                      className={`flex flex-col items-center justify-center w-full h-56 border-4 border-dashed cursor-pointer transition-all ${file ? 'border-foreground bg-foreground/5' : 'border-muted hover:border-foreground hover:bg-muted/30'}`}
                    >
                      {file ? (
                        <div className="flex flex-col items-center space-y-4 text-foreground">
                          <div className="w-20 h-20 border-4 border-foreground flex items-center justify-center bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <span className="font-black text-xl uppercase tracking-tighter">{file.name}</span>
                          <span className="text-[10px] font-mono font-bold bg-foreground text-white px-3 py-1 uppercase tracking-widest">FILE_LOADED_OK</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-20 h-20 border-4 border-muted flex items-center justify-center mb-6 group-hover:border-foreground group-hover:bg-foreground/5 transition-all">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                          <span className="text-foreground font-black text-2xl uppercase tracking-tighter">SELECT_SOURCE_PDF</span>
                          <span className="text-muted-foreground font-mono text-[10px] mt-2 uppercase tracking-widest">DRAG_DROP_OR_CLICK</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black text-foreground uppercase tracking-widest opacity-70 font-mono">TARGET_JD (OPTIONAL)</label>
                    <textarea
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      className="w-full px-6 py-5 border-4 border-foreground bg-white focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all outline-none resize-none h-48 font-mono text-sm leading-relaxed"
                      placeholder="PASTE_JOB_DESCRIPTION_CONTEXT_HERE..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !file}
                      className="w-full py-6 bg-foreground text-background border-4 border-foreground font-black text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-4"
                    >
                      <span>EXECUTE_ANALYSIS</span>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYSIS */}
        {activeTab === "analysis" && (
          <div className="h-[calc(100vh-160px)] flex flex-col md:flex-row gap-8 overflow-hidden animate-fade-in">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 border-4 border-dashed border-muted text-muted-foreground uppercase font-mono">
                <p className="text-xl font-black">NO_DATA_AVAILABLE</p>
                <button onClick={() => setActiveTab("dashboard")} className="text-foreground font-black mt-4 hover:underline">REVERT_TO_INPUT</button>
              </div>
            ) : (
              <>
                <div className="flex-1 h-full overflow-y-auto pr-4 custom-scrollbar space-y-8">
                    {/* SCORE OVERVIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground border-b-4 border-foreground pb-2 mb-6">ATS_COMPATIBILITY_INDEX</h2>
                        <div className="flex items-center justify-between">
                          <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle cx="64" cy="64" r="56" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                              <circle cx="64" cy="64" r="56" stroke="black" strokeWidth="12" fill="none" strokeDasharray={351} strokeDashoffset={351 - (351 * result.ats_score) / 100} className="transition-all duration-[1s]" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-foreground tracking-tighter">{Math.round(result.ats_score)}</div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">RANK_STATUS</div>
                            <div className="text-2xl font-black text-foreground">TOP_{100 - Math.round(result.ats_score / 1.1)}%</div>
                            <div className="text-[9px] mt-2 bg-emerald-100 text-emerald-700 px-2 py-1 font-bold inline-block">SYSTEM_VERIFIED</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <ResumeRadarChart data={result.score_details?.radar_data} />
                      </div>
                    </div>

                    {/* ALIGNMENT */}
                    <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="text-lg font-black uppercase mb-6 flex items-center font-mono">
                        [01]_ROLE_ALIGNMENT_VECTORS
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {result.score_details?.role_alignment && Object.entries(result.score_details.role_alignment).map(([role, score]) => (
                          <div key={role} className="p-4 border-2 border-foreground bg-muted/20">
                            <div className="text-[10px] font-black uppercase mb-2 font-mono">{role}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-black text-foreground">{score}%</div>
                              <div className="w-16 bg-muted h-2 border border-foreground">
                                <div className="bg-foreground h-full" style={{ width: `${score}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  {/* IMPROVEMENT PLAN */}
                  <div className="bg-foreground text-background p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-2xl font-black uppercase mb-8 flex items-center tracking-tighter">
                      CRITICAL_REFACTOR_LIST
                    </h3>

                    <div className="space-y-4">
                      {result.suggestions && result.suggestions.length > 0 ? (
                        result.suggestions.map((s, i) => (
                          <div key={i} className="bg-background text-foreground p-6 border-2 border-foreground flex items-start space-x-6">
                            <span className="flex-shrink-0 w-10 h-10 border-2 border-foreground flex items-center justify-center font-black text-xl">0{i + 1}</span>
                            <div className="flex-1">
                                <div className="text-sm font-bold leading-relaxed font-mono uppercase">
                                  {s}
                                </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 border-2 border-background text-center font-black text-xl uppercase">
                          ZERO_CRITICAL_ERRORS_DETECTED
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PDF PREVIEW */}
                <div className="hidden lg:block w-5/12 h-full border-4 border-foreground bg-muted p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-4 px-2 font-mono">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">[PREVIEW_BUFFER]</span>
                    <span className="text-[10px] font-black uppercase">v2.0_SECURE</span>
                  </div>
                  <div className="w-full h-[calc(100%-40px)] bg-white border-2 border-foreground relative group">
                    {file ? (
                      <iframe
                        src={`${URL.createObjectURL(file)}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full grayscale hover:grayscale-0 transition-all"
                        title="Resume Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-xs uppercase animate-pulse">
                        WAITING_FOR_DATA_PACKETS...
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-8 animate-fade-in">
            {historyLoading && <div className="text-center p-8 font-mono font-black uppercase animate-pulse">LOADING_HISTORY_BUFFER...</div>}
            
            {!historyLoading && history.length > 0 && (
              <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <ScoreGraph data={history} />
              </div>
            )}

            <div className="space-y-6">
              {history.length === 0 && !historyLoading && (
                <div className="bg-white p-12 border-4 border-foreground border-dashed text-center">
                  <p className="text-muted-foreground text-xl font-black uppercase tracking-widest font-mono">HISTORY_LOG_EMPTY</p>
                </div>
              )}

              {history.map((item, index) => (
                <div key={item.id} className="bg-white border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center font-black text-2xl uppercase font-mono">
                            V{history.length - index}
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-muted-foreground font-mono uppercase mb-1">TIMESTAMP: {new Date(item.created_at).toISOString()}</div>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-4xl font-black text-foreground tracking-tighter">{Math.round(item.ats_score)}</span>
                              <span className="text-sm font-black text-muted-foreground">/100</span>
                              <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 ${item.ats_score >= 70 ? 'border-emerald-600 text-emerald-600' : 'border-amber-600 text-amber-600'}`}>
                                {item.ats_score >= 70 ? 'STATUS_OPTIMAL' : 'STATUS_NEEDS_REFACTOR'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {item.pdf_url && (
                      <div className="md:w-64 h-40 border-4 border-foreground bg-muted group relative cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 font-mono text-[9px] font-black uppercase">PREVIEW_THUMBNAIL</div>
                        <iframe src={item.pdf_url} className="w-full h-full pointer-events-none grayscale" title={`Preview ${index}`} />
                        <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-foreground/90 flex items-center justify-center text-background font-black uppercase text-xs transition-all">OPEN_FULL_DOC</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOLS */}
        {activeTab === "tools" && (
          <div className="h-[calc(100vh-160px)] overflow-y-auto pb-12 custom-scrollbar pr-4 animate-fade-in">
            {!result && (
              <div className="mb-8 p-6 bg-foreground text-background border-4 border-foreground flex items-center space-x-6">
                <div className="w-12 h-12 border-2 border-background flex items-center justify-center font-black text-2xl">!</div>
                <div className="font-mono">
                  <h4 className="font-black uppercase">CONTEXT_REQUIRED</h4>
                  <p className="text-xs opacity-70 uppercase">Please analyze a resume to unlock tailored career tools.</p>
                </div>
                <button onClick={() => setActiveTab('dashboard')} className="ml-auto px-6 py-3 bg-background text-foreground font-black uppercase text-sm border-2 border-background hover:bg-transparent hover:text-background transition-all">SYSTEM_INIT</button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ToolCard 
                title="AI_COVER_LETTER"
                desc="GENERATE_PROFESSIONAL_DOCS"
                color="bg-white"
                endpoint="/generate-cover-letter"
                id="cl"
              />
              <ToolCard 
                title="INTERVIEW_PREP"
                desc="SYSTEM_PREP_VECTORS"
                color="bg-white"
                endpoint="/generate-interview-prep"
                id="int"
              />
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white border-4 border-foreground p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col items-center mb-10 border-b-4 border-foreground pb-10">
                <div className="w-24 h-24 border-4 border-foreground bg-muted mb-6 flex items-center justify-center text-4xl font-black text-foreground">
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">{user.username || "USER_UNKNOWN"}</h2>
                <span className="font-mono text-[10px] font-black uppercase bg-foreground text-background px-4 py-1 mt-4 tracking-widest">TIER: SYSTEM_ADMIN</span>
              </div>

              <div className="space-y-6 font-mono uppercase text-xs">
                <div>
                  <label className="block font-black mb-2 ml-1 opacity-50">REGISTRY_NAME</label>
                  <input type="text" className="w-full px-5 py-4 border-4 border-foreground bg-muted/20 font-bold" value={user.username} readOnly />
                </div>
                <div>
                  <label className="block font-black mb-2 ml-1 opacity-50">REGISTRY_EMAIL</label>
                  <input type="text" className="w-full px-5 py-4 border-4 border-foreground bg-muted/20 font-bold" value={user.email} readOnly />
                </div>
                <div className="pt-6">
                  <button className="w-full py-5 bg-muted text-muted-foreground border-4 border-foreground font-black cursor-not-allowed uppercase">MOD_ACCESS_LOCKED</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ToolCard({ title, desc, color, endpoint, id }) {
  return (
    <div className={`${color} p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col`}>
      <div className="w-12 h-12 border-4 border-foreground flex items-center justify-center mb-6 bg-primary text-primary-foreground font-black">
        +
      </div>
      <h3 className="text-2xl font-black uppercase mb-2 tracking-tighter">{title}</h3>
      <p className="text-muted-foreground font-mono text-[10px] mb-8 uppercase tracking-widest">{desc}</p>
      
      <div className="space-y-4">
        <textarea
          id={`${id}-jd`}
          className="w-full px-5 py-4 border-4 border-foreground bg-muted/20 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none resize-none h-48 font-mono text-xs uppercase"
          placeholder="PASTE_TARGET_DATA..."
        />
        <button
          id={`${id}-btn`}
          onClick={async () => {
            const btn = document.getElementById(`${id}-btn`);
            const jdText = document.getElementById(`${id}-jd`).value;
            const output = document.getElementById(`${id}-output`);
            if (!jdText) return alert("INPUT_REQUIRED");
            
            try {
              btn.disabled = true;
              btn.innerText = "EXECUTING...";
              const { data } = await axios.post(`${API_BASE}${endpoint}`, 
                new URLSearchParams({ jd: jdText }),
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
              );
              output.innerText = id === 'cl' ? data.cover_letter : data.interview_prep;
              output.classList.remove("hidden");
            } catch (err) {
              alert("EXECUTION_FAILED");
            } finally {
              btn.disabled = false;
              btn.innerText = `RUN_${title}`;
            }
          }}
          className="w-full py-5 bg-foreground text-background border-4 border-foreground font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
        >
          RUN_{title}
        </button>
        <div id={`${id}-output`} className="hidden p-6 bg-foreground text-background font-mono text-xs whitespace-pre-wrap leading-relaxed border-2 border-foreground max-h-[400px] overflow-y-auto uppercase"></div>
      </div>
    </div>
  );
}
