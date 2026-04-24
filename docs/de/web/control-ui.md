---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen.
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel.
summary: Browserbasierte Control-UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T07:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

Die Control UI ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Sie spricht **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Auth wird beim WebSocket-Handshake bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfenster im Dashboard speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht persistiert. Das Onboarding
erzeugt beim ersten Connect in der Regel ein Gateway-Token für Shared-Secret-Auth, aber Passwort-
Auth funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Device-Pairing (erste Verbindung)

Wenn Sie sich mit einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway
eine **einmalige Pairing-Freigabe** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Das ist eine Sicherheitsmaßnahme, um
unautorisierten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Request-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser Pairing mit geänderten Auth-Details (Rolle/Scopes/Public
Key) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gepairt ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff ändern, wird dies als Freigabe-Upgrade behandelt, nicht als stiller
Reconnect. OpenClaw hält die alte Freigabe aktiv, blockiert den erweiterten Reconnect
und fordert Sie auf, das neue Scope-Set explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und benötigt keine erneute Freigabe, es sei denn,
Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale loopback-Browser-Verbindungen (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browser-Verbindungen über Tailnet und LAN erfordern weiterhin eine explizite Freigabe, selbst wenn
  sie vom selben Rechner stammen.
- Jedes Browser-Profil erzeugt eine eindeutige Geräte-ID, daher erfordert ein Browserwechsel oder
  das Löschen von Browserdaten ein erneutes Pairing.

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und
Avatar), die zur Zuschreibung an ausgehende Nachrichten in gemeinsam genutzten Sitzungen angehängt wird. Sie
liegt im Browser-Speicher, ist auf das aktuelle Browser-Profil beschränkt und wird nicht
mit anderen Geräten synchronisiert oder serverseitig persistiert, abgesehen von den normalen Transkript-
Metadaten zur Autorschaft von Nachrichten, die Sie tatsächlich senden. Das Löschen von Site-Daten oder
ein Browserwechsel setzt sie auf leer zurück.

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von
`/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe
Gateway-Auth wie der übrige HTTP-Surface geschützt: Nicht authentifizierte Browser können
ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-
Token/Passwort, Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand des Browser-Gebietsschemas lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Der
Locale-Picker befindet sich in der Karte Gateway Access, nicht unter Appearance.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden lazy im Browser geladen.
- Das ausgewählte Locale wird im Browser-Speicher gespeichert und bei künftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway-WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Direkt aus dem Browser über WebRTC mit OpenAI Realtime sprechen. Das Gateway
  erstellt mit `talk.realtime.session` ein kurzlebiges Realtime-Client-Secret; der
  Browser sendet Mikrofon-Audio direkt an OpenAI und leitet
  `openclaw_agent_consult`-Tool-Calls über `chat.send` zurück an das größer
  konfigurierte OpenClaw-Modell.
- Tool-Calls + Live-Tool-Output-Karten im Chat streamen (Agent-Events)
- Channels: Status, QR-Login und Konfiguration pro Channel für eingebaute sowie gebündelte/externe Plugin-Channels (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Presence-Liste + Refresh (`system-presence`)
- Sessions: Liste + Überschreibungen pro Sitzung für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Reader für das Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Run-Historie (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Key-Updates (`skills.*`)
- Nodes: Liste + Caps (`node.list`)
- Exec-Freigaben: Allowlists für Gateway oder Node bearbeiten + Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Konfigurationsschreibvorgänge enthalten einen Base-Hash-Guard, um konkurrierende Änderungen nicht zu überschreiben
- Konfigurationsschreibvorgänge (`config.set`/`config.apply`/`config.patch`) führen außerdem vor dem Schreiben einen Preflight für aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurations-Payload durch; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich Feld `title` / `description`, passender UI-Hinweise, Zusammenfassungen unmittelbarer Child-Elemente, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Composition-Knoten
  sowie Plugin- + Channel-Schemata, wenn verfügbar); der Raw-JSON-Editor ist
  nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat
- Wenn ein Snapshot keinen sicheren Raw-Roundtrip durchführen kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- „Reset to saved“ im Raw-JSON-Editor erhält die roh verfasste Form (Formatierung, Kommentare, `$include`-Layout), anstatt einen flach gerenderten Snapshot neu zu rendern, sodass externe Änderungen ein Reset überleben, wenn der Snapshot sicher round-trippen kann
- Strukturierte SecretRef-Objektwerte werden in Textfeldern des Formulars schreibgeschützt gerendert, um versehentliche Beschädigung durch Umwandlung von Objekt zu String zu verhindern
- Debug: Snapshots von Status/Health/Models + Event-Log + manuelle RPC-Calls (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update ausführen + neu starten (`update.run`) mit Neustartbericht

Hinweise zum Cron-Jobs-Panel:

- Für isolierte Jobs verwendet die Zustellung standardmäßig eine angekündigte Zusammenfassung. Sie können auf none umstellen, wenn Sie nur interne Runs möchten.
- Felder für Channel/Ziel erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
- Für Jobs der Main-Session sind die Zustellmodi webhook und none verfügbar.
- Erweiterte Bearbeitungssteuerungen umfassen delete-after-run, clear agent override, exakte/gestaffelte Cron-Optionen,
  Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellungs-Umschalter.
- Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Save-Schaltfläche, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es fehlt, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte Legacy-Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Events gestreamt.
- Erneutes Senden mit demselben `idempotencyKey` gibt während des Laufs `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
- Antworten von `chat.history` sind für UI-Sicherheit größenbegrenzt. Wenn Transkript-Einträge zu groß sind, kann das Gateway lange Textfelder kürzen, schwere Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- Von Assistant erzeugte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Media-URLs zurückgeliefert, sodass Reloads nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Chat-History-Antwort verbleiben.
- `chat.history` entfernt außerdem reine Anzeige-Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Payloads von Tool-Calls im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie geleakte ASCII-/Vollbreiten-Model-Control-Tokens und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur aus dem exakten Silent-Token `NO_REPLY` / `no_reply` besteht.
- `chat.inject` hängt dem Sitzungs-Transkript eine Assistant-Notiz an und sendet ein `chat`-Event für reine UI-Updates (kein Agent-Run, keine Channel-Zustellung).
- Die Modell- und Thinking-Picker im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine Send-Optionen nur für einen Turn.
- Der Talk-Modus verwendet den registrierten Realtime-Voice-Provider. Konfigurieren Sie OpenAI mit
  `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder verwenden Sie die
  Realtime-Provider-Konfiguration von Voice Call wieder. Der Browser erhält niemals den normalen
  OpenAI-API-Key; er erhält nur das flüchtige Realtime-Client-Secret. Der Prompt der
  Realtime-Sitzung wird vom Gateway zusammengestellt; `talk.realtime.session`
  akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen für Instructions.
- Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der
  Mikrofon-Diktier-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Composer
  `Connecting Talk...`, dann `Talk live`, solange Audio verbunden ist, oder
  `Asking OpenClaw...`, während ein Realtime-Tool-Call das konfigurierte
  größere Modell über `chat.send` konsultiert.
- Stop:
  - Klicken Sie auf **Stop** (ruft `chat.abort` auf)
  - Während ein Run aktiv ist, werden normale Follow-ups in die Queue gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um dieses Follow-up in den laufenden Turn zu injizieren.
  - Geben Sie `/stop` ein (oder eigenständige Abbruch-Phrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Runs dieser Sitzung abzubrechen
- Beibehaltung von Abbruch-Teilergebnissen:
  - Wenn ein Run abgebrochen wird, kann partieller Assistant-Text weiterhin in der UI angezeigt werden
  - Das Gateway persistiert partiellen Assistant-Text aus einem Abbruch in die Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist
  - Persistierte Einträge enthalten Abbruch-Metadaten, sodass Transkript-Consumer Abbruch-Teilergebnisse von normal abgeschlossener Ausgabe unterscheiden können

## Gehostete Embeds

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]`
rendern. Die Sandbox-Richtlinie für iframes wird gesteuert durch
`gateway.controlUi.embedSandbox`:

- `strict`: deaktiviert die Ausführung von Skripten innerhalb gehosteter Embeds
- `scripts`: erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist
  der Standard und reicht normalerweise für in sich geschlossene Browser-Spiele/Widgets
- `trusted`: fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Same-Site-
  Dokumente hinzu, die absichtlich stärkere Privilegien benötigen

Beispiel:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-
Verhalten benötigt. Für die meisten von Agents erzeugten Spiele und interaktiven Canvases ist `scripts`
die sicherere Wahl.

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Behalten Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per HTTPS proxyen:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

Standardmäßig können sich Control-UI-/WebSocket-Serve-Requests über Tailscale-Identitäts-Header
(`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw
verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Request loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Traffic explizite Shared-Secret-
Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Auth-Versuche für dieselbe Client-IP
und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Retries
aus demselben Browser können daher bei der zweiten Request `retry later` anzeigen
statt zweier normaler Mismatches, die parallel gegeneinander laufen.
Tokenlose Serve-Auth setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host
nicht vertrauenswürdiger lokaler Code laufen könnte, verlangen Sie Token-/Passwort-Auth.

### An Tailnet + Token binden

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Öffnen Sie dann:

- `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über reines HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur für localhost: Kompatibilität mit unsicherem HTTP über `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Auth über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Toggles für unsichere Auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` ist nur ein lokaler Kompatibilitäts-Toggle:

- Es erlaubt localhost-Control-UI-Sitzungen, in
  nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Es umgeht keine Pairing-Prüfungen.
- Es lockert nicht die Anforderungen an die Geräteidentität für entfernte (nicht localhost) Verbindungen.

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
schwerwiegende Sicherheitsverschlechterung. Nehmen Sie die Änderung nach einer Notfallnutzung schnell zurück.

Hinweis zu Trusted Proxy:

- erfolgreiche Trusted-Proxy-Auth kann **Operator**-Control-UI-Sitzungen ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle
- Same-Host-loopback-Reverse-Proxies erfüllen Trusted-Proxy-Auth weiterhin nicht; siehe
  [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Nur Assets mit **same-origin** und `data:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden ausgeliefert werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert.
- Inline-URLs `data:image/...` werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Entfernte Avatar-URLs aus Channel-Metadaten werden von den Avatar-Helpern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Auth für Avatar-Route

Wenn Gateway-Auth konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Requests an beide Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route Agent-Identität auf Hosts preisgibt, die sonst geschützt sind.
- Die Control UI leitet beim Abrufen von Avataren selbst das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild in Dashboards weiterhin gerendert wird.

Wenn Sie Gateway-Auth deaktivieren (nicht empfohlen auf gemeinsam genutzten Hosts), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem Rest des Gateway.

## Die UI bauen

Das Gateway liefert statische Dateien aus `dist/control-ui` aus. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionaler absoluter Base-Pfad (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Zeigen Sie dann die UI auf Ihre Gateway-WS-URL (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich vom HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server
lokal ausführen möchten, das Gateway aber anderswo läuft.

1. Starten Sie den UI-Dev-Server: `pnpm ui:dev`
2. Öffnen Sie eine URL wie:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Auth (falls erforderlich):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in `localStorage` gespeichert und aus der URL entfernt.
- `token` sollte wann immer möglich über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Leaks in Request-Logs und über Referer vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Zugangsdaten aus Konfiguration oder Umgebung zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Nicht-loopback-Control-UI-Deployments müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Das gilt auch für entfernte Dev-Setups.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jeden Browser-Origin zu erlauben, nicht „mit welchem Host ich auch
  gerade arbeite“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den
  Host-Header-Origin-Fallback-Modus, aber das ist ein gefährlicher Sicherheitsmodus.

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

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
- [TUI](/de/web/tui) — Terminal User Interface
- [Health Checks](/de/gateway/health) — Gateway-Health-Monitoring
