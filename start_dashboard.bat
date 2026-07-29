@echo off
color 0B
echo ============================================
echo   GPIS Sales Dashboard - Full Startup
echo   Database + Backend + Frontend
echo ============================================
echo.

REM --- Change to the script's own directory ---
cd /d "%~dp0"

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

echo [STEP 1] Stopping ALL old processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 3 /nobreak >nul
echo         Done.
echo.

echo [STEP 2] Clearing Vite cache...
if exist "frontend\node_modules\.vite" (
    rmdir /s /q "frontend\node_modules\.vite" 2>nul
    echo         Cache cleared.
) else (
    echo         No cache found.
)
echo.

echo ============================================
echo   Setting up Database Tables...
echo ============================================
echo.

echo [STEP 3] Running Company Tables setup...
cd /d "%~dp0backend"
%PYTHON_EXEC% setup_company_tables.py
if %ERRORLEVEL% NEQ 0 (
    echo         [WARNING] Company tables had issues, continuing...
) else (
    echo         Company tables ready!
)
echo.

echo [STEP 4] Running Inventory Tables setup...
cd /d "%~dp0backend"
%PYTHON_EXEC% setup_inventory_tables.py
if %ERRORLEVEL% NEQ 0 (
    echo         [WARNING] Inventory tables had issues, continuing...
) else (
    echo         Inventory tables ready!
)
echo.

echo ============================================
echo   Starting Servers...
echo ============================================
echo.

echo [STEP 5] Starting Backend (port 8001)...
cd /d "%~dp0backend"
start "GPIS-Backend" /MIN %PYTHON_EXEC% main.py
echo         Backend starting...
echo.
echo         Waiting 5 seconds...
timeout /t 5 /nobreak >nul
echo.

echo [STEP 6] Starting Frontend (port 5173)...
cd /d "%~dp0frontend"
start "GPIS-Frontend" /MIN cmd /c "npm run dev 2>&1"
echo         Frontend starting...
echo.
echo         Waiting 10 seconds for Vite to compile...
timeout /t 10 /nobreak >nul
echo.

echo ============================================
echo   Opening Browser...
echo ============================================
start http://localhost:5173
echo         Browser opened at http://localhost:5173
echo.

echo ============================================
echo.
echo   GPIS Dashboard is now RUNNING!
echo.
echo   Backend:   http://localhost:8001
echo   Frontend:  http://localhost:5173
echo.
echo   Both servers run in minimized windows.
echo   Close those windows to stop the servers.
echo.
echo ============================================
echo.
pause
