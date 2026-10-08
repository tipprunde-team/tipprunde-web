# Styleguide Tipprunde

<!-- KI-Log #4 – Styleguide, abgeleitet aus den Design-Mockups „Tipprunde“ -->

Verbindliche Gestaltungsgrundlage für alle Seiten von `tippseite-web`. Umsetzung in `public/css/style.css`, alle Komponenten zum Prüfen in `public/html/dev/StyleTest.html`.

**Grundsätze:** dunkles Navy, oranger Akzent, mobile first. Kein Bootstrap, keine Bibliotheken außer Google Fonts. Texte für Nutzer auf Deutsch, Klassen und Bezeichner auf Englisch.

## 1 Farben

| Variable | Wert | Verwendung |
|---|---|---|
| `--color-bg` | `#13213C` | Seitenhintergrund, Eingabefelder |
| `--color-surface` | `#23325B` | Karten, Meldungen, Ladehinweis |
| `--color-accent` | `#F26B35` | Primär-Buttons, Links, aktiver Tab, Fokus |
| `--color-text` | `#FFFFFF` | Fließtext, Überschriften |
| `--color-text-muted` | `#A9B4CC` | Labels, Hinweise, Footer, inaktive Navigation |
| `--color-border` | `#3D485D` | Rahmen, Trennlinien |
| `--color-success` | `#8FB57A` | Erfolgsmeldungen, Badge „Getippt“ |
| `--color-danger` | `#E5484D` | Fehlermeldungen, ungültige Eingaben |
| `--color-warning` | `#F2C14E` | Badge „Offen“, Warnungen |

Farben nie direkt als Hex-Wert in Seiten verwenden, immer über `var(--color-…)`.

## 2 Schriften

| Rolle | Schrift | Stil |
|---|---|---|
| Überschriften, Buttons, Tabs | Barlow Condensed (Google Fonts) | fett (700), kondensiert, VERSALIEN |
| Fließtext, Labels, Formulare | Inter (Google Fonts), Fallback System-Font | normal 400, Labels 600 |

Schriftgrößen (mobil → ab 768 px): H1 2 → 2,75 rem, H2 1,5 → 2 rem, H3 1,25 → 1,5 rem, Text 1 rem, klein 0,875 rem.

## 3 Abstände, Radius, Schatten

- **Abstände** im 4er-Raster: `--space-1` 4 px, `--space-2` 8 px, `--space-3` 12 px, `--space-4` 16 px, `--space-5` 24 px, `--space-6` 32 px, `--space-7` 48 px.
- **Radius:** `--radius-sm` 4 px, `--radius-md` 8 px (Buttons, Eingaben, Meldungen), `--radius-lg` 12 px (Karten), `--radius-pill` (Badges, Ladehinweis).
- **Schatten:** `--shadow-card` für Karten, `--shadow-focus` als oranger Fokusring.

## 4 Layout

- `.container`: max. 1100 px breit, zentriert, Innenabstand 16 px (mobil) bzw. 32 px (ab 768 px).
- `.site-header` in `<header id="site-header">`: Logo links, Navigation rechts, bleibt oben stehen.
- `.site-footer` in `<footer id="site-footer">`: Copyright und Links zu Impressum/Datenschutz.
- Breakpoint: **eine** Media Query `@media (min-width: 768px)`. Alles darunter ist die Handy-Ansicht.

## 5 Komponenten

### Buttons
- `.btn` + `.btn-primary`: Hauptaktion pro Ansicht (orange), z. B. „Einloggen“, „Tipp speichern“.
- `.btn` + `.btn-secondary`: Nebenaktionen (nur Rahmen), z. B. „Abbrechen“.
- `.btn-block`: volle Breite, für Formulare auf dem Handy.
- Mindesthöhe 44 px (Touch-Ziel). Deaktiviert per `disabled` → halbe Deckkraft.

### Karten
- `.card`: Fläche `--color-surface`, Rahmen, Radius 12 px. Für Spiele, Formulare und Gruppen.

### Formulare
```html
<div class="form-group">
    <label class="label" for="email">E-Mail</label>
    <input class="input" type="email" id="email">
    <span class="form-error">Bitte eine gültige E-Mail eingeben.</span>
</div>
```
- Ungültige Felder bekommen zusätzlich `.is-invalid` (roter Rahmen).
- `.form-hint` für Hinweise, `.form-error` für Fehler direkt am Feld.
- `.input-score`: schmales Zahlenfeld für Tipps (0–20).

### Meldungen
- `.alert.alert-error` und `.alert.alert-success`, farbiger Rand links.
- Leere `.alert`-Boxen werden automatisch ausgeblendet; `api.js` füllt sie über `showError()` / `showSuccess()`.
- Login-Fehler immer mit derselben Meldung: „E-Mail oder Passwort ist falsch.“

### Badges
- `.badge` neutral, `.badge-success` („Getippt“), `.badge-warning` („Offen“), `.badge-locked` („Gesperrt“, nach Anstoß).

### Tabs
- Container `.tabs`, Einträge `.tab`, aktiver Eintrag zusätzlich `.tab-active` (orange Unterstreichung). Auf dem Handy horizontal scrollbar.

### Ladehinweis
- `<div id="loading-indicator">Lädt …</div>` ist standardmäßig versteckt.
- Einblenden über die Klasse `.is-visible` (empfohlen) oder jQuery `.show()` / `.hide()`.

## 6 Logo

`public/img/logo.svg`: oranges Ball-Icon mit Schriftzug TIPPRUNDE in Weiß, für dunklen Hintergrund. Im Header 32 px hoch.

## 7 Barrierefreiheit

- Jedes Eingabefeld hat ein `<label>` mit `for`.
- Fokus ist immer sichtbar (oranger Ring), nie `outline: none` ohne Ersatz.
- Status nicht nur über Farbe zeigen: Badges und Meldungen haben immer Text.
