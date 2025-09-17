/**
 * Module Selector Component
 * 
 * Interactive module selection interface with categories, search,
 * and dependency management. Features:
 * - Category-based organization
 * - Module dependencies handling
 * - Search and filtering
 * - Accessibility with proper ARIA labels
 * - Live pricing integration
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Module } from '../page';
import { Locale } from '../../../../lib/seo';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModules: string[];
  onToggleModule: (moduleId: string) => void;
  locale: Locale;
  showPricing: boolean;
}

export default function ModuleSelector({
  modules,
  selectedModules,
  onToggleModule,
  locale,
  showPricing
}: ModuleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(modules.map(m => m.category))];
    return cats;
  }, [modules]);

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = searchQuery === '' || 
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, selectedCategory]);

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredModules };
    }
    
    return filteredModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [filteredModules, selectedCategory]);

  // Check if module can be deselected (not required and no dependencies)
  const canDeselect = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module?.required) return false;
    
    // Check if any selected module depends on this one
    const isDependency = selectedModules.some(selectedId => {
      const selectedModule = modules.find(m => m.id === selectedId);
      return selectedModule?.dependencies?.includes(moduleId);
    });
    
    return !isDependency;
  };

  // Get module dependencies that need to be selected
  const getMissingDependencies = (moduleId: string): string[] => {
    const module = modules.find(m => m.id === moduleId);
    if (!module?.dependencies) return [];
    
    return module.dependencies.filter(depId => !selectedModules.includes(depId));
  };

  // Handle module toggle with dependency management
  const handleModuleToggle = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const isSelected = selectedModules.includes(moduleId);
    
    if (isSelected && !canDeselect(moduleId)) {
      return; // Can't deselect required modules or dependencies
    }
    
    if (!isSelected) {
      // Auto-select dependencies
      const missingDeps = getMissingDependencies(moduleId);
      missingDeps.forEach(depId => onToggleModule(depId));
    }
    
    onToggleModule(moduleId);
  };

  const content = {
    de: {
      search: {
        placeholder: 'Module durchsuchen...',
        clear: 'Suche löschen'
      },
      categories: {
        all: 'Alle Kategorien',
        Foundation: 'Grundlagen',
        Intelligence: 'Intelligenz',
        Connectivity: 'Konnektivität',
        Teamwork: 'Teamarbeit',
        Security: 'Sicherheit'
      },
      module: {
        selected: 'Ausgewählt',
        select: 'Auswählen',
        required: 'Erforderlich',
        popular: 'Beliebt',
        dependencies: 'Abhängigkeiten',
        features: 'Funktionen'
      },
      pricing: {
        from: 'ab',
        perMonth: '€/Monat'
      }
    },
    en: {
      search: {
        placeholder: 'Search modules...',
        clear: 'Clear search'
      },
      categories: {
        all: 'All Categories',
        Foundation: 'Foundation',
        Intelligence: 'Intelligence',
        Connectivity: 'Connectivity',
        Teamwork: 'Teamwork',
        Security: 'Security'
      },
      module: {
        selected: 'Selected',
        select: 'Select',
        required: 'Required',
        popular: 'Popular',
        dependencies: 'Dependencies',
        features: 'Features'
      },
      pricing: {
        from: 'from',
        perMonth: '€/month'
      }
    }
  };

  const t = content[locale];

  return (
    <div className="module-selector" role="region" aria-labelledby="module-selector-title">
      <header className="selector-header">
        <h2 id="module-selector-title" className="selector-title">
          {locale === 'de' ? 'Module auswählen' : 'Select Modules'}
        </h2>
        
        {/* Search */}
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              className="search-input"
              placeholder={t.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t.search.placeholder}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label={t.search.clear}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-section">
          <div className="category-tabs" role="tablist" aria-label="Module categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selectedCategory === category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {t.categories[category as keyof typeof t.categories] || category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Modules Grid */}
      <div className="modules-content">
        {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
          <section key={category} className="category-section">
            {selectedCategory === 'all' && (
              <h3 className="category-title">
                {t.categories[category as keyof typeof t.categories] || category}
              </h3>
            )}
            
            <div className="modules-grid">
              {categoryModules.map((module) => {
                const isSelected = selectedModules.includes(module.id);
                const canToggle = !module.required && (isSelected ? canDeselect(module.id) : true);
                const missingDeps = getMissingDependencies(module.id);
                
                return (
                  <article
                    key={module.id}
                    className={`module-card ${isSelected ? 'selected' : ''} ${!canToggle ? 'disabled' : ''} ${module.popular ? 'popular' : ''}`}
                    role="article"
                    aria-labelledby={`module-${module.id}-title`}
                  >
                    {/* Badges */}
                    <div className="module-badges">
                      {module.required && (
                        <span className="badge required" aria-label={t.module.required}>
                          {t.module.required}
                        </span>
                      )}
                      {module.popular && (
                        <span className="badge popular" aria-label={t.module.popular}>
                          {t.module.popular}
                        </span>
                      )}
                    </div>

                    {/* Header */}
                    <header className="module-header">
                      <h4 id={`module-${module.id}-title`} className="module-name">
                        {module.name}
                      </h4>
                      <p className="module-description">{module.description}</p>
                      
                      {showPricing && (
                        <div className="module-pricing">
                          <span className="price-label">{t.pricing.from}</span>
                          <span className="price-amount">€{module.basePrice}</span>
                          <span className="price-period">{t.pricing.perMonth}</span>
                        </div>
                      )}
                    </header>

                    {/* Dependencies */}
                    {module.dependencies && module.dependencies.length > 0 && (
                      <div className="module-dependencies">
                        <h5 className="dependencies-title">{t.module.dependencies}:</h5>
                        <ul className="dependencies-list">
                          {module.dependencies.map((depId) => {
                            const depModule = modules.find(m => m.id === depId);
                            return depModule ? (
                              <li key={depId} className="dependency-item">
                                {depModule.name}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Features */}
                    <div className="module-features">
                      <h5 className="features-title">{t.module.features}:</h5>
                      <ul className="features-list" role="list">
                        {module.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="feature-item">
                            <span className="feature-icon" aria-hidden="true">✓</span>
                            {feature}
                          </li>
                        ))}
                        {module.features.length > 3 && (
                          <li className="feature-more">
                            +{module.features.length - 3} {locale === 'de' ? 'weitere' : 'more'}
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="module-actions">
                      <button
                        type="button"
                        className={`module-toggle ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleModuleToggle(module.id)}
                        disabled={!canToggle}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${module.name}`}
                        aria-describedby={missingDeps.length > 0 ? `deps-${module.id}` : undefined}
                      >
                        {isSelected ? t.module.selected : t.module.select}
                      </button>
                      
                      {missingDeps.length > 0 && !isSelected && (
                        <div id={`deps-${module.id}`} className="dependency-warning">
                          {locale === 'de' 
                            ? `Erfordert: ${missingDeps.map(id => modules.find(m => m.id === id)?.name).join(', ')}`
                            : `Requires: ${missingDeps.map(id => modules.find(m => m.id === id)?.name).join(', ')}`
                          }
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        
        {filteredModules.length === 0 && (
          <div className="empty-state" role="status">
            <p>{locale === 'de' ? 'Keine Module gefunden.' : 'No modules found.'}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .module-selector {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .selector-header {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .selector-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0;
        }

        .search-section {
          display: flex;
          gap: 1rem;
        }

        .search-input-group {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          background: #333333;
          border: 1px solid #444444;
          color: #ffffff;
          padding: 0.75rem 1rem;
          padding-right: 3rem;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .search-clear {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #cccccc;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
        }

        .search-clear:hover {
          color: #ffffff;
        }

        .category-section {
          margin-bottom: 2rem;
        }

        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-tab {
          background: #333333;
          border: 1px solid #444444;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .category-tab:hover {
          background: #444444;
        }

        .category-tab.active {
          background: #FFD700;
          color: #000000;
          border-color: #FFD700;
          font-weight: 600;
        }

        .modules-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .category-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #FFD700;
          margin: 0 0 1rem;
          border-bottom: 2px solid #FFD700;
          padding-bottom: 0.5rem;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .module-card {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 2px solid #333333;
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .module-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.1);
        }

        .module-card.selected {
          border-color: #FFD700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
        }

        .module-card.popular {
          border-color: #4ade80;
        }

        .module-card.popular.selected {
          border-color: #FFD700;
        }

        .module-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .module-badges {
          display: flex;
          gap: 0.5rem;
          margin-bottom: -0.5rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.required {
          background: #ef4444;
          color: #ffffff;
        }

        .badge.popular {
          background: #4ade80;
          color: #000000;
        }

        .module-header {
          flex: 1;
        }

        .module-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 0.5rem;
        }

        .module-description {
          color: #cccccc;
          margin: 0 0 1rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .module-pricing {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .price-label {
          color: #cccccc;
          font-size: 0.85rem;
        }

        .price-amount {
          color: #FFD700;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .price-period {
          color: #cccccc;
          font-size: 0.85rem;
        }

        .module-dependencies {
          margin-bottom: 0.5rem;
        }

        .dependencies-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #FFA500;
          margin: 0 0 0.5rem;
        }

        .dependencies-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .dependency-item {
          background: rgba(255, 165, 0, 0.2);
          color: #FFA500;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }

        .module-features {
          flex: 1;
        }

        .features-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.75rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          color: #cccccc;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .feature-icon {
          color: #4ade80;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .feature-more {
          color: #999999;
          font-size: 0.8rem;
          font-style: italic;
        }

        .module-actions {
          margin-top: auto;
        }

        .module-toggle {
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

        .module-toggle:hover:not(:disabled) {
          background: #FFD700;
          color: #000000;
        }

        .module-toggle.selected {
          background: #FFD700;
          color: #000000;
        }

        .module-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dependency-warning {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid #FFA500;
          border-radius: 0.375rem;
          color: #FFA500;
          font-size: 0.8rem;
          text-align: center;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #cccccc;
        }

        .empty-state p {
          font-size: 1.1rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .modules-grid {
            grid-template-columns: 1fr;
          }

          .module-card {
            padding: 1.25rem;
          }

          .category-tabs {
            flex-direction: column;
          }

          .search-input-group {
            max-width: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .module-card:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}