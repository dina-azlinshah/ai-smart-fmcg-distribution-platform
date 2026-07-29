@echo off
echo ==========================================
echo  Push Sales Dashboard to GitHub
echo ==========================================
echo.
echo Step 1: Checking git status...
cd /d "%~dp0"
git status
echo.
echo Step 2: Adding all files...
git add frontend/src/
git add backend/
git add *.bat
git add *.py
git add *.txt
git add *.json
git add *.html
git add .env 2>nul
echo.
echo Step 3: Committing changes...
git commit -m "Update DemoFeatures with full navigation and mock data"
echo.
echo Step 4: Pushing to GitHub...
git push origin dina-unyee
echo.
echo ==========================================
echo  Done! Check your GitHub repository.
echo ==========================================
pause
