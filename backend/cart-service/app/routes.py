"""
Routes for Cart Service
"""
import uuid
import requests
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from .database import get_db, CartDB, CartItemDB
from .models import Cart, CartItem, AddToCartRequest, LoginRequest, LoginResponse
from .auth import create_access_token, verify_token, authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# Product service URL for validation
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8001/api")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cart-service"}


@router.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """User login endpoint"""
    user = authenticate_user(login_request.username, login_request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "username": user["username"]},
        expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        user_id=user["id"],
        username=user["username"]
    )


@router.get("/cart", response_model=Cart)
async def get_cart(
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get user's cart"""
    cart = db.query(CartDB).filter(CartDB.user_id == current_user.user_id).first()
    
    if not cart:
        # Create new cart if doesn't exist
        cart_id = str(uuid.uuid4())
        cart = CartDB(
            id=cart_id,
            user_id=current_user.user_id
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Calculate total
    total = sum(item.price * item.quantity for item in cart.items)
    
    cart_response = Cart(
        id=cart.id,
        user_id=cart.user_id,
        items=[CartItem.from_orm(item) for item in cart.items],
        total=total,
        created_at=cart.created_at,
        updated_at=cart.updated_at
    )
    
    return cart_response


async def validate_product(product_id: str, quantity: int):
    """Validate product exists and has sufficient stock"""
    try:
        response = requests.get(f"{PRODUCT_SERVICE_URL}/products/{product_id}")
        if response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )
        elif response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Product service unavailable"
            )
        
        product = response.json()
        if product["stock"] < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product['stock']}, Requested: {quantity}"
            )
        
        return product
        
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Product service unavailable"
        )


@router.post("/cart/add")
async def add_to_cart(
    request: AddToCartRequest,
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Add product to cart"""
    # Validate product
    product = await validate_product(request.product_id, request.quantity)
    
    # Get or create cart
    cart = db.query(CartDB).filter(CartDB.user_id == current_user.user_id).first()
    if not cart:
        cart_id = str(uuid.uuid4())
        cart = CartDB(
            id=cart_id,
            user_id=current_user.user_id
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    # Check if item already exists in cart
    existing_item = db.query(CartItemDB).filter(
        CartItemDB.cart_id == cart.id,
        CartItemDB.product_id == request.product_id
    ).first()
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + request.quantity
        await validate_product(request.product_id, new_quantity)  # Re-validate total quantity
        existing_item.quantity = new_quantity
    else:
        # Add new item
        item_id = str(uuid.uuid4())
        cart_item = CartItemDB(
            id=item_id,
            cart_id=cart.id,
            product_id=request.product_id,
            quantity=request.quantity,
            price=product["price"]
        )
        db.add(cart_item)
    
    db.commit()
    
    return {"message": "Product added to cart successfully"}


@router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Remove product from cart"""
    cart = db.query(CartDB).filter(CartDB.user_id == current_user.user_id).first()
    
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    cart_item = db.query(CartItemDB).filter(
        CartItemDB.cart_id == cart.id,
        CartItemDB.product_id == product_id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in cart"
        )
    
    db.delete(cart_item)
    db.commit()
    
    return {"message": "Product removed from cart successfully"}


@router.delete("/cart/clear")
async def clear_cart(
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Clear all items from cart"""
    cart = db.query(CartDB).filter(CartDB.user_id == current_user.user_id).first()
    
    if cart:
        # Delete all cart items
        db.query(CartItemDB).filter(CartItemDB.cart_id == cart.id).delete()
        db.commit()
    
    return {"message": "Cart cleared successfully"}