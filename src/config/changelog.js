export const APP_VERSION = "1.2.1";

export const CHANGELOG = [
  {
    version: "1.2.1",
    date: "2026-02-18",
    title: "Performance, Sortierung & Cleanup",
    changes: [
      { type: "improvement", text: "Komplette Übersetzung aller Bereiche (inkl. Settings, Nachrichten)." },
      { type: "improvement", text: "Startseite: Performance-Optimierung durch Pagination (25 Items pro Seite) und Lazy Loading der Bilder." },
      { type: "feature", text: "Startseite: Neue Sortierung 'Älteste zuerst' und verbesserte 'Team A-Z' Sortierung." },
      { type: "bugfix", text: "Sortierung von Trikots und anderen Objekten korrigiert (werden nun korrekt gemischt)." },
      { type: "improvement", text: "Formulare: Liga-Eingabe verbessert (kein automatisches Überschreiben bei manueller Eingabe)." },
      { type: "improvement", text: "Meine Sammlung: Detaillierte Ansicht mit Bearbeiten/Löschen Funktionen." },
      { type: "improvement", text: "System Cleanup: Entfernung alter Abhängigkeiten und Optimierung der API." }
    ]
  },
  {
    version: "1.2.0",
    date: "2026-02-18",
    title: "Internationalization (i18n) Update",
    changes: [
      { type: "feature", text: "Plattform ist jetzt mehrsprachig (Deutsch & Englisch)." },
      { type: "feature", text: "Sprache kann im Header oder in den Einstellungen geändert werden." },
      { type: "improvement", text: "Login-Seite und Hauptnavigation vollständig übersetzt." }
    ]
  },
  {
    version: "1.1.0",
    date: "2026-02-17",
    title: "Admin & Auth System Update",
    changes: [
      { type: "feature", text: "Cookie-Consent Banner (DSGVO konform) implementiert." },
      { type: "feature", text: "System Update Log: Changelog Seite und Versionsanzeige im Footer." },
      { type: "improvement", text: "Login-Seite: Logo vergrößert." },
      { type: "feature", text: "Passwort vergessen Funktion implementiert (Email Reset Link)." },
      { type: "feature", text: "Admin Panel: Anzeige der Anzahl wartender Freischaltungen im Header." },
      { type: "feature", text: "Admin Panel: Benutzer können jetzt abgelehnt werden." },
      { type: "feature", text: "Automatischer Email-Versand bei Freischaltung oder Ablehnung." },
      { type: "feature", text: "Integration der Resend API für zuverlässigen Email-Versand." },
      { type: "improvement", text: "Jersey Detailansicht: Vereinsname jetzt prominent in eigener Box." },
      { type: "bugfix", text: "Fehlermeldung beim Login für noch nicht freigeschaltete User verbessert." }
    ]
  },
  {
    version: "1.0.0",
    date: "2026-02-01",
    title: "Initial Release",
    changes: [
      { type: "feature", text: "Grundlegende Plattform-Funktionalität." },
      { type: "feature", text: "Benutzer-Registrierung und Login." },
      { type: "feature", text: "Trikot-Verwaltung (CRUD) und Sammlung." },
      { type: "feature", text: "Nachrichtensystem." }
    ]
  }
];