---
read_when:
    - Das Gateway über die CLI ausführen (Entwicklung oder Server)
    - Gateway-Authentifizierung, Bind-Modi und Konnektivität debuggen
    - Gateways über Bonjour erkennen (lokal + Wide-Area-DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: Gateway
x-i18n:
    generated_at: "2026-04-24T06:31:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway-CLI

Das Gateway ist der WebSocket-Server von OpenClaw (Channels, Nodes, Sitzungen, Hooks).

Die Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

Verwandte Dokumentation:

- [/gateway/bonjour](/de/gateway/bonjour)
- [/gateway/discovery](/de/gateway/discovery)
- [/gateway/configuration](/de/gateway/configuration)

## Das Gateway ausführen

Einen lokalen Gateway-Prozess ausführen:

```bash
openclaw gateway
```

Foreground-Alias:

```bash
openclaw gateway run
```

Hinweise:

- Standardmäßig verweigert das Gateway den Start, sofern nicht `gateway.mode=local` in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsstarts.
- `openclaw onboard --mode local` und `openclaw setup` sollten `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie das als defekte oder überschriebenen Konfiguration und reparieren Sie sie, statt implizit vom lokalen Modus auszugehen.
- Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtigen Konfigurationsschaden und verweigert es, für Sie „lokal zu raten“.
- Binding über Loopback hinaus ohne Authentifizierung wird blockiert (Sicherheitsleitplanke).
- `SIGUSR1` löst einen In-Process-Neustart aus, wenn dies autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um einen manuellen Neustart zu blockieren, während Gateway-Tool-/Config-Anwenden/Aktualisieren weiter erlaubt bleibt).
- `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalzustand wieder her. Wenn Sie die CLI mit einem TUI oder Raw-Mode-Eingabe umschließen, stellen Sie das Terminal vor dem Beenden wieder her.

### Optionen

- `--port <port>`: WebSocket-Port (Standard kommt aus Config/Env; normalerweise `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: Bind-Modus des Listeners.
- `--auth <token|password>`: Überschreibung des Authentifizierungsmodus.
- `--token <token>`: Token-Überschreibung (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
- `--password <password>`: Passwort-Überschreibung. Warnung: Inline-Passwörter können in lokalen Prozesslisten sichtbar sein.
- `--password-file <path>`: Gateway-Passwort aus einer Datei lesen.
- `--tailscale <off|serve|funnel>`: Das Gateway über Tailscale bereitstellen.
- `--tailscale-reset-on-exit`: Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
- `--allow-unconfigured`: Gateway-Start ohne `gateway.mode=local` in der Konfiguration zulassen. Dies umgeht die Startleitplanke nur für Ad-hoc-/Entwicklungs-Bootstrap; die Konfigurationsdatei wird dadurch nicht geschrieben oder repariert.
- `--dev`: Dev-Konfiguration + Workspace erstellen, falls fehlend (überspringt `BOOTSTRAP.md`).
- `--reset`: Dev-Konfiguration + Zugangsdaten + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
- `--force`: Vor dem Start jeden vorhandenen Listener auf dem ausgewählten Port beenden.
- `--verbose`: Ausführliche Logs.
- `--cli-backend-logs`: Nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
- `--ws-log <auto|full|compact>`: WebSocket-Logstil (Standard `auto`).
- `--compact`: Alias für `--ws-log compact`.
- `--raw-stream`: Rohereignisse des Modell-Streams nach jsonl protokollieren.
- `--raw-stream-path <path>`: jsonl-Pfad für den Roh-Stream.

Start-Profiling:

- Setzen Sie `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, um Phasen-Timings beim Gateway-Start zu protokollieren.
- Führen Sie `pnpm test:startup:gateway -- --runs 5 --warmup 1` aus, um den Gateway-Start zu benchmarken. Das Benchmark erfasst die erste Prozessausgabe, `/healthz`, `/readyz` und die Timings des Startup-Trace.

## Ein laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

Ausgabemodi:

- Standard: menschenlesbar (mit Farben im TTY).
- `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
- `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, aber menschenlesbares Layout beibehalten.

Gemeinsame Optionen (wo unterstützt):

- `--url <url>`: Gateway-WebSocket-URL.
- `--token <token>`: Gateway-Token.
- `--password <password>`: Gateway-Passwort.
- `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
- `--expect-final`: Auf eine „final“-Antwort warten (Agent-Aufrufe).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Der HTTP-Endpunkt `/healthz` ist eine Liveness-Prüfung: Er antwortet, sobald der Server HTTP beantworten kann. Der HTTP-Endpunkt `/readyz` ist strenger und bleibt rot, während Startup-Sidecars, Channels oder konfigurierte Hooks noch initialisieren.

### `gateway usage-cost`

Zusammenfassungen der Nutzungskosten aus Sitzungslogs abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Optionen:

- `--days <days>`: Anzahl der einzuschließenden Tage (Standard `30`).

### `gateway stability`

Den aktuellen diagnostischen Stabilitätsrekorder von einem laufenden Gateway abrufen.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Optionen:

- `--limit <limit>`: maximale Anzahl aktueller Ereignisse, die eingeschlossen werden (Standard `25`, max. `1000`).
- `--type <type>`: nach Typ des Diagnoseereignisses filtern, z. B. `payload.large` oder `diagnostic.memory.pressure`.
- `--since-seq <seq>`: nur Ereignisse nach einer Diagnose-Sequenznummer einschließen.
- `--bundle [path]`: ein persistiertes Stabilitäts-Bundle lesen, statt das laufende Gateway aufzurufen. Verwenden Sie `--bundle latest` (oder einfach `--bundle`) für das neueste Bundle unter dem Statusverzeichnis, oder geben Sie direkt einen Bundle-JSON-Pfad an.
- `--export`: statt Stabilitätsdetails auszugeben eine teilbare Support-Diagnose-ZIP schreiben.
- `--output <path>`: Ausgabepfad für `--export`.

Hinweise:

- Aufzeichnungen enthalten Betriebsmetadaten: Ereignisnamen, Zähler, Byte-Größen, Speicherwerte, Queue-/Sitzungszustand, Channel-/Plugin-Namen und redigierte Sitzungszusammenfassungen. Sie enthalten keinen Chat-Text, keine Webhook-Bodies, keine Tool-Ausgaben, keine Roh-Request- oder Response-Bodies, keine Tokens, Cookies, Secret-Werte, Hostnamen oder rohe Sitzungs-IDs. Setzen Sie `diagnostics.enabled: false`, um den Rekorder vollständig zu deaktivieren.
- Bei fatalen Gateway-Exits, Shutdown-Timeouts und Neustart-Startfehlern schreibt OpenClaw denselben Diagnose-Snapshot nach `~/.openclaw/logs/stability/openclaw-stability-*.json`, wenn der Rekorder Ereignisse enthält. Prüfen Sie das neueste Bundle mit `openclaw gateway stability --bundle latest`; `--limit`, `--type` und `--since-seq` gelten ebenfalls für die Bundle-Ausgabe.

### `gateway diagnostics export`

Eine lokale Diagnose-ZIP schreiben, die für Bug-Reports gedacht ist.
Zum Datenschutzmodell und Inhalt des Bundles siehe [Diagnostics Export](/de/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Optionen:

- `--output <path>`: Ausgabepfad der ZIP. Standardmäßig ein Support-Export unter dem Statusverzeichnis.
- `--log-lines <count>`: maximale Anzahl bereinigter Log-Zeilen, die eingeschlossen werden (Standard `5000`).
- `--log-bytes <bytes>`: maximale Anzahl Log-Bytes, die geprüft werden (Standard `1000000`).
- `--url <url>`: Gateway-WebSocket-URL für den Health-Snapshot.
- `--token <token>`: Gateway-Token für den Health-Snapshot.
- `--password <password>`: Gateway-Passwort für den Health-Snapshot.
- `--timeout <ms>`: Timeout für Status-/Health-Snapshot (Standard `3000`).
- `--no-stability-bundle`: Persistierte Stabilitäts-Bundle-Suche überspringen.
- `--json`: Den geschriebenen Pfad, die Größe und das Manifest als JSON ausgeben.

Der Export enthält ein Manifest, eine Markdown-Zusammenfassung, die Konfigurationsform, bereinigte Konfigurationsdetails, bereinigte Log-Zusammenfassungen, bereinigte Gateway-Status-/Health-Snapshots und das neueste Stabilitäts-Bundle, falls eines vorhanden ist.

Er ist dafür gedacht, geteilt zu werden. Er enthält Betriebsdetails, die beim Debuggen helfen, wie sichere OpenClaw-Log-Felder, Namen von Subsystemen, Statuscodes, Dauern, konfigurierte Modi, Ports, Plugin-IDs, Provider-IDs, nicht geheime Feature-Einstellungen und redigierte operative Log-Nachrichten. Er lässt Chat-Text, Webhook-Bodies, Tool-Ausgaben, Zugangsdaten, Cookies, Konto-/Nachrichtenkennungen, Prompt-/Instruktionstext, Hostnamen und Secret-Werte weg oder redigiert sie. Wenn eine Nachricht im LogTape-Stil wie Benutzer-/Chat-/Tool-Payload-Text aussieht, behält der Export nur bei, dass eine Nachricht ausgelassen wurde, plus ihre Byte-Anzahl.

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus optional eine Prüfung von Konnektivität/Authentifizierungsfähigkeit.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Optionen:

- `--url <url>`: Ein explizites Prüfziel hinzufügen. Konfiguriertes Remote + localhost werden weiterhin geprüft.
- `--token <token>`: Token-Authentifizierung für die Prüfung.
- `--password <password>`: Passwort-Authentifizierung für die Prüfung.
- `--timeout <ms>`: Prüf-Timeout (Standard `10000`).
- `--no-probe`: Konnektivitätsprüfung überspringen (nur Dienstansicht).
- `--deep`: Systemweite Dienste ebenfalls prüfen.
- `--require-rpc`: Die Standard-Konnektivitätsprüfung zu einer Leseprüfung erweitern und mit einem Nicht-Null-Code beenden, wenn diese Leseprüfung fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.

Hinweise:

- `gateway status` bleibt für Diagnosen verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- Standardmäßig weist `gateway status` Dienststatus, WebSocket-Verbindung und die beim Handshake sichtbare Authentifizierungsfähigkeit nach. Lese-/Schreib-/Admin-Operationen werden damit nicht nachgewiesen.
- `gateway status` löst nach Möglichkeit konfigurierte SecretRefs für die Prüf-Authentifizierung auf.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlspfad nicht aufgelöst werden kann, meldet `gateway status --json` `rpc.authWarning`, wenn Prüf-Konnektivität/-Authentifizierung fehlschlägt; übergeben Sie `--token`/`--password` explizit oder beheben Sie zuerst die Secret-Quelle.
- Wenn die Prüfung erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Refs unterdrückt, um Fehlalarme zu vermeiden.
- Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst allein nicht ausreicht und auch RPC-Aufrufe mit Lesebereich erfolgreich sein müssen.
- `--deep` fügt eine Best-Effort-Prüfung auf zusätzliche launchd-/systemd-/schtasks-Installationen hinzu. Wenn mehrere gateway-ähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
- Die menschenlesbare Ausgabe enthält den aufgelösten Dateilog-Pfad sowie den Snapshot der CLI-gegen-Dienst-Konfigurationspfade/-Gültigkeit, um Drift bei Profil oder Statusverzeichnis zu diagnostizieren.
- Bei Linux-systemd-Installationen lesen Prüfungen auf Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, in Anführungszeichen gesetzter Pfade, mehrerer Dateien und optionaler `-`-Dateien).
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeit-Umgebung auf (zuerst Service-Befehls-Env, dann Prozess-Env als Fallback).
- Wenn Token-Authentifizierung nicht effektiv aktiv ist (explizites `gateway.auth.mode` von `password`/`none`/`trusted-proxy`, oder Modus nicht gesetzt, wo Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Config-Tokens.

### `gateway probe`

`gateway probe` ist der Befehl „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes Remote-Gateway (falls gesetzt), und
- localhost (local loopback) **selbst dann, wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die
Ziele wie folgt:

- `URL (explicit)`
- `Remote (configured)` oder `Remote (configured, inactive)`
- `Local loopback`

Wenn mehrere Gateways erreichbar sind, werden alle ausgegeben. Mehrere Gateways werden unterstützt, wenn Sie isolierte Profile/Ports verwenden (z. B. einen Rescue-Bot), aber die meisten Installationen betreiben weiterhin nur ein Gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretation:

- `Reachable: yes` bedeutet, dass mindestens ein Ziel eine WebSocket-Verbindung akzeptiert hat.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` gibt an, was die Prüfung über die Authentifizierung nachweisen konnte. Dies ist getrennt von der Erreichbarkeit.
- `Read probe: ok` bedeutet, dass auch RPC-Aufrufe mit Lesebereich (`health`/`status`/`system-presence`/`config.get`) erfolgreich waren.
- `Read probe: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, aber RPC mit Lesebereich eingeschränkt ist. Dies wird als **degradierte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
- Der Exit-Code ist nur dann nicht null, wenn keines der geprüften Ziele erreichbar ist.

JSON-Hinweise (`--json`):

- Top-Level:
  - `ok`: Mindestens ein Ziel ist erreichbar.
  - `degraded`: Mindestens ein Ziel hatte durch Scopes eingeschränkte Detail-RPCs.
  - `capability`: Beste erkannte Fähigkeit über alle erreichbaren Ziele hinweg (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oder `unknown`).
  - `primaryTargetId`: Bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt wird: explizite URL, SSH-Tunnel, konfiguriertes Remote, dann local loopback.
  - `warnings[]`: Best-Effort-Warnungen mit `code`, `message` und optional `targetIds`.
  - `network`: URL-Hinweise für local loopback/Tailnet, abgeleitet aus der aktuellen Konfiguration und dem Host-Netzwerk.
  - `discovery.timeoutMs` und `discovery.count`: das tatsächlich für diesen Prüf-Durchlauf verwendete Discovery-Budget/Resultatanzahl.
- Pro Ziel (`targets[].connect`):
  - `ok`: Erreichbarkeit nach Verbindungsaufbau + degradierter Klassifizierung.
  - `rpcOk`: voller Erfolg der Detail-RPC.
  - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.
- Pro Ziel (`targets[].auth`):
  - `role`: in `hello-ok` gemeldete Auth-Rolle, sofern verfügbar.
  - `scopes`: in `hello-ok` gemeldete gewährte Scopes, sofern verfügbar.
  - `capability`: die offengelegte Klassifizierung der Auth-Fähigkeit für dieses Ziel.

Häufige Warncodes:

- `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels fehlgeschlagen; der Befehl ist auf direkte Prüfungen zurückgefallen.
- `multiple_gateways`: Mehr als ein Ziel war erreichbar; das ist ungewöhnlich, außer Sie betreiben absichtlich isolierte Profile, z. B. einen Rescue-Bot.
- `auth_secretref_unresolved`: Ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
- `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber die Leseprüfung war durch fehlendes `operator.read` eingeschränkt.

#### Remote über SSH (Parität zur Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet ein lokales Port-Forwarding, sodass das Remote-Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Optionen:

- `--ssh <target>`: `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
- `--ssh-identity <path>`: Identity-Datei.
- `--ssh-auto`: Wählt den ersten erkannten Gateway-Host als SSH-Ziel aus dem aufgelösten
  Discovery-Endpunkt (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Nur-TXT-
  Hinweise werden ignoriert.

Konfiguration (optional, als Standardwerte verwendet):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-Level-RPC-Helfer.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Optionen:

- `--params <json>`: JSON-Objekt-String für Parameter (Standard `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Hinweise:

- `--params` muss gültiges JSON sein.
- `--expect-final` ist hauptsächlich für Agent-artige RPCs gedacht, die Zwischenereignisse streamen, bevor eine finale Payload kommt.

## Den Gateway-Dienst verwalten

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
- Wenn Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `gateway install`, dass der SecretRef auflösbar ist, persistiert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst werden kann, schlägt die Installation fail-closed fehl, statt ein Fallback-Klartext-Token zu persistieren.
- Bei Passwort-Authentifizierung für `gateway run` sollten Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber einem Inline-`--password` bevorzugen.
- Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Installationsanforderungen für Token nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Config-`env`), wenn Sie einen verwalteten Dienst installieren.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Lifecycle-Befehle akzeptieren `--json` für Skripting.

## Gateways erkennen (Bonjour)

`gateway discover` scannt nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): Wählen Sie eine Domain (Beispiel: `openclaw.internal.`) und richten Sie Split-DNS + einen DNS-Server ein; siehe [/gateway/bonjour](/de/gateway/bonjour)

Nur Gateways mit aktivierter Bonjour-Discovery (standardmäßig aktiviert) senden das Beacon aus.

Wide-Area-Discovery-Einträge enthalten (TXT):

- `role` (Hinweis zur Gateway-Rolle)
- `transport` (Hinweis zum Transport, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` für SSH-Ziele, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, sofern verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerprint)
- `cliPath` (Hinweis für Remote-Installation, der in die Wide-Area-Zone geschrieben wird)

### `gateway discover`

```bash
openclaw gateway discover
```

Optionen:

- `--timeout <ms>`: Timeout pro Befehl (browse/resolve); Standard `2000`.
- `--json`: maschinenlesbare Ausgabe (deaktiviert auch Styling/Spinner).

Beispiele:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Hinweise:

- Die CLI scannt `local.` plus die konfigurierte Wide-Area-Domain, wenn eine aktiviert ist.
- `wsUrl` in der JSON-Ausgabe wird vom aufgelösten Service-Endpunkt abgeleitet, nicht aus reinen TXT-
  Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.`-mDNS werden `sshPort` und `cliPath` nur ausgestrahlt, wenn
  `discovery.mdns.mode` auf `full` steht. Wide-Area-DNS-SD schreibt weiterhin `cliPath`; `sshPort`
  bleibt auch dort optional.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Runbook](/de/gateway)
