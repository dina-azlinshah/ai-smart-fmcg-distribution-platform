@echo off
echo Stopping Sales Dashboard Backend (Python/Uvicorn)...
taskkill /IM python.exe /F 2>nul
taskkill /IM uvicorn.exe /F 2>nul

echo Stopping Sales Dashboard Frontend (Node/Vite)...
taskkill /IM node.exe /F 2>nul

echo All Dashboard services have been stopped.
pause
