/**
 * Coupon Input Component
 * 
 * Handles coupon code application with proper validation and feedback
 */

'use client';

import React, { useState } from 'react';

interface CouponInputProps {
  onCouponApply: (code: string) => Promise<boolean>;
  onCouponRemove: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: 'percent' | 'fixed';
  };
  disabled?: boolean;
}

export default function CouponInput({
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const success = await onCouponApply(couponCode.trim().toUpperCase());
      if (success) {
        setCouponCode('');
      } else {
        setError('Invalid coupon code. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemove();
    setError('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-section applied">
        <div data-testid="coupon-success" className="coupon-success" role="status">
          <span className="success-icon">✓</span>
          <span>
            Coupon <strong>{appliedCoupon.code}</strong> applied - 
            {appliedCoupon.type === 'percent' 
              ? ` ${appliedCoupon.discount}% off`
              : ` €${appliedCoupon.discount.toFixed(2)} off`
            }
          </span>
          <button
            type="button"
            className="remove-coupon"
            onClick={handleRemoveCoupon}
            aria-label="Remove coupon"
            disabled={disabled}
          >
            ×
          </button>
        </div>

        <style jsx>{`
          .coupon-section.applied {
            margin-bottom: 2rem;
          }

          .coupon-success {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-radius: 8px;
            padding: 1rem;
            color: #00ff00;
            font-size: 0.95rem;
          }

          .success-icon {
            font-weight: bold;
            font-size: 1.1rem;
          }

          .remove-coupon {
            background: none;
            border: none;
            color: rgba(0, 255, 0, 0.7);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
          }

          .remove-coupon:hover:not(:disabled) {
            background: rgba(0, 255, 0, 0.1);
            color: #00ff00;
          }

          .remove-coupon:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="coupon-section">
      <div className="coupon-input-group">
        <label htmlFor="coupon-input" className="coupon-label">
          Have a coupon code?
        </label>
        <div className="input-row">
          <input
            id="coupon-input"
            type="text"
            data-testid="coupon-input"
            placeholder="Enter code (e.g., LAUNCH50)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || disabled}
            aria-describedby={error ? 'coupon-error' : 'coupon-help'}
          />
          <button
            type="button"
            data-testid="apply-coupon"
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim() || disabled}
            className="apply-button"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
        <div id="coupon-help" className="coupon-help">
          Enter a valid coupon code to get a discount on your order
        </div>
      </div>
      
      {error && (
        <div 
          id="coupon-error" 
          data-testid="validation-error" 
          className="coupon-error" 
          role="alert"
        >
          {error}
        </div>
      )}

      <style jsx>{`
        .coupon-section {
          margin-bottom: 2rem;
        }

        .coupon-label {
          display: block;
          color: #FFD700;
          margin-bottom: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
        }

        .input-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .coupon-section input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .coupon-section input:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .coupon-section input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .apply-button {
          background: #FFD700;
          color: #000000;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .apply-button:hover:not(:disabled) {
          background: #FFA500;
          transform: translateY(-1px);
        }

        .apply-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .coupon-help {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .coupon-error {
          color: #ff6b6b;
          font-size: 0.9rem;
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .input-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}