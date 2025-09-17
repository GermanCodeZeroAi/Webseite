# Nichtfunktionale Anforderungen (NFR)

## Zweck und Geltungsbereich
Dieses Dokument definiert nichtfunktionale Anforderungen für Web‑Frontend, 3D‑Rendering und Backend. Messung erfolgt primär über Real User Monitoring (RUM) im 75. Perzentil (p75) für CWV sowie p95/p99 für Backend-Latenzen. Zielgeräte: moderne Mobile- und Desktop-Browser auf 4G/Wi‑Fi, mittlere Hardware.

## Core Web Vitals (RUM, p75)
- LCP < 2.5 s
- INP < 200 ms
- CLS < 0.1
- Ergänzende Laborziele: TBT < 200 ms, FCP < 1.8 s, TTI < 3.5 s (auf Referenzgerät)

## Frontend Budgets
- JavaScript initial: ≤ 180 KB (Brotli), nur kritische Routen; Rest per Code‑Splitting/Defer
- CSS initial: ≤ 70 KB (Brotli); kritische CSS inline ≤ 14 KB
- Bilder Above‑the‑Fold: ≤ 200 KB Summe (responsive, AVIF/WebP, lazy)
- Webfonts: ≤ 2 Familien, ≤ 60 KB pro Subset (latin), `font-display: swap`

## 3D/Realtime (WebGL/WebGPU)
- Ziel‑FPS: 60 (Frame‑Budget 16.67 ms); Backup: 30 FPS nur bei degradierter Qualität
- Geometrie: ≤ 2 Mio. Dreiecke gleichzeitig sichtbar (LOD, Frustum/Occlusion Culling)
- Draw Calls: ≤ 2.000 pro Frame (Instancing, Batching)
- GPU‑Zeit: ≤ 8–10 ms; Main Thread: ≤ 4 ms; Render Worker/Thread: ≤ 6 ms
- Texturen: komprimiert (ASTC/BC/ETC), Gesamt VRAM ≤ 512 MB; Mipmapping, Anisotropy ≤ 8x
- Materialien/Shader: ≤ 256 Materialien; Shader‑Komplexität moderat (keine teuren Schleifen/Verzweigungen pro Fragment)
- Animation/Skinning: ≤ 120 Bones aktiv; Keyframes komprimiert; GPU‑Skinning bevorzugt

## Backend Latenzbudgets (Server‑seitig)
Ziele gelten für erfolgreiche Antworten (2xx) ohne Client‑Netzwerkzeit.

| Kategorie | p50 | p95 | p99 | Hinweise |
|---|---:|---:|---:|---|
| CDN Edge TTFB | ≤ 50 ms | ≤ 120 ms | ≤ 200 ms | Aggressive Caching, Early Hints (103) |
| Static HTML (SSR/ISR) | ≤ 80 ms | ≤ 180 ms | ≤ 350 ms | Edge‑Rendering bevorzugt |
| API Gateway/GraphQL | ≤ 80 ms | ≤ 300 ms | ≤ 800 ms | Batching, Caching, Dataloader |
| Auth/Token Ops | ≤ 60 ms | ≤ 150 ms | ≤ 300 ms | KMS/HSM Latenzen einkalkulieren |
| Cache Hit (KV/Memcached) | ≤ 1 ms | ≤ 3 ms | ≤ 5 ms | Hit‑Rate ≥ 95% (Hot Paths ≥ 99%) |
| DB Query (einzeln) | ≤ 10 ms | ≤ 50 ms | ≤ 120 ms | Indexe, nur notwendige Spalten |
| Externe Dienste | ≤ 120 ms | ≤ 350 ms | ≤ 800 ms | Circuit Breaker, Budgets hart limitieren |

Richtwerte pro Request: ≤ 3 DB‑Abfragen, ≤ 1 externe Abhängigkeit im Hot Path, End‑to‑End Serverzeit p95 ≤ 300 ms für user‑sichtbare Aktionen.

## Ratelimits & Fair‑Use
Serverseitig durchzusetzen (pro IP und pro Identität/API‑Key), mit Safe‑Lists für interne Jobs.

- Öffentliche Lese‑APIs: 60 req/min/IP, 10 req/s Burst; 600 req/min/API‑Key
- Auth‑sensitive Endpunkte (Login/OTP): 5 req/min/IP; CAPTCHA/Proof‑of‑Work ab Anomalien
- Mutationen/Schreiben: 30 req/min/API‑Key; gleichzeitige Schreibvorgänge ≤ 3
- GraphQL: Komplexitätsbudget ≤ 1000 Punkte pro Anfrage; Tiefe ≤ 10
- Uploads: 20/min, Einzelgröße ≤ 25 MB, Tagesvolumen ≤ 2 GB/API‑Key
- WebSocket: 1 Connect/min/IP, max. 2 parallele Sessions/User, 30 msgs/s Soft‑Limit

## SLO/SLA Skizzen
- Verfügbarkeit (monatl.): Core APIs 99.9%, CDN 99.95%, Auth 99.95%
- Latenz SLO (monatl.): API p95 < 300 ms, p99 < 800 ms; HTML TTFB p75 < 200 ms
- Fehlerquote: 5xx < 0.1%, 4xx exkl. Validierungsfehler < 0.5%
- CWV SLO (RUM): LCP p75 < 2.5 s, INP p75 < 200 ms, CLS p75 < 0.1
- Error Budget: 0.1% pro Monat; Alerting bei ≥ 50% Budgetverbrauch
- SLA (Enterprise, indikativ): 99.9%/Monat, Gutschriften bei Nichteinhaltung (z. B. 10–25%)

## Messung & Durchsetzung
- RUM: CrUX + eigene Beacons (CWV, Navigation/INP Events, CLS Sources)
- Synthetic: Lighthouse CI, WebPageTest, K6/Locust, Synthetics für P95/P99 Guardrails
- CI‑Gates: Bundle‑Budgets, CWV‑Laborziele, API‑Latency‑Regressionen; Block bei Überschreitung
- Observability: Tracing (W3C Trace Context), RED/USE‑Metriken, strukturierte Logs, SLO‑Dashboards
- Release‑Guardrails: progressive Rollouts, Feature Flags, automatische Rollbacks bei SLO‑Verstößen

## Ausnahmen & Governance
- Temporäre Ausnahmen maximal 30 Tage, mit Ticket, Owner, Plan zur Rückführung
- Jedes Team besitzt seine Service‑SLOs und Budgets; Änderungen via Arch‑Review