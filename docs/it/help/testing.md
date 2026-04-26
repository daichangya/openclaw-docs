---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di regressioni per bug di modello/provider
    - Debug del comportamento di gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testավորում
x-i18n:
    generated_at: "2026-04-26T11:31:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme
di runner Docker. Questo documento è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida della suite completa su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + gateway tool/image): `pnpm test:live`
- Punta a un singolo file live in modo silenzioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep live dei modelli in Docker: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita le probe aggiuntive con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando stai isolando errori del provider.
  - Copertura CI: il job giornaliero `OpenClaw Scheduled Live And E2E Checks` e il job manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow live/E2E riutilizzabile con
    `include_live_suites: true`, che include job separati di matrice Docker live model
    suddivisi per provider.
  - Per riesecuzioni CI mirate, esegui `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e ai relativi
    chiamanti scheduled/release.
- Smoke del bound-chat Codex nativo: `pnpm test:docker:live-codex-bind`
  - Esegue una lane live Docker contro il percorso app-server di Codex, associa un DM Slack
    sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, quindi verifica che una risposta semplice e un allegato immagine
    passino attraverso l'associazione nativa del plugin invece che ACP.
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Esegue turni agente del gateway attraverso l'harness app-server Codex posseduto dal plugin,
    verifica `/codex status` e `/codex models`, e per impostazione predefinita esercita probe di image,
    cron MCP, sottoagente e Guardian. Disabilita la probe del sottoagente con
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` quando stai isolando altri errori
    dell'app-server Codex. Per un controllo mirato del sottoagente, disabilita le altre probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Questo termina dopo la probe del sottoagente a meno che
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` non sia impostato.
- Smoke del comando di ripristino Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Controllo opt-in con doppia sicurezza per la superficie del comando di ripristino del canale messaggi.
    Esercita `/crestodian status`, mette in coda una modifica modello persistente,
    risponde `/crestodian yes` e verifica il percorso di scrittura audit/config.
- Smoke Docker del planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Esegue Crestodian in un container senza configurazione con una falsa Claude CLI in `PATH`
    e verifica che il fallback del planner fuzzy si traduca in una scrittura tipizzata di configurazione con audit.
- Smoke Docker del primo avvio Crestodian: `pnpm test:docker:crestodian-first-run`
  - Parte da una directory di stato OpenClaw vuota, instrada il semplice `openclaw` a
    Crestodian, applica scritture di setup/modello/agente/plugin Discord + SecretRef,
    valida la configurazione e verifica le voci di audit. Lo stesso percorso di setup Ring 0
    è coperto anche in QA Lab da
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, quindi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un singolo caso che fallisce, preferisci restringere i test live tramite le variabili d'ambiente di allowlist descritte sotto.

## Runner specifici QA

Questi comandi si affiancano alle suite di test principali quando hai bisogno del realismo di QA-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito sulle PR corrispondenti e
tramite dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e tramite dispatch manuale con la mock parity gate, la lane live Matrix e la lane live Telegram
gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell'approvazione della release.

- `pnpm openclaw qa suite`
  - Esegue scenari QA basati sul repo direttamente sull'host.
  - Esegue per impostazione predefinita più scenari selezionati in parallelo con worker
    gateway isolati. `qa-channel` usa come predefinito concorrenza 4 (limitata dal numero
    di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker,
    oppure `--concurrency 1` per la vecchia lane seriale.
  - Esce con stato non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e mock di protocollo senza sostituire la lane `mock-openai` consapevole degli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione scenario di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider via env, il percorso di configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la radice del repo così il guest può scrivere indietro
    tramite il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    come predefinito, verifica che l'abilitazione del plugin installi le dipendenze runtime on demand,
    esegue doctor ed esegue un turno agente locale contro un endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione
    pacchettizzata con Discord.
- `pnpm test:docker:session-runtime-context`
  - Esegue uno smoke Docker deterministico dell'app built per trascrizioni del contesto runtime incorporato.
    Verifica che il contesto runtime nascosto di OpenClaw venga reso persistente come messaggio personalizzato
    non visualizzato invece di fuoriuscire nel turno utente visibile, quindi inizializza una sessione JSONL
    corrotta interessata e verifica che
    `openclaw doctor --fix` la riscriva nel branch attivo con un backup.
- `pnpm test:docker:npm-telegram-live`
  - Installa un pacchetto OpenClaw pubblicato in Docker, esegue onboarding del pacchetto installato,
    configura Telegram tramite la CLI installata, quindi riutilizza la lane QA Telegram live con quel pacchetto
    installato come Gateway SUT.
  - Usa come predefinito `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa le stesse credenziali env Telegram o la stessa sorgente credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il role secret. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un role secret Convex sono presenti in CI,
    il wrapper Docker seleziona automaticamente Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive il valore condiviso
    `OPENCLAW_QA_CREDENTIAL_ROLE` solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non viene eseguito al merge. Il workflow usa
    l'ambiente `qa-live-shared` e lease di credenziali CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Pacchettizza e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canali/plugin inclusi tramite modifiche alla configurazione.
  - Verifica che il rilevamento del setup lasci assenti le dipendenze runtime dei plugin non configurati,
    che la prima esecuzione configurata del Gateway o di doctor installi le dipendenze runtime di ogni plugin incluso on demand,
    e che un secondo riavvio non reinstalli dipendenze già attivate.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il doctor post-aggiornamento del
    candidato ripari le dipendenze runtime del canale incluso senza una riparazione postinstall dal lato harness.
- `pnpm test:parallels:npm-update`
  - Esegue lo smoke di aggiornamento dell'installazione pacchettizzata nativa su guest Parallels. Ogni
    piattaforma selezionata installa prima il pacchetto baseline richiesto, poi esegue il comando
    `openclaw update` installato nello stesso guest e verifica la versione installata, lo stato
    dell'aggiornamento, la disponibilità del gateway e un turno agente locale.
  - Usa `--platform macos`, `--platform windows` o `--platform linux` mentre stai iterando
    su un singolo guest. Usa `--json` per il percorso dell'artifact di riepilogo e lo stato
    per singola lane.
  - La lane OpenAI usa come predefinito `openai/gpt-5.5` per la prova live del turno agente.
    Passa `--model <provider/model>` o imposta
    `OPENCLAW_PARALLELS_OPENAI_MODEL` quando stai deliberatamente validando un altro modello
    OpenAI.
  - Avvolgi le lunghe esecuzioni locali in un timeout host così gli stalli del trasporto Parallels non
    consumino il resto della finestra di test:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Lo script scrive log annidati delle lane sotto `/tmp/openclaw-parallels-npm-update.*`.
    Ispeziona `windows-update.log`, `macos-update.log` o `linux-update.log`
    prima di presumere che il wrapper esterno sia bloccato.
  - L'aggiornamento Windows può impiegare da 10 a 15 minuti nella riparazione post-aggiornamento di doctor/dipendenze runtime su un guest freddo; è comunque sano quando il log di debug npm annidato continua ad avanzare.
  - Non eseguire questo wrapper aggregato in parallelo con lane smoke individuali Parallels
    macOS, Windows o Linux. Condividono lo stato della VM e possono collidere sul
    ripristino dello snapshot, sulla distribuzione del pacchetto o sullo stato del gateway guest.
  - La prova post-aggiornamento esegue la normale superficie dei plugin inclusi perché
    le facade di capacità come speech, generazione immagini e comprensione dei media
    vengono caricate tramite API runtime incluse anche quando il turno agente stesso controlla
    solo una semplice risposta di testo.

- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo per repo/sviluppo. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repo caricano direttamente il runner incluso; non è necessario alcun passaggio separato
    di installazione del plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, quindi avvia un processo figlio QA gateway con il vero plugin Matrix come trasporto SUT.
  - Usa come predefinita l'immagine Tuwunel stable fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Fai override con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi di sorgente credenziali perché la lane effettua il provisioning locale di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo, un artifact degli eventi osservati e un log di output combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
  - Emette avanzamento per impostazione predefinita e applica un timeout rigido di esecuzione con `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (predefinito 30 minuti). La pulizia è limitata da `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` e gli errori includono il comando di recupero `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token bot driver e SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'ID del gruppo deve essere l'ID numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa come predefinita la modalità env, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per fare opt-in ai lease del pool.
  - Esce con stato non zero quando uno scenario fallisce. Usa `--allow-failures` quando vuoi artifact senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l'RTT dalla richiesta di invio del driver alla risposta osservata del SUT.

Le lane di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta la suite QA sintetica più ampia e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Controllo tramite menzione | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help |
| -------- | ------ | -------------------------- | ---------------- | ------------------ | -------------------- | ---------------- | ----------------- | --------------------- | ------------ |
| Matrix   | x      | x                          | x                | x                  | x                    | x                | x                 | x                     |              |
| Telegram | x      |                            |                  |                    |                      |                  |                   |                       | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
a quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili d'ambiente richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa come predefinito `ci` in CI, `maintainer` altrimenti)

Variabili d'ambiente facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex loopback `http://` per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin per maintainer (aggiungi/rimuovi/elenca pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `doctor` prima delle esecuzioni live per controllare URL del sito Convex, secret del broker,
prefisso endpoint, timeout HTTP e raggiungibilità admin/list senza stampare
valori secret. Usa `--json` per output leggibile da macchina negli script e nelle utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /admin/add` (solo secret maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secret maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Guardia lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secret maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa ID numerica della chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce la meccanica condivisa dell'host:

- la root di comando `openclaw qa`
- startup e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I plugin runner gestiscono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come vengono gestiti reset o cleanup specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sul seam host condiviso `qa-lab`.
3. Mantenere la meccanica specifica del trasporto dentro il plugin runner o l'harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; l'esecuzione lazy di CLI e runner dovrebbe restare dietro entrypoint separati.
5. Creare o adattare scenari markdown sotto le directory tematiche `qa/scenarios/`.
6. Usare gli helper di scenario generici per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, salvo migrazione intenzionale del repo.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, tienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capacità che può essere usata da più di un canale, aggiungi un helper generico invece di un branch specifico del canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

I nomi helper generici preferiti per i nuovi scenari sono:

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

Il nuovo lavoro sui canali dovrebbe usare i nomi helper generici.
Gli alias di compatibilità esistono per evitare una migrazione in un solo giorno, non come modello per
la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito e dove)

Pensa alle suite come a “realismo crescente” (e crescente instabilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-project in configurazioni per progetto per la schedulazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unit puri
  - Test di integrazione in-process (autenticazione gateway, instradamento, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguita in CI
  - Nessuna chiave reale richiesta
  - Dovrebbe essere veloce e stabile

<AccordionGroup>
  <Accordion title="Progetti, shard e lane con ambito definito">

    - Le esecuzioni non mirate di `pnpm test` usano dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico gigantesco processo nativo root-project. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro auto-reply/extension sottragga risorse a suite non correlate.
    - `pnpm test --watch` usa ancora il grafo dei progetti nativo della root `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti file/directory attraverso lane con ambito definito, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
    - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane con ambito definito quando il diff tocca solo file sorgente/test instradabili; le modifiche a config/setup fanno comunque fallback alla riesecuzione più ampia del progetto root.
    - `pnpm check:changed` è il normale smart gate locale per lavoro ristretto. Classifica il diff in core, core tests, extensions, extension tests, apps, docs, metadati di release, tooling live Docker e tooling, quindi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche al Plugin SDK pubblico e al contratto plugin includono un passaggio di validazione extension perché le extension dipendono da quei contratti core. I version bump solo di metadati release eseguono controlli mirati su version/config/root-dependency invece della suite completa, con una guardia che rifiuta modifiche ai package fuori dal campo versione di primo livello.
    - Le modifiche all'harness ACP live Docker eseguono un gate locale focalizzato: sintassi shell per gli script di autenticazione live Docker, dry-run dello scheduler live Docker, unit test ACP bind e test dell'extension ACPX. Le modifiche a `package.json` sono incluse solo quando il diff è limitato a `scripts["test:docker:live-*"]`; modifiche a dipendenze, export, versione e altre superfici del package usano comunque le guardie più ampie.
    - I test unit leggeri in termini di import da agents, commands, plugins, helper auto-reply, `plugin-sdk` e aree simili di pura utilità vengono instradati attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti.
    - Anche alcuni file helper sorgente selezionati di `plugin-sdk` e `commands` mappano le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
    - `auto-reply` ha bucket dedicati per helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. La CI inoltre divide il sottoalbero reply in shard agent-runner, dispatch e commands/state-routing così un bucket pesante in termini di import non possiede l'intera coda Node.

  </Accordion>

  <Accordion title="Copertura dell'embedded runner">

    - Quando cambi gli input di discovery del message-tool o il contesto runtime della Compaction,
      mantieni entrambi i livelli di copertura.
    - Aggiungi regressioni helper focalizzate per confini puri di instradamento e normalizzazione.
    - Mantieni sane le suite di integrazione dell'embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Queste suite verificano che gli ID con ambito definito e il comportamento di Compaction continuino a fluire
      attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo-helper non sono
      un sostituto sufficiente per quei percorsi di integrazione.

  </Accordion>

  <Accordion title="Pool Vitest e predefiniti di isolamento">

    - La configurazione base di Vitest usa come predefinito `threads`.
    - La configurazione Vitest condivisa fissa `isolate: false` e usa il runner
      non isolato nei progetti root, e2e e live.
    - La lane UI root mantiene la sua configurazione `jsdom` e l'optimizer, ma gira anch'essa sul
      runner condiviso non isolato.
    - Ogni shard di `pnpm test` eredita gli stessi predefiniti `threads` + `isolate: false`
      dalla configurazione Vitest condivisa.
    - `scripts/run-vitest.mjs` aggiunge come predefinito `--no-maglev` ai processi
      Node figlio di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
      Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontarti con il
      comportamento V8 standard.

  </Accordion>

  <Accordion title="Iterazione locale veloce">

    - `pnpm changed:lanes` mostra quali lane architetturali vengono attivate da un diff.
    - Il pre-commit hook si occupa solo della formattazione. Rimette in stage i file
      formattati e non esegue lint, typecheck o test.
    - Esegui esplicitamente `pnpm check:changed` prima della consegna o del push quando
      ti serve lo smart gate locale. Le modifiche al Plugin SDK pubblico e al contratto plugin
      includono un passaggio di validazione extension.
    - `pnpm test:changed` instrada attraverso lane con ambito definito quando i percorsi modificati
      mappano chiaramente a una suite più piccola.
    - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento,
      solo con un limite di worker più alto.
    - L'auto-scaling locale dei worker è intenzionalmente conservativo e arretra
      quando il load average dell'host è già alto, così più esecuzioni Vitest concorrenti
      fanno meno danni per impostazione predefinita.
    - La configurazione base di Vitest contrassegna i file projects/config come
      `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia
      il wiring dei test.
    - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli
      host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
      una posizione cache esplicita per il profiling diretto.

  </Accordion>

  <Accordion title="Debug delle prestazioni">

    - `pnpm test:perf:imports` abilita la reportistica di Vitest sulla durata degli import più
      output di dettaglio degli import.
    - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
      file modificati rispetto a `origin/main`.
    - I dati di timing degli shard vengono scritti in `.artifacts/vitest-shard-timings.json`.
      Le esecuzioni su intera configurazione usano il percorso config come chiave; gli shard CI
      con pattern include aggiungono il nome dello shard così gli shard filtrati possono essere tracciati
      separatamente.
    - Quando un singolo hot test continua a spendere la maggior parte del tempo negli import di avvio,
      mantieni le dipendenze pesanti dietro uno stretto seam locale `*.runtime.ts` e
      fai mock direttamente di quel seam invece di deep-importare helper runtime solo
      per passarli a `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il percorso instradato
      `test:changed` con il percorso nativo root-project per quel diff committed e stampa
      wall time più max RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero dirty corrente
      instradando l'elenco dei file modificati attraverso
      `scripts/test-projects.mjs` e la configurazione root Vitest.
    - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
      overhead di avvio e transform di Vitest/Vite.
    - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
      suite unit con parallelismo file disabilitato.

  </Accordion>
</AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Guida churn sintetico di messaggi gateway, memoria e payload di grandi dimensioni attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite WS RPC del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che la profondità delle code per sessione torni a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite completa del Gateway

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi sotto `extensions/`
- Predefiniti di runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguita in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare output console dettagliato.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, abbinamento dei nodi e networking più pesante
- Aspettative:
  - Viene eseguita in CI (quando abilitata nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti mobili rispetto ai test unit (può essere più lenta)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw su reali `sandbox ssh-config` + exec SSH
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin inclusi sotto `extensions/`
- Predefinito: **abilitata** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Cattura cambi di formato del provider, particolarità delle tool call, problemi di autenticazione e comportamento del rate limit
- Aspettative:
  - Non stabile in CI per progettazione (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano configurazione/materiale auth in una home temporanea di test così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa come predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso aggiuntivo su `~/.profile` e silenzia i log di bootstrap del gateway / chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o override per live via `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono linee di avanzamento su stderr così le chiamate lunghe al provider risultano visibilmente attive anche quando il capture della console di Vitest è silenzioso.
  - `vitest.live.config.ts` disabilita l'intercettazione console di Vitest così le linee di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrice live dei modelli, gli smoke del backend CLI, gli smoke ACP, l'harness
app-server Codex e tutti i test live dei provider multimediali (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — oltre alla gestione delle credenziali per le esecuzioni live — vedi
[Test — suite live](/it/help/testing-live).

## Runner Docker (controlli facoltativi "funziona su Linux")

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il relativo file live con chiave di profilo all'interno dell'immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefinito `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Fai override di queste variabili env quando vuoi
  esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le lane live Docker. Costruisce anche un'immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riutilizza per i runner smoke E2E in container che esercitano l'app built. L'aggregato usa uno scheduler locale pesato: `OPENCLAW_DOCKER_ALL_PARALLELISM` controlla gli slot di processo, mentre i limiti di risorse impediscono che lane pesanti live, npm-install e multi-service partano tutte insieme. I valori predefiniti sono 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; regola `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` solo quando l'host Docker ha più margine. Il runner esegue come predefinito un preflight Docker, rimuove i container E2E OpenClaw obsoleti, stampa lo stato ogni 30 secondi, memorizza i tempi delle lane riuscite in `.artifacts/docker-tests/lane-timings.json` e usa questi tempi per avviare prima le lane più lunghe nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest pesato delle lane senza costruire o eseguire Docker.
- Runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano anche in bind solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), quindi le copiano nella home del container prima dell'esecuzione così l'OAuth della CLI esterna può aggiornare i token senza modificare l'archivio di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; copre Claude, Codex e Gemini per impostazione predefinita, con copertura rigorosa Droid/OpenCode tramite `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball onboarding/channel/agent: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw pacchettizzato, configura OpenAI tramite onboarding env-ref più Telegram come predefinito, verifica che doctor ripari le dipendenze runtime del plugin attivato ed esegue un turno agente OpenAI mockato. Riusa un tarball già costruito con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricostruzione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke update channel switch: `pnpm test:docker:update-channel-switch` installa globalmente in Docker il tarball OpenClaw pacchettizzato, passa dal package `stable` al git `dev`, verifica che il canale persistito e il plugin post-update funzionino, quindi torna al package `stable` e controlla lo stato dell'aggiornamento.
- Smoke session runtime context: `pnpm test:docker:session-runtime-context` verifica la persistenza della trascrizione del contesto runtime nascosto più la riparazione tramite doctor dei branch interessati da riscrittura duplicata del prompt.
- Smoke installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pacchettizza l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider image inclusi invece di bloccarsi. Riusa un tarball già costruito con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker già costruita con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una sola cache npm tra i container root, update e direct-npm. Lo smoke di update usa come predefinito npm `latest` come baseline stabile prima dell'upgrade al tarball candidato. I controlli dell'installer non-root mantengono una cache npm isolata così voci di cache possedute da root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riusare la cache root/update/direct-npm nelle riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella env quando serve la copertura diretta `npm install -g`.
- Smoke CLI agents delete shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) costruisce per impostazione predefinita l'immagine del Dockerfile root, inizializza due agenti con un workspace in una home container isolata, esegue `agents delete --json` e verifica JSON valido più comportamento di workspace mantenuto. Riusa l'immagine install-smoke con `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking del gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot browser CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) costruisce l'immagine E2E sorgente più un layer Chromium, avvia Chromium con CDP grezzo, esegue `browser doctor --deep` e verifica che gli snapshot del ruolo CDP coprano URL dei link, clickabili promossi dal cursore, ref iframe e metadati dei frame.
- Regressione minimale OpenAI Responses web_search reasoning: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato attraverso il Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, quindi forza il rifiuto dello schema provider e controlla che il dettaglio grezzo appaia nei log del Gateway.
- Bridge del canale MCP (Gateway inizializzato + bridge stdio + smoke grezzo del frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (server MCP stdio reale + smoke allow/deny del profilo embedded Pi): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP cron/subagent (Gateway reale + teardown del figlio MCP stdio dopo Cron isolato e un'esecuzione sottoagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke di installazione, install/uninstall ClawHub, aggiornamenti marketplace e enable/inspect del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per saltare il blocco live ClawHub, oppure fai override del package predefinito con `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke plugin update unchanged: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke dei metadati config reload: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime del plugin incluso: `pnpm test:docker:bundled-channel-deps` costruisce per impostazione predefinita una piccola immagine runner Docker, costruisce e pacchettizza OpenClaw una volta sull'host, quindi monta quel tarball in ogni scenario di installazione Linux. Riusa l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricostruzione host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L'aggregato Docker completo pre-pacchettizza questo tarball una sola volta, poi suddivide i controlli dei canali inclusi in lane indipendenti, incluse lane update separate per Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Usa `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` per restringere la matrice dei canali quando esegui direttamente la lane bundled, oppure `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` per restringere lo scenario di update. La lane verifica anche che `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` sopprimano la riparazione doctor/dipendenze runtime.
- Restringi le dipendenze runtime del plugin incluso mentre iteri disabilitando scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per pre-costruire e riusare manualmente l'immagine condivisa built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override immagine specifici della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hanno comunque la precedenza quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono Dockerfile propri perché convalidano il comportamento di package/installazione anziché il runtime condiviso dell'app built.

I runner Docker live-model montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l'immagine runtime
pur eseguendo Vitest esattamente sul tuo sorgente/config locale.
Il passaggio di staging salta grandi cache solo locali e output di build app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali dell'app o
output Gradle così le esecuzioni live Docker non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura live
del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, esegue l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup di cold-start.
Questa lane si aspetta una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un
container Gateway inizializzato, avvia un secondo container che genera `openclaw mcp serve`, quindi
verifica discovery della conversazione instradata, letture delle trascrizioni, metadati degli allegati,
comportamento della coda di eventi live, instradamento dell'invio in uscita e notifiche in stile Claude di canale +
permessi sul reale bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi così lo smoke convalida ciò che il
bridge emette davvero, non solo ciò che un particolare SDK client riesce a esporre.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una
chiave di modello live. Costruisce l'immagine Docker del repo, avvia un vero server probe MCP stdio
dentro il container, materializza quel server tramite il runtime MCP del bundle embedded Pi,
esegue lo strumento, quindi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrino.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway inizializzato con un vero server probe MCP stdio, esegue un turno Cron isolato e un turno figlio one-shot con `/subagents spawn`, quindi verifica
che il processo figlio MCP esca dopo ogni esecuzione.

Smoke manuale ACP thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata in `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env lette da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount di autenticazione CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file di autenticazione CLI esterna sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, quindi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni provider ristrette montano solo le directory/file necessarie dedotte da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Fai override manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riusare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dallo store del profilo (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per fare override del prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per fare override del tag immagine Open WebUI fissato

## Sanity della documentazione

Esegui i controlli docs dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche controlli sugli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni di “pipeline reale” senza provider reali:

- Tool calling del gateway (mock OpenAI, vero gateway + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del gateway (WS `wizard.start`/`wizard.next`, scrive config + auth enforced): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock del tool-calling attraverso il vero gateway + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano wiring delle sessioni ed effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine degli strumenti, carryover della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare tool call + ordine, letture dei file Skill e wiring delle sessioni.
- Una piccola suite di scenari focalizzati sulle Skill (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, controllate da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin individuati ed eseguono una suite di
asserzioni di forma e comportamento. La lane unit predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, name, capabilities)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione del messaggio in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'ID del thread
- **directory** - API di directory/roster
- **group-policy** - Applicazione del criterio di gruppo

### Contratti di stato dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registry plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione di autenticazione
- **catalog** - API del catalogo modelli
- **discovery** - Discovery del plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver cambiato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un canale o un plugin provider
- Dopo il refactor della registrazione o discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono vere chiavi API.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (mock/stub del provider, o cattura dell'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci colpire il layer più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test dei modelli diretti
  - bug della pipeline gateway session/history/tool → smoke live del gateway o test mock gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ricava un target campionato per classe SecretRef dai metadati del registry (`listSecretTargetRegistryEntries()`), quindi verifica che gli ID exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su ID target non classificati così nuove classi non possono essere saltate in silenzio.

## Correlati

- [Testing live](/it/help/testing-live)
- [CI](/it/ci)
