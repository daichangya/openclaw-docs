---
read_when:
    - Konfigurieren eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, Mehrkonto)
    - Fehlerbehebung bei kanalspezifischen Konfigurationsschlüsseln
    - Prüfen von DM-Richtlinie, Gruppenrichtlinie oder Mention-Gating
summary: 'Kanalkonfiguration: Zugriffskontrolle, Pairing, kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und mehr'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-04-24T06:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Kanalspezifische Konfigurationsschlüssel unter `channels.*`. Behandelt DM- und Gruppenzugriff,
Mehrkonto-Setups, Mention-Gating und kanalspezifische Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen gebündelten Kanal-Plugins.

Für Agenten, Tools, Gateway-Laufzeit und andere Schlüssel auf oberster Ebene siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie        | Verhalten                                                      |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Eigentümer muss genehmigen |
| `allowlist`          | Nur Absender in `allowFrom` (oder im gepairten Allow-Store)    |
| `open`               | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)   |
| `disabled`           | Alle eingehenden DMs ignorieren                                |

| Gruppenrichtlinie      | Verhalten                                              |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Allowlist entsprechen |
| `open`                 | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`             | Alle Gruppen-/Raumnachrichten blockieren               |

<Note>
`channels.defaults.groupPolicy` setzt den Standardwert, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes verfallen nach 1 Stunde. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Laufzeit-Gruppenrichtlinie mit einer Startwarnung auf `allowlist` zurück (Fail-Closed).
</Note>

### Modellüberschreibungen pro Kanal

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung gilt, wenn eine Sitzung noch keine Modellüberschreibung hat (zum Beispiel über `/model` gesetzt).

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

### Kanal-Standards und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsames Verhalten bei Gruppenrichtlinien und Heartbeat über Provider hinweg:

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn eine providerseitige `groupPolicy` nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, schließt allen zitierten/Thread-/Verlaufskontext ein), `allowlist` (schließt nur Kontext von allowlisteten Absendern ein), `allowlist_quote` (wie allowlist, behält aber expliziten Zitat-/Antwortkontext bei). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.showAlerts`: Beeinträchtigte/Fehler-Status in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

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

<Accordion title="Mehrkonto-WhatsApp">

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
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Das veraltete Baileys-Auth-Verzeichnis für Einzelkonten wird von `openclaw doctor` nach `whatsapp/default` migriert.
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
          systemPrompt: "Antworten Sie kurz.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Bleiben Sie beim Thema.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (Standard: off; explizit aktivieren, um Ratenlimits bei Vorschau-Bearbeitungen zu vermeiden)
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
- Optional überschreibt `channels.telegram.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- In Mehrkonto-Setups (2+ Konto-IDs) setzen Sie ein explizites Standardkonto (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram ausgelöste Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Einträge auf oberster Ebene `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Foren-Topics (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben unter [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- Wiederholungsrichtlinie: siehe [Wiederholungsrichtlinie](/de/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
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
      replyToMode: "off", // off | first | all | batched
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
              systemPrompt: "Nur kurze Antworten.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress wird auf Discord zu partial abgebildet)
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Wiederholungs-/Richtlinieneinstellungen des Kontos stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellungsziele; unpräfixierte numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben und Leerzeichen werden durch `-` ersetzt; Kanal-Schlüssel verwenden den Slug-Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert threadgebundenes Discord-Routing:
  - `enabled`: Discord-Überschreibung für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/Weiterleitung)
  - `idleHours`: Discord-Überschreibung für automatisches Aufheben des Fokus bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für hartes Höchstalter in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung bei `sessions_spawn({ thread: true })`
- Einträge auf oberster Ebene `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben unter [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Komponenten-v2-Container.
- `channels.discord.voice` aktiviert Unterhaltungen in Discord-Sprachkanälen sowie optionale automatische Teilnahme + TTS-Überschreibungen.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- OpenClaw versucht zusätzlich eine Wiederherstellung des Sprachempfangs, indem es eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlässt und erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Veraltete Werte `streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet Laufzeitverfügbarkeit der Bot-Presence zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen für Statustext.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderlichen Name-/Tag-Abgleich erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Freigaben aktiviert, wenn Freigebende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt bei Weglassen auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Weglassen, um Freigaben für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Substring oder Regex).
  - `target`: wohin Freigabe-Prompts gesendet werden sollen. `"dm"` (Standard) sendet an DMs der Freigebenden, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn `target` `"channel"` enthält, sind Buttons nur für aufgelöste Freigebende verwendbar.
  - `cleanupAfterResolve`: wenn `true`, werden Freigabe-DMs nach Genehmigung, Ablehnung oder Timeout gelöscht.

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

- JSON des Dienstkontos: inline (`serviceAccount`) oder dateibasiert (`serviceAccountFile`).
- SecretRef für Dienstkonto wird ebenfalls unterstützt (`serviceAccountRef`).
- Env-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellungsziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert den veränderlichen Abgleich von E-Mail-Principals erneut (Break-Glass-Kompatibilitätsmodus).

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
          systemPrompt: "Nur kurze Antworten.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // Slack-native Streaming-API verwenden, wenn mode=partial
      },
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
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Zeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Zugangsdatenquelle/-status Felder wie `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus` bereit. `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den Secret-Wert aber nicht auflösen konnte.
- `configWrites: false` blockiert von Slack ausgelöste Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert Slacks nativen Streaming-Transport. Veraltete Werte `streamMode`, boolesche `streaming`-Werte und `nativeStreaming` werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellungsziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` ist pro Thread (Standard) oder über den Kanal geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack-native Streaming plus der Slack-Assistant-Stil „is typing...“ als Thread-Status erfordern ein Antwort-Thread-Ziel. DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, daher verwenden sie `typingReaction` oder normale Zustellung statt der Thread-Vorschau.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden. Gleiches Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise                 |
| ------------- | -------- | ------------------------ |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/Senden/Bearbeiten/Löschen |
| pins          | aktiviert | Anheften/Lösen/Auflisten |
| memberInfo    | aktiviert | Mitgliedsinformationen   |
| emojiList     | aktiviert | Liste benutzerdefinierter Emojis |

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

Chat-Modi: `oncall` (antwortet bei @-Mention, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss auf den OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server aus erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl zurückgegebenen Tokens authentifiziert,
  die Mattermost bei der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine
  Befehle aktiviert sind, lehnt OpenClaw Callbacks mit
  `Unauthorized: invalid command token.` ab.
- Für private/tailnet/interne Callback-Hosts kann Mattermost verlangen,
  dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/die Domain einschließt.
  Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Mention-Gating-Überschreibung pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.

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

- `channels.signal.account`: den Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: von Signal ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- Optional überschreibt `channels.signal.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (pluginbasiert, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, Gruppensteuerung und erweiterte Aktionen:
      // siehe /channels/bluebubbles
    },
  },
}
```

- Hier behandelte Core-Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Einträge auf oberster Ebene `bindings[]` mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen BlueBubbles-Handle oder eine Zielzeichenfolge (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist in [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Kein Daemon und kein Port erforderlich.

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

- Optional überschreibt `channels.imessage.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.

- Erfordert Vollzugriff auf die Messages-Datenbank.
- Bevorzugen Sie Ziele vom Typ `chat_id:<id>`. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, stellen Sie daher sicher, dass der Host-Key des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- Einträge auf oberster Ebene `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist pluginbasiert und wird unter `channels.matrix` konfiguriert.

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

- Token-Authentifizierung verwendet `accessToken`; Passwort-Authentifizierung verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Verkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und dieses Netzwerk-Opt-in sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt in Mehrkonto-Setups das bevorzugte Konto aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, sodass eingeladene Räume und neue DM-artige Einladungen ignoriert werden, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Freigaben und Autorisierung der Freigebenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Freigaben aktiviert, wenn Freigebende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Weglassen, um Freigaben für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Substring oder Regex).
  - `target`: wohin Freigabe-Prompts gesendet werden sollen. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs zu Sitzungen gruppiert werden: `per-user` (Standard) teilt nach weitergeleitetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprobes und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist pluginbasiert und wird unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, Webhook, Team-/Kanalrichtlinien:
      // siehe /channels/msteams
    },
  },
}
```

- Hier behandelte Core-Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Zugangsdaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/Kanal) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist pluginbasiert und wird unter `channels.irc` konfiguriert.

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

- Hier behandelte Core-Schlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optional überschreibt `channels.irc.defaultAccount` die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Mehrkonto (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jedes mit eigener `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primärer Bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts-Bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` wird verwendet, wenn `accountId` weggelassen wird (CLI + Routing).
- Env-Token gelten nur für das **Standard**konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten weiterzuleiten.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während noch eine top-level Einzelkonto-Kanalkonfiguration besteht, befördert OpenClaw zunächst kontobezogene top-level Einzelkontowerte in die Konto-Map des Kanals, sodass das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes/Standardziel beibehalten.
- Bestehende rein kanalbezogene Bindungen (ohne `accountId`) passen weiterhin auf das Standardkonto; kontobezogene Bindungen bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Formen, indem kontobezogene top-level Einzelkontowerte in das beförderte Konto verschoben werden, das für diesen Kanal gewählt wurde. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes/Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und in ihren eigenen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Mention-Gating im Gruppenchat

Gruppennachrichten erfordern standardmäßig **eine Mention** (Metadaten-Mention oder sichere Regex-Muster). Gilt für WhatsApp, Telegram, Discord, Google Chat und iMessage-Gruppenchats.

**Mention-Typen:**

- **Metadaten-Mentions**: Native Plattform-@-Mentions. Im WhatsApp-Self-Chat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Mention-Gating wird nur erzwungen, wenn Erkennung möglich ist (native Mentions oder mindestens ein Muster).

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

Auflösung: Überschreibung pro DM → Provider-Standard → kein Limit (alles wird behalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Self-Chat-Modus zu aktivieren (ignoriert native @-Mentions, antwortet nur auf Textmuster):

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

### Befehle (Behandlung von Chat-Befehlen)

```json5
{
  commands: {
    native: "auto", // native Befehle registrieren, wenn unterstützt
    nativeSkills: "auto", // native Skill-Befehle registrieren, wenn unterstützt
    text: true, // /commands in Chat-Nachrichten parsen
    bash: false, // ! erlauben (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config erlauben
    mcp: false, // /mcp erlauben
    plugins: false, // /plugins erlauben
    debug: false, // /debug erlauben
    restart: true, // /restart + Tool für Gateway-Neustart erlauben
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Befehlsdetails">

- Dieser Block konfiguriert Befehlsoberflächen. Für den aktuellen Katalog integrierter + gebündelter Befehle siehe [Slash Commands](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` und Talk `/voice` sind in ihren Kanal-/Plugin-Seiten sowie unter [Slash Commands](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen eigenständige Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack ausgeschaltet.
- `nativeSkills: "auto"` aktiviert native Skill-Befehle für Discord/Telegram und lässt Slack ausgeschaltet.
- Überschreibung pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- Überschreiben Sie die Registrierung nativer Skills pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für `chat.send`-Clients des Gateway erfordern persistente Schreibvorgänge über `/config set|unset` zusätzlich `operator.admin`; das schreibgeschützte `/config show` bleibt für normale Operator-Clients mit Schreibbereich weiterhin verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation und Steuerelemente zum Aktivieren/Deaktivieren.
- `channels.<provider>.configWrites` begrenzt Konfigurationsänderungen pro Kanal (Standard: true).
- Für Mehrkonto-Kanäle begrenzt `channels.<provider>.accounts.<id>.configWrites` außerdem Schreibvorgänge, die dieses Konto betreffen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Tool-Aktionen für Gateway-Neustart. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Allowlist für nur für den Eigentümer bestimmte Befehle/Tools. Sie ist getrennt von `allowFrom`.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` ist providerspezifisch. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt es Befehlen, Richtlinien für Zugriffsgruppen zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter + gebündelter Katalog: [Slash Commands](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Kanäle](/de/channels)
  - QQ-Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Memory-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel auf oberster Ebene
- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Kanalübersicht](/de/channels)
