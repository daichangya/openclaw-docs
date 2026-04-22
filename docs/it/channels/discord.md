---
read_when:
    - Lavorando sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, capacità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API Bot)

Stato: pronto per DM e canali guild tramite il gateway Discord ufficiale.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Discord usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e flusso di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Ti consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Assegnale un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** con il nome che dai al tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per allowlist dei ruoli e corrispondenza nome-ID)
    - **Presence Intent** (opzionale; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del tuo bot">
    Torna in alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token — non viene "reimpostato" nulla.
    </Note>

    Copia il token e salvalo da qualche parte. Questo è il tuo **Bot Token** e ti servirà a breve.

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al tuo server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con i permessi corretti per aggiungere il bot al tuo server.

    Scorri fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto apparirà una sezione **Bot Permissions**. Abilita:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opzionale)

    Copia l'URL generato in fondo, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connettere il bot. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Abilita la modalità sviluppatore e raccogli i tuoi ID">
    Torna nell'app Discord: devi abilitare la modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic con il tasto destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il tasto destro sul **tuo avatar** → **Copy User ID**

    Salva il tuo **Server ID** e **User ID** insieme al Bot Token: nel passaggio successivo invierai tutti e tre a OpenClaw.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Per far funzionare l'abbinamento, Discord deve consentire al tuo bot di inviarti DM. Fai clic con il tasto destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo consente ai membri del server (compresi i bot) di inviarti DM. Lascialo abilitato se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo i canali guild, puoi disabilitare i DM dopo l'abbinamento.

  </Step>

  <Step title="Imposta il token del bot in modo sicuro (non inviarlo in chat)">
    Il token del tuo bot Discord è un segreto (come una password). Impostalo sulla macchina che esegue OpenClaw prima di inviare messaggi al tuo agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Se OpenClaw è già in esecuzione come servizio in background, riavvialo tramite l'app Mac di OpenClaw oppure arrestando e riavviando il processo `openclaw gateway run`.

  </Step>

  <Step title="Configura OpenClaw ed esegui l'abbinamento">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Chatta con il tuo agente OpenClaw su qualsiasi canale esistente (ad esempio Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / config.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se preferisci una configurazione basata su file, imposta:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Fallback env per l'account predefinito:

```bash
DISCORD_BOT_TOKEN=...
```

        I valori `token` in testo semplice sono supportati. Anche i valori SecretRef sono supportati per `channels.discord.token` nei provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approva il primo abbinamento DM">
    Attendi che il gateway sia in esecuzione, poi invia un DM al tuo bot su Discord. Risponderà con un codice di abbinamento.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Invia il codice di abbinamento al tuo agente sul tuo canale esistente:

        > "Approva questo codice di abbinamento Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    I codici di abbinamento scadono dopo 1 ora.

    Ora dovresti essere in grado di chattare con il tuo agente su Discord tramite DM.

  </Step>
</Steps>

<Note>
La risoluzione del token è consapevole dell'account. I valori del token nella configurazione hanno priorità sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Per le chiamate in uscita avanzate (strumento messaggi/azioni del canale), viene usato un `token` esplicito per quella chiamata. Questo vale per le azioni di invio e di lettura/sonda (ad esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/retry dell'account continuano comunque a provenire dall'account selezionato nello snapshot di runtime attivo.
</Note>

## Consigliato: configura uno spazio di lavoro guild

Una volta che i DM funzionano, puoi configurare il tuo server Discord come spazio di lavoro completo, dove ogni canale ottiene una propria sessione agente con il proprio contesto. Questo è consigliato per server privati dove ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server all'allowlist guild">
    Questo consente al tuo agente di rispondere in qualsiasi canale del tuo server, non solo nei DM.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio Server ID Discord `<server_id>` all'allowlist guild"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Consenti risposte senza @mention">
    Per impostazione predefinita, il tuo agente risponde nei canali guild solo quando viene menzionato con @mention. Per un server privato, probabilmente vorrai che risponda a ogni messaggio.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere menzionato con @mention"
      </Tab>
      <Tab title="Config">
        Imposta `requireMention: false` nella configurazione guild:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Pianifica la memoria nei canali guild">
    Per impostazione predefinita, la memoria a lungo termine (`MEMORY.md`) viene caricata solo nelle sessioni DM. I canali guild non caricano automaticamente `MEMORY.md`.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Quando faccio domande nei canali Discord, usa memory_search o memory_get se ti serve contesto a lungo termine da `MEMORY.md`."
      </Tab>
      <Tab title="Manuale">
        Se ti serve contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettati in ogni sessione). Tieni le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata — quindi puoi configurare `#coding`, `#home`, `#research` o qualsiasi cosa si adatti al tuo flusso di lavoro.

## Modello di runtime

- Il Gateway gestisce la connessione Discord.
- L'instradamento delle risposte è deterministico: le risposte in ingresso di Discord tornano a Discord.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali guild hanno chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur mantenendo `CommandTargetSessionKey` per la sessione di conversazione instradata.

## Canali forum

I canali forum e media di Discord accettano solo post in thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al parent del forum (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del tuo messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: invia al parent del forum per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Titolo dell'argomento\nCorpo del post"
```

Esempio: crea esplicitamente un thread del forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Titolo dell'argomento" --message "Corpo del post"
```

I parent del forum non accettano componenti Discord. Se ti servono componenti, invia direttamente al thread (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta i container Discord components v2 per i messaggi dell'agente. Usa lo strumento messaggi con un payload `components`. I risultati dell'interazione vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni esistenti di Discord `replyToMode`.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azione consentono fino a 5 pulsanti oppure un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire a pulsanti, selettori e moduli di essere usati più volte fino alla loro scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag oppure `*`). Se configurato, gli utenti non corrispondenti ricevono un rifiuto ephemeral.

I comandi slash `/model` e `/models` aprono un selettore di modelli interattivo con menu a discesa per provider e modello, più un passaggio Submit. La risposta del selettore è ephemeral e può essere usata solo dall'utente che l'ha invocata.

Allegati di file:

- I blocchi `file` devono puntare a un riferimento allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
- Usa `filename` per sovrascrivere il nome di caricamento quando deve corrispondere al riferimento allegato

Moduli modal:

- Aggiungi `components.modal` con fino a 5 campi
- Tipi di campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw aggiunge automaticamente un pulsante di attivazione

Esempio:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Testo di fallback opzionale",
  components: {
    reusable: true,
    text: "Scegli un percorso",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approva",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Rifiuta", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Scegli un'opzione",
          options: [
            { label: "Opzione A", value: "a" },
            { label: "Opzione B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Dettagli",
      triggerLabel: "Apri modulo",
      fields: [
        { type: "text", label: "Richiedente" },
        {
          type: "select",
          label: "Priorità",
          options: [
            { label: "Bassa", value: "low" },
            { label: "Alta", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Policy DM">
    `channels.discord.dmPolicy` controlla l'accesso ai DM (legacy: `channels.discord.dm.policy`):

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se la policy DM non è open, gli utenti sconosciuti vengono bloccati (oppure invitati all'abbinamento in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.discord.allowFrom` quando il loro `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.discord.accounts.default.allowFrom`.

    Formato del target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici senza prefisso sono ambigui e vengono rifiutati a meno che non venga fornito un tipo di target utente/canale esplicito.

  </Tab>

  <Tab title="Policy guild">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist opzionali del mittente: `users` (si consigliano ID stabili) e `roles` (solo ID ruolo); se uno dei due è configurato, i mittenti sono consentiti quando corrispondono a `users` O `roles`
    - la corrispondenza diretta nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se una guild ha `channels` configurato, i canali non elencati vengono negati
    - se una guild non ha un blocco `channels`, tutti i canali in quella guild in allowlist sono consentiti

    Esempio:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback di runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Menzioni e DM di gruppo">
    I messaggi guild sono soggetti a menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    `requireMention` è configurato per guild/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` scarta facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (escludendo @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist opzionale tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Instradamento dell'agente basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri di una guild Discord a diversi agenti tramite ID ruolo. I binding basati sui ruoli accettano solo ID ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo-guild. Se un binding imposta anche altri campi match (ad esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Configurazione del Developer Portal

<AccordionGroup>
  <Accordion title="Crea app e bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copia il token del bot

  </Accordion>

  <Accordion title="Intent privilegiati">
    In **Bot -> Privileged Gateway Intents**, abilita:

    - Message Content Intent
    - Server Members Intent (consigliato)

    Presence Intent è opzionale ed è richiesto solo se vuoi ricevere aggiornamenti di presenza. L'impostazione della presenza del bot (`setPresence`) non richiede l'abilitazione degli aggiornamenti di presenza per i membri.

  </Accordion>

  <Accordion title="Scope OAuth e permessi di base">
    Generatore URL OAuth:

    - scope: `bot`, `applications.commands`

    Permessi di base tipici:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opzionale)

    Evita `Administrator` a meno che non sia esplicitamente necessario.

  </Accordion>

  <Accordion title="Copia gli ID">
    Abilita la modalità sviluppatore di Discord, poi copia:

    - ID server
    - ID canale
    - ID utente

    Preferisci gli ID numerici nella configurazione OpenClaw per audit e probe affidabili.

  </Accordion>
</AccordionGroup>

## Comandi nativi e autorizzazione dei comandi

- `commands.native` per impostazione predefinita è `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` cancella esplicitamente i comandi nativi Discord registrati in precedenza.
- L'autorizzazione dei comandi nativi usa le stesse allowlist/policy Discord della normale gestione dei messaggi.
- I comandi potrebbero comunque essere visibili nell'interfaccia Discord per utenti non autorizzati; l'esecuzione continua però ad applicare l'autorizzazione OpenClaw e restituisce "non autorizzato".

Vedi [Comandi slash](/it/tools/slash-commands) per il catalogo dei comandi e il comportamento.

Impostazioni predefinite dei comandi slash:

- `ephemeral: true`

## Dettagli delle funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllato da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` allega sempre il riferimento di risposta nativa implicita al primo messaggio Discord in uscita del turno.
    `batched` allega il riferimento di risposta nativa implicita di Discord solo quando il
    turno in ingresso era un batch con debounce di più messaggi. Questo è utile
    quando vuoi le risposte native principalmente per chat ambigue e intense, non per ogni
    singolo turno con un solo messaggio.

    Gli ID messaggio sono esposti nel contesto/nella cronologia così che gli agenti possano indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Anteprima dello stream live">
    OpenClaw può trasmettere risposte bozza inviando un messaggio temporaneo e modificandolo man mano che arriva il testo.

    - `channels.discord.streaming` controlla lo streaming di anteprima (`off` | `partial` | `block` | `progress`, predefinito: `off`).
    - Il predefinito resta `off` perché le modifiche di anteprima su Discord possono raggiungere rapidamente i limiti di rate, soprattutto quando più bot o gateway condividono lo stesso account o traffico guild.
    - `progress` è accettato per coerenza tra canali e su Discord viene mappato a `partial`.
    - `channels.discord.streamMode` è un alias legacy e viene migrato automaticamente.
    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi della dimensione della bozza (usa `draftChunk` per regolare dimensione e punti di interruzione).
    - I finali media, errore e risposta esplicita annullano le modifiche di anteprima in sospeso senza svuotare una bozza temporanea prima della consegna normale.
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti strumento/progresso riutilizzano lo stesso messaggio di anteprima della bozza (predefinito: `true`). Imposta `false` per mantenere separati i messaggi strumento/progresso.

    Esempio:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Impostazioni predefinite del chunking in modalità `block` (vincolate a `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Lo streaming di anteprima è solo testo; le risposte multimediali ricadono sulla consegna normale.

    Nota: lo streaming di anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è esplicitamente
    abilitato per Discord, OpenClaw salta lo stream di anteprima per evitare doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia guild:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - i thread Discord vengono instradati come sessioni di canale
    - i metadati del thread padre possono essere usati per il collegamento alla sessione padre
    - la configurazione del thread eredita la configurazione del canale padre a meno che non esista una voce specifica per il thread

    Gli argomenti del canale vengono iniettati come contesto **non attendibile** (non come prompt di sistema).
    Il contesto delle risposte e dei messaggi citati al momento resta così come ricevuto.
    Le allowlist Discord limitano principalmente chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per i subagent">
    Discord può associare un thread a un target di sessione così che i messaggi successivi in quel thread continuino a essere instradati alla stessa sessione (incluse le sessioni subagent).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a un target subagent/sessione
    - `/unfocus` rimuove il binding del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato del binding
    - `/session idle <duration|off>` ispeziona/aggiorna la rimozione automatica del focus per inattività dei binding focalizzati
    - `/session max-age <duration|off>` ispeziona/aggiorna l'età massima rigida per i binding focalizzati

    Configurazione:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Note:

    - `session.threadBindings.*` imposta i valori predefiniti globali.
    - `channels.discord.threadBindings.*` sovrascrive il comportamento Discord.
    - `spawnSubagentSessions` deve essere true per creare/associare automaticamente thread per `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve essere true per creare/associare automaticamente thread per ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se i thread binding sono disabilitati per un account, `/focus` e le relative operazioni di thread binding non sono disponibili.

    Vedi [Sub-agent](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding persistenti del canale ACP">
    Per spazi di lavoro ACP stabili "sempre attivi", configura binding ACP tipizzati di primo livello che puntano a conversazioni Discord.

    Percorso di configurazione:

    - `bindings[]` con `type: "acp"` e `match.channel: "discord"`

    Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Note:

    - `/acp spawn codex --bind here` associa il canale o thread Discord corrente sul posto e mantiene i messaggi futuri instradati alla stessa sessione ACP.
    - Questo può comunque significare "avvia una nuova sessione ACP Codex", ma non crea da solo un nuovo thread Discord. Il canale esistente resta la superficie di chat.
    - Codex può comunque essere eseguito nel proprio `cwd` o workspace backend su disco. Quello workspace è stato di runtime, non un thread Discord.
    - I messaggi dei thread possono ereditare il binding ACP del canale padre.
    - In un canale o thread associato, `/new` e `/reset` reimpostano sul posto la stessa sessione ACP.
    - I thread binding temporanei continuano a funzionare e possono sovrascrivere la risoluzione del target mentre sono attivi.
    - `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare/associare un thread figlio tramite `--thread auto|here`. Non è richiesto per `/acp spawn ... --bind here` nel canale corrente.

    Vedi [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento dei binding.

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Modalità di notifica delle reazioni per guild:

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono trasformati in eventi di sistema e allegati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identità agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o un account.

  </Accordion>

  <Accordion title="Scritture di configurazione">
    Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita.

    Questo influisce sui flussi `/config set|unset` (quando le funzionalità dei comandi sono abilitate).

    Disabilita:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy Gateway">
    Instrada il traffico WebSocket del gateway Discord e le ricerche REST all'avvio (ID applicazione + risoluzione allowlist) attraverso un proxy HTTP(S) con `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Override per account:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Supporto PluralKit">
    Abilita la risoluzione PluralKit per mappare i messaggi proxati all'identità del membro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opzionale; necessario per sistemi privati
      },
    },
  },
}
```

    Note:

    - le allowlist possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono confrontati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID del messaggio originale e sono vincolate da una finestra temporale
    - se la ricerca fallisce, i messaggi proxati vengono trattati come messaggi del bot e scartati a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Configurazione della presenza">
    Gli aggiornamenti di presenza vengono applicati quando imposti un campo di stato o attività, oppure quando abiliti la presenza automatica.

    Esempio solo stato:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Esempio attività (lo stato personalizzato è il tipo di attività predefinito):

```json5
{
  channels: {
    discord: {
      activity: "Tempo di concentrazione",
      activityType: 4,
    },
  },
}
```

    Esempio streaming:

```json5
{
  channels: {
    discord: {
      activity: "Coding live",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mappa dei tipi di attività:

    - 0: Playing
    - 1: Streaming (richiede `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (usa il testo dell'attività come stato; l'emoji è opzionale)
    - 5: Competing

    Esempio di presenza automatica (segnale di salute del runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token esaurito",
      },
    },
  },
}
```

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Override di testo facoltativi:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare i prompt di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opzionale; usa `commands.ownerAllowFrom` come fallback quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le exec approvals native quando `enabled` non è impostato oppure è `"auto"` e può essere risolto almeno un approvatore, tramite `execApprovals.approvers` o `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, dal legacy `dm.allowFrom` o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Quando `target` è `channel` o `both`, il prompt di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto ephemeral. I prompt di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali fidati. Se l'ID canale non può essere derivato dalla chiave di sessione, OpenClaw torna alla consegna via DM.

    Discord renderizza anche i pulsanti di approvazione condivisi usati da altri canali chat. L'adapter nativo Discord aggiunge principalmente l'instradamento DM degli approvatori e il fanout del canale.
    Quando questi pulsanti sono presenti, rappresentano la UX primaria per le approvazioni; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

    L'autenticazione Gateway per questo handler usa lo stesso contratto condiviso di risoluzione delle credenziali degli altri client Gateway:

    - autenticazione locale env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` poi `gateway.auth.*`)
    - in modalità locale, `gateway.remote.*` può essere usato come fallback solo quando `gateway.auth.*` non è impostato; SecretRef locali configurati ma non risolti falliscono in modalità chiusa
    - supporto modalità remota tramite `gateway.remote.*` quando applicabile
    - gli override URL sono sicuri per gli override: gli override CLI non riutilizzano credenziali implicite, e gli override env usano solo credenziali env

    Comportamento della risoluzione delle approvazioni:

    - Gli ID con prefisso `plugin:` vengono risolti tramite `plugin.approval.resolve`.
    - Gli altri ID vengono risolti tramite `exec.approval.resolve`.
    - Discord qui non esegue un ulteriore fallback da exec a plugin; il
      prefisso dell'ID decide quale metodo Gateway viene chiamato.

    Le exec approvals scadono dopo 30 minuti per impostazione predefinita. Se le approvazioni falliscono con
    ID di approvazione sconosciuti, verifica la risoluzione degli approvatori, l'abilitazione della funzionalità e
    che il tipo di ID di approvazione consegnato corrisponda alla richiesta in sospeso.

    Documentazione correlata: [Exec approvals](/it/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Strumenti e gate delle azioni

Le azioni dei messaggi Discord includono messaggistica, amministrazione del canale, moderazione, presenza e azioni sui metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso file locale) per impostare l'immagine di copertina dell'evento pianificato.

I gate delle azioni si trovano in `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato   |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa Discord components v2 per exec approvals e marcatori cross-context. Le azioni dei messaggi Discord possono anche accettare `components` per una UI personalizzata (avanzato; richiede la costruzione di un payload componente tramite lo strumento discord), mentre i legacy `embeds` restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai container dei componenti Discord (hex).
- Impostalo per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` vengono ignorati quando sono presenti components v2.

Esempio:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Canali vocali

OpenClaw può unirsi ai canali vocali Discord per conversazioni continue in tempo reale. Questo è separato dagli allegati di messaggi vocali.

Requisiti:

- Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
- Configura `channels.discord.voice`.
- Il bot necessita dei permessi Connect + Speak nel canale vocale di destinazione.

Usa il comando nativo solo Discord `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e group policy degli altri comandi Discord.

Esempio di join automatico:

```json5
{
  channels: {
    discord: {
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
    },
  },
}
```

Note:

- `voice.tts` sovrascrive `messages.tts` solo per la riproduzione vocale.
- I turni di trascrizione vocale derivano lo stato owner da Discord `allowFrom` (o `dm.allowFrom`); i parlanti non owner non possono accedere agli strumenti solo owner (ad esempio `gateway` e `cron`).
- La voce è abilitata per impostazione predefinita; imposta `channels.discord.voice.enabled=false` per disabilitarla.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw monitora anche gli errori di decifratura in ricezione e si ripristina automaticamente uscendo e rientrando nel canale vocale dopo errori ripetuti in una breve finestra temporale.
- Se i log in ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, questo potrebbe essere il bug upstream di ricezione `@discordjs/voice` tracciato in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della waveform e richiedono audio OGG/Opus più metadati. OpenClaw genera automaticamente la waveform, ma necessita che `ffmpeg` e `ffprobe` siano disponibili sull'host gateway per ispezionare e convertire i file audio.

Requisiti e vincoli:

- Fornisci un **percorso file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord non consente testo + messaggio vocale nello stesso payload).
- È accettato qualsiasi formato audio; OpenClaw converte in OGG/Opus quando necessario.

Esempio:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Sono stati usati intent non consentiti oppure il bot non vede messaggi guild">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione utente/membro
    - riavvia il gateway dopo aver cambiato gli intent

  </Accordion>

  <Accordion title="Messaggi guild bloccati inaspettatamente">

    - verifica `groupPolicy`
    - verifica la allowlist guild in `channels.discord.guilds`
    - se esiste la mappa guild `channels`, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i pattern di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ma ancora bloccato">
    Cause comuni:

    - `groupPolicy="allowlist"` senza una allowlist guild/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve essere in `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dalla allowlist `users` guild/canale

  </Accordion>

  <Accordion title="Gli handler di lunga durata vanno in timeout o duplicano le risposte">

    Log tipici:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametro del budget listener:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametro del timeout di esecuzione worker:

    - account singolo: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predefinito: `1800000` (30 minuti); imposta `0` per disabilitare

    Baseline consigliata:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Usa `eventQueue.listenerTimeout` per una configurazione lenta del listener e `inboundWorker.runTimeoutMs`
    solo se vuoi una valvola di sicurezza separata per i turni agente in coda.

  </Accordion>

  <Accordion title="Incongruenze nell'audit dei permessi">
    I controlli dei permessi di `channels status --probe` funzionano solo per ID canale numerici.

    Se usi chiavi slug, la corrispondenza a runtime può comunque funzionare, ma la probe non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="Problemi con DM e abbinamento">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - in attesa di approvazione dell'abbinamento in modalità `pairing`

  </Accordion>

  <Accordion title="Loop bot verso bot">
    Per impostazione predefinita i messaggi creati dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigide di menzione e allowlist per evitare comportamenti di loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo messaggi di bot che menzionano il bot.

  </Accordion>

  <Accordion title="La STT vocale perde con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) in modo che sia presente la logica di recupero della ricezione vocale Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regolalo solo se necessario
    - controlla i log per:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il rientro automatico, raccogli i log e confrontali con [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Puntatori del riferimento di configurazione

Riferimento principale:

- [Riferimento di configurazione - Discord](/it/gateway/configuration-reference#discord)

Campi Discord ad alto segnale:

- avvio/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comandi: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita gli upload Discord in uscita (predefinito: `100MB`)
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicurezza e operazioni

- Tratta i token bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi i permessi Discord minimi necessari.
- Se deploy/stato dei comandi non è aggiornato, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Instradamento del canale](/it/channels/channel-routing)
- [Sicurezza](/it/gateway/security)
- [Instradamento multi-agent](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
- [Comandi slash](/it/tools/slash-commands)
