"""
Unified LLM Service for SmartResume
Supports Gemini (Google) and Groq (Llama 3/Mixtral)
"""
import os
import json
import re
import logging
from typing import Dict, List, Optional, Tuple
import google.generativeai as genai
from config import settings

# Configure Logger
logger = logging.getLogger(__name__)

# Try to import Groq (optional dependency)
GROQ_AVAILABLE = False
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("Groq package not installed. Run 'pip install groq'")

# Pre-compiled regex patterns for score extraction fallback
SCORE_PATTERNS = [
    re.compile(r'"score"\s*:\s*(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'score\s*:\s*(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'score\s+is\s+(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'(\d+(?:\.\d+)?)\s*/\s*30', re.IGNORECASE)
]

# Initialize Clients
GEMINI_CONFIGURED = False
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_CONFIGURED = True
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")

GROQ_CLIENT = None
if GROQ_AVAILABLE and settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
    try:
        GROQ_CLIENT = Groq(api_key=settings.GROQ_API_KEY)
        logger.info(f"Groq API configured successfully (Model: {settings.GROQ_MODEL})")
    except Exception as e:
        logger.error(f"Failed to configure Groq Client: {e}")

def get_llm_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """
    Get comprehensive evaluation from the configured LLM provider
    """
    provider = settings.LLM_PROVIDER.strip().lower()
    
    # Fallback logic: if preferred provider fails, try the other
    if provider == "groq" and GROQ_CLIENT:
        result = _get_groq_evaluation(resume_text, jd_text, ml_score)
        if result.get("success"):
            return result
        logger.warning("Groq failed, falling back to Gemini")
        return _get_gemini_evaluation(resume_text, jd_text, ml_score)
    
    # Default to Gemini
    return _get_gemini_evaluation(resume_text, jd_text, ml_score)

def _get_gemini_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """Original Gemini evaluation logic"""
    if not GEMINI_CONFIGURED:
        return {"success": False, "error": "Gemini not configured"}
        
    prompt = _get_evaluation_prompt(resume_text, jd_text, ml_score)
    
    try:
        model_candidates = ['gemini-1.5-flash', 'gemini-1.5-pro']
        response_text = None
        
        for model_name in model_candidates:
            try:
                model = genai.GenerativeModel(model_name)
                generation_config = genai.types.GenerationConfig(
                    candidate_count=1,
                    response_mime_type="application/json"
                )
                response = model.generate_content(prompt, generation_config=generation_config)
                if response.text:
                    response_text = response.text.strip()
                    break
            except Exception as e:
                logger.warning(f"Gemini {model_name} failed: {e}")
                continue
                
        if not response_text:
            return {"success": False, "error": "All Gemini models failed"}
            
        return _parse_llm_response(response_text)
        
    except Exception as e:
        logger.error(f"Gemini evaluation error: {e}")
        return {"success": False, "error": str(e)}

def _get_groq_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """Groq evaluation logic using Llama 3"""
    if not GROQ_CLIENT:
        return {"success": False, "error": "Groq client not initialized"}
        
    prompt = _get_evaluation_prompt(resume_text, jd_text, ml_score)
    
    try:
        completion = GROQ_CLIENT.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert ATS (Applicant Tracking System) optimizer. Respond only in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        
        response_text = completion.choices[0].message.content
        return _parse_llm_response(response_text)
        
    except Exception as e:
        logger.error(f"Groq evaluation error: {e}")
        return {"success": False, "error": str(e)}

def _get_evaluation_prompt(resume_text: str, jd_text: str, ml_score: float) -> str:
    return f"""
    Evaluate this resume against the job description.
    ML Model Score: {ml_score}/70 (for context)
    
    RESUME TEXT:
    {resume_text[:3000]}
    
    JOB DESCRIPTION:
    {jd_text[:2000]}
    
    RETURN A JSON OBJECT WITH:
    1. "score": (0-30 float) representing language, impact, and quality.
    2. "suggestions": (List of strings) - 3-5 specific, actionable improvements.
    3. "overall_feedback": (String) - 1-2 sentence summary.
    4. "radar_metrics": {
         "Experience": (0-10) - quality and relevance of work history.
         "Technical": (0-10) - depth of technical skills shown.
         "Impact": (0-10) - use of metrics and quantification.
         "Brevity": (0-10) - conciseness and lack of filler.
         "Structure": (0-10) - logical flow and sectioning.
         "Language": (0-10) - professional tone and clarity.
       }
    """

def _parse_llm_response(response_text: str) -> Dict:
    """Common parser for LLM responses"""
    try:
        # Clean potential markdown
        clean_text = response_text
        if "```json" in response_text:
            clean_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            clean_text = response_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(clean_text)
        
        # Normalize fields - Support multiple possible keys from AI
        score = float(data.get("score", data.get("ai_score", data.get("total_score", 0))))
        
        # Flexibly find suggestions
        suggestions = data.get("suggestions", data.get("improvements", data.get("recommendations", data.get("action_items", []))))
        
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)] if suggestions else []
        
        # Ensure we have at least some suggestions if the score is low
        if not suggestions and score < 25:
            suggestions = ["Optimize your technical keyword density", "Quantify more achievements with metrics", "Ensure formatting is ATS-compliant"]
            
        radar_metrics = data.get("radar_metrics", {})
        
        return {
            "success": True,
            "score": round(min(30.0, max(0.0, score)), 1),
            "suggestions": suggestions[:5],
            "evaluation": {
                "radar_metrics": radar_metrics,
                "overall_feedback": data.get("overall_feedback", data.get("feedback", ""))
            }
        }
    except Exception as e:
        logger.error(f"Response parsing failed: {e}. Raw response: {response_text[:200]}")
        return {"success": False, "error": "Parsing failed"}

# Additional utility functions moved from gemini_service
def generate_cover_letter(resume_text: str, jd_text: str) -> str:
    provider = settings.LLM_PROVIDER.lower()
    prompt = f"Write a professional cover letter based on this resume: {resume_text[:2000]} and this job: {jd_text[:1000]}. Keep it concise."
    
    try:
        if provider == "groq" and GROQ_CLIENT:
            completion = GROQ_CLIENT.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            return completion.choices[0].message.content
        else:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return response.text
    except Exception as e:
        return f"Error: {str(e)}"

def generate_interview_questions(resume_text: str, jd_text: str) -> str:
    provider = settings.LLM_PROVIDER.lower()
    prompt = f"Generate 5 interview questions for this resume: {resume_text[:2000]} and job: {jd_text[:1000]}. Include winning tips."
    
    try:
        if provider == "groq" and GROQ_CLIENT:
            completion = GROQ_CLIENT.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            return completion.choices[0].message.content
        else:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return response.text
    except Exception as e:
        return f"Error: {str(e)}"
