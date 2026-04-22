---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione e comportamento di runtime di Slack (Socket Mode + URL di richiesta HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Stato: pronto per la produzione per DM + canali tramite integrazioni app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli URL di richiesta HTTP.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Slack usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (predefinita)">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona un workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) qui sotto e continua con la creazione
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato
      </Step>

      <Step title="Configura OpenClaw">

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

        Fallback env (solo account predefinito):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Avvia gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL di richiesta HTTP">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona un workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) e aggiorna gli URL prima della creazione
        - salva il **Signing Secret** per la verifica delle richieste
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato

      </Step>

      <Step title="Configura OpenClaw">

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
        Usa percorsi webhook univoci per HTTP multi-account

        Assegna a ogni account un `webhookPath` distinto (predefinito `/slack/events`) in modo che le registrazioni non vadano in conflitto.
        </Note>

      </Step>

      <Step title="Avvia gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist di manifest e scope

<Tabs>
  <Tab title="Socket Mode (predefinita)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
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
        "description": "Invia un messaggio a OpenClaw",
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

  <Tab title="URL di richiesta HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Connettore Slack per OpenClaw"
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
        "description": "Invia un messaggio a OpenClaw",
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

### Impostazioni aggiuntive del manifest

Espone funzionalità diverse che estendono i valori predefiniti sopra.

<AccordionGroup>
  <Accordion title="Slash commands nativi facoltativi">

    È possibile usare più [slash commands nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune particolarità:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non è possibile rendere disponibili più di 25 slash commands contemporaneamente.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predefinita)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Avvia una nuova sessione",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reimposta la sessione corrente"
      },
      {
        "command": "/compact",
        "description": "Compatta il contesto della sessione",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Interrompi l'esecuzione corrente"
      },
      {
        "command": "/session",
        "description": "Gestisci la scadenza del binding del thread",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Imposta il livello di pensiero",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Attiva o disattiva l'output verboso",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Mostra o imposta la modalità veloce",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Attiva o disattiva la visibilità del reasoning",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Attiva o disattiva la modalità elevata",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Mostra o imposta i valori predefiniti di exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Mostra o imposta il modello",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Elenca i provider o i modelli per un provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Mostra il riepilogo breve della guida"
      },
      {
        "command": "/commands",
        "description": "Mostra il catalogo dei comandi generato"
      },
      {
        "command": "/tools",
        "description": "Mostra cosa può usare in questo momento l'agente corrente",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Mostra lo stato di runtime, compreso l'uso/quota del provider quando disponibile"
      },
      {
        "command": "/tasks",
        "description": "Elenca le attività in background attive/recenti per la sessione corrente"
      },
      {
        "command": "/context",
        "description": "Spiega come viene assemblato il contesto",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Mostra la tua identità di mittente"
      },
      {
        "command": "/skill",
        "description": "Esegui una skill per nome",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Fai una domanda secondaria senza modificare il contesto della sessione",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Controlla il footer di utilizzo o mostra il riepilogo dei costi",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL di richiesta HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Avvia una nuova sessione",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Reimposta la sessione corrente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compatta il contesto della sessione",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Interrompi l'esecuzione corrente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Gestisci la scadenza del binding del thread",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Imposta il livello di pensiero",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Attiva o disattiva l'output verboso",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Mostra o imposta la modalità veloce",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Attiva o disattiva la visibilità del reasoning",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Attiva o disattiva la modalità elevata",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Mostra o imposta i valori predefiniti di exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Mostra o imposta il modello",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Elenca i provider o i modelli per un provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Mostra il riepilogo breve della guida",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Mostra il catalogo dei comandi generato",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Mostra cosa può usare in questo momento l'agente corrente",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Mostra lo stato di runtime, compreso l'uso/quota del provider quando disponibile",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Elenca le attività in background attive/recenti per la sessione corrente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Spiega come viene assemblato il contesto",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Mostra la tua identità di mittente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Esegui una skill per nome",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Fai una domanda secondaria senza modificare il contesto della sessione",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Controlla il footer di utilizzo o mostra il riepilogo dei costi",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Scope di authoring facoltativi (operazioni di scrittura)">
    Aggiungi lo scope bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Scope facoltativi del token utente (operazioni di lettura)">
    Se configuri `channels.slack.userToken`, gli scope di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se dipendi dalle letture della ricerca Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono richiesti per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  plaintext o oggetti SecretRef.
- I token di configurazione sovrascrivono il fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e usa per impostazione predefinita il comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dello snapshot di stato:

- L'ispezione dell'account Slack tiene traccia dei campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` oppure `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra origine di secret non inline, ma il percorso di comando/runtime corrente
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP è incluso `signingSecretStatus`; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture della directory, il token utente può essere preferito quando configurato. Per le scritture, il bot token resta preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il bot token non è disponibile.
</Tip>

## Azioni e limitazioni

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack correnti:

| Group      | Default |
| ---------- | ------- |
| messages   | abilitato |
| reactions  | abilitato |
| pins       | abilitato |
| memberInfo | abilitato |
| emojiList  | abilitato |

Le attuali azioni sui messaggi Slack includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Policy DM">
    `channels.slack.dmPolicy` controlla l'accesso ai DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (predefinito true)
    - `channels.slack.allowFrom` (preferito)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (i DM di gruppo sono false per impostazione predefinita)
    - `dm.groupChannels` (allowlist MPIM facoltativa)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.slack.accounts.default.allowFrom`.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Policy del canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    La allowlist dei canali si trova in `channels.slack.channels` e dovrebbe usare ID canale stabili.

    Nota di runtime: se `channels.slack` manca completamente (configurazione solo env), il runtime usa come fallback `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci della allowlist dei canali e della allowlist DM vengono risolte all'avvio quando l'accesso del token lo consente
    - le voci irrisolte del nome canale vengono mantenute come configurate ma ignorate per l'instradamento per impostazione predefinita
    - l'autorizzazione in ingresso e l'instradamento del canale usano per impostazione predefinita prima l'ID; la corrispondenza diretta di username/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menzioni e utenti del canale">
    I messaggi del canale sono limitati dalle menzioni per impostazione predefinita.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito dei thread reply-to-bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato della chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oppure wildcard `"*"`
      (le chiavi legacy senza prefisso continuano a essere mappate solo a `id:`)

  </Tab>
</Tabs>

## Threading, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- Con il valore predefinito `session.dmScope=main`, i DM Slack confluiscono nella sessione principale dell'agente.
- Sessioni del canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione del thread (`:thread:<threadTs>`) quando applicabile.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; quello di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati quando inizia una nuova sessione del thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando è `true`, sopprime le menzioni implicite nei thread così il bot risponde solo a menzioni esplicite `@bot` all'interno dei thread, anche quando il bot ha già partecipato al thread. Senza questo, le risposte in un thread a cui il bot ha partecipato bypassano la limitazione `requireMention`.

Controlli del threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per le chat dirette: `channels.slack.dm.replyToMode`

Sono supportati i tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` disabilita **tutto** il threading delle risposte in Slack, compresi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. La differenza riflette i modelli di threading delle piattaforme: i thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram restano visibili nel flusso principale della chat.

## Ack reactions

`ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (per esempio `"eyes"`).
- Usa `""` per disabilitare la reaction per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo di anteprima con l'ultimo output parziale.
- `block`: aggiunge aggiornamenti di anteprima suddivisi in blocchi.
- `progress`: mostra il testo di stato di avanzamento durante la generazione, poi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima draft è attiva, instrada gli aggiornamenti di tool/progress nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi separati di tool/progress.

`channels.slack.streaming.nativeTransport` controlla lo streaming di testo nativo di Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

- Deve essere disponibile un thread di risposta perché compaiano lo streaming di testo nativo e lo stato del thread assistant di Slack. La selezione del thread continua comunque a seguire `replyToMode`.
- Le radici di canali e chat di gruppo possono comunque usare la normale anteprima draft quando lo streaming nativo non è disponibile.
- I DM Slack di primo livello restano per impostazione predefinita fuori thread, quindi non mostrano l'anteprima in stile thread; usa risposte nei thread o `typingReaction` se vuoi un avanzamento visibile lì.
- I contenuti multimediali e i payload non testuali usano il fallback alla consegna normale.
- I finali media/error annullano le modifiche di anteprima in sospeso senza svuotare un draft temporaneo; i finali testo/blocco idonei vengono svuotati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw usa il fallback alla consegna normale per i payload rimanenti.

Usa l'anteprima draft invece dello streaming di testo nativo di Slack:

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

Chiavi legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) viene migrato automaticamente a `channels.slack.streaming.mode`.
- il booleano `channels.slack.streaming` viene migrato automaticamente a `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- il legacy `channels.slack.nativeStreaming` viene migrato automaticamente a `channels.slack.streaming.nativeTransport`.

## Fallback della typing reaction

`typingReaction` aggiunge una reaction temporanea al messaggio Slack in ingresso mentre OpenClaw sta elaborando una risposta, poi la rimuove quando l'esecuzione termina. È particolarmente utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "is typing...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (per esempio `"hourglass_flowing_sand"`).
- La reaction è best-effort e la pulizia viene tentata automaticamente dopo il completamento della risposta o del percorso di errore.

## Media, suddivisione in blocchi e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati file di Slack vengono scaricati da URL privati ospitati da Slack (flusso di richieste autenticate tramite token) e scritti nel media store quando il recupero riesce e i limiti di dimensione lo consentono.

    Il limite di dimensione in ingresso a runtime è `20MB` per impostazione predefinita, salvo override con `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione prima per paragrafi
    - gli invii di file usano le API di upload di Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline media
  </Accordion>

  <Accordion title="Target di consegna">
    Target espliciti consigliati:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack vengono aperti tramite le API di conversazione di Slack quando si invia a target utente.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento degli slash command

Gli slash command compaiono in Slack come un singolo comando configurato oppure come più comandi nativi. Configura `channels.slack.slashCommand` per cambiare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni aggiuntive del manifest](#additional-manifest-settings) nella tua app Slack e vengono abilitati con `channels.slack.commands.native: true` oppure `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi di Slack.

```txt
/help
```

I menu di argomenti nativi usano una strategia di rendering adattiva che mostra una finestra modale di conferma prima di inviare il valore dell'opzione selezionata:

- fino a 5 opzioni: blocchi pulsante
- 6-100 opzioni: menu static select
- più di 100 opzioni: external select con filtro asincrono delle opzioni quando sono disponibili gli handler delle opzioni di interattività
- limiti di Slack superati: i valori delle opzioni codificati usano il fallback ai pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e continuano comunque a instradare le esecuzioni dei comandi alla sessione della conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può eseguire il rendering di controlli interattivi di risposta creati dall'agente, ma questa funzionalità è disabilitata per impostazione predefinita.

Abilitala globalmente:

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

Oppure abilitala solo per un account Slack:

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

Quando è abilitata, gli agenti possono emettere direttive di risposta solo per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso esistente degli eventi di interazione Slack.

Note:

- Si tratta di UI specifica di Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superano i limiti di Slack Block Kit, OpenClaw usa il fallback alla risposta testuale originale invece di inviare un payload blocks non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti interattivi e interazioni, invece di usare il fallback alla Web UI o al terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo DM/canale.
- Le approvazioni Plugin possono comunque essere risolte tramite la stessa superficie di pulsanti nativi di Slack quando la richiesta arriva già in Slack e il tipo di id di approvazione è `plugin:`.
- L'autorizzazione degli approvatori viene comunque applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni della tua app Slack, i prompt di approvazione vengono renderizzati come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, sono la UX principale per l'approvazione; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato del tool dice che le
approvazioni in chat non sono disponibili o quando l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; usa come fallback `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato oppure è `"auto"` e viene risolto almeno un
approvatore. Imposta `enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo.
Imposta `enabled: true` per forzare l'attivazione delle approvazioni native quando gli approvatori vengono risolti.

Comportamento predefinito senza configurazione esplicita delle approvazioni exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione nativa esplicita di Slack è necessaria solo quando vuoi sovrascrivere gli approvatori, aggiungere filtri oppure
scegliere la consegna nella chat di origine:

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

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando i prompt di approvazione exec devono essere inoltrati anche
ad altre chat o a target espliciti fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi di Slack possono comunque risolvere le approvazioni plugin quando tali richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona in canali Slack e DM che supportano già i comandi. Vedi [Exec approvals](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi e i thread broadcast vengono mappati in eventi di sistema.
- Gli eventi di aggiunta/rimozione reaction vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita membri, creazione/rinomina canale e aggiunta/rimozione pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati topic/purpose del canale vengono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- Lo starter del thread e il seeding iniziale del contesto della cronologia del thread vengono filtrati dalle allowlist dei mittenti configurate quando applicabile.
- Le block action e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - block action: valori selezionati, etichette, valori picker e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradati e input del form

## Riferimenti alla configurazione

Riferimento principale:

- [Riferimento della configurazione - Slack](/it/gateway/configuration-reference#slack)

  Campi Slack ad alto segnale:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle di compatibilità: `dangerouslyAllowNameMatching` (break-glass; tienilo disattivato salvo necessità)
  - accesso al canale: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - ops/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, in ordine:

    - `groupPolicy`
    - allowlist del canale (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per canale

    Comandi utili:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messaggi DM ignorati">
    Controlla:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oppure il legacy `channels.slack.dm.policy`)
    - approvazioni di abbinamento / voci allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode non si connette">
    Verifica bot + app token e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` oppure
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non è riuscito a risolvere il valore
    supportato da SecretRef.

  </Accordion>

  <Accordion title="La modalità HTTP non riceve eventi">
    Verifica:

    - signing secret
    - percorso webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` univoco per ogni account HTTP

    Se `signingSecretStatus: "configured_unavailable"` appare negli snapshot
    dell'account, l'account HTTP è configurato ma il runtime corrente non è riuscito
    a risolvere il signing secret supportato da SecretRef.

  </Accordion>

  <Accordion title="I comandi nativi/slash non si attivano">
    Verifica se intendevi:

    - modalità comandi nativi (`channels.slack.commands.native: true`) con slash commands corrispondenti registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e le allowlist di canali/utenti.

  </Accordion>
</AccordionGroup>

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
- [Configurazione](/it/gateway/configuration)
- [Slash commands](/it/tools/slash-commands)
