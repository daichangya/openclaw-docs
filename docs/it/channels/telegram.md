---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto del bot Telegram, funzionalità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

Pronto per la produzione per DM bot e gruppi tramite grammY. Il long polling è la modalità predefinita; la modalità Webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è pairing.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Modelli ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e chatta con **@BotFather** (verifica che l'handle sia esattamente `@BotFather`).

    Esegui `/newbot`, segui le istruzioni e salva il token.

  </Step>

  <Step title="Configura token e policy DM">

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

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (solo account predefinito).
    Telegram **non** usa `openclaw channels login telegram`; configura il token in config/env, quindi avvia il gateway.

  </Step>

  <Step title="Avvia il gateway e approva il primo DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di associazione scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungi il bot a un gruppo">
    Aggiungi il bot al tuo gruppo, quindi imposta `channels.telegram.groups` e `groupPolicy` in modo che corrispondano al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori di configurazione hanno priorità sul fallback env e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità del gruppo">
    Per impostazione predefinita, i bot Telegram usano la **Modalità Privacy**, che limita i messaggi del gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi del gruppo, puoi:

    - disabilitare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando modifichi la modalità privacy, rimuovi e aggiungi di nuovo il bot in ogni gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Permessi del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, utile per un comportamento sempre attivo nei gruppi.

  </Accordion>

  <Accordion title="Opzioni utili di BotFather">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nel gruppo

  </Accordion>
</AccordionGroup>

## Controllo accessi e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai eseguito un aggiornamento e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist del pairing store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (ad esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso persistente nella configurazione (invece di dipendere da precedenti approvazioni di associazione).

    Confusione comune: l'approvazione dell'associazione DM non significa "questo mittente è autorizzato ovunque".
    L'associazione concede solo l'accesso DM. L'autorizzazione del mittente nei gruppi deriva comunque da allowlist esplicite nella configurazione.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Policy di gruppo e allowlist">
    Si applicano insieme due controlli:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli dell'ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci a `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per il filtro dei mittenti del gruppo. Se non è impostato, Telegram usa `allowFrom` come fallback.
    Le voci di `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` vengono normalizzati).
    Non inserire ID chat di gruppo o supergruppo Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Confine di sicurezza (`2026.2.25+`): l'autorizzazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing store DM.
    L'associazione resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram usa `allowFrom` della configurazione come fallback, non il pairing store.
    Modello pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione in `channels.telegram.groups`.
    Nota di runtime: se `channels.telegram` manca del tutto, il runtime usa come impostazione predefinita fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Esempio: consentire qualsiasi membro in uno specifico gruppo:

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

    Esempio: consentire solo utenti specifici all'interno di uno specifico gruppo:

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
      Errore comune: `groupAllowFrom` non è una allowlist dei gruppi Telegram.

      - Inserisci gli ID negativi dei gruppi o supergruppi Telegram come `-1001234567890` in `channels.telegram.groups`.
      - Inserisci gli ID utente Telegram come `8734062810` in `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione.

    La menzione può arrivare da:

    - menzione nativa `@botusername`, oppure
    - pattern di menzione in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Attivazioni a livello di sessione tramite comando:

    - `/activation always`
    - `/activation mention`

    Questi aggiornano solo lo stato della sessione. Usa la configurazione per la persistenza.

    Esempio di configurazione persistente:

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

    Ottenere l'ID della chat di gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` della Bot API

  </Tab>
</Tabs>

## Comportamento di runtime

- Telegram è gestito dal processo gateway.
- Il routing è deterministico: le risposte in entrata di Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in entrata vengono normalizzati nel contenitore condiviso del canale con metadati di risposta e placeholder per i media.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic del forum aggiungono `:topic:<threadId>` per mantenere i topic isolati.
- I messaggi DM possono includere `message_thread_id`; OpenClaw li instrada con chiavi di sessione consapevoli del thread e preserva l'ID thread per le risposte.
- Il long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- Il long polling è protetto all'interno di ogni processo gateway in modo che solo un poller attivo possa usare un token bot alla volta. Se continui a vedere conflitti `getUpdates` 409, è probabile che un altro gateway OpenClaw, script o poller esterno stia usando lo stesso token.
- I riavvii del watchdog per long polling si attivano dopo 120 secondi senza liveness `getUpdates` completata per impostazione predefinita. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment continua a vedere falsi riavvii per stallo del polling durante operazioni di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- La Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima streaming live (modifiche ai messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisiti:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` viene mappato a `partial` su Telegram (compatibilità con la denominazione cross-channel)
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumento/progresso riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - i valori booleani legacy `channels.telegram.streamMode` e `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima dell'avanzamento degli strumenti sono le brevi righe "Working..." mostrate mentre gli strumenti sono in esecuzione, ad esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi delle patch. Telegram li mantiene abilitati per impostazione predefinita per allinearsi al comportamento rilasciato di OpenClaw da `v2026.4.22` in poi. Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento degli strumenti, imposta:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo quando vuoi disabilitare completamente le modifiche di anteprima Telegram. Usa `streaming.preview.toolProgress: false` quando vuoi solo disabilitare le righe di stato dell'avanzamento degli strumenti.

    Per risposte di solo testo:

    - DM: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale in posizione (nessun secondo messaggio)
    - gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale in posizione (nessun secondo messaggio)

    Per risposte complesse (ad esempio payload media), OpenClaw ricorre alla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming block. Quando lo streaming block è abilitato esplicitamente per Telegram, OpenClaw salta il flusso di anteprima per evitare il doppio streaming.

    Se il trasporto draft nativo non è disponibile/viene rifiutato, OpenClaw usa automaticamente `sendMessage` + `editMessageText` come fallback.

    Streaming del ragionamento solo per Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - la risposta finale viene inviata senza il testo del ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene reso come HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene sottoposto a escape per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw ritenta come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Impostazioni predefinite dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci personalizzate al menu dei comandi:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Crea un'immagine" },
      ],
    },
  },
}
```

    Regole:

    - i nomi vengono normalizzati (rimozione della `/` iniziale, minuscolo)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente il comportamento
    - i comandi di plugin/Skills possono comunque funzionare se digitati anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/dei plugin possono comunque essere registrati se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora troppo pieno dopo il trimming; riduci i comandi di plugin/Skills/personalizzati oppure disabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione del dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/scope)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione include un token bootstrap a breve durata. Il passaggio bootstrap integrato mantiene il token Node primario su `scopes: []`; qualsiasi token operator trasferito resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli degli scope bootstrap hanno prefisso di ruolo, quindi quella allowlist operator soddisfa solo le richieste operator; i ruoli non-operator richiedono comunque scope sotto il proprio prefisso di ruolo.

    Se un dispositivo ritenta con dettagli di autenticazione modificati (ad esempio ruolo/scope/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Esegui di nuovo `/pair pending` prima di approvare.

    Maggiori dettagli: [Associazione](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Pulsanti inline">
    Configura l'ambito della tastiera inline:

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

    Override per account:

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

    Ambiti:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predefinito)

    Il legacy `capabilities: ["inlineButtons"]` viene mappato a `inlineButtons: "all"`.

    Esempio di azione del messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Scegli un'opzione:",
  buttons: [
    [
      { text: "Sì", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Annulla", callback_data: "cancel" }],
  ],
}
```

    I clic sui callback vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni dei messaggi Telegram per agenti e automazione">
    Le azioni degli strumenti Telegram includono:

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` facoltativi)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` facoltativi)

    Le azioni dei messaggi del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii a runtime usano lo snapshot attivo di config/secrets (avvio/ricaricamento), quindi i percorsi di azione non eseguono una nuova risoluzione ad hoc di SecretRef per ogni invio.

    Semantica della rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l'azione
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic del forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione del topic aggiungono `:topic:<threadId>`
    - le risposte e l'indicatore di digitazione puntano al thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - l'invio dei messaggi omette `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci del topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo per topic e non viene ereditato dai valori predefiniti del gruppo.

    **Instradamento dell'agente per topic**: ogni topic può essere instradato a un agente diverso impostando `agentId` nella configurazione del topic. Questo fornisce a ciascun topic il proprio workspace, memoria e sessione isolati. Esempio:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topic generale → agente main
                "3": { agentId: "zu" },        // Topic sviluppo → agente zu
                "5": { agentId: "coder" }      // Revisione codice → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Ogni topic ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding persistente del topic ACP**: i topic del forum possono fissare sessioni harness ACP tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato dal topic come `-1001234567890:topic:42`). Attualmente limitato ai topic del forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa il topic corrente a una nuova sessione ACP; i messaggi successivi vengono instradati direttamente lì. OpenClaw fissa la conferma dello spawn nel topic. Richiede `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono il routing DM ma usano chiavi di sessione consapevoli del thread.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue tra note vocali e file audio.

    - predefinito: comportamento del file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale

    Esempio di azione del messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Messaggi video

    Telegram distingue tra file video e note video.

    Esempio di azione del messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Le note video non supportano didascalie; il testo del messaggio fornito viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in entrata:

    - WEBP statico: scaricato ed elaborato (placeholder `<media:sticker>`)
    - TGS animato: ignorato
    - WEBM video: ignorato

    Campi del contesto sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache degli sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una sola volta (quando possibile) e memorizzati in cache per ridurre le chiamate ripetute alla visione.

    Abilita le azioni sticker:

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

    Azione per inviare uno sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cerca negli sticker in cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "gatto che saluta",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` significa solo reazioni degli utenti ai messaggi inviati dal bot (best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione del topic generale del gruppo (`:topic:1`), non al topic esatto di origine

    `allowed_updates` per polling/Webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in entrata.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (ad esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Scritture di configurazione da eventi e comandi Telegram">
    Le scritture di configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione del gruppo (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l'abilitazione del comando)

    Disabilita:

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

  <Accordion title="Long polling vs Webhook">
    L'impostazione predefinita è il long polling. Per la modalità Webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; facoltativi `webhookPath`, `webhookHost`, `webhookPort` (predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    Il listener locale si collega a `127.0.0.1:8787`. Per l'ingresso pubblico, metti un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità Webhook convalida le protezioni della richiesta, il token segreto Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw poi elabora l'aggiornamento in modo asincrono attraverso gli stessi lane del bot per chat/per topic usati dal long polling, così i turni lenti dell'agente non bloccano l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, retry e target CLI">
    - `channels.telegram.textChunkLimit` ha come valore predefinito 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini dei paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in entrata e in uscita.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY).
    - `channels.telegram.pollingStallThresholdMs` ha come valore predefinito `120000`; regolalo tra `30000` e `600000` solo per falsi positivi di riavvio per stallo del polling.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` la disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - le allowlist Telegram controllano principalmente chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.
    - controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili.

    Il target di invio CLI può essere un ID chat numerico o un username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    I poll Telegram usano `openclaw message poll` e supportano i topic del forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag poll solo Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per i topic del forum (oppure usa un target `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o upload di media animati

    Gating delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii normali

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare i prompt nella chat o nel topic di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (usa come fallback gli ID proprietario numerici da `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La consegna nel canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/topic attendibili. Quando il prompt arriva in un topic del forum, OpenClaw preserva il topic per il prompt di approvazione e per il follow-up. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline richiedono anche che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID di approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni del plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                          |
| ----------------------------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore leggibile nella chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | numero (ms)       | `60000`     | Tempo minimo tra risposte di errore nella stessa chat. Previene spam di errori durante interruzioni. |

Sono supportati override per account, gruppo e topic (stessa ereditarietà delle altre chiavi di configurazione Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // sopprime gli errori in questo gruppo
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi di gruppo senza menzione">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire la piena visibilità.
      - BotFather: `/setprivacy` -> Disable
      - poi rimuovi e aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione si aspetta messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il carattere jolly `"*"` non può essere verificato per membership.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando esiste `channels.telegram.groups`, il gruppo deve essere elencato (o includere `"*"`)
    - verifica che il bot sia membro del gruppo
    - controlla i log: `openclaw logs --follow` per i motivi di skip

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o per nulla">

    - autorizza la tua identità mittente (pairing e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy di gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi di plugin/Skills/personalizzati o disabilita i menu nativi
    - `setMyCommands failed` con errori di rete/fetch di solito indica problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilità del polling o della rete">

    - Node 22+ + fetch/proxy personalizzati possono attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono `api.telegram.org` prima su IPv6; un'uscita IPv6 difettosa può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness long-poll completata per impostazione predefinita.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host continua a segnalare falsi riavvii per stallo del polling. Gli stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Su host VPS con uscita diretta/TLS instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa come predefiniti `autoSelectFamily=true` (eccetto WSL2) e `dnsResultOrder=ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte nell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per impostazione predefinita per i download dei media Telegram. Se un fake-IP o
      proxy trasparente attendibile riscrive `api.telegram.org` verso un altro
      indirizzo privato/interno/per uso speciale durante i download dei media, puoi aderire
      al bypass solo Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Lo stesso opt-in è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia
      inizialmente disattivato il flag pericoloso. I media Telegram già consentono l'intervallo benchmark RFC 2544 per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF dei media Telegram. Usalo solo per ambienti proxy attendibili controllati dall'operatore come Clash, Mihomo o Surge fake-IP routing quando sintetizzano risposte private o per uso speciale fuori dall'intervallo benchmark RFC 2544. Lascialo disattivato per il normale accesso Telegram sulla rete internet pubblica.
    </Warning>

    - Override d'ambiente (temporanei):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Convalida le risposte DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Altri aiuti: [Risoluzione dei problemi del canale](/it/channels/troubleshooting).

## Riferimento configurazione

Riferimento principale: [Riferimento configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram ad alto segnale">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/capacità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedenza multi-account: quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (oppure includi `channels.telegram.accounts.default`) per rendere esplicito il routing predefinito. Altrimenti OpenClaw usa come fallback il primo ID account normalizzato e `openclaw doctor` emette un avviso. Gli account con nome ereditano `channels.telegram.allowFrom` / `groupAllowFrom`, ma non i valori `accounts.default.*`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Telegram al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento della allowlist di gruppi e topic.
  </Card>
  <Card title="Instradamento del canale" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in entrata agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Instradamento multi-agent" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e topic agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel.
  </Card>
</CardGroup>
