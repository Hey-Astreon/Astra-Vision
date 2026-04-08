@echo off
setlocal
cd /d %~dp0

:: Set window title and color
title Astra Vision Launcher
color 0B

echo ================================================================
:: Using a separate text file for ASCII art to handle special characters perfectly
if exist "banner.txt" (
    type "banner.txt"
) else (
    echo                ASTRA VISION
)
echo ================================================================
echo                ONE-CLICK APPLICATION LAUNCHER
echo ================================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    pause
    exit /b
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    pause
    exit /b
)

:: Check for Backend Dependencies
echo [STAGE 1/3] Checking Backend Dependencies...
python -c "import fastapi, uvicorn, pydantic, dotenv, httpx" 2>nul
if %errorlevel% neq 0 (
    echo [!] Backend dependencies missing. Installing...
    cd backend
    pip install -r requirements.txt
    cd ..
) else (
    echo [OK] Backend dependencies ready.
)

:: Check for Frontend Dependencies
echo [STAGE 2/3] Checking Frontend Dependencies...
:: Using trailing slash to specifically check for the directory
if not exist "frontend\node_modules\" (
    echo [!] Frontend node_modules missing. Installing...
    echo (This may take a minute or two)
    cd frontend
    :: CRITICAL: Must use 'call' with npm in batch files, otherwise it terminates the script
    call npm install
    cd ..
) else (
    echo [OK] Frontend dependencies ready.
)

:: Start Backend
echo [STAGE 3/3] Launching Astra Vision...
echo.
echo Launching Backend Server on port 8001...
:: Running backend explicitly with python in a new window
start "Astra Vision - Backend" cmd /k "cd backend && python server.py"

:: Give the backend a second to start
timeout /t 2 /nobreak >nul

:: Start Frontend
echo Launching Frontend Client on port 3000...
:: CRITICAL: Using 'call npm' even within cmd /k is safer practice
start "Astra Vision - Frontend" cmd /k "cd frontend && call npm start"

echo.
echo ================================================================
echo  SUCCESS: Services are starting up in separate windows!
echo ================================================================
echo  Backend:  http://localhost:8001/api/health
echo  Frontend: http://localhost:3000
echo ================================================================
echo.
echo You can close this window. The servers will keep running.
echo Press any key to finish.
pause >nul
exit
