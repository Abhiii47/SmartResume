import React, { useState } from "react";
import axios from "axios";
import { API_BASE, getAuthToken, removeAuthToken } from "../utils";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    navigate("/login");
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a PDF resume");
      return;
    }

    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("jd", jd);
    fd.append("years", years || 0);

    try {
      const { data } = await axios.post(`${API_BASE}/analyze-resume/`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 401) {
        removeAuthToken();
        navigate("/login");
      } else {
        setError(err?.response?.data?.detail || "Analysis failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-cyan-600";
    if (score >= 40) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmartResume
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:p-8 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Upload Resume</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Resume PDF *</label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition group">
                  <div className="flex flex-col items-center justify-center pt-6 pb-6">
                    <svg className="w-10 h-10 mb-3 text-slate-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">
                      {file ? file.name : "Click to upload PDF"}
                    </p>
                    {!file && <p className="text-xs text-slate-400 mt-1">PDF files only</p>}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div>
                <label htmlFor="jd" className="block text-sm font-semibold text-slate-700 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  id="jd"
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                  placeholder="Paste job description for better matching..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="years" className="block text-sm font-semibold text-slate-700 mb-2">
                  Years of Experience
                </label>
                <input
                  id="years"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 animate-fade-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Resume"
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Analysis Results</h2>

              <div className="space-y-6">
                {/* Score Display */}
                <div className="flex items-center justify-center py-6">
                  <div className={`relative w-40 h-40 rounded-full bg-gradient-to-r ${getScoreColor(result.ats_score)} flex items-center justify-center shadow-2xl transform hover:scale-105 transition`}>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white">
                        {Math.round(result.ats_score)}
                      </div>
                      <div className="text-sm text-white/90 font-semibold">ATS Score</div>
                    </div>
                  </div>
                </div>

                {/* Gemini Suggestions */}
                {result.gemini_success && result.gemini_suggestions ? (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5">
                    <h4 className="font-bold mb-3 flex items-center text-blue-900">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI-Powered Suggestions
                    </h4>
                    <div className="bg-white/80 p-4 rounded-lg text-sm whitespace-pre-line max-h-64 overflow-y-auto text-slate-700">
                      {result.gemini_suggestions}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <h4 className="font-semibold mb-2 flex items-center text-amber-800">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      AI Suggestions Unavailable
                    </h4>
                    <p className="text-xs text-amber-700">
                      AI suggestions are temporarily unavailable. Your ATS score and other analysis features are still working correctly.
                    </p>
                  </div>
                )}

                {/* Improvement Points */}
                {result.improvement_points && result.improvement_points.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                    <h4 className="font-bold mb-3 flex items-center text-green-900">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Quick Improvements
                    </h4>
                    <ul className="space-y-2">
                      {result.improvement_points.map((point, idx) => (
                        <li key={idx} className="flex items-start bg-white/60 rounded-lg p-3">
                          <span className="text-green-600 mr-2 font-bold">•</span>
                          <span className="text-sm text-slate-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resume Preview */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
                  <h4 className="font-semibold mb-3 text-slate-900">Resume Preview</h4>
                  <pre className="bg-white p-4 rounded-lg text-xs overflow-auto max-h-40 border border-slate-200 text-slate-600">
                    {result.resume_preview}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
