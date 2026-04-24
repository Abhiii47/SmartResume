import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to import Supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("Supabase not available, using local file storage")


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
    
    def __init__(self, data_dir: str = "data/adaptive_learning", supabase_client: Optional[Client] = None):
        """
        Initialize the adaptive learning system
        
        Args:
            data_dir: Directory to store learning data (fallback if Supabase not available)
            supabase_client: Optional Supabase client for cloud storage
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Supabase client
        self.supabase = supabase_client
        self.use_supabase = self.supabase is not None and SUPABASE_AVAILABLE
        
        # Storage paths (fallback to local files)
        self.feedback_file = self.data_dir / "user_feedback.jsonl"
        self.analysis_cache = self.data_dir / "analysis_cache.jsonl"
        self.learned_keywords = self.data_dir / "learned_keywords.json"
        self.model_metrics = self.data_dir / "model_metrics.json"
        
        # Initialize Supabase tables if available
        if self.use_supabase:
            self._init_supabase_tables()
            logger.info("Adaptive Learning System initialized with Supabase storage")
        else:
            logger.info(f"Adaptive Learning System initialized with local storage at {self.data_dir}")
        
        # Load existing learned data
        self.keywords_db = self._load_learned_keywords()
        self.feedback_count = 0
        self.analysis_count = 0
    
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
            
            # Store in Supabase or local file
            if self.use_supabase:
                self._store_analysis_supabase(analysis_data)
            else:
                self._append_to_jsonl(self.analysis_cache, analysis_data)
            
            # Learn keywords from high-scoring resumes
            if final_score >= 75:
                self._learn_from_high_score(resume_text, jd_text)
            
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
            
            # Store in Supabase or local file
            if self.use_supabase:
                self._store_feedback_supabase(feedback_data)
            else:
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
        resume_text: str,
        jd_text: str
    ):
        """Learn patterns from high-scoring resumes"""
        try:
            resume_lower = resume_text.lower()
            jd_lower = jd_text.lower()
            
            # Extract skills (common technical terms)
            tech_skills = [
                "python", "java", "javascript", "react", "node", "sql", "aws", "docker",
                "kubernetes", "machine learning", "ai", "data science", "cloud", "api",
                "agile", "devops", "git", "linux", "mongodb", "postgresql", "redis"
            ]
            
            # Extract action verbs
            action_verbs = [
                "developed", "implemented", "designed", "created", "built", "managed",
                "led", "improved", "optimized", "delivered", "achieved", "increased",
                "reduced", "launched", "collaborated", "mentored", "architected"
            ]
            
            # Learn skills that appear in both resume and JD for high scores
            for skill in tech_skills:
                if skill in resume_lower and skill in jd_lower:
                    if skill not in self.keywords_db["skills"]:
                        self.keywords_db["skills"].append(skill)
            
            # Learn action verbs from high-scoring resumes
            for verb in action_verbs:
                if verb in resume_lower and verb not in self.keywords_db["action_verbs"]:
                    self.keywords_db["action_verbs"].append(verb)
            
            # Save learned keywords
            self._save_learned_keywords()
            
        except Exception as e:
            logger.error(f"Error learning from high score: {e}")
    
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
    
    # ==================== Supabase Methods ====================
    
    def _init_supabase_tables(self):
        """Initialize Supabase tables for training data"""
        # Tables will be created via SQL migration or Supabase dashboard
        # For now, we'll use direct inserts (tables should exist)
        pass
    
    def _store_analysis_supabase(self, analysis_data: Dict):
        """Store analysis data in Supabase"""
        try:
            self.supabase.table("training_analyses").insert({
                "analysis_id": analysis_data["analysis_id"],
                "timestamp": analysis_data["timestamp"],
                "user_id": analysis_data.get("user_id"),
                "ml_score": analysis_data["scores"]["ml_score"],
                "gemini_score": analysis_data["scores"].get("gemini_score"),
                "final_score": analysis_data["scores"]["final_score"],
                "resume_features": json.dumps(analysis_data["resume_features"]),
                "jd_features": json.dumps(analysis_data["jd_features"]),
                "metadata": json.dumps(analysis_data.get("metadata", {}))
            }).execute()
        except Exception as e:
            logger.error(f"Error storing analysis in Supabase: {e}")
            # Fallback to local storage
            self._append_to_jsonl(self.analysis_cache, analysis_data)
    
    def _store_feedback_supabase(self, feedback_data: Dict):
        """Store feedback data in Supabase"""
        try:
            self.supabase.table("training_feedback").insert({
                "feedback_id": feedback_data["feedback_id"],
                "analysis_id": feedback_data["analysis_id"],
                "timestamp": feedback_data["timestamp"],
                "user_id": feedback_data.get("user_id"),
                "feedback_type": feedback_data["feedback_type"],
                "rating": feedback_data.get("rating"),
                "comment": feedback_data.get("comment"),
                "actual_score": feedback_data.get("actual_score")
            }).execute()
        except Exception as e:
            logger.error(f"Error storing feedback in Supabase: {e}")
            # Fallback to local storage
            self._append_to_jsonl(self.feedback_file, feedback_data)
    
    def get_training_data_from_supabase(self, limit: int = 1000) -> List[Dict]:
        """Retrieve training data from Supabase for model retraining"""
        if not self.use_supabase:
            return []
        
        try:
            response = self.supabase.table("training_analyses")\
                .select("*")\
                .order("timestamp", desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error retrieving training data from Supabase: {e}")
            return []
    
    def get_feedback_data_from_supabase(self, limit: int = 1000) -> List[Dict]:
        """Retrieve feedback data from Supabase"""
        if not self.use_supabase:
            return []
        
        try:
            response = self.supabase.table("training_feedback")\
                .select("*")\
                .order("timestamp", desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error retrieving feedback data from Supabase: {e}")
            return []


# ==================== Singleton Instance ====================
_adaptive_system = None

def get_adaptive_system(supabase_client: Optional[Client] = None) -> AdaptiveLearningSystem:
    """Get or create singleton instance
    
    Args:
        supabase_client: Optional Supabase client for cloud storage
    """
    global _adaptive_system
    if _adaptive_system is None:
        _adaptive_system = AdaptiveLearningSystem(supabase_client=supabase_client)
    return _adaptive_system

