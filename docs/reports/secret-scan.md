### Potential secret locations (report only)

Generated: 2025-09-17

This report lists possible secret locations found by pattern scanning. Values are intentionally omitted.

Findings (path:line — type):
- apps/frontend/lib/__tests__/security.test.ts:200 — Token literal in test code
- apps/frontend/lib/__tests__/security.test.ts:211 — Token literal in test code
- apps/frontend/lib/__tests__/security.test.ts:226 — Token key/value in test request body
- apps/frontend/lib/__tests__/security.test.ts:500 — CSRF token literal in test code
- docs/security/secrets.md:34 — Database URL with username:password pattern (documentation example)

Notes:
- No PEM/SSH private keys, AWS keys, GitHub or Stripe/Twilio/SendGrid tokens were detected by the patterns used.

Recommended actions:
- Rotate any affected credentials and tokens as a precaution.
- Clean git history if real secrets were ever committed:
  - Prefer `git filter-repo` (modern) or use `BFG Repo-Cleaner` to remove or replace secrets across history.
- Add pre-commit secret scanning (e.g., gitleaks/trufflehog) and enforce protected branches.

# Secret Scan Report

Scan date: 2025-09-17T18:41:46Z (UTC)

Findings (path:line) — types only, values omitted:

- docs/security/secrets.md:34 | DATABASE_URL var
- apps/frontend/lib/__tests__/security.test.ts:192 | Token reference (test)
- apps/frontend/lib/__tests__/security.test.ts:200 | Token reference (test)
- apps/frontend/lib/__tests__/security.test.ts:211 | Token reference (test)
- apps/frontend/lib/__tests__/security.test.ts:226 | Token reference (test)
- apps/frontend/lib/__tests__/security.test.ts:245 | Token reference (test)
- apps/frontend/lib/__tests__/security.test.ts:500 | Token reference (test)
- apps/frontend/lib/security.ts:247 | Token reference (code)
- apps/frontend/lib/security.ts:259 | Token reference (code)
- apps/frontend/lib/security.ts:269 | Token reference (code)
- apps/frontend/lib/security.ts:317 | Token reference (code)
- apps/frontend/lib/security.ts:329 | Token reference (code)
- apps/frontend/lib/__tests__/security.test.ts:307 | Generic secret reference (test)
- apps/frontend/lib/security.ts:574 | Generic password reference (code)

Recommendations:
- Rotate any exposed credentials immediately.
- Purge secrets from Git history. Use one of:
  - BFG Repo-Cleaner: replace-with or delete large blobs and secrets.
    Example (replace text with placeholder):
    bfg --replace-text replacements.txt
  - git filter-repo: more flexible, scriptable history rewrite.
    Example (remove file containing secrets):
    git filter-repo --path sensitive.file --invert-paths
- After history rewrite:
  - Force-push protected branches appropriately.
  - Invalidate caches/mirrors and notify collaborators.
- Add secret scanning to CI (e.g., gitleaks, trufflehog, GitHub secret scanning).
- Use env vars or a secret manager (AWS Secrets Manager, GCP Secret Manager, Vault).
