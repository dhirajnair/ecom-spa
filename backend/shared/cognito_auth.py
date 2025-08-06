"""
AWS Cognito authentication utilities for microservices
"""
import json
import requests
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .env_config import settings
from .models import UserToken

security = HTTPBearer()

# Cache for JWKS (JSON Web Key Set)
_jwks_cache: Optional[Dict[str, Any]] = None


def get_cognito_jwks() -> Dict[str, Any]:
    """
    Get JWKS (JSON Web Key Set) from Cognito
    Used to verify JWT tokens
    """
    global _jwks_cache
    
    if _jwks_cache is None:
        if not settings.COGNITO_USER_POOL_ID or not settings.COGNITO_USER_POOL_REGION:
            raise ValueError("Cognito User Pool ID and Region must be configured")
        
        jwks_url = f"https://cognito-idp.{settings.COGNITO_USER_POOL_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        
        try:
            response = requests.get(jwks_url, timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json()
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Unable to fetch JWKS from Cognito: {str(e)}"
            )
    
    return _jwks_cache


def get_rsa_key(token_header: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Get the RSA key for token verification from JWKS
    """
    jwks = get_cognito_jwks()
    
    for key in jwks.get("keys", []):
        if key.get("kid") == token_header.get("kid"):
            return {
                "kty": key.get("kty"),
                "kid": key.get("kid"),
                "use": key.get("use"),
                "n": key.get("n"),
                "e": key.get("e")
            }
    
    return None


def verify_cognito_token(token: str) -> UserToken:
    """
    Verify Cognito JWT token and return user information
    """
    try:
        # Get token header
        unverified_header = jwt.get_unverified_header(token)
        
        # Get RSA key for verification
        rsa_key = get_rsa_key(unverified_header)
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key for token verification",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.COGNITO_WEB_CLIENT_ID,
            issuer=f"https://cognito-idp.{settings.COGNITO_USER_POOL_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"
        )
        
        # Extract user information from token
        user_id = payload.get("sub")
        username = payload.get("cognito:username") or payload.get("email")
        email = payload.get("email")
        
        if not user_id or not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing required user information",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check token use (should be 'access' for API access)
        token_use = payload.get("token_use")
        if token_use != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: wrong token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return UserToken(
            user_id=user_id,
            username=username,
            email=email,
            exp=payload.get("exp")
        )
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token processing error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_cognito_token_dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserToken:
    """
    FastAPI dependency for verifying Cognito tokens
    """
    return verify_cognito_token(credentials.credentials)


# Mock Cognito functionality for local development
class MockCognitoAuth:
    """
    Mock Cognito authentication for local development
    Provides similar interface but uses simple local logic
    """
    
    # Mock users for local development
    MOCK_USERS = {
        "admin@example.com": {
            "user_id": "mock-admin-id",
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin123"
        },
        "user@example.com": {
            "user_id": "mock-user-id", 
            "username": "user",
            "email": "user@example.com",
            "password": "user123"
        }
    }
    
    @staticmethod
    def create_mock_token(user_info: Dict[str, Any]) -> str:
        """Create a mock JWT token for local development"""
        from .auth_utils import create_access_token
        
        payload = {
            "sub": user_info["user_id"],
            "username": user_info["username"],
            "email": user_info["email"],
            "token_use": "access",
            "cognito:username": user_info["username"]
        }
        
        return create_access_token(payload)
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email/password for local development"""
        user = MockCognitoAuth.MOCK_USERS.get(email)
        if user and user["password"] == password:
            return user
        return None
    
    @staticmethod
    def verify_mock_token(token: str) -> UserToken:
        """Verify mock token for local development"""
        from .auth_utils import verify_token_internal
        
        try:
            payload = verify_token_internal(token)
            
            return UserToken(
                user_id=payload.get("sub"),
                username=payload.get("username"),
                email=payload.get("email"),
                exp=payload.get("exp")
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Mock token validation failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )


def verify_token_unified(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserToken:
    """
    Unified token verification that works with both Cognito and local JWT
    Uses Cognito in production/cloud environments, local JWT for development
    """
    if settings.USE_COGNITO_AUTH and settings.COGNITO_USER_POOL_ID:
        # Use Cognito authentication
        return verify_cognito_token(credentials.credentials)
    else:
        # Use local mock authentication for development
        return MockCognitoAuth.verify_mock_token(credentials.credentials)
