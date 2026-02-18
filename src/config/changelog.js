export const APP_VERSION = "1.2.3";

export const CHANGELOG = [
  {
    version: "1.2.3",
    date: "2026-02-18",
    title: "Performance Boost & Image Optimization",
    changes: [
      { type: "improvement", text: "Serverseitige Bildoptimierung: Neue Bilder werden automatisch komprimiert und ins WebP-Format konvertiert." },
      { type: "improvement", text: "Caching: Browser-Caching für Bilder auf 1 Jahr erhöht, um Ladezeiten bei wiederholten Besuchen drastisch zu verkürzen." },
      { type: "improvement", text: "Upload-System: Automatische Skalierung auf maximal 1200px Breite/Höhe." }
    ]
  },
  {
    version: "1.2.2",
    date: "2026-02-18",
    title: "Owner Rolle & Security Update",
    changes: [
      { type: "feature", text: "Neue Rolle 'Owner' eingeführt (Super-Moderator mit Benutzerverwaltung)." },
      { type: "security", text: "Rechte-Management: Owner dürfen User/Moderatoren verwalten, aber keine Admins bearbeiten." },
      { type: "improvement", text: "Admin Panel: Zugriff für Owner freigeschaltet (System-Backups & Rechtstexte bleiben Admin-only)." },
      { type: "improvement", text: "User-Profil: Performance-Optimierung durch Pagination und Bugfixes." },
      { type: "improvement", text: "Meine Sammlung: Pagination und Lazy Loading implementiert." }
    ]
  },
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