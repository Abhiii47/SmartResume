import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_resume.db").strip()
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-to-something-secure").strip()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()

    # LLM Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").strip() # options: gemini, groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS", 
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:8000,https://smart-resume-orcin.vercel.app,https://smart-resume-frontend.vercel.app,https://smart-resume-main.vercel.app"
        ).split(",")
        if origin.strip()
    ]
    
    # Allow all common local network IP patterns and any Vercel preview deployments
    ALLOWED_ORIGIN_REGEX: str | None = os.getenv(
        "ALLOWED_ORIGIN_REGEX", 
        r"https://smart-resume-.*\.vercel\.app|https://.*\.vercel\.app|http://192\.168\.\d+\.\d+:\d+|http://10\.\d+\.\d+\.\d+:\d+|http://172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+"
    )

    def validate(self):
        """Basic validation of critical settings"""
        if not self.GEMINI_API_KEY:
            print("CRITICAL WARNING: GEMINI_API_KEY is not set. AI analysis will fail.")
        if "sqlite" in self.DATABASE_URL and os.getenv("RAILWAY_ENVIRONMENT"):
            print("WARNING: Using SQLite on Railway. Data will NOT persist between restarts.")
        print(f"CORS: Allowed {len(self.ALLOWED_ORIGINS)} origins and regex pattern")

settings = Settings()
settings.validate()