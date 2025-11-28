
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from parser_module import extract_text_from_pdfbytes
from scorer_sentbert import score_resume

app = FastAPI(title="Smart Resume Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

@app.post("/analyze-resume/")
async def analyze_resume(
    file: UploadFile,
    jd: str = Form(""),
    skills: str = Form(""),
    years: float = Form(0.0)
):
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")

    content = await file.read()
    resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
    jd_text = jd.strip() or resume_text

    score = score_resume(
        resume_text,
        jd_text,
        skills_resume=skills,
        skills_jd=jd if jd.strip() else skills,
        years_resume=years,
        years_jd=years
    )

    return {
        "ats_score": score,
        "resume_preview": resume_text[:800],
        "jd_used": bool(jd.strip())
    }
