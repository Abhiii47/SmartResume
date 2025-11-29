# SmartResume

An AI-powered resume analyzer that provides ATS scores and improvement suggestions using ML models and Gemini AI.

## Features

- ✅ **ATS Scoring**: ML-based resume scoring against job descriptions
- ✅ **AI Suggestions**: Gemini-powered improvement recommendations
- ✅ **Guest Mode**: Try without signing up
- ✅ **User Accounts**: Save and track your resume analyses
- ✅ **Modern UI**: Beautiful, responsive interface

## Quick Start

### Option 1: Start Both Servers (Recommended)

**PowerShell:**
```powershell
.\start-all.ps1
```

**Or double-click:**
```
start-all.bat
```

This starts both backend and frontend in separate windows.

### Option 2: Start Individually

**Backend:**
```powershell
cd backend
venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```powershell
cd frontend
npm start
```

## Access

- **Frontend Dev Server**: http://localhost:3000
- **Backend (with built frontend)**: http://localhost:8000

## Setup

### Backend

1. Create `.env` file in `backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-1.5-flash-latest
DATABASE_URL=sqlite:///./smart_resume.db
SECRET_KEY=your-secret-key-here
```

2. Install dependencies (if needed):
```powershell
cd backend
venv\Scripts\pip.exe install -r requirements.txt
```

### Frontend

1. Install dependencies:
```powershell
cd frontend
npm install
```

2. Build for production:
```powershell
npm run build
```

## Project Structure

```
SmartResume/
├── backend/          # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── auth.py       # Authentication
│   ├── gemini_service.py  # AI suggestions
│   └── scorer_final.py    # ML scoring
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   └── utils.js  # Utilities
│   └── dist/         # Built files
└── start-all.ps1    # Startup script
```

## API Endpoints

- `POST /signup` - Create account
- `POST /login` - Login
- `POST /analyze-resume/` - Analyze resume (requires auth)
- `POST /guest-analyze-resume/` - Guest analysis (no auth)
- `GET /history` - Get analysis history (requires auth)

## Troubleshooting

**Port already in use?**
- The startup scripts automatically handle this
- Or manually: `netstat -ano | findstr :8000` then `taskkill /F /PID <pid>`

**CORS errors?**
- Make sure backend is running
- Use `http://localhost:8000` (backend serves frontend) to avoid CORS

**Gemini API not working?**
- Check your `GEMINI_API_KEY` in `backend/.env`
- Verify `GEMINI_MODEL_NAME` is correct (e.g., `gemini-1.5-flash-latest`)

## License

MIT
