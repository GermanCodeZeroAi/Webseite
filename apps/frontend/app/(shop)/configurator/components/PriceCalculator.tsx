/**
 * Price Calculator Component
 * 
 * Live pricing calculator with aria-live updates, coupon support,
 * and subscription/one-time billing options. Features:
 * - Real-time price calculation
 * - Bundle discounts
 * - Coupon code validation
 * - Billing cycle options
 * - Accessibility with aria-live regions
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Module, Bundle, Configuration } from '../page';
import { Locale } from '../../../../lib/seo';

interface PriceCalculatorProps {
  configuration: Configuration;
  modules: Module[];
  bundles: Bundle[];
  locale: Locale;
  onUpdateConfiguration: (updates: Partial<Configuration>) => void;
}

interface PriceBreakdown {
  basePrice: number;
  bundleDiscount: number;
  couponDiscount: number;
  billingDiscount: number;
  finalPrice: number;
  totalSavings: number;
}

interface CouponData {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  isValid: boolean;
}

export default function PriceCalculator({
  configuration,
  modules,
  bundles,
  locale,
  onUpdateConfiguration
}: PriceCalculatorProps) {
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponError, setCouponError] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);

  // Calculate pricing breakdown
  const priceBreakdown = useMemo((): PriceBreakdown => {
    // Calculate base price from selected modules
    const selectedModules = modules.filter(m => configuration.selectedModules.includes(m.id));
    const basePrice = selectedModules.reduce((sum, module) => sum + module.basePrice, 0);

    let bundleDiscount = 0;
    let billingDiscount = 0;
    let couponDiscount = 0;

    // Apply bundle discount if applicable
    if (configuration.selectedBundle) {
      const bundle = bundles.find(b => b.id === configuration.selectedBundle);
      if (bundle) {
        bundleDiscount = (basePrice * bundle.discount) / 100;
      }
    }

    // Apply billing cycle discount (annual gets 20% off)
    if (configuration.billingCycle === 'annual') {
      const priceAfterBundle = basePrice - bundleDiscount;
      billingDiscount = priceAfterBundle * 0.2; // 20% annual discount
    }

    // Apply coupon discount
    if (appliedCoupon?.isValid) {
      const priceAfterOtherDiscounts = basePrice - bundleDiscount - billingDiscount;
      if (appliedCoupon.type === 'percent') {
        couponDiscount = (priceAfterOtherDiscounts * appliedCoupon.value) / 100;
      } else if (appliedCoupon.type === 'fixed') {
        couponDiscount = Math.min(appliedCoupon.value, priceAfterOtherDiscounts);
      }
    }

    const finalPrice = Math.max(0, basePrice - bundleDiscount - billingDiscount - couponDiscount);
    const totalSavings = bundleDiscount + billingDiscount + couponDiscount;

    return {
      basePrice,
      bundleDiscount,
      couponDiscount,
      billingDiscount,
      finalPrice,
      totalSavings
    };
  }, [configuration, modules, bundles, appliedCoupon]);

  // Simulate coupon validation
  const validateCoupon = useCallback(async (code: string): Promise<CouponData | null> => {
    setIsValidatingCoupon(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const validCoupons: Record<string, Omit<CouponData, 'isValid'>> = {
      'LAUNCH50': { code: 'LAUNCH50', type: 'percent', value: 50 },
      'WELCOME20': { code: 'WELCOME20', type: 'percent', value: 20 },
      'SAVE100': { code: 'SAVE100', type: 'fixed', value: 100 },
      'NEWCUSTOMER': { code: 'NEWCUSTOMER', type: 'percent', value: 15 }
    };
    
    const coupon = validCoupons[code.toUpperCase()];
    setIsValidatingCoupon(false);
    
    if (coupon) {
      return { ...coupon, isValid: true };
    }
    
    return null;
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || isValidatingCoupon) return;
    
    setCouponError('');
    const coupon = await validateCoupon(couponInput.trim());
    
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponInput('');
      onUpdateConfiguration({ couponCode: coupon.code });
    } else {
      setCouponError(locale === 'de' ? 'Ungültiger Gutscheincode' : 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    onUpdateConfiguration({ couponCode: undefined });
  };

  const handleBillingCycleChange = (cycle: 'monthly' | 'annual') => {
    onUpdateConfiguration({ billingCycle: cycle });
  };

  const content = {
    de: {
      title: 'Preisberechnung',
      billing: {
        monthly: 'Monatlich',
        annual: 'Jährlich (20% Rabatt)'
      },
      breakdown: {
        basePrice: 'Grundpreis',
        bundleDiscount: 'Bundle-Rabatt',
        billingDiscount: 'Jahresrabatt',
        couponDiscount: 'Gutschein-Rabatt',
        totalSavings: 'Gesamtersparnis',
        finalPrice: 'Endpreis'
      },
      coupon: {
        title: 'Gutscheincode',
        placeholder: 'Code eingeben',
        apply: 'Anwenden',
        applied: 'Angewendet',
        remove: 'Entfernen'
      },
      period: {
        monthly: '/ Monat',
        annual: '/ Jahr'
      }
    },
    en: {
      title: 'Price Calculation',
      billing: {
        monthly: 'Monthly',
        annual: 'Annual (20% off)'
      },
      breakdown: {
        basePrice: 'Base price',
        bundleDiscount: 'Bundle discount',
        billingDiscount: 'Annual discount',
        couponDiscount: 'Coupon discount',
        totalSavings: 'Total savings',
        finalPrice: 'Final price'
      },
      coupon: {
        title: 'Coupon code',
        placeholder: 'Enter code',
        apply: 'Apply',
        applied: 'Applied',
        remove: 'Remove'
      },
      period: {
        monthly: '/ month',
        annual: '/ year'
      }
    }
  };

  const t = content[locale];

  return (
    <div className="price-calculator" role="region" aria-labelledby="price-calculator-title">
      <h2 id="price-calculator-title" className="calculator-title">
        {t.title}
      </h2>

      {/* Billing Cycle Toggle */}
      <div className="billing-section">
        <div className="billing-toggle" role="radiogroup" aria-label={t.title}>
          <button
            type="button"
            role="radio"
            aria-checked={configuration.billingCycle === 'monthly'}
            className={`billing-option ${configuration.billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => handleBillingCycleChange('monthly')}
          >
            {t.billing.monthly}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={configuration.billingCycle === 'annual'}
            className={`billing-option ${configuration.billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => handleBillingCycleChange('annual')}
          >
            {t.billing.annual}
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div 
        className="price-breakdown"
        aria-live="polite"
        aria-atomic="true"
        role="status"
        aria-label={locale === 'de' ? 'Aktuelle Preisberechnung' : 'Current price calculation'}
      >
        {/* Base Price */}
        <div className="breakdown-item">
          <span className="breakdown-label">{t.breakdown.basePrice}</span>
          <span className="breakdown-amount">
            €{priceBreakdown.basePrice.toLocaleString()}
          </span>
        </div>

        {/* Bundle Discount */}
        {priceBreakdown.bundleDiscount > 0 && (
          <div className="breakdown-item discount">
            <span className="breakdown-label">{t.breakdown.bundleDiscount}</span>
            <span className="breakdown-amount">
              -€{priceBreakdown.bundleDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Billing Discount */}
        {priceBreakdown.billingDiscount > 0 && (
          <div className="breakdown-item discount">
            <span className="breakdown-label">{t.breakdown.billingDiscount}</span>
            <span className="breakdown-amount">
              -€{priceBreakdown.billingDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Coupon Discount */}
        {priceBreakdown.couponDiscount > 0 && (
          <div className="breakdown-item discount">
            <span className="breakdown-label">{t.breakdown.couponDiscount}</span>
            <span className="breakdown-amount">
              -€{priceBreakdown.couponDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Total Savings */}
        {priceBreakdown.totalSavings > 0 && (
          <div className="breakdown-savings">
            <span className="savings-label">{t.breakdown.totalSavings}</span>
            <span className="savings-amount">
              €{priceBreakdown.totalSavings.toLocaleString()}
            </span>
          </div>
        )}

        {/* Final Price */}
        <div className="breakdown-total">
          <span className="total-label">{t.breakdown.finalPrice}</span>
          <div className="total-price">
            <span className="total-amount">
              €{priceBreakdown.finalPrice.toLocaleString()}
            </span>
            <span className="total-period">
              {configuration.billingCycle === 'monthly' ? t.period.monthly : t.period.annual}
            </span>
          </div>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="coupon-section">
        <h3 className="coupon-title">{t.coupon.title}</h3>
        
        {!appliedCoupon ? (
          <div className="coupon-form">
            <div className="coupon-input-group">
              <input
                type="text"
                className="coupon-input"
                placeholder={t.coupon.placeholder}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                disabled={isValidatingCoupon}
                aria-describedby={couponError ? 'coupon-error' : undefined}
              />
              <button
                type="button"
                className="coupon-apply"
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || isValidatingCoupon}
                aria-label={t.coupon.apply}
              >
                {isValidatingCoupon ? '...' : t.coupon.apply}
              </button>
            </div>
            
            {couponError && (
              <div id="coupon-error" className="coupon-error" role="alert">
                {couponError}
              </div>
            )}
          </div>
        ) : (
          <div className="applied-coupon" role="status">
            <div className="coupon-info">
              <span className="coupon-code">✓ {appliedCoupon.code}</span>
              <span className="coupon-value">
                {appliedCoupon.type === 'percent' 
                  ? `${appliedCoupon.value}% off`
                  : `€${appliedCoupon.value} off`
                }
              </span>
            </div>
            <button
              type="button"
              className="coupon-remove"
              onClick={handleRemoveCoupon}
              aria-label={`${t.coupon.remove} ${appliedCoupon.code}`}
            >
              {t.coupon.remove}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .price-calculator {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 1px solid #333333;
          border-radius: 1rem;
          padding: 2rem;
          position: sticky;
          top: 2rem;
        }

        .calculator-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 2rem;
          text-align: center;
        }

        .billing-section {
          margin-bottom: 2rem;
        }

        .billing-toggle {
          display: flex;
          background: #333333;
          border-radius: 0.5rem;
          padding: 0.25rem;
          width: 100%;
        }

        .billing-option {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: center;
        }

        .billing-option:hover {
          background: #444444;
        }

        .billing-option.active {
          background: #FFD700;
          color: #000000;
          font-weight: 600;
        }

        .price-breakdown {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
          border: 1px solid #444444;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .breakdown-label {
          color: #cccccc;
        }

        .breakdown-amount {
          color: #ffffff;
          font-weight: 500;
        }

        .breakdown-item.discount .breakdown-amount {
          color: #4ade80;
        }

        .breakdown-savings {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(74, 222, 128, 0.1);
          border-radius: 0.375rem;
          border: 1px solid #4ade80;
        }

        .savings-label {
          color: #4ade80;
          font-weight: 600;
        }

        .savings-amount {
          color: #4ade80;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .breakdown-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          margin-top: 1rem;
          border-top: 2px solid #FFD700;
        }

        .total-label {
          font-size: 1.2rem;
          font-weight: 700;
          color: #FFD700;
        }

        .total-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .total-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #FFD700;
          line-height: 1;
        }

        .total-period {
          font-size: 0.9rem;
          color: #cccccc;
          margin-top: 0.25rem;
        }

        .coupon-section {
          border-top: 1px solid #333333;
          padding-top: 2rem;
        }

        .coupon-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem;
        }

        .coupon-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .coupon-input-group {
          display: flex;
          gap: 0.5rem;
        }

        .coupon-input {
          flex: 1;
          background: #333333;
          border: 1px solid #444444;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.9rem;
        }

        .coupon-input:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .coupon-apply {
          background: #FFD700;
          color: #000000;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .coupon-apply:hover:not(:disabled) {
          background: #FFA500;
        }

        .coupon-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .coupon-error {
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
        }

        .applied-coupon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid #4ade80;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .coupon-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .coupon-code {
          color: #4ade80;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .coupon-value {
          color: #4ade80;
          font-size: 0.85rem;
        }

        .coupon-remove {
          background: transparent;
          color: #ef4444;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          text-decoration: underline;
          padding: 0.25rem;
        }

        .coupon-remove:hover {
          color: #dc2626;
        }

        @media (max-width: 768px) {
          .price-calculator {
            padding: 1.5rem;
            position: static;
          }

          .total-amount {
            font-size: 1.5rem;
          }

          .billing-option {
            padding: 0.625rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}