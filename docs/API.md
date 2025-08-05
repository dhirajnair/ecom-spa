# API Documentation

This document provides comprehensive API documentation for the e-commerce microservices application.

## 🏗️ API Architecture

The application follows a microservices architecture with the following API structure:

```
API Gateway (Port 3001)
├── /api/products/*     → Product Service (Port 8001)
├── /api/categories     → Product Service (Port 8001)
├── /api/cart/*         → Cart Service (Port 8002)
└── /api/auth/*         → Cart Service (Port 8002)
```

## 🔐 Authentication

The application uses JWT (JSON Web Token) based authentication.

### Authentication Flow

1. **Login**: POST to `/api/auth/login` with credentials
2. **Receive Token**: Get JWT token in response
3. **Use Token**: Include token in `Authorization` header for protected endpoints
4. **Token Format**: `Authorization: Bearer <jwt-token>`

### Default Users

```json
{
  "admin": {
    "username": "admin",
    "password": "admin123",
    "user_id": "1"
  },
  "user": {
    "username": "user", 
    "password": "user123",
    "user_id": "2"
  }
}
```

## 📦 Product Service API

Base URL: `http://localhost:8001/api` (direct) or `http://localhost:3001/api` (via gateway)

### Health Check

#### GET /health

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "product-service"
}
```

**Status Codes:**
- `200`: Service is healthy
- `503`: Service unavailable

---

### Products

#### GET /products

Retrieve list of products with optional filtering and pagination.

**Query Parameters:**
- `category` (optional): Filter by category name (case-insensitive)
- `limit` (optional): Number of products to return (1-100, default: 100)
- `offset` (optional): Number of products to skip (default: 0)

**Example Request:**
```bash
GET /api/products?category=Electronics&limit=10&offset=0
```

**Response:**
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
    {
      "id": "4",
      "name": "Smartphone",
      "description": "Latest smartphone with advanced camera system",
      "price": 699.99,
      "category": "Electronics", 
      "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
      "stock": 40
    }
  ],
  "total": 2
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid query parameters
- `500`: Internal server error

---

#### GET /products/{product_id}

Retrieve detailed information about a specific product.

**Path Parameters:**
- `product_id` (required): Unique product identifier

**Example Request:**
```bash
GET /api/products/1
```

**Response:**
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

**Status Codes:**
- `200`: Product found
- `404`: Product not found
- `500`: Internal server error

---

### Categories

#### GET /categories

Retrieve list of all product categories.

**Example Request:**
```bash
GET /api/categories
```

**Response:**
```json
{
  "categories": [
    "Electronics",
    "Sports", 
    "Home",
    "Books"
  ]
}
```

**Status Codes:**
- `200`: Success
- `500`: Internal server error

---

## 🛒 Cart Service API

Base URL: `http://localhost:8002/api` (direct) or `http://localhost:3001/api` (via gateway)

### Health Check

#### GET /health

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "cart-service" 
}
```

---

### Authentication

#### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "1", 
  "username": "admin"
}
```

**Status Codes:**
- `200`: Login successful
- `401`: Invalid credentials
- `422`: Invalid request format

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

### Cart Management

#### GET /cart

Retrieve current user's cart contents.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Response:**
```json
{
  "id": "cart-uuid-123",
  "user_id": "1",
  "items": [
    {
      "id": "item-uuid-456",
      "product_id": "1",
      "quantity": 2,
      "price": 199.99
    },
    {
      "id": "item-uuid-789", 
      "product_id": "3",
      "quantity": 1,
      "price": 149.99
    }
  ],
  "total": 549.97,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:15:00Z"
}
```

**Status Codes:**
- `200`: Cart retrieved successfully
- `401`: Unauthorized (invalid/missing token)
- `500`: Internal server error

**Example cURL:**
```bash
curl -X GET http://localhost:3001/api/cart \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

#### POST /cart/add

Add product to cart or update quantity if already exists.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Request Body:**
```json
{
  "product_id": "1",
  "quantity": 2
}
```

**Response:**
```json
{
  "message": "Product added to cart successfully"
}
```

**Status Codes:**
- `200`: Product added successfully
- `400`: Invalid request (insufficient stock, invalid product)
- `401`: Unauthorized
- `404`: Product not found
- `503`: Product service unavailable

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"product_id": "1", "quantity": 2}'
```

---

#### DELETE /cart/remove/{product_id}

Remove specific product from cart.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Path Parameters:**
- `product_id` (required): ID of product to remove

**Response:**
```json
{
  "message": "Product removed from cart successfully"
}
```

**Status Codes:**
- `200`: Product removed successfully
- `401`: Unauthorized
- `404`: Cart or product not found

**Example cURL:**
```bash
curl -X DELETE http://localhost:3001/api/cart/remove/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

#### DELETE /cart/clear

Remove all items from cart.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Response:**
```json
{
  "message": "Cart cleared successfully"
}
```

**Status Codes:**
- `200`: Cart cleared successfully
- `401`: Unauthorized

**Example cURL:**
```bash
curl -X DELETE http://localhost:3001/api/cart/clear \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🌐 API Gateway Routes

The Nginx API Gateway routes requests to appropriate services:

### Routing Rules

```nginx
# Product Service routes
location /api/products {
    proxy_pass http://product-service:8001;
}

location /api/categories {
    proxy_pass http://product-service:8001; 
}

# Cart Service routes  
location /api/cart {
    proxy_pass http://cart-service:8002;
}

location /api/auth {
    proxy_pass http://cart-service:8002;
}
```

### Rate Limiting

```nginx
# API rate limiting: 10 requests per second
limit_req zone=api burst=20 nodelay;

# Authentication rate limiting: 5 requests per minute
limit_req zone=login burst=5 nodelay;
```

### CORS Headers

```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
```

---

## 📊 Error Responses

### Standard Error Format

All APIs return errors in a consistent format:

```json
{
  "detail": "Error description",
  "error_code": "SPECIFIC_ERROR_CODE", 
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Common Error Codes

#### 4xx Client Errors

**400 Bad Request**
```json
{
  "detail": "Invalid request parameters",
  "error_code": "INVALID_REQUEST"
}
```

**401 Unauthorized**
```json
{
  "detail": "Could not validate credentials",
  "error_code": "INVALID_TOKEN"
}
```

**404 Not Found**
```json
{
  "detail": "Product with id 999 not found",
  "error_code": "RESOURCE_NOT_FOUND"
}
```

**422 Unprocessable Entity**
```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR"
}
```

#### 5xx Server Errors

**500 Internal Server Error**
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

**503 Service Unavailable**
```json
{
  "detail": "Product service unavailable", 
  "error_code": "SERVICE_UNAVAILABLE"
}
```

---

## 🔧 Request/Response Examples

### Complete User Journey

#### 1. User Login
```bash
# Request
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImV4cCI6MTY0MjI1MjgwMH0.signature",
  "token_type": "bearer",
  "user_id": "1",
  "username": "admin"
}
```

#### 2. Browse Products
```bash
# Request  
curl -X GET http://localhost:3001/api/products?limit=5

# Response
{
  "products": [
    {
      "id": "1",
      "name": "Wireless Headphones",
      "price": 199.99,
      "category": "Electronics",
      "stock": 50
    }
  ],
  "total": 5
}
```

#### 3. Add to Cart
```bash
# Request
curl -X POST http://localhost:3001/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{"product_id": "1", "quantity": 2}'

# Response
{
  "message": "Product added to cart successfully"
}
```

#### 4. View Cart
```bash
# Request
curl -X GET http://localhost:3001/api/cart \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# Response
{
  "id": "cart-123",
  "user_id": "1", 
  "items": [
    {
      "id": "item-456",
      "product_id": "1",
      "quantity": 2,
      "price": 199.99
    }
  ],
  "total": 399.98,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:15:00Z"
}
```

---

## 🧪 Testing APIs

### Postman Collection

Create a Postman collection with these requests:

```json
{
  "info": {
    "name": "E-commerce API",
    "description": "API collection for e-commerce microservices"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "raw": "{\"username\": \"admin\", \"password\": \"admin123\"}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

### cURL Test Script

```bash
#!/bin/bash

# Test script for e-commerce API
BASE_URL="http://localhost:3001/api"

echo "🧪 Testing E-commerce API..."

# 1. Health checks
echo "1. Health checks..."
curl -s "$BASE_URL/../health" | jq '.'

# 2. Get products
echo "2. Getting products..."
curl -s "$BASE_URL/products?limit=3" | jq '.products[0]'

# 3. Login
echo "3. Login..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.access_token')

echo "Token: ${TOKEN:0:20}..."

# 4. Get cart
echo "4. Getting cart..."
curl -s "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Add to cart
echo "5. Adding to cart..."
curl -s -X POST "$BASE_URL/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product_id": "1", "quantity": 2}' | jq '.'

# 6. View updated cart
echo "6. Updated cart..."
curl -s "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN" | jq '.total'

echo "✅ API tests completed!"
```

### Python Test Client

```python
import requests
import json

class ECommerceAPIClient:
    def __init__(self, base_url="http://localhost:3001/api"):
        self.base_url = base_url
        self.token = None
    
    def login(self, username, password):
        """Login and store token"""
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            return True
        return False
    
    def get_headers(self):
        """Get headers with authorization"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def get_products(self, category=None, limit=10):
        """Get products with optional filtering"""
        params = {"limit": limit}
        if category:
            params["category"] = category
        
        response = requests.get(
            f"{self.base_url}/products",
            params=params
        )
        return response.json()
    
    def get_product(self, product_id):
        """Get specific product"""
        response = requests.get(f"{self.base_url}/products/{product_id}")
        return response.json()
    
    def get_cart(self):
        """Get user cart"""
        response = requests.get(
            f"{self.base_url}/cart",
            headers=self.get_headers()
        )
        return response.json()
    
    def add_to_cart(self, product_id, quantity=1):
        """Add product to cart"""
        response = requests.post(
            f"{self.base_url}/cart/add",
            json={"product_id": product_id, "quantity": quantity},
            headers=self.get_headers()
        )
        return response.json()

# Usage example
if __name__ == "__main__":
    client = ECommerceAPIClient()
    
    # Login
    if client.login("admin", "admin123"):
        print("✅ Login successful")
        
        # Get products
        products = client.get_products(limit=3)
        print(f"📦 Found {len(products['products'])} products")
        
        # Add first product to cart
        if products['products']:
            product_id = products['products'][0]['id']
            result = client.add_to_cart(product_id, 2)
            print(f"🛒 Added to cart: {result['message']}")
            
            # View cart
            cart = client.get_cart()
            print(f"💰 Cart total: ${cart['total']}")
    else:
        print("❌ Login failed")
```

---

## 📈 Performance Considerations

### Response Times

**Target Response Times:**
- Product listing: < 200ms
- Product details: < 100ms  
- Cart operations: < 150ms
- Authentication: < 300ms

### Caching Strategy

**Frontend Caching:**
- Product data: 5 minutes
- Categories: 10 minutes
- Cart data: Real-time (no cache)

**API Caching:**
- Product catalog: Redis cache (5 minutes)
- Category list: Redis cache (10 minutes)
- User sessions: JWT with 30-minute expiry

### Rate Limiting

**API Gateway Limits:**
- General API: 10 requests/second per IP
- Authentication: 5 requests/minute per IP
- Cart operations: 20 requests/minute per user

---

## 🔍 API Monitoring

### Health Check Endpoints

Monitor these endpoints for service health:

```bash
# Direct service health checks
curl http://localhost:8001/api/health  # Product Service
curl http://localhost:8002/api/health  # Cart Service
curl http://localhost:3001/health      # API Gateway

# Gateway routed health checks  
curl http://localhost:3001/api/products?limit=1  # End-to-end test
```

### Metrics to Monitor

**Response Metrics:**
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Throughput (requests/second)

**Business Metrics:**
- Product views per minute
- Cart additions per minute  
- Authentication attempts per minute
- Cart conversion rate

This API documentation provides a complete reference for interacting with the e-commerce microservices application. Use the provided examples and test scripts to explore and integrate with the APIs.