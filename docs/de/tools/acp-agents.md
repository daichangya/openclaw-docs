---
read_when:
    - Coding-Harnesses über ACP ausführen
    - Konversationsgebundene ACP-Sitzungen auf Messaging-Kanälen einrichten
    - Eine Nachrichtenkanal-Konversation an eine persistente ACP-Sitzung binden
    - Fehlerbehebung bei ACP-Backend- und Plugin-Verdrahtung
    - Debuggen der Zustellung von ACP-Vervollständigungen oder von Agent-zu-Agent-Schleifen
    - '`/acp`-Befehle aus dem Chat heraus verwenden'
summary: ACP-Laufzeitsitzungen für Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP und andere Harness-Agenten verwenden
title: ACP-Agenten
x-i18n:
    generated_at: "2026-04-23T14:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-Agenten

Sitzungen mit dem [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ermöglichen es OpenClaw, externe Coding-Harnesses (zum Beispiel Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI und andere unterstützte ACPX-Harnesses) über ein ACP-Backend-Plugin auszuführen.

Wenn Sie OpenClaw in natürlicher Sprache bitten, „das in Codex auszuführen“ oder „Claude Code in einem Thread zu starten“, sollte OpenClaw diese Anfrage an die ACP-Laufzeit weiterleiten (nicht an die native Subagent-Laufzeit). Jede ACP-Sitzungserzeugung wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Wenn Sie möchten, dass Codex oder Claude Code sich direkt als externer MCP-Client
mit bestehenden, von OpenClaw unterstützten Kanalunterhaltungen verbinden,
verwenden Sie stattdessen [`openclaw mcp serve`](/de/cli/mcp) anstelle von ACP.

## Welche Seite möchte ich?

Es gibt drei benachbarte Oberflächen, die leicht verwechselt werden können:

| Sie möchten ...                                                                     | Verwenden Sie                           | Hinweise                                                                                                      |
| ----------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI oder ein anderes externes Harness _durch_ OpenClaw ausführen | Diese Seite: ACP-Agenten                | Chatgebundene Sitzungen, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, Hintergrundaufgaben, Laufzeitsteuerungen |
| Eine OpenClaw-Gateway-Sitzung _als_ ACP-Server für einen Editor oder Client bereitstellen | [`openclaw acp`](/de/cli/acp)              | Bridge-Modus. IDE/Client spricht über stdio/WebSocket ACP mit OpenClaw                                       |
| Eine lokale KI-CLI als reines Text-Fallback-Modell wiederverwenden                  | [CLI-Backends](/de/gateway/cli-backends)   | Nicht ACP. Keine OpenClaw-Tools, keine ACP-Steuerung, keine Harness-Laufzeit                                 |

## Funktioniert das sofort?

In der Regel ja.

- Frische Installationen liefern jetzt das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus.
- Das gebündelte Plugin `acpx` bevorzugt sein pluginlokales angeheftetes `acpx`-Binary.
- Beim Start prüft OpenClaw dieses Binary und repariert es bei Bedarf selbst.
- Beginnen Sie mit `/acp doctor`, wenn Sie eine schnelle Bereitschaftsprüfung möchten.

Was bei der ersten Verwendung trotzdem passieren kann:

- Ein Ziel-Harness-Adapter kann beim ersten Verwenden dieses Harnesses per `npx` bei Bedarf abgerufen werden.
- Anbieter-Authentifizierung muss auf dem Host weiterhin für dieses Harness vorhanden sein.
- Wenn der Host keinen npm-/Netzwerkzugriff hat, können Adapter-Abrufe beim ersten Lauf fehlschlagen, bis Caches vorgewärmt oder der Adapter auf andere Weise installiert wurde.

Beispiele:

- `/acp spawn codex`: OpenClaw sollte bereit sein, `acpx` zu bootstrappen, aber der Codex-ACP-Adapter kann weiterhin einen Abruf beim ersten Lauf benötigen.
- `/acp spawn claude`: Dasselbe gilt für den Claude-ACP-Adapter, plus Claude-seitige Authentifizierung auf diesem Host.

## Schneller Operator-Ablauf

Verwenden Sie dies, wenn Sie ein praktisches `/acp`-Runbook möchten:

1. Eine Sitzung erzeugen:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. In der gebundenen Konversation oder im Thread arbeiten (oder diesen Sitzungsschlüssel explizit ansprechen).
3. Laufzeitstatus prüfen:
   - `/acp status`
4. Laufzeitoptionen nach Bedarf abstimmen:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Eine aktive Sitzung anstoßen, ohne den Kontext zu ersetzen:
   - `/acp steer tighten logging and continue`
6. Arbeit stoppen:
   - `/acp cancel` (aktuellen Turn stoppen), oder
   - `/acp close` (Sitzung schließen + Bindungen entfernen)

## Schnellstart für Menschen

Beispiele für natürliche Anfragen:

- „Binde diesen Discord-Kanal an Codex.“
- „Starte hier eine persistente Codex-Sitzung in einem Thread und halte sie fokussiert.“
- „Führe das als One-Shot-Claude-Code-ACP-Sitzung aus und fasse das Ergebnis zusammen.“
- „Binde diesen iMessage-Chat an Codex und halte Nachfragen im selben Workspace.“
- „Verwende Gemini CLI für diese Aufgabe in einem Thread und halte Nachfragen dann in demselben Thread.“

Was OpenClaw tun sollte:

1. `runtime: "acp"` auswählen.
2. Das angeforderte Harness-Ziel auflösen (`agentId`, zum Beispiel `codex`).
3. Wenn eine Bindung an die aktuelle Konversation angefordert wird und der aktive Kanal dies unterstützt, die ACP-Sitzung an diese Konversation binden.
4. Andernfalls, wenn eine Thread-Bindung angefordert wird und der aktuelle Kanal dies unterstützt, die ACP-Sitzung an den Thread binden.
5. Nachfolgende gebundene Nachrichten an dieselbe ACP-Sitzung weiterleiten, bis sie defokussiert/geschlossen/abgelaufen ist.

## ACP versus Subagenten

Verwenden Sie ACP, wenn Sie eine externe Harness-Laufzeit möchten. Verwenden Sie Subagenten, wenn Sie von OpenClaw nativ delegierte Läufe möchten.

| Bereich       | ACP-Sitzung                           | Subagent-Lauf                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Laufzeit      | ACP-Backend-Plugin (zum Beispiel acpx) | OpenClaw-native Subagent-Laufzeit |
| Sitzungsschlüssel | `agent:<agentId>:acp:<uuid>`      | `agent:<agentId>:subagent:<uuid>`  |
| Hauptbefehle  | `/acp ...`                            | `/subagents ...`                   |
| Spawn-Tool    | `sessions_spawn` mit `runtime:"acp"`  | `sessions_spawn` (Standardlaufzeit) |

Siehe auch [Subagenten](/de/tools/subagents).

## Wie ACP Claude Code ausführt

Für Claude Code über ACP ist der Stack:

1. ACP-Sitzungssteuerungsebene von OpenClaw
2. gebündeltes Laufzeit-Plugin `acpx`
3. Claude-ACP-Adapter
4. Claude-seitige Laufzeit-/Sitzungslogik

Wichtige Unterscheidung:

- ACP Claude ist eine Harness-Sitzung mit ACP-Steuerung, Sitzungsfortsetzung, Hintergrundaufgabenverfolgung und optionaler Bindung an Konversation/Thread.
- CLI-Backends sind separate reine Text-Lokal-Fallback-Laufzeiten. Siehe [CLI-Backends](/de/gateway/cli-backends).

Für Operatoren ist die praktische Regel:

- Sie möchten `/acp spawn`, bindbare Sitzungen, Laufzeitsteuerungen oder persistente Harness-Arbeit: Verwenden Sie ACP
- Sie möchten einfachen lokalen Text-Fallback über die rohe CLI: Verwenden Sie CLI-Backends

## Gebundene Sitzungen

### Bindungen an die aktuelle Konversation

Verwenden Sie `/acp spawn <harness> --bind here`, wenn die aktuelle Konversation zu einem dauerhaften ACP-Workspace werden soll, ohne einen untergeordneten Thread zu erstellen.

Verhalten:

- OpenClaw bleibt Eigentümer von Kanaltransport, Authentifizierung, Sicherheit und Zustellung.
- Die aktuelle Konversation wird an den erzeugten ACP-Sitzungsschlüssel angeheftet.
- Nachfolgende Nachrichten in dieser Konversation werden an dieselbe ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die Sitzung und entfernt die Bindung der aktuellen Konversation.

Was das in der Praxis bedeutet:

- `--bind here` behält dieselbe Chat-Oberfläche. Auf Discord bleibt der aktuelle Kanal der aktuelle Kanal.
- `--bind here` kann trotzdem eine neue ACP-Sitzung erzeugen, wenn Sie frische Arbeit starten. Die Bindung hängt diese Sitzung an die aktuelle Konversation.
- `--bind here` erstellt nicht von selbst einen untergeordneten Discord-Thread oder ein Telegram-Thema.
- Die ACP-Laufzeit kann trotzdem ihr eigenes Arbeitsverzeichnis (`cwd`) oder einen backendverwalteten Workspace auf dem Datenträger haben. Dieser Laufzeit-Workspace ist von der Chat-Oberfläche getrennt und impliziert keinen neuen Messaging-Thread.
- Wenn Sie für einen anderen ACP-Agenten erzeugen und `--cwd` nicht übergeben, übernimmt OpenClaw standardmäßig den Workspace des **Ziel-Agenten**, nicht den des Anfragenden.
- Wenn dieser geerbte Workspace-Pfad fehlt (`ENOENT`/`ENOTDIR`), fällt OpenClaw auf das Standard-`cwd` des Backends zurück, statt stillschweigend den falschen Baum wiederzuverwenden.
- Wenn der geerbte Workspace existiert, aber nicht zugänglich ist (zum Beispiel `EACCES`), gibt `spawn` den echten Zugriffsfehler zurück, statt `cwd` zu verwerfen.

Mentales Modell:

- Chat-Oberfläche: wo Menschen weiterreden (`Discord-Kanal`, `Telegram-Thema`, `iMessage-Chat`)
- ACP-Sitzung: der dauerhafte Codex-/Claude-/Gemini-Laufzeitzustand, an den OpenClaw weiterleitet
- untergeordneter Thread/Thema: eine optionale zusätzliche Messaging-Oberfläche, die nur durch `--thread ...` erstellt wird
- Laufzeit-Workspace: der Dateisystemort, an dem das Harness läuft (`cwd`, Repo-Checkout, Backend-Workspace)

Beispiele:

- `/acp spawn codex --bind here`: diesen Chat beibehalten, eine Codex-ACP-Sitzung erzeugen oder anhängen und künftige Nachrichten hierhin an sie weiterleiten
- `/acp spawn codex --thread auto`: OpenClaw kann einen untergeordneten Thread/ein untergeordnetes Thema erstellen und die ACP-Sitzung dort binden
- `/acp spawn codex --bind here --cwd /workspace/repo`: dieselbe Chat-Bindung wie oben, aber Codex läuft in `/workspace/repo`

Unterstützung für Bindung an die aktuelle Konversation:

- Chat-/Nachrichtenkanäle, die Unterstützung für Bindung an die aktuelle Konversation ankündigen, können `--bind here` über den gemeinsamen Pfad für Konversationsbindung verwenden.
- Kanäle mit benutzerdefinierter Thread-/Themen-Semantik können weiterhin kanalspezifische Kanonisierung hinter derselben gemeinsamen Schnittstelle bereitstellen.
- `--bind here` bedeutet immer „die aktuelle Konversation an Ort und Stelle binden“.
- Generische Bindungen an die aktuelle Konversation verwenden den gemeinsamen OpenClaw-Binding-Speicher und überstehen normale Gateway-Neustarts.

Hinweise:

- `--bind here` und `--thread ...` schließen sich bei `/acp spawn` gegenseitig aus.
- Auf Discord bindet `--bind here` den aktuellen Kanal oder Thread an Ort und Stelle. `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw für `--thread auto|here` einen untergeordneten Thread erstellen muss.
- Wenn der aktive Kanal keine ACP-Bindungen für die aktuelle Konversation bereitstellt, gibt OpenClaw eine klare Meldung aus, dass dies nicht unterstützt wird.
- `resume` und Fragen nach „neuer Sitzung“ sind ACP-Sitzungsfragen, keine Kanalfragen. Sie können Laufzeitzustand wiederverwenden oder ersetzen, ohne die aktuelle Chat-Oberfläche zu ändern.

### An Threads gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanaladapter aktiviert sind, können ACP-Sitzungen an Threads gebunden werden:

- OpenClaw bindet einen Thread an eine Ziel-ACP-Sitzung.
- Nachfolgende Nachrichten in diesem Thread werden an die gebundene ACP-Sitzung weitergeleitet.
- ACP-Ausgabe wird zurück in denselben Thread zugestellt.
- Defokus/Schließen/Archivieren/Leerlauf-Timeout oder Ablauf des Höchstalters entfernt die Bindung.

Unterstützung für Thread-Bindung ist adapterspezifisch. Wenn der aktive Kanaladapter keine Thread-Bindungen unterstützt, gibt OpenClaw eine klare Meldung aus, dass dies nicht unterstützt/nicht verfügbar ist.

Erforderliche Feature-Flags für an Threads gebundene ACP-Sitzungen:

- `acp.enabled=true`
- `acp.dispatch.enabled` ist standardmäßig aktiviert (setzen Sie `false`, um ACP-Dispatch zu pausieren)
- ACP-Thread-Spawn-Flag des Kanaladapters aktiviert (adapterspezifisch)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanäle mit Thread-Unterstützung

- Jeder Kanaladapter, der Sitzungs-/Thread-Bindungsfähigkeit bereitstellt.
- Aktuelle integrierte Unterstützung:
  - Discord-Threads/-Kanäle
  - Telegram-Themen (Forenthemen in Gruppen/Supergruppen und DM-Themen)
- Plugin-Kanäle können Unterstützung über dieselbe Binding-Schnittstelle hinzufügen.

## Kanalspezifische Einstellungen

Für nicht-ephemere Workflows konfigurieren Sie persistente ACP-Bindungen in Top-Level-Einträgen `bindings[]`.

### Binding-Modell

- `bindings[].type="acp"` kennzeichnet eine persistente ACP-Konversationsbindung.
- `bindings[].match` identifiziert die Zielkonversation:
  - Discord-Kanal oder -Thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram-Forenthema: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles-DM/Gruppenchat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` oder `chat_identifier:*` für stabile Gruppenbindungen.
  - iMessage-DM/Gruppenchat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Bevorzugen Sie `chat_id:*` für stabile Gruppenbindungen.
- `bindings[].agentId` ist die ID des besitzenden OpenClaw-Agenten.
- Optionale ACP-Überschreibungen befinden sich unter `bindings[].acp`:
  - `mode` (`persistent` oder `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Laufzeitstandardwerte pro Agent

Verwenden Sie `agents.list[].runtime`, um ACP-Standardwerte einmal pro Agent zu definieren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (Harness-ID, zum Beispiel `codex` oder `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Vorrangregeln für Überschreibungen bei gebundenen ACP-Sitzungen:

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

- OpenClaw stellt vor der Verwendung sicher, dass die konfigurierte ACP-Sitzung existiert.
- Nachrichten in diesem Kanal oder Thema werden an die konfigurierte ACP-Sitzung weitergeleitet.
- In gebundenen Konversationen setzen `/new` und `/reset` denselben ACP-Sitzungsschlüssel an Ort und Stelle zurück.
- Temporäre Laufzeit-Bindungen (zum Beispiel durch Thread-Fokus-Flows erstellt) gelten weiterhin, wo vorhanden.
- Bei agentübergreifenden ACP-Spawns ohne explizites `cwd` übernimmt OpenClaw den Workspace des Ziel-Agenten aus der Agent-Konfiguration.
- Fehlende geerbte Workspace-Pfade fallen auf das Standard-`cwd` des Backends zurück; Zugriffsfehler bei vorhandenen Pfaden werden als Spawn-Fehler angezeigt.

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

- `runtime` hat standardmäßig den Wert `subagent`, also setzen Sie für ACP-Sitzungen explizit `runtime: "acp"`.
- Wenn `agentId` weggelassen wird, verwendet OpenClaw `acp.defaultAgent`, wenn konfiguriert.
- `mode: "session"` erfordert `thread: true`, um eine persistente gebundene Konversation beizubehalten.

Details zur Schnittstelle:

- `task` (erforderlich): initialer Prompt, der an die ACP-Sitzung gesendet wird.
- `runtime` (für ACP erforderlich): muss `"acp"` sein.
- `agentId` (optional): ACP-Ziel-Harness-ID. Fällt auf `acp.defaultAgent` zurück, wenn gesetzt.
- `thread` (optional, Standard `false`): Thread-Binding-Flow anfordern, wo unterstützt.
- `mode` (optional): `run` (One-Shot) oder `session` (persistent).
  - Standard ist `run`
  - wenn `thread: true` gesetzt ist und `mode` fehlt, kann OpenClaw je nach Laufzeitpfad standardmäßig persistentes Verhalten verwenden
  - `mode: "session"` erfordert `thread: true`
- `cwd` (optional): angefordertes Laufzeit-Arbeitsverzeichnis (durch Backend-/Laufzeitrichtlinie validiert). Wenn weggelassen, übernimmt ACP-Spawn den Workspace des Ziel-Agenten, wenn konfiguriert; fehlende geerbte Pfade fallen auf Backend-Standardwerte zurück, während echte Zugriffsfehler zurückgegeben werden.
- `label` (optional): operatorseitiges Label, das in Sitzungs-/Bannertext verwendet wird.
- `resumeSessionId` (optional): bestehende ACP-Sitzung fortsetzen, statt eine neue zu erstellen. Der Agent spielt seinen Konversationsverlauf per `session/load` erneut ein. Erfordert `runtime: "acp"`.
- `streamTo` (optional): `"parent"` streamt Fortschrittszusammenfassungen des initialen ACP-Laufs als Systemereignisse zurück in die anfragende Sitzung.
  - Wenn verfügbar, enthalten akzeptierte Antworten `streamLogPath`, das auf ein sitzungsbezogenes JSONL-Log zeigt (`<sessionId>.acp-stream.jsonl`), das Sie für den vollständigen Relay-Verlauf verfolgen können.
- `model` (optional): explizite Modellüberschreibung für die ACP-Kindsitzung. Wird für `runtime: "acp"` beachtet, sodass das Kind das angeforderte Modell verwendet, statt stillschweigend auf den Standardwert des Ziel-Agenten zurückzufallen.

## Zustellungsmodell

ACP-Sitzungen können entweder interaktive Workspaces oder dem Parent gehörende Hintergrundarbeit sein. Der Zustellpfad hängt von dieser Form ab.

### Interaktive ACP-Sitzungen

Interaktive Sitzungen sollen auf einer sichtbaren Chat-Oberfläche fortlaufend verwendet werden:

- `/acp spawn ... --bind here` bindet die aktuelle Konversation an die ACP-Sitzung.
- `/acp spawn ... --thread ...` bindet einen Kanal-Thread/ein Thema an die ACP-Sitzung.
- Persistente konfigurierte `bindings[].type="acp"` leiten passende Konversationen an dieselbe ACP-Sitzung weiter.

Nachfolgende Nachrichten in der gebundenen Konversation werden direkt an die ACP-Sitzung weitergeleitet, und ACP-Ausgabe wird an denselben Kanal/Thread/dasselbe Thema zurück zugestellt.

### Dem Parent gehörende One-Shot-ACP-Sitzungen

One-Shot-ACP-Sitzungen, die durch einen anderen Agent-Lauf erzeugt wurden, sind Hintergrund-Kinder, ähnlich wie Subagenten:

- Der Parent fordert Arbeit an mit `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Das Kind läuft in seiner eigenen ACP-Harness-Sitzung.
- Der Abschluss wird über den internen Ankündigungspfad für Aufgabenabschluss zurückgemeldet.
- Der Parent schreibt das Ergebnis des Kindes in normaler Assistant-Stimme um, wenn eine benutzerseitige Antwort sinnvoll ist.

Behandeln Sie diesen Pfad nicht als Peer-to-Peer-Chat zwischen Parent und Kind. Das Kind hat bereits einen Abschlusskanal zurück zum Parent.

### `sessions_send` und A2A-Zustellung

`sessions_send` kann nach dem Spawn auf eine andere Sitzung zielen. Für normale Peer-Sitzungen verwendet OpenClaw einen Agent-zu-Agent-(A2A)-Nachfolgepfad, nachdem die Nachricht injiziert wurde:

- auf die Antwort der Zielsitzung warten
- optional erlauben, dass Anfragender und Ziel eine begrenzte Anzahl an Folge-Turns austauschen
- das Ziel bitten, eine Ankündigungsnachricht zu erzeugen
- diese Ankündigung an den sichtbaren Kanal oder Thread zustellen

Dieser A2A-Pfad ist ein Fallback für Peer-Sends, wenn der Absender eine sichtbare Nachverfolgung benötigt. Er bleibt aktiviert, wenn eine nicht verwandte Sitzung ein ACP-Ziel sehen und ihm Nachrichten senden kann, zum Beispiel bei breiten Einstellungen von `tools.sessions.visibility`.

OpenClaw überspringt die A2A-Nachverfolgung nur dann, wenn der Anfragende der Parent seines eigenen, dem Parent gehörenden One-Shot-ACP-Kindes ist. In diesem Fall kann A2A zusätzlich zur Aufgabenvervollständigung den Parent mit dem Ergebnis des Kindes aufwecken, die Antwort des Parents zurück in das Kind weiterleiten und eine Echo-Schleife zwischen Parent und Kind erzeugen. Das Ergebnis von `sessions_send` meldet für diesen Fall eines eigenen Kindes `delivery.status="skipped"`, weil der Abschlusspfad bereits für das Ergebnis zuständig ist.

### Eine bestehende Sitzung fortsetzen

Verwenden Sie `resumeSessionId`, um eine frühere ACP-Sitzung fortzusetzen, statt neu zu starten. Der Agent spielt seinen Konversationsverlauf per `session/load` erneut ein, sodass er mit dem vollständigen Kontext der bisherigen Arbeit fortsetzt.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Häufige Anwendungsfälle:

- Eine Codex-Sitzung vom Laptop ans Telefon übergeben — dem Agenten sagen, dass er dort weitermachen soll, wo Sie aufgehört haben
- Eine Coding-Sitzung fortsetzen, die Sie interaktiv in der CLI begonnen haben, jetzt headless über Ihren Agenten
- Arbeit wieder aufnehmen, die durch einen Gateway-Neustart oder ein Leerlauf-Timeout unterbrochen wurde

Hinweise:

- `resumeSessionId` erfordert `runtime: "acp"` — gibt einen Fehler zurück, wenn es mit der Subagent-Laufzeit verwendet wird.
- `resumeSessionId` stellt den vorgeschalteten ACP-Konversationsverlauf wieder her; `thread` und `mode` gelten weiterhin normal für die neue OpenClaw-Sitzung, die Sie erstellen, also erfordert `mode: "session"` weiterhin `thread: true`.
- Der Ziel-Agent muss `session/load` unterstützen (Codex und Claude Code tun das).
- Wenn die Sitzungs-ID nicht gefunden wird, schlägt der Spawn mit einem klaren Fehler fehl — kein stiller Fallback auf eine neue Sitzung.

### Operator-Smoke-Test

Verwenden Sie dies nach einem Gateway-Deployment, wenn Sie schnell live prüfen möchten, dass ACP-Spawn
tatsächlich Ende-zu-Ende funktioniert und nicht nur Unit-Tests besteht.

Empfohlener Gate:

1. Deployte Gateway-Version/Commit auf dem Ziel-Host prüfen.
2. Bestätigen, dass die deployte Quelle die ACP-Lineage-Akzeptanz in
   `src/gateway/sessions-patch.ts` enthält (`subagent:* or acp:* sessions`).
3. Eine temporäre ACPX-Bridge-Sitzung zu einem Live-Agenten öffnen (zum Beispiel
   `razor(main)` auf `jpclawhq`).
4. Diesen Agenten bitten, `sessions_spawn` aufzurufen mit:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - Aufgabe: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Prüfen, dass der Agent meldet:
   - `accepted=yes`
   - einen echten `childSessionKey`
   - keinen Validator-Fehler
6. Die temporäre ACPX-Bridge-Sitzung bereinigen.

Beispiel-Prompt für den Live-Agenten:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Hinweise:

- Lassen Sie diesen Smoke-Test bei `mode: "run"`, sofern Sie nicht absichtlich
  persistente ACP-Sitzungen mit Thread-Bindung testen.
- Verlangen Sie für den grundlegenden Gate nicht `streamTo: "parent"`. Dieser Pfad hängt von
  Fähigkeiten des Anfragenden/der Sitzung ab und ist eine separate Integrationsprüfung.
- Behandeln Sie Tests von threadgebundenem `mode: "session"` als zweiten, reichhaltigeren Integrations-
  durchlauf aus einem echten Discord-Thread oder Telegram-Thema.

## Sandbox-Kompatibilität

ACP-Sitzungen laufen derzeit auf der Host-Laufzeit, nicht innerhalb der OpenClaw-Sandbox.

Aktuelle Einschränkungen:

- Wenn die anfragende Sitzung sandboxed ist, sind ACP-Spawns sowohl für `sessions_spawn({ runtime: "acp" })` als auch für `/acp spawn` blockiert.
  - Fehler: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` mit `runtime: "acp"` unterstützt `sandbox: "require"` nicht.
  - Fehler: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Verwenden Sie `runtime: "subagent"`, wenn Sie sandboxerzwungene Ausführung benötigen.

### Über den `/acp`-Befehl

Verwenden Sie `/acp spawn` für explizite Operatorsteuerung aus dem Chat heraus, wenn nötig.

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

Siehe [Slash-Befehle](/de/tools/slash-commands).

## Auflösung von Sitzungszielen

Die meisten `/acp`-Aktionen akzeptieren ein optionales Sitzungsziel (`session-key`, `session-id` oder `session-label`).

Reihenfolge der Auflösung:

1. Explizites Zielargument (oder `--session` für `/acp steer`)
   - versucht zuerst Schlüssel
   - dann UUID-förmige Sitzungs-ID
   - dann Label
2. Aktuelle Thread-Bindung (wenn diese Konversation/dieser Thread an eine ACP-Sitzung gebunden ist)
3. Fallback auf aktuelle anfragende Sitzung

Bindungen an die aktuelle Konversation und Thread-Bindungen nehmen beide an Schritt 2 teil.

Wenn kein Ziel aufgelöst werden kann, gibt OpenClaw einen klaren Fehler zurück (`Unable to resolve session target: ...`).

## Spawn-Bind-Modi

`/acp spawn` unterstützt `--bind here|off`.

| Modus  | Verhalten                                                               |
| ------ | ----------------------------------------------------------------------- |
| `here` | Die aktuelle aktive Konversation an Ort und Stelle binden; fehlschlagen, wenn keine aktiv ist. |
| `off`  | Keine Bindung an die aktuelle Konversation erstellen.                   |

Hinweise:

- `--bind here` ist der einfachste Operatorpfad für „diesen Kanal oder Chat Codex-gestützt machen“.
- `--bind here` erstellt keinen untergeordneten Thread.
- `--bind here` ist nur auf Kanälen verfügbar, die Unterstützung für Bindung an die aktuelle Konversation bereitstellen.
- `--bind` und `--thread` können nicht im selben Aufruf von `/acp spawn` kombiniert werden.

## Spawn-Thread-Modi

`/acp spawn` unterstützt `--thread auto|here|off`.

| Modus  | Verhalten                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | In einem aktiven Thread: diesen Thread binden. Außerhalb eines Threads: einen untergeordneten Thread erstellen/binden, wenn unterstützt. |
| `here` | Aktiven aktuellen Thread verlangen; fehlschlagen, wenn Sie sich nicht in einem befinden.            |
| `off`  | Keine Bindung. Sitzung startet ungebunden.                                                          |

Hinweise:

- Auf Oberflächen ohne Thread-Binding ist das Standardverhalten faktisch `off`.
- Thread-gebundener Spawn erfordert Unterstützung durch die Kanalrichtlinie:
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

`/acp status` zeigt die effektiven Laufzeitoptionen und, wenn verfügbar, sowohl Laufzeit- als auch Backend-Sitzungskennungen.

Einige Steuerungen hängen von Backend-Fähigkeiten ab. Wenn ein Backend eine Steuerung nicht unterstützt, gibt OpenClaw einen klaren Fehler für nicht unterstützte Steuerung zurück.

## Rezeptbuch für ACP-Befehle

| Befehl               | Was er tut                                                | Beispiel                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-Sitzung erstellen; optionale aktuelle Bindung oder Thread-Bindung. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Laufenden Turn für Zielsitzung abbrechen.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Steueranweisung an laufende Sitzung senden.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sitzung schließen und Thread-Ziele entbinden.             | `/acp close`                                                  |
| `/acp status`        | Backend, Modus, Status, Laufzeitoptionen, Fähigkeiten anzeigen. | `/acp status`                                             |
| `/acp set-mode`      | Laufzeitmodus für Zielsitzung setzen.                     | `/acp set-mode plan`                                          |
| `/acp set`           | Generischen Laufzeit-Konfigurationswert schreiben.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Überschreibung des Laufzeit-Arbeitsverzeichnisses setzen. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Freigaberichtlinienprofil setzen.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Laufzeit-Timeout setzen (Sekunden).                       | `/acp timeout 120`                                            |
| `/acp model`         | Überschreibung des Laufzeitmodells setzen.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Überschreibungen der Sitzungs-Laufzeitoptionen entfernen. | `/acp reset-options`                                          |
| `/acp sessions`      | Aktuelle ACP-Sitzungen aus dem Speicher auflisten.        | `/acp sessions`                                               |
| `/acp doctor`        | Backend-Gesundheit, Fähigkeiten, konkrete Fixes.          | `/acp doctor`                                                 |
| `/acp install`       | Deterministische Installations- und Aktivierungsschritte ausgeben. | `/acp install`                                           |

`/acp sessions` liest den Speicher für die aktuelle gebundene oder anfragende Sitzung. Befehle, die `session-key`, `session-id` oder `session-label` akzeptieren, lösen Ziele über die Gateway-Sitzungserkennung auf, einschließlich benutzerdefinierter `session.store`-Wurzeln pro Agent.

## Zuordnung von Laufzeitoptionen

`/acp` hat Komfortbefehle und einen generischen Setter.

Äquivalente Operationen:

- `/acp model <id>` wird auf den Laufzeit-Konfigurationsschlüssel `model` abgebildet.
- `/acp permissions <profile>` wird auf den Laufzeit-Konfigurationsschlüssel `approval_policy` abgebildet.
- `/acp timeout <seconds>` wird auf den Laufzeit-Konfigurationsschlüssel `timeout` abgebildet.
- `/acp cwd <path>` aktualisiert die `cwd`-Überschreibung der Laufzeit direkt.
- `/acp set <key> <value>` ist der generische Pfad.
  - Sonderfall: `key=cwd` verwendet den Pfad für die `cwd`-Überschreibung.
- `/acp reset-options` löscht alle Laufzeit-Überschreibungen für die Zielsitzung.

## acpx-Harness-Unterstützung (aktuell)

Aktuelle integrierte Harness-Aliasse von acpx:

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

Wenn OpenClaw das Backend acpx verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den `cursor`-Agent-Befehl in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Verwendung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Escape-Hatch ist ein Feature der acpx-CLI (nicht der normale Pfad über `agentId` in OpenClaw).

## Erforderliche Konfiguration

ACP-Basis in Core:

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

Die Konfiguration für Thread-Binding ist kanaladapterspezifisch. Beispiel für Discord:

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

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Setup für das Backend acpx

Frische Installationen liefern das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus, daher funktioniert ACP
normalerweise ohne manuellen Plugin-Installationsschritt.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, es über `plugins.allow` / `plugins.deny` verweigert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation aus lokalem Workspace während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Dann die Backend-Gesundheit prüfen:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte Backend-Plugin acpx (`acpx`) das pluginlokale angeheftete Binary:

1. Der Befehl verwendet standardmäßig das pluginlokale `node_modules/.bin/acpx` innerhalb des ACPX-Plugin-Pakets.
2. Die erwartete Version verwendet standardmäßig den Pin der Erweiterung.
3. Beim Start registriert OpenClaw das ACP-Backend sofort als nicht bereit.
4. Ein Hintergrund-Ensure-Job prüft `acpx --version`.
5. Wenn das pluginlokale Binary fehlt oder nicht passt, wird
   `npm install --omit=dev --no-save acpx@<pinned>` ausgeführt und anschließend erneut geprüft.

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
- `expectedVersion: "any"` deaktiviert strikten Versionsabgleich.
- Wenn `command` auf ein benutzerdefiniertes Binary/einen Pfad zeigt, ist die pluginlokale Auto-Installation deaktiviert.
- Der Start von OpenClaw bleibt nicht blockierend, während die Backend-Gesundheitsprüfung läuft.

Siehe [Plugins](/de/tools/plugin).

### Automatische Abhängigkeitsinstallation

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die
acpx-Laufzeitabhängigkeiten (plattformspezifische Binaries) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen **keine** von OpenClaw registrierten Plugin-Tools für
das ACP-Harness bereit.

Wenn Sie möchten, dass ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen können, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen integrierten MCP-Server mit dem Namen `openclaw-plugin-tools` in den Bootstrap der ACPX-Sitzung.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Hält das Feature explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die im Gateway bereits aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie das Ausführen dieser Plugins
  in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Bridge für Plugin-Tools ist ein
zusätzlicher Opt-in-Komfort, kein Ersatz für generische MCP-Serverkonfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen auch **keine** integrierten OpenClaw-Tools über
MCP bereit. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP-Agent ausgewählte
integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen integrierten MCP-Server mit dem Namen `openclaw-tools` in den Bootstrap der ACPX-Sitzung.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der erste Server stellt `cron` bereit.
- Hält die Bereitstellung von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Laufzeit-Timeouts

Das gebündelte Plugin `acpx` verwendet für eingebettete Laufzeit-Turns standardmäßig
ein Timeout von 120 Sekunden. Das gibt langsameren Harnesses wie Gemini CLI genug Zeit,
ACP-Start und Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes
Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Agents für Gesundheitsprüfungen

Das gebündelte Plugin `acpx` prüft einen Harness-Agenten, während es entscheidet, ob das
Backend der eingebetteten Laufzeit bereit ist. Standardmäßig ist dies `codex`. Wenn Ihre Bereitstellung einen anderen
standardmäßigen ACP-Agenten verwendet, setzen Sie den Probe-Agenten auf dieselbe ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Konfiguration von Berechtigungen

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Berechtigungsaufforderungen für Dateischreib- und Shell-Exec-Aktionen zu genehmigen oder abzulehnen. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von Exec-Freigaben in OpenClaw und getrennt von anbieterspezifischen Bypass-Flags für CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Nachfrage ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungs-Prompts verweigern.                   |

### `nonInteractivePermissions`

Steuert, was passiert, wenn ein Berechtigungs-Prompt angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Die Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**      |
| `deny` | Die Berechtigung stillschweigend verweigern und fortfahren (Graceful Degradation). |

### Konfiguration

Per Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Exec-Vorgang, der einen Berechtigungs-Prompt auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradieren, statt abzustürzen.

## Fehlerbehebung

| Symptom                                                                     | Wahrscheinliche Ursache                                                           | Fix                                                                                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin fehlt oder ist deaktiviert.                                        | Backend-Plugin installieren und aktivieren, dann `/acp doctor` ausführen.                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP global deaktiviert.                                                           | `acp.enabled=true` setzen.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch aus normalen Thread-Nachrichten deaktiviert.                             | `acp.dispatch.enabled=true` setzen.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nicht in der Allowlist.                                                     | Erlaubte `agentId` verwenden oder `acp.allowedAgents` aktualisieren.                                                                                                |
| `Unable to resolve session target: ...`                                     | Ungültiges Schlüssel-/ID-/Label-Token.                                            | `/acp sessions` ausführen, exakten Schlüssel/das exakte Label kopieren, erneut versuchen.                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` wurde ohne aktive bindbare Konversation verwendet.                  | In den Ziel-Chat/-Kanal wechseln und erneut versuchen oder ungebundenen Spawn verwenden.                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter hat keine Fähigkeit für ACP-Bindung an die aktuelle Konversation.         | `/acp spawn ... --thread ...` verwenden, wo unterstützt, Top-Level-`bindings[]` konfigurieren oder zu einem unterstützten Kanal wechseln.                          |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` wurde außerhalb eines Thread-Kontexts verwendet.                  | In den Ziel-Thread wechseln oder `--thread auto`/`off` verwenden.                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Ein anderer Benutzer besitzt das aktive Bindungsziel.                             | Als Eigentümer neu binden oder eine andere Konversation bzw. einen anderen Thread verwenden.                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | Adapter hat keine Thread-Binding-Fähigkeit.                                       | `--thread off` verwenden oder zu einem unterstützten Adapter/Kanal wechseln.                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-Laufzeit läuft auf dem Host; die anfragende Sitzung ist sandboxed.            | `runtime="subagent"` aus sandboxed Sitzungen verwenden oder ACP-Spawn aus einer nicht sandboxed Sitzung ausführen.                                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` wurde für ACP-Laufzeit angefordert.                           | `runtime="subagent"` für erforderliches Sandboxing verwenden oder ACP mit `sandbox="inherit"` aus einer nicht sandboxed Sitzung verwenden.                          |
| Fehlende ACP-Metadaten für gebundene Sitzung                                | Veraltete/gelöschte ACP-Sitzungsmetadaten.                                        | Mit `/acp spawn` neu erstellen, dann Thread neu binden/fokussieren.                                                                                                 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blockiert Schreibvorgänge/Exec in nicht interaktiver ACP-Sitzung. | `plugins.entries.acpx.config.permissionMode` auf `approve-all` setzen und Gateway neu starten. Siehe [Konfiguration von Berechtigungen](#permission-configuration). |
| ACP-Sitzung schlägt früh mit wenig Ausgabe fehl                             | Berechtigungs-Prompts werden durch `permissionMode`/`nonInteractivePermissions` blockiert. | Gateway-Logs auf `AcpRuntimeError` prüfen. Für volle Berechtigungen `permissionMode=approve-all` setzen; für Graceful Degradation `nonInteractivePermissions=deny`. |
| ACP-Sitzung hängt nach Abschluss der Arbeit unbegrenzt                      | Harness-Prozess wurde beendet, aber ACP-Sitzung hat den Abschluss nicht gemeldet. | Mit `ps aux \| grep acpx` überwachen; veraltete Prozesse manuell beenden.                                                                                           |
