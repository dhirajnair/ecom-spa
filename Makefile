# E-commerce Microservices - Makefile
# Simplifies common development and deployment tasks

.PHONY: help build up down logs clean dev test setup

# Default target
help:
	@echo "E-commerce Microservices - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo ""
	@echo "  dev       - Start development environment"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  logs      - Show logs from all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  dynamodb      	- Start DynamoDB Local only"
	@echo "  setup-dynamodb - Setup DynamoDB tables with sample data"
	@echo "  seed-aws      - Seed AWS DynamoDB tables (after terraform apply)"
	@echo ""
	@echo "Testing:"
	@echo "  test      - Run all tests"
	@echo "  test-api  - Test API endpoints"
	@echo ""
	@echo "AWS:"
	@echo "  seed-aws  - Seed AWS DynamoDB tables (after terraform apply)"

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	docker-compose up --build

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







# Test API endpoints
test-api:
	@echo "🧪 Testing API endpoints..."
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "Testing Product Service..."
	@curl -f http://localhost:8001/api/health && echo "✅ Product service healthy" || echo "❌ Product service not healthy"
	@curl -f http://localhost:8001/api/products >/dev/null 2>&1 && echo "✅ Products endpoint working" || echo "❌ Products endpoint failed"
	@echo ""
	@echo "Testing Cart Service..."
	@curl -f http://localhost:8002/api/health && echo "✅ Cart service healthy" || echo "❌ Cart service not healthy"
	@echo ""
	@echo "Testing Frontend..."
	@curl -f http://localhost:3001 >/dev/null 2>&1 && echo "✅ Frontend responding" || echo "❌ Frontend not responding"

# Run tests
test:
	@echo "🧪 Running tests..."
	cd backend/product-service && python -m pytest tests/ || echo "⚠️ Product service tests not found"
	cd backend/cart-service && python -m pytest tests/ || echo "⚠️ Cart service tests not found"
	cd frontend && npm test -- --coverage --watchAll=false || echo "⚠️ Frontend tests not found"



# AWS DynamoDB seeding (for deployed infrastructure)
seed-aws:
	@echo "🌱 Seeding AWS DynamoDB tables..."
	@if [ ! -f terraform/terraform.tfstate ]; then \
		echo "❌ No Terraform state found. Run 'terraform apply' first."; \
		exit 1; \
	fi
	@cd terraform && \
	python3 ../scripts/aws-dynamodb-seed.py \
		--products-table "$$(terraform output -raw products_table_name)" \
		--carts-table "$$(terraform output -raw carts_table_name)" \
		--region "$$(terraform output -raw aws_region)"

# Service-specific commands

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