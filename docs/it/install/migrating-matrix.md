---
read_when:
    - Aggiornamento di un’installazione Matrix esistente
    - Migrazione della cronologia Matrix cifrata e dello stato del dispositivo
summary: Come OpenClaw aggiorna in-place il precedente Plugin Matrix, incluse le limitazioni del recupero dello stato cifrato e i passaggi di recupero manuale.
title: Migrazione di Matrix
x-i18n:
    generated_at: "2026-04-26T11:32:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Questa pagina copre gli aggiornamenti dal precedente Plugin pubblico `matrix` all’implementazione attuale.

Per la maggior parte degli utenti, l’aggiornamento avviene in-place:

- il Plugin resta `@openclaw/matrix`
- il canale resta `matrix`
- la tua config resta sotto `channels.matrix`
- le credenziali in cache restano sotto `~/.openclaw/credentials/matrix/`
- lo stato runtime resta sotto `~/.openclaw/matrix/`

Non devi rinominare le chiavi di config né reinstallare il Plugin con un nuovo nome.

## Cosa fa automaticamente la migrazione

Quando il gateway si avvia, e quando esegui [`openclaw doctor --fix`](/it/gateway/doctor), OpenClaw prova a riparare automaticamente il vecchio stato Matrix.
Prima che qualsiasi passaggio di migrazione Matrix attuabile modifichi lo stato su disco, OpenClaw crea o riusa uno snapshot di ripristino mirato.

Quando usi `openclaw update`, il trigger esatto dipende da come è installato OpenClaw:

- le installazioni da sorgente eseguono `openclaw doctor --fix` durante il flusso di aggiornamento, poi riavviano il gateway per impostazione predefinita
- le installazioni tramite package manager aggiornano il pacchetto, eseguono un passaggio doctor non interattivo, poi si affidano al riavvio predefinito del gateway così l’avvio può completare la migrazione Matrix
- se usi `openclaw update --no-restart`, la migrazione Matrix supportata dall’avvio viene rimandata finché in seguito non esegui `openclaw doctor --fix` e riavvii il gateway

La migrazione automatica copre:

- creazione o riuso di uno snapshot pre-migrazione sotto `~/Backups/openclaw-migrations/`
- riuso delle credenziali Matrix in cache
- mantenimento della stessa selezione dell’account e della config `channels.matrix`
- spostamento del più vecchio archivio sync Matrix flat nella posizione corrente con scope per account
- spostamento del più vecchio archivio crypto Matrix flat nella posizione corrente con scope per account quando l’account di destinazione può essere risolto in sicurezza
- estrazione di una chiave di decrittazione di backup delle room-key Matrix precedentemente salvata dal vecchio archivio rust crypto, quando quella chiave esiste localmente
- riuso della radice di archiviazione token-hash esistente più completa per lo stesso account Matrix, homeserver e utente quando il token di accesso cambia in seguito
- scansione delle radici di archiviazione token-hash sorelle per metadati in sospeso di ripristino dello stato cifrato quando il token di accesso Matrix è cambiato ma l’identità account/dispositivo è rimasta la stessa
- ripristino delle room key sottoposte a backup nel nuovo archivio crypto al successivo avvio Matrix

Dettagli dello snapshot:

- OpenClaw scrive un file marker in `~/.openclaw/matrix/migration-snapshot.json` dopo uno snapshot riuscito, così i successivi passaggi di avvio e riparazione possono riutilizzare lo stesso archivio.
- Questi snapshot automatici della migrazione Matrix eseguono il backup solo di config + stato (`includeWorkspace: false`).
- Se Matrix ha solo stato di migrazione con soli warning, ad esempio perché `userId` o `accessToken` mancano ancora, OpenClaw non crea ancora lo snapshot perché nessuna mutazione Matrix è attuabile.
- Se il passaggio di snapshot fallisce, OpenClaw salta la migrazione Matrix per quell’esecuzione invece di modificare lo stato senza un punto di recupero.

Informazioni sugli aggiornamenti multi-account:

- il più vecchio archivio Matrix flat (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) proviene da un layout a singolo archivio, quindi OpenClaw può migrarlo solo verso una destinazione account Matrix risolta
- gli archivi Matrix legacy già con scope per account vengono rilevati e preparati per ogni account Matrix configurato

## Cosa la migrazione non può fare automaticamente

Il precedente Plugin Matrix pubblico **non** creava automaticamente backup delle room-key Matrix. Manteneva lo stato crypto locale e richiedeva la verifica del dispositivo, ma non garantiva che le tue room key fossero sottoposte a backup sul homeserver.

Questo significa che alcune installazioni cifrate possono essere migrate solo parzialmente.

OpenClaw non può recuperare automaticamente:

- room key solo locali che non sono mai state sottoposte a backup
- stato cifrato quando l’account Matrix di destinazione non può ancora essere risolto perché `homeserver`, `userId` o `accessToken` non sono ancora disponibili
- migrazione automatica di un archivio Matrix flat condiviso quando sono configurati più account Matrix ma `channels.matrix.defaultAccount` non è impostato
- installazioni con percorso Plugin personalizzato bloccate a un percorso repo invece che al pacchetto Matrix standard
- una recovery key mancante quando il vecchio archivio aveva chiavi sottoposte a backup ma non conservava localmente la chiave di decrittazione

Ambito attuale dei warning:

- le installazioni Matrix con percorso Plugin personalizzato vengono segnalate sia dall’avvio del gateway sia da `openclaw doctor`

Se la tua vecchia installazione aveva cronologia cifrata solo locale che non è mai stata sottoposta a backup, alcuni messaggi cifrati più vecchi potrebbero restare illeggibili dopo l’aggiornamento.

## Flusso di aggiornamento consigliato

1. Aggiorna OpenClaw e il Plugin Matrix normalmente.
   Preferisci il semplice `openclaw update` senza `--no-restart` così l’avvio può completare immediatamente la migrazione Matrix.
2. Esegui:

   ```bash
   openclaw doctor --fix
   ```

   Se Matrix ha lavoro di migrazione attuabile, doctor creerà o riuserà prima lo snapshot pre-migrazione e stamperà il percorso dell’archivio.

3. Avvia o riavvia il gateway.
4. Controlla lo stato corrente di verifica e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Inserisci la recovery key dell’account Matrix che stai riparando in una variabile d’ambiente specifica per account. Per un singolo account predefinito, `MATRIX_RECOVERY_KEY` va bene. Per più account, usa una variabile per account, ad esempio `MATRIX_RECOVERY_KEY_ASSISTANT`, e aggiungi `--account assistant` al comando.

6. Se OpenClaw ti dice che serve una recovery key, esegui il comando per l’account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Se questo dispositivo non è ancora verificato, esegui il comando per l’account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Se la recovery key viene accettata e il backup è utilizzabile, ma `Cross-signing verified`
   è ancora `no`, completa la self-verification da un altro client Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Accetta la richiesta in un altro client Matrix, confronta gli emoji o i decimali,
   e digita `yes` solo quando corrispondono. Il comando termina con successo solo
   dopo che `Cross-signing verified` diventa `yes`.

8. Se stai intenzionalmente abbandonando la vecchia cronologia irrecuperabile e vuoi una nuova baseline di backup per i messaggi futuri, esegui:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Se non esiste ancora alcun backup chiavi lato server, creane uno per i recuperi futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Come funziona la migrazione cifrata

La migrazione cifrata è un processo in due fasi:

1. L’avvio o `openclaw doctor --fix` crea o riusa lo snapshot pre-migrazione se la migrazione cifrata è attuabile.
2. L’avvio o `openclaw doctor --fix` ispeziona il vecchio archivio crypto Matrix tramite l’installazione attiva del Plugin Matrix.
3. Se viene trovata una chiave di decrittazione del backup, OpenClaw la scrive nel nuovo flusso recovery-key e contrassegna il ripristino della room-key come in sospeso.
4. Al successivo avvio Matrix, OpenClaw ripristina automaticamente nel nuovo archivio crypto le room key sottoposte a backup.

Se il vecchio archivio segnala room key che non sono mai state sottoposte a backup, OpenClaw avvisa invece di fingere che il recupero sia riuscito.

## Messaggi comuni e loro significato

### Messaggi di aggiornamento e rilevamento

`Matrix plugin upgraded in place.`

- Significato: il vecchio stato Matrix su disco è stato rilevato e migrato nel layout attuale.
- Cosa fare: nulla, a meno che lo stesso output includa anche warning.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significato: OpenClaw ha creato un archivio di ripristino prima di modificare lo stato Matrix.
- Cosa fare: conserva il percorso dell’archivio stampato finché non confermi che la migrazione è riuscita.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significato: OpenClaw ha trovato un marker esistente dello snapshot di migrazione Matrix e ha riutilizzato quell’archivio invece di creare un backup duplicato.
- Cosa fare: conserva il percorso dell’archivio stampato finché non confermi che la migrazione è riuscita.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significato: esiste un vecchio stato Matrix, ma OpenClaw non può mapparlo a un account Matrix attuale perché Matrix non è ancora configurato.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: OpenClaw ha trovato il vecchio stato, ma non può ancora determinare l’esatta radice attuale di account/dispositivo.
- Cosa fare: avvia il gateway una volta con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che esistono credenziali in cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un archivio Matrix flat condiviso, ma si rifiuta di indovinare quale account Matrix con nome debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull’account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significato: la nuova posizione con scope per account ha già un archivio sync o crypto, quindi OpenClaw non l’ha sovrascritta automaticamente.
- Cosa fare: verifica che l’account attuale sia quello corretto prima di rimuovere o spostare manualmente la destinazione in conflitto.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Significato: OpenClaw ha provato a spostare il vecchio stato Matrix ma l’operazione sul filesystem è fallita.
- Cosa fare: ispeziona permessi del filesystem e stato del disco, poi riesegui `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significato: OpenClaw ha trovato un vecchio archivio Matrix cifrato, ma non c’è una config Matrix attuale a cui collegarlo.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: l’archivio cifrato esiste, ma OpenClaw non può decidere in sicurezza a quale account/dispositivo attuale appartenga.
- Cosa fare: avvia il gateway una volta con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali in cache sono disponibili.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un vecchio archivio crypto condiviso flat, ma si rifiuta di indovinare quale account Matrix con nome debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull’account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significato: OpenClaw ha rilevato un vecchio stato Matrix, ma la migrazione è ancora bloccata per dati di identità o credenziali mancanti.
- Cosa fare: completa il login Matrix o la configurazione della config, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significato: OpenClaw ha trovato un vecchio stato Matrix cifrato, ma non è riuscito a caricare l’entrypoint helper dal Plugin Matrix che normalmente ispeziona quell’archivio.
- Cosa fare: reinstalla o ripara il Plugin Matrix (`openclaw plugins install @openclaw/matrix`, oppure `openclaw plugins install ./path/to/local/matrix-plugin` per un checkout del repo), poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significato: OpenClaw ha trovato un percorso file helper che esce dalla root del Plugin o fallisce i controlli dei confini del Plugin, quindi si è rifiutato di importarlo.
- Cosa fare: reinstalla il Plugin Matrix da un percorso attendibile, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significato: OpenClaw si è rifiutato di modificare lo stato Matrix perché prima non è riuscito a creare lo snapshot di ripristino.
- Cosa fare: risolvi l’errore di backup, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significato: il fallback lato client Matrix ha trovato un vecchio archivio flat, ma lo spostamento è fallito. OpenClaw ora interrompe quel fallback invece di avviarsi silenziosamente con un archivio nuovo.
- Cosa fare: ispeziona permessi del filesystem o conflitti, mantieni intatto il vecchio stato e riprova dopo aver corretto l’errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è bloccato a un’installazione da percorso, quindi gli aggiornamenti mainline non lo sostituiscono automaticamente con il pacchetto Matrix standard del repo.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix` quando vuoi tornare al Plugin Matrix predefinito.

### Messaggi di recupero dello stato cifrato

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significato: le room key sottoposte a backup sono state ripristinate con successo nel nuovo archivio crypto.
- Cosa fare: di solito nulla.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significato: alcune vecchie room key esistevano solo nel vecchio archivio locale e non erano mai state caricate nel backup Matrix.
- Cosa fare: aspettati che una parte della vecchia cronologia cifrata resti non disponibile, a meno che tu non possa recuperare manualmente quelle chiavi da un altro client verificato.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significato: il backup esiste, ma OpenClaw non è riuscito a recuperare automaticamente la recovery key.
- Cosa fare: esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significato: OpenClaw ha trovato il vecchio archivio cifrato, ma non è riuscito a ispezionarlo in modo sufficientemente sicuro per preparare il recupero.
- Cosa fare: riesegui `openclaw doctor --fix`. Se si ripete, mantieni intatta la vecchia directory di stato e recupera usando un altro client Matrix verificato più `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significato: OpenClaw ha rilevato un conflitto nella backup key e si è rifiutato di sovrascrivere automaticamente l’attuale file recovery-key.
- Cosa fare: verifica quale recovery key sia corretta prima di riprovare qualsiasi comando di ripristino.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significato: questo è il limite rigido del vecchio formato di archiviazione.
- Cosa fare: le chiavi sottoposte a backup possono comunque essere ripristinate, ma la cronologia cifrata solo locale potrebbe restare non disponibile.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significato: il nuovo Plugin ha tentato il ripristino ma Matrix ha restituito un errore.
- Cosa fare: esegui `openclaw matrix verify backup status`, poi ritenta con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

### Messaggi di recupero manuale

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significato: OpenClaw sa che dovresti avere una backup key, ma su questo dispositivo non è attiva.
- Cosa fare: esegui `openclaw matrix verify backup restore`, oppure imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Significato: su questo dispositivo al momento non è memorizzata la recovery key.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY`, esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, poi ripristina il backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Significato: la chiave memorizzata non corrisponde al backup Matrix attivo.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` sulla chiave corretta ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Se accetti di perdere la vecchia cronologia cifrata irrecuperabile, puoi invece reimpostare la
baseline di backup corrente con `openclaw matrix verify backup reset --yes`. Quando il
segreto di backup memorizzato è danneggiato, quel reset può anche ricreare l’archivio dei segreti in modo che la
nuova backup key possa essere caricata correttamente dopo il riavvio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significato: il backup esiste, ma questo dispositivo non si fida ancora in modo sufficientemente forte della catena di cross-signing.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significato: hai tentato un passaggio di recupero senza fornire una recovery key quando era richiesta.
- Cosa fare: riesegui il comando con `--recovery-key-stdin`, ad esempio `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significato: la chiave fornita non può essere analizzata o non corrisponde al formato previsto.
- Cosa fare: riprova con la recovery key esatta dal tuo client Matrix o dal file recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significato: OpenClaw ha potuto applicare la recovery key, ma Matrix non ha ancora
  stabilito una fiducia completa nell’identità di cross-signing per questo dispositivo. Controlla
  l’output del comando per `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- Cosa fare: esegui `openclaw matrix verify self`, accetta la richiesta in un altro
  client Matrix, confronta il SAS e digita `yes` solo quando corrisponde. Il
  comando attende la piena fiducia nell’identità Matrix prima di segnalare il successo. Usa
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  solo quando vuoi intenzionalmente sostituire l’attuale identità di cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significato: l’archivio dei segreti non ha prodotto una sessione di backup attiva su questo dispositivo.
- Cosa fare: verifica prima il dispositivo, poi ricontrolla con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significato: questo dispositivo non può ripristinare dall’archivio dei segreti finché la verifica del dispositivo non è completa.
- Cosa fare: esegui prima `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Messaggi di installazione Plugin personalizzato

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il record di installazione del tuo Plugin punta a un percorso locale che non esiste più.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix`, oppure, se stai eseguendo da un checkout del repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se la cronologia cifrata continua a non tornare

Esegui questi controlli in ordine:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se il backup viene ripristinato con successo ma ad alcune vecchie room continua a mancare la cronologia, quelle chiavi mancanti probabilmente non erano mai state sottoposte a backup dal Plugin precedente.

## Se vuoi ripartire da zero per i messaggi futuri

Se accetti di perdere la vecchia cronologia cifrata irrecuperabile e vuoi solo una baseline di backup pulita per il futuro, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se dopo questo il dispositivo non è ancora verificato, completa la verifica dal tuo client Matrix confrontando gli emoji SAS o i codici decimali e confermando che corrispondono.

## Pagine correlate

- [Matrix](/it/channels/matrix)
- [Doctor](/it/gateway/doctor)
- [Migrating](/it/install/migrating)
- [Plugins](/it/tools/plugin)
