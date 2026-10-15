# tipprunde-web

Frontend der Tipprunde (Fußball-Tippseite), eine Multi-Page-Anwendung aus statischem HTML, CSS und jQuery 3.6.0. Das Backend liegt im Repo `tipprunde-rest`.

## Seitenübersicht

| Seite | Datei | Zweck |
|---|---|---|
| Startseite | `public/Homepage.html` | Einstieg mit Ablauf und Punkteschema |
| Anmelden | `public/html/auth/Logon.html` | Login mit E-Mail und Passwort |
| Registrieren | `public/html/auth/Register.html` | Neues Konto anlegen |
| Abgemeldet | `public/html/auth/Logoff.html` | Bestätigung nach dem Abmelden |
| Tippgruppen | `public/html/groups/Groups.html` | Geschützte Seite, nur mit Anmeldung |
| Spieltag | `public/html/matchday/Matchday.html` | Spieltagsseite mit Beispieldaten |
| Impressum, Datenschutz | `public/html/legal/` | Rechtliche Seiten |
| Entwicklung | `public/html/dev/ApiTest.html`, `StyleTest.html` | Ping-Test fürs Backend und Test der Styles |

`index.html` im Hauptordner leitet auf `public/Homepage.html` weiter.

## Aufbau

```
public/
  css/style.css            gemeinsame Styles
  img/                     Bilder und Logo
  js/
    api.js                 Zugriff auf das Backend (apiRequest, showError, showSuccess)
    auth.js                Sitzung im Browser (sessionStorage)
    layout.js              gemeinsamer Header und Footer
    auth-nav.js            Benutzername und Abmelden im Header
    pages/                 ein Skript pro Seite (logon.js, register.js, ...)
  html/                    alle Seiten außer der Startseite
```

Jede Seite lädt die Skripte in dieser Reihenfolge: jQuery, `api.js`, `auth.js`, `layout.js`, `auth-nav.js`, danach das Skript der Seite. Am `<body>` stehen `data-root` (Weg zurück zum Ordner `public/`) und `data-nav` (aktiver Menüpunkt). Neue Seiten entstehen aus der Vorlage `public/html/_template.html`.

## Lokal starten (Windows)

Voraussetzung: Das Backend läuft auf `http://localhost:8080`, siehe README von `tipprunde-rest`.

**Mit VS Code:** Erweiterung „Live Server“ installieren, den Ordner `tipprunde-web` öffnen, Rechtsklick auf eine Seite, „Open with Live Server“. Der Server läuft auf Port 5500.

**Mit jwebserver (JDK 18 oder neuer):** Im Ordner `tipprunde-web` im Terminal
```
jwebserver -p 5500
```
starten und `http://127.0.0.1:5500` im Browser öffnen.

Das Backend lässt nur Anfragen von `http://localhost:5500` und `http://127.0.0.1:5500` zu. Läuft das Frontend auf einem anderen Port, blockiert der Browser die Anfragen (CORS).

## API-URL einstellen

Die Adresse des Backends steht nur an einer Stelle: in `public/js/api.js` in der Konstante `API_BASE_URL` (Standard `http://localhost:8080/api`). Für ein anderes Backend wird nur diese Zeile geändert.

## Anmeldung

Nach dem Login speichert `auth.js` Token, Ablaufzeit, Benutzer-ID und Benutzername im `sessionStorage` des Tabs. Die Sitzung endet, wenn der Tab geschlossen wird. Geschützte Seiten rufen `requireLogin()` auf und leiten ohne Sitzung zum Login weiter. Nach der Anmeldung geht es zur ursprünglichen Seite zurück. Ein Konto zum Ausprobieren legst du über `Register.html` an.

## Arbeitsweise

- Eigener Branch pro Aufgabe, Änderungen nur über Pull Requests mit Review durch eine zweite Person.
- Commit-Messages auf Deutsch im Format `feat(bereich): kurze Beschreibung`.
- Keine Zugangsdaten im Repo.