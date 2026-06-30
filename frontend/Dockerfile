# ============================================================
# Astra Vision — Frontend Dockerfile
# Stage 1: Build React app with Node.js
# Stage 2: Serve with Nginx (lightweight production server)
# ============================================================

# ---- Stage 1: Build ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build for production
COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# Copy the production build from Stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
