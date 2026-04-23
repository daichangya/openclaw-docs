---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiunta di regressioni per bug di modello/provider
    - Debugging del comportamento di Gateway + agent
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test in corso
x-i18n:
    generated_at: "2026-04-23T14:55:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questa documentazione è una guida al “come testiamo”:

- Cosa copre ciascuna suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debugging)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida della suite completa su una macchina capiente: `pnpm test:max`
- Ciclo watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Quando stai iterando su un singolo errore, preferisci prima esecuzioni mirate.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debugging di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + tool/immagini di Gateway): `pnpm test:live`
- Seleziona un singolo file live in modalità silenziosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep Docker dei modelli live: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più una piccola probe in stile lettura file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita le probe aggiuntive con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando stai isolando errori del provider.
  - Copertura CI: il job giornaliero `OpenClaw Scheduled Live And E2E Checks` e il job manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow riutilizzabile live/E2E con
    `include_live_suites: true`, che include job separati di matrice Docker live model
    suddivisi per provider.
  - Per riesecuzioni CI mirate, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi
    chiamanti pianificati/di release.
- Smoke del costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostato, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un test isolato
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  su `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell’assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un caso fallito, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi si affiancano alle suite di test principali quando ti serve il realismo di qa-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito su PR corrispondenti e
da avvio manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e da avvio manuale con il parity gate mock, la lane live Matrix e la lane live Telegram
gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell’approvazione della release.

- `pnpm openclaw qa suite`
  - Esegue direttamente sull’host gli scenari QA supportati dal repository.
  - Esegue per impostazione predefinita più scenari selezionati in parallelo con worker Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia lane seriale.
  - Esce con codice non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale basato su AIMock per copertura sperimentale
    di fixture e protocol mock senza sostituire la lane `mock-openai`
    orientata agli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repository così il guest può scrivere indietro tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Crea un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con API key OpenAI, configura Telegram
    per impostazione predefinita, verifica che l’abilitazione del plugin installi le dipendenze runtime su richiesta,
    esegue doctor ed esegue un turno locale dell’agent contro un endpoint OpenAI simulato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane
    di installazione pacchettizzata con Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build corrente di OpenClaw in Docker, avvia il Gateway
    con OpenAI configurato, poi abilita channel/plugin bundled tramite
    modifiche alla configurazione.
  - Verifica che il rilevamento di setup lasci assenti le dipendenze runtime dei plugin non configurati, che la prima esecuzione configurata di Gateway o doctor installi su richiesta le dipendenze runtime di ciascun plugin bundled e che un secondo riavvio non reinstalli le dipendenze già attivate.
  - Installa anche una baseline npm nota più vecchia, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-aggiornamento
    della candidate ripari le dipendenze runtime dei channel bundled senza una
    riparazione postinstall lato harness.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo per repository/sviluppo. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repository caricano direttamente il runner bundled; non è necessario un passaggio separato di installazione del plugin.
  - Esegue il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un processo figlio QA gateway con il vero plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l’immagine Tuwunel stable fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sostituiscila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un’immagine diversa.
  - Matrix non espone flag condivisi di origine credenziali perché la lane esegue localmente il provisioning di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo, un artifact di eventi osservati e un log combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT dall’env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id del gruppo deve essere l’id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per scegliere lease condivisi.
  - Esce con codice non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artifact senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un’osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l’RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta l’ampia suite QA sintetica e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Gating delle menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------------- | -------------------- | ------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                         | x                    | x                   | x                     | x                           |              |
| Telegram | x      |                       |                  |                           |                      |                     |                       |                             | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
di quel lease mentre la lane è in esecuzione e rilascia il lease all’arresto.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Valore env predefinito: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, `maintainer` altrimenti)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di tracciamento opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` di loopback locale solo per sviluppo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi amministrativi del maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` per output leggibile da macchina in script e utility CI.

Contratto dell’endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Protezione lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secret maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa numerica che rappresenta l’id della chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un channel a QA

Aggiungere un channel al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il channel.
2. Un pacchetto di scenari che eserciti il contratto del channel.

Non aggiungere una nuova root di comando QA di primo livello quando l’host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce le meccaniche host condivise:

- la root di comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner gestiscono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il Gateway viene configurato per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposte le trascrizioni e lo stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifici del trasporto

La soglia minima di adozione per un nuovo channel è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere le meccaniche specifiche del trasporto all’interno del plugin runner o dell’harness del channel.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l’esecuzione del runner devono restare dietro entrypoint separati.
5. Creare o adattare scenari markdown nelle directory tematiche `qa/scenarios/`.
6. Usare gli helper di scenario generici per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia effettuando una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un trasporto di un solo channel, mantienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capacità che può essere usata da più di un channel, aggiungi un helper generico invece di un branch specifico del channel in `suite.ts`.
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

Il nuovo lavoro sui channel deve usare i nomi degli helper generici.
Gli alias di compatibilità esistono per evitare una migrazione “flag day”, non come modello per
la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e flakiness/costo crescenti):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-project in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth di gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguita in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` non mirato ora esegue dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un singolo enorme processo root-project nativo. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo dei progetti root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima target espliciti di file/directory attraverso lane con scope, così `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane con scope quando la diff tocca solo file sorgente/test instradabili; le modifiche a config/setup continuano invece a ricadere sulla riesecuzione ampia del progetto root.
  - `pnpm check:changed` è il normale smart local gate per lavoro circoscritto. Classifica la diff in core, test core, extensions, test extension, app, documentazione, metadati di release e tooling, poi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche a Plugin SDK pubblico e contratto plugin includono validazione delle extension perché le extension dipendono da quei contratti core. I version bump che toccano solo metadati di release eseguono controlli mirati di versione/config/dipendenze root invece della suite completa, con una guardia che rifiuta modifiche ai package fuori dal solo campo versione di primo livello.
  - I test unitari leggeri in termini di import da agent, command, plugin, helper auto-reply, `plugin-sdk` e aree di utility pure simili passano attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti.
  - Alcuni file helper sorgente di `plugin-sdk` e `commands` mappano anche le esecuzioni in changed-mode a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo tiene il lavoro più pesante dell’harness reply fuori dai test economici di stato/chunk/token.
- Nota sull’embedded runner:
  - Quando modifichi input di discovery dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per boundary pure di routing/normalizzazione.
  - Mantieni sane anche le suite di integrazione dell’embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id con scope e il comportamento di Compaction continuino a fluire
    attraverso i veri percorsi `run.ts` / `compact.ts`; i soli test helper non sono un
    sostituto sufficiente per questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa `threads` per impostazione predefinita.
  - La configurazione Vitest condivisa fissa anche `isolate: false` e usa il runner non isolato nei progetti root, nelle configurazioni e2e e live.
  - La lane UI root mantiene la sua configurazione e l’optimizer `jsdom`, ma ora usa anch’essa il runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per i processi child Node di Vitest per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontare il comportamento V8 standard.
- Nota sull’iterazione locale rapida:
  - `pnpm changed:lanes` mostra quali lane architetturali attiva una diff.
  - L’hook pre-commit esegue `pnpm check:changed --staged` dopo formatting/linting dei file in stage, quindi i commit solo-core non pagano il costo dei test extension a meno che non tocchino contratti pubblici rivolti alle extension. I commit che toccano solo metadati di release restano sulla lane mirata versione/config/dipendenze root.
  - Se l’esatto insieme di modifiche in stage è già stato validato con gate equivalenti o più forti, usa `scripts/committer --fast "<message>" <files...>` per saltare solo la riesecuzione dell’hook changed-scope. Formatting/linting dei file in stage vengono comunque eseguiti. Indica i gate completati nel tuo handoff. Questo è accettabile anche dopo la riesecuzione di un errore flaky isolato dell’hook che poi passa con prova circoscritta.
  - `pnpm test:changed` passa attraverso lane con scope quando i percorsi modificati mappano chiaramente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite più alto di worker.
  - L’auto-scaling locale dei worker ora è intenzionalmente conservativo e riduce anche quando il load average dell’host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
  - La configurazione base di Vitest contrassegna i progetti/file di configurazione come `forceRerunTriggers` così le riesecuzioni in changed-mode restano corrette quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per profiling diretto.
- Nota sul debugging delle performance:
  - `pnpm test:perf:imports` abilita il report della durata degli import di Vitest più l’output di dettaglio degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso nativo root-project per quella diff già committata e stampa wall time più max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark del worktree sporco corrente instradando la lista dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per overhead di startup e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo dei file disabilitato.

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Pilota churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la WS RPC del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti bounded, che i campioni RSS sintetici restino sotto il budget di pressione e che la profondità delle code per sessione torni a zero
- Aspettative:
  - Sicura per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite completa del Gateway

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin bundled sotto `extensions/`
- Valori predefiniti di runtime:
  - Usa Vitest `threads` con `isolate: false`, allineandosi al resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguita in modalità silenziosa per impostazione predefinita per ridurre l’overhead di I/O su console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare output console verboso.
- Ambito:
  - Comportamento end-to-end del Gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguita in CI (quando abilitata nella pipeline)
  - Non richiede chiavi reali
  - Ha più parti mobili rispetto ai test unitari (può essere più lenta)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull’host tramite Docker
  - Crea un sandbox a partire da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + esecuzione SSH
  - Verifica il comportamento del filesystem canonical remoto tramite il bridge fs del sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il Gateway di test e il sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin bundled sotto `extensions/`
- Predefinito: **abilitata** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambiamenti di formato del provider, particolarità della tool calling, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali API key mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale config/auth in una home temporanea di test così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra su `~/.profile` e silenzia i log di bootstrap del Gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle API key (specifica per provider): imposta `*_API_KEYS` in formato con virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure l’override per-live `OPENCLAW_LIVE_*_KEY`; i test riprovano in caso di risposte rate limit.
- Output di progresso/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe al provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione della console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat del gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Se modifichi logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai modificato molto)
- Se tocchi networking del Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se fai debugging di “il mio bot è fuori uso” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/precondizionato (la suite non installa/esegue/associa l’app).
  - Validazione `node.invoke` del Gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa + associata al Gateway.
  - App mantenuta in foreground.
  - Permessi/consenso di acquisizione concessi per le capacità che ti aspetti superino il test.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi di setup Android: [App Android](/it/platforms/android)

## Live: smoke del modello (chiavi del profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Modello diretto” ci dice se il provider/modello riesce almeno a rispondere con la chiave data.
- “Smoke del Gateway” ci dice se la pipeline completa gateway+agent funziona per quel modello (sessioni, cronologia, tool, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul Gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l’allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per l’allowlist modern
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep modern esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store del profilo e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store del profilo
- Perché esiste:
  - Separa “l’API del provider è rotta / la chiave non è valida” da “la pipeline agent del Gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: flussi di replay del reasoning OpenAI Responses/Codex Responses + tool-call)

### Livello 2: smoke del Gateway + agent dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un Gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza tool)
    - una vera invocazione di tool funziona (probe di lettura)
    - probe opzionali di tool extra (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli delle probe (così puoi spiegare rapidamente i guasti):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all’agent di `read` il file e restituire il nonce.
  - probe `exec+read`: il test chiede all’agent di scrivere tramite `exec` un nonce in un file temporaneo, poi di `read` per rileggerlo.
  - probe immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per l’allowlist modern
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep modern esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe tool + immagine sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress dei tool)
  - la probe immagine viene eseguita quando il modello dichiara supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori consentiti)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli id esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agent usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- Gli smoke predefiniti specifici del backend si trovano nella definizione `cli-backend.ts` dell’extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di command/args/immagine proviene dai metadati del plugin proprietario del backend CLI.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità nella stessa sessione Claude Sonnet -> Opus (impostalo su `1` per forzarla quando il modello selezionato supporta un target di switch).

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI all’interno dell’immagine Docker del repository come utente non root `node`.
- Risolve i metadati smoke della CLI dall’extension proprietaria, quindi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile dell’abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra direttamente `claude -p` in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env delle API key Anthropic. Questa lane subscription disabilita per impostazione predefinita le probe Claude MCP/tool e immagine perché Claude attualmente instrada l’uso di app di terze parti attraverso fatturazione extra-usage invece che tramite i normali limiti del piano subscription.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi chiamata tool MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke del bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso ACP conversation-bind con un agent ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - collegare sul posto una conversazione sintetica di message-channel
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP collegata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agent ACP in Docker: `claude,codex,gemini`
  - Agent ACP per `pnpm test:live ...` diretto: `claude`
  - Channel sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Note:
  - Questa lane usa la superficie `chat.send` del Gateway con campi sintetici di originating-route solo admin così i test possono collegare il contesto del message-channel senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agent integrato del plugin embedded `acpx` per l’agent harness ACP selezionato.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Ricette Docker per singolo agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue lo smoke ACP bind contro tutti gli agent CLI live supportati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Legge `~/.profile`, prepara nel container il materiale di auth CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- All’interno di Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider provenienti dal profilo caricato.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex posseduto dal plugin tramite il normale
  metodo Gateway `agent`:
  - caricare il plugin bundled `codex`
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno Gateway agent a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread
    app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando
    del Gateway
  - facoltativamente eseguire due probe shell escalate revisionate da Guardian: un
    comando benigno che dovrebbe essere approvato e un falso upload di secret che dovrebbe essere
    negato così l’agent richiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex rotto
  non può passare ripiegando silenziosamente su Pi.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più eventuali
  `~/.codex/auth.json` e `~/.codex/config.toml` copiati

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Ricetta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Legge il `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di auth della CLI Codex
  quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile,
  prepara il source tree, poi esegue solo il test live Codex-harness.
- Docker abilita per impostazione predefinita le probe immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando ti serve un’esecuzione di debug
  più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, allineandosi alla configurazione del
  test live così il fallback `openai-codex/*` o Pi non può nascondere una regressione
  dell’harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più rapide e meno flaky:

- Modello singolo, diretto (senza Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su diversi provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l’API Gemini (API key).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agent in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità dei tool).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama via HTTP l’API Gemini ospitata da Google (auth tramite API key / profilo); è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario locale `gemini`; ha una propria auth e può comportarsi diversamente (streaming/supporto tool/version skew).

## Live: matrice dei modelli (cosa copriamo)

Non esiste una “lista modelli CI” fissa (il live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (opzionale: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui Gateway smoke con tool + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opzionale)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva opzionale (utile ma non necessaria):

- xAI: `xai/grok-4` (oppure l’ultima disponibile)
- Mistral: `mistral/`… (scegli un modello con capacità “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; la tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varianti OpenAI con capacità vision, ecc.) per esercitare la probe immagine.

### Aggregatori / Gateway alternativi

Se hai chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/config):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualunque proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non provare a codificare in modo rigido “tutti i modelli” nella documentazione. L’elenco autorevole è quello che `discoverModels(...)` restituisce sulla tua macchina + le chiavi disponibili.

## Credenziali (non committare mai)

I test live scoprono le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, fai debugging come faresti per `openclaw models list` / selezione del modello.

- Profili di auth per-agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che “chiavi del profilo” significa nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live preparata quando presente, ma non è lo store principale delle chiavi del profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per-agent, la directory legacy `credentials/` e le directory di auth CLI esterne supportate in una home temporanea di test; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo vero workspace host.

Se vuoi affidarti alle chiavi env (per esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override opzionale del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi bundled comfy di immagine, video e `music_generate`
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione del plugin

## Live generazione immagini

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le variabili env provider mancanti dalla tua shell di login (`~/.profile`) prima di eseguire le probe
  - Usa per impostazione predefinita API key live/env prima dei profili di auth salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue le varianti standard di generazione immagini tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bundled attualmente coperti:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restrizione opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store del profilo e ignorare gli override solo env

## Live generazione musica

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione musica
  - Attualmente copre Google e MiniMax
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima di eseguire le probe
  - Usa per impostazione predefinita API key live/env prima dei profili di auth salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input basato solo su prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store del profilo e ignorare gli override solo env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione video
  - Per impostazione predefinita usa il percorso smoke sicuro per la release: provider non-FAL, una richiesta text-to-video per provider, prompt “lobster” di un secondo e un limite di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare i tempi di release; passa `--video-providers fal` oppure `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima di eseguire le probe
  - Usa per impostazione predefinita API key live/env prima dei profili di auth salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità transform dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale buffer-backed nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale buffer-backed nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` bundled è solo testo e `kling` bundled richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che per impostazione predefinita usa una fixture con URL immagine remoto
  - Copertura live attuale `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l’attuale lane condivisa Gemini/Veo usa input locali buffer-backed e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l’attuale lane condivisa non garantisce l’accesso specifico dell’organizzazione a inpaint/remix video
- Restrizione opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di operazione di ciascun provider in uno smoke run aggressivo
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store del profilo e ignorare gli override solo env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente le variabili env provider mancanti da `~/.profile`
  - Restringe automaticamente ciascuna suite ai provider che attualmente hanno auth utilizzabile per impostazione predefinita
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli opzionali “funziona su Linux”)

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live con chiavi del profilo corrispondente all’interno dell’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory config locale e il workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sostituisci queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l’immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due lane Docker live. Costruisce anche una singola immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riutilizza per i runner smoke E2E in container che esercitano l’app buildata.
- Runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre solo le home di auth CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione così l’OAuth delle CLI esterne può aggiornare i token senza modificare lo store di auth dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent da tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding env-ref più Telegram per impostazione predefinita, verifica che l’abilitazione del plugin installi le sue dipendenze runtime su richiesta, esegue doctor ed esegue un turno agent OpenAI simulato. Riusa un tarball prebuildato con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la rebuild host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia channel con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Networking del Gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressione minimale del reasoning `web_search` OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI simulato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema provider e controlla che il dettaglio raw compaia nei log del Gateway.
- Bridge MCP channel (Gateway seeded + bridge stdio + smoke raw dei notification-frame Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (vero server MCP stdio + smoke allow/deny del profilo Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (vero Gateway + teardown del child MCP stdio dopo esecuzioni isolate di Cron e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke installazione + alias `/plugin` + semantica di riavvio Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke invariato dell’aggiornamento Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke dei metadati di reload della configurazione: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei plugin bundled: `pnpm test:docker:bundled-channel-deps` costruisce per impostazione predefinita una piccola immagine runner Docker, builda e impacchetta OpenClaw una sola volta sull’host, poi monta quel tarball in ogni scenario di installazione Linux. Riusa l’immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la rebuild host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restringi le dipendenze runtime dei plugin bundled mentre iteri disabilitando gli scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per prebuildare e riutilizzare manualmente l’immagine condivisa dell’app buildata:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override dell’immagine specifici della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la priorità quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di pacchetto/installazione invece del runtime condiviso dell’app buildata.

I runner Docker live-model montano inoltre il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene il runtime
image leggero pur eseguendo Vitest contro il tuo esatto source/config locale.
Il passaggio di staging salta grandi cache solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali dell’app o
directory di output Gradle, così le esecuzioni live Docker non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del Gateway non avviano
veri worker di channel Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura live
Gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel Gateway, effettua l’accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l’immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup di cold-start.
Questa lane si aspetta una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway seeded,
avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica rilevamento della conversazione instradata, letture delle trascrizioni, metadati degli allegati,
comportamento della coda eventi live, instradamento dell’invio in uscita e notifiche di channel +
permessi in stile Claude tramite il vero bridge stdio MCP. Il controllo delle notifiche
ispeziona direttamente i frame raw stdio MCP così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che capita di esporre un particolare SDK client.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello
live. Costruisce l’immagine Docker del repository, avvia un vero server probe MCP stdio
dentro il container, materializza quel server tramite il runtime MCP bundle Pi embedded,
esegue il tool, poi verifica che `coding` e `messaging` mantengano i
tool `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello
live. Avvia un Gateway seeded con un vero server probe MCP stdio, esegue un
turno Cron isolato e un turno figlio one-shot `/subagents spawn`, poi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale del thread ACP in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell’instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinita: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinita: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinita: `~/.profile`) montata su `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env lette da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount di auth CLI esterna
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinita: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file di auth CLI esterna sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell’avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni con provider ristretti montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oppure un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l’esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un’immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dallo store del profilo (non dall’env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag dell’immagine Open WebUI fissata

## Sanity check della documentazione

Esegui i controlli della documentazione dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (CI-safe)

Si tratta di regressioni di “pipeline reale” senza provider reali:

- Tool calling del Gateway (OpenAI simulato, vero loop gateway + agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth enforced): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agent (Skills)

Abbiamo già alcuni test CI-safe che si comportano come “valutazioni di affidabilità degli agent”:

- Tool-calling simulata tramite il vero loop gateway + agent (`src/gateway/gateway.test.ts`).
- Flussi end-to-end del wizard che validano il wiring della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l’agent sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l’agent legge `SKILL.md` prima dell’uso e segue passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine dei tool, persistenza della cronologia di sessione e boundary del sandbox.

Le valutazioni future dovrebbero prima di tutto restare deterministiche:

- Un runner di scenari che usa provider simulati per verificare chiamate ai tool + ordine, letture del file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle Skill (usa vs evita, gating, prompt injection).
- Valutazioni live opzionali (opt-in, controllate da env) solo dopo che la suite CI-safe è pronta.

## Test di contratto (forma di plugin e channel)

I test di contratto verificano che ogni plugin e channel registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
asserzioni di forma e comportamento. La lane unitaria predefinita `pnpm test`
salta intenzionalmente questi file shared seam e smoke; esegui i comandi di contratto esplicitamente
quando tocchi superfici condivise di channel o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti channel: `pnpm test:contracts:channels`
- Solo contratti provider: `pnpm test:contracts:plugins`

### Contratti channel

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capacità)
- **setup** - Contratto del wizard di setup
- **session-binding** - Comportamento del binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del channel
- **threading** - Gestione dell’id del thread
- **directory** - API di directory/roster
- **group-policy** - Enforcement della group policy

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del channel
- **registry** - Forma del registro dei plugin

### Contratti provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Rilevamento dei plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di setup

### Quando eseguirli

- Dopo aver modificato export o sottopercorsi del plugin-sdk
- Dopo aver aggiunto o modificato un plugin channel o provider
- Dopo aver refattorizzato registrazione o rilevamento dei plugin

I test di contratto vengono eseguiti in CI e non richiedono API key reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema provider/modello scoperto in live:

- Aggiungi se possibile una regressione CI-safe (provider simulato/finto, oppure acquisisci l’esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test dei modelli diretti
  - bug della pipeline sessione/cronologia/tool del Gateway → Gateway live smoke o test mock del Gateway CI-safe
- Guardrail SecretRef traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec dei segmenti traversal vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
