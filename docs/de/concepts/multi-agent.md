---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Multi-Agent-Routing: isolierte Agenten, Kanalkonten und Bindings'
title: Multi-Agent-Routing
x-i18n:
    generated_at: "2026-04-05T12:41:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Multi-Agent-Routing

Ziel: mehrere _isolierte_ Agenten (separater Workspace + `agentDir` + Sitzungen) sowie mehrere Kanalkonten (z. B. zwei WhatsApp-Konten) in einem laufenden Gateway. Eingehende Nachrichten werden über Bindings an einen Agenten weitergeleitet.

## Was ist „ein Agent“?

Ein **Agent** ist ein vollständig abgegrenztes System mit eigenem:

- **Workspace** (Dateien, AGENTS.md/SOUL.md/USER.md, lokale Notizen, Persona-Regeln).
- **Statusverzeichnis** (`agentDir`) für Auth-Profile, Modell-Registry und agentenspezifische Konfiguration.
- **Sitzungsspeicher** (Chatverlauf + Routing-Status) unter `~/.openclaw/agents/<agentId>/sessions`.

Auth-Profile sind **pro Agent** getrennt. Jeder Agent liest aus seiner eigenen Datei:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` ist auch hier der sicherere Weg für sitzungsübergreifenden Abruf: Es liefert
eine begrenzte, bereinigte Ansicht, keinen rohen Transkript-Dump. Der Assistant-Abruf entfernt
Thinking-Tags, `<relevant-memories>`-Gerüste, XML-Payloads von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` sowie abgeschnittener Tool-Call-Blöcke),
herabgestufte Tool-Call-Gerüste, durchgesickerte ASCII-/Full-Width-Modell-Steuerungs-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML vor Redaction/Truncation.

Anmeldedaten des Hauptagenten werden **nicht** automatisch geteilt. Verwenden Sie niemals dasselbe `agentDir`
für mehrere Agenten (das führt zu Auth-/Sitzungskollisionen). Wenn Sie Anmeldedaten teilen möchten,
kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agenten.

Skills werden aus dem Workspace jedes Agenten sowie aus gemeinsamen Wurzelverzeichnissen wie
`~/.openclaw/skills` geladen und dann anhand der effektiven Agent-Skill-Allowlist gefiltert, wenn diese konfiguriert ist. Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und
`agents.list[].skills` für agentenspezifisches Ersetzen. Siehe
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) und
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists).

Das Gateway kann **einen Agenten** (Standard) oder **mehrere Agenten** nebeneinander hosten.

**Hinweis zum Workspace:** Der Workspace jedes Agenten ist das **Standard-cwd**, keine harte
Sandbox. Relative Pfade werden innerhalb des Workspace aufgelöst, absolute Pfade können aber
andere Orte auf dem Host erreichen, sofern keine Sandbox aktiviert ist. Siehe
[Sandboxing](/gateway/sandboxing).

## Pfade (Kurzüberblick)

- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Statusverzeichnis: `~/.openclaw` (oder `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<agentId>`)
- Agent-Verzeichnis: `~/.openclaw/agents/<agentId>/agent` (oder `agents.list[].agentDir`)
- Sitzungen: `~/.openclaw/agents/<agentId>/sessions`

### Einzelagent-Modus (Standard)

Wenn Sie nichts tun, führt OpenClaw einen einzelnen Agenten aus:

- `agentId` ist standardmäßig **`main`**.
- Sitzungen werden als `agent:main:<mainKey>` geschlüsselt.
- Der Workspace ist standardmäßig `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` gesetzt ist).
- Der Status ist standardmäßig `~/.openclaw/agents/main/agent`.

## Agent-Helfer

Verwenden Sie den Agent-Wizard, um einen neuen isolierten Agenten hinzuzufügen:

```bash
openclaw agents add work
```

Fügen Sie dann `bindings` hinzu (oder lassen Sie das den Wizard tun), um eingehende Nachrichten weiterzuleiten.

Überprüfen Sie dies mit:

```bash
openclaw agents list --bindings
```

## Schnelleinstieg

<Steps>
  <Step title="Workspace für jeden Agenten erstellen">

Verwenden Sie den Wizard oder erstellen Sie Workspaces manuell:

```bash
openclaw agents add coding
openclaw agents add social
```

Jeder Agent erhält einen eigenen Workspace mit `SOUL.md`, `AGENTS.md` und optional `USER.md` sowie ein dediziertes `agentDir` und einen Sitzungsspeicher unter `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Kanalkonten erstellen">

Erstellen Sie pro Agent ein Konto in Ihren bevorzugten Kanälen:

- Discord: ein Bot pro Agent, Message Content Intent aktivieren, jedes Token kopieren.
- Telegram: ein Bot pro Agent über BotFather, jedes Token kopieren.
- WhatsApp: jede Telefonnummer pro Konto verknüpfen.

```bash
openclaw channels login --channel whatsapp --account work
```

Siehe Kanalleitfäden: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Agenten, Konten und Bindings hinzufügen">

Fügen Sie Agenten unter `agents.list`, Kanalkonten unter `channels.<channel>.accounts` hinzu und verbinden Sie sie über `bindings` (Beispiele unten).

  </Step>

  <Step title="Neu starten und überprüfen">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Mehrere Agenten = mehrere Personen, mehrere Persönlichkeiten

Mit **mehreren Agenten** wird jede `agentId` zu einer **vollständig isolierten Persona**:

- **Unterschiedliche Telefonnummern/Konten** (pro Kanal `accountId`).
- **Unterschiedliche Persönlichkeiten** (über agentenspezifische Workspace-Dateien wie `AGENTS.md` und `SOUL.md`).
- **Getrennte Auth + Sitzungen** (kein Übersprechen, sofern nicht explizit aktiviert).

So können **mehrere Personen** einen Gateway-Server gemeinsam nutzen, während ihre KI-„Gehirne“ und Daten isoliert bleiben.

## QMD-Memory-Suche agentenübergreifend

Wenn ein Agent die QMD-Sitzungstranskripte eines anderen Agenten durchsuchen soll, fügen Sie
zusätzliche Collections unter `agents.list[].memorySearch.qmd.extraCollections` hinzu.
Verwenden Sie `agents.defaults.memorySearch.qmd.extraCollections` nur dann, wenn jeder Agent
dieselben gemeinsamen Transkript-Collections erben soll.

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
            extraCollections: [{ path: "notes" }], // wird innerhalb des Workspace aufgelöst -> Collection namens "notes-main"
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

Der Pfad der zusätzlichen Collection kann von mehreren Agenten gemeinsam genutzt werden, aber der Collection-Name
bleibt explizit, wenn sich der Pfad außerhalb des Workspace des Agenten befindet. Pfade innerhalb des
Workspace bleiben agentenspezifisch, sodass jeder Agent seine eigene Transkriptsuchmenge behält.

## Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)

Sie können **unterschiedliche WhatsApp-DMs** an unterschiedliche Agenten weiterleiten, während Sie bei **einem WhatsApp-Konto** bleiben. Gleichen Sie mit der E.164-Absendernummer (wie `+15551234567`) und `peer.kind: "direct"` ab. Antworten kommen weiterhin von derselben WhatsApp-Nummer (keine agentenspezifische Absenderidentität).

Wichtiges Detail: Direktchats werden auf den **Hauptsitzungsschlüssel** des Agenten reduziert, daher erfordert echte Isolation **einen Agenten pro Person**.

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

- Die DM-Zugriffskontrolle ist **global pro WhatsApp-Konto** (Pairing/Allowlist), nicht pro Agent.
- Für gemeinsam genutzte Gruppen binden Sie die Gruppe an einen Agenten oder verwenden Sie [Broadcast groups](/channels/broadcast-groups).

## Routing-Regeln (wie Nachrichten einen Agenten auswählen)

Bindings sind **deterministisch** und **die spezifischste Regel gewinnt**:

1. `peer`-Match (exakte DM-/Gruppen-/Kanal-ID)
2. `parentPeer`-Match (Thread-Vererbung)
3. `guildId + roles` (Discord-Routing nach Rollen)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. `accountId`-Match für einen Kanal
7. Kanalweites Match (`accountId: "*"`)
8. Fallback auf Standardagent (`agents.list[].default`, sonst erster Listeneintrag, Standard: `main`)

Wenn mehrere Bindings innerhalb derselben Ebene übereinstimmen, gewinnt das erste in der Konfigurationsreihenfolge.
Wenn ein Binding mehrere Match-Felder setzt (zum Beispiel `peer` + `guildId`), müssen alle angegebenen Felder übereinstimmen (`AND`-Semantik).

Wichtiges Detail zum Kontobereich:

- Ein Binding ohne `accountId` passt nur auf das Standardkonto.
- Verwenden Sie `accountId: "*"` für einen kanalweiten Fallback über alle Konten hinweg.
- Wenn Sie später dasselbe Binding für denselben Agenten mit einer expliziten Konto-ID hinzufügen, erweitert OpenClaw das vorhandene kanalweite Binding auf Kontobereich, statt es zu duplizieren.

## Mehrere Konten / Telefonnummern

Kanäle, die **mehrere Konten** unterstützen (z. B. WhatsApp), verwenden `accountId`, um
jede Anmeldung zu identifizieren. Jede `accountId` kann an einen anderen Agenten weitergeleitet werden, sodass ein Server
mehrere Telefonnummern hosten kann, ohne Sitzungen zu vermischen.

Wenn Sie ein kanalweites Standardkonto möchten, wenn `accountId` weggelassen wird, setzen Sie
optional `channels.<channel>.defaultAccount`. Wenn dies nicht gesetzt ist, fällt OpenClaw auf
`default` zurück, falls vorhanden, sonst auf die erste konfigurierte Konto-ID (sortiert).

Häufige Kanäle, die dieses Muster unterstützen:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konzepte

- `agentId`: ein „Gehirn“ (Workspace, agentenspezifische Auth, agentenspezifischer Sitzungsspeicher).
- `accountId`: eine Kanal-Konto-Instanz (z. B. WhatsApp-Konto `"personal"` vs `"biz"`).
- `binding`: leitet eingehende Nachrichten anhand von `(channel, accountId, peer)` und optional Guild-/Team-IDs an eine `agentId` weiter.
- Direktchats werden auf `agent:<agentId>:<mainKey>` reduziert (pro Agent „main“; `session.mainKey`).

## Plattformbeispiele

### Discord-Bots pro Agent

Jedes Discord-Bot-Konto wird auf eine eindeutige `accountId` abgebildet. Binden Sie jedes Konto an einen Agenten und behalten Sie Allowlists pro Bot bei.

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
- Tokens liegen in `channels.discord.accounts.<id>.token` (das Standardkonto kann `DISCORD_BOT_TOKEN` verwenden).

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

- Erstellen Sie pro Agent einen Bot mit BotFather und kopieren Sie jedes Token.
- Tokens liegen in `channels.telegram.accounts.<id>.botToken` (das Standardkonto kann `TELEGRAM_BOT_TOKEN` verwenden).

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

  // Deterministisches Routing: erste Übereinstimmung gewinnt (spezifischste zuerst).
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

## Beispiel: täglicher WhatsApp-Chat + Telegram-Deep-Work

Nach Kanal aufteilen: WhatsApp an einen schnellen Alltagsagenten weiterleiten und Telegram an einen Opus-Agenten.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
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

- Wenn Sie mehrere Konten für einen Kanal haben, fügen Sie `accountId` zum Binding hinzu (zum Beispiel `{ channel: "whatsapp", accountId: "personal" }`).
- Um eine einzelne DM/Gruppe an Opus weiterzuleiten, während der Rest bei chat bleibt, fügen Sie ein `match.peer`-Binding für diesen Peer hinzu; Peer-Matches gewinnen immer vor kanalweiten Regeln.

## Beispiel: gleicher Kanal, ein Peer an Opus

Behalten Sie WhatsApp beim schnellen Agenten, leiten Sie aber eine DM an Opus weiter:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
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

Peer-Bindings gewinnen immer, daher sollten sie oberhalb der kanalweiten Regel stehen.

## Familien-Agent an eine WhatsApp-Gruppe gebunden

Binden Sie einen dedizierten Familien-Agenten an eine einzelne WhatsApp-Gruppe, mit Mention-Gating
und einer strengeren Tool-Richtlinie:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
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

- Tool-Allow-/Deny-Listen sind **Tools**, nicht Skills. Wenn ein Skill eine
  Binärdatei ausführen muss, stellen Sie sicher, dass `exec` erlaubt ist und die Binärdatei in der Sandbox existiert.
- Für strikteres Gating setzen Sie `agents.list[].groupChat.mentionPatterns` und lassen
  Gruppen-Allowlists für den Kanal aktiviert.

## Sandbox- und Tool-Konfiguration pro Agent

Jeder Agent kann eigene Sandbox- und Tool-Einschränkungen haben:

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
          mode: "all",     // Immer sandboxed
          scope: "agent",  // Ein Container pro Agent
          docker: {
            // Optionales einmaliges Setup nach dem Erstellen des Containers
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Nur das Tool read
          deny: ["exec", "write", "edit", "apply_patch"],    // Andere verbieten
        },
      },
    ],
  },
}
```

Hinweis: `setupCommand` steht unter `sandbox.docker` und wird einmal beim Erstellen des Containers ausgeführt.
Überschreibungen pro Agent für `sandbox.docker.*` werden ignoriert, wenn der aufgelöste Scope `"shared"` ist.

**Vorteile:**

- **Sicherheitsisolierung**: Tools für nicht vertrauenswürdige Agenten einschränken
- **Ressourcenkontrolle**: Bestimmte Agenten in eine Sandbox setzen, während andere auf dem Host bleiben
- **Flexible Richtlinien**: Unterschiedliche Berechtigungen pro Agent

Hinweis: `tools.elevated` ist **global** und absenderbasiert; es ist nicht pro Agent konfigurierbar.
Wenn Sie Grenzen pro Agent benötigen, verwenden Sie `agents.list[].tools`, um `exec` zu verbieten.
Für Gruppenziele verwenden Sie `agents.list[].groupChat.mentionPatterns`, damit @Erwähnungen klar dem beabsichtigten Agenten zugeordnet werden.

Siehe [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) für detaillierte Beispiele.

## Verwandt

- [Channel Routing](/channels/channel-routing) — wie Nachrichten an Agenten weitergeleitet werden
- [Sub-Agents](/tools/subagents) — Ausführen von Agentenläufen im Hintergrund
- [ACP Agents](/tools/acp-agents) — Ausführen externer Coding-Harnesses
- [Presence](/concepts/presence) — Agent-Präsenz und Verfügbarkeit
- [Session](/concepts/session) — Sitzungsisolierung und Routing
