import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../App";

export default function GuestAnalyzer() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a PDF resume before analyzing.");
      return;
    }

    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("jd", jd);
    fd.append("skills", skills);
    fd.append("years", years || 0);

    try {
      const { data } = await api.post("/analyze-resume/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Unable to process resume.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#3b82f6"; // blue
    if (score >= 40) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Smart Resume Analyzer</h1>
        <p style={styles.heroSubtitle}>
          Get instant ATS scores and improve your resume. No signup required!
        </p>
        <p style={styles.heroNote}>
          <Link to="/signup" style={styles.link}>
            Sign up
          </Link>{" "}
          to save your scores and track your progress over time.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Analyze Your Resume</h2>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Resume PDF *</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={styles.input}
          />
          {file && <span style={styles.helper}>{file.name}</span>}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Job Description (optional)</label>
          <textarea
            rows={5}
            placeholder="Paste the job description here for a more precise comparison..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            style={{ ...styles.input, resize: "vertical" }}
          />
        </div>

        <div style={styles.inlineFields}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Skills (comma separated)</label>
            <input
              type="text"
              placeholder="Python, NLP, Leadership"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 0.4, marginLeft: 12 }}>
            <label style={styles.label}>Years Experience</label>
            <input
              type="number"
              min="0"
              placeholder="5"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.primaryButton} onClick={handleSubmit} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>

      {result && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Analysis Results</h2>

          <div style={styles.scoreSection}>
            <div
              style={{
                ...styles.scoreBadge,
                background: getScoreColor(result.analysis.overall_score),
              }}
            >
              <div style={styles.scoreValue}>{Math.round(result.analysis.overall_score)}</div>
              <div style={styles.scoreLabel}>
                {result.analysis.ai_analysis && result.analysis.ai_analysis.enabled
                  ? "Combined Score"
                  : "ATS Score"}
              </div>
            </div>

            <div style={styles.matchLevel}>
              <div>
                <strong>Match Level:</strong> {result.analysis.match_level}
              </div>
              {result.analysis.ml_score && result.analysis.ml_score !== result.analysis.overall_score && (
                <div style={styles.scoreInfo}>
                  ML Score: {Math.round(result.analysis.ml_score)} | 
                  {result.analysis.ai_analysis && result.analysis.ai_analysis.gemini_score && (
                    <> AI Score: {Math.round(result.analysis.ai_analysis.gemini_score)}</>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={styles.breakdown}>
            <h3 style={styles.breakdownTitle}>Score Breakdown</h3>
            <div style={styles.breakdownGrid}>
              {Object.entries(result.analysis.score_breakdown || {}).map(([key, value]) => (
                <div key={key} style={styles.breakdownItem}>
                  <div style={styles.breakdownLabel}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                  <div style={styles.breakdownValue}>{Math.round(value)}%</div>
                </div>
              ))}
            </div>
          </div>

          {result.analysis.ai_analysis && result.analysis.ai_analysis.enabled && (
            <div style={styles.aiSection}>
              <h3 style={styles.aiTitle}>
                🤖 AI-Powered Analysis {result.analysis.ai_analysis.gemini_score && (
                  <span style={styles.aiScore}>
                    (AI Score: {Math.round(result.analysis.ai_analysis.gemini_score)})
                  </span>
                )}
              </h3>
              
              {result.analysis.ai_analysis.detailed_feedback && (
                <div style={styles.detailedFeedback}>
                  <p>{result.analysis.ai_analysis.detailed_feedback}</p>
                </div>
              )}

              {result.analysis.ai_analysis.strengths && result.analysis.ai_analysis.strengths.length > 0 && (
                <div style={styles.strengths}>
                  <h4 style={styles.subsectionTitle}>✅ Strengths</h4>
                  <ul style={styles.strengthsList}>
                    {result.analysis.ai_analysis.strengths.map((strength, idx) => (
                      <li key={idx} style={styles.strengthItem}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.ai_analysis.weaknesses && result.analysis.ai_analysis.weaknesses.length > 0 && (
                <div style={styles.weaknesses}>
                  <h4 style={styles.subsectionTitle}>⚠️ Areas for Improvement</h4>
                  <ul style={styles.weaknessesList}>
                    {result.analysis.ai_analysis.weaknesses.map((weakness, idx) => (
                      <li key={idx} style={styles.weaknessItem}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.ai_analysis.improvement_areas && result.analysis.ai_analysis.improvement_areas.length > 0 && (
                <div style={styles.improvementAreas}>
                  <h4 style={styles.subsectionTitle}>🎯 Priority Improvements</h4>
                  <div style={styles.improvementGrid}>
                    {result.analysis.ai_analysis.improvement_areas.map((area, idx) => (
                      <div key={idx} style={styles.improvementCard}>
                        <div style={styles.improvementHeader}>
                          <strong>{area.area}</strong>
                          <span style={{
                            ...styles.priorityBadge,
                            background: area.priority === 'high' ? '#fee2e2' : area.priority === 'medium' ? '#fef3c7' : '#d1fae5',
                            color: area.priority === 'high' ? '#991b1b' : area.priority === 'medium' ? '#92400e' : '#065f46'
                          }}>
                            {area.priority}
                          </span>
                        </div>
                        <p style={styles.improvementText}>{area.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
            <div style={styles.recommendations}>
              <h3 style={styles.recommendationsTitle}>
                {result.analysis.ai_analysis && result.analysis.ai_analysis.enabled 
                  ? "All Recommendations" 
                  : "Recommendations"}
              </h3>
              <ul style={styles.recommendationsList}>
                {result.analysis.recommendations.map((rec, idx) => (
                  <li key={idx} style={styles.recommendationItem}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.analysis.missing_keywords && result.analysis.missing_keywords.length > 0 && (
            <div style={styles.missingKeywords}>
              <h3 style={styles.missingKeywordsTitle}>Missing Keywords</h3>
              <div style={styles.keywordsList}>
                {result.analysis.missing_keywords.slice(0, 10).map((kw, idx) => (
                  <span key={idx} style={styles.keyword}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!localStorage.getItem("token") && (
            <div style={styles.savePrompt}>
              <p>
                <Link to="/signup" style={styles.link}>
                  Sign up
                </Link>{" "}
                to save this analysis and track your resume improvements over time!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "'Inter', Arial, sans-serif",
  },
  hero: {
    textAlign: "center",
    marginBottom: "40px",
  },
  heroTitle: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#111827",
  },
  heroSubtitle: {
    fontSize: "18px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  heroNote: {
    fontSize: "14px",
    color: "#9ca3af",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
  card: {
    background: "#fff",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#111827",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  inlineFields: {
    display: "flex",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  helper: {
    display: "block",
    marginTop: "6px",
    color: "#6b7280",
    fontSize: "13px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px 24px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
  },
  scoreSection: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e5e7eb",
  },
  scoreBadge: {
    borderRadius: "16px",
    padding: "32px 40px",
    textAlign: "center",
    minWidth: "160px",
  },
  scoreValue: {
    fontSize: "56px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1",
  },
  scoreLabel: {
    fontSize: "16px",
    color: "#fff",
    marginTop: "8px",
    opacity: 0.9,
  },
  matchLevel: {
    fontSize: "18px",
    color: "#374151",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  scoreInfo: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  breakdown: {
    marginBottom: "32px",
  },
  breakdownTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#111827",
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  breakdownItem: {
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  breakdownLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "4px",
  },
  breakdownValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },
  recommendations: {
    marginBottom: "32px",
  },
  recommendationsTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#111827",
  },
  recommendationsList: {
    listStyle: "none",
    padding: 0,
  },
  recommendationItem: {
    padding: "12px",
    background: "#f0f9ff",
    borderRadius: "8px",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#1e40af",
  },
  missingKeywords: {
    marginBottom: "32px",
  },
  missingKeywordsTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#111827",
  },
  keywordsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  keyword: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
  },
  savePrompt: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    padding: "16px",
    borderRadius: "8px",
    textAlign: "center",
    color: "#1e40af",
    fontSize: "14px",
  },
  aiSection: {
    marginBottom: "32px",
    padding: "24px",
    background: "#f0f9ff",
    borderRadius: "12px",
    border: "1px solid #bae6fd",
  },
  aiTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#0c4a6e",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  aiScore: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#0369a1",
  },
  detailedFeedback: {
    background: "#fff",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "20px",
    lineHeight: "1.6",
    color: "#1e293b",
    fontSize: "14px",
  },
  subsectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#0c4a6e",
  },
  strengths: {
    marginBottom: "20px",
  },
  strengthsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  strengthItem: {
    padding: "8px 12px",
    background: "#d1fae5",
    borderRadius: "6px",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#065f46",
  },
  weaknesses: {
    marginBottom: "20px",
  },
  weaknessesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  weaknessItem: {
    padding: "8px 12px",
    background: "#fee2e2",
    borderRadius: "6px",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#991b1b",
  },
  improvementAreas: {
    marginBottom: "20px",
  },
  improvementGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  improvementCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  improvementHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  priorityBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  improvementText: {
    fontSize: "13px",
    color: "#4b5563",
    lineHeight: "1.5",
    margin: 0,
  },
};

