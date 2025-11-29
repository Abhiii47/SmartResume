from fastapi import FastAPI, UploadFile, Form, HTTPException, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator, EmailStr
from sqlalchemy.orm import Session
import logging
import json
from typing import Optional
from datetime import datetime

# Import our improved modules
from parser_module import extract_text_from_pdfbytes
from services.resume_scorer import ResumeScorer
from database import init_db, get_db, User, ResumeScore
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_user_optional, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Resume Analyzer",
    description="AI-powered resume scoring and analysis system",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()
logger.info("Database initialized")

# Initialize scorer (singleton pattern)
try:
    scorer = ResumeScorer()
    logger.info("Resume scorer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize scorer: {e}")
    scorer = None


# Pydantic models for request validation
class UserSignup(BaseModel):
    """User signup model."""
    email: EmailStr
    username: str
    password: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class UserLogin(BaseModel):
    """User login model."""
    username: str
    password: str


class AnalyzeRequest(BaseModel):
    """Request model for resume analysis."""
    job_description: str
    skills: Optional[str] = ""
    years_experience: Optional[float] = 0.0
    
    @validator('job_description')
    def validate_jd(cls, v):
        if not v or len(v.strip()) < 20:
            raise ValueError('Job description must be at least 20 characters')
        return v.strip()
    
    @validator('years_experience')
    def validate_years(cls, v):
        if v < 0 or v > 50:
            raise ValueError('Years of experience must be between 0 and 50')
        return v


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Smart Resume Analyzer",
        "version": "2.0.0",
        "scorer_status": "ready" if scorer else "unavailable"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "components": {
            "api": "operational",
            "scorer": "operational" if scorer else "failed",
            "pdf_parser": "operational"
        }
    }


@app.post("/api/auth/signup")
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """User signup endpoint."""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "success": True,
        "message": "User created successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username
        }
    }


@app.post("/api/auth/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """User login endpoint."""
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }


@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at.isoformat()
    }


@app.get("/api/resume-scores")
async def get_resume_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get user's resume scores."""
    scores = db.query(ResumeScore).filter(
        ResumeScore.user_id == current_user.id
    ).order_by(ResumeScore.created_at.desc()).limit(limit).all()
    
    return {
        "success": True,
        "scores": [
            {
                "id": score.id,
                "filename": score.filename,
                "overall_score": score.overall_score,
                "keyword_match": score.keyword_match,
                "semantic_similarity": score.semantic_similarity,
                "skills_match": score.skills_match,
                "experience_match": score.experience_match,
                "ats_formatting": score.ats_formatting,
                "section_completeness": score.section_completeness,
                "created_at": score.created_at.isoformat(),
                "recommendations": json.loads(score.recommendations) if score.recommendations else []
            }
            for score in scores
        ]
    }


@app.post("/analyze-resume/")
async def analyze_resume(
    file: UploadFile = File(...),
    jd: str = Form(""),
    skills: str = Form(""),
    years: float = Form(0.0),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Analyze resume against job description.
    
    Args:
        file: PDF file upload
        jd: Job description text
        skills: Required skills (comma-separated)
        years: Required years of experience
        
    Returns:
        Comprehensive scoring analysis with recommendations
    """
    # Validate scorer is available
    if scorer is None:
        raise HTTPException(
            status_code=503,
            detail="Scoring service is currently unavailable. Please try again later."
        )
    
    # Validate file
    if not file:
        raise HTTPException(
            status_code=400,
            detail="Resume PDF file is required"
        )
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a PDF resume."
        )
    
    # Check file size (10MB limit)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 10MB limit"
        )
    
    # Extract text from PDF
    try:
        resume_text = extract_text_from_pdfbytes(content)
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(
                status_code=422,
                detail="Unable to extract sufficient text from PDF. "
                       "Please ensure the PDF contains readable text (not scanned images)."
            )
    except Exception as e:
        logger.error(f"PDF extraction failed: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to process PDF: {str(e)}"
        )
    
    # Use resume text as JD if not provided
    jd_text = jd.strip() if jd.strip() else resume_text
    
    # Validate JD
    if len(jd_text) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short. Please provide at least 20 characters."
        )
    
    # Perform scoring
    try:
        result = scorer.score(
            resume_text=resume_text,
            jd_text=jd_text,
            skills_resume=skills,
            skills_jd=skills if not jd.strip() else jd,
            years_resume=years,
            years_jd=years
        )
        
        logger.info(f"Successfully scored resume: {file.filename} - Score: {result['overall_score']}")
        
        # Try to get current user (optional - for guest mode)
        from auth import get_current_user_optional
        current_user = await get_current_user_optional(authorization, db)
        
        # Save score if user is logged in
        if current_user:
            score_breakdown = result.get("score_breakdown", {})
            recommendations = result.get("recommendations", [])
            
            resume_score = ResumeScore(
                user_id=current_user.id,
                filename=file.filename,
                overall_score=result['overall_score'],
                keyword_match=score_breakdown.get('keyword_match'),
                semantic_similarity=score_breakdown.get('semantic_similarity'),
                skills_match=score_breakdown.get('skills_match'),
                experience_match=score_breakdown.get('experience_match'),
                ats_formatting=score_breakdown.get('ats_formatting'),
                section_completeness=score_breakdown.get('section_completeness'),
                job_description=jd_text[:1000] if jd_text else None,
                resume_preview=resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
                recommendations=json.dumps(recommendations)
            )
            db.add(resume_score)
            db.commit()
            logger.info(f"Saved resume score for user {current_user.id}")
        
        return {
            "success": True,
            "filename": file.filename,
            "resume_preview": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
            "analysis": result,
            "metadata": {
                "resume_length": len(resume_text),
                "word_count": len(resume_text.split()),
                "jd_provided": bool(jd.strip()),
                "saved": current_user is not None
            }
        }
        
    except ValueError as e:
        logger.warning(f"Validation error during scoring: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Scoring failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during analysis: {str(e)}"
        )


@app.post("/quick-score/")
async def quick_score(
    resume_text: str = Form(...),
    jd_text: str = Form(...)
):
    """
    Quick scoring endpoint for text input (no file upload).
    Useful for testing or when resume text is already extracted.
    """
    if scorer is None:
        raise HTTPException(
            status_code=503,
            detail="Scoring service unavailable"
        )
    
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short"
        )
    
    if not jd_text or len(jd_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short"
        )
    
    try:
        result = scorer.score(
            resume_text=resume_text,
            jd_text=jd_text
        )
        
        return {
            "success": True,
            "analysis": result
        }
        
    except Exception as e:
        logger.error(f"Quick score failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors."""
    return {
        "success": False,
        "error": str(exc),
        "error_type": "validation_error"
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {str(exc)}")
    return {
        "success": False,
        "error": "An unexpected error occurred. Please try again.",
        "error_type": "server_error"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run with: python main.py
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )