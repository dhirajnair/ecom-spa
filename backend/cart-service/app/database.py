"""
Database configuration for Cart Service - DynamoDB
"""
import os
import sys
import uuid
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime
from boto3.dynamodb.conditions import Key

# Add shared module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../shared'))

from shared.dynamodb_utils import (
    get_dynamodb_resource, 
    create_table_if_not_exists,
    safe_get_item,
    safe_put_item,
    safe_update_item,
    safe_delete_item,
    safe_query
)

# Import configuration
from shared.env_config import config

def get_carts_table():
    """Get DynamoDB carts table"""
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(config.CARTS_TABLE_NAME)

def create_carts_table():
    """Create carts table if it doesn't exist"""
    return create_table_if_not_exists(
        table_name=config.CARTS_TABLE_NAME,
        key_schema=[
            {
                'AttributeName': 'user_id',
                'KeyType': 'HASH'
            }
        ],
        attribute_definitions=[
            {
                'AttributeName': 'user_id',
                'AttributeType': 'S'
            }
        ]
    )

class CartDB:
    """DynamoDB model for Cart"""
    
    def __init__(self):
        self.table = get_carts_table()
    
    def get_cart(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cart by user ID"""
        item = safe_get_item(self.table, {'user_id': user_id})
        if item:
            return self._convert_decimals(item)
        return None
    
    def create_cart(self, user_id: str) -> str:
        """Create a new cart for user"""
        cart_id = str(uuid.uuid4())
        cart_data = {
            'user_id': user_id,
            'id': cart_id,
            'items': [],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        success = safe_put_item(self.table, cart_data)
        return cart_id if success else None
    
    def add_item_to_cart(self, user_id: str, product_id: str, quantity: int, price: float) -> bool:
        """Add item to cart or update quantity if exists"""
        cart = self.get_cart(user_id)
        
        if not cart:
            # Create new cart
            cart_id = self.create_cart(user_id)
            if not cart_id:
                return False
            cart = self.get_cart(user_id)
        
        # Find existing item
        items = cart.get('items', [])
        existing_item = None
        item_index = -1
        
        for i, item in enumerate(items):
            if item['product_id'] == product_id:
                existing_item = item
                item_index = i
                break
        
        if existing_item:
            # Update existing item
            items[item_index]['quantity'] = existing_item['quantity'] + quantity
        else:
            # Add new item
            new_item = {
                'id': str(uuid.uuid4()),
                'product_id': product_id,
                'quantity': quantity,
                'price': Decimal(str(price))
            }
            items.append(new_item)
        
        # Update cart
        return safe_update_item(
            self.table,
            {'user_id': user_id},
            'SET items = :items, updated_at = :updated_at',
            {
                ':items': items,
                ':updated_at': datetime.utcnow().isoformat()
            }
        )
    
    def remove_item_from_cart(self, user_id: str, product_id: str) -> bool:
        """Remove item from cart"""
        cart = self.get_cart(user_id)
        if not cart:
            return False
        
        items = cart.get('items', [])
        updated_items = [item for item in items if item['product_id'] != product_id]
        
        return safe_update_item(
            self.table,
            {'user_id': user_id},
            'SET items = :items, updated_at = :updated_at',
            {
                ':items': updated_items,
                ':updated_at': datetime.utcnow().isoformat()
            }
        )
    
    def clear_cart(self, user_id: str) -> bool:
        """Clear all items from cart"""
        return safe_update_item(
            self.table,
            {'user_id': user_id},
            'SET items = :items, updated_at = :updated_at',
            {
                ':items': [],
                ':updated_at': datetime.utcnow().isoformat()
            }
        )
    
    def calculate_cart_total(self, cart: Dict[str, Any]) -> float:
        """Calculate total price of cart"""
        total = 0.0
        for item in cart.get('items', []):
            total += float(item['price']) * item['quantity']
        return total
    
    def _convert_decimals(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Decimal values to float for JSON serialization"""
        def convert_value(value):
            if isinstance(value, Decimal):
                return float(value)
            elif isinstance(value, list):
                return [convert_value(v) for v in value]
            elif isinstance(value, dict):
                return {k: convert_value(v) for k, v in value.items()}
            else:
                return value
        
        return {key: convert_value(value) for key, value in item.items()}

def get_db():
    """Database dependency - returns CartDB instance"""
    return CartDB()

def create_tables():
    """Create all tables"""
    create_carts_table()