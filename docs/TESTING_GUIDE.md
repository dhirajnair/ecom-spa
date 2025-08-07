# 🧪 Local Development Testing Guide

## 📋 Software Requirements

- **Docker Desktop** (required)
- **Python 3.11+** (for manual mode)
- **Node.js 18+** (for frontend)
- **Make** (optional, for shortcuts)

## 🐳 Local Docker Setup (Recommended)

### First Time Setup

```bash
# 1. Setup environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# 2. Start all services
make dev
# OR manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 3. Setup database (first time only)
make setup-dynamodb
# OR manually:
python scripts/setup-dynamodb.py
```

### Daily Start/Stop Commands

```bash
# Start services
make dev

# Stop services  
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Restart specific service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart cart-service

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### Access URLs

- **Frontend**: http://localhost:3001
- **Product Service**: http://localhost:8001 (API docs: `/docs`)
- **Cart Service**: http://localhost:8002 (API docs: `/docs`)
- **DynamoDB Local**: http://localhost:8000

## 🔧 Manual Local Setup

### Start Individual Components

```bash
# 1. Start DynamoDB
make dynamodb
# OR: docker run -p 8000:8000 -d --name ecom-dynamodb amazon/dynamodb-local:latest

# 2. Setup database (first time)
make setup-dynamodb

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Start product service (new terminal)
cd backend
PYTHONPATH=$(pwd) uvicorn product-service.app.main:app --reload --port 8001

# 5. Start cart service (new terminal)  
cd backend
PYTHONPATH=$(pwd) uvicorn cart-service.app.main:app --reload --port 8002

# 6. Start frontend (optional, new terminal)
cd frontend && npm install && npm start
```

### Stop Individual Components

```bash
# Stop services: Ctrl+C in each terminal

# Stop DynamoDB
docker stop ecom-dynamodb
docker rm ecom-dynamodb
```

## 🧪 Quick Test Commands

### Login & Get Token
```bash
# Login (local mode)
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@example.com", "password": "admin123"}'

# Save token
export JWT_TOKEN="your-token-here"
```

### Test Product Service
```bash
curl http://localhost:8001/api/products
curl http://localhost:8001/api/products/1
curl http://localhost:8001/api/health
```

### Test Cart Service
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8002/api/cart
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json" \
  -d '{"product_id": "1", "quantity": 2}' http://localhost:8002/api/cart/add
curl http://localhost:8002/api/health
```

## 🔑 Authentication

### Local Mode (Default)
- **Users**: `admin@example.com/admin123`, `user@example.com/user123`
- **Config**: `USE_COGNITO_AUTH=false` in backend/.env

### Production Mode (AWS Cognito)
- **Config**: `USE_COGNITO_AUTH=true` + Cognito settings
- **Setup**: See Terraform deployment


## ✅ Success Checklist

- [ ] All containers running: `docker ps`
- [ ] Products API responds: `curl localhost:8001/api/products`
- [ ] Login works: Returns JWT token
- [ ] Cart operations work: Add/remove items
- [ ] Frontend loads: http://localhost:3001
- [ ] No errors in logs