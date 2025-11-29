"""
Google Gemini AI service for enhanced resume analysis and suggestions.
"""
import os
import json
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Service for interacting with Google Gemini AI to provide:
    1. Enhanced resume scoring
    2. Detailed improvement suggestions
    3. Contextual analysis
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini service."""
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found. Gemini features will be disabled.")
            self.enabled = False
            return
        
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.enabled = True
            logger.info("Gemini service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self.enabled = False
    
    def analyze_resume(
        self,
        resume_text: str,
        jd_text: str,
        ml_score: float,
        score_breakdown: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Analyze resume using Gemini AI and combine with ML model score.
        
        Args:
            resume_text: Resume content
            jd_text: Job description
            ml_score: Score from XGBoost/ML model (0-100)
            score_breakdown: Breakdown of ML scores
            
        Returns:
            Dictionary with enhanced analysis
        """
        if not self.enabled:
            return {
                "gemini_score": None,
                "combined_score": ml_score,
                "ai_suggestions": [],
                "detailed_feedback": None,
                "strengths": [],
                "weaknesses": []
            }
        
        try:
            # Create prompt for Gemini
            prompt = self._create_analysis_prompt(resume_text, jd_text, ml_score, score_breakdown)
            
            # Get Gemini response
            response = self.model.generate_content(prompt)
            
            # Parse response
            analysis = self._parse_gemini_response(response.text)
            
            # Combine scores (weighted average: 60% ML, 40% Gemini)
            combined_score = (ml_score * 0.6) + (analysis.get("gemini_score", ml_score) * 0.4)
            
            return {
                "gemini_score": analysis.get("gemini_score"),
                "combined_score": round(combined_score, 2),
                "ai_suggestions": analysis.get("suggestions", []),
                "detailed_feedback": analysis.get("detailed_feedback"),
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "improvement_areas": analysis.get("improvement_areas", [])
            }
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return {
                "gemini_score": None,
                "combined_score": ml_score,
                "ai_suggestions": [],
                "detailed_feedback": None,
                "strengths": [],
                "weaknesses": []
            }
    
    def _create_analysis_prompt(
        self,
        resume_text: str,
        jd_text: str,
        ml_score: float,
        score_breakdown: Dict[str, float]
    ) -> str:
        """Create a detailed prompt for Gemini analysis."""
        
        # Truncate texts if too long (Gemini has token limits)
        resume_preview = resume_text[:3000] if len(resume_text) > 3000 else resume_text
        jd_preview = jd_text[:2000] if len(jd_text) > 2000 else jd_text
        
        prompt = f"""You are an expert resume reviewer and career advisor. Analyze this resume against the job description and provide detailed feedback.

RESUME (first 3000 chars):
{resume_preview}

JOB DESCRIPTION (first 2000 chars):
{jd_preview}

MACHINE LEARNING SCORE: {ml_score:.1f}/100
Score Breakdown:
- Keyword Match: {score_breakdown.get('keyword_match', 0):.1f}%
- Semantic Similarity: {score_breakdown.get('semantic_similarity', 0):.1f}%
- Skills Match: {score_breakdown.get('skills_match', 0):.1f}%
- Experience Match: {score_breakdown.get('experience_match', 0):.1f}%
- ATS Formatting: {score_breakdown.get('ats_formatting', 0):.1f}%
- Section Completeness: {score_breakdown.get('section_completeness', 0):.1f}%

Please provide a comprehensive analysis in the following JSON format:
{{
    "gemini_score": <your score 0-100>,
    "suggestions": [
        "<specific actionable suggestion 1>",
        "<specific actionable suggestion 2>",
        ...
    ],
    "detailed_feedback": "<2-3 paragraph detailed analysis>",
    "strengths": [
        "<key strength 1>",
        "<key strength 2>",
        ...
    ],
    "weaknesses": [
        "<key weakness 1>",
        "<key weakness 2>",
        ...
    ],
    "improvement_areas": [
        {{
            "area": "<area name>",
            "priority": "<high/medium/low>",
            "suggestion": "<specific improvement>"
        }},
        ...
    ]
}}

Focus on:
1. How well the resume matches the job requirements
2. Specific improvements needed (be actionable)
3. Missing keywords or skills
4. Formatting and ATS compatibility issues
5. Experience level alignment
6. Overall presentation quality

Return ONLY valid JSON, no additional text."""
        
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini's JSON response."""
        try:
            # Try to extract JSON from response
            # Sometimes Gemini adds markdown formatting
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            
            if text.endswith("```"):
                text = text[:-3]
            
            text = text.strip()
            
            # Parse JSON
            analysis = json.loads(text)
            
            # Validate and normalize
            return {
                "gemini_score": float(analysis.get("gemini_score", 0)),
                "suggestions": analysis.get("suggestions", [])[:10],  # Limit to 10
                "detailed_feedback": analysis.get("detailed_feedback", ""),
                "strengths": analysis.get("strengths", [])[:5],
                "weaknesses": analysis.get("weaknesses", [])[:5],
                "improvement_areas": analysis.get("improvement_areas", [])[:8]
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            
            # Fallback: try to extract useful information from text
            return {
                "gemini_score": None,
                "suggestions": self._extract_suggestions_from_text(response_text),
                "detailed_feedback": response_text[:1000],
                "strengths": [],
                "weaknesses": [],
                "improvement_areas": []
            }
    
    def _extract_suggestions_from_text(self, text: str) -> List[str]:
        """Extract suggestions from unstructured text as fallback."""
        suggestions = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                suggestion = line.lstrip('-•* ').strip()
                if len(suggestion) > 20:  # Filter out very short lines
                    suggestions.append(suggestion)
        
        return suggestions[:10]

