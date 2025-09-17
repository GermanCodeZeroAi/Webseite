"""
Checkout API endpoints with rate limiting.

Implements the /api/checkout/session endpoint with IP-based rate limiting.
"""

from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from ..core.ratelimit import checkout_rate_limit


# Pydantic models matching the OpenAPI spec
class CheckoutRequest(BaseModel):
    plan_code: str
    billing_cycle: str  # monthly, semiannual, annual, biennial
    modules: Optional[List[str]] = None
    addons: Optional[List[str]] = None
    coupon: Optional[str] = None
    referral_code: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


# Create router
router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post(
    "/session",
    response_model=CheckoutSessionResponse,
    dependencies=[Depends(checkout_rate_limit)],
    summary="Create a Stripe checkout session for the configured selection"
)
async def create_checkout_session(request: CheckoutRequest) -> CheckoutSessionResponse:
    """
    Create a Stripe checkout session.
    
    This endpoint is rate limited to 5 requests per 10 seconds per IP address.
    
    Args:
        request: Checkout configuration including plan, billing cycle, modules, etc.
        
    Returns:
        CheckoutSessionResponse with session_id and checkout URL
        
    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    # TODO: Implement actual Stripe checkout session creation
    # For now, return a mock response
    
    # Validate billing cycle
    valid_cycles = ["monthly", "semiannual", "annual", "biennial"]
    if request.billing_cycle not in valid_cycles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid billing_cycle. Must be one of: {', '.join(valid_cycles)}"
        )
    
    # Mock Stripe session creation
    mock_session_id = f"cs_test_{request.plan_code}_{request.billing_cycle}"
    mock_url = f"https://checkout.stripe.com/pay/{mock_session_id}"
    
    return CheckoutSessionResponse(
        session_id=mock_session_id,
        url=mock_url
    )