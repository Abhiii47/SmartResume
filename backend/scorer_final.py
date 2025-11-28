# scorer_final.py
import os, joblib, numpy as np
from functools import lru_cache
from sentence_transformers import SentenceTransformer, util

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, "models", "xgb_calibrated.joblib")
SCALER_PATH = os.path.join(HERE, "models", "feature_scaler.joblib")
EMB_NAME = "all-MiniLM-L6-v2"

@lru_cache(maxsize=1)
def load_all():
    clf = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    embedder = SentenceTransformer(EMB_NAME)
    return clf, scaler, embedder

def _skills_set(skills: str):
    return set(s.strip().lower() for s in str(skills).split(",") if s.strip())

def compute_features_array(resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd, embedder):
    emb_r = embedder.encode(str(resume_text), convert_to_tensor=True)
    emb_j = embedder.encode(str(jd_text), convert_to_tensor=True)
    sim = float(util.cos_sim(emb_r, emb_j).cpu().numpy().squeeze())
    sr = _skills_set(skills_resume)
    sj = _skills_set(skills_jd)
    overlap = len(sr & sj)
    coverage = overlap / max(len(sj), 1)
    years_diff = abs(float(years_resume) - float(years_jd))
    resume_len = len(str(resume_text))
    jd_len = len(str(jd_text))
    bullets = str(resume_text).count("\n-") + str(resume_text).count("\n•")
    headers = sum([1 for h in ["summary","experience","education","skills","projects","achievements"] if h in str(resume_text).lower()])
    return np.array([sim, overlap, coverage, years_diff, resume_len, jd_len, bullets, headers]).reshape(1,-1), {
        "sim": sim, "overlap": overlap, "coverage": coverage, "years_diff": years_diff,
        "resume_len": resume_len, "jd_len": jd_len, "bullets": bullets, "headers": headers
    }

def final_score_composition(prob, meta):
    # model probability (0..1) is the primary driver
    base = prob * 100.0

    # keywords coverage (0..1) -> up to 15 points
    kw = meta["coverage"] * 100.0
    kw_pts = min(15.0, 0.15 * kw)

    # formatting bonus: bullets + headers -> up to 8 points
    fmt = (meta["bullets"] * 0.7 + meta["headers"] * 1.0)
    fmt_pts = min(8.0, fmt)

    # small penalty for large years gap (>4)
    penalty = 0.0
    if meta["years_diff"] > 4:
        penalty = min(10.0, (meta["years_diff"] - 4) * 2.0)

    final = base + kw_pts + fmt_pts - penalty
    final = max(0.0, min(100.0, final))
    return round(final, 2)

def score_resume(resume_text, jd_text, skills_resume="", skills_jd="", years_resume=0, years_jd=0):
    clf, scaler, embedder = load_all()
    feats, meta = compute_features_array(resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd, embedder)
    feats_s = scaler.transform(feats)
    prob = clf.predict_proba(feats_s)[:,1][0]
    score = final_score_composition(prob, meta)
    return {"probability": round(float(prob),4), "score": score, "meta": meta}
