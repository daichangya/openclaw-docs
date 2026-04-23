---
read_when:
    - Sie möchten verstehen, welche Sitzungs-Tools der Agent hat
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten Status prüfen oder gestartete Sub-Agenten steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Recall, Nachrichten und Sub-Agent-Orchestrierung
title: Sitzungs-Tools
x-i18n:
    generated_at: "2026-04-23T14:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Sitzungs-Tools

OpenClaw stellt Agents Tools zur Verfügung, um sitzungsübergreifend zu arbeiten, Status zu prüfen und
Sub-Agenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Beschreibung                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                             |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten          |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten           |
| `sessions_yield`   | Den aktuellen Turn beenden und auf nachfolgende Sub-Agent-Ergebnisse warten |
| `subagents`        | Gestartete Sub-Agenten für diese Sitzung auflisten, steuern oder beenden |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional ein Modell-Override pro Sitzung setzen |

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, `agentId`, ihrer Art, ihrem Channel, Modell,
Token-Zahlen und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exakter `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Wenn Sie Triage im Stil eines Posteingangs benötigen, kann es außerdem
einen aus der Sichtbarkeit abgeleiteten Titel, ein Vorschau-Snippet der letzten Nachricht oder begrenzte
aktuelle Nachrichten pro Zeile anfordern. Abgeleitete Titel und Vorschauen werden nur für
Sitzungen erzeugt, die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für
Sitzungs-Tools bereits sehen darf, sodass nicht zusammenhängende Sitzungen verborgen bleiben.

`sessions_history` ruft das Conversation-Transkript für eine bestimmte Sitzung ab.
Standardmäßig sind Tool-Ergebnisse ausgeschlossen — übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist bewusst begrenzt und sicherheitsgefiltert:

- Assistant-Text wird vor dem Recall normalisiert:
  - Thinking-Tags werden entfernt
  - Scaffold-Blöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - reine Text-XML-Payload-Blöcke für Tool-Aufrufe wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestuftes Scaffold für Tool-Aufrufe/-Ergebnisse wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` wird entfernt
  - durchgesickerte Modell-Steuer-Token wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und Varianten in voller Breite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Anmeldedaten-/tokenähnlicher Text wird vor der Rückgabe redigiert
- lange Textblöcke werden abgeschnitten
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen List-Aufruf.

Wenn Sie das exakte bytegenaue Transkript benötigen, prüfen Sie stattdessen die Transkriptdatei auf
dem Datenträger, anstatt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um die Nachricht einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-Back-Schleife** ausführen, in der die
Agents Nachrichten abwechseln (bis zu 5 Turns). Der Ziel-Agent kann mit
`REPLY_SKIP` antworten, um vorzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige Tool für die aktuelle oder eine andere sichtbare Sitzung,
das dem Befehl `/status` entspricht. Es meldet Nutzung, Zeit, Modell-/Laufzeitstatus und
verknüpften Hintergrund-Task-Kontext, sofern vorhanden. Wie `/status` kann es spärliche Token-/Cache-Zähler
aus dem neuesten Nutzungseintrag des Transkripts ergänzen, und
`model=default` löscht ein Override pro Sitzung.

`sessions_yield` beendet den aktuellen Turn absichtlich, sodass die nächste Nachricht das
Follow-up-Event sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn
Abschluss-Ergebnisse als nächste Nachricht eintreffen sollen, statt Poll-Schleifen
zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agenten. Er unterstützt:

- `action: "list"`, um aktive/aktuelle Läufe zu prüfen
- `action: "steer"`, um einem laufenden Child nachfolgende Anweisungen zu senden
- `action: "kill"`, um ein Child oder `all` zu stoppen

## Sub-Agenten starten

`sessions_spawn` erstellt eine isolierte Sitzung für eine Hintergrundaufgabe. Es ist immer
nicht blockierend — es kehrt sofort mit einer `runId` und einem `childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für Agents mit externer Harness.
- Overrides für `model` und `thinking` für die Child-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Child zu erzwingen.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungs-Tools. Wenn
`maxSpawnDepth >= 2`, erhalten Depth-1-Orchestrator-Sub-Agenten zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Childs verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungs-Tools.

Nach dem Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Channel des Anfragenden.
Die Zustellung des Abschlusses bewahrt gebundene Thread-/Topic-Routen, wenn verfügbar, und wenn der
Abschluss-Ursprung nur einen Channel identifiziert, kann OpenClaw weiterhin die gespeicherte Route
der anfragenden Sitzung (`lastChannel` / `lastTo`) für direkte Zustellung wiederverwenden.

Für ACP-spezifisches Verhalten siehe [ACP Agents](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungs-Tools sind so scoped, dass begrenzt wird, was der Agent sehen kann:

| Ebene   | Umfang                                   |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agent          |
| `all`   | Alle Sitzungen (agentübergreifend, wenn konfiguriert) |

Standard ist `tree`. Sandboxed-Sitzungen werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Session Management](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway Configuration](/de/gateway/configuration) -- Konfigurationsregler für Sitzungs-Tools
