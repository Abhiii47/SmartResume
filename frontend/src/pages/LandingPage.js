import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../utils";

export default function LandingPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuestAnalyze = async () => {
    if (!file) {
      setError("Please upload a PDF resume to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("jd", jd);
    fd.append("years", years || 0);

    try {
      const { data } = await axios.post(
        `${API_BASE}/guest-analyze-resume/`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResult(data);
    } catch (err) {
      if (!err.response) {
        setError("Unable to reach the analyzer service. Please try again.");
      } else {
        setError(err.response.data?.detail || "Analysis failed. Please try again.");
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
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="w-full border-b border-white/20 bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SmartResume</span>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition backdrop-blur-sm"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-5 py-2 text-sm font-semibold bg-white text-purple-600 rounded-xl hover:bg-slate-50 transition shadow-lg"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero + Guest Analyzer */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            {/* Left: Hero */}
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Turn your resume into an{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  ATS-ready
                </span>
                , interview-winning profile
              </h1>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                SmartResume analyzes your resume against job descriptions, scores it like an ATS, 
                and suggests concrete improvements so you can stand out in every application.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-3.5 bg-white text-purple-600 rounded-xl font-semibold hover:bg-slate-50 transition transform hover:scale-105 shadow-xl"
                >
                  Get started free
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3.5 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  I already have an account
                </button>
              </div>
              <p className="text-sm text-white/70">
                ✨ No credit card required • Analyze in minutes • AI-powered insights
              </p>
            </div>

            {/* Right: Guest Analyzer */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 lg:p-8 animate-fade-in">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Try it as a guest</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resume PDF *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition group">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                      <svg className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-slate-600 font-medium">
                        {file ? file.name : "Click to upload your PDF resume"}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Job description (optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
                    placeholder="Paste a job description for a more tailored score..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Years of experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm"
                    placeholder="5"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGuestAnalyze}
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
                    "Analyze resume as guest"
                  )}
                </button>

                {result && (
                  <div className="mt-6 border-t-2 border-slate-200 pt-6 space-y-4 animate-fade-in">
                    <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${getScoreColor(result.ats_score)} rounded-xl text-white shadow-lg`}>
                      <span className="text-sm font-semibold">ATS Score</span>
                      <span className="text-3xl font-bold">{Math.round(result.ats_score)}</span>
                    </div>

                    {result.gemini_success && result.gemini_suggestions && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Suggestions
                        </h4>
                        <p className="text-xs text-slate-700 line-clamp-4 whitespace-pre-line max-h-32 overflow-y-auto">
                          {result.gemini_suggestions}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 text-center">
                      Want to save analyses?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/signup")}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Create a free account
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
