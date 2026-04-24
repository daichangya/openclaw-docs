---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Eine Nachrichtkanal-Konversation an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Debugging der ACP-Abschlusszustellung oder von Agent-zu-Agent-Schleifen
    - '`/acp`-Befehle aus dem Chat ausführen'
summary: Verwenden Sie ACP-Runtime-Sitzungen für Claude Code, Cursor, Gemini CLI, expliziten Codex-ACP-Fallback, OpenClaw ACP und andere Harness-Agenten
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-24T07:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Sitzungen ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, Codex in der aktuellen Konversation zu binden oder zu steuern, sollte OpenClaw das native Codex-App-Server-Plugin verwenden (`/codex bind`, `/codex threads`, `/codex resume`). Wenn Sie nach `/acp`, ACP, acpx oder einer Codex-Hintergrund-Child-Session fragen, kann OpenClaw Codex weiterhin über ACP routen. Jeder ACP-Session-Spawn wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „Claude Code in einem Thread zu starten“ oder ein anderes externes Harness zu verwenden, sollte OpenClaw diese Anfrage an die ACP-Runtime routen (nicht an die native Sub-Agent-Runtime).

Wenn Sie möchten, dass Codex oder Claude Code als externer MCP-Client direkt
eine Verbindung zu bestehenden OpenClaw-Kanal-Konversationen herstellen, verwenden Sie
statt ACP [`openclaw mcp serve`](/de/cli/mcp).

## Welche Seite brauche ich?

Es gibt drei naheliegende Oberflächen, die leicht verwechselt werden können:

| Sie möchten ...                                                                                  | Verwenden Sie dies                    | Hinweise                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in der aktuellen Konversation binden oder steuern                                               | `/codex bind`, `/codex threads`       | Nativer Codex-App-Server-Pfad; umfasst gebundene Chat-Antworten, Bildweiterleitung, Modell/Fast/Permissions, Stopp- und Steer-Steuerung. ACP ist ein expliziter Fallback |
| Claude Code, Gemini CLI, explizites Codex ACP oder ein anderes externes Harness _über_ OpenClaw ausführen | Diese Seite: ACP-Agenten                 | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Runtime-Steuerung                                                |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen                   | [`openclaw acp`](/de/cli/acp)            | Bridge-Modus. IDE/Client spricht ACP mit OpenClaw über stdio/WebSocket                                                                                         |
| Eine lokale AI-CLI als reine Text-Fallback-Modell wiederverwenden                                              | [CLI Backends](/de/gateway/cli-backends) | Kein ACP. Keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Runtime                                                                                            |

## Funktioniert das sofort einsatzbereit?

Normalerweise ja. Frische Installationen liefern das gebündelte Runtime-Plugin `acpx` standardmäßig aktiviert aus, mit einer pluginlokal gepinnten `acpx`-Binärdatei, die OpenClaw beim Start prüft und selbst repariert. Führen Sie `/acp doctor` für eine Bereitschaftsprüfung aus.

Häufige Stolpersteine beim ersten Lauf:

- Adapter für Ziel-Harnesses (Codex, Claude usw.) können beim ersten Verwenden bei Bedarf mit `npx` geladen werden.
- Vendor-Auth muss für dieses Harness weiterhin auf dem Host vorhanden sein.
- Wenn der Host weder npm noch Netzwerkzugriff hat, schlagen erstmalige Adapter-Downloads fehl, bis Caches vorgewärmt sind oder der Adapter auf anderem Weg installiert wurde.

## Runbook für Operatoren

Schneller `/acp`-Ablauf aus dem Chat:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` oder explizit `/acp spawn codex --bind here`
2. **Arbeiten** in der gebundenen Konversation oder im Thread (oder den Sitzungsschlüssel explizit angeben).
3. **Status prüfen** — `/acp status`
4. **Anpassen** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steuern**, ohne den Kontext zu ersetzen — `/acp steer tighten logging and continue`
6. **Stoppen** — `/acp cancel` (aktueller Turn) oder `/acp close` (Sitzung + Bindings)

Auslöser in natürlicher Sprache, die an das native Codex-Plugin geroutet werden sollten:

- „Binde diesen Discord-Kanal an Codex.“
- „Hänge diesen Chat an den Codex-Thread `<id>`.“
- „Zeige Codex-Threads und binde dann diesen hier.“

Native Codex-Konversationsbindung ist der Standardpfad für Chat-Steuerung, aber absichtlich konservativ für interaktive Codex-Approval-/Tool-Flows: OpenClaw-Dynamic-Tools und Approval-Prompts werden über diesen gebundenen Chatpfad noch nicht bereitgestellt, daher werden solche Anfragen mit einer klaren Erklärung abgelehnt. Verwenden Sie den Codex-Harness-Pfad oder einen expliziten ACP-Fallback, wenn der Workflow von OpenClaw-Dynamic-Tools oder langlaufenden interaktiven Approvals abhängt.

Auslöser in natürlicher Sprache, die an die ACP-Runtime geroutet werden sollten:

- „Führe das als One-Shot-Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und behalte Follow-ups dann in genau diesem Thread.“
- „Führe Codex über ACP in einem Hintergrund-Thread aus.“

OpenClaw wählt `runtime: "acp"`, löst die Harness-`agentId` auf, bindet sie an die aktuelle Konversation oder den Thread, wenn unterstützt, und leitet Follow-ups bis zum Schließen/Ablauf an diese Sitzung weiter. Codex folgt diesem Pfad nur, wenn ACP explizit ist oder die angeforderte Hintergrund-Runtime weiterhin ACP benötigt.

## ACP versus Sub-Agenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Runtime möchten. Verwenden Sie den nativen Codex-App-Server für Codex-Konversationsbindung/-steuerung. Verwenden Sie Sub-Agenten, wenn Sie OpenClaw-native delegierte Läufe möchten.

| Bereich          | ACP-Sitzung                           | Sub-Agent-Lauf                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Sub-Agent-Runtime  |
| Sitzungsschlüssel   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"` | `sessions_spawn` (Standard-Runtime) |

Siehe auch [Sub-Agenten](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. OpenClaw-ACP-Session-Control-Plane
2. gebündeltes Runtime-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Runtime-/Session-Mechanik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerung, Sitzungsfortsetzung, Hintergrundaufgaben-Tracking und optionaler Konversations-/Thread-Bindung.
- CLI Backends sind separate reine Text-Local-Fallback-Runtimes. Siehe [CLI Backends](/de/gateway/cli-backends).

Für Operatoren ist die praktische Regel:

- wenn Sie `/acp spawn`, bindbare Sitzungen, Runtime-Steuerung oder persistente Harness-Arbeit möchten: ACP verwenden
- wenn Sie einen einfachen lokalen Text-Fallback über die rohe CLI möchten: CLI Backends verwenden

## Gebundene Sitzungen

### Bindings an die aktuelle Konversation

`/acp spawn <harness> --bind here` pinnt die aktuelle Konversation an die gestartete ACP-Sitzung — kein Child-Thread, dieselbe Chat-Oberfläche. OpenClaw behält Transport, Auth, Sicherheit und Zustellung; Follow-up-Nachrichten in dieser Konversation werden an dieselbe Sitzung geroutet; `/new` und `/reset` setzen die Sitzung an Ort und Stelle zurück; `/acp close` entfernt das Binding.

Gedankenmodell:

- **Chat-Oberfläche** — wo Menschen weiter sprechen (Discord-Kanal, Telegram-Topic, iMessage-Chat).
- **ACP-Sitzung** — der dauerhafte Codex-/Claude-/Gemini-Runtime-Zustand, an den OpenClaw routet.
- **Child-Thread/Topic** — eine optionale zusätzliche Messaging-Oberfläche, die nur von `--thread ...` erstellt wird.
- **Runtime-Workspace** — der Dateisystemort (`cwd`, Repo-Checkout, Backend-Workspace), in dem das Harness läuft. Unabhängig von der Chat-Oberfläche.

Beispiele:

- `/codex bind` — diesen Chat beibehalten, nativen Codex-App-Server starten oder anhängen, zukünftige Nachrichten hierher routen.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — den gebundenen nativen Codex-Thread aus dem Chat anpassen.
- `/codex stop` oder `/codex steer focus on the failing tests first` — den aktiven nativen Codex-Turn steuern.
- `/acp spawn codex --bind here` — expliziter ACP-Fallback für Codex.
- `/acp spawn codex --thread auto` — OpenClaw kann einen Child-Thread bzw. ein Topic erstellen und dort binden.
- `/acp spawn codex --bind here --cwd /workspace/repo` — dasselbe Chat-Binding, Codex läuft in `/workspace/repo`.

Hinweise:

- `--bind here` und `--thread ...` schließen sich gegenseitig aus.
- `--bind here` funktioniert nur auf Kanälen, die Binding an die aktuelle Konversation ausweisen; andernfalls gibt OpenClaw eine klare Meldung über fehlende Unterstützung zurück. Bindings bleiben über Gateway-Neustarts hinweg bestehen.
- Auf Discord ist `spawnAcpSessions` nur erforderlich, wenn OpenClaw für `--thread auto|here` einen Child-Thread erstellen muss — nicht für `--bind here`.
- Wenn Sie zu einem anderen ACP-Agenten ohne `--cwd` spawnen, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agenten**. Fehlende übernommene Pfade (`ENOENT`/`ENOTDIR`) fallen auf den Backend-Standard zurück; andere Zugriffsfehler (z. B. `EACCES`) werden als Spawn-Fehler angezeigt.

### Thread-gebundene Sitzungen

Wenn Thread-Bindings für einen Kanaladapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Follow-up-Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung geroutet.
- ACP-Ausgabe wird zurück in denselben Thread zugestellt.
- Unfocus/Schließen/Archivieren/Ablauf durch Idle-Timeout oder Max-Age entfernt das Binding.

Die Unterstützung für Thread-Bindings ist adapterspezifisch. Wenn der aktive Kanaladapter Thread-Bindings nicht unterstützt, gibt OpenClaw eine klare Meldung über fehlende Unterstützung bzw. Nichtverfügbarkeit zurück.

Erforderliche Feature-Flags für threadgebundenes ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um ACP-Dispatch zu pausieren)
- Kanaladapter-ACP-Thread-Spawn-Flag aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Thread-unterstützende Kanäle

- Jeder Kanaladapter, der Fähigkeiten zum Sitzungs-/Thread-Binding bereitstellt.
- Aktuelle eingebaute Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Topics (Forum-Topics in Gruppen/Supergroups und DM-Topics)
- Plugin-Kanäle können Unterstützung über dieselbe Binding-Schnittstelle hinzufügen.

## Kanalspezifische Einstellungen

Für nicht ephemere Workflows konfigurieren Sie persistente ACP-Bindings in Einträgen der obersten Ebene `bindings[]`.

### Binding-Modell

- `bindings[].type="acp"` markiert ein persistentes ACP-Konversations-Binding.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forum-Topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM-/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Verwenden Sie bevorzugt `chat_id:*` oder `chat_identifier:*` für stabile Gruppen-Bindings.
  - iMessage-DM-/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Verwenden Sie bevorzugt `chat_id:*` für stabile Gruppen-Bindings.
- `bindings[].agentId` ist die besitzende OpenClaw-Agent-ID.
- Optionale ACP-Overrides leben unter `bindings[].acp`:
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

Override-Priorität für ACP-gebundene Sitzungen:

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
- Nachrichten in diesem Kanal oder Topic werden an die konfigurierte ACP-Sitzung geroutet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Runtime-Bindings (zum Beispiel durch Thread-Focus-Flows erstellt) gelten weiterhin, sofern vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende übernommene Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler angezeigt.

## ACP-Sitzungen starten (Schnittstellen)

### Von `sessions_spawn`

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

- `runtime` ist standardmäßig `subagent`, setzen Sie also `runtime: "acp"` explizit für ACP-Sitzungen.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, sofern konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Schnittstellendetails:

- `task` (erforderlich): initialer Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, falls gesetzt.
- `thread` (optional, Standard `false`): Thread-Binding-Flow anfordern, sofern unterstützt.
- `mode` (optional): `run` (One-Shot) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` gesetzt ist und `mode` fehlt, kann OpenClaw je nach Runtime-Pfad standardmäßig persistentes Verhalten wählen
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Runtime-Arbeitsverzeichnis (durch Backend-/Runtime-Richtlinie validiert). Wenn weggelassen, übernimmt der ACP-Spawn den Workspace des Ziel-Agenten, sofern konfiguriert; fehlende übernommene Pfade fallen auf Backend-Standards zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitiges Label, das in Sitzungs-/Bannertext verwendet wird.
- `resumeSessionId` (optional): eine bestehende ACP-Sitzung fortsetzen, statt eine neue zu erstellen. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ab. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs als Systemereignisse zurück an die anfragende Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsspezifisches JSONL-Log (`<sessionId>.acp-stream.jsonl`) verweist, das Sie für die vollständige Relay-Historie tailen können.
- `model` (optional): explizites Modell-Override für die ACP-Child-Sitzung. Wird für `runtime: "acp"` beachtet, sodass die Child-Sitzung das angeforderte Modell verwendet, statt still auf den Standard des Ziel-Agenten zurückzufallen.

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder vom Parent besessene Hintergrundarbeit sein. Der Zustellpfad hängt von dieser Form ab.

### Interaktive ACP-Sitzungen

Interaktive Sitzungen sind dafür gedacht, auf einer sichtbaren Chat-Oberfläche weiterzusprechen:

- `/acp spawn ... --bind here` bindet die aktuelle Konversation an die ACP-Sitzung.
- `/acp spawn ... --thread ...` bindet einen Kanal-Thread bzw. ein Topic an die ACP-Sitzung.
- Persistente konfigurierte `bindings[].type="acp"` routen passende Konversationen an dieselbe ACP-Sitzung.

Follow-up-Nachrichten in der gebundenen Konversation werden direkt an die ACP-Sitzung geroutet, und die ACP-Ausgabe wird an denselben Kanal/Thread/dasselbe Topic zurück zugestellt.

### Vom Parent besessene One-Shot-ACP-Sitzungen

One-Shot-ACP-Sitzungen, die von einem anderen Agent-Lauf gestartet werden, sind Hintergrund-Children, ähnlich wie Sub-Agenten:

- Der Parent fordert Arbeit mit `sessions_spawn({ runtime: "acp", mode: "run" })` an.
- Das Child läuft in seiner eigenen ACP-Harness-Sitzung.
- Der Abschluss wird über den internen Pfad zur Bekanntgabe der Aufgabenbeendigung zurückgemeldet.
- Der Parent formuliert das Ergebnis des Childs in normaler Assistentenstimme um, wenn eine benutzersichtbare Antwort sinnvoll ist.

Behandeln Sie diesen Pfad nicht als Peer-to-Peer-Chat zwischen Parent und Child. Das Child hat bereits einen Abschlusskanal zurück zum Parent.

### `sessions_send` und A2A-Zustellung

`sessions_send` kann nach dem Spawn auf eine andere Sitzung zielen. Für normale Peer-Sitzungen verwendet OpenClaw nach dem Injizieren der Nachricht einen Agent-to-Agent- (A2A-)Follow-up-Pfad:

- auf die Antwort der Zielsitzung warten
- optional Anfragenden und Ziel eine begrenzte Anzahl weiterer Follow-up-Turns austauschen lassen
- das Ziel bitten, eine Bekanntgabenachricht zu erzeugen
- diese Bekanntgabe an den sichtbaren Kanal oder Thread zustellen

Dieser A2A-Pfad ist ein Fallback für Peer-Sends, bei denen der Sender ein sichtbares Follow-up benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel unter breiten Einstellungen für `tools.sessions.visibility`.

OpenClaw überspringt das A2A-Follow-up nur dann, wenn der Anfragende der Parent seines eigenen vom Parent besessenen One-Shot-ACP-Childs ist. In diesem Fall kann A2A zusätzlich zur Aufgabenbeendigung den Parent mit dem Ergebnis des Childs aufwecken, die Antwort des Parents zurück in das Child weiterleiten und eine Echo-Schleife zwischen Parent und Child erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall des besessenen Childs `delivery.status="skipped"`, weil der Abschlusspfad bereits für das Ergebnis zuständig ist.

### Eine bestehende Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Konversationsverlauf über `session/load` erneut ab, sodass er mit dem vollständigen Kontext dessen weitermacht, was vorher passiert ist.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop aufs Telefon übergeben — Ihrem Agenten sagen, dass er dort weitermachen soll, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI gestartet haben und jetzt headless über Ihren Agenten weiterführen
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder Idle-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Sub-Agent-Runtime verwendet wird.
- `resumeSessionId` stellt den vorgelagerten ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, daher erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

<Accordion title="Smoke-Test nach dem Deployment">

Führen Sie nach einem Gateway-Deployment eine echte End-to-End-Live-Prüfung aus, statt sich auf Unit-Tests zu verlassen:

1. Prüfen Sie die deployte Gateway-Version und den Commit auf dem Ziel-Host.
2. Öffnen Sie eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten.
3. Bitten Sie diesen Agenten, `sessions_spawn` mit `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` und der Aufgabe `Reply with exactly LIVE-ACP-SPAWN-OK` aufzurufen.
4. Prüfen Sie `accepted=yes`, einen echten `childSessionKey` und keinen Validator-Fehler.
5. Bereinigen Sie die temporäre Bridge-Sitzung.

Belassen Sie das Gate auf `mode: "run"` und überspringen Sie `streamTo: "parent"` — threadgebundene `mode: "session"`- und Stream-Relay-Pfade sind separate, umfangreichere Integrationsdurchläufe.

</Accordion>

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Runtime, nicht in der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung sandboxed ist, werden ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie eine durch die Sandbox erzwungene Ausführung benötigen.

### Über den Befehl `/acp`

Verwenden Sie `/acp spawn`, wenn Sie bei Bedarf explizite Steuerung durch den Operator aus dem Chat möchten.

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

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Auflösungsreihenfolge:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst Key
   - dann UUID-förmige Sitzungs-ID
   - dann Label
2. Aktuelles Thread-Binding (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf die aktuelle anfragende Sitzung

Bindings an die aktuelle Konversation und Thread-Bindings nehmen beide an Schritt 2 teil.

Wenn sich kein Ziel auflösen lässt, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bind-Modi

`/acp spawn` unterstützt `--bind here|off`.

| Mode   | Verhalten                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Die aktuell aktive Konversation an Ort und Stelle binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Kein Binding an die aktuelle Konversation erstellen.                          |

Hinweise:

- `--bind here` ist der einfachste Operatorpfad für „diesen Kanal oder Chat Codex-gestützt machen“.
- `--bind here` erstellt keinen Child-Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für Bindings an die aktuelle Konversation bereitstellen.
- `--bind` und `--thread` können nicht in demselben Aufruf von `/acp spawn` kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Mode   | Verhalten                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen Child-Thread erstellen/binden, sofern unterstützt. |
| `here` | Aktuellen aktiven Thread verlangen; fehlschlagen, wenn Sie sich nicht in einem befinden.                                                  |
| `off`  | Kein Binding. Sitzung startet ungebunden.                                                                 |

Hinweise:

- Auf Oberflächen ohne Thread-Binding ist das Standardverhalten effektiv `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Verwenden Sie `--bind here`, wenn Sie die aktuelle Konversation anheften möchten, ohne einen Child-Thread zu erstellen.

## ACP-Steuerung

| Command              | Was es tut                                              | Beispiel                                                       |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optional aktuelles Binding oder Thread-Binding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für die Zielsitzung abbrechen.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steer-Anweisung an laufende Sitzung senden.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Bindings von Thread-Zielen aufheben.                  | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Runtime-Optionen, Fähigkeiten anzeigen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-Modus für die Zielsitzung setzen.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Generischen Schreibvorgang für Runtime-Konfigurationsoption ausführen.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Runtime-Arbeitsverzeichnisses setzen.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profil für Approval-Richtlinie setzen.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-Timeout (Sekunden) setzen.                            | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-Modell-Override setzen.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen von Sitzungs-Runtime-Optionen entfernen.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Letzte ACP-Sitzungen aus dem Store auflisten.                      | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Zustand, Fähigkeiten, umsetzbare Korrekturen.           | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben.             | `/acp install`                                                |

`/acp status` zeigt die effektiven Runtime-Optionen sowie Runtime- und Backend-seitige Sitzungskennungen. Fehler wegen nicht unterstützter Steuerung werden klar angezeigt, wenn einem Backend eine Fähigkeit fehlt. `/acp sessions` liest den Store für die aktuell gebundene oder anfragende Sitzung; Ziel-Tokens (`session-key`, `session-id` oder `session-label`) werden über die Gateway-Sitzungserkennung aufgelöst, einschließlich benutzerdefinierter `session.store`-Roots pro Agent.

## Zuordnung von Runtime-Optionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Runtime-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Runtime-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Runtime-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert direkt das `cwd`-Override der Runtime.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad für das `cwd`-Override.
- `/acp reset-options` löscht alle Runtime-Overrides für die Zielsitzung.

## acpx-Harness, Plugin-Setup und Permissions

Für die Konfiguration des acpx-Harness (Claude Code / Codex / Gemini CLI-Aliasse), die
MCP-Bridges plugin-tools und OpenClaw-tools sowie ACP-Permissions-Modi siehe
[ACP-Agenten — Setup](/de/tools/acp-agents-setup).

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                                    | Behebung                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                             | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ist global deaktiviert.                                                          | `acp.enabled=true` setzen.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten ist deaktiviert.                                  | `acp.dispatch.enabled=true` setzen.                                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent steht nicht in der Allowlist.                                                         | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                                     |
| `Unable to resolve session target: ...`                                     | Ungültiges Key-/ID-/Label-Token.                                                         | `/acp sessions` ausführen, exakten Key/Label kopieren, erneut versuchen.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                     | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine Fähigkeit für ACP-Bindings an die aktuelle Konversation.                      | `/acp spawn ... --thread ...` verwenden, sofern unterstützt, `bindings[]` auf oberster Ebene konfigurieren oder in einen unterstützten Kanal wechseln.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                                  | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Binding-Ziel.                                    | Als Besitzer erneut binden oder eine andere Konversation bzw. einen anderen Thread verwenden.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Thread-Binding-Fähigkeit.                                        | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Runtime läuft auf dem Host; die anfragende Sitzung ist sandboxed.                       | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für die ACP-Runtime angefordert.                                  | `runtime="subagent"` für erforderliche Sandboxing verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                                                      |
| Fehlende ACP-Metadaten für gebundene Sitzung                                      | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                             | Mit `/acp spawn` neu erstellen, dann Thread erneut binden/fokussieren.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreib-/Exec-Vorgänge in einer nicht interaktiven ACP-Sitzung.             | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Permissions-Konfiguration](/de/tools/acp-agents-setup#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                                  | Permissions-Prompts werden von `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für volle Permissions `permissionMode=approve-all` setzen; für graceful degradation `nonInteractivePermissions=deny` setzen.        |
| ACP-Sitzung hängt nach Abschluss der Arbeit unbegrenzt                       | Harness-Prozess wurde beendet, aber die ACP-Sitzung hat den Abschluss nicht gemeldet.             | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                                       |

## Verwandt

- [Sub-Agenten](/de/tools/subagents)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Agent send](/de/tools/agent-send)
