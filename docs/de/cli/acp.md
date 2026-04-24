---
read_when:
    - Einrichten von ACP-basierten IDE-Integrationen
    - Fehlerbehebung bei der ACP-Sitzungsweiterleitung zum Gateway
summary: Die ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-04-24T06:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw-Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket an das Gateway weiter. Dabei bleiben ACP-Sitzungen Gateway-Sitzungsschlüsseln zugeordnet.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständige ACP-native Editor-Laufzeitumgebung. Der Fokus liegt auf Sitzungsweiterleitung, Prompt-Zustellung und grundlegenden Streaming-Updates.

Wenn Sie stattdessen möchten, dass ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen spricht, statt eine ACP-Harness-Sitzung zu hosten, verwenden Sie [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

Diese Seite wird oft mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw fungiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP Agents](/de/tools/acp-agents), bei denen OpenClaw ein externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Faustregel:

- Editor/Client möchte über ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP Agents](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                           | Status        | Hinweise                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementiert | Kern-Bridge-Ablauf über stdio zu Gateway-Chat/-Send + Abbruch.                                                                                                                                                                                      |
| `listSessions`, Slash-Befehle                                         | Implementiert | Die Sitzungsliste arbeitet gegen den Gateway-Sitzungsstatus; Befehle werden über `available_commands_update` angekündigt.                                                                                                                           |
| `loadSession`                                                         | Teilweise     | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt den gespeicherten Textverlauf von Benutzer/Assistant erneut ab. Der Tool-/Systemverlauf wird noch nicht rekonstruiert.                                                |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)               | Teilweise     | Text/Ressourcen werden in die Chat-Eingabe abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                           |
| Sitzungsmodi                                                          | Teilweise     | `session/set_mode` wird unterstützt, und die Bridge stellt anfängliche Gateway-gestützte Sitzungssteuerungen für Thought Level, Tool-Verbosity, Reasoning, Usage Detail und Elevated Actions bereit. Breitere ACP-native Mode-/Konfigurationsoberflächen sind weiterhin nicht im Umfang. |
| Sitzungsinformationen und Usage-Updates                               | Teilweise     | Die Bridge sendet `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots. Die Usage ist näherungsweise und wird nur gesendet, wenn die Gateway-Token-Summen als aktuell markiert sind. |
| Tool-Streaming                                                        | Teilweise     | `tool_call`- / `tool_call_update`-Ereignisse enthalten rohe I/O, Textinhalt und nach bestem Bemühen Dateipfade, wenn Gateway-Tool-Argumente/-Ergebnisse diese preisgeben. Eingebettete Terminals und umfangreichere diff-native Ausgabe werden noch nicht offengelegt. |
| MCP-Server pro Sitzung (`mcpServers`)                                 | Nicht unterstützt | Der Bridge-Modus lehnt MCP-Server-Anfragen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder Agenten.                                                                                                              |
| Dateisystemmethoden des Clients (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt | Die Bridge ruft keine ACP-Client-Dateisystemmethoden auf.                                                                                                                                                                                            |
| Terminal-Methoden des Clients (`terminal/*`)                          | Nicht unterstützt | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs durch Tool-Aufrufe.                                                                                                                                                  |
| Sitzungspläne / Thought-Streaming                                     | Nicht unterstützt | Die Bridge sendet derzeit Ausgabetext und Tool-Status, aber keine ACP-Plan- oder Thought-Updates.                                                                                                                                                  |

## Bekannte Einschränkungen

- `loadSession` spielt den gespeicherten Textverlauf von Benutzer und Assistant erneut ab, rekonstruiert aber keine historischen Tool-Aufrufe, Systemhinweise oder umfangreichere ACP-native Ereignistypen.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel gemeinsam nutzen, erfolgen Ereignis- und Abbruch-Weiterleitung nach bestem Bemühen und nicht streng pro Client isoliert. Bevorzugen Sie die standardmäßig isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere editorlokale Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, aber diese Zuordnung ist weniger ausdrucksstark als in einer vollständig ACP-nativen Laufzeitumgebung.
- Anfängliche Sitzungssteuerungen stellen derzeit einen fokussierten Teilbereich der Gateway-Knöpfe bereit: Thought Level, Tool-Verbosity, Reasoning, Usage Detail und Elevated Actions. Modellauswahl und Exec-Host-Steuerungen sind noch nicht als ACP-Konfigurationsoptionen verfügbar.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-Snapshots abgeleitet, nicht aus einer Live-ACP-nativen Laufzeitbuchhaltung. Die Usage ist näherungsweise, enthält keine Kostendaten und wird nur gesendet, wenn das Gateway Gesamttoken-Daten als aktuell markiert.
- Tool-Follow-along-Daten sind Best Effort. Die Bridge kann Dateipfade sichtbar machen, die in bekannten Tool-Argumenten/-Ergebnissen erscheinen, sendet aber noch keine ACP-Terminals oder strukturierten Dateidiffs.

## Verwendung

```bash
openclaw acp

# Entferntes Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Entferntes Gateway (Token aus Datei)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# An einen bestehenden Sitzungsschlüssel anhängen
openclaw acp --session agent:main:main

# Per Label anhängen (muss bereits existieren)
openclaw acp --session-label "support inbox"

# Sitzungsschlüssel vor dem ersten Prompt zurücksetzen
openclaw acp --session agent:main:main --reset-session
```

## ACP-Client (Debug)

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE auf Plausibilität zu prüfen.
Er startet die ACP-Bridge und lässt Sie Prompts interaktiv eingeben.

```bash
openclaw acp client

# Die gestartete Bridge auf ein entferntes Gateway richten
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Den Server-Befehl überschreiben (Standard: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Die automatische Genehmigung ist allowlist-basiert und gilt nur für vertrauenswürdige Core-Tool-IDs.
- Die automatische `read`-Genehmigung ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt automatisch nur enge schreibgeschützte Klassen: begrenzte `read`-Aufrufe unter dem aktiven cwd plus schreibgeschützte Suchtools (`search`, `web_search`, `memory_search`). Unbekannte/Nicht-Core-Tools, Lesevorgänge außerhalb des Bereichs, Tools mit Ausführungsfähigkeit, Control-Plane-Tools, mutierende Tools und interaktive Abläufe erfordern immer eine explizite Prompt-Genehmigung.
- Das vom Server bereitgestellte `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Bridge-Richtlinie ist getrennt von ACPX-Harness-Berechtigungen. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-„Yolo“-Schalter für diese Harness-Sitzung.

## So verwenden Sie dies

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) Agent Client Protocol spricht und Sie möchten, dass sie eine OpenClaw-Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway läuft (lokal oder entfernt).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Richten Sie Ihre IDE so ein, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (persistiert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkten Aufruf (kein Konfigurationsschreibvorgang):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# bevorzugt für lokale Prozesssicherheit
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agenten auswählen

ACP wählt Agenten nicht direkt aus. Das Routing erfolgt über den Gateway-Sitzungsschlüssel.

Verwenden Sie agentenspezifische Sitzungsschlüssel, um einen bestimmten Agenten anzusprechen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird genau einem Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie den Schlüssel oder das Label nicht überschreiben.

`mcpServers` pro Sitzung werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren Fehler zurück, anstatt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte integrierte Tools wie `cron` sehen sollen, aktivieren Sie stattdessen die gatewayseitigen ACPX-MCP-Bridges, anstatt zu versuchen, `mcpServers` pro Sitzung zu übergeben. Siehe [ACP Agents](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und [OpenClaw tools MCP bridge](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung aus `acpx` heraus (Codex, Claude, andere ACP-Clients)

Wenn Sie möchten, dass ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem OpenClaw-Bot spricht, verwenden Sie `acpx` mit seinem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Starten Sie das Gateway und stellen Sie sicher, dass die ACP-Bridge es erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp` aus.
3. Zielen Sie auf den OpenClaw-Sitzungsschlüssel, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# Einmalige Anfrage an Ihre standardmäßige OpenClaw-ACP-Sitzung
acpx openclaw exec "Fasse den aktiven OpenClaw-Sitzungsstatus zusammen."

# Persistente benannte Sitzung für Folgedurchläufe
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Bitte meinen OpenClaw-Arbeitsagenten um aktuellen Kontext, der für dieses Repository relevant ist."
```

Wenn `acpx openclaw` jedes Mal ein bestimmtes Gateway und einen bestimmten Sitzungsschlüssel ansprechen soll, überschreiben Sie den `openclaw`-Agentenbefehl in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Für einen repo-lokalen OpenClaw-Checkout verwenden Sie den direkten CLI-Einstiegspunkt statt des Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist der einfachste Weg, um Codex, Claude Code oder einem anderen ACP-fähigen Client zu ermöglichen, kontextbezogene Informationen von einem OpenClaw-Agenten abzurufen, ohne ein Terminal auszulesen.

## Einrichtung im Zed-Editor

Fügen Sie einen benutzerdefinierten ACP-Agenten in `~/.config/zed/settings.json` hinzu (oder verwenden Sie die Einstellungen-Oberfläche von Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Um ein bestimmtes Gateway oder einen bestimmten Agenten anzusprechen:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Öffnen Sie in Zed das Agent-Panel und wählen Sie „OpenClaw ACP“, um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit dem Präfix `acp:`.
Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder ein Label:

- `--session <key>`: einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: eine bestehende Sitzung per Label auflösen.
- `--reset-session`: eine neue Sitzungs-ID für diesen Schlüssel erzeugen (gleicher Schlüssel, neues Transkript).

Wenn Ihr ACP-Client Metadaten unterstützt, können Sie dies pro Sitzung überschreiben:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Weitere Informationen zu Sitzungsschlüsseln finden Sie unter [/concepts/session](/de/concepts/session).

## Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Authentifizierungstoken.
- `--token-file <path>`: Gateway-Authentifizierungstoken aus Datei lesen.
- `--password <password>`: Gateway-Authentifizierungspasswort.
- `--password-file <path>`: Gateway-Authentifizierungspasswort aus Datei lesen.
- `--session <key>`: Standard-Sitzungsschlüssel.
- `--session-label <label>`: Standard-Sitzungslabel zum Auflösen.
- `--require-existing`: fehlschlagen, wenn der Sitzungsschlüssel bzw. das Label nicht existiert.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixen.
- `--provenance <off|meta|meta+receipt>`: ACP-Herkunftsmetadaten oder Belege einschließen.
- `--verbose, -v`: ausführliche Protokollierung nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Auflösung der Gateway-Authentifizierung folgt dem gemeinsamen Vertrag, der auch von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` nur als Fallback, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen geschlossen fehl)
  - entfernter Modus: `gateway.remote.*` mit Env-/Konfigurations-Fallback gemäß den Vorrangregeln für Remote
  - `--url` ist überschreibungssicher und verwendet keine impliziten Konfigurations-/Env-Zugangsdaten erneut; übergeben Sie explizit `--token`/`--password` (oder die Datei-Varianten)
- Untergeordnete Prozesse des ACP-Laufzeit-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` für den gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliche Protokollierung auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliche Client-Protokollierung.

## Verwandt

- [CLI-Referenz](/de/cli)
- [ACP Agents](/de/tools/acp-agents)
