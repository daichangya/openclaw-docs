---
read_when:
    - Du brauchst die genaue Semantik oder Standardwerte einzelner Konfigurationsfelder
    - Du validierst Kanal-, Modell-, Gateway- oder Tool-Konfigurationsblöcke
summary: Vollständige Referenz für jeden OpenClaw-Konfigurationsschlüssel, Standardwerte und Kanaleinstellungen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-07T06:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7768cb77e1d3fc483c66f655ea891d2c32f21b247e3c1a56a919b28a37f9b128
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Konfigurationsreferenz

Jedes Feld, das in `~/.openclaw/openclaw.json` verfügbar ist. Für einen aufgabenorientierten Überblick siehe [Konfiguration](/de/gateway/configuration).

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie       | Verhalten                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Sender erhalten einen einmaligen Pairing-Code; der Eigentümer muss genehmigen |
| `allowlist`         | Nur Sender in `allowFrom` (oder gepairter Allow-Store)         |
| `open`              | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)   |
| `disabled`          | Alle eingehenden DMs ignorieren                                |

| Gruppenrichtlinie     | Verhalten                                              |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (Standard) | Nur Gruppen zulassen, die der konfigurierten Zulassungsliste entsprechen |
| `open`                | Gruppen-Zulassungslisten umgehen (Mention-Gating gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren               |

<Note>
`channels.defaults.groupPolicy` setzt den Standardwert, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes verfallen nach 1 Stunde. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Laufzeit-Gruppenrichtlinie mit einer Startwarnung auf `allowlist` zurück (fail-closed).
</Note>

### Kanal-Modellüberschreibungen

Verwende `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung wird angewendet, wenn eine Sitzung noch keine Modellüberschreibung hat (zum Beispiel gesetzt über `/model`).

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

Verwende `channels.defaults` für gemeinsames Verhalten bei Gruppenrichtlinien und Heartbeats über Provider hinweg:

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn `groupPolicy` auf Provider-Ebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standard-Sichtbarkeitsmodus für ergänzenden Kontext für alle Kanäle. Werte: `all` (Standard, schließt allen zitierten/Thread-/Verlaufskontext ein), `allowlist` (schließt nur Kontext von Sendern der Zulassungsliste ein), `allowlist_quote` (wie allowlist, behält aber expliziten Zitat-/Antwortkontext bei). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gesunde Kanalstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.showAlerts`: degradierte/fehlerhafte Status in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.useIndicator`: kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateway (`Baileys Web`). Es startet automatisch, wenn eine verknüpfte Sitzung existiert.

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

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert).
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.
- Das Legacy-Authentifizierungsverzeichnis für ein einzelnes Baileys-Konto wird von `openclaw doctor` nach `whatsapp/default` migriert.
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
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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
- In Multi-Account-Setups (2+ Konto-IDs) setze einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwende das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik ist gemeinsam in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) dokumentiert.
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in direkten und Gruppen-Chats).
- Retry-Richtlinie: siehe [Retry policy](/de/concepts/retry).

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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` angeben, verwenden dieses Token für den Aufruf; Retry-/Richtlinieneinstellungen des Kontos kommen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.
- Verwende `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; nackte numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, Leerzeichen werden durch `-` ersetzt; Kanalschlüssel verwenden den geslugten Namen (ohne `#`). Bevorzuge Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwende `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle erwähnen, aber nicht den Bot (außer @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert threadgebundenes Routing in Discord:
  - `enabled`: Discord-Überschreibung für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/Weiterleitung)
  - `idleHours`: Discord-Überschreibung für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für harte Maximaldauer in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung durch `sessions_spawn({ thread: true })`
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Kanäle und Threads (verwende Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik ist gemeinsam in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) dokumentiert.
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Komponenten-v2-Container.
- `channels.discord.voice` aktiviert Discord-Voice-Channel-Unterhaltungen und optionale Auto-Join- + TTS-Überschreibungen.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (`true` und `24` standardmäßig).
- OpenClaw versucht zusätzlich, den Voice-Empfang wiederherzustellen, indem es eine Voice-Sitzung nach wiederholten Entschlüsselungsfehlern verlässt und erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Legacy-`streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet die Laufzeitverfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert wieder den Abgleich über veränderliche Namen/Tags (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von `exec`-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden `exec`-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die `exec`-Anfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn weggelassen.
  - `agentFilter`: optionale Zulassungsliste von Agent-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Substring oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmiger, `"channel"` an den ursprünglichen Kanal, `"both"` an beide. Wenn das Ziel `"channel"` einschließt, sind Buttons nur für aufgelöste Genehmiger verwendbar.
  - `cleanupAfterResolve`: wenn `true`, werden Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout gelöscht.

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
- Ein Service-Account-SecretRef wird ebenfalls unterstützt (`serviceAccountRef`).
- Umgebungs-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwende `spaces/<spaceId>` oder `users/<userId>` als Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert den Abgleich über veränderliche E-Mail-Principal-Namen wieder (Break-Glass-Kompatibilitätsmodus).

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
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
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

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` als Umgebungs-Fallback für das Standardkonto).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Berechtigungsnachweis Felder für Quelle/Status bereit, etwa `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den Secret-Wert aber nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.
- `channels.slack.streaming` ist der kanonische Schlüssel für den Stream-Modus. Legacy-`streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- Verwende `user:<id>` (DM) oder `channel:<id>` als Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Isolierung von Thread-Sitzungen:** `thread.historyScope` ist pro Thread (Standard) oder kanalweit geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- `typingReaction` fügt der eingehenden Slack-Nachricht während der Ausführung einer Antwort temporär eine Reaktion hinzu und entfernt sie nach Abschluss wieder. Verwende einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von `exec`-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise               |
| ------------- | -------- | ---------------------- |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/Senden/Bearbeiten/Löschen |
| pins          | aktiviert | Anheften/Lösen/Auflisten |
| memberInfo    | aktiviert | Mitgliedsinformationen |
| emojiList     | aktiviert | Benutzerdefinierte Emoji-Liste |

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
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (bei @-Erwähnung antworten, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit dem Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss auf den OpenClaw-Gateway-Endpunkt verweisen und vom Mattermost-Server aus erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl eindeutigen Tokens authentifiziert, die Mattermost bei der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert sind, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Für private/tailnet/interne Callback-Hosts kann Mattermost verlangen, dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Domain enthält. Verwende Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: vor Antworten in Kanälen eine `@mention` verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Mention-Gating-Überschreibung pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
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
- `channels.signal.configWrites`: von Signal initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Optional überschreibt `channels.signal.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (pluginbasiert, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwende einen BlueBubbles-Handle oder Ziel-String (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist in [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

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

- Optional überschreibt `channels.imessage.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.

- Erfordert vollen Festplattenzugriff auf die Messages-Datenbank.
- Bevorzuge Ziele im Format `chat_id:<id>`. Verwende `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setze `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung; stelle also sicher, dass der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwende einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist extension-basiert und wird unter `channels.matrix` konfiguriert.

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
- `channels.matrix.proxy` leitet Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und dieses Netzwerk-Opt-in sind voneinander unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Multi-Account-Setups.
- `channels.matrix.autoJoin` ist standardmäßig `off`, daher werden eingeladene Räume und neue DM-artige Einladungen ignoriert, bis du `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzt.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von `exec`-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden `exec`-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die `exec`-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Zulassungsliste von Agent-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Substring oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (ursprünglicher Raum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs zu Sitzungen gruppiert werden: `per-user` (Standard) teilt nach weitergeleitetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnis-Lookups verwenden dieselbe Proxy-Richtlinie wie der Laufzeitverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Setup-Beispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist extension-basiert und wird unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/pro Kanal) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist extension-basiert und wird unter `channels.irc` konfiguriert.

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
- Optional überschreibt `channels.irc.defaultAccount` die Auswahl des Standardkontos, wenn sie einer konfigurierten Konto-ID entspricht.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Zulassungslisten/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Multi-Account (alle Kanäle)

Führe mehrere Konten pro Kanal aus (jeweils mit eigener `accountId`):

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
- Umgebungs-Token gelten nur für das **Standard**konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwende `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn du über `openclaw channels add` (oder das Kanal-Onboarding) ein Nicht-Standardkonto hinzufügst, während du noch eine Top-Level-Kanalkonfiguration für ein einzelnes Konto verwendest, hebt OpenClaw zunächst die kontoabhängigen Top-Level-Werte in die Konto-Map des Kanals an, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes/default-Ziel beibehalten.
- Bestehende rein kanalbezogene Bindings (ohne `accountId`) passen weiterhin auf das Standardkonto; kontospezifische Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Strukturen, indem es kontoabhängige Top-Level-Werte für ein einzelnes Konto in das für diesen Kanal hochgestufte Konto verschiebt. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes/default-Ziel beibehalten.

### Andere Extension-Kanäle

Viele Extension-Kanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Channels](/de/channels).

### Mention-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig **eine Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für WhatsApp-, Telegram-, Discord-, Google-Chat- und iMessage-Gruppenchats.

**Mention-Typen:**

- **Metadaten-Erwähnungen**: native @-Erwähnungen der Plattform. Im WhatsApp-Self-Chat-Modus werden sie ignoriert.
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

`messages.groupChat.historyLimit` setzt den globalen Standardwert. Kanäle können ihn mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setze `0`, um ihn zu deaktivieren.

#### DM-Verlaufsgrenzen

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

Auflösung: Überschreibung pro DM → Provider-Standard → kein Limit (alles wird beibehalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Nimm deine eigene Nummer in `allowFrom` auf, um den Self-Chat-Modus zu aktivieren (ignoriert native @-Erwähnungen, antwortet nur auf Textmuster):

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
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
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
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack aus.
- Überschreibung pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Sender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge zusätzlich `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreibberechtigung verfügbar.
- `channels.<provider>.configWrites` steuert Konfigurationsmutationen pro Kanal (Standard: true).
- Bei Multi-Account-Kanälen steuert `channels.<provider>.accounts.<id>.configWrites` zusätzlich Schreibvorgänge, die dieses Konto betreffen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` gilt pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Zulassungslisten/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Zugriffsgruppenrichtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.

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

Optionaler Repository-Root, der in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw ihn automatisch, indem es vom Workspace aus nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Zulassungsliste für Skills für Agenten, die `agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // übernimmt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt defaults
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lasse `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu erlauben.
- Lasse `agents.list[].skills` weg, um die Standardwerte zu übernehmen.
- Setze `agents.list[].skills: []` für keine Skills.
- Eine nicht leere `agents.list[].skills`-Liste ist die endgültige Menge für diesen Agenten; sie wird nicht mit Standardwerten zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Bootstrap-Dateien für den Workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Bootstrap-Dateien des Workspace in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: sichere Fortsetzungszüge (nach einer abgeschlossenen Assistentenantwort) überspringen das erneute Einfügen des Workspace-Bootstraps und reduzieren so die Prompt-Größe. Heartbeat-Ausführungen und Wiederholungen nach Kompaktierung bauen den Kontext weiterhin neu auf.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Bootstrap-Datei des Workspace, bevor abgeschnitten wird. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtanzahl eingefügter Zeichen über alle Bootstrap-Dateien des Workspace hinweg. Standard: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert agentensichtbaren Warntext, wenn Bootstrap-Kontext abgeschnitten wird.
Standard: `"once"`.

- `"off"`: niemals Warntext in den System-Prompt einfügen.
- `"once"`: Warnung einmal pro eindeutiger Abschneidesignatur einfügen (empfohlen).
- `"always"`: Warnung bei jeder Ausführung einfügen, wenn Abschneidung vorhanden ist.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße der längsten Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren normalerweise den Einsatz von Vision-Tokens und die Größe des Anforderungs-Payloads bei screenshotlastigen Ausführungen.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext des System-Prompts (nicht für Zeitstempel von Nachrichten). Fällt auf die Zeitzone des Hosts zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (OS-Einstellung).

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
      params: { cacheRetention: "long" }, // global default provider params
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
  - Die String-Form setzt nur das primäre Modell.
  - Die Objekt-Form setzt primäres Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Tool-Pfad als Vision-Modellkonfiguration verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/standardmäßige Modell keine Bildeingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-1` für OpenAI Images.
  - Wenn du direkt ein `provider/model` auswählst, konfiguriere auch die passende Provider-Authentifizierung/API-Key (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*`, `FAL_KEY` für `fal/*`).
  - Wenn weggelassen, kann `image_generate` trotzdem einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem eingebauten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.5+`.
  - Wenn weggelassen, kann `music_generate` trotzdem einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn du direkt ein `provider/model` auswählst, konfiguriere auch die passende Provider-Authentifizierung/API-Key.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem eingebauten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn weggelassen, kann `video_generate` trotzdem einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn du direkt ein `provider/model` auswählst, konfiguriere auch die passende Provider-Authentifizierung/API-Key.
  - Der gebündelte Qwen-Provider für Videogenerierung unterstützt derzeit bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-spezifische Optionen für `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für das Modell-Routing verwendet.
  - Wenn weggelassen, fällt das PDF-Tool zunächst auf `imageModel`, dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs im `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: Standardmaximum an Seiten, das im Fallback-Extraktionsmodus des `pdf`-Tools berücksichtigt wird.
- `verboseDefault`: Standard-Verbose-Level für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standard-Level für erhöhte Ausgabe bei Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4`). Wenn du den Provider weglässt, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen Treffer bei konfigurierten Providern für genau diese Modell-ID und fällt erst dann auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher `provider/model` bevorzugen). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider/Modell zurück, statt einen veralteten, entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Zulassungsliste für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (providerspezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`) enthalten.
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setze sie unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- `params`-Zusammenführungspriorität (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, dann überschreibt `agents.list[].params` (passende Agent-ID) pro Schlüssel. Details siehe [Prompt Caching](/de/reference/prompt-caching).
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten vorhandene Fallback-Listen nach Möglichkeit.
- `maxConcurrent`: maximale Anzahl paralleler Agent-Ausführungen über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                |
| ------------------- | ------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`           |
| `sonnet`            | `anthropic/claude-sonnet-4-6`         |
| `gpt`               | `openai/gpt-5.4`                      |
| `gpt-mini`          | `openai/gpt-5.4-mini`                 |
| `gpt-nano`          | `openai/gpt-5.4-nano`                 |
| `gemini`            | `google/gemini-3.1-pro-preview`       |
| `gemini-flash`      | `google/gemini-3-flash-preview`       |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Deine konfigurierten Aliasse haben immer Vorrang vor Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren automatisch den Thinking-Modus, sofern du nicht `--thinking off` setzt oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definierst.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für das Streamen von Tool-Aufrufen. Setze `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für Text-only-Fallback-Ausführungen (ohne Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
- Bild-Durchreichung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.heartbeat`

Periodische Heartbeat-Ausführungen.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Auth) oder `1h` (OAuth-Auth). Setze `0m`, um es zu deaktivieren.
- `suppressToolErrorWarnings`: wenn true, werden Tool-Fehlerwarn-Payloads während Heartbeat-Ausführungen unterdrückt.
- `directPolicy`: Zustellrichtlinie für Direkt-/DM-Zustellung. `allow` (Standard) erlaubt Direktziel-Zustellung. `block` unterdrückt Direktziel-Zustellung und erzeugt `reason=dm-blocked`.
- `lightContext`: wenn true, verwenden Heartbeat-Ausführungen leichten Bootstrap-Kontext und behalten aus den Bootstrap-Dateien des Workspace nur `HEARTBEAT.md`.
- `isolatedSession`: wenn true, läuft jede Heartbeat-Ausführung in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Gleiches Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von ~100K auf ~2-5K Tokens.
- Pro Agent: setze `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Züge aus — kürzere Intervalle verbrauchen mehr Tokens.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send a brief notice when compaction starts (default: false)
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

- `mode`: `default` oder `safeguard` (chunkweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl von Sekunden, die eine einzelne Kompaktierungsoperation dauern darf, bevor OpenClaw sie abbricht. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Kompaktierungszusammenfassung eingebaute Anweisungen zum Erhalt opaker Identifikatoren voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Identifikatoren, der verwendet wird, wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale H2/H3-Abschnittsnamen aus AGENTS.md, die nach der Kompaktierung erneut eingefügt werden. Standard ist `["Session Startup", "Red Lines"]`; setze `[]`, um das erneute Einfügen zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` auch als Legacy-Fallback akzeptiert.
- `model`: optionale Überschreibung `provider/model-id` nur für die Kompaktierungszusammenfassung. Verwende dies, wenn die Hauptsitzung ein Modell behalten soll, Kompaktierungszusammenfassungen aber mit einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet die Kompaktierung das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, sendet beim Start der Kompaktierung eine kurze Benachrichtigung an den Benutzer (zum Beispiel „Compacting context...“). Standardmäßig deaktiviert, damit die Kompaktierung still bleibt.
- `memoryFlush`: stiller agentischer Zug vor automatischer Kompaktierung, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor sie an das LLM gesendet werden. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="Verhalten von cache-ttl">

- `mode: "cache-ttl"` aktiviert Pruning-Durchläufe.
- `ttl` steuert, wie oft Pruning erneut ausgeführt werden kann (nach dem letzten Cache-Touch).
- Pruning kürzt zuerst übergroße Tool-Ergebnisse weich und löscht danach bei Bedarf ältere Tool-Ergebnisse hart.

**Soft-Trim** behält Anfang + Ende bei und fügt `...` in der Mitte ein.

**Hard-Clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse sind zeichenbasiert (annähernd), keine exakten Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistenten-Nachrichten vorhanden sind, wird Pruning übersprungen.

</Accordion>

Siehe [Session Pruning](/de/concepts/session-pruning) für Verhaltensdetails.

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizites `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/de/concepts/streaming) für Verhalten + Chunking-Details.

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

Siehe [Typing Indicators](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionales Sandboxing für den eingebetteten Agenten. Die vollständige Anleitung findest du unter [Sandboxing](/de/gateway/sandboxing).

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
          // SecretRefs / inline contents also supported:
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

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische SSH-basierte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, wandern laufzeitspezifische Einstellungen nach `plugins.entries.openshell.config`.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absoluter Remote-Root für Workspaces pro Scope
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Optionen für die Host-Key-Richtlinie

**SSH-Authentifizierungspriorität:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-basierte `*Data`-Werte werden vor Start der Sandbox-Sitzung aus dem aktiven Secrets-Laufzeit-Snapshot aufgelöst

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Workspace einmal nach Erstellung oder Neuerstellung
- behält danach den Remote-SSH-Workspace als kanonisch bei
- leitet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Browser-Container in der Sandbox

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace lesend/schreibend unter `/workspace` eingehängt

**Scope:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: geteilter Container und Workspace (keine sitzungsübergreifende Isolation)

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
          policy: "strict", // optional OpenShell policy id
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

- `mirror`: seedet Remote aus lokal vor `exec`, synchronisiert nach `exec` zurück; lokaler Workspace bleibt kanonisch
- `remote`: seedet Remote einmal bei Erstellung der Sandbox und behält danach den Remote-Workspace als kanonisch

Im Modus `remote` werden hostlokale Bearbeitungen außerhalb von OpenClaw nach dem Seed-Schritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Lebenszyklus der Sandbox und optionale Mirror-Synchronisierung.

**`setupCommand`** läuft einmal nach der Erstellung des Containers (über `sh -lc`). Erfordert Netzwerk-Egress, beschreibbaren Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setze auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff braucht.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, außer du setzt ausdrücklich
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** bindet zusätzliche Host-Verzeichnisse ein; globale und agentenspezifische Binds werden zusammengeführt.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Observer-Zugriff über noVNC verwendet standardmäßig VNC-Authentifizierung, und OpenClaw erzeugt eine kurzlebige Token-URL (anstatt das Passwort in der gemeinsamen URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass sandboxed Sitzungen den Host-Browser ansprechen.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setze nur dann auf `bridge`, wenn du ausdrücklich globale Bridge-Konnektivität willst.
- `cdpSourceRange` beschränkt optional eingehenden CDP-Zugriff am Containerrand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` bindet zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (auch `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` und `--disable-gpu` sind standardmäßig aktiviert und können mit `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn WebGL/3D benötigt wird.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn dein Workflow davon abhängt.
  - `--renderer-process-limit=2` kann mit `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setze `0`, um das Standard-Prozesslimit von Chromium zu verwenden.
  - plus `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte sind die Basis des Container-Images; verwende ein benutzerdefiniertes Browser-Image mit eigenem Entrypoint, um die Container-Standardwerte zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind derzeit nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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

- `id`: stabile Agent-ID (erforderlich).
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (Warnung wird protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag Standard.
- `model`: String-Form überschreibt nur `primary`; Objektform `{ primary, fallbacks }` überschreibt beide (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, außer du setzt `fallbacks: []`.
- `params`: Provider-Parameter pro Agent, zusammengeführt über dem ausgewählten Modelleintrag in `agents.defaults.models`. Verwende dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skill-Zulassungsliste pro Agent. Wenn weggelassen, übernimmt der Agent `agents.defaults.skills`, falls gesetzt; eine explizite Liste ersetzt Standardwerte statt sie zusammenzuführen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionales Standard-Thinking-Level pro Agent (`off | minimal | low | medium | high | xhigh | adaptive`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standard-Sichtbarkeit von Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standardwert pro Agent für Fast Mode (`true | false`). Gilt, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwende `type: "acp"` mit `runtime.acp`-Standardwerten (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` von `emoji`, `mentionPatterns` von `name`/`emoji`.
- `subagents.allowAgents`: Zulassungsliste von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Guard für Sandbox-Vererbung: Wenn die anfragende Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `subagents.requireAgentId`: wenn true, blockiert `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führe mehrere isolierte Agenten innerhalb eines Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Binding-Match-Felder

- `type` (optional): `route` für normales Routing (fehlender Typ wird standardmäßig zu route), `acp` für persistente ACP-Konversations-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Stufe gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw nach exakter Konversationsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die obige Tier-Reihenfolge für Route-Bindings.

### Zugriffsprofile pro Agent

<Accordion title="Voller Zugriff (keine Sandbox)">

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

Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Priorität.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Gruppierungsstrategie für Sitzungen in Gruppenchats.
  - `per-sender` (Standard): jeder Sender erhält innerhalb eines Kanalkontexts eine isolierte Sitzung.
  - `global`: alle Teilnehmer in einem Kanalkontext teilen eine einzige Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: alle DMs teilen die Hauptsitzung.
  - `per-peer`: Isolation nach Sender-ID kanalübergreifend.
  - `per-channel-peer`: Isolation pro Kanal + Sender (empfohlen für Multi-User-Postfächer).
  - `per-account-channel-peer`: Isolation pro Konto + Kanal + Sender (empfohlen für Multi-Account).
- **`identityLinks`**: ordnet kanonische IDs providerpräfixierten Peers für sitzungsübergreifendes Teilen über Kanäle hinweg zu.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt zur lokalen Stunde `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beide konfiguriert sind, gewinnt die zuerst ablaufende Regel.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal erlaubte `totalTokens` der übergeordneten Sitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn `totalTokens` des Parents über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, statt den Transkriptverlauf des Parents zu übernehmen.
  - Setze `0`, um diesen Guard zu deaktivieren und Parent-Forking immer zu erlauben.
- **`mainKey`**: Legacy-Feld. Die Laufzeit verwendet jetzt immer `"main"` für den Haupt-Bucket direkter Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl von Antwort-Zügen zwischen Agenten bei Agent-zu-Agent-Austausch (Integer, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Ketten.
- **`sendPolicy`**: Match über `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Erste Ablehnung gewinnt.
- **`maintenance`**: Bereinigung + Aufbewahrungskontrolle des Sitzungsspeichers.
  - `mode`: `warn` erzeugt nur Warnungen; `enforce` wendet Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standard ist `pruneAfter`; setze `false`, um sie zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach Budget-Bereinigung. Standard ist `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatisches Entfokussieren bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standard für harte Maximaldauer in Stunden (`0` deaktiviert; Provider können überschreiben)

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
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

**Vorlagenvariablen:**

| Variable          | Beschreibung           | Beispiel                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kurzname des Modells   | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modell-ID | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name          | `anthropic`                 |
| `{thinkingLevel}` | Aktuelles Thinking-Level | `high`, `low`, `off`      |
| `{identity.name}` | Agenten-Identitätsname | (gleich wie `"auto"`)       |

Variablen sind nicht case-sensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Ack-Reaktion

- Standard ist das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setze `""`, um sie zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identity-Fallback.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt Ack nach der Antwort auf Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Reaktionen für Lebenszyklusstatus auf Slack, Discord und Telegram.
  Bei Slack und Discord bleiben Statusreaktionen bei nicht gesetztem Wert aktiviert, wenn Ack-Reaktionen aktiv sind.
  Bei Telegram musst du es explizit auf `true` setzen, um Reaktionen für Lebenszyklusstatus zu aktivieren.

### Inbound-Debounce

Fasst schnelle Nur-Text-Nachrichten desselben Senders zu einem einzigen Agent-Zug zusammen. Medien/Anhänge flushen sofort. Steuerbefehle umgehen das Debouncing.

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

- `auto` steuert Auto-TTS. `/tts off|always|inbound|tagged` überschreibt dies pro Sitzung.
- `summaryModel` überschreibt `agents.defaults.model.primary` für Auto-Zusammenfassungen.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Keys fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- `openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt zeigt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Validierung von Modell/Stimme.

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

- `talk.provider` muss zu einem Schlüssel in `talk.providers` passen, wenn mehrere Talk-Provider konfiguriert sind.
- Legacy-Flat-Keys für Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartext-Strings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Key konfiguriert ist.
- `providers.*.voiceAliases` erlaubt, dass Talk-Direktiven freundliche Namen verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Benutzerschweigen wartet, bevor das Transkript gesendet wird. Nicht gesetzt behält das plattformspezifische Standard-Pausenfenster bei (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Zulassungsliste vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn nichts gesetzt ist (vorhandene explizite Profile bleiben erhalten).

| Profil      | Enthält                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | nur `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | keine Einschränkung (wie nicht gesetzt)                                                                                        |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                     |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Alle eingebauten Tools (ohne Provider-Plugins)                                                                         |

### `tools.allow` / `tools.deny`

Globale Allow/Deny-Richtlinie für Tools (deny gewinnt). Nicht case-sensitiv, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox ausgeschaltet ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → allow/deny.

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

Steuert erhöhten `exec`-Zugriff außerhalb der Sandbox:

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

- Überschreibungen pro Agent (`agents.list[].tools.elevated`) können nur weiter einschränken.
- `/elevated on|off|ask|full` speichert Zustand pro Sitzung; Inline-Direktiven gelten nur für eine Nachricht.
- Erhöhtes `exec` umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel `node` ist).

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

Sicherheitsprüfungen für Tool-Schleifen sind standardmäßig **deaktiviert**. Setze `enabled: true`, um die Erkennung zu aktivieren.
Einstellungen können global unter `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

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

- `historySize`: maximale Historie von Tool-Aufrufen, die für die Schleifenanalyse gespeichert wird.
- `warningThreshold`: Schwellenwert für Warnungen bei wiederholten Mustern ohne Fortschritt.
- `criticalThreshold`: höherer Schwellenwert zum Blockieren kritischer Schleifen.
- `globalCircuitBreakerThreshold`: harte Stopp-Schwelle für jede Ausführung ohne Fortschritt.
- `detectors.genericRepeat`: warnt bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
- `detectors.knownPollNoProgress`: warnt/blockiert bei bekannten Poll-Tools (`process.poll`, `command_status` usw.).
- `detectors.pingPong`: warnt/blockiert bei alternierenden Paarmustern ohne Fortschritt.
- Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold`, schlägt die Validierung fehl.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
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

<Accordion title="Felder für Medieneinträge">

**Provider-Eintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Überschreibung der Modell-ID
- `profile` / `preferredProfile`: Auswahl des Profils aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführende Datei
- `args`: templatisierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
- Fehlschläge fallen auf den nächsten Eintrag zurück.

Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone Aufgaben von `music_generate` und `video_generate` zuerst direkte Kanalzustellung. Standard: `false` (Legacy-Pfad über Anforderer-Sitzungs-Wake/Modell-Zustellung).

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

Steuert, welche Sitzungen durch die Sitzungs-Tools (`sessions_list`, `sessions_history`, `sessions_send`) angesprochen werden können.

Standard: `tree` (aktuelle Sitzung + von ihr erzeugte Sitzungen, etwa Subagents).

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
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung erzeugte Sitzungen (Subagents).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn du Per-Sender-Sitzungen unter derselben Agent-ID ausführst).
- `all`: jede Sitzung. Kanalübergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Klammer: wenn die aktuelle Sitzung sandboxed ist und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gilt, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Transkriptpersistenz entfernt.
- Base64-Eingaben werden mit strikter Prüfung von Alphabet/Padding und einer Größenkontrolle vor dem Dekodieren validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true`.

### `tools.experimental`

Experimentelle Flags für eingebaute Tools. Standardmäßig aus, sofern keine laufzeitspezifische Auto-Aktivierungsregel greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Hinweise:

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht trivialer mehrstufiger Arbeit.
- Standard: `false` für Nicht-OpenAI-Provider. OpenAI- und OpenAI-Codex-Ausführungen aktivieren es automatisch.
- Wenn aktiviert, ergänzt der System-Prompt auch Verwendungshinweise, damit das Modell es nur für substanzielle Arbeit verwendet und höchstens einen Schritt mit `in_progress` behält.

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

- `model`: Standardmodell für gestartete Sub-Agents. Wenn nicht gesetzt, übernehmen Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Zulassungsliste für Ziel-Agent-IDs bei `sessions_spawn`, wenn der anfragende Agent keine eigene `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` nicht angibt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Sub-Agent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Base-URLs

OpenClaw verwendet den eingebauten Modellkatalog. Füge benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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

- Verwende `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
- Überschreibe den Agent-Konfigurations-Root mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Alias für Umgebungsvariablen).
- Merge-Priorität für übereinstimmende Provider-IDs:
  - Nicht leere `baseUrl`-Werte in Agent-`models.json` haben Vorrang.
  - Nicht leere `apiKey`-Werte im Agenten haben nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profile-Kontext nicht über SecretRef verwaltet wird.
  - SecretRef-verwaltete `apiKey`-Werte eines Providers werden aus Quellmarkierungen aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für File-/Exec-Refs), statt aufgelöste Secrets zu persistieren.
  - SecretRef-verwaltete Header-Werte eines Providers werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für File-/Exec-Refs).
  - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
  - Übereinstimmende Modellwerte für `contextWindow`/`maxTokens` verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
  - Übereinstimmende Modellwerte für `contextTokens` behalten ein explizites Runtime-Limit bei, wenn vorhanden; verwende es, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwende `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Die Persistenz von Markierungen ist quellautoritätstreu: Markierungen werden aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID geschlüsselt.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Provider-Berechtigungsnachweis (SecretRef/Env-Substitution bevorzugen).
- `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions` `options.num_ctx` in Requests injizieren (Standard: `true`).
- `models.providers.*.authHeader`: Übertragung des Berechtigungsnachweises im `Authorization`-Header erzwingen, wenn erforderlich.
- `models.providers.*.baseUrl`: Base-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transportüberschreibungen für HTTP-Requests an Modell-Provider.
  - `request.headers`: zusätzliche Header (werden mit Provider-Standardwerten zusammengeführt). Werte akzeptieren SecretRef.
  - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (eingebaute Provider-Auth verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (verwende `HTTP_PROXY`/`HTTPS_PROXY`-Umgebungsvariablen), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: explizite Provider-Modellkatalogeinträge.
- `models.providers.*.models.*.contextWindow`: Metadaten des nativen Kontextfensters des Modells.
- `models.providers.*.models.*.contextTokens`: optionales Laufzeitlimit für den Kontext. Verwende dies, wenn du ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchtest.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: Root für Einstellungen der automatischen Bedrock-Erkennung.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Erkennung.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für die Aktualisierung der Erkennung.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabetokens erkannter Modelle.

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

Verwende `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für Z.AI direct.

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

Setze `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwende `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Kurzform: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

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

Setze `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliasse akzeptiert. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definiere einen benutzerdefinierten Provider mit der Base-URL-Überschreibung.

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

Native Moonshot-Endpunkte geben Streaming-Nutzungskompatibilität auf dem gemeinsamen Transport `openai-completions` an, und OpenClaw richtet das nun anhand der Endpunktfähigkeiten aus, nicht allein nach der eingebauten Provider-ID.

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

Base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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

Setze `MINIMAX_API_KEY`. Kurzformen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet jetzt standardmäßig nur noch M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw Thinking für MiniMax standardmäßig, es sei denn, du setzt `thinking` ausdrücklich selbst. `/fast on` oder `params.fastMode: true` schreiben `MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Local Models](/de/gateway/local-models). Kurzfassung: Führe ein großes lokales Modell über die LM Studio Responses API auf leistungsstarker Hardware aus; halte gehostete Modelle als zusammengeführten Fallback bereit.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Zulassungsliste nur für gebündelte Skills (verwaltete/Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn true, werden bei verfügbarem `brew` Homebrew-Installer bevorzugt, bevor auf andere Installer-Arten zurückgefallen wird.
- `install.nodeManager`: bevorzugter Node-Installer für `metadata.openclaw.install`-Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, auch wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Umgebungsvariable deklarieren (Klartext-String oder SecretRef-Objekt).

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
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Zulassungsliste (nur aufgeführte Plugins werden geladen). `deny` gewinnt.
- `plugins.entries.<id>.apiKey`: Komfortfeld auf Plugin-Ebene für API-Keys (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: pluginbezogene Env-Var-Map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert promptmutierende Felder aus Legacy-`before_agent_start`, behält aber Legacy-`modelOverride` und `providerOverride` bei. Gilt für native Plugin-Hooks und unterstützte Hook-Verzeichnisse aus Bundles.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin ausdrücklich vertrauen, pro Ausführung Überschreibungen für `provider` und `model` bei Hintergrund-Subagent-Ausführungen anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Zulassungsliste kanonischer `provider/model`-Ziele für vertrauenswürdige Subagent-Überschreibungen. Verwende `"*"` nur, wenn du bewusst jedes Modell zulassen willst.
- `plugins.entries.<id>.config`: plugindefiniertes Konfigurationsobjekt (validiert gegen das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Einstellungen des Firecrawl-Web-Fetch-Providers.
  - `apiKey`: Firecrawl-API-Key (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Umgebungsvariable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Base-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout in Sekunden für Scrape-Anfragen (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: aktiviert den X-Search-Provider.
  - `model`: zu verwendendes Grok-Modell für die Suche (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory Dreaming (experimentell). Phasen und Schwellenwerte siehe [Dreaming](/de/concepts/dreaming).
  - `enabled`: globaler Schalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Takt für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standardwerte aus `settings.json` beisteuern; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: wähle die aktive Memory-Plugin-ID oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: wähle die aktive Context-Engine-Plugin-ID; standardmäßig `"legacy"`, bis du eine andere Engine installierst und auswählst.
- `plugins.installs`: CLI-verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandle `plugins.installs.*` als verwalteten Zustand; bevorzuge CLI-Befehle statt manueller Bearbeitung.

Siehe [Plugins](/de/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig `true`, wenn nicht gesetzt (Trusted-Network-Modell).
- Setze `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` für strikte Browser-Navigation nur über öffentliche Netzwerke.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Reachability-/Discovery-Prüfungen derselben Sperre für private Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Im strikten Modus verwende `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anbinden (start/stop/reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwende HTTP(S), wenn OpenClaw `/json/version` entdecken soll; verwende WS(S), wenn dein Provider dir eine direkte DevTools-WebSocket-URL gibt.
- `existing-session`-Profile sind nur für den Host und verwenden Chrome MCP statt CDP.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes Chromium-basiertes Browser-Profil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Routenlimits von Chrome MCP:
  snapshot-/ref-basierte Aktionen statt CSS-Selektor-Targeting, Hooks für Datei-Upload nur für eine Datei, keine Dialog-Timeout-Überschreibungen, kein `wait --load networkidle` sowie kein `responsebody`, kein PDF-Export, keine Download-Abfangung und keine Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setze `cdpUrl` nur explizit für Remote-CDP.
- Reihenfolge der Auto-Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Service: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel `--disable-gpu`, Fenstergrößen oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für nativen App-UI-Chrome (Tönung der Talk-Mode-Blase usw.).
- `assistant`: Identity-Überschreibung für die Control UI. Fällt auf die Identity des aktiven Agenten zurück.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

- `mode`: `local` (Gateway ausführen) oder `remote` (zu Remote-Gateway verbinden). Das Gateway verweigert den Start, wenn nicht `local`.
- `port`: einzelner gemultiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: verwende Werte des Bind-Modus in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), keine Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Der Standard-Bind `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Mit Docker-Bridge-Networking (`-p 18789:18789`) kommt der Verkehr auf `eth0` an, daher ist das Gateway nicht erreichbar. Verwende `--network host` oder setze `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identity-aware Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Wizard erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setze `gateway.auth.mode` explizit auf `token` oder `password`. Start sowie Installations-/Reparaturflüsse des Services schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale Loopback-Setups verwenden; dies wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: delegiert Authentifizierung an einen identity-aware Reverse Proxy und vertraut Identitäts-Headern von `gateway.trustedProxies` (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; same-host-Loopback-Reverse-Proxys erfüllen Trusted-Proxy-Auth nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway. Dieser tokenlose Fluss setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierungsversuche. Gilt pro Client-IP und pro Auth-Scope (Shared Secret und Device Token werden unabhängig verfolgt). Blockierte Versuche liefern `429` + `Retry-After`.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können den Limiter daher bereits bei der zweiten Anfrage auslösen, statt dass beide als normale Mismatches durchrutschen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setze `false`, wenn du localhost-Verkehr bewusst ebenfalls ratenbegrenzt haben willst (für Test-Setups oder strikte Proxy-Deployments).
- Browser-originierte WS-Auth-Versuche werden immer mit deaktivierter Loopback-Ausnahme gedrosselt (Defense in Depth gegen browserbasierte Brute-Force-Angriffe auf localhost).
- Auf Loopback werden diese Lockouts für browser-originierte Versuche pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlschläge von einem localhost-Origin nicht automatisch einen anderen Origin aussperren.
- `tailscale.mode`: `serve` (nur Tailnet, loopback bind) oder `funnel