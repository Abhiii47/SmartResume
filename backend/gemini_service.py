import os
import google.generativeai as genai
from config import settings

# Configure Gemini API - let SDK handle endpoint resolution automatically
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use a modern, supported Gemini model. Allow override via env if needed.
# Try without -latest suffix first, as SDK may handle versioning automatically
DEFAULT_MODEL = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")


def get_gemini_suggestions(resume_text: str, jd_text: str, ats_score: float) -> dict:
    """
    Get AI-powered suggestions from Gemini API
    """
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL)
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) consultant and career coach. 

Analyze this resume against the job description and provide actionable improvement suggestions.

**Resume Text:**
{resume_text[:2000]}

**Job Description:**
{jd_text[:2000]}

**Current ATS Score:** {ats_score}%

Provide a structured analysis with:
1. **Strengths** (3-4 bullet points)
2. **Areas for Improvement** (4-5 specific, actionable points)
3. **Keyword Optimization** (List 5-7 missing keywords from JD)
4. **Formatting Tips** (2-3 suggestions)
5. **Overall Recommendation** (One paragraph summary)

Keep suggestions practical, specific, and directly tied to improving the ATS score.
"""
        
        # Generate with timeout to avoid hanging
        import time
        start_time = time.time()
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "suggestions": response.text,
            "error": None
        }
    
    except Exception as e:
        error_msg = str(e)
        # Provide user-friendly error messages
        if "DNS" in error_msg or "getaddrinfo" in error_msg or "UNAVAILABLE" in error_msg or "10109" in error_msg:
            error_msg = "Network connectivity issue: Unable to reach Gemini API. Please check your internet connection and try again later."
        elif "timeout" in error_msg.lower() or "Timeout" in error_msg:
            error_msg = "Request timed out. The AI service is taking longer than expected. Please try again."
        elif "401" in error_msg or "403" in error_msg or "authentication" in error_msg.lower():
            error_msg = "API authentication failed. Please verify your GEMINI_API_KEY in the backend configuration."
        elif "404" in error_msg or "not found" in error_msg.lower():
            error_msg = "Model not found. Please check your GEMINI_MODEL_NAME setting in the backend configuration."
        else:
            # Generic fallback - don't expose technical details to users
            error_msg = "AI suggestions are temporarily unavailable. Your resume analysis will continue without AI enhancements."
        
        return {
            "success": False,
            "suggestions": None,
            "error": error_msg
        }

def get_resume_improvement_points(resume_text: str) -> list:
    """
    Get specific improvement points for resume enhancement
    """
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL)
        
        prompt = f"""
Analyze this resume and provide exactly 5 specific improvement points.
Each point should be actionable and start with a strong verb.

Resume:
{resume_text[:2000]}

Format: Return only a numbered list (1-5) with concise points.
"""
        
        response = model.generate_content(prompt)
        points = response.text.strip().split('\n')
        return [p.strip() for p in points if p.strip()][:5]
    
    except Exception as e:
        return [
            "Unable to generate suggestions at this time",
            f"Error: {str(e)}"
        ]