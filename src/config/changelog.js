export const APP_VERSION = "1.1.0";

export const CHANGELOG = [
  {
    version: "1.1.0",
    date: "2026-02-17",
    title: "Admin & Auth System Update",
    changes: [
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