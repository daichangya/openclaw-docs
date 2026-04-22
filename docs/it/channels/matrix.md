---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurazione di Matrix E2EE e verifica
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix è un plugin di canale incluso per OpenClaw.
Usa il `matrix-js-sdk` ufficiale e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix viene distribuito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Matrix, installalo
manualmente:

Installa da npm:

```bash
openclaw plugins install @openclaw/matrix
```

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Vedi [Plugins](/it/tools/plugin) per il comportamento dei plugin e le regole di installazione.

## Configurazione iniziale

1. Assicurati che il plugin Matrix sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno di questi:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il Gateway.
5. Avvia una DM con il bot o invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` li consente.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata di Matrix chiede:

- URL dell'homeserver
- metodo di autenticazione: access token o password
- ID utente (solo autenticazione con password)
- nome del dispositivo facoltativo
- se abilitare E2EE
- se configurare l'accesso alle stanze e l'adesione automatica agli inviti

Comportamenti principali della procedura guidata:

- Se esistono già variabili d'ambiente di autenticazione Matrix e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia env per mantenere l'autenticazione nelle variabili d'ambiente.
- I nomi degli account vengono normalizzati nell'ID account. Ad esempio, `Ops Bot` diventa `ops-bot`.
- Le voci della allowlist DM accettano direttamente `@user:server`; i nomi visualizzati funzionano solo quando la ricerca live nella directory trova una corrispondenza esatta.
- Le voci della allowlist delle stanze accettano direttamente gli ID stanza e gli alias. Preferisci `!room:server` o `#alias:server`; i nomi non risolti vengono ignorati a runtime dalla risoluzione della allowlist.
- Nella modalità allowlist di adesione automatica agli inviti, usa solo destinazioni di invito stabili: `!roomId:server`, `#alias:server` o `*`. I semplici nomi delle stanze vengono rifiutati.
- Per risolvere i nomi delle stanze prima del salvataggio, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` è impostato su `off` per impostazione predefinita.

Se lo lasci non impostato, il bot non entrerà nelle stanze a cui è invitato o nei nuovi inviti in stile DM, quindi non comparirà nei nuovi gruppi o nelle DM invitate a meno che tu non lo faccia entrare manualmente prima.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare quali inviti accetta, oppure imposta `autoJoin: "always"` se vuoi che entri in ogni invito.

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

Entra in ogni invito:

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
Quando lì esistono credenziali in cache, OpenClaw considera Matrix configurato per la configurazione iniziale, doctor e il rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti tramite variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

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

Matrix esegue l'escape della punteggiatura negli ID account per evitare collisioni nelle variabili d'ambiente con ambito.
Ad esempio, `-` diventa `_X2D_`, quindi `ops-prod` corrisponde a `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia tramite variabili d'ambiente solo quando tali variabili di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

## Esempio di configurazione

Questa è una configurazione di base pratica con abbinamento DM, allowlist delle stanze ed E2EE abilitato:

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

`autoJoin` si applica a tutti gli inviti Matrix, compresi quelli in stile DM. OpenClaw non può
classificare in modo affidabile una stanza invitata come DM o gruppo al momento dell'invito, quindi tutti gli inviti passano prima attraverso `autoJoin`.
`dm.policy` si applica dopo che il bot è entrato e la stanza è stata classificata come DM.

## Anteprime in streaming

Lo streaming delle risposte Matrix è facoltativo.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola anteprima live
della risposta, modifichi quell'anteprima sul posto mentre il modello sta generando testo e poi la
finalizzi quando la risposta è completata:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` è l'impostazione predefinita. OpenClaw attende la risposta finale e la invia una sola volta.
- `streaming: "partial"` crea un messaggio di anteprima modificabile per l'attuale blocco dell'assistente usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di notifica basato prima sull'anteprima di Matrix, quindi i client standard possono notificare il primo testo dell'anteprima in streaming invece del blocco completato.
- `streaming: "quiet"` crea un'anteprima discreta modificabile per l'attuale blocco dell'assistente. Usalo solo se configuri anche regole push per il destinatario sulle modifiche di anteprima finalizzate.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming delle anteprime abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming delle anteprime è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza lo stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte multimediali inviano comunque gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche dell'anteprima comportano chiamate API Matrix aggiuntive. Lascia lo streaming disattivato se vuoi il comportamento più conservativo rispetto ai limiti di frequenza.

`blockStreaming` da solo non abilita le anteprime bozza.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche di anteprima; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi completati dell'assistente restino visibili come messaggi di avanzamento separati.

Se hai bisogno delle notifiche standard di Matrix senza regole push personalizzate, usa `streaming: "partial"` per il comportamento basato prima sull'anteprima oppure lascia `streaming` disattivato per la consegna solo finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come un normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come un normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime discreti finalizzate

Se gestisci la tua infrastruttura Matrix e vuoi che le anteprime discreti notifichino solo quando un blocco o
una risposta finale è completata, imposta `streaming: "quiet"` e aggiungi una regola push per utente per le modifiche di anteprima finalizzate.

Di solito questa è una configurazione dell'utente destinatario, non una modifica di configurazione globale dell'homeserver:

Mappa rapida prima di iniziare:

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix OpenClaw che invia la risposta
- usa l'access token dell'utente destinatario per le chiamate API qui sotto
- fai corrispondere `sender` nella regola push con l'MXID completo dell'utente bot

1. Configura OpenClaw per usare anteprime discrete:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Assicurati che l'account del destinatario riceva già le normali notifiche push Matrix. Le regole per le anteprime discrete
   funzionano solo se quell'utente ha già pusher/dispositivi funzionanti.

3. Ottieni l'access token dell'utente destinatario.
   - Usa il token dell'utente che riceve, non quello del bot.
   - Riutilizzare un token di sessione client esistente di solito è la soluzione più semplice.
   - Se devi generare un nuovo token, puoi effettuare il login tramite la normale API Client-Server di Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifica che l'account del destinatario abbia già dei pusher:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se questo non restituisce pusher/dispositivi attivi, correggi prima le normali notifiche Matrix prima di aggiungere la
regola OpenClaw qui sotto.

OpenClaw contrassegna le modifiche di anteprima finalizzate solo testo con:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Crea una regola push di override per ogni account destinatario che deve ricevere queste notifiche:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Sostituisci questi valori prima di eseguire il comando:

- `https://matrix.example.org`: URL di base del tuo homeserver
- `$USER_ACCESS_TOKEN`: access token dell'utente che riceve
- `openclaw-finalized-preview-botname`: un ID regola univoco per questo bot per questo utente che riceve
- `@bot:example.org`: l'MXID del tuo bot Matrix OpenClaw, non l'MXID dell'utente che riceve

Importante per le configurazioni multi-bot:

- Le regole push sono identificate da `ruleId`. Eseguire di nuovo `PUT` sullo stesso ID regola aggiorna quella singola regola.
- Se un utente destinatario deve ricevere notifiche per più account bot Matrix OpenClaw, crea una regola per ogni bot con un ID regola univoco per ogni corrispondenza del mittente.
- Uno schema semplice è `openclaw-finalized-preview-<botname>`, ad esempio `openclaw-finalized-preview-ops` oppure `openclaw-finalized-preview-support`.

La regola viene valutata rispetto al mittente dell'evento:

- autenticati con il token dell'utente destinatario
- fai corrispondere `sender` con l'MXID del bot OpenClaw

6. Verifica che la regola esista:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testa una risposta in streaming. In modalità quiet, la stanza dovrebbe mostrare un'anteprima bozza discreta e la
   modifica finale sul posto dovrebbe inviare una notifica una volta terminato il blocco o il turno.

Se in seguito devi rimuovere la regola, elimina lo stesso ID regola con il token dell'utente destinatario:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Note:

- Crea la regola con l'access token dell'utente destinatario, non con quello del bot.
- Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non serve alcun parametro di ordinamento aggiuntivo.
- Questo influenza solo le modifiche di anteprima solo testo che OpenClaw può finalizzare in sicurezza sul posto. I fallback per i contenuti multimediali e quelli per anteprime obsolete continuano a usare la normale consegna Matrix.
- Se `GET /_matrix/client/v3/pushers` non mostra alcun pusher, l'utente non ha ancora una consegna push Matrix funzionante per questo account/dispositivo.

#### Synapse

Per Synapse, la configurazione sopra di solito è sufficiente da sola:

- Non è richiesta alcuna modifica speciale a `homeserver.yaml` per le notifiche delle anteprime OpenClaw finalizzate.
- Se il tuo deployment Synapse invia già le normali notifiche push Matrix, il token utente + la chiamata `pushrules` qui sopra sono il passaggio principale della configurazione.
- Se esegui Synapse dietro un reverse proxy o worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse.
- Se usi worker Synapse, assicurati che i pusher siano in salute. La consegna push è gestita dal processo principale o da `synapse.app.pusher` / dai worker pusher configurati.

#### Tuwunel

Per Tuwunel, usa lo stesso flusso di configurazione e la stessa chiamata API `push-rule` mostrati sopra:

- Non è richiesta alcuna configurazione specifica di Tuwunel per l'indicatore di anteprima finalizzata in sé.
- Se le normali notifiche Matrix funzionano già per quell'utente, il token utente + la chiamata `pushrules` qui sopra sono il passaggio principale della configurazione.
- Se le notifiche sembrano scomparire mentre l'utente è attivo su un altro dispositivo, controlla se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione in Tuwunel 1.4.2 il 12 settembre 2025 e può sopprimere intenzionalmente le notifiche push verso altri dispositivi mentre un dispositivo è attivo.

## Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix inter-agent:

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

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati nelle stanze consentite e nelle DM.
- `allowBots: "mentions"` accetta tali messaggi solo quando menzionano visibilmente questo bot nelle stanze. Le DM sono comunque consentite.
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello di account per una stanza.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di auto-risposta.
- Matrix non espone qui un flag bot nativo; OpenClaw considera "scritto da un bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist rigorose per le stanze e l'obbligo di menzione quando abiliti traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi di immagine in uscita usano `thumbnail_file` così le anteprime delle immagini vengono crittografate insieme all'allegato completo. Le stanze non crittografate continuano a usare `thumbnail_url` semplice. Non è necessaria alcuna configurazione: il plugin rileva automaticamente lo stato E2EE.

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

Controlla lo stato della verifica:

```bash
openclaw matrix verify status
```

Stato verboso (diagnostica completa):

```bash
openclaw matrix verify status --verbose
```

Includi la chiave di recupero memorizzata nell'output leggibile dalla macchina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza lo stato di cross-signing e verifica:

```bash
openclaw matrix verify bootstrap
```

Diagnostica dettagliata del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un nuovo azzeramento dell'identità di cross-signing prima del bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifica questo dispositivo con una chiave di recupero:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Dettagli verbosi della verifica del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Controlla lo stato di salute del backup delle chiavi stanza:

```bash
openclaw matrix verify backup status
```

Diagnostica dettagliata dello stato del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi stanza dal backup del server:

```bash
openclaw matrix verify backup restore
```

Diagnostica dettagliata del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina l'attuale backup del server e crea una nuova baseline di backup. Se la chiave di
backup memorizzata non può essere caricata correttamente, questo reset può anche ricreare il secret storage in modo che
i futuri avvii a freddo possano caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per impostazione predefinita (incluso il logging interno quiet dell'SDK) e mostrano una diagnostica dettagliata solo con `--verbose`.
Usa `--json` per un output completo leggibile dalla macchina negli script.

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account Matrix predefinito implicito a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure quelle operazioni CLI implicite si fermeranno e ti chiederanno di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o del dispositivo puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

### Cosa significa "verified"

OpenClaw considera questo dispositivo Matrix verificato solo quando è verificato dalla tua stessa identità di cross-signing.
In pratica, `openclaw matrix verify status --verbose` espone tre segnali di attendibilità:

- `Locally trusted`: questo dispositivo è attendibile solo dal client corrente
- `Cross-signing verified`: l'SDK segnala il dispositivo come verificato tramite cross-signing
- `Signed by owner`: il dispositivo è firmato dalla tua stessa chiave self-signing

`Verified by owner` diventa `yes` solo quando sono presenti verifica cross-signing o firma del proprietario.
La sola attendibilità locale non è sufficiente perché OpenClaw tratti il dispositivo come completamente verificato.

### Cosa fa il bootstrap

`openclaw matrix verify bootstrap` è il comando di riparazione e configurazione per gli account Matrix crittografati.
Fa tutte le seguenti operazioni in ordine:

- inizializza il secret storage, riutilizzando una chiave di recupero esistente quando possibile
- inizializza il cross-signing e carica le chiavi pubbliche di cross-signing mancanti
- tenta di contrassegnare e firmare tramite cross-signing il dispositivo corrente
- crea un nuovo backup lato server delle chiavi stanza se non ne esiste già uno

Se l'homeserver richiede autenticazione interattiva per caricare le chiavi di cross-signing, OpenClaw prova prima il caricamento senza autenticazione, poi con `m.login.dummy`, quindi con `m.login.password` quando `channels.matrix.password` è configurato.

Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente scartare l'attuale identità di cross-signing e crearne una nuova.

Se vuoi intenzionalmente scartare l'attuale backup delle chiavi stanza e avviare una nuova
baseline di backup per i messaggi futuri, usa `openclaw matrix verify backup reset --yes`.
Fallo solo se accetti che la vecchia cronologia crittografata irrecuperabile resti
non disponibile e che OpenClaw possa ricreare il secret storage se l'attuale
segreto di backup non può essere caricato in sicurezza.

### Nuova baseline di backup

Se vuoi mantenere funzionanti i futuri messaggi crittografati e accetti di perdere la vecchia cronologia irrecuperabile, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Aggiungi `--account <id>` a ogni comando quando vuoi puntare esplicitamente a un account Matrix con nome.

### Comportamento all'avvio

Quando `encryption: true`, Matrix imposta per default `startupVerification` su `"if-unverified"`.
All'avvio, se questo dispositivo non è ancora verificato, Matrix richiederà l'auto-verifica in un altro client Matrix,
salterà le richieste duplicate quando una è già in sospeso e applicherà un cooldown locale prima di riprovare dopo i riavvii.
Per impostazione predefinita, i tentativi di richiesta falliti vengono ritentati prima rispetto alla creazione riuscita della richiesta.
Imposta `startupVerification: "off"` per disabilitare le richieste automatiche all'avvio, oppure regola `startupVerificationCooldownHours`
se vuoi una finestra di nuovo tentativo più breve o più lunga.

All'avvio viene eseguito automaticamente anche un passaggio prudente di bootstrap crypto.
Quel passaggio prova prima a riutilizzare il secret storage e l'identità di cross-signing correnti ed evita di reimpostare il cross-signing a meno che tu non esegua un flusso esplicito di riparazione bootstrap.

Se all'avvio Matrix rileva ancora uno stato bootstrap danneggiato, OpenClaw può tentare un percorso di riparazione protetto anche quando `channels.matrix.password` non è configurato.
Se l'homeserver richiede UIA basata su password per quella riparazione, OpenClaw registra un avviso e mantiene l'avvio non fatale invece di interrompere il bot.
Se il dispositivo corrente è già firmato dal proprietario, OpenClaw preserva tale identità invece di reimpostarla automaticamente.

Vedi [Matrix migration](/it/install/migrating-matrix) per il flusso completo di aggiornamento, i limiti, i comandi di recupero e i messaggi comuni di migrazione.

### Avvisi di verifica

Matrix pubblica gli avvisi del ciclo di vita della verifica direttamente nella rigorosa stanza DM di verifica come messaggi `m.notice`.
Questo include:

- avvisi di richiesta di verifica
- avvisi di verifica pronta (con indicazione esplicita "Verify by emoji")
- avvisi di avvio e completamento della verifica
- dettagli SAS (emoji e decimali) quando disponibili

Le richieste di verifica in arrivo da un altro client Matrix vengono tracciate e accettate automaticamente da OpenClaw.
Per i flussi di auto-verifica, OpenClaw avvia automaticamente anche il flusso SAS quando la verifica con emoji diventa disponibile e conferma il proprio lato.
Per le richieste di verifica da un altro utente/dispositivo Matrix, OpenClaw accetta automaticamente la richiesta e poi attende che il flusso SAS proceda normalmente.
Devi comunque confrontare le emoji o il SAS decimale nel tuo client Matrix e confermare lì "They match" per completare la verifica.

OpenClaw non accetta automaticamente alla cieca i flussi duplicati auto-avviati. All'avvio evita di creare una nuova richiesta quando è già presente una richiesta di auto-verifica in sospeso.

Gli avvisi di verifica di protocollo/sistema non vengono inoltrati alla pipeline di chat dell'agente, quindi non producono `NO_REPLY`.

### Igiene dei dispositivi

I vecchi dispositivi Matrix gestiti da OpenClaw possono accumularsi nell'account e rendere più difficile valutare l'attendibilità nelle stanze crittografate.
Elencali con:

```bash
openclaw matrix devices list
```

Rimuovi i dispositivi OpenClaw gestiti obsoleti con:

```bash
openclaw matrix devices prune-stale
```

### Archivio crittografico

Matrix E2EE usa il percorso crypto Rust ufficiale di `matrix-js-sdk` in Node, con `fake-indexeddb` come shim IndexedDB. Lo stato crypto viene persistito in un file snapshot (`crypto-idb-snapshot.json`) e ripristinato all'avvio. Il file snapshot contiene stato runtime sensibile ed è memorizzato con permessi file restrittivi.

Lo stato runtime crittografato si trova sotto radici per-account e per-utente, con hash del token, in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Quella directory contiene il sync store (`bot-storage.json`), il crypto store (`crypto/`),
il file della chiave di recupero (`recovery-key.json`), lo snapshot IndexedDB (`crypto-idb-snapshot.json`),
i binding dei thread (`thread-bindings.json`) e lo stato della verifica all'avvio (`startup-verification.json`).
Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore radice esistente
per quella tupla account/homeserver/utente, così lo stato sync precedente, lo stato crypto, i binding dei thread
e lo stato della verifica all'avvio restano visibili.

## Gestione del profilo

Aggiorna il profilo Matrix dell'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi puntare esplicitamente a un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza di nuovo l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override dell'account selezionato).

## Thread

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii degli strumenti messaggio.

- `dm.sessionScope: "per-user"` (predefinito) mantiene l'instradamento delle DM Matrix con ambito mittente, così più stanze DM possono condividere una sessione quando vengono risolte allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza DM Matrix nella propria chiave di sessione pur continuando a usare i normali controlli di autenticazione DM e allowlist.
- I binding espliciti delle conversazioni Matrix hanno comunque la precedenza su `dm.sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.
- `threadReplies: "off"` mantiene le risposte al livello superiore e mantiene i messaggi in thread in ingresso sulla sessione padre.
- `threadReplies: "inbound"` risponde all'interno di un thread solo quando il messaggio in ingresso era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio che ha attivato la risposta e instrada quella conversazione attraverso la sessione con ambito thread corrispondente dal primo messaggio attivante.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per le DM. Ad esempio, puoi mantenere isolati i thread delle stanze lasciando piatte le DM.
- I messaggi in thread in ingresso includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii degli strumenti messaggio ereditano automaticamente il thread Matrix corrente quando la destinazione è la stessa stanza, o lo stesso utente DM di destinazione, a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo della stessa sessione con destinazione utente DM entra in funzione solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw torna al normale instradamento con ambito utente.
- Quando OpenClaw vede che una stanza DM Matrix entra in collisione con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica un `m.notice` una sola volta in quella stanza con la via di fuga `/focus` quando i binding dei thread sono abilitati e con l'indicazione `dm.sessionScope`.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato al thread funzionano nelle stanze e DM Matrix.
- `/focus` di livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Le stanze Matrix, le DM e i thread Matrix esistenti possono essere trasformati in workspace ACP persistenti senza cambiare la superficie di chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` dentro la DM Matrix, stanza o thread esistente che vuoi continuare a usare.
- In una DM o stanza Matrix di livello superiore, la DM/stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
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

I flag di generazione associata ai thread Matrix sono opt-in:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in ingresso e reazioni di ack in ingresso.

- Lo strumento delle reazioni in uscita è controllato da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a un evento Matrix specifico.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix specifico.
- `emoji=""` rimuove le reazioni dell'account bot stesso su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dall'account bot.

L'ambito delle reazioni di ack viene risolto in quest'ordine:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente

L'ambito della reazione di ack viene risolto in quest'ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità di notifica delle reazioni viene risolta in quest'ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni di reazione non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza sono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Fa fallback a `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo della stanza. Le DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw mette in buffer i messaggi della stanza che non hanno ancora attivato una risposta, poi fotografa quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I retry dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo di risposta recuperato, radici dei thread e cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli attivi di allowlist della stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a derivare da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri DM.

## Criteri per DM e stanze

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

Vedi [Groups](/it/channels/groups) per il comportamento di gating delle menzioni e della allowlist.

Esempio di pairing per le DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a mandarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in sospeso e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing DM e il layout di archiviazione.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti va fuori sincronia, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che alla DM attiva. Ispeziona il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Il flusso di riparazione:

- preferisce una DM strettamente 1:1 che è già mappata in `m.direct`
- fa fallback a qualsiasi DM strettamente 1:1 attualmente unita con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcuna DM sana

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Si limita a scegliere la DM sana e ad aggiornare il mapping in modo che i nuovi invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti puntino di nuovo alla stanza corretta.

## Approvazioni exec

Matrix può fungere da client di approvazione nativo per un account Matrix. Le manopole native
di instradamento DM/canale restano comunque sotto la configurazione delle approvazioni exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facoltativo; fa fallback a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni native quando `enabled` non è impostato oppure è `"auto"` e almeno un approvatore può essere risolto. Le approvazioni exec usano prima `execApprovals.approvers` e possono fare fallback a `channels.matrix.dm.allowFrom`. Le approvazioni Plugin autorizzano tramite `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. Altrimenti, le richieste di approvazione fanno fallback ad altri percorsi di approvazione configurati o alla policy di fallback delle approvazioni.

L'instradamento nativo Matrix supporta entrambi i tipi di approvazione:

- `channels.matrix.execApprovals.*` controlla la modalità nativa di fanout DM/canale per i prompt di approvazione Matrix.
- Le approvazioni exec usano l'insieme degli approvatori exec da `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Le approvazioni Plugin usano la allowlist DM Matrix da `channels.matrix.dm.allowFrom`.
- Le scorciatoie tramite reazione Matrix e gli aggiornamenti dei messaggi si applicano sia alle approvazioni exec sia a quelle Plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione alle DM degli approvatori
- `target: "channel"` rinvia il prompt nella stanza o DM Matrix di origine
- `target: "both"` invia alle DM degli approvatori e nella stanza o DM Matrix di origine

I prompt di approvazione Matrix inizializzano scorciatoie di reazione sul messaggio di approvazione principale:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando tale decisione è consentita dalla policy exec effettiva

Gli approvatori possono reagire a quel messaggio o usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always` oppure `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Per le approvazioni exec, la consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze fidate.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Exec approvals](/it/tools/exec-approvals)

## Comandi slash

I comandi slash Matrix (ad esempio `/new`, `/reset`, `/model`) funzionano direttamente nelle DM. Nelle stanze, OpenClaw riconosce anche i comandi slash preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza richiedere una regex di menzione personalizzata. Questo mantiene il bot reattivo ai messaggi in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare le policy DM o della allowlist della stanza/proprietario proprio come i normali messaggi.

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
Puoi limitare le voci di stanza ereditate a un solo account Matrix con `groups.<room>.account`.
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente al livello superiore `channels.matrix.*`.
I predefiniti di autenticazione condivisi parziali non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di primo livello solo quando quel predefinito ha autenticazione aggiornata (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare individuabili da `homeserver` più `userId` quando credenziali in cache soddisfano l'autenticazione in seguito.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/configurazione da account singolo a multi-account conserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi Matrix di autenticazione/bootstrap vengono spostate in quell'account promosso; le chiavi condivise di policy di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per instradamento implicito, probing e operazioni CLI.
Se sono configurati più account Matrix e uno degli ID account è `default`, OpenClaw usa implicitamente quell'account anche quando `defaultAccount` non è impostato.
Se configuri più account con nome, imposta `defaultAccount` oppure passa `--account <id>` per i comandi CLI che dipendono dalla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un comando.

Vedi [Configuration reference](/it/gateway/configuration-reference#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF a meno che tu
non faccia esplicitamente opt-in per account.

Se il tuo homeserver gira su localhost, su un IP LAN/Tailscale o su un hostname interno, abilita
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

## Proxy del traffico Matrix

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
OpenClaw usa la stessa impostazione proxy per il traffico Matrix runtime e per i probe di stato dell'account.

## Risoluzione della destinazione

Matrix accetta questi formati di destinazione ovunque OpenClaw ti chieda una stanza o una destinazione utente:

- Utenti: `@user:server`, `user:@user:server`, oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server`, oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, oppure `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix connesso:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi fanno fallback alla ricerca dei nomi delle stanze unite per quell'account.
- La ricerca per nome delle stanze unite è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento della configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver viene risolto in `localhost`, un IP LAN/Tailscale o un host interno come `matrix-synapse`.
- `proxy`: URL facoltativo del proxy HTTP(S) per il traffico Matrix. Gli account con nome possono sovrascrivere il predefinito di primo livello con il proprio `proxy`.
- `userId`: ID utente Matrix completo, ad esempio `@bot:example.org`.
- `accessToken`: access token per autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` tra provider env/file/exec. Vedi [Secrets Management](/it/gateway/secrets).
- `password`: password per login basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per login con password.
- `avatarUrl`: URL dell'avatar del profilo memorizzato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sync all'avvio.
- `encryption`: abilita E2EE.
- `allowlistOnly`: quando è `true`, aggiorna la policy stanza `open` a `allowlist` e forza tutte le policy DM attive eccetto `disabled` (incluse `pairing` e `open`) a `allowlist`. Non influisce sulle policy `disabled`.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` oppure `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oppure `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico della stanza. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte di directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `historyLimit`: numero massimo di messaggi della stanza da includere come contesto di cronologia di gruppo. Fa fallback a `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, `all` oppure `batched`.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `"partial"`, `"quiet"`, `true` oppure `false`. `"partial"` e `true` abilitano aggiornamenti bozza preview-first con normali messaggi di testo Matrix. `"quiet"` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push. `false` equivale a `"off"`.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi assistente completati mentre è attivo lo streaming delle anteprime bozza.
- `threadReplies`: `off`, `inbound` oppure `always`.
- `threadBindings`: override per canale per instradamento e ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità automatica di richiesta di auto-verifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione dei chunk dei messaggi in uscita in caratteri (si applica quando `chunkMode` è `length`).
- `chunkMode`: `length` divide i messaggi per numero di caratteri; `newline` li divide ai confini di riga.
- `responsePrefix`: stringa facoltativa anteposta a tutte le risposte in uscita per questo canale.
- `ackReaction`: override facoltativo della reazione di ack per questo canale/account.
- `ackReactionScope`: override facoltativo dell'ambito della reazione di ack (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`own`, `off`).
- `mediaMaxMb`: limite dimensione contenuti multimediali in MB per invii in uscita ed elaborazione dei contenuti multimediali in ingresso.
- `autoJoin`: policy di adesione automatica agli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica a tutti gli inviti Matrix, inclusi quelli in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco policy DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso DM dopo che OpenClaw è entrato nella stanza e l'ha classificata come DM. Non modifica l'adesione automatica a un invito.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte di directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `dm.sessionScope`: `per-user` (predefinito) oppure `per-room`. Usa `per-room` quando vuoi che ogni stanza DM Matrix mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override della policy dei thread solo DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di primo livello sia per il posizionamento delle risposte sia per l'isolamento delle sessioni nelle DM.
- `execApprovals`: consegna nativa Matrix delle approvazioni exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override con nome per account. I valori di primo livello `channels.matrix` agiscono come predefiniti per queste voci.
- `groups`: mappa di policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità di sessione/gruppo usa l'ID stanza stabile dopo la risoluzione.
- `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello stanza per mittenti bot configurati (`true` oppure `"mentions"`).
- `groups.<room>.users`: allowlist per mittente a livello stanza.
- `groups.<room>.tools`: override allow/deny degli strumenti a livello stanza.
- `groups.<room>.autoReply`: override a livello stanza per il gating delle menzioni. `true` disabilita l'obbligo di menzione per quella stanza; `false` lo forza di nuovo.
- `groups.<room>.skills`: filtro Skills facoltativo a livello stanza.
- `groups.<room>.systemPrompt`: snippet facoltativo di system prompt a livello stanza.
- `rooms`: alias legacy per `groups`.
- `actions`: gating degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — flusso di autenticazione DM e pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento del canale](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
