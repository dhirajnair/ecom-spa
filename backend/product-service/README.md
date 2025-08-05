# Product Service

FastAPI microservice for managing e-commerce products with PostgreSQL database.

## Features

- Product CRUD operations
- Category filtering
- Stock management
- Health checks
- SQLAlchemy ORM with PostgreSQL
- Auto-generated API documentation

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - List all products with optional filtering
- `GET /api/products/{id}` - Get product details
- `GET /api/categories` - Get all product categories

### Query Parameters for `/api/products`
- `category` (optional) - Filter by category
- `limit` (optional, default: 100) - Number of products to return
- `offset` (optional, default: 0) - Number of products to skip

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://ecom:ecom123@localhost:5432/ecom_products` | PostgreSQL connection string |
| `PORT` | `8001` | Port to run the service |
| `JWT_SECRET_KEY` | `your-secret-key-change-in-production` | JWT secret (inherited from shared) |

## Local Development

### 1. Install Dependencies
```bash
cd backend/product-service
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

### 3. Run the Service
```bash
# Set environment variables
export DATABASE_URL="postgresql://ecom:ecom123@localhost:5432/ecom_products"
export PORT=8001

# Run the service
python -m app.main
```

### 4. Access API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT NOT NULL,
    price FLOAT NOT NULL,
    category VARCHAR NOT NULL,
    image_url VARCHAR NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
);
```

## Sample Data

The service automatically loads sample products on startup:
- Wireless Headphones (Electronics)
- Running Shoes (Sports)
- Coffee Maker (Home)
- Smartphone (Electronics)
- Python Programming Book (Books)

## Docker Usage

```bash
# Build image
docker build -t product-service .

# Run container
docker run -p 8001:8001 \
  -e DATABASE_URL="postgresql://ecom:ecom123@host.docker.internal:5432/ecom_products" \
  product-service
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Get all products
curl http://localhost:8001/api/products

# Get product by ID
curl http://localhost:8001/api/products/1

# Filter by category
curl "http://localhost:8001/api/products?category=Electronics"
```