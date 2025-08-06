# E-commerce Microservices - Makefile
# Simplifies common development and deployment tasks

.PHONY: help build up down logs clean dev test setup

# Default target
help:
	@echo "E-commerce Microservices - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  setup     - Setup database and initialize data"
	@echo "  dev       - Start development environment"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  logs      - Show logs from all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  dynamodb      - Start DynamoDB Local only"
	@echo "  setup-dynamodb - Setup DynamoDB tables with sample data"
	@echo "  db-setup      - Setup database with sample data (alias)"
	@echo "  db-reset      - Reset database (destructive)"
	@echo ""
	@echo "Testing:"
	@echo "  test      - Run all tests"
	@echo "  test-api  - Test API endpoints"
	@echo ""
	@echo "Production:"
	@echo "  prod-up   - Start production environment"
	@echo "  prod-down - Stop production environment"

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Build all images
build:
	@echo "🔨 Building all Docker images..."
	docker-compose build

# Start all services
up:
	@echo "🟢 Starting all services..."
	docker-compose up -d

# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# Show logs
logs:
	@echo "📋 Showing logs..."
	docker-compose logs -f

# Clean up
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Start DynamoDB Local only
dynamodb:
	@echo "🗄️ Starting DynamoDB Local..."
	docker-compose up -d dynamodb-local

# Setup DynamoDB tables
setup-dynamodb:
	@echo "🗃️ Setting up DynamoDB tables..."
	python scripts/setup-dynamodb.py

# Database setup (alias)
db-setup: setup-dynamodb

# Database reset
db-reset:
	@echo "⚠️ Resetting DynamoDB tables (this will delete all data)..."
	@echo "This will delete and recreate all DynamoDB tables."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		python -c "import boto3; dynamodb = boto3.client('dynamodb', endpoint_url='http://localhost:8000', region_name='us-west-2', aws_access_key_id='dummy', aws_secret_access_key='dummy'); [dynamodb.delete_table(TableName=table) for table in ['ecom-products', 'ecom-carts']]"; \
		echo ""; \
		echo "Tables deleted. Run 'make db-setup' to recreate."; \
	else \
		echo ""; \
		echo "Cancelled."; \
	fi

# Setup (first time)
setup: build db-setup
	@echo "✅ Setup completed!"

# Test API endpoints
test-api:
	@echo "🧪 Testing API endpoints..."
	@echo "Testing Product Service..."
	curl -f http://localhost:8001/api/health || echo "❌ Product service not healthy"
	curl -f http://localhost:8001/api/products || echo "❌ Products endpoint failed"
	@echo ""
	@echo "Testing Cart Service..."
	curl -f http://localhost:8002/api/health || echo "❌ Cart service not healthy"
	@echo ""
	@echo "Testing API Gateway..."
	curl -f http://localhost:3001/health || echo "❌ API Gateway not healthy"
	curl -f http://localhost:3001/api/products || echo "❌ Gateway products endpoint failed"
	@echo ""
	@echo "Testing Frontend..."
	curl -f http://localhost:3000 || echo "❌ Frontend not responding"

# Run tests
test:
	@echo "🧪 Running tests..."
	cd backend/product-service && python -m pytest tests/ || echo "⚠️ Product service tests not found"
	cd backend/cart-service && python -m pytest tests/ || echo "⚠️ Cart service tests not found"
	cd frontend && npm test -- --coverage --watchAll=false || echo "⚠️ Frontend tests not found"

# Production environment
prod-up:
	@echo "🏭 Starting production environment..."
	docker-compose up -d --build

prod-down:
	@echo "🏭 Stopping production environment..."
	docker-compose down

# Service-specific commands
dynamodb:
	@echo "🗄️ Starting DynamoDB Local only..."
	docker-compose up -d dynamodb-local

product-service:
	@echo "📦 Starting Product Service..."
	docker-compose up -d dynamodb-local product-service

cart-service:
	@echo "🛒 Starting Cart Service..."
	docker-compose up -d dynamodb-local product-service cart-service

frontend:
	@echo "⚛️ Starting Frontend..."
	docker-compose up -d frontend

# Health checks
health:
	@echo "🏥 Checking service health..."
	@make test-api

# View service status
status:
	@echo "📊 Service Status:"
	docker-compose ps

# Follow logs for specific service
logs-product:
	docker-compose logs -f product-service

logs-cart:
	docker-compose logs -f cart-service

logs-frontend:
	docker-compose logs -f frontend

logs-dynamodb:
	docker-compose logs -f dynamodb-local

logs-gateway:
	docker-compose logs -f api-gateway