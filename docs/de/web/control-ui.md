---
read_when:
    - Sie möchten das Gateway aus einem Browser heraus bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browser-basierte Steuerungs-UI für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-04-23T14:08:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Steuerungs-UI (Browser)

Die Steuerungs-UI ist eine kleine Single-Page-App auf Basis von **Vite + Lit**, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` setzen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld im Dashboard speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht persistent gespeichert. Onboarding
erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für die Authentifizierung mit gemeinsamem Geheimnis, aber
Passwort-Authentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Geräte-Pairing (erste Verbindung)

Wenn Sie die Steuerungs-UI von einem neuen Browser oder Gerät aus verbinden, verlangt das Gateway
eine **einmalige Pairing-Genehmigung** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unautorisierten Zugriff zu verhindern.

**Was Sie sehen werden:** "disconnected (1008): pairing required"

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Anfragen-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser das Pairing mit geänderten Auth-Details (Rolle/Scopes/Public
Key) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gepairt ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungs-Upgrade behandelt, nicht als stillschweigende
Wiederverbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die erweiterte Wiederverbindung
und fordert Sie auf, den neuen Scope-Satz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, außer
Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale Loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browserverbindungen über Tailnet und LAN erfordern weiterhin eine explizite Genehmigung, selbst wenn
  sie vom selben Rechner stammen.
- Jedes Browser-Profil erzeugt eine eindeutige Geräte-ID; ein Browserwechsel oder
  das Löschen von Browserdaten erfordert daher erneutes Pairing.

## Persönliche Identität (browserlokal)

Die Steuerungs-UI unterstützt eine persönliche Identität pro Browser (Anzeigename und
Avatar), die ausgehenden Nachrichten zur Zuschreibung in gemeinsam genutzten Sitzungen hinzugefügt wird. Sie
lebt im Browser-Speicher, ist auf das aktuelle Browser-Profil beschränkt und wird nicht
mit anderen Geräten synchronisiert oder serverseitig dauerhaft gespeichert, außer in den normalen Metadaten zur
Autorschaft im Transkript von Nachrichten, die Sie tatsächlich senden. Das Löschen von Site-Daten oder
ein Browserwechsel setzt sie auf leer zurück.

## Laufzeit-Konfigurationsendpunkt

Die Steuerungs-UI ruft ihre Laufzeiteinstellungen von
`/__openclaw/control-ui-config.json` ab. Dieser Endpunkt ist durch dieselbe
Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: nicht authentifizierte Browser können
ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-
Token/Passwort, Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Steuerungs-UI kann sich beim ersten Laden anhand Ihres Browser-Gebietsschemas lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die
Auswahl für das Gebietsschema befindet sich auf der Karte Gateway-Zugriff, nicht unter Erscheinungsbild.

- Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden lazy im Browser geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Tool-Aufrufe und Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse)
- Kanäle: Status, QR-Login und Konfiguration pro Kanal für integrierte sowie gebündelte/externe Plugin-Kanäle (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Anwesenheitsliste + Aktualisierung (`system-presence`)
- Sitzungen: Auflisten + Überschreibungen pro Sitzung für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Umschalter für Aktivieren/Deaktivieren und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: Auflisten/Hinzufügen/Bearbeiten/Ausführen/Aktivieren/Deaktivieren + Ausführungsverlauf (`cron.*`)
- Skills: Status, Aktivieren/Deaktivieren, Installieren, Aktualisierungen von API-Schlüsseln (`skills.*`)
- Nodes: Auflisten + Fähigkeiten (`node.list`)
- Exec-Genehmigungen: Zulassungslisten für Gateway oder Node bearbeiten + Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: mit Validierung anwenden + neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Schreibvorgänge an der Konfiguration enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Änderungen zu verhindern
- Schreibvorgänge an der Konfiguration (`config.set`/`config.apply`/`config.patch`) führen außerdem vorab eine Auflösung aktiver SecretRef-Einträge für Referenzen in der übermittelten Konfigurations-Payload aus; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich `title` / `description` von Feldern, passender UI-Hinweise, Zusammenfassungen unmittelbarer Kinder,
  Docs-Metadaten für verschachtelte Objekt-/Wildcard-/Array-/Kompositionsknoten
  sowie Plugin- + Kanal-Schemata, wenn verfügbar); der Raw-JSON-Editor ist
  nur verfügbar, wenn der Snapshot ein sicheres Raw-Round-Trip unterstützt
- Wenn ein Snapshot keinen sicheren Raw-Round-Trip unterstützt, erzwingt die Steuerungs-UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- Der Raw-JSON-Editor mit „Auf gespeicherten Stand zurücksetzen“ bewahrt die roh verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen ein Zurücksetzen überstehen, wenn der Snapshot sicher round-tripped werden kann
- Strukturierte SecretRef-Objektwerte werden in Formular-Textfeldern schreibgeschützt dargestellt, um versehentliche Beschädigungen durch Umwandlung von Objekt zu String zu verhindern
- Debug: Snapshots für Status/Health/Modelle + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit einem Neustartbericht

Hinweise zum Feld für Cron-Jobs:

- Bei isolierten Jobs ist die Zustellung standardmäßig auf Ankündigungszusammenfassung gesetzt. Sie können auf none umstellen, wenn Sie rein interne Läufe möchten.
- Felder für Kanal/Ziel erscheinen, wenn Ankündigung ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
- Für Jobs der Hauptsitzung sind die Zustellmodi webhook und none verfügbar.
- Erweiterte Bearbeitungsoptionen umfassen delete-after-run, clear agent override, exakte/stagger-Optionen für Cron,
  Agentenüberschreibungen für Modell/Thinking und Best-Effort-Zustellungsumschalter.
- Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie behoben sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es fehlt, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert wurden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Erneutes Senden mit demselben `idempotencyKey` gibt `{ status: "in_flight" }` zurück, solange es läuft, und `{ status: "ok" }` nach Abschluss.
- Antworten von `chat.history` sind aus Gründen der UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann Gateway lange Textfelder kürzen, schwere Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- `chat.history` entfernt außerdem reine Anzeige-Tags für Inline-Direktiven aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-XML-Payloads für Tool-Aufrufe (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzte Tool-Call-Blöcke) sowie durchgesickerte Modell-Kontrolltoken in ASCII/Vollbreite und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur aus dem exakten Silent-Token `NO_REPLY` / `no_reply` besteht.
- `chat.inject` hängt dem Sitzungs-Transkript eine Assistant-Notiz an und überträgt ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
- Die Auswahlfelder für Modell und Thinking im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; es handelt sich um persistente Sitzungsüberschreibungen, nicht um Sendeoptionen nur für einen Zug.
- Stop:
  - Klicken Sie auf **Stop** (ruft `chat.abort` auf)
  - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des Bandes abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen
- Beibehaltung von Teilinhalten bei Abbruch:
  - Wenn ein Lauf abgebrochen wird, kann partieller Assistant-Text weiterhin in der UI angezeigt werden
  - Gateway persistiert partiellen Assistant-Text eines abgebrochenen Laufs in das Transkript, wenn gepufferte Ausgabe vorhanden ist
  - Persistierte Einträge enthalten Metadaten zum Abbruch, sodass Verbraucher des Transkripts abgebrochene Teilinhalte von normal abgeschlossener Ausgabe unterscheiden können

## Gehostete Einbettungen

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]`
rendern. Die Sandbox-Richtlinie für Iframes wird über
`gateway.controlUi.embedSandbox` gesteuert:

- `strict`: deaktiviert Skriptausführung innerhalb gehosteter Einbettungen
- `scripts`: erlaubt interaktive Einbettungen bei gleichzeitiger Beibehaltung der Origin-Isolation; dies ist
  der Standard und reicht normalerweise für in sich geschlossene Browser-Spiele/Widgets aus
- `trusted`: ergänzt `allow-same-origin` zusätzlich zu `allow-scripts` für gleichseitige
  Dokumente, die absichtlich stärkere Berechtigungen benötigen

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

Verwenden Sie `trusted` nur dann, wenn das eingebettete Dokument tatsächlich Same-Origin-
Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Leinwände ist `scripts`
die sicherere Wahl.

Absolute externe Einbettungs-URLs mit `http(s)` bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Behalten Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader
(`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` auf `true` steht. OpenClaw
verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert dies nur, wenn die
Anfrage loopback mit den Headern `x-forwarded-*` von Tailscale erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie explizite Zugangsdaten mit gemeinsamem Geheimnis
auch für Serve-Traffic verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP
und denselben Auth-Scope vor Schreibvorgängen der Rate-Limits serialisiert. Gleichzeitige fehlerhafte Wiederholungen
aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen
statt zwei einfache Mismatches parallel gegeneinander laufen zu lassen.
Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host
nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwort-Authentifizierung.

### An Tailnet binden + Token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Öffnen Sie dann:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Fügen Sie das passende gemeinsame Geheimnis in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über reines HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen der Steuerungs-UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Authentifizierung der Steuerungs-UI über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Umschalters für unsichere Authentifizierung:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` ist nur ein lokaler Kompatibilitätsumschalter:

- Er erlaubt localhost-Sitzungen der Steuerungs-UI, in
  nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Er umgeht keine Pairing-Prüfungen.
- Er lockert nicht die Anforderungen an die Geräteidentität für entfernte Verbindungen (nicht localhost).

**Nur als Notfalloption:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität in der Steuerungs-UI und ist eine
schwerwiegende Sicherheitsverschlechterung. Nehmen Sie die Einstellung nach einer Notfallnutzung schnell wieder zurück.

Hinweis zu Trusted Proxy:

- erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Sitzungen der Steuerungs-UI ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Sitzungen der Steuerungs-UI mit Node-Rolle
- Loopback-Reverse-Proxys auf demselben Host erfüllen weiterhin nicht die Anforderungen der Trusted-Proxy-Authentifizierung; siehe
  [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Steuerungs-UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Es sind nur Assets mit **gleichem Ursprung** und `data:`-URLs erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkanfragen aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert.
- Inline-URLs vom Typ `data:image/...` werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Entfernte Avatar-URLs aus Kanalmetadaten werden in den Avatar-Helpern der Steuerungs-UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Steuerungs-UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatarbild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Route für Assistant-Medien). Dadurch wird verhindert, dass die Avatar-Route die Agentenidentität auf Hosts offenlegt, die ansonsten geschützt sind.
- Die Steuerungs-UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild in Dashboards weiterhin gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem Rest des Gateways.

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Entwicklungsserver + entferntes Gateway

Die Steuerungs-UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den lokalen Vite-Entwicklungsserver verwenden möchten,
während das Gateway anderswo läuft.

1. Starten Sie den UI-Entwicklungsserver: `pnpm ui:dev`
2. Öffnen Sie eine URL wie:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Authentifizierung (falls nötig):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
- `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und über den Referer vermieden werden. Veraltete Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback und werden direkt nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfiguration oder Umgebungs-Anmeldedaten zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Bereitstellungen der Steuerungs-UI außerhalb von Loopback müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Das schließt auch entfernte Entwicklungs-Setups ein.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jeden Browser-Origin zuzulassen, nicht „den Host abgleichen, den ich gerade
  verwende“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den
  Host-Header-Origin-Fallback-Modus, dies ist jedoch ein gefährlicher Sicherheitsmodus.

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
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [Health Checks](/de/gateway/health) — Überwachung des Gateway-Zustands
