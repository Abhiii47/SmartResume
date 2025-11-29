# How to Set Gemini API Key

## Step 1: Get Your API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 2: Set the API Key

### Method 1: PowerShell (Temporary - for current session only)
Open PowerShell in the backend directory and run:
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
python main.py
```

### Method 2: PowerShell (Permanent - for all sessions)
Open PowerShell as Administrator and run:
```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-api-key-here', 'User')
```
Then restart your terminal/PowerShell.

### Method 3: Windows Environment Variables (GUI)
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables"
3. Under "User variables", click "New"
4. Variable name: `GEMINI_API_KEY`
5. Variable value: `your-api-key-here`
6. Click OK on all dialogs
7. Restart your terminal/PowerShell

### Method 4: Create a .env file (Requires python-dotenv)
1. Create a file named `.env` in the `backend` folder
2. Add this line:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
3. Install python-dotenv: `pip install python-dotenv`
4. Update the code to load .env file

## Step 3: Verify
After setting the key, restart your backend server. You should see in the logs:
- "Gemini service initialized successfully" (if key is valid)
- "GEMINI_API_KEY not found. Gemini features will be disabled." (if key is missing)

## Quick Test
```powershell
# In PowerShell, set the key and run:
$env:GEMINI_API_KEY="your-api-key-here"
python main.py
```

