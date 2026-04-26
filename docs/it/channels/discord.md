---
read_when:
    - Lavoro sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, capacità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Pronto per i DM e i canali server tramite il gateway Discord ufficiale.

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

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Ti consigliamo di aggiungere il tuo bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione e un bot Discord">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Assegnale un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** su qualsiasi nome usi per il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri verso il basso fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per le allowlist dei ruoli e la corrispondenza nome-ID)
    - **Presence Intent** (facoltativo; necessario solo per gli aggiornamenti di presenza)

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

    Scorri verso il basso fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    In basso apparirà una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questo è l'insieme di base per i normali canali di testo. Se prevedi di pubblicare in thread Discord, inclusi i flussi di lavoro dei canali forum o media che creano o proseguono un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in fondo, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connettere. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Abilita la Modalità sviluppatore e raccogli i tuoi ID">
    Tornando nell'app Discord, devi abilitare la Modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic con il pulsante destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il pulsante destro sul **tuo avatar** → **Copy User ID**

    Salva il tuo **Server ID** e **User ID** insieme al Bot Token: nel passaggio successivo invierai tutti e tre a OpenClaw.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Per fare in modo che l'abbinamento funzioni, Discord deve consentire al tuo bot di inviarti DM. Fai clic con il pulsante destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo consente ai membri del server (inclusi i bot) di inviarti DM. Lascia questa opzione abilitata se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo i canali server, puoi disattivare i DM dopo l'abbinamento.

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
        Chatta con il tuo agente OpenClaw su un canale esistente (ad esempio Telegram) e diglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / config.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se preferisci la configurazione basata su file, imposta:

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

        I valori `token` in testo semplice sono supportati. Sono supportati anche i valori SecretRef per `channels.discord.token` tramite provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approva il primo abbinamento DM">
    Attendi che il gateway sia in esecuzione, poi invia un DM al tuo bot in Discord. Risponderà con un codice di abbinamento.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Invia il codice di abbinamento al tuo agente sul canale esistente:

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

    Ora dovresti essere in grado di chattare con il tuo agente in Discord tramite DM.

  </Step>
</Steps>

<Note>
La risoluzione del token tiene conto dell'account. I valori del token nella configurazione hanno la precedenza sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Per le chiamate outbound avanzate (strumento messaggi/azioni sul canale), viene usato un `token` esplicito per quella chiamata. Questo vale per le azioni di invio e di lettura/sonda (ad esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/account e retry continuano comunque a provenire dall'account selezionato nell'istantanea runtime attiva.
</Note>

## Consigliato: configura uno spazio di lavoro server

Una volta che i DM funzionano, puoi configurare il tuo server Discord come uno spazio di lavoro completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo è consigliato per server privati in cui ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server alla allowlist dei server">
    Questo consente al tuo agente di rispondere in qualsiasi canale del tuo server, non solo nei DM.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio Server ID Discord `<server_id>` alla allowlist dei server"
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
    Per impostazione predefinita, il tuo agente risponde nei canali server solo quando viene menzionato con @. Per un server privato, probabilmente vorrai che risponda a ogni messaggio.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere menzionato con @"
      </Tab>
      <Tab title="Config">
        Imposta `requireMention: false` nella configurazione del server:

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

  <Step title="Pianifica la memoria nei canali server">
    Per impostazione predefinita, la memoria a lungo termine (MEMORY.md) viene caricata solo nelle sessioni DM. I canali server non caricano automaticamente MEMORY.md.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Quando faccio domande nei canali Discord, usa memory_search o memory_get se ti serve il contesto a lungo termine da MEMORY.md."
      </Tab>
      <Tab title="Manuale">
        Se hai bisogno di un contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono inseriti in ogni sessione). Conserva le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata, quindi puoi configurare `#coding`, `#home`, `#research` o qualsiasi altra cosa si adatti al tuo flusso di lavoro.

## Modello di runtime

- Gateway gestisce la connessione Discord.
- L'instradamento delle risposte è deterministico: le richieste in ingresso da Discord ricevono risposta su Discord.
- I metadati server/canale di Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello ricopia quell'involucro, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal contesto di replay futuro.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali server sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur mantenendo `CommandTargetSessionKey` per la sessione di conversazione instradata.
- La consegna degli annunci Cron/Heartbeat solo testuali a Discord usa una sola volta la risposta finale visibile all'assistente. I payload multimediali e con componenti strutturati restano multi-messaggio quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e media di Discord accettano solo post nei thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al forum padre (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del tuo messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: invia al forum padre per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Titolo argomento\nCorpo del post"
```

Esempio: crea esplicitamente un thread del forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Titolo argomento" --message "Corpo del post"
```

I forum padre non accettano componenti Discord. Se hai bisogno di componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta i container dei componenti v2 di Discord per i messaggi dell'agente. Usa lo strumento messaggi con un payload `components`. I risultati delle interazioni vengono instradati nuovamente all'agente come normali messaggi in ingresso e seguono le impostazioni esistenti di Discord `replyToMode`.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azione consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire che pulsanti, selezioni e moduli vengano usati più volte fino alla loro scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore di modelli interattivo con menu a discesa per provider, modello e runtime compatibili, più un passaggio finale di invio. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e solo l'utente che ha eseguito il comando può usarla.

Allegati di file:

- i blocchi `file` devono puntare a un riferimento di allegato (`attachment://<filename>`)
- fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
- usa `filename` per sovrascrivere il nome di caricamento quando deve corrispondere al riferimento dell'allegato

Moduli modal:

- aggiungi `components.modal` con fino a 5 campi
- tipi di campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw aggiunge automaticamente un pulsante di attivazione

Esempio:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Testo di fallback facoltativo",
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

    Se la policy DM non è open, gli utenti sconosciuti vengono bloccati (oppure ricevono una richiesta di abbinamento in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.discord.allowFrom` quando il loro `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.discord.accounts.default.allowFrom`.

    Formato target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici sono ambigui e vengono rifiutati a meno che non sia fornito un tipo di target utente/canale esplicito.

  </Tab>

  <Tab title="Policy server">
    La gestione dei server è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - il server deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist facoltative per i mittenti: `users` (consigliati ID stabili) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` O `roles`
    - la corrispondenza diretta nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se un server ha `channels` configurato, i canali non elencati vengono negati
    - se un server non ha un blocco `channels`, tutti i canali di quel server presente in allowlist sono consentiti

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

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Menzioni e DM di gruppo">
    I messaggi server richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    `requireMention` viene configurato per server/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` scarta facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist facoltativa tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Instradamento dell'agente basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri di un server Discord a diversi agenti tramite ID ruolo. I binding basati sui ruoli accettano solo ID ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding basati solo sul server. Se un binding imposta anche altri campi di corrispondenza (ad esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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

## Comandi nativi e autorizzazione dei comandi

- `commands.native` ha come valore predefinito `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` rimuove esplicitamente i comandi nativi Discord precedentemente registrati.
- L'autorizzazione dei comandi nativi usa le stesse allowlist/policy Discord della normale gestione dei messaggi.
- I comandi possono comunque essere visibili nell'interfaccia di Discord per utenti non autorizzati; l'esecuzione applica comunque l'autorizzazione OpenClaw e restituisce "non autorizzato".

Vedi [Comandi slash](/it/tools/slash-commands) per il catalogo dei comandi e il comportamento.

Impostazioni predefinite dei comandi slash:

- `ephemeral: true`

## Dettagli delle funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllati da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` allega sempre il riferimento implicito di risposta nativa al primo messaggio Discord in uscita del turno.
    `batched` allega il riferimento implicito di risposta nativa di Discord solo quando il turno in ingresso era un batch con debounce di più messaggi. Questo è utile quando vuoi usare le risposte native soprattutto per chat ambigue e concitate, non per ogni singolo turno con un solo messaggio.

    Gli ID messaggio sono esposti nel contesto/nella cronologia così che gli agenti possano indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Anteprima streaming live">
    OpenClaw può trasmettere bozze di risposta inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` (predefinito) | `partial` | `block` | `progress`. `progress` viene mappato a `partial` su Discord; `streamMode` è un alias legacy e viene migrato automaticamente.

    Il valore predefinito resta `off` perché le modifiche di anteprima di Discord raggiungono rapidamente i limiti di frequenza quando più bot o gateway condividono un account.

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

    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi della dimensione di una bozza (usa `draftChunk` per regolare dimensione e punti di interruzione, limitati a `textChunkLimit`).
    - I finali con media, errori e risposte esplicite annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumento/progresso riusano il messaggio di anteprima.

    L'anteprima in streaming è solo testuale; le risposte multimediali tornano alla consegna normale. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia del server:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni canale ed ereditano la configurazione del canale padre salvo override.
    - `channels.discord.thread.inheritParent` (predefinito `false`) fa sì che i nuovi thread automatici inizializzino dal transcript del padre. Gli override per account si trovano in `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione nella fase di risposta.

    I topic del canale vengono inseriti come contesto **non attendibile**. Le allowlist regolano chi può attivare l'agente, non sono un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per i subagent">
    Discord può associare un thread a un target di sessione così che i messaggi successivi in quel thread continuino a essere instradati verso la stessa sessione (incluse le sessioni subagent).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a un target subagent/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato dell'associazione
    - `/session idle <duration|off>` ispeziona/aggiorna la rimozione automatica dell'associazione per inattività dei binding focalizzati
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

    - `session.threadBindings.*` imposta i valori globali predefiniti.
    - `channels.discord.threadBindings.*` sovrascrive il comportamento di Discord.
    - `spawnSubagentSessions` deve essere true per creare/associare automaticamente thread per `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve essere true per creare/associare automaticamente thread per ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se i thread binding sono disabilitati per un account, `/focus` e le operazioni correlate di thread binding non sono disponibili.

    Vedi [Sub-agents](/it/tools/subagents), [ACP Agents](/it/tools/acp-agents) e [Riferimento della configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding persistenti dei canali ACP">
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

    - `/acp spawn codex --bind here` associa il canale o thread corrente sul posto e mantiene i messaggi futuri sulla stessa sessione ACP. I messaggi nei thread ereditano il binding del canale padre.
    - In un canale o thread associato, `/new` e `/reset` reimpostano sul posto la stessa sessione ACP. I binding temporanei dei thread possono sovrascrivere la risoluzione del target mentre sono attivi.
    - `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare/associare un thread figlio tramite `--thread auto|here`.

    Vedi [ACP Agents](/it/tools/acp-agents) per i dettagli sul comportamento dei binding.

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Modalità di notifica delle reazioni per server:

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
    - fallback all'emoji identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji Unicode o nomi di emoji personalizzati.
    - Usa `""` per disabilitare la reazione per un canale o account.

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
    Instrada il traffico WebSocket del Gateway Discord e le ricerche REST all'avvio (ID applicazione + risoluzione allowlist) tramite un proxy HTTP(S) con `channels.discord.proxy`.

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
    Abilita la risoluzione PluralKit per mappare i messaggi instradati tramite proxy all'identità del membro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facoltativo; necessario per i sistemi privati
      },
    },
  },
}
```

    Note:

    - le allowlist possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono confrontati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID messaggio originale e sono vincolate a una finestra temporale
    - se la ricerca fallisce, i messaggi instradati tramite proxy vengono trattati come messaggi bot e scartati a meno che `allowBots=true`

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
      activity: "Coding dal vivo",
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
    - 4: Custom (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: Competing

    Esempio di presenza automatica (segnale di integrità runtime):

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

    La presenza automatica mappa la disponibilità runtime sullo stato Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Override di testo facoltativi:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il segnaposto `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni tramite pulsanti nei DM e può facoltativamente pubblicare i prompt di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; usa come fallback `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, dal legacy `dm.allowFrom` o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Quando `target` è `channel` o `both`, il prompt di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. I prompt di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID canale non può essere ricavato dalla chiave di sessione, OpenClaw torna alla consegna via DM.

    Discord esegue anche il rendering dei pulsanti di approvazione condivisi usati da altri canali di chat. L'adapter nativo Discord aggiunge principalmente l'instradamento DM degli approvatori e il fanout sul canale.
    Quando questi pulsanti sono presenti, costituiscono la UX di approvazione principale; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unica strada.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto client Gateway condiviso (`plugin:` ID risolti tramite `plugin.approval.resolve`; altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Exec approvals](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e controlli delle azioni

Le azioni dei messaggi Discord includono messaggistica, amministrazione dei canali, moderazione, presenza e azioni sui metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso file locale) per impostare l'immagine di copertina dell'evento pianificato.

I controlli delle azioni si trovano in `channels.discord.actions.*`.

Comportamento predefinito dei controlli:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato   |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa i components v2 di Discord per le approvazioni exec e i marcatori cross-context. Le azioni dei messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload di componenti tramite lo strumento Discord), mentre i legacy `embeds` restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai container dei componenti Discord (hex).
- Impostalo per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` vengono ignorati quando sono presenti i components v2.

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

## Voce

Discord ha due superfici vocali distinte: i **canali vocali** realtime (conversazioni continue) e gli **allegati di messaggi vocali** (il formato di anteprima con forma d'onda). Il Gateway supporta entrambi.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando vengono usate allowlist di ruoli/utenti.
3. Invita il bot con gli scope `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e group policy degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Esempio di auto-join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Note:

- `voice.tts` sovrascrive `messages.tts` solo per la riproduzione vocale.
- `voice.model` sovrascrive l'LLM usato solo per le risposte nei canali vocali Discord. Lascialo non impostato per ereditare il modello dell'agente instradato.
- STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- I turni del transcript vocale derivano lo stato owner da Discord `allowFrom` (o `dm.allowFrom`); gli speaker non owner non possono accedere agli strumenti riservati all'owner (ad esempio `gateway` e `cron`).
- La voce è abilitata per impostazione predefinita; imposta `channels.discord.voice.enabled=false` per disabilitarla.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw monitora anche i fallimenti di decifratura in ricezione e recupera automaticamente uscendo e rientrando nel canale vocale dopo fallimenti ripetuti in una finestra temporale breve.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo un aggiornamento, raccogli un report delle dipendenze e i log. La linea `@discordjs/voice` inclusa nel bundle contiene la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.

Pipeline del canale vocale:

- La cattura PCM di Discord viene convertita in un file WAV temporaneo.
- `tools.media.audio` gestisce STT, ad esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata tramite il normale ingresso e instradamento Discord.
- `voice.model`, quando impostato, sovrascrive solo l'LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; l'audio risultante viene riprodotto nel canale collegato.

Le credenziali vengono risolte per componente: autenticazione del percorso LLM per `voice.model`, autenticazione STT per `tools.media.audio` e autenticazione TTS per `messages.tts`/`voice.tts`.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma ha bisogno di `ffmpeg` e `ffprobe` sull'host del Gateway per ispezionare e convertire.

- Fornisci un **percorso file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- Qualsiasi formato audio è accettato; OpenClaw lo converte in OGG/Opus se necessario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Sono stati usati intent non consentiti o il bot non vede messaggi del server">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi del server bloccati inaspettatamente">

    - verifica `groupPolicy`
    - verifica la allowlist del server in `channels.discord.guilds`
    - se esiste la mappa `channels` del server, sono consentiti solo i canali elencati
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

    - `groupPolicy="allowlist"` senza una allowlist server/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve essere sotto `channels.discord.guilds` o sotto la voce del canale)
    - mittente bloccato dalla allowlist `users` del server/canale

  </Accordion>

  <Accordion title="Gli handler di lunga durata vanno in timeout o duplicano le risposte">

    Log tipici:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametro del budget del listener:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametro del timeout di esecuzione del worker:

    - account singolo: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predefinito: `1800000` (30 minuti); imposta `0` per disabilitare

    Base consigliata:

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

    Se usi chiavi slug, la corrispondenza a runtime può comunque funzionare, ma la sonda non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="Problemi con DM e abbinamento">

    - DM disabilitato: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - in attesa di approvazione dell'abbinamento in modalità `pairing`

  </Accordion>

  <Accordion title="Loop tra bot">
    Per impostazione predefinita, i messaggi scritti dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigorose di menzione e allowlist per evitare comportamenti a loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo i messaggi dei bot che menzionano il bot.

  </Accordion>

  <Accordion title="La STT vocale perde dati con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) in modo che sia presente la logica di recupero della ricezione vocale Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regolalo solo se necessario
    - osserva i log per:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il ricollegamento automatico, raccogli i log e confrontali con la cronologia upstream della ricezione DAVE in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Riferimento della configurazione

Riferimento principale: [Riferimento della configurazione - Discord](/it/gateway/config-channels#discord).

<Accordion title="Campi Discord ad alto segnale">

- avvio/autenticazione: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker inbound: `inboundWorker.runTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (limita gli upload Discord in uscita, predefinito `100MB`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token del bot come segreti (`DISCORD_BOT_TOKEN` preferito in ambienti supervisionati).
- Concedi i permessi Discord minimi necessari.
- Se lo stato/distribuzione dei comandi non è aggiornato, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

<CardGroup cols={2}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Discord al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento della chat di gruppo e della allowlist.
  </Card>
  <Card title="Instradamento canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Instradamento multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa server e canali agli agenti.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
