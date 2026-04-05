---
read_when:
    - Das Gateway über die CLI ausführen (Entwicklung oder Server)
    - Gateway-Authentifizierung, Bind-Modi und Konnektivität debuggen
    - Gateways über Bonjour erkennen (lokal + Wide-Area DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateways ausführen, abfragen und erkennen
title: gateway
x-i18n:
    generated_at: "2026-04-05T12:38:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Das Gateway ist der WebSocket-Server von OpenClaw (Kanäle, Knoten, Sitzungen, Hooks).

Unterbefehle auf dieser Seite befinden sich unter `openclaw gateway …`.

Verwandte Dokumentation:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Das Gateway ausführen

Einen lokalen Gateway-Prozess ausführen:

```bash
openclaw gateway
```

Alias für den Vordergrundmodus:

```bash
openclaw gateway run
```

Hinweise:

- Standardmäßig verweigert das Gateway den Start, sofern `gateway.mode=local` nicht in `~/.openclaw/openclaw.json` gesetzt ist. Verwenden Sie `--allow-unconfigured` für Ad-hoc-/Entwicklungsläufe.
- `openclaw onboard --mode local` und `openclaw setup` sollen `gateway.mode=local` schreiben. Wenn die Datei existiert, aber `gateway.mode` fehlt, behandeln Sie das als beschädigte oder überschriebenen Konfiguration und reparieren Sie sie, statt den lokalen Modus implizit anzunehmen.
- Wenn die Datei existiert und `gateway.mode` fehlt, behandelt das Gateway dies als verdächtige Konfigurationsbeschädigung und verweigert es, für Sie „lokal zu erraten“.
- Bindung über loopback hinaus ohne Auth wird blockiert (Sicherheitsleitplanke).
- `SIGUSR1` löst einen In-Process-Neustart aus, wenn dies autorisiert ist (`commands.restart` ist standardmäßig aktiviert; setzen Sie `commands.restart: false`, um einen manuellen Neustart zu blockieren, während Gateway-Tool-/Konfigurationsanwenden/-aktualisieren weiterhin erlaubt bleiben).
- `SIGINT`-/`SIGTERM`-Handler stoppen den Gateway-Prozess, stellen aber keinen benutzerdefinierten Terminalstatus wieder her. Wenn Sie die CLI mit einer TUI oder Raw-Mode-Eingabe umhüllen, stellen Sie das Terminal vor dem Beenden wieder her.

### Optionen

- `--port <port>`: WebSocket-Port (Standard kommt aus Konfiguration/Env; normalerweise `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: Listener-Bind-Modus.
- `--auth <token|password>`: Überschreibung für den Auth-Modus.
- `--token <token>`: Token-Überschreibung (setzt auch `OPENCLAW_GATEWAY_TOKEN` für den Prozess).
- `--password <password>`: Passwort-Überschreibung. Warnung: Inline-Passwörter können in lokalen Prozesslisten sichtbar werden.
- `--password-file <path>`: das Gateway-Passwort aus einer Datei lesen.
- `--tailscale <off|serve|funnel>`: das Gateway über Tailscale bereitstellen.
- `--tailscale-reset-on-exit`: die Tailscale-Serve-/Funnel-Konfiguration beim Herunterfahren zurücksetzen.
- `--allow-unconfigured`: Gateway-Start ohne `gateway.mode=local` in der Konfiguration erlauben. Dies umgeht die Startleitplanke nur für Ad-hoc-/Entwicklungs-Bootstrap und schreibt oder repariert die Konfigurationsdatei nicht.
- `--dev`: eine Entwicklungs-Konfiguration + Workspace erstellen, wenn sie fehlen (überspringt `BOOTSTRAP.md`).
- `--reset`: Entwicklungs-Konfiguration + Anmeldedaten + Sitzungen + Workspace zurücksetzen (erfordert `--dev`).
- `--force`: jeden vorhandenen Listener auf dem ausgewählten Port vor dem Start beenden.
- `--verbose`: ausführliche Logs.
- `--cli-backend-logs`: nur CLI-Backend-Logs in der Konsole anzeigen (und stdout/stderr aktivieren).
- `--claude-cli-logs`: veralteter Alias für `--cli-backend-logs`.
- `--ws-log <auto|full|compact>`: WebSocket-Logstil (Standard `auto`).
- `--compact`: Alias für `--ws-log compact`.
- `--raw-stream`: rohe Modell-Stream-Ereignisse in jsonl protokollieren.
- `--raw-stream-path <path>`: Pfad für rohe Stream-jsonl-Datei.

## Ein laufendes Gateway abfragen

Alle Abfragebefehle verwenden WebSocket-RPC.

Ausgabemodi:

- Standard: menschenlesbar (farbig in TTY).
- `--json`: maschinenlesbares JSON (ohne Styling/Spinner).
- `--no-color` (oder `NO_COLOR=1`): ANSI deaktivieren, aber menschenlesbares Layout beibehalten.

Gemeinsame Optionen (wo unterstützt):

- `--url <url>`: Gateway-WebSocket-URL.
- `--token <token>`: Gateway-Token.
- `--password <password>`: Gateway-Passwort.
- `--timeout <ms>`: Timeout/Budget (variiert je nach Befehl).
- `--expect-final`: auf eine „finale“ Antwort warten (Agent-Aufrufe).

Hinweis: Wenn Sie `--url` setzen, greift die CLI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Zusammenfassungen der Nutzungskosten aus Sitzungsprotokollen abrufen.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Optionen:

- `--days <days>`: Anzahl der einzubeziehenden Tage (Standard `30`).

### `gateway status`

`gateway status` zeigt den Gateway-Dienst (launchd/systemd/schtasks) plus optionalen RPC-Probe.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Optionen:

- `--url <url>`: ein explizites Probe-Ziel hinzufügen. Konfiguriertes Remote + localhost werden weiterhin geprüft.
- `--token <token>`: Token-Auth für den Probe.
- `--password <password>`: Passwort-Auth für den Probe.
- `--timeout <ms>`: Probe-Timeout (Standard `10000`).
- `--no-probe`: den RPC-Probe überspringen (nur Dienstansicht).
- `--deep`: auch Dienste auf Systemebene scannen.
- `--require-rpc`: mit Exit-Code ungleich null beenden, wenn der RPC-Probe fehlschlägt. Kann nicht mit `--no-probe` kombiniert werden.

Hinweise:

- `gateway status` bleibt für Diagnose verfügbar, auch wenn die lokale CLI-Konfiguration fehlt oder ungültig ist.
- `gateway status` löst konfigurierte Auth-SecretRefs für Probe-Auth nach Möglichkeit auf.
- Wenn ein erforderlicher Auth-SecretRef in diesem Befehlsausführungspfad nicht aufgelöst ist, meldet `gateway status --json` `rpc.authWarning`, wenn Probe-Konnektivität/Auth fehlschlägt; übergeben Sie `--token`/`--password` explizit oder lösen Sie zuerst die Secret-Quelle auf.
- Wenn der Probe erfolgreich ist, werden Warnungen zu nicht aufgelösten Auth-Referenzen unterdrückt, um Fehlalarme zu vermeiden.
- Verwenden Sie `--require-rpc` in Skripten und Automatisierung, wenn ein lauschender Dienst allein nicht ausreicht und Sie möchten, dass das Gateway-RPC selbst gesund ist.
- `--deep` ergänzt einen Best-Effort-Scan nach zusätzlichen launchd-/systemd-/schtasks-Installationen. Wenn mehrere gatewayähnliche Dienste erkannt werden, gibt die menschenlesbare Ausgabe Hinweise zur Bereinigung aus und warnt, dass die meisten Setups ein Gateway pro Maschine ausführen sollten.
- Die menschenlesbare Ausgabe enthält den aufgelösten Dateilogpfad sowie den Snapshot der Konfigurationspfade/-gültigkeit von CLI vs. Dienst, um Profil- oder State-Dir-Drift zu diagnostizieren.
- Bei Linux-systemd-Installationen lesen Prüfungen auf Dienst-Auth-Drift sowohl `Environment=`- als auch `EnvironmentFile=`-Werte aus der Unit (einschließlich `%h`, Anführungszeichen, mehrerer Dateien und optionaler `-`-Dateien).
- Drift-Prüfungen lösen `gateway.auth.token`-SecretRefs mithilfe der zusammengeführten Laufzeitumgebung auf (zuerst Dienstbefehlsumgebung, dann Fallback auf Prozessumgebung).
- Wenn Token-Auth effektiv nicht aktiv ist (expliziter `gateway.auth.mode` von `password`/`none`/`trusted-proxy` oder nicht gesetzter Modus, bei dem Passwort gewinnen kann und kein Token-Kandidat gewinnen kann), überspringen Token-Drift-Prüfungen die Auflösung des Konfigurationstokens.

### `gateway probe`

`gateway probe` ist der Befehl „alles debuggen“. Er prüft immer:

- Ihr konfiguriertes entferntes Gateway (falls gesetzt) und
- localhost (local loopback) **auch dann, wenn Remote konfiguriert ist**.

Wenn Sie `--url` übergeben, wird dieses explizite Ziel vor beiden hinzugefügt. Die menschenlesbare Ausgabe beschriftet die
Ziele wie folgt:

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
- `RPC: ok` bedeutet, dass Detail-RPC-Aufrufe (`health`/`status`/`system-presence`/`config.get`) ebenfalls erfolgreich waren.
- `RPC: limited - missing scope: operator.read` bedeutet, dass die Verbindung erfolgreich war, Detail-RPC aber durch fehlenden Operator-Scope eingeschränkt war. Dies wird als **degradierte** Erreichbarkeit gemeldet, nicht als vollständiger Fehler.
- Der Exit-Code ist nur dann ungleich null, wenn keines der geprüften Ziele erreichbar ist.

JSON-Hinweise (`--json`):

- Oberste Ebene:
  - `ok`: mindestens ein Ziel ist erreichbar.
  - `degraded`: mindestens ein Ziel hatte scope-eingeschränktes Detail-RPC.
  - `primaryTargetId`: bestes Ziel, das in dieser Reihenfolge als aktiver Gewinner behandelt werden soll: explizite URL, SSH-Tunnel, konfiguriertes Remote, dann lokales loopback.
  - `warnings[]`: Best-Effort-Warnungsdatensätze mit `code`, `message` und optionalen `targetIds`.
  - `network`: lokale loopback-/tailnet-URL-Hinweise, abgeleitet aus aktueller Konfiguration und Host-Netzwerk.
  - `discovery.timeoutMs` und `discovery.count`: das tatsächliche Discovery-Budget/Ergebnisanzahl, die für diesen Probe-Durchlauf verwendet wurden.
- Pro Ziel (`targets[].connect`):
  - `ok`: Erreichbarkeit nach Verbindung + degradierter Klassifizierung.
  - `rpcOk`: vollständiger Erfolg des Detail-RPC.
  - `scopeLimited`: Detail-RPC ist wegen fehlendem Operator-Scope fehlgeschlagen.

Häufige Warncodes:

- `ssh_tunnel_failed`: Einrichtung des SSH-Tunnels ist fehlgeschlagen; der Befehl ist auf direkte Probes zurückgefallen.
- `multiple_gateways`: mehr als ein Ziel war erreichbar; das ist ungewöhnlich, außer wenn Sie absichtlich isolierte Profile ausführen, etwa einen Rescue-Bot.
- `auth_secretref_unresolved`: ein konfigurierter Auth-SecretRef konnte für ein fehlgeschlagenes Ziel nicht aufgelöst werden.
- `probe_scope_limited`: WebSocket-Verbindung war erfolgreich, aber Detail-RPC war durch fehlenden `operator.read` eingeschränkt.

#### Remote über SSH (Parity zur Mac-App)

Der Modus „Remote over SSH“ der macOS-App verwendet einen lokalen Port-Forward, damit das entfernte Gateway (das möglicherweise nur an loopback gebunden ist) unter `ws://127.0.0.1:<port>` erreichbar wird.

CLI-Äquivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Optionen:

- `--ssh <target>`: `user@host` oder `user@host:port` (Port ist standardmäßig `22`).
- `--ssh-identity <path>`: Identity-Datei.
- `--ssh-auto`: den zuerst erkannten Gateway-Host als SSH-Ziel vom aufgelösten
  Discovery-Endpunkt auswählen (`local.` plus die konfigurierte Wide-Area-Domain, falls vorhanden). Reine TXT-Hinweise werden ignoriert.

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
- `--expect-final` ist hauptsächlich für Agenten-artige RPCs gedacht, die vor einer finalen Payload Zwischenereignisse streamen.

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
- Wenn Token-Auth ein Token erfordert und `gateway.auth.token` über SecretRef verwaltet wird, validiert `gateway install`, dass der SecretRef auflösbar ist, speichert das aufgelöste Token aber nicht in den Umgebungsmetadaten des Dienstes.
- Wenn Token-Auth ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt die Installation fail-closed fehl, statt Fallback-Klartext zu speichern.
- Für Passwort-Auth bei `gateway run` sollten Sie `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oder ein SecretRef-gestütztes `gateway.auth.password` gegenüber Inline-`--password` bevorzugen.
- Im abgeleiteten Auth-Modus lockert ein nur in der Shell gesetztes `OPENCLAW_GATEWAY_PASSWORD` die Installationsanforderungen an Tokens nicht; verwenden Sie dauerhafte Konfiguration (`gateway.auth.password` oder Konfigurations-`env`), wenn Sie einen verwalteten Dienst installieren.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, wird die Installation blockiert, bis der Modus explizit gesetzt ist.
- Lifecycle-Befehle akzeptieren `--json` für Skripting.

## Gateways erkennen (Bonjour)

`gateway discover` scannt nach Gateway-Beacons (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): eine Domain wählen (Beispiel: `openclaw.internal.`) und Split-DNS + einen DNS-Server einrichten; siehe [/gateway/bonjour](/gateway/bonjour)

Nur Gateways mit aktivierter Bonjour-Erkennung (Standard) kündigen den Beacon an.

Wide-Area-Discovery-Datensätze enthalten (TXT):

- `role` (Hinweis auf Gateway-Rolle)
- `transport` (Transporthinweis, z. B. `gateway`)
- `gatewayPort` (WebSocket-Port, normalerweise `18789`)
- `sshPort` (optional; Clients verwenden standardmäßig `22` für SSH-Ziele, wenn er fehlt)
- `tailnetDns` (MagicDNS-Hostname, wenn verfügbar)
- `gatewayTls` / `gatewayTlsSha256` (TLS aktiviert + Zertifikat-Fingerprint)
- `cliPath` (Hinweis zur Remote-Installation, in die Wide-Area-Zone geschrieben)

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
- `wsUrl` in der JSON-Ausgabe wird vom aufgelösten Dienstendpunkt abgeleitet, nicht aus reinen TXT-Hinweisen wie `lanHost` oder `tailnetDns`.
- Bei `local.`-mDNS werden `sshPort` und `cliPath` nur gesendet, wenn
  `discovery.mdns.mode` auf `full` steht. Wide-Area DNS-SD schreibt weiterhin `cliPath`; `sshPort`
  bleibt auch dort optional.
