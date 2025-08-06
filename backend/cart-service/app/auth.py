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
from shared.cognito_auth import (
    verify_token_unified,
    MockCognitoAuth
)
from shared.env_config import settings

# Use unified authentication that supports both Cognito and local JWT
verify_user_token = verify_token_unified

__all__ = [
    'create_access_token',
    'verify_token', 
    'verify_user_token',
    'authenticate_user',
    'ACCESS_TOKEN_EXPIRE_MINUTES',
    'MockCognitoAuth'
]