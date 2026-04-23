import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags } from "../utils";
import { Reveal } from "../components/animations/Reveal";
import HeroSection from "../components/HeroSection";
import AuthModal from "../components/AuthModal";
import { useGSAPReveal, GSAPFadeIn, GSAPStagger, useSmoothScroll } from "../components/GSAPAnimations";

export default function LandingPage() {
  const navigate = useNavigate();

  // Update SEO meta tags on mount
  useEffect(() => {
    updateMetaTags({
      title: "SmartResume - Build Job-Ready Resumes with AI-Powered ATS Scoring",
      description: "Trusted by students for placements & internships. Get AI-powered resume review aligned with ATS & recruiters. Check your ATS score, get keyword match analysis, skills gap feedback, and role alignment insights.",
      url: window.location.href
    });
  }, []);

  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "login" });

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
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-violet-600";
    if (score >= 40) return "bg-indigo-700";
    return "bg-slate-800";
  };

  const handleUploadClick = () => {
    document.getElementById('resume-upload')?.click();
  };

  const handleCheckScoreClick = () => {
    const uploadSection = document.getElementById('guest-analyzer');
    if (uploadSection && typeof window !== "undefined") {
      // Use native smooth scroll as fallback, or GSAP if available
      try {
        const { gsap } = require("gsap");
        const targetPosition = uploadSection.getBoundingClientRect().top + window.pageYOffset - 80;
        // Use native scrollTo with smooth behavior as GSAP scrollTo requires premium plugin
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } catch (e) {
        // Fallback to native smooth scroll
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Initialize smooth scroll
  useSmoothScroll();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white relative">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-display font-semibold text-gray-900">SmartResume</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAuthModal({ isOpen: true, view: "login" })}
              className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
              className="px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        onUploadClick={handleUploadClick}
        onCheckScoreClick={handleCheckScoreClick}
      />

      <main className="flex-1 relative z-10 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {/* Resume Analyzer Section */}
          <div id="guest-analyzer" className="max-w-4xl mx-auto scroll-mt-24 py-20">
            <GSAPFadeIn delay={0.2}>
              <div className="bg-card rounded-xl p-8 lg:p-12 border border-border shadow-lg relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-bl-full -mr-16 -mt-16 z-0 opacity-50"></div>

                <div className="flex flex-col items-center text-center space-y-4 mb-10 relative z-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2 animate-float">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-bold text-foreground font-display">
                    Try it now, completely <span className="text-primary underline decoration-primary/30 underline-offset-4">free</span>
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-xl">Upload your PDF resume below to get an instant AI-powered analysis</p>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 ml-1">
                      Upload Resume (PDF)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 group">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 bg-background rounded-full shadow-sm border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-lg text-foreground font-medium group-hover:text-primary transition-colors">
                          {file ? file.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">PDF up to 10MB</p>
                      </div>
                      <input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 ml-1">
                        Job Description (Optional)
                      </label>
                      <textarea
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Paste job description..."
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 ml-1">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="e.g. 2"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium flex items-center animate-fade-in">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGuestAnalyze}
                    disabled={loading || !file}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Analyzing Resume...</span>
                      </span>
                    ) : (
                      <>
                        <span>Analyze My Resume</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </>
                    )}
                  </button>

                  {result && (
                    <div className="mt-8 border-t border-border pt-8 animate-fade-in">
                      <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-muted/30 rounded-xl border border-border">
                        <div className={`relative w-32 h-32 flex items-center justify-center rounded-full text-white shadow-xl ${getScoreColor(result.ats_score)}`}>
                          <div className="text-4xl font-bold">{Math.round(result.ats_score)}</div>
                          <div className="absolute -bottom-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Score</div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <h4 className="text-2xl font-bold text-foreground mb-2">Analysis Complete</h4>
                          <p className="text-muted-foreground mb-6 max-w-sm">We've generated a detailed report including keyword gaps and formatting issues.</p>

                          <button
                            type="button"
                            onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
                            className="px-8 py-3 bg-card text-foreground border border-input rounded-xl font-bold hover:bg-accent hover:text-accent-foreground transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
                          >
                            <span>Unlock Full Report</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GSAPFadeIn>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialView={authModal.view}
      />
    </div>
  );
}


