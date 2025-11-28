import random
def score_resume(resume_text, jd_text, skills_resume="", skills_jd="", years_resume=0, years_jd=0):
    # Simple fallback: random-ish deterministic score based on length and overlap
    try:
        overlap = len(set(s.strip().lower() for s in str(skills_resume).split(",") if s.strip()) &
                      set(s.strip().lower() for s in str(skills_jd).split(",") if s.strip()))
    except:
        overlap = 0
    base = min(1.0, len(str(resume_text)) / 2000.0)
    score = int((0.5*base + 0.4*min(1, overlap/ max(1,len(str(skills_jd).split(',')))) + 0.1*max(0,min(1,years_resume/5)) )*100)
    return {"probability": score/100.0, "score": score, "meta": {"overlap": overlap}}
