# Datenmodell-Spezifikation (ERD, textuell)

Hinweis: Spezifikation ohne Implementierung. Schlüssel/Indizes benannt, Beziehungen definiert. Keine Secrets.

## Tabellen

### User
- id (PK, UUID)
- email (uniq, citext)
- password_hash (nullable wenn SSO),
- name
- locale (default 'de')
- company_id (FK → Company.id, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

Indizes: (email uniq), (company_id)

### Company
- id (PK, UUID)
- name (uniq)
- vat_id (nullable, uniq)
- billing_email
- created_at, updated_at

Indizes: (name uniq), (vat_id uniq)

### Plan
- id (PK, UUID)
- code (uniq)
- name
- description
- billing_cycles_allowed (array: ['monthly','semiannual','annual','biennial'])
- is_active (bool)
- created_at, updated_at

Indizes: (code uniq), (is_active)

### Module
- id (PK, UUID)
- code (uniq)
- category (enum: Email, Telefonie, Bild, Video, Musik, Webseiten)
- name
- description
- is_active (bool)
- created_at, updated_at

Indizes: (code uniq), (category), (is_active)

### AddOn
- id (PK, UUID)
- code (uniq)
- module_id (FK → Module.id, nullable wenn global)
- name
- description
- is_active (bool)
- created_at, updated_at

Indizes: (code uniq), (module_id), (is_active)

### Coupon
- id (PK, UUID)
- code (uniq)
- type (enum: percent, fixed_amount)
- value (numeric)
- applies_to_plan_id (FK → Plan.id, nullable)
- max_redemptions (int, nullable)
- valid_from, valid_until (timestamptz, nullable)
- created_at, updated_at

Indizes: (code uniq), (valid_until), (applies_to_plan_id)

### Order
- id (PK, UUID)
- user_id (FK → User.id)
- company_id (FK → Company.id)
- plan_id (FK → Plan.id)
- status (enum: pending, paid, failed, canceled)
- billing_cycle (enum: monthly, semiannual, annual, biennial)
- currency (char(3))
- total_amount (numeric(12,2))
- coupon_id (FK → Coupon.id, nullable)
- stripe_checkout_session_id (uniq, nullable)
- created_at, updated_at

Indizes: (user_id), (company_id), (plan_id), (status), (stripe_checkout_session_id uniq)

### OrderLineItem
- id (PK, UUID)
- order_id (FK → Order.id)
- item_type (enum: plan, module, addon)
- reference_id (UUID) – zeigt auf Plan/Module/AddOn id
- quantity (int)
- unit_amount (numeric(12,2)) – kopiert zur Zeit der Bestellung
- created_at, updated_at

Indizes: (order_id), (item_type, reference_id)

### Invoice
- id (PK, UUID)
- order_id (FK → Order.id)
- company_id (FK → Company.id)
- stripe_invoice_id (uniq)
- amount_due (numeric(12,2))
- amount_paid (numeric(12,2))
- currency (char(3))
- status (enum: draft, open, paid, uncollectible, void)
- issued_at (timestamptz)
- created_at, updated_at

Indizes: (order_id), (company_id), (stripe_invoice_id uniq), (status)

### Subscription
- id (PK, UUID)
- company_id (FK → Company.id)
- plan_id (FK → Plan.id)
- stripe_subscription_id (uniq)
- status (enum: active, past_due, canceled, incomplete, trialing)
- current_period_start, current_period_end (timestamptz)
- cancel_at (timestamptz, nullable)
- created_at, updated_at

Indizes: (company_id), (plan_id), (stripe_subscription_id uniq), (status)

### WebhookEvent
- id (PK, UUID)
- provider (enum: stripe)
- event_type (text)
- event_id (uniq) – providerseitige ID
- received_at (timestamptz)
- payload_digest (sha256)
- processed (bool default false)
- created_at

Indizes: (event_id uniq), (processed), (received_at)

### Referral
- id (PK, UUID)
- code (uniq)
- referrer_user_id (FK → User.id)
- referred_company_id (FK → Company.id, nullable bis Conversion)
- status (enum: created, converted, rejected)
- reward_status (enum: pending, granted, denied)
- created_at, updated_at

Indizes: (code uniq), (referrer_user_id), (status), (reward_status)

## Beziehungen (Kurz)
- Company 1—N User
- Company 1—N Order
- Order 1—N OrderLineItem
- Company 1—N Invoice
- Company 1—N Subscription
- Plan 1—N Subscription
- Plan 1—N Order
- Module 1—N AddOn (optional)
- Coupon 1—N Order
- User 1—N Referral

## Notwendige Constraints/Business-Regeln
- `OrderLineItem.reference_id` muss zu `item_type` passen (FK-ähnliche Validierung in Anwendung oder polymorphe FK-Regel).
- `Coupon.valid_until` >= `valid_from` (wenn beide gesetzt).
- Idempotency: `stripe_checkout_session_id` und `WebhookEvent.event_id` sind einzigartig.

## Empfohlene Indizes (zusätzlich)
- Partieller Index: `WebhookEvent(processed=false)` für schnelle Abholung.
- Zeitbasierte Indizes für Archivierung/Reporting (`created_at`).