---
read_when:
    - Configurazione di Mattermost
    - Debug del routing di Mattermost
summary: Configurazione del bot Mattermost e configurazione di OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Stato: plugin incluso (token bot + eventi WebSocket). Sono supportati canali, gruppi e messaggi diretti.
Mattermost è una piattaforma di messaggistica per team self-hostable; consulta il sito ufficiale su
[mattermost.com](https://mattermost.com) per dettagli sul prodotto e download.

## Plugin incluso

Mattermost è distribuito come plugin incluso nelle versioni correnti di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se stai usando una build meno recente o un'installazione personalizzata che esclude Mattermost,
installalo manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Assicurati che il plugin Mattermost sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account bot Mattermost e copia il **token bot**.
3. Copia l'**URL di base** di Mattermost (ad esempio, `https://chat.example.com`).
4. Configura OpenClaw e avvia il Gateway.

Configurazione minima:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Comandi slash nativi

I comandi slash nativi sono opt-in. Quando abilitati, OpenClaw registra i comandi slash `oc_*` tramite
l'API Mattermost e riceve callback POST sul server HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Usa questa opzione quando Mattermost non può raggiungere direttamente il gateway (reverse proxy/URL pubblico).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Note:

- `native: "auto"` è disabilitato per impostazione predefinita per Mattermost. Imposta `native: true` per abilitarlo.
- Se `callbackUrl` viene omesso, OpenClaw ne deriva uno da host/porta del gateway + `callbackPath`.
- Per configurazioni multi-account, `commands` può essere impostato al livello superiore o sotto
  `channels.mattermost.accounts.<id>.commands` (i valori dell'account sovrascrivono i campi di livello superiore).
- I callback dei comandi vengono convalidati con i token per comando restituiti da
  Mattermost quando OpenClaw registra i comandi `oc_*`.
- I callback slash falliscono in modalità closed quando la registrazione non è riuscita, l'avvio è stato parziale o
  il token di callback non corrisponde a uno dei comandi registrati.
- Requisito di raggiungibilità: l'endpoint di callback deve essere raggiungibile dal server Mattermost.
  - Non impostare `callbackUrl` su `localhost` a meno che Mattermost non sia in esecuzione sullo stesso host/spazio dei nomi di rete di OpenClaw.
  - Non impostare `callbackUrl` sul tuo URL di base Mattermost a meno che quell'URL non faccia reverse-proxy di `/api/channels/mattermost/command` verso OpenClaw.
  - Un controllo rapido è `curl https://<gateway-host>/api/channels/mattermost/command`; una richiesta GET dovrebbe restituire `405 Method Not Allowed` da OpenClaw, non `404`.
- Requisito allowlist di uscita Mattermost:
  - Se il tuo callback punta ad indirizzi privati/tailnet/interni, imposta Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` in modo che includa l'host/dominio del callback.
  - Usa voci host/dominio, non URL completi.
    - Corretto: `gateway.tailnet-name.ts.net`
    - Errato: `https://gateway.tailnet-name.ts.net`

## Variabili d'ambiente (account predefinito)

Impostale sull'host del gateway se preferisci usare variabili d'ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Le variabili d'ambiente si applicano solo all'account **predefinito** (`default`). Gli altri account devono usare valori di configurazione.

## Modalità chat

Mattermost risponde automaticamente ai messaggi diretti. Il comportamento nei canali è controllato da `chatmode`:

- `oncall` (predefinito): risponde solo quando viene @menzionato nei canali.
- `onmessage`: risponde a ogni messaggio del canale.
- `onchar`: risponde quando un messaggio inizia con un prefisso trigger.

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Note:

- `onchar` continua a rispondere alle @menzioni esplicite.
- `channels.mattermost.requireMention` è rispettato per le configurazioni legacy, ma è preferibile `chatmode`.

## Thread e sessioni

Usa `channels.mattermost.replyToMode` per controllare se le risposte nei canali e nei gruppi rimangono nel
canale principale o avviano un thread sotto il post che le ha attivate.

- `off` (predefinito): risponde in un thread solo quando il post in ingresso è già in un thread.
- `first`: per i post di livello superiore in canali/gruppi, avvia un thread sotto quel post e instrada la
  conversazione a una sessione con ambito thread.
- `all`: oggi per Mattermost ha lo stesso comportamento di `first`.
- I messaggi diretti ignorano questa impostazione e rimangono senza thread.

Esempio di configurazione:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Note:

- Le sessioni con ambito thread usano l'id del post di attivazione come radice del thread.
- `first` e `all` sono attualmente equivalenti perché, una volta che Mattermost ha una radice di thread,
  i chunk successivi e i contenuti multimediali continuano nello stesso thread.

## Controllo accessi (messaggi diretti)

- Predefinito: `channels.mattermost.dmPolicy = "pairing"` (i mittenti sconosciuti ricevono un codice di pairing).
- Approva tramite:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Messaggi diretti pubblici: `channels.mattermost.dmPolicy="open"` più `channels.mattermost.allowFrom=["*"]`.

## Canali (gruppi)

- Predefinito: `channels.mattermost.groupPolicy = "allowlist"` (protetto da menzione).
- Inserisci i mittenti in allowlist con `channels.mattermost.groupAllowFrom` (si consigliano gli ID utente).
- Le sovrascritture di menzione per canale si trovano sotto `channels.mattermost.groups.<channelId>.requireMention`
  oppure `channels.mattermost.groups["*"].requireMention` come predefinito.
- La corrispondenza `@username` è mutabile ed è abilitata solo quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canali aperti: `channels.mattermost.groupPolicy="open"` (protetto da menzione).
- Nota di runtime: se `channels.mattermost` è completamente assente, il runtime usa come fallback `groupPolicy="allowlist"` per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

Esempio:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinazioni per la consegna in uscita

Usa questi formati di destinazione con `openclaw message send` o cron/webhook:

- `channel:<id>` per un canale
- `user:<id>` per un messaggio diretto
- `@username` per un messaggio diretto (risolto tramite l'API Mattermost)

Gli ID opachi senza prefisso (come `64ifufp...`) sono **ambigui** in Mattermost (ID utente vs ID canale).

OpenClaw li risolve **prima come utente**:

- Se l'ID esiste come utente (`GET /api/v4/users/<id>` ha esito positivo), OpenClaw invia un **messaggio diretto** risolvendo il canale diretto tramite `/api/v4/channels/direct`.
- Altrimenti l'ID viene trattato come **ID canale**.

Se hai bisogno di un comportamento deterministico, usa sempre i prefissi espliciti (`user:<id>` / `channel:<id>`).

## Riprova del canale DM

Quando OpenClaw invia a una destinazione DM Mattermost e deve prima risolvere il canale diretto,
per impostazione predefinita riprova gli errori transitori di creazione del canale diretto.

Usa `channels.mattermost.dmChannelRetry` per regolare questo comportamento globalmente per il plugin Mattermost,
oppure `channels.mattermost.accounts.<id>.dmChannelRetry` per un singolo account.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Note:

- Questo si applica solo alla creazione del canale DM (`/api/v4/channels/direct`), non a tutte le chiamate API Mattermost.
- Le riprove si applicano a errori transitori come rate limit, risposte 5xx e errori di rete o timeout.
- Gli errori client 4xx diversi da `429` sono trattati come permanenti e non vengono ritentati.

## Streaming di anteprima

Mattermost trasmette pensieri, attività degli strumenti e testo parziale della risposta in un singolo **post di anteprima bozza** che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza. L'anteprima si aggiorna sullo stesso id del post invece di riempire il canale con messaggi per ogni chunk. I finali di contenuti multimediali/errori annullano le modifiche di anteprima in sospeso e usano la normale consegna invece di pubblicare un post di anteprima usa e getta.

Abilita tramite `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Note:

- `partial` è la scelta usuale: un post di anteprima che viene modificato man mano che la risposta cresce, poi finalizzato con la risposta completa.
- `block` usa chunk di bozza in stile append all'interno del post di anteprima.
- `progress` mostra un'anteprima di stato durante la generazione e pubblica la risposta finale solo al completamento.
- `off` disabilita lo streaming di anteprima.
- Se lo stream non può essere finalizzato sul posto (ad esempio il post è stato eliminato a metà stream), OpenClaw ripiega sull'invio di un nuovo post finale in modo che la risposta non vada mai persa.
- Vedi [Streaming](/it/concepts/streaming#preview-streaming-modes) per la matrice di mappatura dei canali.

## Reazioni (strumento message)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` è l'id del post Mattermost.
- `emoji` accetta nomi come `thumbsup` o `:+1:` (i due punti sono facoltativi).
- Imposta `remove=true` (booleano) per rimuovere una reazione.
- Gli eventi di aggiunta/rimozione di reazioni vengono inoltrati come eventi di sistema alla sessione agente instradata.

Esempi:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configurazione:

- `channels.mattermost.actions.reactions`: abilita/disabilita le azioni di reazione (predefinito true).
- Sovrascrittura per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Pulsanti interattivi (strumento message)

Invia messaggi con pulsanti cliccabili. Quando un utente fa clic su un pulsante, l'agente riceve la
selezione e può rispondere.

Abilita i pulsanti aggiungendo `inlineButtons` alle capacità del canale:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Usa `message action=send` con un parametro `buttons`. I pulsanti sono un array 2D (righe di pulsanti):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campi del pulsante:

- `text` (obbligatorio): etichetta visualizzata.
- `callback_data` (obbligatorio): valore rimandato indietro al clic (usato come ID dell'azione).
- `style` (facoltativo): `"default"`, `"primary"` oppure `"danger"`.

Quando un utente fa clic su un pulsante:

1. Tutti i pulsanti vengono sostituiti con una riga di conferma (ad esempio, "✓ **Yes** selezionato da @user").
2. L'agente riceve la selezione come messaggio in ingresso e risponde.

Note:

- I callback dei pulsanti usano la verifica HMAC-SHA256 (automatica, nessuna configurazione necessaria).
- Mattermost rimuove i dati di callback dalle sue risposte API (funzionalità di sicurezza), quindi tutti i pulsanti
  vengono rimossi al clic — la rimozione parziale non è possibile.
- Gli ID azione che contengono trattini o underscore vengono sanificati automaticamente
  (limitazione del routing di Mattermost).

Configurazione:

- `channels.mattermost.capabilities`: array di stringhe di capacità. Aggiungi `"inlineButtons"` per
  abilitare la descrizione dello strumento pulsanti nel prompt di sistema dell'agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL di base esterno facoltativo per i callback
  dei pulsanti (ad esempio `https://gateway.example.com`). Usalo quando Mattermost non può
  raggiungere direttamente il gateway sul suo host di bind.
- Nelle configurazioni multi-account, puoi impostare lo stesso campo anche sotto
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` viene omesso, OpenClaw deriva l'URL di callback da
  `gateway.customBindHost` + `gateway.port`, e poi ripiega su `http://localhost:<port>`.
- Regola di raggiungibilità: l'URL di callback dei pulsanti deve essere raggiungibile dal server Mattermost.
  `localhost` funziona solo quando Mattermost e OpenClaw sono in esecuzione sullo stesso host/spazio dei nomi di rete.
- Se la destinazione del callback è privata/tailnet/interna, aggiungi il suo host/dominio a Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Integrazione API diretta (script esterni)

Gli script esterni e i webhook possono pubblicare pulsanti direttamente tramite l'API REST Mattermost
invece di passare attraverso lo strumento `message` dell'agente. Usa `buildButtonAttachments()` dall'
extension quando possibile; se pubblichi JSON raw, segui queste regole:

**Struttura del payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // solo alfanumerico — vedi sotto
            type: "button", // obbligatorio, altrimenti i clic vengono ignorati silenziosamente
            name: "Approve", // etichetta visualizzata
            style: "primary", // facoltativo: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corrispondere all'id del pulsante (per la ricerca del nome)
                action: "approve",
                // ... eventuali campi personalizzati ...
                _token: "<hmac>", // vedi la sezione HMAC qui sotto
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Regole critiche:**

1. Gli attachment vanno in `props.attachments`, non negli `attachments` di livello superiore (ignorati silenziosamente).
2. Ogni azione necessita di `type: "button"` — senza di esso, i clic vengono assorbiti silenziosamente.
3. Ogni azione necessita di un campo `id` — Mattermost ignora le azioni senza ID.
4. L'`id` dell'azione deve essere **solo alfanumerico** (`[a-zA-Z0-9]`). Trattini e underscore interrompono
   il routing lato server delle azioni di Mattermost (restituisce 404). Rimuovili prima dell'uso.
5. `context.action_id` deve corrispondere all'`id` del pulsante affinché il messaggio di conferma mostri il
   nome del pulsante (ad esempio, "Approve") invece di un ID raw.
6. `context.action_id` è obbligatorio — l'handler di interazione restituisce 400 senza di esso.

**Generazione del token HMAC:**

Il Gateway verifica i clic dei pulsanti con HMAC-SHA256. Gli script esterni devono generare token
che corrispondano alla logica di verifica del gateway:

1. Deriva il secret dal token del bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Costruisci l'oggetto context con tutti i campi **tranne** `_token`.
3. Serializza con **chiavi ordinate** e **senza spazi** (il gateway usa `JSON.stringify`
   con chiavi ordinate, che produce un output compatto).
4. Firma: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Aggiungi il digest esadecimale risultante come `_token` nel context.

Esempio Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Errori comuni HMAC:

- `json.dumps` di Python aggiunge spazi per impostazione predefinita (`{"key": "val"}`). Usa
  `separators=(",", ":")` per corrispondere all'output compatto di JavaScript (`{"key":"val"}`).
- Firma sempre **tutti** i campi del context (meno `_token`). Il gateway rimuove `_token` e poi
  firma tutto ciò che rimane. Firmare un sottoinsieme causa un errore di verifica silenzioso.
- Usa `sort_keys=True` — il gateway ordina le chiavi prima della firma, e Mattermost può
  riordinare i campi del context quando memorizza il payload.
- Deriva il secret dal token del bot (deterministico), non da byte casuali. Il secret
  deve essere lo stesso nel processo che crea i pulsanti e nel gateway che verifica.

## Adapter directory

Il plugin Mattermost include un adapter directory che risolve i nomi di canali e utenti
tramite l'API Mattermost. Questo abilita le destinazioni `#channel-name` e `@username` in
`openclaw message send` e nelle consegne cron/webhook.

Non è necessaria alcuna configurazione — l'adapter usa il token del bot dalla configurazione dell'account.

## Multi-account

Mattermost supporta più account sotto `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Risoluzione dei problemi

- Nessuna risposta nei canali: assicurati che il bot sia nel canale e menzionalo (oncall), usa un prefisso trigger (onchar), oppure imposta `chatmode: "onmessage"`.
- Errori di autenticazione: controlla il token del bot, l'URL di base e se l'account è abilitato.
- Problemi multi-account: le variabili d'ambiente si applicano solo all'account `default`.
- I comandi slash nativi restituiscono `Unauthorized: invalid command token.`: OpenClaw
  non ha accettato il token di callback. Cause tipiche:
  - la registrazione del comando slash non è riuscita o è stata completata solo parzialmente all'avvio
  - il callback sta raggiungendo il gateway/account sbagliato
  - Mattermost ha ancora vecchi comandi che puntano a una precedente destinazione di callback
  - il gateway è stato riavviato senza riattivare i comandi slash
- Se i comandi slash nativi smettono di funzionare, controlla i log per
  `mattermost: failed to register slash commands` oppure
  `mattermost: native slash commands enabled but no commands could be registered`.
- Se `callbackUrl` viene omesso e i log avvisano che il callback è stato risolto in
  `http://127.0.0.1:18789/...`, probabilmente quell'URL è raggiungibile solo quando
  Mattermost è in esecuzione sullo stesso host/spazio dei nomi di rete di OpenClaw. Imposta invece un
  `commands.callbackUrl` esplicito e raggiungibile esternamente.
- I pulsanti appaiono come riquadri bianchi: l'agente potrebbe inviare dati pulsante malformati. Verifica che ogni pulsante abbia entrambi i campi `text` e `callback_data`.
- I pulsanti vengono visualizzati ma i clic non fanno nulla: verifica che `AllowedUntrustedInternalConnections` nella configurazione del server Mattermost includa `127.0.0.1 localhost`, e che `EnablePostActionIntegration` sia `true` in ServiceSettings.
- I pulsanti restituiscono 404 al clic: probabilmente l'`id` del pulsante contiene trattini o underscore. Il router delle azioni di Mattermost si interrompe con ID non alfanumerici. Usa solo `[a-zA-Z0-9]`.
- Il Gateway registra `invalid _token`: mancata corrispondenza HMAC. Verifica di firmare tutti i campi del context (non un sottoinsieme), usare chiavi ordinate e JSON compatto (senza spazi). Vedi la sezione HMAC sopra.
- Il Gateway registra `missing _token in context`: il campo `_token` non è nel context del pulsante. Assicurati che sia incluso quando costruisci il payload di integrazione.
- La conferma mostra l'ID raw invece del nome del pulsante: `context.action_id` non corrisponde all'`id` del pulsante. Imposta entrambi allo stesso valore sanificato.
- L'agente non conosce i pulsanti: aggiungi `capabilities: ["inlineButtons"]` alla configurazione del canale Mattermost.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e protezione tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
