---
read_when:
    - Du möchtest Hintergrund-/Parallelarbeit über den Agenten
    - Du änderst `sessions_spawn` oder die Tool-Richtlinie für Sub-Agents
    - Du implementierst oder behebst threadgebundene Subagent-Sessions
summary: 'Sub-Agents: isolierte Agent-Läufe starten, die Ergebnisse zurück in den anfragenden Chat ankündigen'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-05T12:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-Agents

Sub-Agents sind Hintergrund-Agent-Läufe, die aus einem bestehenden Agent-Lauf heraus gestartet werden. Sie laufen in ihrer eigenen Session (`agent:<agentId>:subagent:<uuid>`) und **kündigen** ihr Ergebnis nach Abschluss zurück im Chat-Channel des Anfragenden an. Jeder Sub-Agent-Lauf wird als [background task](/de/automation/tasks) verfolgt.

## Slash-Befehl

Verwende `/subagents`, um Sub-Agent-Läufe für die **aktuelle Session** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerung für Thread-Bindungen:

Diese Befehle funktionieren auf Channels, die persistente Thread-Bindungen unterstützen. Siehe **Channels mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Lauf-Metadaten (Status, Zeitstempel, Session-ID, Transkriptpfad, Bereinigung).
Verwende `sessions_history` für eine begrenzte, sicherheitsgefilterte Ansicht des Verlaufs; prüfe den
Transkriptpfad auf dem Datenträger, wenn du das rohe vollständige Transkript brauchst.

### Spawn-Verhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agenten als Benutzerbefehl, nicht als internen Relay, und sendet ein finales Abschluss-Update zurück in den Chat des Anfragenden, wenn der Lauf beendet ist.

- Der Spawn-Befehl blockiert nicht; er gibt sofort eine Lauf-ID zurück.
- Nach Abschluss kündigt der Sub-Agent eine Zusammenfassung/Ergebnisnachricht im Chat-Channel des Anfragenden an.
- Der Abschluss ist push-basiert. Sobald er gestartet wurde, solltest du nicht in einer Schleife `/subagents list`,
  `sessions_list` oder `sessions_history` pollen, nur um auf das Ende zu warten; prüfe den Status nur bei Bedarf zur Fehlersuche oder für Eingriffe.
- Nach Abschluss schließt OpenClaw best-effort verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Session geöffnet wurden, bevor der Bereinigungsablauf der Ankündigung weiterläuft.
- Für manuelle Spawns ist die Zustellung robust:
  - OpenClaw versucht zuerst direkte `agent`-Zustellung mit einem stabilen Idempotenz-Schlüssel.
  - Wenn direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
  - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
- Die Zustellung des Abschlusses behält die aufgelöste Route des Anfragenden bei:
  - threadgebundene oder konversationsgebundene Abschlussrouten gewinnen, wenn verfügbar
  - wenn der Abschluss-Ursprung nur einen Channel angibt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfragenden Session (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin funktioniert
- Die Abschluss-Übergabe an die Session des Anfragenden ist intern zur Laufzeit erzeugter Kontext (kein vom Benutzer verfasster Text) und enthält:
  - `Result` (neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester `tool`-/`toolResult`-Text)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellanweisung, die dem anfragenden Agenten sagt, in normaler Assistentenstimme umzuschreiben (keine rohen internen Metadaten weiterleiten)
- `--model` und `--thinking` überschreiben die Standardwerte für genau diesen Lauf.
- Verwende `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
- `/subagents spawn` ist Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sessions verwende `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sessions (Codex, Claude Code, Gemini CLI) verwende `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/tools/acp-agents).

Primäre Ziele:

- „Recherche / lange Aufgabe / langsames Tool“-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Session-Trennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Session-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu Kosten: Jeder Sub-Agent hat seinen **eigenen** Kontext und eigenen Token-Verbrauch. Für schwere oder wiederkehrende
Aufgaben setze ein günstigeres Modell für Sub-Agents und behalte deinen Hauptagenten auf einem hochwertigeren Modell.
Du kannst dies über `agents.defaults.subagents.model` oder agentenspezifische Overrides konfigurieren.

## Tool

Verwende `sessions_spawn`:

- Startet einen Sub-Agent-Lauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort in den Chat-Channel des Anfragenden
- Standardmodell: übernimmt den Aufrufer, außer du setzt `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`); ein explizites `sessions_spawn.model` gewinnt weiterhin.
- Standard-Reasoning: übernimmt den Aufrufer, außer du setzt `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`); ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- Standard-Run-Timeout: Wenn `sessions_spawn.runTimeoutSeconds` weggelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, falls gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter einer anderen Agent-ID starten, falls erlaubt)
- `model?` (optional; überschreibt das Sub-Agent-Modell; ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell weiter, mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt den Thinking-Level für den Sub-Agent-Lauf)
- `runTimeoutSeconds?` (Standard ist `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, sonst `0`; wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen)
- `thread?` (Standard `false`; wenn `true`, wird für diese Sub-Agent-Session eine Channel-Thread-Bindung angefordert)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, wird der Standard zu `session`
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, Standard `keep`)
- `sandbox?` (`inherit|require`, Standard `inherit`; `require` lehnt den Spawn ab, wenn die Laufzeit des Ziel-Childs nicht sandboxed ist)
- `sessions_spawn` akzeptiert **keine** Parameter für Channel-Zustellung (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Für Zustellung verwende `message`/`sessions_send` aus dem gestarteten Lauf.

## Threadgebundene Sessions

Wenn Thread-Bindungen für einen Channel aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an dieselbe Sub-Agent-Session geroutet werden.

### Channels mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Channel): unterstützt persistente threadgebundene Subagent-Sessions (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und Adapter-Schlüssel `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Schneller Ablauf:

1. Starte mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"`).
2. OpenClaw erstellt oder bindet einen Thread an dieses Session-Ziel im aktiven Channel.
3. Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Session geroutet.
4. Verwende `/session idle`, um automatisches Entfokussieren bei Inaktivität zu prüfen/aktualisieren, und `/session max-age`, um die harte Obergrenze zu steuern.
5. Verwende `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerung:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Session-Ziel.
- `/unfocus` entfernt die Bindung für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Bindungszustand auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Channel-Override- und Spawn-Auto-Bind-Schlüssel sind adapterspezifisch. Siehe **Channels mit Thread-Unterstützung** oben.

Siehe [Configuration Reference](/de/gateway/configuration-reference) und [Slash commands](/tools/slash-commands) für aktuelle Adapter-Details.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agent-IDs, die über `agentId` angesprochen werden dürfen (`["*"]`, um beliebige zu erlauben). Standard: nur der anfragende Agent.
- `agents.defaults.subagents.allowAgents`: Standard-Allowlist für Ziel-Agenten, wenn der anfragende Agent nicht seine eigene `subagents.allowAgents` setzt.
- Guard für Sandbox-Vererbung: Wenn die anfragende Session sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: wenn `true`, blockiert `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl). Standard: false.

Erkennung:

- Verwende `agents_list`, um zu sehen, welche Agent-IDs derzeit für `sessions_spawn` erlaubt sind.

Auto-Archivierung:

- Sub-Agent-Sessions werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard: 60).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript dennoch durch Umbenennung).
- Auto-Archivierung ist best-effort; ausstehende Timer gehen verloren, wenn das Gateway neu gestartet wird.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Session bleibt bis zur Auto-Archivierung bestehen.
- Auto-Archivierung gilt gleichermaßen für Sessions der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist getrennt von Archiv-Bereinigung: verfolgte Browser-Tabs/Prozesse werden best-effort geschlossen, wenn der Lauf endet, auch wenn Transkript/Session-Eintrag erhalten bleiben.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten (`maxSpawnDepth: 1`). Du kannst eine Ebene der Verschachtelung aktivieren, indem du `maxSpawnDepth: 2` setzt; das erlaubt das **Orchestrator-Muster**: main → Orchestrator-Sub-Agent → Worker-Sub-Sub-Agents.

### So wird es aktiviert

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // erlaubt Sub-Agents, Childs zu starten (Standard: 1)
        maxChildrenPerAgent: 5, // maximale Anzahl aktiver Childs pro Agent-Session (Standard: 5)
        maxConcurrent: 8, // globale Concurrency-Lane-Obergrenze (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn weggelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenstufen

| Tiefe | Form des Session-Keys                        | Rolle                                        | Kann Childs starten?         |
| ----- | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hauptagent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                  | Niemals                      |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet → kündigt seinem Parent an (Orchestrator der Tiefe 1)
2. Orchestrator der Tiefe 1 erhält die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt main an
3. Der Hauptagent erhält die Ankündigung und liefert an den Benutzer aus

Jede Ebene sieht nur Ankündigungen ihrer direkten Childs.

Betriebshinweise:

- Starte Child-Arbeit einmal und warte auf Abschlussereignisse, statt Poll-
  Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-Sleep-Befehle zu bauen.
- Wenn ein Child-Abschlussereignis eintrifft, nachdem du bereits die finale Antwort gesendet hast,
  ist die korrekte Folgeaktion das exakte stille Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Spawn in Session-Metadaten geschrieben. Das verhindert, dass flache oder wiederhergestellte Session-Keys versehentlich wieder Orchestrator-Rechte erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit Childs verwaltet werden können. Andere Session-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Session-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker)**: Keine Session-Tools — `sessions_spawn` ist auf Tiefe 2 immer verweigert. Es können keine weiteren Childs gestartet werden.

### Spawn-Limit pro Agent

Jede Agent-Session (in beliebiger Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Childs gleichzeitig haben. Das verhindert unkontrolliertes Aufspalten von einem einzelnen Orchestrator aus.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle Childs der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten der Tiefe 1 und kaskadiert zu deren Childs der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Childs.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Die Authentifizierung für Sub-Agents wird anhand der **Agent-ID** aufgelöst, nicht anhand des Session-Typs:

- Der Session-Key des Sub-Agenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Hauptagenten werden als **Fallback** zusammengeführt; bei Konflikten überschreiben Agent-Profile die Profile von main.

Hinweis: Das Zusammenführen ist additiv, daher sind Profile von main immer als Fallbacks verfügbar. Vollständig isolierte Authentifizierung pro Agent wird derzeit noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Session (nicht in der Session des Anfragenden).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext das exakte stille Token `NO_REPLY` / `no_reply` ist,
  wird die Ankündigungsausgabe unterdrückt, selbst wenn es zuvor sichtbaren Fortschritt gab.
- Andernfalls hängt die Zustellung von der Tiefe des Anfragenden ab:
  - Sessions von Anfragenden auf oberster Ebene verwenden einen nachgelagerten `agent`-Aufruf mit externer Zustellung (`deliver=true`)
  - verschachtelte Subagent-Sessions des Anfragenden erhalten eine interne Follow-up-Injektion (`deliver=false`), sodass der Orchestrator Child-Ergebnisse in der Session synthetisieren kann
  - wenn eine verschachtelte Session eines anfragenden Subagenten nicht mehr existiert, fällt OpenClaw, wenn möglich, auf den Anfragenden dieser Session zurück
- Für Sessions von Anfragenden auf oberster Ebene löst direkte Zustellung im Completion-Modus zuerst jede gebundene Konversations-/Thread-Route und jeden Hook-Override auf und ergänzt dann fehlende Channel-Zielfelder aus der gespeicherten Route der anfragenden Session. So bleiben Abschlüsse im richtigen Chat/Topic, selbst wenn der Abschluss-Ursprung nur den Channel identifiziert.
- Die Aggregation von Child-Abschlüssen ist beim Erstellen verschachtelter Completion-Funde auf den aktuellen Lauf des Anfragenden beschränkt, damit keine veralteten Child-Ausgaben früherer Läufe in die aktuelle Ankündigung gelangen.
- Ankündigungsantworten behalten Thread-/Topic-Routing bei, wenn dies in Channel-Adaptern verfügbar ist.
- Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Child-Session-Key/-ID
  - Ankündigungstyp + Aufgabenlabel
  - Statuszeile aus Laufzeitsignalen (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt aus dem neuesten sichtbaren Assistententext, andernfalls aus bereinigtem neuesten `tool`-/`toolResult`-Text
  - eine Follow-up-Anweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll
- `Status` wird nicht aus der Modellausgabe abgeleitet; er stammt aus Laufzeitsignalen.
- Bei Timeout kann die Ankündigung, wenn das Child nur Tool-Aufrufe geschafft hat, diesen Verlauf in eine kurze Zusammenfassung des Teilfortschritts zusammenziehen, statt rohe Tool-Ausgabe erneut wiederzugeben.

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Laufzeit (z. B. `runtime 5m12s`)
- Token-Verbrauch (Eingabe/Ausgabe/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transkriptpfad (damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann)
- Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistentenstimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistenten-Recall wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>` / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - Klartext-XML-Payload-Blöcke für Tool-Aufrufe wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen wurden
  - herabgestuftes Tool-Call-/Result-Gerüst und Marker für historischen Kontext werden entfernt
  - durchgesickerte Kontroll-Tokens des Modells wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Tokens und Full-Width-Varianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-XML für Tool-Aufrufe wird entfernt
- Credentials-/Token-ähnlicher Text wird geschwärzt
- lange Blöcke können abgeschnitten werden
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- die Prüfung des rohen On-Disk-Transkripts ist der Fallback, wenn du das vollständige Byte-für-Byte-Transkript brauchst

## Tool-Richtlinie (Sub-Agent-Tools)

Standardmäßig erhalten Sub-Agents **alle Tools außer Session-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht; es ist
kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Childs verwalten können.

Per Konfiguration überschreiben:

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
        // deny gewinnt
        deny: ["gateway", "cron"],
        // wenn allow gesetzt ist, wird es zur exklusiven Allowlist (deny gewinnt weiterhin)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Nebenläufigkeit

Sub-Agents verwenden eine dedizierte In-Process-Queue-Lane:

- Lane-Name: `subagent`
- Nebenläufigkeit: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Stoppen

- Das Senden von `/stop` im Chat des Anfragenden bricht die anfragende Session ab und stoppt alle aktiven Sub-Agent-Läufe, die daraus gestartet wurden, einschließlich kaskadierender Childs.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Childs.

## Einschränkungen

- Die Ankündigung von Sub-Agents ist **best-effort**. Wenn das Gateway neu startet, geht ausstehende „zurück ankündigen“-Arbeit verloren.
- Sub-Agents teilen sich weiterhin dieselben Prozessressourcen des Gateway; betrachte `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` blockiert nie: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Sub-Agents injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Childs pro Session (Standard: 5, Bereich: 1–20).
