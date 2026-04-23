import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken, handleApiError, updateMetaTags } from "../utils";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import ScoreGraph from "../components/ScoreGraph";
import AnalysisLoader from "../components/AnalysisLoader";

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
          <span className="text-sm text-gray-500">Free Plan</span>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-6">
            <h2 className="text-xl font-bold">Upload Resume</h2>

            {/* Dashboard Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AnalysisLoader />
              </div>
            ) : (
              <>
                <div className="relative group">
                  <input
                    type="file"
                    id="file-upload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  {/* ... inputs ... */}
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-400'}`}
                  >
                    {file ? (
                      <div className="flex items-center space-x-3 text-gray-900">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-semibold">{file.name}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-gray-500 font-medium group-hover:text-gray-900 transition-colors">Click to upload PDF resume</span>
                      </>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Job Description (Optional)</label>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all outline-none resize-none h-32"
                    placeholder="Paste the job description here to improve relevant keyword matching..."
                  />
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !file}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Run Smart Analysis
                  </button>
                </div>
              </>
            )}

            <div className="text-sm text-gray-500">
              Last Score: {result ? Math.round(result.ats_score) : "--"}
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

                  {/* OVERALL SCORE HEADER */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6 sticky top-0 z-10 backdrop-blur-md bg-white/90">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${result.ats_score >= 70 ? 'bg-green-100 text-green-700' : result.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {result.ats_score >= 70 ? 'Great' : result.ats_score >= 50 ? 'Average' : 'Needs Work'}
                          </span>
                          <span className="text-sm text-gray-500">Based on industry standards</span>
                        </div>
                      </div>
                      <div className="relative">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                          <circle cx="40" cy="40" r="36" stroke={result.ats_score >= 70 ? '#10b981' : result.ats_score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="none" strokeDasharray={226} strokeDashoffset={226 - (226 * result.ats_score) / 100} className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">{Math.round(result.ats_score)}</div>
                      </div>
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

                {/* RIGHT PANEL: RESUME PREVIEW (Dark Overleaf Style) */}
                <div className="hidden md:block w-1/2 h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative group ring-1 ring-white/10">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gray-950/80 backdrop-blur flex items-center justify-between px-4 border-b border-gray-800 z-10">
                    <span className="text-xs font-mono text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      preview.pdf
                    </span>
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  {file ? (
                    <iframe
                      src={`${URL.createObjectURL(file)}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full pt-10"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">
                      [NO_FILE_LOADED]
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
                              className="w-full h-full pt-8"
                              title={`Resume Preview ${index + 1}`}
                              style={{ pointerEvents: 'none' }}
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

        {/* PROFILE */}
        {
          activeTab === "profile" && (
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
          )
        }
      </main >
    </div >
  );
}
