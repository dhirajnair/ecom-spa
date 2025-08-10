"""
Database configuration for Product Service - DynamoDB
"""
import os
import sys
import uuid
from decimal import Decimal
from typing import Optional, List, Dict, Any
from boto3.dynamodb.conditions import Key, Attr

# Add shared module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../shared'))

from shared.dynamodb_utils import (
    get_dynamodb_resource, 
    create_table_if_not_exists,
    safe_get_item,
    safe_put_item,
    safe_scan,
    safe_query
)

# Import configuration
from shared.env_config import config

def get_products_table():
    """Get DynamoDB products table"""
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(config.PRODUCTS_TABLE_NAME)

def create_products_table():
    """Create products table if it doesn't exist"""
    return create_table_if_not_exists(
        table_name=config.PRODUCTS_TABLE_NAME,
        key_schema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            }
        ],
        attribute_definitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'category',
                'AttributeType': 'S'
            }
        ],
        global_secondary_indexes=[
            {
                'IndexName': 'category-index',
                'KeySchema': [
                    {
                        'AttributeName': 'category',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                }
            }
        ]
    )

class ProductDB:
    """DynamoDB model for Product"""
    
    def __init__(self):
        self.table = get_products_table()
    
    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get product by ID"""
        item = safe_get_item(self.table, {'id': product_id})
        if item:
            # Convert Decimal to float for JSON serialization
            return self._convert_decimals(item)
        return None
    
    def get_products(self, category: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get products with optional category filter"""
        if category:
            # Query by category using GSI
            items = safe_query(
                self.table,
                IndexName='category-index',
                KeyConditionExpression=Key('category').eq(category),
                Limit=limit + offset
            )
        else:
            # Scan all products
            items = safe_scan(self.table, Limit=limit + offset)
        
        # Apply offset and convert decimals
        products = items[offset:offset + limit] if offset > 0 else items[:limit]
        return [self._convert_decimals(item) for item in products]
    
    def get_all_products(self) -> List[Dict[str, Any]]:
        """Get all products"""
        items = safe_scan(self.table)
        return [self._convert_decimals(item) for item in items]
    
    def create_product(self, product_data: Dict[str, Any]) -> bool:
        """Create a new product"""
        # Convert float to Decimal for DynamoDB
        product_data = self._convert_floats_to_decimals(product_data)
        return safe_put_item(self.table, product_data)
    
    def get_categories(self) -> List[str]:
        """Get all unique categories"""
        items = safe_scan(self.table, ProjectionExpression='category')
        categories = set()
        for item in items:
            if 'category' in item:
                categories.add(item['category'])
        return sorted(list(categories))
    
    def _convert_decimals(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Decimal values to float for JSON serialization"""
        converted = {}
        for key, value in item.items():
            if isinstance(value, Decimal):
                converted[key] = float(value)
            else:
                converted[key] = value
        return converted
    
    def _convert_floats_to_decimals(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert float values to Decimal for DynamoDB"""
        converted = {}
        for key, value in item.items():
            if isinstance(value, float):
                converted[key] = Decimal(str(value))
            else:
                converted[key] = value
        return converted


def get_db():
    """Database dependency - returns ProductDB instance"""
    return ProductDB()


def create_tables():
    """Create all tables"""
    create_products_table()
