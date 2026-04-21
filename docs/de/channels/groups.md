---
read_when:
    - Ändern des Gruppenchat-Verhaltens oder der Erwähnungssteuerung
summary: Gruppenchat-Verhalten über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-21T06:22:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Gruppen

OpenClaw behandelt Gruppenchats oberflächenübergreifend konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in Ihren eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **Sie** in einer Gruppe sind, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern Sie die Erwähnungssteuerung nicht ausdrücklich deaktivieren.

Übersetzt heißt das: Sender auf der Zulassungsliste können OpenClaw durch Erwähnung auslösen.

> Kurzfassung
>
> - **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
> - **Gruppenzugriff** wird durch `*.groupPolicy` + Zulassungslisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - **Antwortauslösung** wird durch Erwähnungssteuerung (`requireMention`, `/activation`) gesteuert.

Kurzer Ablauf (was bei einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsichtigkeit und Zulassungslisten

An der Gruppensicherheit sind zwei unterschiedliche Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Zulassungslisten).
- **Kontextsichtigkeit**: welcher ergänzende Kontext in das Modell eingespeist wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chat-Verhalten und belässt den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Zulassungslisten in erster Linie entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet darstellen.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden bereits senderbasierte Filterung für ergänzenden Kontext in bestimmten Pfaden an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungs-Kontext weiterhin so weiter, wie er empfangen wurde.

Härtungsrichtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten wie empfangen bei.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender in der Zulassungsliste.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Zitat-/Antwort-Ausnahme.

Bis dieses Härtungsmodell über alle Kanäle hinweg konsistent umgesetzt ist, sind Unterschiede je nach Oberfläche zu erwarten.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn Sie Folgendes möchten ...

| Ziel                                         | Was festgelegt werden muss                                |
| -------------------------------------------- | --------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @mentions antworten | `groups: { "*": { requireMention: true } }`               |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                 |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (ohne Schlüssel `"*"`) |
| Nur Sie können in Gruppen auslösen           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden Sitzungsschlüssel im Format `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` an die Gruppen-ID an, sodass jedes Thema seine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Absender, falls konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)

Ja — das funktioniert gut, wenn Ihr „persönlicher“ Verkehr **DMs** und Ihr „öffentlicher“ Verkehr **Gruppen** sind.

Warum: Im Einzelagent-Modus landen DMs typischerweise im **Haupt**-Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt**-Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn Sie Sandboxing mit `mode: "non-main"` aktivieren, laufen diese Gruppensitzungen im konfigurierten Sandbox-Backend, während Ihre Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen.

Dadurch erhalten Sie ein Agenten-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei unterschiedliche Ausführungsarten:

- **DMs**: volle Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools

> Wenn Sie wirklich getrennte Workspaces/Personas benötigen („persönlich“ und „öffentlich“ dürfen sich niemals vermischen), verwenden Sie einen zweiten Agenten + Bindings. Siehe [Multi-Agent Routing](/de/concepts/multi-agent).

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

Sie möchten statt „kein Host-Zugriff“ lieber „Gruppen können nur Ordner X sehen“? Behalten Sie `workspaceAccess: "none"` bei und binden Sie nur Pfade aus der Zulassungsliste in die Sandbox ein:

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

- Konfigurationsschlüssel und Standardwerte: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)
- Debuggen, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Richtlinie    | Verhalten                                                   |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Gruppen umgehen Zulassungslisten; Erwähnungssteuerung gilt weiterhin. |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.             |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die der konfigurierten Zulassungsliste entsprechen. |

Hinweise:

- `groupPolicy` ist von der Erwähnungssteuerung getrennt (die @mentions erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwenden `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Pairing-Freigaben (`*-allowFrom`-Speichereinträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppensendern bleibt explizit an Gruppen-Zulassungslisten gebunden.
- Discord: Die Zulassungsliste verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Zulassungsliste verwendet `channels.slack.channels`.
- Matrix: Die Zulassungsliste verwendet `channels.matrix.groups`. Bevorzugen Sie Raum-IDs oder Aliasse; die Namensauflösung beigetretener Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwenden Sie `channels.matrix.groupAllowFrom`, um Absender einzuschränken; pro Raum werden auch `users`-Zulassungslisten unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram-Zulassungslisten können Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitiv.
- Standard ist `groupPolicy: "allowlist"`; wenn Ihre Gruppen-Zulassungsliste leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), statt `channels.defaults.groupPolicy` zu erben.

Kurzes mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Zulassungslisten (`*.groups`, `*.groupAllowFrom`, kanalspezifische Zulassungsliste)
3. Erwähnungssteuerung (`requireMention`, `/activation`)

## Erwähnungssteuerung (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte liegen pro Subsystem unter `*.groups."*"`.

Das Antworten auf eine Bot-Nachricht zählt als implizite Erwähnung, wenn der Kanal
Antwortmetadaten unterstützt. Das Zitieren einer Bot-Nachricht kann ebenfalls als implizite
Erwähnung zählen auf Kanälen, die Zitatmetadaten bereitstellen. Zu den aktuell eingebauten Fällen
gehören Telegram, WhatsApp, Slack, Discord, Microsoft Teams und ZaloUser.

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

- `mentionPatterns` sind nicht case-sensitive sichere Regex-Muster; ungültige Muster und unsichere geschachtelte Wiederholungsformen werden ignoriert.
- Oberflächen, die explizite Erwähnungen bereitstellen, funktionieren weiterhin; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten sich eine Gruppe teilen).
- Erwähnungssteuerung wird nur erzwungen, wenn Erwähnungserkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standardwerte liegen unter `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Der Kontext des Gruppenverlaufs wird kanalübergreifend einheitlich verpackt und ist **nur für ausstehende** Nachrichten gedacht (Nachrichten, die aufgrund der Erwähnungssteuerung übersprungen wurden); verwenden Sie `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setzen Sie `0`, um dies zu deaktivieren.

## Einschränkungen für Gruppen-/Kanal-Tools (optional)

Einige Kanalkonfigurationen unterstützen Einschränkungen dafür, welche Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals** verfügbar sind.

- `tools`: erlaubt/verweigert Tools für die gesamte Gruppe.
- `toolsBySender`: Überschreibungen pro Absender innerhalb der Gruppe.
  Verwenden Sie explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und Platzhalter `"*"`.
  Alte Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (die spezifischste gewinnt):

1. `toolsBySender`-Treffer der Gruppe/des Kanals
2. `tools` der Gruppe/des Kanals
3. Standard-`toolsBySender`-Treffer (`"*"` )
4. Standard-`tools` (`"*"`)

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

- Einschränkungen für Gruppen-/Kanal-Tools werden zusätzlich zur globalen/agentenspezifischen Tool-Richtlinie angewendet (deny gewinnt weiterhin).
- Einige Kanäle verwenden unterschiedliche Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Zulassungsliste. Verwenden Sie `"*"` , um alle Gruppen zuzulassen und gleichzeitig das Standardverhalten für Erwähnungen festzulegen.

Ein häufiger Irrtum: Die DM-Pairing-Freigabe ist nicht dasselbe wie Gruppenautorisierung.
Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Speicher nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung von Gruppensendern aus Konfigurations-Zulassungslisten wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (Copy/Paste):

1. Alle Gruppenantworten deaktivieren

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Nur bestimmte Gruppen zulassen (WhatsApp)

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

3. Alle Gruppen zulassen, aber Erwähnung verlangen (explizit)

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

Der Eigentümer wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164 des Bots, wenn nicht gesetzt). Senden Sie den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis der Erwähnungssteuerung)
- Telegram-Forenthemen enthalten zusätzlich `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann optional unbenannte macOS-Gruppenteilnehmer aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` befüllt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem das normale Gruppen-Gating erfolgreich passiert wurde.

Der System-Prompt des Agenten enthält im ersten Zug einer neuen Gruppensitzung eine Gruppeneinführung. Sie erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine wörtlichen `\n`-Sequenzen zu tippen.

## iMessage-spezifisches

- Bevorzugen Sie `chat_id:<id>` beim Routing oder bei der Zulassungslisten-Konfiguration.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für nur auf WhatsApp bezogenes Verhalten (Verlaufsinjektion, Details zur Erwähnungsbehandlung).
