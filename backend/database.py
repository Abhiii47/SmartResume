"""
Database models and session management for Smart Resume Analyzer.
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartresume.db")

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to resume scores
    resume_scores = relationship("ResumeScore", back_populates="user", cascade="all, delete-orphan")


class ResumeScore(Base):
    """Model to store resume analysis scores."""
    __tablename__ = "resume_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Nullable for guest scores
    filename = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    keyword_match = Column(Float)
    semantic_similarity = Column(Float)
    skills_match = Column(Float)
    experience_match = Column(Float)
    ats_formatting = Column(Float)
    section_completeness = Column(Float)
    job_description = Column(Text)
    resume_preview = Column(Text)
    recommendations = Column(Text)  # JSON string of recommendations
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship to user
    user = relationship("User", back_populates="resume_scores")


# Create tables
def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


# Dependency to get DB session
def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

