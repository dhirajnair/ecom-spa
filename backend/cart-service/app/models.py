"""
Pydantic models for Cart Service
"""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class CartItemBase(BaseModel):
    product_id: str
    quantity: int
    price: float


class CartItemCreate(CartItemBase):
    pass


class CartItem(CartItemBase):
    id: str
    
    class Config:
        from_attributes = True


class CartBase(BaseModel):
    user_id: str


class Cart(CartBase):
    id: str
    items: List[CartItem]
    total: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str