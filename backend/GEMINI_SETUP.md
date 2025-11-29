# Gemini AI Integration Setup

This application now uses Google Gemini AI to provide enhanced resume analysis and suggestions.

## Setup Instructions

1. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Set the API Key**
   
   **Option 1: Environment Variable (Recommended)**
   ```bash
   # Windows PowerShell
   $env:GEMINI_API_KEY="your-api-key-here"
   
   # Windows CMD
   set GEMINI_API_KEY=your-api-key-here
   
   # Linux/Mac
   export GEMINI_API_KEY=your-api-key-here
   ```

   **Option 2: Create .env file**
   Create a `.env` file in the `backend` directory:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Restart the Backend**
   After setting the API key, restart your backend server.

## How It Works

- **ML Model Score**: The XGBoost model provides a base score (0-100) based on feature analysis
- **Gemini AI Score**: Gemini AI analyzes the resume contextually and provides its own score
- **Combined Score**: Final score = 60% ML Score + 40% Gemini Score
- **AI Suggestions**: Gemini provides detailed, actionable improvement suggestions

## Features

- ✅ Enhanced accuracy through combined ML + AI scoring
- ✅ Detailed contextual feedback
- ✅ Specific improvement areas with priorities
- ✅ Strengths and weaknesses analysis
- ✅ Actionable suggestions for resume improvement

## Fallback Mode

If the Gemini API key is not set, the system will work with just the ML model. You'll see a warning in the logs, but the application will continue to function normally.

