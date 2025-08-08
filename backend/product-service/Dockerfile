# syntax=docker/dockerfile:1.5
FROM public.ecr.aws/lambda/python:3.11

WORKDIR /var/task

# Copy requirements first for better caching
COPY requirements.txt .
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1
# Use BuildKit cache for pip to speed up rebuilds
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Copy shared utilities
COPY shared/ ./shared/

# Copy application code
COPY product-service/app/ ./app/

# Set environment variables
ENV PYTHONPATH=/var/task
ENV PORT=8001

# Command for AWS Lambda base image uses the handler
CMD ["app.main.handler"]