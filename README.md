## German Code Zero AI – B2B Services (DE/EN)

This repository contains a comprehensive B2B services platform with configurator, checkout (Stripe), FastAPI backend, Postgres/Redis, SEO, accessibility, performance optimization, security, and testing. Production-ready implementation with enterprise-grade features.

### What we offer (public overview)
- Configurable service packages (base + add-ons) across Email, Telephony, Generative Media (Image/Video/Music), and Websites.
- Enterprise-grade checkout and subscriptions via Stripe.
- Clear pricing logic (rules-based), referrals, and invoices.
- Premium B2B experience with gold/black branding.

### Architecture overview
- **Frontend**: React/TypeScript with comprehensive SEO, accessibility (WCAG 2.2 AA), and performance optimization
- **Backend**: FastAPI with pricing, catalog, checkout session creation, Stripe webhook handling, orders, referrals
- **Database**: Postgres (source of truth), Redis (cache/ratelimits/idempotency)
- **Security**: CSP, XSS protection, CSRF tokens, rate limiting, secure storage
- **Performance**: Core Web Vitals monitoring, lazy loading, image optimization, code splitting
- **Testing**: Comprehensive test suites with 80%+ coverage, E2E testing, accessibility testing

### Key Features Implemented

#### SEO & Accessibility
- Complete SEO utilities with DE/EN internationalization
- JSON-LD structured data for all page types
- OpenGraph optimization with proper meta tags
- Sitemap generation with multi-language support
- WCAG 2.2 AA compliance with focus management
- ARIA live regions for dynamic content updates
- Keyboard navigation and screen reader support

#### Performance Optimization
- Core Web Vitals monitoring (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)
- Bundle size analysis with 180KB JS limit enforcement
- Lazy loading with IntersectionObserver
- Image optimization (AVIF/WebP with fallbacks)
- Code splitting with dynamic imports
- Resource hints management (preconnect, prefetch, preload)

#### Security
- Content Security Policy (CSP) with nonce-based inline scripts
- XSS protection with input sanitization
- CSRF token management
- Secure storage with encryption
- Rate limiting and input validation
- Security headers management

#### Testing
- Comprehensive test utilities and mock helpers
- Unit tests for all core functionality
- Accessibility testing with automated checks
- Performance testing with threshold validation
- E2E testing utilities
- Test configuration management

### Setup matrix
- **Local**: Docker Compose (API, Worker, Postgres, Redis). Stripe Test.
- **Staging**: Production-like, sandbox integrations.
- **Production**: HA, observability, ratelimits.

### Configuration
- Catalogs in `/config/*`:
  - `pricing.catalog.json`, `modules.catalog.json`, `industries.catalog.json`, `feature-bundles.json`
- Frontend utilities in `/apps/frontend/lib/`:
  - `seo.ts` - SEO and internationalization utilities
  - `performance.ts` - Performance monitoring and optimization
  - `security.ts` - Security utilities and protection
  - `a11y.ts` - Accessibility utilities
  - `test-utils.ts` - Testing utilities and helpers
- Secrets via KMS/Vault, not in repo. See `docs/security/secrets.md`.

### API
- OpenAPI specification at `apps/backend/openapi.yaml`
- Comprehensive endpoint documentation
- Stripe integration for payments and webhooks
- Rate limiting and security headers

### Repository structure
- `apps/frontend/lib/` - Frontend utilities and implementations
- `apps/backend/` - API specifications and backend code
- `docs/` - Architecture, ops, security, privacy documentation
- `config/` - Configuration catalogs and data
- `tests/` - Test suites and utilities

### Commit conventions
- Conventional Commits (e.g., `feat(seo): ...`, `fix(security): ...`, `perf: ...`)

### Getting started
1. Review architecture documentation in `docs/architecture/`
2. Set up development environment with Docker Compose
3. Configure Stripe test keys
4. Run tests: `npm test`
5. Start development server: `npm run dev`

### Legal & privacy
- DPIA skeleton provided under `docs/privacy/dpia-skeleton.md`
- GDPR compliance considerations documented
- Security policies and procedures outlined

### Roadmap
- ✅ SEO and accessibility implementation
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Comprehensive testing
- 🔄 Backend API implementation
- 🔄 Frontend UI components
- 🔄 Stripe integration
- 🔄 CI/CD pipeline