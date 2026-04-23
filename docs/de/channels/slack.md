---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Anfrage-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-23T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: produktionsreif für DMs + Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP-Anfrage-URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - Wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - Fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) unten ein und fahren Sie mit dem Erstellen fort
        - Erzeugen Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
        - Installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)
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

  <Tab title="HTTP-Anfrage-URLs">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - Wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - Fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) ein und aktualisieren Sie die URLs vor dem Erstellen
        - Speichern Sie das **Signing Secret** für die Anfrageverifizierung
        - Installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

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

        Geben Sie jedem Konto einen eigenen `webhookPath` (Standard: `/slack/events`), damit Registrierungen nicht kollidieren.
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
    "description": "Slack-Konnektor für OpenClaw"
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
        "description": "Eine Nachricht an OpenClaw senden",
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

  <Tab title="HTTP-Anfrage-URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Konnektor für OpenClaw"
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
        "description": "Eine Nachricht an OpenClaw senden",
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

### Zusätzliche Manifest-Einstellungen

Stellen Sie verschiedene Funktionen bereit, die die obigen Standardwerte erweitern.

<AccordionGroup>
  <Accordion title="Optionale native Slash commands">

    Mehrere [native Slash commands](#commands-and-slash-behavior) können mit gewissen Besonderheiten anstelle eines einzelnen konfigurierten Befehls verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
    - Es können nicht mehr als 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (Standard)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Eine neue Sitzung starten",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Die aktuelle Sitzung zurücksetzen"
      },
      {
        "command": "/compact",
        "description": "Den Sitzungskontext komprimieren",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Den aktuellen Lauf stoppen"
      },
      {
        "command": "/session",
        "description": "Ablauf der Thread-Bindung verwalten",
        "usage_hint": "idle <duration|off> oder max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Das Denk-Level festlegen",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Ausführliche Ausgabe umschalten",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Den Fast-Modus anzeigen oder festlegen",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Die Sichtbarkeit der Begründung umschalten",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Den Elevated-Modus umschalten",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Exec-Standards anzeigen oder festlegen",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Das Modell anzeigen oder festlegen",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Provider/Modelle auflisten oder ein Modell hinzufügen",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Die kurze Hilfezusammenfassung anzeigen"
      },
      {
        "command": "/commands",
        "description": "Den generierten Befehlskatalog anzeigen"
      },
      {
        "command": "/tools",
        "description": "Anzeigen, was der aktuelle Agent gerade verwenden kann",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Den Laufzeitstatus anzeigen, einschließlich Provider-Nutzung/Kontingent, wenn verfügbar"
      },
      {
        "command": "/tasks",
        "description": "Aktive/kürzlich ausgeführte Hintergrundaufgaben für die aktuelle Sitzung auflisten"
      },
      {
        "command": "/context",
        "description": "Erläutern, wie der Kontext zusammengestellt wird",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Ihre Absenderidentität anzeigen"
      },
      {
        "command": "/skill",
        "description": "Eine Skill anhand ihres Namens ausführen",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Die Nutzungsfußzeile steuern oder die Kostenzusammenfassung anzeigen",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP-Anfrage-URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Eine neue Sitzung starten",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Die aktuelle Sitzung zurücksetzen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Den Sitzungskontext komprimieren",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Den aktuellen Lauf stoppen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Ablauf der Thread-Bindung verwalten",
        "usage_hint": "idle <duration|off> oder max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Das Denk-Level festlegen",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Ausführliche Ausgabe umschalten",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Den Fast-Modus anzeigen oder festlegen",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Die Sichtbarkeit der Begründung umschalten",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Den Elevated-Modus umschalten",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Exec-Standards anzeigen oder festlegen",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Das Modell anzeigen oder festlegen",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Provider oder Modelle für einen Provider auflisten",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Die kurze Hilfezusammenfassung anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Den generierten Befehlskatalog anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Anzeigen, was der aktuelle Agent gerade verwenden kann",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Den Laufzeitstatus anzeigen, einschließlich Provider-Nutzung/Kontingent, wenn verfügbar",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Aktive/kürzlich ausgeführte Hintergrundaufgaben für die aktuelle Sitzung auflisten",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Erläutern, wie der Kontext zusammengestellt wird",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Ihre Absenderidentität anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Eine Skill anhand ihres Namens ausführen",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Die Nutzungsfußzeile steuern oder die Kostenzusammenfassung anzeigen",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Authoring-Scopes (Schreibvorgänge)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agentenidentität (benutzerdefinierter Benutzername und Symbol) statt der standardmäßigen Slack-App-Identität verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale User-Token-Scopes (Lesevorgänge)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Such-Lesezugriffen abhängig sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Konfigurations-Token überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur per Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten der Statusaufnahme:

- Die Slack-Kontoinspektion verfolgt pro Anmeldedaten die Felder `*Source` und `*Status` (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef oder eine andere nicht-inline Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus wird `signingSecretStatus` einbezogen; im Socket Mode ist das erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesezugriffe kann das User-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur erlaubt, wenn `userTokenReadOnly: false` und kein Bot-Token verfügbar ist.
</Tip>

## Aktionen und Sperren

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff (alt: `channels.slack.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält; alt: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (Standard: true)
    - `channels.slack.allowFrom` (bevorzugt)
    - `dm.allowFrom` (alt)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Zulassungsliste)

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalbehandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Zulassungsliste befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Einträge in Kanal-Zulassungslisten und DM-Zulassungslisten werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - Nicht aufgelöste Kanalnamen-Einträge bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - Eingehende Autorisierung und Kanal-Routing sind standardmäßig ID-first; direkter Abgleich von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Erwähnungen und Kanalnutzer">
    Kanalnachrichten verwenden standardmäßig Erwähnungs-Gating.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-auf-Bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerung pro Kanal (`channels.slack.channels.<id>`; Namen nur über Auflösung beim Start oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Zulassungsliste)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (ältere Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet)

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standardwert `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können bei Bedarf Thread-Sitzungssuffixe (`:thread:<threadTs>`) erzeugen.
- Der Standardwert für `channels.slack.thread.historyScope` ist `thread`; der Standardwert für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung beginnt (Standard `20`; zum Deaktivieren auf `0` setzen).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot in Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread teilgenommen hat. Andernfalls umgehen Antworten in einem Thread, an dem der Bot beteiligt ist, die Sperre `requireMention`.

Steuerung für Antwort-Threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- alter Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **sämtliches** Antwort-Threading in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags auch im Modus `"off"` weiterhin berücksichtigt werden. Der Unterschied spiegelt die Threading-Modelle der Plattformen wider: Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten im Haupt-Chatverlauf sichtbar bleiben.

Fokussierte Slack-Thread-Antworten werden über ihre gebundene ACP-Sitzung geleitet, wenn eine vorhanden ist, statt die Antwort gegen die Standard-Agent-Shell vorzubereiten. So bleiben Bindungen von `/focus` und `/acp spawn ... --bind here` für Folgemeldungen im Thread erhalten.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste partielle Ausgabe ersetzen.
- `block`: Chunk-basierte Vorschauaktualisierungen anhängen.
- `progress`: Während der Generierung einen Fortschrittsstatus anzeigen und danach den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschau-Nachricht leiten (Standard: `true`). Auf `false` setzen, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` auf `partial` gesetzt ist (Standard: `true`).

- Für natives Text-Streaming und die Slack-Assistant-Thread-Statusanzeige muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal- und Gruppenchat-Wurzeln können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist.
- Oberste Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie keine Vorschau im Thread-Stil an; verwenden Sie Thread-Antworten oder `typingReaction`, wenn dort sichtbarer Fortschritt gewünscht ist.
- Medien und Nicht-Text-Payloads fallen auf normale Zustellung zurück.
- Finale Medien-/Fehlerantworten verwerfen ausstehende Vorschau-Bearbeitungen, ohne einen temporären Entwurf auszugeben; geeignete Text-/Block-Endantworten werden nur ausgegeben, wenn sie die Vorschau direkt bearbeiten können.
- Wenn das Streaming mitten in einer Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf normale Zustellung zurück.
- Slack-Connect-Kanäle, die einen Stream ablehnen, bevor das SDK seinen lokalen Puffer ausgibt, fallen auf normale Slack-Antworten zurück, damit kurze Antworten nicht stillschweigend verworfen oder als zugestellt gemeldet werden, bevor Slack sie bestätigt.

Verwenden Sie die Entwurfsvorschau anstelle von nativem Slack-Text-Streaming:

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

Veraltete Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch nach `channels.slack.streaming.mode` migriert.
- Das boolesche `channels.slack.streaming` wird automatisch nach `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport` migriert.
- Das veraltete `channels.slack.nativeStreaming` wird automatisch nach `channels.slack.streaming.nativeTransport` migriert.

## Fallback für Schreibreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht temporär eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf beendet ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig einen Statusindikator vom Typ „schreibt …“ verwenden.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird automatisch versucht, nachdem die Antwort oder der Fehlerpfad abgeschlossen ist.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privat gehosteten Slack-URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und in den Medienspeicher geschrieben, wenn das Abrufen erfolgreich ist und Größenlimits dies zulassen.

    Die Standardobergrenze für eingehende Größen zur Laufzeit beträgt `20MB`, sofern nicht durch `channels.slack.mediaMaxMb` überschrieben.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert eine absatzorientierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten enthalten (`thread_ts`)
    - Das Limit für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Typ-Standards aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellungsziele">
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

- Der automatische Modus für native Befehle ist für Slack **deaktiviert**, daher aktiviert `commands.native: "auto"` keine nativen Slack-Befehle.

```txt
/help
```

Native Argument-Menüs verwenden eine adaptive Darstellungsstrategie, die vor dem Senden eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6–100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
- Slack-Limits überschritten: kodierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mit `CommandTargetSessionKey` an die Sitzung der Zielkonversation weiter.

## Interaktive Antworten

Slack kann interaktive Antwort-Steuerelemente darstellen, die vom Agenten verfasst wurden, aber diese Funktion ist standardmäßig deaktiviert.

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

Diese Direktiven werden zu Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den bestehenden Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die Rückrufwerte der Interaktion sind von OpenClaw generierte undurchsichtige Token, keine rohen agentenverfassten Werte.
- Wenn generierte interaktive Blöcke die Slack-Block-Kit-Limits überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungs-Client mit interaktiven Buttons und Interaktionen fungieren, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe native Slack-Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack ankommt und die Genehmigungs-ID-Art `plugin:` ist.
- Die Autorisierung des Genehmigers wird weiterhin durchgesetzt: Nur als Genehmiger identifizierte Nutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt als Block-Kit-Buttons in der Konversation dargestellt.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis besagt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und sich mindestens ein
Genehmiger auflösen lässt. Setzen Sie `enabled: false`, um Slack ausdrücklich als nativen Genehmigungs-Client zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn Genehmiger aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmiger überschreiben, Filter hinzufügen oder
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

Gemeinsame Weiterleitung über `approvals.exec` ist separat. Verwenden Sie sie nur, wenn Eingabe-Genehmigungsaufforderungen zusätzlich
an andere Chats oder explizite Ziele außerhalb des Bandes weitergeleitet werden müssen. Gemeinsame Weiterleitung über `approvals.plugin` ist ebenfalls
separat; native Slack-Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits in Slack ankommen.

`/approve` im selben Chat funktioniert ebenfalls in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec approvals](/de/tools/exec-approvals) für das vollständige Modell zur Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen/Thread-Broadcasts werden auf Systemereignisse abgebildet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden auf Systemereignisse abgebildet.
- Ereignisse zum Beitritt/Verlassen von Mitgliedern, zum Erstellen/Umbenennen von Kanälen sowie zum Hinzufügen/Entfernen von Pins werden auf Systemereignisse abgebildet.
- `channel_id_changed` kann Kanal-Konfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanalthema-/Zweck-Metadaten werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und anfängliche Thread-Verlaufskontext-Seeding werden, sofern zutreffend, durch konfigurierte Absender-Zulassungslisten gefiltert.
- Block-Aktionen und Modal-Interaktionen erzeugen strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Payload-Feldern:
  - Block-Aktionen: ausgewählte Werte, Beschriftungen, Picker-Werte und `workflow_*`-Metadaten
  - Modal-Ereignisse `view_submission` und `view_closed` mit gerouteten Kanal-Metadaten und Formulareingaben

## Hinweise zur Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - Slack](/de/gateway/configuration-reference#slack)

  Wichtige Slack-Felder:
  - Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (alt: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; nur aktivieren, wenn nötig)
  - Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - Kanal-Zulassungsliste (`channels.slack.channels`)
    - `requireMention`
    - kanalbezogene `users`-Zulassungsliste

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
    - `channels.slack.dmPolicy` (oder alt `channels.slack.dm.policy`)
    - Pairing-Genehmigungen / Zulassungslisteneinträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet nicht">
    Validieren Sie Bot- und App-Token sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Anfrage-URLs (Events + Interaktivität + Slash-Befehle)
    - eindeutigen `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-Snapshots
    erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte
    das durch SecretRef gestützte Signing Secret nicht auflösen.

    Registrierte Request-URL-Webhooks werden über dieselbe gemeinsame Handler-Registry geleitet, die auch für das Slack-Monitor-Setup verwendet wird, sodass Slack-Ereignisse im HTTP-Modus weiterhin über den registrierten Pfad geroutet werden, anstatt nach erfolgreicher Routenregistrierung mit 404 zu enden.

  </Accordion>

  <Accordion title="Dateidownloads mit benutzerdefinierten Bot-Tokens">
    Der Helper `downloadFile` löst sein Bot-Token aus der Laufzeitkonfiguration auf, wenn ein Aufrufer `cfg` ohne explizites `token` oder vorgefertigten Client übergibt, wodurch Datei-Downloads nur mit `cfg` außerhalb des Aktions-Laufzeitpfads erhalten bleiben.
  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativen Befehlsmodus (`channels.slack.commands.native: true`) mit entsprechend in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Zulassungslisten.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Pairing](/de/channels/pairing)
- [Groups](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Konfiguration](/de/gateway/configuration)
- [Slash commands](/de/tools/slash-commands)
