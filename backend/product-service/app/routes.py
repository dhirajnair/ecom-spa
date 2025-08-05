"""
Routes for Product Service
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
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
    db: Session = Depends(get_db)
):
    """Get list of all products with optional filtering"""
    query = db.query(ProductDB)
    
    if category:
        query = query.filter(ProductDB.category.ilike(f"%{category}%"))
    
    total = query.count()
    products = query.offset(offset).limit(limit).all()
    
    return ProductList(
        products=[Product.from_orm(product) for product in products],
        total=total
    )


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get product details by ID"""
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    return Product.from_orm(product)


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all product categories"""
    categories = db.query(ProductDB.category).distinct().all()
    return {"categories": [cat[0] for cat in categories]}