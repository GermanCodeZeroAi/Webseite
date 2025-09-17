/**
 * Service Configurator Page
 * 
 * Configure your perfect automation package with live pricing and accessibility
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import PricingDisplay from './components/PricingDisplay';
import ServiceOption from './components/ServiceOption';
import CouponInput from './components/CouponInput';

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  monthlyPrice: number;
  annualPrice: number;
  oneTimePrice: number;
  selected: boolean;
}

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

export default function ConfiguratorPage() {
  const [serviceOptions, setServiceOptions] = useState<ServiceConfig[]>([
    {
      id: 'email-automation',
      name: 'Email Automation',
      description: 'Smart email tools that boost opens and clicks while saving time',
      benefits: [
        'Subject lines that drive 40% more opens',
        'Automated nurturing sequences',
        'Personalization at scale',
        'A/B testing built-in'
      ],
      monthlyPrice: 99,
      annualPrice: 990,
      oneTimePrice: 1200,
      selected: false
    },
    {
      id: 'telephony-assistant',
      name: 'Telephony Assistant',
      description: 'Intelligent call flows for faster resolution and happier customers',
      benefits: [
        'Auto-route to right department',
        '24/7 natural language responses',
        'Reduce wait times by 60%',
        'Lower cost per contact'
      ],
      monthlyPrice: 149,
      annualPrice: 1490,
      oneTimePrice: 1800,
      selected: false
    },
    {
      id: 'visual-content',
      name: 'Visual Content Suite',
      description: 'Image and video tools for consistent brand assets and faster production',
      benefits: [
        'On-brand image variants in seconds',
        'Auto background removal',
        'Video editing with subtitles',
        'Cut agency costs by 70%'
      ],
      monthlyPrice: 199,
      annualPrice: 1990,
      oneTimePrice: 2400,
      selected: false
    },
    {
      id: 'website-optimizer',
      name: 'Website Optimizer',
      description: 'Ship faster with compelling copy, optimized visuals, and better UX',
      benefits: [
        'SEO-optimized content generation',
        'Performance optimization',
        'Accessibility compliance',
        'Brand-consistent visuals'
      ],
      monthlyPrice: 129,
      annualPrice: 1290,
      oneTimePrice: 1550,
      selected: false
    }
  ]);

  const [pricing, setPricing] = useState<PricingData>({
    basePrice: 0,
    totalPrice: 0,
    currency: 'EUR',
    billingCycle: 'monthly',
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'one-time'>('monthly');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percent' | 'fixed';
  } | undefined>();
  const [priceAnnouncement, setPriceAnnouncement] = useState('');

  // Calculate pricing with live updates and announcements
  useEffect(() => {
    const selectedOptions = serviceOptions.filter(option => option.selected);
    
    let basePrice = 0;
    selectedOptions.forEach(option => {
      switch (billingCycle) {
        case 'monthly':
          basePrice += option.monthlyPrice;
          break;
        case 'annual':
          basePrice += option.annualPrice;
          break;
        case 'one-time':
          basePrice += option.oneTimePrice;
          break;
      }
    });
    
    let totalPrice = basePrice;
    let discount;
    
    // Apply coupon discount
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        const discountAmount = totalPrice * (appliedCoupon.discount / 100);
        discount = {
          code: appliedCoupon.code,
          amount: discountAmount,
          type: 'percent' as const,
        };
        totalPrice = totalPrice - discountAmount;
      } else {
        discount = {
          code: appliedCoupon.code,
          amount: appliedCoupon.discount,
          type: 'fixed' as const,
        };
        totalPrice = Math.max(0, totalPrice - appliedCoupon.discount);
      }
    }
    
    // Add VAT (19% for EU)
    const vat = {
      rate: 19,
      amount: totalPrice * 0.19,
    };
    
    const finalPrice = totalPrice + vat.amount;
    
    setPricing({
      basePrice,
      totalPrice: finalPrice,
      currency: 'EUR',
      billingCycle,
      discount,
      vat,
    });

    // Announce price changes to screen readers
    if (selectedOptions.length > 0) {
      const formattedPrice = new Intl.NumberFormat('en-EU', {
        style: 'currency',
        currency: 'EUR'
      }).format(finalPrice);
      
      setPriceAnnouncement(`Price updated to ${formattedPrice} ${
        billingCycle === 'monthly' ? 'per month' : 
        billingCycle === 'annual' ? 'per year' : 'one-time'
      }`);
      
      // Clear announcement after screen reader has time to read it
      setTimeout(() => setPriceAnnouncement(''), 2000);
    }
  }, [serviceOptions, billingCycle, appliedCoupon]);

  // Handle service option toggle
  const handleServiceToggle = (serviceId: string) => {
    setServiceOptions(prev => 
      prev.map(option => 
        option.id === serviceId 
          ? { ...option, selected: !option.selected }
          : option
      )
    );
  };

  // Handle billing cycle change
  const handleBillingCycleChange = (cycle: 'monthly' | 'annual' | 'one-time') => {
    setBillingCycle(cycle);
    
    // Announce billing change
    const announcement = `Billing changed to ${
      cycle === 'monthly' ? 'monthly subscription' :
      cycle === 'annual' ? 'annual subscription with 2 months free' :
      'one-time purchase'
    }`;
    setPriceAnnouncement(announcement);
    setTimeout(() => setPriceAnnouncement(''), 2000);
  };

  // Handle coupon application
  const handleCouponApply = async (code: string): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code === 'LAUNCH50') {
          setAppliedCoupon({
            code,
            discount: 50,
            type: 'percent'
          });
          setPriceAnnouncement(`Coupon ${code} applied successfully. 50% discount added.`);
          setTimeout(() => setPriceAnnouncement(''), 2000);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  // Handle coupon removal
  const handleCouponRemove = () => {
    setAppliedCoupon(undefined);
    setPriceAnnouncement('Coupon removed');
    setTimeout(() => setPriceAnnouncement(''), 2000);
  };

  // Handle checkout
  const handleCheckout = () => {
    const selectedServices = serviceOptions.filter(s => s.selected).map(s => s.id);
    const params = new URLSearchParams({
      services: selectedServices.join(','),
      billing: billingCycle,
      ...(appliedCoupon && { coupon: appliedCoupon.code })
    });
    window.location.href = `/checkout?${params.toString()}`;
  };

  const hasSelectedServices = serviceOptions.some(option => option.selected);

  return (
    <div data-testid="configurator-container" className="configurator-page">
      <div className="container">
        <header className="page-header">
          <h1>Build Your Automation Package</h1>
          <p>Choose the tools that will save your team time and boost results</p>
        </header>

        <div className="configurator-content">
          <div className="configuration-options">
            <div className="billing-cycle-selector">
              <fieldset>
                <legend>Choose your billing preference:</legend>
                <div className="billing-options" role="radiogroup">
                  <label className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="billing-cycle"
                      value="monthly"
                      checked={billingCycle === 'monthly'}
                      onChange={(e) => handleBillingCycleChange(e.target.value as 'monthly')}
                    />
                    <span className="option-label">
                      <strong>Monthly Subscription</strong>
                      <small>Flexible, cancel anytime</small>
                    </span>
                  </label>
                  
                  <label className={`billing-option ${billingCycle === 'annual' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="billing-cycle"
                      value="annual"
                      checked={billingCycle === 'annual'}
                      onChange={(e) => handleBillingCycleChange(e.target.value as 'annual')}
                    />
                    <span className="option-label">
                      <strong>Annual Subscription</strong>
                      <small>Save 2 months - best value!</small>
                    </span>
                  </label>
                  
                  <label className={`billing-option ${billingCycle === 'one-time' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="billing-cycle"
                      value="one-time"
                      checked={billingCycle === 'one-time'}
                      onChange={(e) => handleBillingCycleChange(e.target.value as 'one-time')}
                    />
                    <span className="option-label">
                      <strong>One-Time Purchase</strong>
                      <small>Own it forever, no recurring fees</small>
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>

            <CouponInput
              onCouponApply={handleCouponApply}
              onCouponRemove={handleCouponRemove}
              appliedCoupon={appliedCoupon}
            />
            
            <div className="services-section">
              <h2>Select Your Automation Tools</h2>
              <p className="services-intro">
                Each tool is designed to save time and improve results. Mix and match based on your needs.
              </p>
              
              <div className="services-grid">
                {serviceOptions.map(service => (
                  <ServiceOption
                    key={service.id}
                    id={service.id}
                    name={service.name}
                    description={service.description}
                    benefits={service.benefits}
                    price={
                      billingCycle === 'monthly' ? service.monthlyPrice :
                      billingCycle === 'annual' ? service.annualPrice :
                      service.oneTimePrice
                    }
                    billingCycle={billingCycle}
                    selected={service.selected}
                    onToggle={handleServiceToggle}
                  />
                ))}
              </div>
            </div>
          </div>

          <PricingDisplay
            pricing={pricing}
            onCheckout={handleCheckout}
            hasSelectedOptions={hasSelectedServices}
            priceChangeAnnouncement={priceAnnouncement}
          />
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
          max-width: 1400px;
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
          font-weight: 700;
        }

        .page-header p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
        }

        .configurator-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          align-items: start;
        }

        .billing-cycle-selector {
          margin-bottom: 2.5rem;
        }

        .billing-cycle-selector fieldset {
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 0;
        }

        .billing-cycle-selector legend {
          color: #FFD700;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 0 1rem;
        }

        .billing-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .billing-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .billing-option:hover {
          border-color: rgba(255, 215, 0, 0.5);
        }

        .billing-option.active {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
        }

        .billing-option input[type="radio"] {
          accent-color: #FFD700;
          width: 18px;
          height: 18px;
        }

        .option-label {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .option-label strong {
          color: #FFD700;
          font-size: 1rem;
        }

        .option-label small {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
        }

        .services-section h2 {
          color: #FFD700;
          margin-bottom: 0.75rem;
          font-size: 1.8rem;
        }

        .services-intro {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .configurator-content {
            grid-template-columns: 1fr;
          }
          
          .billing-options {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }
          
          .services-grid {
            grid-template-columns: 1fr;
          }
          
          .billing-cycle-selector fieldset {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}