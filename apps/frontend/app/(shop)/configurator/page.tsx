'use client';

import React, { useState } from 'react';
import ModuleSelector from './components/ModuleSelector';
import IndustrySelector from './components/IndustrySelector';
import ConfigurationSummary from './components/ConfigurationSummary';

export interface Module {
  code: string;
  name: string;
  category: string;
  description: string;
  addons: string[];
  active: boolean;
}

export interface Industry {
  code: string;
  name: string;
  recommended_modules: string[];
  notes: string;
}

export interface Configuration {
  selectedIndustry: string | null;
  selectedModules: string[];
  selectedAddons: string[];
  billingCycle: 'monthly' | 'annual';
  paymentType: 'subscription' | 'one-time';
}

const MODULES: Module[] = [
  {
    code: 'email-routing',
    category: 'Communication',
    name: 'Email Orchestration',
    description: 'Premium email workflows for customer engagement',
    addons: ['signature-extract', 'language-detection'],
    active: true
  },
  {
    code: 'voicebot',
    category: 'Communication',
    name: 'Voice Assistant',
    description: 'Professional voice automation for customer service',
    addons: ['asr-premium', 'realtime-analytics'],
    active: true
  },
  {
    code: 'image-gen',
    category: 'Creative',
    name: 'Brand Image Suite',
    description: 'On-brand visual content generation',
    addons: ['brand-style-lock', 'copyright-check'],
    active: true
  },
  {
    code: 'video-synth',
    category: 'Creative',
    name: 'Video Production',
    description: 'Professional video content for marketing',
    addons: ['captioning', 'script-polish'],
    active: true
  },
  {
    code: 'music-loop',
    category: 'Creative',
    name: 'Audio Branding',
    description: 'License-safe music for brand experiences',
    addons: ['mix-master', 'length-variants'],
    active: true
  },
  {
    code: 'web-content',
    category: 'Digital',
    name: 'Web Content Automation',
    description: 'Streamlined content creation for digital presence',
    addons: ['translation-de-en', 'a11y-review'],
    active: true
  }
];

const INDUSTRIES: Industry[] = [
  {
    code: 'manufacturing',
    name: 'Manufacturing',
    recommended_modules: ['email-routing', 'voicebot', 'web-content'],
    notes: 'Optimize customer support and multilingual communication'
  },
  {
    code: 'financial-services',
    name: 'Financial Services',
    recommended_modules: ['email-routing', 'image-gen', 'web-content'],
    notes: 'Compliance-focused content and customer communication'
  },
  {
    code: 'ecommerce',
    name: 'E-Commerce',
    recommended_modules: ['email-routing', 'video-synth', 'music-loop'],
    notes: 'Scale customer support and create engaging media content'
  }
];

export default function ConfiguratorPage() {
  const [configuration, setConfiguration] = useState<Configuration>({
    selectedIndustry: null,
    selectedModules: [],
    selectedAddons: [],
    billingCycle: 'monthly',
    paymentType: 'subscription'
  });

  const [currentStep, setCurrentStep] = useState<'industry' | 'modules' | 'summary'>('industry');

  const updateConfiguration = (updates: Partial<Configuration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  };

  const handleIndustrySelect = (industryCode: string) => {
    const industry = INDUSTRIES.find(i => i.code === industryCode);
    if (industry) {
      updateConfiguration({
        selectedIndustry: industryCode,
        selectedModules: industry.recommended_modules
      });
      setCurrentStep('modules');
    }
  };

  const handleModuleToggle = (moduleCode: string) => {
    const isSelected = configuration.selectedModules.includes(moduleCode);
    const newModules = isSelected
      ? configuration.selectedModules.filter(code => code !== moduleCode)
      : [...configuration.selectedModules, moduleCode];
    
    updateConfiguration({ selectedModules: newModules });
  };

  const handleAddonToggle = (addonCode: string) => {
    const isSelected = configuration.selectedAddons.includes(addonCode);
    const newAddons = isSelected
      ? configuration.selectedAddons.filter(code => code !== addonCode)
      : [...configuration.selectedAddons, addonCode];
    
    updateConfiguration({ selectedAddons: newAddons });
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'industry':
        return 'Choose Your Industry';
      case 'modules':
        return 'Configure Your Solution';
      case 'summary':
        return 'Review Configuration';
      default:
        return 'Solution Configurator';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'industry':
        return 'Select your industry to get personalized module recommendations';
      case 'modules':
        return 'Customize your automation suite with the modules that fit your needs';
      case 'summary':
        return 'Review your configuration and complete your setup';
      default:
        return 'Build your perfect automation solution';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Solution Configurator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Build your perfect automation solution tailored to your industry and business needs
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className={`flex items-center ${currentStep === 'industry' ? 'text-yellow-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                currentStep === 'industry' ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-400'
              }`}>
                1
              </div>
              <span className="font-medium">Industry</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-600"></div>
            
            <div className={`flex items-center ${currentStep === 'modules' ? 'text-yellow-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                currentStep === 'modules' ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">Modules</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-600"></div>
            
            <div className={`flex items-center ${currentStep === 'summary' ? 'text-yellow-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                currentStep === 'summary' ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-400'
              }`}>
                3
              </div>
              <span className="font-medium">Summary</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{getStepTitle()}</h2>
            <p className="text-gray-300 text-lg">{getStepDescription()}</p>
          </div>

          {currentStep === 'industry' && (
            <IndustrySelector
              industries={INDUSTRIES}
              selectedIndustry={configuration.selectedIndustry}
              onIndustrySelect={handleIndustrySelect}
            />
          )}

          {currentStep === 'modules' && (
            <ModuleSelector
              modules={MODULES}
              selectedModules={configuration.selectedModules}
              selectedAddons={configuration.selectedAddons}
              onModuleToggle={handleModuleToggle}
              onAddonToggle={handleAddonToggle}
              onNext={() => setCurrentStep('summary')}
              onBack={() => setCurrentStep('industry')}
            />
          )}

          {currentStep === 'summary' && (
            <ConfigurationSummary
              configuration={configuration}
              modules={MODULES}
              industries={INDUSTRIES}
              onConfigurationUpdate={updateConfiguration}
              onBack={() => setCurrentStep('modules')}
            />
          )}
        </div>
      </div>
    </div>
  );
}