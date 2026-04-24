---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Multi-Agent-Routing: isolierte Agenten, Kanalkonten und Bindungen'
title: Multi-Agent-Routing
x-i18n:
    generated_at: "2026-04-24T06:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Führen Sie mehrere _isolierte_ Agenten aus — jeder mit eigenem Workspace, eigenem Statusverzeichnis (`agentDir`) und eigenem Sitzungsverlauf — plus mehrere Kanalkonten (z. B. zwei WhatsApp-Konten) in einem laufenden Gateway. Eingehende Nachrichten werden über Bindungen an den richtigen Agenten weitergeleitet.

Ein **Agent** ist hier der vollständige Scope pro Persona: Workspace-Dateien, Auth-Profile, Modellregister und Session Store. `agentDir` ist das Statusverzeichnis auf dem Datenträger, das diese Konfiguration pro Agent unter `~/.openclaw/agents/<agentId>/` enthält. Eine **Bindung** ordnet ein Kanalkonto (z. B. einen Slack-Workspace oder eine WhatsApp-Nummer) einem dieser Agenten zu.

## Was ist „ein Agent“?

Ein **Agent** ist ein vollständig abgegrenztes Gehirn mit eigenem:

- **Workspace** (Dateien, AGENTS.md/SOUL.md/USER.md, lokale Notizen, Persona-Regeln).
- **Statusverzeichnis** (`agentDir`) für Auth-Profile, Modellregister und Konfiguration pro Agent.
- **Session Store** (Chatverlauf + Routing-Status) unter `~/.openclaw/agents/<agentId>/sessions`.

Auth-Profile sind **pro Agent**. Jeder Agent liest aus seiner eigenen Datei:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` ist auch hier der sicherere Pfad für sitzungsübergreifenden Recall: Es gibt
eine begrenzte, bereinigte Sicht zurück, keinen rohen Transcript-Dump. Assistant-Recall entfernt
Thinking-Tags, Gerüste aus `<relevant-memories>`, XML-Nutzlasten von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittene Tool-Call-Blöcke),
herabgestufte Tool-Call-Gerüste, durchgesickerte ASCII-/Full-Width-Modellsteuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML vor Redaction/Trunkierung.

Zugangsdaten des Hauptagenten werden **nicht** automatisch geteilt. Verwenden Sie niemals dasselbe `agentDir`
für mehrere Agenten (das verursacht Kollisionen bei Authentifizierung/Sitzungen). Wenn Sie Zugangsdaten teilen möchten,
kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agenten.

Skills werden aus dem Workspace jedes Agenten plus gemeinsam genutzten Wurzeln wie
`~/.openclaw/skills` geladen und dann durch die effektive Skill-Allowlist des Agenten gefiltert, wenn
sie konfiguriert ist. Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und
`agents.list[].skills` für agentenspezifisches Ersetzen. Siehe
[Skills: pro Agent vs. gemeinsam](/de/tools/skills#per-agent-vs-shared-skills) und
[Skills: Skill-Allowlists für Agenten](/de/tools/skills#agent-skill-allowlists).

Das Gateway kann **einen Agenten** (Standard) oder **viele Agenten** nebeneinander hosten.

**Hinweis zum Workspace:** Der Workspace jedes Agenten ist das **Standard-cwd**, keine harte
Sandbox. Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können
andere Host-Speicherorte erreichen, sofern Sandboxing nicht aktiviert ist. Siehe
[Sandboxing](/de/gateway/sandboxing).

## Pfade (Kurzübersicht)

- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Statusverzeichnis: `~/.openclaw` (oder `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<agentId>`)
- Agent-Verzeichnis: `~/.openclaw/agents/<agentId>/agent` (oder `agents.list[].agentDir`)
- Sitzungen: `~/.openclaw/agents/<agentId>/sessions`

### Einzelagent-Modus (Standard)

Wenn Sie nichts tun, führt OpenClaw einen einzelnen Agenten aus:

- `agentId` ist standardmäßig **`main`**.
- Sitzungen werden als `agent:main:<mainKey>` geschlüsselt.
- Workspace ist standardmäßig `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` gesetzt ist).
- Status ist standardmäßig `~/.openclaw/agents/main/agent`.

## Agent-Helper

Verwenden Sie den Agent-Assistenten, um einen neuen isolierten Agenten hinzuzufügen:

```bash
openclaw agents add work
```

Fügen Sie dann `bindings` hinzu (oder lassen Sie dies vom Assistenten erledigen), um eingehende Nachrichten weiterzuleiten.

Prüfen Sie mit:

```bash
openclaw agents list --bindings
```

## Schnellstart

<Steps>
  <Step title="Erstellen Sie den Workspace für jeden Agenten">

Verwenden Sie den Assistenten oder erstellen Sie Workspaces manuell:

```bash
openclaw agents add coding
openclaw agents add social
```

Jeder Agent erhält seinen eigenen Workspace mit `SOUL.md`, `AGENTS.md` und optional `USER.md` sowie ein dediziertes `agentDir` und einen Session Store unter `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Kanalkonten erstellen">

Erstellen Sie ein Konto pro Agent in Ihren bevorzugten Kanälen:

- Discord: ein Bot pro Agent, Message Content Intent aktivieren, jedes Token kopieren.
- Telegram: ein Bot pro Agent über BotFather, jedes Token kopieren.
- WhatsApp: jede Telefonnummer pro Konto verknüpfen.

```bash
openclaw channels login --channel whatsapp --account work
```

Siehe Kanalleitfäden: [Discord](/de/channels/discord), [Telegram](/de/channels/telegram), [WhatsApp](/de/channels/whatsapp).

  </Step>

  <Step title="Agenten, Konten und Bindungen hinzufügen">

Fügen Sie Agenten unter `agents.list`, Kanalkonten unter `channels.<channel>.accounts` hinzu und verbinden Sie sie mit `bindings` (Beispiele unten).

  </Step>

  <Step title="Neu starten und prüfen">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Mehrere Agenten = mehrere Personen, mehrere Persönlichkeiten

Mit **mehreren Agenten** wird jede `agentId` zu einer **vollständig isolierten Persona**:

- **Verschiedene Telefonnummern/Konten** (pro Kanal `accountId`).
- **Verschiedene Persönlichkeiten** (über Dateien pro Agenten-Workspace wie `AGENTS.md` und `SOUL.md`).
- **Getrennte Authentifizierung + Sitzungen** (kein Cross-Talk, sofern nicht explizit aktiviert).

So können **mehrere Personen** sich einen Gateway-Server teilen und gleichzeitig ihre KI-„Gehirne“ und Daten isoliert halten.

## QMD-Memory-Suche über Agenten hinweg

Wenn ein Agent die QMD-Sitzungstranskripte eines anderen Agenten durchsuchen soll, fügen Sie
zusätzliche Collections unter `agents.list[].memorySearch.qmd.extraCollections` hinzu.
Verwenden Sie `agents.defaults.memorySearch.qmd.extraCollections` nur dann, wenn alle Agenten
dieselben gemeinsam genutzten Transcript-Collections erben sollen.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // wird innerhalb des Workspace aufgelöst -> Collection mit dem Namen "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Der zusätzliche Collection-Pfad kann über Agenten hinweg gemeinsam genutzt werden, aber der Name der Collection
bleibt explizit, wenn sich der Pfad außerhalb des Agenten-Workspace befindet. Pfade innerhalb des
Workspace bleiben agentenbezogen, sodass jeder Agent seinen eigenen Satz für die Transcript-Suche behält.

## Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)

Sie können **verschiedene WhatsApp-DMs** an verschiedene Agenten weiterleiten, während Sie **ein WhatsApp-Konto** verwenden. Passen Sie auf die E.164-Absendernummer (wie `+15551234567`) mit `peer.kind: "direct"` an. Antworten kommen weiterhin von derselben WhatsApp-Nummer (keine Absenderidentität pro Agent).

Wichtiges Detail: Direkte Chats werden auf den **main session key** des Agenten reduziert, daher erfordert echte Isolierung **einen Agenten pro Person**.

Beispiel:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Hinweise:

- DM-Zugriffskontrolle ist **global pro WhatsApp-Konto** (Pairing/Allowlist), nicht pro Agent.
- Für gemeinsame Gruppen binden Sie die Gruppe an einen Agenten oder verwenden Sie [Broadcast Groups](/de/channels/broadcast-groups).

## Routing-Regeln (wie Nachrichten einen Agenten auswählen)

Bindungen sind **deterministisch**, und **die spezifischste gewinnt**:

1. `peer`-Match (exakte DM-/Gruppen-/Kanal-ID)
2. `parentPeer`-Match (Thread-Vererbung)
3. `guildId + roles` (Discord-Routing nach Rollen)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. `accountId`-Match für einen Kanal
7. Match auf Kanalebene (`accountId: "*"`)
8. Fallback auf Standardagent (`agents.list[].default`, sonst erster Listeneintrag, Standard: `main`)

Wenn mehrere Bindungen in derselben Ebene passen, gewinnt die erste in der Konfigurationsreihenfolge.
Wenn eine Bindung mehrere Match-Felder setzt (zum Beispiel `peer` + `guildId`), sind alle angegebenen Felder erforderlich (Semantik per `AND`).

Wichtiges Detail zum Konto-Scope:

- Eine Bindung ohne `accountId` passt nur auf das Standardkonto.
- Verwenden Sie `accountId: "*"` für einen kanalweiten Fallback über alle Konten hinweg.
- Wenn Sie später dieselbe Bindung für denselben Agenten mit einer expliziten Konto-ID hinzufügen, stuft OpenClaw die bestehende nur kanalbezogene Bindung auf kontoabhängig hoch, statt sie zu duplizieren.

## Mehrere Konten / Telefonnummern

Kanäle, die **mehrere Konten** unterstützen (z. B. WhatsApp), verwenden `accountId`, um
jede Anmeldung zu identifizieren. Jede `accountId` kann an einen anderen Agenten weitergeleitet werden, sodass ein Server
mehrere Telefonnummern hosten kann, ohne Sitzungen zu vermischen.

Wenn Sie ein kanalweites Standardkonto möchten, wenn `accountId` weggelassen wird, setzen Sie
optional `channels.<channel>.defaultAccount`. Wenn dies nicht gesetzt ist, fällt OpenClaw
auf `default` zurück, falls vorhanden, andernfalls auf die erste konfigurierte Konto-ID (sortiert).

Häufige Kanäle, die dieses Muster unterstützen, sind:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konzepte

- `agentId`: ein „Gehirn“ (Workspace, Authentifizierung pro Agent, Session Store pro Agent).
- `accountId`: eine Instanz eines Kanalkontos (z. B. WhatsApp-Konto `"personal"` vs. `"biz"`).
- `binding`: leitet eingehende Nachrichten an ein `agentId` über `(channel, accountId, peer)` und optional Guild-/Team-IDs weiter.
- Direkte Chats werden auf `agent:<agentId>:<mainKey>` reduziert (pro Agent „main“; `session.mainKey`).

## Plattformbeispiele

### Discord-Bots pro Agent

Jedes Discord-Bot-Konto ist einer eindeutigen `accountId` zugeordnet. Binden Sie jedes Konto an einen Agenten und behalten Sie Allowlists pro Bot bei.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Hinweise:

- Laden Sie jeden Bot in die Guild ein und aktivieren Sie Message Content Intent.
- Tokens befinden sich unter `channels.discord.accounts.<id>.token` (das Standardkonto kann `DISCORD_BOT_TOKEN` verwenden).

### Telegram-Bots pro Agent

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Hinweise:

- Erstellen Sie mit BotFather einen Bot pro Agent und kopieren Sie jedes Token.
- Tokens befinden sich unter `channels.telegram.accounts.<id>.botToken` (das Standardkonto kann `TELEGRAM_BOT_TOKEN` verwenden).

### WhatsApp-Nummern pro Agent

Verknüpfen Sie jedes Konto, bevor Sie das Gateway starten:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministisches Routing: erstes Match gewinnt (spezifischste zuerst).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optionale Überschreibung pro Peer (Beispiel: eine bestimmte Gruppe an den Work-Agenten senden).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Standardmäßig aus: Agent-zu-Agent-Nachrichten müssen explizit aktiviert + auf die Allowlist gesetzt werden.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optionale Überschreibung. Standard: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optionale Überschreibung. Standard: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Beispiel: täglicher Chat auf WhatsApp + Deep Work auf Telegram

Aufteilung nach Kanal: Leiten Sie WhatsApp an einen schnellen Alltags-Agenten und Telegram an einen Opus-Agenten weiter.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Alltag",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Hinweise:

- Wenn Sie mehrere Konten für einen Kanal haben, fügen Sie `accountId` zur Bindung hinzu (zum Beispiel `{ channel: "whatsapp", accountId: "personal" }`).
- Um eine einzelne DM/Gruppe an Opus weiterzuleiten und den Rest auf Chat zu belassen, fügen Sie eine Bindung `match.peer` für diesen Peer hinzu; Peer-Matches haben immer Vorrang vor kanalweiten Regeln.

## Beispiel: derselbe Kanal, ein Peer zu Opus

Behalten Sie WhatsApp auf dem schnellen Agenten, leiten Sie aber eine DM an Opus weiter:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Alltag",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Peer-Bindungen haben immer Vorrang, setzen Sie sie daher oberhalb der kanalweiten Regel.

## Familien-Agent an eine WhatsApp-Gruppe gebunden

Binden Sie einen dedizierten Familien-Agenten an eine einzelne WhatsApp-Gruppe, mit Steuerung über Erwähnungen
und einer strengeren Tool-Richtlinie:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Familie",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Hinweise:

- Tool-Allow-/Deny-Listen beziehen sich auf **Tools**, nicht auf Skills. Wenn ein Skill eine
  Binärdatei ausführen muss, stellen Sie sicher, dass `exec` erlaubt ist und die Binärdatei in der Sandbox vorhanden ist.
- Für strengere Steuerung setzen Sie `agents.list[].groupChat.mentionPatterns` und lassen
  Gruppen-Allowlists für den Kanal aktiviert.

## Sandbox- und Tool-Konfiguration pro Agent

Jeder Agent kann eigene Einschränkungen für Sandbox und Tools haben:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Keine Sandbox für den persönlichen Agenten
        },
        // Keine Tool-Einschränkungen - alle Tools verfügbar
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Immer in Sandbox
          scope: "agent",  // Ein Container pro Agent
          docker: {
            // Optionale einmalige Einrichtung nach Erstellung des Containers
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Nur Tool "read"
          deny: ["exec", "write", "edit", "apply_patch"],    // Andere verbieten
        },
      },
    ],
  },
}
```

Hinweis: `setupCommand` befindet sich unter `sandbox.docker` und wird einmal bei der Erstellung des Containers ausgeführt.
Überschreibungen pro Agent unter `sandbox.docker.*` werden ignoriert, wenn der aufgelöste Scope `"shared"` ist.

**Vorteile:**

- **Sicherheitsisolation**: Tools für nicht vertrauenswürdige Agenten einschränken
- **Ressourcenkontrolle**: bestimmte Agenten in Sandbox ausführen und andere auf dem Host belassen
- **Flexible Richtlinien**: unterschiedliche Berechtigungen pro Agent

Hinweis: `tools.elevated` ist **global** und absenderbezogen; es ist nicht pro Agent konfigurierbar.
Wenn Sie Grenzen pro Agent benötigen, verwenden Sie `agents.list[].tools`, um `exec` zu verbieten.
Für die Ausrichtung auf Gruppen verwenden Sie `agents.list[].groupChat.mentionPatterns`, damit @Erwähnungen sauber dem vorgesehenen Agenten zugeordnet werden.

Siehe [Multi-Agent-Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für ausführliche Beispiele.

## Verwandt

- [Kanal-Routing](/de/channels/channel-routing) — wie Nachrichten an Agenten weitergeleitet werden
- [Sub-Agenten](/de/tools/subagents) — Agent-Läufe im Hintergrund starten
- [ACP-Agenten](/de/tools/acp-agents) — externe Coding-Harnesses ausführen
- [Presence](/de/concepts/presence) — Presence und Verfügbarkeit von Agenten
- [Sitzung](/de/concepts/session) — Sitzungsisolierung und Routing
