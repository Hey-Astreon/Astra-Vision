# ============================================================
# Astra Vision — Backend Dockerfile
# Base: python:3.11-slim
# Includes Node.js for the self-heal JS sandbox subprocess
# ============================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies + Node.js (required for JS sandbox)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Create ChromaDB data directory
RUN mkdir -p /app/db

# Expose the FastAPI port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Run the FastAPI server
CMD ["python", "server.py"]
