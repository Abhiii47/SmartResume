"""
Gemini AI Service for Resume Evaluation
Provides overall quality assessment, language clarity, and impact evaluation
"""
import os
import json
import re
from typing import Dict, Optional
import google.generativeai as genai
from config import settings

# Pre-compiled regex patterns for score extraction fallback
SCORE_PATTERNS = [
    re.compile(r'"score"\s*:\s*(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'score\s*:\s*(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'score\s+is\s+(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r'(\d+(?:\.\d+)?)\s*/\s*30', re.IGNORECASE)
]

# Configure Gemini API
GEMINI_CONFIGURED = False
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_CONFIGURED = True
        print(f"✅ Gemini API configured (key length: {len(settings.GEMINI_API_KEY)})")
    except Exception as e:
        print(f"⚠️ Failed to configure Gemini API: {e}")
else:
    print("⚠️ GEMINI_API_KEY not set in environment variables")

def get_gemini_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """
    Get comprehensive evaluation from Gemini AI
    
    Args:
        resume_text: Extracted text from resume
        jd_text: Job description text
        ml_score: ML model score (0-70) for context
    
    Returns:
        Dict with:
            - success: bool
            - score: float (0-30) - overall quality score
            - suggestions: list of improvement suggestions
            - evaluation: dict with detailed breakdown
            - error: str if failed
    """
    # Check if API key is configured
    if not GEMINI_CONFIGURED or not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        error_msg = "Gemini API key not configured. Please set GEMINI_API_KEY in your .env file"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "score": 0.0,
            "suggestions": [],
            "evaluation": {},
            "error": error_msg
        }
    
    try:
        # Define model hierarchy for fallbacks
        # Start with best models, fall back to high-limit models (1.5-flash)
        model_candidates = [
            'gemini-2.5-flash',      # Tier 1: Latest & Fast (Low RPD on free?)
            'gemini-2.0-flash',      # Tier 2: Stable 2.0
            'gemini-1.5-flash',      # Tier 3: High limits (1500 RPD usually)
            'gemini-1.5-pro',        # Tier 4: Fallback
        ]
        
        last_error = None
        response_text = None
        
        # Try models in sequence until one works
        for model_name in model_candidates:
            try:
                print(f"🔄 Attempting generation with model: {model_name}")
                model = genai.GenerativeModel(model_name)
                
                # Generate response with JSON enforcement
                generation_config = genai.types.GenerationConfig(
                    candidate_count=1,
                    response_mime_type="application/json"
                )
                
                response = model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                
                # Check response validity
                if not hasattr(response, 'text') or not response.text:
                    raise Exception("Empty response from Gemini API")
                    
                response_text = response.text.strip()
                print(f"✅ Success with {model_name} (length: {len(response_text)})")
                break # Success! Exit loop
                
            except Exception as e:
                error_str = str(e).lower()
                last_error = e
                print(f"⚠️ Failed with {model_name}: {e}")
                
                # Only retry on Quota/Rate limits or Model Not Found
                is_quota_error = "quota" in error_str or "rate" in error_str or "429" in error_str
                is_not_found = "not found" in error_str or "404" in error_str
                
                if is_quota_error or is_not_found:
                    print(f"🔄 Switching model due to error...")
                    continue # Try next model
                else:
                    # If it's a different error (e.g. invalid key), stop trying
                    raise e

        if not response_text:
            raise Exception(f"All models failed. Last error: {last_error}")
        
        # Extract JSON from response (handle markdown code blocks if present)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON response
        try:
            evaluation = json.loads(response_text)
            print("✅ Successfully parsed JSON response from Gemini")
        except json.JSONDecodeError as json_error:
            print(f"⚠️ JSON parsing failed, using fallback extraction: {json_error}")
            print(f"Response text (first 500 chars): {response_text[:500]}")
            # Fallback: try to extract score and suggestions manually
            score = _extract_score_fallback(response_text)
            suggestions = _extract_suggestions_fallback(response_text)
            evaluation = {
                "score": score,
                "language_clarity": score / 3,
                "impact": score / 3,
                "professionalism": score / 3,
                "suggestions": suggestions,
                "overall_feedback": response_text[:200]
            }
            print(f"✅ Fallback extraction: score={score}, suggestions={len(suggestions)}")
        
        # Validate and normalize score
        gemini_score = float(evaluation.get("score", 0))
        gemini_score = max(0.0, min(30.0, gemini_score))
        
        suggestions = evaluation.get("suggestions", [])
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)] if suggestions else []
        
        return {
            "success": True,
            "score": round(gemini_score, 1),
            "suggestions": suggestions[:5],  # Limit to 5 suggestions
            "evaluation": {
                "language_clarity": max(0.0, min(10.0, float(evaluation.get("language_clarity", gemini_score / 3)))),
                "impact": max(0.0, min(10.0, float(evaluation.get("impact", gemini_score / 3)))),
                "professionalism": max(0.0, min(10.0, float(evaluation.get("professionalism", gemini_score / 3)))),
                "overall_feedback": evaluation.get("overall_feedback", "")
            },
            "error": None
        }
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print("=" * 60)
        print("❌ GEMINI API ERROR")
        print("=" * 60)
        print(f"Error: {error_msg}")
        print(f"Traceback:\n{error_trace}")
        print("=" * 60)
        
        # Write to debug log
        try:
            with open("backend/gemini_error.log", "a", encoding="utf-8") as f:
                from datetime import datetime
                f.write(f"\n{'='*60}\n")
                f.write(f"Timestamp: {datetime.now().isoformat()}\n")
                f.write(f"Error: {error_msg}\n")
                f.write(f"Traceback:\n{error_trace}\n")
        except:
            pass
        
        return {
            "success": False,
            "score": 0.0,
            "suggestions": [],
            "evaluation": {},
            "error": f"Gemini API error: {error_msg}"
        }

def _extract_score_fallback(text: str) -> float:
    """Fallback method to extract score from text if JSON parsing fails"""
    # Look for score patterns like "score": 25 or score: 25
    for pattern in SCORE_PATTERNS:
        match = pattern.search(text)
        if match:
            score = float(match.group(1))
            return max(0.0, min(30.0, score))
    return 15.0  # Default fallback score

def _extract_suggestions_fallback(text: str) -> list:
    """Fallback method to extract suggestions from text"""
    suggestions = []
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if line and (line.startswith('-') or line.startswith('•') or 
                     line.startswith('1.') or line.startswith('2.') or
                     line.startswith('3.') or line.startswith('4.') or
                     line.startswith('5.')):
            suggestion = line.lstrip('-•1234567890. ').strip()
            if suggestion and len(suggestion) > 10:
                suggestions.append(suggestion)
                if len(suggestions) >= 5:
                    break
    return suggestions if suggestions else ["Review resume for clarity and impact."]

