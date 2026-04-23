from fastapi import FastAPI, UploadFile, Form, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from parser_module import extract_text_from_pdfbytes
from scorer_final import score_resume, load_model
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
    print(f"CRITICAL ERROR processing {request.url}: {error_msg}")
    try:
        with open("backend/critical_error.log", "a") as f:
            f.write(f"Error processing {request.url}\n{error_msg}\n\n")
    except:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "debug": str(exc)},
    )

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://smart-resume-orcin.vercel.app",
    "https://smart-resume-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not origins else origins, 
    # Broaden regex to allow any Vercel deployment for this project
    allow_origin_regex=r"https://smart-resume-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== AUTH ENDPOINTS ====================

@app.post("/signup")
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

@app.post("/login")
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

@app.post("/analyze-resume/")
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
        content = await file.read()
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")
        
        jd_text = jd.strip() or resume_text

        # Upload to Supabase Storage if configured
        pdf_url = None
        if supabase:
            try:
                # create unique filename
                import uuid
                file_ext = file.filename.split(".")[-1]
                file_name = f"{current_user.id}/{uuid.uuid4()}.{file_ext}"
                
                # Reset file cursor to beginning before upload (since we read it above)
                await file.seek(0)
                file_content_bytes = await file.read()
                
                # Upload
                bucket_name = "resumes" 
                supabase.storage.from_(bucket_name).upload(
                    path=file_name,
                    file=file_content_bytes,
                    file_options={"content-type": "application/pdf"}
                )
                
                # Get Public URL
                pdf_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
                
            except Exception as e:
                print(f"⚠️ Supabase upload failed: {e}")

        # Get ML-based score with Gemini integration
        score_result = score_resume(
            resume_text,
            jd_text,
            skills_resume="",
            skills_jd="",
            years_resume=years,
            years_jd=years,
            use_gemini=True  # Enable Gemini evaluation
        )

        base_score = score_result.get("score", 0)
        
        # Apply adaptive learning enhancements
        try:
            from services.adaptive_learning import get_adaptive_system
            adaptive = get_adaptive_system(supabase_client=supabase)
            
            # Enhance score based on learned patterns
            enhanced_score, enhancements = adaptive.enhance_scoring(
                resume_text,
                jd_text,
                base_score
            )
            
            # Use enhanced score if it's better
            ats_score = enhanced_score if enhanced_score > base_score else base_score
            
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
        print(f"📊 Score result keys: {score_result.keys()}")
        print(f"💡 Gemini suggestions count: {len(suggestions)}")
        print(f"✅ Gemini available: {score_result.get('gemini_available', False)}")
        
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
            
            if technical_metrics.get("keyword_match", {}).get("level") == "Low":
                suggestions.append("Low keyword match. Try to include more terms from the Job Description.")
            elif technical_metrics.get("keyword_match", {}).get("level") == "Medium":
                suggestions.append("Moderate keyword match. Consider adding more relevant keywords from the Job Description.")
            
            if details.get("structure_pts", 0) < 6:
                suggestions.append("Resume structure could be clearer. Ensure standard headers (Experience, Education, Skills) are present.")
            
            if technical_metrics.get("formatting", {}).get("level") in ["Needs Improvement", "Standard"]:
                suggestions.append("Improve formatting and structure. Use consistent bullet points and clear section headers.")
            
            if len(resume_text.split()) < 200:
                suggestions.append("Resume seems too short. Elaborate more on your roles and achievements.")
            
            if score_diff < 0:
                suggestions.append("Your score dropped compared to last time. Check if you removed key sections or keywords.")

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
            "gemini_error": score_result.get("gemini_evaluation", {}).get("error") if not suggestions else None
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
            use_gemini=True  # Enable Gemini for guest analysis too
        )

        ats_score = score_result.get("score", 0)
        
        # Get Gemini suggestions from score result
        suggestions = score_result.get("gemini_suggestions", [])
        
        # Debug logging
        print(f"📊 Score result keys: {score_result.keys()}")
        print(f"💡 Gemini suggestions count: {len(suggestions)}")
        print(f"✅ Gemini available: {score_result.get('gemini_available', False)}")
        
        if not suggestions:
            print("⚠️ No Gemini suggestions found, using fallback")
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

@app.get("/history")
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

# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "SmartResume API"}


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
    print("🚀 Starting SmartResume Backend Server")
    print("=" * 50)
    print("📍 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("❤️  Health Check: http://localhost:8000/health")
    print("=" * 50)
    print("\n⏳ Starting server... Press CTRL+C to stop\n")
    
    # Remove reload=True to avoid the warning
    uvicorn.run(app, host="0.0.0.0", port=8000)