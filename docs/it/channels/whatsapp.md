---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della inbox
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce una o più sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  chiedono di installare il Plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale Dev + checkout git: per impostazione predefinita usa il percorso locale del Plugin.
- Stable/Beta: per impostazione predefinita usa il pacchetto npm `@openclaw/whatsapp`.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita è pairing per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di ripristino.
  </Card>
  <Card title="Configurazione del gateway" icon="settings" href="/it/gateway/configuration">
    Modelli ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configura la policy di accesso WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Collega WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

    Per collegare una directory di autenticazione WhatsApp Web esistente/personalizzata prima del login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Avvia il gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approva la prima richiesta di pairing (se usi la modalità pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di pairing scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia, quando possibile, di eseguire WhatsApp su un numero separato. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche configurazioni con numero personale.)
</Note>

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di instradamento più chiari
    - minore probabilità di confusione con l'autochat

    Modello di policy minimo:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback con numero personale">
    L'onboarding supporta la modalità numero personale e scrive una baseline compatibile con l'autochat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    A runtime, le protezioni per l'autochat si basano sul numero self collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali di OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` comprime i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.

## Hook del Plugin e privacy

I messaggi WhatsApp in ingresso possono contenere contenuto personale dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette i payload degli hook `message_received` in ingresso ai Plugin
a meno che tu non faccia esplicitamente opt-in:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Puoi limitare l'opt-in a un solo account:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Abilitalo solo per Plugin di cui ti fidi per ricevere contenuto
e identificatori dei messaggi WhatsApp in ingresso.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno la precedenza rispetto ai valori predefiniti a livello di canale per quell'account.

    Dettagli del comportamento a runtime:

    - i pairing vengono persistiti nell'allow-store del canale e uniti a `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero self collegato è consentito per impostazione predefinita
    - OpenClaw non esegue mai automaticamente il pairing dei DM `fromMe` in uscita (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Policy di gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist dell'appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppo (`"*"` consentito)

    2. **Policy del mittente del gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: l'allowlist del mittente viene bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutto l'inbound di gruppo

    Fallback dell'allowlist del mittente:

    - se `groupAllowFrom` non è impostato, il runtime ricorre a `allowFrom` quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione per menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback della policy di gruppo a runtime è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - rilevamento implicito di risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - citazione/risposta soddisfa solo il controllo della menzione; **non** concede l'autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non presenti nell'allowlist vengono comunque bloccati anche se rispondono al messaggio di un utente presente nell'allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È protetto dal controllo owner.

  </Tab>
</Tabs>

## Comportamento con numero personale e autochat

Quando il numero self collegato è presente anche in `allowFrom`, si attivano le protezioni WhatsApp per l'autochat:

- salta le conferme di lettura per i turni di autochat
- ignora il comportamento di attivazione automatica con mention-JID che altrimenti invierebbe un ping a te stesso
- se `messages.responsePrefix` non è impostato, le risposte in autochat usano per impostazione predefinita `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope inbound + contesto di risposta">
    I messaggi WhatsApp in ingresso vengono racchiusi nell'envelope inbound condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Quando disponibili, vengono anche popolati i campi dei metadati della risposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder dei media ed estrazione di posizione/contatto">
    I messaggi inbound solo multimediali vengono normalizzati con placeholder come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    I contenuti posizione usano testo sintetico delle coordinate. Etichette/commenti di posizione e dettagli contact/vCard vengono resi come metadati non attendibili in blocchi delimitati, non come testo inline nel prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia del gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere messi in buffer e iniettati come contesto quando il bot viene infine attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Marcatori di iniezione:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Conferme di lettura">
    Le conferme di lettura sono abilitate per impostazione predefinita per i messaggi WhatsApp inbound accettati.

    Disabilita globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override per account:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    I turni di autochat saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite predefinito dei blocchi: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini dei paragrafi (righe vuote), poi ricorre a una suddivisione sicura per lunghezza
  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - i payload di risposta preservano `audioAsVoice`; WhatsApp invia i media audio come note vocali PTT di Baileys
    - l'audio non Ogg, incluso l'output MP3/WebM TTS di Microsoft Edge, viene transcodificato in Ogg/Opus prima della consegna PTT
    - l'audio Ogg/Opus nativo viene inviato con `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - la riproduzione GIF animata è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta multi-media
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali
  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media inbound: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media outbound: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti
    - in caso di errore nell'invio del media, il fallback del primo elemento invia un avviso testuale invece di eliminare la risposta in silenzio
  </Accordion>
</AccordionGroup>

## Citazione della risposta

WhatsApp supporta la citazione nativa delle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                         |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Non citare mai; invia come messaggio semplice                         |
| `"first"`   | Cita solo il primo blocco della risposta in uscita                    |
| `"all"`     | Cita ogni blocco della risposta in uscita                             |
| `"batched"` | Cita le risposte accodate in batch lasciando senza citazione le risposte immediate |

Il valore predefinito è `"off"`. Gli override per account usano `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Livello di reazione

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l'agente usa le reazioni emoji su WhatsApp:

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                      |
| ------------- | --------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | No              | No                           | Nessuna reazione                                |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (ricevuta pre-risposta)    |
| `"minimal"`   | Sì              | Sì (conservativo)            | Ack + reazioni dell'agente con linee guida conservative |
| `"extensive"` | Sì              | Sì (incoraggiato)            | Ack + reazioni dell'agente con linee guida incoraggianti |

Valore predefinito: `"minimal"`.

Gli override per account usano `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reazioni di conferma

WhatsApp supporta reazioni di ack immediate alla ricezione in ingresso tramite `channels.whatsapp.ackReaction`.
Le reazioni di ack sono controllate da `reactionLevel` — vengono soppresse quando `reactionLevel` è `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Note sul comportamento:

- inviate immediatamente dopo che il messaggio in ingresso è stato accettato (pre-risposta)
- gli errori vengono registrati ma non bloccano la normale consegna della risposta
- la modalità di gruppo `mentions` reagisce ai turni attivati da menzione; l'attivazione di gruppo `always` funge da bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (qui non viene usato il legacy `messages.ackReaction`)

## Multi-account e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e valori predefiniti">
    - gli id account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo id account configurato (ordinato)
    - gli id account vengono normalizzati internamente per la ricerca
  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso di autenticazione attuale: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'autenticazione predefinita legacy in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito
  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per quell'account.

    Nelle directory di autenticazione legacy, `oauth.json` viene preservato mentre i file di autenticazione Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Controlli delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita tramite `channels.whatsapp.configWrites=false`).

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Non collegato (QR richiesto)">
    Sintomo: lo stato del canale segnala che non è collegato.

    Correzione:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Collegato ma disconnesso / ciclo di riconnessione">
    Sintomo: account collegato con disconnessioni ripetute o tentativi di riconnessione.

    Correzione:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono immediatamente quando non esiste alcun listener gateway attivo per l'account di destinazione.

    Assicurati che il gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci dell'allowlist `groups`
    - controllo delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

Prima viene determinata la mappa `groups` effettiva: se l'account definisce il proprio `groups`, sostituisce completamente la mappa `groups` di root (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

Prima viene determinata la mappa `direct` effettiva: se l'account definisce il proprio `direct`, sostituisce completamente la mappa `direct` di root (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del diretto** (`direct["<peerId>"].systemPrompt`): usato quando la voce del peer specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Nota: `dms` resta il bucket leggero di override della cronologia per DM (`dms.<id>.historyLimit`); gli override dei prompt risiedono sotto `direct`.

**Differenza rispetto al comportamento multi-account di Telegram:** in Telegram, il `groups` di root viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account — anche per gli account che non definiscono alcun `groups` proprio — per evitare che un bot riceva messaggi di gruppo per gruppi di cui non fa parte. WhatsApp non applica questa protezione: `groups` di root e `direct` di root vengono sempre ereditati dagli account che non definiscono alcun override a livello account, indipendentemente da quanti account siano configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di fare affidamento sui valori predefiniti a livello root.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'allowlist di gruppo a livello chat. Sia a livello root sia a livello account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` di gruppo wildcard solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se invece vuoi che siano idonei solo un insieme fisso di id gruppo, non usare `groups["*"]` per il prompt predefinito. Ripeti invece il prompt in ogni voce di gruppo esplicitamente presente nell'allowlist.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che possono accedere alla gestione di gruppo, ma di per sé non autorizza tutti i mittenti in quei gruppi. L'accesso del mittente continua a essere controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita per la chat diretta dopo che un DM è già stato ammesso da `dmPolicy` più le regole di `allowFrom` o del pairing-store.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Usare solo se tutti i gruppi devono essere ammessi nell'ambito root.
        // Si applica a tutti gli account che non definiscono la propria mappa groups.
        "*": { systemPrompt: "Prompt predefinito per tutti i gruppi." },
      },
      direct: {
        // Si applica a tutti gli account che non definiscono la propria mappa direct.
        "*": { systemPrompt: "Prompt predefinito per tutte le chat dirette." },
      },
      accounts: {
        work: {
          groups: {
            // Questo account definisce il proprio groups, quindi i groups root sono
            // completamente sostituiti. Per mantenere un wildcard, definisci
            // esplicitamente anche "*" qui.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrati sulla gestione del progetto.",
            },
            // Usare solo se tutti i gruppi devono essere ammessi in questo account.
            "*": { systemPrompt: "Prompt predefinito per i gruppi di lavoro." },
          },
          direct: {
            // Questo account definisce la propria mappa direct, quindi le voci direct root sono
            // completamente sostituite. Per mantenere un wildcard, definisci
            // esplicitamente anche "*" qui.
            "+15551234567": { systemPrompt: "Prompt per una specifica chat diretta di lavoro." },
            "*": { systemPrompt: "Prompt predefinito per le chat dirette di lavoro." },
          },
        },
      },
    },
  },
}
```

## Puntatori al riferimento della configurazione

Riferimento principale:

- [Riferimento della configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
