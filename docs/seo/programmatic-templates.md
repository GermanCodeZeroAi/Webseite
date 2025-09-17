## Programmatic Templates — Industry Pages (DE/EN)

Patterns for generating SEO-safe industry pages. Use placeholders and apply normalization rules consistently. Keep all content public-safe; avoid any internal identifiers.

### Placeholders
- **{brand}**: Site or product brand name
- **{industry}**: Target industry name (e.g., "Cybersecurity", "E-Commerce")
- **{service}**: Optional service or solution keyword (e.g., "Audit", "Platform")
- **{city}**: Optional locality (city)
- **{region}**: Optional region/state
- **{country}**: Optional country
- **{year}**: Optional current year (e.g., 2025)

### Slug Schema
- **Normalization**: lowercase; trim; collapse whitespace; replace spaces and slashes with hyphens; remove accents; keep a–z0–9 and hyphens; no leading/trailing hyphens.
- **Language prefix (optional)**: `/en/` for English, `/de/` for German. If your site uses a different i18n strategy, adapt accordingly.
- **Base path**: `/industries/`
- **Structures**:
  - EN: `/en/industries/{industry-slug}/{city-slug}/` (if city present) else `/en/industries/{industry-slug}/`
  - DE: `/de/branchen/{industry-slug}/{city-slug}/` (falls Stadt vorhanden) sonst `/de/branchen/{industry-slug}/`
- **Examples**:
  - EN: `/en/industries/cybersecurity/berlin/`
  - DE: `/de/branchen/lebensmittelhandel/muenchen/`

### Title Patterns
- **EN (city present)**: `{industry} Solutions in {city} | {brand}`
- **EN (no city)**: `{industry} Solutions | {brand}`
- **DE (Stadt vorhanden)**: `{industry}-Lösungen in {city} | {brand}`
- **DE (ohne Stadt)**: `{industry}-Lösungen | {brand}`
- **Notes**: Keep ≤ 60–65 chars when possible; capitalize nouns appropriately (DE: substantives; EN: title case optional).

### Meta Description Patterns
- **EN (city present)**: `Unlock {industry} {service?} results in {city}. Proven approach, secure by design, and fast time-to-value with {brand}. Learn more.`
- **EN (no city)**: `Unlock {industry} {service?} results. Proven approach, secure by design, and fast time-to-value with {brand}. Learn more.`
- **DE (Stadt vorhanden)**: `{industry} {service?} in {city} erfolgreich umsetzen. Bewährter Ansatz, sicher konzipiert und schneller Mehrwert mit {brand}. Mehr erfahren.`
- **DE (ohne Stadt)**: `{industry} {service?} erfolgreich umsetzen. Bewährter Ansatz, sicher konzipiert und schneller Mehrwert mit {brand}. Mehr erfahren.`
- **Notes**: Aim for 145–160 chars; avoid keyword stuffing; keep benefits-focused.

### Open Graph (OG) & Twitter Cards
- **OG Title**: Mirror the Title pattern for the selected locale.
- **OG Description**: Mirror the Meta Description; can be slightly longer (≤ 200 chars).
- **OG URL**: Canonical URL (see below).
- **OG Image**: Use a deterministic path with fallbacks:
  - `/og/industry/{industry-slug}-{city-slug}.png`
  - Fallback cityless: `/og/industry/{industry-slug}.png`
  - Global fallback: `/og/default.png`
- **Twitter Card**: `summary_large_image` with the same title/description as OG.

### Canonical & Hreflang
- **Canonical**:
  - EN: `https://{brand-domain}/en/industries/{industry-slug}/{city-slug?}`
  - DE: `https://{brand-domain}/de/branchen/{industry-slug}/{city-slug?}`
- **Hreflang**: Provide reciprocal EN/DE alternates. Example pairs:
  - `en`: `.../en/industries/{industry-slug}/{city-slug?}`
  - `de`: `.../de/branchen/{industry-slug}/{city-slug?}`

### Structured Data (Optional)
- **BreadcrumbList** reflecting the path segments.
- **Organization** with `{brand}` as `name` and website as `url`.
- Avoid adding internal IDs or non-public attributes.

### Rendering Rules
- If `{city}` is present, prefer city-first messaging in titles and descriptions.
- If `{service}` is provided, insert once after `{industry}` and avoid repeating.
- If `{year}` is provided, append softly at the end of the title or description, e.g., `| {year}` or `Updated {year}`; keep optional and unobtrusive.
- Ensure all placeholders are safely escaped and trimmed after substitution.

### Examples

#### Example 1 — EN with city
- **Inputs**: `{brand}=Acme`, `{industry}=Cybersecurity`, `{service}=Platform`, `{city}=Berlin`
- **Slug**: `/en/industries/cybersecurity/berlin/`
- **Title**: `Cybersecurity Platform Solutions in Berlin | Acme`
- **Meta Description**: `Unlock Cybersecurity Platform results in Berlin. Proven approach, secure by design, and fast time-to-value with Acme. Learn more.`
- **OG Image**: `/og/industry/cybersecurity-berlin.png`

#### Beispiel 2 — DE ohne Stadt
- **Eingaben**: `{brand}=Acme`, `{industry}=E‑Commerce`, `{service}=Audit`
- **Slug**: `/de/branchen/e-commerce/`
- **Titel**: `E‑Commerce-Audit-Lösungen | Acme`
- **Meta Description**: `E‑Commerce Audit erfolgreich umsetzen. Bewährter Ansatz, sicher konzipiert und schneller Mehrwert mit Acme. Mehr erfahren.`
- **OG Image**: `/og/industry/e-commerce.png`

### QA Checklist
- **Length**: Title ≤ 65 chars; Meta 145–160 chars.
- **Uniqueness**: Titles and metas unique per page.
- **Clarity**: No internal codes; user-facing benefits.
- **i18n**: Correct locale path and copy.
- **Links**: Canonical and hreflang set; OG/Twitter complete.

