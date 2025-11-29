import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../App";

export default function Dashboard({ user }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const response = await api.get("/api/resume-scores");
      setScores(response.data.scores || []);
    } catch (err) {
      setError("Failed to load resume scores");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading your scores...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome, {user.username}!</h1>
        <p style={styles.subtitle}>View and track your resume analysis history</p>
      </div>

      <div style={styles.card}>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{scores.length}</div>
            <div style={styles.statLabel}>Total Analyses</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>
              {scores.length > 0
                ? Math.round(scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length)
                : 0}
            </div>
            <div style={styles.statLabel}>Average Score</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>
              {scores.length > 0 ? Math.max(...scores.map((s) => s.overall_score)).toFixed(0) : 0}
            </div>
            <div style={styles.statLabel}>Best Score</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Resume Analysis History</h2>
          <Link to="/" style={styles.analyzeButton}>
            + Analyze New Resume
          </Link>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {scores.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No resume analyses yet.</p>
            <Link to="/" style={styles.analyzeButton}>
              Analyze Your First Resume
            </Link>
          </div>
        ) : (
          <div style={styles.scoresList}>
            {scores.map((score) => (
              <div key={score.id} style={styles.scoreCard}>
                <div style={styles.scoreCardHeader}>
                  <div style={styles.scoreCardLeft}>
                    <h3 style={styles.scoreFilename}>{score.filename}</h3>
                    <p style={styles.scoreDate}>{formatDate(score.created_at)}</p>
                  </div>
                  <div
                    style={{
                      ...styles.scoreBadge,
                      background: getScoreColor(score.overall_score),
                    }}
                  >
                    {Math.round(score.overall_score)}
                  </div>
                </div>

                <div style={styles.scoreBreakdown}>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Keyword Match</span>
                    <span style={styles.breakdownValue}>{Math.round(score.keyword_match || 0)}%</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Semantic Similarity</span>
                    <span style={styles.breakdownValue}>
                      {Math.round(score.semantic_similarity || 0)}%
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Skills Match</span>
                    <span style={styles.breakdownValue}>{Math.round(score.skills_match || 0)}%</span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Experience</span>
                    <span style={styles.breakdownValue}>
                      {Math.round(score.experience_match || 0)}%
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>ATS Formatting</span>
                    <span style={styles.breakdownValue}>
                      {Math.round(score.ats_formatting || 0)}%
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Sections</span>
                    <span style={styles.breakdownValue}>
                      {Math.round(score.section_completeness || 0)}%
                    </span>
                  </div>
                </div>

                {score.recommendations && score.recommendations.length > 0 && (
                  <div style={styles.recommendations}>
                    <strong>Recommendations:</strong>
                    <ul style={styles.recommendationsList}>
                      {score.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} style={styles.recommendationItem}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "'Inter', Arial, sans-serif",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#111827",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    marginBottom: "24px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },
  analyzeButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyText: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "20px",
  },
  scoresList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  scoreCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    background: "#f9fafb",
  },
  scoreCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  scoreCardLeft: {
    flex: 1,
  },
  scoreFilename: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "4px",
    color: "#111827",
  },
  scoreDate: {
    fontSize: "13px",
    color: "#6b7280",
  },
  scoreBadge: {
    borderRadius: "12px",
    padding: "12px 20px",
    color: "#fff",
    fontSize: "24px",
    fontWeight: "700",
    minWidth: "80px",
    textAlign: "center",
  },
  scoreBreakdown: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px",
    background: "#fff",
    borderRadius: "6px",
  },
  breakdownLabel: {
    fontSize: "12px",
    color: "#6b7280",
  },
  breakdownValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },
  recommendations: {
    marginTop: "16px",
    padding: "12px",
    background: "#eff6ff",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1e40af",
  },
  recommendationsList: {
    marginTop: "8px",
    paddingLeft: "20px",
  },
  recommendationItem: {
    marginBottom: "4px",
  },
};

