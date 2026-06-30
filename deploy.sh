#!/bin/bash
echo "=========================================================="
echo "      ASTRA VISION GCP CLOUD RUN DEPLOYER (CLOUD SHELL)   "
echo "=========================================================="
echo ""

# Get active Google Cloud project
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "Error: No active Google Cloud Project selected."
    echo "Please create a project in Google Cloud Console and select it: "
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "[INFO] Deploying to GCP Project ID: $PROJECT_ID"
echo ""

# 1. Enable APIs
echo "[1/4] Enabling Cloud Run and Build APIs (this may take a minute)..."
gcloud services enable run.googleapis.com \
                       cloudbuild.googleapis.com \
                       containerregistry.googleapis.com \
                       artifactregistry.googleapis.com

# 1b. Grant permissions to Build & Compute service accounts
echo "[1b/4] Configuring service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant to Compute default service account (used by Cloud Build)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet >/dev/null

# Grant to Cloud Build service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet >/dev/null

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

# 3. Create Artifact Registry Repository (if not exists)
echo ""
echo "[3/4] Setting up Artifact Registry Repository..."
gcloud artifacts repositories create astra-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Astra Vision Docker Repository" \
    --quiet 2>/dev/null || echo "Repository 'astra-repo' already exists or is being created."

# 4. Deploy Backend
echo ""
echo "[3/4] Deploying Backend to Cloud Run..."
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-backend:latest .
gcloud run deploy astra-backend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "CEREBRAS_API_KEY=$CEREBRAS_KEY,NVIDIA_API_KEY=$NVIDIA_KEY,GEMINI_API_KEY=$GEMINI_KEY"
cd ..

# Fetch backend URL
BACKEND_URL=$(gcloud run services describe astra-backend --region us-central1 --format "value(status.url)")
echo "[OK] Backend deployed at: $BACKEND_URL"

# 5. Deploy Frontend
echo ""
echo "[4/4] Deploying Frontend to Cloud Run..."
echo "REACT_APP_API_BASE=$BACKEND_URL" > frontend/.env.production

cd frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-frontend:latest .
gcloud run deploy astra-frontend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/astra-repo/astra-frontend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --port 80
cd ..

# Fetch frontend URL
FRONTEND_URL=$(gcloud run services describe astra-frontend --region us-central1 --format "value(status.url)")

echo ""
echo "=========================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=========================================================="
echo "Frontend App (Share this!):  $FRONTEND_URL"
echo "Backend Health:             $BACKEND_URL/api/health"
echo "=========================================================="
