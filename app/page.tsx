import React from 'react';
import Hero3D from '../components/Hero3D';
import { getPageSeo, type Locale } from '../apps/frontend/lib/seo';

export default function HomePage() {
  const locale: Locale = 'de';
  const seoData = getPageSeo('home', locale);

  const handleCtaClick = () => {
    // Navigate to shop configurator
    window.location.href = '/shop/configurator';
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(seoData.jsonLd),
        }}
      />

      {/* Main Content */}
      <Hero3D 
        locale={locale}
        onCtaClick={handleCtaClick}
      />
    </>
  );
}