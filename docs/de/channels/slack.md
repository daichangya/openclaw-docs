---
read_when:
    - Slack einrichten oder Fehler bei Slack Socket/HTTP-Modus beheben
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Request-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-07T06:14:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b8fd2cc6c638ee82069f0af2c2b6f6f49c87da709b941433a0343724a9907ea
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: produktionsreif für DMs + Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP-Request-URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Kopplungsmodus.
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
      <Step title="Neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und dann einen Workspace für Ihre App aus
        - fügen Sie das [Beispielmanifest](#manifest-and-scope-checklist) unten ein und fahren Sie mit der Erstellung fort
        - erstellen Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)
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

        Env-Fallback (nur Standardkonto):

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
      <Step title="Neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und dann einen Workspace für Ihre App aus
        - fügen Sie das [Beispielmanifest](#manifest-and-scope-checklist) ein und aktualisieren Sie vor dem Erstellen die URLs
        - speichern Sie das **Signing Secret** zur Anfrageverifizierung
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

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
        Verwenden Sie eindeutige Webhook-Pfade für HTTP mit mehreren Konten

        Geben Sie jedem Konto einen eigenen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren.
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

<Tabs>
  <Tab title="Socket Mode (Standard)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
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

  </Tab>

  <Tab title="HTTP-Request-URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Optionale Urheberschafts-Scopes (Schreibvorgänge)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agenten (benutzerdefinierter Nutzername und Symbol) statt der Standardidentität der Slack-App verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.
  </Accordion>
  <Accordion title="Optionale User-Token-Scopes (Lesevorgänge)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lesescopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie auf Slack-Suchlesevorgänge angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Konfigurationstoken überschreiben das Env-Fallback.
- Das Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur in der Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten der Statusaufnahme:

- Die Slack-Kontoinspektion verfolgt pro Anmeldedaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht inline angegebene Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann das User-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur zulässig, wenn `userTokenReadOnly: false` gesetzt ist und kein Bot-Token verfügbar ist.
</Tip>

## Aktionen und Einschränkungen

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Die aktuellen Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff (veraltet: `channels.slack.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält; veraltet: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (standardmäßig true)
    - `channels.slack.allowFrom` (bevorzugt)
    - `dm.allowFrom` (veraltet)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Vorrang bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Die Kopplung in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalbehandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Auflösung von Namen/IDs:

    - Einträge in Kanal-Allowlists und DM-Allowlists werden beim Start aufgelöst, wenn der Tokenzugriff dies erlaubt
    - nicht aufgelöste Einträge mit Kanalnamen bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - eingehende Autorisierung und Kanalrouting sind standardmäßig ID-orientiert; direktes Matching von Nutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Erwähnungen und Kanalnutzer">
    Kanalnachrichten sind standardmäßig durch Erwähnungen eingeschränkt.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwortverhalten in Bot-Threads (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerung pro Kanal (`channels.slack.channels.<id>`; Namen nur über Auflösung beim Start oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (veraltete Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs in der Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können bei Bedarf Thread-Sitzungssuffixe (`:thread:<threadTs>`) erstellen.
- Der Standardwert von `channels.slack.thread.historyScope` ist `thread`; der Standardwert von `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; setzen Sie `0`, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot in Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread beteiligt war. Ohne diese Einstellung umgehen Antworten in einem Thread mit Bot-Beteiligung die Einschränkung `requireMention`.

Steuerung für Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- veraltetes Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **jegliches** Antwort-Threading in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags auch im Modus `"off"` weiterhin berücksichtigt werden. Der Unterschied spiegelt die Threading-Modelle der Plattformen wider: Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten im Hauptchatverlauf sichtbar bleiben.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf Agentenidentitäts-Emoji (`agents.list[].identity.emoji`, andernfalls "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Livevorschau:

- `off`: Livevorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Chunkweise Vorschauaktualisierungen anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und dann den endgültigen Text senden.

`channels.slack.nativeStreaming` steuert das native Text-Streaming von Slack, wenn `streaming` auf `partial` steht (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming angezeigt wird. Die Thread-Auswahl folgt weiterhin `replyToMode`. Ohne Thread wird die normale Entwurfsvorschau verwendet.
- Medien und Nicht-Text-Payloads greifen auf die normale Zustellung zurück.
- Wenn das Streaming mitten in der Antwort fehlschlägt, greift OpenClaw für verbleibende Payloads auf die normale Zustellung zurück.

Verwenden Sie die Entwurfsvorschau anstelle des nativen Slack-Text-Streamings:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Veraltete Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch zu `channels.slack.streaming` migriert.
- boolesches `channels.slack.streaming` wird automatisch zu `channels.slack.nativeStreaming` migriert.

## Fallback für Tippreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie wieder, wenn der Lauf abgeschlossen ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig einen Statusindikator "is typing..." verwenden.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird nach Abschluss der Antwort oder des Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von von Slack gehosteten privaten URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und Größenbeschränkungen dies zulassen.

    Die Standardobergrenze für eingehende Laufzeitgrößen ist `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert eine absatzorientierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) einschließen
    - die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen die Standardwerte nach MIME-Art aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Nutzerziele über die Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

- Der Auto-Modus für native Befehle ist für Slack **deaktiviert** (`commands.native: "auto"` aktiviert keine nativen Slack-Befehle).
- Aktivieren Sie native Slack-Befehlshandler mit `channels.slack.commands.native: true` (oder global `commands.native: true`).
- Wenn native Befehle aktiviert sind, registrieren Sie passende Slash-Befehle in Slack (`/<command>`-Namen), mit einer Ausnahme:
  - registrieren Sie `/agentstatus` für den Statusbefehl (Slack reserviert `/status`)
- Wenn native Befehle nicht aktiviert sind, können Sie einen einzelnen konfigurierten Slash-Befehl über `channels.slack.slashCommand` ausführen.
- Native Argumentmenüs passen ihre Renderstrategie nun an:
  - bis zu 5 Optionen: Button-Blöcke
  - 6-100 Optionen: statisches Auswahlmenü
  - mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
  - wenn codierte Optionswerte die Slack-Limits überschreiten, fällt der Ablauf auf Buttons zurück
- Für lange Options-Payloads verwenden Slash-Befehlsargumentmenüs einen Bestätigungsdialog, bevor ein ausgewählter Wert gesendet wird.

Standard-Slash-Befehlseinstellungen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Slash-Sitzungen verwenden isolierte Schlüssel:

- `agent:<agentId>:slack:slash:<userId>`

und führen die Befehlsausführung weiterhin gegen die Sitzung der Zielkonversation aus (`CommandTargetSessionKey`).

## Interaktive Antworten

Slack kann vom Agenten verfasste interaktive Antwortsteuerungen rendern, aber diese Funktion ist standardmäßig deaktiviert.

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

Oder nur für ein Slack-Konto aktivieren:

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

Wenn aktiviert, können Agenten nur für Slack bestimmte Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den vorhandenen Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist eine Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw erzeugte undurchsichtige Token, keine unverarbeiteten vom Agenten verfassten Werte.
- Wenn generierte interaktive Blöcke die Grenzen von Slack Block Kit überschreiten würden, greift OpenClaw auf die ursprüngliche Textantwort zurück, anstatt eine ungültige Blocks-Payload zu senden.

## Exec-Freigaben in Slack

Slack kann als nativer Freigabeclient mit interaktiven Buttons und Interaktionen fungieren, anstatt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Freigaben verwenden `channels.slack.execApprovals.*` für natives DM-/Kanalrouting.
- Plugin-Freigaben können weiterhin über dieselbe native Slack-Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Freigabe-ID-Art `plugin:` ist.
- Die Autorisierung von Freigebenden wird weiterhin erzwungen: Nur als Freigebende identifizierte Nutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsam genutzte Oberfläche für Freigabebuttons wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Freigabeaufforderungen direkt als Block-Kit-Buttons in der Unterhaltung gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Freigaben; OpenClaw
sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Toolergebnis angibt, dass Chat-
Freigaben nicht verfügbar sind oder die manuelle Freigabe der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und sich mindestens ein
Freigebender auflösen lässt. Setzen Sie `enabled: false`, um Slack ausdrücklich als nativen Freigabeclient zu deaktivieren.
Setzen Sie `enabled: true`, um native Freigaben zu erzwingen, wenn sich Freigebende auflösen lassen.

Standardverhalten ohne explizite Slack-Exec-Freigabekonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Freigebende überschreiben, Filter hinzufügen oder
die Zustellung im Ursprungschat aktivieren möchten:

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

Die gemeinsame Weiterleitung `approvals.exec` ist separat. Verwenden Sie sie nur, wenn Exec-Freigabeaufforderungen zusätzlich
an andere Chats oder explizite Ziele außerhalb des Bandes weitergeleitet werden müssen. Die gemeinsame Weiterleitung `approvals.plugin` ist ebenfalls
separat; native Slack-Buttons können Plugin-Freigaben weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

`/approve` im selben Chat funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec approvals](/de/tools/exec-approvals) für das vollständige Weiterleitungsmodell für Freigaben.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen/Thread-Broadcasts werden in Systemereignisse abgebildet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden in Systemereignisse abgebildet.
- Ereignisse zum Beitreten/Verlassen von Mitgliedern, zum Erstellen/Umbenennen von Kanälen sowie zum Hinzufügen/Entfernen von Pins werden in Systemereignisse abgebildet.
- `channel_id_changed` kann Kanal-Konfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanalthemen/-zwecke gelten als nicht vertrauenswürdiger Kontext und können in den Routing-Kontext eingefügt werden.
- Der Starter des Threads und das anfängliche Einspeisen des Thread-Verlaufs in den Kontext werden bei Bedarf durch konfigurierte Absender-Allowlists gefiltert.
- Block-Aktionen und modale Interaktionen erzeugen strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Payload-Feldern:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - modale Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - Slack](/de/gateway/configuration-reference#slack)

  Wichtige Slack-Felder:
  - Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (veraltet: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (nur im Notfall; deaktiviert lassen, sofern nicht erforderlich)
  - Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`)
    - `requireMention`
    - `users`-Allowlist pro Kanal

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
    - `channels.slack.dmPolicy` (oder veraltet `channels.slack.dm.policy`)
    - Kopplungsfreigaben / Allowlist-Einträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet sich nicht">
    Prüfen Sie Bot- und App-Token sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Prüfen Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Request-URLs (Events + Interaktivität + Slash-Befehle)
    - eindeutigen `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Aufnahmen erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das
    durch SecretRef gestützte Signing Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, ob beabsichtigt war:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Nutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalrouting](/de/channels/channel-routing)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Konfiguration](/de/gateway/configuration)
- [Slash-Befehle](/de/tools/slash-commands)
