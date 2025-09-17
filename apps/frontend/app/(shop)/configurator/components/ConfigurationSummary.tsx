import React from 'react';
import type { Configuration, Module, Industry } from '../page';

interface ConfigurationSummaryProps {
  configuration: Configuration;
  modules: Module[];
  industries: Industry[];
  onConfigurationUpdate: (updates: Partial<Configuration>) => void;
  onBack: () => void;
}

const ADDON_NAMES: Record<string, { name: string; price: number }> = {
  'signature-extract': { name: 'Signature Extraction', price: 49 },
  'language-detection': { name: 'Language Detection', price: 79 },
  'asr-premium': { name: 'Premium Speech Recognition', price: 129 },
  'realtime-analytics': { name: 'Real-time Analytics', price: 99 },
  'brand-style-lock': { name: 'Brand Style Lock', price: 89 },
  'copyright-check': { name: 'Copyright Verification', price: 69 },
  'captioning': { name: 'Auto Captioning', price: 59 },
  'script-polish': { name: 'Script Enhancement', price: 79 },
  'mix-master': { name: 'Audio Mastering', price: 149 },
  'length-variants': { name: 'Length Variants', price: 39 },
  'translation-de-en': { name: 'German/English Translation', price: 119 },
  'a11y-review': { name: 'Accessibility Review', price: 89 }
};

const MODULE_PRICES: Record<string, number> = {
  'email-routing': 199,
  'voicebot': 299,
  'image-gen': 249,
  'video-synth': 399,
  'music-loop': 179,
  'web-content': 179
};

const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  configuration,
  modules,
  industries,
  onConfigurationUpdate,
  onBack
}) => {
  const selectedIndustryData = industries.find(i => i.code === configuration.selectedIndustry);
  const selectedModulesData = modules.filter(m => configuration.selectedModules.includes(m.code));
  
  const getDiscountMultiplier = () => {
    if (configuration.billingCycle === 'annual') return 0.85; // 15% annual discount
    return 1;
  };

  const calculateModulePrice = (moduleCode: string) => {
    const basePrice = MODULE_PRICES[moduleCode] || 0;
    return Math.round(basePrice * getDiscountMultiplier());
  };

  const calculateAddonPrice = (addonCode: string) => {
    const addon = ADDON_NAMES[addonCode];
    if (!addon) return 0;
    return Math.round(addon.price * getDiscountMultiplier());
  };

  const getTotalPrice = () => {
    const moduleTotal = configuration.selectedModules.reduce((sum, moduleCode) => {
      return sum + calculateModulePrice(moduleCode);
    }, 0);
    
    const addonTotal = configuration.selectedAddons.reduce((sum, addonCode) => {
      return sum + calculateAddonPrice(addonCode);
    }, 0);
    
    return moduleTotal + addonTotal;
  };

  const handleStartTrial = () => {
    // In a real app, this would redirect to payment or trial signup
    alert('Trial setup would begin here. This demo shows the marketing-safe configuration interface.');
  };

  const handleContactSales = () => {
    // In a real app, this would open a contact form or redirect to sales
    alert('Sales contact would be initiated here. Enterprise solutions available.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Configuration Overview */}
      <div className="bg-gray-800 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-6">Your Solution Configuration</h3>
        
        {/* Industry */}
        {selectedIndustryData && (
          <div className="mb-6">
            <h4 className="font-semibold text-yellow-400 mb-2">Industry Focus</h4>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="font-medium">{selectedIndustryData.name}</div>
              <div className="text-sm text-gray-300 mt-1">{selectedIndustryData.notes}</div>
            </div>
          </div>
        )}

        {/* Selected Modules */}
        <div className="mb-6">
          <h4 className="font-semibold text-yellow-400 mb-4">Selected Solutions ({selectedModulesData.length})</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {selectedModulesData.map((module) => (
              <div key={module.code} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-yellow-400 font-semibold">
                    €{calculateModulePrice(module.code)}/{configuration.billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </div>
                </div>
                <div className="text-sm text-gray-300">{module.description}</div>
                
                {/* Module Add-ons */}
                {module.addons.some(addon => configuration.selectedAddons.includes(addon)) && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-xs text-yellow-400 mb-2">Add-ons:</div>
                    {module.addons
                      .filter(addon => configuration.selectedAddons.includes(addon))
                      .map(addonCode => {
                        const addon = ADDON_NAMES[addonCode];
                        return addon ? (
                          <div key={addonCode} className="flex justify-between text-sm">
                            <span>+ {addon.name}</span>
                            <span className="text-yellow-400">
                              €{calculateAddonPrice(addonCode)}/{configuration.billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                        ) : null;
                      })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing Options */}
        <div className="mb-6">
          <h4 className="font-semibold text-yellow-400 mb-4">Billing & Payment Options</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Billing Cycle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="font-medium mb-3">Billing Cycle</div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="billingCycle"
                    value="monthly"
                    checked={configuration.billingCycle === 'monthly'}
                    onChange={(e) => onConfigurationUpdate({ billingCycle: e.target.value as 'monthly' | 'annual' })}
                    className="mr-2"
                  />
                  <span>Monthly</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="billingCycle"
                    value="annual"
                    checked={configuration.billingCycle === 'annual'}
                    onChange={(e) => onConfigurationUpdate({ billingCycle: e.target.value as 'monthly' | 'annual' })}
                    className="mr-2"
                  />
                  <span>Annual <span className="text-yellow-400 text-sm">(Save 15%)</span></span>
                </label>
              </div>
            </div>

            {/* Payment Type */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="font-medium mb-3">Payment Model</div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="subscription"
                    checked={configuration.paymentType === 'subscription'}
                    onChange={(e) => onConfigurationUpdate({ paymentType: e.target.value as 'subscription' | 'one-time' })}
                    className="mr-2"
                  />
                  <span>Subscription</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="one-time"
                    checked={configuration.paymentType === 'one-time'}
                    onChange={(e) => onConfigurationUpdate({ paymentType: e.target.value as 'subscription' | 'one-time' })}
                    className="mr-2"
                  />
                  <span>One-time Purchase</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gray-800 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-6">Investment Summary</h3>
        
        <div className="space-y-4 mb-6">
          {/* Module Pricing */}
          {configuration.selectedModules.map(moduleCode => {
            const module = modules.find(m => m.code === moduleCode);
            return module ? (
              <div key={moduleCode} className="flex justify-between items-center">
                <span>{module.name}</span>
                <span className="font-semibold">
                  €{calculateModulePrice(moduleCode)}/{configuration.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            ) : null;
          })}
          
          {/* Add-on Pricing */}
          {configuration.selectedAddons.map(addonCode => {
            const addon = ADDON_NAMES[addonCode];
            return addon ? (
              <div key={addonCode} className="flex justify-between items-center text-yellow-400">
                <span>+ {addon.name}</span>
                <span className="font-semibold">
                  €{calculateAddonPrice(addonCode)}/{configuration.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            ) : null;
          })}
          
          {configuration.billingCycle === 'annual' && (
            <div className="flex justify-between items-center text-green-400">
              <span>Annual Discount (15% off)</span>
              <span className="font-semibold">-15%</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total Investment</span>
            <span className="text-yellow-400">
              €{getTotalPrice()}/{configuration.billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          {configuration.paymentType === 'one-time' && (
            <div className="text-sm text-gray-400 mt-2">
              One-time purchase: €{getTotalPrice() * (configuration.billingCycle === 'annual' ? 12 : 1)}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Modules
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={handleContactSales}
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Contact Sales
          </button>
          <button
            onClick={handleStartTrial}
            className="px-8 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="font-semibold mb-4">What's Included</h4>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Professional onboarding support
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            24/7 technical support
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Regular feature updates
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Data security & compliance
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            API access & integrations
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Performance analytics
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ConfigurationSummary;