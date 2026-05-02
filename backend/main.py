from fastapi import FastAPI, UploadFile, Form, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging
import sys

# Force UTF-8 encoding for standard output and standard error
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


from parser_module import extract_text_from_pdfbytes
from scorer_final import score_resume, load_model, GENERAL_JD_TEXT
from contextlib import asynccontextmanager
from database import get_db, User, Analysis, init_db
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from config import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024

# Initialize Supabase Client
supabase: Client = None
if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("SUCCESS: Supabase client initialized")
    except Exception as e:
        print(f"WARNING: Failed to initialize Supabase: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and Model
    print("STARTUP: Running startup tasks...")
    try:
        init_db()
        print("SUCCESS: Database initialized")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
        
    # Load ML Model
    load_model()
    
    yield
    
    # Shutdown logic (if any)
    print("SHUTDOWN: Shutting down...")

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Smart Resume Analyzer", version="2.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Global Exception Handler for Debugging
@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    import traceback
    error_msg = traceback.format_exc()
    logger.exception("CRITICAL ERROR processing %s", request.url)
    try:
        log_path = Path(__file__).resolve().parent / "critical_error.log"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Error processing {request.url}\n{error_msg}\n\n")
    except:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


async def read_upload_with_limit(file: UploadFile, max_size: int = MAX_RESUME_FILE_SIZE) -> bytes:
    """Read an uploaded file in chunks and enforce the server-side size limit."""
    chunks = []
    total_size = 0

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break

        total_size += len(chunk)
        if total_size > max_size:
            raise HTTPException(
                status_code=413,
                detail="Resume PDF must be 10 MB or smaller.",
            )

        chunks.append(chunk)

    return b"".join(chunks)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== SYSTEM HEALTH ====================

@app.get("/health")
async def health_check():
    """Returns the status of the API and configured services."""
    from services.llm_service import GEMINI_CONFIGURED, GROQ_CLIENT
    from scorer_final import _cached_clf
    
    status = {
        "status": "online",
        "version": "2.0",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development",
        "database": "connected",
        "ml_model_loaded": _cached_clf is not None,
        "llm_config": {
            "provider_primary": settings.LLM_PROVIDER,
            "groq_configured": GROQ_CLIENT is not None,
            "gemini_configured": GEMINI_CONFIGURED,
        }
    }
    
    # Test DB
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as e:
        status["database"] = f"error: {str(e)}"
        status["status"] = "degraded"
        
    return status

# ==================== AUTH ENDPOINTS ====================

@app.post("/signup", summary="Create User Account", description="Registers a new user with a unique email and username. Returns account details on success.")
async def signup(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new user - OPTIMIZED"""
    
    # Validate input
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if user exists
    existing_email = db.query(User).filter(User.email == email.lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = db.query(User).filter(User.username == username.lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    try:
        # Create new user
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email.lower(),
            username=username.lower(),
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.username
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.post("/login", summary="User Authentication", description="Authenticates a user and returns a JWT access token for subsequent requests.")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint - OPTIMIZED"""
    
    try:
        # Find user by email (case-insensitive)
        user = db.query(User).filter(User.email == form_data.username.lower()).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username
    }

# ==================== RESUME ANALYSIS ENDPOINT ====================

@app.post("/analyze-resume/", summary="Deep Resume Analysis", description="Uploads a PDF resume, parses it, and runs it through the XGBoost ML model and Gemini AI for comprehensive scoring.")
@limiter.limit("5/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze resume with ML model
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")

    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Extract text from PDF
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")
        
        jd_text = jd.strip() or GENERAL_JD_TEXT

        # Upload to Supabase Storage if configured
        pdf_url = None
        if supabase:
            try:
                # create unique filename
                import uuid
                file_ext = file.filename.split(".")[-1]
                file_name = f"{current_user.id}/{uuid.uuid4()}.{file_ext}"

                # Upload
                bucket_name = "resumes" 
                supabase.storage.from_(bucket_name).upload(
                    path=file_name,
                    file=content,
                    file_options={"content-type": "application/pdf"}
                )
                
                # Get Public URL
                pdf_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
                
            except Exception as e:
                print(f"⚠️ Supabase upload failed: {e}")

        # Extract skills and years for the ML model to avoid "Empty Input" fallback
        import re
        
        # Simple extraction logic
        def extract_years(text):
            matches = re.findall(r'(\d+)\+?\s*years?', text.lower())
            if matches:
                return float(max([int(m) for m in matches]))
            return 0.0

        extracted_years = extract_years(resume_text)
        # Use user-provided years if available, else use extracted
        final_years = float(years) if float(years) > 0 else extracted_years
        
        # Call the smarter scorer with actual data
        score_result = score_resume(
            resume_text,
            jd_text,
            skills_resume="", # The scorer now does internal extraction from text
            skills_jd="",
            years_resume=final_years,
            years_jd=float(years) if float(years) > 0 else 5.0, # Default target 5 years
            use_gemini=True 
        )

        base_score = score_result.get("score", 0)
        
        # Apply adaptive learning enhancements
        try:
            from services.adaptive_learning import get_adaptive_system
            adaptive = get_adaptive_system(supabase_client=supabase)
            
            # Apply enhancement (max +10 points)
            enhanced_score, enhancements = adaptive.enhance_scoring(
                resume_text,
                jd_text,
                base_score
            )
            
            # Use enhanced score if it's better
            if enhanced_score > base_score:
                ats_score = enhanced_score
                # Update the breakdown to include the bonus so it adds up in the UI
                if "breakdown" in score_result:
                    score_result["breakdown"]["adaptive_bonus"] = round(enhanced_score - base_score, 1)
            else:
                ats_score = base_score
            
            # Store analysis for learning
            adaptive.store_analysis(
                resume_text=resume_text[:2000],  # Limit length
                jd_text=jd_text[:2000],
                ml_score=score_result.get("breakdown", {}).get("ml_score", 0),
                gemini_score=score_result.get("breakdown", {}).get("gemini_score"),
                final_score=ats_score,
                user_id=current_user.id,
                metadata={
                    "enhancements": enhancements,
                    "technical_metrics": score_result.get("technical_metrics", {})
                }
            )
        except Exception as e:
            print(f"Adaptive learning error (non-fatal): {e}")
            ats_score = base_score
        
        # Calculate score difference
        prev_analysis = db.query(Analysis).filter(
            Analysis.user_id == current_user.id
        ).order_by(Analysis.created_at.desc()).first()
        
        score_diff = 0
        previous_score = 0
        if prev_analysis:
            previous_score = prev_analysis.ats_score
            score_diff = ats_score - previous_score
        
        # Get suggestions - prefer Gemini suggestions, then adaptive learning, then heuristics
        suggestions = score_result.get("gemini_suggestions", [])
        
        # Debug logging
        print(f"Score result keys: {score_result.keys()}")
        print(f"Gemini suggestions count: {len(suggestions)}")
        print(f"Gemini available: {score_result.get('gemini_available', False)}")
        
        if not suggestions:
            print("⚠️ No Gemini suggestions found, trying fallback sources")
        
        # Add adaptive learning suggestions if available
        try:
            from services.adaptive_learning import get_adaptive_system
            adaptive = get_adaptive_system(supabase_client=supabase)
            adaptive_suggestions = adaptive.get_personalized_suggestions(
                resume_text,
                jd_text,
                ats_score
            )
            if adaptive_suggestions:
                suggestions.extend(adaptive_suggestions)
                print(f"✅ Added {len(adaptive_suggestions)} adaptive learning suggestions")
        except Exception as e:
            print(f"Adaptive learning suggestions error (non-fatal): {e}")
        
        # Fallback to heuristic suggestions if no AI suggestions
        if not suggestions:
            details = score_result.get("details", {})
            technical_metrics = score_result.get("technical_metrics", {})
            
            kw_level = technical_metrics.get("keyword_match", {}).get("level", "")
            if kw_level == "Low":
                suggestions.append("Your keyword match is low. Mirror exact terms and phrases from the job description in your resume to improve ATS pass-through rate.")
            elif kw_level == "Medium":
                suggestions.append("Moderate keyword match detected. Add more relevant technical skills, tools, and domain-specific keywords from the job description.")
            else:
                suggestions.append("Good keyword coverage! Make sure keywords appear in context (project descriptions, bullet points) not just a skills list.")
            
            sections_str = technical_metrics.get("section_completeness", "0/6")
            try:
                sections_found = int(sections_str.split("/")[0])
            except:
                sections_found = 0
            if sections_found < 5:
                suggestions.append("Add missing sections: a strong resume includes Summary, Experience, Education, Skills, and Projects. Each section helps ATS parsers categorize your profile correctly.")
            
            fmt = technical_metrics.get("formatting", {}).get("level", "")
            if fmt in ["Needs Improvement", "Standard"]:
                suggestions.append("Improve formatting: use consistent bullet points (•), clear section headers, and avoid tables or complex layouts that can confuse ATS parsers.")
            else:
                suggestions.append("Use strong action verbs (Led, Built, Optimized, Reduced) at the start of each bullet point and quantify achievements where possible (e.g. 'Improved performance by 30%').")
            
            resume_words = len(resume_text.split())
            if resume_words < 200:
                suggestions.append("Your resume appears too brief. Expand on your role responsibilities and specific achievements — aim for 400–600 words for optimal ATS scoring.")
            elif resume_words > 900:
                suggestions.append("Your resume may be too long. Keep it to 1 page (or 2 for senior roles) focusing on the most relevant and recent experience.")
            
            if not jd.strip():
                suggestions.append("Add a specific job description when analyzing to get targeted keyword gap analysis and role-alignment scores.")

        # Save analysis to database
        analysis = Analysis(
            user_id=current_user.id,
            resume_preview=resume_text[:800],
            pdf_url=pdf_url,
            jd_used=jd_text[:500] if jd.strip() else None,
            ats_score=int(ats_score),
            gemini_suggestions="|".join(suggestions) 
        )
        
        db.add(analysis)
        db.commit()

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "resume_preview": resume_text[:800],
            "jd_used": bool(jd.strip()),
            "score_diff": score_diff,
            "previous_score": previous_score,
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
            "gemini_error": score_result.get("gemini_evaluation", {}).get("error") if not suggestions else None,
            "debug_info": {
                "ai_suggestions_count": len(score_result.get("gemini_suggestions", [])),
                "adaptive_suggestions_count": len(adaptive_suggestions) if 'adaptive_suggestions' in locals() else 0,
                "provider": settings.LLM_PROVIDER
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/guest-analyze-resume/")
@limiter.limit("2/minute")
async def guest_analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
):
    """
    Guest analysis endpoint without authentication or history.
    """

    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")

    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."

        if len(resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract meaningful text from PDF",
            )

        jd_text = jd.strip() or GENERAL_JD_TEXT

        score_result = score_resume(
            resume_text,
            jd_text,
            skills_resume="",
            skills_jd="",
            years_resume=years,
            years_jd=years,
            use_gemini=True  # Enable Gemini for guest analysis too
        )

        base_score = score_result.get("score", 0)
        ats_score = base_score
        
        # Apply adaptive enhancements
        try:
            from services.adaptive_learning import get_adaptive_system
            adaptive = get_adaptive_system(supabase_client=None)
            enhanced_score, enhancements = adaptive.enhance_scoring(resume_text, jd_text, base_score)
            if enhanced_score > base_score:
                ats_score = enhanced_score
                if "breakdown" in score_result:
                    score_result["breakdown"]["adaptive_bonus"] = round(enhanced_score - base_score, 1)
        except:
            pass

        # Get Gemini suggestions from score result
        suggestions = score_result.get("gemini_suggestions", [])
        
        # Debug logging
        print(f"Score result keys: {score_result.keys()}")
        print(f"Gemini suggestions count: {len(suggestions)}")
        print(f"Gemini available: {score_result.get('gemini_available', False)}")
        
        if not suggestions:
            print("No Gemini suggestions found, using fallback")
            # Add fallback suggestions
            if len(resume_text.split()) < 200:
                suggestions.append("Resume seems too short. Elaborate more on your roles and achievements.")
            if not jd.strip():
                suggestions.append("Add a job description to get more targeted feedback.")
            if not suggestions:
                suggestions.append("Review your resume for clarity, impact, and keyword optimization.")

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "resume_preview": resume_text[:800],
            "jd_used": bool(jd.strip()),
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
            "gemini_error": score_result.get("gemini_evaluation", {}).get("error") if not suggestions else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/generate-cover-letter", summary="Generate AI Cover Letter", description="Generates a professional, tailored cover letter based on the user's latest resume analysis.")
async def api_generate_cover_letter(
    jd: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get latest resume text for this user
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.")
    
    from services.llm_service import generate_cover_letter
    cover_letter = generate_cover_letter(latest.resume_preview, jd)
    return {"cover_letter": cover_letter}

@app.post("/generate-interview-prep", summary="Generate Interview Questions", description="Generates tailored interview questions and winning tips based on the user's resume and a target job description.")
async def api_generate_interview_prep(
    jd: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.")
    
    from services.llm_service import generate_interview_questions
    questions = generate_interview_questions(latest.resume_preview, jd)
    return {"interview_prep": questions}

@app.post("/feedback")
async def submit_feedback(
    analysis_id: str = Form(...),
    feedback_type: str = Form("rating"),
    rating: Optional[int] = Form(None),
    comment: Optional[str] = Form(None),
    actual_score: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback for an analysis to improve adaptive learning
    """
    try:
        from services.adaptive_learning import get_adaptive_system
        adaptive = get_adaptive_system(supabase_client=supabase)
        
        success = adaptive.collect_feedback(
            analysis_id=analysis_id,
            feedback_type=feedback_type,
            rating=rating,
            comment=comment,
            actual_score=actual_score,
            user_id=current_user.id
        )
        
        if success:
            return {"success": True, "message": "Feedback recorded successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to record feedback")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback submission failed: {str(e)}")

@app.get("/adaptive-learning/stats")
async def get_adaptive_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get adaptive learning system statistics
    """
    try:
        from services.adaptive_learning import get_adaptive_system
        adaptive = get_adaptive_system(supabase_client=supabase)
        stats = adaptive.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@app.get("/history", summary="Analysis History", description="Retrieves a list of all past resume analyses for the authenticated user.")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's analysis history with PDF URLs"""
    
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(20).all()
    
    return {
        "analyses": [
            {
                "id": a.id,
                "ats_score": a.ats_score,
                "created_at": a.created_at.isoformat(),
                "resume_preview": a.resume_preview[:200] + "..." if a.resume_preview else "",
                "pdf_url": a.pdf_url,
                "jd_used": a.jd_used[:200] + "..." if a.jd_used else None
            }
            for a in analyses
        ]
    }



# ==================== FRONTEND STATIC SERVING ====================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount static assets first - clearly distinguished path
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_DIST), html=False),
        name="static",
    )
    
    # Also mount root files (like favicon, etc) but NOT index.html here to avoid conflict
    app.mount(
        "/assets", 
        StaticFiles(directory=str(FRONTEND_DIST), html=False), 
        name="assets"
    )

@app.get("/")
async def serve_index():
    """Serve specific index.html or fallback to API status."""
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "status": "online", 
        "service": "SmartResume API", 
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/{full_path:path}")
async def serve_spa_or_static(full_path: str):
    """
    Serve static files from root if they exist, 
    otherwise return index.html for client-side routing.
    """
    # Skip API routes
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if file exists in dist (e.g. frontend.123.js)
    file_path = FRONTEND_DIST / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Fallback to index.html
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not found")


# ==================== RUN SERVER ====================

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("Starting SmartResume Backend Server")
    print("=" * 50)
    print("Backend API: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("=" * 50)
    print("\nStarting server... Press CTRL+C to stop\n")
    
    # Remove reload=True to avoid the warning
    uvicorn.run(app, host="0.0.0.0", port=8000)
