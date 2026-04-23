import os
import logging
from typing import Dict, Optional, Tuple
import numpy as np

# Import your ML scoring function
from scorer_final import score_resume as ml_score_resume

# Import Gemini service
from gemini_service import get_gemini_suggestions

logger = logging.getLogger(__name__)


class HybridScorer:
    """
    Combines ML model (70%) and Gemini AI (30%) for final ATS score.
    
    Your 50,000 dataset trained model provides the primary score,
    while Gemini AI enhances it with contextual understanding.
    """
    
    # Weights for hybrid scoring
    ML_WEIGHT = 0.70  # 70% from your trained ML model
    GEMINI_WEIGHT = 0.30  # 30% from Gemini AI
    
    def __init__(self):
        """Initialize the hybrid scorer"""
        self.ml_available = self._check_ml_model()
        self.gemini_available = self._check_gemini_service()
        
        logger.info(f"Hybrid Scorer initialized - ML: {self.ml_available}, Gemini: {self.gemini_available}")
    
    def _check_ml_model(self) -> bool:
        """Check if ML model files are available"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), "..", "models", "xgb_calibrated.joblib")
            return os.path.exists(model_path)
        except Exception as e:
            logger.error(f"Error checking ML model: {e}")
            return False
    
    def _check_gemini_service(self) -> bool:
        """Check if Gemini API is configured"""
        try:
            from config import settings
            return bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "")
        except Exception as e:
            logger.error(f"Error checking Gemini service: {e}")
            return False
    
    def calculate_hybrid_score(
        self,
        resume_text: str,
        jd_text: str,
        skills_resume: str = "",
        skills_jd: str = "",
        years_resume: float = 0.0,
        years_jd: float = 0.0
    ) -> Dict:
        """
        Calculate hybrid score combining ML model (70%) and Gemini AI (30%)
        
        Args:
            resume_text: Full resume text
            jd_text: Job description text
            skills_resume: Comma-separated skills from resume
            skills_jd: Comma-separated required skills
            years_resume: Years of experience in resume
            years_jd: Required years of experience
            
        Returns:
            Dictionary with scores and analysis
        """
        
        # Step 1: Get ML Model Score (70% weight)
        ml_result = self._get_ml_score(
            resume_text, jd_text, skills_resume, skills_jd, years_resume, years_jd
        )
        ml_score = ml_result.get("score", 0)
        
        # Step 2: Get Gemini AI Score (30% weight)
        gemini_result = self._get_gemini_score(resume_text, jd_text, ml_score)
        gemini_score = gemini_result.get("score", ml_score)  # Fallback to ML score
        
        # Step 3: Calculate weighted hybrid score
        if self.ml_available and self.gemini_available and gemini_result.get("success"):
            # Both available - use hybrid
            final_score = (self.ML_WEIGHT * ml_score) + (self.GEMINI_WEIGHT * gemini_score)
            scoring_method = "hybrid"
        elif self.ml_available:
            # Only ML available
            final_score = ml_score
            scoring_method = "ml_only"
        elif self.gemini_available and gemini_result.get("success"):
            # Only Gemini available
            final_score = gemini_score
            scoring_method = "gemini_only"
        else:
            # Fallback to basic calculation
            final_score = self._fallback_score(resume_text, jd_text)
            scoring_method = "fallback"
        
        # Step 4: Compile comprehensive result
        result = {
            # Final scores
            "final_score": round(final_score, 2),
            "ml_score": round(ml_score, 2),
            "gemini_score": round(gemini_score, 2) if gemini_result.get("success") else None,
            
            # Scoring breakdown
            "scoring_method": scoring_method,
            "weights": {
                "ml_weight": self.ML_WEIGHT,
                "gemini_weight": self.GEMINI_WEIGHT
            },
            
            # Detailed analysis
            "ml_details": ml_result.get("meta", {}),
            "ml_probability": ml_result.get("probability", None),
            
            # Gemini insights
            "gemini_suggestions": gemini_result.get("suggestions", None),
            "gemini_success": gemini_result.get("success", False),
            "gemini_error": gemini_result.get("error", None),
            
            # Match assessment
            "match_level": self._get_match_level(final_score),
            "confidence": self._calculate_confidence(ml_result, gemini_result),
            
            # Metadata
            "model_available": self.ml_available,
            "ai_available": self.gemini_available,
        }
        
        logger.info(
            f"Hybrid Score: {final_score:.2f} (ML: {ml_score:.2f} [{self.ML_WEIGHT*100}%] + "
            f"Gemini: {gemini_score:.2f} [{self.GEMINI_WEIGHT*100}%]) - Method: {scoring_method}"
        )
        
        return result
    
    def _get_ml_score(
        self,
        resume_text: str,
        jd_text: str,
        skills_resume: str,
        skills_jd: str,
        years_resume: float,
        years_jd: float
    ) -> Dict:
        """
        Get score from your 50,000 dataset trained ML model
        """
        try:
            if not self.ml_available:
                logger.warning("ML model not available, using fallback")
                return {
                    "score": self._fallback_score(resume_text, jd_text),
                    "meta": {},
                    "probability": None
                }
            
            # Call your ML model
            result = ml_score_resume(
                resume_text=resume_text,
                jd_text=jd_text,
                skills_resume=skills_resume,
                skills_jd=skills_jd,
                years_resume=years_resume,
                years_jd=years_jd
            )
            
            logger.info(f"ML Model Score: {result.get('score', 0):.2f}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting ML score: {e}")
            return {
                "score": self._fallback_score(resume_text, jd_text),
                "meta": {},
                "probability": None,
                "error": str(e)
            }
    
    def _get_gemini_score(
        self,
        resume_text: str,
        jd_text: str,
        ml_score: float
    ) -> Dict:
        """
        Get score and insights from Gemini AI
        """
        try:
            if not self.gemini_available:
                logger.warning("Gemini not available")
                return {
                    "success": False,
                    "score": ml_score,
                    "suggestions": None,
                    "error": "Gemini API not configured"
                }
            
            # Get Gemini analysis
            gemini_result = get_gemini_suggestions(resume_text, jd_text, ml_score)
            
            if not gemini_result.get("success"):
                logger.warning(f"Gemini analysis failed: {gemini_result.get('error')}")
                return {
                    "success": False,
                    "score": ml_score,
                    "suggestions": None,
                    "error": gemini_result.get("error")
                }
            
            # Extract Gemini's score assessment
            gemini_score = self._extract_gemini_score(
                gemini_result.get("suggestions", ""),
                ml_score
            )
            
            logger.info(f"Gemini AI Score: {gemini_score:.2f}")
            
            return {
                "success": True,
                "score": gemini_score,
                "suggestions": gemini_result.get("suggestions"),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting Gemini score: {e}")
            return {
                "success": False,
                "score": ml_score,
                "suggestions": None,
                "error": str(e)
            }
    
    def _extract_gemini_score(self, suggestions: str, ml_score: float) -> float:
        """
        Extract or derive a score from Gemini's suggestions
        
        Gemini provides qualitative analysis, we convert to quantitative score
        """
        if not suggestions:
            return ml_score
        
        suggestions_lower = suggestions.lower()
        
        # Positive indicators increase score
        positive_keywords = [
            "excellent", "strong", "outstanding", "impressive", "well-written",
            "comprehensive", "detailed", "relevant", "perfect", "ideal"
        ]
        
        # Negative indicators decrease score
        negative_keywords = [
            "weak", "missing", "lacking", "poor", "insufficient", "needs improvement",
            "inadequate", "unclear", "vague", "generic"
        ]
        
        positive_count = sum(1 for kw in positive_keywords if kw in suggestions_lower)
        negative_count = sum(1 for kw in negative_keywords if kw in suggestions_lower)
        
        # Adjust score based on sentiment
        adjustment = (positive_count - negative_count) * 2  # Each keyword = 2 points
        gemini_score = ml_score + adjustment
        
        # Keep within bounds [0, 100]
        gemini_score = max(0, min(100, gemini_score))
        
        return gemini_score
    
    def _fallback_score(self, resume_text: str, jd_text: str) -> float:
        """
        Simple fallback scoring when neither model is available
        """
        # Basic keyword matching
        resume_words = set(resume_text.lower().split())
        jd_words = set(jd_text.lower().split())
        
        if not jd_words:
            return 50.0
        
        common_words = resume_words & jd_words
        match_ratio = len(common_words) / len(jd_words)
        
        # Convert to 0-100 scale with some baseline
        base_score = 40  # Everyone gets at least 40
        match_score = match_ratio * 60  # Up to 60 more points
        
        return base_score + match_score
    
    def _get_match_level(self, score: float) -> str:
        """Get human-readable match level"""
        if score >= 80:
            return "Excellent Match"
        elif score >= 60:
            return "Good Match"
        elif score >= 40:
            return "Fair Match"
        else:
            return "Needs Improvement"
    
    def _calculate_confidence(self, ml_result: Dict, gemini_result: Dict) -> str:
        """
        Calculate confidence level based on available data sources
        """
        if self.ml_available and gemini_result.get("success"):
            # Both sources agree
            ml_score = ml_result.get("score", 0)
            gemini_score = gemini_result.get("score", 0)
            
            if abs(ml_score - gemini_score) < 10:
                return "High"  # Scores are close
            elif abs(ml_score - gemini_score) < 20:
                return "Medium"  # Moderate difference
            else:
                return "Low"  # Significant difference
        elif self.ml_available:
            return "High"  # ML model is well-trained
        elif gemini_result.get("success"):
            return "Medium"  # AI only
        else:
            return "Low"  # Fallback method


# ============================================
# Singleton instance
# ============================================
_hybrid_scorer = None

def get_hybrid_scorer() -> HybridScorer:
    """Get or create singleton instance of HybridScorer"""
    global _hybrid_scorer
    if _hybrid_scorer is None:
        _hybrid_scorer = HybridScorer()
    return _hybrid_scorer


# ============================================
# Convenience function for backward compatibility
# ============================================
def calculate_hybrid_score(
    resume_text: str,
    jd_text: str,
    skills_resume: str = "",
    skills_jd: str = "",
    years_resume: float = 0.0,
    years_jd: float = 0.0
) -> Dict:
    """
    Calculate hybrid score (70% ML + 30% Gemini)
    
    This is the main function to use in your API endpoints.
    """
    scorer = get_hybrid_scorer()
    return scorer.calculate_hybrid_score(
        resume_text=resume_text,
        jd_text=jd_text,
        skills_resume=skills_resume,
        skills_jd=skills_jd,
        years_resume=years_resume,
        years_jd=years_jd
    )
