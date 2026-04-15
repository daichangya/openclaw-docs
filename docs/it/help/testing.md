---
read_when:
    - Eseguire i test localmente o in CI
    - Aggiungere regressioni per bug di modello/provider
    - Debug del comportamento di Gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-04-15T08:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf647a5cf13b5861a3ba0cb367dc816c57f0e9c60d3cd6320da193bfadf5609
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questo documento è una guida su “come testiamo”:

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

La maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm test`
- Esecuzione locale più rapida dell’intera suite su una macchina capiente: `pnpm test:max`
- Loop di watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Quando stai iterando su un singolo errore, preferisci prima esecuzioni mirate.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi più sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di tool/immagini Gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Suggerimento: quando ti serve solo un caso che fallisce, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi si affiancano alle suite di test principali quando ti serve il realismo di qa-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull’host gli scenari QA supportati dal repository.
  - Per impostazione predefinita esegue in parallelo più scenari selezionati con worker Gateway isolati, fino a 64 worker o al numero di scenari selezionati. Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia lane seriale.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono restare sotto la root del repository in modo che il guest possa scrivere di nuovo tramite il workspace montato.
  - Scrive il normale report + riepilogo QA e i log Multipass sotto `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per attività QA in stile operatore.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo per repo/dev. Le installazioni OpenClaw pacchettizzate non includono `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repository caricano direttamente il runner incluso; non è necessario alcun passaggio separato di installazione del plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un processo figlio QA gateway con il vero plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l’immagine Tuwunel stabile fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sostituiscila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un’immagine diversa.
  - Matrix non espone flag condivisi per la fonte delle credenziali perché la lane effettua localmente il provisioning di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo e un artifact observed-events sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT dall’env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id del gruppo deve essere l’id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa per impostazione predefinita la modalità env, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per attivare i lease condivisi.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un username Telegram.
  - Per un’osservazione stabile bot-to-bot, abilita la modalità Bot-to-Bot Communication in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact observed-messages sotto `.artifacts/qa-e2e/...`.

Le lane live di trasporto condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta la suite QA sintetica ampia e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Mention gating | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | -------------- | ---------------- | ------------------------- | -------------------- | ------------------- | -------------------- | --------------------------- | ------------ |
| Matrix   | x      | x              | x                | x                         | x                    | x                   | x                    | x                           |              |
| Telegram | x      |                |                  |                           |                      |                     |                      |                             | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat di quel lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `maintainer`)

Variabili env opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di tracciamento opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` in loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin del maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

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
- `groupId` deve essere una stringa con l’id numerico della chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l’host condiviso `qa-lab` può gestire il flusso.

`qa-lab` possiede la meccanica condivisa dell’host:

- la root di comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come sono esposti transcript e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere la meccanica specifica del trasporto dentro il plugin runner o l’harness del plugin.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; l’esecuzione lazy di CLI e runner dovrebbe restare dietro entrypoint separati.
5. Scrivere o adattare scenari markdown sotto `qa/scenarios/`.
6. Usare gli helper di scenario generici per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia facendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, mantienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capability che più di un canale può usare, aggiungi un helper generico invece di un branch specifico del canale in `suite.ts`.
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
Gli alias di compatibilità esistono per evitare una migrazione “flag day”, non come modello per la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a un “realismo crescente” (e flakiness/costo crescente):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: dieci esecuzioni sequenziali di shard (`vitest.full-*.config.ts`) sui project Vitest scoped esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unit puri
  - Test di integrazione in-process (auth gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Dovrebbe essere veloce e stabile
- Nota sui project:
  - `pnpm test` senza target ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo native root-project. Questo riduce il picco RSS su macchine sotto carico ed evita che il lavoro di auto-reply/extension sottragga risorse a suite non correlate.
  - `pnpm test --watch` usa ancora il grafo dei project del root nativo `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane scoped, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita il costo di avvio dell’intero root project.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane scoped quando il diff tocca solo file source/test instradabili; le modifiche a config/setup tornano comunque alla riesecuzione ampia del root project.
  - I test unit leggeri in termini di import da agents, commands, plugins, helper auto-reply, `plugin-sdk` e aree utility pure simili vengono instradati tramite la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/pesanti a runtime restano sulle lane esistenti.
  - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro dell’harness reply più pesante fuori dai test economici di status/chunk/token.
- Nota sul runner embedded:
  - Quando modifichi gli input di discovery dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per i boundary puri di routing/normalizzazione.
  - Mantieni anche in salute le suite di integrazione dell’embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id scoped e il comportamento di Compaction continuino a fluire
    attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo helper non sono un
    sostituto sufficiente di questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione Vitest di base ora usa `threads` per impostazione predefinita.
  - La configurazione Vitest condivisa fissa anche `isolate: false` e usa il runner non isolato tra root project, config e2e e live.
  - La lane UI root mantiene la sua configurazione `jsdom` e l’optimizer, ma ora gira anch’essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontare il comportamento con quello standard di V8.
- Nota sull’iterazione locale rapida:
  - `pnpm test:changed` instrada attraverso lane scoped quando i percorsi modificati mappano in modo pulito a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite di worker più alto.
  - L’auto-scaling locale dei worker ora è intenzionalmente più conservativo e arretra anche quando il load average dell’host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
  - La configurazione Vitest di base contrassegna i project/file di configurazione come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una singola posizione di cache esplicita per il profiling diretto.
- Nota di debug prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import in Vitest più l’output del dettaglio degli import.
  - `pnpm test:perf:imports:changed` applica la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso root-project nativo per quel diff committato e stampa wall time più il max RSS su macOS.
- `pnpm test:perf:changed:bench -- --worktree` misura il tree sporco corrente instradando l’elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per overhead di startup e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con il parallelismo sui file disabilitato.

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valori predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Per impostazione predefinita gira in modalità silenziosa per ridurre l’overhead di I/O sulla console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare l’output verboso sulla console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Ha più parti mobili rispetto ai test unit (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull’host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + esecuzione SSH
  - Verifica il comportamento del filesystem remote-canonical tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercettare cambi di formato del provider, particolarità del tool-calling, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale config/auth in una home di test temporanea così i fixture unit non possono mutare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso aggiuntivo su `~/.profile` e silenzia i log di bootstrap del gateway e il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione della console di Vitest così le righe di avanzamento di provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capability del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Setup manuale/con precondizioni (la suite non installa/esegue/abbina l’app).
  - Validazione `node.invoke` del gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa e abbinata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capability che ti aspetti superino il test.
- Override target opzionali:
  - `OPENCLAW_ANDROID_NODE_ID` oppure `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi sulla configurazione Android: [Android App](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Direct model” ci dice se il provider/modello può rispondere in assoluto con la chiave fornita.
- “Gateway smoke” ci dice se l’intera pipeline gateway+agent funziona per quel modello (sessioni, cronologia, tool, policy della sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli individuati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sullo smoke del gateway
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l’allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per l’allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un cap curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un cap più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store dei profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store dei profili
- Perché esiste:
  - Separa “l’API del provider è rotta / la chiave non è valida” da “la pipeline dell’agent del gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del ragionamento OpenAI Responses/Codex Responses + flussi di tool-call)

### Livello 2: smoke del gateway + dev agent (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta “significativa” (senza tool)
    - il funzionamento di una vera invocazione di tool (probe di lettura)
    - probe di tool extra opzionali (probe exec+read)
    - il mantenimento del funzionamento dei percorsi di regressione OpenAI (solo tool-call → follow-up)
- Dettagli delle probe (così puoi spiegare rapidamente i guasti):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all’agente di eseguire `read` su quel file e rimandare il nonce.
  - probe `exec+read`: il test chiede all’agente di scrivere via `exec` un nonce in un file temporaneo e poi di leggerlo di nuovo con `read`.
  - probe immagine: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per l’allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o un elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un cap curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un cap più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe di tool + immagine sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress sui tool)
  - la probe immagine viene eseguita quando il modello dichiara il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi piccoli errori)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli id esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- I valori predefiniti smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell’extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagini proviene dai metadati del plugin proprietario del backend CLI.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità nella stessa sessione Claude Sonnet -> Opus (impostalo a `1` per forzarla quando il modello selezionato supporta una destinazione di switch).

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
- Esegue lo smoke live del backend CLI dentro l’immagine Docker del repository come utente non root `node`.
- Risolve i metadati smoke della CLI dall’extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache su `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile di sottoscrizione Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env delle chiavi API Anthropic. Questa lane subscription disabilita per impostazione predefinita le probe Claude MCP/tool e immagine perché Claude attualmente instrada l’uso di app di terze parti tramite fatturazione per uso extra invece che tramite i normali limiti del piano di sottoscrizione.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno di testo, turno di classificazione immagine, poi chiamata del tool MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke del bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso di conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - collegare in loco una conversazione sintetica su canale di messaggistica
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nel transcript della sessione ACP collegata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa lane usa la superficie `chat.send` del gateway con campi synthetic originating-route solo admin così i test possono collegare il contesto del canale di messaggistica senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agent incorporato del plugin embedded `acpx` per l’agente harness ACP selezionato.

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
- Per impostazione predefinita, esegue in sequenza lo smoke ACP bind contro tutti gli agenti CLI live supportati: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Legge `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider provenienti dal profilo caricato.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex posseduto dal plugin tramite il normale
  metodo `agent` del gateway:
  - caricare il plugin `codex` incluso
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agent del gateway a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread
    app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso
    di comando del gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex
  rotto non può superare il test ricadendo silenziosamente su PI.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più eventuali file copiati
  `~/.codex/auth.json` e `~/.codex/config.toml`

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
- Legge il `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth della CLI Codex
  quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile,
  prepara il source tree, poi esegue solo il test live dell’harness Codex.
- Docker abilita per impostazione predefinita le probe immagine e MCP/tool. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando hai bisogno di un’esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la configurazione
  del test live così il fallback `openai-codex/*` o PI non può nascondere una regressione
  dell’harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più rapide e meno soggette a flakiness:

- Modello singolo, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, smoke del gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su diversi provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l’API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agent in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità del tooling).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l’API Gemini ospitata da Google tramite HTTP (auth con chiave API / profilo); è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario `gemini` locale; ha una propria auth e può comportarsi in modo diverso (streaming/supporto tool/version skew).

## Live: matrice dei modelli (cosa copriamo)

Non esiste un elenco fisso di “modelli CI” (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (opzionale: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui lo smoke del gateway con tool + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opzionale)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva opzionale (utile averla):

- xAI: `xai/grok-4` (oppure l’ultima disponibile)
- Mistral: `mistral/`… (scegli un modello con capability “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capability immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con supporto vision, ecc.) per esercitare la probe immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capability tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Inclusi: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di hardcodare “tutti i modelli” nella documentazione. L’elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (non fare mai commit)

I test live individuano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, esegui il debug come faresti con `openclaw models list` / selezione del modello.

- Profili auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è il significato di “chiavi profilo” nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live staged quando presente, ma non è lo store principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agent, `credentials/` legacy e le directory auth supportate delle CLI esterne in una home di test temporanea; le home live staged saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo vero workspace host.

Se vuoi basarti su chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override modello opzionale: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media del workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi inclusi comfy per immagini, video e `music_generate`
  - Salta ogni capability a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione del plugin

## Live generazione immagini

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le variabili env provider mancanti dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue le varianti standard di generazione immagini tramite la capability runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider inclusi attualmente coperti:
  - `openai`
  - `google`
- Restrizione opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l’auth dello store profili e ignorare gli override solo env

## Live generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso incluso dei provider di generazione musicale
  - Attualmente copre Google e MiniMax
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l’auth dello store profili e ignorare gli override solo env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso incluso dei provider di generazione video
  - Per impostazione predefinita usa il percorso smoke sicuro per release: provider non-FAL, una richiesta text-to-video per provider, prompt lobster di un secondo e un cap per-provider sulle operazioni da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Per impostazione predefinita salta FAL perché la latenza della coda lato provider può dominare il tempo della release; passa `--video-providers fal` oppure `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Per impostazione predefinita esegue solo `generate`
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità transform dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale supportato da buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale supportato da buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` incluso è solo testo e `kling` incluso richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita un fixture con URL immagine remoto
  - Copertura live attuale `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l’attuale lane condivisa Gemini/Veo usa input locale supportato da buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l’attuale lane condivisa non garantisce l’accesso specifico dell’organizzazione a video inpaint/remix
- Restrizione opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il cap operativo di ogni provider in uno smoke run aggressivo
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l’auth dello store profili e ignorare gli override solo env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente le variabili env provider mancanti da `~/.profile`
  - Per impostazione predefinita restringe automaticamente ogni suite ai provider che attualmente hanno auth utilizzabile
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli opzionali “funziona su Linux”)

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live a chiavi profilo dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e il workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un cap smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sostituisci queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l’immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due lane Docker live.
- Runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre solo le home auth CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione così l’OAuth delle CLI esterne può aggiornare i token senza modificare lo store auth dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking del gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge di canale MCP (Gateway seeded + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano inoltre il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l’immagine
runtime pur eseguendo comunque Vitest sul tuo esatto source/config locale.
Il passaggio di staging salta grandi cache solo locali e output di build dell’app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` o
Gradle locali all’app, così le esecuzioni live Docker non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura
live del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato verso quel gateway, esegue il sign-in tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l’immagine
Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa lane si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
seeded, avvia un secondo container che esegue `openclaw mcp serve`, quindi
verifica discovery delle conversazioni instradate, letture dei transcript, metadati degli allegati,
comportamento della coda di eventi live, instradamento dell’invio outbound e notifiche di canale +
permesso in stile Claude tramite il vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi così lo smoke valida ciò che il
bridge emette davvero, non solo ciò che un particolare SDK client rende visibile.

Smoke manuale ACP del thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file auth CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell’avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l’esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un’immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una nuova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dallo store dei profili (non dall’env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag dell’immagine Open WebUI fissata

## Controllo di integrità della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli sugli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling del gateway (mock OpenAI, vero gateway + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del gateway (WS `wizard.start`/`wizard.next`, scrive config + auth enforced): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell’agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell’agente”:

- Mock tool-calling attraverso il vero gateway + loop agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti di configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l’agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l’agente legge `SKILL.md` prima dell’uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turn che verificano ordine dei tool, persistenza della cronologia di sessione e boundary della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate dei tool + ordine, letture dei file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle Skill (usare vs evitare, gating, prompt injection).
- Valutazioni live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è in funzione.

## Test di contratto (forma di plugin e canale)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
asserzioni su forma e comportamento. La lane unit predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui i comandi di contratto esplicitamente
quando tocchi superfici condivise di canale o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma di base del plugin (id, nome, capability)
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi inbound
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli ID thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registry del plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo dei modelli
- **discovery** - Discovery del plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di configurazione

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un plugin canale o provider
- Dopo aver refattorizzato la registrazione o la discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando risolvi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub oppure acquisisci l’esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci mirare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug della pipeline di sessione/cronologia/tool del gateway → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registry (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec dei segmenti di attraversamento siano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
