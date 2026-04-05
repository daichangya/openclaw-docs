---
read_when:
    - Sie möchten verstehen, welche Session Tools dem Agent zur Verfügung stehen
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agents konfigurieren
    - Sie möchten den Status prüfen oder gestartete Sub-Agents steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Recall, Messaging und Sub-Agent-Orchestrierung
title: Session Tools
x-i18n:
    generated_at: "2026-04-05T12:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Session Tools

OpenClaw stellt Agenten Tools zur Verfügung, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und
Sub-Agents zu orchestrieren.

## Verfügbare Tools

| Tool               | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Aktualität)                |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten             |
| `sessions_yield`   | Den aktuellen Durchlauf beenden und auf Follow-up-Ergebnisse von Sub-Agents warten |
| `subagents`        | Gestartete Sub-Agents für diese Sitzung auflisten, steuern oder beenden    |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional eine modellbezogene Überschreibung pro Sitzung setzen |

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, ihrer Art, ihrem Kanal, Modell, Token-
Zählwerten und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`) oder Aktualität (`activeMinutes`).

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung ab.
Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistant-Text wird vor dem Recall normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Nutzlastblöcke von Tool-Aufrufen im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Nutzlasten, die nie sauber geschlossen werden
  - herabgestuftes Tool-Call-/Result-Gerüst wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` wird entfernt
  - durchgesickerte Modell-Kontrolltokens wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Tokens und Varianten mit voller Breite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Anmeldedaten-/tokenähnlicher Text wird vor der Rückgabe geschwärzt
- lange Textblöcke werden abgeschnitten
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte bytegenaue Transkript benötigen, prüfen Sie stattdessen die
Transkriptdatei auf der Festplatte, statt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um die Nachricht in die Warteschlange zu stellen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, bei der die
Agenten abwechselnd Nachrichten austauschen (bis zu 5 Durchläufe). Der Ziel-Agent kann
`REPLY_SKIP` antworten, um frühzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige Äquivalent zu `/status` für die aktuelle
oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitstatus und
verknüpften Hintergrundaufgabenkontext, wenn vorhanden. Wie `/status` kann es
spärliche Token-/Cache-Zähler aus dem neuesten Nutzungseintrag des Transkripts nachfüllen, und
`model=default` entfernt eine Überschreibung pro Sitzung.

`sessions_yield` beendet absichtlich den aktuellen Durchlauf, sodass die nächste Nachricht
das Follow-up-Ereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agents, wenn
Sie möchten, dass Abschlussresultate als nächste Nachricht eintreffen, statt Polling-Schleifen zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agents. Unterstützt werden:

- `action: "list"` zum Prüfen aktiver/kürzlich ausgeführter Läufe
- `action: "steer"` zum Senden weiterer Anweisungen an ein laufendes Kind
- `action: "kill"` zum Stoppen eines Kindes oder `all`

## Sub-Agents starten

`sessions_spawn` erstellt eine isolierte Sitzung für eine Hintergrundaufgabe. Es ist immer
nicht blockierend -- es gibt sofort mit einer `runId` und `childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für Agents mit externer Harness.
- Überschreibungen von `model` und `thinking` für die untergeordnete Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Kind zu erzwingen.

Standardmäßige Leaf-Sub-Agents erhalten keine Session Tools. Wenn
`maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents auf Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Kinder verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungs-Tools.

Nach Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des Anfragenden.
Die Abschlusszustellung bewahrt gebundenes Thread-/Topic-Routing, wenn verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw für die direkte
Zustellung trotzdem die gespeicherte Route der anfragenden Sitzung (`lastChannel` / `lastTo`) wiederverwenden.

Für ACP-spezifisches Verhalten siehe [ACP Agents](/tools/acp-agents).

## Sichtbarkeit

Session Tools sind so begrenzt, dass eingeschränkt wird, was der Agent sehen kann:

| Ebene   | Geltungsbereich                            |
| ------- | ------------------------------------------ |
| `self`  | Nur die aktuelle Sitzung                   |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agents   |
| `agent` | Alle Sitzungen für diesen Agent            |
| `all`   | Alle Sitzungen (sitzungsübergreifend, wenn konfiguriert) |

Standard ist `tree`. Sitzungen in einer Sandbox werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Session Management](/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/tools/acp-agents) -- Starten mit externer Harness
- [Multi-agent](/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway Configuration](/gateway/configuration) -- Konfigurationsoptionen für Session Tools
