---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Kanälen verbinden
    - Ausführen von `openclaw mcp serve`
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
summary: OpenClaw-Kanalunterhaltungen über MCP verfügbar machen und gespeicherte MCP-Serverdefinitionen verwalten
title: mcp
x-i18n:
    generated_at: "2026-04-23T14:00:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
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
  Registry für andere MCP-Server agiert, die seine Laufzeitumgebungen später verwenden können

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-
Sitzung hosten und diese Laufzeit über ACP weiterleiten soll.

## OpenClaw als MCP-Server

Das ist der Pfad `openclaw mcp serve`.

## Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit von OpenClaw
  unterstützten Kanalunterhaltungen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit weitergeleiteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert,
  statt separate Brücken pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-
Laufzeit selbst hosten und die Agent-Sitzung innerhalb von OpenClaw halten soll.

## So funktioniert es

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen
Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Brücke
über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt
weitergeleitete Kanalunterhaltungen über MCP bereit.

Lebenszyklus:

1. Der MCP-Client startet `openclaw mcp serve`
2. Die Brücke verbindet sich mit dem Gateway
3. Weitergeleitete Sitzungen werden zu MCP-Unterhaltungen sowie Transkript-/Verlaufs-Tools
4. Live-Ereignisse werden im Speicher in die Warteschlange gestellt, solange die Brücke verbunden ist
5. Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung außerdem
   Claude-spezifische Push-Benachrichtigungen empfangen

Wichtiges Verhalten:

- Der Zustand der Live-Warteschlange beginnt, wenn die Brücke sich verbindet
- Älterer Transkriptverlauf wird mit `messages_read` gelesen
- Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
- Wenn der Client die Verbindung trennt, beendet sich die Brücke und die Live-Warteschlange geht verloren
- Von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden
  beim Herunterfahren als Prozessbaum beendet, sodass von dem Server gestartete
  Kindprozesse nicht weiterlaufen, nachdem der übergeordnete stdio-Client beendet wurde
- Das Löschen oder Zurücksetzen einer Sitzung entsorgt die MCP-Clients dieser Sitzung über
  den gemeinsamen Laufzeit-Bereinigungspfad, sodass keine verbleibenden stdio-Verbindungen
  an eine entfernte Sitzung gebunden bleiben

## Einen Client-Modus auswählen

Verwenden Sie dieselbe Brücke auf zwei unterschiedliche Arten:

- Generische MCP-Clients: nur Standard-MCP-Tools. Verwenden Sie `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` und die
  Freigabe-Tools.
- Claude Code: Standard-MCP-Tools plus den Claude-spezifischen Kanaladapter.
  Aktivieren Sie `--claude-channel-mode on` oder belassen Sie den Standardwert `auto`.

Heute verhält sich `auto` genauso wie `on`. Es gibt noch keine
Client-Fähigkeitserkennung.

## Was `serve` bereitstellt

Die Brücke verwendet vorhandene Sitzungsrouten-Metadaten des Gateway, um
kanalgestützte Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn
OpenClaw bereits Sitzungszustand mit einer bekannten Route hat, etwa:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Damit erhalten MCP-Clients eine zentrale Stelle, um:

- aktuelle weitergeleitete Unterhaltungen aufzulisten
- aktuellen Transkriptverlauf zu lesen
- auf neue eingehende Live-Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Freigabeanfragen zu sehen, die eintreffen, solange die Brücke verbunden ist

## Verwendung

```bash
# Lokales Gateway
openclaw mcp serve

# Entferntes Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Entferntes Gateway mit Passwortauthentifizierung
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ausführliche Brücken-Logs aktivieren
openclaw mcp serve --verbose

# Claude-spezifische Push-Benachrichtigungen deaktivieren
openclaw mcp serve --claude-channel-mode off
```

## Brücken-Tools

Die aktuelle Brücke stellt diese MCP-Tools bereit:

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

Listet aktuelle sitzungsgestützte Unterhaltungen auf, die bereits Routen-Metadaten
im Gateway-Sitzungszustand haben.

Nützliche Filter:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Gibt eine Unterhaltung anhand von `session_key` zurück.

### `messages_read`

Liest aktuelle Transkriptnachrichten für eine sitzungsgestützte Unterhaltung.

### `attachments_fetch`

Extrahiert Nicht-Text-Nachrichtenblöcke aus einer Transkriptnachricht. Dies ist
eine Metadatenansicht über Transkriptinhalte, kein eigenständiger dauerhafter
Attachment-Blob-Speicher.

### `events_poll`

Liest in die Warteschlange gestellte Live-Ereignisse seit einem numerischen Cursor.

### `events_wait`

Führt Long-Polling aus, bis das nächste passende Ereignis in der Warteschlange eintrifft
oder ein Timeout abläuft.

Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung
ohne Claude-spezifisches Push-Protokoll benötigt.

### `messages_send`

Sendet Text über dieselbe Route zurück, die bereits in der Sitzung gespeichert ist.

Aktuelles Verhalten:

- erfordert eine vorhandene Unterhaltungsroute
- verwendet Kanal, Empfänger, Account-ID und Thread-ID der Sitzung
- sendet nur Text

### `permissions_list_open`

Listet ausstehende Freigabeanfragen für Exec/Plugin auf, die die Brücke seit ihrer
Verbindung zum Gateway beobachtet hat.

### `permissions_respond`

Löst eine ausstehende Freigabeanfrage für Exec/Plugin auf mit:

- `allow-once`
- `allow-always`
- `deny`

## Ereignismodell

Die Brücke hält eine In-Memory-Ereigniswarteschlange, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Wichtige Einschränkungen:

- die Warteschlange ist nur live; sie beginnt, wenn die MCP-Brücke startet
- `events_poll` und `events_wait` spielen älteren Gateway-Verlauf nicht selbst erneut ab
- dauerhafter Rückstand sollte mit `messages_read` gelesen werden

## Claude-Kanalbenachrichtigungen

Die Brücke kann außerdem Claude-spezifische Kanalbenachrichtigungen bereitstellen. Das ist das
OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standard-MCP-Tools bleiben verfügbar,
aber eingehende Live-Nachrichten können zusätzlich als Claude-spezifische MCP-
Benachrichtigungen ankommen.

Flags:

- `--claude-channel-mode off`: nur Standard-MCP-Tools
- `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren
- `--claude-channel-mode auto`: aktueller Standard; gleiches Brückenverhalten wie `on`

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle
Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Brückenverhalten:

- eingehende Transkriptnachrichten vom Typ `user` werden als
  `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Freigabeanfragen werden im Speicher verfolgt
- wenn die verknüpfte Unterhaltung später `yes abcde` oder `no abcde` sendet, konvertiert
  die Brücke dies zu `notifications/claude/channel/permission`
- diese Benachrichtigungen gelten nur für Live-Sitzungen; wenn der MCP-Client die Verbindung trennt,
  gibt es kein Push-Ziel mehr

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die
Standard-Polling-Tools verlassen.

## MCP-Client-Konfiguration

Beispiel für stdio-Client-Konfiguration:

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

Für die meisten generischen MCP-Clients sollten Sie mit der Standard-Tool-Oberfläche
beginnen und den Claude-Modus ignorieren. Aktivieren Sie den Claude-Modus nur für
Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

## Optionen

`openclaw mcp serve` unterstützt:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--token-file <path>`: Token aus Datei lesen
- `--password <password>`: Gateway-Passwort
- `--password-file <path>`: Passwort aus Datei lesen
- `--claude-channel-mode <auto|on|off>`: Claude-Benachrichtigungsmodus
- `-v`, `--verbose`: ausführliche Logs auf stderr

Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber
inline angegebenen Secrets.

## Sicherheit und Vertrauensgrenze

Die Brücke erfindet keine Weiterleitung. Sie stellt nur Unterhaltungen bereit, die
das Gateway bereits weiterleiten kann.

Das bedeutet:

- Absender-Allowlists, Pairing und kanalbezogenes Vertrauen gehören weiterhin zur
  zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Freigabezustand ist nur live/im Speicher für die aktuelle Brückensitzung vorhanden
- die Authentifizierung der Brücke sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden,
  denen Sie auch für andere entfernte Gateway-Clients vertrauen würden

Wenn eine Unterhaltung in `conversations_list` fehlt, liegt die Ursache normalerweise nicht
an der MCP-Konfiguration. Es fehlen oder unvollständige Routen-Metadaten in der
zugrunde liegenden Gateway-Sitzung sind die übliche Ursache.

## Tests

OpenClaw enthält einen deterministischen Docker-Smoke-Test für diese Brücke:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen vorbereiteten Gateway-Container
- startet einen zweiten Container, der `openclaw mcp serve` ausführt
- prüft Unterhaltungserkennung, Transkriptlesevorgänge, Reads von Anhangsmetadaten,
  Verhalten der Live-Ereigniswarteschlange und Weiterleitung ausgehender Sendungen
- validiert Claude-artige Kanal- und Freigabebenachrichtigungen über die echte
  stdio-MCP-Brücke

Das ist der schnellste Weg, um zu beweisen, dass die Brücke funktioniert, ohne ein echtes
Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für breiteren Testkontext siehe [Testing](/de/help/testing).

## Fehlerbehebung

### Keine Unterhaltungen zurückgegeben

Bedeutet normalerweise, dass die Gateway-Sitzung noch nicht weiterleitbar ist. Bestätigen Sie, dass
die zugrunde liegende Sitzung gespeicherte Routen-Metadaten für Kanal/Provider,
Empfänger und optional Account/Thread enthält.

### `events_poll` oder `events_wait` verpasst ältere Nachrichten

Erwartet. Die Live-Warteschlange beginnt, wenn die Brücke sich verbindet. Lesen Sie älteren
Transkriptverlauf mit `messages_read`.

### Claude-Benachrichtigungen erscheinen nicht

Prüfen Sie alle folgenden Punkte:

- der Client hat die stdio-MCP-Sitzung offen gehalten
- `--claude-channel-mode` ist `on` oder `auto`
- der Client versteht tatsächlich die Claude-spezifischen Benachrichtigungsmethoden
- die eingehende Nachricht ist nach dem Verbinden der Brücke eingetroffen

### Freigaben fehlen

`permissions_list_open` zeigt nur Freigabeanfragen, die beobachtet wurden, während die Brücke
verbunden war. Es ist keine API für dauerhaften Freigabeverlauf.

## OpenClaw als MCP-Client-Registry

Das ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw
verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeitumgebungen gedacht, die OpenClaw später
startet oder konfiguriert, etwa eingebettetes Pi und andere Laufzeitadapter. OpenClaw speichert die
Definitionen zentral, damit diese Laufzeitumgebungen keine eigenen duplizierten
MCP-Serverlisten pflegen müssen.

Wichtiges Verhalten:

- diese Befehle lesen oder schreiben nur OpenClaw-Konfiguration
- sie verbinden sich nicht mit dem Ziel-MCP-Server
- sie validieren nicht, ob Befehl, URL oder Remote-Transport derzeit erreichbar ist
- Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
- eingebettetes Pi stellt konfigurierte MCP-Tools in normalen `coding`- und `messaging`-
  Tool-Profilen bereit; `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]`
  deaktiviert sie explizit

## Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine leichtgewichtige MCP-Server-Registry in der Konfiguration
für Oberflächen, die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

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

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                         |
| -------------------------- | ------------------------------------ |
| `command`                  | Zu startende ausführbare Datei (erforderlich) |
| `args`                     | Array von Befehlszeilenargumenten    |
| `env`                      | Zusätzliche Umgebungsvariablen       |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess   |

#### Stdio-env-Sicherheitsfilter

OpenClaw weist Env-Schlüssel für den Interpreter-Start zurück, die beeinflussen können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Laufzeitsteuerungsvariablen. Beim Start führen diese mit einem Konfigurationsfehler zu einer Zurückweisung, damit sie keine implizite Präambel einschleusen, den Interpreter austauschen oder einen Debugger gegen den stdio-Prozess aktivieren können. Gewöhnliche Anmeldedaten-, Proxy- und serverspezifische Umgebungsvariablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) sind davon nicht betroffen.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt unter `env` des stdio-Servers.

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem entfernten MCP-Server her.

| Feld                  | Beschreibung                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)       |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Tokens) |
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

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und
Statusausgaben geschwärzt.

### Streamable-HTTP-Transport

`streamable-http` ist zusätzlich zu `sse` und `stdio` eine weitere Transportoption. Es verwendet HTTP-Streaming für bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                  | Beschreibung                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                              |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn ausgelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Tokens)                 |
| `connectionTimeoutMs` | Verbindungstimeout pro Server in ms (optional)                                          |

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

Diese Befehle verwalten nur die gespeicherte Konfiguration. Sie starten nicht die Kanalbrücke,
öffnen keine aktive MCP-Client-Sitzung und beweisen nicht, dass der Zielserver erreichbar ist.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Brücke in der heute ausgelieferten Form.

Aktuelle Einschränkungen:

- die Unterhaltungserkennung hängt von vorhandenen Gateway-Sitzungsrouten-Metadaten ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder für Reaktionen
- HTTP-/SSE-/streamable-http-Transport verbindet sich mit einem einzelnen entfernten Server; noch kein multiplexter Upstream
- `permissions_list_open` enthält nur Freigaben, die beobachtet wurden, während die Brücke verbunden ist
