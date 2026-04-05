---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T12:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: produktionsreif für DMs + Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; der HTTP-Events-API-Modus wird ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Slack-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Slack-App und Tokens erstellen">
        In den Slack-App-Einstellungen:

        - **Socket Mode** aktivieren
        - **App Token** (`xapp-...`) mit `connections:write` erstellen
        - App installieren und **Bot Token** (`xoxb-...`) kopieren
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

      <Step title="App-Ereignisse abonnieren">
        Bot-Ereignisse abonnieren für:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Aktivieren Sie außerdem im App Home den **Messages Tab** für DMs.
      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API mode">
    <Steps>
      <Step title="Slack-App für HTTP konfigurieren">

        - Modus auf HTTP setzen (`channels.slack.mode="http"`)
        - Slack-**Signing Secret** kopieren
        - Event Subscriptions + Interactivity + Slash-command-Request-URL auf denselben Webhook-Pfad setzen (Standard `/slack/events`)

      </Step>

      <Step title="OpenClaw-HTTP-Modus konfigurieren">

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

      </Step>

      <Step title="Eindeutige Webhook-Pfade für HTTP mit mehreren Konten verwenden">
        HTTP-Modus pro Konto wird unterstützt.

        Geben Sie jedem Konto einen eigenen `webhookPath`, damit Registrierungen nicht kollidieren.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checkliste für Manifest und Scopes

<AccordionGroup>
  <Accordion title="Beispiel für ein Slack-App-Manifest" defaultOpen>

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

  </Accordion>

  <Accordion title="Optionale User-Token-Scopes (Leseoperationen)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Suchlesevorgängen abhängig sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Konfigurations-Tokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur per Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).
- Optional: Fügen Sie `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agentenidentität verwenden sollen (benutzerdefinierter `username` und Symbol). `icon_emoji` verwendet die Syntax `:emoji_name:`.

Verhalten des Status-Snapshots:

- Die Inspektion von Slack-Konten verfolgt pro Anmeldedaten die Felder `*Source` und `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht-inline Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus wird `signingSecretStatus` eingeschlossen; in Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann das User-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur erlaubt, wenn `userTokenReadOnly: false` ist und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

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

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Behandlung von Kanälen:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Einträge in Kanal-Allowlist und DM-Allowlist werden beim Start aufgelöst, wenn der Tokenzugriff dies erlaubt
    - nicht aufgelöste Kanalnamen-Einträge bleiben wie konfiguriert erhalten, werden für das Routing standardmäßig aber ignoriert
    - eingehende Autorisierung und Kanalrouting sind standardmäßig ID-first; direktes Matching von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions und Kanalbenutzer">
    Kanalnachrichten sind standardmäßig Mention-gated.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Verhalten bei Antworten auf Bot-Threads

    Steuerungen pro Kanal (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat von `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (ältere Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Agenten-Hauptsitzung reduziert.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können Suffixe für Thread-Sitzungen (`:thread:<threadTs>`) erzeugen, wenn anwendbar.
- Der Standardwert von `channels.slack.thread.historyScope` ist `thread`; `thread.inheritParent` ist standardmäßig `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; auf `0` setzen, um zu deaktivieren).

Steuerungen für Antwort-Threading:

- `channels.slack.replyToMode`: `off|first|all` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- veralteter Fallback für Direktchats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **jegliches** Antwort-Threading in Slack, einschließlich expliziter Tags `[[reply_to_*]]`. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Der Unterschied spiegelt die Threading-Modelle der Plattformen wider: Slack-Threads verbergen Nachrichten vor dem Kanal, während Telegram-Antworten im Haupt-Chatfluss sichtbar bleiben.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf Agentenidentitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschaunachricht durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Blöcken anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und dann den endgültigen Text senden.

`channels.slack.nativeStreaming` steuert natives Slack-Text-Streaming, wenn `streaming` auf `partial` steht (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming angezeigt wird. Die Thread-Auswahl folgt weiterhin `replyToMode`. Ohne Thread wird die normale Entwurfsvorschau verwendet.
- Medien und Nicht-Text-Payloads fallen auf normale Zustellung zurück.
- Wenn Streaming mitten in einer Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf normale Zustellung zurück.

Verwenden Sie die Entwurfsvorschau statt nativem Slack-Text-Streaming:

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

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch nach `channels.slack.streaming` migriert.
- boolean `channels.slack.streaming` wird automatisch nach `channels.slack.nativeStreaming` migriert.

## Fallback für Schreibreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn die Ausführung abgeschlossen ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig einen Statusindikator „is typing...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird nach Abschluss des Antwort- oder Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privat gehosteten Slack-URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und beim Erfolg des Abrufs und innerhalb der Größenbeschränkungen in den Medienspeicher geschrieben.

    Die Laufzeitgrenze für eingehende Größen beträgt standardmäßig `20MB`, sofern nicht durch `channels.slack.mediaMaxMb` überschrieben.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert eine absatzorientierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) enthalten
    - die Grenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Art-Standards aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Benutzerziele über Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

- Der native Befehls-Automatikmodus ist für Slack **deaktiviert** (`commands.native: "auto"` aktiviert keine nativen Slack-Befehle).
- Aktivieren Sie native Slack-Befehlshandler mit `channels.slack.commands.native: true` (oder global `commands.native: true`).
- Wenn native Befehle aktiviert sind, registrieren Sie passende Slash-Befehle in Slack (`/<command>`-Namen), mit einer Ausnahme:
  - registrieren Sie `/agentstatus` für den Statusbefehl (Slack reserviert `/status`)
- Wenn native Befehle nicht aktiviert sind, können Sie einen einzelnen konfigurierten Slash-Befehl über `channels.slack.slashCommand` ausführen.
- Native Argumentmenüs passen ihre Darstellungsstrategie jetzt an:
  - bis zu 5 Optionen: Button-Blöcke
  - 6-100 Optionen: statisches Select-Menü
  - mehr als 100 Optionen: externes Select mit asynchroner Optionsfilterung, wenn Interactivity-Option-Handler verfügbar sind
  - wenn kodierte Optionswerte die Slack-Grenzen überschreiten, fällt der Ablauf auf Buttons zurück
- Für lange Options-Payloads verwenden Slash-command-Argumentmenüs einen Bestätigungsdialog, bevor ein ausgewählter Wert ausgeführt wird.

Standard-Slash-command-Einstellungen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Slash-Sitzungen verwenden isolierte Schlüssel:

- `agent:<agentId>:slack:slash:<userId>`

und routen die Befehlsausführung weiterhin gegen die Konversations-Zielsitzung (`CommandTargetSessionKey`).

## Interaktive Antworten

Slack kann vom Agenten verfasste interaktive Antwort-Steuerelemente rendern, aber diese Funktion ist standardmäßig deaktiviert.

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

Wenn aktiviert, können Agenten nur für Slack gültige Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den vorhandenen Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte opake Tokens, keine vom Agenten roh verfassten Werte.
- Wenn generierte interaktive Blöcke die Grenzen von Slack Block Kit überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Freigaben in Slack

Slack kann als nativer Freigabe-Client mit interaktiven Buttons und Interaktionen dienen, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Freigaben verwenden `channels.slack.execApprovals.*` für natives DM-/Kanalrouting.
- Plugin-Freigaben können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Art der Freigabe-ID `plugin:` ist.
- Die Autorisierung der Genehmigenden wird weiterhin erzwungen: Nur Benutzer, die als Genehmigende identifiziert sind, können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Freigabe-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Freigabeaufforderungen direkt als Block-Kit-Buttons in der Unterhaltung gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Freigabe-UX; OpenClaw
sollte einen manuellen `/approve`-Befehl nur einbeziehen, wenn das Tool-Ergebnis sagt, dass Chat-
Freigaben nicht verfügbar sind oder eine manuelle Freigabe der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Freigaben automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Genehmigender aufgelöst wird. Setzen Sie `enabled: false`, um Slack ausdrücklich als nativen Freigabe-Client zu deaktivieren.
Setzen Sie `enabled: true`, um native Freigaben zu erzwingen, wenn Genehmigende aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Freigabekonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmigende überschreiben, Filter hinzufügen oder
sich für Zustellung im Ursprungschat entscheiden möchten:

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

Gemeinsame Weiterleitung von `approvals.exec` ist getrennt. Verwenden Sie sie nur, wenn Exec-Freigabeaufforderungen zusätzlich
an andere Chats oder explizite Ziele außerhalb des Bandes weitergeleitet werden müssen. Gemeinsame Weiterleitung von `approvals.plugin` ist ebenfalls
getrennt; Slack-native Buttons können Plugin-Freigaben weiterhin auflösen, wenn diese Anfragen bereits in Slack landen.

`/approve` im selben Chat funktioniert ebenfalls in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec approvals](/tools/exec-approvals) für das vollständige Modell der Freigabeweiterleitung.

## Ereignisse und betriebliches Verhalten

- Bearbeitungen/Löschungen von Nachrichten sowie Thread-Broadcasts werden in Systemereignisse umgewandelt.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden in Systemereignisse umgewandelt.
- Ereignisse zum Beitreten/Verlassen von Mitgliedern, Erstellen/Umbenennen von Kanälen und Hinzufügen/Entfernen von Pins werden in Systemereignisse umgewandelt.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext eingespeist werden.
- Kontext-Seeding für Thread-Starter und initialen Thread-Verlauf wird, wenn anwendbar, anhand konfigurierter Sender-Allowlists gefiltert.
- Block-Aktionen und Modal-Interaktionen erzeugen strukturierte Systemereignisse `Slack interaction: ...` mit umfangreichen Payload-Feldern:
  - Block-Aktionen: ausgewählte Werte, Beschriftungen, Picker-Werte und `workflow_*`-Metadaten
  - Modal-Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - Slack](/gateway/configuration-reference#slack)

  Wichtige Slack-Felder:
  - Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (veraltet: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, wenn nicht nötig)
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
    - Pairing-Freigaben / Allowlist-Einträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet sich nicht">
    Validieren Sie Bot- + App-Tokens sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den SecretRef-gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Request-URLs (Events + Interactivity + Slash Commands)
    - eindeutigen `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das SecretRef-gestützte Signing Secret
    nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, was Sie beabsichtigt haben:

    - nativen Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Command-Modus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
