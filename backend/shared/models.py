"""
Shared Pydantic models for microservices
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserToken(BaseModel):
    user_id: str
    username: str
    email: Optional[str] = None
    exp: Optional[datetime] = None


class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int


class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float


class Cart(BaseModel):
    user_id: str
    items: list[CartItem]
    total: float
    created_at: datetime
    updated_at: Optional[datetime] = None