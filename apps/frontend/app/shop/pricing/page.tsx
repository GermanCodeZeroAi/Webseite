/**
 * Pricing Page
 * 
 * Public-facing pricing with clear benefits and value proposition
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PricingPlan {
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
  ctaText: string;
}

interface CouponState {
  code: string;
  applied: boolean;
  discount: number;
  type: 'percent' | 'fixed';
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [couponState, setCouponState] = useState<CouponState>({
    code: '',
    applied: false,
    discount: 0,
    type: 'percent'
  });
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [priceUpdateAnnouncement, setPriceUpdateAnnouncement] = useState('');
  
  // Ref for aria-live announcements
  const priceAnnouncementRef = useRef<HTMLDivElement>(null);

  const plans: PricingPlan[] = [
    {
      code: 'base-starter',
      name: 'Starter',
      description: 'Perfect for small teams getting started with automation',
      monthlyPrice: 99,
      annualPrice: 990, // 10 months pricing
      features: [
        'Email automation tools',
        'Basic telephony features',
        'Image optimization',
        'Up to 5 team members',
        'Email support',
        '99.9% uptime guarantee'
      ],
      ctaText: 'Start Free Trial'
    },
    {
      code: 'base-enterprise',
      name: 'Enterprise',
      description: 'Advanced automation for growing organizations',
      monthlyPrice: 299,
      annualPrice: 2990, // 10 months pricing
      features: [
        'Everything in Starter',
        'Advanced video & music tools',
        'Website automation',
        'Industry-specific bundles',
        'Unlimited team members',
        'Priority support',
        'Custom integrations',
        'Advanced analytics',
        'SLA guarantee'
      ],
      popular: true,
      ctaText: 'Get Enterprise Demo'
    }
  ];

  // Calculate effective price with discounts
  const calculatePrice = (basePrice: number) => {
    if (!couponState.applied) return basePrice;
    
    if (couponState.type === 'percent') {
      return basePrice * (1 - couponState.discount / 100);
    } else {
      return Math.max(0, basePrice - couponState.discount);
    }
  };

  // Handle billing cycle change with announcement
  const handleBillingCycleChange = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle);
    const savings = cycle === 'annual' ? '2 months free' : 'flexible monthly billing';
    const announcement = `Billing changed to ${cycle}. ${cycle === 'annual' ? 'You save 2 months with annual billing.' : 'Switched to flexible monthly billing.'}`;
    setPriceUpdateAnnouncement(announcement);
    
    // Clear announcement after screen reader has time to read it
    setTimeout(() => setPriceUpdateAnnouncement(''), 3000);
  };

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    setCouponLoading(true);
    setCouponError('');
    
    // Simulate API call
    setTimeout(() => {
      if (couponInput.toUpperCase() === 'LAUNCH50') {
        setCouponState({
          code: couponInput.toUpperCase(),
          applied: true,
          discount: 50,
          type: 'percent'
        });
        const announcement = `Coupon ${couponInput.toUpperCase()} applied successfully. You save 50% on all plans.`;
        setPriceUpdateAnnouncement(announcement);
        setTimeout(() => setPriceUpdateAnnouncement(''), 3000);
      } else {
        setCouponError('Invalid coupon code. Please check and try again.');
      }
      setCouponLoading(false);
    }, 1000);
  };

  // Handle plan selection
  const handleSelectPlan = (planCode: string) => {
    // Redirect to configurator with selected plan
    window.location.href = `/shop/configurator?plan=${planCode}&billing=${billingCycle}`;
  };

  return (
    <div data-testid="pricing-container" className="pricing-page">
      {/* Screen reader announcements */}
      <div
        ref={priceAnnouncementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {priceUpdateAnnouncement}
      </div>

      <div className="container">
        <header className="pricing-header">
          <h1>Choose Your Automation Plan</h1>
          <p className="pricing-subtitle">
            Save time, boost results, and scale your team's productivity with local-first automation
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="billing-toggle" role="radiogroup" aria-label="Billing cycle selection">
            <button
              role="radio"
              aria-checked={billingCycle === 'monthly'}
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => handleBillingCycleChange('monthly')}
            >
              Monthly
            </button>
            <button
              role="radio"
              aria-checked={billingCycle === 'annual'}
              className={`billing-option ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => handleBillingCycleChange('annual')}
            >
              Annual
              <span className="savings-badge">Save 17%</span>
            </button>
          </div>
        </header>

        {/* Coupon Section */}
        <div className="coupon-section">
          <div className="coupon-input-group">
            <label htmlFor="coupon-input" className="sr-only">
              Enter coupon code
            </label>
            <input
              id="coupon-input"
              type="text"
              placeholder="Have a coupon? Enter code here"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              disabled={couponLoading || couponState.applied}
              aria-describedby={couponError ? 'coupon-error' : undefined}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim() || couponState.applied}
              className="apply-coupon-btn"
            >
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          
          {couponState.applied && (
            <div className="coupon-success" role="status">
              ✓ Coupon {couponState.code} applied - {couponState.discount}% off all plans!
            </div>
          )}
          
          {couponError && (
            <div id="coupon-error" className="coupon-error" role="alert">
              {couponError}
            </div>
          )}
        </div>

        {/* Pricing Plans */}
        <div className="pricing-plans">
          {plans.map((plan) => {
            const basePrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const effectivePrice = calculatePrice(basePrice);
            const hasDiscount = effectivePrice < basePrice;
            
            return (
              <div
                key={plan.code}
                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                data-testid={`pricing-plan-${plan.code}`}
              >
                {plan.popular && (
                  <div className="popular-badge">Most Popular</div>
                )}
                
                <div className="plan-header">
                  <h2>{plan.name}</h2>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-pricing">
                  <div className="price-display">
                    {hasDiscount && (
                      <span className="original-price">
                        €{basePrice.toFixed(0)}
                      </span>
                    )}
                    <span className="current-price">
                      €{effectivePrice.toFixed(0)}
                    </span>
                    <span className="price-period">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  
                  {billingCycle === 'annual' && (
                    <div className="annual-note">
                      Billed annually (€{(effectivePrice / 12).toFixed(0)}/month)
                    </div>
                  )}
                </div>

                <div className="plan-features">
                  <h3 className="features-title">What's included:</h3>
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <span className="checkmark">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="plan-cta-button"
                  onClick={() => handleSelectPlan(plan.code)}
                  data-testid={`select-plan-${plan.code}`}
                >
                  {plan.ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Value Propositions */}
        <div className="value-props">
          <h2>Why Choose Our Automation Platform?</h2>
          <div className="value-grid">
            <div className="value-item">
              <h3>🔒 Local-First Security</h3>
              <p>Your data stays on your infrastructure. No external dependencies, complete control.</p>
            </div>
            <div className="value-item">
              <h3>⚡ Measurable Time Savings</h3>
              <p>Teams report 40% faster workflow completion with our automation tools.</p>
            </div>
            <div className="value-item">
              <h3>📈 Built for Scale</h3>
              <p>From single teams to enterprise-wide deployment. Grow without limits.</p>
            </div>
          </div>
        </div>
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

        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffffff;
          padding: 2rem 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .pricing-header h1 {
          font-size: 3rem;
          color: #FFD700;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .pricing-subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .billing-toggle {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 2rem;
        }

        .billing-option {
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          font-size: 1rem;
        }

        .billing-option.active {
          background: #FFD700;
          color: #000000;
        }

        .savings-badge {
          display: block;
          font-size: 0.75rem;
          color: #00ff00;
          margin-top: 2px;
        }

        .billing-option.active .savings-badge {
          color: #000000;
        }

        .coupon-section {
          max-width: 500px;
          margin: 0 auto 3rem auto;
          text-align: center;
        }

        .coupon-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .coupon-input-group input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 1rem;
        }

        .coupon-input-group input:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .apply-coupon-btn {
          background: #FFD700;
          color: #000000;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .apply-coupon-btn:hover:not(:disabled) {
          background: #FFA500;
        }

        .apply-coupon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .coupon-success {
          color: #00ff00;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .coupon-error {
          color: #ff6b6b;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .pricing-plans {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          border-color: rgba(255, 215, 0, 0.5);
          transform: translateY(-4px);
        }

        .pricing-card.popular {
          border-color: #FFD700;
          transform: scale(1.05);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .plan-header h2 {
          font-size: 1.8rem;
          color: #FFD700;
          margin-bottom: 0.5rem;
        }

        .plan-description {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
        }

        .plan-pricing {
          margin-bottom: 2rem;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .original-price {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: line-through;
        }

        .current-price {
          font-size: 2.5rem;
          color: #FFD700;
          font-weight: 700;
        }

        .price-period {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .annual-note {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .plan-features {
          margin-bottom: 2rem;
        }

        .features-title {
          color: #FFD700;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .plan-features ul {
          list-style: none;
          padding: 0;
        }

        .plan-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .checkmark {
          color: #00ff00;
          font-weight: bold;
        }

        .plan-cta-button {
          width: 100%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .plan-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .value-props {
          text-align: center;
          margin-top: 4rem;
        }

        .value-props h2 {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 2rem;
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .value-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .value-item h3 {
          color: #FFD700;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .value-item p {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .pricing-header h1 {
            font-size: 2rem;
          }
          
          .pricing-plans {
            grid-template-columns: 1fr;
          }
          
          .pricing-card.popular {
            transform: none;
          }
          
          .coupon-input-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}