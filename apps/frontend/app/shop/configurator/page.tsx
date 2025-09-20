/**
 * Shop Configurator Page
 * 
 * Mock implementation for testing purposes
 * Code-split and lazy-loaded for better performance
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import LiquidCard from '../../../components/LiquidCard';
import NeuralButton from '../../../components/NeuralButton';
import QuantumLoader from '../../../components/QuantumLoader';

// Loading component for better UX during code-splitting
const ConfiguratorLoading = () => (
  <div className="configurator-loading">
    <div className="container">
      <div className="loading-header">
        <div className="loading-skeleton loading-title" />
        <div className="loading-skeleton loading-subtitle" />
      </div>
      <div className="loading-content">
        <div className="loading-options">
          <div className="loading-skeleton loading-section-title" />
          <div className="loading-options-grid">
            <div className="loading-skeleton loading-option" />
            <div className="loading-skeleton loading-option" />
            <div className="loading-skeleton loading-option" />
            <div className="loading-skeleton loading-option" />
          </div>
        </div>
        <div className="loading-pricing">
          <div className="loading-skeleton loading-section" />
        </div>
      </div>
    </div>
    <style jsx>{`
      .configurator-loading {
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
      .loading-header {
        text-align: center;
        margin-bottom: 3rem;
      }
      .loading-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 3rem;
      }
      .loading-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .loading-skeleton {
        background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.3) 50%, rgba(255, 215, 0, 0.1) 100%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: shimmer 2s infinite;
      }
      .loading-title {
        height: 60px;
        width: 300px;
        margin: 0 auto 1rem;
      }
      .loading-subtitle {
        height: 20px;
        width: 200px;
        margin: 0 auto;
      }
      .loading-section-title {
        height: 30px;
        width: 250px;
        margin-bottom: 1.5rem;
      }
      .loading-section {
        height: 300px;
        margin-bottom: 2rem;
      }
      .loading-option {
        height: 120px;
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .loading-skeleton {
          animation: none;
          background: rgba(255, 215, 0, 0.2);
        }
      }
      @media (max-width: 768px) {
        .loading-content {
          grid-template-columns: 1fr;
        }
        .loading-options-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  </div>
);

interface ConfigOption {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface PricingData {
  basePrice: number;
  totalPrice: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
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

export default function ConfiguratorPage() {
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([
    { id: 'base-starter', name: 'Base Starter', price: 99, selected: false },
    { id: 'base-enterprise', name: 'Base Enterprise', price: 299, selected: false },
    { id: 'addon-analytics', name: 'Analytics Module', price: 49, selected: false },
    { id: 'addon-security', name: 'Security Module', price: 79, selected: false },
  ]);

  const [pricing, setPricing] = useState<PricingData>({
    basePrice: 0,
    totalPrice: 0,
    currency: 'EUR',
    billingCycle: 'monthly',
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate pricing
  useEffect(() => {
    const selectedOptions = configOptions.filter(option => option.selected);
    const basePrice = selectedOptions.reduce((sum, option) => sum + option.price, 0);
    
    let totalPrice = basePrice;
    
    // Apply billing cycle discount
    if (billingCycle === 'annual') {
      totalPrice = basePrice * 10; // 10 months price for annual
    }
    
    // Apply coupon discount
    let discount;
    if (couponApplied && couponCode === 'LAUNCH50') {
      discount = {
        code: couponCode,
        amount: totalPrice * 0.5,
        type: 'percent' as const,
      };
      totalPrice = totalPrice * 0.5;
    }
    
    // Add VAT
    const vat = {
      rate: 19,
      amount: totalPrice * 0.19,
    };
    
    setPricing({
      basePrice,
      totalPrice: totalPrice + vat.amount,
      currency: 'EUR',
      billingCycle,
      discount,
      vat,
    });
  }, [configOptions, billingCycle, couponApplied, couponCode]);

  const handleOptionToggle = (optionId: string) => {
    setConfigOptions(prev => 
      prev.map(option => 
        option.id === optionId 
          ? { ...option, selected: !option.selected }
          : option
      )
    );
  };

  const handleApplyCoupon = () => {
    setLoading(true);
    setTimeout(() => {
      if (couponCode === 'LAUNCH50') {
        setCouponApplied(true);
        setError('');
      } else {
        setError('Invalid coupon code');
      }
      setLoading(false);
    }, 1000);
  };

  const handleCheckout = () => {
    window.location.href = '/checkout';
  };

  return (
    <div data-testid="configurator-container" className="configurator-page">
      <div className="container">
        <header className="page-header">
          <h1>Service Configurator</h1>
          <p>Configure your perfect service package</p>
        </header>

        <div className="configurator-content">
          <div className="configuration-options">
            <h2>Select Your Services</h2>
            
            <div className="options-grid">
              {configOptions.map(option => (
                <div 
                  key={option.id}
                  data-testid="config-option"
                  className={`option-card ${option.selected ? 'selected' : ''}`}
                  onClick={() => handleOptionToggle(option.id)}
                >
                  <div className="option-header">
                    <h3>{option.name}</h3>
                    <div className="option-price">
                      €{option.price}/{billingCycle === 'monthly' ? 'mo' : 'year'}
                    </div>
                  </div>
                  <div className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={option.selected}
                      onChange={() => handleOptionToggle(option.id)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="billing-cycle-selector">
              <label htmlFor="billing-cycle">Billing Cycle:</label>
              <select
                id="billing-cycle"
                data-testid="billing-cycle-selector"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (2 months free)</option>
              </select>
            </div>

            <div className="coupon-section">
              <div className="coupon-input-group">
                <input
                  type="text"
                  data-testid="coupon-input"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  data-testid="apply-coupon"
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode}
                >
                  {loading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              
              {couponApplied && (
                <div data-testid="coupon-success" className="coupon-success">
                  ✓ Coupon {couponCode} applied successfully!
                </div>
              )}
              
              {error && (
                <div data-testid="validation-error" className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div data-testid="pricing-section" className="pricing-sidebar">
            <div data-testid="price-display" className="price-summary">
              <h3>Pricing Summary</h3>
              
              <div className="price-breakdown">
                <div data-testid="base-price" className="price-line">
                  <span>Base Price:</span>
                  <span>€{pricing.basePrice.toFixed(2)}</span>
                </div>
                
                {pricing.discount && (
                  <div data-testid="discount-amount" className="price-line discount">
                    <span>Discount ({pricing.discount.code}):</span>
                    <span>-€{pricing.discount.amount.toFixed(2)}</span>
                  </div>
                )}
                
                {pricing.vat && (
                  <div data-testid="vat-breakdown" className="vat-section">
                    <div data-testid="vat-amount" className="price-line">
                      <span>VAT ({pricing.vat.rate}%):</span>
                      <span>€{pricing.vat.amount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div data-testid="total-price" className="price-line total">
                  <span>Total Price:</span>
                  <span>€{pricing.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="billing-info">
                <small>Billed {billingCycle}</small>
              </div>
            </div>

            <NeuralButton
              data-testid="checkout-button"
              onClick={handleCheckout}
              disabled={configOptions.every(option => !option.selected)}
              variant="primary"
              size="large"
              neural={true}
              quantum={true}
              className="checkout-neural-btn"
            >
              🛒 Proceed to Checkout
            </NeuralButton>
          </div>
        </div>
      </div>

      <style jsx>{`
        .configurator-page {
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

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          color: #FFD700;
          margin-bottom: 0.5rem;
        }

        .configurator-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 3rem;
        }

        .configuration-options h2 {
          color: #FFD700;
          margin-bottom: 1.5rem;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .option-card {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .option-card:hover {
          border-color: #FFD700;
        }

        .option-card.selected {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
        }

        .option-header h3 {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
        }

        .option-price {
          color: #FFD700;
          font-weight: bold;
        }

        .billing-cycle-selector {
          margin-bottom: 2rem;
        }

        .billing-cycle-selector label {
          display: block;
          margin-bottom: 0.5rem;
          color: #FFD700;
        }

        .billing-cycle-selector select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #FFD700;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .coupon-section {
          margin-bottom: 2rem;
        }

        .coupon-input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .coupon-input-group input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #FFD700;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .coupon-input-group button {
          background: #FFD700;
          color: #000000;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .coupon-input-group button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .coupon-success {
          color: #00ff00;
          font-size: 0.9rem;
        }

        .error-message {
          color: #ff6b6b;
          font-size: 0.9rem;
        }

        .pricing-sidebar {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 2rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .price-summary h3 {
          color: #FFD700;
          margin-bottom: 1.5rem;
        }

        .price-breakdown {
          margin-bottom: 2rem;
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .price-line.total {
          border-top: 1px solid #FFD700;
          padding-top: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .price-line.discount {
          color: #00ff00;
        }

        .vat-section {
          margin: 1rem 0;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(255, 215, 0, 0.3);
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }

        .billing-info {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
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
        }

        .checkout-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .checkout-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .configurator-content {
            grid-template-columns: 1fr;
          }
          
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}