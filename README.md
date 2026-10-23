# tipprunde-web

Frontend der Tipprunde (Fußball-Tippseite), eine Multi-Page-Anwendung aus statischem HTML, CSS und jQuery 3.6.0. Das Backend liegt im Repo `tipprunde-rest`.

## Live-Version

| Was | Adresse |
|---|---|
| Frontend (GitHub Pages) | https://tipprunde-team.github.io/tipprunde-web/ |
| Backend-API (Heroku) | https://tipprunde-rest-b06734b76aad.herokuapp.com/api |
| Backend-Status | https://tipprunde-rest-b06734b76aad.herokuapp.com/actuator/health |

Das Backend läuft auf einem Eco-Dyno und schläft nach 30 Minuten ohne Aufruf ein. Der erste Aufruf danach dauert einige Sekunden.

## Seitenübersicht

| Seite | Datei | Zweck |
|---|---|---|
| Startseite | `public/Homepage.html` | Einstieg mit Ablauf und Punkteschema |
| Anmelden | `public/html/auth/Logon.html` | Login mit E-Mail und Passwort |
| Registrieren | `public/html/auth/Register.html` | Neues Konto anlegen |
| Abgemeldet | `public/html/auth/Logoff.html` | Bestätigung nach dem Abmelden |
| Tippgruppen | `public/html/groups/Groups.html` | Eigene Tippgruppen mit Mitgliederzahl, Platz und Punkten |
| Gruppe erstellen | `public/html/groups/CreateGroup.html` | Neue Tippgruppe anlegen, danach Einladungslink kopieren |
| Gruppe beitreten | `public/html/groups/JoinGroup.html` | Vorschau per Einladungscode, Beitritt mit Anmeldung |
| Gruppe | `public/html/groups/GroupInfo.html` | Mitgliederliste, Einladungslink nur für den Admin |
| Spieltag | `public/html/matchday/Matchday.html` | Spiele einer Gruppe ansehen und tippen (`?groupId=…`) |
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
    group-nav.js           Tabs Spieltag, Rangliste, Gruppe auf den Gruppenseiten
    pages/                 ein Skript pro Seite (logon.js, register.js, ...)
  html/                    alle Seiten außer der Startseite
```

Jede Seite lädt die Skripte in dieser Reihenfolge: jQuery, `api.js`, `auth.js`, `layout.js`, `auth-nav.js`, auf Gruppenseiten zusätzlich `group-nav.js`, danach das Skript der Seite. Am `<body>` stehen `data-root` (Weg zurück zum Ordner `public/`) und `data-nav` (aktiver Menüpunkt). Neue Seiten entstehen aus der Vorlage `public/html/_template.html`.

## Lokal starten (Windows)

Voraussetzung: Das Backend läuft auf `http://localhost:8080`, siehe README von `tipprunde-rest`.

**Mit VS Code:** Erweiterung „Live Server“ installieren, den Ordner `tipprunde-web` öffnen, Rechtsklick auf eine Seite, „Open with Live Server“. Der Server läuft auf Port 5500.

**Mit jwebserver (JDK 18 oder neuer):** Im Ordner `tipprunde-web` im Terminal
```
jwebserver -p 5500
```
starten und `http://127.0.0.1:5500` im Browser öffnen.

Lokal lässt das Backend nur Anfragen von `http://localhost:5500` und `http://127.0.0.1:5500` zu, live zusätzlich von `https://tipprunde-team.github.io`. Läuft das Frontend auf einem anderen Port oder einer anderen Adresse, blockiert der Browser die Anfragen (CORS).

## API-URL

Die Adresse des Backends steht nur in `public/js/api.js`. Dort wird `API_BASE_URL` automatisch gewählt: Auf `localhost` und `127.0.0.1` nutzt das Frontend `http://localhost:8080/api`, überall sonst das Live-Backend auf Heroku. Welche Umgebung aktiv ist, steht beim Laden jeder Seite in der Browser-Konsole (`[api] Environment: local` bzw. `live`).

## Deployment

- **Frontend:** GitHub Pages veröffentlicht den Stand von `main` (Wurzelordner) automatisch nach jedem Merge. Nach 1 bis 2 Minuten ist die Änderung live.
- **Backend:** Heroku deployt `tipprunde-rest` automatisch von `main`, aber nur, wenn die CI grün ist („Wait for GitHub checks to pass before deploy“).

Weil jeder Merge auf `main` direkt live geht, wird nur über Pull Requests mit Review gemergt.

## Anmeldung

Nach dem Login speichert `auth.js` Token, Ablaufzeit, Benutzer-ID und Benutzername im `sessionStorage` des Tabs. Die Sitzung endet, wenn der Tab geschlossen wird. Geschützte Seiten rufen `requireLogin()` auf und leiten ohne Sitzung zum Login weiter. Nach der Anmeldung geht es zur ursprünglichen Seite zurück, auch nach einer Registrierung über einen Einladungslink. Ein Konto zum Ausprobieren legst du über `Register.html` an.

## Arbeitsweise

- Eigener Branch pro Aufgabe, Änderungen nur über Pull Requests mit Review durch eine zweite Person.
- Commit-Messages auf Deutsch im Format `feat(bereich): kurze Beschreibung`.
- Keine Zugangsdaten im Repo.
- Testkonten und Testgruppen mit dem Präfix „TEST Vorname“, weil lokal und live dieselbe Datenbank genutzt wird.