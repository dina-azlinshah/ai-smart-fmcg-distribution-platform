@echo off
echo ========================================
echo Starting Sales Dashboard
echo ========================================
echo.

echo Step 0: Stopping existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

REM --- Detect Python Executable ---
set PYTHON_EXEC=python
if exist "%~dp0venv\Scripts\python.exe" (
    set PYTHON_EXEC="%~dp0venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set PYTHON_EXEC="%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0..\.venv\Scripts\python.exe" (
    set PYTHON_EXEC="%~dp0..\.venv\Scripts\python.exe"
) else if exist "C:\Python314\python.exe" (
    set PYTHON_EXEC=C:\Python314\python.exe
)

echo Step 1: Starting Backend Server...
cd /d "%~dp0backend"
start "Sales Dashboard Backend" /MIN %PYTHON_EXEC% main.py
echo Backend server starting on http://localhost:8001
echo.

echo Step 2: Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul
echo.

echo Step 3: Starting Frontend Server...
cd /d "%~dp0frontend"
start "Sales Dashboard Frontend" /MIN npm run dev
echo Frontend server starting...
echo.

echo Step 4: Waiting 10 seconds for frontend to initialize...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo Opening Sales Dashboard in browser...
echo ========================================
start http://localhost:5173

echo.
echo Sales Dashboard is now running!
echo - Backend: http://localhost:8001
echo - Frontend: http://localhost:5173
echo.
echo You can close this window. The servers will continue running in minimized windows.
pause
