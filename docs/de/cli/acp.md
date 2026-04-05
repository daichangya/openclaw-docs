---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - ACP-Sitzungsrouting zum Gateway debuggen
summary: Die ACP-Bridge für IDE-Integrationen ausführen
title: acp
x-i18n:
    generated_at: "2026-04-05T12:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge ausführen, die mit einem OpenClaw-Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts per WebSocket an das Gateway weiter. Er hält ACP-Sitzungen den Gateway-Sitzungsschlüsseln zugeordnet.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständig ACP-native Editor-Laufzeitumgebung. Der Fokus liegt auf Sitzungsrouting, Prompt-Zustellung und grundlegenden Streaming-Updates.

Wenn Sie möchten, dass ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen spricht, statt eine ACP-Harness-Sitzung zu hosten, verwenden Sie stattdessen
[`openclaw mcp serve`](/cli/mcp).

## Was das nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw fungiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP Agents](/tools/acp-agents), bei denen OpenClaw ein externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Schnellregel:

- Editor/Client soll über ACP mit OpenClaw sprechen: `openclaw acp` verwenden
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: `/acp spawn` und [ACP Agents](/tools/acp-agents) verwenden

## Kompatibilitätsmatrix

| ACP-Bereich                                                          | Status       | Hinweise                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Implementiert | Kernablauf der Bridge über stdio zu Gateway-Chat/Send + Abbruch.                                                                                                                                                                                   |
| `listSessions`, Slash-Befehle                                        | Implementiert | Die Sitzungsliste funktioniert gegen den Gateway-Sitzungsstatus; Befehle werden über `available_commands_update` angekündigt.                                                                                                                      |
| `loadSession`                                                        | Teilweise    | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt den gespeicherten Textverlauf von Benutzer/Assistent erneut ab. Tool-/Systemverlauf wird noch nicht rekonstruiert.                                                     |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)              | Teilweise    | Text/Ressourcen werden in Chat-Eingaben abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                             |
| Sitzungsmodi                                                         | Teilweise    | `session/set_mode` wird unterstützt, und die Bridge stellt erste Gateway-gestützte Sitzungssteuerungen für Thinking-Stufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetails und erhöhte Aktionen bereit. Breitere ACP-native Modus-/Konfigurationsoberflächen bleiben weiterhin außerhalb des Umfangs. |
| Sitzungsinfo- und Nutzungsupdates                                    | Teilweise    | Die Bridge sendet `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungssnapshots. Nutzung ist angenähert und wird nur gesendet, wenn die Gateway-Token-Gesamtsummen als aktuell markiert sind. |
| Tool-Streaming                                                       | Teilweise    | `tool_call`- / `tool_call_update`-Ereignisse enthalten rohe I/O, Textinhalt und Best-Effort-Dateipfade, wenn Gateway-Toolargumente/-ergebnisse sie bereitstellen. Eingebettete Terminals und umfangreichere diff-native Ausgaben werden noch nicht bereitgestellt. |
| MCP-Server pro Sitzung (`mcpServers`)                                | Nicht unterstützt | Der Bridge-Modus lehnt MCP-Server-Anfragen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder Agenten.                                                                                                             |
| Dateisystemmethoden des Clients (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt | Die Bridge ruft keine ACP-Dateisystemmethoden des Clients auf.                                                                                                                                                                                    |
| Terminalmethoden des Clients (`terminal/*`)                          | Nicht unterstützt | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs durch Tool-Aufrufe.                                                                                                                                               |
| Sitzungspläne / Thought-Streaming                                    | Nicht unterstützt | Die Bridge sendet derzeit Ausgabetext und Tool-Status, aber keine ACP-Plan- oder Thought-Updates.                                                                                                                                               |

## Bekannte Einschränkungen

- `loadSession` spielt den gespeicherten Textverlauf von Benutzer und Assistent erneut ab, rekonstruiert aber keine historischen Tool-Aufrufe, Systemhinweise oder umfangreicheren ACP-nativen Ereignistypen.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel verwenden, erfolgt das Routing von Ereignissen und Abbrüchen nur nach bestem Bemühen statt strikt pro Client isoliert. Bevorzugen Sie die standardmäßigen isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere editorlokale Turns benötigen.
- Stop-Zustände des Gateway werden in ACP-Stop-Gründe übersetzt, aber diese Zuordnung ist weniger ausdrucksstark als in einer vollständig ACP-nativen Laufzeitumgebung.
- Die anfänglichen Sitzungssteuerungen zeigen derzeit einen fokussierten Teil der Gateway-Regler an: Thinking-Stufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetails und erhöhte Aktionen. Modellauswahl und Steuerungen für den Exec-Host sind noch nicht als ACP-Konfigurationsoptionen verfügbar.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungssnapshots abgeleitet, nicht aus live ACP-nativer Laufzeitabrechnung. Die Nutzung ist angenähert, enthält keine Kostendaten und wird nur gesendet, wenn das Gateway Gesamttokendaten als aktuell markiert.
- Tool-Follow-along-Daten erfolgen nach bestem Bemühen. Die Bridge kann Dateipfade anzeigen, die in bekannten Tool-Argumenten/-Ergebnissen erscheinen, sendet aber noch keine ACP-Terminals oder strukturierten Datei-Diffs.

## Verwendung

```bash
openclaw acp

# Entferntes Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Entferntes Gateway (Token aus Datei)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# An einen vorhandenen Sitzungsschlüssel anhängen
openclaw acp --session agent:main:main

# Über Label anhängen (muss bereits vorhanden sein)
openclaw acp --session-label "support inbox"

# Sitzungsschlüssel vor dem ersten Prompt zurücksetzen
openclaw acp --session agent:main:main --reset-session
```

## ACP-Client (Debug)

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE grob zu prüfen.
Er startet die ACP-Bridge und lässt Sie Prompts interaktiv eingeben.

```bash
openclaw acp client

# Die gestartete Bridge auf ein entferntes Gateway zeigen lassen
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Den Server-Befehl überschreiben (Standard: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Auto-Genehmigung ist allowlist-basiert und gilt nur für vertrauenswürdige Core-Tool-IDs.
- Die Auto-Genehmigung für `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt automatisch nur enge schreibgeschützte Klassen: eingeschränkte `read`-Aufrufe unter dem aktiven cwd sowie schreibgeschützte Such-Tools (`search`, `web_search`, `memory_search`). Unbekannte/Nicht-Core-Tools, Lesevorgänge außerhalb des Gültigkeitsbereichs, exec-fähige Tools, Control-Plane-Tools, verändernde Tools und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Das serverseitig bereitgestellte `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese Richtlinie der ACP-Bridge ist getrennt von ACPX-Harness-Berechtigungen. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-„yolo“-Schalter für diese Harness-Sitzung.

## So verwenden Sie das

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) Agent Client Protocol spricht und Sie möchten, dass sie eine OpenClaw-Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway läuft (lokal oder entfernt).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Konfigurieren Sie Ihre IDE so, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (dauerhaft gespeichert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkten Aufruf (ohne Konfigurationsänderung):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# bevorzugt für lokale Prozesssicherheit
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agenten auswählen

ACP wählt Agenten nicht direkt aus. Es routet über den Gateway-Sitzungsschlüssel.

Verwenden Sie agentenspezifische Sitzungsschlüssel, um einen bestimmten Agenten anzusprechen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie den Schlüssel oder das Label nicht überschreiben.

`mcpServers` pro Sitzung werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn Sie möchten, dass ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools sehen können, aktivieren Sie die gatewayseitige ACPX-Plugin-Bridge, statt zu versuchen, `mcpServers` pro Sitzung zu übergeben. Siehe [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## Verwendung aus `acpx` (Codex, Claude, andere ACP-Clients)

Wenn Sie möchten, dass ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem OpenClaw-Bot kommuniziert, verwenden Sie `acpx` mit seinem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Starten Sie das Gateway und stellen Sie sicher, dass die ACP-Bridge es erreichen kann.
2. Zeigen Sie `acpx openclaw` auf `openclaw acp`.
3. Wählen Sie den OpenClaw-Sitzungsschlüssel aus, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# Einzelne Anfrage an Ihre Standard-OpenClaw-ACP-Sitzung
acpx openclaw exec "Summarize the active OpenClaw session state."

# Dauerhafte benannte Sitzung für Folge-Turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal auf ein bestimmtes Gateway und einen bestimmten Sitzungsschlüssel zielen soll, überschreiben Sie den Agentenbefehl `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Verwenden Sie für einen repo-lokalen OpenClaw-Checkout den direkten CLI-Einstiegspunkt statt des Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Das ist der einfachste Weg, damit Codex, Claude Code oder ein anderer ACP-fähiger Client kontextbezogene Informationen von einem OpenClaw-Agenten abrufen kann, ohne ein Terminal auszulesen.

## Einrichtung im Zed-Editor

Fügen Sie in `~/.config/zed/settings.json` einen benutzerdefinierten ACP-Agenten hinzu (oder verwenden Sie die Zed-Einstellungs-UI):

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
- `--session-label <label>`: eine vorhandene Sitzung über ihr Label auflösen.
- `--reset-session`: eine neue Sitzungs-ID für diesen Schlüssel erzeugen (derselbe Schlüssel, neues Transkript).

Wenn Ihr ACP-Client Metadaten unterstützt, können Sie pro Sitzung überschreiben:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Mehr zu Sitzungsschlüsseln unter [/concepts/session](/concepts/session).

## Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Authentifizierungstoken.
- `--token-file <path>`: Gateway-Authentifizierungstoken aus Datei lesen.
- `--password <password>`: Gateway-Authentifizierungspasswort.
- `--password-file <path>`: Gateway-Authentifizierungspasswort aus Datei lesen.
- `--session <key>`: Standard-Sitzungsschlüssel.
- `--session-label <label>`: Standard-Sitzungslabel zum Auflösen.
- `--require-existing`: fehlschlagen, wenn der Sitzungsschlüssel/das Label nicht existiert.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixen.
- `--provenance <off|meta|meta+receipt>`: ACP-Provenance-Metadaten oder Belege einbeziehen.
- `--verbose, -v`: ausführliches Logging nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Auflösung der Gateway-Authentifizierung folgt dem gemeinsamen Vertrag, der auch von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: Env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> Fallback auf `gateway.remote.*` nur, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen fail-closed fehl)
  - entfernter Modus: `gateway.remote.*` mit Env-/Konfigurations-Fallback gemäß der Prioritätsregeln für entfernte Ziele
  - `--url` ist override-sicher und verwendet keine impliziten Anmeldedaten aus Konfiguration/Env wieder; übergeben Sie explizit `--token`/`--password` (oder Dateivarianten)
- Untergeordnete Prozesse des ACP-Laufzeit-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` auf den gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Server-Befehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliches Logging auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliches Client-Logging.
