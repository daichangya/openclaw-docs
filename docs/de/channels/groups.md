---
read_when:
    - Verhalten von Gruppenchats oder Mention-Gating ändern
summary: Verhalten von Gruppenchats über alle Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-05T12:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# Gruppen

OpenClaw behandelt Gruppenchats über alle Oberflächen hinweg konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie Mention-Gating nicht ausdrücklich deaktivieren.

Übersetzt bedeutet das: Sender auf der Allowlist können OpenClaw durch Erwähnung auslösen.

> Kurz gesagt
>
> - **DM-Zugriff** wird über `*.allowFrom` gesteuert.
> - **Gruppenzugriff** wird über `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - **Auslösen von Antworten** wird über Mention-Gating (`requireMention`, `/activation`) gesteuert.

Schneller Ablauf (was bei einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsichtbarkeit und Allowlists

An der Sicherheit von Gruppen sind zwei verschiedene Steuerungen beteiligt:

- **Trigger-Autorisierung**: Wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsichtbarkeit**: Welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chat-Verhalten und hält den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Allowlists in erster Linie entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet sind.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden bereits senderbasierte Filterung für ergänzenden Kontext in bestimmten Pfaden an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

Härtungsrichtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten bei, wie empfangen.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender in der Allowlist.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Ausnahme für Zitat/Antwort.

Bis dieses Härtungsmodell kanalübergreifend konsistent umgesetzt ist, sollten Sie Unterschiede je nach Oberfläche erwarten.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten...

| Ziel                                         | Was festgelegt werden muss                                |
| -------------------------------------------- | --------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @mentions antworten | `groups: { "*": { requireMention: true } }`     |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                 |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` an die Gruppen-ID an, sodass jedes Thema seine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Sender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr **DMs** und Ihr „öffentlicher“ Datenverkehr **Gruppen** sind.

Warum: Im Einzelagentenmodus landen DMs typischerweise im Sitzungsschlüssel **main** (`agent:main:main`), während Gruppen immer **Nicht-Main**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen in Docker, während Ihre Haupt-DM-Sitzung auf dem Host bleibt.

Dadurch erhalten Sie ein Agent-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei Ausführungsmodi:

- **DMs**: volle Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools (Docker)

> Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent-Routing](/concepts/multi-agent).

Beispiel (DMs auf dem Host, Gruppen in der Sandbox + nur Messaging-Tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // Gruppen/Kanäle sind non-main -> Sandbox
        scope: "session", // stärkste Isolation (ein Container pro Gruppe/Kanal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Wenn allow nicht leer ist, wird alles andere blockiert (deny gewinnt weiterhin).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Möchten Sie „Gruppen können nur Ordner X sehen“ statt „kein Host-Zugriff“? Behalten Sie `workspaceAccess: "none"` bei und mounten Sie nur Pfade aus der Allowlist in die Sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Verwandt:

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/gateway/configuration-reference#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Anzeigenamen

- UI-Beschriftungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (Kleinbuchstaben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppenrichtlinie

Steuern Sie pro Kanal, wie Gruppen-/Raumnachrichten behandelt werden:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (Assistent kann @username auflösen)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Richtlinie   | Verhalten                                                    |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Gruppen umgehen Allowlists; Mention-Gating gilt weiterhin.   |
| `"disabled"` | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume erlauben, die der konfigurierten Allowlist entsprechen. |

Hinweise:

- `groupPolicy` ist getrennt von Mention-Gating (das @mentions erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Pairing-Freigaben (Store-Einträge `*-allowFrom`) gelten nur für DM-Zugriff; Gruppen-Senderautorisierung bleibt explizit auf Gruppen-Allowlists beschränkt.
- Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Allowlist verwendet `channels.slack.channels`.
- Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namensauflösung beigetretener Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Sender einzuschränken; Allowlists pro Raum über `users` werden ebenfalls unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Die Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe unterscheiden nicht zwischen Groß- und Kleinschreibung.
- Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu übernehmen.

Schnelles mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist)
3. Mention-Gating (`requireMention`, `/activation`)

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte befinden sich pro Subsystem unter `*.groups."*"`.

Auf eine Bot-Nachricht zu antworten zählt als implizite Erwähnung (wenn der Kanal Antwort-Metadaten unterstützt). Das gilt für Telegram, WhatsApp, Slack, Discord und Microsoft Teams.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Hinweise:

- `mentionPatterns` sind sichere Regex-Muster ohne Beachtung der Groß-/Kleinschreibung; ungültige Muster und unsichere verschachtelte Wiederholungsformen werden ignoriert.
- Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin durchgelassen; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe teilen).
- Mention-Gating wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standardwerte befinden sich unter `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Der Verlaufskontext für Gruppen wird kanalübergreifend einheitlich umhüllt und ist **nur für ausstehende Nachrichten** (Nachrichten, die wegen Mention-Gating übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: Tools für die gesamte Gruppe erlauben/verbieten.
- `toolsBySender`: Überschreibungen pro Sender innerhalb der Gruppe.
  Verwenden Sie explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Platzhalter `"*"`.
  Ältere Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (die spezifischste gewinnt):

1. Treffer in `toolsBySender` der Gruppe/des Kanals
2. `tools` der Gruppe/des Kanals
3. Treffer in `toolsBySender` des Standards (`"*"` )
4. `tools` des Standards (`"*"`)

Beispiel (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Hinweise:

- Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/agentenspezifischen Tool-Richtlinie angewendet (deny gewinnt weiterhin).
- Einige Kanäle verwenden unterschiedliche Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"`, um alle Gruppen zu erlauben und dennoch das Standardverhalten für Erwähnungen festzulegen.

Häufiges Missverständnis: DM-Pairing-Freigabe ist nicht dasselbe wie Gruppenautorisierung.
Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Store nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Senderautorisierung für Gruppen aus Konfigurations-Allowlists wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (kopieren/einfügen):

1. Alle Gruppenantworten deaktivieren

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Nur bestimmte Gruppen erlauben (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Alle Gruppen erlauben, aber Erwähnung verlangen (explizit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Nur der Eigentümer kann in Gruppen auslösen (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Aktivierung (nur Eigentümer)

Gruppeneigentümer können die Aktivierung pro Gruppe umschalten:

- `/activation mention`
- `/activation always`

Der Eigentümer wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164 des Bots, falls nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Payloads aus Gruppen setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis des Mention-Gating)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte Teilnehmer macOS-Gruppen optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` gesetzt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem normales Gruppen-Gating erfolgreich war.

Der System-Prompt des Agenten enthält im ersten Turn einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden und keine literalen `\n`-Sequenzen zu tippen.

## iMessage-spezifisch

- Verwenden Sie beim Routing oder in Allowlists bevorzugt `chat_id:<id>`.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-spezifisch

Siehe [Gruppennachrichten](/channels/group-messages) für WhatsApp-spezifisches Verhalten (Verlaufseinspeisung, Details zur Erwähnungsbehandlung).
