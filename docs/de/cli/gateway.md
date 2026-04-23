---
read_when:
    - Das Gateway über die CLI ausführen (Entwicklung oder Server)
    - Fehlerbehebung bei Gateway-Authentifizierung, Bind-Modi und Konnektivität
    - Gateways über Bonjour erkennen (lokales + Wide-Area-DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-04-23T13:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway-CLI

Das Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Nodes, Sitzungen, Hooks).

Unterbefehle auf dieser Seite liegen unter `openclaw gateway …`.

Verwandte Dokumente:

- [/gateway/bonjour](/de/gateway/bonjour)
- [/gateway/discovery](/de/gateway/discovery)
- [/gateway/configuration](/de/gateway/configuration)

## Gateway ausführen

Einen lokalen Gateway-Prozess ausführen:

```bash
openclaw gateway
```

Alias im Vordergrund:

```bash
openclaw gateway run
```

Hinweise:

- Standardmäßig verweigert das Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungs-Ausführungen.
- `openclaw onboard --mode local` und `openclaw setup` sollten `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie dies als defekte oder überschriebenen Konfiguration und reparieren Sie sie, statt implizit vom lokalen Modus auszugehen.
- Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtigen Konfigurationsschaden und verweigert es, für Sie „lokal zu raten“.
- Das Binden über local loopback hinaus ohne Auth ist blockiert (Sicherheitsleitplanke).
- `SIGUSR1` löst bei Autorisierung einen prozessinternen Neustart aus (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um manuelle Neustarts zu blockieren, während Gateway-Tool-/Konfigurationsanwendung/-aktualisierung weiterhin erlaubt bleibt).
- Handler für `SIGINT`/`SIGTERM` stoppen den Gateway-Prozess, stellen jedoch keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umhüllen, stellen Sie das Terminal vor dem Beenden wieder her.

### Optionen

- `--port <port>`: WebSocket-Port (Standard kommt aus Konfiguration/Umgebung; normalerweise `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: Listener-Bind-Modus.
- `--auth <token|password>`: Überschreibung des Auth-Modus.
- `--token <token>`: Token-Überschreibung (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
- `--password <password>`: Passwort-Überschreibung. Warnung: Inline-Passwörter können in lokalen Prozesslisten sichtbar sein.
- `--password-file <path>`: Gateway-Passwort aus einer Datei lesen.
- `--tailscale <off|serve|funnel>`: Das Gateway über Tailscale bereitstellen.
- `--tailscale-reset-on-exit`: Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
- `--allow-unconfigured`: Gateway-Start ohne `gateway.mode=local` in der Konfiguration zulassen. Dies umgeht die Startleitplanke nur für Ad-hoc-/Entwicklungs-Bootstrap und schreibt oder repariert die Konfigurationsdatei nicht.
- `--dev`: Eine Dev-Konfiguration + Workspace erstellen, falls sie fehlen (überspringt `BOOTSTRAP.md`).
- `--reset`: Dev-Konfiguration + Credentials + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
- `--force`: Jeden vorhandenen Listener auf dem gewählten Port vor dem Start beenden.
- `--verbose`: Ausführliche Logs.
- `--cli-backend-logs`: Nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
- `--ws-log <auto|full|compact>`: Stil des WebSocket-Logs (Standard `auto`).
- `--compact`: Alias für `--ws-log compact`.
- `--raw-stream`: Rohereignisse des Modellstreams nach jsonl protokollieren.
- `--raw-stream-path <path>`: Pfad für Raw-Stream-jsonl.

Start-Profiling:

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasen-Timings während des Gateway-Starts zu protokollieren.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Der Benchmark zeichnet die erste Prozessausgabe, `/healthz`, `/readyz` und Timings des Start-Traces auf.

## Ein laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

Ausgabemodi:

- Standard: menschenlesbar (in TTY farbig).
- `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
- `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, menschenlesbares Layout aber beibehalten.

Gemeinsame Optionen (wo unterstützt):

- `--url <url>`: Gateway-WebSocket-URL.
- `--token <token>`: Gateway-Token.
- `--password <password>`: Gateway-Passwort.
- `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
- `--expect-final`: Auf eine „final“-Antwort warten (Agent-Aufrufe).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Credentials zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Credentials sind ein Fehler.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Probe: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Startup-Sidecars, Kanäle oder konfigurierte Hooks noch hochfahren.

### `gateway usage-cost`

Usage-Cost-Zusammenfassungen aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Optionen:

- `--days <days>`: Anzahl der einzubeziehenden Tage (Standard `30`).

### `gateway stability`

Den aktuellen diagnostischen Stability-Recorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Optionen:

- `--limit <limit>`: Maximale Anzahl einzubeziehender aktueller Ereignisse (Standard `25`, max. `1000`).
- `--type <type>`: Nach diagnostischem Ereignistyp filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
- `--since-seq <seq>`: Nur Ereignisse nach einer diagnostischen Sequenznummer einbeziehen.
- `--bundle [path]`: Ein persistiertes Stability-Bundle lesen, statt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder einfach `--bundle`) für das neueste Bundle unter dem Zustandsverzeichnis, oder übergeben Sie direkt einen Bundle-JSON-Pfad.
- `--export`: Statt Stability-Details auszugeben eine teilbare Support-Diagnose-zip schreiben.
- `--output <path>`: Ausgabepfad für `--export`.

Hinweise:

- Datensätze enthalten Betriebsmetadaten: Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Queue-/Sitzungsstatus, Kanal-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie enthalten keinen Chat-Text, keine Webhook-Bodies, keine Tool-Ausgaben, keine Roh-Anfrage- oder Antwort-Bodies, keine Tokens, keine Cookies, keine Secret-Werte, keine Hostnamen und keine rohen Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Recorder vollständig zu deaktivieren.
- Bei fatalen Gateway-Beendigungen, Shutdown-Timeouts und Neustartfehlern beim Start schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Recorder Ereignisse hat. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für Bundle-Ausgaben.

### `gateway diagnostics export`

Eine lokale Diagnose-zip schreiben, die zum Anhängen an Fehlerberichte gedacht ist.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Optionen:

- `--output <path>`: Ausgabepfad der zip. Standardmäßig ein Support-Export unter dem Zustandsverzeichnis.
- `--log-lines <count>`: Maximale Anzahl bereinigter Logzeilen, die aufgenommen werden (Standard `5000`).
- `--log-bytes <bytes>`: Maximale Anzahl zu prüfender Log-Bytes (Standard `1000000`).
- `--url <url>`: Gateway-WebSocket-URL für den Health-Snapshot.
- `--token <token>`: Gateway-Token für den Health-Snapshot.
- `--password <password>`: Gateway-Passwort für den Health-Snapshot.
- `--timeout <ms>`: Timeout für Status-/Health-Snapshot (Standard `3000`).
- `--no-stability-bundle`: Persistierte Stability-Bundle-Suche überspringen.
- `--json`: Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Logzusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stability-Bundle, falls eines existiert.

Er ist zum Teilen gedacht. Er enthält Betriebsdetails, die beim Debugging helfen, wie sichere OpenClaw-Logfelder, Subsystemnamen, Statuscodes, Laufzeiten, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Logmeldungen. Er lässt Chat-Text, Webhook-Bodies, Tool-Ausgaben, Credentials, Cookies, Konto-/Nachrichten-IDs, Prompt-/Anweisungstext, Hostnamen und Secret-Werte aus oder redigiert sie. Wenn eine Nachricht im LogTape-Stil wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus deren Byte-Anzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Service (launchd/systemd/schtasks) plus eine optionale Probe von Konnektivitäts-/Auth-Fähigkeiten.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Optionen:

- `--url <url>`: Ein explizites Probe-Ziel hinzufügen. Konfiguriertes Remote + localhost werden weiterhin geprüft.
- `--token <token>`: Token-Auth für die Probe.
- `--password <password>`: Passwort-Auth für die Probe.
- `--timeout <ms>`: Probe-Timeout (Standard `10000`).
- `--no-probe`: Konnektivitätsprobe überspringen (nur Service-Ansicht).
- `--deep`: Auch systemweite Services prüfen.
- `--require-rpc`: Die Standard-Konnektivitätsprobe auf eine Leseprobe hochstufen und mit einem Fehlercode beenden, wenn diese Leseprobe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.

Hinweise:

- `gateway status` bleibt für Diagnosen verfügbar, selbst wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- Standardmäßig weist `gateway status` den Servicestatus, die WebSocket-Verbindung und die beim Handshake sichtbare Auth-Fähigkeit nach. Lese-/Schreib-/Admin-Operationen werden damit nicht nachgewiesen.
- `gateway status` löst konfigurierte Auth-SecretRefs für Probe-Auth auf, wenn möglich.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlsausführungspfad nicht aufgelöst werden kann, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/Auth fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle.
- Wenn die Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
- Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Service nicht ausreicht und auch RPC-Aufrufe mit Lesebereich funktionieren müssen.
- `--deep` ergänzt eine Best-Effort-Prüfung auf zusätzliche launchd-/systemd-/schtasks-Installationen. Wenn mehrere gateway-ähnliche Services erkannt werden, gibt die menschenlesbare Ausgabe Bereinigungshinweise aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
- Die menschenlesbare Ausgabe enthält den aufgelösten Dateilog-Pfad plus einen Snapshot der CLI- vs.-Service-Konfigurationspfade/-Gültigkeit, um Drift bei Profilen oder State-Dirs zu diagnostizieren.
- Bei Linux-systemd-Installationen lesen Prüfungen auf Service-Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, quotierter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe zusammengeführter Laufzeit-Umgebungen auf (zuerst Service-Befehlsumgebung, dann Fallback auf Prozessumgebung).
- Wenn Token-Auth effektiv nicht aktiv ist (explizites `gateway.auth.mode` von `password`/`none`/`trusted-proxy`, oder Modus nicht gesetzt, wobei Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurations-Tokens.

### `gateway probe`

`gateway probe` ist der Befehl „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt), und
- localhost (local loopback) **selbst wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe bezeichnet die Ziele als:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

Wenn mehrere Gateways erreichbar sind, werden alle ausgegeben. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rescue-Bot), aber die meisten Installationen betreiben weiterhin ein einzelnes Gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretation:

- `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` meldet, was die Probe über Auth nachweisen konnte. Das ist getrennt von der Erreichbarkeit.
- `Read probe: ok` bedeutet, dass auch Detail-RPC-Aufrufe mit Lesebereich (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
- `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, RPC mit Lesebereich jedoch eingeschränkt ist. Dies wird als **degradierte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
- Der Exit-Code ist nur dann ungleich null, wenn kein geprüftes Ziel erreichbar ist.

JSON-Hinweise (`--json`):

- Oberste Ebene:
  - `ok`: Mindestens ein Ziel ist erreichbar.
  - `degraded`: Mindestens ein Ziel hatte durch Scopes eingeschränkte Detail-RPC.
  - `capability`: Beste über erreichbare Ziele hinweg beobachtete Fähigkeit (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
  - `primaryTargetId`: Bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfiguriertes Remote, dann local loopback.
  - `warnings[]`: Best-Effort-Warnungen mit `code`, `message` und optionalen `targetIds`.
  - `network`: Hinweise auf URLs für local loopback/Tailscale, abgeleitet aus der aktuellen Konfiguration und dem Host-Netzwerk.
  - `discovery.timeoutMs` und `discovery.count`: Das tatsächliche Discovery-Budget bzw. die tatsächliche Ergebnisanzahl, die für diesen Probe-Durchlauf verwendet wurden.
- Pro Ziel (`targets[].connect`):
  - `ok`: Erreichbarkeit nach Verbindung + Degraded-Klassifizierung.
  - `rpcOk`: Erfolg der vollständigen Detail-RPC.
  - `scopeLimited`: Detail-RPC ist aufgrund fehlenden Operator-Scopes fehlgeschlagen.
- Pro Ziel (`targets[].auth`):
  - `role`: In `hello-ok` gemeldete Auth-Rolle, wenn verfügbar.
  - `scopes`: In `hello-ok` gemeldete gewährte Scopes, wenn verfügbar.
  - `capability`: Die für dieses Ziel bereitgestellte Klassifizierung der Auth-Fähigkeit.

Häufige Warncodes:

- `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
- `multiple_gateways`: Mehr als ein Ziel war erreichbar; das ist ungewöhnlich, außer Sie betreiben absichtlich isolierte Profile, z. B. einen Rescue-Bot.
- `auth_secretref_unresolved`: Ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
- `probe_scope_limited`: WebSocket-Verbindung erfolgreich, aber die Leseprobe war durch fehlendes `operator.read` eingeschränkt.

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet ein lokales Port-Forwarding, sodass das Remote-Gateway (das möglicherweise nur an local loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Optionen:

- `--ssh <target>`: `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
- `--ssh-identity <path>`: Identity-Datei.
- `--ssh-auto`: Den ersten erkannten Gateway-Host vom aufgelösten Discovery-Endpunkt als SSH-Ziel auswählen (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-Hinweise werden ignoriert.

Konfiguration (optional, wird als Standard verwendet):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-Level-RPC-Helfer.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Optionen:

- `--params <json>`: JSON-Objektzeichenfolge für Parameter (Standard `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Hinweise:

- `--params` muss gültiges JSON sein.
- `--expect-final` ist hauptsächlich für RPCs im Agent-Stil gedacht, die Zwischenereignisse streamen, bevor eine finale Payload kommt.

## Den Gateway-Service verwalten

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Befehlsoptionen:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Hinweise:

- `gateway install` unterstützt `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Wenn Token-Auth ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `gateway install`, dass der SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Service.
- Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht auflösbar ist, schlägt die Installation fail-closed fehl, statt unverschlüsselte Fallback-Werte zu persistieren.
- Für Passwort-Auth bei `gateway run` sollten Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein per SecretRef gestütztes `gateway.auth.password` gegenüber inline `--password` bevorzugen.
- Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Installationsanforderungen an Tokens nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Service installieren.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Lifecycle-Befehle akzeptieren `--json` für Skripting.

## Gateways erkennen (Bonjour)

`gateway discover` sucht nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast-DNS-SD: `local.`
- Unicast-DNS-SD (Wide-Area-Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [/gateway/bonjour](/de/gateway/bonjour)

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) veröffentlichen das Beacon.

Wide-Area-Discovery-Einträge enthalten (TXT):

- `role` (Hinweis auf Gateway-Rolle)
- `transport` (Hinweis auf Transport, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` als SSH-Ziel, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerprint)
- `cliPath` (Hinweis auf Remote-Installation, in die Wide-Area-Zone geschrieben)

### `gateway discover`

```bash
openclaw gateway discover
```

Optionen:

- `--timeout <ms>`: Timeout pro Befehl (browse/resolve); Standard `2000`.
- `--json`: Maschinenlesbare Ausgabe (deaktiviert auch Styling/Spinner).

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Hinweise:

- Die CLI durchsucht `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird vom aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.`-mDNS werden `sshPort` und `cliPath` nur gesendet, wenn `discovery.mdns.mode` auf `full` gesetzt ist. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort` bleibt dort ebenfalls optional.
