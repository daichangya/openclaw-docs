---
read_when:
    - Sie möchten Hintergrund-/Parallel-Arbeit über den Agenten ausführen
    - Sie ändern `sessions_spawn` oder die Tool-Richtlinie für Unteragenten
    - Sie implementieren oder debuggen threadgebundene Unteragenten-Sitzungen
summary: 'Unteragenten: isolierte Agentenläufe starten, die Ergebnisse an den anfragenden Chat zurückmelden'
title: Unteragenten
x-i18n:
    generated_at: "2026-04-24T07:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Unteragenten sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf heraus gestartet werden. Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und **kündigen** ihr Ergebnis nach Abschluss im anfragenden Chat-Channel an. Jeder Unteragentenlauf wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

## Slash-Befehl

Verwenden Sie `/subagents`, um Unteragentenläufe für die **aktuelle Sitzung** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerung für Thread-Bindings:

Diese Befehle funktionieren auf Channels, die persistente Thread-Bindings unterstützen. Siehe **Channels mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Metadaten des Laufs (Status, Zeitstempel, Sitzungs-ID, Transcript-Pfad, Cleanup).
Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte Recall-Ansicht; prüfen Sie den
Transcript-Pfad auf Festplatte, wenn Sie das rohe vollständige Transcript benötigen.

### Verhalten von Spawn

`/subagents spawn` startet einen Hintergrund-Unteragenten als Benutzerbefehl, nicht als internes Relay, und sendet eine abschließende Update-Nachricht mit dem Ergebnis zurück an den anfragenden Chat, wenn der Lauf beendet ist.

- Der Spawn-Befehl blockiert nicht; er gibt sofort eine Run-ID zurück.
- Nach Abschluss kündigt der Unteragent eine Zusammenfassungs-/Ergebnisnachricht im anfragenden Chat-Channel an.
- Die Zustellung nach Abschluss ist push-basiert. Sobald der Unteragent gestartet wurde, pollen Sie nicht in einer Schleife `/subagents list`,
  `sessions_list` oder `sessions_history`, nur um auf seinen Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
- Nach Abschluss schließt OpenClaw nach Best Effort verfolgte Browser-Tabs/-Prozesse, die von dieser Unteragentensitzung geöffnet wurden, bevor der Cleanup-Ablauf für die Ankündigung fortgesetzt wird.
- Bei manuellen Spawns ist die Zustellung robust:
  - OpenClaw versucht zuerst direkte Zustellung über `agent` mit einem stabilen Idempotency-Key.
  - Wenn direkte Zustellung fehlschlägt, greift es auf Queue-Routing zurück.
  - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff wiederholt, bevor endgültig aufgegeben wird.
- Die Zustellung nach Abschluss behält die aufgelöste Route des Anfragenden bei:
  - threadgebundene oder konversationsgebundene Abschlussrouten haben Vorrang, wenn verfügbar
  - wenn der Ursprung des Abschlusses nur einen Channel liefert, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anfragersitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert
- Die Übergabe des Abschlusses an die Sitzung des Anfragenden ist intern generierter Laufzeitkontext (nicht vom Benutzer verfasster Text) und enthält:
  - `Result` (letzter sichtbarer Antworttext des `assistant`, andernfalls bereinigter letzter `tool`-/`toolResult`-Text; terminal fehlgeschlagene Läufe verwenden keinen erfassten Antworttext erneut)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellungsanweisung, die dem Agenten des Anfragenden sagt, dies in normaler Assistentenstimme umzuschreiben (nicht rohe interne Metadaten weiterzuleiten)
- `--model` und `--thinking` überschreiben die Standardwerte für diesen spezifischen Lauf.
- Verwenden Sie `info`/`log`, um Details und Ausgabe nach dem Abschluss zu prüfen.
- `/subagents spawn` ist der One-Shot-Modus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sitzungen (Codex, Claude Code, Gemini CLI) verwenden Sie `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/de/tools/acp-agents), insbesondere das [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen.

Primäre Ziele:

- „Recherche / lange Aufgabe / langsames Tool“-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Unteragenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar machen: Unteragenten erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu Kosten: Jeder Unteragent hat standardmäßig **seinen eigenen** Kontext und Token-Verbrauch. Für schwere oder
wiederkehrende Aufgaben setzen Sie ein günstigeres Modell für Unteragenten und lassen Ihren Hauptagenten auf einem
höherwertigen Modell laufen. Sie können dies über `agents.defaults.subagents.model` oder über Überschreibungen pro Agent konfigurieren. Wenn ein Kind wirklich das aktuelle Transcript des Anfragenden benötigt, kann der Agent
bei diesem einen Spawn `context: "fork"` anfordern.

## Tool

Verwenden Sie `sessions_spawn`:

- Startet einen Unteragentenlauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort in den Chat-Channel des Anfragenden
- Standardmodell: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`) setzen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- Standard-Thinking: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`) setzen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- Standard-Run-Timeout: Wenn `sessions_spawn.runTimeoutSeconds` weggelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls wird auf `0` zurückgegriffen (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter anderer Agenten-ID starten, wenn erlaubt)
- `model?` (optional; überschreibt das Modell des Unteragenten; ungültige Werte werden übersprungen und der Unteragent läuft mit dem Standardmodell, mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt das Thinking-Level für den Lauf des Unteragenten)
- `runTimeoutSeconds?` (Standard ist `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`; wenn gesetzt, wird der Lauf des Unteragenten nach N Sekunden abgebrochen)
- `thread?` (Standard `false`; wenn `true`, wird für diese Unteragentensitzung ein Channel-Thread-Binding angefordert)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, wird standardmäßig `session`
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, Standard `keep`)
- `sandbox?` (`inherit|require`, Standard `inherit`; `require` lehnt Spawn ab, sofern die Ziel-Kind-Runtime nicht sandboxed ist)
- `context?` (`isolated|fork`, Standard `isolated`; nur native Unteragenten)
  - `isolated` erstellt ein sauberes Kind-Transcript und ist der Standard.
  - `fork` verzweigt das aktuelle Transcript des Anfragenden in die Kind-Sitzung, sodass das Kind mit demselben Gesprächskontext startet.
  - Verwenden Sie `fork` nur dann, wenn das Kind das aktuelle Transcript benötigt. Für eng umrissene Arbeit lassen Sie `context` weg.
- `sessions_spawn` akzeptiert **keine** Channel-Zustellungsparameter (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für Zustellung `message`/`sessions_send` aus dem gestarteten Lauf.

## Thread-gebundene Sitzungen

Wenn Thread-Bindings für einen Channel aktiviert sind, kann ein Unteragent an einen Thread gebunden bleiben, sodass Folge-Nachrichten von Benutzern in diesem Thread weiterhin an dieselbe Unteragentensitzung geroutet werden.

### Channels mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Channel): unterstützt persistente threadgebundene Unteragentensitzungen (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und Adapter-Schlüssel `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Kurzer Ablauf:

1. Mit `sessions_spawn` unter Verwendung von `thread: true` starten (und optional `mode: "session"`).
2. OpenClaw erstellt einen Thread oder bindet ihn an dieses Sitzungsziel im aktiven Channel.
3. Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
4. Verwenden Sie `/session idle`, um Auto-Unfocus bei Inaktivität zu prüfen/zu aktualisieren, und `/session max-age`, um die harte Obergrenze zu steuern.
5. Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerung:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Unteragenten-/Sitzungsziel.
- `/unfocus` entfernt die Bindung für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Bindungszustand auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Channel-Override und Schlüssel für automatische Spawn-Bindung sind adapterspezifisch. Siehe oben **Channels mit Thread-Unterstützung**.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und [Slash commands](/de/tools/slash-commands) für aktuelle Adapter-Details.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agenten-IDs, die über `agentId` adressiert werden dürfen (`["*"]`, um alle zu erlauben). Standard: nur der Agent des Anfragenden.
- `agents.defaults.subagents.allowAgents`: Standard-Allowlist für Zielagenten, die verwendet wird, wenn der Agent des Anfragenden keine eigene `subagents.allowAgents` setzt.
- Guard für Vererbung der Sandbox: Wenn die Sitzung des Anfragenden sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: Wenn true, blockiert dies Aufrufe von `sessions_spawn`, die `agentId` weglassen (erzwingt explizite Profilauswahl). Standard: false.

Erkennung:

- Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für `sessions_spawn` erlaubt sind.

Automatisches Archivieren:

- Sitzungen von Unteragenten werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard: 60).
- Das Archivieren verwendet `sessions.delete` und benennt das Transcript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (behält das Transcript aber weiterhin durch Umbenennung).
- Das automatische Archivieren erfolgt nach Best Effort; ausstehende Timer gehen bei einem Neustart des Gateway verloren.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zum automatischen Archivieren bestehen.
- Automatisches Archivieren gilt gleichermaßen für Sitzungen der Tiefe 1 und 2.
- Browser-Cleanup ist vom Archiv-Cleanup getrennt: verfolgte Browser-Tabs/-Prozesse werden nach Best Effort geschlossen, wenn der Lauf endet, auch wenn der Sitzungsdatensatz/das Transcript erhalten bleibt.

## Verschachtelte Unteragenten

Standardmäßig können Unteragenten keine eigenen Unteragenten starten (`maxSpawnDepth: 1`). Sie können eine Ebene der Verschachtelung aktivieren, indem Sie `maxSpawnDepth: 2` setzen. Das erlaubt das **Orchestrator-Muster**: Main → Orchestrator-Unteragent → Worker-Sub-Sub-Agenten.

### Wie man es aktiviert

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Unteragenten erlauben, Kinder zu starten (Standard: 1)
        maxChildrenPerAgent: 5, // max. aktive Kinder pro Agentensitzung (Standard: 5)
        maxConcurrent: 8, // globale Obergrenze für parallele Lanes (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn weggelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                             | Kann spawnen?                 |
| ----- | -------------------------------------------- | ------------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | Hauptagent                                        | Immer                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | Unteragent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                       | Niemals                       |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet sich → kündigt seinem Parent an (Orchestrator der Tiefe 1)
2. Orchestrator der Tiefe 1 erhält die Ankündigung, synthetisiert Ergebnisse, beendet sich → kündigt Main an
3. Main-Agent erhält die Ankündigung und liefert sie an den Benutzer

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

Betriebshinweise:

- Starten Sie Kinderarbeit einmal und warten Sie auf Abschlussereignisse, statt Polling-
  Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-sleep-Befehle herum zu bauen.
- Wenn ein Abschlussereignis eines Kindes eintrifft, nachdem Sie bereits die endgültige Antwort gesendet haben,
  ist die korrekte Folgeaktion das exakte Silent-Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rolle und Control-Scope werden beim Spawn in die Sitzungsmetadaten geschrieben. Das verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich wieder Orchestrator-Rechte erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben weiterhin verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Sitzungs-Tools (derzeitiges Standardverhalten).
- **Tiefe 2 (Leaf-Worker)**: Keine Sitzungs-Tools — `sessions_spawn` wird auf Tiefe 2 immer verweigert. Kann keine weiteren Kinder starten.

### Spawn-Limit pro Agent

Jede Agentensitzung (auf jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Kinder gleichzeitig haben. Das verhindert unkontrolliertes Fan-out von einem einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators auf Tiefe 1 stoppt automatisch alle seine Kinder auf Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten auf Tiefe 1 und kaskadiert zu deren Kindern auf Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Unteragenten und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Unteragenten für den Anfragenden und kaskadiert.

## Authentifizierung

Die Auth von Unteragenten wird nach **Agenten-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Unteragenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Hauptagenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben bei Konflikten die Profile des Hauptagenten.

Hinweis: Der Merge ist additiv, sodass Profile des Hauptagenten immer als Fallbacks verfügbar sind. Vollständig isolierte Auth pro Agent wird derzeit noch nicht unterstützt.

## Ankündigung

Unteragenten melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sitzung des Unteragenten (nicht in der Sitzung des Anfragenden).
- Wenn der Unteragent genau `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der letzte Assistententext exakt das Silent-Token `NO_REPLY` / `no_reply` ist,
  wird die Ausgabe der Ankündigung unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.
- Andernfalls hängt die Zustellung von der Tiefe des Anfragenden ab:
  - Anfragersitzungen auf oberster Ebene verwenden einen Folgeaufruf `agent` mit externer Zustellung (`deliver=true`)
  - verschachtelte Unteragentensitzungen des Anfragenden erhalten eine interne Folgeinjektion (`deliver=false`), damit der Orchestrator Kind-Ergebnisse innerhalb der Sitzung synthetisieren kann
  - wenn eine verschachtelte Unteragentensitzung des Anfragenden nicht mehr existiert, fällt OpenClaw auf den Anfragenden dieser Sitzung zurück, sofern verfügbar
- Für Anfragersitzungen auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zunächst jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und ergänzt dann fehlende Channel-Target-Felder aus der gespeicherten Route der Anfragersitzung. Dadurch bleiben Abschlüsse im richtigen Chat/Topic, selbst wenn der Ursprung des Abschlusses nur den Channel identifiziert.
- Die Aggregation von Kind-Abschlüssen ist beim Aufbau verschachtelter Completion Findings auf den aktuellen Lauf des Anfragenden beschränkt, sodass veraltete Kind-Ausgaben aus früheren Läufen nicht in die aktuelle Ankündigung durchsickern.
- Antworten auf Ankündigungen bewahren Thread-/Topic-Routing, wenn es auf Channel-Adaptern verfügbar ist.
- Der Kontext der Ankündigung wird zu einem stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Schlüssel/ID der Kind-Sitzung
  - Typ der Ankündigung + Task-Label
  - Statuszeile, abgeleitet aus dem Laufzeitergebnis (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt, gewählt aus dem letzten sichtbaren Assistententext, andernfalls aus bereinigtem letztem `tool`-/`toolResult`-Text; terminal fehlgeschlagene Läufe melden einen Fehlerstatus, ohne erfassten Antworttext erneut wiederzugeben
  - eine Folgeanweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll
- `Status` wird nicht aus der Modellausgabe abgeleitet; er stammt aus Laufzeitsignalen.
- Bei Timeout kann die Ankündigung den Verlauf auf eine kurze Zusammenfassung des Teilfortschritts reduzieren, wenn das Kind nur bis zu Tool-Aufrufen kam, statt rohe Tool-Ausgabe wiederzugeben.

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (selbst bei Wrapping):

- Runtime (z. B. `runtime 5m12s`)
- Token-Nutzung (Eingabe/Ausgabe/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transcript-Pfad (damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann)
- Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten sollten in normale Assistentenstimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistenten-Recall wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - Scaffold-Blöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Payload-Blöcke von Tool-Aufrufen in Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestufte Gerüste für Tool-Call/Result und historische Kontextmarker werden entfernt
  - geleakte Modell-Steuerungstokens wie `<|assistant|>`, andere ASCII-
    Tokens vom Typ `<|...|>` und Full-Width-Varianten `<｜...｜>` werden entfernt
  - fehlerhaftes Tool-Call-XML von MiniMax wird entfernt
- Text mit Anmeldedaten-/Token-Charakter wird geschwärzt
- lange Blöcke können gekürzt werden
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- die rohe Prüfung des Transcripts auf Festplatte ist der Fallback, wenn Sie das vollständige Byte-für-Byte-Transcript benötigen

## Tool-Richtlinie (Unteragenten-Tools)

Standardmäßig erhalten Unteragenten **alle Tools außer Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht; es ist
kein roher Transcript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Unteragenten der Tiefe 1 als Orchestratoren zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Kinder verwalten können.

Überschreibung über Konfiguration:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny hat Vorrang
        deny: ["gateway", "cron"],
        // wenn allow gesetzt ist, wird daraus allow-only (deny hat weiterhin Vorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Parallelität

Unteragenten verwenden eine dedizierte In-Process-Queue-Lane:

- Lane-Name: `subagent`
- Parallelität: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Stoppen

- Das Senden von `/stop` im Chat des Anfragenden bricht die Sitzung des Anfragenden ab und stoppt alle aktiven Unteragentenläufe, die daraus gestartet wurden, kaskadierend bis zu verschachtelten Kindern.
- `/subagents kill <id>` stoppt einen bestimmten Unteragenten und kaskadiert zu seinen Kindern.

## Einschränkungen

- Die Ankündigung von Unteragenten erfolgt **nach Best Effort**. Wenn das Gateway neu startet, geht ausstehende „zurück ankündigen“-Arbeit verloren.
- Unteragenten teilen sich weiterhin dieselben Prozessressourcen des Gateway; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` blockiert niemals: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Unteragenten injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard: 5, Bereich: 1–20).

## Verwandt

- [ACP Agents](/de/tools/acp-agents)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Agent send](/de/tools/agent-send)
