FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared utilities
COPY shared/ ./shared/

# Copy application code
COPY cart-service/app/ ./app/

# Expose port
EXPOSE 8002

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8002/api/health || exit 1

# Run the application
CMD ["python", "-m", "app.main"]