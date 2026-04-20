---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-04-20T06:30:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: produktionsbereit für Bot-DMs und -Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnellstart

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (stellen Sie sicher, dass der Handle exakt `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Anweisungen und speichern Sie das Token.

  </Step>

  <Step title="Token und DM-Richtlinie konfigurieren">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env-Fallback: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Umgebung und starten Sie dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kopplungscodes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Fügen Sie den Bot Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Auflösung von Tokens ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf der Telegram-Seite

<AccordionGroup>
  <Accordion title="Privatsphäre-Modus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privatsphäre-Modus**, der einschränkt, welche Gruppennachrichten sie erhalten.

    Wenn der Bot alle Gruppennachrichten sehen muss, dann entweder:

    - deaktivieren Sie den Privatsphäre-Modus über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadministrator.

    Wenn Sie den Privatsphäre-Modus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Einstellungen der Telegram-Gruppe gesteuert.

    Admin-Bots erhalten alle Gruppennachrichten, was für ein stets aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenbeitritte zu erlauben/zu verweigern
    - `/setprivacy` für das Sichtbarkeitsverhalten in Gruppen

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Das Setup fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Einträge in der Allowlist enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien im Kopplungsspeicher verlassen haben, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Abläufe wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit nur einem Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (anstatt von früheren Kopplungsgenehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung der DM-Kopplung bedeutet nicht: „Dieser Absender ist überall autorisiert“.
    Kopplung gewährt nur DM-Zugriff. Die Autorisierung von Gruppenabsendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich nach einmaliger Autorisierung sowohl DMs als auch Gruppenbefehle verwenden kann“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Bot eines Drittanbieters):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Methode eines Drittanbieters (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Falls nicht gesetzt, greift Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Gruppenabsender-Authentifizierung erbt **nicht** die Genehmigungen aus dem DM-Kopplungsspeicher.
    Kopplung bleibt nur für DMs. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, greift Telegram auf das konfigurierte `allowFrom` zurück, nicht auf den Kopplungsspeicher.
    Praktisches Muster für Bots mit nur einem Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, sofern `channels.defaults.groupPolicy` nicht explizit gesetzt ist.

    Beispiel: Beliebiges Mitglied in genau einer bestimmten Gruppe erlauben:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Häufiger Fehler: `groupAllowFrom` ist keine Telegram-Gruppen-Allowlist.

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn Sie möchten, dass jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen kann.
    </Warning>

  </Tab>

  <Tab title="Mention-Verhalten">
    Gruppenantworten erfordern standardmäßig eine Mention.

    Eine Mention kann kommen von:

    - einer nativen `@botusername`-Mention, oder
    - Mention-Mustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwenden Sie die Konfiguration für Persistenz.

    Beispiel für persistente Konfiguration:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    So erhalten Sie die Gruppen-Chat-ID:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie `getUpdates` der Bot API

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen wieder an Telegram zurück (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in den gemeinsamen Kanalumschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forenthemen hängen `:topic:<threadId>` an, um Themen isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw leitet sie mit threadbewussten Sitzungsschlüsseln weiter und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Sink-Konkurrenz des Runners verwendet `agents.defaults.maxConcurrent`.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschaunachricht + `editMessageText`
    - Gruppen/Themen: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - ältere Werte für `channels.telegram.streamMode` und boolesche `streaming`-Werte werden automatisch zugeordnet

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschaunachricht und führt abschließend eine Bearbeitung an Ort und Stelle durch (keine zweite Nachricht)
    - Gruppe/Thema: OpenClaw behält dieselbe Vorschaunachricht und führt abschließend eine Bearbeitung an Ort und Stelle durch (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale abschließende Zustellung zurück und bereinigt danach die Vorschaunachricht.

    Vorschau-Streaming ist von Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Entwurfstransport nicht verfügbar ist oder abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur für Telegram verfügbarer Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes HTML des Modells wird maskiert, um Parse-Fehler bei Telegram zu verringern.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge für das Befehlsmenü hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, kleinschreiben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Setup-Fehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt ist; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätekopplungsbefehle (`device-pair` Plugin)

    Wenn das `device-pair` Plugin installiert ist:

    1. `/pair` erzeugt einen Setup-Code
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für eine explizite Genehmigung
       - `/pair approve`, wenn nur eine ausstehende Anfrage vorhanden ist
       - `/pair approve latest` für die neueste

    Der Setup-Code enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scopes-Prüfungen sind rollenpräfigiert, daher erfüllt diese Operator-Allowlist nur Operator-Anfragen; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/Public Key), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Inline-Tastaturbereich konfigurieren:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Überschreibung pro Konto:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Bereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Veraltetes `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agenten weitergegeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen bieten ergonomische Aliasse (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungsoptionen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten Umschalter unter `channels.telegram.actions.*`.
    Laufzeit-Sendungen verwenden den aktiven Konfigurations-/Secrets-Snapshot (Start/Neuladen), daher führen Aktionspfade keine ad-hoc-SecretRef-Neuauflösung pro Sendung durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Antwort-Threading-Tags">
    Telegram unterstützt explizite Antwort-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Sitzungsschlüssel für Themen hängen `:topic:<threadId>` an
    - Antworten und Tippaktionen zielen auf den Themen-Thread
    - Themen-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Themenvererbung: Themeneinträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` gilt nur für Themen und wird nicht von Gruppenstandards geerbt.

    **Agentenrouting pro Thema**: Jedes Thema kann durch Setzen von `agentId` in der Themenkonfiguration an einen anderen Agenten weiterleiten. Dadurch erhält jedes Thema seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema → Haupt-Agent
                "3": { agentId: "zu" },        // Dev-Thema → zu-Agent
                "5": { agentId: "coder" }      // Code-Review → coder-Agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Thema hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Themenbindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften:

    - `bindings[]` mit `type: "acp"` und `match.channel: "telegram"`

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
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dies ist derzeit auf Forenthemen in Gruppen und Supergruppen beschränkt.

    **Thread-gebundener ACP-Spawn aus dem Chat**:

    - `/acp spawn <agent> --thread here|auto` kann das aktuelle Telegram-Thema an eine neue ACP-Sitzung binden.
    - Nachfolgende Themennachrichten werden direkt an die gebundene ACP-Sitzung weitergeleitet (kein `/acp steer` erforderlich).
    - OpenClaw pinnt die Bestätigungsnachricht für den Spawn im Thema nach einer erfolgreichen Bindung an.
    - Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Vorlagenkontext enthält:

    - `MessageThreadId`
    - `IsForum`

    Verhalten von DM-Threads:

    - private Chats mit `message_thread_id` behalten das DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel/Antwortziele.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnachrichten und Audiodateien.

    - Standard: Verhalten für Audiodateien
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnachricht zu erzwingen

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Videonachrichten

    Telegram unterscheidet zwischen Videodateien und Videonotizen.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Videonotizen unterstützen keine Beschriftungen; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: wird heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: wird übersprungen
    - Video-WEBM: wird übersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Cache-Datei:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker werden einmal beschrieben (wenn möglich) und zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

    Sticker-Aktionen aktivieren:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Sticker-Aktion senden:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Zwischengespeicherte Sticker durchsuchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet Benutzerreaktionen nur auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse berücksichtigen weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktions-Updates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung weitergeleitet
      - Forum-Gruppen werden an die allgemeine Themensitzung der Gruppe (`:topic:1`) weitergeleitet, nicht an das exakt auslösende Thema

    `allowed_updates` für Polling/Webhook enthalten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge an der Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Von Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationsereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
    - `/config set` und `/config unset` (erfordert aktivierte Befehle)

    Deaktivieren:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long Polling vs. Webhook">
    Standard: Long Polling.

    Webhook-Modus:

    - `channels.telegram.webhookUrl` setzen
    - `channels.telegram.webhookSecret` setzen (erforderlich, wenn die Webhook-URL gesetzt ist)
    - optional `channels.telegram.webhookPath` (Standard `/telegram-webhook`)
    - optional `channels.telegram.webhookHost` (Standard `127.0.0.1`)
    - optional `channels.telegram.webhookPort` (Standard `8787`)

    Der standardmäßige lokale Listener für den Webhook-Modus bindet an `127.0.0.1:8787`.

    Wenn sich Ihr öffentlicher Endpunkt unterscheidet, setzen Sie einen Reverse Proxy davor und richten Sie `webhookUrl` auf die öffentliche URL.
    Setzen Sie `webhookHost` (zum Beispiel `0.0.0.0`), wenn Sie absichtlich externen Ingress benötigen.

  </Accordion>

  <Accordion title="Limits, Wiederholungsversuche und CLI-Ziele">
    - Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor einer Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - Der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit so weitergegeben, wie er empfangen wurde.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Grenze zur Redigierung von Zusatzkontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Umfragen verwenden `openclaw message poll` und unterstützen Forenthemen:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur für Telegram verfügbare Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forenthemen (oder ein `:topic:`-Ziel verwenden)

    Telegram-Senden unterstützt außerdem:

    - `--buttons` für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Zieloberfläche erlaubt
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Fotos oder Uploads animierter Medien zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, lässt aber reguläre Sendungen aktiviert

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Approver-DMs und kann optional Genehmigungsaufforderungen im ursprünglichen Chat oder Thema posten.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (optional; greift nach Möglichkeit auf numerische Besitzer-IDs zurück, die aus `allowFrom` und direktem `defaultTo` abgeleitet werden)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`

    Approver müssen numerische Telegram-Benutzer-IDs sein. Telegram aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Approver aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus der numerischen Besitzerkonfiguration des Kontos (`allowFrom` und Direktnachrichten-`defaultTo`). Setzen Sie `enabled: false`, um Telegram explizit als nativen Genehmigungsclient zu deaktivieren. Genehmigungsanfragen greifen andernfalls auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Exec-Genehmigungen zurück.

    Telegram rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Telegram-Adapter ergänzt hauptsächlich das Routing von Approver-DMs, Fanout für Kanal/Thema und Tipp-Hinweise vor der Zustellung.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur einschließen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

    Zustellregeln:

    - `target: "dm"` sendet Genehmigungsaufforderungen nur an aufgelöste Approver-DMs
    - `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Telegram-Chat bzw. das Thema
    - `target: "both"` sendet an Approver-DMs und an den ursprünglichen Chat bzw. das Thema

    Nur aufgelöste Approver können genehmigen oder ablehnen. Nicht-Approver können `/approve` nicht verwenden und auch keine Telegram-Genehmigungsschaltflächen nutzen.

    Verhalten bei der Genehmigungsauflösung:

    - Mit `plugin:` präfixierte IDs werden immer über Plugin-Genehmigungen aufgelöst.
    - Andere Genehmigungs-IDs versuchen zuerst `exec.approval.resolve`.
    - Wenn Telegram auch für Plugin-Genehmigungen autorisiert ist und das Gateway sagt,
      dass die Exec-Genehmigung unbekannt/abgelaufen ist, versucht Telegram es einmal erneut über
      `plugin.approval.resolve`.
    - Echte Ablehnungen/Fehler bei Exec-Genehmigungen fallen nicht stillschweigend auf die
      Auflösung von Plugin-Genehmigungen zurück.

    Die Zustellung im Kanal zeigt den Befehlstext im Chat an, daher sollten Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Themen aktivieren. Wenn die Aufforderung in einem Forenthema landet, bewahrt OpenClaw das Thema sowohl für die Genehmigungsaufforderung als auch für die Nachverfolgung nach der Genehmigung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen hängen außerdem davon ab, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche erlaubt (`dm`, `group` oder `all`).

    Zugehörige Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                   |
| ----------------------------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen. |

Überschreibungen pro Konto, pro Gruppe und pro Thema werden unterstützt (gleiche Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // Fehler in dieser Gruppe unterdrücken
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Mention">

    - Wenn `requireMention=false`, muss der Privatsphäre-Modus von Telegram volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - danach Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Mention erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` vorhanden ist, muss die Gruppe aufgelistet sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe überprüfen
    - Protokolle prüfen: `openclaw logs --follow` auf Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - Ihre Absenderidentität autorisieren (Kopplung und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist normalerweise auf Probleme mit der DNS-/HTTPS-Erreichbarkeit von `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefiniertes Fetch/Proxy können ein sofortiges Abort-Verhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Egress kann zu sporadischen Telegram-API-Fehlern führen.
    - Wenn die Protokolle `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, wiederholt OpenClaw diese jetzt als behebbare Netzwerkfehler.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten arbeitet, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind bereits standardmäßig
      für Telegram-Mediendownloads erlaubt. Wenn ein vertrauenswürdiges Fake-IP- oder
      transparentes Proxy `api.telegram.org` während Mediendownloads auf eine andere
      private/interne/Sonderzweck-Adresse umschreibt, können Sie den nur für Telegram
      verfügbaren Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dasselbe Opt-in ist auch pro Konto verfügbar unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Wenn Ihr Proxy Telegram-Medienhosts in `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den Telegram-
      Medien-SSRF-Schutz. Verwenden Sie es nur für vertrauenswürdige, vom Betreiber
      kontrollierte Proxy-Umgebungen wie Clash, Mihomo oder Surge mit Fake-IP-Routing,
      wenn diese private oder Sonderzweck-Antworten außerhalb des RFC-2544-Benchmarkbereichs
      synthetisieren. Lassen Sie es für normalen Telegram-Zugriff über das öffentliche Internet deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (vorübergehend):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten validieren:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Verweise zur Telegram-Konfigurationsreferenz

Primäre Referenz:

- `channels.telegram.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.telegram.botToken`: Bot-Token (BotFather).
- `channels.telegram.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.telegram.allowFrom`: DM-Allowlist (numerische Telegram-Benutzer-IDs). `allowlist` erfordert mindestens eine Absender-ID. `open` erfordert `"*"`. `openclaw doctor --fix` kann ältere `@username`-Einträge zu IDs auflösen und kann Allowlist-Einträge aus Dateien des Kopplungsspeichers in Allowlist-Migrationsabläufen wiederherstellen.
- `channels.telegram.actions.poll`: Erstellung von Telegram-Umfragen aktivieren oder deaktivieren (standardmäßig aktiviert; erfordert weiterhin `sendMessage`).
- `channels.telegram.defaultTo`: Standard-Telegram-Ziel, das vom CLI-Flag `--deliver` verwendet wird, wenn kein explizites `--reply-to` angegeben ist.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.telegram.groupAllowFrom`: Gruppen-Absender-Allowlist (numerische Telegram-Benutzer-IDs). `openclaw doctor --fix` kann ältere `@username`-Einträge zu IDs auflösen. Nicht numerische Einträge werden zur Authentifizierungszeit ignoriert. Gruppenauthentifizierung verwendet keinen DM-Kopplungsspeicher-Fallback (`2026.2.25+`).
- Vorrang bei mehreren Konten:
  - Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder schließen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen.
  - Wenn keines von beiden gesetzt ist, greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` warnt.
  - `channels.telegram.accounts.default.allowFrom` und `channels.telegram.accounts.default.groupAllowFrom` gelten nur für das Konto `default`.
  - Benannte Konten erben `channels.telegram.allowFrom` und `channels.telegram.groupAllowFrom`, wenn Werte auf Kontoebene nicht gesetzt sind.
  - Benannte Konten erben nicht `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: Standardwerte pro Gruppe + Allowlist (`"*"` für globale Standardwerte verwenden).
  - `channels.telegram.groups.<id>.groupPolicy`: Überschreibung pro Gruppe für `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: Standard für Mention-Gating.
  - `channels.telegram.groups.<id>.skills`: Skills-Filter (weglassen = alle Skills, leer = keine).
  - `channels.telegram.groups.<id>.allowFrom`: Überschreibung der Absender-Allowlist pro Gruppe.
  - `channels.telegram.groups.<id>.systemPrompt`: zusätzlicher System-Prompt für die Gruppe.
  - `channels.telegram.groups.<id>.enabled`: deaktiviert die Gruppe, wenn `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: Überschreibungen pro Thema (Gruppenfelder + themaexklusives `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: Dieses Thema an einen bestimmten Agenten weiterleiten (überschreibt Routing auf Gruppenebene und über Bindungen).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: Überschreibung pro Thema für `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: Überschreibung des Mention-Gatings pro Thema.
- `bindings[]` auf oberster Ebene mit `type: "acp"` und kanonischer Themen-ID `chatId:topic:topicId` in `match.peer.id`: Felder für persistente ACP-Themenbindung (siehe [ACP Agents](/de/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM-Themen an einen bestimmten Agenten weiterleiten (gleiches Verhalten wie bei Forenthemen).
- `channels.telegram.execApprovals.enabled`: Telegram als chatbasierten Exec-Genehmigungsclient für dieses Konto aktivieren.
- `channels.telegram.execApprovals.approvers`: Telegram-Benutzer-IDs, die Exec-Anfragen genehmigen oder ablehnen dürfen. Optional, wenn `channels.telegram.allowFrom` oder ein direktes `channels.telegram.defaultTo` den Besitzer bereits identifiziert.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (Standard: `dm`). `channel` und `both` bewahren das ursprüngliche Telegram-Thema, falls vorhanden.
- `channels.telegram.execApprovals.agentFilter`: optionaler Agent-ID-Filter für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.execApprovals.sessionFilter`: optionaler Sitzungsschlüssel-Filter (Teilzeichenfolge oder Regex) für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.accounts.<account>.execApprovals`: Überschreibung pro Konto für Telegram-Exec-Genehmigungsrouting und Approver-Autorisierung.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (Standard: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: Überschreibung pro Konto.
- `channels.telegram.commands.nativeSkills`: Telegram-native Skills-Befehle aktivieren/deaktivieren.
- `channels.telegram.replyToMode`: `off | first | all` (Standard: `off`).
- `channels.telegram.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.telegram.chunkMode`: `length` (Standard) oder `newline`, um vor dem Aufteilen nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.telegram.linkPreview`: Link-Vorschauen für ausgehende Nachrichten umschalten (Standard: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (Live-Stream-Vorschau; Standard: `partial`; `progress` wird auf `partial` abgebildet; `block` ist Kompatibilität für den älteren Vorschau-Modus). Telegram-Vorschau-Streaming verwendet eine einzelne Vorschaunachricht, die an Ort und Stelle bearbeitet wird.
- `channels.telegram.mediaMaxMb`: Begrenzung für eingehende/ausgehende Telegram-Medien (MB, Standard: 100).
- `channels.telegram.retry`: Retry-Richtlinie für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern (Versuche, `minDelayMs`, `maxDelayMs`, Jitter).
- `channels.telegram.network.autoSelectFamily`: Node-`autoSelectFamily` überschreiben (true=aktivieren, false=deaktivieren). Standardmäßig auf Node 22+ aktiviert, unter WSL2 standardmäßig deaktiviert.
- `channels.telegram.network.dnsResultOrder`: DNS-Ergebnisreihenfolge überschreiben (`ipv4first` oder `verbatim`). Standardmäßig `ipv4first` auf Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: gefährliches Opt-in für vertrauenswürdige Fake-IP- oder transparente Proxy-Umgebungen, in denen Telegram-Mediendownloads `api.telegram.org` zu privaten/internen/Sonderzweck-Adressen außerhalb der standardmäßigen RFC-2544-Benchmarkbereich-Erlaubnis auflösen.
- `channels.telegram.proxy`: Proxy-URL für Bot-API-Aufrufe (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook-Modus aktivieren (erfordert `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: Webhook-Secret (erforderlich, wenn `webhookUrl` gesetzt ist).
- `channels.telegram.webhookPath`: lokaler Webhook-Pfad (Standard `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokaler Bind-Host für Webhooks (Standard `127.0.0.1`).
- `channels.telegram.webhookPort`: lokaler Bind-Port für Webhooks (Standard `8787`).
- `channels.telegram.actions.reactions`: Telegram-Tool-Reaktionen steuern.
- `channels.telegram.actions.sendMessage`: Telegram-Tool-Nachrichtensendungen steuern.
- `channels.telegram.actions.deleteMessage`: Telegram-Tool-Nachrichtenlöschungen steuern.
- `channels.telegram.actions.sticker`: Telegram-Sticker-Aktionen steuern — senden und suchen (Standard: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — steuert, welche Reaktionen Systemereignisse auslösen (Standard: `own`, wenn nicht gesetzt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — steuert die Reaktionsfähigkeit des Agenten (Standard: `minimal`, wenn nicht gesetzt).
- `channels.telegram.errorPolicy`: `reply | silent` — steuert das Verhalten bei Fehlerantworten (Standard: `reply`). Überschreibungen pro Konto/Gruppe/Thema werden unterstützt.
- `channels.telegram.errorCooldownMs`: minimale Zeit in ms zwischen Fehlerantworten an denselben Chat (Standard: `60000`). Verhindert Fehler-Spam während Ausfällen.

- [Konfigurationsreferenz - Telegram](/de/gateway/configuration-reference#telegram)

Telegram-spezifische Felder mit hohem Signalwert:

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
