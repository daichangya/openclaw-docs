---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Channels verbinden
    - '`openclaw mcp serve` ausführen'
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
summary: OpenClaw-Channel-Konversationen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-04-24T06:31:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete ausgehende MCP-Serverdefinitionen mit `list`, `show`,
  `set` und `unset` verwalten

Mit anderen Worten:

- `serve` bedeutet, dass OpenClaw als MCP-Server fungiert
- `list` / `show` / `set` / `unset` bedeutet, dass OpenClaw als clientseitige
  Registry für andere MCP-Server fungiert, die seine Runtimes später nutzen können

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-
Sitzung hosten und diese Runtime über ACP routen soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

## Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit
  von OpenClaw unterstützten Channel-Konversationen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der über OpenClaws Channel-Backends hinweg funktioniert,
  statt separate Bridges pro Channel auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-
Runtime selbst hosten und die Agentensitzung innerhalb von OpenClaw halten soll.

## Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen
Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge
über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt
geroutete Channel-Konversationen über MCP bereit.

Lebenszyklus:

1. Der MCP-Client startet `openclaw mcp serve`
2. die Bridge verbindet sich mit dem Gateway
3. geroutete Sitzungen werden zu MCP-Konversationen sowie zu Transcript-/Verlauf-Tools
4. Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, solange die Bridge verbunden ist
5. wenn der Claude-Channel-Modus aktiviert ist, kann dieselbe Sitzung auch
   Claude-spezifische Push-Benachrichtigungen empfangen

Wichtiges Verhalten:

- der Zustand der Live-Warteschlange beginnt, wenn die Bridge eine Verbindung aufbaut
- älterer Transcript-Verlauf wird mit `messages_read` gelesen
- Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
- wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Warteschlange geht verloren
- von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden
  beim Herunterfahren als Prozesstree beendet, sodass von dem
  Server gestartete Kindprozesse nicht fortbestehen, nachdem der übergeordnete stdio-Client beendet wurde
- das Löschen oder Zurücksetzen einer Sitzung gibt die MCP-Clients dieser Sitzung über
  den gemeinsamen Runtime-Bereinigungspfad frei, sodass keine verbleibenden stdio-Verbindungen
  an eine entfernte Sitzung gebunden bleiben

## Einen Client-Modus wählen

Verwenden Sie dieselbe Bridge auf zwei verschiedene Arten:

- Generische MCP-Clients: nur Standard-MCP-Tools. Verwenden Sie `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` und die
  Genehmigungstools.
- Claude Code: Standard-MCP-Tools plus den Claude-spezifischen Channel-Adapter.
  Aktivieren Sie `--claude-channel-mode on` oder belassen Sie den Standardwert `auto`.

Derzeit verhält sich `auto` genauso wie `on`. Eine Erkennung von Client-Fähigkeiten
gibt es noch nicht.

## Was `serve` bereitstellt

Die Bridge verwendet vorhandene Session-Routenmetadaten des Gateway, um durch
Channel gestützte Konversationen bereitzustellen. Eine Konversation erscheint,
wenn OpenClaw bereits Sitzungszustand mit einer bekannten Route hat, etwa:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Damit haben MCP-Clients einen zentralen Ort, um:

- aktuelle geroutete Konversationen aufzulisten
- aktuellen Transcript-Verlauf zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Genehmigungsanfragen zu sehen, die eingehen, solange die Bridge verbunden ist

## Verwendung

```bash
# Lokales Gateway
openclaw mcp serve

# Entferntes Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Entferntes Gateway mit Passwortauthentifizierung
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ausführliche Bridge-Logs aktivieren
openclaw mcp serve --verbose

# Claude-spezifische Push-Benachrichtigungen deaktivieren
openclaw mcp serve --claude-channel-mode off
```

## Bridge-Tools

Die aktuelle Bridge stellt diese MCP-Tools bereit:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Listet aktuelle sitzungsbasierte Konversationen auf, die bereits Routenmetadaten im
Gateway-Sitzungszustand haben.

Nützliche Filter:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Gibt eine Konversation anhand von `session_key` zurück.

### `messages_read`

Liest aktuelle Transcript-Nachrichten für eine sitzungsbasierte Konversation.

### `attachments_fetch`

Extrahiert Inhaltsblöcke ohne Text aus einer Transcript-Nachricht. Dies ist eine
Metadatenansicht über den Transcript-Inhalt, kein eigenständiger dauerhafter
Attachment-Blob-Store.

### `events_poll`

Liest Warteschlangen-Live-Ereignisse ab einem numerischen Cursor.

### `events_wait`

Führt Long Polling durch, bis das nächste passende Warteschlangenereignis eintrifft
oder ein Timeout abläuft.

Verwenden Sie dies, wenn ein generischer MCP-Client eine Zustellung nahezu in Echtzeit
ohne Claude-spezifisches Push-Protokoll benötigt.

### `messages_send`

Sendet Text über dieselbe Route zurück, die bereits in der Sitzung gespeichert ist.

Aktuelles Verhalten:

- erfordert eine vorhandene Konversationsroute
- verwendet den Channel, Empfänger, die Konto-ID und die Thread-ID der Sitzung
- sendet nur Text

### `permissions_list_open`

Listet ausstehende Exec-/Plugin-Genehmigungsanfragen auf, die die Bridge seit
ihrer Verbindung mit dem Gateway beobachtet hat.

### `permissions_respond`

Löst eine ausstehende Exec-/Plugin-Genehmigungsanfrage auf mit:

- `allow-once`
- `allow-always`
- `deny`

## Ereignismodell

Die Bridge führt eine Ereigniswarteschlange im Speicher, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Wichtige Grenzen:

- die Warteschlange ist nur live; sie beginnt, wenn die MCP-Bridge startet
- `events_poll` und `events_wait` spielen älteren Gateway-Verlauf nicht
  selbstständig erneut ab
- dauerhafter Rückstand sollte mit `messages_read` gelesen werden

## Claude-Channel-Benachrichtigungen

Die Bridge kann auch Claude-spezifische Channel-Benachrichtigungen bereitstellen.
Das ist das OpenClaw-Äquivalent zu einem Claude-Code-Channel-Adapter: Standard-MCP-Tools
bleiben verfügbar, aber Live-Nachrichten eingehend können zusätzlich als
Claude-spezifische MCP-Benachrichtigungen eintreffen.

Flags:

- `--claude-channel-mode off`: nur Standard-MCP-Tools
- `--claude-channel-mode on`: Claude-Channel-Benachrichtigungen aktivieren
- `--claude-channel-mode auto`: aktueller Standard; gleiches Bridge-Verhalten wie `on`

Wenn der Claude-Channel-Modus aktiviert ist, meldet der Server experimentelle
Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transcript-Nachrichten werden weitergeleitet als
  `notifications/claude/channel`
- über MCP empfangene Claude-Berechtigungsanfragen werden im Speicher nachverfolgt
- wenn die verknüpfte Konversation später `yes abcde` oder `no abcde` sendet, wandelt die Bridge
  dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die Live-Sitzung; wenn der MCP-Client die Verbindung trennt,
  gibt es kein Push-Ziel

Dies ist bewusst clientspezifisch. Generische MCP-Clients sollten sich auf die
Standard-Polling-Tools verlassen.

## MCP-Client-Konfiguration

Beispiel für eine stdio-Client-Konfiguration:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Für die meisten generischen MCP-Clients beginnen Sie mit der Standard-Tool-Oberfläche
und ignorieren den Claude-Modus. Aktivieren Sie den Claude-Modus nur für Clients,
die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

## Optionen

`openclaw mcp serve` unterstützt:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--token-file <path>`: Token aus Datei lesen
- `--password <password>`: Gateway-Passwort
- `--password-file <path>`: Passwort aus Datei lesen
- `--claude-channel-mode <auto|on|off>`: Claude-Benachrichtigungsmodus
- `-v`, `--verbose`: ausführliche Logs auf stderr

Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber Inline-Secrets.

## Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, die das Gateway
bereits routen kann.

Das bedeutet:

- Absender-Allowlists, Pairing und Vertrauen auf Channel-Ebene gehören weiterhin zur
  zugrunde liegenden OpenClaw-Channel-Konfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungszustand ist nur live/im Speicher für die aktuelle Bridge-Sitzung
- für die Bridge-Authentifizierung sollten dieselben Gateway-Token- oder Passwortkontrollen verwendet werden,
  denen Sie auch bei jedem anderen entfernten Gateway-Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, ist die übliche Ursache nicht die
MCP-Konfiguration. Es sind fehlende oder unvollständige Routenmetadaten in der
zugrunde liegenden Gateway-Sitzung.

## Tests

OpenClaw liefert einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen vorbereiteten Gateway-Container
- startet einen zweiten Container, der `openclaw mcp serve` startet
- überprüft Konversationserkennung, Transcript-Lesevorgänge, Attachment-Metadaten-Lesevorgänge,
  Verhalten der Live-Ereigniswarteschlange und Routing ausgehender Sendungen
- validiert Claude-ähnliche Channel- und Berechtigungsbenachrichtigungen über die echte
  stdio-MCP-Bridge

Dies ist der schnellste Weg, um nachzuweisen, dass die Bridge funktioniert, ohne ein echtes
Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für weiteren Testkontext siehe [Testing](/de/help/testing).

## Fehlerbehebung

### Keine Konversationen zurückgegeben

Das bedeutet normalerweise, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die
zugrunde liegende Sitzung gespeicherte Channel-/Anbieter-, Empfänger- und optionale
Konto-/Thread-Routenmetadaten hat.

### `events_poll` oder `events_wait` verpasst ältere Nachrichten

Erwartetes Verhalten. Die Live-Warteschlange beginnt, wenn die Bridge eine Verbindung aufbaut. Lesen Sie älteren Transcript-
Verlauf mit `messages_read`.

### Claude-Benachrichtigungen werden nicht angezeigt

Prüfen Sie alle folgenden Punkte:

- der Client hat die stdio-MCP-Sitzung offen gehalten
- `--claude-channel-mode` ist `on` oder `auto`
- der Client versteht tatsächlich die Claude-spezifischen Benachrichtigungsmethoden
- die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingetroffen

### Genehmigungen fehlen

`permissions_list_open` zeigt nur Genehmigungsanfragen, die beobachtet wurden, während die Bridge
verbunden war. Es ist keine API für einen dauerhaften Genehmigungsverlauf.

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-
Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Runtimes gedacht, die OpenClaw später startet oder konfiguriert,
etwa eingebettete Pi und andere Runtime-Adapter. OpenClaw speichert die Definitionen zentral,
damit diese Runtimes keine eigenen doppelten MCP-Serverlisten führen müssen.

Wichtiges Verhalten:

- diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
- sie verbinden sich nicht mit dem Ziel-MCP-Server
- sie validieren nicht, ob der Befehl, die URL oder der entfernte Transport
  derzeit erreichbar ist
- Runtime-Adapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
- eingebettetes Pi stellt konfigurierte MCP-Tools in normalen Tool-Profilen für `coding` und `messaging` bereit;
  `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie explizit

## Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine leichtgewichtige MCP-Server-Registry in der Konfiguration für Oberflächen,
die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert Servernamen.
- `show` ohne Namen gibt das vollständig konfigurierte MCP-Serverobjekt aus.
- `set` erwartet genau einen JSON-Objektwert in der Befehlszeile.
- `unset` schlägt fehl, wenn der benannte Server nicht existiert.

Beispiele:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Beispiel für die Konfigurationsstruktur:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio-Transport

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                        |
| -------------------------- | ----------------------------------- |
| `command`                  | Ausführbare Datei, die gestartet wird (erforderlich) |
| `args`                     | Array mit Befehlszeilenargumenten   |
| `env`                      | Zusätzliche Umgebungsvariablen      |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess  |

#### Sicherheitsfilter für Stdio-env

OpenClaw lehnt Env-Schlüssel für den Interpreter-Start ab, die verändern können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Laufzeitsteuerungsvariablen. Der Start lehnt diese mit einem Konfigurationsfehler ab, damit sie kein implizites Prelude einschleusen, den Interpreter austauschen oder einen Debugger gegen den stdio-Prozess aktivieren können. Normale Anmeldedaten-, Proxy- und serverspezifische Umgebungsvariablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) bleiben unbeeinflusst.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt unter `env` des stdio-Servers.

### SSE-/HTTP-Transport

Verbindet sich über HTTP Server-Sent Events mit einem entfernten MCP-Server.

| Feld                  | Beschreibung                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)         |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Auth-Tokens) |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                    |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und in der
Statusausgabe geschwärzt.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Sie verwendet HTTP-Streaming für bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                  | Beschreibung                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                               |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Auth-Tokens)          |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                                          |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Diese Befehle verwalten nur die gespeicherte Konfiguration. Sie starten nicht die Channel-Bridge,
öffnen keine Live-MCP-Client-Sitzung und beweisen nicht, dass der Zielserver erreichbar ist.

## Aktuelle Grenzen

Diese Seite dokumentiert die Bridge in ihrem heutigen Auslieferungszustand.

Aktuelle Grenzen:

- die Konversationserkennung hängt von vorhandenen Gateway-Sitzungsroutenmetadaten ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder Reagieren
- HTTP/SSE/streamable-http-Transport verbindet sich mit einem einzelnen entfernten Server; noch kein multiplexter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge
  verbunden war

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
