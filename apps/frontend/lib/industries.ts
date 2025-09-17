/**
 * Industries Utilities for German Code Zero AI
 * 
 * Provides utilities for working with industry catalog data including:
 * - Industry data loading and parsing
 * - SEO data generation for industry pages
 * - Static path generation for dynamic routes
 * - Internationalization support (DE/EN)
 */

import fs from 'fs';
import path from 'path';
import { getIndustrySeo, type Locale, type IndustrySEOData } from './seo';

export interface Industry {
  code: string;
  name: string;
  recommended_modules: string[];
  notes: string;
}

export interface IndustriesCatalog {
  version: string;
  industries: Industry[];
}

// Cache for catalog data
let catalogCache: IndustriesCatalog | null = null;

/**
 * Load industries catalog from config
 */
export function loadIndustriesCatalog(): IndustriesCatalog {
  if (catalogCache) {
    return catalogCache;
  }

  try {
    const catalogPath = path.join(process.cwd(), 'config/industries.catalog.json');
    const catalogData = fs.readFileSync(catalogPath, 'utf8');
    catalogCache = JSON.parse(catalogData);
    return catalogCache!;
  } catch (error) {
    console.error('Failed to load industries catalog:', error);
    // Return fallback data
    return {
      version: '0.1.0',
      industries: []
    };
  }
}

/**
 * Get all industry codes for static path generation
 */
export function getAllIndustryCodes(): string[] {
  const catalog = loadIndustriesCatalog();
  return catalog.industries.map(industry => industry.code);
}

/**
 * Get industry data by code
 */
export function getIndustryByCode(code: string): Industry | null {
  const catalog = loadIndustriesCatalog();
  return catalog.industries.find(industry => industry.code === code) || null;
}

/**
 * Get all industries
 */
export function getAllIndustries(): Industry[] {
  const catalog = loadIndustriesCatalog();
  return catalog.industries;
}

/**
 * Generate static paths for Next.js dynamic routes
 */
export function generateIndustryPaths() {
  const codes = getAllIndustryCodes();
  
  return codes.map(code => ({
    params: { industry: code }
  }));
}

/**
 * Get SEO data for an industry page
 */
export function getIndustryPageSeo(industryCode: string, locale: Locale): IndustrySEOData | null {
  const industry = getIndustryByCode(industryCode);
  
  if (!industry) {
    return null;
  }

  return getIndustrySeo(industry.name, locale, industry.recommended_modules);
}

/**
 * Get industry content for i18n display
 */
export function getIndustryContent(industryCode: string, locale: Locale) {
  const industry = getIndustryByCode(industryCode);
  
  if (!industry) {
    return null;
  }

  // Industry-specific content based on locale
  const content = {
    de: {
      hero: {
        title: `Branchenlösungen – ${industry.name}`,
        subtitle: 'Vorkonfigurierte Playbooks für maximale Wirkung',
        description: `Speziell für ${industry.name} entwickelte Automatisierungslösungen. Planbare Ergebnisse, klare SLAs, schnellere Markteinführung.`
      },
      benefits: {
        title: 'Vorteile für Ihre Branche',
        items: [
          {
            title: 'Branchenspezifische Konfiguration',
            description: `Vorkonfigurierte Module speziell für ${industry.name}. Keine generischen Lösungen.`
          },
          {
            title: 'Schnellere Markteinführung',
            description: 'Reduzierte Ramp-Up-Zeit durch branchenerprobte Playbooks und Best Practices.'
          },
          {
            title: 'Messbare Ergebnisse',
            description: 'Klare KPIs und SLAs für nachweisbare Verbesserungen in Revenue und Service.'
          },
          {
            title: 'Premium Support',
            description: 'Branchenexperten begleiten Sie bei Implementierung und Optimierung.'
          }
        ]
      },
      modules: {
        title: 'Empfohlene Module',
        description: `Diese Module sind speziell für ${industry.name} optimiert:`,
        cta: 'Jetzt konfigurieren'
      },
      faq: {
        title: 'Häufige Fragen',
        items: [
          {
            question: `Wie unterscheiden sich die Lösungen für ${industry.name}?`,
            answer: `Unsere ${industry.name}-Lösungen sind branchenspezifisch vorkonfiguriert und berücksichtigen typische Workflows, Compliance-Anforderungen und Kundenerwartungen Ihrer Branche.`
          },
          {
            question: 'Wie schnell kann ich starten?',
            answer: 'Durch die Vorkonfiguration können Sie innerhalb von Tagen statt Wochen produktiv werden. Unsere Branchenexperten begleiten Sie dabei.'
          },
          {
            question: 'Welche SLAs gelten?',
            answer: 'Wir bieten branchenspezifische SLAs mit garantierten Response-Zeiten und Verfügbarkeitsgarantien. Details in der Konfiguration.'
          },
          {
            question: 'Kann ich die Lösung anpassen?',
            answer: 'Ja, alle Module sind vollständig anpassbar. Die Branchenkonfiguration dient als optimaler Startpunkt für Ihre individuellen Anforderungen.'
          }
        ]
      },
      cta: {
        title: 'Bereit für den nächsten Schritt?',
        description: `Entdecken Sie, wie ${industry.name}-Unternehmen mit unseren Lösungen mehr Umsatz generieren und Reibung reduzieren.`,
        primaryButton: 'Lösung konfigurieren',
        secondaryButton: 'Demo anfragen'
      }
    },
    en: {
      hero: {
        title: `Industry Solutions – ${industry.name}`,
        subtitle: 'Preconfigured playbooks for maximum impact',
        description: `Automation solutions specifically developed for ${industry.name}. Predictable outcomes, clear SLAs, faster time-to-market.`
      },
      benefits: {
        title: 'Benefits for Your Industry',
        items: [
          {
            title: 'Industry-Specific Configuration',
            description: `Preconfigured modules specifically for ${industry.name}. No generic solutions.`
          },
          {
            title: 'Faster Time-to-Market',
            description: 'Reduced ramp-up time through industry-proven playbooks and best practices.'
          },
          {
            title: 'Measurable Results',
            description: 'Clear KPIs and SLAs for demonstrable improvements in revenue and service.'
          },
          {
            title: 'Premium Support',
            description: 'Industry experts guide you through implementation and optimization.'
          }
        ]
      },
      modules: {
        title: 'Recommended Modules',
        description: `These modules are specifically optimized for ${industry.name}:`,
        cta: 'Configure now'
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            question: `How do the solutions for ${industry.name} differ?`,
            answer: `Our ${industry.name} solutions are industry-specifically preconfigured and consider typical workflows, compliance requirements, and customer expectations of your industry.`
          },
          {
            question: 'How quickly can I get started?',
            answer: 'Through preconfiguration, you can become productive within days instead of weeks. Our industry experts guide you through the process.'
          },
          {
            question: 'What SLAs apply?',
            answer: 'We offer industry-specific SLAs with guaranteed response times and availability guarantees. Details in the configuration.'
          },
          {
            question: 'Can I customize the solution?',
            answer: 'Yes, all modules are fully customizable. The industry configuration serves as the optimal starting point for your individual requirements.'
          }
        ]
      },
      cta: {
        title: 'Ready for the next step?',
        description: `Discover how ${industry.name} companies generate more revenue and reduce friction with our solutions.`,
        primaryButton: 'Configure solution',
        secondaryButton: 'Request demo'
      }
    }
  };

  return {
    ...content[locale],
    industry,
    recommendedModules: industry.recommended_modules,
    notes: industry.notes
  };
}

/**
 * Validate industry code
 */
export function isValidIndustryCode(code: string): boolean {
  const codes = getAllIndustryCodes();
  return codes.includes(code);
}

/**
 * Get industry display name by code
 */
export function getIndustryName(code: string): string | null {
  const industry = getIndustryByCode(code);
  return industry ? industry.name : null;
}