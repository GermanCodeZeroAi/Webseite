/**
 * Pricing Page for German Code Zero AI Shop
 * 
 * Public-safe pricing page with live pricing, subscription/one-time options,
 * and coupon functionality. Features:
 * - No internal terminology exposed
 * - Live price updates with aria-live
 * - Subscription and one-time billing options
 * - Coupon code functionality
 * - Premium B2B presentation
 * - Full accessibility support
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Metadata } from 'next';
import { getPricingSeo, type Locale } from '../../../lib/seo';

interface PricingPageProps {
  params: { locale?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

interface PricingPlan {
  code: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  billingCycles: Array<{
    period: 'monthly' | 'annual';
    multiplier: number;
    discount?: number;
    label: string;
  }>;
  popular?: boolean;
}

interface CouponData {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  isValid: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Perfect for growing teams',
    basePrice: 299,
    features: [
      'Core automation workflows',
      'Standard integrations',
      'Email support',
      'Basic analytics',
      'Up to 5 team members'
    ],
    billingCycles: [
      { period: 'monthly', multiplier: 1, label: 'Monthly' },
      { period: 'annual', multiplier: 10, discount: 20, label: 'Annual (20% off)' }
    ]
  },
  {
    code: 'professional',
    name: 'Professional',
    description: 'Ideal for scaling organizations',
    basePrice: 599,
    features: [
      'Advanced workflow automation',
      'Premium integrations',
      'Priority support',
      'Advanced analytics & reporting',
      'Up to 25 team members',
      'Custom branding'
    ],
    billingCycles: [
      { period: 'monthly', multiplier: 1, label: 'Monthly' },
      { period: 'annual', multiplier: 10, discount: 25, label: 'Annual (25% off)' }
    ],
    popular: true
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale operations',
    basePrice: 1299,
    features: [
      'Enterprise-grade automation',
      'All integrations included',
      'Dedicated success manager',
      'Custom analytics & dashboards',
      'Unlimited team members',
      'White-label solutions',
      'SLA guarantees'
    ],
    billingCycles: [
      { period: 'monthly', multiplier: 1, label: 'Monthly' },
      { period: 'annual', multiplier: 10, discount: 30, label: 'Annual (30% off)' }
    ]
  }
];

export default function PricingPage({ params }: PricingPageProps) {
  const locale: Locale = (params.locale as Locale) || 'de';
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live pricing calculation
  const calculatePrice = useMemo(() => {
    const plan = PRICING_PLANS.find(p => p.code === selectedPlan);
    if (!plan) return { base: 0, final: 0, savings: 0 };

    const billingCycle = plan.billingCycles.find(bc => bc.period === selectedBilling);
    if (!billingCycle) return { base: 0, final: 0, savings: 0 };

    let basePrice = plan.basePrice * billingCycle.multiplier;
    let finalPrice = basePrice;
    let savings = 0;

    // Apply billing cycle discount
    if (billingCycle.discount) {
      const billingDiscount = (basePrice * billingCycle.discount) / 100;
      finalPrice -= billingDiscount;
      savings += billingDiscount;
    }

    // Apply coupon discount
    if (appliedCoupon?.isValid) {
      if (appliedCoupon.type === 'percent') {
        const couponDiscount = (finalPrice * appliedCoupon.value) / 100;
        finalPrice -= couponDiscount;
        savings += couponDiscount;
      } else if (appliedCoupon.type === 'fixed') {
        finalPrice -= appliedCoupon.value;
        savings += appliedCoupon.value;
      }
    }

    return {
      base: basePrice,
      final: Math.max(0, finalPrice),
      savings: savings
    };
  }, [selectedPlan, selectedBilling, appliedCoupon]);

  // Simulate coupon validation
  const validateCoupon = async (code: string): Promise<CouponData | null> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validCoupons: Record<string, Omit<CouponData, 'isValid'>> = {
      'LAUNCH50': { code: 'LAUNCH50', type: 'percent', value: 50 },
      'WELCOME20': { code: 'WELCOME20', type: 'percent', value: 20 },
      'SAVE100': { code: 'SAVE100', type: 'fixed', value: 100 }
    };
    
    const coupon = validCoupons[code.toUpperCase()];
    setIsLoading(false);
    
    if (coupon) {
      return { ...coupon, isValid: true };
    }
    
    return null;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponError('');
    const coupon = await validateCoupon(couponCode.trim());
    
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponCode('');
    } else {
      setCouponError(locale === 'de' ? 'Ungültiger Gutscheincode' : 'Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleGetStarted = (planCode: string) => {
    // Navigate to configurator with selected plan
    const params = new URLSearchParams({
      plan: planCode,
      billing: selectedBilling,
      ...(appliedCoupon?.isValid && { coupon: appliedCoupon.code })
    });
    
    window.location.href = `/shop/configurator?${params.toString()}`;
  };

  const content = {
    de: {
      title: 'Preise & Pläne',
      subtitle: 'Wählen Sie den passenden Plan für Ihr Unternehmen',
      billingToggle: {
        monthly: 'Monatlich',
        annual: 'Jährlich'
      },
      coupon: {
        placeholder: 'Gutscheincode eingeben',
        apply: 'Anwenden',
        applied: 'Gutschein angewendet',
        remove: 'Entfernen'
      },
      pricing: {
        from: 'ab',
        perMonth: '/ Monat',
        perYear: '/ Jahr',
        savings: 'Sie sparen',
        totalPrice: 'Gesamtpreis',
        getStarted: 'Jetzt starten',
        popular: 'Beliebt'
      },
      features: 'Funktionen enthalten'
    },
    en: {
      title: 'Pricing & Plans',
      subtitle: 'Choose the right plan for your business',
      billingToggle: {
        monthly: 'Monthly',
        annual: 'Annual'
      },
      coupon: {
        placeholder: 'Enter coupon code',
        apply: 'Apply',
        applied: 'Coupon applied',
        remove: 'Remove'
      },
      pricing: {
        from: 'from',
        perMonth: '/ month',
        perYear: '/ year',
        savings: 'You save',
        totalPrice: 'Total price',
        getStarted: 'Get started',
        popular: 'Popular'
      },
      features: 'Features included'
    }
  };

  const t = content[locale];

  return (
    <main className="pricing-page" role="main">
      {/* Header */}
      <header className="pricing-header">
        <div className="pricing-container">
          <h1 className="pricing-title">{t.title}</h1>
          <p className="pricing-subtitle">{t.subtitle}</p>
          
          {/* Billing Toggle */}
          <div className="billing-toggle" role="radiogroup" aria-label={t.title}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedBilling === 'monthly'}
              className={`billing-option ${selectedBilling === 'monthly' ? 'active' : ''}`}
              onClick={() => setSelectedBilling('monthly')}
            >
              {t.billingToggle.monthly}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selectedBilling === 'annual'}
              className={`billing-option ${selectedBilling === 'annual' ? 'active' : ''}`}
              onClick={() => setSelectedBilling('annual')}
            >
              {t.billingToggle.annual}
            </button>
          </div>
        </div>
      </header>

      {/* Pricing Plans */}
      <section className="pricing-plans">
        <div className="pricing-container">
          <div className="plans-grid">
            {PRICING_PLANS.map((plan) => {
              const billingCycle = plan.billingCycles.find(bc => bc.period === selectedBilling);
              if (!billingCycle) return null;

              let displayPrice = plan.basePrice * billingCycle.multiplier;
              if (billingCycle.discount) {
                displayPrice = displayPrice * (1 - billingCycle.discount / 100);
              }

              return (
                <div
                  key={plan.code}
                  className={`plan-card ${plan.popular ? 'popular' : ''}`}
                  role="article"
                  aria-labelledby={`plan-${plan.code}-title`}
                >
                  {plan.popular && (
                    <div className="popular-badge" aria-label={t.pricing.popular}>
                      {t.pricing.popular}
                    </div>
                  )}
                  
                  <header className="plan-header">
                    <h2 id={`plan-${plan.code}-title`} className="plan-name">
                      {plan.name}
                    </h2>
                    <p className="plan-description">{plan.description}</p>
                    
                    <div className="plan-pricing">
                      <div className="price-display">
                        <span className="price-amount">
                          €{Math.round(displayPrice).toLocaleString()}
                        </span>
                        <span className="price-period">
                          {selectedBilling === 'monthly' ? t.pricing.perMonth : t.pricing.perYear}
                        </span>
                      </div>
                      
                      {billingCycle.discount && (
                        <div className="price-savings">
                          {billingCycle.label}
                        </div>
                      )}
                    </div>
                  </header>

                  <div className="plan-features">
                    <h3 className="features-title">{t.features}</h3>
                    <ul className="features-list" role="list">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="feature-item">
                          <span className="feature-icon" aria-hidden="true">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="plan-actions">
                    <button
                      type="button"
                      className="plan-cta"
                      onClick={() => handleGetStarted(plan.code)}
                      aria-label={`${t.pricing.getStarted} with ${plan.name}`}
                    >
                      {t.pricing.getStarted}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coupon Section */}
      <section className="coupon-section" aria-labelledby="coupon-title">
        <div className="pricing-container">
          <h2 id="coupon-title" className="coupon-title">
            {locale === 'de' ? 'Haben Sie einen Gutscheincode?' : 'Have a coupon code?'}
          </h2>
          
          <div className="coupon-form">
            <div className="coupon-input-group">
              <input
                type="text"
                className="coupon-input"
                placeholder={t.coupon.placeholder}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                disabled={isLoading}
                aria-describedby={couponError ? 'coupon-error' : undefined}
              />
              <button
                type="button"
                className="coupon-apply"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isLoading}
                aria-label={t.coupon.apply}
              >
                {isLoading ? '...' : t.coupon.apply}
              </button>
            </div>
            
            {couponError && (
              <div id="coupon-error" className="coupon-error" role="alert">
                {couponError}
              </div>
            )}
            
            {appliedCoupon && (
              <div className="applied-coupon" role="status">
                <span className="coupon-success">
                  ✓ {t.coupon.applied}: {appliedCoupon.code}
                  {appliedCoupon.type === 'percent' 
                    ? ` (${appliedCoupon.value}% off)`
                    : ` (€${appliedCoupon.value} off)`
                  }
                </span>
                <button
                  type="button"
                  className="coupon-remove"
                  onClick={removeCoupon}
                  aria-label={`${t.coupon.remove} ${appliedCoupon.code}`}
                >
                  {t.coupon.remove}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Price Summary */}
      <section className="price-summary" aria-labelledby="summary-title">
        <div className="pricing-container">
          <div className="summary-card">
            <h2 id="summary-title" className="summary-title">
              {t.pricing.totalPrice}
            </h2>
            
            <div 
              className="price-breakdown"
              aria-live="polite"
              aria-atomic="true"
              role="status"
            >
              <div className="breakdown-item">
                <span className="breakdown-label">
                  {PRICING_PLANS.find(p => p.code === selectedPlan)?.name} ({selectedBilling})
                </span>
                <span className="breakdown-amount">
                  €{Math.round(calculatePrice.base).toLocaleString()}
                </span>
              </div>
              
              {calculatePrice.savings > 0 && (
                <div className="breakdown-item savings">
                  <span className="breakdown-label">{t.pricing.savings}</span>
                  <span className="breakdown-amount">
                    -€{Math.round(calculatePrice.savings).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="breakdown-total">
                <span className="total-label">{t.pricing.totalPrice}</span>
                <span className="total-amount">
                  €{Math.round(calculatePrice.final).toLocaleString()}
                  <span className="total-period">
                    {selectedBilling === 'monthly' ? t.pricing.perMonth : t.pricing.perYear}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .pricing-header {
          padding: 4rem 0 2rem;
          text-align: center;
        }

        .pricing-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .pricing-subtitle {
          font-size: 1.2rem;
          color: #cccccc;
          margin: 0 0 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .billing-toggle {
          display: inline-flex;
          background: #333333;
          border-radius: 0.5rem;
          padding: 0.25rem;
          margin-bottom: 2rem;
        }

        .billing-option {
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-weight: 500;
        }

        .billing-option:hover {
          background: #444444;
        }

        .billing-option.active {
          background: #FFD700;
          color: #000000;
          font-weight: 600;
        }

        .pricing-plans {
          padding: 2rem 0;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .plan-card {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 1px solid #333333;
          border-radius: 1rem;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.1);
        }

        .plan-card.popular {
          border-color: #FFD700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }

        .popular-badge {
          position: absolute;
          top: -0.75rem;
          left: 50%;
          transform: translateX(-50%);
          background: #FFD700;
          color: #000000;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .plan-header {
          margin-bottom: 2rem;
        }

        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 0.5rem;
        }

        .plan-description {
          color: #cccccc;
          margin: 0 0 1.5rem;
          font-size: 1rem;
        }

        .plan-pricing {
          margin-bottom: 1rem;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .price-amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .price-period {
          font-size: 1rem;
          color: #cccccc;
        }

        .price-savings {
          color: #4ade80;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .plan-features {
          margin-bottom: 2rem;
        }

        .features-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: #cccccc;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .feature-icon {
          color: #4ade80;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .plan-actions {
          margin-top: auto;
        }

        .plan-cta {
          width: 100%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: none;
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
        }

        .plan-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .plan-cta:focus {
          outline: 2px solid #FFD700;
          outline-offset: 2px;
        }

        .coupon-section {
          padding: 2rem 0;
          border-top: 1px solid #333333;
        }

        .coupon-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
          margin: 0 0 2rem;
        }

        .coupon-form {
          max-width: 400px;
          margin: 0 auto;
        }

        .coupon-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .coupon-input {
          flex: 1;
          background: #333333;
          border: 1px solid #444444;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 1rem;
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
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
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
          align-items: center;
          justify-content: space-between;
          background: #1f2937;
          border: 1px solid #4ade80;
          border-radius: 0.5rem;
          padding: 0.75rem;
        }

        .coupon-success {
          color: #4ade80;
          font-size: 0.875rem;
        }

        .coupon-remove {
          background: transparent;
          color: #ef4444;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          text-decoration: underline;
        }

        .price-summary {
          padding: 2rem 0 4rem;
          border-top: 1px solid #333333;
        }

        .summary-card {
          max-width: 500px;
          margin: 0 auto;
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 1px solid #FFD700;
          border-radius: 1rem;
          padding: 2rem;
        }

        .summary-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #FFD700;
          text-align: center;
          margin: 0 0 1.5rem;
        }

        .price-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #cccccc;
          font-size: 1rem;
        }

        .breakdown-item.savings {
          color: #4ade80;
        }

        .breakdown-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-top: 0.75rem;
          border-top: 1px solid #333333;
          margin-top: 0.5rem;
        }

        .total-label {
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffffff;
        }

        .total-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #FFD700;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .total-period {
          font-size: 1rem;
          color: #cccccc;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .pricing-container {
            padding: 0 1rem;
          }

          .plans-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .plan-card {
            padding: 1.5rem;
          }

          .price-amount {
            font-size: 2rem;
          }

          .total-amount {
            font-size: 1.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .plan-card:hover {
            transform: none;
          }

          .plan-cta:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}