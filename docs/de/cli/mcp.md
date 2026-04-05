---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Kanälen verbinden
    - '`openclaw mcp serve` ausführen'
    - In OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
summary: OpenClaw-Kanalunterhaltungen über MCP verfügbar machen und gespeicherte MCP-Serverdefinitionen verwalten
title: mcp
x-i18n:
    generated_at: "2026-04-05T12:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw als MCP-Server mit `openclaw mcp serve` ausführen
- Von OpenClaw verwaltete ausgehende MCP-Serverdefinitionen mit `list`, `show`,
  `set` und `unset` verwalten

Mit anderen Worten:

- `serve` bedeutet, dass OpenClaw als MCP-Server agiert
- `list` / `show` / `set` / `unset` bedeutet, dass OpenClaw als clientseitige
  Registry für andere MCP-Server agiert, die seine Laufzeiten später möglicherweise verwenden

Verwenden Sie [`openclaw acp`](/cli/acp), wenn OpenClaw selbst eine Coding-Harness-
Sitzung hosten und diese Laufzeit über ACP routen soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

## Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit von OpenClaw
  unterstützten Kanalunterhaltungen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw-Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert,
  anstatt separate Bridges pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/cli/acp), wenn OpenClaw die Coding-
Laufzeit selbst hosten und die Agent-Sitzung innerhalb von OpenClaw behalten soll.

## So funktioniert es

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt
diesen Prozess. Während der Client die stdio-Sitzung offen hält, verbindet sich die Bridge über WebSocket mit einem
lokalen oder entfernten OpenClaw-Gateway und macht geroutete Kanal-
Unterhaltungen über MCP verfügbar.

Lebenszyklus:

1. der MCP-Client startet `openclaw mcp serve`
2. die Bridge verbindet sich mit dem Gateway
3. geroutete Sitzungen werden zu MCP-Unterhaltungen und Transcript-/Verlaufs-Tools
4. Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, solange die Bridge verbunden ist
5. wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch
   Claude-spezifische Push-Benachrichtigungen empfangen

Wichtiges Verhalten:

- der Status der Live-Warteschlange beginnt, wenn sich die Bridge verbindet
- älterer Transcript-Verlauf wird mit `messages_read` gelesen
- Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
- wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Warteschlange geht verloren

## Einen Client-Modus wählen

Verwenden Sie dieselbe Bridge auf zwei verschiedene Arten:

- Generische MCP-Clients: nur Standard-MCP-Tools. Verwenden Sie `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` und die
  Genehmigungs-Tools.
- Claude Code: Standard-MCP-Tools plus den Claude-spezifischen Kanaladapter.
  Aktivieren Sie `--claude-channel-mode on` oder belassen Sie den Standard `auto`.

Derzeit verhält sich `auto` genauso wie `on`. Es gibt noch keine
Client-Fähigkeitserkennung.

## Was `serve` verfügbar macht

Die Bridge verwendet vorhandene Routing-Metadaten von Gateway-Sitzungen, um kanalgestützte
Unterhaltungen verfügbar zu machen. Eine Unterhaltung erscheint, wenn OpenClaw bereits Sitzungsstatus
mit einer bekannten Route hat, wie zum Beispiel:

- `channel`
- Empfänger- oder Ziel-Metadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients einen Ort, an dem sie:

- aktuelle geroutete Unterhaltungen auflisten
- aktuellen Transcript-Verlauf lesen
- auf neue eingehende Ereignisse warten
- eine Antwort über dieselbe Route zurücksenden
- Genehmigungsanfragen sehen, die eintreffen, solange die Bridge verbunden ist

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

Listet aktuelle sitzungsgestützte Unterhaltungen auf, die bereits Routing-Metadaten im
Gateway-Sitzungsstatus haben.

Nützliche Filter:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Gibt eine Unterhaltung anhand von `session_key` zurück.

### `messages_read`

Liest aktuelle Transcript-Nachrichten für eine sitzungsgestützte Unterhaltung.

### `attachments_fetch`

Extrahiert nicht-textuelle Nachrichteninhaltsblöcke aus einer Transcript-Nachricht. Dies ist eine
Metadatenansicht über den Transcript-Inhalt, kein eigenständiger dauerhafter Attachment-
Blob-Store.

### `events_poll`

Liest in die Warteschlange gestellte Live-Ereignisse ab einem numerischen Cursor.

### `events_wait`

Führt Long-Polling aus, bis das nächste passende Ereignis in der Warteschlange eintrifft oder ein Timeout abläuft.

Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung ohne ein
Claude-spezifisches Push-Protokoll benötigt.

### `messages_send`

Sendet Text über dieselbe Route zurück, die bereits für die Sitzung gespeichert ist.

Aktuelles Verhalten:

- erfordert eine vorhandene Unterhaltungsroute
- verwendet den Kanal, den Empfänger, die Account-ID und die Thread-ID der Sitzung
- sendet nur Text

### `permissions_list_open`

Listet ausstehende Genehmigungsanfragen für exec/Plugins auf, die die Bridge beobachtet hat, seit sie
mit dem Gateway verbunden wurde.

### `permissions_respond`

Löst eine ausstehende Genehmigungsanfrage für exec/Plugins auf mit:

- `allow-once`
- `allow-always`
- `deny`

## Ereignismodell

Die Bridge hält eine Ereigniswarteschlange im Speicher, solange sie verbunden ist.

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

## Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen verfügbar machen. Dies ist das
OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standard-MCP-Tools bleiben verfügbar, aber
live eingehende Nachrichten können zusätzlich als Claude-spezifische MCP-
Benachrichtigungen eintreffen.

Flags:

- `--claude-channel-mode off`: nur Standard-MCP-Tools
- `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren
- `--claude-channel-mode auto`: aktueller Standard; gleiches Bridge-Verhalten wie `on`

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-
Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende Transcript-Nachrichten vom Typ `user` werden weitergeleitet als
  `notifications/claude/channel`
- über MCP empfangene Claude-Genehmigungsanfragen werden im Speicher nachverfolgt
- wenn die verknüpfte Unterhaltung später `yes abcde` oder `no abcde` sendet, wandelt die Bridge
  dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für Live-Sitzungen; wenn der MCP-Client die Verbindung trennt,
  gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die
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

Für die meisten generischen MCP-Clients sollten Sie mit der Standard-Tool-Oberfläche beginnen und
den Claude-Modus ignorieren. Aktivieren Sie den Claude-Modus nur für Clients, die die
Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

## Optionen

`openclaw mcp serve` unterstützt:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--token-file <path>`: Token aus Datei lesen
- `--password <password>`: Gateway-Passwort
- `--password-file <path>`: Passwort aus Datei lesen
- `--claude-channel-mode <auto|on|off>`: Claude-Benachrichtigungsmodus
- `-v`, `--verbose`: ausführliche Logs auf stderr

Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber inline angegebenen Secrets.

## Sicherheit und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie macht nur Unterhaltungen verfügbar, die das Gateway
bereits routen kann.

Das bedeutet:

- Absender-Allowlists, Pairing und Vertrauen auf Kanalebene gehören weiterhin zur
  zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- Genehmigungsstatus ist nur live/im Speicher für die aktuelle Bridge-Sitzung vorhanden
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie
  auch für jeden anderen entfernten Gateway-Client vertrauen würden

Wenn eine Unterhaltung in `conversations_list` fehlt, liegt die Ursache normalerweise nicht an der
MCP-Konfiguration. Es fehlen oder es gibt unvollständige Routing-Metadaten in der zugrunde liegenden
Gateway-Sitzung.

## Tests

OpenClaw liefert einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen vorbereiteten Gateway-Container
- startet einen zweiten Container, der `openclaw mcp serve` ausführt
- verifiziert Unterhaltungserkennung, Transcript-Lesevorgänge, Attachment-Metadaten-Lesevorgänge,
  Verhalten der Live-Ereigniswarteschlange und das Routing ausgehender Sendungen
- validiert Claude-artige Kanal- und Genehmigungsbenachrichtigungen über die echte
  stdio-MCP-Bridge

Dies ist der schnellste Weg, um nachzuweisen, dass die Bridge funktioniert, ohne ein echtes
Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für breiteren Testkontext siehe [Testing](/help/testing).

## Fehlerbehebung

### Keine Unterhaltungen zurückgegeben

Bedeutet normalerweise, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die
zugrunde liegende Sitzung gespeicherte Kanal-/Provider-, Empfänger- und optionale
Account-/Thread-Routing-Metadaten hat.

### `events_poll` oder `events_wait` verpasst ältere Nachrichten

Erwartet. Die Live-Warteschlange beginnt, wenn sich die Bridge verbindet. Lesen Sie älteren Transcript-
Verlauf mit `messages_read`.

### Claude-Benachrichtigungen werden nicht angezeigt

Prüfen Sie alle folgenden Punkte:

- der Client hat die stdio-MCP-Sitzung offen gehalten
- `--claude-channel-mode` ist `on` oder `auto`
- der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
- die eingehende Nachricht ist passiert, nachdem sich die Bridge verbunden hatte

### Genehmigungen fehlen

`permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge
verbunden war. Es ist keine dauerhafte API für den Genehmigungsverlauf.

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle machen OpenClaw nicht über MCP verfügbar. Sie verwalten von OpenClaw verwaltete MCP-
Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeiten gedacht, die OpenClaw später startet oder konfiguriert,
zum Beispiel eingebettetes Pi und andere Laufzeitadapter. OpenClaw speichert die
Definitionen zentral, damit diese Laufzeiten keine eigenen doppelten
MCP-Serverlisten pflegen müssen.

Wichtiges Verhalten:

- diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
- sie verbinden sich nicht mit dem Ziel-MCP-Server
- sie validieren nicht, ob der Befehl, die URL oder der entfernte Transport
  aktuell erreichbar ist
- Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen

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
- `set` erwartet einen JSON-Objektwert in der Befehlszeile.
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

Startet einen lokalen Child-Prozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                         |
| -------------------------- | ------------------------------------ |
| `command`                  | Auszuführbare Datei zum Starten (erforderlich) |
| `args`                     | Array von Befehlszeilenargumenten    |
| `env`                      | Zusätzliche Umgebungsvariablen       |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess   |

### SSE-/HTTP-Transport

Verbindet sich über HTTP Server-Sent Events mit einem entfernten MCP-Server.

| Feld                 | Beschreibung                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `url`                | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)        |
| `headers`            | Optionale Key-Value-Zuordnung von HTTP-Headern (zum Beispiel Auth-Tokens) |
| `connectionTimeoutMs` | Verbindungstimeout pro Server in ms (optional)                   |

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

Sensible Werte in `url` (userinfo) und `headers` werden in Logs und
Statusausgaben redigiert.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Es verwendet HTTP-Streaming für die bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                 | Beschreibung                                                                            |
| -------------------- | --------------------------------------------------------------------------------------- |
| `url`                | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                              |
| `transport`          | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`            | Optionale Key-Value-Zuordnung von HTTP-Headern (zum Beispiel Auth-Tokens)               |
| `connectionTimeoutMs` | Verbindungstimeout pro Server in ms (optional)                                         |

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

Diese Befehle verwalten nur gespeicherte Konfiguration. Sie starten nicht die Kanal-Bridge,
öffnen keine Live-MCP-Client-Sitzung und weisen nicht nach, dass der Zielserver erreichbar ist.

## Aktuelle Grenzen

Diese Seite dokumentiert die Bridge in ihrer heutigen Auslieferungsform.

Aktuelle Grenzen:

- die Unterhaltungserkennung hängt von vorhandenen Routing-Metadaten der Gateway-Sitzung ab
- es gibt noch kein generisches Push-Protokoll jenseits des Claude-spezifischen Adapters
- es gibt noch keine Tools zum Bearbeiten von Nachrichten oder zum Reagieren
- der HTTP/SSE/streamable-http-Transport verbindet sich mit einem einzelnen entfernten Server; es gibt noch kein multiplexiertes Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge
  verbunden war
