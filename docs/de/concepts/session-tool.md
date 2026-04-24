---
read_when:
    - Sie möchten verstehen, welche Sitzungstools der Agent hat
    - Sie möchten sitzungsübergreifenden Zugriff oder das Erzeugen von Subagenten konfigurieren
    - Sie möchten den Status prüfen oder erzeugte Subagenten steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Recall, Messaging und Subagent-Orchestrierung
title: Sitzungstools
x-i18n:
    generated_at: "2026-04-24T06:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw gibt Agenten Tools an die Hand, um sitzungsübergreifend zu arbeiten, Status zu prüfen und
Subagenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Was es tut                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Protokoll einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten           |
| `sessions_spawn`   | Eine isolierte Subagent-Sitzung für Hintergrundarbeit erzeugen            |
| `sessions_yield`   | Den aktuellen Turnus beenden und auf nachfolgende Subagent-Ergebnisse warten |
| `subagents`        | Erzeugte Subagenten für diese Sitzung auflisten, steuern oder beenden     |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional eine modellbezogene Überschreibung pro Sitzung setzen |

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, `agentId`, Typ, Kanal, Modell,
Token-Zählungen und Zeitstempeln zurück. Es kann nach Typ (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exakter `agentId`, Suchtext oder Aktualität
(`activeMinutes`) filtern. Wenn Sie Triage im Stil eines Postfachs benötigen, kann es auch nach einem
sichtbarkeitsbegrenzten abgeleiteten Titel, einem Vorschau-Snippet der letzten Nachricht oder begrenzten
aktuellen Nachrichten in jeder Zeile fragen. Abgeleitete Titel und Vorschauen werden nur für
Sitzungen erzeugt, die der Aufrufer unter der konfigurierten Sichtbarkeitsrichtlinie für
Sitzungstools bereits sehen darf, sodass nicht zusammenhängende Sitzungen verborgen bleiben.

`sessions_history` holt das Gesprächsprotokoll einer bestimmten Sitzung.
Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistant-Text wird vor dem Recall normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - Klartext-XML-Payload-Blöcke von Tool-Calls wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestuftes Tool-Call-/Ergebnis-Gerüst wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` wird entfernt
  - offengelegte Modell-Steuerungstokens wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Tokens und Full-Width-Varianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Anmeldedaten-/Token-ähnlicher Text wird vor der Rückgabe geschwärzt
- lange Textblöcke werden abgeschnitten
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte Transkript Byte für Byte benötigen, prüfen Sie die Transkriptdatei auf
dem Datenträger, statt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und kann optional auf
die Antwort warten:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-Back-Schleife** ausführen, bei der die
Agenten Nachrichten abwechseln lassen (bis zu 5 Turnusse). Der Zielagent kann mit
`REPLY_SKIP` antworten, um frühzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige Tool-Äquivalent zu `/status` für die aktuelle
oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitzustand und
verknüpften Kontext von Hintergrundaufgaben, wenn vorhanden. Wie `/status` kann es spärliche
Token-/Cache-Zähler aus dem neuesten Nutzungseintrag des Transkripts nachtragen, und
`model=default` löscht eine Überschreibung pro Sitzung.

`sessions_yield` beendet absichtlich den aktuellen Turnus, damit die nächste Nachricht das
Follow-up-Ereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Erzeugen von Subagenten, wenn
Abschlussergebnisse als nächste Nachricht eintreffen sollen, statt Poll-Schleifen zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits erzeugte OpenClaw-
Subagenten. Er unterstützt:

- `action: "list"` zum Prüfen aktiver/aktueller Läufe
- `action: "steer"` zum Senden nachfolgender Anweisungen an ein laufendes Child
- `action: "kill"` zum Stoppen eines Child oder `all`

## Subagenten erzeugen

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe.
Es ist immer nicht blockierend -- es kehrt sofort mit einer `runId` und
`childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- Überschreibungen von `model` und `thinking` für die Child-Sitzung.
- `thread: true`, um das Erzeugen an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Child zu erzwingen.
- `context: "fork"` für native Subagenten, wenn das Child das aktuelle
  Anfrage-Transkript benötigt; lassen Sie es weg oder verwenden Sie `context: "isolated"` für ein sauberes Child.

Standardmäßige Leaf-Subagenten erhalten keine Sitzungstools. Wenn
`maxSpawnDepth >= 2`, erhalten Orchestrator-Subagenten der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Children verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungstools.

Nach Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des Anfragenden.
Die Zustellung des Abschlusses bewahrt gebundenes Thread-/Themen-Routing, wenn verfügbar, und wenn der
Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw weiterhin die gespeicherte Route
(`lastChannel` / `lastTo`) der anfragenden Sitzung für direkte Zustellung wiederverwenden.

Für ACP-spezifisches Verhalten siehe [ACP Agents](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungstools sind so begrenzt, dass eingeschränkt wird, was der Agent sehen kann:

| Ebene   | Umfang                                      |
| ------- | ------------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                    |
| `tree`  | Aktuelle Sitzung + erzeugte Subagenten      |
| `agent` | Alle Sitzungen dieses Agenten               |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standard ist `tree`. Sitzungen in einer Sandbox werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/de/tools/acp-agents) -- Erzeugen externer Harnesses
- [Multi-agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway Configuration](/de/gateway/configuration) -- Konfigurationsoptionen für Sitzungstools

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
