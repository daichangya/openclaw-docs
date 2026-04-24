---
read_when:
    - Den Agent-Browser über die lokale Control-API skripten oder debuggen
    - Nach der CLI-Referenz für `openclaw browser` suchen
    - Benutzerdefinierte Browserautomatisierung mit Snapshots und Refs hinzufügen
summary: OpenClaw-API für Browsersteuerung, CLI-Referenz und Skriptaktionen
title: Browsersteuerungs-API
x-i18n:
    generated_at: "2026-04-24T07:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Für Einrichtung, Konfiguration und Fehlerbehebung siehe [Browser](/de/tools/browser).
Diese Seite ist die Referenz für die lokale Control-HTTP-API, die CLI `openclaw browser`
und Skriptmuster (Snapshots, Refs, Waits, Debug-Abläufe).

## Control-API (optional)

Nur für lokale Integrationen stellt das Gateway eine kleine loopback-HTTP-API bereit:

- Status/Start/Stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/Screenshot: `GET /snapshot`, `POST /screenshot`
- Aktionen: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netzwerk: `POST /response/body`
- Zustand: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Zustand: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`.

Wenn Gateway-Auth mit gemeinsamem Secret konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API verarbeitet **keine** Trusted-Proxy- oder
  Tailscale-Serve-Identitäts-Header.
- Wenn `gateway.auth.mode` `none` oder `trusted-proxy` ist, übernehmen diese loopback-Browser-
  Routen diese identitätsführenden Modi nicht; halten Sie sie nur auf Loopback.

### Fehlervertrag von `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Fehler bei Richtlinien:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle Werte für `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Die Action-Payload hat die Normalisierung oder Validierung nicht bestanden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Action-Art verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder in einem Batch kollidiert mit dem Ziel der Anfrage.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Action wird für Profile mit bestehender Sitzung nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne Feld
`code` zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren Fehler 501 zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seiten-Screenshots für den verwalteten `openclaw`-Browser, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für Profile `existing-session` / Chrome MCP
- Refs-basierte Screenshots (`--ref`) für `existing-session` aus Snapshot-Ausgaben

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots / Role-Snapshots
- CSS-Selector-Element-Screenshots (`--element`)
- vollständiger PDF-Export des Browsers

Element-Screenshots lehnen außerdem `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, reparieren Sie
die Laufzeitabhängigkeiten des gebündelten Browser-Plugins, sodass `playwright-core` installiert ist,
und starten Sie dann das Gateway neu. Führen Sie bei paketierten Installationen `openclaw doctor --fix` aus.
Installieren Sie für Docker zusätzlich die Chromium-Browser-Binärdateien wie unten gezeigt.

#### Playwright-Installation in Docker

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (Konflikte mit npm-Overrides).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads zu persistieren, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder einen Bind-Mount persistiert wird. Siehe [Docker](/de/install/docker).

## Wie es funktioniert (intern)

Ein kleiner loopback-Control-Server akzeptiert HTTP-Anfragen und verbindet sich über CDP mit Chromium-basierten Browsern. Erweiterte Aktionen (click/type/snapshot/PDF) laufen über Playwright auf CDP; wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar. Der Agent sieht eine stabile Schnittstelle, während lokale/entfernte Browser und Profile darunter frei ausgetauscht werden.

## Kurze CLI-Referenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen, sowie `--json` für maschinenlesbare Ausgabe.

<AccordionGroup>

<Accordion title="Grundlagen: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # löscht auch Emulation auf attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # Kürzel für aktuellen Tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspektion: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # oder --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Aktionen: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # oder e12 für Role-Refs
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Zustand: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear zum Entfernen
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Hinweise:

- `upload` und `dialog` sind **arming**-Aufrufe; führen Sie sie vor dem click/press aus, das den Datei-Chooser/Dialog auslöst.
- `click`/`type`/etc. erfordern eine `ref` aus `snapshot` (numerisch `12` oder Role-Ref `e12`). CSS-Selectoren werden für Aktionen absichtlich nicht unterstützt.
- Pfade für Download, Trace und Upload sind auf temporäre OpenClaw-Roots beschränkt: `/tmp/openclaw{,/downloads,/uploads}` (Fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.

Snapshot-Flags auf einen Blick:

- `--format ai` (Standard mit Playwright): AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`).
- `--format aria`: Accessibility-Tree, keine Refs; nur zur Inspektion.
- `--efficient` (oder `--mode efficient`): kompaktes Preset für Role-Snapshots. Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um dies zum Standard zu machen (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` erzwingen einen Role-Snapshot mit Refs vom Typ `ref=e12`. `--frame "<iframe>"` begrenzt Role-Snapshots auf ein iframe.
- `--labels` fügt einen Screenshot nur des Viewports mit überlagerten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).

## Snapshots und Refs

OpenClaw unterstützt zwei Arten von „Snapshots“:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, der numerische Refs enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird die Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Role-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/Baumstruktur mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird die Ref über `getByRole(...)` (plus `nth()` bei Duplikaten) aufgelöst.
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit überlagerten `e12`-Labels einzuschließen.

Verhalten von Refs:

- Refs sind **über Navigationen hinweg nicht stabil**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie eine frische Ref.
- Wenn der Role-Snapshot mit `--frame` aufgenommen wurde, sind Role-Refs bis zum nächsten Role-Snapshot auf dieses iframe beschränkt.

## Erweiterte Wait-Funktionen

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs werden von Playwright unterstützt):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Darauf warten, dass ein Selector sichtbar wird:
  - `openclaw browser wait "#main"`

Diese können kombiniert werden:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug-Abläufe

Wenn eine Aktion fehlschlägt (z. B. „not visible“, „strict mode violation“, „covered“):

1. `openclaw browser snapshot --interactive`
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Role-Refs im interaktiven Modus)
3. Falls es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite merkwürdig verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefes Debugging: eine Trace aufzeichnen:
   - `openclaw browser trace start`
   - Problem reproduzieren
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling-Fälle gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (lines/chars/refs/interactive), damit Tools über Payload-Größe und -Dichte nachdenken können.

## Zustands- und Umgebungsparameter

Diese sind nützlich für Workflows vom Typ „die Website soll sich wie X verhalten“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (Legacy `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zeitzone / Locale: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Geräte-Presets)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das Browser-Profil `openclaw` kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann
  dies steuern. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Logins und Hinweise zu Anti-Bot-Mechanismen (X/Twitter usw.) siehe [Browser-Login + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie den Gateway-/Node-Host privat (nur Loopback oder nur Tailnet).
- Entfernte CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für den Strict-Modus (private/interne Ziele standardmäßig blockieren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exakte Erlaubnis
    },
  },
}
```

## Verwandt

- [Browser](/de/tools/browser) — Überblick, Konfiguration, Profile, Sicherheit
- [Browser-Login](/de/tools/browser-login) — bei Websites anmelden
- [Fehlerbehebung für Browser unter Linux](/de/tools/browser-linux-troubleshooting)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
