---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung der Agent-Schleife oder der Lebenszyklusereignisse
summary: Lebenszyklus der Agent-Schleife, Streams und Wartesemantik
title: Agent-Schleife
x-i18n:
    generated_at: "2026-04-12T23:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c2986708b444055340e0c91b8fce7d32225fcccf3d197b797665fd36b1991a5
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent-Schleife (OpenClaw)

Eine agentische Schleife ist der vollständige „echte“ Durchlauf eines Agenten: Eingabe → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell nachdenkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie diese authentische Schleife Ende zu Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (allgemein)

1. RPC `agent` validiert Parameter, löst die Sitzung auf (`sessionKey`/`sessionId`), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Standardwerte für Modell + Thinking/Verbose/Trace auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lifecycle-End/Error** aus, wenn die eingebettete Schleife selbst keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Warteschlangen
   - löst Modell + Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt ein Timeout -> bricht den Lauf bei Überschreitung ab
   - gibt Payloads + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle-End/Error** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Parallelität

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Das verhindert Tool-/Sitzungs-Rennen und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi wählen (collect/steer/followup), die in dieses Lane-System einspeisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).

## Sitzungs- + Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können auf ein Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Schreibsperre für die Sitzung wird erworben; `SessionManager` wird geöffnet und vor dem Streaming vorbereitet.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und laufspezifischen Überschreibungen aufgebaut.
- Modellspezifische Limits und reservierte Token für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt) dazu, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft während des Aufbaus von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- + Gateway-Lebenszyklus)

Diese laufen innerhalb der Agent-Schleife oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und die System-Kontext-Felder für stabile Hinweise, die im System-Prompt-Bereich liegen sollen.
- **`before_agent_start`**: veralteter Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und ermöglicht es einem Plugin, den Turn zu übernehmen und eine synthetische Antwort zurückzugeben oder den Turn vollständig zu unterdrücken.
- **`agent_end`**: prüft nach Abschluss die endgültige Nachrichtenliste und Laufmetadaten.
- **`before_compaction` / `after_compaction`**: beobachten oder annotieren Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fangen Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Ergebnisse und kann Skill- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in das Sitzungs-Transkript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende + ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Lebenszyklusereignisse des Gateways.

Entscheidungsregeln für ausgehende/Tool-Schutzmaßnahmen in Hooks:

- `before_tool_call`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt eine vorherige Blockierung nicht auf.
- `before_install`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-Op und hebt eine vorherige Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt einen vorherigen Abbruch nicht auf.

Siehe [Plugin-Hooks](/de/plugins/architecture#provider-runtime-hooks) für die Hook-API und Registrierungsdetails.

## Streaming + Teilantworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Block-Antwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden hinsichtlich Größe und Bild-Payloads bereinigt, bevor sie protokolliert/ausgegeben werden.
- Von Messaging-Tools gesendete Nachrichten werden verfolgt, um doppelte Bestätigungen des Assistant zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optionalem Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell einen Fehler liefert
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler geliefert hat, wird
  eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Behandlung von Chat-Kanälen

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle-End/Error** ausgegeben.

## Timeouts

- Standard für `agent.wait`: 30s (nur das Warten). Parameter `timeoutMs` überschreibt dies.
- Agent-Laufzeit: Standard für `agents.defaults.timeoutSeconds` ist 172800s (48 Stunden); wird in `runEmbeddedPiAgent` über einen Abbruch-Timer erzwungen.
- LLM-Leerlauf-Timeout: `agents.defaults.llm.idleTimeoutSeconds` bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. Setzen Sie dies explizit für langsame lokale Modelle oder Reasoning-/Tool-Call-Provider; setzen Sie es auf 0, um es zu deaktivieren. Wenn es nicht gesetzt ist, verwendet OpenClaw `agents.defaults.timeoutSeconds`, sofern konfiguriert, andernfalls 120s. Durch Cron ausgelöste Läufe ohne explizites LLM- oder Agent-Timeout deaktivieren den Leerlauf-Watchdog und verlassen sich auf das äußere Cron-Timeout.

## Wo Dinge vorzeitig enden können

- Agent-Timeout (Abbruch)
- AbortSignal (Abbruch)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Freigabeschranken für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
