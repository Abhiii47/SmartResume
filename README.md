# SmartResume - AI-Powered Resume Analyzer

SmartResume is an advanced, AI-driven application designed to help job seekers optimize their resumes for Applicant Tracking Systems (ATS) and human recruiters. It combines **Classical Machine Learning (XGBoost)** with **Generative AI (Google Gemini)** to provide a holistic score and actionable feedback.



## 🚀 Key Features

*   **Hybrid Scoring Engine**:
    *   **Quantitative Analysis (70%)**: Powered by an XGBoost model trained on 50k+ resumes to evaluate structure, keyword optimization, and formatting.
    *   **Qualitative Analysis (30%)**: Uses Google Gemini Pro to assess "soft" metrics like tone, impact, and language clarity.
*   **Adaptive Learning System**: A self-improving engine that learns new trending skills from high-scoring resumes and adjusts its criteria dynamically over time.
*   **Real-time Feedback**: Instant, actionable suggestions to improve your ATS score.
*   **Premium UI/UX**: A monochrome, professional design with high-end animations (Framer Motion, GSAP).
*   **Secure & Private**: Implements OAuth2 authentication and secure PDF storage via Supabase.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18
*   **Build Tool**: Parcel
*   **Styling**: TailwindCSS v4
*   **Animations**: Framer Motion, GSAP
*   **Visualization**: Recharts

### Backend
*   **API Framework**: FastAPI (Python)
*   **ML Engine**: XGBoost, Scikit-Learn
*   **GenAI**: Google Gemini Pro API
*   **Database**: Supabase (PostgreSQL)
*   **ORM**: SQLAlchemy
*   **PDF Processing**: PDFMiner.six

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v16+)
*   Python (3.9+)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-resume.git
cd smart-resume
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

**Environment Variables**:
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

**Run the Server**:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory.

```bash
cd ../frontend
npm install
```

**Run the Application**:
```bash
npm start
```
The application will open at `http://localhost:3000`.

## 🧠 How It Works (The "Brain")

1.  **Upload**: User uploads a PDF Resume.
2.  **Parsing**: Backend extracts text using `pdfminer`.
3.  **Feature Extraction**: The system extracts 8 key signals (Keyword Overlap, Semantic Similarity, Experience Gap, etc.).
4.  **XGBoost Prediction**: Returns a probability score (0-70 points).
5.  **Gemini Evaluation**: The AI acts as a recruiter to score Impact and Tone (0-30 points).
6.  **Final Score**: The weighted sum constitutes the final ATS Score.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
