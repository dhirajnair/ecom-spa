#!/bin/bash

# Database setup script for E-commerce microservices

set -e

echo "Setting up PostgreSQL databases for e-commerce microservices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}Error: PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    echo "Using Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15"
    exit 1
fi

echo -e "${YELLOW}Creating databases and user...${NC}"

# Create databases and user
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS ecom_products;" || true
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS ecom_carts;" || true
psql -h localhost -p 5432 -U postgres -c "DROP USER IF EXISTS ecom;" || true

psql -h localhost -p 5432 -U postgres -f scripts/init-db.sql

echo -e "${GREEN}✅ Databases created successfully!${NC}"

# Set environment variables for connection
export DATABASE_URL_PRODUCTS="postgresql://ecom:ecom123@localhost:5432/ecom_products"
export DATABASE_URL_CARTS="postgresql://ecom:ecom123@localhost:5432/ecom_carts"

echo -e "${YELLOW}Initializing Product Service database...${NC}"
cd backend/product-service
export DATABASE_URL="$DATABASE_URL_PRODUCTS"
python -c "
import sys, os
sys.path.append('.')
from app.database import create_tables, init_sample_data
create_tables()
init_sample_data()
print('Product Service database initialized!')
"

echo -e "${YELLOW}Initializing Cart Service database...${NC}"
cd ../cart-service
export DATABASE_URL="$DATABASE_URL_CARTS"
python -c "
import sys, os
sys.path.append('.')
from app.database import create_tables
create_tables()
print('Cart Service database initialized!')
"

cd ../..

echo -e "${GREEN}✅ All databases initialized successfully!${NC}"
echo ""
echo "Database connection details:"
echo "  Products DB: postgresql://ecom:ecom123@localhost:5432/ecom_products"
echo "  Carts DB:    postgresql://ecom:ecom123@localhost:5432/ecom_carts"
echo ""
echo "You can now start the services with:"
echo "  docker-compose up"