"""
Database configuration for Product Service
"""
import os
from sqlalchemy import create_engine, Column, String, Float, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ecom:ecom123@localhost:5432/ecom_products")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class ProductDB(Base):
    """SQLAlchemy model for Product"""
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, index=True, nullable=False)
    image_url = Column(String, nullable=False)
    stock = Column(Integer, nullable=False, default=0)


def get_db():
    """Database dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def init_sample_data():
    """Initialize sample product data"""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(ProductDB).count() > 0:
            return
        
        sample_products = [
            ProductDB(
                id="1",
                name="Wireless Headphones",
                description="High-quality wireless headphones with noise cancellation",
                price=199.99,
                category="Electronics",
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
                stock=50
            ),
            ProductDB(
                id="2",
                name="Running Shoes",
                description="Comfortable running shoes for daily exercise",
                price=89.99,
                category="Sports",
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
                stock=30
            ),
            ProductDB(
                id="3",
                name="Coffee Maker",
                description="Automatic coffee maker for perfect morning coffee",
                price=149.99,
                category="Home",
                image_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
                stock=25
            ),
            ProductDB(
                id="4",
                name="Smartphone",
                description="Latest smartphone with advanced camera system",
                price=699.99,
                category="Electronics",
                image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
                stock=40
            ),
            ProductDB(
                id="5",
                name="Book - Python Programming",
                description="Complete guide to Python programming for beginners",
                price=39.99,
                category="Books",
                image_url="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
                stock=100
            )
        ]
        
        db.add_all(sample_products)
        db.commit()
        print("Sample product data initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing sample data: {e}")
        db.rollback()
    finally:
        db.close()