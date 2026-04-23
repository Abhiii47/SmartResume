from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, User
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FIXED: Change tokenUrl from "token" to "login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

MAX_BCRYPT_BYTES = 72


def _truncate_for_bcrypt(password: str) -> str:
    """
    Bcrypt only supports up to 72 bytes. To avoid runtime errors,
    we truncate very long passwords consistently on both hash and
    verify. This is acceptable for this project but for production
    you may want to use a different KDF that supports longer inputs.
    """
    if password is None:
        return ""
    if not isinstance(password, str):
        password = str(password)
    
    # Truncate by bytes, not characters, to ensure we never exceed 72 bytes
    password_bytes = password.encode('utf-8')
    
    # If password is already 72 bytes or less, return as-is
    if len(password_bytes) <= MAX_BCRYPT_BYTES:
        return password
    
    # Truncate to 72 bytes
    password_bytes = password_bytes[:MAX_BCRYPT_BYTES]
    
    # Remove any incomplete multi-byte characters at the end
    # UTF-8 continuation bytes start with 10xxxxxx (0x80-0xBF)
    # Keep removing continuation bytes until we hit a valid start byte or empty
    while len(password_bytes) > 0 and (password_bytes[-1] & 0xC0) == 0x80:
        password_bytes = password_bytes[:-1]
    
    # Decode with error handling in case truncation broke a character
    try:
        result = password_bytes.decode('utf-8', errors='ignore')
        # Double-check: ensure the result when encoded is <= 72 bytes
        if len(result.encode('utf-8')) > MAX_BCRYPT_BYTES:
            # If somehow still too long, truncate the string itself
            result = result[:MAX_BCRYPT_BYTES]
        return result
    except Exception:
        # Fallback: return empty string if decode fails
        return ""


def verify_password(plain_password, hashed_password):
    """Verify a plain password against a hashed password"""
    try:
        if not plain_password:
            return False
            
        # Truncate to 71 bytes for safety
        pw_bytes = plain_password.encode('utf-8')
        if len(pw_bytes) > 71:
            pw_bytes = pw_bytes[:71]
            
        # Ensure hash is bytes
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
            
        return bcrypt.checkpw(pw_bytes, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password):
    """Hash a password for storing"""
    try:
        if not password:
            raise ValueError("Password cannot be empty")
            
        # Truncate to 71 bytes max for bcrypt compatibility
        password_bytes = password.encode('utf-8')
        
        if len(password_bytes) > 71:
            password_bytes = password_bytes[:71]
            # No need to decode back to string, bcrypt takes bytes
            
        # Hash using direct bcrypt library
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise
    except Exception as e:
        print(f"Password hashing error: {e}")
        if password:
            print(f"Original password length (bytes): {len(password.encode('utf-8'))}")
            truncated = _truncate_for_bcrypt(password)
            print(f"Truncated password length (bytes): {len(truncated.encode('utf-8'))}")
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current user from the JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as e:
        print(f"JWT decode error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user