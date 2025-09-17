// @ts-nocheck
import React from 'react'

export default function Page() {
  return (
    <main>
      <h1>Datenschutz</h1>

      <p>
        Diese Informationen erläutern, wie wir personenbezogene Daten im
        geschäftlichen Kontext verarbeiten. Sie richten sich an
        Geschäftskundinnen und Geschäftskunden (B2B) in einfacher,
        verständlicher Sprache.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich ist der Betreiber dieser Website und der angebotenen
        Dienste (siehe <a href="/imprint">Impressum</a>).
      </p>

      <h2>Zwecke der Verarbeitung</h2>
      <ul>
        <li>Bereitstellung der Website und ihrer Funktionen</li>
        <li>Kommunikation auf Anfrage und Angebotserstellung (B2B)</li>
        <li>Vertragsanbahnung, -durchführung und Kundenbetreuung</li>
        <li>Abrechnung, Zahlungsabwicklung und Buchhaltung</li>
        <li>Sicherheit, Missbrauchsvermeidung und Fehleranalyse</li>
        <li>Rechtsdurchsetzung, Compliance und Archivierung</li>
      </ul>

      <h2>Rechtsgrundlagen</h2>
      <ul>
        <li>Art. 6 Abs. 1 lit. b DSGVO (Vertrag/Anbahnung)</li>
        <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen)</li>
        <li>Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtungen)</li>
      </ul>

      <h2>Zahlungen</h2>
      <p>
        Für Kartenzahlungen nutzen wir den Zahlungsdienst Stripe. Stripe
        verarbeitet Zahlungsdaten in eigener Verantwortlichkeit zur
        Durchführung der Zahlung. Es gelten die Datenschutzhinweise von Stripe.
        Wir erhalten nur die für Abrechnung und Zuordnung erforderlichen
        Informationen (z.&nbsp;B. Betrag, Zeitstempel, Status).
      </p>

      <h2>Empfängerkategorien</h2>
      <ul>
        <li>IT‑Dienstleister für Hosting, Betrieb und Support</li>
        <li>Zahlungsdienst (Stripe) für Zahlungsabwicklung</li>
        <li>Beratung, Steuerberatung und Rechtsberatung</li>
        <li>Behörden, soweit gesetzlich erforderlich</li>
      </ul>

      <h2>Speicherdauer</h2>
      <ul>
        <li>Vertrags‑ und Abrechnungsdaten: bis zu 10&nbsp;Jahre</li>
        <li>Kommunikationsdaten: bis zu 3&nbsp;Jahre nach letztem Kontakt</li>
        <li>Protokoll‑ und Sicherheitsdaten: bis zu 90&nbsp;Tage</li>
      </ul>

      <h2>Betroffenenrechte</h2>
      <ul>
        <li>Auskunft, Berichtigung und Löschung</li>
        <li>Einschränkung der Verarbeitung und Datenübertragbarkeit</li>
        <li>Widerspruch gegen Verarbeitung auf Grundlage berechtigter Interessen</li>
        <li>Beschwerde bei einer Datenschutzaufsichtsbehörde</li>
      </ul>

      <h2>Internationale Datenübermittlungen</h2>
      <p>
        Sofern Daten außerhalb der EU/EWR verarbeitet werden, stellen wir
        geeignete Garantien sicher (z.&nbsp;B. EU‑Standardvertragsklauseln) und
        achten auf ein angemessenes Schutzniveau.
      </p>

      <h2>Kontakt</h2>
      <p>
        Für Anfragen zum Datenschutz nutzen Sie bitte die im
        <a href="/imprint">Impressum</a> angegebenen Kontaktmöglichkeiten.
      </p>

      <p>Stand: {new Date().toISOString().slice(0, 10)}</p>
    </main>
  )
}

