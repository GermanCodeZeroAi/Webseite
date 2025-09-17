import { readFileSync } from 'fs';
import { join } from 'path';

export interface Industry {
  code: string;
  name: string;
  recommended_modules: string[];
  notes: string;
}

export interface IndustryCatalog {
  version: string;
  industries: Industry[];
}

let catalogCache: IndustryCatalog | null = null;

export function getIndustriesCatalog(): IndustryCatalog {
  if (catalogCache) {
    return catalogCache;
  }

  try {
    const catalogPath = join(process.cwd(), '../../config/industries.catalog.json');
    const catalogContent = readFileSync(catalogPath, 'utf-8');
    catalogCache = JSON.parse(catalogContent);
    return catalogCache!;
  } catch (error) {
    console.error('Failed to load industries catalog:', error);
    // Fallback to empty catalog
    return {
      version: '0.1.0',
      industries: []
    };
  }
}

export function getIndustry(code: string): Industry | undefined {
  const catalog = getIndustriesCatalog();
  return catalog.industries.find(industry => industry.code === code);
}

export function getAllIndustries(): Industry[] {
  const catalog = getIndustriesCatalog();
  return catalog.industries;
}

export function getIndustryPaths(): { params: { industry: string } }[] {
  const industries = getAllIndustries();
  return industries.map(industry => ({
    params: {
      industry: industry.code
    }
  }));
}

// Helper function to get localized content
export function getIndustryContent(industry: Industry, locale: string = 'en') {
  const moduleMapping: Record<string, string> = {
    'email-routing': 'email',
    'voicebot': 'telephony',
    'web-content': 'websites',
    'image-gen': 'image',
    'video-synth': 'video',
    'music-loop': 'music'
  };

  return {
    name: industry.name,
    code: industry.code,
    notes: industry.notes,
    recommendedServices: industry.recommended_modules.map(module => 
      moduleMapping[module] || module
    )
  };
}