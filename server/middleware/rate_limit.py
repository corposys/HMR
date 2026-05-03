"""
Simple rate limiting for FastAPI routes.
Uses in-memory storage - for production, consider Redis.
"""
import time
from functools import wraps
from fastapi import HTTPException, Request

# Simple in-memory storage: {ip: [(timestamp, count), ...]}
_rate_limit_storage = {}

def rate_limit(requests: int, window: int):
    """
    Rate limiting dependency.
    
    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request from kwargs or args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                for key, value in kwargs.items():
                    if isinstance(value, Request):
                        request = value
                        break
            
            if request:
                client_ip = request.client.host if request.client else "unknown"
                now = time.time()
                
                # Clean old entries
                if client_ip in _rate_limit_storage:
                    _rate_limit_storage[client_ip] = [
                        (ts, count) for ts, count in _rate_limit_storage[client_ip]
                        if now - ts < window
                    ]
                else:
                    _rate_limit_storage[client_ip] = []
                
                # Count requests in window
                request_count = sum(count for ts, count in _rate_limit_storage[client_ip])
                
                if request_count >= requests:
                    raise HTTPException(
                        status_code=429,
                        detail="Demasiadas solicitudes. Por favor, intente más tarde."
                    )
                
                # Add current request
                _rate_limit_storage[client_ip].append((now, 1))
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
