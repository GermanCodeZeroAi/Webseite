"""
Webhook API endpoints with rate limiting.

Implements the /api/webhooks/stripe endpoint with Stripe-Signature header-based rate limiting.
"""

import json
from typing import Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..core.ratelimit import stripe_webhook_rate_limit


# Create router
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post(
    "/stripe",
    dependencies=[Depends(stripe_webhook_rate_limit)],
    summary="Receive Stripe webhook events"
)
async def handle_stripe_webhook(request: Request) -> JSONResponse:
    """
    Handle Stripe webhook events.
    
    This endpoint is rate limited to 5 requests per 10 seconds based on the
    Stripe-Signature header (or IP address if signature is missing).
    
    Args:
        request: FastAPI request object containing webhook payload and headers
        
    Returns:
        JSONResponse indicating successful processing
        
    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    try:
        # Get the raw body for signature verification
        body = await request.body()
        
        # Get Stripe signature header
        stripe_signature = request.headers.get("Stripe-Signature")
        
        if not stripe_signature:
            # Log warning about missing signature but still process
            # (In production, you might want to reject requests without signatures)
            print("Warning: Received Stripe webhook without Stripe-Signature header")
        
        # Parse JSON payload
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON payload"
            )
        
        # TODO: Implement actual Stripe signature verification
        # TODO: Implement webhook event processing based on event type
        
        # Extract event information for logging
        event_type = payload.get("type", "unknown")
        event_id = payload.get("id", "unknown")
        
        print(f"Received Stripe webhook: {event_type} (ID: {event_id})")
        
        # Mock event processing
        if event_type in [
            "checkout.session.completed",
            "payment_intent.succeeded",
            "invoice.payment_succeeded",
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted"
        ]:
            print(f"Processing {event_type} event...")
            # TODO: Add actual business logic for each event type
        else:
            print(f"Unhandled event type: {event_type}")
        
        # Return success response (idempotent)
        return JSONResponse(
            status_code=200,
            content={"received": True, "event_id": event_id}
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like rate limiting)
        raise
    except Exception as e:
        # Log unexpected errors but return 200 to prevent Stripe retries
        print(f"Error processing Stripe webhook: {str(e)}")
        return JSONResponse(
            status_code=200,
            content={"received": True, "error": "Internal processing error"}
        )