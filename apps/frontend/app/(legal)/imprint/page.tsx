// @ts-nocheck
import React from 'react'

export default function Page() {
  return (
    <main>
      <h1>Impressum</h1>

      <h2>Dienstanbieter</h2>
      <p>
        Unternehmen: [Bitte ergänzen]<br />
        Anschrift: [Bitte ergänzen]<br />
        Vertretungsberechtigte Person: [Bitte ergänzen]
      </p>

      <h2>Kontakt</h2>
      <p>
        E‑Mail: [Bitte ergänzen]<br />
        Telefon: [Bitte ergänzen]
      </p>

      <h2>Register und USt‑IdNr.</h2>
      <p>
        Handelsregister: [Bitte ergänzen]<br />
        Registernummer: [Bitte ergänzen]<br />
        USt‑IdNr.: [Bitte ergänzen]
      </p>

      <h2>Berufsrechtliche Angaben</h2>
      <p>
        Soweit einschlägig. Bitte berufsrechtliche Regelungen und Kammerzugehörigkeit
        ergänzen.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Wir erstellen Inhalte mit Sorgfalt. Für Richtigkeit, Vollständigkeit und
        Aktualität können wir keine Gewähr übernehmen. Verpflichtungen zur
        Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen
        bleiben unberührt.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Für Inhalte externer Seiten, auf die wir verlinken, sind ausschließlich
        deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine
        Rechtsverstöße erkennbar.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Inhalte und Werke auf dieser Website unterliegen dem Urheberrecht. Jede
        Verwendung bedarf der vorherigen Zustimmung, soweit nicht gesetzliche
        Schranken eingreifen.
      </p>

      <p>Stand: {new Date().toISOString().slice(0, 10)}</p>
    </main>
  )
}

