## German Code Zero AI – B2B Services (DE/EN)

This repository contains planning/specs for a B2B services website with a configurator (base + add-ons), checkout (Stripe), FastAPI backend, Postgres/Redis, SEO, consent, tests, and CI/CD. No internal secrets or implementation details are included here.

### What we offer (public overview)
- Configurable service packages (base + add-ons) across Email, Telephony, Generative Media (Image/Video/Music), and Websites.
- Enterprise-grade checkout and subscriptions via Stripe.
- Clear pricing logic (rules-based), referrals, and invoices.

### Architecture overview
- Web Frontend (DE/EN) with configurator and SEO.
- FastAPI backend with pricing, catalog, checkout session creation, Stripe webhook handling, orders, referrals.
- Postgres (source of truth), Redis (cache/ratelimits/idempotency).
- See `docs/architecture/*` for C4 (context/container/component) and NFRs.

### Setup matrix (planning-only)
- Local: Docker Compose (API, Worker, Postgres, Redis). Stripe Test.
- Staging: Production-like, sandbox integrations.
- Production: HA, observability, ratelimits.

### Configuration (placeholders only)
- Catalogs in `/config/*` (no prices unless explicitly released):
  - `pricing.catalog.json`, `modules.catalog.json`, `industries.catalog.json`, `feature-bundles.json`
- Secrets via KMS/Vault, not in repo. See `docs/security/secrets.md`.

### API (draft)
- OpenAPI draft at `apps/backend/openapi.yaml` (subject to change).

### Repository conventions
- Monorepo layout:
  - `apps/backend`: API specs, later backend code
  - `docs/*`: architecture, ops, security, privacy
  - `config/*`: catalogs for configurator
- SemVer and CHANGELOG maintained.

### Commit conventions
- Conventional Commits (e.g., `docs(arch): ...`, `feat(api): ...`, `fix: ...`).

### Getting started (planning)
1. Review C4 and NFRs.
2. Finalize catalogs and pricing rules with stakeholders (no confidential data).
3. Implement backend endpoints following OpenAPI.
4. Integrate Stripe and webhook verification.
5. Add tests, CI/CD, and observability.

### Legal & privacy
- DPIA skeleton provided under `docs/privacy/dpia-skeleton.md`. No legal advice.

### Roadmap
- Implement pricing and catalog services.
- Build configurator UI.
- Connect checkout and webhook processing.