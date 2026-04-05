---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung der Agent-Schleife oder der Lebenszyklusereignisse
summary: Lebenszyklus der Agent-Schleife, Streams und Wait-Semantik
title: Agent Loop
x-i18n:
    generated_at: "2026-04-05T12:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent Loop (OpenClaw)

Eine agentische Schleife ist der vollständige „echte“ Lauf eines Agent: Eingang → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Es ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell nachdenkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie diese
authentische Schleife Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (allgemein)

1. Die RPC `agent` validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agent aus:
   - löst Modell- + Thinking-/Verbose-Standards auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (Laufzeit von pi-agent-core)
   - gibt **Lebenszyklus-Ende/Fehler** aus, wenn die eingebettete Schleife kein entsprechendes Ereignis ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über Warteschlangen pro Sitzung und global
   - löst Modell + Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt ein Timeout -> bricht den Lauf bei Überschreitung ab
   - gibt Nutzlasten + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklusereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus-Ende/Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Parallelität

- Läufe werden pro Sitzungsschlüssel serialisiert (Sitzungs-Lane) und optional über eine globale Lane.
- Dies verhindert Tool-/Sitzungs-Rennen und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi wählen (collect/steer/followup), die dieses Lane-System speisen.
  Siehe [Command Queue](/concepts/queue).

## Vorbereitung von Sitzung + Workspace

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können zu einem Sandbox-Workspace-Stamm umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in env und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den Bericht zum System-Prompt injiziert.
- Eine Schreibsperre für die Sitzung wird erworben; `SessionManager` wird geöffnet und vor dem Streaming vorbereitet.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und Überschreibungen pro Lauf aufgebaut.
- Modellspezifische Limits und Reserve-Token für Compaction werden erzwungen.
- Siehe [System prompt](/concepts/system-prompt), um zu sehen, was das Modell sieht.

## Hook-Punkte (an denen Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Lebenszyklus von Agent + Gateway)

Diese laufen innerhalb der Agent-Schleife oder Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell deterministisch vor der Modellauflösung zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor dem Übermitteln des Prompt einzufügen. Verwenden Sie `prependContext` für dynamischen Text pro Durchlauf und die System-Kontext-Felder für stabile Anleitung, die im Bereich des System-Prompt liegen sollte.
- **`before_agent_start`**: veralteter Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt es einem Plugin, den Durchlauf zu übernehmen und eine synthetische Antwort zurückzugeben oder den Durchlauf vollständig stummzuschalten.
- **`agent_end`**: prüft die endgültige Nachrichtenliste und Metadaten des Laufs nach dem Abschluss.
- **`before_compaction` / `after_compaction`**: beobachten oder annotieren Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fangen Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Ergebnisse und kann Installationen von Skills oder Plugins optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in das Sitzungs-Transkript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende + ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Lebenszyklusereignisse des Gateway.

Entscheidungsregeln für Hooks bei ausgehenden/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt einen früheren Abbruch nicht auf.

Siehe [Plugin hooks](/plugins/architecture#provider-runtime-hooks) für die Hook-API und Registrierungsdetails.

## Streaming + partielle Antworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/concepts/streaming) für Chunking und das Verhalten von Block-Antworten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bildnutzlasten bereinigt.
- Sendungen von Messaging-Tools werden verfolgt, um doppelte Bestätigungen des Assistant zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Nutzlasten werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell einen Fehler erzeugt
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Nutzlasten herausgefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Nutzlastliste entfernt.
- Wenn keine darstellbaren Nutzlasten übrig bleiben und ein Tool einen Fehler erzeugt hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für den Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Behandlung von Chat-Kanälen

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus-Ende/Fehler** ausgegeben.

## Timeouts

- Standard von `agent.wait`: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agent-Laufzeit: Standard von `agents.defaults.timeoutSeconds` ist 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.

## Wo Dinge frühzeitig enden können

- Agent-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agent nicht)

## Verwandt

- [Tools](/tools) — verfügbare Agent-Tools
- [Hooks](/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agent ausgelöst werden
- [Compaction](/concepts/compaction) — wie lange Konversationen zusammengefasst werden
- [Exec Approvals](/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Thinking](/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
