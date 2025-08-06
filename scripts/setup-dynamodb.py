#!/usr/bin/env python3
"""
DynamoDB setup script for e-commerce microservices
Sets up local DynamoDB tables and initializes sample data
"""

import os
import sys
import boto3
import time
from decimal import Decimal
from botocore.exceptions import ClientError

# Configuration
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "dummy")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")

# Table names
PRODUCTS_TABLE = "ecom-products"
CARTS_TABLE = "ecom-carts"

def get_dynamodb_client():
    """Get DynamoDB client"""
    return boto3.client(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def get_dynamodb_resource():
    """Get DynamoDB resource"""
    return boto3.resource(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def create_products_table():
    """Create products table"""
    dynamodb = get_dynamodb_client()
    
    try:
        response = dynamodb.create_table(
            TableName=PRODUCTS_TABLE,
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'category',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
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
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Wait for table to be active
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=PRODUCTS_TABLE)
        
        print(f"✅ Created {PRODUCTS_TABLE} table")
        return True
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"⚠️ {PRODUCTS_TABLE} table already exists")
            return True
        else:
            print(f"❌ Error creating {PRODUCTS_TABLE} table: {e}")
            return False

def create_carts_table():
    """Create carts table"""
    dynamodb = get_dynamodb_client()
    
    try:
        response = dynamodb.create_table(
            TableName=CARTS_TABLE,
            KeySchema=[
                {
                    'AttributeName': 'user_id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Wait for table to be active
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=CARTS_TABLE)
        
        print(f"✅ Created {CARTS_TABLE} table")
        return True
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"⚠️ {CARTS_TABLE} table already exists")
            return True
        else:
            print(f"❌ Error creating {CARTS_TABLE} table: {e}")
            return False

def init_sample_products():
    """Initialize sample product data"""
    dynamodb = get_dynamodb_resource()
    table = dynamodb.Table(PRODUCTS_TABLE)
    
    # Check if products already exist
    try:
        response = table.scan(Limit=1)
        if response['Items']:
            print("⚠️ Sample products already exist")
            return True
    except ClientError:
        pass
    
    sample_products = [
        {
            "id": "1",
            "name": "Wireless Headphones",
            "description": "High-quality wireless headphones with noise cancellation",
            "price": Decimal("199.99"),
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            "stock": 50
        },
        {
            "id": "2",
            "name": "Running Shoes",
            "description": "Comfortable running shoes for daily exercise",
            "price": Decimal("89.99"),
            "category": "Sports",
            "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
            "stock": 30
        },
        {
            "id": "3",
            "name": "Coffee Maker",
            "description": "Automatic coffee maker for perfect morning coffee",
            "price": Decimal("149.99"),
            "category": "Home",
            "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
            "stock": 25
        },
        {
            "id": "4",
            "name": "Smartphone",
            "description": "Latest smartphone with advanced camera system",
            "price": Decimal("699.99"),
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
            "stock": 40
        },
        {
            "id": "5",
            "name": "Book - Python Programming",
            "description": "Complete guide to Python programming for beginners",
            "price": Decimal("39.99"),
            "category": "Books",
            "image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
            "stock": 100
        }
    ]
    
    try:
        with table.batch_writer() as batch:
            for product in sample_products:
                batch.put_item(Item=product)
        
        print("✅ Sample products initialized successfully!")
        return True
        
    except ClientError as e:
        print(f"❌ Error initializing sample products: {e}")
        return False

def list_tables():
    """List all DynamoDB tables"""
    dynamodb = get_dynamodb_client()
    
    try:
        response = dynamodb.list_tables()
        tables = response['TableNames']
        
        print(f"\n📋 DynamoDB Tables ({len(tables)}):")
        for table in tables:
            print(f"  • {table}")
        
        return tables
        
    except ClientError as e:
        print(f"❌ Error listing tables: {e}")
        return []

def check_dynamodb_connection():
    """Check if DynamoDB is accessible"""
    try:
        dynamodb = get_dynamodb_client()
        dynamodb.list_tables()
        print("✅ DynamoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ DynamoDB connection failed: {e}")
        print(f"   Make sure DynamoDB Local is running on {DYNAMODB_ENDPOINT}")
        return False

def main():
    """Main setup function"""
    print("🚀 E-commerce DynamoDB Setup")
    print("=" * 40)
    print(f"DynamoDB Endpoint: {DYNAMODB_ENDPOINT}")
    print(f"AWS Region: {AWS_REGION}")
    print()
    
    # Check connection
    if not check_dynamodb_connection():
        print("\n💡 To start DynamoDB Local:")
        print("   docker run -p 8000:8000 amazon/dynamodb-local")
        sys.exit(1)
    
    # Create tables
    print("\n🔧 Creating tables...")
    products_success = create_products_table()
    carts_success = create_carts_table()
    
    if not (products_success and carts_success):
        print("❌ Failed to create some tables")
        sys.exit(1)
    
    # Initialize sample data
    print("\n🌱 Initializing sample data...")
    if not init_sample_products():
        print("❌ Failed to initialize sample data")
        sys.exit(1)
    
    # List tables
    list_tables()
    
    print("\n🎉 DynamoDB setup completed successfully!")
    print("\nYou can now start the services with:")
    print("  make up")
    print("  # OR")
    print("  docker-compose up")

if __name__ == "__main__":
    main()
