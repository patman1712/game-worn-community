# Changelog

## [1.2.1] - 2026-02-18

### 🌍 Internationalisierung (i18n)
- **Komplette Übersetzung:** Alle fehlenden Komponenten sind nun zweisprachig (DE/EN).
  - `NewMessageDialog`: Neue Nachrichten Popup.
  - `MyPurchases`: "Meine Käufe" Seite inkl. Statusmeldungen.
  - `Settings`: Profil, Passwort, Gefahrenzone und alle Labels.
  - `GenericProductForm`: Formular für Nicht-Trikots (Schläger, Helme etc.).
- **Sprachdateien:** `de.json` repariert und erweitert.

### 🧹 Refactoring & Cleanup
- **Base44 Entfernung:**
  - Alle `@base44` Dependencies entfernt.
  - `apiClient` umbenannt und von Base44-Altlasten bereinigt.
  - Externe Logo-URL durch lokales Asset (`/logo.png`) ersetzt.
  - Projekt ist nun vollständig eigenständig.

### ✨ Features & Verbesserungen
- **Meine Sammlung:**
  - Nutzt nun die detaillierte `JerseyCard` Ansicht (mit Badges, Likes, Stats).
  - Besitzer können Trikots direkt in der Übersicht bearbeiten und löschen.
  - Likes werden korrekt angezeigt.
- **Startseite (Home):**
  - **Sortierung:** "Neueste zuerst" ist nun robuster Standard.
  - **Neu:** Sortierung "Älteste zuerst" hinzugefügt.
  - **Optimiert:** "Team A-Z" Sortierung funktioniert nun auch für Objekte ohne explizites Team-Feld (Fallback auf Titel).
  - **UX:** Sortier-Dropdown ist nun immer sichtbar (auch bei "Alle Sportarten").
  - **Daten:** Trikots und sonstige Objekte werden korrekt chronologisch gemischt.
- **Formulare:**
  - Fix für Liga-Auswahl: Manuelle Eingabe (z.B. "DEL 2") wird nicht mehr automatisch durch ähnliche Optionen (z.B. "DEL") überschrieben.

### 🐛 Bugfixes
- Fehlerhafte Sortierung bei gemischten Listen (Trikots + Items) behoben.
- Anzeige-Probleme in "Meine Sammlung" behoben.
