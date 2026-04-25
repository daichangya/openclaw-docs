---
read_when:
    - Aggiunta o modifica delle migrazioni Doctor
    - Introduzione di modifiche incompatibili alla configurazione
summary: 'Comando Doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stato obsoleti,
controlla l'integrità e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza prompt (inclusi i passaggi di riparazione per restart/service/sandbox quando applicabili).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza prompt (riparazioni + riavvii dove sicuro).

```bash
openclaw doctor --repair --force
```

Applica anche le riparazioni aggressive (sovrascrive configurazioni supervisor personalizzate).

```bash
openclaw doctor --non-interactive
```

Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta azioni di restart/service/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema per rilevare installazioni gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi rivedere le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
- Controllo dell'aggiornamento del protocollo UI (ricostruisce la Control UI quando lo schema del protocollo è più recente).
- Controllo di integrità + prompt di riavvio.
- Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei Plugin.
- Normalizzazione della configurazione per valori legacy.
- Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e prontezza Chrome MCP.
- Avvisi di override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
- Controllo dei prerequisiti TLS OAuth per i profili OpenAI Codex OAuth.
- Migrazione legacy dello stato su disco (sessions/dir agente/auth WhatsApp).
- Migrazione legacy delle chiavi di contratto dei manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione legacy dell'archivio Cron (`jobId`, `schedule.cron`, campi top-level di delivery/payload, payload `provider`, semplici job di fallback webhook `notify: true`).
- Ispezione dei file di lock della sessione e pulizia dei lock obsoleti.
- Controlli di integrità e permessi dello stato (sessioni, transcript, directory di stato).
- Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
- Integrità auth dei modelli: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati cooldown/disabilitati dei profili auth.
- Rilevamento di directory workspace extra (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione dei servizi legacy e rilevamento di gateway aggiuntivi.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
- Avvisi sullo stato dei canali (probati dal gateway in esecuzione).
- Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
- Controlli delle best practice del runtime Gateway (Node vs Bun, percorsi di version manager).
- Diagnostica delle collisioni di porta del Gateway (predefinita `18789`).
- Avvisi di sicurezza per policy DM aperte.
- Controlli auth del Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
- Rilevamento dei problemi di pairing dei dispositivi (prime richieste di pairing in sospeso, upgrade di ruolo/ambito in sospeso, deriva della cache locale obsoleta del token del dispositivo e deriva auth dei record paired).
- Controllo `linger` systemd su Linux.
- Controllo della dimensione dei file bootstrap del workspace (avvisi di troncamento/vicinanza al limite per i file di contesto).
- Controllo dello stato del completamento shell e auto-installazione/aggiornamento.
- Controllo della prontezza del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli dell'installazione da sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
- Scrive configurazione aggiornata + metadati del wizard.

## Backfill e reset della UI Dreams

La scena Dreams della Control UI include azioni **Backfill**, **Reset** e **Clear Grounded**
per il flusso di lavoro di grounded Dreaming. Queste azioni usano metodi RPC
in stile doctor del gateway, ma **non** fanno parte della CLI `openclaw doctor`
di riparazione/migrazione.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel
  workspace attivo, esegue il passaggio diario REM grounded e scrive voci di
  backfill reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci diario di backfill marcate.
- **Clear Grounded** rimuove solo le voci a breve termine staged grounded-only che
  provenivano dalla riproduzione storica e non hanno ancora accumulato richiamo live o
  supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage i candidati grounded nel live short-term
  promotion store a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che la riproduzione storica grounded influenzi il normale flusso di
promozione deep, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage i candidati durevoli grounded nel Dreaming store short-term mantenendo
`DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento facoltativo (installazioni git)

Se si tratta di un checkout git e doctor è eseguito in modo interattivo, propone di
aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valori legacy (ad esempio `messages.ackReaction`
senza un override specifico del canale), doctor le normalizza nello
schema corrente.

Questo include i campi flat legacy di Talk. La configurazione pubblica attuale di Talk è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa del provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono
di eseguire `openclaw doctor`.

Doctor farà quanto segue:

- Spiegherà quali chiavi legacy sono state trovate.
- Mostrerà la migrazione applicata.
- Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue anche automaticamente le migrazioni doctor all'avvio quando rileva un
formato di configurazione legacy, così le configurazioni obsolete vengono riparate senza intervento manuale.
Le migrazioni dell'archivio Cron sono gestite da `openclaw doctor --fix`.

Migrazioni correnti:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` top-level
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Per i canali con `accounts` con nome ma con valori top-level di canale single-account residui, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target named/default corrispondente già esistente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuove `browser.relayBindHost` (impostazione relay legacy dell'estensione)

Gli avvisi di doctor includono anche indicazioni per l'account predefinito nei canali multi-account:

- Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il fallback routing può selezionare un account inatteso.
- Se `channels.<channel>.defaultAccount` è impostato su un id account sconosciuto, doctor avvisa ed elenca gli id account configurati.

### 2b) Override del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`.
Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa in modo che
tu possa rimuovere l'override e ripristinare il routing API + i costi per modello.

### 2c) Migrazione del browser e prontezza Chrome MCP

Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor
la normalizza all'attuale modello attach Chrome MCP host-local:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor controlla anche il percorso Chrome MCP host-local quando usi `defaultProfile:
"user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili
  di auto-connect predefiniti
- controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il remote debugging nella pagina inspect del browser (ad
  esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  oppure `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. Chrome MCP host-local
richiede comunque:

- un browser basato su Chromium 144+ sull'host gateway/node
- il browser in esecuzione localmente
- il remote debugging abilitato in quel browser
- l'approvazione del primo prompt di consenso attach nel browser

La prontezza qui riguarda solo i prerequisiti di attach locale. Existing-session mantiene
gli attuali limiti di instradamento Chrome MCP; percorsi avanzati come `responsebody`, esportazione PDF,
intercettazione dei download e azioni batch richiedono ancora un browser
managed o un profilo CDP raw.

Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri
flussi headless. Questi continuano a usare CDP raw.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OpenAI Codex OAuth, doctor esegue una probe dell'endpoint di
autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa
convalidare la catena di certificati. Se la probe fallisce con un errore di certificato (ad
esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato self-signed),
doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la
correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, la probe viene eseguita
anche se il gateway è integro.

### 2c) Override del provider Codex OAuth

Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto
`models.providers.openai-codex`, possono sovrascrivere il percorso
del provider Codex OAuth integrato che le release più recenti usano automaticamente. Doctor avvisa quando vede
quelle vecchie impostazioni di trasporto insieme a Codex OAuth in modo che tu possa rimuovere o riscrivere
l'override di trasporto obsoleto e riottenere il comportamento integrato di routing/fallback.
Proxy personalizzati e override solo-header restano supportati e non
attivano questo avviso.

### 3) Migrazioni dello stato legacy (layout su disco)

Doctor può migrare layout su disco più vecchi nella struttura corrente:

- Store sessioni + transcript:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directory agente:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato auth WhatsApp (Baileys):
  - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando
lascia cartelle legacy come backup. Gateway/CLI esegue anche la migrazione automatica
di sessioni legacy + directory agente all'avvio in modo che cronologia/auth/modelli finiscano nel
percorso per-agente senza un'esecuzione manuale di doctor. L'auth WhatsApp viene intenzionalmente
migrata solo tramite `openclaw doctor`. La normalizzazione di provider/provider-map di Talk ora
confronta per uguaglianza strutturale, quindi differenze dovute solo all'ordine delle chiavi non attivano più
modifiche ripetute no-op di `doctor --fix`.

### 3a) Migrazioni legacy dei manifest Plugin

Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi capability top-level
deprecate (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando trovate, propone di spostarle nell'oggetto `contracts`
e riscrivere il file manifest sul posto. Questa migrazione è idempotente;
se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy dello store Cron

Doctor controlla anche lo store dei Cron job (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
oppure `cron.store` se sovrascritto) per vecchie forme di job che il pianificatore ancora
accetta per compatibilità.

Le pulizie Cron correnti includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi payload top-level (`message`, `model`, `thinking`, ...) → `payload`
- campi delivery top-level (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias di delivery `provider` del payload → `delivery.channel` esplicito
- semplici job legacy di fallback webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i job `notify: true` solo quando può farlo senza
cambiare comportamento. Se un job combina il fallback notify legacy con una modalità di
delivery non-webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

### 3c) Pulizia dei lock di sessione

Doctor analizza ogni directory di sessione dell'agente alla ricerca di file di write-lock obsoleti — file lasciati
indietro quando una sessione è terminata in modo anomalo. Per ogni file lock trovato segnala:
il percorso, PID, se il PID è ancora attivo, età del lock e se è
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file lock obsoleti; altrimenti stampa una nota e
ti invita a rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza della sessione, routing e sicurezza)

La directory di stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Directory di stato mancante**: avvisa della perdita catastrofica di stato, propone di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della directory di stato**: verifica la scrivibilità; propone di riparare i permessi
  (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza owner/group).
- **Directory di stato macOS sincronizzata via cloud**: avvisa quando lo stato si risolve sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oppure
  `~/Library/CloudStorage/...` perché i percorsi supportati da sync possono causare I/O più lenti
  e corse lock/sync.
- **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve su una sorgente di mount `mmcblk*`,
  perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi
  più velocemente con le scritture di sessione e credenziali.
- **Directory sessioni mancanti**: `sessions/` e la directory dello store di sessione sono
  necessarie per persistere la cronologia ed evitare crash `ENOENT`.
- **Mismatch transcript**: avvisa quando le voci di sessione recenti hanno
  file transcript mancanti.
- **Sessione principale “1-line JSONL”**: segnala quando il transcript principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in
  directory home diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato vive lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile da gruppo/mondo e propone di restringerli a `600`.

### 5) Integrità auth del modello (scadenza OAuth)

Doctor ispeziona i profili OAuth nello store auth, avvisa quando i token stanno
scadendo/sono scaduti e può aggiornarli quando è sicuro. Se il profilo
Anthropic OAuth/token è obsoleto, suggerisce una chiave API Anthropic o il
percorso Anthropic setup-token.
I prompt di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di refresh.

Quando un refresh OAuth fallisce in modo permanente (ad esempio `refresh_token_reused`,
`invalid_grant`, o un provider che ti dice di accedere di nuovo), doctor segnala
che è richiesta una nuova autenticazione e stampa l'esatto comando `openclaw models auth login --provider ...`
da eseguire.

Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

- cooldown brevi (rate limit/timeout/errori auth)
- disabilitazioni più lunghe (errori di fatturazione/credito)

### 6) Validazione del modello Hooks

Se `hooks.gmail.model` è impostato, doctor convalida il model ref rispetto al
catalogo e all'allowlist e avvisa quando non verrà risolto o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e propone di costruirle o
passare a nomi legacy se l'immagine corrente manca.

### 7b) Dipendenze runtime dei Plugin bundled

Doctor verifica le dipendenze runtime solo per i Plugin bundled che sono attivi nella
configurazione corrente o abilitati dal valore predefinito del loro manifest bundled, ad esempio
`plugins.entries.discord.enabled: true`, legacy
`channels.discord.enabled: true`, o un provider bundled abilitato per impostazione predefinita. Se ne manca
qualcuna, doctor segnala i pacchetti e li installa in
modalità `openclaw doctor --fix` / `openclaw doctor --repair`. I Plugin esterni continuano a
usare `openclaw plugins install` / `openclaw plugins update`; doctor non
installa dipendenze per percorsi Plugin arbitrari.

Anche il Gateway e la CLI locale possono riparare su richiesta le dipendenze runtime attive dei Plugin bundled
prima di importare un Plugin bundled. Queste installazioni sono
limitate alla root di installazione runtime del Plugin, vengono eseguite con script disabilitati, non
scrivono un package lock e sono protette da un lock della root di installazione in modo che avvii concorrenti della CLI
o del Gateway non modifichino contemporaneamente lo stesso albero `node_modules`.

### 8) Migrazioni dei servizi Gateway e indicazioni di pulizia

Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e
propone di rimuoverli e installare il servizio OpenClaw usando l'attuale porta gateway.
Può anche analizzare servizi extra simili al gateway e stampare indicazioni di pulizia.
I servizi gateway OpenClaw con nome del profilo sono considerati di prima classe e non
vengono segnalati come "extra".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione di stato legacy in sospeso o attuabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato
cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e
l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene saltato completamente.

### 8c) Pairing del dispositivo e deriva auth

Doctor ora ispeziona lo stato del pairing del dispositivo come parte del normale passaggio di integrità.

Cosa segnala:

- richieste di primo pairing in sospeso
- upgrade di ruolo in sospeso per dispositivi già paired
- upgrade di ambito in sospeso per dispositivi già paired
- riparazioni di mismatch della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo
  non corrisponde più al record approvato
- record paired privi di un token attivo per un ruolo approvato
- token paired i cui ambiti divergono dalla baseline di pairing approvata
- voci locali in cache del device-token per la macchina corrente che precedono una
  rotazione lato gateway del token o portano metadati di ambito obsoleti

Doctor non approva automaticamente le richieste di pairing né ruota automaticamente i token del dispositivo. Stampa invece
i passaggi successivi esatti:

- ispeziona le richieste in sospeso con `openclaw devices list`
- approva la richiesta esatta con `openclaw devices approve <requestId>`
- ruota un nuovo token con `openclaw devices rotate --device <deviceId> --role <role>`
- rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

Questo chiude il comune problema "già paired ma ricevo ancora pairing required":
doctor ora distingue il primo pairing dagli upgrade di ruolo/ambito in
sospeso e dalla deriva obsoleta di token/identità del dispositivo.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, o
quando una policy è configurata in modo pericoloso.

### 10) systemd linger (Linux)

Se è in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato in modo che il
gateway resti attivo dopo il logout.

### 11) Stato dello spazio di lavoro (skills, plugin e directory legacy)

Doctor stampa un riepilogo dello stato dello spazio di lavoro per l'agente predefinito:

- **Stato delle Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
- **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy
  esistono insieme allo spazio di lavoro corrente.
- **Stato dei Plugin**: conta Plugin caricati/disabilitati/in errore; elenca gli id Plugin per eventuali
  errori; segnala le capability dei Plugin bundled.
- **Avvisi di compatibilità Plugin**: segnala Plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica Plugin**: mostra eventuali avvisi o errori all'avvio emessi dal
  registro Plugin.

### 11b) Dimensione dei file bootstrap

Doctor controlla se i file bootstrap del workspace (ad esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di
caratteri configurato. Segnala per file il numero di caratteri raw vs. iniettati, la percentuale di troncamento,
la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri
iniettati come frazione del budget totale. Quando i file sono troncati o vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento shell

Doctor controlla se il completamento tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo shell usa un pattern di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce
  con file in cache.
- Se il completamento è configurato nel profilo ma il file cache manca,
  doctor rigenera automaticamente la cache.
- Se non è configurato alcun completamento, doctor propone di installarlo
  (solo in modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli auth del Gateway (token locale)

Doctor controlla la prontezza dell'autenticazione token locale del gateway.

- Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor propone di generarne uno.
- Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni in sola lettura con consapevolezza di SecretRef

Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

- `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione di `allowFrom` / `groupAllowFrom` Telegram con `@username` prova a usare le credenziali bot configurate quando disponibili.
- Se il token bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configured-but-unavailable e salta la risoluzione automatica invece di andare in crash o segnalare erroneamente che il token manca.

### 13) Controllo di integrità del Gateway + riavvio

Doctor esegue un controllo di integrità e propone di riavviare il gateway quando sembra
non integro.

### 13b) Prontezza della ricerca in memoria

Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

- **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia
  presente nell'ambiente o nello store auth. Se manca, stampa suggerimenti di correzione attuabili.
- **Provider auto**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto
  nell'ordine di selezione automatica.

Quando è disponibile il risultato di una probe del gateway (il gateway era integro al momento del
controllo), doctor confronta il risultato con la configurazione visibile alla CLI e segnala
eventuali discrepanze.

Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

### 14) Avvisi sullo stato dei canali

Se il gateway è integro, doctor esegue una probe dello stato dei canali e segnala
avvisi con correzioni suggerite.

### 15) Audit + riparazione della configurazione supervisor

Doctor controlla la configurazione supervisor installata (launchd/systemd/schtasks) per
valori predefiniti mancanti o obsoleti (ad esempio dipendenze systemd network-online e
ritardo di riavvio). Quando trova una mancata corrispondenza, raccomanda un aggiornamento e può
riscrivere il file del servizio/task ai valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione supervisor.
- `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
- `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
- `openclaw doctor --repair --force` sovrascrive configurazioni supervisor personalizzate.
- Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non persiste valori token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità user-systemd Linux, i controlli di deriva del token di doctor includono ora sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati auth del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Diagnostica runtime + porta del Gateway

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma non è realmente in esecuzione. Controlla anche le collisioni di porta
sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già
in esecuzione, tunnel SSH).

### 17) Best practice del runtime del Gateway

Doctor avvisa quando il servizio gateway è eseguito su Bun o su un percorso Node gestito da version manager
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'init della tua shell. Doctor propone di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati del wizard

Doctor persiste eventuali modifiche alla configurazione e registra i metadati del wizard per memorizzare
l'esecuzione di doctor.

### 19) Suggerimenti per lo spazio di lavoro (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa a
struttura del workspace e backup git (consigliato GitHub o GitLab privato).

## Correlati

- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Runbook del Gateway](/it/gateway)
