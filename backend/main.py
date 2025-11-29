from fastapi import FastAPI, UploadFile, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from pathlib import Path

from parser_module import extract_text_from_pdfbytes
from scorer_final import score_resume
from gemini_service import get_gemini_suggestions, get_resume_improvement_points
from database import get_db, User, Analysis
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from config import settings

app = FastAPI(title="Smart Resume Analyzer", version="2.0")

app.add_middleware(
    CORSMiddleware,
    # Allow both dev server (3000) and backend-served frontend (8000)
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ==================== AUTH ENDPOINTS ====================

@app.post("/signup")
async def signup(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    # Check if user exists
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(password)
    new_user = User(
        email=email,
        username=username,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username
        }
    }

@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint"""
    
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }

@app.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username
    }

# ==================== RESUME ANALYSIS ENDPOINT ====================

@app.post("/analyze-resume/")
async def analyze_resume(
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze resume with ML model + Gemini AI suggestions
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")

    # Extract text from PDF
    content = await file.read()
    resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
    
    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")
    
    jd_text = jd.strip() or resume_text

    # Get ML-based score
    score_result = score_resume(
        resume_text,
        jd_text,
        skills_resume="",
        skills_jd="",
        years_resume=years,
        years_jd=years
    )

    ats_score = score_result.get("score", 0)
    
    # Get Gemini AI suggestions
    gemini_result = get_gemini_suggestions(resume_text, jd_text, ats_score)
    improvement_points = get_resume_improvement_points(resume_text)
    
    # Save analysis to database
    analysis = Analysis(
        user_id=current_user.id,
        resume_preview=resume_text[:800],
        jd_used=jd_text[:500] if jd.strip() else None,
        ats_score=int(ats_score),
        gemini_suggestions=gemini_result.get("suggestions", "")
    )
    
    db.add(analysis)
    db.commit()

    return {
        "ats_score": ats_score,
        "score_details": score_result,
        "resume_preview": resume_text[:800],
        "jd_used": bool(jd.strip()),
        "gemini_suggestions": gemini_result.get("suggestions"),
        "improvement_points": improvement_points,
        "gemini_success": gemini_result.get("success", False)
    }


@app.post("/guest-analyze-resume/")
async def guest_analyze_resume(
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
):
    """
    Guest analysis endpoint without authentication or history.
    Returns the same payload shape as /analyze-resume/ but does not
    store anything in the database.
    """

    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")

    content = await file.read()
    resume_text = extract_text_from_pdfbytes(content) or "No text extracted."

    if len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not extract meaningful text from PDF",
        )

    jd_text = jd.strip() or resume_text

    score_result = score_resume(
        resume_text,
        jd_text,
        skills_resume="",
        skills_jd="",
        years_resume=years,
        years_jd=years,
    )

    ats_score = score_result.get("score", 0)

    gemini_result = get_gemini_suggestions(resume_text, jd_text, ats_score)
    improvement_points = get_resume_improvement_points(resume_text)

    return {
        "ats_score": ats_score,
        "score_details": score_result,
        "resume_preview": resume_text[:800],
        "jd_used": bool(jd.strip()),
        "gemini_suggestions": gemini_result.get("suggestions"),
        "improvement_points": improvement_points,
        "gemini_success": gemini_result.get("success", False),
    }

@app.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's analysis history"""
    
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(10).all()
    
    return {
        "analyses": [
            {
                "id": a.id,
                "ats_score": a.ats_score,
                "created_at": a.created_at.isoformat(),
                "resume_preview": a.resume_preview[:200] + "..." if a.resume_preview else ""
            }
            for a in analyses
    ]
    }

# ==================== FRONTEND STATIC SERVING ====================

# Resolve path to the built frontend (../frontend/dist from backend/)
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Serve built assets (JS/CSS, etc.) under /static
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_DIST), html=False),
        name="static",
    )


@app.get("/")
async def serve_index():
    """
    Serve the built React index.html at the root.
    """
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend build not found. Run 'npm run build' in frontend."}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    SPA fallback: for any unknown path, return index.html so React Router
    can handle routing on the client.
    """
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not found")