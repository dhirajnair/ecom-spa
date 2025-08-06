"""
Shared authentication utilities for microservices
"""
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .models import UserToken

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token_internal(token: str) -> dict:
    """Internal function to verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserToken:
    """Verify JWT token and return user information"""
    payload = verify_token_internal(credentials.credentials)
    
    user_id: str = payload.get("sub")
    username: str = payload.get("username")
    email: str = payload.get("email")
    exp_timestamp = payload.get("exp")
    exp = datetime.fromtimestamp(exp_timestamp) if exp_timestamp else None
    
    if user_id is None or username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserToken(user_id=user_id, username=username, email=email, exp=exp)


# Sample users for authentication (in production, use proper user management)
USERS_DB = {
    "admin": {
        "id": "1",
        "username": "admin",
        "password": "admin123",  # In production, use hashed passwords
    },
    "user": {
        "id": "2", 
        "username": "user",
        "password": "user123",
    }
}


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user credentials"""
    user = USERS_DB.get(username)
    if user and user["password"] == password:
        return user
    return None