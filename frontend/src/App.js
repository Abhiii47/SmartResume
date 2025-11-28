
import React, {useMemo, useState} from "react";
import axios from "axios";

const API_BASE = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parsedScore = useMemo(() => {
    if (!result) return null;
    const {ats_score} = result;
    if (typeof ats_score === "number") return ats_score;
    if (typeof ats_score === "object" && ats_score !== null) {
      if (typeof ats_score.score === "number") return ats_score.score;
      if (typeof ats_score.probability === "number") return Math.round(ats_score.probability * 100);
    }
    return null;
  }, [result]);

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
      const {data} = await axios.post(`${API_BASE}/analyze-resume/`, fd, {
        headers: {"Content-Type": "multipart/form-data"}
      });
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 5));
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Unable to process resume.");
    } finally {
      setLoading(false);
    }
  };

  const ResultSummary = () => {
    if (!result) return null;
    const {ats_score, resume_preview, jd_used} = result;
    const meta = typeof ats_score === "object" ? ats_score.meta : null;

    return (
      <div style={styles.card}>
        <div style={styles.scoreBadge}>
          {parsedScore !== null ? `${parsedScore}%` : "N/A"}
        </div>
        <div style={{flex: 1}}>
          <h3 style={{margin: "0 0 8px"}}>Match Insights</h3>
          <p style={styles.metaLine}>
            Job description {jd_used ? "supplied" : "not supplied"}.
          </p>
          {meta && (
            <p style={styles.metaLine}>
              Skill overlap: <strong>{meta.overlap}</strong> &nbsp;|&nbsp;
              Probability: <strong>{(meta.probability ?? parsedScore)?.toString()}</strong>
            </p>
          )}
        </div>
        {resume_preview && (
          <div style={{marginTop: 16}}>
            <h4 style={{margin: "0 0 6px"}}>Resume Preview</h4>
            <pre style={styles.preview}>{resume_preview}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{margin: 0}}>SmartResume</h1>
          <p style={{margin: "4px 0 0"}}>Upload a resume, optionally paste a job description, and get ATS-style feedback instantly.</p>
        </div>
        <button style={styles.secondaryButton} onClick={() => window.open("README.md", "_blank")}>
          Docs
        </button>
      </header>

      <section style={styles.card}>
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
            placeholder="Paste the JD here for a more precise comparison."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            style={{...styles.input, resize: "vertical"}}
          />
        </div>

        <div style={styles.inlineFields}>
          <div style={{flex: 1}}>
            <label style={styles.label}>Skills (comma separated)</label>
            <input
              type="text"
              placeholder="Python, NLP, Leadership"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{flex: 0.4, marginLeft: 12}}>
            <label style={styles.label}>Years</label>
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

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.primaryButton} onClick={handleSubmit} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </section>

      {result && (
        <>
          <ResultSummary />
          {history.length > 1 && (
            <section style={styles.card}>
              <h3 style={{marginTop: 0}}>Recent Analyses</h3>
              {history.map((item, idx) => {
                const scoreValue =
                  typeof item.ats_score === "number"
                    ? item.ats_score
                    : item.ats_score?.score ?? Math.round((item.ats_score?.probability || 0) * 100);
                return (
                  <div key={idx} style={styles.historyRow}>
                    <div style={styles.badgeSmall}>{scoreValue ?? "N/A"}%</div>
                    <div style={{flex: 1}}>
                      <p style={styles.metaLine}>
                        JD {item.jd_used ? "provided" : "omitted"} · Preview chars: {item.resume_preview.length}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "'Inter', Arial, sans-serif",
    color: "#1d1d1f",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
    marginBottom: 20,
  },
  fieldGroup: {marginBottom: 16},
  inlineFields: {display: "flex", marginBottom: 12},
  label: {display: "block", fontWeight: 600, marginBottom: 6},
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d2d6dc",
    fontSize: 15,
  },
  helper: {display: "block", marginTop: 6, color: "#6b7280", fontSize: 13},
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 16,
    cursor: "pointer",
    width: "100%",
  },
  secondaryButton: {
    border: "1px solid #d2d6dc",
    background: "transparent",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
  scoreBadge: {
    fontSize: 48,
    fontWeight: 700,
    color: "#111827",
    background: "#fef3c7",
    borderRadius: 16,
    padding: "20px 24px",
    marginRight: 24,
    minWidth: 140,
    textAlign: "center",
  },
  badgeSmall: {
    background: "#e0f2fe",
    color: "#075985",
    borderRadius: 8,
    padding: "6px 12px",
    fontWeight: 600,
    marginRight: 12,
  },
  preview: {
    maxHeight: 250,
    overflow: "auto",
    background: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    whiteSpace: "pre-wrap",
  },
  historyRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderTop: "1px solid #f3f4f6",
  },
  metaLine: {
    margin: 0,
    color: "#4b5563",
    fontSize: 14,
  },
  error: {
    color: "#b91c1c",
    marginBottom: 12,
  },
};
