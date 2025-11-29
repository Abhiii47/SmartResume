import os
import joblib
import numpy as np
from functools import lru_cache

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, "models", "xgb_calibrated.joblib")
SCALER_PATH = os.path.join(HERE, "models", "feature_scaler.joblib")

def _skills_set(skills: str):
    return set(s.strip().lower() for s in str(skills).split(",") if s.strip())

def compute_features_array(resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd):
    # Simple feature extraction without ML dependencies
    resume_len = len(str(resume_text))
    jd_len = len(str(jd_text))
    
    sr = _skills_set(skills_resume)
    sj = _skills_set(skills_jd)
    overlap = len(sr & sj)
    coverage = overlap / max(len(sj), 1)
    
    years_diff = abs(float(years_resume) - float(years_jd))
    
    bullets = str(resume_text).count("\n-") + str(resume_text).count("\n•")
    headers = sum([1 for h in ["summary", "experience", "education", "skills", "projects", "achievements"] 
                   if h in str(resume_text).lower()])
    
    # Simple similarity score based on common words
    resume_words = set(str(resume_text).lower().split())
    jd_words = set(str(jd_text).lower().split())
    common_words = resume_words & jd_words
    similarity = len(common_words) / max(len(jd_words), 1)
    
    return np.array([similarity, overlap, coverage, years_diff, resume_len, jd_len, bullets, headers]).reshape(1, -1), {
        "sim": similarity,
        "overlap": overlap,
        "coverage": coverage,
        "years_diff": years_diff,
        "resume_len": resume_len,
        "jd_len": jd_len,
        "bullets": bullets,
        "headers": headers
    }

def final_score_composition(prob, meta):
    # Model probability (0..1) is the primary driver
    base = prob * 100.0

    # Keywords coverage (0..1) -> up to 15 points
    kw = meta["coverage"] * 100.0
    kw_pts = min(15.0, 0.15 * kw)

    # Formatting bonus: bullets + headers -> up to 8 points
    fmt = (meta["bullets"] * 0.7 + meta["headers"] * 1.0)
    fmt_pts = min(8.0, fmt)

    # Small penalty for large years gap (>4)
    penalty = 0.0
    if meta["years_diff"] > 4:
        penalty = min(10.0, (meta["years_diff"] - 4) * 2.0)

    final = base + kw_pts + fmt_pts - penalty
    final = max(0.0, min(100.0, final))
    return round(final, 2)

def score_resume(resume_text, jd_text, skills_resume="", skills_jd="", years_resume=0, years_jd=0):
    """
    Calculate ATS score without ML model (fallback scoring)
    If model files exist, they will be loaded and used
    """
    try:
        # Try to load ML model if it exists
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            clf = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            
            feats, meta = compute_features_array(
                resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd
            )
            feats_s = scaler.transform(feats)
            prob = clf.predict_proba(feats_s)[:, 1][0]
            score = final_score_composition(prob, meta)
            
            return {
                "probability": round(float(prob), 4),
                "score": score,
                "meta": meta
            }
    except Exception as e:
        print(f"ML model not available, using fallback scoring: {e}")
    
    # Fallback scoring without ML
    feats, meta = compute_features_array(
        resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd
    )
    
    # Calculate simple score
    base_score = meta["sim"] * 50  # Similarity contributes 50%
    coverage_score = meta["coverage"] * 30  # Coverage contributes 30%
    format_score = min(20, (meta["bullets"] * 2 + meta["headers"] * 3))  # Formatting 20%
    
    # Penalty for experience mismatch
    years_penalty = min(10, meta["years_diff"] * 2)
    
    final_score = base_score + coverage_score + format_score - years_penalty
    final_score = max(0, min(100, final_score))
    
    return {
        "probability": round(final_score / 100, 4),
        "score": round(final_score, 2),
        "meta": meta
    }