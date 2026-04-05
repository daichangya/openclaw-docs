---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Channels einrichten
    - Eine Message-Channel-Konversation an eine persistente ACP-Sitzung binden
    - ACP-Backend- und Plugin-Verdrahtung debuggen
    - Befehle `/acp` aus dem Chat bedienen
summary: ACP-Runtime-Sitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agents verwenden
title: ACP-Agents
x-i18n:
    generated_at: "2026-04-05T12:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agents

Sitzungen mit dem [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Runtime weiterleiten (nicht an die native Sub-Agent-Runtime). Jeder ACP-Sitzungsstart wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Wenn Sie möchten, dass Codex oder Claude Code sich stattdessen direkt als externer MCP-Client
mit bestehenden OpenClaw-Channel-Konversationen verbindet, verwenden Sie
[`openclaw mcp serve`](/cli/mcp) anstelle von ACP.

## Welche Seite brauche ich?

Es gibt drei nahe beieinanderliegende Oberflächen, die leicht verwechselt werden können:

| Sie möchten ...                                                                     | Verwenden Sie dies                    | Hinweise                                                                                                          |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _durch_ OpenClaw ausführen | Diese Seite: ACP-Agents               | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerung |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                            |
| Eine lokale KI-CLI als reines Text-Fallback-Modell wiederverwenden                  | [CLI Backends](/de/gateway/cli-backends) | Kein ACP. Keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Runtime                                        |

## Funktioniert das sofort?

Normalerweise ja.

- Neue Installationen werden jetzt standardmäßig mit aktiviertem gebündeltem Runtime-Plugin `acpx` ausgeliefert.
- Das gebündelte Plugin `acpx` bevorzugt seine pluginlokal fixierte `acpx`-Binärdatei.
- Beim Start prüft OpenClaw diese Binärdatei und repariert sie bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was bei der ersten Verwendung trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann bei der ersten Nutzung dieses Harnesses bei Bedarf mit `npx` abgerufen werden.
- Die Hersteller-Authentifizierung muss auf dem Host weiterhin für dieses Harness vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugriff hat, können Adapterabrufe beim ersten Start fehlschlagen, bis Caches vorgewärmt sind oder der Adapter auf andere Weise installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter benötigt möglicherweise weiterhin einen ersten Abruf.
- `/acp spawn claude`: dasselbe gilt für den Claude-ACP-Adapter sowie für die Claude-seitige Authentifizierung auf diesem Host.

## Schneller Operator-Ablauf

Verwenden Sie dies, wenn Sie ein praktisches Runbook für `/acp` möchten:

1. Eine Sitzung starten:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder im Thread arbeiten (oder diesen Sitzungsschlüssel explizit angeben).
3. Runtime-Status prüfen:
   - `/acp status`
4. Runtime-Optionen nach Bedarf anpassen:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Einer aktiven Sitzung einen Hinweis geben, ohne den Kontext zu ersetzen:
   - `/acp steer Logging verschärfen und fortfahren`
6. Arbeit beenden:
   - `/acp cancel` (aktuellen Turn stoppen), oder
   - `/acp close` (Sitzung schließen + Bindungen entfernen)

## Schnellstart für Menschen

Beispiele für natürliche Anfragen:

- „Binde diesen Discord-Channel an Codex.“
- „Starte hier eine persistente Codex-Sitzung in einem Thread und halte sie fokussiert.“
- „Führe das als einmalige Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und behalte Folgeanfragen im selben Workspace.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und behalte Folgeanfragen dann in demselben Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` wählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Konversation angefordert wurde und der aktive Channel dies unterstützt, die ACP-Sitzung an diese Konversation binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wurde und der aktuelle Channel dies unterstützt, die ACP-Sitzung an den Thread binden.
5. Gebundene Folge-Nachrichten an dieselbe ACP-Sitzung weiterleiten, bis sie entfokussiert/geschlossen/abgelaufen ist.

## ACP im Vergleich zu Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie Sub-Agents, wenn Sie OpenClaw-native delegierte Ausführungen möchten.

| Bereich       | ACP-Sitzung                           | Sub-Agent-Ausführung                |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime   |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`   |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                    |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agents](/tools/subagents).

## So führt ACP Claude Code aus

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Sitzungs-Control-Plane
2. gebündeltes Runtime-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Runtime-/Sitzungsmechanik

Wichtige Unterscheidung:

- ACP-Claude ist nicht dasselbe wie die direkte Fallback-Runtime `claude-cli/...`.
- ACP-Claude ist eine Harness-Sitzung mit ACP-Steuerung, Sitzungswiederaufnahme, Hintergrundaufgaben-Verfolgung und optionaler Konversations-/Thread-Bindung.
- `claude-cli/...` ist ein reines lokales CLI-Backend für Text. Siehe [CLI Backends](/de/gateway/cli-backends).

Für Operatoren lautet die praktische Regel:

- Sie möchten `/acp spawn`, bindbare Sitzungen, Runtime-Steuerung oder persistente Harness-Arbeit: Verwenden Sie ACP
- Sie möchten ein einfaches lokales Text-Fallback über die rohe CLI: Verwenden Sie CLI-Backends

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

Verwenden Sie `/acp spawn <harness> --bind here`, wenn Sie möchten, dass die aktuelle Konversation zu einem dauerhaften ACP-Workspace wird, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw behält die Kontrolle über Channel-Transport, Authentifizierung, Sicherheit und Zustellung.
- Die aktuelle Konversation wird an den gestarteten ACP-Sitzungsschlüssel angeheftet.
- Folge-Nachrichten in dieser Konversation werden an dieselbe ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung der aktuellen Konversation.

Was das in der Praxis bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche. Auf Discord bleibt der aktuelle Channel der aktuelle Channel.
- `--bind here` kann trotzdem eine neue ACP-Sitzung erstellen, wenn Sie neue Arbeit starten. Die Bindung hängt diese Sitzung an die aktuelle Konversation.
- `--bind here` erstellt nicht automatisch einen untergeordneten Discord-Thread oder ein Telegram-Thema.
- Die ACP-Runtime kann weiterhin ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen vom Backend verwalteten Workspace auf der Platte haben. Dieser Runtime-Workspace ist von der Chat-Oberfläche getrennt und impliziert keinen neuen Messaging-Thread.
- Wenn Sie an einen anderen ACP-Agenten starten und `--cwd` nicht angeben, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agents**, nicht den des Anfragenden.
- Wenn dieser übernommene Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), fällt OpenClaw auf das Standard-`cwd` des Backends zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der übernommene Workspace existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt `spawn` den tatsächlichen Zugriffsfehler zurück, statt `cwd` wegzulassen.

Mentales Modell:

- Chat-Oberfläche: der Ort, an dem Menschen weiter sprechen (`Discord-Channel`, `Telegram-Thema`, `iMessage-Chat`)
- ACP-Sitzung: der dauerhafte Runtime-Status von Codex/Claude/Gemini, an den OpenClaw weiterleitet
- untergeordneter Thread/Thema: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Runtime-Workspace: der Dateisystemort, an dem das Harness ausgeführt wird (`cwd`, Repo-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Sitzung starten oder anhängen und zukünftige Nachrichten hierhin an sie weiterleiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/ein Thema erstellen und die ACP-Sitzung daran binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für die Bindung der aktuellen Konversation:

- Chat-/Message-Channels, die Unterstützung für die Bindung der aktuellen Konversation ankündigen, können `--bind here` über den gemeinsamen Pfad für Konversationsbindungen verwenden.
- Channels mit benutzerdefinierter Thread-/Themen-Semantik können weiterhin channel-spezifische Kanonisierung hinter derselben gemeinsamen Schnittstelle bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation direkt binden“.
- Allgemeine Bindungen der aktuellen Konversation verwenden den gemeinsamen OpenClaw-Binding-Store und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Channel oder Thread direkt. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Channel keine ACP-Bindungen für die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung zurück, dass dies nicht unterstützt wird.
- `resume` und Fragen zu „neuer Sitzung“ sind ACP-Sitzungsfragen, keine Channel-Fragen. Sie können Runtime-Status wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### Thread-gebundene Sitzungen

Wenn Thread-Bindings für einen Channel-Adapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Folge-Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
- ACP-Ausgaben werden an denselben Thread zurückgeliefert.
- Entfokussieren/Schließen/Archivieren/Ablauf durch Idle-Timeout oder max-age entfernt die Bindung.

Die Unterstützung für Thread-Bindings ist adapterspezifisch. Wenn der aktive Channel-Adapter Thread-Bindings nicht unterstützt, gibt OpenClaw eine klare Meldung zurück, dass dies nicht unterstützt/verfügbar ist.

Erforderliche Feature-Flags für threadgebundenes ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (auf `false` setzen, um ACP-Dispatch anzuhalten)
- ACP-Thread-Spawn-Flag des Channel-Adapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channels mit Thread-Unterstützung

- Jeder Channel-Adapter, der Sitzungs-/Thread-Binding-Fähigkeiten bereitstellt.
- Aktuell integrierte Unterstützung:
  - Discord-Threads/-Channels
  - Telegram-Themen (Forenthemen in Gruppen/Supergroups und DM-Themen)
- Plugin-Channels können über dieselbe Binding-Schnittstelle Unterstützung hinzufügen.

## Channelspezifische Einstellungen

Für nicht ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in Top-Level-Einträgen `bindings[]`.

### Binding-Modell

- `bindings[].type="acp"` kennzeichnet eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Ziel-Konversation:
  - Discord-Channel oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forenthema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die besitzende OpenClaw-Agent-ID.
- Optionale ACP-Überschreibungen befinden sich unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Runtime-Standards pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standards einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Vorrang von Überschreibungen für gebundene ACP-Sitzungen:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globale ACP-Standards (zum Beispiel `acp.backend`)

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Verhalten:

- OpenClaw stellt vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung existiert.
- Nachrichten in diesem Channel oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel direkt zurück.
- Temporäre Runtime-Bindings (zum Beispiel durch Thread-Focus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Für kanalübergreifende ACP-Starts ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agents aus der Agent-Konfiguration.
- Fehlende übernommene Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; tatsächliche Zugriffsfehler werden als Spawn-Fehler ausgegeben.

## ACP-Sitzungen starten (Schnittstellen)

### Über `sessions_spawn`

Verwenden Sie `runtime: "acp"`, um eine ACP-Sitzung aus einem Agent-Turn oder Tool-Aufruf zu starten.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Hinweise:

- `runtime` ist standardmäßig `subagent`; setzen Sie also für ACP-Sitzungen explizit `runtime: "acp"`.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern konfiguriert.
- `mode: "session"` erfordert `thread: true`, damit eine persistente gebundene Konversation erhalten bleibt.

Schnittstellendetails:

- `task` (erforderlich): initialer Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
- `thread` (optional, Standard `false`): fordert, wo unterstützt, einen Thread-Binding-Flow an.
- `mode` (optional): `run` (einmalig) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` und `mode` ausgelassen wird, kann OpenClaw je nach Runtime-Pfad standardmäßig persistentes Verhalten wählen
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Arbeitsverzeichnis der Runtime (validiert durch Backend-/Runtime-Richtlinie). Wenn ausgelassen, übernimmt ACP-Spawn den Workspace des Ziel-Agents, sofern konfiguriert; fehlende übernommene Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitige Bezeichnung, die in Sitzungs-/Banner-Text verwendet wird.
- `resumeSessionId` (optional): eine vorhandene ACP-Sitzung wiederaufnehmen, statt eine neue zu erstellen. Der Agent spielt den Gesprächsverlauf über `session/load` erneut ein. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Zusammenfassungen des Fortschritts der initialen ACP-Ausführung als Systemereignisse an die anfragende Sitzung zurück.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, der auf ein sitzungsspezifisches JSONL-Log (`<sessionId>.acp-stream.jsonl`) zeigt, das Sie für den vollständigen Relay-Verlauf verfolgen können.

### Eine vorhandene Sitzung wiederaufnehmen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Gesprächsverlauf über `session/load` erneut ein, sodass er mit dem vollständigen Kontext der vorherigen Arbeit fortfährt.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop an das Telefon übergeben — weisen Sie Ihren Agent an, dort weiterzumachen, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, nun headless über Ihren Agent
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — bei Verwendung mit der Sub-Agent-Runtime wird ein Fehler zurückgegeben.
- `resumeSessionId` stellt den Upstream-ACP-Gesprächsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, sodass `mode: "session"` weiterhin `thread: true` erfordert.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stillschweigender Fallback auf eine neue Sitzung.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie schnell live prüfen möchten, ob ACP-Spawn tatsächlich Ende-zu-Ende funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Die bereitgestellte Gateway-Version/den Commit auf dem Ziel-Host verifizieren.
2. Bestätigen, dass der bereitgestellte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agenten bitten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - Aufgabe: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifizieren, dass der Agent Folgendes meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validatorfehler
6. Die temporäre ACPX-Bridge-Sitzung aufräumen.

Beispiel-Prompt für den Live-Agenten:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halten Sie diesen Smoke-Test auf `mode: "run"`, es sei denn, Sie testen absichtlich
  persistente ACP-Sitzungen mit Thread-Binding.
- Verlangen Sie für das grundlegende Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  Anforderer-/Sitzungsfähigkeiten ab und ist eine separate Integrationsprüfung.
- Behandeln Sie tests mit Thread-Binding und `mode: "session"` als zweiten, umfassenderen Integrationsdurchlauf aus einem echten Discord-Thread oder Telegram-Thema.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, nicht in der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine durch die Sandbox erzwungene Ausführung benötigen.

### Über den Befehl `/acp`

Verwenden Sie `/acp spawn` bei Bedarf für explizite Operator-Steuerung aus dem Chat.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Wichtige Flags:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Siehe [Slash Commands](/tools/slash-commands).

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren optional ein Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Auflösungsreihenfolge:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Sitzungs-ID
   - dann die Bezeichnung
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfragende Sitzung

Bindungen der aktuellen Konversation und Thread-Bindings nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Bind-Modi für Spawn

`/acp spawn` unterstützt `--bind here|off`.

| Modus | Verhalten                                                              |
| ----- | ---------------------------------------------------------------------- |
| `here` | Die aktuelle aktive Konversation direkt binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Keine Bindung der aktuellen Konversation erstellen.                   |

Hinweise:

- `--bind here` ist der einfachste Operator-Pfad für „diesen Channel oder Chat mit Codex absichern“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur auf Channels verfügbar, die Unterstützung für die Bindung der aktuellen Konversation bereitstellen.
- `--bind` und `--thread` können nicht im selben Aufruf von `/acp spawn` kombiniert werden.

## Thread-Modi für Spawn

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus | Verhalten                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------ |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, wenn unterstützt. |
| `here` | Einen aktuell aktiven Thread voraussetzen; fehlschlagen, wenn Sie sich nicht in einem Thread befinden. |
| `off`  | Keine Bindung. Die Sitzung wird ungebunden gestartet.                                                 |

Hinweise:

- Auf Oberflächen ohne Thread-Binding ist das Standardverhalten effektiv `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Channel-Richtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen untergeordneten Thread zu erstellen.

## ACP-Steuerung

Verfügbare Befehlsfamilie:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` zeigt die effektiven Runtime-Optionen und, sofern verfügbar, sowohl Runtime- als auch backendseitige Sitzungskennungen.

Einige Steuerungen hängen von den Fähigkeiten des Backends ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren unsupported-control-Fehler zurück.

## Kochbuch für ACP-Befehle

| Befehl               | Was er tut                                                 | Beispiel                                                      |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Ziel-Sitzung abbrechen.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an die laufende Sitzung senden.            | `/acp steer --session support inbox failing tests priorisieren` |
| `/acp close`         | Sitzung schließen und Thread-Ziele lösen.                  | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Zustand, Runtime-Optionen, Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Ziel-Sitzung setzen.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Generischer Schreibzugriff auf Runtime-Konfigurationsoptionen. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Arbeitsverzeichnisses der Runtime setzen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für Freigaberichtlinien setzen.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout setzen (Sekunden).                         | `/acp timeout 120`                                            |
| `/acp model`         | Modellüberschreibung der Runtime setzen.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen von Runtime-Optionen für die Sitzung entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Store auflisten.              | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Gesundheit, Fähigkeiten, umsetzbare Korrekturen.   | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                                |

`/acp sessions` liest den Store für die aktuell gebundene oder anfragende Sitzung. Befehle, die `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über die Gateway-Sitzungserkennung auf, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

## Zuordnung von Runtime-Optionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird der Runtime-Konfigurationsschlüssel `model` zugeordnet.
- `/acp permissions <profile>` wird dem Runtime-Konfigurationsschlüssel `approval_policy` zugeordnet.
- `/acp timeout <seconds>` wird dem Runtime-Konfigurationsschlüssel `timeout` zugeordnet.
- `/acp cwd <path>` aktualisiert die Überschreibung des Runtime-`cwd` direkt.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad für die `cwd`-Überschreibung.
- `/acp reset-options` löscht alle Runtime-Überschreibungen für die Ziel-Sitzung.

## Unterstützung für acpx-Harnesses (aktuell)

Aktuelle integrierte acpx-Harness-Aliase:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Wenn OpenClaw das Backend acpx verwendet, bevorzugen Sie diese Werte für `agentId`, es sei denn, Ihre acpx-Konfiguration definiert benutzerdefinierte Agent-Aliase.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agents in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Die direkte Verwendung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Escape-Hatch ist eine Funktion der acpx-CLI (nicht der normale OpenClaw-Pfad über `agentId`).

## Erforderliche Konfiguration

ACP-Basis in Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch anzuhalten, während /acp-Steuerung erhalten bleibt.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Die Konfiguration für Thread-Bindings ist channelspezifisch pro Adapter. Beispiel für Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Wenn threadgebundener ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindungen der aktuellen Konversation erfordern keine Erstellung untergeordneter Threads. Sie erfordern einen aktiven Konversationskontext und einen Channel-Adapter, der ACP-Konversationsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Setup für das acpx-Backend

Neue Installationen enthalten standardmäßig das aktivierte gebündelte Runtime-Plugin `acpx`, sodass ACP
normalerweise ohne manuellen Plugin-Installationsschritt funktioniert.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` blockiert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie dann die Backend-Gesundheit:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte Backend-Plugin acpx (`acpx`) die pluginlokal fixierte Binärdatei:

1. Der Befehl verwendet standardmäßig `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version verwendet standardmäßig die Fixierung der Extension.
3. Beim Start registriert sich das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrundjob zur Sicherstellung prüft `acpx --version`.
5. Wenn die pluginlokale Binärdatei fehlt oder nicht passt, wird ausgeführt:
   `npm install --omit=dev --no-save acpx@<pinned>` und anschließend erneut geprüft.

Sie können Befehl/Version in der Plugin-Konfiguration überschreiben:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Hinweise:

- `command` akzeptiert einen absoluten Pfad, relativen Pfad oder Befehlsnamen (`acpx`).
- Relative Pfade werden vom OpenClaw-Workspace-Verzeichnis aus aufgelöst.
- `expectedVersion: "any"` deaktiviert die strikte Versionsprüfung.
- Wenn `command` auf eine benutzerdefinierte Binärdatei/einen benutzerdefinierten Pfad zeigt, ist die pluginlokale Auto-Installation deaktiviert.
- Der Start von OpenClaw bleibt nicht blockierend, während die Gesundheitsprüfung des Backends läuft.

Siehe [Plugins](/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die Laufzeitabhängigkeiten von acpx
(plattformspezifische Binärdateien) automatisch über einen postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen **nicht** die von Plugins in OpenClaw registrierten Tools für
das ACP-Harness bereit.

Wenn Sie möchten, dass ACP-Agents wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen können, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Fügt beim Bootstrap von ACPX-Sitzungen einen integrierten MCP-Server mit dem Namen `openclaw-plugin-tools` ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Belässt die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauensgrenzen:

- Dadurch wird die Tool-Oberfläche des ACP-Harnesses erweitert.
- ACP-Agents erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie das Ausführen dieser Plugins in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Bridge für Plugin-Tools ist
eine zusätzliche optionale Komfortfunktion, kein Ersatz für die generische MCP-Server-Konfiguration.

## Konfiguration von Berechtigungen

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Berechtigungsabfragen für Dateischreibvorgänge und Shell-Ausführung zu bestätigen oder abzulehnen. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Freigaben und getrennt von herstellerspezifischen Bypass-Flags von CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Rückfrage ausführen kann.

| Wert            | Verhalten                                                     |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreiben und Ausführung erfordern Aufforderungen. |
| `deny-all`      | Alle Berechtigungsabfragen ablehnen.                          |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsabfrage angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**          |
| `deny` | Berechtigung stillschweigend ablehnen und fortfahren (sanfte Verschlechterung). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway nach dem Ändern dieser Werte neu.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Ausführungsvorgang, der eine Berechtigungsabfrage auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen sich sanft verschlechtern, statt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                           | Behebung                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                        | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                       | `acp.enabled=true` setzen.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                         | `acp.dispatch.enabled=true` setzen.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent befindet sich nicht in der Allowlist.                                       | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                 |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                            | `/acp sessions` ausführen, exakten Schlüssel/Label kopieren, erneut versuchen.                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                  | Zum Ziel-Chat/-Channel wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter unterstützt keine ACP-Bindung der aktuellen Konversation.                 | `/acp spawn ... --thread ...` verwenden, sofern unterstützt, Top-Level-`bindings[]` konfigurieren oder zu einem unterstützten Channel wechseln.                    |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                  | Zum Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                             | Als Besitzer neu binden oder eine andere Konversation/einen anderen Thread verwenden.                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter unterstützt keine Thread-Binding-Fähigkeit.                               | `--thread off` verwenden oder zu einem unterstützten Adapter/Channel wechseln.                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft hostseitig; die anfragende Sitzung ist sandboxed.               | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Runtime angefordert.                            | `runtime="subagent"` für erforderliche Sandboxing verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung nutzen.                              |
| Fehlende ACP-Metadaten für gebundene Sitzung                                | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                        | Mit `/acp spawn` neu erstellen, dann Thread neu binden/fokussieren.                                                                                                 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreiben/Ausführung in nicht interaktiver ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Konfiguration von Berechtigungen](#konfiguration-von-berechtigungen). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                             | Berechtigungsabfragen werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für sanfte Verschlechterung `nonInteractivePermissions=deny`. |
| ACP-Sitzung hängt unbegrenzt nach Abschluss der Arbeit                      | Harness-Prozess wurde beendet, aber die ACP-Sitzung meldete keinen Abschluss.     | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                            |
