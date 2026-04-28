import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags, handleApiError } from "../utils";
import HeroSection from "../components/HeroSection";
import AuthModal from "../components/AuthModal";
import { useGSAPReveal, GSAPFadeIn, useSmoothScroll } from "../components/GSAPAnimations";

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
        fd
      );
      setResult(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    // Open file picker immediately (crucial for mobile Safari)
    document.getElementById('resume-upload')?.click();
    // Scroll to the analyzer section so user sees the file name update
    handleCheckScoreClick();
  };

  const handleCheckScoreClick = () => {
    const uploadSection = document.getElementById('guest-analyzer');
    if (uploadSection && typeof window !== "undefined") {
      try {
        const targetPosition = uploadSection.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } catch (e) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Initialize smooth scroll
  useSmoothScroll();

  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary selection:text-primary-foreground">
      {/* Navbar - Brutalist */}
      <header className="fixed top-0 w-full z-50 bg-background border-b-2 border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 border-2 border-primary bg-background flex items-center justify-center group-hover:bg-primary transition-colors">
              <svg className="w-6 h-6 text-primary group-hover:text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-black font-display uppercase tracking-tight text-foreground">SmartResume</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAuthModal({ isOpen: true, view: "login" })}
              className="px-5 py-2 text-sm font-mono font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest"
            >
              [ LOG_IN ]
            </button>
            <button
              onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
              className="brutalist-btn px-6 py-2 text-sm"
            >
              SYS.START
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        onUploadClick={handleUploadClick}
        onCheckScoreClick={handleCheckScoreClick}
      />

      <main className="flex-1 relative z-10 pb-20 bg-background grid-bg border-t-2 border-border">
        <div className="max-w-7xl mx-auto px-4 pt-12">
          {/* Resume Analyzer Section */}
          <div id="guest-analyzer" className="max-w-4xl mx-auto scroll-mt-32 py-10">
            <GSAPFadeIn delay={0.2}>
              <div className="brutalist-card p-8 lg:p-12 relative overflow-hidden bg-background">

                <div className="flex flex-col items-start space-y-4 mb-10 relative z-10 border-b-2 border-border pb-8">
                  <span className="index-label">SYS.ANALYZE_MODULE</span>
                  <h3 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tight">
                    Instant <span className="text-primary">Diagnostic</span>
                  </h3>
                  <p className="text-muted-foreground font-mono text-base max-w-xl">
                    &gt; Awaiting PDF input for ATS diagnostic processing.
                  </p>
                </div>

                <div className="space-y-8 relative z-10">
                  <div>
                    <label className="block text-sm font-mono font-bold text-foreground mb-3 uppercase tracking-wider">
                      [01] TARGET_FILE (PDF)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border bg-background hover:border-primary transition-colors duration-300 cursor-pointer group relative">
                      <div className="absolute top-2 left-2 w-2 h-2 bg-border group-hover:bg-primary transition-colors"></div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-border group-hover:bg-primary transition-colors"></div>
                      <div className="absolute bottom-2 left-2 w-2 h-2 bg-border group-hover:bg-primary transition-colors"></div>
                      <div className="absolute bottom-2 right-2 w-2 h-2 bg-border group-hover:bg-primary transition-colors"></div>
                      
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-base font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                          {file ? file.name : "SELECT_FILE"}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Max_Size: 10MB</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-mono font-bold text-foreground mb-3 uppercase tracking-wider">
                        [02] TARGET_JD (OPTIONAL)
                      </label>
                      <textarea
                        rows={4}
                        className="tech-input resize-none"
                        placeholder="Paste job description..."
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-mono font-bold text-foreground mb-3 uppercase tracking-wider">
                        [03] EXP_YEARS
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="tech-input h-12"
                        placeholder="e.g. 2"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 text-sm font-mono font-bold flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ERR: {error}
                    </div>
                  )}

                  <button
                    onClick={handleGuestAnalyze}
                    disabled={loading || !file}
                    className="brutalist-btn brutalist-btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>PROCESSING_DATA...</span>
                      </span>
                    ) : (
                      <>
                        <span>EXECUTE_ANALYSIS</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </>
                    )}
                  </button>

                  {result && (
                    <div className="mt-10 border-t-2 border-primary pt-8 animate-fade-in">
                      <div className="flex flex-col md:flex-row items-stretch gap-6">
                        <div className="relative w-32 flex flex-col items-center justify-center bg-background border-2 border-primary p-4 shrink-0">
                          <span className="index-label absolute top-2 left-2">SCORE</span>
                          <div className="text-5xl font-black text-primary mt-4">{Math.round(result.ats_score)}</div>
                        </div>

                        <div className="flex-1 brutalist-card p-6 flex flex-col justify-center">
                          <h4 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">Diagnostic Complete</h4>
                          <p className="text-muted-foreground font-mono text-sm mb-6">&gt; Full report generated. Unlock keyword gaps and formatting telemetry.</p>

                          <button
                            type="button"
                            onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
                            className="brutalist-btn self-start px-6 py-3 text-sm inline-flex items-center gap-2"
                          >
                            <span>[ VIEW_FULL_REPORT ]</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GSAPFadeIn>
          </div>

          {/* How It Works Section */}
          <div className="max-w-7xl mx-auto px-4 py-24 border-t-2 border-border">
            <GSAPFadeIn>
              <div className="flex flex-col items-center text-center mb-16">
                <span className="index-label mb-4">PROTOCOL.EXECUTION_FLOW</span>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">
                  How <span className="text-primary">System</span> Works
                </h2>
                <div className="w-24 h-1.5 bg-primary"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connecting Lines (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
                
                <div className="brutalist-card p-8 bg-background relative z-10 text-center">
                  <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary">01</div>
                  <h3 className="text-xl font-black uppercase mb-4">UPLOAD_PDF</h3>
                  <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                    Upload your current resume. Our parser extracts technical metadata with high precision.
                  </p>
                </div>

                <div className="brutalist-card p-8 bg-background relative z-10 text-center">
                  <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary">02</div>
                  <h3 className="text-xl font-black uppercase mb-4">RUN_DIAGNOSTIC</h3>
                  <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                    System layers analyze keyword density, formatting patterns, and role alignment.
                  </p>
                </div>

                <div className="brutalist-card p-8 bg-background relative z-10 text-center">
                  <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary">03</div>
                  <h3 className="text-xl font-black uppercase mb-4">DEPLOY_OPTIMIZED</h3>
                  <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                    Get detailed telemetry and suggestions to bypass ATS filters and land the interview.
                  </p>
                </div>
              </div>
            </GSAPFadeIn>
          </div>

          {/* Features Grid Section */}
          <div className="bg-secondary/30 py-24 border-y-2 border-border grid-bg">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <GSAPFadeIn delay={0.2}>
                  <div className="space-y-8">
                    <div>
                      <span className="index-label">SYS.CAPABILITIES</span>
                      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mt-4 mb-8">
                        Technical <span className="text-primary">Diagnostic</span> Layers
                      </h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 border-2 border-primary shrink-0 flex items-center justify-center text-primary font-bold">A</div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tight">Keyword Saturation Analysis</h4>
                          <p className="text-muted-foreground font-mono text-sm mt-1">Cross-references your resume against thousands of job descriptions in our database to ensure optimal keyword density.</p>
                        </div>
                      </div>

                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 border-2 border-primary shrink-0 flex items-center justify-center text-primary font-bold">B</div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tight">Formatting Telemetry</h4>
                          <p className="text-muted-foreground font-mono text-sm mt-1">Identifies hidden formatting errors that make resumes unreadable by ATS systems like Workday or Greenhouse.</p>
                        </div>
                      </div>

                      <div className="flex gap-6 items-start">
                        <div className="w-12 h-12 border-2 border-primary shrink-0 flex items-center justify-center text-primary font-bold">C</div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tight">Role-Specific Alignment</h4>
                          <p className="text-muted-foreground font-mono text-sm mt-1">Determines if your resume is targeted for SDE, Data Analyst, or PM roles with weighted scoring.</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
                      className="brutalist-btn brutalist-btn-primary px-8 py-4 text-sm mt-4"
                    >
                      GET_FULL_ACCESS_NOW
                    </button>
                  </div>
                </GSAPFadeIn>

                <GSAPFadeIn delay={0.4}>
                  <div className="brutalist-card p-4 bg-background relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="border-2 border-border p-8 bg-card relative">
                      <div className="flex justify-between items-start mb-12">
                        <div>
                          <span className="index-label">SYS.STATUS_DASHBOARD</span>
                          <h4 className="text-xl font-black uppercase mt-2">Internal Metrics</h4>
                        </div>
                        <div className="w-10 h-10 border-2 border-primary flex items-center justify-center text-primary font-bold text-xs">V2</div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="h-4 w-full bg-muted border border-border relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '85%' }}></div>
                        </div>
                        <div className="h-4 w-[70%] bg-muted border border-border relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '60%' }}></div>
                        </div>
                        <div className="h-4 w-[90%] bg-muted border border-border relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '75%' }}></div>
                        </div>
                      </div>

                      <div className="mt-12 grid grid-cols-2 gap-4">
                        <div className="border-2 border-border p-4">
                          <span className="text-xs font-mono text-muted-foreground block mb-1">SCORE</span>
                          <span className="text-2xl font-black text-primary">85/100</span>
                        </div>
                        <div className="border-2 border-border p-4">
                          <span className="text-xs font-mono text-muted-foreground block mb-1">MATCH</span>
                          <span className="text-2xl font-black text-foreground">92%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GSAPFadeIn>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t-2 border-border pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-10 h-10 border-2 border-primary bg-background flex items-center justify-center group-hover:bg-primary transition-colors">
                  <svg className="w-6 h-6 text-primary group-hover:text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-black uppercase tracking-tight text-foreground">SmartResume</span>
              </div>
              <p className="text-muted-foreground font-mono text-sm max-w-sm">
                Engineering-grade resume diagnostics designed to bypass ATS filters and secure interviews for top-tier roles.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest">[ PLATFORM ]</h4>
              <ul className="space-y-4 font-mono text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; ATS_CHECKER</li>
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; COVER_LETTER</li>
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; INTERVIEW_PREP</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest">[ SYSTEM ]</h4>
              <ul className="space-y-4 font-mono text-sm text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; API_DOCS</li>
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; CHANGELOG</li>
                <li className="hover:text-primary cursor-pointer transition-colors">&gt; SECURITY</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              © 2026 SMARTRESUME_CORP | ALL_RIGHTS_RESERVED
            </span>
            <div className="flex gap-8">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hover:text-primary cursor-pointer">PRIVACY_POLICY</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest hover:text-primary cursor-pointer">TERMS_OF_SERVICE</span>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialView={authModal.view}
      />
    </div>
  );
}



