---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung der Agent-Loop oder der Lifecycle-Ereignisse.
    - Sie ändern Session-Queueing, Transkript-Schreibvorgänge oder das Verhalten der Session-Schreibsperre.
summary: Agent-Loop-Lifecycle, Streams und Wait-Semantik
title: Agent-Loop
x-i18n:
    generated_at: "2026-04-24T06:33:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent-Loop (OpenClaw)

Eine agentische Loop ist der vollständige „echte“ Lauf eines Agenten: Eingabe → Kontextaufbau → Modellinferenz →
Tool-Ausführung → Streaming von Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine finale Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist eine Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lifecycle- und Stream-Ereignisse
ausgibt, während das Modell nachdenkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie diese
authentische Loop Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: `agent`-Befehl.

## Funktionsweise (Überblick)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (`sessionKey`/`sessionId`), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Standardwerte für Modell + Thinking/Verbose/Trace auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Runtime)
   - gibt **Lifecycle-Ende/-Fehler** aus, wenn die eingebettete Loop selbst keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über Queues pro Sitzung + global
   - löst Modell + Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt ein Timeout -> bricht den Lauf bei Überschreitung ab
   - gibt Payloads + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` verbindet pi-agent-core-Ereignisse mit dem OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle-Ende/-Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Parallelität

- Läufe werden pro Sitzungsschlüssel serialisiert (Session-Lane) und optional zusätzlich über eine globale Lane.
- Das verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Channels können Queue-Modi wählen (collect/steer/followup), die in dieses Lane-System einspeisen.
  Siehe [Command Queue](/de/concepts/queue).
- Schreibvorgänge am Transkript werden zusätzlich durch eine Session-Schreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Writer erkennt, die die In-Process-Queue umgehen oder aus
  einem anderen Prozess stammen.
- Session-Schreibsperren sind standardmäßig nicht reentrant. Wenn ein Helfer absichtlich die Erfassung
  derselben Sperre verschachtelt, dabei aber einen logischen Writer beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Vorbereitung von Sitzung + Workspace

- Der Workspace wird aufgelöst und erstellt; sandboxed-Läufe können auf ein Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Env und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den Bericht des System-Prompts injiziert.
- Eine Session-Schreibsperre wird erfasst; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, zur Compaction oder zum Trunkieren des Transkripts muss dieselbe Sperre nehmen, bevor
  die Transkriptdatei geöffnet oder verändert wird.

## Prompt-Aufbau + System-Prompt

- Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und Überschreibungen pro Lauf aufgebaut.
- Modellspezifische Limits und Reserve-Tokens für Compaction werden erzwungen.
- Siehe [System prompt](/de/concepts/system-prompt) dafür, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lifecycle-Ereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lifecycles und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: wird während des Aufbaus von Bootstrap-Dateien ausgeführt, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- + Gateway-Lifecycle)

Diese laufen innerhalb der Agent-Loop oder Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übergabe zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und System-Kontext-Felder für stabile Hinweise, die im Bereich des System-Prompts sitzen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt einem Plugin, den Turn zu übernehmen und eine synthetische Antwort zurückzugeben oder den Turn vollständig stummzuschalten.
- **`agent_end`**: die finale Nachrichtenliste und Laufmetadaten nach Abschluss prüfen.
- **`before_compaction` / `after_compaction`**: Compaction-Zyklen beobachten oder annotieren.
- **`before_tool_call` / `after_tool_call`**: Tool-Parameter/-Ergebnisse abfangen.
- **`before_install`**: Findings aus dem integrierten Scan prüfen und Skill- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: Tool-Ergebnisse synchron transformieren, bevor sie in ein OpenClaw-eigenes Sitzungs-Transkript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende + ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungs-Lifecycles.
- **`gateway_start` / `gateway_stop`**: Gateway-Lifecycle-Ereignisse.

Entscheidungsregeln für ausgehende-/Tool-Schutzmechanismen:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt einen vorherigen Block nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-Op und hebt einen vorherigen Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt einen vorherigen Cancel nicht auf.

Siehe [Plugin hooks](/de/plugins/architecture-internals#provider-runtime-hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich anpassen. Das App-Server-Harness von Codex behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater niedrigerer Codex-Mechanismus bleiben.

## Streaming + partielle Antworten

- Assistant-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking und Verhalten von Block-Antworten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden verfolgt, um doppelte Bestätigungen durch den Assistant zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengestellt aus:
  - Assistant-Text (und optionalem Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext bei Modellfehlern
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler gemeldet hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine benutzersichtbare Antwort gesendet).

## Compaction + Retries

- Automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann einen Retry auslösen.
- Bei einem Retry werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Behandlung von Chat-Channels

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle-Ende/-Fehler** ausgegeben.

## Timeouts

- Standard für `agent.wait`: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agent-Runtime: `agents.defaults.timeoutSeconds` standardmäßig 172800 s (48 Stunden); durch den Abort-Timer in `runEmbeddedPiAgent` erzwungen.
- LLM-Idle-Timeout: `agents.defaults.llm.idleTimeoutSeconds` bricht eine Modellanfrage ab, wenn vor Ablauf des Idle-Fensters keine Response-Chunks eintreffen. Setzen Sie es explizit für langsame lokale Modelle oder Reasoning-/Tool-Call-Provider; setzen Sie es auf 0, um es zu deaktivieren. Wenn es nicht gesetzt ist, verwendet OpenClaw `agents.defaults.timeoutSeconds`, falls konfiguriert, andernfalls 120 s. Cron-ausgelöste Läufe ohne explizites LLM- oder Agent-Timeout deaktivieren den Idle-Watchdog und verlassen sich auf das äußere Cron-Timeout.

## Wo Dinge früh enden können

- Agent-Timeout (Abort)
- AbortSignal (Abbruch)
- Gateway-Disconnect oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lifecycle-Ereignisse des Agenten ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Konversationen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Freigabe-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration des Thinking-/Reasoning-Levels
