'use client';

import React, { useState } from 'react';

interface PricingPlan {
  code: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  billingCycles: string[];
  popular?: boolean;
}

interface PricingModule {
  code: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

const PLANS: PricingPlan[] = [
  {
    code: 'base-starter',
    name: 'Professional Starter',
    description: 'Perfect foundation for growing businesses',
    basePrice: 299,
    features: [
      'Core automation workflows',
      'Email and phone integration',
      'Basic analytics dashboard',
      'Standard support',
      'Up to 5 team members'
    ],
    billingCycles: ['monthly', 'annual'],
  },
  {
    code: 'base-enterprise',
    name: 'Enterprise Suite',
    description: 'Advanced capabilities for enterprise operations',
    basePrice: 899,
    features: [
      'Advanced workflow orchestration',
      'Multi-channel integration',
      'Advanced analytics & reporting',
      'Priority support & onboarding',
      'Unlimited team members',
      'Custom branding options'
    ],
    billingCycles: ['monthly', 'semiannual', 'annual', 'biennial'],
    popular: true,
  }
];

const MODULES: PricingModule[] = [
  {
    code: 'email-routing',
    name: 'Email Orchestration',
    description: 'Premium email workflows that drive results',
    price: 199,
    category: 'Communication'
  },
  {
    code: 'voicebot',
    name: 'Voice Assistant',
    description: 'Professional voice automation for customer interactions',
    price: 299,
    category: 'Communication'
  },
  {
    code: 'image-gen',
    name: 'Brand Image Suite',
    description: 'On-brand visual content generation',
    price: 249,
    category: 'Creative'
  },
  {
    code: 'video-synth',
    name: 'Video Production',
    description: 'Professional video content for marketing and training',
    price: 399,
    category: 'Creative'
  },
  {
    code: 'web-content',
    name: 'Web Content Automation',
    description: 'Streamlined content creation for digital presence',
    price: 179,
    category: 'Digital'
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [paymentType, setPaymentType] = useState<'subscription' | 'one-time'>('subscription');

  const getDiscountMultiplier = () => {
    if (billingCycle === 'annual') return 0.85; // 15% annual discount
    return 1;
  };

  const getCouponDiscount = () => {
    if (couponCode.toUpperCase() === 'LAUNCH50') return 0.5; // 50% launch discount
    return 1;
  };

  const calculatePrice = (basePrice: number) => {
    const discountedPrice = basePrice * getDiscountMultiplier();
    return Math.round(discountedPrice * getCouponDiscount());
  };

  const toggleModule = (moduleCode: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleCode) 
        ? prev.filter(code => code !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  const getTotalPrice = (plan: PricingPlan) => {
    const planPrice = calculatePrice(plan.basePrice);
    const modulesPrice = selectedModules.reduce((sum, moduleCode) => {
      const module = MODULES.find(m => m.code === moduleCode);
      return sum + (module ? calculatePrice(module.price) : 0);
    }, 0);
    return planPrice + modulesPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Professional Automation Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan to transform your business operations with premium automation solutions
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-yellow-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'annual'
                  ? 'bg-yellow-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Annual <span className="text-yellow-400 text-sm">(Save 15%)</span>
            </button>
          </div>
        </div>

        {/* Payment Type Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 p-1 rounded-lg flex">
            <button
              onClick={() => setPaymentType('subscription')}
              className={`px-6 py-2 rounded-md transition-all ${
                paymentType === 'subscription'
                  ? 'bg-yellow-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setPaymentType('one-time')}
              className={`px-6 py-2 rounded-md transition-all ${
                paymentType === 'one-time'
                  ? 'bg-yellow-500 text-black font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              One-time Purchase
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`relative bg-gray-800 rounded-xl p-8 border-2 transition-all hover:scale-105 ${
                plan.popular
                  ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold mb-2">
                  €{calculatePrice(plan.basePrice)}
                  <span className="text-lg text-gray-400">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-yellow-400 text-sm">Save 15% with annual billing</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                plan.popular
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Add-on Modules */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Premium Add-on Modules
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {MODULES.map((module) => (
              <div
                key={module.code}
                className={`bg-gray-800 rounded-lg p-6 border-2 transition-all cursor-pointer ${
                  selectedModules.includes(module.code)
                    ? 'border-yellow-500 bg-gray-700'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => toggleModule(module.code)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold mb-1">{module.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{module.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">€{calculatePrice(module.price)}</div>
                    <div className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-4">{module.description}</p>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  selectedModules.includes(module.code)
                    ? 'bg-yellow-500 border-yellow-500'
                    : 'border-gray-500'
                }`}>
                  {selectedModules.includes(module.code) && (
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-16">
          <h3 className="text-xl font-semibold mb-4">Special Offer Code</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter promotional code"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
            <button className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
              Apply
            </button>
          </div>
          {couponCode.toUpperCase() === 'LAUNCH50' && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg">
              <p className="text-green-400 font-semibold">🎉 Launch Special: 50% off applied!</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedModules.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Configuration Summary</h3>
            <div className="space-y-2">
              {PLANS.map((plan) => (
                <div key={plan.code} className="flex justify-between">
                  <span>{plan.name}</span>
                  <span>€{calculatePrice(plan.basePrice)}</span>
                </div>
              ))}
              {selectedModules.map((moduleCode) => {
                const module = MODULES.find(m => m.code === moduleCode);
                return module ? (
                  <div key={moduleCode} className="flex justify-between text-yellow-400">
                    <span>+ {module.name}</span>
                    <span>€{calculatePrice(module.price)}</span>
                  </div>
                ) : null;
              })}
              {getCouponDiscount() < 1 && (
                <div className="flex justify-between text-green-400">
                  <span>Launch Special (50% off)</span>
                  <span>-50%</span>
                </div>
              )}
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>€{getTotalPrice(PLANS[0])}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}