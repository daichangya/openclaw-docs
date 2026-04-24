---
read_when:
    - Verhalten von Gruppenchats oder Erwähnungs-Gating ändern
summary: Verhalten von Gruppenchats über verschiedene Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-24T06:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw behandelt Gruppenchats über verschiedene Oberflächen hinweg konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ auf Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, es sei denn, Sie deaktivieren das Erwähnungs-Gating ausdrücklich.

Übersetzung: Sender auf der Allowlist können OpenClaw durch Erwähnung auslösen.

> Kurz gesagt
>
> - **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
> - **Gruppenzugriff** wird durch `*.groupPolicy` + Allowlists (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - **Antwortauslösung** wird durch Erwähnungs-Gating (`requireMention`, `/activation`) gesteuert.

Schneller Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsicherheit und Allowlists

Bei der Gruppensicherheit sind zwei unterschiedliche Steuerungen beteiligt:

- **Trigger-Autorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Allowlists).
- **Kontextsicherheit**: welcher ergänzende Kontext in das Modell eingebunden wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chat-Verhalten und belässt den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Allowlists in erster Linie entscheiden, wer Aktionen auslösen kann, und keine universelle Grenze zur Schwärzung jedes zitierten oder historischen Snippets darstellen.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden bereits in bestimmten Pfaden absenderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungskontext weiterhin so weiter, wie er empfangen wurde.

Richtung der Härtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten „wie empfangen“ bei.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender der Allowlist.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Ausnahme für Zitate/Antworten.

Bis dieses Härtungsmodell über alle Kanäle hinweg konsistent implementiert ist, sind Unterschiede je nach Oberfläche zu erwarten.

![Ablauf bei Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie möchten ...

| Ziel                                         | Was Sie festlegen sollten                                 |
| -------------------------------------------- | --------------------------------------------------------- |
| Alle Gruppen erlauben, aber nur auf @Erwähnungen antworten | `groups: { "*": { requireMention: true } }`               |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                 |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (kein `"*"`-Schlüssel) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## SessionKeys

- Gruppensitzungen verwenden SessionKeys vom Typ `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Datenverkehr **DMs** und Ihr „öffentlicher“ Datenverkehr **Gruppen** sind.

Warum: Im Einzelagentenmodus landen DMs typischerweise im **Haupt**-SessionKey (`agent:main:main`), während Gruppen immer **nicht-Haupt**-SessionKeys (`agent:main:<channel>:group:<id>`) verwenden. Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre DM-Hauptsitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei Ausführungshaltungen:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

> Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent Routing](/de/concepts/multi-agent).

Beispiel (DMs auf dem Host, Gruppen in der Sandbox + nur Messaging-Tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // Gruppen/Kanäle sind non-main -> in Sandbox
        scope: "session", // stärkste Isolierung (ein Container pro Gruppe/Kanal)
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

Sie möchten „Gruppen können nur Ordner X sehen“ statt „kein Host-Zugriff“? Behalten Sie `workspaceAccess: "none"` bei und binden Sie nur Pfade aus der Allowlist in die Sandbox ein:

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

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigenamen

- UI-Bezeichnungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
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
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (der Assistent kann @username auflösen)
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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Richtlinie   | Verhalten                                                    |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Gruppen umgehen Allowlists; Erwähnungs-Gating gilt weiterhin. |
| `"disabled"` | Blockiert alle Gruppennachrichten vollständig.               |
| `"allowlist"` | Erlaubt nur Gruppen/Räume, die der konfigurierten Allowlist entsprechen. |

Hinweise:

- `groupPolicy` ist getrennt vom Erwähnungs-Gating (das @Erwähnungen erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Kopplungsgenehmigungen (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppensendern bleibt explizit an Gruppen-Allowlists gebunden.
- Discord: Die Allowlist verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Allowlist verwendet `channels.slack.channels`.
- Matrix: Die Allowlist verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namensauflösung für beigetretene Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Sender einzuschränken; Allowlists pro Raum mit `users` werden ebenfalls unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Die Telegram-Allowlist kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitiv.
- Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Allowlist leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

Schnelles mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Allowlists (`*.groups`, `*.groupAllowFrom`, kanalspezifische Allowlist)
3. Erwähnungs-Gating (`requireMention`, `/activation`)

## Erwähnungs-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte befinden sich pro Subsystem unter `*.groups."*"`.

Eine Antwort auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal
Antwortmetadaten unterstützt. Das Zitieren einer Bot-Nachricht kann ebenfalls als implizite
Erwähnung zählen auf Kanälen, die Zitatmetadaten bereitstellen. Zu den aktuellen integrierten Fällen gehören
Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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

- `mentionPatterns` sind sichere, nicht case-sensitive Regex-Muster; ungültige Muster und unsichere verschachtelte Wiederholungsformen werden ignoriert.
- Oberflächen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten sich eine Gruppe teilen).
- Erwähnungs-Gating wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standardwerte befinden sich in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Der Kontext des Gruppenverlaufs wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die wegen Erwähnungs-Gating übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken der innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals verfügbaren Tools.

- `tools`: erlaubte/verweigerte Tools für die gesamte Gruppe.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe.
  Verwenden Sie explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und das Wildcard-Zeichen `"*"`.
  Ältere Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (am spezifischsten gewinnt):

1. Treffer in `toolsBySender` der Gruppe/des Kanals
2. `tools` der Gruppe/des Kanals
3. Treffer in `toolsBySender` des Standardwerts (`"*"` )
4. `tools` des Standardwerts (`"*"`)

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
- Einige Kanäle verwenden eine andere Verschachtelung für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Gruppen-Allowlists

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Allowlist. Verwenden Sie `"*"` , um alle Gruppen zu erlauben und gleichzeitig das Standardverhalten für Erwähnungen festzulegen.

Häufiges Missverständnis: Die DM-Kopplungsgenehmigung ist nicht dasselbe wie Gruppenautorisierung.
Für Kanäle, die DM-Kopplung unterstützen, schaltet der Kopplungsspeicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung von Gruppensendern über Konfigurations-Allowlists wie `groupAllowFrom` oder den dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (Copy-and-paste):

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

Der Eigentümer wird über `channels.whatsapp.allowFrom` bestimmt (oder über die eigene E.164 des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis des Erwähnungs-Gating)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann optional unbenannte macOS-Gruppenteilnehmer aus der lokalen Kontaktdatenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und wird erst ausgeführt, nachdem das normale Gruppen-Gating erfolgreich war.

Der System-Prompt des Agenten enthält beim ersten Turnus einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine literalen `\n`-Sequenzen zu tippen. Kanalbezogene Gruppennamen und Teilnehmerbezeichnungen werden als eingefasste nicht vertrauenswürdige Metadaten und nicht als eingebettete Systemanweisungen dargestellt.

## iMessage-Besonderheiten

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei Allowlists.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-System-Prompts

Siehe [WhatsApp](/de/channels/whatsapp#system-prompts) für die maßgeblichen Regeln für WhatsApp-System-Prompts, einschließlich Auflösung von Gruppen- und Direkt-Prompts, Wildcard-Verhalten und Semantik von Account-Überschreibungen.

## WhatsApp-Besonderheiten

Siehe [Gruppennachrichten](/de/channels/group-messages) für WhatsApp-spezifisches Verhalten (Verlaufseinbindung, Details zur Erwähnungsbehandlung).

## Verwandt

- [Gruppennachrichten](/de/channels/group-messages)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kanalrouting](/de/channels/channel-routing)
- [Kopplung](/de/channels/pairing)
