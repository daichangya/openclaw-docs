---
read_when:
    - Slack einrichten oder Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Request-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-24T06:28:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

Produktionsreif für DMs und Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP-Request-URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Eine neue Slack-App erstellen">
        Klicken Sie in den Einstellungen der Slack-App auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App
        - fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) unten ein und fahren Sie mit dem Erstellen fort
        - erzeugen Sie ein **App-Level-Token** (`xapp-...`) mit `connections:write`
        - installieren Sie die App und kopieren Sie das angezeigte **Bot-Token** (`xoxb-...`)
      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Umgebungsvariablen-Fallback (nur Standard-Account):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP-Request-URLs">
    <Steps>
      <Step title="Eine neue Slack-App erstellen">
        Klicken Sie in den Einstellungen der Slack-App auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App
        - fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) ein und aktualisieren Sie die URLs vor dem Erstellen
        - speichern Sie das **Signing Secret** für die Anfrageverifizierung
        - installieren Sie die App und kopieren Sie das angezeigte **Bot-Token** (`xoxb-...`)

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Verwenden Sie eindeutige Webhook-Pfade für Multi-Account-HTTP

        Geben Sie jedem Account einen eigenen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren.
        </Note>

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest- und Scope-Checkliste

Das grundlegende Slack-App-Manifest ist für Socket Mode und HTTP-Request-URLs identisch. Nur der Block `settings` (und die `url` des Slash-Befehls) unterscheidet sich.

Basis-Manifest (Socket Mode als Standard):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Für den Modus **HTTP-Request-URLs** ersetzen Sie `settings` durch die HTTP-Variante und fügen `url` zu jedem Slash-Befehl hinzu. Eine öffentliche URL ist erforderlich:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* gleich wie Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Zusätzliche Manifest-Einstellungen

Zeigt verschiedene Funktionen an, die die obigen Standards erweitern.

<AccordionGroup>
  <Accordion title="Optionale native Slash-Befehle">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können anstelle eines einzelnen konfigurierten Befehls mit einigen Besonderheiten verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
    - Es können nicht mehr als 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (Standard)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP-Request-URLs">
        Verwenden Sie dieselbe Liste `slash_commands` wie oben für Socket Mode und fügen Sie zu jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...für jeden Befehl mit demselben Wert für `url` wiederholen
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Scopes für Urheberschaft (Schreiboperationen)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agentenidentität (benutzerdefinierter Benutzername und benutzerdefiniertes Symbol) statt der Standardidentität der Slack-App verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale User-Token-Scopes (Leseoperationen)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie auf Slack-Suchzugriffe angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings
  oder SecretRef-Objekte.
- Konfigurations-Tokens überschreiben das Umgebungsvariablen-Fallback.
- Das Umgebungsvariablen-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für den Standard-Account.
- `userToken` (`xoxp-...`) ist nur per Konfiguration verfügbar (kein Umgebungsvariablen-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten des Status-Snapshots:

- Die Slack-Account-Inspektion verfolgt für jedes Anmeldedatum die Felder
  `*Source` und `*Status` (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass der Account über SecretRef
  oder eine andere nicht-inline Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus wird `signingSecretStatus` einbezogen; im Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesezugriffe kann bei vorhandener Konfiguration das User-Token bevorzugt werden. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur erlaubt, wenn `userTokenReadOnly: false` und kein Bot-Token verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden durch `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Zu den aktuellen Slack-Nachrichtenaktionen gehören `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff (Legacy: `channels.slack.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält; Legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (Standard `true`)
    - `channels.slack.allowFrom` (bevorzugt)
    - `dm.allowFrom` (Legacy)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig `false`)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Priorität bei mehreren Accounts:

    - `channels.slack.accounts.default.allowFrom` gilt nur für den Account `default`.
    - Benannte Accounts übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Accounts übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalbehandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeit-Hinweis: Wenn `channels.slack` vollständig fehlt (nur-Umgebungsvariablen-Setup), greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Auflösung von Namen/IDs:

    - Einträge in der Kanal-Allowlist und DM-Allowlist werden beim Start aufgelöst, wenn der Token-Zugriff dies zulässt
    - nicht aufgelöste Einträge mit Kanalnamen bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - eingehende Autorisierung und Kanal-Routing sind standardmäßig ID-basiert; direktes Matching von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Erwähnungen und Kanalbenutzer">
    Kanalnachrichten sind standardmäßig durch Erwähnungs-Gating geschützt.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Reply-to-Bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerungen pro Kanal (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet)

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs in die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können, falls zutreffend, Thread-Sitzungssuffixe (`:thread:<threadTs>`) erzeugen.
- Der Standardwert von `channels.slack.thread.historyScope` ist `thread`; der Standardwert von `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; auf `0` setzen, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread teilgenommen hat. Andernfalls umgehen Antworten in einem Thread mit Bot-Beteiligung das Gating von `requireMention`.

Steuerungen für Antwort-Threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **jegliches** Antwort-Threading in Slack, einschließlich expliziter Tags vom Typ `[[reply_to_*]]`. Das unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden — Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten inline sichtbar bleiben.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, sonst `"👀"`)

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für den Slack-Account oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Chunkweise Vorschau-Updates anhängen.
- `progress`: Statusfortschrittstext während der Generierung anzeigen und dann den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfs-Vorschau aktiv ist, werden Tool-/Fortschritts-Updates in dieselbe bearbeitete Vorschau-Nachricht geroutet (Standard: `true`). Setzen Sie auf `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` auf `partial` steht (Standard: `true`).

- Für natives Text-Streaming und den Slack-Assistant-Thread-Status muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal- und Gruppenchats auf oberster Ebene können weiterhin die normale Entwurfs-Vorschau verwenden, wenn natives Streaming nicht verfügbar ist.
- Slack-DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, daher zeigen sie keine Thread-artige Vorschau; verwenden Sie Thread-Antworten oder `typingReaction`, wenn dort sichtbarer Fortschritt gewünscht ist.
- Medien und Nicht-Text-Payloads fallen auf normale Zustellung zurück.
- Endgültige Medien-/Fehlerantworten brechen ausstehende Vorschau-Bearbeitungen ab; geeignete endgültige Text-/Blockantworten werden nur ausgegeben, wenn sie die Vorschau an Ort und Stelle bearbeiten können.
- Wenn Streaming mitten in der Antwort fehlschlägt, fällt OpenClaw für die verbleibenden Payloads auf normale Zustellung zurück.

Verwenden Sie die Entwurfs-Vorschau anstelle von nativem Slack-Text-Streaming:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Legacy-Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch zu `channels.slack.streaming.mode` migriert.
- boolesches `channels.slack.streaming` wird automatisch zu `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport` migriert.
- Legacy-`channels.slack.nativeStreaming` wird automatisch zu `channels.slack.streaming.nativeTransport` migriert.

## Fallback für Tippreaktionen

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf abgeschlossen ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig einen Statusindikator vom Typ „is typing...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird automatisch versucht, nachdem die Antwort oder der Fehlerpfad abgeschlossen ist.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privaten, bei Slack gehosteten URLs heruntergeladen (anfrageauthentifizierter Token-Flow) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und Größenlimits dies zulassen.

    Die Laufzeitgrenze für eingehende Größen ist standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert eine absatzorientierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) einschließen
    - das Limit für ausgehende Medien folgt bei Konfiguration `channels.slack.mediaMaxMb`; andernfalls verwenden Kanalsendungen die MIME-Arten-Standards aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Benutzerziele über die Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um Befehlsstandards zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Befehle ist für Slack **deaktiviert**, sodass `commands.native: "auto"` native Slack-Befehle nicht aktiviert.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Absenden eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6–100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
- bei überschrittenen Slack-Limits: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und routen Befehlsausführungen weiterhin über `CommandTargetSessionKey` an die Ziel-Konversationssitzung.

## Interaktive Antworten

Slack kann vom Agenten verfasste interaktive Antwort-Steuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.

Global aktivieren:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oder nur für einen Slack-Account aktivieren:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Wenn aktiviert, können Agenten Slack-spezifische Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den bestehenden Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die Rückrufwerte für Interaktionen sind von OpenClaw generierte opake Tokens, keine unveränderten agentenseitig verfassten Werte.
- Wenn generierte interaktive Blöcke die Slack-Block-Kit-Limits überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen fungieren, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe native Slack-Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die ID-Art der Genehmigung `plugin:` ist.
- Die Autorisierung der Genehmigenden wird weiterhin erzwungen: Nur als Genehmigende identifizierte Benutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block-Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; greift wenn möglich auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` ist und sich mindestens ein
Genehmigender auflösen lässt. Setzen Sie `enabled: false`, um Slack explizit als nativen Genehmigungsclient zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn sich Genehmigende auflösen lassen.

Standardverhalten ohne explizite Slack-Konfiguration für Exec-Genehmigungen:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmigende überschreiben, Filter hinzufügen oder
sich für die Zustellung im Ursprungschat entscheiden möchten:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Gemeinsam genutzte Weiterleitung über `approvals.exec` ist davon getrennt. Verwenden Sie sie nur, wenn Aufforderungen für Exec-Genehmigungen zusätzlich
an andere Chats oder explizite Ziele außerhalb des Bands weitergeleitet werden müssen. Gemeinsam genutzte Weiterleitung über `approvals.plugin` ist ebenfalls
getrennt; native Slack-Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

`/approve` im selben Chat funktioniert ebenfalls in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec approvals](/de/tools/exec-approvals) für das vollständige Modell der Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Bearbeitungen/Löschungen von Nachrichten und Thread-Broadcasts werden in Systemereignisse abgebildet.
- Hinzufügen/Entfernen von Reaktionen wird in Systemereignisse abgebildet.
- Beitritt/Austritt von Mitgliedern, Erstellen/Umbenennen von Kanälen und Hinzufügen/Entfernen von Pins werden in Systemereignisse abgebildet.
- `channel_id_changed` kann Konfigurationsschlüssel für Kanäle migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Der Starter eines Threads und die anfängliche Einspeisung des Thread-Verlaufskontexts werden, falls zutreffend, anhand konfigurierter Sender-Allowlists gefiltert.
- Block-Aktionen und modale Interaktionen erzeugen strukturierte Systemereignisse vom Typ `Slack interaction: ...` mit umfangreichen Payload-Feldern:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und Metadaten `workflow_*`
  - Modale Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsumschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, sofern nicht nötig)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`)
    - `requireMention`
    - kanalbezogene Allowlist `users`

    Nützliche Befehle:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-Nachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oder Legacy `channels.slack.dm.policy`)
    - Pairing-Genehmigungen / Allowlist-Einträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode stellt keine Verbindung her">
    Validieren Sie Bot- und App-Token sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist der Slack-Account
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef
    gestützten Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Request-URLs (Events + Interactivity + Slash Commands)
    - eindeutigen `webhookPath` pro HTTP-Account

    Wenn `signingSecretStatus: "configured_unavailable"` in Account-Snapshots
    erscheint, ist der HTTP-Account konfiguriert, aber die aktuelle Laufzeit konnte
    das durch SecretRef gestützte Signing Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, was beabsichtigt war:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Einen Slack-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Kanälen und Gruppen-DMs.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten routen.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Konfigurationslayout und Priorität.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
