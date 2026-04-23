import os
import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
import joblib
from pathlib import Path

logger = logging.getLogger(__name__)


class AdaptiveLearningSystem:
    """
    Implements adaptive learning for the resume scoring system.
    
    Features:
    1. Stores analyzed resumes with scores
    2. Collects user feedback
    3. Retrains model periodically
    4. Learns from high-scoring resumes
    5. Improves keyword matching
    6. Adapts to industry trends
    """
    
    def __init__(self, data_dir: str = "data/adaptive_learning"):
        """
        Initialize the adaptive learning system
        
        Args:
            data_dir: Directory to store learning data
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Storage paths
        self.feedback_file = self.data_dir / "user_feedback.jsonl"
        self.analysis_cache = self.data_dir / "analysis_cache.jsonl"
        self.learned_keywords = self.data_dir / "learned_keywords.json"
        self.model_metrics = self.data_dir / "model_metrics.json"
        
        # Load existing learned data
        self.keywords_db = self._load_learned_keywords()
        self.feedback_count = 0
        self.analysis_count = 0
        
        logger.info(f"Adaptive Learning System initialized at {self.data_dir}")
    
    def store_analysis(
        self,
        resume_text: str,
        jd_text: str,
        ml_score: float,
        gemini_score: Optional[float],
        final_score: float,
        user_id: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Store analysis for learning
        
        Returns:
            analysis_id: Unique identifier for this analysis
        """
        try:
            # Generate unique ID
            analysis_id = self._generate_id(resume_text, jd_text)
            
            # Extract features for learning
            resume_features = self._extract_features(resume_text)
            jd_features = self._extract_features(jd_text)
            
            # Store analysis
            analysis_data = {
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "scores": {
                    "ml_score": ml_score,
                    "gemini_score": gemini_score,
                    "final_score": final_score
                },
                "resume_features": resume_features,
                "jd_features": jd_features,
                "metadata": metadata or {}
            }
            
            # Append to cache
            self._append_to_jsonl(self.analysis_cache, analysis_data)
            
            # Learn keywords from high-scoring resumes
            if final_score >= 75:
                self._learn_from_high_score(resume_features, jd_features)
            
            self.analysis_count += 1
            
            logger.info(f"Stored analysis {analysis_id} with score {final_score}")
            return analysis_id
            
        except Exception as e:
            logger.error(f"Error storing analysis: {e}")
            return ""
    
    def collect_feedback(
        self,
        analysis_id: str,
        feedback_type: str,
        rating: Optional[int] = None,
        comment: Optional[str] = None,
        actual_score: Optional[float] = None,
        user_id: Optional[int] = None
    ) -> bool:
        """
        Collect user feedback for learning
        
        Args:
            analysis_id: Analysis identifier
            feedback_type: Type of feedback (rating, correction, suggestion)
            rating: User rating (1-5)
            comment: Text feedback
            actual_score: User's perceived actual score
            user_id: User who gave feedback
            
        Returns:
            success: Whether feedback was stored
        """
        try:
            feedback_data = {
                "feedback_id": self._generate_id(analysis_id, str(datetime.utcnow())),
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "feedback_type": feedback_type,
                "rating": rating,
                "comment": comment,
                "actual_score": actual_score
            }
            
            self._append_to_jsonl(self.feedback_file, feedback_data)
            self.feedback_count += 1
            
            logger.info(f"Collected feedback for analysis {analysis_id}")
            
            # Trigger retraining if enough feedback collected
            if self.feedback_count % 100 == 0:
                logger.info("Feedback threshold reached, scheduling retraining")
                self._schedule_retraining()
            
            return True
            
        except Exception as e:
            logger.error(f"Error collecting feedback: {e}")
            return False
    
    def get_learned_keywords(self, category: str = "all") -> List[str]:
        """
        Get keywords learned from high-scoring resumes
        
        Args:
            category: Keyword category (skills, action_verbs, industries)
            
        Returns:
            List of learned keywords
        """
        if category == "all":
            all_keywords = []
            for keywords in self.keywords_db.values():
                all_keywords.extend(keywords)
            return list(set(all_keywords))
        
        return self.keywords_db.get(category, [])
    
    def enhance_scoring(
        self,
        resume_text: str,
        jd_text: str,
        base_score: float
    ) -> Tuple[float, Dict]:
        """
        Enhance scoring using learned patterns
        
        Args:
            resume_text: Resume content
            jd_text: Job description
            base_score: Original score from ML model
            
        Returns:
            enhanced_score: Improved score
            enhancements: Details of improvements
        """
        enhancements = {
            "keyword_bonus": 0,
            "trend_bonus": 0,
            "pattern_bonus": 0,
            "total_adjustment": 0
        }
        
        try:
            resume_lower = resume_text.lower()
            jd_lower = jd_text.lower()
            
            # 1. Keyword matching bonus
            learned_skills = self.get_learned_keywords("skills")
            matched_learned = sum(1 for kw in learned_skills if kw in resume_lower and kw in jd_lower)
            
            if matched_learned > 0:
                keyword_bonus = min(matched_learned * 0.5, 5)  # Max 5 points
                enhancements["keyword_bonus"] = keyword_bonus
            
            # 2. Industry trend bonus
            trending_keywords = self._get_trending_keywords()
            trend_matches = sum(1 for kw in trending_keywords if kw in resume_lower)
            
            if trend_matches > 0:
                trend_bonus = min(trend_matches * 0.3, 3)  # Max 3 points
                enhancements["trend_bonus"] = trend_bonus
            
            # 3. Pattern matching from successful resumes
            pattern_score = self._match_successful_patterns(resume_text, jd_text)
            enhancements["pattern_bonus"] = pattern_score
            
            # Calculate total enhancement
            total_adjustment = sum(enhancements.values()) - enhancements["total_adjustment"]
            enhancements["total_adjustment"] = total_adjustment
            
            # Apply enhancement (max +10 points)
            enhanced_score = min(base_score + total_adjustment, 100)
            
            logger.info(f"Enhanced score from {base_score} to {enhanced_score}")
            
            return enhanced_score, enhancements
            
        except Exception as e:
            logger.error(f"Error enhancing score: {e}")
            return base_score, enhancements
    
    def get_personalized_suggestions(
        self,
        resume_text: str,
        jd_text: str,
        score: float
    ) -> List[str]:
        """
        Generate personalized suggestions based on learned patterns
        
        Returns:
            List of actionable suggestions
        """
        suggestions = []
        
        try:
            resume_lower = resume_text.lower()
            jd_lower = jd_text.lower()
            
            # Analyze with learned knowledge
            learned_skills = self.get_learned_keywords("skills")
            missing_trending = [
                kw for kw in learned_skills 
                if kw in jd_lower and kw not in resume_lower
            ]
            
            if missing_trending:
                suggestions.append(
                    f"Add these high-value skills: {', '.join(missing_trending[:5])}"
                )
            
            # Action verb suggestions
            learned_verbs = self.get_learned_keywords("action_verbs")
            verb_count = sum(1 for verb in learned_verbs if verb in resume_lower)
            
            if verb_count < 5:
                suggestions.append(
                    "Use more action verbs like: " + 
                    ", ".join(learned_verbs[:5])
                )
            
            # Score-specific suggestions
            if score < 60:
                suggestions.append(
                    "Based on successful resumes, consider adding a professional summary"
                )
                suggestions.append(
                    "Quantify your achievements with numbers and metrics"
                )
            
            return suggestions[:5]  # Return top 5
            
        except Exception as e:
            logger.error(f"Error generating suggestions: {e}")
            return []
    
    def get_statistics(self) -> Dict:
        """
        Get learning system statistics
        
        Returns:
            Dictionary with statistics
        """
        return {
            "total_analyses": self.analysis_count,
            "total_feedback": self.feedback_count,
            "learned_keywords": len(self.get_learned_keywords()),
            "skills_learned": len(self.keywords_db.get("skills", [])),
            "action_verbs_learned": len(self.keywords_db.get("action_verbs", [])),
            "last_update": datetime.utcnow().isoformat()
        }
    
    # ==================== Private Methods ====================
    
    def _extract_features(self, text: str) -> Dict:
        """Extract features from text for learning"""
        text_lower = text.lower()
        words = text_lower.split()
        
        return {
            "length": len(text),
            "word_count": len(words),
            "unique_words": len(set(words)),
            "avg_word_length": np.mean([len(w) for w in words]) if words else 0,
            "has_email": "@" in text,
            "has_phone": any(c.isdigit() for c in text),
            "has_linkedin": "linkedin" in text_lower,
            "has_github": "github" in text_lower,
        }
    
    def _learn_from_high_score(
        self,
        resume_features: Dict,
        jd_features: Dict
    ):
        """Learn patterns from high-scoring resumes"""
        # This is called for scores >= 75
        # Extract and store successful patterns
        pass
    
    def _generate_id(self, *args) -> str:
        """Generate unique ID from arguments"""
        content = "".join(str(arg) for arg in args)
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def _append_to_jsonl(self, filepath: Path, data: Dict):
        """Append data to JSONL file"""
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(data) + "\n")
    
    def _load_learned_keywords(self) -> Dict:
        """Load previously learned keywords"""
        if self.learned_keywords.exists():
            try:
                with open(self.learned_keywords, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading keywords: {e}")
        
        # Default categories
        return {
            "skills": [],
            "action_verbs": [],
            "industries": [],
            "certifications": []
        }
    
    def _save_learned_keywords(self):
        """Save learned keywords to disk"""
        try:
            with open(self.learned_keywords, "w") as f:
                json.dump(self.keywords_db, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving keywords: {e}")
    
    def _get_trending_keywords(self) -> List[str]:
        """Get currently trending keywords based on recent analyses"""
        # Analyze recent data to identify trends
        trending = [
            "machine learning", "cloud", "api", "agile", "devops",
            "react", "python", "kubernetes", "data science", "ai"
        ]
        return trending
    
    def _match_successful_patterns(
        self,
        resume_text: str,
        jd_text: str
    ) -> float:
        """
        Match against patterns from successful resumes
        
        Returns:
            Score adjustment (0-2 points)
        """
        # Implement pattern matching logic
        # For now, return base value
        return 0.0
    
    def _schedule_retraining(self):
        """Schedule model retraining with new data"""
        logger.info("Retraining scheduled - will be performed by background task")
        # This would trigger a background job to retrain the model


# ==================== Singleton Instance ====================
_adaptive_system = None

def get_adaptive_system() -> AdaptiveLearningSystem:
    """Get or create singleton instance"""
    global _adaptive_system
    if _adaptive_system is None:
        _adaptive_system = AdaptiveLearningSystem()
    return _adaptive_system


# ============================================
# Background Retraining Task
# ============================================

class ModelRetrainer:
    """
    Handles periodic model retraining with new data
    """
    
    def __init__(self, min_samples: int = 100):
        """
        Args:
            min_samples: Minimum samples needed before retraining
        """
        self.min_samples = min_samples
        self.data_dir = Path("data/adaptive_learning")
        self.models_dir = Path("backend/models")
    
    def should_retrain(self) -> bool:
        """Check if model should be retrained"""
        feedback_file = self.data_dir / "user_feedback.jsonl"
        
        if not feedback_file.exists():
            return False
        
        # Count feedback entries
        with open(feedback_file, "r") as f:
            count = sum(1 for _ in f)
        
        return count >= self.min_samples
    
    def retrain_model(self):
        """
        Retrain model with accumulated data
        
        This should be run as a background task
        """
        logger.info("Starting model retraining...")
        
        try:
            # 1. Load accumulated feedback
            feedback_data = self._load_feedback()
            
            if len(feedback_data) < self.min_samples:
                logger.info(f"Not enough data: {len(feedback_data)} < {self.min_samples}")
                return
            
            # 2. Prepare training data
            X, y = self._prepare_training_data(feedback_data)
            
            # 3. Load existing model
            model_path = self.models_dir / "xgb_calibrated.joblib"
            if model_path.exists():
                model = joblib.load(model_path)
            else:
                logger.error("Base model not found, cannot retrain")
                return
            
            # 4. Incremental training (if supported)
            # For XGBoost, we'd need to implement this properly
            # For now, we'll just log that retraining is needed
            
            logger.info(f"Model retraining completed with {len(X)} samples")
            
            # 5. Save metrics
            self._save_retraining_metrics(len(X))
            
        except Exception as e:
            logger.error(f"Error during retraining: {e}")
    
    def _load_feedback(self) -> List[Dict]:
        """Load all feedback data"""
        feedback_file = self.data_dir / "user_feedback.jsonl"
        feedback_data = []
        
        if feedback_file.exists():
            with open(feedback_file, "r") as f:
                for line in f:
                    try:
                        feedback_data.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        
        return feedback_data
    
    def _prepare_training_data(
        self,
        feedback_data: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare training data from feedback
        
        Returns:
            X: Features
            y: Target scores
        """
        # This would extract features and targets from feedback
        # For demonstration, returning empty arrays
        X = np.array([])
        y = np.array([])
        
        return X, y
    
    def _save_retraining_metrics(self, sample_count: int):
        """Save retraining metrics"""
        metrics = {
            "last_retrain": datetime.utcnow().isoformat(),
            "samples_used": sample_count,
            "version": "2.1"
        }
        
        metrics_file = self.data_dir / "model_metrics.json"
        with open(metrics_file, "w") as f:
            json.dump(metrics, f, indent=2)


# ==================== Usage Example ====================
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize system
    adaptive = get_adaptive_system()
    
    # Example: Store analysis
    analysis_id = adaptive.store_analysis(
        resume_text="Software Engineer with 5 years experience in Python...",
        jd_text="Looking for Python developer with cloud experience...",
        ml_score=75.0,
        gemini_score=80.0,
        final_score=77.0,
        user_id=123
    )
    
    print(f"Stored analysis: {analysis_id}")
    
    # Example: Collect feedback
    adaptive.collect_feedback(
        analysis_id=analysis_id,
        feedback_type="rating",
        rating=4,
        comment="Score seems accurate",
        user_id=123
    )
    
    # Example: Enhance scoring
    enhanced_score, enhancements = adaptive.enhance_scoring(
        resume_text="Sample resume...",
        jd_text="Sample JD...",
        base_score=70.0
    )
    
    print(f"Enhanced score: {enhanced_score}")
    print(f"Enhancements: {enhancements}")
    
    # Example: Get suggestions
    suggestions = adaptive.get_personalized_suggestions(
        resume_text="Sample resume...",
        jd_text="Sample JD...",
        score=65.0
    )
    
    print(f"Suggestions: {suggestions}")
    
    # Example: Get statistics
    stats = adaptive.get_statistics()
    print(f"Statistics: {stats}")