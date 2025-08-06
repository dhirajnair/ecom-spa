"""
Environment configuration using Pydantic models with dotenv integration
"""
import os
from pathlib import Path
from typing import Optional, Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic BaseSettings"""
    
    # Environment
    ENV: Literal["local", "dev", "staging", "prod"] = Field(default="local", description="Environment mode")
    
    # AWS Configuration
    AWS_REGION: str = Field(default="us-west-2", description="AWS region")
    AWS_ACCESS_KEY_ID: str = Field(default="dummy", description="AWS access key ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="dummy", description="AWS secret access key")
    
    # DynamoDB Configuration
    DYNAMODB_ENDPOINT: Optional[str] = Field(default=None, description="DynamoDB endpoint URL for local development")
    PRODUCTS_TABLE_NAME: str = Field(default="ecom-products", description="Products table name")
    CARTS_TABLE_NAME: str = Field(default="ecom-carts", description="Carts table name")
    
    # Service Configuration
    PORT: int = Field(default=8001, description="Service port")
    JWT_SECRET_KEY: str = Field(default="change-this-secret-key-in-production-min-32-chars", description="JWT secret key")
    
    # Cognito Configuration
    COGNITO_USER_POOL_ID: Optional[str] = Field(default=None, description="Cognito User Pool ID")
    COGNITO_USER_POOL_REGION: str = Field(default="us-west-2", description="Cognito User Pool Region")
    COGNITO_WEB_CLIENT_ID: Optional[str] = Field(default=None, description="Cognito Web Client ID")
    COGNITO_API_CLIENT_ID: Optional[str] = Field(default=None, description="Cognito API Client ID")
    COGNITO_API_CLIENT_SECRET: Optional[str] = Field(default=None, description="Cognito API Client Secret")
    USE_COGNITO_AUTH: bool = Field(default=False, description="Use Cognito for authentication instead of local JWT")
    
    # Inter-service Communication
    PRODUCT_SERVICE_URL: str = Field(default="http://localhost:8001/api", description="Product service URL")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # Additional Configuration
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost", description="CORS origins")
    ALLOWED_HOSTS: str = Field(default="localhost,127.0.0.1", description="Allowed hosts")
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v, info):
        """Validate JWT secret key"""
        values = info.data if info else {}
        if values.get("ENV") == "prod" and "change-this-secret-key" in v:
            raise ValueError("JWT_SECRET_KEY must be changed for production environment")
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY should be at least 32 characters long")
        return v
    
    @field_validator("DYNAMODB_ENDPOINT")
    @classmethod
    def validate_dynamodb_endpoint(cls, v, info):
        """Set DynamoDB endpoint based on environment"""
        values = info.data if info else {}
        env = values.get("ENV", "local")
        if env == "local" and v is None:
            return "http://localhost:8000"
        elif env != "local" and v is not None:
            # In production, we should use AWS DynamoDB (no endpoint)
            return None
        return v
    
    @field_validator("USE_COGNITO_AUTH")
    @classmethod
    def validate_cognito_config(cls, v, info):
        """Validate Cognito configuration based on USE_COGNITO_AUTH setting"""
        values = info.data if info else {}
        if v:  # If using Cognito auth
            required_fields = ["COGNITO_USER_POOL_ID", "COGNITO_WEB_CLIENT_ID"]
            for field in required_fields:
                if not values.get(field):
                    print(f"⚠️  Warning: {field} is required when USE_COGNITO_AUTH is True")
        return v
    
    def is_local(self) -> bool:
        """Check if running in local environment"""
        return self.ENV == "local"
    
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENV == "prod"
    
    def get_cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    def get_allowed_hosts_list(self) -> list[str]:
        """Get allowed hosts as a list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    class Config:
        # Environment file configuration
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
        # Look for .env files in multiple locations
        @classmethod
        def customise_sources(cls, init_settings, env_settings, file_secret_settings):
            """Customize settings sources to look for .env files in multiple locations"""
            
            def env_file_loader():
                """Load environment from .env files with priority order"""
                env_mode = os.getenv("ENV", "local")
                
                if env_mode == "local":
                    # Look for .env file in multiple locations (priority order)
                    possible_env_paths = [
                        Path.cwd() / ".env",  # Current working directory
                        Path(__file__).parent.parent / ".env",  # backend/.env
                        Path(__file__).parent.parent.parent / ".env",  # project root/.env
                    ]
                    
                    for env_path in possible_env_paths:
                        if env_path.exists():
                            print(f"✅ Loading environment from: {env_path}")
                            # Load the .env file
                            from dotenv import load_dotenv
                            load_dotenv(env_path)
                            break
                    else:
                        print("⚠️  No .env file found, using OS environment variables")
                
                # Return empty dict as dotenv already loaded variables into os.environ
                return {}
            
            return (
                init_settings,
                env_file_loader,
                env_settings,
                file_secret_settings,
            )


# Create global settings instance
try:
    settings = Settings()
    print(f"📋 Configuration loaded for environment: {settings.ENV}")
    if settings.is_local():
        print(f"🗄️  DynamoDB endpoint: {settings.DYNAMODB_ENDPOINT}")
    print(f"🔧 Service port: {settings.PORT}")
except Exception as e:
    print(f"❌ Error loading configuration: {e}")
    raise


# Legacy alias for backward compatibility
config = settings


# Convenience functions for backward compatibility
def get_aws_region() -> str:
    return settings.AWS_REGION


def get_dynamodb_endpoint() -> Optional[str]:
    return settings.DYNAMODB_ENDPOINT


def get_products_table_name() -> str:
    return settings.PRODUCTS_TABLE_NAME


def get_carts_table_name() -> str:
    return settings.CARTS_TABLE_NAME


def get_jwt_secret() -> str:
    return settings.JWT_SECRET_KEY


def get_product_service_url() -> str:
    return settings.PRODUCT_SERVICE_URL
