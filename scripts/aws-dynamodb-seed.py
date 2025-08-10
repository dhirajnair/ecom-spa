#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AWS DynamoDB seeding script for e-commerce microservices
Creates AWS DynamoDB tables and initializes sample data
"""

import os
import sys
import argparse
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError

def get_dynamodb_resource():
    """Get DynamoDB resource for AWS"""
    region = os.getenv("AWS_REGION", "ap-south-1")
    return boto3.resource('dynamodb', region_name=region)

def get_dynamodb_client():
    """Get DynamoDB client for AWS"""
    region = os.getenv("AWS_REGION", "ap-south-1")
    return boto3.client('dynamodb', region_name=region)

def check_table_exists_and_empty(table_name):
    """Check if table exists and is empty"""
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(table_name)
        
        # Check if table exists by trying to get its status
        table.load()
        
        # Check if table is empty
        response = table.scan(Limit=1)
        item_count = response.get('Count', 0)
        
        print(f"✅ Table '{table_name}' exists with {item_count} items")
        return True, item_count == 0
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"❌ Table '{table_name}' does not exist")
            return False, True
        else:
            print(f"❌ Error checking table '{table_name}': {e}")
            return False, False

def seed_products_table(products_table_name):
    """Seed the products table with sample data"""
    print(f"🌱 Seeding products table '{products_table_name}'...")
    
    # Check if table exists and is empty
    table_exists, is_empty = check_table_exists_and_empty(products_table_name)
    
    if not table_exists:
        print(f"❌ Products table '{products_table_name}' does not exist. Please create it first.")
        return False
    
    if not is_empty:
        print(f"⚠️ Products table '{products_table_name}' already has data, skipping seed.")
        return True
    
    # Sample products data
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
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(products_table_name)
        
        # Use batch writer for efficient writes
        with table.batch_writer() as batch:
            for product in sample_products:
                batch.put_item(Item=product)
                print(f"  ✅ Added product: {product['name']}")
        
        print(f"🎉 Successfully seeded {len(sample_products)} products into '{products_table_name}'")
        return True
        
    except ClientError as e:
        print(f"❌ Error seeding products table: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='AWS DynamoDB seeding script')
    parser.add_argument('--products-table', 
                       default=os.getenv('PRODUCTS_TABLE_NAME', None),
                       help='Products table name')
    parser.add_argument('--carts-table', 
                       default=os.getenv('CARTS_TABLE_NAME', None),
                       help='Carts table name')
    parser.add_argument('--region',
                       default=os.getenv('AWS_REGION', 'ap-south-1'),
                       help='AWS region')
    parser.add_argument('--project-name',
                       default=os.getenv('PROJECT_NAME', 'ecom-spa'),
                       help='Project name (used for table naming)')
    parser.add_argument('--environment',
                       default=os.getenv('ENVIRONMENT', 'dev'),
                       help='Environment (dev, staging, prod)')
    
    # Generate table names using Terraform pattern if not provided
    def get_table_name(table_type, args):
        if table_type == 'products' and args.products_table:
            return args.products_table
        elif table_type == 'carts' and args.carts_table:
            return args.carts_table
        else:
            # Use Terraform naming pattern: {project_name}-{environment}-{table_type}
            return f"{args.project_name}-{args.environment}-{table_type}"
    
    args = parser.parse_args()
    
    # Generate table names using the helper function
    products_table = get_table_name('products', args)
    carts_table = get_table_name('carts', args)
    
    # Set AWS region environment variable
    os.environ['AWS_REGION'] = args.region
    
    print("🚀 AWS DynamoDB Seeding Script")
    print("=" * 40)
    print(f"Project: {args.project_name}")
    print(f"Environment: {args.environment}")
    print(f"AWS Region: {args.region}")
    print(f"Products Table: {products_table}")
    print(f"Carts Table: {carts_table}")
    print()
    
    # Seed products table
    success = seed_products_table(products_table)
    
    if success:
        print("\n🎉 DynamoDB seeding completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ DynamoDB seeding failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
