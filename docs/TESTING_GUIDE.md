# 🧪 Local Development Testing Guide

This guide provides step-by-step instructions to test the DynamoDB-powered backend services locally using a simplified development setup (no nginx/API gateway).

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Docker Desktop installed and running
- ✅ Python 3.11+ installed (for manual testing)
- ✅ Make command available (optional but recommended)
- ✅ Node.js 18+ (for frontend development)

## ⚙️ Environment Setup

```bash
# Backend environment
cp backend/env.example backend/.env

# Frontend environment  
cp frontend/env.example frontend/.env

# Terraform environment (if deploying to AWS)
cp terraform/env.example terraform/.env
```

**Key Features:**
- ✅ **Pydantic validation** - Automatic type checking and validation
- ✅ **Environment-aware** - Different behavior for `ENV=local` vs production
- ✅ **Smart defaults** - Works out of the box for local development
- ✅ **Multiple .env locations** - Searches project root, backend/, etc.
- ✅ **Production safety** - Validates JWT secrets and required fields

## 🚀 Development Options

You have two main options for local development:

### Option 1: Docker Development Environment (Recommended)

The easiest way to get started - simplified architecture without nginx/API gateway:

```bash
# Start all services in development mode
make dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This starts:
- 🗄️ DynamoDB Local (localhost:8000)
- 🛍️ Product Service (localhost:8001)
- 🛒 Cart Service (localhost:8002)  
- ⚛️ Frontend (localhost:3000)

**Access URLs:**
- Frontend: http://localhost:3000
- Product Service API Docs: http://localhost:8001/docs
- Cart Service API Docs: http://localhost:8002/docs

### Option 2: Manual Local Services

For developers who want to run services individually:

#### Step 0: Install Dependencies

```bash
# Install Python dependencies (including pydantic-settings)
pip install -r backend/requirements.txt
```

### Step 1: Start DynamoDB Local

First, let's start DynamoDB Local container:

```bash
# Option A: Using Make (recommended)
make dynamodb

# Option B: Using Docker directly
docker run -p 8000:8000 -d --name ecom-dynamodb amazon/dynamodb-local:latest
```

**Verify DynamoDB is running:**
```bash
# Check container status
docker ps | grep dynamodb

# Test DynamoDB endpoint
curl -s http://localhost:8000/shell/ | head -n 5
```

Expected output: You should see HTML content indicating DynamoDB Local web shell is running.

#### Step 2: Setup DynamoDB Tables

Create the required tables and populate sample data:

```bash
# Run the setup script
make setup-dynamodb

# Or manually
python scripts/setup-dynamodb.py
```

**Expected output:**
```
🚀 E-commerce DynamoDB Setup
========================================
DynamoDB Endpoint: http://localhost:8000
AWS Region: us-west-2

✅ DynamoDB connection successful

🔧 Creating tables...
✅ Created ecom-products table
✅ Created ecom-carts table

🌱 Initializing sample data...
Created product: Wireless Headphones
Created product: Running Shoes
Created product: Coffee Maker
Created product: Smartphone
Created product: Book - Python Programming
✅ Sample products initialized successfully!

📋 DynamoDB Tables (2):
  • ecom-products
  • ecom-carts

🎉 DynamoDB setup completed successfully!
```

#### Step 3: Start Backend Services

Start the backend services with proper Python path:

```bash
# Start product service (from backend directory)
cd backend
PYTHONPATH=$(pwd) uvicorn product-service.app.main:app --reload --port 8001

# In a new terminal, start cart service (from backend directory)
cd backend  
PYTHONPATH=$(pwd) uvicorn cart-service.app.main:app --reload --port 8002
```

**Expected output:**
```
INFO:     Will watch for changes in these directories: ['/path/to/backend/product-service']
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 4: Test Product Service Endpoints

Open a new terminal and test the endpoints:

#### 4.1 Health Check
```bash
curl -X GET http://localhost:8001/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "product-service"
}
```

#### 4.2 Get All Products
```bash
curl -X GET http://localhost:8001/api/products
```

**Expected response:**
```json
{
  "products": [
    {
      "id": "1",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 199.99,
      "category": "Electronics",
      "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      "stock": 50
    },
    // ... more products
  ],
  "total": 5
}
```

#### 4.3 Get Product by ID
```bash
curl -X GET http://localhost:8001/api/products/1
```

**Expected response:**
```json
{
  "id": "1",
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": 199.99,
  "category": "Electronics",
  "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
  "stock": 50
}
```

#### 4.4 Get Products by Category
```bash
curl -X GET "http://localhost:8001/api/products?category=Electronics"
```

#### 4.5 Get Categories
```bash
curl -X GET http://localhost:8001/api/categories
```

**Expected response:**
```json
{
  "categories": ["Books", "Electronics", "Home", "Sports"]
}
```

### Step 5: Test Cart Service

Open a new terminal window for the Cart Service:

```bash
# Navigate to cart service
cd backend/cart-service

# Install dependencies
pip install -r requirements.txt

# The Pydantic settings will automatically load from .env files
# Make sure PORT=8002 is set in backend/.env for cart service

# Start the service
PYTHONPATH=/Users/dhirajnair/Documents/Projects/code/xx/ecom-spa/backend uvicorn cart-service.app.main:app --reload --port 8002
```

### Step 6: Test Cart Service Endpoints

#### 6.1 Health Check
```bash
curl -X GET http://localhost:8002/api/health
```

#### 6.2 Login (Get JWT Token)
```bash
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "1",
  "username": "demo"
}
```

**Save the token for next requests:**
```bash
export JWT_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

#### 6.3 Get User Cart
```bash
curl -X GET http://localhost:8002/api/cart \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected response (empty cart):**
```json
{
  "id": "generated-cart-id",
  "user_id": "1",
  "items": [],
  "total": 0.0,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

#### 6.4 Add Product to Cart
```bash
curl -X POST http://localhost:8002/api/cart/add \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "1",
    "quantity": 2
  }'
```

**Expected response:**
```json
{
  "message": "Product added to cart successfully"
}
```

#### 6.5 Get Cart After Adding Product
```bash
curl -X GET http://localhost:8002/api/cart \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected response:**
```json
{
  "id": "generated-cart-id",
  "user_id": "1", 
  "items": [
    {
      "id": "generated-item-id",
      "product_id": "1",
      "quantity": 2,
      "price": 199.99
    }
  ],
  "total": 399.98,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:32:00"
}
```

#### 6.6 Remove Product from Cart
```bash
curl -X DELETE http://localhost:8002/api/cart/remove/1 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 6.7 Clear Cart
```bash
curl -X DELETE http://localhost:8002/api/cart/clear \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Step 7: Test Using Docker Compose (Complete Stack)

Stop the individual services (Ctrl+C) and test the complete stack:

```bash
# Return to project root
cd ../..

# Start all services with Docker Compose
make up

# Wait for services to be healthy (about 30-60 seconds)
docker-compose ps
```

**Expected output:**
```
       Name                     Command               State                    Ports                  
-------------------------------------------------------------------------------------------------
ecom-api-gateway     /docker-entrypoint.sh ngin ...   Up      0.0.0.0:80->80/tcp,:::80->80/tcp
ecom-cart-service    python -m uvicorn app.main ...   Up      0.0.0.0:8002->8002/tcp
ecom-dynamodb        java -jar DynamoDBLocal.ja ...   Up      0.0.0.0:8000->8000/tcp
ecom-frontend        /docker-entrypoint.sh ngin ...   Up      0.0.0.0:3000->80/tcp
ecom-product-service python -m uvicorn app.main ...   Up      0.0.0.0:8001->8001/tcp
```

### Step 8: Test Complete Stack Through API Gateway

Test the services through the Nginx API Gateway:

#### 8.1 Test Products via Gateway
```bash
curl -X GET http://localhost/api/products
curl -X GET http://localhost/api/products/1
curl -X GET http://localhost/api/categories
```

#### 8.2 Test Cart Service via Gateway
```bash
# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# Use the returned token
export JWT_TOKEN="your-token-here"

# Test cart operations
curl -X GET http://localhost/api/cart \
  -H "Authorization: Bearer $JWT_TOKEN"

curl -X POST http://localhost/api/cart/add \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "1", "quantity": 1}'
```

### Step 9: Verify DynamoDB Data

You can inspect the DynamoDB data directly:

#### 9.1 Using DynamoDB Local Web Shell
```bash
# Open in browser
open http://localhost:8000/shell/
```

#### 9.2 Using AWS CLI (if installed)
```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-west-2

# Scan products table
aws dynamodb scan --table-name ecom-products --endpoint-url http://localhost:8000 --region us-west-2

# Scan carts table
aws dynamodb scan --table-name ecom-carts --endpoint-url http://localhost:8000 --region us-west-2
```

#### 9.3 Using Python Script
```python
import boto3

# Connect to DynamoDB Local
dynamodb = boto3.resource('dynamodb',
    endpoint_url='http://localhost:8000',
    region_name='us-west-2',
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
)

# List all products
products_table = dynamodb.Table('ecom-products')
response = products_table.scan()
for item in response['Items']:
    print(f"Product: {item['name']} - ${item['price']}")

# List all carts
carts_table = dynamodb.Table('ecom-carts')
response = carts_table.scan()
for item in response['Items']:
    print(f"Cart for user {item['user_id']}: {len(item.get('items', []))} items")
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue 1: DynamoDB Connection Error
```
botocore.exceptions.EndpointConnectionError: Could not connect to the endpoint URL
```
**Solution:**
- Ensure DynamoDB Local is running: `docker ps | grep dynamodb`
- Check the DYNAMODB_ENDPOINT environment variable
- Restart DynamoDB: `docker restart ecom-dynamodb`

#### Issue 2: Table Not Found
```
botocore.exceptions.ClientError: An error occurred (ResourceNotFoundException) when calling the GetItem operation: Table 'ecom-products' not found
```
**Solution:**
- Run the setup script: `python scripts/setup-dynamodb.py`
- Verify tables exist: `aws dynamodb list-tables --endpoint-url http://localhost:8000`

#### Issue 3: Authentication Error
```
{"detail": "Could not validate credentials"}
```
**Solution:**
- Ensure JWT_SECRET_KEY is set and same for both services
- Check that the Authorization header is properly formatted
- Verify the token hasn't expired

#### Issue 4: Service Communication Error
```
{"detail": "Product service unavailable"}
```
**Solution:**
- Ensure Product Service is running on port 8001
- Check PRODUCT_SERVICE_URL environment variable in Cart Service
- Verify network connectivity between services

#### Step 4: Frontend Development (Optional)

If you want to test the frontend with your local backend services:

```bash
# Copy environment file
cp frontend/env.example frontend/.env

# Install dependencies
cd frontend
npm install

# Start development server
npm start
```

The frontend will be available at http://localhost:3000 and will connect directly to:
- Product Service: http://localhost:8001/api
- Cart Service: http://localhost:8002/api

### View Logs

```bash
# View all service logs
make logs

# View specific service logs (if using Docker)
docker-compose logs product-service
docker-compose logs cart-service
docker-compose logs dynamodb-local
```

## ✅ Testing Checklist

- [ ] DynamoDB Local starts successfully
- [ ] Tables are created with sample data
- [ ] Product Service starts and responds to health check
- [ ] All Product Service endpoints return expected data
- [ ] Cart Service starts and responds to health check
- [ ] Authentication works (login returns JWT token)
- [ ] Cart operations work (add, remove, clear)
- [ ] Services communicate correctly (cart validates products)
- [ ] Docker Compose stack starts successfully
- [ ] API Gateway routes requests correctly
- [ ] DynamoDB data can be inspected

## 🎉 Success Indicators

If all tests pass, you should see:

1. **All services healthy** in `docker-compose ps`
2. **Sample products** returned from `/api/products`
3. **JWT authentication** working for cart operations
4. **Cart operations** (add/remove/clear) working correctly
5. **Data persistence** in DynamoDB tables
6. **No error logs** in service containers

Your DynamoDB-powered backend is now fully functional and ready for frontend integration! 🚀
