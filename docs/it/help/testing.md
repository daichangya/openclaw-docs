---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di regressioni per bug di modello/provider
    - Debug del comportamento del Gateway + dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testಿಂಗ್
x-i18n:
    generated_at: "2026-04-25T13:49:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme
di runner Docker. Questa documentazione è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida della suite completa su una macchina capiente: `pnpm test:max`
- Ciclo watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto di file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (sonde per modelli + strumenti/immagini del gateway): `pnpm test:live`
- Punta a un singolo file live in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep Docker dei modelli live: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola sonda in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita le sonde aggiuntive con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oppure
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli errori del provider.
  - Copertura CI: il job giornaliero `OpenClaw Scheduled Live And E2E Checks` e il job manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow riutilizzabile live/E2E con
    `include_live_suites: true`, che include job separati della matrice Docker live model
    suddivisi per provider.
  - Per riesecuzioni CI mirate, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi segreti provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti pianificati/di release.
- Smoke nativo bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Esegue una lane live Docker contro il percorso del server app Codex, associa un DM Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    passino attraverso l'associazione nativa del Plugin invece di ACP.
- Smoke del comando di recupero Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in di sicurezza aggiuntiva per la superficie del comando di recupero del canale messaggi.
    Esercita `/crestodian status`, accoda una modifica persistente del modello,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una falsa Claude CLI su `PATH`
    e verifica che il fallback fuzzy del planner si traduca in una scrittura di configurazione tipizzata con audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada `openclaw` semplice verso
    Crestodian, applica scritture setup/model/agent/Discord Plugin + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0 è
    coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke del costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un singolo caso in errore, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici QA

Questi comandi stanno accanto alle suite di test principali quando ti serve il realismo di QA-lab:

CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito sulle PR corrispondenti e
da dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da dispatch manuale con la parity gate mock, la lane Matrix live e la lane Telegram live gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell'approvazione della release.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repository direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker gateway isolati. `qa-channel` usa come predefinito concurrency 4 (limitata dal conteggio degli scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia lane seriale.
  - Restituisce uscita non zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
    vuoi artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura sperimentale di fixture e mock di protocollo senza sostituire la lane `mock-openai` consapevole degli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repository così il guest può riscrivere tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l'abilitazione del Plugin installi le dipendenze runtime on demand, esegue doctor ed esegue un turno locale dell'agente contro un endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa
    lane di installazione pacchettizzata con Discord.
- `pnpm test:docker:npm-telegram-live`
  - Installa un pacchetto OpenClaw pubblicato in Docker, esegue onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza la lane QA Telegram live con quel pacchetto installato come Gateway SUT.
  - Usa come predefinito `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa le stesse credenziali env Telegram o la stessa sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto del ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona automaticamente Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa
    l'ambiente `qa-live-shared` e lease di credenziali CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, poi abilita canali/Plugin inclusi tramite modifiche di configurazione.
  - Verifica che l'individuazione del setup lasci assenti le dipendenze runtime del Plugin non configurate, che la prima esecuzione configurata di Gateway o doctor installi on demand le dipendenze runtime di ciascun Plugin incluso e che un secondo riavvio non reinstalli dipendenze già attivate.
  - Installa anche una baseline npm nota più vecchia, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il
    doctor post-aggiornamento del candidato ripari le dipendenze runtime del canale incluso senza una riparazione postinstall lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke nativo dell'aggiornamento dell'installazione pacchettizzata su guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue il comando `openclaw update` installato nello stesso guest e verifica la versione installata, lo stato dell'aggiornamento, la prontezza del gateway e un turno locale dell'agente.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre
    iteri su un singolo guest. Usa `--json` per il percorso dell'artefatto di riepilogo e
    lo stato per lane.
  - Avvolgi le esecuzioni locali lunghe in un timeout host così i blocchi del trasporto Parallels non possano consumare il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log annidati per lane sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di supporre che il wrapper esterno sia bloccato.
  - Su Windows l'aggiornamento può impiegare da 10 a 15 minuti in doctor post-aggiornamento/riparazione delle dipendenze runtime su un guest freddo; è ancora sano quando il log di debug npm annidato continua ad avanzare.
  - Non eseguire questo wrapper aggregato in parallelo con singole lane smoke Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono entrare in collisione su
    ripristino snapshot, serving dei pacchetti o stato del gateway del guest.
  - La prova post-aggiornamento esegue la normale superficie del Plugin incluso perché
    le facade di funzionalità come parlato, generazione immagini e comprensione dei media
    vengono caricate tramite API runtime incluse anche quando il turno dell'agente stesso controlla solo una semplice risposta testuale.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretti del
    protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo per repository/sviluppo. Le installazioni pacchettizzate di OpenClaw non includono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repository caricano direttamente il runner incluso; non è necessario alcun passaggio separato di installazione del Plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, quindi avvia un processo figlio QA gateway con il vero Plugin Matrix come trasporto SUT.
  - Usa come predefinita l'immagine Tuwunel stabile fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sovrascrivi con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi della sorgente credenziali perché la lane effettua il provisioning locale di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo, un artefatto degli eventi osservati e un log combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
  - Emette avanzamento per impostazione predefinita e applica un timeout rigido di esecuzione con `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (predefinito 30 minuti). La pulizia è limitata da `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` e gli errori includono il comando di recupero `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token bot del driver e del SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per attivare i lease condivisi.
  - Restituisce uscita non zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando vuoi artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un nome utente Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita la modalità Bot-to-Bot Communication in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari con risposta includono la RTT dalla richiesta di invio del driver alla risposta osservata del SUT.

Le lane di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta l'ampia suite QA sintetica e non fa parte della matrice di copertura dei trasporti live.

| Lane     | Canary | Controllo delle menzioni | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | ------------------------ | ---------------- | ------------------ | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                        | x                | x                  | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                          |                  |                    |                      |                      |                       |                             | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (oppure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
a quel lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ad esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, `maintainer` altrimenti)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex loopback `http://` solo per sviluppo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin del maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare l'URL del sito Convex, i segreti del broker,
il prefisso dell'endpoint, il timeout HTTP e la raggiungibilità admin/list senza stampare
valori segreti. Usa `--json` per output leggibile dalla macchina in script e utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ripetibile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /admin/add` (solo segreto maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Protezione lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id numerica della chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload non validi.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` possiede la meccanica condivisa dell'host:

- la root di comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` più vecchi

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene verificata la prontezza
- come vengono iniettati gli eventi in entrata
- come vengono osservati i messaggi in uscita
- come vengono esposti trascrizioni e stato normalizzato del trasporto
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I Plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Creare o adattare scenari markdown sotto le directory tematiche `qa/scenarios/`.
6. Usare gli helper generici degli scenari per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti salvo che il repository stia facendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un singolo trasporto di canale, mantienilo in quel Plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova funzionalità che più di un canale può usare, aggiungi un helper generico invece di un branch specifico per canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

I nomi preferiti degli helper generici per i nuovi scenari sono:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Gli alias di compatibilità restano disponibili per gli scenari esistenti, inclusi:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Il nuovo lavoro sui canali dovrebbe usare i nomi generici degli helper.
Gli alias di compatibilità esistono per evitare una migrazione flag day, non come modello per
la creazione di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a un “realismo crescente” (e maggiore instabilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-project in configurazioni per-progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unit puri
  - Test di integrazione in-process (autenticazione gateway, instradamento, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguiti in CI
  - Nessuna chiave reale richiesta
  - Dovrebbero essere rapidi e stabili

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito">

    - Le esecuzioni non mirate di `pnpm test` usano dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/extension affami suite non correlate.
    - `pnpm test --watch` continua a usare il grafo di progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
    - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane con ambito quando il diff tocca solo file sorgente/test instradabili; le modifiche di configurazione/setup continuano invece a ricadere nella riesecuzione ampia del progetto root.
    - `pnpm check:changed` è il normale gate locale intelligente per lavoro ristretto. Classifica il diff in core, test core, extensions, test extension, app, documentazione, metadati di release e tooling, poi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche al Plugin SDK pubblico e ai contratti dei plugin includono un passaggio di validazione di una extension perché le extension dipendono da quei contratti core. I bump di versione che toccano solo i metadati di release eseguono controlli mirati di versione/configurazione/dipendenze root invece della suite completa, con una protezione che rifiuta modifiche ai pacchetti fuori dal campo di versione top-level.
    - I test unit leggeri sugli import da agenti, comandi, Plugin, helper auto-reply, `plugin-sdk` e aree simili di utilità pura vengono instradati nella lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/heavy sul runtime restano sulle lane esistenti.
    - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test espliciti fratelli in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha tre bucket dedicati: helper core di top-level, test di integrazione top-level `reply.*` e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro più pesante dell'harness reply fuori dai test economici di stato/chunk/token.

  </Accordion>

  <Accordion title="Copertura del runner embedded">

    - Quando modifichi gli input di individuazione dei message-tool o il contesto runtime della Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper mirate per confini puri di instradamento e normalizzazione.
    - Mantieni sane le suite di integrazione del runner embedded:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli id con ambito e il comportamento della Compaction continuino a passare
      attraverso i veri percorsi `run.ts` / `compact.ts`; i test solo-helper
      non sono un sostituto sufficiente di questi percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e valori predefiniti di isolamento">

    - La configurazione base di Vitest usa come predefinito `threads`.
    - La configurazione condivisa di Vitest fissa `isolate: false` e usa il
      runner non isolato nei progetti root, e2e e live.
    - La lane UI root mantiene il proprio setup `jsdom` e optimizer, ma viene eseguita comunque sul
      runner condiviso non isolato.
    - Ogni shard `pnpm test` eredita gli stessi valori predefiniti
      `threads` + `isolate: false` dalla configurazione condivisa di Vitest.
    - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per impostazione predefinita ai
      processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontarti con il comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale rapida">

    - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
    - L'hook pre-commit è solo formattazione. Reindicizza i file formattati e
      non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima del handoff o del push quando
      hai bisogno del gate locale intelligente. Le modifiche al Plugin SDK pubblico e ai contratti dei plugin
      includono un passaggio di validazione di una extension.
    - `pnpm test:changed` instrada attraverso lane con ambito quando i percorsi modificati
      si mappano chiaramente a una suite più piccola.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento,
      solo con un limite di worker più alto.
    - L'auto-scaling dei worker locali è intenzionalmente conservativo e arretra
      quando il load average dell'host è già alto, quindi più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
    - La configurazione base di Vitest contrassegna i file di progetto/configurazione come
      `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli
      host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione esplicita della cache per profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita il report della durata di importazione di Vitest più
      l'output di breakdown degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati da `origin/main`.
    - Quando un test hot continua a spendere la maggior parte del tempo negli import di avvio,
      mantieni le dipendenze pesanti dietro una seam locale stretta `*.runtime.ts` e
      mocka direttamente quella seam invece di deep-importare helper runtime solo
      per passarli attraverso `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il percorso instradato
      `test:changed` con il percorso nativo root-project per quel diff committato e stampa wall time più il max RSS su macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero sporco corrente
      instradando l'elenco dei file modificati tramite
      `scripts/test-projects.mjs` e la configurazione root Vitest.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del main-thread per
      l'overhead di avvio e trasformazione di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con il parallelismo dei file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Guida churn sintetico di messaggi, memoria e payload grandi del gateway attraverso il percorso di eventi diagnostici
  - Interroga `diagnostics.stability` tramite il Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità di coda per sessione tornino a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite completa del Gateway

### E2E (smoke gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin inclusi sotto `extensions/`
- Valori predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (limitato a 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output dettagliato della console.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanzа
  - Superfici WebSocket/HTTP, associazione Node e networking più pesante
- Aspettative:
  - Eseguito in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unit (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + exec SSH
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI locale `openshell` e un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambiamenti di formato del provider, peculiarità delle chiamate agli strumenti, problemi di autenticazione e comportamento dei rate limit
- Aspettative:
  - Non stabile in CI per definizione (reti reali, criteri reali dei provider, quote, outage)
  - Costa denaro / usa i rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live fanno source di `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano configurazione/materiale auth in una home di test temporanea così le fixture unit non possano modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa come predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra `~/.profile` e silenzia i log di bootstrap del gateway/chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di avvio.
- Rotazione delle chiavi API (specifica del provider): imposta `*_API_KEYS` con formato virgola/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (ad esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di rate limit.
- Output di avanzamento/Heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/gateway scorrono immediatamente durante le esecuzioni live.
  - Regola gli heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/sonda con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Tocchi networking del gateway / protocollo WS / associazione: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / chiamate agli strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice live dei modelli, smoke dei backend CLI, smoke ACP, harness del server app Codex
e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — più la gestione delle credenziali per le esecuzioni live — vedi
[Test — suite live](/it/help/testing-live).

## Runner Docker (controlli opzionali "funziona su Linux")

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il relativo file live con chiave profilo dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (ed eseguendo source di `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano come predefinito un limite smoke più piccolo così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefinito `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una sola volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le lane Docker live. Costruisce anche un'immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riutilizza per i runner smoke E2E in container che esercitano l'app compilata. L'aggregato usa uno scheduler locale ponderato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che lane live pesanti, lane npm-install e lane multi-servizio partano tutte insieme. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue per impostazione predefinita un preflight Docker, rimuove container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, memorizza i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa quei tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest ponderato delle lane senza costruire né eseguire Docker.
- Runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker live-model montano anche solo le home di autenticazione CLI necessarie (oppure tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione così OAuth delle CLI esterne può aggiornare i token senza modificare l'archivio auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura OpenCode rigorosa tramite `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness del server app Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canale/agente da tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding env-ref più Telegram per impostazione predefinita, verifica che doctor ripari le dipendenze runtime del Plugin attivato ed esegue un turno agente OpenAI mockato. Riusa un tarball precompilato con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricostruzione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider immagine inclusi invece di bloccarsi. Riusa un tarball precompilato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker già costruita con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una sola cache npm tra i suoi container root, update e direct-npm. Lo smoke update usa come predefinito npm `latest` come baseline stabile prima dell'aggiornamento al tarball candidato. I controlli dell'installer non-root mantengono una cache npm isolata così voci di cache possedute da root non mascherino il comportamento di installazione locale utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riutilizzare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script in locale senza quell'env quando serve la copertura diretta `npm install -g`.
- Smoke CLI della cancellazione agenti con workspace condiviso: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) costruisce per impostazione predefinita l'immagine Dockerfile root, inizializza due agenti con un workspace in una home di container isolata, esegue `agents delete --json` e verifica JSON valido più comportamento di mantenimento del workspace. Riusa l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking del Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressione minimal reasoning per OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema del provider e controlla che il dettaglio grezzo compaia nei log del Gateway.
- Bridge canale MCP (Gateway inizializzato + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP del bundle Pi (server MCP stdio reale + smoke allow/deny del profilo Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup Cron/subagent MCP (Gateway reale + teardown di figli MCP stdio dopo esecuzioni cron isolate e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke installazione + alias `/plugin` + semantica di riavvio Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke update invariato del Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke dei metadati di ricarica configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime del Plugin incluso: `pnpm test:docker:bundled-channel-deps` costruisce per impostazione predefinita una piccola immagine runner Docker, costruisce e impacchetta OpenClaw una volta sull'host, poi monta quel tarball in ogni scenario di installazione Linux. Riusa l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricostruzione host dopo una build locale recente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L'aggregato Docker completo preimpacchetta questo tarball una sola volta, poi suddivide i controlli dei canali inclusi in lane indipendenti, comprese lane di update separate per Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` per restringere la matrice dei canali quando esegui direttamente la lane dei bundle, oppure `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` per restringere lo scenario di update. La lane verifica anche che `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` sopprimano la riparazione doctor/runtime-dependency.
- Restringi le dipendenze runtime del Plugin incluso mentre iteri disabilitando scenari non correlati, ad esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per precompilare e riutilizzare manualmente l'immagine condivisa built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override immagine specifici della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` continuano ad avere la precedenza quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione piuttosto che il runtime condiviso built-app.

I runner Docker live-model montano anche il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene
snella l'immagine runtime pur eseguendo comunque Vitest contro il tuo esatto sorgente/config locale.
Il passaggio di staging salta grandi cache solo-locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali delle app o
output Gradle, così le esecuzioni live Docker non sprecano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando ti serve restringere o escludere la copertura live
del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare la propria configurazione di cold-start.
Questa lane si aspetta una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un
container Gateway inizializzato, avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica l'individuazione delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati,
il comportamento della coda di eventi live, l'instradamento dell'invio in uscita e le notifiche in stile Claude di canale +
permessi sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che un particolare SDK client espone casualmente.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live.
Costruisce l'immagine Docker del repository, avvia un vero server sonda MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi embedded,
esegue lo strumento, poi verifica che `coding` e `messaging` mantengano gli
strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway inizializzato con un vero server sonda MCP stdio, esegue un turno Cron
isolato e un turno figlio one-shot `/subagents spawn`, poi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP in thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato in `/home/node/.profile` e caricato con source prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount di autenticazione CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima che i test inizino
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni provider ristrette montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarti che le credenziali provengano dall'archivio del profilo (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Verifica rapida della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli dei titoli nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Chiamata strumenti del Gateway (mock OpenAI, vero gateway + ciclo agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Chiamata strumenti mock tramite il vero gateway + ciclo agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti sulla configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/gli argomenti richiesti?
- **Contratti del flusso di lavoro:** scenari multi-turno che verificano ordine degli strumenti, riporto della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usi provider mock per verificare chiamate agli strumenti + ordine, letture dei file skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, controllate da env) solo dopo che la suite sicura per CI sarà disponibile.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i Plugin individuati ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita `pnpm test`
salta intenzionalmente questi file di seam condivisa e smoke; esegui i comandi dei contratti esplicitamente
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del Plugin (id, nome, funzionalità)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in entrata
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione del criterio di gruppo

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato del canale
- **registry** - Forma del registro dei Plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API del catalogo modelli
- **discovery** - Individuazione del Plugin
- **loader** - Caricamento del Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un Plugin provider
- Dopo aver rifattorizzato registrazione o individuazione dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo-live (rate limit, criteri di autenticazione), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci colpire il livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test diretto dei modelli
  - bug della pipeline di sessione/cronologia/strumenti del gateway → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati così nuove classi non possano essere saltate in silenzio.

## Correlati

- [Test live](/it/help/testing-live)
- [CI](/it/ci)
