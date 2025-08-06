"""
Routes for Product Service
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from .database import get_db, ProductDB
from .models import Product, ProductList

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "product-service"}


@router.get("/products", response_model=ProductList)
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=100, description="Number of products to return"),
    offset: int = Query(0, ge=0, description="Number of products to skip"),
    db: ProductDB = Depends(get_db)
):
    """Get list of all products with optional filtering"""
    products = db.get_products(category=category, limit=limit, offset=offset)
    
    # Get total count (for pagination)
    if category:
        all_products = db.get_products(category=category, limit=1000)  # Get more for count
        total = len(all_products)
    else:
        all_products = db.get_all_products()
        total = len(all_products)
    
    return ProductList(
        products=[Product(**product) for product in products],
        total=total
    )


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, db: ProductDB = Depends(get_db)):
    """Get product details by ID"""
    product = db.get_product(product_id)
    
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    return Product(**product)


@router.get("/categories")
async def get_categories(db: ProductDB = Depends(get_db)):
    """Get all product categories"""
    categories = db.get_categories()
    return {"categories": categories}