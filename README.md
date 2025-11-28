# SmartResume

SmartResume is a lightweight ATS-style resume analyzer that pairs a FastAPI backend with a Parcel-powered React frontend. Upload a resume PDF, paste a job description, list your skills and years of experience, and the app returns an ATS score plus a short preview of the extracted resume text.

## Project Structure

- `backend/`: FastAPI app, PDF parser, and SentBERT-based scoring pipeline.
- `frontend/`: React single-page app served by Parcel.

## Prerequisites

- Python 3.11+ (ships with the supplied virtual environment in `backend/venv`).
- Node.js 18+ (for the frontend dev server).

## Backend Setup

```powershell
cd backend
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

This provides `POST /analyze-resume/` which expects:

- `file`: PDF resume (`multipart/form-data`)
- `jd`: Job description text
- `skills`: Optional comma-separated skills
- `years`: Optional numeric years of experience

## Frontend Setup

```powershell
cd frontend
npm install
npm run start
```

Parcel serves the UI at `http://localhost:3000`, already configured to call the backend at `http://127.0.0.1:8000`.

## Usage

1. Start the backend, then the frontend.
2. Open `http://localhost:3000`.
3. Upload a PDF resume, paste the job description, add your skills/experience.
4. Click **Analyze** to view the ATS score and preview text.

## Deployment Notes

- For production, build the frontend via `npm run build` and host with any static site service.
- Host the FastAPI app with `uvicorn`/`gunicorn` behind a reverse proxy; copy the `backend/models` directory alongside the app so the pretrained scaler and classifier load correctly.
- Update the frontend Axios URL in `frontend/src/App.js` if the backend runs on a different host/port.

