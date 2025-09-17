/**
 * SPEC STUB ONLY (no executable code)
 *
 * Intent: Centralize SEO primitives for the frontend (titles, meta, OG, schema.org).
 * Style: Premium B2B, gold/black. No internal implementation details; outcomes only.
 * i18n: DE/EN via /config/i18n (to be wired later).
 * Refer-a-Friend: Include optional mention ("bald verfügbar" / "coming soon").
 *
 * Interfaces to implement later:
 * - buildTitle(page: "home"|"shop"|"industries"|"pricing"|"about"|"contact", locale: "de"|"en"): string
 * - buildMetaDescription(page, locale): string
 * - buildOpenGraph(page, locale): { title: string; description: string; image: string; type: "website"|"product"; locale: string }
 * - buildSchema(page, locale): JSON-LD object per schema.org minimal set
 *
 * Schema.org minimal set (guideline):
 * - Organization: name, url, logo, sameAs
 * - WebSite: name, url, potentialAction (SearchAction optional)
 * - WebPage: name, description, inLanguage
 * - Product (for modules): name, description, brand, offers (priceCurrency, price, availability)
 *
 * OG Guidelines:
 * - Title ≤60 chars, Description 90–110 chars
 * - Image 1200x630, gold/black, high contrast, logo top-left, claim right
 */

// No runtime code in this file by request.

/*
SEO Spec Stub (No Code)

Purpose:
- Define the contract for SEO utilities used by the frontend.

Exports to implement later:
- getPageSeo(params): returns { title, description, og } based on route and i18n
- getCategorySeo(category, locale): templates for category pages
- getIndustrySeo(industry, locale): templates for industry pages
- getPricingSeo(locale): pricing page SEO
- getContactSeo(locale): contact page SEO
- buildOg(locale, opts): returns { title, description, image, type }

i18n Sources:
- Copy to live in /config/i18n (DE/EN)

OpenGraph Defaults:
- image: /og/default-black-gold.png (1200x630)
- type: website | product | article
- twitter: summary_large_image

Notes:
- No internal system details; only public‑facing content
- Include "Refer‑a‑Friend (coming soon)" note where relevant
*/