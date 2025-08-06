"""
Routes for Cart Service
"""
import uuid
import requests
import os
from fastapi import APIRouter, Depends, HTTPException, status
# Remove SQLAlchemy import
from datetime import timedelta
from typing import List

from .database import get_db, CartDB
from .models import Cart, CartItem, AddToCartRequest, LoginRequest, LoginResponse
from .auth import create_access_token, verify_token, verify_user_token, authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, MockCognitoAuth

router = APIRouter()

# Product service URL for validation
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8001/api")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cart-service"}


@router.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """User login endpoint - supports both local and Cognito mock authentication"""
    from shared.env_config import settings
    
    # For local development without Cognito, use mock authentication
    if not settings.USE_COGNITO_AUTH:
        # Try email-based authentication first (for mock Cognito users)
        user = MockCognitoAuth.authenticate_user(login_request.username, login_request.password)
        
        if not user:
            # Fall back to username-based authentication (original users)
            user = authenticate_user(login_request.username, login_request.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create token with consistent format
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        if "email" in user:
            # Mock Cognito format
            access_token = MockCognitoAuth.create_mock_token(user)
        else:
            # Original local format
            access_token = create_access_token(
                data={"sub": user["id"], "username": user["username"]},
                expires_delta=access_token_expires
            )
        
        return LoginResponse(
            access_token=access_token,
            user_id=user["user_id"] if "user_id" in user else user["id"],
            username=user["username"]
        )
    else:
        # TODO: For production with Cognito, implement proper Cognito authentication flow
        # This would typically redirect to Cognito hosted UI or use Cognito SDK
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Cognito authentication flow not implemented in this endpoint. Use Cognito hosted UI or SDK."
        )


@router.get("/cart", response_model=Cart)
async def get_cart(
    current_user=Depends(verify_user_token),
    db: CartDB = Depends(get_db)
):
    """Get user's cart"""
    cart = db.get_cart(current_user.user_id)
    
    if not cart:
        # Create new cart if doesn't exist
        cart_id = db.create_cart(current_user.user_id)
        if cart_id:
            cart = db.get_cart(current_user.user_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create cart"
            )
    
    # Calculate total
    total = db.calculate_cart_total(cart)
    
    # Convert datetime strings for response
    from datetime import datetime
    created_at = datetime.fromisoformat(cart['created_at'])
    updated_at = datetime.fromisoformat(cart['updated_at']) if cart.get('updated_at') else created_at
    
    cart_response = Cart(
        id=cart['id'],
        user_id=cart['user_id'],
        items=[CartItem(**item) for item in cart.get('items', [])],
        total=total,
        created_at=created_at,
        updated_at=updated_at
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
    current_user=Depends(verify_user_token),
    db: CartDB = Depends(get_db)
):
    """Add product to cart"""
    # Validate product
    product = await validate_product(request.product_id, request.quantity)
    
    # Add item to cart
    success = db.add_item_to_cart(
        user_id=current_user.user_id,
        product_id=request.product_id,
        quantity=request.quantity,
        price=product["price"]
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add product to cart"
        )
    
    return {"message": "Product added to cart successfully"}


@router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str,
    current_user=Depends(verify_user_token),
    db: CartDB = Depends(get_db)
):
    """Remove product from cart"""
    success = db.remove_item_from_cart(current_user.user_id, product_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in cart or cart doesn't exist"
        )
    
    return {"message": "Product removed from cart successfully"}


@router.delete("/cart/clear")
async def clear_cart(
    current_user=Depends(verify_user_token),
    db: CartDB = Depends(get_db)
):
    """Clear all items from cart"""
    success = db.clear_cart(current_user.user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    return {"message": "Cart cleared successfully"}