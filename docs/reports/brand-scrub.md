## Brand‑Scrub Report (Public Website)

Scope: `/apps/frontend/**` (nur gerenderte Seiten/Komponenten). Verzeichnis `/config/i18n/**` nicht vorhanden.

| datei | zeile | auszug-kurz | empfehlung (ersatztext oder löschen) |
|---|---:|---|---|
| apps/frontend/lib/security.ts | 86-89 | connect-src … https://api.stripe.com … https://api.germancodezero.ai … | Keine Änderung – CSP Meta (technisch erforderlich, nicht marketingrelevant) |
| apps/frontend/lib/security.ts | 287 | headers.set('X-CSRF-Token', …) | Keine Änderung – Sicherheits‑Header (nicht sichtbar) |
| apps/frontend/lib/security.ts | 310 | fetch('/api/csrf-token', …) | Keine Änderung – internes Endpoint (nicht sichtbar) |
| apps/frontend/lib/performance.ts | 682 | preconnect('https://api.stripe.com') | Keine Änderung – Performance‑Hint (nur <link> im <head>) |
| apps/frontend/lib/sitemap.ts | 186 | Disallow: /api/ | Beibehalten; optional später umbenennen in »/backend/« (falls Route‑Refactor geplant) |

Keine Funde für: OpenAI, OpenAPI, Llama, Mistral, Qwen, Whisper, vLLM, Ollama, Stable Diffusion, SDXL, ControlNet, DirectML, CUDA, ROCm, ComfyUI, RVC, Coqui, Hugging Face, Model/Modell, Embedding.

