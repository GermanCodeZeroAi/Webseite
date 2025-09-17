/**
 * Configuration Summary Component
 * 
 * Displays current configuration state with selected modules,
 * bundle information, and quick actions. Features:
 * - Real-time configuration display
 * - Module management
 * - Bundle switching
 * - Configuration export/sharing
 * - Accessibility with proper ARIA labels
 */

'use client';

import React, { useMemo } from 'react';
import { Module, Bundle, Configuration } from '../page';
import { Locale } from '../../../../lib/seo';

interface ConfigurationSummaryProps {
  configuration: Configuration;
  modules: Module[];
  bundles: Bundle[];
  locale: Locale;
  onUpdateConfiguration: (updates: Partial<Configuration>) => void;
}

export default function ConfigurationSummary({
  configuration,
  modules,
  bundles,
  locale,
  onUpdateConfiguration
}: ConfigurationSummaryProps) {
  // Get selected modules data
  const selectedModulesData = useMemo(() => {
    return modules.filter(m => configuration.selectedModules.includes(m.id));
  }, [modules, configuration.selectedModules]);

  // Get current bundle data
  const currentBundle = useMemo(() => {
    return configuration.selectedBundle 
      ? bundles.find(b => b.id === configuration.selectedBundle)
      : null;
  }, [bundles, configuration.selectedBundle]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalModules = selectedModulesData.length;
    const totalBasePrice = selectedModulesData.reduce((sum, m) => sum + m.basePrice, 0);
    const categories = new Set(selectedModulesData.map(m => m.category));
    
    return {
      totalModules,
      totalBasePrice,
      categoriesCount: categories.size,
      categories: Array.from(categories)
    };
  }, [selectedModulesData]);

  // Handle module removal
  const handleRemoveModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module?.required) return; // Can't remove required modules
    
    // Check if any other selected module depends on this one
    const dependentModules = selectedModulesData.filter(m => 
      m.dependencies?.includes(moduleId)
    );
    
    if (dependentModules.length > 0) {
      // Show warning or auto-remove dependent modules
      const confirmRemoval = window.confirm(
        locale === 'de' 
          ? `Das Entfernen von "${module?.name}" wird auch folgende Module entfernen: ${dependentModules.map(m => m.name).join(', ')}. Fortfahren?`
          : `Removing "${module?.name}" will also remove these modules: ${dependentModules.map(m => m.name).join(', ')}. Continue?`
      );
      
      if (!confirmRemoval) return;
      
      // Remove dependent modules first
      dependentModules.forEach(depModule => {
        onUpdateConfiguration({
          selectedModules: configuration.selectedModules.filter(id => id !== depModule.id)
        });
      });
    }
    
    onUpdateConfiguration({
      selectedModules: configuration.selectedModules.filter(id => id !== moduleId),
      selectedBundle: undefined // Clear bundle when manually removing modules
    });
  };

  // Handle bundle switching
  const handleSwitchBundle = (bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    onUpdateConfiguration({
      selectedModules: bundle.modules,
      selectedBundle: bundleId
    });
  };

  // Clear all selections
  const handleClearAll = () => {
    const requiredModules = modules.filter(m => m.required).map(m => m.id);
    onUpdateConfiguration({
      selectedModules: requiredModules,
      selectedBundle: undefined
    });
  };

  // Export configuration
  const handleExportConfig = () => {
    const configData = {
      modules: selectedModulesData.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        basePrice: m.basePrice
      })),
      bundle: currentBundle ? {
        id: currentBundle.id,
        name: currentBundle.name,
        discount: currentBundle.discount
      } : null,
      billingCycle: configuration.billingCycle,
      couponCode: configuration.couponCode,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(configData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `autonomy-grid-config-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const content = {
    de: {
      title: 'Konfiguration',
      stats: {
        modules: 'Module',
        categories: 'Kategorien',
        basePrice: 'Grundpreis'
      },
      bundle: {
        title: 'Aktives Paket',
        none: 'Kein Paket ausgewählt',
        switch: 'Paket wechseln',
        discount: 'Rabatt'
      },
      modules: {
        title: 'Ausgewählte Module',
        remove: 'Entfernen',
        required: 'Erforderlich',
        category: 'Kategorie'
      },
      actions: {
        clearAll: 'Alles löschen',
        export: 'Konfiguration exportieren',
        continue: 'Weiter'
      },
      empty: {
        title: 'Keine Module ausgewählt',
        description: 'Wählen Sie Module oder ein Paket aus, um zu beginnen.'
      }
    },
    en: {
      title: 'Configuration',
      stats: {
        modules: 'Modules',
        categories: 'Categories',
        basePrice: 'Base Price'
      },
      bundle: {
        title: 'Active Bundle',
        none: 'No bundle selected',
        switch: 'Switch bundle',
        discount: 'Discount'
      },
      modules: {
        title: 'Selected Modules',
        remove: 'Remove',
        required: 'Required',
        category: 'Category'
      },
      actions: {
        clearAll: 'Clear all',
        export: 'Export configuration',
        continue: 'Continue'
      },
      empty: {
        title: 'No modules selected',
        description: 'Select modules or a bundle to get started.'
      }
    }
  };

  const t = content[locale];

  return (
    <div className="configuration-summary" role="region" aria-labelledby="config-summary-title">
      <header className="summary-header">
        <h2 id="config-summary-title" className="summary-title">
          {t.title}
        </h2>
        
        {/* Summary Stats */}
        <div className="summary-stats" role="group" aria-label={locale === 'de' ? 'Konfigurationsstatistiken' : 'Configuration statistics'}>
          <div className="stat-item">
            <span className="stat-value">{summaryStats.totalModules}</span>
            <span className="stat-label">{t.stats.modules}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{summaryStats.categoriesCount}</span>
            <span className="stat-label">{t.stats.categories}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">€{summaryStats.totalBasePrice.toLocaleString()}</span>
            <span className="stat-label">{t.stats.basePrice}</span>
          </div>
        </div>
      </header>

      {/* Current Bundle */}
      {currentBundle && (
        <section className="bundle-section" aria-labelledby="bundle-section-title">
          <h3 id="bundle-section-title" className="section-title">
            {t.bundle.title}
          </h3>
          <div className="current-bundle">
            <div className="bundle-info">
              <h4 className="bundle-name">{currentBundle.name}</h4>
              <p className="bundle-description">{currentBundle.description}</p>
              <div className="bundle-discount">
                {currentBundle.discount}% {t.bundle.discount}
              </div>
            </div>
            
            {/* Bundle switching */}
            <div className="bundle-actions">
              <select
                className="bundle-switcher"
                value={currentBundle.id}
                onChange={(e) => handleSwitchBundle(e.target.value)}
                aria-label={t.bundle.switch}
              >
                {bundles.map(bundle => (
                  <option key={bundle.id} value={bundle.id}>
                    {bundle.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Selected Modules */}
      <section className="modules-section" aria-labelledby="modules-section-title">
        <h3 id="modules-section-title" className="section-title">
          {t.modules.title} ({selectedModulesData.length})
        </h3>
        
        {selectedModulesData.length === 0 ? (
          <div className="empty-modules" role="status">
            <h4 className="empty-title">{t.empty.title}</h4>
            <p className="empty-description">{t.empty.description}</p>
          </div>
        ) : (
          <div className="modules-list">
            {selectedModulesData.map((module) => (
              <article
                key={module.id}
                className="module-item"
                role="article"
                aria-labelledby={`summary-module-${module.id}`}
              >
                <div className="module-info">
                  <h4 id={`summary-module-${module.id}`} className="module-name">
                    {module.name}
                    {module.required && (
                      <span className="required-badge" aria-label={t.modules.required}>
                        {t.modules.required}
                      </span>
                    )}
                  </h4>
                  <p className="module-category">
                    {t.modules.category}: {module.category}
                  </p>
                  <div className="module-price">
                    €{module.basePrice}/month
                  </div>
                </div>
                
                {!module.required && (
                  <button
                    type="button"
                    className="module-remove"
                    onClick={() => handleRemoveModule(module.id)}
                    aria-label={`${t.modules.remove} ${module.name}`}
                  >
                    ✕
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <footer className="summary-actions">
        <div className="action-group">
          <button
            type="button"
            className="action-secondary"
            onClick={handleClearAll}
            disabled={selectedModulesData.length === 0}
            aria-label={t.actions.clearAll}
          >
            {t.actions.clearAll}
          </button>
          
          <button
            type="button"
            className="action-secondary"
            onClick={handleExportConfig}
            disabled={selectedModulesData.length === 0}
            aria-label={t.actions.export}
          >
            {t.actions.export}
          </button>
        </div>
        
        <button
          type="button"
          className="action-primary"
          disabled={selectedModulesData.length === 0}
          onClick={() => {
            // Navigate to checkout/order page
            window.location.href = '/shop/checkout';
          }}
        >
          {t.actions.continue}
        </button>
      </footer>

      <style jsx>{`
        .configuration-summary {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 1px solid #333333;
          border-radius: 1rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: sticky;
          top: 2rem;
        }

        .summary-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0;
          text-align: center;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
          border: 1px solid #444444;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #cccccc;
          margin-top: 0.25rem;
        }

        .bundle-section {
          border-top: 1px solid #333333;
          padding-top: 1rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 1rem;
        }

        .current-bundle {
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid #4ade80;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .bundle-info {
          margin-bottom: 1rem;
        }

        .bundle-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4ade80;
          margin: 0 0 0.5rem;
        }

        .bundle-description {
          font-size: 0.9rem;
          color: #cccccc;
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }

        .bundle-discount {
          background: #4ade80;
          color: #000000;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
        }

        .bundle-actions {
          display: flex;
          justify-content: flex-end;
        }

        .bundle-switcher {
          background: #333333;
          border: 1px solid #444444;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .bundle-switcher:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .modules-section {
          border-top: 1px solid #333333;
          padding-top: 1rem;
        }

        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .modules-list::-webkit-scrollbar {
          width: 4px;
        }

        .modules-list::-webkit-scrollbar-track {
          background: #333333;
          border-radius: 2px;
        }

        .modules-list::-webkit-scrollbar-thumb {
          background: #FFD700;
          border-radius: 2px;
        }

        .module-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid #444444;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .module-item:hover {
          background: rgba(0, 0, 0, 0.4);
        }

        .module-info {
          flex: 1;
          min-width: 0;
        }

        .module-name {
          font-size: 1rem;
          font-weight: 600;
          color: #FFD700;
          margin: 0 0 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          line-height: 1.2;
        }

        .required-badge {
          background: #ef4444;
          color: #ffffff;
          padding: 0.125rem 0.375rem;
          border-radius: 0.75rem;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .module-category {
          font-size: 0.8rem;
          color: #cccccc;
          margin: 0 0 0.25rem;
        }

        .module-price {
          font-size: 0.85rem;
          color: #4ade80;
          font-weight: 500;
        }

        .module-remove {
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .module-remove:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .empty-modules {
          text-align: center;
          padding: 2rem 1rem;
          color: #cccccc;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .empty-description {
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid #333333;
          padding-top: 1rem;
        }

        .action-group {
          display: flex;
          gap: 0.5rem;
        }

        .action-secondary {
          flex: 1;
          background: transparent;
          color: #cccccc;
          border: 1px solid #444444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-secondary:hover:not(:disabled) {
          background: #333333;
          color: #ffffff;
        }

        .action-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-primary {
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
        }

        .action-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .action-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-primary:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .configuration-summary {
            position: static;
            padding: 1.5rem;
          }

          .summary-stats {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .stat-item {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .stat-value {
            font-size: 1.2rem;
          }

          .action-group {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .action-primary:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}