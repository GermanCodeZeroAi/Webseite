/**
 * Sitemap Generator for German Code Zero AI
 * 
 * Generates XML sitemaps for search engines including:
 * - Static pages
 * - Dynamic category pages
 * - Industry solution pages
 * - Multi-language support (DE/EN)
 */

import { buildSitemapData } from './seo';
import fs from 'fs';
import path from 'path';

// Load catalog data
const modulesCatalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/modules.catalog.json'), 'utf8'));
const industriesCatalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/industries.catalog.json'), 'utf8'));

const BASE_URL = 'https://germancodezero.ai';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

/**
 * Generate sitemap entries for all pages
 */
export function generateSitemapEntries(): SitemapEntry[] {
  const now = new Date().toISOString().split('T')[0];
  const entries: SitemapEntry[] = [];

  // Static pages (DE)
  entries.push(
    { url: BASE_URL, lastmod: now, changefreq: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastmod: now, changefreq: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/solutions`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/industries`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastmod: now, changefreq: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.7 }
  );

  // Static pages (EN)
  entries.push(
    { url: `${BASE_URL}/en`, lastmod: now, changefreq: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en/shop`, lastmod: now, changefreq: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/en/solutions`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/en/industries`, lastmod: now, changefreq: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/en/pricing`, lastmod: now, changefreq: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/en/about`, lastmod: now, changefreq: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/en/contact`, lastmod: now, changefreq: 'monthly', priority: 0.7 }
  );

  // Category pages (DE)
  modulesCatalog.categories.forEach((category: string) => {
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    entries.push({
      url: `${BASE_URL}/shop/${categorySlug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8,
      images: [
        {
          loc: `${BASE_URL}/images/categories/${categorySlug}-hero.jpg`,
          title: `Premium ${category} Services`,
          caption: `${category} in Markenqualität – schneller, konsistenter, messbar.`
        }
      ]
    });
  });

  // Category pages (EN)
  modulesCatalog.categories.forEach((category: string) => {
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    entries.push({
      url: `${BASE_URL}/en/shop/${categorySlug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8,
      images: [
        {
          loc: `${BASE_URL}/images/categories/${categorySlug}-hero.jpg`,
          title: `Premium ${category} Services`,
          caption: `On-brand ${category} — faster, consistent, measurable.`
        }
      ]
    });
  });

  // Industry pages (DE)
  industriesCatalog.industries.forEach((industry: any) => {
    const industrySlug = industry.code;
    entries.push({
      url: `${BASE_URL}/industries/${industrySlug}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.7,
      images: [
        {
          loc: `${BASE_URL}/images/industries/${industrySlug}-hero.jpg`,
          title: `Branchenlösungen – ${industry.name}`,
          caption: `Vorkonfigurierte Playbooks für ${industry.name}. Planbare Ergebnisse, klare SLAs.`
        }
      ]
    });
  });

  // Industry pages (EN)
  industriesCatalog.industries.forEach((industry: any) => {
    const industrySlug = industry.code;
    entries.push({
      url: `${BASE_URL}/en/industries/${industrySlug}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.7,
      images: [
        {
          loc: `${BASE_URL}/images/industries/${industrySlug}-hero.jpg`,
          title: `Industry Solutions – ${industry.name}`,
          caption: `Preconfigured playbooks for ${industry.name}. Predictable outcomes, clear SLAs.`
        }
      ]
    });
  });

  // Solutions pages (DE) - Dynamic industry solution pages
  industriesCatalog.industries.forEach((industry: any) => {
    const industrySlug = industry.code;
    entries.push({
      url: `${BASE_URL}/solutions/${industrySlug}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.8,
      images: [
        {
          loc: `${BASE_URL}/images/solutions/${industrySlug}-hero.jpg`,
          title: `Branchenlösungen – ${industry.name}`,
          caption: `Vorkonfigurierte Playbooks für ${industry.name}. Planbare Ergebnisse, klare SLAs.`
        }
      ]
    });
  });

  // Solutions pages (EN) - Dynamic industry solution pages
  industriesCatalog.industries.forEach((industry: any) => {
    const industrySlug = industry.code;
    entries.push({
      url: `${BASE_URL}/en/solutions/${industrySlug}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.8,
      images: [
        {
          loc: `${BASE_URL}/images/solutions/${industrySlug}-hero.jpg`,
          title: `Industry Solutions – ${industry.name}`,
          caption: `Preconfigured playbooks for ${industry.name}. Predictable outcomes, clear SLAs.`
        }
      ]
    });
  });

  return entries;
}

/**
 * Generate XML sitemap
 */
export function generateSitemapXML(): string {
  const entries = generateSitemapEntries();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    
    if (entry.images) {
      entry.images.forEach(image => {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${image.loc}</image:loc>\n`;
        if (image.title) {
          xml += `      <image:title>${image.title}</image:title>\n`;
        }
        if (image.caption) {
          xml += `      <image:caption>${image.caption}</image:caption>\n`;
        }
        xml += '    </image:image>\n';
      });
    }
    
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-images.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /shop/
Allow: /solutions/
Allow: /industries/
Allow: /pricing/
Allow: /about/
Allow: /contact/

# Crawl delay for respectful crawling
Crawl-delay: 1`;
}

/**
 * Generate hreflang sitemap for internationalization
 */
export function generateHreflangSitemap(): string {
  const entries = generateSitemapEntries();
  const baseEntries = entries.filter(entry => !entry.url.includes('/en/'));
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  baseEntries.forEach(entry => {
    const enUrl = entry.url.replace(BASE_URL, `${BASE_URL}/en`);
    
    xml += '  <url>\n';
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '    <xhtml:link rel="alternate" hreflang="de" href="' + entry.url + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="en" href="' + enUrl + '"/>\n';
    xml += '    <xhtml:link rel="alternate" hreflang="x-default" href="' + entry.url + '"/>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}