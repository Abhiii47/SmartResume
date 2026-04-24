import os
import joblib
import json
import numpy as np
from functools import lru_cache
from config import settings

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, "models", "xgb_calibrated.joblib")
SCALER_PATH = os.path.join(HERE, "models", "feature_scaler.joblib")

# Global model cache
_cached_clf = None
_cached_scaler = None

def load_model():
    """Load model artifacts into memory on startup"""
    global _cached_clf, _cached_scaler
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            _cached_clf = joblib.load(MODEL_PATH)
            _cached_scaler = joblib.load(SCALER_PATH)
            print(f"SUCCESS: ML Model loaded successfully from {MODEL_PATH}")
            return True
        else:
            print(f"WARNING: ML Model files not found at {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"ERROR: Failed to load ML model: {e}")
        return False

def _skills_set(skills: str):
    return set(s.strip().lower() for s in str(skills).split(",") if s.strip())

def compute_features_array(resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd):
    """
    Advanced feature engineering to match the 24-feature model.
    """
    import re
    features = []
    
    res_text = str(resume_text)
    jd_text_str = str(jd_text)
    res_lower = res_text.lower()
    jd_lower = jd_text_str.lower()
    
    # 1. Semantic Similarity (Lightweight fallback for production)
    res_words = set(res_lower.split())
    jd_words = set(jd_lower.split())
    common_words = res_words & jd_words
    similarity = len(common_words) / max(len(jd_words), 1)
    features.append(similarity) # 1
    
    # 2. Keyword Overlap
    features.append(similarity) # 2 (Re-using similarity as a proxy for keyword_overlap)
    
    # 3-5. Skills Features
    sr = set(s.strip().lower() for s in str(skills_resume).split(",") if s.strip())
    sj = set(s.strip().lower() for s in str(skills_jd).split(",") if s.strip())
    skills_match = len(sr & sj) / max(len(sj), 1) if sj else 0.5
    features.append(skills_match) # 3
    features.append(float(len(sr & sj))) # 4
    features.append(float(len(sr))) # 5
    
    # 6-7. Experience Features
    y_res = float(years_resume)
    y_jd = float(years_jd)
    exp_match = min(y_res / y_jd, 2.0) if y_jd > 0 else 1.0
    features.append(exp_match) # 6
    features.append(abs(y_res - y_jd)) # 7
    
    # 8-10. Resume Length Features
    features.append(float(len(res_text))) # 8
    features.append(float(len(res_text.split()))) # 9
    features.append(float(len(res_text.split('\n')))) # 10
    
    # 11-12. JD Length Features
    features.append(float(len(jd_text_str))) # 11
    features.append(float(len(jd_text_str.split()))) # 12
    
    # 13-14. Formatting
    bullets = res_text.count('•') + res_text.count('-') + res_text.count('*')
    features.append(float(bullets)) # 13
    features.append(float(res_text.count('\n\n'))) # 14
    
    # 15-19. Section Detection
    sections = ['experience', 'education', 'skills', 'summary', 'projects']
    for section in sections:
        features.append(1.0 if section in res_lower else 0.0) # 15, 16, 17, 18, 19
        
    # 20-21. Contact Info
    has_email = 1.0 if "@" in res_text else 0.0
    has_phone = 1.0 if any(c.isdigit() for c in res_text) and len(res_text) > 10 else 0.0
    features.append(has_email) # 20
    features.append(has_phone) # 21
    
    # 22. Avg Word Length
    words = res_text.split()
    avg_len = np.mean([len(w) for w in words]) if words else 0.0
    features.append(avg_len) # 22
    
    # 23. JD Keyword Density
    important = ['required', 'must', 'experience', 'skills', 'qualifications']
    density = sum(jd_lower.count(w) for w in important) / max(len(jd_lower.split()), 1)
    features.append(density) # 23
    
    # 24. Scaler Filler (Added to match the 24-feature expectation from logs)
    features.append(float(len(sr) / 10.0)) # 24 (Normalized skill count)
    
    feat_array = np.array(features).reshape(1, -1)
    
    return feat_array, {
        "sim": similarity,
        "coverage": skills_match,
        "years_diff": abs(y_res - y_jd),
        "bullets": bullets,
        "headers": sum(features[14:19]), # Sum of section indicators
        "resume_text": resume_text
    }

def final_score_composition(prob, meta, gemini_result=None):
    """
    Calculate final score composition with ML (70%) and Gemini (30%)
    
    Args:
        prob: ML model probability (0-1)
        meta: Metadata dictionary with features
        gemini_result: Optional Gemini evaluation result
    """
    # 1. ML Model Score (Total 70 points)
    # Model probability (0..1) -> Scaled to 50 points
    model_pts = prob * 50.0
    
    # Keywords coverage (0..1) -> Scaled to 20 points
    kw_pts = min(20.0, meta["coverage"] * 100.0 * 0.2)
    
    ml_score = model_pts + kw_pts
    ml_score = max(0.0, min(70.0, ml_score))

    # 2. Gemini/AI Score (Total 30 points)
    if gemini_result and gemini_result.get("success"):
        # Use real Gemini evaluation
        gemini_score = gemini_result.get("score", 0.0)
        gemini_score = max(0.0, min(30.0, gemini_score))
        gemini_suggestions = gemini_result.get("suggestions", [])
        gemini_evaluation = gemini_result.get("evaluation", {})
    else:
        # Fallback to heuristics if Gemini not available
        bullets_pts = min(10.0, meta["bullets"] * 0.5)
        headers_pts = min(10.0, meta["headers"] * 1.5)
        len_score = 0
        if 1000 < meta["resume_len"] < 5000:
            len_score = 10.0
        elif meta["resume_len"] > 500:
            len_score = 5.0
        gemini_score = bullets_pts + headers_pts + len_score
        gemini_suggestions = []
        gemini_evaluation = {
            "language_clarity": bullets_pts + len_score / 2,
            "impact": headers_pts,
            "professionalism": len_score / 2
        }
    
    # Calculate technical metrics for frontend display
    # Keyword Match: Based on coverage (0-100%)
    keyword_match_percent = min(100, meta["coverage"] * 100)
    if keyword_match_percent >= 70:
        keyword_match_level = "High"
    elif keyword_match_percent >= 40:
        keyword_match_level = "Medium"
    else:
        keyword_match_level = "Low"
    
    # Section Completeness: Based on headers found (0-6 sections)
    standard_sections = ["summary", "experience", "education", "skills", "projects", "achievements"]
    sections_found = meta["headers"]
    section_completeness = f"{sections_found}/6"
    
    # Formatting: Based on structure and bullets
    formatting_score = min(100, (meta["headers"] / 6 * 50) + (min(meta["bullets"], 20) / 20 * 50))
    if formatting_score >= 80:
        formatting_level = "Excellent"
    elif formatting_score >= 60:
        formatting_level = "Good"
    elif formatting_score >= 40:
        formatting_level = "Standard"
    else:
        formatting_level = "Needs Improvement"
    
    # Penalties apply to total 
    penalty = 0.0
    if meta["years_diff"] > 4:
        penalty = min(10.0, (meta["years_diff"] - 4) * 2.0)
        
    total_score = ml_score + gemini_score - penalty
    total_score = max(0.0, min(100.0, total_score))
    
    # Calculate Radar Chart Data (Normalized 0-100) powered by AI Opinion
    res_text_lower = str(meta.get("resume_text", "")).lower()
    ai_radar = gemini_evaluation.get("radar_metrics", {}) if gemini_result else {}
    
    def get_axis_score(name, fallback_val):
        # AI returns 0-10, we scale to 0-100 for visual chart
        if name in ai_radar:
            return float(ai_radar[name]) * 10.0
        return fallback_val

    # 1. Experience
    exp_found = any(x in res_text_lower for x in ["experience", "work history", "employment", "professional background", "positions held"])
    exp_fallback = 100.0 if exp_found else (60.0 if meta.get("headers", 0) >= 3 else 30.0)
    
    # 2. Brevity
    word_count = len(res_text_lower.split())
    brevity_fallback = 95.0 if 300 <= word_count <= 850 else max(40.0, 100.0 - abs(500 - word_count) / 10)

    radar_data = [
        {"subject": "Technical", "A": round(get_axis_score("Technical", min(100, meta["coverage"] * 120)), 1)},
        {"subject": "Impact", "A": round(get_axis_score("Impact", meta["sim"] * 120), 1)},
        {"subject": "Brevity", "A": round(get_axis_score("Brevity", brevity_fallback), 1)},
        {"subject": "Structure", "A": round(get_axis_score("Structure", (meta["headers"] / 4.5) * 100), 1)},
        {"subject": "Language", "A": round(get_axis_score("Language", 85), 1)},
        {"subject": "Experience", "A": round(get_axis_score("Experience", exp_fallback), 1)}
    ]

    # Calculate Role Alignment (Simplified for FYP demo)
    roles = {
        "Software Engineer": (meta["sim"] * 0.4 + meta["coverage"] * 0.4 + 0.2) * 100,
        "Data Scientist": (meta["sim"] * 0.3 + meta["coverage"] * 0.3 + 0.4) * 90, # Heavy on ML/Math
        "Product Manager": (meta["sim"] * 0.5 + (meta["headers"]/6) * 0.5) * 95, # Heavy on structure/sim
    }
    role_alignment = {role: round(min(100, score), 1) for role, score in roles.items()}
    
    result = {
        "total_score": round(total_score, 1),
        "radar_data": radar_data,
        "role_alignment": role_alignment,
        "breakdown": {
            "ml_score": round(ml_score, 1),       # Max 70
            "gemini_score": round(gemini_score, 1) # Max 30
        },
        "details": {
            "model_pts": round(model_pts, 1),
            "kw_pts": round(kw_pts, 1),
            "bullets_pts": round(min(10.0, gemini_evaluation.get("language_clarity", 0)), 1) if gemini_result else 0,
            "structure_pts": round(min(10.0, gemini_evaluation.get("professionalism", 0)), 1) if gemini_result else 0,
            "clarity_pts": round(min(10.0, gemini_evaluation.get("impact", 0)), 1) if gemini_result else 0,
            "penalty": round(penalty, 1)
        },
        "technical_metrics": {
            "keyword_match": {
                "percent": round(keyword_match_percent, 1),
                "level": keyword_match_level
            },
            "section_completeness": section_completeness,
            "formatting": {
                "score": round(formatting_score, 1),
                "level": formatting_level
            }
        }
    }
    
    # Add Gemini data if available
    if gemini_result and gemini_result.get("success"):
        result["gemini_suggestions"] = gemini_suggestions
        result["gemini_evaluation"] = gemini_evaluation
    
    return result



# Global instance
_feature_engineer = None

def get_feature_engineer():
    global _feature_engineer
    if _feature_engineer is None:
        from train_xgb_pipeline import ResumeFeatureEngineer
        _feature_engineer = ResumeFeatureEngineer()
    return _feature_engineer

def score_resume(resume_text, jd_text, skills_resume="", skills_jd="", years_resume=0, years_jd=0, use_gemini=True):
    """
    Calculate ATS score with ML model if available, else fallback
    Optionally integrates Gemini AI for quality evaluation
    
    Args:
        resume_text: Resume text content
        jd_text: Job description text
        skills_resume: Skills from resume (comma-separated)
        skills_jd: Skills from JD (comma-separated)
        years_resume: Years of experience from resume
        years_jd: Years required in JD
        use_gemini: Whether to use Gemini AI evaluation (default: True)
    """
    # Compute metadata first (needed for both ML and fallback)
    feats_24, meta = compute_features_array(
        resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd
    )
    
    prob = 0.5  # Default fallback probability
    ml_available = False
    
    try:
        # Try to use cached model
        global _cached_clf, _cached_scaler
        clf = _cached_clf
        scaler = _cached_scaler
        
        # Load if not cached
        if clf is None or scaler is None:
            if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
                print(f"[ML_INIT] Loading model files from {MODEL_PATH}")
                clf = joblib.load(MODEL_PATH)
                scaler = joblib.load(SCALER_PATH)
                _cached_clf, _cached_scaler = clf, scaler
        
        if clf and scaler:
            # DIAGNOSTIC: Log the feature shape to console
            print(f"[ML_ANALYSIS] Processing feature vector. Shape: {feats_24.shape}")
            
            # Transformation
            feats_s = scaler.transform(feats_24)
            
            # Prediction
            if hasattr(clf, "predict_proba"):
                prob = clf.predict_proba(feats_s)[:, 1][0]
            else:
                prob = clf.predict(feats_s)[0] / 100.0
            
            print(f"[ML_SUCCESS] Probability generated: {prob:.4f}")
            ml_available = True
    except Exception as e:
        print(f"[ML_ERROR] Processing failed: {str(e)}")
        # Keep prob = 0.5 as fallback
      
    # Get LLM evaluation if requested
    gemini_result = None
    if use_gemini:
        try:
            from services.llm_service import get_llm_evaluation
            ml_score_temp = (prob * 50.0) + min(20.0, meta["coverage"] * 100.0 * 0.2)
            print(f"[INFO] Calling LLM Service ({settings.LLM_PROVIDER}) with ML score: {ml_score_temp:.1f}/70")
            gemini_result = get_llm_evaluation(resume_text, jd_text, ml_score_temp)
            
            if gemini_result:
                if gemini_result.get("success"):
                    print(f"[OK] Gemini API success - Score: {gemini_result.get('score', 0)}, Suggestions: {len(gemini_result.get('suggestions', []))}")
                else:
                    print(f"[WARN] Gemini API returned success=False: {gemini_result.get('error', 'Unknown error')}")
            else:
                print("[WARN] Gemini API returned None")
                
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[ERROR] Gemini evaluation failed: {e}")
            print(f"Traceback:\n{error_trace}")
            gemini_result = None
    
    # Calculate final score composition
    scoring_result = final_score_composition(prob, meta, gemini_result)
    
    # Extract Gemini suggestions if available
    gemini_suggestions = []
    gemini_evaluation = {}
    if gemini_result and gemini_result.get("success"):
        gemini_suggestions = gemini_result.get("suggestions", [])
        gemini_evaluation = gemini_result.get("evaluation", {})
    
    return {
        "probability": round(float(prob), 4),
        "score": scoring_result["total_score"],
        "breakdown": scoring_result["breakdown"],
        "details": scoring_result["details"],
        "technical_metrics": scoring_result.get("technical_metrics", {}),
        "radar_data": scoring_result.get("radar_data", []),
        "role_alignment": scoring_result.get("role_alignment", {}),
        "meta": meta,
        "ml_available": ml_available,
        "gemini_available": gemini_result is not None and gemini_result.get("success", False),
        "gemini_suggestions": gemini_suggestions,
        "gemini_evaluation": gemini_evaluation
    }