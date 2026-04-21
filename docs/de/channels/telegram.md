---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Telegram-Bot-Supportstatus, Funktionen und Konfiguration
title: Telegram
x-i18n:
    generated_at: "2026-04-21T17:45:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 816238b53942b319a300843db62ec1d4bf8d84bc11094010926ac9ad457c6d3d
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: produktionsreif für Bot-DMs + Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Kopplung.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnellstart

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (bestätigen Sie, dass der Handle genau `@BotFather` ist).

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in config/env und starten Sie dann das Gateway.

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
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben config-Werte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig **Privacy Mode**, was einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, gehen Sie wie folgt vor:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadministrator.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot in jeder Gruppe und fügen ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für stets aktive Gruppenfunktionen nützlich ist.

  </Accordion>

  <Accordion title="Nützliche BotFather-Schalter">

    - `/setjoingroups`, um Gruppenhinzufügungen zu erlauben/verbieten
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
    Die Einrichtung fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Einträge in der Allowlist enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie sich zuvor auf Allowlist-Dateien aus dem Pairing-Store verlassen haben, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Abläufe wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit nur einem Besitzer sollten Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (anstatt von früheren Pairing-Genehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung für DM-Kopplung bedeutet nicht „dieser Absender ist überall autorisiert“.
    Kopplung gewährt nur DM-Zugriff. Die Autorisierung von Gruppenabsendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und dann sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Schreiben Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen greifen zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: Jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: fungiert als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn nicht gesetzt, verwendet Telegram `allowFrom` als Fallback.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Setzen Sie keine Telegram-Gruppen- oder Supergruppen-Chat-IDs in `groupAllowFrom`. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Autorisierung von Gruppenabsendern übernimmt **nicht** Genehmigungen aus dem DM-Pairing-Store.
    Kopplung bleibt nur für DMs. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, verwendet Telegram als Fallback `allowFrom` aus der Konfiguration, nicht den Pairing-Store.
    Praktisches Muster für Bots mit nur einem Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` unset und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: beliebiges Mitglied in einer bestimmten Gruppe erlauben:

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

    Beispiel: nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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
      Häufiger Fehler: `groupAllowFrom` ist keine Gruppen-Allowlist für Telegram.

      - Legen Sie negative Telegram-Gruppen- oder Supergruppen-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn Sie möchten, dass jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen kann.
    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann kommen von:

    - einer nativen `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwenden Sie Konfiguration für Persistenz.

    Beispiel für dauerhafte Konfiguration:

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

    Die Gruppen-Chat-ID abrufen:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie die Bot-API `getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram gehört dem Gateway-Prozess.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Channels aus).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen sind nach Gruppen-ID isoliert. Forenthemen hängen `:topic:<threadId>` an, damit Themen isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und behält die Thread-ID für Antworten bei.
- Long Polling verwendet den grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Sink-Parallelität des runners verwendet `agents.defaults.maxConcurrent`.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Lebendigkeit ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihre Bereitstellung weiterhin falsche Neustarts wegen Polling-Stillstand bei lang laufender Arbeit sieht. Der Wert ist in Millisekunden und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API hat keine Unterstützung für Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschau-Nachricht + `editMessageText`
    - Gruppen/Themen: Vorschau-Nachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschau-Nachricht wiederverwenden (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
    - das alte `channels.telegram.streamMode` und boolesche `streaming`-Werte werden automatisch zugeordnet

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt abschließend eine finale In-Place-Bearbeitung aus (keine zweite Nachricht)
    - Gruppe/Thema: OpenClaw behält dieselbe Vorschau-Nachricht bei und führt abschließend eine finale In-Place-Bearbeitung aus (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale finale Zustellung zurück und räumt anschließend die Vorschau-Nachricht auf.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Draft-Transport nicht verfügbar ist oder abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet das Reasoning während der Generierung an die Live-Vorschau
    - die finale Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Eigene Einträge zum Befehlsmenü hinzufügen:

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

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt war; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätekopplungsbefehle (`device-pair` Plugin)

    Wenn das `device-pair` Plugin installiert ist:

    1. `/pair` erzeugt einen Einrichtungscode
    2. fügen Sie den Code in der iOS-App ein
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. genehmigen Sie die Anfrage:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scopes-Prüfungen sind rollenpräfigiert, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Details: [Kopplung](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Bereich für die Inline-Tastatur konfigurieren:

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

    Das alte `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Wählen Sie eine Option:",
  buttons: [
    [
      { text: "Ja", callback_data: "yes" },
      { text: "Nein", callback_data: "no" },
    ],
    [{ text: "Abbrechen", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungsoptionen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeitsendungen verwenden den aktiven Snapshot von config/secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-SecretRef-Neuauflösung pro Sendung aus.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Reply-Threading-Tags">
    Telegram unterstützt explizite Reply-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin beachtet.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Topic-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippen zielen auf den Themen-Thread
    - Topic-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „Allgemeines Thema“ (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur für Topics und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Konfiguration an einen anderen Agenten weiterleiten. Dadurch erhält jedes Topic seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Thema → Haupt-Agent
                "3": { agentId: "zu" },        // Entwicklungsthema → zu-Agent
                "5": { agentId: "coder" }      // Code-Review → coder-Agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Topic hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften:

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

    - `/acp spawn <agent> --thread here|auto` kann das aktuelle Telegram-Topic an eine neue ACP-Sitzung binden.
    - Nachfolgende Topic-Nachrichten werden direkt an die gebundene ACP-Sitzung geleitet (kein `/acp steer` erforderlich).
    - OpenClaw heftet die Spawn-Bestätigungsnachricht nach einer erfolgreichen Bindung im Topic an.
    - Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Vorlagenkontext enthält:

    - `MessageThreadId`
    - `IsForum`

    DM-Thread-Verhalten:

    - Private Chats mit `message_thread_id` behalten DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel/Antwortziele.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten für Audiodateien
    - Tag `[[audio_as_voice]]` in der Agent-Antwort, um das Senden als Sprachnotiz zu erzwingen

    Beispiel für eine Nachrichtenaktion:

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

    Beispiel für eine Nachrichtenaktion:

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

    - statisches WEBP: heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: übersprungen
    - Video-WEBM: übersprungen

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

    Sticker-Sendeaktion:

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
  query: "winkende Katze",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Benachrichtigungen zu Reaktionen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram-Reaktion hinzugefügt: 👍 von Alice (@alice) auf Nachricht 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse respektieren weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktions-Updates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die Sitzung des allgemeinen Gruppenthemas (`:topic:1`) geleitet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthalten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Channel oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Channel-Konfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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
    - `channels.telegram.webhookSecret` setzen (erforderlich, wenn eine Webhook-URL gesetzt ist)
    - optional `channels.telegram.webhookPath` (Standard `/telegram-webhook`)
    - optional `channels.telegram.webhookHost` (Standard `127.0.0.1`)
    - optional `channels.telegram.webhookPort` (Standard `8787`)

    Der lokale Standard-Listener für den Webhook-Modus bindet an `127.0.0.1:8787`.

    Wenn sich Ihr öffentlicher Endpunkt unterscheidet, schalten Sie einen Reverse-Proxy davor und verweisen Sie `webhookUrl` auf die öffentliche URL.
    Setzen Sie `webhookHost` (zum Beispiel `0.0.0.0`), wenn Sie absichtlich externen Ingress benötigen.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor einer Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - `channels.telegram.pollingStallThresholdMs` hat standardmäßig den Wert `120000`; stellen Sie Werte zwischen `30000` und `600000` nur für Fehlalarme bei Neustarts wegen Polling-Stillstand ein.
    - Der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit wie empfangen weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, und sind keine vollständige Redaktionsgrenze für zusätzlichen Kontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

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

    Nur Telegram-Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forenthemen (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--buttons` für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` die Zielfläche erlaubt
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktionssteuerung:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, während reguläre Sendungen aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Approver-DMs und kann Genehmigungsaufforderungen optional im ursprünglichen Chat oder Topic posten.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (optional; fällt, wenn möglich, auf numerische Eigentümer-IDs zurück, die aus `allowFrom` und direktem `defaultTo` abgeleitet werden)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`

    Approver müssen numerische Telegram-Benutzer-IDs sein. Telegram aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Approver aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus der numerischen Eigentümerkonfiguration des Kontos (`allowFrom` und Direktnachrichten-`defaultTo`). Setzen Sie `enabled: false`, um Telegram explizit als nativen Genehmigungs-Client zu deaktivieren. Andernfalls fallen Genehmigungsanfragen auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Exec-Genehmigungen zurück.

    Telegram rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chat-Channels verwendet werden. Der native Telegram-Adapter ergänzt hauptsächlich das Routing von Approver-DMs, die Verteilung auf Channels/Topics und Tipp-Hinweise vor der Zustellung.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis sagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

    Zustellungsregeln:

    - `target: "dm"` sendet Genehmigungsaufforderungen nur an aufgelöste Approver-DMs
    - `target: "channel"` sendet die Aufforderung zurück an den ursprünglichen Telegram-Chat/das ursprüngliche Topic
    - `target: "both"` sendet an Approver-DMs und den ursprünglichen Chat/das ursprüngliche Topic

    Nur aufgelöste Approver können genehmigen oder ablehnen. Nicht-Approver können `/approve` nicht verwenden und auch die Telegram-Genehmigungsschaltflächen nicht nutzen.

    Verhalten bei der Genehmigungsauflösung:

    - Mit `plugin:` präfixierte IDs werden immer über Plugin-Genehmigungen aufgelöst.
    - Andere Genehmigungs-IDs versuchen zuerst `exec.approval.resolve`.
    - Wenn Telegram auch für Plugin-Genehmigungen autorisiert ist und das Gateway sagt,
      dass die Exec-Genehmigung unbekannt/abgelaufen ist, versucht Telegram es einmal erneut über
      `plugin.approval.resolve`.
    - Echte Ablehnungen/Fehler bei Exec-Genehmigungen fallen nicht stillschweigend auf die
      Auflösung von Plugin-Genehmigungen zurück.

    Die Zustellung an Channels zeigt den Befehlstext im Chat an, also aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Topics. Wenn die Aufforderung in einem Forum-Topic landet, behält OpenClaw das Topic sowohl für die Genehmigungsaufforderung als auch für die Nachverfolgung nach der Genehmigung bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen hängen außerdem davon ab, dass `channels.telegram.capabilities.inlineButtons` die Zielfläche (`dm`, `group` oder `all`) erlaubt.

    Verwandte Dokumentation: [Exec-Genehmigungen](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agenten ein Zustellungs- oder Provider-Fehler auftritt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen.        |

Überschreibungen pro Konto, pro Gruppe und pro Topic werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

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
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann den Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht per Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgelistet sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe verifizieren
    - Logs prüfen: `openclaw logs --follow` auf Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Kopplung und/oder numerisches `allowFrom`)
    - die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern deutet in der Regel auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefiniertes Fetch/Proxy können ein sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst in IPv6 auf; fehlerhaftes IPv6-Egress kann zu sporadischen Telegram-API-Fehlern führen.
    - Wenn Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese jetzt als behebbare Netzwerkfehler erneut.
    - Wenn Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Lebendigkeit neu auf.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, Ihr Host aber weiterhin Fehlalarme bei Neustarts wegen Polling-Stillstand meldet. Anhaltende Stillstände weisen normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind bereits standardmäßig
      für Telegram-Mediendownloads erlaubt. Wenn ein vertrauenswürdiges Fake-IP- oder
      transparentes Proxy `api.telegram.org` bei Mediendownloads auf eine andere
      private/interne/spezielle Adresse umschreibt, können Sie sich bewusst
      für die nur Telegram betreffende Umgehung entscheiden:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe bewusste Aktivierung ist auch pro Konto unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn Ihr Proxy Telegram-Media-Hosts in `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den Telegram-
      Medien-SSRF-Schutz. Verwenden Sie dies nur in vertrauenswürdigen, vom Betreiber kontrollierten Proxy-
      Umgebungen wie Clash, Mihomo oder Surge mit Fake-IP-Routing, wenn sie
      private oder spezielle Antworten außerhalb des RFC-2544-Benchmark-
      Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Telegram-Zugriff deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (temporär):
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

Weitere Hilfe: [Channel-Fehlerbehebung](/de/channels/troubleshooting).

## Verweise auf die Telegram-Konfigurationsreferenz

Primäre Referenz:

- `channels.telegram.enabled`: Channel-Start aktivieren/deaktivieren.
- `channels.telegram.botToken`: Bot-Token (BotFather).
- `channels.telegram.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.telegram.allowFrom`: DM-Allowlist (numerische Telegram-Benutzer-IDs). `allowlist` erfordert mindestens eine Absender-ID. `open` erfordert `"*"`. `openclaw doctor --fix` kann alte `@username`-Einträge in IDs auflösen und Allowlist-Einträge aus Pairing-Store-Dateien in Allowlist-Migrationsabläufen wiederherstellen.
- `channels.telegram.actions.poll`: Erstellung von Telegram-Umfragen aktivieren oder deaktivieren (Standard: aktiviert; erfordert weiterhin `sendMessage`).
- `channels.telegram.defaultTo`: Standard-Telegram-Ziel, das vom CLI `--deliver` verwendet wird, wenn kein explizites `--reply-to` angegeben ist.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.telegram.groupAllowFrom`: Gruppenabsender-Allowlist (numerische Telegram-Benutzer-IDs). `openclaw doctor --fix` kann alte `@username`-Einträge in IDs auflösen. Nicht numerische Einträge werden zur Authentifizierungszeit ignoriert. Gruppenauthentifizierung verwendet keinen Fallback auf den DM-Pairing-Store (`2026.2.25+`).
- Multi-Account-Priorität:
  - Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` ein), um Standardrouting explizit zu machen.
  - Wenn keines von beiden gesetzt ist, fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus.
  - `channels.telegram.accounts.default.allowFrom` und `channels.telegram.accounts.default.groupAllowFrom` gelten nur für das `default`-Konto.
  - Benannte Konten erben `channels.telegram.allowFrom` und `channels.telegram.groupAllowFrom`, wenn Werte auf Kontoebene nicht gesetzt sind.
  - Benannte Konten erben nicht `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: Standardwerte pro Gruppe + Allowlist (verwenden Sie `"*"` für globale Standardwerte).
  - `channels.telegram.groups.<id>.groupPolicy`: Überschreibung pro Gruppe für `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: Standard für Mention-Gating.
  - `channels.telegram.groups.<id>.skills`: Skills-Filter (weglassen = alle Skills, leer = keine).
  - `channels.telegram.groups.<id>.allowFrom`: Überschreibung der Absender-Allowlist pro Gruppe.
  - `channels.telegram.groups.<id>.systemPrompt`: zusätzlicher System-Prompt für die Gruppe.
  - `channels.telegram.groups.<id>.enabled`: deaktiviert die Gruppe, wenn `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: Überschreibungen pro Topic (Gruppenfelder + Topic-spezifisches `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: dieses Topic an einen bestimmten Agenten routen (überschreibt Routing auf Gruppenebene und über Bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: Überschreibung pro Topic für `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: Überschreibung des Mention-Gatings pro Topic.
- oberstes `bindings[]` mit `type: "acp"` und kanonischer Topic-ID `chatId:topic:topicId` in `match.peer.id`: Felder für persistente ACP-Topic-Bindung (siehe [ACP Agents](/de/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM-Topics an einen bestimmten Agenten routen (gleiches Verhalten wie bei Forum-Topics).
- `channels.telegram.execApprovals.enabled`: Telegram als chatbasierten Client für Exec-Genehmigungen für dieses Konto aktivieren.
- `channels.telegram.execApprovals.approvers`: Telegram-Benutzer-IDs, die Exec-Anfragen genehmigen oder ablehnen dürfen. Optional, wenn `channels.telegram.allowFrom` oder ein direktes `channels.telegram.defaultTo` den Eigentümer bereits identifiziert.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (Standard: `dm`). `channel` und `both` behalten das ursprüngliche Telegram-Topic bei, wenn vorhanden.
- `channels.telegram.execApprovals.agentFilter`: optionaler Agent-ID-Filter für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.execApprovals.sessionFilter`: optionaler Sitzungsschlüssel-Filter (Teilstring oder Regex) für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.accounts.<account>.execApprovals`: Überschreibung pro Konto für Routing von Telegram-Exec-Genehmigungen und Approver-Autorisierung.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (Standard: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: Überschreibung pro Konto.
- `channels.telegram.commands.nativeSkills`: native Skills-Befehle für Telegram aktivieren/deaktivieren.
- `channels.telegram.replyToMode`: `off | first | all` (Standard: `off`).
- `channels.telegram.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.telegram.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.telegram.linkPreview`: Link-Vorschauen für ausgehende Nachrichten umschalten (Standard: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (Live-Stream-Vorschau; Standard: `partial`; `progress` wird auf `partial` abgebildet; `block` dient der Kompatibilität mit dem alten Vorschaumodus). Die Telegram-Vorschau beim Streaming verwendet eine einzelne Vorschau-Nachricht, die direkt bearbeitet wird.
- `channels.telegram.streaming.preview.toolProgress`: die Live-Vorschau-Nachricht für Tool-/Fortschrittsaktualisierungen wiederverwenden, wenn Vorschau-Streaming aktiv ist (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `channels.telegram.mediaMaxMb`: Telegram-Medienlimit für ein-/ausgehend (MB, Standard: 100).
- `channels.telegram.retry`: Wiederholungsrichtlinie für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern (Versuche, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: Node-`autoSelectFamily` überschreiben (true=aktivieren, false=deaktivieren). Standardmäßig auf Node 22+ aktiviert, bei WSL2 standardmäßig deaktiviert.
- `channels.telegram.network.dnsResultOrder`: DNS-Ergebnisreihenfolge überschreiben (`ipv4first` oder `verbatim`). Standardmäßig `ipv4first` auf Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: gefährliche bewusste Aktivierung für vertrauenswürdige Fake-IP- oder transparente Proxy-Umgebungen, in denen Telegram-Mediendownloads `api.telegram.org` auf private/interne/spezielle Adressen außerhalb der standardmäßigen RFC-2544-Benchmark-Bereich-Freigabe auflösen.
- `channels.telegram.proxy`: Proxy-URL für Bot-API-Aufrufe (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook-Modus aktivieren (erfordert `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: Webhook-Secret (erforderlich, wenn `webhookUrl` gesetzt ist).
- `channels.telegram.webhookPath`: lokaler Webhook-Pfad (Standard `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokaler Webhook-Bind-Host (Standard `127.0.0.1`).
- `channels.telegram.webhookPort`: lokaler Webhook-Bind-Port (Standard `8787`).
- `channels.telegram.actions.reactions`: Telegram-Tool-Reaktionen steuern.
- `channels.telegram.actions.sendMessage`: Telegram-Tool-Nachrichtensendungen steuern.
- `channels.telegram.actions.deleteMessage`: Telegram-Tool-Nachrichtenlöschungen steuern.
- `channels.telegram.actions.sticker`: Telegram-Sticker-Aktionen steuern — senden und suchen (Standard: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — steuern, welche Reaktionen Systemereignisse auslösen (Standard: `own`, wenn nicht gesetzt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — Reaktionsfähigkeit des Agenten steuern (Standard: `minimal`, wenn nicht gesetzt).
- `channels.telegram.errorPolicy`: `reply | silent` — Verhalten bei Fehlerantworten steuern (Standard: `reply`). Überschreibungen pro Konto/Gruppe/Topic werden unterstützt.
- `channels.telegram.errorCooldownMs`: Mindestzeit in ms zwischen Fehlerantworten an denselben Chat (Standard: `60000`). Verhindert Fehler-Spam bei Ausfällen.

- [Konfigurationsreferenz - Telegram](/de/gateway/configuration-reference#telegram)

Telegram-spezifische Felder mit hohem Signalwert:

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, oberstes `bindings[]` (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Channel-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
