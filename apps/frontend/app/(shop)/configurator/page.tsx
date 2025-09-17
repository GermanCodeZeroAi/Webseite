/**
 * Configurator Page for German Code Zero AI Shop
 * 
 * Interactive configuration page with live pricing, module selection,
 * and bundle building. Features:
 * - No internal terminology exposed
 * - Live price updates with aria-live
 * - Module and bundle configuration
 * - Coupon integration from pricing page
 * - Premium B2B presentation
 * - Full accessibility support
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Metadata } from 'next';
import { getPageSeo, type Locale } from '../../../lib/seo';
import PriceCalculator from './components/PriceCalculator';
import ModuleSelector from './components/ModuleSelector';
import ConfigurationSummary from './components/ConfigurationSummary';

interface ConfiguratorPageProps {
  params: { locale?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  features: string[];
  dependencies?: string[];
  popular?: boolean;
  required?: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  modules: string[];
  discount: number;
  popular?: boolean;
}

export interface Configuration {
  selectedModules: string[];
  selectedBundle?: string;
  billingCycle: 'monthly' | 'annual';
  couponCode?: string;
}

const AVAILABLE_MODULES: Module[] = [
  {
    id: 'core-automation',
    name: 'Core Automation',
    category: 'Foundation',
    description: 'Essential workflow automation and process orchestration',
    basePrice: 199,
    features: [
      'Workflow designer',
      'Process automation',
      'Basic integrations',
      'Standard support'
    ],
    required: true
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    category: 'Intelligence',
    description: 'Deep insights and performance tracking',
    basePrice: 149,
    features: [
      'Custom dashboards',
      'Advanced reporting',
      'Performance metrics',
      'Data export'
    ],
    popular: true
  },
  {
    id: 'premium-integrations',
    name: 'Premium Integrations',
    category: 'Connectivity',
    description: 'Connect with enterprise tools and systems',
    basePrice: 249,
    features: [
      'Enterprise connectors',
      'API management',
      'Real-time sync',
      'Custom webhooks'
    ]
  },
  {
    id: 'ai-optimization',
    name: 'AI Optimization',
    category: 'Intelligence',
    description: 'Machine learning powered process optimization',
    basePrice: 299,
    features: [
      'Predictive analytics',
      'Smart recommendations',
      'Auto-optimization',
      'ML insights'
    ]
  },
  {
    id: 'collaboration-suite',
    name: 'Collaboration Suite',
    category: 'Teamwork',
    description: 'Enhanced team collaboration and communication',
    basePrice: 99,
    features: [
      'Team workspaces',
      'Real-time collaboration',
      'Communication tools',
      'Shared resources'
    ]
  },
  {
    id: 'security-compliance',
    name: 'Security & Compliance',
    category: 'Security',
    description: 'Enterprise-grade security and compliance features',
    basePrice: 199,
    features: [
      'Advanced security',
      'Compliance reporting',
      'Audit trails',
      'Access controls'
    ]
  }
];

const AVAILABLE_BUNDLES: Bundle[] = [
  {
    id: 'starter-bundle',
    name: 'Starter Bundle',
    description: 'Perfect for small to medium teams getting started',
    modules: ['core-automation', 'collaboration-suite'],
    discount: 15
  },
  {
    id: 'professional-bundle',
    name: 'Professional Bundle',
    description: 'Comprehensive solution for growing businesses',
    modules: ['core-automation', 'advanced-analytics', 'premium-integrations', 'collaboration-suite'],
    discount: 25,
    popular: true
  },
  {
    id: 'enterprise-bundle',
    name: 'Enterprise Bundle',
    description: 'Complete solution with all features and AI capabilities',
    modules: ['core-automation', 'advanced-analytics', 'premium-integrations', 'ai-optimization', 'collaboration-suite', 'security-compliance'],
    discount: 35
  }
];

export default function ConfiguratorPage({ params, searchParams }: ConfiguratorPageProps) {
  const locale: Locale = (params.locale as Locale) || 'de';
  
  // Initialize configuration from URL params
  const [configuration, setConfiguration] = useState<Configuration>(() => {
    const urlPlan = searchParams.plan as string;
    const urlBilling = (searchParams.billing as string) || 'annual';
    const urlCoupon = searchParams.coupon as string;
    
    // Map plan to bundle
    let initialBundle: string | undefined;
    if (urlPlan === 'starter') initialBundle = 'starter-bundle';
    else if (urlPlan === 'professional') initialBundle = 'professional-bundle';
    else if (urlPlan === 'enterprise') initialBundle = 'enterprise-bundle';
    
    return {
      selectedModules: initialBundle ? AVAILABLE_BUNDLES.find(b => b.id === initialBundle)?.modules || [] : ['core-automation'],
      selectedBundle: initialBundle,
      billingCycle: urlBilling as 'monthly' | 'annual',
      couponCode: urlCoupon
    };
  });

  const [activeTab, setActiveTab] = useState<'modules' | 'bundles'>('bundles');
  const [showPricing, setShowPricing] = useState<boolean>(true);

  // Update configuration
  const updateConfiguration = (updates: Partial<Configuration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  };

  // Handle module selection
  const toggleModule = (moduleId: string) => {
    const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
    if (module?.required) return; // Can't deselect required modules
    
    setConfiguration(prev => {
      const isSelected = prev.selectedModules.includes(moduleId);
      const newModules = isSelected 
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId];
      
      return {
        ...prev,
        selectedModules: newModules,
        selectedBundle: undefined // Clear bundle selection when manually selecting modules
      };
    });
  };

  // Handle bundle selection
  const selectBundle = (bundleId: string | undefined) => {
    const bundle = bundleId ? AVAILABLE_BUNDLES.find(b => b.id === bundleId) : undefined;
    
    setConfiguration(prev => ({
      ...prev,
      selectedModules: bundle?.modules || prev.selectedModules,
      selectedBundle: bundleId
    }));
  };

  const content = {
    de: {
      title: 'Konfigurator',
      subtitle: 'Stellen Sie Ihre perfekte Lösung zusammen',
      tabs: {
        bundles: 'Vorgefertigte Pakete',
        modules: 'Einzelne Module'
      },
      pricing: {
        show: 'Preise anzeigen',
        hide: 'Preise ausblenden'
      },
      cta: {
        continue: 'Weiter zur Bestellung',
        customize: 'Anpassen'
      }
    },
    en: {
      title: 'Configurator',
      subtitle: 'Build your perfect solution',
      tabs: {
        bundles: 'Pre-built Packages',
        modules: 'Individual Modules'
      },
      pricing: {
        show: 'Show pricing',
        hide: 'Hide pricing'
      },
      cta: {
        continue: 'Continue to order',
        customize: 'Customize'
      }
    }
  };

  const t = content[locale];

  return (
    <main className="configurator-page" role="main">
      {/* Header */}
      <header className="configurator-header">
        <div className="configurator-container">
          <h1 className="configurator-title">{t.title}</h1>
          <p className="configurator-subtitle">{t.subtitle}</p>
          
          {/* Tab Navigation */}
          <nav className="tab-navigation" role="tablist" aria-label={t.title}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bundles'}
              aria-controls="bundles-panel"
              id="bundles-tab"
              className={`tab-button ${activeTab === 'bundles' ? 'active' : ''}`}
              onClick={() => setActiveTab('bundles')}
            >
              {t.tabs.bundles}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'modules'}
              aria-controls="modules-panel"
              id="modules-tab"
              className={`tab-button ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => setActiveTab('modules')}
            >
              {t.tabs.modules}
            </button>
          </nav>
          
          {/* Pricing Toggle */}
          <div className="pricing-toggle">
            <button
              type="button"
              className="pricing-toggle-btn"
              onClick={() => setShowPricing(!showPricing)}
              aria-label={showPricing ? t.pricing.hide : t.pricing.show}
            >
              {showPricing ? t.pricing.hide : t.pricing.show}
            </button>
          </div>
        </div>
      </header>

      <div className="configurator-content">
        <div className="configurator-container">
          <div className="configurator-grid">
            {/* Main Configuration Area */}
            <div className="configuration-area">
              {/* Bundles Tab */}
              <div
                id="bundles-panel"
                role="tabpanel"
                aria-labelledby="bundles-tab"
                className={`tab-panel ${activeTab === 'bundles' ? 'active' : ''}`}
                hidden={activeTab !== 'bundles'}
              >
                <div className="bundles-grid">
                  {AVAILABLE_BUNDLES.map((bundle) => (
                    <div
                      key={bundle.id}
                      className={`bundle-card ${configuration.selectedBundle === bundle.id ? 'selected' : ''} ${bundle.popular ? 'popular' : ''}`}
                      role="article"
                      aria-labelledby={`bundle-${bundle.id}-title`}
                    >
                      {bundle.popular && (
                        <div className="popular-badge" aria-label="Popular choice">
                          {locale === 'de' ? 'Beliebt' : 'Popular'}
                        </div>
                      )}
                      
                      <header className="bundle-header">
                        <h2 id={`bundle-${bundle.id}-title`} className="bundle-name">
                          {bundle.name}
                        </h2>
                        <p className="bundle-description">{bundle.description}</p>
                        <div className="bundle-savings">
                          {bundle.discount}% {locale === 'de' ? 'Ersparnis' : 'savings'}
                        </div>
                      </header>

                      <div className="bundle-modules">
                        <h3 className="modules-title">
                          {locale === 'de' ? 'Enthaltene Module' : 'Included modules'}
                        </h3>
                        <ul className="modules-list" role="list">
                          {bundle.modules.map((moduleId) => {
                            const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                            return module ? (
                              <li key={moduleId} className="module-item">
                                <span className="module-icon" aria-hidden="true">✓</span>
                                {module.name}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>

                      <div className="bundle-actions">
                        <button
                          type="button"
                          className={`bundle-select ${configuration.selectedBundle === bundle.id ? 'selected' : ''}`}
                          onClick={() => selectBundle(configuration.selectedBundle === bundle.id ? undefined : bundle.id)}
                          aria-label={`${configuration.selectedBundle === bundle.id ? 'Deselect' : 'Select'} ${bundle.name}`}
                        >
                          {configuration.selectedBundle === bundle.id 
                            ? (locale === 'de' ? 'Ausgewählt' : 'Selected')
                            : (locale === 'de' ? 'Auswählen' : 'Select')
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modules Tab */}
              <div
                id="modules-panel"
                role="tabpanel"
                aria-labelledby="modules-tab"
                className={`tab-panel ${activeTab === 'modules' ? 'active' : ''}`}
                hidden={activeTab !== 'modules'}
              >
                <ModuleSelector
                  modules={AVAILABLE_MODULES}
                  selectedModules={configuration.selectedModules}
                  onToggleModule={toggleModule}
                  locale={locale}
                  showPricing={showPricing}
                />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="configurator-sidebar" aria-label={locale === 'de' ? 'Konfiguration und Preise' : 'Configuration and pricing'}>
              {/* Configuration Summary */}
              <ConfigurationSummary
                configuration={configuration}
                modules={AVAILABLE_MODULES}
                bundles={AVAILABLE_BUNDLES}
                locale={locale}
                onUpdateConfiguration={updateConfiguration}
              />

              {/* Price Calculator */}
              {showPricing && (
                <PriceCalculator
                  configuration={configuration}
                  modules={AVAILABLE_MODULES}
                  bundles={AVAILABLE_BUNDLES}
                  locale={locale}
                  onUpdateConfiguration={updateConfiguration}
                />
              )}
            </aside>
          </div>
        </div>
      </div>

      <style jsx>{`
        .configurator-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .configurator-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .configurator-header {
          padding: 4rem 0 2rem;
          text-align: center;
        }

        .configurator-title {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .configurator-subtitle {
          font-size: 1.2rem;
          color: #cccccc;
          margin: 0 0 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .tab-navigation {
          display: inline-flex;
          background: #333333;
          border-radius: 0.5rem;
          padding: 0.25rem;
          margin-bottom: 2rem;
        }

        .tab-button {
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

        .tab-button:hover {
          background: #444444;
        }

        .tab-button.active {
          background: #FFD700;
          color: #000000;
          font-weight: 600;
        }

        .pricing-toggle {
          margin-bottom: 2rem;
        }

        .pricing-toggle-btn {
          background: transparent;
          border: 1px solid #FFD700;
          color: #FFD700;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .pricing-toggle-btn:hover {
          background: #FFD700;
          color: #000000;
        }

        .configurator-content {
          padding: 2rem 0 4rem;
        }

        .configurator-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          align-items: start;
        }

        .configuration-area {
          min-height: 600px;
        }

        .tab-panel {
          display: none;
        }

        .tab-panel.active {
          display: block;
        }

        .bundles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .bundle-card {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 2px solid #333333;
          border-radius: 1rem;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .bundle-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.1);
        }

        .bundle-card.selected {
          border-color: #FFD700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .bundle-card.popular {
          border-color: #4ade80;
        }

        .bundle-card.popular.selected {
          border-color: #FFD700;
        }

        .popular-badge {
          position: absolute;
          top: -0.75rem;
          right: 1rem;
          background: #4ade80;
          color: #000000;
          padding: 0.375rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .bundle-header {
          margin-bottom: 2rem;
        }

        .bundle-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 0.5rem;
        }

        .bundle-description {
          color: #cccccc;
          margin: 0 0 1rem;
          font-size: 1rem;
          line-height: 1.5;
        }

        .bundle-savings {
          background: #4ade80;
          color: #000000;
          padding: 0.375rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-block;
        }

        .bundle-modules {
          margin-bottom: 2rem;
        }

        .modules-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem;
        }

        .modules-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .module-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          color: #cccccc;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .module-icon {
          color: #4ade80;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .bundle-actions {
          margin-top: auto;
        }

        .bundle-select {
          width: 100%;
          background: transparent;
          color: #FFD700;
          border: 2px solid #FFD700;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bundle-select:hover {
          background: #FFD700;
          color: #000000;
        }

        .bundle-select.selected {
          background: #FFD700;
          color: #000000;
        }

        .configurator-sidebar {
          position: sticky;
          top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 1200px) {
          .configurator-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .configurator-sidebar {
            position: static;
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .configurator-container {
            padding: 0 1rem;
          }

          .bundles-grid {
            grid-template-columns: 1fr;
          }

          .bundle-card {
            padding: 1.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bundle-card:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}