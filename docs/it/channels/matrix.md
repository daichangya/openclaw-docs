---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione di E2EE e verifica di Matrix
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix è un Plugin di canale incluso in OpenClaw.
Usa l'ufficiale `matrix-js-sdk` e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix è distribuito come Plugin incluso nelle release correnti di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Matrix, installalo manualmente:

Installa da npm:

```bash
openclaw plugins install @openclaw/matrix
```

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Vedi [Plugins](/it/tools/plugin) per il comportamento dei Plugin e le regole di installazione.

## Configurazione iniziale

1. Assicurati che il Plugin Matrix sia disponibile.
   - Le release pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno di questi:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il gateway.
5. Avvia un DM con il bot oppure invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` li consente.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata Matrix chiede:

- URL dell'homeserver
- metodo di autenticazione: access token o password
- ID utente (solo autenticazione con password)
- nome dispositivo opzionale
- se abilitare E2EE
- se configurare l'accesso alle stanze e l'auto-join degli inviti

Comportamenti chiave della procedura guidata:

- Se le variabili d'ambiente di autenticazione Matrix esistono già e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia env per mantenere l'autenticazione nelle variabili d'ambiente.
- I nomi degli account sono normalizzati nell'ID account. Ad esempio, `Ops Bot` diventa `ops-bot`.
- Le voci della allowlist DM accettano direttamente `@user:server`; i nomi visualizzati funzionano solo quando la ricerca nella directory live trova una corrispondenza esatta.
- Le voci della allowlist delle stanze accettano direttamente ID stanza e alias. Preferisci `!room:server` o `#alias:server`; i nomi non risolti vengono ignorati a runtime dalla risoluzione della allowlist.
- In modalità allowlist per l'auto-join degli inviti, usa solo destinazioni di invito stabili: `!roomId:server`, `#alias:server` o `*`. I nomi semplici delle stanze vengono rifiutati.
- Per risolvere i nomi delle stanze prima del salvataggio, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ha come valore predefinito `off`.

Se lo lasci non impostato, il bot non si unirà alle stanze invitate o ai nuovi inviti in stile DM, quindi non comparirà nei nuovi gruppi o nei DM su invito a meno che tu non lo faccia unire manualmente prima.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare quali inviti accetta, oppure imposta `autoJoin: "always"` se vuoi che si unisca a ogni invito.

In modalità `allowlist`, `autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` o `*`.
</Warning>

Esempio di allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Unisciti a ogni invito:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configurazione minima basata su token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configurazione basata su password (il token viene memorizzato nella cache dopo il login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix memorizza le credenziali in cache in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.
Quando lì esistono credenziali in cache, OpenClaw considera Matrix configurato per setup, doctor e rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti come variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Per account non predefiniti, usa variabili d'ambiente con ambito account:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Esempio per l'account `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Per l'ID account normalizzato `ops-bot`, usa:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix esegue l'escape della punteggiatura negli ID account per mantenere le variabili d'ambiente con ambito senza collisioni.
Ad esempio, `-` diventa `_X2D_`, quindi `ops-prod` diventa `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia delle variabili d'ambiente solo quando quelle variabili di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

`MATRIX_HOMESERVER` non può essere impostata da un file workspace `.env`; vedi [File workspace `.env`](/it/gateway/security).

## Esempio di configurazione

Questa è una configurazione di base pratica con pairing DM, allowlist delle stanze ed E2EE abilitato:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` si applica a tutti gli inviti Matrix, inclusi quelli in stile DM. OpenClaw non può classificare in modo affidabile una stanza invitata come DM o gruppo al momento dell'invito, quindi tutti gli inviti passano prima da `autoJoin`. `dm.policy` si applica dopo che il bot si è unito e la stanza è stata classificata come DM.

## Anteprime in streaming

Lo streaming delle risposte Matrix è opzionale.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola risposta di anteprima live, modifichi quell'anteprima sul posto mentre il modello genera testo e poi la finalizzi quando la risposta è completata:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` è il valore predefinito. OpenClaw aspetta la risposta finale e la invia una volta sola.
- `streaming: "partial"` crea un messaggio di anteprima modificabile per l'attuale blocco assistant usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di notifica sulla prima anteprima di Matrix, quindi i client standard possono notificare sul primo testo dell'anteprima in streaming invece che sul blocco completato.
- `streaming: "quiet"` crea un'anteprima silenziosa modificabile per l'attuale blocco assistant. Usalo solo quando configuri anche regole push del destinatario per le modifiche finalizzate dell'anteprima.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming di anteprima abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming di anteprima è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza lo stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming di anteprima e torna alla normale consegna finale.
- Le risposte con contenuti multimediali inviano comunque normalmente gli allegati. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia lo streaming disattivato se vuoi il comportamento più conservativo rispetto ai limiti di frequenza.

`blockStreaming` da solo non abilita le bozze di anteprima.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche di anteprima; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi assistant completati restino visibili come messaggi di avanzamento separati.

Se ti servono notifiche Matrix standard senza regole push personalizzate, usa `streaming: "partial"` per il comportamento con anteprima iniziale oppure lascia `streaming` disattivato per la consegna solo finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime silenziose finalizzate

Lo streaming silenzioso (`streaming: "quiet"`) notifica i destinatari solo quando un blocco o un turno viene finalizzato: una regola push per utente deve corrispondere al marcatore dell'anteprima finalizzata. Vedi [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la configurazione completa (token del destinatario, controllo del pusher, installazione della regola, note per homeserver specifici).

## Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix tra agenti:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati in stanze e DM consentiti.
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM restano comunque consentiti.
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello account per una singola stanza.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix qui non espone un flag bot nativo; OpenClaw considera "scritto da un bot" come "inviato da un altro account Matrix configurato su questo gateway OpenClaw".

Usa allowlist rigorose delle stanze e requisiti di menzione quando abiliti traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` in modo che le anteprime delle immagini siano crittografate insieme all'allegato completo. Le stanze non crittografate continuano a usare il semplice `thumbnail_url`. Non serve alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Abilita la crittografia:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Comandi di verifica (tutti accettano `--verbose` per la diagnostica e `--json` per output leggibile da macchina):

```bash
openclaw matrix verify status
```

Stato verboso (diagnostica completa):

```bash
openclaw matrix verify status --verbose
```

Includi la recovery key memorizzata nell'output leggibile da macchina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza cross-signing e stato di verifica:

```bash
openclaw matrix verify bootstrap
```

Diagnostica verbosa del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un nuovo reset dell'identità di cross-signing prima del bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifica questo dispositivo con una recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Questo comando riporta tre stati separati:

- `Recovery key accepted`: Matrix ha accettato la recovery key per l'archiviazione dei segreti o per la fiducia del dispositivo.
- `Backup usable`: il backup delle chiavi della stanza può essere caricato con materiale di recovery fidato.
- `Device verified by owner`: l'attuale dispositivo OpenClaw ha piena fiducia dell'identità Matrix cross-signing.

`Signed by owner` nell'output verboso o JSON è solo diagnostico. OpenClaw non lo considera sufficiente a meno che anche `Cross-signing verified` non sia `yes`.

Il comando continua comunque a terminare con un codice diverso da zero quando la piena fiducia dell'identità Matrix è incompleta, anche se la recovery key può sbloccare il materiale di backup. In quel caso, completa l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

Accetta la richiesta in un altro client Matrix, confronta gli emoji o i decimali SAS e digita `yes` solo quando corrispondono. Il comando attende che Matrix riporti `Cross-signing verified: yes` prima di terminare con successo.

Usa `verify bootstrap --force-reset-cross-signing` solo quando vuoi intenzionalmente sostituire l'identità di cross-signing corrente.

Dettagli verbosi della verifica del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Controlla lo stato di salute del backup delle chiavi delle stanze:

```bash
openclaw matrix verify backup status
```

Diagnostica verbosa dello stato di salute del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi delle stanze dal backup sul server:

```bash
openclaw matrix verify backup restore
```

Flusso interattivo di autoverifica:

```bash
openclaw matrix verify self
```

Per richieste di verifica di livello inferiore o in entrata, usa:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Usa `openclaw matrix verify cancel <id>` per annullare una richiesta.

Diagnostica verbosa del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina il backup server corrente e crea una nuova baseline di backup. Se la chiave di backup memorizzata non può essere caricata correttamente, questo reset può anche ricreare il secret storage così i futuri avvii a freddo potranno caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per impostazione predefinita (incluso il logging interno silenzioso dell'SDK) e mostrano diagnostica dettagliata solo con `--verbose`.
Usa `--json` per un output completo leggibile da macchina durante lo scripting.

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account predefinito implicito di Matrix a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure queste operazioni CLI implicite si fermeranno e ti chiederanno di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o sui dispositivi puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Cosa significa verificato">
    OpenClaw considera un dispositivo verificato solo quando la tua identità di cross-signing lo firma. `verify status --verbose` espone tre segnali di fiducia:

    - `Locally trusted`: fidato solo da questo client
    - `Cross-signing verified`: l'SDK riporta la verifica tramite cross-signing
    - `Signed by owner`: firmato dalla tua stessa chiave self-signing

    `Verified by owner` diventa `yes` solo quando è presente la verifica cross-signing.
    La fiducia locale o una firma del proprietario da sole non bastano perché OpenClaw consideri
    il dispositivo completamente verificato.

  </Accordion>

  <Accordion title="Cosa fa bootstrap">
    `verify bootstrap` è il comando di riparazione e configurazione per gli account crittografati. In ordine, esegue:

    - inizializza il secret storage, riutilizzando una recovery key esistente quando possibile
    - inizializza il cross-signing e carica le chiavi pubbliche di cross-signing mancanti
    - contrassegna e firma con cross-signing il dispositivo corrente
    - crea un backup lato server delle chiavi delle stanze se non ne esiste già uno

    Se l'homeserver richiede UIA per caricare le chiavi di cross-signing, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, poi `m.login.password` (richiede `channels.matrix.password`). Usa `--force-reset-cross-signing` solo quando vuoi deliberatamente scartare l'identità corrente.

  </Accordion>

  <Accordion title="Nuova baseline di backup">
    Se vuoi mantenere funzionanti i futuri messaggi crittografati e accettare di perdere la vecchia cronologia non recuperabile:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Aggiungi `--account <id>` per puntare a un account con nome. Questo può anche ricreare il secret storage se il segreto di backup corrente non può essere caricato in sicurezza.

  </Accordion>

  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` ha come valore predefinito `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, saltando i duplicati e applicando un cooldown. Regola il comportamento con `startupVerificationCooldownHours` o disabilitalo con `startupVerification: "off"`.

    All'avvio viene anche eseguito un passaggio conservativo di bootstrap crittografico che riutilizza il secret storage corrente e l'identità di cross-signing. Se lo stato bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede password UIA, all'avvio registra un avviso e resta non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Vedi [Migrazione Matrix](/it/install/migrating-matrix) per il flusso completo di aggiornamento.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica gli avvisi del ciclo di vita della verifica nella rigida stanza DM di verifica come messaggi `m.notice`: richiesta, ready (con indicazioni "Verify by emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in arrivo da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato una volta disponibile la verifica tramite emoji — devi comunque confrontare e confermare "They match" nel tuo client Matrix.

    Gli avvisi di sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Igiene dei dispositivi">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elencali e ripuliscili:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Archivio crittografico">
    Matrix E2EE usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato runtime crittografato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include il sync store, il crypto store, la recovery key, lo snapshot IDB, i binding dei thread e lo stato della verifica all'avvio. Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore root esistente così lo stato precedente resta visibile.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

Aggiorna il profilo Matrix dell'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi puntare esplicitamente a un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override dell'account selezionato).

## Thread

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite strumento messaggio.

- `dm.sessionScope: "per-user"` (predefinito) mantiene l'instradamento dei DM Matrix con ambito mittente, così più stanze DM possono condividere una sessione quando vengono risolte allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza DM Matrix nella propria chiave di sessione pur continuando a usare i normali controlli di autenticazione DM e allowlist.
- I binding espliciti delle conversazioni Matrix hanno comunque la precedenza su `dm.sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.
- `threadReplies: "off"` mantiene le risposte al livello superiore e conserva i messaggi thread in entrata sulla sessione padre.
- `threadReplies: "inbound"` risponde all'interno di un thread solo quando il messaggio in entrata era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio attivatore e instrada quella conversazione tramite la sessione con ambito thread corrispondente a partire dal primo messaggio attivatore.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per i DM. Ad esempio, puoi mantenere isolati i thread delle stanze lasciando piatti i DM.
- I messaggi thread in entrata includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii tramite strumento messaggio ereditano automaticamente il thread Matrix corrente quando la destinazione è la stessa stanza, o lo stesso utente DM di destinazione, a meno che non venga fornito un `threadId` esplicito.
- Il riuso della destinazione utente DM nella stessa sessione si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw torna al normale instradamento con ambito utente.
- Quando OpenClaw vede una stanza DM Matrix andare in collisione con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica un `m.notice` una sola volta in quella stanza con la via di fuga `/focus` quando i binding dei thread sono abilitati e con il suggerimento `dm.sessionScope`.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato a thread funzionano nelle stanze Matrix e nei DM.
- `/focus` a livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions=true`.
- L'esecuzione di `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Stanze Matrix, DM e thread Matrix esistenti possono essere trasformati in workspace ACP persistenti senza cambiare la superficie della chat.

Flusso operativo rapido:

- Esegui `/acp spawn codex --bind here` nel DM Matrix, nella stanza o nel thread esistente che vuoi continuare a usare.
- In un DM o stanza Matrix di livello superiore, il DM/la stanza corrente resta la superficie della chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, quando OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione del binding dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di generazione associati ai thread Matrix sono opzionali:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in entrata e reazioni di ack in entrata.

- Gli strumenti di reazione in uscita sono controllati da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a uno specifico evento Matrix.
- `reactions` elenca il riepilogo attuale delle reazioni per uno specifico evento Matrix.
- `emoji=""` rimuove le reazioni dell'account bot su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dall'account bot.

L'ambito delle reazioni di ack viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente

L'ambito della reazione di ack viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità di notifica delle reazioni viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Usa come fallback `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore effettivo predefinito è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo per stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw bufferizza i messaggi della stanza che non hanno ancora attivato una risposta, poi crea uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in entrata per quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di spostarsi in avanti verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come il testo di risposta recuperato, le radici dei thread e la cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli attivi della allowlist di stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in entrata stesso possa attivare una risposta.
L'autorizzazione del trigger continua a dipendere da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni di policy DM.

## Policy DM e stanza

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Vedi [Gruppi](/it/channels/groups) per il comportamento di gating delle menzioni e della allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a scriverti prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in attesa e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generarne uno nuovo.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing DM e il layout di archiviazione.

## Riparazione diretta della stanza

Se lo stato dei messaggi diretti va fuori sincronia, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Controlla il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Il flusso di riparazione:

- preferisce un DM stretto 1:1 già mappato in `m.direct`
- in fallback usa qualsiasi DM stretto 1:1 attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM sano

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Seleziona solo il DM sano e aggiorna il mapping in modo che i nuovi invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti puntino di nuovo alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo per un account Matrix. Le impostazioni native di instradamento DM/canale restano comunque nella configurazione delle approvazioni exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opzionale; usa come fallback `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni native quando `enabled` non è impostato o è `"auto"` e almeno un approvatore può essere risolto. Le approvazioni exec usano prima `execApprovals.approvers` e possono usare come fallback `channels.matrix.dm.allowFrom`. Le approvazioni Plugin autorizzano tramite `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. Altrimenti, le richieste di approvazione usano come fallback altre route di approvazione configurate o la policy di fallback delle approvazioni.

L'instradamento nativo Matrix supporta entrambi i tipi di approvazione:

- `channels.matrix.execApprovals.*` controlla la modalità nativa di fanout DM/canale per i prompt di approvazione Matrix.
- Le approvazioni exec usano il set di approvatori exec da `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Le approvazioni Plugin usano la allowlist DM Matrix da `channels.matrix.dm.allowFrom`.
- Le scorciatoie tramite reazioni Matrix e gli aggiornamenti dei messaggi si applicano sia alle approvazioni exec sia a quelle Plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` rimanda il prompt alla stanza o al DM Matrix di origine
- `target: "both"` invia ai DM degli approvatori e alla stanza o al DM Matrix di origine

I prompt di approvazione Matrix inizializzano scorciatoie di reazione sul messaggio di approvazione primario:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando quella decisione è consentita dalla policy exec effettiva

Gli approvatori possono reagire a quel messaggio oppure usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Per le approvazioni exec, la consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze fidate.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

## Slash command

Gli slash command Matrix (ad esempio `/new`, `/reset`, `/model`) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche gli slash command preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza bisogno di una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare le policy di allowlist/proprietario dei DM o delle stanze proprio come i normali messaggi.

## Multi-account

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

I valori di primo livello `channels.matrix` agiscono come predefiniti per gli account con nome, a meno che un account non li sovrascriva.
Puoi limitare le voci di stanza ereditate a un account Matrix con `groups.<room>.account`.
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente a livello superiore in `channels.matrix.*`.
I predefiniti parziali condivisi di autenticazione non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di primo livello solo quando quel predefinito ha autenticazione aggiornata (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare individuabili da `homeserver` più `userId` quando le credenziali in cache soddisfano l'autenticazione in un secondo momento.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/configurazione da account singolo a multi-account preserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi Matrix di autenticazione/bootstrap vengono spostate in quell'account promosso; le chiavi condivise di policy di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per instradamento implicito, probing e operazioni CLI.
Se sono configurati più account Matrix e uno degli ID account è `default`, OpenClaw usa implicitamente quell'account anche quando `defaultAccount` non è impostato.
Se configuri più account con nome, imposta `defaultAccount` o passa `--account <id>` per i comandi CLI che dipendono dalla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un singolo comando.

Vedi [Riferimento della configurazione](/it/gateway/config-channels#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu
non li autorizzi esplicitamente per account.

Se il tuo homeserver è in esecuzione su localhost, su un IP LAN/Tailscale o su un hostname interno, abilita
`network.dangerouslyAllowPrivateNetwork` per quell'account Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Esempio di configurazione CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Questo opt-in consente solo destinazioni private/interne fidate. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` quando possibile.

## Instradamento del traffico Matrix tramite proxy

Se il tuo deployment Matrix richiede un proxy HTTP(S) in uscita esplicito, imposta `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Gli account con nome possono sovrascrivere il predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix runtime e per i probe dello stato dell'account.

## Risoluzione delle destinazioni

Matrix accetta questi formati di destinazione ovunque OpenClaw ti chieda una stanza o una destinazione utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix autenticato:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi usano come fallback la ricerca nei nomi delle stanze unite per quell'account.
- La ricerca per nome tra le stanze unite è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento della configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver viene risolto in `localhost`, un IP LAN/Tailscale o un host interno come `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) facoltativo per il traffico Matrix. Gli account con nome possono sovrascrivere il valore predefinito di primo livello con il proprio `proxy`.
- `userId`: ID utente Matrix completo, ad esempio `@bot:example.org`.
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` tramite provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).
- `password`: password per il login basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per il login con password.
- `avatarUrl`: URL dell'avatar del profilo memorizzato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.
- `encryption`: abilita E2EE.
- `allowlistOnly`: quando è `true`, aggiorna la policy stanza `open` a `allowlist` e forza tutte le policy DM attive tranne `disabled` (incluse `pairing` e `open`) a `allowlist`. Non influisce sulle policy `disabled`.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico della stanza. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `historyLimit`: numero massimo di messaggi della stanza da includere come contesto della cronologia di gruppo. Usa come fallback `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore effettivo predefinito è `0`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` e `true` abilitano aggiornamenti delle bozze con anteprima iniziale usando normali messaggi di testo Matrix. `"quiet"` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push. `false` equivale a `"off"`.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi assistant completati mentre è attivo lo streaming della bozza di anteprima.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: override per canale per l'instradamento e il ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità di richiesta automatica di autoverifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare le richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione dei blocchi di messaggio in uscita in caratteri (si applica quando `chunkMode` è `length`).
- `chunkMode`: `length` divide i messaggi per numero di caratteri; `newline` li divide ai confini di riga.
- `responsePrefix`: stringa facoltativa anteposta a tutte le risposte in uscita per questo canale.
- `ackReaction`: override facoltativo della reazione di ack per questo canale/account.
- `ackReactionScope`: override facoltativo dell'ambito della reazione di ack (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in entrata (`own`, `off`).
- `mediaMaxMb`: limite dimensionale dei contenuti multimediali in MB per gli invii in uscita e l'elaborazione dei contenuti multimediali in entrata.
- `autoJoin`: policy di auto-join per gli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica a tutti gli inviti Matrix, inclusi quelli in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco policy DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso DM dopo che OpenClaw si è unito alla stanza e l'ha classificata come DM. Non cambia se un invito viene accettato automaticamente.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `dm.sessionScope`: `per-user` (predefinito) o `per-room`. Usa `per-room` quando vuoi che ogni stanza DM Matrix mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override della policy dei thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di primo livello sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna nativa Matrix delle approvazioni exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override nominati per account. I valori di primo livello `channels.matrix` agiscono come predefiniti per queste voci.
- `groups`: mappa di policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità di sessione/gruppo usa l'ID stanza stabile dopo la risoluzione.
- `groups.<room>.account`: limita una voce di stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello stanza per i mittenti bot configurati (`true` o `"mentions"`).
- `groups.<room>.users`: allowlist mittenti per stanza.
- `groups.<room>.tools`: override per stanza di allow/deny degli strumenti.
- `groups.<room>.autoReply`: override a livello stanza del gating delle menzioni. `true` disabilita i requisiti di menzione per quella stanza; `false` li riattiva forzatamente.
- `groups.<room>.skills`: filtro Skills facoltativo a livello stanza.
- `groups.<room>.systemPrompt`: frammento facoltativo di system prompt a livello stanza.
- `rooms`: alias legacy di `groups`.
- `actions`: gating per azione degli strumenti (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
