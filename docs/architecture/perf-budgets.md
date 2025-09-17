# Performance-Budgets

Dieses Dokument konkretisiert harte Budgets und Messpunkte. Budgets wirken als CI‑Gate (Fail on Increase) und werden in Dashboards überwacht.

## Frontend: Bundles & Assets
- JavaScript initial (Critical Path): ≤ 180 KB Brotli pro kritischer Route
  - Vendor: ≤ 90 KB; App‑Code: ≤ 60 KB; Runtime: ≤ 30 KB
  - Long‑Tasks Budget (TBT): ≤ 200 ms im Lab auf Referenzgerät
- JavaScript nachgeladen (Eager below‑the‑fold): ≤ 80 KB innerhalb 5 s
- CSS initial: ≤ 70 KB Brotli; Critical CSS inline ≤ 14 KB
- Bilder Above‑the‑Fold: ≤ 200 KB Summe; Einzelbild ≤ 120 KB (AVIF/WebP bevorzugt)
- Webfonts: max. 2 Familien × 2 Schnitte; ≤ 60 KB pro Subset (latin)
- Third‑Party: ≤ 1 Drittanbieter synchron; alle weiteren async/defer; Gesamt JS von 3P ≤ 60 KB

### Route-Level Budgets (Beispiele)
- Home/Landing: JS ≤ 150 KB, Images ≤ 160 KB, TTI ≤ 3.5 s (lab), LCP ≤ 2.5 s (RUM p75)
- Produktdetail: JS ≤ 180 KB, Images ≤ 220 KB (hero + 1 thumb), API ≤ 2 Calls
- Dashboard (auth): JS ≤ 220 KB initial, nachgeladen ≤ 120 KB in 10 s, WebSocket optional

### Lighthouse `budget.json` (Beispiel)
```json
[
  {
    "path": "/",
    "resourceSizes": [
      { "resourceType": "script", "budget": 180 },
      { "resourceType": "stylesheet", "budget": 70 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "font", "budget": 120 }
    ],
    "timings": [
      { "metric": "interactive", "budget": 3500 },
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "total-blocking-time", "budget": 200 }
    ]
  }
]
```

## 3D / Realtime Budgets (WebGL/WebGPU)
- Geometrie: ≤ 2 Mio. Dreiecke gleichzeitig sichtbar
- Draw Calls: ≤ 2.000 pro Frame; Instancing/Batches bevorzugt
- Frame‑Budget: 16.67 ms (60 FPS)
  - GPU ≤ 8–10 ms
  - Main Thread ≤ 4 ms
  - Worker/Render Thread ≤ 6 ms
- Texturen: Gesamt ≤ 512 MB VRAM; Kompression ASTC/BC/ETC, Mips Pflicht
- Shader: keine dynamischen Schleifen abhängig von Fragment‑Daten; Branches minimieren
- Streaming/LOD: LOD Stufen ≥ 3; Entladen außerhalb Frustum; Asset‑Chunk ≤ 2 MB

## Backend: Latenz‑ und Payload‑Budgets
- API End‑to‑End (Serverzeit): p95 ≤ 300 ms, p99 ≤ 800 ms
- HTML/SSR TTFB: p75 ≤ 200 ms über CDN/Edge
- Payloads
  - JSON Response: ≤ 100 KB p95 (Hot Paths), ≤ 500 KB absolut
  - HTML initial: ≤ 100 KB Brotli (ohne Inline‑Bilder)
  - GraphQL: Antwortgröße ≤ 150 KB p95; Query‑Komplexität budgetiert (≤ 1000 Punkte)
- Requests pro Interaktion: ≤ 3 (Hot Path), Waterfall vermeiden (Batching)
- Datenbank: ≤ 3 Queries/Request; jede Query p95 ≤ 50 ms; Indexpflicht
- Externe Dienste: Circuit Breaker, Timeouts p95 + 2×StdAbw., Fallbacks

## CI/CD & Monitoring
- CI Gate: Lighthouse CI mit `budget.json`, Bundle‑Analyzer (fail on regression)
- RUM: CWV (LCP, INP, CLS) p75, Segmentierung nach Land/Netztyp/Gerät
- Traces: Budget‑Attribute an Spans (db.count, ext.calls, payload.bytes)
- Alarme: bei Budgetüberschreitung > 10% über 15 min, oder Trendverschlechterung > 20% w/w

## Durchsetzung & Governance
- Architektur‑Review bei Budgeterhöhung; temporäre Ausnahmen ≤ 30 Tage mit Plan zur Rückführung
- Jede Route/Feature besitzt Owner für Budgets, dokumentiert in diesem Ordner