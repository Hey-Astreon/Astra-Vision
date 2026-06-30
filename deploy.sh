#!/bin/bash
echo "=========================================================="
echo "      ASTRA VISION GCP CLOUD RUN DEPLOYER (CLOUD SHELL)   "
echo "=========================================================="
echo ""

# Get active Google Cloud project
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "Error: No active Google Cloud Project selected."
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "[INFO] Deploying to GCP Project ID: $PROJECT_ID"
echo ""

# 1. Enable APIs
echo "[1/4] Enabling required APIs (this may take a minute)..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    --quiet
echo "[OK] APIs enabled."

# 2. Handle Env keys
echo ""
echo "[2/4] Setting up API keys..."
if [ -f "backend/.env" ]; then
    echo "[OK] Found backend/.env file."
    CEREBRAS_KEY=$(grep CEREBRAS_API_KEY backend/.env | cut -d '=' -f2)
    NVIDIA_KEY=$(grep NVIDIA_API_KEY backend/.env | cut -d '=' -f2)
    GEMINI_KEY=$(grep GEMINI_API_KEY backend/.env | cut -d '=' -f2)
else
    echo "backend/.env not found. Please paste your API keys manually:"
    read -p "Enter CEREBRAS_API_KEY: " CEREBRAS_KEY
    read -p "Enter NVIDIA_API_KEY: " NVIDIA_KEY
    read -p "Enter GEMINI_API_KEY: " GEMINI_KEY
fi
echo "[OK] API keys loaded."

# 3. Deploy Backend using --source (no manual Docker push needed)
echo ""
echo "[3/4] Deploying Backend to Cloud Run (this will take ~3-5 minutes)..."
gcloud run deploy astra-backend \
    --source ./backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "CEREBRAS_API_KEY=${CEREBRAS_KEY},NVIDIA_API_KEY=${NVIDIA_KEY},GEMINI_API_KEY=${GEMINI_KEY}" \
    --quiet

# Fetch backend URL
BACKEND_URL=$(gcloud run services describe astra-backend --region us-central1 --format "value(status.url)")
echo "[OK] Backend deployed at: $BACKEND_URL"

# 4. Deploy Frontend using --source (no manual Docker push needed)
echo ""
echo "[4/4] Deploying Frontend to Cloud Run (this will take ~3-5 minutes)..."
echo "REACT_APP_API_BASE=${BACKEND_URL}" > frontend/.env.production

gcloud run deploy astra-frontend \
    --source ./frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --port 80 \
    --quiet

# Fetch frontend URL
FRONTEND_URL=$(gcloud run services describe astra-frontend --region us-central1 --format "value(status.url)")

echo ""
echo "=========================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "=========================================================="
echo "Frontend App (Share this!):  $FRONTEND_URL"
echo "Backend Health:              $BACKEND_URL/api/health"
echo "=========================================================="
