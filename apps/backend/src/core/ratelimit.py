"""
Redis-based sliding window rate limiter for FastAPI.

Implements a simple sliding window rate limiting mechanism using Redis.
Example: 5 requests per 10 seconds sliding window.
"""

import time
import json
from typing import Optional, Callable, Any
from dataclasses import dataclass

import redis
from fastapi import HTTPException, Request, Depends
from fastapi.responses import JSONResponse


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests: int  # Number of requests allowed
    window_seconds: int  # Time window in seconds
    key_func: Callable[[Request], str]  # Function to extract rate limit key from request


class RateLimiter:
    """Redis-based sliding window rate limiter."""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def is_allowed(self, key: str, config: RateLimitConfig) -> tuple[bool, int]:
        """
        Check if request is allowed under rate limit.
        
        Args:
            key: Unique identifier for the rate limit (e.g., IP address, user ID)
            config: Rate limit configuration
            
        Returns:
            Tuple of (is_allowed, retry_after_seconds)
        """
        now = time.time()
        window_start = now - config.window_seconds
        
        # Use Redis pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Remove expired entries from sorted set
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests in window
        pipe.zcard(key)
        
        # Add current request with timestamp as score
        pipe.zadd(key, {str(now): now})
        
        # Set expiration on the key
        pipe.expire(key, config.window_seconds + 1)
        
        results = pipe.execute()
        current_count = results[1]  # Count before adding current request
        
        if current_count >= config.requests:
            # Rate limit exceeded
            # Calculate retry after by finding the oldest request in window
            oldest_requests = self.redis.zrange(key, 0, 0, withscores=True)
            if oldest_requests:
                oldest_timestamp = oldest_requests[0][1]
                retry_after = int(oldest_timestamp + config.window_seconds - now) + 1
                return False, max(retry_after, 1)
            else:
                return False, config.window_seconds
        
        return True, 0


# Global rate limiter instance (will be initialized with Redis connection)
_rate_limiter: Optional[RateLimiter] = None


def init_rate_limiter(redis_url: str = "redis://localhost:6379"):
    """Initialize the global rate limiter with Redis connection."""
    global _rate_limiter
    redis_client = redis.from_url(redis_url, decode_responses=True)
    _rate_limiter = RateLimiter(redis_client)


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    if _rate_limiter is None:
        # Initialize with default Redis connection for development
        init_rate_limiter()
    return _rate_limiter


def create_rate_limit_dependency(config: RateLimitConfig):
    """
    Create a FastAPI dependency for rate limiting.
    
    Args:
        config: Rate limit configuration
        
    Returns:
        FastAPI dependency function
    """
    def rate_limit_dependency(
        request: Request,
        rate_limiter: RateLimiter = Depends(get_rate_limiter)
    ):
        key = config.key_func(request)
        is_allowed, retry_after = rate_limiter.is_allowed(key, config)
        
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after,
                    "limit": f"{config.requests} requests per {config.window_seconds} seconds"
                },
                headers={"Retry-After": str(retry_after)}
            )
    
    return rate_limit_dependency


# Common key extraction functions
def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check for forwarded headers first (for proxy/load balancer setups)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"


def get_stripe_signature(request: Request) -> str:
    """Extract Stripe signature from request headers."""
    signature = request.headers.get("Stripe-Signature")
    if not signature:
        # If no signature, fall back to IP-based limiting
        return f"no-sig:{get_client_ip(request)}"
    
    # Use the signature as the rate limit key (more specific than IP)
    return f"stripe-sig:{signature[:32]}"  # Truncate for Redis key efficiency


# Pre-configured rate limit dependencies
checkout_rate_limit = create_rate_limit_dependency(
    RateLimitConfig(
        requests=5,
        window_seconds=10,
        key_func=lambda req: f"checkout:{get_client_ip(req)}"
    )
)

stripe_webhook_rate_limit = create_rate_limit_dependency(
    RateLimitConfig(
        requests=5,
        window_seconds=10,
        key_func=lambda req: f"webhook:{get_stripe_signature(req)}"
    )
)