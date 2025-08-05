# Cart Service

FastAPI microservice for managing shopping carts with JWT authentication and PostgreSQL database.

## Features

- JWT-based authentication
- User-specific cart management
- Product validation with Product Service
- Cart persistence with PostgreSQL
- Health checks
- Auto-generated API documentation

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login

### Protected Endpoints (Require JWT Token)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add product to cart
- `DELETE /api/cart/remove/{product_id}` - Remove product from cart
- `DELETE /api/cart/clear` - Clear all cart items

## Authentication

### Login
Send POST request to `/api/auth/login` with:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "1",
  "username": "admin"
}
```

### Default Users
- Username: `admin`, Password: `admin123`
- Username: `user`, Password: `user123`

### Using Token
Include token in Authorization header:
```
Authorization: Bearer <your-token>
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://ecom:ecom123@localhost:5432/ecom_carts` | PostgreSQL connection string |
| `PORT` | `8002` | Port to run the service |
| `JWT_SECRET_KEY` | `your-secret-key-change-in-production` | JWT secret key |
| `PRODUCT_SERVICE_URL` | `http://localhost:8001/api` | Product service URL for validation |

## Local Development

### 1. Install Dependencies
```bash
cd backend/cart-service
pip install -r requirements.txt
```

### 2. Setup Database
Ensure PostgreSQL is running and execute:
```bash
# From project root
./scripts/setup-database.sh
# OR
python scripts/create-db-standalone.py
```

### 3. Start Product Service First
The cart service validates products with the product service:
```bash
cd backend/product-service
python -m app.main
```

### 4. Run Cart Service
```bash
cd backend/cart-service
export DATABASE_URL="postgresql://ecom:ecom123@localhost:5432/ecom_carts"
export PRODUCT_SERVICE_URL="http://localhost:8001/api"
export PORT=8002

python -m app.main
```

### 5. Access API Documentation
- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

## Database Schema

### Carts Table
```sql
CREATE TABLE carts (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
    id VARCHAR PRIMARY KEY,
    cart_id VARCHAR REFERENCES carts(id),
    product_id VARCHAR NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price FLOAT NOT NULL
);
```

## Usage Examples

### 1. Login
```bash
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 2. Get Cart
```bash
curl -X GET http://localhost:8002/api/cart \
  -H "Authorization: Bearer <your-token>"
```

### 3. Add Product to Cart
```bash
curl -X POST http://localhost:8002/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"product_id": "1", "quantity": 2}'
```

### 4. Remove Product from Cart
```bash
curl -X DELETE http://localhost:8002/api/cart/remove/1 \
  -H "Authorization: Bearer <your-token>"
```

## Docker Usage

```bash
# Build image
docker build -t cart-service .

# Run container
docker run -p 8002:8002 \
  -e DATABASE_URL="postgresql://ecom:ecom123@host.docker.internal:5432/ecom_carts" \
  -e PRODUCT_SERVICE_URL="http://product-service:8001/api" \
  cart-service
```