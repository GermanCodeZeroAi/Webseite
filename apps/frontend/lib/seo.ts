/**
 * SEO Utilities for Autonomy Grid Frontend
 * 
 * Provides comprehensive SEO primitives including titles, meta descriptions,
 * OpenGraph tags, and JSON-LD structured data for all pages.
 * 
 * Features:
 * - DE/EN internationalization
 * - Schema.org structured data
 * - OpenGraph optimization
 * - Accessibility considerations
 * - Refer-a-Friend integration
 */

export type Locale = 'de' | 'en';
export type PageType = 'home' | 'shop' | 'industries' | 'pricing' | 'about' | 'contact' | 'category' | 'industry';

export interface SEOData {
  title: string;
  description: string;
  og: {
    title: string;
    description: string;
    image: string;
    type: 'website' | 'product' | 'article';
    locale: string;
  };
  jsonLd: object;
  canonical: string;
  hreflang?: { [key: string]: string };
}

export interface CategorySEOData extends SEOData {
  category: string;
  modules: string[];
}

export interface IndustrySEOData extends SEOData {
  industry: string;
  recommendedModules: string[];
}

// Base configuration
const BASE_URL = 'https://autonomy-grid.com';
const DEFAULT_OG_IMAGE = '/og/default-black-gold.png';

// i18n content
const CONTENT = {
  de: {
    organization: {
      name: 'Autonomy Grid',
      description: 'Premium B2B Services für Revenue- und Service-Orchestrierung',
      url: BASE_URL,
      logo: `${BASE_URL}/logo/autonomy-grid-logo-black-gold.svg`,
      sameAs: [
        'https://linkedin.com/company/autonomygrid',
        'https://x.com/autonomygrid'
      ]
    },
    pages: {
      home: {
        title: 'Autonomy Grid – Mehr Umsatz. Weniger Reibung. Premium B2B.',
        description: 'Orchestrieren Sie Revenue- und Service-Prozesse Ende‑zu‑Ende – Premium-Erlebnis in Gold/Schwarz. Refer‑a‑Friend (bald verfügbar).',
        ogTitle: 'Mehr Umsatz. Weniger Reibung.',
        ogDescription: 'Premium B2B Services für Revenue- und Service-Orchestrierung. Refer‑a‑Friend (bald verfügbar).'
      },
      shop: {
        title: 'Autonomy Grid Konfigurator – Module & Bundles zusammenstellen',
        description: 'Stellen Sie Module und Bundles transparent zusammen. Preise live, skalierbar, premium.',
        ogTitle: 'Module & Bundles konfigurieren',
        ogDescription: 'Transparente Konfiguration mit Live-Preisen. Premium B2B Services.'
      },
      industries: {
        title: 'Branchenlösungen – SaaS, E‑Commerce, Services, Finance',
        description: 'Branchenpräzise Journeys ohne Custom‑Overhead. Kürzere Ramp‑Up‑Zeit, höhere Abschlussquoten.',
        ogTitle: 'Branchenlösungen',
        ogDescription: 'Vorkonfigurierte Playbooks für maximale Wirkung. Planbare Ergebnisse, klare SLAs.'
      },
      pricing: {
        title: 'Preise & Pläne – Core, Growth, Enterprise',
        description: 'Klare Pläne inkl. Premium‑Support. Monatlich oder jährlich. Refer‑a‑Friend (bald verfügbar).',
        ogTitle: 'Preise & Pläne',
        ogDescription: 'Transparente Preise ohne versteckte Kosten. Premium Support inklusive.'
      },
      about: {
        title: 'Über uns – Stille Infrastruktur, laute Ergebnisse',
        description: 'Fokus auf Orchestrierung, Qualität, Geschwindigkeit. Premium, präzise, verbindlich.',
        ogTitle: 'Stille Infrastruktur, laute Ergebnisse',
        ogDescription: 'Premium B2B Services mit Fokus auf messbare Ergebnisse.'
      },
      contact: {
        title: 'Kontakt – Gespräch vereinbaren',
        description: 'Sprechen wir über Ihre Wachstumshebel. Formular, E‑Mail, Terminbuchung.',
        ogTitle: 'Kontakt & Demo',
        ogDescription: 'Sprechen wir über Wirkung, nicht nur Features. Demo anfragen.'
      }
    }
  },
  en: {
    organization: {
      name: 'Autonomy Grid',
      description: 'Premium B2B Services for Revenue and Service Orchestration',
      url: BASE_URL,
      logo: `${BASE_URL}/logo/autonomy-grid-logo-black-gold.svg`,
      sameAs: [
        'https://linkedin.com/company/autonomygrid',
        'https://x.com/autonomygrid'
      ]
    },
    pages: {
      home: {
        title: 'Autonomy Grid – More revenue. Less friction. Premium B2B.',
        description: 'Orchestrate revenue and service processes end‑to‑end—premium experience in gold/black. Refer‑a‑Friend (coming soon).',
        ogTitle: 'More revenue. Less friction.',
        ogDescription: 'Premium B2B Services for Revenue and Service Orchestration. Refer‑a‑Friend (coming soon).'
      },
      shop: {
        title: 'Autonomy Grid Configurator – Assemble modules & bundles',
        description: 'Configure modules and bundles transparently. Live pricing, scalable, premium.',
        ogTitle: 'Configure modules & bundles',
        ogDescription: 'Transparent configuration with live pricing. Premium B2B Services.'
      },
      industries: {
        title: 'Industry Solutions – SaaS, e‑commerce, services, finance',
        description: 'Industry‑precise journeys without custom overhead. Shorter ramp‑up, higher close rates.',
        ogTitle: 'Industry Solutions',
        ogDescription: 'Preconfigured playbooks for maximum impact. Predictable outcomes, clear SLAs.'
      },
      pricing: {
        title: 'Pricing & Plans – Core, Growth, Enterprise',
        description: 'Clear plans incl. premium support. Monthly or annual. Refer‑a‑Friend (coming soon).',
        ogTitle: 'Pricing & Plans',
        ogDescription: 'Transparent pricing with no hidden fees. Premium support included.'
      },
      about: {
        title: 'About us – Quiet infrastructure, loud results',
        description: 'Focus on orchestration, quality, speed. Premium, precise, dependable.',
        ogTitle: 'Quiet infrastructure, loud results',
        ogDescription: 'Premium B2B Services focused on measurable outcomes.'
      },
      contact: {
        title: 'Contact – Schedule a call',
        description: 'Let\'s talk about your growth levers. Form, email, scheduling.',
        ogTitle: 'Contact & Demo',
        ogDescription: 'Let\'s talk impact, not just features. Request a demo.'
      }
    }
  }
};

/**
 * Build page title based on page type and locale
 */
export function buildTitle(page: PageType, locale: Locale, options?: { category?: string; industry?: string }): string {
  const content = CONTENT[locale];
  
  if (page === 'category' && options?.category) {
    return `${options.category} – Premium ${options.category} | ${content.organization.name}`;
  }
  
  if (page === 'industry' && options?.industry) {
    return `Branchenlösungen – ${options.industry} | ${content.organization.name}`;
  }
  
  return content.pages[page as keyof typeof content.pages]?.title || content.organization.name;
}

/**
 * Build meta description based on page type and locale
 */
export function buildMetaDescription(page: PageType, locale: Locale, options?: { category?: string; industry?: string }): string {
  const content = CONTENT[locale];
  
  if (page === 'category' && options?.category) {
    return `${options.category} in Markenqualität – schneller, konsistenter, messbar. Jetzt konfigurieren.`;
  }
  
  if (page === 'industry' && options?.industry) {
    return `Vorkonfigurierte Playbooks für ${options.industry}. Planbare Ergebnisse, klare SLAs.`;
  }
  
  return content.pages[page as keyof typeof content.pages]?.description || content.organization.description;
}

/**
 * Build OpenGraph data
 */
export function buildOpenGraph(page: PageType, locale: Locale, options?: { category?: string; industry?: string }): SEOData['og'] {
  const content = CONTENT[locale];
  const localeCode = locale === 'de' ? 'de_DE' : 'en_US';
  
  let ogTitle: string;
  let ogDescription: string;
  let ogType: 'website' | 'product' | 'article' = 'website';
  
  if (page === 'category' && options?.category) {
    ogTitle = `Premium ${options.category}`;
    ogDescription = `${options.category} in Markenqualität – schneller, konsistenter, messbar.`;
    ogType = 'product';
  } else if (page === 'industry' && options?.industry) {
    ogTitle = `Branchenlösungen – ${options.industry}`;
    ogDescription = `Vorkonfigurierte Playbooks für ${options.industry}. Planbare Ergebnisse, klare SLAs.`;
  } else {
    const pageContent = content.pages[page as keyof typeof content.pages];
    ogTitle = pageContent?.ogTitle || pageContent?.title || content.organization.name;
    ogDescription = pageContent?.ogDescription || pageContent?.description || content.organization.description;
  }
  
  return {
    title: ogTitle,
    description: ogDescription,
    image: DEFAULT_OG_IMAGE,
    type: ogType,
    locale: localeCode
  };
}

/**
 * Build JSON-LD structured data
 */
export function buildSchema(page: PageType, locale: Locale, options?: { category?: string; industry?: string; modules?: string[] }): object {
  const content = CONTENT[locale];
  const localeCode = locale === 'de' ? 'de-DE' : 'en-US';
  
  const baseSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: content.organization.name,
        url: content.organization.url,
        logo: content.organization.logo,
        description: content.organization.description,
        sameAs: content.organization.sameAs,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: [localeCode],
          areaServed: locale === 'de' ? 'DE' : 'US'
        }
      },
      {
        '@type': 'WebSite',
        name: content.organization.name,
        url: content.organization.url,
        description: content.organization.description,
        inLanguage: localeCode,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${content.organization.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
  
  // Add page-specific schema
  const pageSchema = {
    '@type': 'WebPage',
    name: buildTitle(page, locale, options),
    description: buildMetaDescription(page, locale, options),
    url: `${content.organization.url}/${page}`,
    inLanguage: localeCode,
    isPartOf: {
      '@type': 'WebSite',
      name: content.organization.name,
      url: content.organization.url
    }
  };
  
  // Add breadcrumbs for category/industry pages
  if (page === 'category' && options?.category) {
    pageSchema['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: content.organization.url
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: `${content.organization.url}/shop`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: options.category,
          item: `${content.organization.url}/shop/${options.category.toLowerCase()}`
        }
      ]
    };
  }
  
  if (page === 'industry' && options?.industry) {
    pageSchema['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: content.organization.url
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Industries',
          item: `${content.organization.url}/industries`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: options.industry,
          item: `${content.organization.url}/industries/${options.industry.toLowerCase()}`
        }
      ]
    };
  }
  
  // Add product schema for category pages
  if (page === 'category' && options?.category) {
    baseSchema['@graph'].push({
      '@type': 'Product',
      name: `Premium ${options.category}`,
      description: `${options.category} in Markenqualität – schneller, konsistenter, messbar.`,
      brand: {
        '@type': 'Brand',
        name: content.organization.name
      },
      category: options.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: content.organization.name
        }
      }
    });
  }
  
  baseSchema['@graph'].push(pageSchema);
  
  return baseSchema;
}

/**
 * Build hreflang attributes for internationalization
 */
export function buildHreflang(page: PageType, options?: { category?: string; industry?: string }): { [key: string]: string } {
  const basePath = page === 'home' ? '' : `/${page}`;
  const categoryPath = options?.category ? `/${options.category}` : '';
  const industryPath = options?.industry ? `/${options.industry}` : '';
  const path = `${basePath}${categoryPath}${industryPath}`;
  
  return {
    'de': `${BASE_URL}${path}`,
    'en': `${BASE_URL}/en${path}`,
    'x-default': `${BASE_URL}${path}`
  };
}

/**
 * Get complete SEO data for a page
 */
export function getPageSeo(page: PageType, locale: Locale, options?: { category?: string; industry?: string; modules?: string[] }): SEOData {
  const content = CONTENT[locale];
  const path = page === 'home' ? '' : `/${page}`;
  const categoryPath = options?.category ? `/${options.category}` : '';
  const industryPath = options?.industry ? `/${options.industry}` : '';
  const fullPath = `${path}${categoryPath}${industryPath}`;
  
  return {
    title: buildTitle(page, locale, options),
    description: buildMetaDescription(page, locale, options),
    og: buildOpenGraph(page, locale, options),
    jsonLd: buildSchema(page, locale, options),
    canonical: `${BASE_URL}${fullPath}`,
    hreflang: buildHreflang(page, options)
  };
}

/**
 * Get SEO data for category pages
 */
export function getCategorySeo(category: string, locale: Locale, modules: string[] = []): CategorySEOData {
  const seoData = getPageSeo('category', locale, { category, modules });
  
  return {
    ...seoData,
    category,
    modules
  };
}

/**
 * Get SEO data for industry pages
 */
export function getIndustrySeo(industry: string, locale: Locale, recommendedModules: string[] = []): IndustrySEOData {
  const seoData = getPageSeo('industry', locale, { industry, modules: recommendedModules });
  
  return {
    ...seoData,
    industry,
    recommendedModules
  };
}

/**
 * Get pricing page SEO data
 */
export function getPricingSeo(locale: Locale): SEOData {
  return getPageSeo('pricing', locale);
}

/**
 * Get contact page SEO data
 */
export function getContactSeo(locale: Locale): SEOData {
  return getPageSeo('contact', locale);
}

/**
 * Build sitemap data
 */
export function buildSitemapData(): Array<{ url: string; lastmod: string; changefreq: string; priority: number }> {
  const now = new Date().toISOString().split('T')[0];
  
  return [
    { url: BASE_URL, lastmod: now, changefreq: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastmod: now, changefreq: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/industries`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastmod: now, changefreq: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.7 }
  ];
}