"""
Pydantic models for Product Service
"""
from pydantic import BaseModel
from typing import List


class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: str
    
    class Config:
        from_attributes = True


class ProductList(BaseModel):
    products: List[Product]
    total: int