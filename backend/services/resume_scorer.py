import re
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer, util
import logging

logger = logging.getLogger(__name__)


@dataclass
class ScoreComponents:
    """Individual scoring components for transparency."""
    keyword_match: float  # 0-100
    semantic_similarity: float  # 0-100
    skills_match: float  # 0-100
    experience_match: float  # 0-100
    ats_formatting: float  # 0-100
    section_completeness: float  # 0-100
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "keyword_match": round(self.keyword_match, 2),
            "semantic_similarity": round(self.semantic_similarity, 2),
            "skills_match": round(self.skills_match, 2),
            "experience_match": round(self.experience_match, 2),
            "ats_formatting": round(self.ats_formatting, 2),
            "section_completeness": round(self.section_completeness, 2)
        }


class ResumeScorer:
    """
    Advanced resume scoring engine combining multiple techniques:
    1. Keyword frequency matching (like ATS systems)
    2. Semantic similarity using transformers
    3. Skills extraction and matching
    4. Experience level assessment
    5. ATS-friendly formatting checks
    6. Resume section completeness
    """
    
    # Scoring weights (tuned for best results)
    WEIGHTS = {
        'keyword_match': 0.25,
        'semantic_similarity': 0.20,
        'skills_match': 0.25,
        'experience_match': 0.10,
        'ats_formatting': 0.10,
        'section_completeness': 0.10
    }
    
    # Required resume sections
    REQUIRED_SECTIONS = [
        'experience', 'education', 'skills', 
        'summary', 'objective', 'work', 'employment'
    ]
    
    # Common skills database (extend this based on your industry)
    COMMON_SKILLS = {
        'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust'],
        'web': ['react', 'angular', 'vue', 'html', 'css', 'node.js', 'django', 'flask', 'fastapi', 'express'],
        'data': ['sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'pandas', 'numpy', 'scikit-learn'],
        'ml': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'nlp', 'computer vision'],
        'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd'],
        'tools': ['git', 'jira', 'agile', 'scrum', 'rest api', 'graphql', 'microservices'],
        'soft': ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'project management']
    }
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", use_gemini: bool = True):
        """Initialize the scorer with sentence transformer model."""
        try:
            self.embedder = SentenceTransformer(model_name)
            logger.info(f"Loaded embedding model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
        
        # Initialize Gemini service if requested
        self.gemini_service = None
        if use_gemini:
            try:
                from services.gemini_service import GeminiService
                self.gemini_service = GeminiService()
                if self.gemini_service.enabled:
                    logger.info("Gemini AI service enabled")
                else:
                    logger.info("Gemini AI service disabled (no API key)")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini service: {e}")
                self.gemini_service = None
    
    def score(
        self,
        resume_text: str,
        jd_text: str,
        skills_resume: str = "",
        skills_jd: str = "",
        years_resume: float = 0.0,
        years_jd: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive resume score.
        
        Args:
            resume_text: Full resume text
            jd_text: Job description text
            skills_resume: Comma-separated skills from resume
            skills_jd: Comma-separated required skills
            years_resume: Years of experience in resume
            years_jd: Required years of experience
            
        Returns:
            Dictionary with overall score, breakdown, and recommendations
        """
        # Validate inputs
        if not resume_text or len(resume_text.strip()) < 50:
            raise ValueError("Resume text is too short or empty")
        
        if not jd_text or len(jd_text.strip()) < 20:
            raise ValueError("Job description is too short or empty")
        
        # Calculate individual components
        components = ScoreComponents(
            keyword_match=self._calculate_keyword_match(resume_text, jd_text),
            semantic_similarity=self._calculate_semantic_similarity(resume_text, jd_text),
            skills_match=self._calculate_skills_match(skills_resume, skills_jd, resume_text, jd_text),
            experience_match=self._calculate_experience_match(years_resume, years_jd, resume_text, jd_text),
            ats_formatting=self._calculate_ats_score(resume_text),
            section_completeness=self._calculate_section_completeness(resume_text)
        )
        
        # Calculate weighted overall score (ML model score)
        ml_score = sum(
            getattr(components, key) * weight 
            for key, weight in self.WEIGHTS.items()
        )
        
        # Generate base recommendations
        base_recommendations = self._generate_recommendations(components, resume_text, jd_text)
        
        # Get Gemini AI analysis if available
        gemini_analysis = {}
        final_score = ml_score
        all_recommendations = base_recommendations.copy()
        
        if self.gemini_service and self.gemini_service.enabled:
            try:
                gemini_analysis = self.gemini_service.analyze_resume(
                    resume_text=resume_text,
                    jd_text=jd_text,
                    ml_score=ml_score,
                    score_breakdown=components.to_dict()
                )
                
                # Use combined score if Gemini provided one
                if gemini_analysis.get("combined_score"):
                    final_score = gemini_analysis["combined_score"]
                
                # Merge AI suggestions with base recommendations
                ai_suggestions = gemini_analysis.get("ai_suggestions", [])
                if ai_suggestions:
                    # Combine and deduplicate
                    all_recommendations = base_recommendations + ai_suggestions
                    # Remove duplicates while preserving order
                    seen = set()
                    unique_recommendations = []
                    for rec in all_recommendations:
                        rec_lower = rec.lower()
                        if rec_lower not in seen:
                            seen.add(rec_lower)
                            unique_recommendations.append(rec)
                    all_recommendations = unique_recommendations[:15]  # Limit to 15
                
            except Exception as e:
                logger.error(f"Gemini analysis failed: {e}")
                gemini_analysis = {}
        
        return {
            "overall_score": round(final_score, 2),
            "ml_score": round(ml_score, 2),  # Original ML score
            "score_breakdown": components.to_dict(),
            "recommendations": all_recommendations,
            "match_level": self._get_match_level(final_score),
            "missing_keywords": self._get_missing_keywords(resume_text, jd_text)[:10],
            # Gemini AI enhancements
            "ai_analysis": {
                "enabled": bool(gemini_analysis),
                "gemini_score": gemini_analysis.get("gemini_score"),
                "combined_score": gemini_analysis.get("combined_score"),
                "detailed_feedback": gemini_analysis.get("detailed_feedback"),
                "strengths": gemini_analysis.get("strengths", []),
                "weaknesses": gemini_analysis.get("weaknesses", []),
                "improvement_areas": gemini_analysis.get("improvement_areas", [])
            } if gemini_analysis else None
        }
    
    def _calculate_keyword_match(self, resume_text: str, jd_text: str) -> float:
        """
        Calculate keyword match score (ATS-style matching).
        Measures how many important keywords from JD appear in resume.
        """
        resume_lower = resume_text.lower()
        jd_lower = jd_text.lower()
        
        # Extract keywords from JD (nouns, proper nouns, important terms)
        jd_keywords = self._extract_keywords(jd_text)
        
        if not jd_keywords:
            return 50.0  # Neutral score if no keywords
        
        # Count matches
        matches = sum(1 for kw in jd_keywords if kw.lower() in resume_lower)
        
        # Calculate match percentage
        match_rate = (matches / len(jd_keywords)) * 100
        
        # Bonus for exact phrase matches
        exact_phrases = self._extract_phrases(jd_text)
        exact_matches = sum(1 for phrase in exact_phrases if phrase.lower() in resume_lower)
        
        if exact_phrases:
            phrase_bonus = (exact_matches / len(exact_phrases)) * 10
            match_rate = min(100, match_rate + phrase_bonus)
        
        return match_rate
    
    def _calculate_semantic_similarity(self, resume_text: str, jd_text: str) -> float:
        """
        Calculate semantic similarity using sentence embeddings.
        Captures meaning beyond exact keyword matches.
        """
        try:
            # Encode texts
            resume_embedding = self.embedder.encode(resume_text, convert_to_tensor=True)
            jd_embedding = self.embedder.encode(jd_text, convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.cos_sim(resume_embedding, jd_embedding)
            score = float(similarity.cpu().numpy()[0][0])
            
            # Convert to 0-100 scale
            return max(0, min(100, score * 100))
            
        except Exception as e:
            logger.error(f"Semantic similarity calculation failed: {e}")
            return 50.0  # Neutral score on error
    
    def _calculate_skills_match(
        self, 
        skills_resume: str, 
        skills_jd: str,
        resume_text: str,
        jd_text: str
    ) -> float:
        """
        Calculate skills match score.
        Combines explicit skill lists and extracted skills from text.
        """
        # Parse explicit skills
        resume_skills_explicit = self._parse_skills(skills_resume)
        jd_skills_explicit = self._parse_skills(skills_jd)
        
        # Extract skills from text
        resume_skills_extracted = self._extract_skills_from_text(resume_text)
        jd_skills_extracted = self._extract_skills_from_text(jd_text)
        
        # Combine both sources
        resume_skills_all = resume_skills_explicit | resume_skills_extracted
        jd_skills_all = jd_skills_explicit | jd_skills_extracted
        
        if not jd_skills_all:
            return 70.0  # Neutral score if no required skills specified
        
        # Calculate overlap
        matched_skills = resume_skills_all & jd_skills_all
        match_rate = (len(matched_skills) / len(jd_skills_all)) * 100
        
        # Penalty for too few skills in resume
        if len(resume_skills_all) < 3:
            match_rate *= 0.7  # 30% penalty
        
        return min(100, match_rate)
    
    def _calculate_experience_match(
        self,
        years_resume: float,
        years_jd: float,
        resume_text: str,
        jd_text: str
    ) -> float:
        """
        Calculate experience level match.
        Extracts years from text if not provided explicitly.
        """
        # Extract years from text if not provided
        if years_resume == 0.0:
            years_resume = self._extract_years_experience(resume_text)
        
        if years_jd == 0.0:
            years_jd = self._extract_years_experience(jd_text)
        
        # If no experience requirement, neutral score
        if years_jd == 0.0:
            return 75.0
        
        # Calculate match
        if years_resume >= years_jd:
            # Meets or exceeds requirement
            if years_resume <= years_jd * 1.5:
                return 100.0  # Perfect match
            else:
                return 90.0  # Overqualified (slight penalty)
        else:
            # Under-qualified
            gap_ratio = years_resume / years_jd
            return max(30, gap_ratio * 100)  # Minimum 30% score
    
    def _calculate_ats_score(self, resume_text: str) -> float:
        """
        Calculate ATS compatibility score.
        Checks for formatting that ATS systems can parse.
        """
        score = 100.0
        
        # Check for proper formatting elements
        checks = {
            'has_email': bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text)),
            'has_phone': bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text)),
            'has_bullets': ('•' in resume_text or '-' in resume_text or '*' in resume_text),
            'has_dates': bool(re.search(r'\b(19|20)\d{2}\b', resume_text)),
            'reasonable_length': 500 <= len(resume_text) <= 5000,
            'has_sections': any(section in resume_text.lower() for section in self.REQUIRED_SECTIONS)
        }
        
        # Deduct points for missing elements
        for check, passed in checks.items():
            if not passed:
                score -= 15
        
        # Penalties for ATS-unfriendly elements
        if len(re.findall(r'[^\x00-\x7F]', resume_text)) > 20:
            score -= 10  # Too many special characters
        
        if resume_text.count('\n\n') < 3:
            score -= 10  # Poor formatting/structure
        
        return max(0, min(100, score))
    
    def _calculate_section_completeness(self, resume_text: str) -> float:
        """
        Check if resume has all essential sections.
        """
        resume_lower = resume_text.lower()
        
        essential_sections = ['experience', 'education', 'skills']
        optional_sections = ['summary', 'objective', 'projects', 'certifications']
        
        essential_found = sum(1 for s in essential_sections if s in resume_lower)
        optional_found = sum(1 for s in optional_sections if s in resume_lower)
        
        # Essential sections are worth 70%, optional 30%
        essential_score = (essential_found / len(essential_sections)) * 70
        optional_score = (optional_found / len(optional_sections)) * 30
        
        return essential_score + optional_score
    
    def _extract_keywords(self, text: str, min_word_length: int = 4) -> List[str]:
        """Extract important keywords from text."""
        # Remove common stop words
        stop_words = {
            'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
            'will', 'would', 'should', 'could', 'about', 'into', 'through'
        }
        
        # Split into words and filter
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [
            w for w in words 
            if len(w) >= min_word_length and w not in stop_words
        ]
        
        # Get unique keywords with frequency > 1
        keyword_freq = {}
        for kw in keywords:
            keyword_freq[kw] = keyword_freq.get(kw, 0) + 1
        
        # Return keywords that appear at least twice
        return [kw for kw, freq in keyword_freq.items() if freq >= 2]
    
    def _extract_phrases(self, text: str) -> List[str]:
        """Extract 2-3 word phrases that might be important."""
        # Extract common phrases (technologies, job titles, etc.)
        phrases = []
        
        # Simple bigram and trigram extraction
        words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        phrases.extend(words)
        
        # Look for quoted phrases
        quoted = re.findall(r'"([^"]+)"', text)
        phrases.extend(quoted)
        
        return list(set(phrases))[:20]  # Return unique phrases, max 20
    
    def _parse_skills(self, skills_str: str) -> set:
        """Parse comma-separated skills string."""
        if not skills_str:
            return set()
        return {s.strip().lower() for s in skills_str.split(',') if s.strip()}
    
    def _extract_skills_from_text(self, text: str) -> set:
        """Extract known skills from text using skill database."""
        text_lower = text.lower()
        found_skills = set()
        
        for category, skills in self.COMMON_SKILLS.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills.add(skill)
        
        return found_skills
    
    def _extract_years_experience(self, text: str) -> float:
        """Extract years of experience from text."""
        # Look for patterns like "5 years", "5+ years", "5-7 years"
        patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)\s*-\s*\d+\s*years?',
            r'experience:\s*(\d+)',
        ]
        
        max_years = 0.0
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                for match in matches:
                    try:
                        years = float(match)
                        max_years = max(max_years, years)
                    except ValueError:
                        continue
        
        return max_years
    
    def _generate_recommendations(
        self,
        components: ScoreComponents,
        resume_text: str,
        jd_text: str
    ) -> List[str]:
        """Generate actionable recommendations based on scores."""
        recommendations = []
        
        if components.keyword_match < 60:
            recommendations.append(
                "Add more relevant keywords from the job description. "
                "Focus on technical skills and job requirements mentioned."
            )
        
        if components.skills_match < 50:
            recommendations.append(
                "Highlight more skills that match the job requirements. "
                "Add a dedicated 'Skills' section if missing."
            )
        
        if components.ats_formatting < 70:
            recommendations.append(
                "Improve ATS compatibility: Use standard section headers, "
                "include contact information, and use bullet points."
            )
        
        if components.section_completeness < 70:
            recommendations.append(
                "Add missing sections: Consider including Experience, Education, "
                "Skills, and a Summary/Objective."
            )
        
        if components.experience_match < 60:
            recommendations.append(
                "Emphasize your years of experience more clearly. "
                "Include dates in your work history."
            )
        
        if not recommendations:
            recommendations.append(
                "Great job! Your resume is well-matched to this position. "
                "Consider customizing your summary for even better results."
            )
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _get_match_level(self, score: float) -> str:
        """Get human-readable match level."""
        if score >= 80:
            return "Excellent Match"
        elif score >= 60:
            return "Good Match"
        elif score >= 40:
            return "Fair Match"
        else:
            return "Needs Improvement"
    
    def _get_missing_keywords(self, resume_text: str, jd_text: str) -> List[str]:
        """Identify important keywords missing from resume."""
        jd_keywords = set(self._extract_keywords(jd_text))
        resume_keywords = set(self._extract_keywords(resume_text))
        
        missing = jd_keywords - resume_keywords
        
        # Prioritize by frequency in JD
        jd_lower = jd_text.lower()
        missing_with_freq = [(kw, jd_lower.count(kw)) for kw in missing]
        missing_with_freq.sort(key=lambda x: x[1], reverse=True)
        
        return [kw for kw, _ in missing_with_freq]


