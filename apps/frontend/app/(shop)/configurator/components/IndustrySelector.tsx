import React from 'react';
import type { Industry } from '../page';

interface IndustrySelectorProps {
  industries: Industry[];
  selectedIndustry: string | null;
  onIndustrySelect: (industryCode: string) => void;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  industries,
  selectedIndustry,
  onIndustrySelect
}) => {
  const getIndustryIcon = (industryCode: string) => {
    switch (industryCode) {
      case 'manufacturing':
        return '🏭';
      case 'financial-services':
        return '🏦';
      case 'ecommerce':
        return '🛒';
      default:
        return '🏢';
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {industries.map((industry) => (
        <div
          key={industry.code}
          onClick={() => onIndustrySelect(industry.code)}
          className={`bg-gray-800 rounded-xl p-8 border-2 cursor-pointer transition-all hover:scale-105 ${
            selectedIndustry === industry.code
              ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-6">{getIndustryIcon(industry.code)}</div>
            <h3 className="text-2xl font-bold mb-4">{industry.name}</h3>
            <p className="text-gray-300 mb-6">{industry.notes}</p>
            
            <div className="text-left">
              <h4 className="font-semibold text-yellow-400 mb-3">Recommended Solutions:</h4>
              <ul className="space-y-2">
                {industry.recommended_modules.map((moduleCode) => {
                  const moduleNames: Record<string, string> = {
                    'email-routing': 'Email Orchestration',
                    'voicebot': 'Voice Assistant',
                    'image-gen': 'Brand Image Suite',
                    'video-synth': 'Video Production',
                    'music-loop': 'Audio Branding',
                    'web-content': 'Web Content Automation'
                  };
                  
                  return (
                    <li key={moduleCode} className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {moduleNames[moduleCode] || moduleCode}
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <button className="mt-6 w-full py-3 px-6 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
              Select Industry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IndustrySelector;