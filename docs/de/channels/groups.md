---
read_when:
    - Ändern des Verhaltens in Gruppenchats oder des Mention-Gatings
summary: Verhalten in Gruppenchats über Oberflächen hinweg (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruppen
x-i18n:
    generated_at: "2026-04-07T06:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83d20f2958ed6ad3354f0078553b3c6a38643ea8ef38573c40e89ebef2fa8421
    source_path: channels/groups.md
    workflow: 15
---

# Gruppen

OpenClaw behandelt Gruppenchats über Oberflächen hinweg konsistent: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Einführung für Einsteiger (2 Minuten)

OpenClaw „lebt“ in deinen eigenen Messaging-Konten. Es gibt keinen separaten WhatsApp-Bot-Benutzer.
Wenn **du** in einer Gruppe bist, kann OpenClaw diese Gruppe sehen und dort antworten.

Standardverhalten:

- Gruppen sind eingeschränkt (`groupPolicy: "allowlist"`).
- Antworten erfordern eine Erwähnung, sofern du das Mention-Gating nicht ausdrücklich deaktivierst.

Übersetzung: Sender auf der Zulassungsliste können OpenClaw auslösen, indem sie es erwähnen.

> Kurzfassung
>
> - **DM-Zugriff** wird durch `*.allowFrom` gesteuert.
> - **Gruppenzugriff** wird durch `*.groupPolicy` + Zulassungslisten (`*.groups`, `*.groupAllowFrom`) gesteuert.
> - **Auslösen von Antworten** wird durch Mention-Gating (`requireMention`, `/activation`) gesteuert.

Kurzer Ablauf (was mit einer Gruppennachricht passiert):

```
groupPolicy? disabled -> verwerfen
groupPolicy? allowlist -> Gruppe erlaubt? nein -> verwerfen
requireMention? ja -> erwähnt? nein -> nur für Kontext speichern
ansonsten -> antworten
```

## Kontextsichtigkeit und Zulassungslisten

An der Sicherheit von Gruppen sind zwei verschiedene Steuerungen beteiligt:

- **Auslöseautorisierung**: wer den Agenten auslösen kann (`groupPolicy`, `groups`, `groupAllowFrom`, kanalspezifische Zulassungslisten).
- **Kontextsichtigkeit**: welcher ergänzende Kontext in das Modell eingefügt wird (Antworttext, Zitate, Thread-Verlauf, weitergeleitete Metadaten).

Standardmäßig priorisiert OpenClaw normales Chatverhalten und belässt den Kontext weitgehend so, wie er empfangen wurde. Das bedeutet, dass Zulassungslisten in erster Linie entscheiden, wer Aktionen auslösen kann, und keine universelle Schwärzungsgrenze für jedes zitierte oder historische Snippet sind.

Das aktuelle Verhalten ist kanalspezifisch:

- Einige Kanäle wenden bereits in bestimmten Pfaden senderbasierte Filterung für ergänzenden Kontext an (zum Beispiel Slack-Thread-Seeding, Matrix-Antwort-/Thread-Lookups).
- Andere Kanäle reichen Zitat-/Antwort-/Weiterleitungs-Kontext weiterhin so durch, wie er empfangen wurde.

Richtung für Härtung (geplant):

- `contextVisibility: "all"` (Standard) behält das aktuelle Verhalten wie empfangen bei.
- `contextVisibility: "allowlist"` filtert ergänzenden Kontext auf Sender der Zulassungsliste.
- `contextVisibility: "allowlist_quote"` ist `allowlist` plus eine explizite Ausnahme für ein Zitat/eine Antwort.

Bis dieses Härtungsmodell kanalübergreifend konsistent implementiert ist, musst du je nach Oberfläche mit Unterschieden rechnen.

![Ablauf von Gruppennachrichten](/images/groups-flow.svg)

Wenn du Folgendes willst ...

| Ziel                                         | Was zu setzen ist                                         |
| -------------------------------------------- | --------------------------------------------------------- |
| Alle Gruppen zulassen, aber nur auf @mentions antworten | `groups: { "*": { requireMention: true } }`               |
| Alle Gruppenantworten deaktivieren           | `groupPolicy: "disabled"`                                 |
| Nur bestimmte Gruppen                        | `groups: { "<group-id>": { ... } }` (ohne `"*"`-Schlüssel) |
| Nur du kannst in Gruppen auslösen            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Sitzungsschlüssel

- Gruppensitzungen verwenden `agent:<agentId>:<channel>:group:<id>`-Sitzungsschlüssel (Räume/Kanäle verwenden `agent:<agentId>:<channel>:channel:<id>`).
- Telegram-Forenthemen fügen `:topic:<threadId>` zur Gruppen-ID hinzu, sodass jedes Thema eine eigene Sitzung hat.
- Direktchats verwenden die Hauptsitzung (oder pro Sender, wenn konfiguriert).
- Heartbeats werden für Gruppensitzungen übersprungen.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Muster: persönliche DMs + öffentliche Gruppen (ein einzelner Agent)

Ja — das funktioniert gut, wenn dein „persönlicher“ Verkehr **DMs** sind und dein „öffentlicher“ Verkehr **Gruppen**.

Warum: Im Einzelagent-Modus landen DMs typischerweise im **Haupt-**Sitzungsschlüssel (`agent:main:main`), während Gruppen immer **Nicht-Haupt-**Sitzungsschlüssel verwenden (`agent:main:<channel>:group:<id>`). Wenn du Sandboxing mit `mode: "non-main"` aktivierst, laufen diese Gruppensitzungen in Docker, während deine Haupt-DM-Sitzung auf dem Host bleibt.

Das gibt dir ein Agent-„Gehirn“ (gemeinsamer Workspace + gemeinsamer Speicher), aber zwei Ausführungsmodi:

- **DMs**: vollständige Tools (Host)
- **Gruppen**: Sandbox + eingeschränkte Tools (Docker)

> Wenn du wirklich getrennte Workspaces/Personas brauchst („persönlich“ und „öffentlich“ dürfen sich niemals mischen), verwende einen zweiten Agenten + Bindings. Siehe [Multi-Agent Routing](/de/concepts/multi-agent).

Beispiel (DMs auf dem Host, Gruppen sandboxed + nur Messaging-Tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // Gruppen/Kanäle sind nicht-main -> sandboxed
        scope: "session", // stärkste Isolierung (ein Container pro Gruppe/Kanal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Wenn allow nicht leer ist, wird alles andere blockiert (deny hat weiterhin Vorrang).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Willst du statt „Gruppen können nur Ordner X sehen“ lieber „kein Host-Zugriff“? Behalte `workspaceAccess: "none"` bei und mounte nur Pfade aus der Zulassungsliste in die Sandbox:

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
- Debugging, warum ein Tool blockiert ist: [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated)
- Details zu Bind-Mounts: [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts)

## Anzeigebezeichnungen

- UI-Bezeichnungen verwenden `displayName`, wenn verfügbar, formatiert als `<channel>:<token>`.
- `#room` ist für Räume/Kanäle reserviert; Gruppenchats verwenden `g-<slug>` (kleingeschrieben, Leerzeichen -> `-`, `#@+._-` beibehalten).

## Gruppenrichtlinie

Steuere, wie Gruppen-/Raumnachrichten pro Kanal verarbeitet werden:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numerische Telegram-Benutzer-ID (Wizard kann @username auflösen)
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
| `"open"`      | Gruppen umgehen Zulassungslisten; Mention-Gating gilt weiterhin. |
| `"disabled"`  | Alle Gruppennachrichten vollständig blockieren.              |
| `"allowlist"` | Nur Gruppen/Räume zulassen, die der konfigurierten Zulassungsliste entsprechen. |

Hinweise:

- `groupPolicy` ist getrennt vom Mention-Gating (das @mentions erfordert).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: verwende `groupAllowFrom` (Fallback: explizites `allowFrom`).
- DM-Pairing-Genehmigungen (`*-allowFrom`-Store-Einträge) gelten nur für DM-Zugriff; die Autorisierung von Gruppensendern bleibt explizit an Gruppen-Zulassungslisten gebunden.
- Discord: Die Zulassungsliste verwendet `channels.discord.guilds.<id>.channels`.
- Slack: Die Zulassungsliste verwendet `channels.slack.channels`.
- Matrix: Die Zulassungsliste verwendet `channels.matrix.groups`. Bevorzuge Raum-IDs oder Aliase; die Namensauflösung beigetretener Räume erfolgt nach bestem Bemühen, und nicht aufgelöste Namen werden zur Laufzeit ignoriert. Verwende `channels.matrix.groupAllowFrom`, um Sender einzuschränken; pro Raum werden auch `users`-Zulassungslisten unterstützt.
- Gruppen-DMs werden separat gesteuert (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Die Telegram-Zulassungsliste kann Benutzer-IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) oder Benutzernamen (`"@alice"` oder `"alice"`) abgleichen; Präfixe sind nicht case-sensitiv.
- Standard ist `groupPolicy: "allowlist"`; wenn deine Gruppen-Zulassungsliste leer ist, werden Gruppennachrichten blockiert.
- Laufzeitsicherheit: Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie auf einen Fail-Closed-Modus zurück (typischerweise `allowlist`), anstatt `channels.defaults.groupPolicy` zu erben.

Schnelles mentales Modell (Auswertungsreihenfolge für Gruppennachrichten):

1. `groupPolicy` (open/disabled/allowlist)
2. Gruppen-Zulassungslisten (`*.groups`, `*.groupAllowFrom`, kanalspezifische Zulassungsliste)
3. Mention-Gating (`requireMention`, `/activation`)

## Mention-Gating (Standard)

Gruppennachrichten erfordern eine Erwähnung, sofern dies nicht pro Gruppe überschrieben wird. Standardwerte liegen pro Subsystem unter `*.groups."*"`.

Auf eine Bot-Nachricht zu antworten zählt als implizite Erwähnung (wenn der Kanal Antwortmetadaten unterstützt). Das gilt für Telegram, WhatsApp, Slack, Discord und Microsoft Teams.

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

- `mentionPatterns` sind nicht case-sensitive, sichere Regex-Muster; ungültige Muster und unsichere verschachtelte Wiederholungsformen werden ignoriert.
- Oberflächen, die explizite Erwähnungen bereitstellen, werden weiterhin durchgelassen; Muster sind ein Fallback.
- Überschreibung pro Agent: `agents.list[].groupChat.mentionPatterns` (nützlich, wenn mehrere Agenten eine Gruppe teilen).
- Mention-Gating wird nur erzwungen, wenn Mention-Erkennung möglich ist (native Erwähnungen oder konfigurierte `mentionPatterns`).
- Discord-Standardwerte liegen in `channels.discord.guilds."*"` (pro Guild/Kanal überschreibbar).
- Gruppenverlaufs-Kontext wird kanalübergreifend einheitlich umschlossen und ist **nur ausstehend** (Nachrichten, die wegen Mention-Gating übersprungen wurden); verwende `messages.groupChat.historyLimit` für den globalen Standard und `channels.<channel>.historyLimit` (oder `channels.<channel>.accounts.*.historyLimit`) für Überschreibungen. Setze `0`, um es zu deaktivieren.

## Tool-Einschränkungen für Gruppen/Kanäle (optional)

Einige Kanalkonfigurationen unterstützen das Einschränken der verfügbaren Tools **innerhalb einer bestimmten Gruppe/eines bestimmten Raums/Kanals**.

- `tools`: Tools für die gesamte Gruppe zulassen/verbieten.
- `toolsBySender`: Überschreibungen pro Sender innerhalb der Gruppe.
  Verwende explizite Schlüsselpräfixe:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` und den Wildcard-Wert `"*"`.
  Legacy-Schlüssel ohne Präfix werden weiterhin akzeptiert und nur als `id:` abgeglichen.

Auflösungsreihenfolge (am spezifischsten gewinnt):

1. Treffer in `toolsBySender` der Gruppe/des Kanals
2. `tools` der Gruppe/des Kanals
3. Standardtreffer (`"*"` ) in `toolsBySender`
4. Standard `tools` (`"*"`)

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

- Tool-Einschränkungen für Gruppen/Kanäle werden zusätzlich zur globalen/agentenbezogenen Tool-Richtlinie angewendet (deny hat weiterhin Vorrang).
- Einige Kanäle verwenden andere Verschachtelungen für Räume/Kanäle (z. B. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Gruppen-Zulassungslisten

Wenn `channels.whatsapp.groups`, `channels.telegram.groups` oder `channels.imessage.groups` konfiguriert ist, fungieren die Schlüssel als Gruppen-Zulassungsliste. Verwende `"*"` , um alle Gruppen zuzulassen und gleichzeitig das Standardverhalten für Erwähnungen festzulegen.

Häufiges Missverständnis: DM-Pairing-Genehmigung ist nicht dasselbe wie Gruppenautorisierung.
Bei Kanälen, die DM-Pairing unterstützen, schaltet der Pairing-Store nur DMs frei. Gruppenbefehle erfordern weiterhin eine explizite Autorisierung von Gruppensendern aus Konfigurations-Zulassungslisten wie `groupAllowFrom` oder dem dokumentierten Konfigurations-Fallback für diesen Kanal.

Häufige Absichten (zum Kopieren/Einfügen):

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

Der Eigentümer wird durch `channels.whatsapp.allowFrom` bestimmt (oder durch die eigene E.164 des Bots, wenn nicht gesetzt). Sende den Befehl als eigenständige Nachricht. Andere Oberflächen ignorieren `/activation` derzeit.

## Kontextfelder

Eingehende Gruppen-Payloads setzen:

- `ChatType=group`
- `GroupSubject` (falls bekannt)
- `GroupMembers` (falls bekannt)
- `WasMentioned` (Ergebnis des Mention-Gatings)
- Telegram-Forenthemen enthalten außerdem `MessageThreadId` und `IsForum`.

Kanalspezifische Hinweise:

- BlueBubbles kann unbenannte macOS-Gruppenteilnehmer optional aus der lokalen Kontakte-Datenbank anreichern, bevor `GroupMembers` gefüllt wird. Dies ist standardmäßig deaktiviert und läuft nur, nachdem das normale Gruppen-Gating erfolgreich durchlaufen wurde.

Der System-Prompt des Agenten enthält im ersten Zug einer neuen Gruppensitzung eine Gruppeneinführung. Er erinnert das Modell daran, wie ein Mensch zu antworten, Markdown-Tabellen zu vermeiden, leere Zeilen zu minimieren, normale Chat-Abstände einzuhalten und keine wörtlichen `\n`-Sequenzen zu tippen.

## iMessage-spezifisches

- Bevorzuge `chat_id:<id>` beim Routing oder beim Zulassen.
- Chats auflisten: `imsg chats --limit 20`.
- Gruppenantworten gehen immer an dieselbe `chat_id` zurück.

## WhatsApp-spezifisches

Siehe [Gruppennachrichten](/de/channels/group-messages) für rein WhatsApp-spezifisches Verhalten (Verlaufseinfügung, Details zur Erwähnungsbehandlung).
