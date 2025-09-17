/**
 * SEO Utilities Test Suite
 * 
 * Comprehensive tests for SEO functionality including:
 * - Title and meta description generation
 * - OpenGraph data creation
 * - JSON-LD structured data
 * - Hreflang attributes
 * - Sitemap generation
 */

import {
  buildTitle,
  buildMetaDescription,
  buildOpenGraph,
  buildSchema,
  buildHreflang,
  getPageSeo,
  getCategorySeo,
  getIndustrySeo,
  buildSitemapData
} from '../seo';
import { TestDataGenerator, MockUtils, ComponentTestUtils } from '../test-utils';

describe('SEO Utilities', () => {
  beforeEach(() => {
    MockUtils.mockLocalStorage();
  });

  afterEach(() => {
    MockUtils.restoreAll();
  });

  describe('buildTitle', () => {
    it('should generate correct title for home page in German', () => {
      const title = buildTitle('home', 'de');
      expect(title).toBe('Autonomy Grid – Mehr Umsatz. Weniger Reibung. Premium B2B.');
    });

    it('should generate correct title for home page in English', () => {
      const title = buildTitle('home', 'en');
      expect(title).toBe('Autonomy Grid – More revenue. Less friction. Premium B2B.');
    });

    it('should generate correct title for category page', () => {
      const title = buildTitle('category', 'de', { category: 'Email' });
      expect(title).toBe('Email – Premium Email | German Code Zero AI');
    });

    it('should generate correct title for industry page', () => {
      const title = buildTitle('industry', 'en', { industry: 'Manufacturing' });
      expect(title).toBe('Branchenlösungen – Manufacturing | German Code Zero AI');
    });

    it('should fallback to organization name for unknown page', () => {
      const title = buildTitle('unknown' as any, 'de');
      expect(title).toBe('German Code Zero AI');
    });
  });

  describe('buildMetaDescription', () => {
    it('should generate correct meta description for home page in German', () => {
      const description = buildMetaDescription('home', 'de');
      expect(description).toContain('Orchestrieren Sie Revenue- und Service-Prozesse');
      expect(description).toContain('Refer‑a‑Friend (bald verfügbar)');
    });

    it('should generate correct meta description for home page in English', () => {
      const description = buildMetaDescription('home', 'en');
      expect(description).toContain('Orchestrate revenue and service processes');
      expect(description).toContain('Refer‑a‑Friend (coming soon)');
    });

    it('should generate correct meta description for category page', () => {
      const description = buildMetaDescription('category', 'de', { category: 'Email' });
      expect(description).toContain('Email in Markenqualität');
      expect(description).toContain('Jetzt konfigurieren');
    });

    it('should generate correct meta description for industry page', () => {
      const description = buildMetaDescription('industry', 'en', { industry: 'Manufacturing' });
      expect(description).toContain('Vorkonfigurierte Playbooks für Manufacturing');
    });
  });

  describe('buildOpenGraph', () => {
    it('should generate correct OpenGraph data for home page', () => {
      const og = buildOpenGraph('home', 'de');
      expect(og.title).toBe('Mehr Umsatz. Weniger Reibung.');
      expect(og.description).toContain('Premium B2B Services');
      expect(og.image).toBe('/og/default-black-gold.png');
      expect(og.type).toBe('website');
      expect(og.locale).toBe('de_DE');
    });

    it('should generate correct OpenGraph data for category page', () => {
      const og = buildOpenGraph('category', 'de', { category: 'Email' });
      expect(og.title).toBe('Premium Email');
      expect(og.description).toContain('Email in Markenqualität');
      expect(og.type).toBe('product');
    });

    it('should generate correct OpenGraph data for industry page', () => {
      const og = buildOpenGraph('industry', 'en', { industry: 'Manufacturing' });
      expect(og.title).toBe('Branchenlösungen – Manufacturing');
      expect(og.description).toContain('Vorkonfigurierte Playbooks für Manufacturing');
    });
  });

  describe('buildSchema', () => {
    it('should generate valid JSON-LD schema for home page', () => {
      const schema = buildSchema('home', 'de');
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@graph']).toBeDefined();
      expect(schema['@graph'].length).toBeGreaterThan(0);
      
      // Check Organization schema
      const organization = schema['@graph'].find((item: any) => item['@type'] === 'Organization');
      expect(organization).toBeDefined();
      expect(organization.name).toBe('German Code Zero AI');
      expect(organization.url).toBe('https://germancodezero.ai');
      expect(organization.logo).toBe('https://germancodezero.ai/logo/gcz-logo-black-gold.svg');
    });

    it('should generate valid JSON-LD schema for category page', () => {
      const schema = buildSchema('category', 'de', { category: 'Email' });
      
      // Check Product schema
      const product = schema['@graph'].find((item: any) => item['@type'] === 'Product');
      expect(product).toBeDefined();
      expect(product.name).toBe('Premium Email');
      expect(product.category).toBe('Email');
      expect(product.offers).toBeDefined();
      expect(product.offers.priceCurrency).toBe('EUR');
    });

    it('should generate breadcrumb schema for category page', () => {
      const schema = buildSchema('category', 'de', { category: 'Email' });
      
      const webPage = schema['@graph'].find((item: any) => item['@type'] === 'WebPage');
      expect(webPage.breadcrumb).toBeDefined();
      expect(webPage.breadcrumb['@type']).toBe('BreadcrumbList');
      expect(webPage.breadcrumb.itemListElement).toHaveLength(3);
    });

    it('should generate breadcrumb schema for industry page', () => {
      const schema = buildSchema('industry', 'en', { industry: 'Manufacturing' });
      
      const webPage = schema['@graph'].find((item: any) => item['@type'] === 'WebPage');
      expect(webPage.breadcrumb).toBeDefined();
      expect(webPage.breadcrumb['@type']).toBe('BreadcrumbList');
      expect(webPage.breadcrumb.itemListElement).toHaveLength(3);
    });
  });

  describe('buildHreflang', () => {
    it('should generate correct hreflang attributes for home page', () => {
      const hreflang = buildHreflang('home');
      
      expect(hreflang.de).toBe('https://germancodezero.ai');
      expect(hreflang.en).toBe('https://germancodezero.ai/en');
      expect(hreflang['x-default']).toBe('https://germancodezero.ai');
    });

    it('should generate correct hreflang attributes for category page', () => {
      const hreflang = buildHreflang('category', { category: 'Email' });
      
      expect(hreflang.de).toBe('https://germancodezero.ai/shop/Email');
      expect(hreflang.en).toBe('https://germancodezero.ai/en/shop/Email');
      expect(hreflang['x-default']).toBe('https://germancodezero.ai/shop/Email');
    });

    it('should generate correct hreflang attributes for industry page', () => {
      const hreflang = buildHreflang('industry', { industry: 'Manufacturing' });
      
      expect(hreflang.de).toBe('https://germancodezero.ai/industries/Manufacturing');
      expect(hreflang.en).toBe('https://germancodezero.ai/en/industries/Manufacturing');
      expect(hreflang['x-default']).toBe('https://germancodezero.ai/industries/Manufacturing');
    });
  });

  describe('getPageSeo', () => {
    it('should return complete SEO data for home page', () => {
      const seo = getPageSeo('home', 'de');
      
      expect(seo.title).toBeDefined();
      expect(seo.description).toBeDefined();
      expect(seo.og).toBeDefined();
      expect(seo.jsonLd).toBeDefined();
      expect(seo.canonical).toBe('https://germancodezero.ai');
      expect(seo.hreflang).toBeDefined();
    });

    it('should return complete SEO data for category page', () => {
      const seo = getPageSeo('category', 'de', { category: 'Email' });
      
      expect(seo.title).toContain('Email');
      expect(seo.description).toContain('Email in Markenqualität');
      expect(seo.canonical).toBe('https://germancodezero.ai/shop/Email');
    });

    it('should return complete SEO data for industry page', () => {
      const seo = getPageSeo('industry', 'en', { industry: 'Manufacturing' });
      
      expect(seo.title).toContain('Manufacturing');
      expect(seo.description).toContain('Manufacturing');
      expect(seo.canonical).toBe('https://germancodezero.ai/industries/Manufacturing');
    });
  });

  describe('getCategorySeo', () => {
    it('should return category-specific SEO data', () => {
      const seo = getCategorySeo('Email', 'de', ['email-routing', 'signature-extract']);
      
      expect(seo.category).toBe('Email');
      expect(seo.modules).toEqual(['email-routing', 'signature-extract']);
      expect(seo.title).toContain('Email');
      expect(seo.description).toContain('Email in Markenqualität');
    });
  });

  describe('getIndustrySeo', () => {
    it('should return industry-specific SEO data', () => {
      const seo = getIndustrySeo('Manufacturing', 'en', ['email-routing', 'voicebot']);
      
      expect(seo.industry).toBe('Manufacturing');
      expect(seo.recommendedModules).toEqual(['email-routing', 'voicebot']);
      expect(seo.title).toContain('Manufacturing');
      expect(seo.description).toContain('Manufacturing');
    });
  });

  describe('buildSitemapData', () => {
    it('should generate sitemap data with correct structure', () => {
      const sitemapData = buildSitemapData();
      
      expect(Array.isArray(sitemapData)).toBe(true);
      expect(sitemapData.length).toBeGreaterThan(0);
      
      const homePage = sitemapData.find(item => item.url === 'https://germancodezero.ai');
      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changefreq).toBe('weekly');
    });

    it('should include all main pages', () => {
      const sitemapData = buildSitemapData();
      const urls = sitemapData.map(item => item.url);
      
      expect(urls).toContain('https://germancodezero.ai');
      expect(urls).toContain('https://germancodezero.ai/shop');
      expect(urls).toContain('https://germancodezero.ai/industries');
      expect(urls).toContain('https://germancodezero.ai/pricing');
      expect(urls).toContain('https://germancodezero.ai/about');
      expect(urls).toContain('https://germancodezero.ai/contact');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined options gracefully', () => {
      const title = buildTitle('category', 'de', undefined);
      expect(title).toBe('German Code Zero AI');
    });

    it('should handle empty category name', () => {
      const title = buildTitle('category', 'de', { category: '' });
      expect(title).toBe('German Code Zero AI');
    });

    it('should handle special characters in category names', () => {
      const title = buildTitle('category', 'de', { category: 'E-Mail & Telefonie' });
      expect(title).toContain('E-Mail & Telefonie');
    });

    it('should handle very long category names', () => {
      const longCategory = 'Very Long Category Name That Might Cause Issues With Title Length';
      const title = buildTitle('category', 'de', { category: longCategory });
      expect(title).toContain(longCategory);
    });
  });

  describe('Internationalization', () => {
    it('should use correct locale codes in OpenGraph', () => {
      const ogDe = buildOpenGraph('home', 'de');
      const ogEn = buildOpenGraph('home', 'en');
      
      expect(ogDe.locale).toBe('de_DE');
      expect(ogEn.locale).toBe('en_US');
    });

    it('should use correct language codes in JSON-LD', () => {
      const schemaDe = buildSchema('home', 'de');
      const schemaEn = buildSchema('home', 'en');
      
      const webPageDe = schemaDe['@graph'].find((item: any) => item['@type'] === 'WebPage');
      const webPageEn = schemaEn['@graph'].find((item: any) => item['@type'] === 'WebPage');
      
      expect(webPageDe.inLanguage).toBe('de-DE');
      expect(webPageEn.inLanguage).toBe('en-US');
    });

    it('should maintain consistency between locales', () => {
      const seoDe = getPageSeo('home', 'de');
      const seoEn = getPageSeo('home', 'en');
      
      expect(seoDe.canonical).toBe('https://germancodezero.ai');
      expect(seoEn.canonical).toBe('https://germancodezero.ai');
      
      expect(seoDe.og.image).toBe(seoEn.og.image);
      expect(seoDe.og.type).toBe(seoEn.og.type);
    });
  });

  describe('Performance', () => {
    it('should generate SEO data quickly', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        getPageSeo('home', 'de');
        getPageSeo('category', 'en', { category: 'Email' });
        getPageSeo('industry', 'de', { industry: 'Manufacturing' });
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 300 operations in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should not cause memory leaks', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Generate many SEO objects
      for (let i = 0; i < 1000; i++) {
        getPageSeo('home', 'de');
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });
});