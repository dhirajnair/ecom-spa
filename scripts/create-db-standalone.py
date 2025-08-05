#!/usr/bin/env python3
"""
Standalone database creation script for development
Use this if you prefer Python over shell scripts
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_databases():
    """Create PostgreSQL databases for microservices"""
    
    # Database configuration
    HOST = os.getenv('DB_HOST', 'localhost')
    PORT = os.getenv('DB_PORT', '5432')
    ADMIN_USER = os.getenv('DB_ADMIN_USER', 'postgres')
    ADMIN_PASSWORD = os.getenv('DB_ADMIN_PASSWORD', 'postgres')
    
    print("🔄 Connecting to PostgreSQL...")
    
    try:
        # Connect to PostgreSQL as admin
        conn = psycopg2.connect(
            host=HOST,
            port=PORT,
            user=ADMIN_USER,
            password=ADMIN_PASSWORD,
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("✅ Connected to PostgreSQL")
        
        # Drop existing databases and user if they exist
        cur.execute("DROP DATABASE IF EXISTS ecom_products;")
        cur.execute("DROP DATABASE IF EXISTS ecom_carts;")
        cur.execute("DROP USER IF EXISTS ecom;")
        
        # Create user
        cur.execute("CREATE USER ecom WITH PASSWORD 'ecom123';")
        print("✅ Created user 'ecom'")
        
        # Create databases
        cur.execute("CREATE DATABASE ecom_products OWNER ecom;")
        cur.execute("CREATE DATABASE ecom_carts OWNER ecom;")
        print("✅ Created databases")
        
        # Grant privileges
        cur.execute("GRANT ALL PRIVILEGES ON DATABASE ecom_products TO ecom;")
        cur.execute("GRANT ALL PRIVILEGES ON DATABASE ecom_carts TO ecom;")
        print("✅ Granted privileges")
        
        cur.close()
        conn.close()
        
        print("\n🎉 Database setup completed successfully!")
        print("\nConnection strings:")
        print("  Products: postgresql://ecom:ecom123@localhost:5432/ecom_products")
        print("  Carts:    postgresql://ecom:ecom123@localhost:5432/ecom_carts")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


def init_service_tables():
    """Initialize tables for each service"""
    print("\n🔄 Initializing service tables...")
    
    # Initialize Product Service
    try:
        os.environ['DATABASE_URL'] = 'postgresql://ecom:ecom123@localhost:5432/ecom_products'
        sys.path.append('backend/product-service')
        from app.database import create_tables as create_product_tables, init_sample_data
        
        create_product_tables()
        init_sample_data()
        print("✅ Product Service tables initialized")
        
    except Exception as e:
        print(f"❌ Error initializing Product Service: {e}")
    
    # Initialize Cart Service
    try:
        os.environ['DATABASE_URL'] = 'postgresql://ecom:ecom123@localhost:5432/ecom_carts'
        sys.path.append('backend/cart-service')
        from app.database import create_tables as create_cart_tables
        
        create_cart_tables()
        print("✅ Cart Service tables initialized")
        
    except Exception as e:
        print(f"❌ Error initializing Cart Service: {e}")


if __name__ == "__main__":
    print("🚀 E-commerce Database Setup")
    print("=" * 40)
    
    create_databases()
    init_service_tables()
    
    print("\n✅ All done! You can now start the services.")