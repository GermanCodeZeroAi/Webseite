### Go-Live-Checkliste (Definition of Done)

- [ ] Zero-Leak: Prüfanweisung: Prüfe, dass keine personenbezogenen oder geheimen Daten in Logs, URLs, Crash-Reports, Persistenz oder Dritttools auftauchen (Stichproben + Scans).
- [ ] Legal/Consent: Prüfanweisung: Öffne im Inkognito-Modus und verifiziere Impressum/Datenschutz, CMP holt Consent ein und Tracking feuert erst nach Zustimmung.
- [ ] 3× Stripe-Testkauf + Webhook=1 Order: Prüfanweisung: Führe drei Stripe-Testkäufe mit verschiedenen Testkarten durch und bestätige, dass je Zahlung exakt eine Order via Webhook angelegt wird.
- [ ] CI grün + Coverage ≥80%: Prüfanweisung: Starte die CI-Pipeline und bestätige grüne Jobs sowie Gesamt-Testabdeckung ≥ 80% im Report.
- [ ] Lighthouse Mobile ≥90: Prüfanweisung: Messe im Mobile-Modus mit Throttling und stelle sicher, dass der Performance-Score ≥ 90 liegt.
- [ ] Sitemaps in GSC/Bing: Prüfanweisung: Reiche `sitemap.xml` in GSC und Bing Webmaster ein und prüfe erfolgreichen Abruf ohne Fehler.
- [ ] Deploy FE/BE: Prüfanweisung: Deploye Frontend und Backend in Produktion und verifiziere per Health-Checks und Smoke-Tests die Live-Version.
- [ ] Sentry+Uptime aktiv: Prüfanweisung: Erzeuge Testfehler/Timeout und bestätige, dass Sentry Events erfasst und Uptime-Monitoring Alarme sendet.
- [ ] CSP enforce + Ratelimits aktiv: Prüfanweisung: Prüfe, dass die CSP nicht im Report-Only-Modus ist und Rate-Limits wiederholte Anfragen mit 429 blocken.
- [ ] 3 Branchen-Seiten live + Backup-Restore getestet: Prüfanweisung: Bestätige drei Branchen-Landingpages öffentlich und führe Backup-Export sowie erfolgreichen Restore in Staging durch.
