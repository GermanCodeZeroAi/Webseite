/**
 * SEO Utilities for German Code Zero AI Frontend
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
const BASE_URL = 'https://germancodezero.ai';
const DEFAULT_OG_IMAGE = '/og/default-black-gold.png';

// i18n content
// Service and pricing data for JSON-LD
const SERVICES_DATA = {
  de: {
    services: [
      {
        name: 'E-Mail Orchestrierung',
        description: 'Premium-E-Mail-Orchestrierung für Journeys, die öffnen, klicken, konvertieren – von Begrüßung bis Re-Engagement.',
        category: 'Email',
        benefits: ['Höhere Zustell- und Öffnungsraten', 'Dynamische Segmente ohne Mehraufwand', 'Compliance & Marken-konsistentes Design']
      },
      {
        name: 'Telefonie-Orchestrierung',
        description: 'Gesprächsfluss in Studio-Qualität – Routing, Aufzeichnung, Auswertung. Jeder Call sitzt.',
        category: 'Telefonie',
        benefits: ['Intelligentes Routing nach Intent & Priorität', 'Klarheit durch Aufzeichnung und Auswertung', 'Höhere Abschlussquote im Inbound/Outbound']
      },
      {
        name: 'Bild-Orchestrierung',
        description: 'Bildgenerierung und -optimierung für performante Creatives in jeder Journey-Phase.',
        category: 'Bild',
        benefits: ['Schnelle Variantenbildung für Tests', 'Markenkonforme Assets in Gold/Schwarz', 'Ladezeiten und CTR optimiert']
      },
      {
        name: 'Video-Orchestrierung',
        description: 'Video in Premium-Anmutung – Snippets, Demos, Stories. Bereitstellen, messen, skalieren.',
        category: 'Video',
        benefits: ['Schneller Schnitt & Untertitel automatisch', 'Personalisierte Intros/CTAs', 'Messbare Impact-Kurven je Kanal']
      },
      {
        name: 'Musik-Orchestrierung',
        description: 'Lizenzsichere Sound-Signaturen für Markenmomente, die bleiben.',
        category: 'Musik',
        benefits: ['Kuratierte Library für Premium-Marken', 'Rechte geklärt, global nutzbar', 'Konsistente akustische Identität']
      },
      {
        name: 'Website-Orchestrierung',
        description: 'High-performance-Sites in Gold/Schwarz – schnell, zugänglich, vertriebsstark.',
        category: 'Webseiten',
        benefits: ['Lighthouse-stark und SEO-ready', 'Modularer Aufbau, leicht pflegbar', 'Conversion-optimierte Templates']
      }
    ],
    plans: [
      {
        name: 'Core Plan',
        description: 'Starter baseline für SMEs',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      },
      {
        name: 'Growth Plan',
        description: 'Erweiterte Funktionen für wachsende Unternehmen',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      },
      {
        name: 'Enterprise Plan',
        description: 'Enterprise baseline mit erweiterten Kontrollen',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      }
    ],
    faq: [
      {
        question: 'Welche Leistungen bietet German Code Zero AI?',
        answer: 'Wir bieten Premium B2B Services für Revenue- und Service-Orchestrierung in den Bereichen E-Mail, Telefonie, Bild, Video, Musik und Webseiten.'
      },
      {
        question: 'Wie funktioniert die Preisgestaltung?',
        answer: 'Wir bieten transparente Pläne (Core, Growth, Enterprise) mit monatlicher oder jährlicher Abrechnung. Alle Preise sind klar kalkuliert ohne versteckte Kosten.'
      },
      {
        question: 'Ist die Lösung DSGVO-konform?',
        answer: 'Ja, alle unsere Services sind vollständig DSGVO-konform und bieten umfassende Compliance-Features für den deutschen und europäischen Markt.'
      },
      {
        question: 'Welche Branchen werden unterstützt?',
        answer: 'Wir unterstützen SaaS, E-Commerce, Services und Finance mit branchenpräzisen Lösungen und vorkonfigurierten Playbooks.'
      },
      {
        question: 'Wie schnell kann ich starten?',
        answer: 'Mit unseren kuratierten Paketen können Sie in Tagen statt Wochen starten. Concierge-Onboarding ist inklusive.'
      }
    ]
  },
  en: {
    services: [
      {
        name: 'Email Orchestration',
        description: 'Premium email orchestration for journeys that open, click, convert—from welcome to re-engagement.',
        category: 'Email',
        benefits: ['Higher deliverability and open rates', 'Dynamic segments without extra ops', 'Compliance and brand-consistent design']
      },
      {
        name: 'Telephony Orchestration',
        description: 'Studio-grade call flows—routing, recording, analytics. Every call on point.',
        category: 'Telephony',
        benefits: ['Intent- and priority-based routing', 'Clarity via recordings and analytics', 'Higher conversion across inbound/outbound']
      },
      {
        name: 'Image Orchestration',
        description: 'Image generation and optimization for high-performing creatives in every journey stage.',
        category: 'Image',
        benefits: ['Rapid variant creation for testing', 'On-brand assets in gold/black', 'Optimized load time and CTR']
      },
      {
        name: 'Video Orchestration',
        description: 'Premium-grade video—snippets, demos, stories. Ship, measure, scale.',
        category: 'Video',
        benefits: ['Fast editing and auto-captions', 'Personalized intros/CTAs', 'Measurable impact per channel']
      },
      {
        name: 'Music Orchestration',
        description: 'License-safe sonic signatures for brand moments that stick.',
        category: 'Music',
        benefits: ['Curated library for premium brands', 'Rights cleared, globally usable', 'Consistent sonic identity']
      },
      {
        name: 'Website Orchestration',
        description: 'High-performance sites in gold/black—fast, accessible, sales-ready.',
        category: 'Websites',
        benefits: ['Strong Lighthouse and SEO-ready', 'Modular build, easy to maintain', 'Conversion-optimized templates']
      }
    ],
    plans: [
      {
        name: 'Core Plan',
        description: 'Starter baseline for SMEs',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      },
      {
        name: 'Growth Plan',
        description: 'Enhanced features for growing businesses',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      },
      {
        name: 'Enterprise Plan',
        description: 'Enterprise baseline with extended controls',
        priceCurrency: 'EUR',
        billingCycle: 'monthly'
      }
    ],
    faq: [
      {
        question: 'What services does German Code Zero AI offer?',
        answer: 'We provide Premium B2B Services for Revenue and Service Orchestration across Email, Telephony, Image, Video, Music, and Website domains.'
      },
      {
        question: 'How does pricing work?',
        answer: 'We offer transparent plans (Core, Growth, Enterprise) with monthly or annual billing. All pricing is clearly calculated with no hidden fees.'
      },
      {
        question: 'Is the solution GDPR compliant?',
        answer: 'Yes, all our services are fully GDPR compliant and offer comprehensive compliance features for the German and European markets.'
      },
      {
        question: 'Which industries are supported?',
        answer: 'We support SaaS, e-commerce, services, and finance with industry-precise solutions and preconfigured playbooks.'
      },
      {
        question: 'How quickly can I get started?',
        answer: 'With our curated packages, you can start in days instead of weeks. Concierge onboarding is included.'
      }
    ]
  }
};

const CONTENT = {
  de: {
    organization: {
      name: 'German Code Zero AI',
      description: 'Premium B2B Services für Revenue- und Service-Orchestrierung',
      url: BASE_URL,
      logo: `${BASE_URL}/logo/gcz-logo-black-gold.svg`,
      sameAs: [
        'https://linkedin.com/company/germancodezeroai',
        'https://x.com/germancodezeroai'
      ]
    },
    hero: {
      headline: 'Mehr Umsatz. Weniger Reibung.',
      subheadline: 'Orchestrieren Sie Revenue- und Service-Prozesse Ende‑zu‑Ende – mit Premium-Erlebnis, konsistenten Journeys und planbarem Wachstum.',
      bullets: [
        'Schnellere Zyklen: von Anfrage bis Abschluss in Rekordzeit',
        'Konsistente Qualität: jeder Touchpoint sitzt',
        'Skalierbares Wachstum: mehr Pipeline, weniger Operatives'
      ],
      ctaText: 'Jetzt konfigurieren',
      ctaAriaLabel: 'Zum Konfigurator wechseln',
      benefitsAriaLabel: 'Hauptvorteile'
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
      name: 'German Code Zero AI',
      description: 'Premium B2B Services for Revenue and Service Orchestration',
      url: BASE_URL,
      logo: `${BASE_URL}/logo/gcz-logo-black-gold.svg`,
      sameAs: [
        'https://linkedin.com/company/germancodezeroai',
        'https://x.com/germancodezeroai'
      ]
    },
    hero: {
      headline: 'More revenue. Less friction.',
      subheadline: 'Orchestrate your revenue and service processes end‑to‑end—with premium experience, consistent journeys, and predictable growth.',
      bullets: [
        'Faster cycles: request to close in record time',
        'Consistent quality: every touchpoint on point',
        'Scalable growth: more pipeline, less busywork'
      ],
      ctaText: 'Configure now',
      ctaAriaLabel: 'Go to configurator',
      benefitsAriaLabel: 'Key benefits'
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
  const servicesData = SERVICES_DATA[locale];
  const localeCode = locale === 'de' ? 'de-DE' : 'en-US';
  
  const baseSchema: any = {
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
        },
        makesOffer: servicesData.services.map(service => ({
          '@type': 'Offer',
          name: service.name,
          description: service.description,
          category: service.category,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: content.organization.name
          }
        }))
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
  
  // Add FAQ schema for home and pricing pages
  if (page === 'home' || page === 'pricing') {
    baseSchema['@graph'].push({
      '@type': 'FAQPage',
      mainEntity: servicesData.faq.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    });
  }
  
  // Add page-specific schema
  const pageSchema: any = {
    '@type': 'WebPage',
    name: buildTitle(page, locale, options),
    description: buildMetaDescription(page, locale, options),
    url: `${content.organization.url}/${page === 'home' ? '' : page}`,
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
  
  // Add pricing page breadcrumbs
  if (page === 'pricing') {
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
          name: locale === 'de' ? 'Preise' : 'Pricing',
          item: `${content.organization.url}/pricing`
        }
      ]
    };
  }
  
  // Add product schema for category pages
  if (page === 'category' && options?.category) {
    const categoryService = servicesData.services.find(s => 
      s.category.toLowerCase() === options.category?.toLowerCase()
    );
    
    if (categoryService) {
      baseSchema['@graph'].push({
        '@type': 'Product',
        name: categoryService.name,
        description: categoryService.description,
        brand: {
          '@type': 'Brand',
          name: content.organization.name
        },
        category: categoryService.category,
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
  }
  
  // Add pricing offers for pricing page
  if (page === 'pricing') {
    servicesData.plans.forEach(plan => {
      baseSchema['@graph'].push({
        '@type': 'Product',
        name: plan.name,
        description: plan.description,
        brand: {
          '@type': 'Brand',
          name: content.organization.name
        },
        offers: {
          '@type': 'Offer',
          name: plan.name,
          priceCurrency: plan.priceCurrency,
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            billingIncrement: plan.billingCycle
          },
          seller: {
            '@type': 'Organization',
            name: content.organization.name
          }
        }
      });
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
 * Get hero content for localization
 */
export function getHeroContent(locale: Locale) {
  return CONTENT[locale].hero;
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