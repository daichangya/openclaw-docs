---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sessions auf Messaging-Kanälen einrichten
    - Eine Konversation eines Nachrichtenkanals an eine persistente ACP-Session binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Betrieb von `/acp`-Befehlen aus dem Chat
summary: ACP-Laufzeit-Sessions für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agents verwenden
title: ACP-Agents
x-i18n:
    generated_at: "2026-04-07T06:21:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agents

Sessions mit dem [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Laufzeit weiterleiten (nicht an die native Sub-Agent-Laufzeit). Jede ACP-Session-Erzeugung wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client direkt
eine Verbindung zu bestehenden OpenClaw-Kanal-Konversationen herstellt, verwenden Sie
statt ACP [`openclaw mcp serve`](/cli/mcp).

## Welche Seite brauche ich?

Es gibt drei nahe verwandte Oberflächen, die leicht verwechselt werden können:

| Sie möchten... | Verwenden Sie dies | Hinweise |
| --- | --- | --- |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agents | Chat-gebundene Sessions, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerungen |
| Eine OpenClaw-Gateway-Session _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/cli/acp) | Bridge-Modus. IDE/Client spricht ACP über stdio/WebSocket mit OpenClaw |
| Eine lokale KI-CLI als reinen Text-Fallback für ein Modell wiederverwenden | [CLI Backends](/de/gateway/cli-backends) | Kein ACP. Keine OpenClaw-Tools, keine ACP-Steuerungen, keine Harness-Laufzeit |

## Funktioniert das sofort?

In der Regel ja.

- Neue Installationen werden jetzt mit dem gebündelten Laufzeit-Plugin `acpx` ausgeliefert, das standardmäßig aktiviert ist.
- Das gebündelte Plugin `acpx` bevorzugt sein Plugin-lokales angeheftetes `acpx`-Binary.
- Beim Start prüft OpenClaw dieses Binary und repariert es bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was beim ersten Einsatz trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann beim ersten Einsatz dieses Harnesses bei Bedarf mit `npx` abgerufen werden.
- Anbieter-Authentifizierung muss auf dem Host für dieses Harness weiterhin vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugriff hat, können Adapterabrufe beim ersten Start fehlschlagen, bis Caches vorgewärmt oder der Adapter auf anderem Weg installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter kann trotzdem noch einen Abruf beim ersten Start benötigen.
- `/acp spawn claude`: dieselbe Situation für den Claude-ACP-Adapter, plus Claude-seitige Authentifizierung auf diesem Host.

## Schneller Operator-Ablauf

Verwenden Sie dies, wenn Sie ein praktisches `/acp`-Runbook möchten:

1. Eine Session erzeugen:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder dem Thread arbeiten (oder diesen Session-Key explizit ansprechen).
3. Laufzeitstatus prüfen:
   - `/acp status`
4. Laufzeitoptionen nach Bedarf anpassen:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Eine aktive Session anstoßen, ohne den Kontext zu ersetzen:
   - `/acp steer tighten logging and continue`
6. Arbeit beenden:
   - `/acp cancel` (aktuellen Turn stoppen), oder
   - `/acp close` (Session schließen + Bindungen entfernen)

## Schnellstart für Menschen

Beispiele für natürliche Anfragen:

- „Binde diesen Discord-Kanal an Codex.“
- „Starte eine persistente Codex-Session in einem Thread hier und halte sie fokussiert.“
- „Führe das als einmalige Claude-Code-ACP-Session aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und halte Folgeanfragen im selben Workspace.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und halte Folgeanfragen dann in demselben Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` auswählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Konversation angefordert wird und der aktive Kanal dies unterstützt, die ACP-Session an diese Konversation binden.
4. Andernfalls, wenn Thread-Bindung angefordert wird und der aktuelle Kanal dies unterstützt, die ACP-Session an den Thread binden.
5. Gebundene Folgenachrichten an dieselbe ACP-Session weiterleiten, bis die Session entfokussiert/geschlossen/abgelaufen ist.

## ACP versus Sub-Agents

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie Sub-Agents, wenn Sie OpenClaw-native delegierte Ausführungen möchten.

| Bereich | ACP-Session | Sub-Agent-Ausführung |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Laufzeit |
| Session-Key | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Hauptbefehle | `/acp ...` | `/subagents ...` |
| Spawn-Tool | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Sub-agents](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Session-Control-Plane
2. gebündeltes Laufzeit-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Laufzeit-/Session-Mechanik

Wichtiger Unterschied:

- ACP Claude ist eine Harness-Session mit ACP-Steuerungen, Wiederaufnahme der Session, Nachverfolgung von Hintergrundaufgaben und optionaler Konversations-/Thread-Bindung.
- CLI-Backends sind separate reine Text-Laufzeiten für lokale Fallbacks. Siehe [CLI Backends](/de/gateway/cli-backends).

Für Operatoren gilt praktisch:

- wenn Sie `/acp spawn`, bindbare Sessions, Laufzeitsteuerungen oder persistente Harness-Arbeit möchten: ACP verwenden
- wenn Sie einen einfachen lokalen Text-Fallback über die rohe CLI möchten: CLI Backends verwenden

## Gebundene Sessions

### Bindungen an die aktuelle Konversation

Verwenden Sie `/acp spawn <harness> --bind here`, wenn die aktuelle Konversation zu einem dauerhaften ACP-Workspace werden soll, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw behält die Kontrolle über Kanaltransport, Authentifizierung, Sicherheit und Zustellung.
- Die aktuelle Konversation wird an den erzeugten ACP-Session-Key angeheftet.
- Folgenachrichten in dieser Konversation werden an dieselbe ACP-Session weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Session direkt zurück.
- `/acp close` schließt die Session und entfernt die Bindung an die aktuelle Konversation.

Was das praktisch bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche bei. Auf Discord bleibt der aktuelle Kanal der aktuelle Kanal.
- `--bind here` kann trotzdem eine neue ACP-Session erzeugen, wenn Sie neue Arbeit starten. Die Bindung hängt diese Session an die aktuelle Konversation.
- `--bind here` erstellt nicht von selbst einen untergeordneten Discord-Thread oder ein Telegram-Topic.
- Die ACP-Laufzeit kann trotzdem ein eigenes Arbeitsverzeichnis (`cwd`) oder einen backendverwalteten Workspace auf Datenträger haben. Dieser Laufzeit-Workspace ist von der Chat-Oberfläche getrennt und impliziert keinen neuen Messaging-Thread.
- Wenn Sie zu einem anderen ACP-Agent erzeugen und `--cwd` nicht übergeben, erbt OpenClaw standardmäßig den Workspace des **Ziel-Agents**, nicht den des Anforderers.
- Wenn dieser geerbte Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), fällt OpenClaw auf das Standard-`cwd` des Backends zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der geerbte Workspace existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt der Spawn den echten Zugriffsfehler zurück, statt `cwd` fallen zu lassen.

Mentales Modell:

- Chat-Oberfläche: wo Menschen weiterreden (`Discord-Kanal`, `Telegram-Topic`, `iMessage-Chat`)
- ACP-Session: der dauerhafte Codex-/Claude-/Gemini-Laufzeitstatus, an den OpenClaw weiterleitet
- untergeordneter Thread/Topic: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Laufzeit-Workspace: der Dateisystempfad, in dem das Harness läuft (`cwd`, Repository-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Session erzeugen oder an sie anhängen und zukünftige Nachrichten hier an sie weiterleiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/Topic erstellen und die ACP-Session dort binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindung an die aktuelle Konversation:

- Chat-/Nachrichtenkanäle, die Unterstützung für die Bindung an die aktuelle Konversation bekanntgeben, können `--bind here` über den gemeinsamen Pfad für Konversationsbindungen verwenden.
- Kanäle mit eigener Thread-/Topic-Semantik können trotzdem kanalspezifische Kanonisierung hinter derselben gemeinsamen Schnittstelle bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation direkt binden“.
- Generische Bindungen an die aktuelle Konversation verwenden den gemeinsamen OpenClaw-Binding-Store und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Kanal oder Thread direkt. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Kanal keine ACP-Bindungen an die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung zu fehlender Unterstützung zurück.
- `resume` und Fragen zu „neuer Session“ sind ACP-Session-Fragen, keine Kanalfragen. Sie können Laufzeitstatus wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### Thread-gebundene Sessions

Wenn Thread-Bindings für einen Kanaladapter aktiviert sind, können ACP-Sessions an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Session.
- Folgenachrichten in diesem Thread werden an die gebundene ACP-Session weitergeleitet.
- ACP-Ausgaben werden in denselben Thread zurückgeliefert.
- Entfokussieren/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf der maximalen Lebensdauer entfernt die Bindung.

Die Unterstützung für Thread-Bindings ist adapterspezifisch. Wenn der aktive Kanaladapter keine Thread-Bindings unterstützt, gibt OpenClaw eine klare Meldung zu fehlender Unterstützung/Nichtverfügbarkeit zurück.

Erforderliche Feature-Flags für threadgebundenes ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (auf `false` setzen, um ACP-Dispatch zu pausieren)
- ACP-Thread-Spawn-Flag des Kanaladapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanaladapter, der Fähigkeiten für Session-/Thread-Bindings bereitstellt.
- Aktuelle integrierte Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Topics (Forum-Topics in Gruppen/Supergroups und DM-Topics)
- Plugin-Kanäle können über dieselbe Binding-Schnittstelle Unterstützung hinzufügen.

## Kanalspezifische Einstellungen

Für nicht flüchtige Workflows konfigurieren Sie persistente ACP-Bindungen in `bindings[]`-Einträgen auf oberster Ebene.

### Binding-Modell

- `bindings[].type="acp"` markiert eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forum-Topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die besitzende OpenClaw-Agent-ID.
- Optionale ACP-Überschreibungen liegen unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Laufzeitstandardwerte pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standardwerte einmal pro Agent festzulegen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Reihenfolge der Überschreibung für gebundene ACP-Sessions:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globale ACP-Standardwerte (zum Beispiel `acp.backend`)

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

- OpenClaw stellt sicher, dass die konfigurierte ACP-Session vor der Verwendung existiert.
- Nachrichten in diesem Kanal oder Topic werden an die konfigurierte ACP-Session weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Session-Key direkt zurück.
- Temporäre Laufzeit-Bindungen (zum Beispiel erstellt durch Thread-Fokus-Abläufe) gelten weiterhin, wenn sie vorhanden sind.
- Bei kanalübergreifenden ACP-Spawn-Vorgängen ohne explizites `cwd` erbt OpenClaw den Workspace des Ziel-Agents aus der Agent-Konfiguration.
- Fehlende geerbte Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; tatsächliche Zugriffsfehler werden als Spawn-Fehler angezeigt.

## ACP-Sessions starten (Schnittstellen)

### Aus `sessions_spawn`

Verwenden Sie `runtime: "acp"`, um eine ACP-Session aus einem Agent-Turn oder Tool-Aufruf zu starten.

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

- `runtime` ist standardmäßig `subagent`; setzen Sie daher `runtime: "acp"` explizit für ACP-Sessions.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Schnittstellendetails:

- `task` (erforderlich): initialer Prompt, der an die ACP-Session gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Greift auf `acp.defaultAgent` zurück, falls gesetzt.
- `thread` (optional, Standard `false`): Thread-Binding-Ablauf anfordern, wo unterstützt.
- `mode` (optional): `run` (einmalig) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` gesetzt ist und `mode` weggelassen wird, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Laufzeit-Arbeitsverzeichnis (durch Backend-/Laufzeitrichtlinie validiert). Wenn weggelassen, erbt ACP-Spawn den Workspace des Ziel-Agents, sofern konfiguriert; fehlende geerbte Pfade fallen auf Backend-Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): für Operatoren sichtbares Label, das in Session-/Banner-Text verwendet wird.
- `resumeSessionId` (optional): bestehende ACP-Session fortsetzen, statt eine neue zu erstellen. Der Agent lädt seinen Konversationsverlauf über `session/load` erneut. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs als Systemereignisse an die anfordernde Session zurück.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein JSONL-Log im Session-Bereich zeigt (`<sessionId>.acp-stream.jsonl`), das Sie für den vollständigen Relay-Verlauf mitlesen können.

### Eine bestehende Session fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Session fortzusetzen, statt neu zu starten. Der Agent lädt seinen Konversationsverlauf über `session/load` erneut und macht damit mit dem vollständigen Kontext des Vorherigen weiter.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Session vom Laptop an das Telefon übergeben — Ihrem Agent sagen, dass er dort weitermachen soll, wo Sie aufgehört haben
- Eine Coding-Session fortsetzen, die Sie interaktiv in der CLI gestartet haben, jetzt headless über Ihren Agent
- Arbeit fortsetzen, die durch einen Gateway-Neustart oder Leerlauf-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — bei Verwendung mit der Sub-Agent-Laufzeit wird ein Fehler zurückgegeben.
- `resumeSessionId` stellt den vorgelagerten ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Session, die Sie erstellen. Daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Session-ID nicht gefunden wird, schlägt das Erzeugen mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Session.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie schnell live prüfen möchten, ob ACP-Spawn
tatsächlich end-to-end funktioniert und nicht nur Unit-Tests besteht.

Empfohlenes Gate:

1. Die bereitgestellte Gateway-Version/den Commit auf dem Ziel-Host prüfen.
2. Bestätigen, dass der bereitgestellte Quellcode die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Session zu einem Live-Agent öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agent bitten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Prüfen, dass der Agent meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Die temporäre ACPX-Bridge-Session bereinigen.

Beispiel-Prompt für den Live-Agent:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Halten Sie diesen Smoke-Test auf `mode: "run"`, außer wenn Sie absichtlich
  persistente, threadgebundene ACP-Sessions testen.
- Verlangen Sie für das grundlegende Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von den
  Fähigkeiten der anfordernden Session ab und ist eine separate Integrationsprüfung.
- Behandeln Sie threadgebundenes `mode: "session"`-Testing als zweiten, umfangreicheren Integrationsdurchlauf aus einem echten Discord-Thread oder Telegram-Topic.

## Sandbox-Kompatibilität

ACP-Sessions laufen derzeit auf der Host-Laufzeit, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfordernde Session sandboxed ist, werden ACP-Spawn-Vorgänge sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine sandbox-erzwungene Ausführung benötigen.

### Aus dem `/acp`-Befehl

Verwenden Sie `/acp spawn`, wenn bei Bedarf explizite Operatorsteuerung aus dem Chat nötig ist.

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

Siehe [Slash Commands](/de/tools/slash-commands).

## Auflösung von Session-Zielen

Die meisten `/acp`-Aktionen akzeptieren optional ein Session-Ziel (`session-key`, `session-id` oder `session-label`).

Reihenfolge der Auflösung:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst den Schlüssel
   - dann eine UUID-förmige Session-ID
   - dann das Label
2. Aktuelles Thread-Binding (wenn diese Konversation/dieser Thread an eine ACP-Session gebunden ist)
3. Fallback auf die aktuelle anfordernde Session

Bindungen an die aktuelle Konversation und Thread-Bindings nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst wird, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bind-Modi

`/acp spawn` unterstützt `--bind here|off`.

| Modus | Verhalten |
| ------ | ---------------------------------------------------------------------- |
| `here` | Die aktuell aktive Konversation direkt binden; fehlschlagen, wenn keine aktiv ist. |
| `off` | Keine Bindung an die aktuelle Konversation erstellen. |

Hinweise:

- `--bind here` ist der einfachste Operatorpfad für „diesen Kanal oder Chat mit Codex unterlegen“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für die Bindung an die aktuelle Konversation bereitstellen.
- `--bind` und `--thread` können nicht im selben `/acp spawn`-Aufruf kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus | Verhalten |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, wenn unterstützt. |
| `here` | Einen aktuell aktiven Thread voraussetzen; fehlschlagen, wenn nicht in einem Thread. |
| `off` | Keine Bindung. Session startet ungebunden. |

Hinweise:

- Auf Oberflächen ohne Thread-Bindings ist das Standardverhalten effektiv `off`.
- Threadgebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen untergeordneten Thread zu erstellen.

## ACP-Steuerungen

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

`/acp status` zeigt die effektiven Laufzeitoptionen und, wenn verfügbar, sowohl Laufzeit- als auch Backend-Session-IDs.

Einige Steuerungen hängen von den Fähigkeiten des Backends ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren Fehler zu fehlender Unterstützung zurück.

## ACP-Befehls-Kochbuch

| Befehl | Was er tut | Beispiel |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | ACP-Session erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Laufenden Turn für die Ziel-Session abbrechen. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Steueranweisung an laufende Session senden. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Session schließen und Thread-Ziele entbinden. | `/acp close` |
| `/acp status` | Backend, Modus, Status, Laufzeitoptionen, Fähigkeiten anzeigen. | `/acp status` |
| `/acp set-mode` | Laufzeitmodus für Ziel-Session setzen. | `/acp set-mode plan` |
| `/acp set` | Generisches Schreiben einer Laufzeit-Konfigurationsoption. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Überschreibung des Laufzeit-Arbeitsverzeichnisses setzen. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Profil für die Genehmigungsrichtlinie setzen. | `/acp permissions strict` |
| `/acp timeout` | Laufzeit-Timeout setzen (Sekunden). | `/acp timeout 120` |
| `/acp model` | Laufzeit-Modellüberschreibung setzen. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Überschreibungen der Laufzeitoptionen für die Session entfernen. | `/acp reset-options` |
| `/acp sessions` | Aktuelle ACP-Sessions aus dem Store auflisten. | `/acp sessions` |
| `/acp doctor` | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen. | `/acp doctor` |
| `/acp install` | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install` |

`/acp sessions` liest den Store für die aktuell gebundene oder anfordernde Session. Befehle, die `session-key`-, `session-id`- oder `session-label`-Tokens akzeptieren, lösen Ziele über die Gateway-Session-Erkennung auf, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

## Zuordnung von Laufzeitoptionen

`/acp` bietet Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird dem Laufzeit-Konfigurationsschlüssel `model` zugeordnet.
- `/acp permissions <profile>` wird dem Laufzeit-Konfigurationsschlüssel `approval_policy` zugeordnet.
- `/acp timeout <seconds>` wird dem Laufzeit-Konfigurationsschlüssel `timeout` zugeordnet.
- `/acp cwd <path>` aktualisiert direkt die Überschreibung des Laufzeit-`cwd`.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Überschreibungspfad für `cwd`.
- `/acp reset-options` löscht alle Laufzeitüberschreibungen für die Ziel-Session.

## acpx-Harness-Unterstützung (aktuell)

Aktuelle integrierte acpx-Harness-Aliasse:

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

Wenn OpenClaw das Backend acpx verwendet, bevorzugen Sie diese Werte für `agentId`, außer wenn Ihre acpx-Konfiguration benutzerdefinierte Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agents in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Nutzung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Escape-Hatch ist eine Funktion der acpx-CLI (nicht des normalen OpenClaw-`agentId`-Pfads).

## Erforderliche Konfiguration

ACP-Core-Basis:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch zu pausieren, während /acp-Steuerungen erhalten bleiben.
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

Die Konfiguration für Thread-Bindings ist kanaladapterspezifisch. Beispiel für Discord:

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

Bindungen an die aktuelle Konversation erfordern keine Erstellung eines untergeordneten Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanaladapter, der ACP-Konversationsbindungen bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Neue Installationen werden mit dem gebündelten Laufzeit-Plugin `acpx` ausgeliefert, das standardmäßig aktiviert ist, daher
funktioniert ACP normalerweise ohne manuellen Plugin-Installationsschritt.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verweigert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Danach den Zustand des Backends prüfen:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte acpx-Backend-Plugin (`acpx`) das Plugin-lokale angeheftete Binary:

1. Der Befehl ist standardmäßig das Plugin-lokale `node_modules/.bin/acpx` im ACPX-Plugin-Paket.
2. Die erwartete Version ist standardmäßig der Extension-Pin.
3. Beim Start registriert sich das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrund-Ensure-Job prüft `acpx --version`.
5. Wenn das Plugin-lokale Binary fehlt oder nicht passt, führt es
   `npm install --omit=dev --no-save acpx@<pinned>` aus und prüft erneut.

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
- `expectedVersion: "any"` deaktiviert striktes Versions-Matching.
- Wenn `command` auf ein benutzerdefiniertes Binary/einen benutzerdefinierten Pfad zeigt, wird die Plugin-lokale Auto-Installation deaktiviert.
- Der OpenClaw-Start bleibt nicht blockierend, während die Gesundheitsprüfung des Backends läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Abhängigkeitsinstallation

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-
Laufzeitabhängigkeiten (plattformspezifische Binaries) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sessions **nicht** die von OpenClaw-Plugins registrierten Tools für
das ACP-Harness bereit.

Wenn Sie möchten, dass ACP-Agents wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory recall/store aufrufen können, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server mit dem Namen `openclaw-plugin-tools` in den ACPX-Session-
  Bootstrap.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harnesses.
- ACP-Agents erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie das Ausführen dieser Plugins in
  OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Plugin-Tools-Bridge ist
eine zusätzliche, explizit aktivierbare Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

## Konfiguration von Berechtigungen

ACP-Sessions laufen nicht interaktiv — es gibt kein TTY zum Genehmigen oder Ablehnen von Prompts für Dateischreib- und Shell-Ausführungsberechtigungen. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von anbieterspezifischen Umgehungsflags für CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-seitige Break-Glass-Schalter für ACP-Sessions.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Prompt ausführen kann.

| Wert | Verhalten |
| --------------- | --------------------------------------------------------- |
| `approve-all` | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Prompts. |
| `deny-all` | Alle Berechtigungs-Prompts ablehnen. |

### `nonInteractivePermissions`

Steuert, was passiert, wenn ein Berechtigungs-Prompt angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sessions immer der Fall ist).

| Wert | Verhalten |
| ------ | ----------------------------------------------------------------- |
| `fail` | Die Session mit `AcpRuntimeError` abbrechen. **(Standard)** |
| `deny` | Die Berechtigung still ablehnen und fortfahren (graceful degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sessions kann jeder Schreib- oder Exec-Vorgang, der einen Berechtigungs-Prompt auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sessions graceful degradieren, statt abzustürzen.

## Fehlerbehebung

| Symptom | Wahrscheinliche Ursache | Lösung |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | Backend-Plugin fehlt oder ist deaktiviert. | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP global deaktiviert. | `acp.enabled=true` setzen. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Dispatch aus normalen Thread-Nachrichten deaktiviert. | `acp.dispatch.enabled=true` setzen. |
| `ACP agent "<id>" is not allowed by policy` | Agent nicht in der Allowlist. | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren. |
| `Unable to resolve session target: ...` | Ungültiges Schlüssel-/ID-/Label-Token. | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren und erneut versuchen. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet. | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden. |
| `Conversation bindings are unavailable for <channel>.` | Adapter unterstützt keine ACP-Bindungen an die aktuelle Konversation. | `/acp spawn ... --thread ...` verwenden, sofern unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder zu einem unterstützten Kanal wechseln. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` außerhalb eines Thread-Kontexts verwendet. | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Ein anderer Benutzer besitzt das aktive Bindungsziel. | Als Eigentümer neu binden oder eine andere Konversation bzw. einen anderen Thread verwenden. |
| `Thread bindings are unavailable for <channel>.` | Adapter unterstützt keine Thread-Bindings. | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP-Laufzeit ist hostseitig; die anfordernde Session ist sandboxed. | `runtime="subagent"` aus sandboxed Sessions verwenden oder ACP-Spawn aus einer nicht sandboxed Session ausführen. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` für ACP-Laufzeit angefordert. | `runtime="subagent"` für erforderliche Sandbox-Nutzung verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Session verwenden. |
| Fehlende ACP-Metadaten für gebundene Session | Veraltete/gelöschte ACP-Session-Metadaten. | Mit `/acp spawn` neu erstellen, dann Thread erneut binden/fokussieren. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blockiert Schreib-/Exec-Vorgänge in nicht interaktiver ACP-Session. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Konfiguration von Berechtigungen](#konfiguration-von-berechtigungen). |
| ACP-Session schlägt früh mit wenig Ausgabe fehl | Berechtigungs-Prompts werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für graceful degradation `nonInteractivePermissions=deny` setzen. |
| ACP-Session bleibt nach Abschluss der Arbeit unbegrenzt hängen | Harness-Prozess beendet, aber ACP-Session hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden. |
