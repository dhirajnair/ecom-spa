# Multi-stage build for React app (reverted to stable working configuration)
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (prefer ci if lockfile exists)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy full source (ensures CRA build has all files)
COPY . .

# Build the app
RUN npm run build

# Runtime stage: minimal Node.js server
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy build output
COPY --from=build /app/build /app/build

# Install minimal runtime deps for static serving
RUN npm init -y && npm install express@4

# Copy server
COPY server.js /app/server.js

# Add AWS Lambda Web Adapter (enables Lambda → HTTP)
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.3 /lambda-adapter /opt/extensions/lambda-adapter

# Use high port (non-privileged) for Lambda
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start server
CMD ["node", "server.js"]