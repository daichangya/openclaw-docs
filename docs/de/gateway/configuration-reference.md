---
read_when:
    - Sie benötigen die genaue Semantik oder Standardwerte auf Feldebene für die Konfiguration
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateway oder Tools
summary: Vollständige Referenz für jeden OpenClaw-Konfigurationsschlüssel, Standardwerte und Kanaleinstellungen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-05T12:47:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb4c6de7955aa0c6afa2d20f12a0e3782b16ab2c1b6bf3ed0a8910be2f0a47d1
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Konfigurationsreferenz

Jedes verfügbare Feld in `~/.openclaw/openclaw.json`. Für einen aufgabenorientierten Überblick siehe [Configuration](/gateway/configuration).

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas sind erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie       | Verhalten                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Eigentümer muss zustimmen |
| `allowlist`         | Nur Absender in `allowFrom` (oder im gepairten Allow-Store)    |
| `open`              | Alle eingehenden DMs erlauben (erfordert `allowFrom: ["*"]`)   |
| `disabled`          | Alle eingehenden DMs ignorieren                                |

| Gruppenrichtlinie     | Verhalten                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (Standard) | Nur Gruppen zulassen, die zur konfigurierten Allowlist passen |
| `open`                | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren               |

<Note>
`channels.defaults.groupPolicy` setzt den Standardwert, wenn die `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie zur Laufzeit auf `allowlist` zurück (fail-closed) und meldet beim Start eine Warnung.
</Note>

### Modellüberschreibungen pro Kanal

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modellaliase. Die Kanalzuordnung wird angewendet, wenn eine Sitzung noch keine Modellüberschreibung hat (zum Beispiel per `/model` gesetzt).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Kanalstandardwerte und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsam genutztes Verhalten von Gruppenrichtlinien und Heartbeat über alle Provider hinweg:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn auf Providerebene `groupPolicy` nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, allen Zitat-/Thread-/Verlaufskontext einbeziehen), `allowlist` (nur Kontext von Sendern in der Allowlist einbeziehen), `allowlist_quote` (wie `allowlist`, aber expliziten Zitat-/Antwortkontext beibehalten). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gesunde Kanalstatus in die Heartbeat-Ausgabe einbeziehen.
- `channels.defaults.heartbeat.showAlerts`: degradierte/fehlerhafte Status in die Heartbeat-Ausgabe einbeziehen.
- `channels.defaults.heartbeat.useIndicator`: kompakte indikatorartige Heartbeat-Ausgabe rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateway (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung existiert.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blaue Häkchen (false im Self-Chat-Modus)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp mit mehreren Konten">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, falls vorhanden; andernfalls die erste konfigurierte Konto-ID (sortiert).
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Das Legacy-Baileys-Auth-Verzeichnis für Einzelkonten wird von `openclaw doctor` nach `whatsapp/default` migriert.
- Überschreibungen pro Konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (Standard: off; explizit aktivieren, um Ratenlimits für Vorschau-Bearbeitungen zu vermeiden)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Fallback für das Standardkonto.
- Optional überschreibt `channels.telegram.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- In Setups mit mehreren Konten (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwenden Sie das kanonische Format `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird gemeinsam in [ACP Agents](/tools/acp-agents#channel-specific-settings) verwendet.
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- Retry-Richtlinie: siehe [Retry policy](/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress wird auf Discord auf partial abgebildet)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // Opt-in für sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, mit `DISCORD_BOT_TOKEN` als Fallback für das Standardkonto.
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Wiederholungs-/Richtlinieneinstellungen pro Konto kommen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; nackte numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, Leerzeichen werden durch `-` ersetzt; Kanalschlüssel verwenden den slugifizierten Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Vom Bot verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle, aber nicht den Bot erwähnen (außer @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert threadgebundenes Routing für Discord:
  - `enabled`: Discord-Überschreibung für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/gebundenes Routing)
  - `idleHours`: Discord-Überschreibung für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für hartes maximales Alter in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung bei `sessions_spawn({ thread: true })`
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird gemeinsam in [ACP Agents](/tools/acp-agents#channel-specific-settings) verwendet.
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord Components v2-Container.
- `channels.discord.voice` aktiviert Unterhaltungen in Discord-Sprachkanälen sowie optionales Auto-Join + TTS-Überschreibungen.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an `@discordjs/voice`-DAVE-Optionen durchgereicht (standardmäßig `true` und `24`).
- OpenClaw versucht zusätzlich eine Wiederherstellung des Sprachempfangs, indem es nach wiederholten Entschlüsselungsfehlern eine Sprachsitzung verlässt und erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Streaming-Modus. Veraltete Werte `streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` bildet die Laufzeitverfügbarkeit auf die Bot-Präsenz ab (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen für den Statustext.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderbares Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Freigaben aktiviert, wenn Freigebende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen freigeben dürfen. Fällt bei Auslassung auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Allowlist von Agenten-IDs. Weglassen, um Freigaben für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüsselmuster (Substring oder Regex).
  - `target`: wohin Freigabeaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Freigebenden, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beides. Wenn das Ziel `"channel"` enthält, sind Buttons nur für aufgelöste Freigebende nutzbar.
  - `cleanupAfterResolve`: wenn `true`, werden Freigabe-DMs nach Freigabe, Ablehnung oder Timeout gelöscht.

**Modi für Reaktionsbenachrichtigungen:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (aus `guilds.<id>.users` für alle Nachrichten).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Service-Account-JSON: inline (`serviceAccount`) oder dateibasiert (`serviceAccountFile`).
- SecretRef für den Service-Account wird ebenfalls unterstützt (`serviceAccountRef`).
- Env-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veränderbares Matching auf E-Mail-Principals erneut (Break-Glass-Kompatibilitätsmodus).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (Vorschaumodus)
      nativeStreaming: true, // native Slack-Streaming-API verwenden, wenn streaming=partial
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket Mode** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` als Env-Fallback für das Standardkonto).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Zugangsdaten Quelle-/Status-Felder bereit wie
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` und, im HTTP-Modus,
  `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto
  über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den Secret-Wert
  aber nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming` ist der kanonische Schlüssel für den Streaming-Modus. Veraltete Werte `streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` ist pro Thread (Standard) oder kanalweit geteilt. `thread.inheritParent` kopiert das übergeordnete Kanaltranskript in neue Threads.

- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden. Gleiches Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise                 |
| ------------ | ------- | ------------------------ |
| reactions    | aktiviert | Reagieren + Reaktionen auflisten |
| messages     | aktiviert | Lesen/Senden/Bearbeiten/Löschen |
| pins         | aktiviert | Anheften/Lösen/Auflisten |
| memberInfo   | aktiviert | Mitgliedsinformationen   |
| emojiList    | aktiviert | Liste benutzerdefinierter Emojis |

### Mattermost

Mattermost wird als Plugin ausgeliefert: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // Opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optionale explizite URL für Reverse-Proxy-/öffentliche Deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (antwortet auf @-mention, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss auf den OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den von Mattermost bei der Registrierung von Slash-Befehlen zurückgegebenen Token pro Befehl authentifiziert. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert werden, lehnt OpenClaw Callbacks mit
  `Unauthorized: invalid command token.` ab.
- Für private/tailnet/interne Callback-Hosts kann Mattermost verlangen, dass
  `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/die Callback-Domain enthält.
  Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: Mattermost-initiierte Konfigurationsschreibvorgänge erlauben oder verbieten.
- `channels.mattermost.requireMention`: `@mention` verlangen, bevor in Kanälen geantwortet wird.
- `channels.mattermost.groups.<channelId>.requireMention`: Überschreibung des Mention-Gating pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optionale Kontobindung
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

- `channels.signal.account`: Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: von Signal initiierte Konfigurationsschreibvorgänge erlauben oder verbieten.
- Optional überschreibt `channels.signal.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (Plugin-basiert, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // siehe /channels/bluebubbles
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen BlueBubbles-Handle oder Ziel-String (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist in [BlueBubbles](/channels/bluebubbles) dokumentiert.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Kein Daemon oder Port erforderlich.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert Full Disk Access für die Messages-Datenbank.
- Bevorzugen Sie Ziele im Format `chat_id:<id>`. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setzen Sie `remoteHost` (`host` oder `user@host`) für SCP-Abruf von Anhängen.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, stellen Sie also sicher, dass der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verbieten.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix wird über eine Erweiterung bereitgestellt und unter `channels.matrix` konfiguriert.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token-Auth verwendet `accessToken`; Passwort-Auth verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Verkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können ihn mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.allowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und `allowPrivateNetwork` sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Setups mit mehreren Konten aus.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Freigaben aktiviert, wenn Freigebende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (zum Beispiel `@owner:example.org`), die Exec-Anfragen freigeben dürfen.
  - `agentFilter`: optionale Allowlist von Agenten-IDs. Weglassen, um Freigaben für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüsselmuster (Substring oder Regex).
  - `target`: wohin Freigabeaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- Matrix-Status-Probes und Live-Verzeichnis-Lookups verwenden dieselbe Proxy-Richtlinie wie der Laufzeitverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams wird über eine Erweiterung bereitgestellt und unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // siehe /channels/msteams
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Zugangsdaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/pro Kanal) ist in [Microsoft Teams](/channels/msteams) dokumentiert.

### IRC

IRC wird über eine Erweiterung bereitgestellt und unter `channels.irc` konfiguriert.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/channels/irc) dokumentiert.

### Mehrere Konten (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jedes mit eigener `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` wird verwendet, wenn `accountId` weggelassen wird (CLI + Routing).
- Env-Token gelten nur für das **default**-Konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Konto hinzufügen, das nicht `default` ist, während noch eine Einzelkonto-Konfiguration auf Top-Level-Ebene für den Kanal vorhanden ist, verschiebt OpenClaw zunächst kontobezogene Top-Level-Einzelkontowerte in die Kontozuordnung des Kanals, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann ein vorhandenes passendes benanntes/default-Ziel stattdessen beibehalten.
- Bestehende kanalweite Bindings (ohne `accountId`) passen weiterhin auf das Standardkonto; kontospezifische Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Strukturen, indem kontobezogene Top-Level-Einzelkontowerte in das für diesen Kanal ausgewählte promotete Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann ein vorhandenes passendes benanntes/default-Ziel stattdessen beibehalten.

### Andere Erweiterungskanäle

Viele Erweiterungskanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Channels](/channels).

### Mention-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig **eine Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für Gruppen-Chats in WhatsApp, Telegram, Discord, Google Chat und iMessage.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: native @-mentions der Plattform. Werden im WhatsApp-Self-Chat-Modus ignoriert.
- **Textmuster**: sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Mention-Gating wird nur erzwungen, wenn Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` setzt den globalen Standard. Kanäle können dies mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie `0`, um es zu deaktivieren.

#### DM-Verlaufslimits

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Auflösung: DM-spezifische Überschreibung → Provider-Standard → kein Limit (alles wird behalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Fügen Sie Ihre eigene Nummer zu `allowFrom` hinzu, um den Self-Chat-Modus zu aktivieren (ignoriert native @-mentions, antwortet nur auf Textmuster):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Befehle (Chat-Befehlsverarbeitung)

```json5
{
  commands: {
    native: "auto", // native Befehle registrieren, wenn unterstützt
    text: true, // /commands in Chat-Nachrichten parsen
    bash: false, // ! erlauben (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config erlauben
    debug: false, // /debug erlauben
    restart: false, // /restart + Gateway-Neustart-Tool erlauben
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Befehlsdetails">

- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram, lässt Slack deaktiviert.
- Überschreibung pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- `channels.telegram.customCommands` fügt zusätzliche Einträge zum Telegram-Bot-Menü hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und dass der Absender in `tools.elevated.allowFrom.<channel>` enthalten ist.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für `chat.send`-Clients des Gateway erfordern persistente Schreibvorgänge per `/config set|unset` zusätzlich `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreib-Scope verfügbar.
- `channels.<provider>.configWrites` steuert Konfigurationsmutationen pro Kanal (Standard: true).
- Für Kanäle mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` ebenfalls Schreibvorgänge, die auf dieses Konto abzielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` ist pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Richtlinien von Zugriffsgruppen zu umgehen, wenn `allowFrom` nicht gesetzt ist.

</Accordion>

---

## Agent-Standardwerte

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionale Repository-Root, die in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw sie automatisch, indem es vom Workspace aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills für Agenten, die `agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu haben.
- Lassen Sie `agents.list[].skills` weg, um die Standardwerte zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nichtleere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie wird nicht mit den Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor dem Abschneiden. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzahl von Zeichen, die über alle Workspace-Bootstrap-Dateien hinweg injiziert werden. Standard: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für Agenten sichtbaren Warntext, wenn Bootstrap-Kontext abgeschnitten wird.
Standard: `"once"`.

- `"off"`: niemals Warntext in den System-Prompt injizieren.
- `"once"`: Warnung einmal pro eindeutiger Abschneidungssignatur injizieren (empfohlen).
- `"always"`: Warnung bei jeder Ausführung injizieren, wenn eine Abschneidung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße der längsten Bildseite in Transcript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel den Verbrauch von Vision-Tokens und die Größe von Request-Payloads bei screenshotlastigen Läufen.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den System-Prompt-Kontext (nicht für Nachrichtenzeitstempel). Fällt auf die Zeitzone des Hosts zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (Betriebssystemeinstellung).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globale Standard-Provider-Parameter
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die String-Form setzt nur das Primärmodell.
  - Die Objektform setzt Primärmodell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool-Pfad `image` als Konfiguration des Vision-Modells verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder erzeugt.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-1` für OpenAI Images.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Auth/den API-Schlüssel (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*`, `FAL_KEY` für `fal/*`).
  - Wenn es fehlt, kann `image_generate` dennoch einen Auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider und danach die übrigen registrierten Bildgenerierungs-Provider in der Reihenfolge der Provider-IDs.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Setzen Sie dies explizit, bevor Sie gemeinsame Videogenerierung verwenden. Anders als bei `imageGenerationModel` leitet die Laufzeit für Videogenerierung derzeit keinen Provider-Standard ab.
  - Wenn Sie einen Provider/ein Modell direkt auswählen, konfigurieren Sie auch die passende Provider-Auth/den API-Schlüssel.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt derzeit bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-spezifische Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool `pdf` für das Modellrouting verwendet.
  - Wenn es fehlt, fällt das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs für das Tool `pdf`, wenn `maxBytesMb` nicht zur Aufrufzeit übergeben wird.
- `pdfMaxPages`: Standardmaximum an Seiten, das vom Fallback-Modus für Extraktion im Tool `pdf` berücksichtigt wird.
- `verboseDefault`: Standard-Ausführlichkeitsstufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standardstufe für Elevated-Ausgabe bei Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer eines konfigurierten Providers für genau diese Modell-ID und fällt erst dann auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugen Sie explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (provider-spezifisch, z. B. `temperature`, `maxTokens`, `cacheRetention`, `context1m`) enthalten.
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setzen Sie dies unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- `params` Merge-Priorität (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (für passende Agent-ID) per Schlüssel. Siehe [Prompt Caching](/reference/prompt-caching) für Details.
- Konfigurationsschreiber, die diese Felder mutieren (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten nach Möglichkeit bestehende Fallback-Listen bei.
- `maxConcurrent`: maximale parallele Agentenläufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standardwerten.

Z.AI-Modelle der GLM-4.x-Reihe aktivieren automatisch den Thinking-Modus, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für Text-only-Fallback-Läufe (keine Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind textorientiert; Tools sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Durchreichen von Bildern wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deaktiviert
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Auth) oder `1h` (OAuth-Auth). Auf `0m` setzen, um es zu deaktivieren.
- `suppressToolErrorWarnings`: wenn true, Warn-Payloads für Tool-Fehler während Heartbeat-Läufen unterdrücken.
- `directPolicy`: Richtlinie für direkte/DM-Zustellung. `allow` (Standard) erlaubt Zustellung an Direktziele. `block` unterdrückt Zustellung an Direktziele und erzeugt `reason=dm-blocked`.
- `lightContext`: wenn true, verwenden Heartbeat-Läufe leichten Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Dasselbe Isolationsmuster wie bei Cron mit `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von ~100K auf ~2-5K Tokens.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agenten-Turns aus — kürzere Intervalle verbrauchen mehr Tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // verwendet, wenn identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert Reinjektion
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale Überschreibung nur für das Kompaktierungsmodell
        notifyUser: true, // kurze Benachrichtigung senden, wenn Kompaktierung startet (Standard: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (chunked summarization für lange Verläufe). Siehe [Compaction](/concepts/compaction).
- `timeoutSeconds`: maximal erlaubte Sekunden für einen einzelnen Kompaktierungsvorgang, bevor OpenClaw ihn abbricht. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Kompaktierungszusammenfassung eingebaute Anweisungen zum Erhalt opaker Identifikatoren voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zum Erhalt von Identifikatoren, der verwendet wird, wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale Namen von AGENTS.md-Abschnitten H2/H3, die nach der Kompaktierung erneut injiziert werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die Reinjektion zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` auch als Legacy-Fallback akzeptiert.
- `model`: optionale Überschreibung `provider/model-id` nur für die Kompaktierungszusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung bei einem Modell bleiben soll, Kompaktierungszusammenfassungen aber auf einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet die Kompaktierung das Primärmodell der Sitzung.
- `notifyUser`: wenn `true`, wird eine kurze Benachrichtigung an den Benutzer gesendet, wenn die Kompaktierung startet (zum Beispiel „Compacting context...“). Standardmäßig deaktiviert, damit die Kompaktierung geräuschlos bleibt.
- `memoryFlush`: stiller agentischer Turn vor der automatischen Kompaktierung, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Beschneidet **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor er an das LLM gesendet wird. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Verhalten des Modus cache-ttl">

- `mode: "cache-ttl"` aktiviert Beschneidungsläufe.
- `ttl` steuert, wie oft eine Beschneidung erneut laufen kann (nach dem letzten Cache-Touch).
- Die Beschneidung kürzt zuerst übergroße Tool-Ergebnisse weich und löscht bei Bedarf anschließend ältere Tool-Ergebnisse hart.

**Soft-trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals getrimmt/gelöscht.
- Verhältnisse sind zeichenbasiert (ungefähr), keine exakten Tokenzahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Beschneidung übersprungen.

</Accordion>

Siehe [Session Pruning](/concepts/session-pruning) für Verhaltensdetails.

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (verwenden Sie minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Block-Antworten. `natural` = 800–2500ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/concepts/streaming) für Verhalten + Chunking-Details.

### Tippindikatoren

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Standardwerte: `instant` für Direktchats/Erwähnungen, `message` für nicht erwähnte Gruppenchats.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Typing Indicators](/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox-Isolierung für den eingebetteten Agenten. Siehe [Sandboxing](/gateway/sandboxing) für die vollständige Anleitung.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / Inline-Inhalte werden ebenfalls unterstützt:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox-Details">

**Backend:**

- `docker`: lokales Docker-Runtime (Standard)
- `ssh`: generisches SSH-basiertes Remote-Runtime
- `openshell`: OpenShell-Runtime

Wenn `backend: "openshell"` ausgewählt ist, werden runtime-spezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**Konfiguration des SSH-Backends:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolute entfernte Root, die für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für die Host-Key-Richtlinie

**Auth-Priorität des SSH-Backends:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden vor dem Start der Sandbox-Sitzung aus dem aktiven Secrets-Laufzeit-Snapshot aufgelöst

**Verhalten des SSH-Backends:**

- initialisiert den entfernten Workspace einmal nach create oder recreate
- behält danach den entfernten SSH-Workspace als kanonisch bei
- routet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert entfernte Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agenten-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agenten-Workspace schreibbar unter `/workspace` eingehängt

**Scope:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: gemeinsamer Container und gemeinsamer Workspace (keine Isolation zwischen Sitzungen)

**OpenShell-Plugin-Konfiguration:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optionale OpenShell-Policy-ID
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-Modus:**

- `mirror`: Remote vor `exec` lokal spiegeln, nach `exec` zurücksynchronisieren; lokaler Workspace bleibt kanonisch
- `remote`: Remote einmal initialisieren, wenn die Sandbox erstellt wird, und danach den entfernten Workspace als kanonisch behalten

Im Modus `remote` werden hostlokale Änderungen, die außerhalb von OpenClaw vorgenommen werden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und optional Mirror-Sync.

**`setupCommand`** läuft einmal nach der Container-Erstellung (über `sh -lc`). Benötigt Netzwerkzugriff nach außen, beschreibbare Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie es auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, außer Sie setzen
explizit `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace abgelegt.

**`docker.binds`** bindet zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Bindings werden zusammengeführt.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt injiziert. Erfordert nicht `browser.enabled` in `openclaw.json`.
Der Beobachterzugriff über noVNC verwendet standardmäßig VNC-Auth, und OpenClaw erzeugt eine URL mit kurzlebigem Token (statt das Passwort in der geteilten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass sandboxed Sitzungen den Host-Browser ansteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie explizit globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` kann optional eingehende CDP-Verbindungen am Containerrand auf einen CIDR-Bereich beschränken (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse nur in den Browser-Container der Sandbox ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts optimiert:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (standardmäßig aktiviert)
  - `--disable-3d-apis`, `--disable-software-rasterizer` und `--disable-gpu` sind
    standardmäßig aktiviert und können mit
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn für WebGL/3D eine Nutzung erforderlich ist.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn Ihr Workflow sie benötigt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um den
    Standard-Prozessgrenzwert von Chromium zu verwenden.
  - plus `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte sind die Ausgangsbasis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit benutzerdefiniertem Entrypoint, um die Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind derzeit nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Überschreibungen pro Agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oder { primary, fallbacks }
        thinkingDefault: "high", // Überschreibung der Thinking-Stufe pro Agent
        reasoningDefault: "on", // Überschreibung der Sichtbarkeit von Reasoning pro Agent
        fastModeDefault: false, // Überschreibung des Schnellmodus pro Agent
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter pro Schlüssel
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabile Agenten-ID (erforderlich).
- `default`: wenn mehrere gesetzt sind, gewinnt die erste (Warnung wird protokolliert). Wenn keine gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form überschreibt nur `primary`; die Objektform `{ primary, fallbacks }` überschreibt beides (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin die Standard-Fallbacks, außer Sie setzen `fallbacks: []`.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skill-Allowlist pro Agent. Wenn nicht gesetzt, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt die Standardwerte, statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Thinking-Stufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standardsichtbarkeit von Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard für den Schnellmodus pro Agent (`true | false`). Gilt, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `runtime`: optionale Runtime-Beschreibung pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: Workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agenten-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Vererbungsleitplanke für Sandbox: Wenn die anfragende Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `subagents.requireAgentId`: wenn true, blockiert `sessions_spawn` Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agenten innerhalb eines Gateways aus. Siehe [Multi-Agent](/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Match-Felder für Bindings

- `type` (optional): `route` für normales Routing (fehlender Typ entspricht `route`), `acp` für persistente ACP-Unterhaltungs-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne peer/guild/team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Ebene gewinnt der erste passende Eintrag in `bindings`.

Für Einträge mit `type: "acp"` löst OpenClaw anhand der exakten Gesprächsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die obige Tier-Reihenfolge der Route-Bindings.

### Zugriffsprofile pro Agent

<Accordion title="Vollzugriff (keine Sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Schreibgeschützte Tools + Workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Kein Dateisystemzugriff (nur Messaging)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Siehe [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) für Details zur Priorität.

---

## Sitzung

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // Parent-Thread-Fork oberhalb dieser Tokenzahl überspringen (0 deaktiviert)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optionales hartes Budget
      highWaterBytes: "400mb", // optionales Ziel nach Bereinigung
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standard für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standard für hartes maximales Alter in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // Legacy (Runtime verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: Basissstrategie zur Gruppierung von Sitzungen für Gruppenchats.
  - `per-sender` (Standard): jeder Absender erhält innerhalb eines Kanal-Kontexts eine isolierte Sitzung.
  - `global`: alle Teilnehmer innerhalb eines Kanal-Kontexts teilen eine gemeinsame Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: alle DMs teilen die Hauptsitzung.
  - `per-peer`: Isolation nach Absender-ID über Kanäle hinweg.
  - `per-channel-peer`: Isolation pro Kanal + Absender (empfohlen für Inboxes mit mehreren Benutzern).
  - `per-account-channel-peer`: Isolation pro Konto + Kanal + Absender (empfohlen für mehrere Konten).
- **`identityLinks`**: Zuordnung kanonischer IDs zu mit Provider-Präfix versehenen Peers für sitzungsübergreifendes Teilen über Kanäle hinweg.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt bei lokaler Uhrzeit `atHour` zurück; `idle` setzt nach `idleMinutes` Inaktivität zurück. Wenn beides konfiguriert ist, gewinnt der früher ablaufende Zustand.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal erlaubte `totalTokens` der Parent-Sitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn `totalTokens` des Parents über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, statt den Verlauf des Parent-Transkripts zu erben.
  - Setzen Sie `0`, um diese Leitplanke zu deaktivieren und Parent-Forking immer zu erlauben.
- **`mainKey`**: Legacy-Feld. Die Runtime verwendet jetzt immer `"main"` für den Haupt-Bucket von Direktchats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl an Antwort-Turns zwischen Agenten während Agent-zu-Agent-Austausch (Integer, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match nach `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Das erste deny gewinnt.
- **`maintenance`**: Bereinigung + Aufbewahrungskontrollen für den Sitzungs-Store.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: `sessions.json` rotieren, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; setzen Sie `false`, um dies zu deaktivieren.
  - `maxDiskBytes`: optionales Festplattenbudget für das Sitzungsverzeichnis. Im Modus `warn` protokolliert es Warnungen; im Modus `enforce` entfernt es zuerst die ältesten Artefakte/Sitzungen.
  - `highWaterBytes`: optionales Ziel nach Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Hauptschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standard für hartes maximales Alter in Stunden (`0` deaktiviert; Provider können überschreiben)

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 deaktiviert
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwortpräfix

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (spezifischstes gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung          | Beispiel                    |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname     | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständiger Modellbezeichner | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name         | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Thinking-Stufe | `high`, `low`, `off`      |
| `{identity.name}` | Name der Agentenidentität | (gleich wie `"auto"`)   |

Variablen sind case-insensitive. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Fallback aus der Identität.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigung nach der Antwort bei Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen bei Slack, Discord und Telegram.
  Bei Slack und Discord bleiben Statusreaktionen aktiviert, wenn Bestätigungsreaktionen aktiv sind und der Wert nicht gesetzt ist.
  Bei Telegram setzen Sie ihn explizit auf `true`, um Lifecycle-Statusreaktionen zu aktivieren.

### Eingehender Debounce

Fasst schnelle, rein textbasierte Nachrichten desselben Absenders zu einem einzelnen Agenten-Turn zusammen. Medien/Anhänge lösen sofortiges Flushen aus. Steuerbefehle umgehen Debouncing.

### TTS (Text-to-Speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` steuert automatisches TTS. `/tts off|always|inbound|tagged` überschreibt dies pro Sitzung.
- `summaryModel` überschreibt `agents.defaults.model.primary` für automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- `openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Die Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `openai.baseUrl` auf einen Endpunkt zeigt, der nicht zu OpenAI gehört, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Validierung von Modell/Stimme.

---

## Talk

Standardwerte für den Talk-Modus (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Provider konfiguriert sind.
- Veraltete flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartextstrings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` erlaubt es Talk-Direktiven, freundliche Namen zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Benutzerschweigen wartet, bevor das Transkript gesendet wird. Wenn nicht gesetzt, bleibt das plattformspezifische Standard-Pausenfenster erhalten (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt in neuen lokalen Konfigurationen standardmäßig `tools.profile: "coding"`, wenn es nicht gesetzt ist (bestehende explizite Profile bleiben erhalten).

| Profil      | Enthält                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                     |
| `full`      | keine Einschränkung (wie nicht gesetzt)                                                                       |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `tts`                                                                                        |
| `group:openclaw`   | Alle eingebauten Tools (ohne Provider-Plugins)                                                                          |

### `tools.allow` / `tools.deny`

Globale Richtlinie zum Erlauben/Verbieten von Tools (deny gewinnt). Case-insensitive, unterstützt Platzhalter `*`. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Weitere Einschränkung von Tools für bestimmte Provider oder Modelle. Reihenfolge: Basisprofil → Provider-Profil → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Steuert Elevated-Exec-Zugriff außerhalb der Sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Die Überschreibung pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Status pro Sitzung; Inline-Direktiven gelten nur für die einzelne Nachricht.
- Elevated `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig, oder `node`, wenn das Exec-Ziel `node` ist).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Sicherheitsprüfungen für Tool-Schleifen sind standardmäßig **deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren.
Einstellungen können global in `tools.loopDetection` definiert und pro Agent in `agents.list[].tools.loopDetection` überschrieben werden.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: maximale Historie von Tool-Aufrufen, die für die Schleifenanalyse behalten wird.
- `warningThreshold`: Schwellenwert für Warnungen bei wiederholten Mustern ohne Fortschritt.
- `criticalThreshold`: höherer Schwellenwert zum Blockieren kritischer Schleifen.
- `globalCircuitBreakerThreshold`: harter Stop-Schwellenwert für jeden Lauf ohne Fortschritt.
- `detectors.genericRepeat`: warnen bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
- `detectors.knownPollNoProgress`: warnen/blockieren bei bekannten Poll-Tools (`process.poll`, `command_status` usw.).
- `detectors.pingPong`: warnen/blockieren bei alternierenden Paarmustern ohne Fortschritt.
- Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold`, schlägt die Validierung fehl.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oder BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; weglassen für automatische Erkennung
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguriert das Verstehen eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Felder von Medienmodell-Einträgen">

**Provider-Eintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Überschreibung der Modell-ID
- `profile` / `preferredProfile`: Auswahl eines Profils aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführbares Programm
- `args`: templatebasierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
- Fehler fallen auf den nächsten Eintrag zurück.

Provider-Auth folgt der Standardreihenfolge: `auth-profiles.json` → Env-Variablen → `models.providers.*.apiKey`.

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Steuert, welche Sitzungen durch die Sitzungstools (`sessions_list`, `sessions_history`, `sessions_send`) adressiert werden können.

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, z. B. Subagenten).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Hinweise:

- `self`: nur der aktuelle Sitzungsschlüssel.
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagenten).
- `agent`: jede Sitzung, die zur aktuellen Agenten-ID gehört (kann andere Benutzer enthalten, wenn Sie Sitzungen pro Absender unter derselben Agenten-ID ausführen).
- `all`: jede Sitzung. Zielsteuerung über Agenten hinweg erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Klammer: Wenn die aktuelle Sitzung sandboxed ist und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` ist.

### `tools.sessions_spawn`

Steuert die Unterstützung von Inline-Anhängen für `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // 5 MB insgesamt über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge beibehalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Persistierung im Transkript entfernt.
- Base64-Eingaben werden mit strikter Prüfung von Alphabet/Padding und einer Größenprüfung vor dem Dekodieren validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: Standardmodell für gestartete Subagenten. Wenn nicht gesetzt, erben Subagenten das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist zulässiger Ziel-Agenten-IDs für `sessions_spawn`, wenn der anfragende Agent nicht sein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und baseUrl

OpenClaw verwendet den eingebauten Modellkatalog. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (Standard) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Auth-Anforderungen.
- Überschreiben Sie die Root des Agenten-Konfigurationsverzeichnisses mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, ein Legacy-Umgebungsvariablen-Alias).
- Merge-Priorität bei übereinstimmenden Provider-IDs:
  - Nichtleere `baseUrl`-Werte in der `models.json` des Agenten gewinnen.
  - Nichtleere `apiKey`-Werte in der `models.json` des Agenten gewinnen nur dann, wenn dieser Provider im aktuellen Kontext von Konfiguration/Auth-Profil nicht über SecretRef verwaltet wird.
  - SecretRef-verwaltete `apiKey`-Werte von Providern werden aus Quellmarkierungen aktualisiert (`ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen), statt aufgelöste Secrets zu persistieren.
  - SecretRef-verwaltete Header-Werte von Providern werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen).
  - Leere oder fehlende `apiKey`/`baseUrl` des Agenten fallen auf `models.providers` in der Konfiguration zurück.
  - Bei übereinstimmenden Modellen verwenden `contextWindow`/`maxTokens` den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
  - Bei übereinstimmenden Modellen behält `contextTokens` ein explizites Laufzeitlimit bei, wenn vorhanden; verwenden Sie es, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Marker-Persistierung ist quellautorisiert: Marker werden aus dem Snapshot der aktiven Quellkonfiguration (vor Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID geschlüsselt.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Zugangsdaten des Providers (bevorzugt SecretRef/Env-Substitution).
- `models.providers.*.auth`: Auth-Strategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions` `options.num_ctx` in Requests injizieren (Standard: `true`).
- `models.providers.*.authHeader`: Übertragung der Zugangsdaten im `Authorization`-Header erzwingen, wenn erforderlich.
- `models.providers.*.baseUrl`: Base-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transportüberschreibungen für HTTP-Requests des Modell-Providers.
  - `request.headers`: zusätzliche Header (werden mit Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
  - `request.auth`: Überschreibung der Auth-Strategie. Modi: `"provider-default"` (eingebaute Auth des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: HTTP-Proxy-Überschreibung. Modi: `"env-proxy"` (Env-Variablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: explizite Katalogeinträge für Provider-Modelle.
- `models.providers.*.models.*.contextWindow`: native Kontextfenster-Metadaten des Modells.
- `models.providers.*.models.*.contextTokens`: optionales Laufzeitlimit für den Kontext. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nichtleeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Eine leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
- `plugins.entries.amazon-bedrock.config.discovery`: Root für Einstellungen zur automatischen Bedrock-Erkennung.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Filter nach Provider-ID für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für das Aktualisieren der Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabetokens für erkannte Modelle.

### Provider-Beispiele

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für direktes Z.AI.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie Referenzen `opencode/...` für den Zen-Katalog oder `opencode-go/...` für den Go-Katalog. Kurzform: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` sind akzeptierte Aliasse. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Provider mit Überschreibung der Base-URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Für den China-Endpunkt: `baseUrl: "https://api.moonshot.cn/v1"` oder `openclaw onboard --auth-choice moonshot-api-key-cn`.

Native Moonshot-Endpunkte bewerben Streaming-Usage-Kompatibilität auf dem gemeinsamen
Transport `openai-completions`, und OpenClaw richtet sich dabei jetzt nach den Fähigkeiten des Endpunkts statt allein nach der eingebauten Provider-ID.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic-kompatibel, eingebauter Provider. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-kompatibel)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Die Base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direkt)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Setzen Sie `MINIMAX_API_KEY`. Kurzformen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet jetzt standardmäßig nur M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw standardmäßig MiniMax-Thinking,
sofern Sie `thinking` nicht explizit selbst setzen. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` zu
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Local Models](/gateway/local-models). Kurz gesagt: Führen Sie ein großes lokales Modell über die Responses API von LM Studio auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle für Fallbacks zusammengeführt.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartextstring
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn true, werden Installer über Homebrew bevorzugt, wenn `brew` verfügbar ist, bevor auf andere Installer-Arten zurückgegriffen wird.
- `install.nodeManager`: bevorzugter Node-Installer für Spezifikationen in `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Convenience-Feld für Skills, die eine primäre Env-Variable deklarieren (Klartextstring oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Neustart des Gateways.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` gewinnt.
- `plugins.entries.<id>.apiKey`: Convenience-Feld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Env-Variablen-Map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert Prompt-mutierende Felder aus Legacy-`before_agent_start`, behält aber Legacy-`modelOverride` und `providerOverride` bei. Gilt für native Plugin-Hooks und unterstützte, von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, Überschreibungen pro Lauf für `provider` und `model` bei Hintergrund-Subagent-Läufen anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Überschreibungen. Verwenden Sie `"*"` nur dann, wenn Sie absichtlich jedes Modell erlauben möchten.
- `plugins.entries.<id>.config`: vom Plugin definierte Konfigurationsobjekte (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Einstellungen des Firecrawl-Providers für Web-Fetch.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Env-Variable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Base-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout des Scrape-Requests in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: X Search-Provider aktivieren.
  - `model`: Grok-Modell für die Suche (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory Dreaming (experimentell). Siehe [Dreaming](/concepts/memory-dreaming) für Modi und Schwellenwerte.
  - `mode`: Preset für den Takt von Dreaming (`"off"`, `"core"`, `"rem"`, `"deep"`). Standard: `"off"`.
  - `cron`: optionale Überschreibung des Cron-Ausdrucks für den Dreaming-Zeitplan.
  - `timezone`: Zeitzone für die Auswertung des Zeitplans (fällt auf `agents.defaults.userTimezone` zurück).
  - `limit`: maximale Anzahl von Kandidaten, die pro Zyklus befördert werden.
  - `minScore`: minimaler gewichteter Score-Schwellenwert für die Beförderung.
  - `minRecallCount`: minimaler Schwellenwert für Recall-Anzahl.
  - `minUniqueQueries`: minimale Anzahl unterschiedlicher Abfragen.
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standardwerte aus `settings.json` beisteuern; OpenClaw wendet diese als bereinigte Agenteneinstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: aktive Memory-Plugin-ID auswählen oder `"none"` setzen, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: von der CLI verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle gegenüber manuellen Änderungen.

Siehe [Plugins](/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // Standard im Modell vertrauenswürdiges Netzwerk
      // allowPrivateNetwork: true, // Legacy-Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig `true`, wenn nicht gesetzt (Modell vertrauenswürdiges Netzwerk).
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` für strikte, nur öffentliche Browsernavigation.
- Im strikten Modus unterliegen Endpunkte `profiles.*.cdpUrl` für Remote-CDP denselben Blockierungen privater Netzwerke bei Reachability-/Discovery-Prüfungen.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen (start/stop/reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` selbst erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- `existing-session`-Profile sind nur für den Host und verwenden Chrome MCP statt CDP.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Beschränkungen des Chrome-MCP-Routings bei:
  snapshot-/ref-basierte Aktionen statt CSS-Selektor-Targeting, Hooks für das Hochladen einzelner Dateien, keine Überschreibungen für Dialog-Timeouts, kein `wait --load networkidle`, sowie kein `responsebody`, PDF-Export, Download-Interception oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für Remote-CDP.
- Reihenfolge der automatischen Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Service: nur loopback (Port wird von `gateway.port` abgeleitet, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergröße oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // Emoji, kurzer Text, Bild-URL oder Data-URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für das UI-Chrome der nativen App (Farbton der Talk-Mode-Bubble usw.).
- `assistant`: Überschreibung der Identität in der Control UI. Fällt auf die aktive Agentenidentität zurück.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // oder OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // für mode=trusted-proxy; siehe /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // erforderlich für nicht-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Origin-Fallback über Host-Header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Standard false.
    allowRealIpFallback: false,
    tools: {
      // Zusätzliche HTTP-Denies für /tools/invoke
      deny: ["browser"],
      // Tools aus der Standard-Deny-Liste für HTTP entfernen
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Details zu Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Das Gateway verweigert den Start, sofern nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Moduswerte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Der Standard-Bind `loopback` lauscht im Container auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt der Verkehr über `eth0`, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Binds außerhalb von loopback erfordern Gateway-Auth. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen Reverse-Proxy mit Identitätsbewusstsein und `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent generiert standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Startup- und Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und `mode` nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Auth. Nur für vertrauenswürdige lokale loopback-Setups verwenden; dies wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Auth an einen Reverse-Proxy mit Identitätsbewusstsein delegieren und Identitäts-Headern aus `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; gleichlokale loopback-Reverse-Proxys erfüllen trusted-proxy-Auth nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Identitäts-Header von Tailscale Serve Control UI/WebSocket-Auth erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierung. Gilt pro Client-IP und pro Auth-Scope (gemeinsame Secrets und Device-Tokens werden getrennt verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` serialisiert, bevor der Fehler geschrieben wird. Gleichzeitige fehlerhafte Versuche desselben Clients können den Limiter daher beim zweiten Request auslösen, statt dass beide als normale Fehlanpassungen durchrutschen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn auch localhost-Verkehr bewusst rate-limitiert werden soll (für Test-Setups oder strikte Proxy-Deployments).
- Browser-originierte WS-Auth-Versuche werden immer mit deaktivierter loopback-Ausnahme gedrosselt (Defense-in-Depth gegen browserbasierte localhost-Bruteforce-Angriffe).
- Auf loopback werden diese Sperren browser-originierter Versuche pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlversuche einer localhost-Origin nicht automatisch eine andere Origin aussperren.
- `tailscale.mode`: `serve` (nur Tailnet, loopback-bind) oder `funnel` (öffentlich, erfordert Auth).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-loopback-Origin aus erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der einen Origin-Fallback über den Host-Header für Deployments aktiviert, die absichtlich auf einer Host-Header-Origin-Richtlinie basieren.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitige Break-Glass-Überschreibung, die Klartext-`ws://` zu vertrauenswürdigen IPs privater Netzwerke erlaubt; Standard bleibt weiterhin nur loopback für Klartext.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für Remote-Clients. Sie konfigurieren Gateway-Auth nicht von selbst.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem diese relaygestützte Registrierungen an das Gateway veröffentlicht haben. Diese URL muss mit der in den iOS-Build kompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für Gateway-zu-Relay