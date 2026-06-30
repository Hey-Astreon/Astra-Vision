#!/bin/bash
echo "=========================================================="
echo "      ASTRA VISION GCP CLOUD RUN DEPLOYER (CLOUD SHELL)   "
echo "=========================================================="
echo ""

# Get active Google Cloud project
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "ERROR: No active Google Cloud Project selected."
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "[INFO] Project: $PROJECT_ID"
echo ""

# 1. Enable APIs
echo "[1/5] Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    --quiet
echo "[OK] APIs enabled."

# 2. Create Artifact Registry repository
echo ""
echo "[2/5] Setting up Artifact Registry repository..."
gcloud artifacts repositories create astra-repo \
    --repository-format=docker \
    --location=us-central1 \
    --quiet 2>/dev/null || echo "[OK] Repository 'astra-repo' already exists."

# Configure Docker to use your GCloud credentials (no service account needed)
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
echo "[OK] Docker authenticated using your GCloud credentials."

# 3. Setup API keys
echo ""
echo "[3/5] Setting up API keys..."
if [ -f "backend/.env" ]; then
    echo "[OK] Found backend/.env file."
    CEREBRAS_KEY=$(grep CEREBRAS_API_KEY backend/.env | cut -d '=' -f2)
    NVIDIA_KEY=$(grep NVIDIA_API_KEY backend/.env | cut -d '=' -f2)
    GEMINI_KEY=$(grep GEMINI_API_KEY backend/.env | cut -d '=' -f2)
else
    echo "backend/.env not found. Please paste your API keys:"
    read -p "Enter CEREBRAS_API_KEY: " CEREBRAS_KEY
    read -p "Enter NVIDIA_API_KEY: " NVIDIA_KEY
    read -p "Enter GEMINI_API_KEY: " GEMINI_KEY
fi
echo "[OK] API keys loaded."

BACKEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-backend:latest"
FRONTEND_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-frontend:latest"

# 4. Build and deploy backend
echo ""
echo "[4/5] Building and deploying Backend (this will take ~5 minutes)..."
docker build -t $BACKEND_IMAGE ./backend
docker push $BACKEND_IMAGE

gcloud run deploy astra-backend \
    --image $BACKEND_IMAGE \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "CEREBRAS_API_KEY=${CEREBRAS_KEY},NVIDIA_API_KEY=${NVIDIA_KEY},GEMINI_API_KEY=${GEMINI_KEY}" \
    --quiet

BACKEND_URL=$(gcloud run services describe astra-backend --region us-central1 --format "value(status.url)")
echo "[OK] Backend deployed at: $BACKEND_URL"

# 5. Build and deploy frontend
echo ""
echo "[5/5] Building and deploying Frontend (this will take ~5 minutes)..."
echo "REACT_APP_API_BASE=${BACKEND_URL}" > frontend/.env.production

docker build -t $FRONTEND_IMAGE ./frontend
docker push $FRONTEND_IMAGE

gcloud run deploy astra-frontend \
    --image $FRONTEND_IMAGE \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --port 80 \
    --quiet

FRONTEND_URL=$(gcloud run services describe astra-frontend --region us-central1 --format "value(status.url)")

echo ""
echo "=========================================================="
echo "DEPLOYMENT SUCCESSFUL!"
echo "=========================================================="
echo "Frontend App (Share this!):  $FRONTEND_URL"
echo "Backend Health:              $BACKEND_URL/api/health"
echo "=========================================================="
