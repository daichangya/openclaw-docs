---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browserbasierte Control UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-05T12:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (Browser)

Die Control UI ist eine kleine Single-Page-App auf Basis von **Vite + Lit**, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding
generiert in der Regel beim ersten Verbindungsaufbau ein Gateway-Token für Shared-Secret-Authentifizierung,
aber Passwort-Authentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Geräte-Pairing (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät aus mit der Control UI verbinden, verlangt das Gateway
eine **einmalige Pairing-Freigabe** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** „disconnected (1008): pairing required“

**So geben Sie das Gerät frei:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Anfrage-ID freigeben
openclaw devices approve <requestId>
```

Wenn der Browser das Pairing mit geänderten Auth-Details (Rolle/Scopes/Public
Key) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Freigabe erneut `openclaw devices list` aus.

Nach der Freigabe wird das Gerät gespeichert und muss nicht erneut freigegeben werden, es sei denn,
Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale Browserverbindungen über loopback (`127.0.0.1` / `localhost`) werden
  automatisch freigegeben.
- Browserverbindungen über Tailnet und LAN erfordern weiterhin eine explizite Freigabe, auch wenn
  sie von derselben Maschine stammen.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordern Browserwechsel oder
  das Löschen von Browserdaten ein erneutes Pairing.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihres Browser-Gebietsschemas lokalisieren; später können Sie dies über die Sprachauswahl in der Access-Karte überschreiben.

- Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Nicht-englische Übersetzungen werden lazy im Browser geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei späteren Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Tool-Aufrufe und Live-Karten mit Tool-Ausgabe im Chat streamen (Agent-Ereignisse)
- Channels: Status, QR-Login und kanalbezogene Konfiguration für integrierte sowie gebündelte/externe Plugin-Kanäle (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Anwesenheitsliste + Aktualisierung (`system-presence`)
- Sitzungen: Liste + sitzungsbezogene Überschreibungen für Modell/Thinking/Fast/Verbose/Reasoning (`sessions.list`, `sessions.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Key-Updates (`skills.*`)
- Nodes: Liste + Fähigkeiten (`node.list`)
- Exec-Freigaben: Gateway- oder Node-Allowlists + Ask-Richtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: mit Validierung anwenden + neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Konfigurationsschreibvorgänge enthalten einen Base-Hash-Guard, um konkurrierende Änderungen nicht zu überschreiben
- Konfigurationsschreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen außerdem vorab die aktive Auflösung von SecretRef-Referenzen im eingereichten Konfigurations-Payload; nicht aufgelöste aktive eingereichte Referenzen werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich Feld-`title` / `description`, passender UI-Hinweise, Zusammenfassungen unmittelbarer Child-Elemente,
  Dokumentationsmetadaten zu verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten
  sowie Plugin- + Channel-Schemas, wenn verfügbar); der Raw-JSON-Editor ist
  nur verfügbar, wenn der Snapshot eine sichere Raw-Roundtrip-Verarbeitung erlaubt
- Wenn ein Snapshot nicht sicher als Raw-Text roundtrip-fähig ist, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- Strukturierte SecretRef-Objektwerte werden in Formular-Textfeldern schreibgeschützt dargestellt, um versehentliche Beschädigung durch Objekt-zu-String-Konvertierung zu verhindern
- Debug: Snapshots für Status/Health/Models + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht

Hinweise zum Panel für Cron-Jobs:

- Bei isolierten Jobs ist die Standardzustellung die Ankündigungszusammenfassung. Sie können auf none umstellen, wenn Sie nur interne Läufe möchten.
- Felder für Channel/Ziel erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
- Für Jobs in der Hauptsitzung sind die Zustellmodi webhook und none verfügbar.
- Erweiterte Bearbeitungsoptionen umfassen delete-after-run, Löschen der Agent-Überschreibung, exakte/gestaffelte Cron-Optionen,
  Überschreibungen für Agent-Modell/Thinking und Best-Effort-Zustellung.
- Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte Legacy-Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Ein erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
- Antworten von `chat.history` sind zur Sicherheit der UI größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- `chat.history` entfernt außerdem reine Anzeige-Inline-Directive-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Payloads von Tool-Aufrufen als Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Kontroll-Tokens des Modells und lässt Assistant-Einträge weg, deren gesamter sichtbarer Text nur aus dem exakten stillen Token `NO_REPLY` / `no_reply` besteht.
- `chat.inject` hängt eine Assistant-Notiz an das Sitzungs-Transkript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Lauf, keine Zustellung an einen Kanal).
- Die Auswahlen für Modell und Thinking im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; es sind persistente Sitzungsüberschreibungen, keine Sendeoptionen nur für einen Zug.
- Stop:
  - Klicken Sie auf **Stop** (ruft `chat.abort` auf)
  - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen
- Beibehaltung von Teilantworten bei Abbruch:
  - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden
  - Das Gateway persistiert teilweisen Assistant-Text aus abgebrochenen Läufen in der Transkripthistorie, wenn gepufferte Ausgabe vorhanden ist
  - Persistierte Einträge enthalten Metadaten zum Abbruch, damit Verbraucher von Transkripten Teilantworten nach Abbruch von normal abgeschlossener Ausgabe unterscheiden können

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Belassen Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Standardmäßig können Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitäts-Header
(`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw
verifiziert die Identität, indem es die `x-forwarded-for`-Adresse mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Anfrage loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie explizite Shared-Secret-
Zugangsdaten auch für Serve-Traffic verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP
und denselben Auth-Scope vor den Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen
aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen
anstatt zweier einfacher Fehlpassungen, die parallel gegeneinander laufen.
Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn auf diesem Host
nicht vertrauenswürdiger lokaler Code laufen könnte, verlangen Sie Token-/Passwort-Authentifizierung.

### An Tailnet binden + Token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Öffnen Sie dann:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen der Control UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Authentifizierung der Control UI über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Schalters für unsichere Authentifizierung:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` ist nur ein lokaler Kompatibilitätsschalter:

- Er erlaubt localhost-Control-UI-Sitzungen, ohne Geräteidentität in
  nicht sicheren HTTP-Kontexten fortzufahren.
- Er umgeht keine Pairing-Prüfungen.
- Er lockert nicht die Anforderungen an Geräteidentität bei entfernten Verbindungen (nicht localhost).

**Nur als Break-Glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität für die Control UI und ist eine
schwerwiegende Herabstufung der Sicherheit. Setzen Sie es nach einem Notfall schnell wieder zurück.

Hinweis zu Trusted Proxy:

- erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Sitzungen der Control UI ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle
- loopback-Reverse-Proxys auf demselben Host erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe
  [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Lauf automatisch
```

Optionaler absoluter Base-Pfad (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev # installiert UI-Abhängigkeiten beim ersten Lauf automatisch
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich vom HTTP-Ursprung unterscheiden. Das ist nützlich, wenn Sie den lokalen Vite-Dev-Server verwenden möchten,
das Gateway aber anderswo läuft.

1. Starten Sie den UI-Dev-Server: `pnpm ui:dev`
2. Öffnen Sie eine URL wie:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Authentifizierung (falls nötig):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in `localStorage` gespeichert und aus der URL entfernt.
- `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und Referer vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Nicht-loopback-Control-UI-Deployments müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Das gilt auch für entfernte Dev-Setups.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jeden Browser-Origin zuzulassen, nicht „den Host abgleichen, den ich gerade
  verwende“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den
  Host-Header-Origin-Fallback-Modus, ist aber ein gefährlicher Sicherheitsmodus.

Beispiel:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Details zur Einrichtung des Fernzugriffs: [Remote access](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/web/dashboard) — Gateway-Dashboard
- [WebChat](/web/webchat) — browserbasierte Chat-Oberfläche
- [TUI](/web/tui) — Terminal-Benutzeroberfläche
- [Health Checks](/de/gateway/health) — Überwachung des Gateway-Zustands
