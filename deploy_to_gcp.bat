@echo off
setlocal enabledelayedexpansion
title Astra Vision — GCP Cloud Run Deployer
color 0B

echo ================================================================
echo          ASTRA VISION — GCP CLOUD RUN DEPLOYMENT
echo ================================================================
echo.

:: ---- CONFIGURATION — Edit these before running ----
set GCP_PROJECT_ID=YOUR_GCP_PROJECT_ID
set GCP_REGION=us-central1
set BACKEND_SERVICE=astra-vision-backend
set FRONTEND_SERVICE=astra-vision-frontend
:: -------------------------------------------------------

:: Check gcloud is installed
gcloud --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Google Cloud CLI (gcloud) is not installed.
    echo Download from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

:: Check Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [1/6] Authenticating with Google Cloud...
gcloud auth login
gcloud config set project %GCP_PROJECT_ID%

echo.
echo [2/6] Enabling required GCP services...
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

echo.
echo [3/6] Loading API keys from backend/.env...
for /f "tokens=1,2 delims==" %%a in (backend\.env) do (
    if "%%a"=="CEREBRAS_API_KEY" set CEREBRAS_KEY=%%b
    if "%%a"=="NVIDIA_API_KEY" set NVIDIA_KEY=%%b
    if "%%a"=="GEMINI_API_KEY" set GEMINI_KEY=%%b
)

echo [OK] API keys loaded.

echo.
echo [4/6] Building and deploying Backend to Cloud Run...
cd backend
gcloud builds submit --tag gcr.io/%GCP_PROJECT_ID%/%BACKEND_SERVICE% .
gcloud run deploy %BACKEND_SERVICE% ^
    --image gcr.io/%GCP_PROJECT_ID%/%BACKEND_SERVICE% ^
    --platform managed ^
    --region %GCP_REGION% ^
    --allow-unauthenticated ^
    --memory 1Gi ^
    --cpu 1 ^
    --timeout 300 ^
    --set-env-vars "CEREBRAS_API_KEY=%CEREBRAS_KEY%,NVIDIA_API_KEY=%NVIDIA_KEY%,GEMINI_API_KEY=%GEMINI_KEY%"
cd ..

:: Get the backend URL
for /f "tokens=*" %%i in ('gcloud run services describe %BACKEND_SERVICE% --region %GCP_REGION% --format "value(status.url)"') do set BACKEND_URL=%%i
echo.
echo [OK] Backend deployed at: %BACKEND_URL%

echo.
echo [5/6] Updating frontend with backend URL...
echo REACT_APP_API_BASE=%BACKEND_URL% > frontend\.env.production

echo.
echo [6/6] Building and deploying Frontend to Cloud Run...
cd frontend
gcloud builds submit --tag gcr.io/%GCP_PROJECT_ID%/%FRONTEND_SERVICE% .
gcloud run deploy %FRONTEND_SERVICE% ^
    --image gcr.io/%GCP_PROJECT_ID%/%FRONTEND_SERVICE% ^
    --platform managed ^
    --region %GCP_REGION% ^
    --allow-unauthenticated ^
    --memory 256Mi ^
    --cpu 1
cd ..

:: Get the frontend URL
for /f "tokens=*" %%i in ('gcloud run services describe %FRONTEND_SERVICE% --region %GCP_REGION% --format "value(status.url)"') do set FRONTEND_URL=%%i

echo.
echo ================================================================
echo   DEPLOYMENT COMPLETE!
echo ================================================================
echo.
echo   SHAREABLE LINK (Frontend):  %FRONTEND_URL%
echo   Backend API:                %BACKEND_URL%/api/health
echo.
echo   Share the frontend URL with anyone worldwide!
echo ================================================================
pause
