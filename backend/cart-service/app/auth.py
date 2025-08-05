"""
Authentication module for Cart Service
"""
import sys
import os
from datetime import timedelta

# Add shared module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../shared'))

from shared.auth_utils import (
    create_access_token, 
    verify_token, 
    authenticate_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

__all__ = [
    'create_access_token',
    'verify_token', 
    'authenticate_user',
    'ACCESS_TOKEN_EXPIRE_MINUTES'
]