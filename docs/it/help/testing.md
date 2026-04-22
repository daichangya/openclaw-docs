---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiunta di test di regressione per bug del modello/provider
    - Debug del comportamento del Gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e copertura di ciascun test'
title: Test
x-i18n:
    generated_at: "2026-04-22T04:23:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questa documentazione è una guida “come testiamo”:

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei casi:

- Full gate (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più veloce dell'intera suite su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + strumenti/immagini del gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke del costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che il
  transcript dell'assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un caso che fallisce, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici QA

Questi comandi si affiancano alle suite di test principali quando ti serve il realismo di qa-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull'host gli scenari QA supportati dal repository.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata dal numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia lane seriale.
  - Esce con codice non zero se uno scenario fallisce. Usa `--allow-failures` quando vuoi gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura sperimentale di fixture e mock di protocollo senza sostituire la lane `mock-openai` consapevole dello scenario.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono restare sotto la root del repository così il guest può scrivere indietro tramite il workspace montato.
  - Scrive il normale report + riepilogo QA oltre ai log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa in Docker la build OpenClaw corrente, avvia il Gateway
    con OpenAI configurato, poi abilita Telegram e Discord tramite modifiche alla config.
  - Verifica che il primo riavvio del Gateway installi su richiesta le dipendenze
    runtime di ogni plugin canale bundled, e che un secondo riavvio non reinstalli
    dipendenze già attivate.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il
    doctor post-aggiornamento del candidato ripari le dipendenze runtime dei canali bundled senza una riparazione postinstall dal lato harness.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live di Matrix contro un homeserver Tuwunel temporaneo supportato da Docker.
  - Questo host QA oggi è solo repo/dev. Le installazioni OpenClaw pacchettizzate non includono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repository caricano direttamente il runner bundled; non serve alcun passaggio separato di installazione plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un processo figlio QA gateway con il vero plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l'immagine Tuwunel stabile fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sovrascrivila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi di origine credenziali perché la lane effettua localmente il provisioning di utenti temporanei.
  - Scrive un report QA Matrix, un riepilogo, un artefatto observed-events e un log di output combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live di Telegram contro un vero gruppo privato usando da env i token del bot driver e SUT.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'ID gruppo deve essere l'ID chat Telegram numerico.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa per impostazione predefinita la modalità env, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per scegliere lease condivisi.
  - Esce con codice non zero se uno scenario fallisce. Usa `--allow-failures` quando vuoi gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto observed-messages sotto `.artifacts/qa-e2e/...`.

Le lane di trasporto live condividono un contratto standard così i nuovi trasporti non divergono:

`qa-channel` rimane la suite QA sintetica ampia e non fa parte della matrice di copertura dei trasporti live.

| Lane     | Canary | Filtro delle menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                         | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                       |                  |                           |                      |                      |                       |                             | x            |

### Credenziali Telegram condivise via Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, esegue heartbeat
di quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, altrimenti `maintainer`)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin maintainer (aggiungi/rimuovi/elenca pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` per output leggibile da macchina in script e utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/ripetibile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` deve essere una stringa di ID chat Telegram numerico.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale alla QA

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

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
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti transcript e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o il cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantieni `qa-lab` come proprietario della root condivisa `qa`.
2. Implementa il runner di trasporto sulla seam host condivisa di `qa-lab`.
3. Mantieni la meccanica specifica del trasporto all'interno del plugin runner o dell'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Scrivi o adatta scenari Markdown nelle directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia effettuando una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un solo trasporto di canale, mantienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capacità che può essere usata da più di un canale, aggiungi un helper generico invece di un branch specifico del canale in `suite.ts`.
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

Il nuovo lavoro sui canali dovrebbe usare i nomi degli helper generici.
Gli alias di compatibilità esistono per evitare una migrazione forzata in un solo giorno, non come modello per
la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito e dove)

Pensa alle suite come a un “realismo crescente” (e crescente fragilità/costo):

### Unit / integration (predefinito)

- Comando: `pnpm test`
- Config: dieci esecuzioni shard sequenziali (`vitest.full-*.config.ts`) sui progetti Vitest scoped esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguiti in CI
  - Nessuna chiave reale richiesta
  - Dovrebbero essere veloci e stabili
- Nota sui progetti:
  - `pnpm test` senza target ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico gigantesco processo root-project nativo. Questo riduce il picco di RSS su macchine cariche ed evita che il lavoro auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima file/directory target espliciti attraverso lane scoped, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane scoped quando la diff tocca solo file source/test instradabili; le modifiche a config/setup continuano a usare come fallback la riesecuzione ampia del root-project.
  - `pnpm check:changed` è il normale smart gate locale per lavoro ristretto. Classifica la diff in core, test core, extensions, test extension, app, docs, metadati di release e tooling, poi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche al Plugin SDK pubblico e al contratto del plugin includono la validazione delle extension perché le extension dipendono da quei contratti core. I version bump solo di metadati di release eseguono controlli mirati di versione/config/dipendenze root invece della suite completa, con una guardia che rifiuta modifiche ai package fuori dal campo versione di primo livello.
  - I test unitari leggeri nelle importazioni da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree utility pure simili vengono instradati attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti.
  - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni changed-mode a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro harness più pesante delle risposte lontano dai test economici di stato/chunk/token.
- Nota sul runner embedded:
  - Quando cambi input di discovery dei message-tool o il contesto runtime della Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per confini puri di routing/normalizzazione.
  - Mantieni sane anche le suite di integrazione del runner embedded:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli ID scoped e il comportamento di Compaction continuino a fluire
    attraverso i reali percorsi `run.ts` / `compact.ts`; i test solo helper non sono
    un sostituto sufficiente di questi percorsi di integrazione.
- Nota sul pool:
  - La config base di Vitest ora usa per impostazione predefinita `threads`.
  - La config Vitest condivisa fissa anche `isolate: false` e usa il runner non isolato in root projects, config e2e e live.
  - La lane UI root mantiene il suo setup `jsdom` e l'optimizer, ma ora gira anch'essa sul runner condiviso non isolato.
  - Ogni shard `pnpm test` eredita gli stessi predefiniti `threads` + `isolate: false` dalla config Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se ti serve confrontare con il comportamento V8 stock.
- Nota per iterazione locale veloce:
  - `pnpm changed:lanes` mostra quali lane architetturali attiva una diff.
  - L'hook pre-commit esegue `pnpm check:changed --staged` dopo formattazione/lint degli staged, quindi i commit solo core non pagano il costo dei test extension a meno che non tocchino contratti pubblici rivolti alle extension. I commit solo metadati di release restano sulla lane mirata versione/config/dipendenze root.
  - `pnpm test:changed` instrada attraverso lane scoped quando i percorsi modificati si mappano pulitamente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite di worker più alto.
  - L'auto-scaling locale dei worker ora è intenzionalmente conservativo e arretra anche quando il load average dell'host è già alto, così per impostazione predefinita più esecuzioni Vitest concorrenti causano meno danni.
  - La config base di Vitest marca i file projects/config come `forceRerunTriggers` così le riesecuzioni in changed-mode restano corrette quando cambia il wiring dei test.
  - La config mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il report della durata degli import di Vitest più l'output di breakdown degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati da `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso root-project nativo per quella diff committata e stampa wall time più max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero dirty corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la config root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di startup e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo file disabilitato.

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Predefiniti di runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Esegue in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare output console verboso.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Eseguito in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento dei test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` + exec SSH reali
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI locale `openshell` più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a una CLI non predefinita o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Rileva modifiche nel formato del provider, stranezze nel tool-calling, problemi auth e comportamento con rate limit
- Aspettative:
  - Non stabile in CI per definizione (reti reali, criteri reali dei provider, quote, interruzioni)
  - Costa denaro / usa rate limit
  - Preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano config/materiale auth in una home di test temporanea così i fixture unit non possono modificare il tuo `~/.openclaw` reale.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway / chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle chiavi API (specifica del provider): imposta `*_API_KEYS` con formato virgola/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate provider lunghe mostrano attività visibile anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/gateway scorrono immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/con precondizioni (la suite non installa/esegue/associa l'app).
  - Validazione gateway `node.invoke` comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa + associata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso per cattura concessi per le capacità che ti aspetti passino.
- Override target facoltativi:
  - `OPENCLAW_ANDROID_NODE_ID` oppure `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- Il “modello diretto” ci dice se il provider/modello può rispondere del tutto con la chiave data.
- Lo “smoke del gateway” ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, criterio sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove serve)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire realmente questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sullo smoke del gateway
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l'allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell'allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store dei profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare **solo** lo store dei profili
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline gateway agente è rotta”
  - Contiene piccole regressioni isolate (esempio: reasoning replay OpenAI Responses/Codex Responses + flussi di tool-call)

### Livello 2: smoke del gateway + agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello a ogni esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - un'invocazione reale di strumento funziona (probe di lettura)
    - probe di strumenti extra facoltative (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli delle probe (così puoi spiegare rapidamente i guasti):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di `read` leggerlo e ripetere il nonce.
  - probe `exec+read`: il test chiede all'agente di scrivere tramite `exec` un nonce in un file temporaneo, poi di rileggerlo con `read`.
  - probe immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell'allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider (evitare “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe di strumenti + immagini sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress sugli strumenti)
  - la probe immagine viene eseguita quando il modello pubblicizza il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori consentiti)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli ID esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- I predefiniti di smoke specifici del backend vivono nella definizione `cli-backend.ts` dell'extension proprietaria.
- Abilita:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comando/argomenti/comportamento immagine provengono dai metadati del plugin backend CLI proprietario.
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità nella stessa sessione Claude Sonnet -> Opus (imposta `1` per forzarla quando il modello selezionato supporta un target di switch).

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
- Esegue lo smoke del backend CLI live dentro l'immagine Docker del repository come utente `node` non root.
- Risolve i metadati dello smoke CLI dall'extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile dell'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env della chiave API Anthropic. Questa lane subscription disabilita per impostazione predefinita le probe Claude MCP/tool e immagine perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione extra-usage invece dei normali limiti del piano di abbonamento.
- Lo smoke del backend CLI live ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno di testo, turno di classificazione immagine, poi chiamata allo strumento MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke del bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare in-place una conversazione sintetica del canale messaggi
  - inviare un normale follow-up su quella stessa conversazione
  - verificare che il follow-up arrivi nel transcript della sessione ACP associata
- Abilita:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto conversazione in stile Slack DM
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa lane usa la superficie `chat.send` del gateway con campi admin-only di originating-route sintetico così i test possono allegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del plugin embedded `acpx` per l'agente harness ACP selezionato.

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

Ricette Docker per singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita esegue lo smoke del bind ACP contro tutti gli agenti CLI live supportati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Legge `~/.profile`, prepara nel container il materiale auth CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider provenienti dal profilo letto.

## Live: smoke dell'harness app-server Codex

- Obiettivo: validare l'harness Codex di proprietà del plugin tramite il normale metodo `agent` del gateway:
  - caricare il plugin bundled `codex`
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente del gateway a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread dell'app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso comandi del gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilita: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/strumento facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex rotto non può passare ricadendo silenziosamente su PI.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più `~/.codex/auth.json` e `~/.codex/config.toml` facoltativi copiati

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
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
- Legge il `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile, prepara il source tree, poi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita le probe immagine e MCP/strumento. Imposta `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando ti serve un'esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la config del test live così il fallback `openai-codex/*` o PI non può nascondere una regressione dell'harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più veloci e meno fragili:

- Singolo modello, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, smoke del gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa la Gemini API (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità degli strumenti).
- Gemini API vs Gemini CLI:
  - API: OpenClaw chiama via HTTP la Gemini API ospitata da Google (auth con chiave API / profilo); è questo che la maggior parte degli utenti intende per “Gemini”.
  - CLI: OpenClaw esegue tramite shell un binario locale `gemini`; ha la propria auth e può comportarsi in modo diverso (supporto streaming/strumenti/version skew).

## Live: matrice dei modelli (cosa copriamo)

Non esiste una “lista modelli CI” fissa (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (facoltativo: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui lo smoke del gateway con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile da avere):

- xAI: `xai/grok-4` (oppure l'ultima disponibile)
- Mistral: `mistral/`… (scegli un modello abilitato agli strumenti)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varianti OpenAI con capacità visive, ecc.) per esercitare la probe immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità strumenti+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/config):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualunque proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di codificare “tutti i modelli” nella documentazione. L'elenco autorevole è quello che `discoverModels(...)` restituisce sulla tua macchina + le chiavi disponibili.

## Credenziali (non fare mai commit)

I test live individuano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, fai debug nello stesso modo in cui faresti debug di `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è il significato di “profile keys” nei test live)
- Config: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live preparata quando presente, ma non è lo store principale delle profile-key)
- Le esecuzioni live locali copiano per impostazione predefinita la config attiva, i file `auth-profiles.json` per agente, la directory legacy `credentials/` e le directory auth CLI esterne supportate in una home di test temporanea; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo workspace host reale.

Se vuoi affidarti alle chiavi env (per esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilita: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Abilita: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override modello facoltativo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi bundled comfy image, video e `music_generate`
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche all'invio workflow comfy, polling, download o registrazione plugin

## Live generazione immagini

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica da `~/.profile` della shell di login le variabili env provider mancanti prima della probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue le varianti standard di generazione immagini attraverso la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bundled attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth profile-store e ignorare override solo-env

## Live generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione musicale
  - Attualmente copre Google e MiniMax
  - Carica le variabili env del provider da `~/.profile` della shell di login prima della probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth profile-store e ignorare override solo-env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione video
  - Usa per impostazione predefinita il percorso smoke sicuro per la release: provider non-FAL, una richiesta text-to-video per provider, prompt “lobster” di un secondo e un limite di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` oppure `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica da `~/.profile` della shell di login le variabili env del provider prima della probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità transform dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locali supportati da buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locali supportati da buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché il bundled `veo3` è solo testo e il bundled `kling` richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita un fixture con URL immagine remoto
  - Copertura live attuale `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché l'attuale lane condivisa Gemini/Veo usa input locali supportati da buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale lane condivisa non garantisce accesso org-specific a video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di operazione di ogni provider in una smoke run aggressiva
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth profile-store e ignorare override solo-env

## Harness live per i media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente da `~/.profile` le variabili env provider mancanti
  - Restringe automaticamente ogni suite ai provider che attualmente hanno auth utilizzabile per impostazione predefinita
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e quiet-mode resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli facoltativi “funziona su Linux”)

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il relativo file live a profile-key corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory config locale e il workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano per impostazione predefinita un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due lane Docker live.
- Runner smoke per container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre in bind solo le home auth CLI necessarie (o tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione così l'OAuth delle CLI esterne può aggiornare i token senza modificare lo store auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking del gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge canale MCP (Gateway seeded + bridge stdio + smoke raw di notification-frame Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke install + alias `/plugin` + semantica di restart del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano inoltre il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene
snella l'immagine runtime pur eseguendo comunque Vitest sul tuo source/config locale esatto.
Il passaggio di staging salta grandi cache solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output locali delle app `.build` o
Gradle così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura
live del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, esegue il login tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l'immagine
Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa lane si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway seeded,
avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica rilevamento della conversazione instradata, letture del transcript, metadati degli allegati,
comportamento della coda eventi live, instradamento dell'invio in uscita e notifiche in stile Claude di canale +
permessi tramite il vero bridge stdio MCP. Il controllo delle notifiche
ispeziona direttamente i frame raw stdio MCP così lo smoke valida ciò che il
bridge emette realmente, non solo ciò che un particolare SDK client espone.

Smoke manuale plain-language dei thread ACP (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env lette da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e senza mount auth CLI esterni
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file auth CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni provider ristrette montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dal profile store (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Verifica rapida della documentazione

Esegui i controlli doc dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni in-page: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni di “pipeline reale” senza provider reali:

- Tool calling del gateway (mock OpenAI, vero gateway + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del gateway (WS `wizard.start`/`wizard.next`, scrittura config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock tool-calling tramite il vero gateway + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti della config (`src/gateway/gateway.test.ts`).

Quello che ancora manca per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, riporto della cronologia della sessione e confini della sandbox.

Le future valutazioni dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare tool call + ordine, letture dei file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle Skills (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, gated da env) solo dopo che la suite sicura per CI è in posto.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di verifiche di forma e comportamento. La lane unitaria predefinita `pnpm test` salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente i comandi dei contratti quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti canale: `pnpm test:contracts:channels`
- Solo contratti provider: `pnpm test:contracts:plugins`

### Contratti canale

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capacità)
- **setup** - Contratto del setup wizard
- **session-binding** - Comportamento del binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'ID del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione del criterio dei gruppi

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro plugin

### Contratti provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Rilevamento del plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Setup wizard

### Quando eseguirli

- Dopo aver cambiato export o subpath del plugin-sdk
- Dopo aver aggiunto o modificato un plugin canale o provider
- Dopo aver rifattorizzato la registrazione o il rilevamento dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema provider/modello scoperto nei live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, criteri auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci colpire il livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test dei modelli diretti
  - bug della pipeline gateway sessione/cronologia/strumenti → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campione per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli ID exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli ID target non classificati così le nuove classi non possono essere saltate silenziosamente.
