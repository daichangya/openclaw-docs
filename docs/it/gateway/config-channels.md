---
read_when:
    - Configurazione di un Plugin di canale (autenticazione, controllo degli accessi, multi-account)
    - Risoluzione dei problemi delle chiavi di configurazione per canale
    - Verifica di criteri DM, criteri di gruppo o controllo delle menzioni
summary: 'Configurazione dei canali: controllo degli accessi, associazione, chiavi per canale in Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altro ancora'
title: Configurazione — canali
x-i18n:
    generated_at: "2026-04-25T13:46:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

Chiavi di configurazione per canale sotto `channels.*`. Copre accesso DM e di gruppo,
configurazioni multi-account, controllo delle menzioni e chiavi per canale per Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage e gli altri Plugin di canale inclusi.

Per agenti, strumenti, runtime del Gateway e altre chiavi di primo livello, vedi
[Riferimento della configurazione](/it/gateway/configuration-reference).

## Canali

Ogni canale si avvia automaticamente quando la sua sezione di configurazione esiste (a meno che `enabled: false`).

### Accesso DM e di gruppo

Tutti i canali supportano criteri DM e criteri di gruppo:

| Criterio DM         | Comportamento                                                    |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (predefinito) | I mittenti sconosciuti ricevono un codice di associazione monouso; il proprietario deve approvare |
| `allowlist`         | Solo i mittenti in `allowFrom` (o nello store di associazione consentita) |
| `open`              | Consente tutti i DM in entrata (richiede `allowFrom: ["*"]`)    |
| `disabled`          | Ignora tutti i DM in entrata                                    |

| Criterio di gruppo    | Comportamento                                           |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (predefinito) | Solo i gruppi che corrispondono alla lista di consentiti configurata |
| `open`                | Bypassa le liste di consentiti dei gruppi (il controllo delle menzioni si applica comunque) |
| `disabled`            | Blocca tutti i messaggi di gruppo/stanza                |

<Note>
`channels.defaults.groupPolicy` imposta il valore predefinito quando il `groupPolicy` di un provider non è impostato.
I codici di associazione scadono dopo 1 ora. Le richieste di associazione DM in sospeso sono limitate a **3 per canale**.
Se un blocco provider manca completamente (`channels.<provider>` assente), il criterio di gruppo del runtime usa come fallback `allowlist` (fail-closed) con un avviso all'avvio.
</Note>

### Override del modello per canale

Usa `channels.modelByChannel` per fissare ID canale specifici a un modello. I valori accettano `provider/model` o alias di modello configurati. La mappatura del canale si applica quando una sessione non ha già un override del modello (ad esempio impostato tramite `/model`).

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

### Valori predefiniti del canale e Heartbeat

Usa `channels.defaults` per il comportamento condiviso di criterio di gruppo e Heartbeat tra i provider:

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

- `channels.defaults.groupPolicy`: criterio di gruppo di fallback quando un `groupPolicy` a livello di provider non è impostato.
- `channels.defaults.contextVisibility`: modalità di visibilità del contesto supplementare predefinita per tutti i canali. Valori: `all` (predefinito, include tutto il contesto citato/thread/cronologia), `allowlist` (include solo il contesto da mittenti in lista di consentiti), `allowlist_quote` (come allowlist ma mantiene il contesto esplicito di citazione/risposta). Override per canale: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include gli stati dei canali sani nell'output Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: include gli stati degradati/di errore nell'output Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: visualizza un output Heartbeat compatto in stile indicatore.

### WhatsApp

WhatsApp funziona tramite il canale web del Gateway (Baileys Web). Si avvia automaticamente quando esiste una sessione collegata.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // spunte blu (false in modalità chat con sé stessi)
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

<Accordion title="WhatsApp multi-account">

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

- I comandi in uscita usano come predefinito l'account `default` se presente; altrimenti il primo id account configurato (ordinato).
- Facoltativamente `channels.whatsapp.defaultAccount` sovrascrive quella selezione dell'account predefinito di fallback quando corrisponde a un id account configurato.
- La vecchia directory di autenticazione Baileys single-account viene migrata da `openclaw doctor` in `whatsapp/default`.
- Override per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Mantieni le risposte brevi.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Rimani in tema.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Crea un'immagine" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (predefinito: off; attiva esplicitamente per evitare limiti di frequenza nelle modifiche dell'anteprima)
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

- Token bot: `channels.telegram.botToken` oppure `channels.telegram.tokenFile` (solo file regolari; i symlink vengono rifiutati), con `TELEGRAM_BOT_TOKEN` come fallback per l'account predefinito.
- Facoltativamente `channels.telegram.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- Nelle configurazioni multi-account (2+ id account), imposta un valore predefinito esplicito (`channels.telegram.defaultAccount` oppure `channels.telegram.accounts.default`) per evitare l'instradamento di fallback; `openclaw doctor` avvisa quando manca o non è valido.
- `configWrites: false` blocca le scritture di configurazione avviate da Telegram (migrazioni ID supergruppo, `/config set|unset`).
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per i topic del forum (usa il formato canonico `chatId:topic:topicId` in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- Le anteprime stream Telegram usano `sendMessage` + `editMessageText` (funziona in chat dirette e di gruppo).
- Criterio di retry: vedi [Criterio di retry](/it/concepts/retry).

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
              systemPrompt: "Solo risposte brevi.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress corrisponde a partial su Discord)
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
        spawnSubagentSessions: false, // opt-in per sessions_spawn({ thread: true })
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` come fallback per l'account predefinito.
- Le chiamate dirette in uscita che forniscono un `token` Discord esplicito usano quel token per la chiamata; le impostazioni di criterio/retry dell'account continuano a provenire dall'account selezionato nello snapshot runtime attivo.
- Facoltativamente `channels.discord.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- Usa `user:<id>` (DM) oppure `channel:<id>` (canale guild) per le destinazioni di consegna; gli ID numerici semplici vengono rifiutati.
- Gli slug delle guild sono in minuscolo con gli spazi sostituiti da `-`; le chiavi dei canali usano il nome trasformato in slug (senza `#`). Preferisci gli ID delle guild.
- I messaggi scritti dal bot vengono ignorati per impostazione predefinita. `allowBots: true` li abilita; usa `allowBots: "mentions"` per accettare solo i messaggi dei bot che menzionano il bot (i propri messaggi restano comunque filtrati).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (e gli override di canale) scarta i messaggi che menzionano un altro utente o ruolo ma non il bot (escludendo @everyone/@here).
- `maxLinesPerMessage` (predefinito 17) divide i messaggi alti anche quando restano sotto i 2000 caratteri.
- `channels.discord.threadBindings` controlla l'instradamento associato ai thread Discord:
  - `enabled`: override Discord per le funzionalità di sessione associate ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e consegna/instradamento associati)
  - `idleHours`: override Discord per l'auto-unfocus dovuto a inattività in ore (`0` disabilita)
  - `maxAgeHours`: override Discord per l'età massima rigida in ore (`0` disabilita)
  - `spawnSubagentSessions`: interruttore opt-in per la creazione/associazione automatica del thread con `sessions_spawn({ thread: true })`
- Le voci `bindings[]` di primo livello con `type: "acp"` configurano associazioni ACP persistenti per canali e thread (usa l'id del canale/thread in `match.peer.id`). La semantica dei campi è condivisa in [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` imposta il colore d'accento per i contenitori Discord components v2.
- `channels.discord.voice` abilita le conversazioni nei canali vocali Discord e gli override facoltativi di auto-join + LLM + TTS.
- `channels.discord.voice.model` sovrascrive facoltativamente il modello LLM usato per le risposte nei canali vocali Discord.
- `channels.discord.voice.daveEncryption` e `channels.discord.voice.decryptionFailureTolerance` vengono passati alle opzioni DAVE di `@discordjs/voice` (`true` e `24` per impostazione predefinita).
- OpenClaw tenta inoltre il recupero della ricezione vocale uscendo/rientrando in una sessione vocale dopo ripetuti errori di decifratura.
- `channels.discord.streaming` è la chiave canonica per la modalità di streaming. I valori legacy `streamMode` e booleani `streaming` vengono migrati automaticamente.
- `channels.discord.autoPresence` mappa la disponibilità runtime alla presenza del bot (healthy => online, degraded => idle, exhausted => dnd) e consente override facoltativi del testo di stato.
- `channels.discord.dangerouslyAllowNameMatching` riabilita la corrispondenza con nome/tag modificabili (modalità di compatibilità break-glass).
- `channels.discord.execApprovals`: consegna delle approvazioni exec nativa Discord e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` oppure `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Discord autorizzati ad approvare richieste exec. Se omesso, usa come fallback `commands.ownerAllowFrom`.
  - `agentFilter`: allowlist facoltativa di ID agente. Omettila per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiave sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito) invia ai DM degli approvatori, `"channel"` invia al canale di origine, `"both"` invia a entrambi. Quando il target include `"channel"`, i pulsanti possono essere usati solo dagli approvatori risolti.
  - `cleanupAfterResolve`: quando `true`, elimina i DM di approvazione dopo approvazione, rifiuto o timeout.

**Modalità di notifica delle reazioni:** `off` (nessuna), `own` (messaggi del bot, predefinito), `all` (tutti i messaggi), `allowlist` (da `guilds.<id>.users` su tutti i messaggi).

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

- JSON dell'account di servizio: inline (`serviceAccount`) oppure basato su file (`serviceAccountFile`).
- È supportato anche SecretRef dell'account di servizio (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` oppure `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` oppure `users/<userId>` per le destinazioni di consegna.
- `channels.googlechat.dangerouslyAllowNameMatching` riabilita la corrispondenza con principal email modificabili (modalità di compatibilità break-glass).

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
          systemPrompt: "Solo risposte brevi.",
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
        nativeTransport: true, // usa il trasporto streaming nativo Slack quando mode=partial
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

- **Modalità socket** richiede sia `botToken` sia `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` come fallback env dell'account predefinito).
- **Modalità HTTP** richiede `botToken` più `signingSecret` (alla radice o per account).
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in chiaro o oggetti SecretRef.
- Gli snapshot dell'account Slack espongono campi di origine/stato per credenziale come
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` e, in modalità HTTP,
  `signingSecretStatus`. `configured_unavailable` significa che l'account è
  configurato tramite SecretRef ma il percorso di comando/runtime corrente non ha potuto
  risolvere il valore del segreto.
- `configWrites: false` blocca le scritture di configurazione avviate da Slack.
- Facoltativamente `channels.slack.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- `channels.slack.streaming.mode` è la chiave canonica per la modalità di streaming Slack. `channels.slack.streaming.nativeTransport` controlla il trasporto streaming nativo di Slack. I valori legacy `streamMode`, booleani `streaming` e `nativeStreaming` vengono migrati automaticamente.
- Usa `user:<id>` (DM) oppure `channel:<id>` per le destinazioni di consegna.

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

**Isolamento della sessione thread:** `thread.historyScope` è per-thread (predefinito) oppure condiviso nel canale. `thread.inheritParent` copia la trascrizione del canale padre nei nuovi thread.

- Lo streaming nativo Slack più lo stato del thread in stile assistente Slack “sta scrivendo...” richiedono una destinazione di thread di risposta. I DM di primo livello restano fuori thread per impostazione predefinita, quindi usano `typingReaction` o la normale consegna invece dell'anteprima in stile thread.
- `typingReaction` aggiunge una reazione temporanea al messaggio Slack in entrata mentre una risposta è in esecuzione, poi la rimuove al completamento. Usa uno shortcode emoji Slack come `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: consegna delle approvazioni exec nativa Slack e autorizzazione degli approvatori. Stesso schema di Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID utente Slack), `agentFilter`, `sessionFilter` e `target` (`"dm"`, `"channel"` oppure `"both"`).

| Gruppo di azioni | Predefinito | Note                    |
| ---------------- | ----------- | ----------------------- |
| reactions        | abilitato   | Reagisci + elenca reazioni |
| messages         | abilitato   | Leggi/invia/modifica/elimina |
| pins             | abilitato   | Aggiungi/rimuovi/elenca pin |
| memberInfo       | abilitato   | Informazioni membro     |
| emojiList        | abilitato   | Elenco emoji personalizzate |

### Mattermost

Mattermost viene distribuito come Plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // URL esplicito facoltativo per distribuzioni reverse-proxy/pubbliche
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modalità chat: `oncall` (risponde a @-mention, predefinita), `onmessage` (ogni messaggio), `onchar` (messaggi che iniziano con il prefisso trigger).

Quando i comandi nativi Mattermost sono abilitati:

- `commands.callbackPath` deve essere un percorso (ad esempio `/api/channels/mattermost/command`), non un URL completo.
- `commands.callbackUrl` deve risolversi nell'endpoint Gateway OpenClaw ed essere raggiungibile dal server Mattermost.
- I callback slash nativi vengono autenticati con i token per comando restituiti
  da Mattermost durante la registrazione dei comandi slash. Se la registrazione fallisce o non
  vengono attivati comandi, OpenClaw rifiuta i callback con
  `Unauthorized: invalid command token.`
- Per host di callback privati/tailnet/interni, Mattermost può richiedere che
  `ServiceSettings.AllowedUntrustedInternalConnections` includa l'host/dominio del callback.
  Usa valori host/dominio, non URL completi.
- `channels.mattermost.configWrites`: consente o nega le scritture di configurazione avviate da Mattermost.
- `channels.mattermost.requireMention`: richiede `@mention` prima di rispondere nei canali.
- `channels.mattermost.groups.<channelId>.requireMention`: override del controllo delle menzioni per canale (`"*"` per il predefinito).
- Facoltativamente `channels.mattermost.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // associazione account facoltativa
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

**Modalità di notifica delle reazioni:** `off`, `own` (predefinito), `all`, `allowlist` (da `reactionAllowlist`).

- `channels.signal.account`: fissa l'avvio del canale a una specifica identità account Signal.
- `channels.signal.configWrites`: consente o nega le scritture di configurazione avviate da Signal.
- Facoltativamente `channels.signal.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

### BlueBubbles

BlueBubbles è il percorso iMessage consigliato (supportato da Plugin, configurato sotto `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, controlli di gruppo e azioni avanzate:
      // vedi /channels/bluebubbles
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Facoltativamente `channels.bluebubbles.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni BlueBubbles a sessioni ACP persistenti. Usa un handle o una stringa target BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).
- La configurazione completa del canale BlueBubbles è documentata in [BlueBubbles](/it/channels/bluebubbles).

### iMessage

OpenClaw avvia `imsg rpc` (JSON-RPC su stdio). Non è richiesto alcun daemon o porta.

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

- Facoltativamente `channels.imessage.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.

- Richiede Full Disk Access al DB di Messages.
- Preferisci destinazioni `chat_id:<id>`. Usa `imsg chats --limit 20` per elencare le chat.
- `cliPath` può puntare a un wrapper SSH; imposta `remoteHost` (`host` oppure `user@host`) per il recupero allegati tramite SCP.
- `attachmentRoots` e `remoteAttachmentRoots` limitano i percorsi degli allegati in entrata (predefinito: `/Users/*/Library/Messages/Attachments`).
- SCP usa il controllo rigoroso della chiave host, quindi assicurati che la chiave host del relay esista già in `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: consente o nega le scritture di configurazione avviate da iMessage.
- Le voci `bindings[]` di primo livello con `type: "acp"` possono associare conversazioni iMessage a sessioni ACP persistenti. Usa un handle normalizzato o una destinazione chat esplicita (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantica condivisa dei campi: [Agenti ACP](/it/tools/acp-agents#channel-specific-settings).

<Accordion title="Esempio di wrapper SSH per iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix è supportato da Plugin ed è configurato sotto `channels.matrix`.

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

- L'autenticazione tramite token usa `accessToken`; l'autenticazione tramite password usa `userId` + `password`.
- `channels.matrix.proxy` instrada il traffico HTTP Matrix tramite un proxy HTTP(S) esplicito. Gli account nominati possono sovrascriverlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` consente homeserver privati/interni. `proxy` e questo opt-in di rete sono controlli indipendenti.
- `channels.matrix.defaultAccount` seleziona l'account preferito nelle configurazioni multi-account.
- `channels.matrix.autoJoin` usa come predefinito `off`, quindi le stanze invitate e i nuovi inviti in stile DM vengono ignorati finché non imposti `autoJoin: "allowlist"` con `autoJoinAllowlist` oppure `autoJoin: "always"`.
- `channels.matrix.execApprovals`: consegna delle approvazioni exec nativa Matrix e autorizzazione degli approvatori.
  - `enabled`: `true`, `false` oppure `"auto"` (predefinito). In modalità auto, le approvazioni exec si attivano quando gli approvatori possono essere risolti da `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID utente Matrix (ad es. `@owner:example.org`) autorizzati ad approvare richieste exec.
  - `agentFilter`: allowlist facoltativa di ID agente. Omettila per inoltrare approvazioni per tutti gli agenti.
  - `sessionFilter`: pattern facoltativi di chiave sessione (sottostringa o regex).
  - `target`: dove inviare i prompt di approvazione. `"dm"` (predefinito), `"channel"` (stanza di origine) oppure `"both"`.
  - Override per account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controlla come i DM Matrix vengono raggruppati in sessioni: `per-user` (predefinito) condivide per peer instradato, mentre `per-room` isola ogni stanza DM.
- Le sonde di stato Matrix e le ricerche live nella directory usano lo stesso criterio proxy del traffico runtime.
- La configurazione completa di Matrix, le regole di targeting e gli esempi di configurazione sono documentati in [Matrix](/it/channels/matrix).

### Microsoft Teams

Microsoft Teams è supportato da Plugin ed è configurato sotto `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, criteri team/canale:
      // vedi /channels/msteams
    },
  },
}
```

- Percorsi chiave core trattati qui: `channels.msteams`, `channels.msteams.configWrites`.
- La configurazione completa di Teams (credenziali, webhook, criterio DM/gruppo, override per team/per canale) è documentata in [Microsoft Teams](/it/channels/msteams).

### IRC

IRC è supportato da Plugin ed è configurato sotto `channels.irc`.

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

- Percorsi chiave core trattati qui: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Facoltativamente `channels.irc.defaultAccount` sovrascrive la selezione dell'account predefinito quando corrisponde a un id account configurato.
- La configurazione completa del canale IRC (host/porta/TLS/canali/liste di consentiti/controllo delle menzioni) è documentata in [IRC](/it/channels/irc).

### Multi-account (tutti i canali)

Esegui più account per canale (ognuno con il proprio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot principale",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot avvisi",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` viene usato quando `accountId` è omesso (CLI + instradamento).
- I token env si applicano solo all'account **default**.
- Le impostazioni del canale base si applicano a tutti gli account salvo override per account.
- Usa `bindings[].match.accountId` per instradare ogni account verso un agente diverso.
- Se aggiungi un account non predefinito tramite `openclaw channels add` (o onboarding del canale) mentre sei ancora su una configurazione di canale top-level single-account, OpenClaw promuove prima i valori top-level single-account con ambito account nella mappa account del canale in modo che l'account originale continui a funzionare. La maggior parte dei canali li sposta in `channels.<channel>.accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita corrispondente esistente.
- Le associazioni esistenti solo-canale (senza `accountId`) continuano a corrispondere all'account predefinito; le associazioni con ambito account restano facoltative.
- `openclaw doctor --fix` ripara anche le forme miste spostando i valori top-level single-account con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali usa `accounts.default`; Matrix può invece preservare una destinazione nominata/predefinita corrispondente esistente.

### Altri canali Plugin

Molti canali Plugin sono configurati come `channels.<id>` e documentati nelle rispettive pagine di canale dedicate (ad esempio Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat e Twitch).
Vedi l'indice completo dei canali: [Canali](/it/channels).

### Controllo delle menzioni nelle chat di gruppo

I messaggi di gruppo usano come predefinito **richiedi menzione** (menzione nei metadati o pattern regex sicuri). Si applica alle chat di gruppo WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipi di menzione:**

- **Menzioni nei metadati**: @-mention nativi della piattaforma. Ignorate in modalità chat con sé stessi su WhatsApp.
- **Pattern di testo**: pattern regex sicuri in `agents.list[].groupChat.mentionPatterns`. I pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- Il controllo delle menzioni viene applicato solo quando il rilevamento è possibile (menzioni native o almeno un pattern).

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

`messages.groupChat.historyLimit` imposta il valore predefinito globale. I canali possono sovrascriverlo con `channels.<channel>.historyLimit` (o per account). Imposta `0` per disabilitarlo.

#### Limiti della cronologia DM

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

Risoluzione: override per-DM → predefinito provider → nessun limite (tutto conservato).

Supportati: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modalità chat con sé stessi

Includi il tuo numero in `allowFrom` per abilitare la modalità chat con sé stessi (ignora le @-mention native, risponde solo ai pattern di testo):

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

### Comandi (gestione dei comandi chat)

```json5
{
  commands: {
    native: "auto", // registra i comandi nativi quando supportati
    nativeSkills: "auto", // registra i comandi nativi delle Skills quando supportati
    text: true, // analizza i /comandi nei messaggi chat
    bash: false, // consenti ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // consenti /config
    mcp: false, // consenti /mcp
    plugins: false, // consenti /plugins
    debug: false, // consenti /debug
    restart: true, // consenti /restart + strumento riavvio gateway
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

<Accordion title="Dettagli dei comandi">

- Questo blocco configura le superfici dei comandi. Per il catalogo attuale dei comandi integrati + inclusi, vedi [Comandi slash](/it/tools/slash-commands).
- Questa pagina è un **riferimento delle chiavi di configurazione**, non il catalogo completo dei comandi. I comandi posseduti da canale/Plugin come QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memoria `/dreaming`, phone-control `/phone` e Talk `/voice` sono documentati nelle rispettive pagine di canale/Plugin e in [Comandi slash](/it/tools/slash-commands).
- I comandi testuali devono essere messaggi **autonomi** con `/` iniziale.
- `native: "auto"` attiva i comandi nativi per Discord/Telegram, lascia Slack disattivato.
- `nativeSkills: "auto"` attiva i comandi nativi delle Skills per Discord/Telegram, lascia Slack disattivato.
- Override per canale: `channels.discord.commands.native` (bool oppure `"auto"`). `false` cancella i comandi registrati in precedenza.
- Sovrascrivi la registrazione nativa delle Skills per canale con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` aggiunge voci extra al menu del bot Telegram.
- `bash: true` abilita `! <cmd>` per la shell host. Richiede `tools.elevated.enabled` e mittente in `tools.elevated.allowFrom.<channel>`.
- `config: true` abilita `/config` (legge/scrive `openclaw.json`). Per i client gateway `chat.send`, le scritture persistenti di `/config set|unset` richiedono anche `operator.admin`; il solo lettura `/config show` resta disponibile per i normali client operatore con ambito di scrittura.
- `mcp: true` abilita `/mcp` per la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`.
- `plugins: true` abilita `/plugins` per l'individuazione dei Plugin, l'installazione e i controlli di abilitazione/disabilitazione.
- `channels.<provider>.configWrites` regola le mutazioni di configurazione per canale (predefinito: true).
- Per i canali multi-account, anche `channels.<provider>.accounts.<id>.configWrites` regola le scritture che hanno come destinazione quell'account (ad esempio `/allowlist --config --account <id>` oppure `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` disabilita `/restart` e le azioni dello strumento di riavvio del Gateway. Predefinito: `true`.
- `ownerAllowFrom` è la lista di consentiti esplicita del proprietario per comandi/strumenti solo proprietario. È separata da `allowFrom`.
- `ownerDisplay: "hash"` esegue l'hash degli id del proprietario nel prompt di sistema. Imposta `ownerDisplaySecret` per controllare l'hash.
- `allowFrom` è per-provider. Quando è impostato, è l'**unica** fonte di autorizzazione (le liste di consentiti/l'associazione del canale e `useAccessGroups` vengono ignorati).
- `useAccessGroups: false` consente ai comandi di bypassare i criteri dei gruppi di accesso quando `allowFrom` non è impostato.
- Mappa della documentazione dei comandi:
  - catalogo integrato + incluso: [Comandi slash](/it/tools/slash-commands)
  - superfici dei comandi specifiche del canale: [Canali](/it/channels)
  - comandi QQ Bot: [QQ Bot](/it/channels/qqbot)
  - comandi di associazione: [Associazione](/it/channels/pairing)
  - comando card di LINE: [LINE](/it/channels/line)
  - dreaming della memoria: [Dreaming](/it/concepts/dreaming)

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Panoramica dei canali](/it/channels)
