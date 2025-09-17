/**
 * Pricing Display Component
 * 
 * Shows live pricing with accessibility announcements
 */

'use client';

import React, { useRef, useEffect } from 'react';

interface PricingData {
  basePrice: number;
  totalPrice: number;
  currency: string;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  discount?: {
    code: string;
    amount: number;
    type: 'percent' | 'fixed';
  };
  vat?: {
    rate: number;
    amount: number;
  };
}

interface PricingDisplayProps {
  pricing: PricingData;
  onCheckout: () => void;
  hasSelectedOptions: boolean;
  priceChangeAnnouncement?: string;
}

export default function PricingDisplay({
  pricing,
  onCheckout,
  hasSelectedOptions,
  priceChangeAnnouncement
}: PricingDisplayProps) {
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce price changes to screen readers
  useEffect(() => {
    if (priceChangeAnnouncement && announcementRef.current) {
      announcementRef.current.textContent = priceChangeAnnouncement;
    }
  }, [priceChangeAnnouncement]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: pricing.currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBillingLabel = () => {
    switch (pricing.billingCycle) {
      case 'monthly':
        return 'per month';
      case 'annual':
        return 'per year (2 months free)';
      case 'one-time':
        return 'one-time payment';
      default:
        return '';
    }
  };

  return (
    <div data-testid="pricing-section" className="pricing-display">
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div data-testid="price-display" className="price-summary">
        <h3>Your Configuration</h3>
        
        <div className="price-breakdown">
          <div data-testid="base-price" className="price-line">
            <span>Base Price:</span>
            <span>{formatPrice(pricing.basePrice)}</span>
          </div>
          
          {pricing.discount && (
            <div data-testid="discount-amount" className="price-line discount">
              <span>Discount ({pricing.discount.code}):</span>
              <span>-{formatPrice(pricing.discount.amount)}</span>
            </div>
          )}
          
          {pricing.vat && (
            <div data-testid="vat-breakdown" className="vat-section">
              <div data-testid="vat-amount" className="price-line">
                <span>VAT ({pricing.vat.rate}%):</span>
                <span>{formatPrice(pricing.vat.amount)}</span>
              </div>
            </div>
          )}
          
          <div data-testid="total-price" className="price-line total">
            <span>Total Price:</span>
            <span>{formatPrice(pricing.totalPrice)}</span>
          </div>
        </div>
        
        <div className="billing-info">
          <small>{getBillingLabel()}</small>
        </div>

        {pricing.billingCycle === 'annual' && (
          <div className="savings-highlight">
            <span className="savings-icon">💰</span>
            Save 2 months with annual billing
          </div>
        )}
      </div>

      <button
        data-testid="checkout-button"
        className="checkout-button"
        onClick={onCheckout}
        disabled={!hasSelectedOptions}
        aria-describedby="checkout-help"
      >
        {pricing.billingCycle === 'one-time' ? 'Purchase Now' : 'Start Subscription'}
      </button>

      <div id="checkout-help" className="checkout-help">
        {!hasSelectedOptions 
          ? 'Select at least one service to continue'
          : 'Proceed to secure checkout'
        }
      </div>

      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .pricing-display {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 2rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .price-summary h3 {
          color: #FFD700;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .price-breakdown {
          margin-bottom: 1.5rem;
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding: 0.25rem 0;
        }

        .price-line.total {
          border-top: 2px solid #FFD700;
          padding-top: 1rem;
          margin-top: 1rem;
          font-weight: bold;
          font-size: 1.2rem;
          color: #FFD700;
        }

        .price-line.discount {
          color: #00ff00;
        }

        .vat-section {
          margin: 1rem 0;
          padding: 0.75rem 0;
          border-top: 1px solid rgba(255, 215, 0, 0.3);
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }

        .billing-info {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
          text-align: center;
        }

        .savings-highlight {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #00ff00;
          font-size: 0.9rem;
        }

        .savings-icon {
          margin-right: 0.5rem;
        }

        .checkout-button {
          width: 100%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .checkout-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .checkout-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .checkout-help {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }
      `}</style>
    </div>
  );
}