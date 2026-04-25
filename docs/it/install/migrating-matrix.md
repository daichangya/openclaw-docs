---
read_when:
    - Aggiornamento di un'installazione Matrix esistente
    - Migrazione della cronologia Matrix crittografata e dello stato del dispositivo
summary: Come OpenClaw aggiorna in-place il precedente Plugin Matrix, inclusi i limiti di recupero dello stato crittografato e i passaggi di recupero manuale.
title: Migrazione Matrix
x-i18n:
    generated_at: "2026-04-25T13:49:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Questa pagina copre gli aggiornamenti dal precedente Plugin pubblico `matrix` all'implementazione attuale.

Per la maggior parte degli utenti, l'aggiornamento avviene in-place:

- il Plugin resta `@openclaw/matrix`
- il canale resta `matrix`
- la tua configurazione resta sotto `channels.matrix`
- le credenziali in cache restano sotto `~/.openclaw/credentials/matrix/`
- lo stato runtime resta sotto `~/.openclaw/matrix/`

Non devi rinominare chiavi di configurazione né reinstallare il Plugin con un nuovo nome.

## Cosa fa automaticamente la migrazione

Quando il gateway si avvia, e quando esegui [`openclaw doctor --fix`](/it/gateway/doctor), OpenClaw prova a riparare automaticamente il vecchio stato Matrix.
Prima che qualsiasi passaggio di migrazione Matrix concretamente applicabile modifichi lo stato su disco, OpenClaw crea o riutilizza uno snapshot di recupero mirato.

Quando usi `openclaw update`, l'attivazione esatta dipende da come è installato OpenClaw:

- le installazioni da sorgente eseguono `openclaw doctor --fix` durante il flusso di aggiornamento, poi riavviano il gateway per impostazione predefinita
- le installazioni da package manager aggiornano il pacchetto, eseguono un passaggio doctor non interattivo, poi si affidano al riavvio predefinito del gateway affinché l'avvio possa completare la migrazione Matrix
- se usi `openclaw update --no-restart`, la migrazione Matrix basata sull'avvio viene rimandata finché non esegui in seguito `openclaw doctor --fix` e riavvii il gateway

La migrazione automatica copre:

- creazione o riutilizzo di uno snapshot pre-migrazione in `~/Backups/openclaw-migrations/`
- riutilizzo delle tue credenziali Matrix in cache
- mantenimento della stessa selezione dell'account e della configurazione `channels.matrix`
- spostamento del sync store Matrix flat più vecchio nella posizione attuale con ambito account
- spostamento del crypto store Matrix flat più vecchio nella posizione attuale con ambito account quando l'account di destinazione può essere risolto in sicurezza
- estrazione di una chiave di decrittazione del backup delle chiavi di stanza Matrix precedentemente salvata dal vecchio rust crypto store, quando quella chiave esiste localmente
- riutilizzo della root di storage token-hash esistente più completa per lo stesso account Matrix, homeserver e utente quando il token di accesso cambia in seguito
- scansione delle root di storage token-hash sorelle per metadati in sospeso di ripristino dello stato crittografato quando il token di accesso Matrix è cambiato ma l'identità account/dispositivo è rimasta la stessa
- ripristino delle chiavi di stanza sottoposte a backup nel nuovo crypto store al successivo avvio di Matrix

Dettagli dello snapshot:

- OpenClaw scrive un file marker in `~/.openclaw/matrix/migration-snapshot.json` dopo uno snapshot riuscito così i successivi passaggi di avvio e riparazione possono riutilizzare lo stesso archivio.
- Questi snapshot automatici di migrazione Matrix salvano solo config + stato (`includeWorkspace: false`).
- Se Matrix ha solo stato di migrazione con soli warning, ad esempio perché `userId` o `accessToken` mancano ancora, OpenClaw non crea ancora lo snapshot perché nessuna mutazione Matrix è concretamente applicabile.
- Se il passaggio di snapshot fallisce, OpenClaw salta la migrazione Matrix in quell'esecuzione invece di modificare lo stato senza un punto di recupero.

Informazioni sugli aggiornamenti multi-account:

- il flat store Matrix più vecchio (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) proviene da un layout a store singolo, quindi OpenClaw può migrarlo solo in una destinazione di account Matrix risolta
- i legacy store Matrix già con ambito account vengono rilevati e preparati per ciascun account Matrix configurato

## Cosa la migrazione non può fare automaticamente

Il precedente Plugin pubblico Matrix **non** creava automaticamente backup delle chiavi di stanza Matrix. Manteneva lo stato crittografico locale e richiedeva la verifica del dispositivo, ma non garantiva che le chiavi delle tue stanze fossero salvate sull'homeserver.

Ciò significa che alcune installazioni crittografate possono essere migrate solo parzialmente.

OpenClaw non può recuperare automaticamente:

- chiavi di stanza solo locali che non sono mai state sottoposte a backup
- stato crittografato quando l'account Matrix di destinazione non può ancora essere risolto perché `homeserver`, `userId` o `accessToken` non sono ancora disponibili
- migrazione automatica di un flat store Matrix condiviso quando sono configurati più account Matrix ma `channels.matrix.defaultAccount` non è impostato
- installazioni del percorso Plugin personalizzato fissate a un percorso repo invece che al pacchetto Matrix standard
- una recovery key mancante quando il vecchio store aveva chiavi sottoposte a backup ma non conservava localmente la chiave di decrittazione

Ambito di warning attuale:

- le installazioni di percorso Plugin Matrix personalizzato vengono segnalate sia all'avvio del gateway sia da `openclaw doctor`

Se la tua vecchia installazione aveva cronologia crittografata solo locale che non è mai stata sottoposta a backup, alcuni messaggi crittografati più vecchi potrebbero restare illeggibili dopo l'aggiornamento.

## Flusso di aggiornamento consigliato

1. Aggiorna normalmente OpenClaw e il Plugin Matrix.
   Preferisci `openclaw update` senza `--no-restart` così l'avvio può completare immediatamente la migrazione Matrix.
2. Esegui:

   ```bash
   openclaw doctor --fix
   ```

   Se Matrix ha lavoro di migrazione concretamente applicabile, doctor creerà o riutilizzerà prima lo snapshot pre-migrazione e stamperà il percorso dell'archivio.

3. Avvia o riavvia il gateway.
4. Controlla lo stato attuale di verifica e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Se OpenClaw ti dice che serve una recovery key, esegui:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Se questo dispositivo non è ancora verificato, esegui:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Se la recovery key viene accettata e il backup è utilizzabile, ma `Cross-signing verified`
   è ancora `no`, completa l'autoverifica da un altro client Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Accetta la richiesta in un altro client Matrix, confronta gli emoji o i decimali
   e digita `yes` solo quando corrispondono. Il comando termina con successo solo
   dopo che `Cross-signing verified` diventa `yes`.

7. Se stai intenzionalmente abbandonando la vecchia cronologia non recuperabile e vuoi una nuova baseline di backup per i messaggi futuri, esegui:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Se non esiste ancora un backup delle chiavi lato server, creane uno per i recuperi futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Come funziona la migrazione crittografata

La migrazione crittografata è un processo in due fasi:

1. L'avvio o `openclaw doctor --fix` crea o riutilizza lo snapshot pre-migrazione se la migrazione crittografata è concretamente applicabile.
2. L'avvio o `openclaw doctor --fix` ispeziona il vecchio crypto store Matrix tramite l'installazione attiva del Plugin Matrix.
3. Se viene trovata una chiave di decrittazione del backup, OpenClaw la scrive nel nuovo flusso di recovery key e contrassegna il ripristino delle chiavi di stanza come in sospeso.
4. Al successivo avvio di Matrix, OpenClaw ripristina automaticamente nel nuovo crypto store le chiavi di stanza sottoposte a backup.

Se il vecchio store segnala chiavi di stanza che non sono mai state sottoposte a backup, OpenClaw avvisa invece di fingere che il recupero sia riuscito.

## Messaggi comuni e relativo significato

### Messaggi di aggiornamento e rilevamento

`Matrix plugin upgraded in place.`

- Significato: il vecchio stato Matrix su disco è stato rilevato e migrato nel layout attuale.
- Cosa fare: niente, a meno che lo stesso output non includa anche warning.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significato: OpenClaw ha creato un archivio di recupero prima di modificare lo stato Matrix.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significato: OpenClaw ha trovato un marker di snapshot di migrazione Matrix esistente e ha riutilizzato quell'archivio invece di creare un backup duplicato.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significato: esiste un vecchio stato Matrix, ma OpenClaw non può mapparlo a un account Matrix corrente perché Matrix non è configurato.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: OpenClaw ha trovato vecchio stato, ma ancora non può determinare l'esatta root corrente di account/dispositivo.
- Cosa fare: avvia una volta il gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che esistono credenziali in cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un flat store Matrix condiviso, ma si rifiuta di indovinare quale account Matrix con nome debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significato: la posizione con ambito account nuova ha già un sync o crypto store, quindi OpenClaw non l'ha sovrascritta automaticamente.
- Cosa fare: verifica che l'account corrente sia quello corretto prima di rimuovere o spostare manualmente la destinazione in conflitto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significato: OpenClaw ha provato a spostare il vecchio stato Matrix ma l'operazione sul filesystem è fallita.
- Cosa fare: ispeziona i permessi del filesystem e lo stato del disco, poi riesegui `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significato: OpenClaw ha trovato un vecchio store Matrix crittografato, ma non esiste una configurazione Matrix corrente a cui collegarlo.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: lo store crittografato esiste, ma OpenClaw non può decidere in sicurezza a quale account/dispositivo corrente appartenga.
- Cosa fare: avvia una volta il gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali in cache sono disponibili.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un unico crypto store legacy flat condiviso, ma si rifiuta di indovinare quale account Matrix con nome debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significato: OpenClaw ha rilevato vecchio stato Matrix, ma la migrazione è ancora bloccata dall'assenza di dati di identità o credenziali.
- Cosa fare: completa il login Matrix o la configurazione, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significato: OpenClaw ha trovato vecchio stato Matrix crittografato, ma non è riuscito a caricare l'entrypoint helper dal Plugin Matrix che normalmente ispeziona quello store.
- Cosa fare: reinstalla o ripara il Plugin Matrix (`openclaw plugins install @openclaw/matrix`, oppure `openclaw plugins install ./path/to/local/matrix-plugin` per un checkout repo), poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significato: OpenClaw ha trovato un percorso file helper che esce dalla root del Plugin o fallisce i controlli dei confini del Plugin, quindi si è rifiutato di importarlo.
- Cosa fare: reinstalla il Plugin Matrix da un percorso fidato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significato: OpenClaw si è rifiutato di modificare lo stato Matrix perché non è riuscito prima a creare lo snapshot di recupero.
- Cosa fare: risolvi l'errore di backup, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significato: il fallback lato client Matrix ha trovato vecchio storage flat, ma lo spostamento è fallito. OpenClaw ora interrompe quel fallback invece di avviarsi silenziosamente con uno store nuovo.
- Cosa fare: ispeziona i permessi del filesystem o eventuali conflitti, mantieni intatto il vecchio stato e riprova dopo aver corretto l'errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è fissato a un'installazione da percorso, quindi gli aggiornamenti mainline non lo sostituiscono automaticamente con il pacchetto Matrix standard del repo.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix` quando vuoi tornare al Plugin Matrix predefinito.

### Messaggi di recupero dello stato crittografato

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significato: le chiavi di stanza sottoposte a backup sono state ripristinate con successo nel nuovo crypto store.
- Cosa fare: di solito nulla.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significato: alcune vecchie chiavi di stanza esistevano solo nel vecchio store locale e non erano mai state caricate nel backup Matrix.
- Cosa fare: aspettati che parte della vecchia cronologia crittografata resti non disponibile, a meno che tu non possa recuperare manualmente quelle chiavi da un altro client verificato.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Significato: il backup esiste, ma OpenClaw non è riuscito a recuperare automaticamente la recovery key.
- Cosa fare: esegui `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significato: OpenClaw ha trovato il vecchio store crittografato, ma non è riuscito a ispezionarlo in modo sufficientemente sicuro per preparare il recupero.
- Cosa fare: riesegui `openclaw doctor --fix`. Se si ripete, mantieni intatta la vecchia directory di stato e recupera usando un altro client Matrix verificato più `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significato: OpenClaw ha rilevato un conflitto nella chiave di backup e si è rifiutato di sovrascrivere automaticamente il file recovery-key corrente.
- Cosa fare: verifica quale recovery key sia corretta prima di ritentare qualsiasi comando di ripristino.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significato: questo è il limite rigido del vecchio formato di storage.
- Cosa fare: le chiavi sottoposte a backup possono comunque essere ripristinate, ma la cronologia crittografata solo locale può restare non disponibile.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significato: il nuovo Plugin ha tentato il ripristino ma Matrix ha restituito un errore.
- Cosa fare: esegui `openclaw matrix verify backup status`, poi se necessario ritenta con `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Messaggi di recupero manuale

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significato: OpenClaw sa che dovresti avere una chiave di backup, ma non è attiva su questo dispositivo.
- Cosa fare: esegui `openclaw matrix verify backup restore`, oppure passa `--recovery-key` se necessario.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Significato: questo dispositivo al momento non ha memorizzata la recovery key.
- Cosa fare: verifica prima il dispositivo con la tua recovery key, poi ripristina il backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Significato: la chiave memorizzata non corrisponde al backup Matrix attivo.
- Cosa fare: riesegui `openclaw matrix verify device "<your-recovery-key>"` con la chiave corretta.

Se accetti di perdere la vecchia cronologia crittografata non recuperabile, puoi invece reimpostare la baseline del backup corrente con `openclaw matrix verify backup reset --yes`. Quando il segreto di backup memorizzato è danneggiato, quel reset può anche ricreare il secret storage in modo che la nuova chiave di backup possa caricarsi correttamente dopo il riavvio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Significato: il backup esiste, ma questo dispositivo non si fida ancora abbastanza della catena di cross-signing.
- Cosa fare: riesegui `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Significato: hai tentato un passaggio di recupero senza fornire una recovery key quando era richiesta.
- Cosa fare: riesegui il comando con la tua recovery key.

`Invalid Matrix recovery key: ...`

- Significato: la chiave fornita non è stata analizzata correttamente oppure non corrispondeva al formato previsto.
- Cosa fare: riprova con la recovery key esatta dal tuo client Matrix o dal file recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significato: OpenClaw ha potuto applicare la recovery key, ma Matrix non ha ancora stabilito la piena fiducia dell'identità cross-signing per questo dispositivo. Controlla nell'output del comando `Recovery key accepted`, `Backup usable`, `Cross-signing verified` e `Device verified by owner`.
- Cosa fare: esegui `openclaw matrix verify self`, accetta la richiesta in un altro client Matrix, confronta il SAS e digita `yes` solo quando corrisponde. Il comando attende la piena fiducia dell'identità Matrix prima di segnalare il successo. Usa `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing` solo quando vuoi intenzionalmente sostituire l'identità di cross-signing corrente.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significato: il secret storage non ha prodotto una sessione di backup attiva su questo dispositivo.
- Cosa fare: verifica prima il dispositivo, poi ricontrolla con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Significato: questo dispositivo non può ripristinare dal secret storage finché la verifica del dispositivo non è completata.
- Cosa fare: esegui prima `openclaw matrix verify device "<your-recovery-key>"`.

### Messaggi di installazione Plugin personalizzata

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il record di installazione del Plugin punta a un percorso locale che non esiste più.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix`, oppure, se stai eseguendo da un checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se la cronologia crittografata continua a non tornare

Esegui questi controlli nell'ordine:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Se il backup viene ripristinato con successo ma in alcune vecchie stanze manca ancora la cronologia, probabilmente quelle chiavi mancanti non erano mai state sottoposte a backup dal Plugin precedente.

## Se vuoi ripartire da zero per i messaggi futuri

Se accetti di perdere la vecchia cronologia crittografata non recuperabile e vuoi solo una baseline di backup pulita per il futuro, esegui questi comandi nell'ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se il dispositivo resta ancora non verificato dopo questo, completa la verifica dal tuo client Matrix confrontando gli emoji SAS o i codici decimali e confermando che corrispondono.

## Pagine correlate

- [Matrix](/it/channels/matrix)
- [Doctor](/it/gateway/doctor)
- [Migrazione](/it/install/migrating)
- [Plugins](/it/tools/plugin)
