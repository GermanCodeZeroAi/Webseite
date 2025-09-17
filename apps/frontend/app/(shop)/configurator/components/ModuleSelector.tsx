import React from 'react';
import type { Module } from '../page';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModules: string[];
  selectedAddons: string[];
  onModuleToggle: (moduleCode: string) => void;
  onAddonToggle: (addonCode: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ADDON_NAMES: Record<string, { name: string; description: string }> = {
  'signature-extract': { name: 'Signature Extraction', description: 'Extract and process email signatures' },
  'language-detection': { name: 'Language Detection', description: 'Automatic language detection and routing' },
  'asr-premium': { name: 'Premium Speech Recognition', description: 'High-accuracy speech-to-text processing' },
  'realtime-analytics': { name: 'Real-time Analytics', description: 'Live call analytics and insights' },
  'brand-style-lock': { name: 'Brand Style Lock', description: 'Enforce consistent brand guidelines' },
  'copyright-check': { name: 'Copyright Verification', description: 'Automated copyright and license validation' },
  'captioning': { name: 'Auto Captioning', description: 'Generate captions and subtitles automatically' },
  'script-polish': { name: 'Script Enhancement', description: 'Improve scripts for professional narration' },
  'mix-master': { name: 'Audio Mastering', description: 'Professional audio mixing and mastering' },
  'length-variants': { name: 'Length Variants', description: 'Generate multiple duration versions' },
  'translation-de-en': { name: 'German/English Translation', description: 'Professional DE/EN translation services' },
  'a11y-review': { name: 'Accessibility Review', description: 'WCAG 2.2 AA compliance auditing' }
};

const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  modules,
  selectedModules,
  selectedAddons,
  onModuleToggle,
  onAddonToggle,
  onNext,
  onBack
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Communication':
        return '💬';
      case 'Creative':
        return '🎨';
      case 'Digital':
        return '💻';
      default:
        return '⚙️';
    }
  };

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-12">
      {Object.entries(groupedModules).map(([category, categoryModules]) => (
        <div key={category}>
          <div className="flex items-center mb-8">
            <span className="text-4xl mr-4">{getCategoryIcon(category)}</span>
            <h3 className="text-2xl font-bold">{category} Solutions</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryModules.map((module) => (
              <div
                key={module.code}
                className={`bg-gray-800 rounded-lg p-6 border-2 transition-all ${
                  selectedModules.includes(module.code)
                    ? 'border-yellow-500 bg-gray-700'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">{module.name}</h4>
                  <button
                    onClick={() => onModuleToggle(module.code)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedModules.includes(module.code)
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'border-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {selectedModules.includes(module.code) && (
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-300 mb-6">{module.description}</p>
                
                {selectedModules.includes(module.code) && module.addons.length > 0 && (
                  <div className="border-t border-gray-600 pt-4">
                    <h5 className="font-medium text-yellow-400 mb-3">Available Add-ons:</h5>
                    <div className="space-y-2">
                      {module.addons.map((addonCode) => {
                        const addon = ADDON_NAMES[addonCode];
                        if (!addon) return null;
                        
                        return (
                          <div
                            key={addonCode}
                            className="flex items-start justify-between p-2 rounded hover:bg-gray-600 cursor-pointer"
                            onClick={() => onAddonToggle(addonCode)}
                          >
                            <div className="flex-1 mr-3">
                              <div className="text-sm font-medium">{addon.name}</div>
                              <div className="text-xs text-gray-400">{addon.description}</div>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              selectedAddons.includes(addonCode)
                                ? 'bg-yellow-500 border-yellow-500'
                                : 'border-gray-500'
                            }`}>
                              {selectedAddons.includes(addonCode) && (
                                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t border-gray-700">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Industry
        </button>
        
        <button
          onClick={onNext}
          disabled={selectedModules.length === 0}
          className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
            selectedModules.length === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          Review Configuration →
        </button>
      </div>
    </div>
  );
};

export default ModuleSelector;