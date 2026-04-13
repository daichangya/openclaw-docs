---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere test di regressione per bug di modello/provider
    - Debuggare il comportamento di Gateway + agent
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testare
x-i18n:
    generated_at: "2026-04-13T08:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3db91b4bc36f626cd014958ec66b08b9cecd9faaa20a5746cd3a49ad4b0b1c38
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unità/integrazione, e2e, live) e un piccolo insieme di runner Docker.

Questa documentazione è una guida a “come testiamo”:

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro più comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modello/provider

## Avvio rapido

Nella maggior parte dei casi:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm test`
- Esecuzione locale più rapida dell’intera suite su una macchina capiente: `pnpm test:max`
- Loop diretto di Vitest in watch: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA con backend Docker: `pnpm qa:lab:up`
- Corsia QA con backend Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando modifichi i test o vuoi più sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui debug di provider/modelli reali (richiede credenziali reali):

- Suite live (sonde per modelli + strumenti/immagini del gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Suggerimento: quando ti serve solo un singolo caso in errore, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi si affiancano alle suite di test principali quando ti serve il realismo di QA-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull’host gli scenari QA basati sul repository.
  - Per impostazione predefinita esegue in parallelo più scenari selezionati con worker gateway isolati, fino a 64 worker o al numero di scenari selezionati. Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia corsia seriale.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso della configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono restare sotto la root del repository, così il guest può scrivere indietro tramite il workspace montato.
  - Scrive il normale report + riepilogo QA, oltre ai log Multipass, sotto `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA con backend Docker per il lavoro QA in stile operatore.
- `pnpm openclaw qa matrix`
  - Esegue la corsia QA live Matrix contro un homeserver Tuwunel temporaneo con backend Docker.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un processo figlio del gateway QA con il vero Plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l’immagine Tuwunel stable fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sostituiscila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un’immagine diversa.
  - Matrix al momento supporta solo `--credential-source env` perché la corsia esegue il provisioning locale di utenti temporanei.
  - Scrive sotto `.artifacts/qa-e2e/...` un report QA Matrix, un riepilogo e un artifact degli eventi osservati.
- `pnpm openclaw qa telegram`
  - Esegue la corsia QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id del gruppo deve essere l’id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per usare lease condivisi.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un’osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive sotto `.artifacts/qa-e2e/...` un report QA Telegram, un riepilogo e un artifact dei messaggi osservati.

Le corsie di trasporto live condividono un contratto standard, così i nuovi trasporti non divergono:

`qa-channel` resta la suite QA sintetica ampia e non fa parte della matrice di copertura dei trasporti live.

| Corsia   | Canary | Gating per mention | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione reazioni | Comando help |
| -------- | ------ | ------------------ | ---------------- | ------------------------- | -------------------- | ------------------- | --------------------- | --------------------- | ------------ |
| Matrix   | x      | x                  | x                | x                         | x                    | x                   | x                     | x                     |              |
| Telegram | x      |                    |                  |                          |                      |                     |                       |                       | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool basato su Convex, invia heartbeat
su quel lease mentre la corsia è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env obbligatorie:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `maintainer`)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di tracciamento facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` in loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin per maintainer (aggiunta/rimozione/elenco del pool) richiedono
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
  - Esaurito/ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` deve essere una stringa dell’id numerico della chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere un runner QA specifico per canale quando il runner condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce le meccaniche condivise:

- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` meno recenti

L’adattatore di canale gestisce il contratto di trasporto:

- come viene configurato il gateway per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come sono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Implementare l’adattatore di trasporto sulla seam condivisa `qa-lab`.
2. Registrare l’adattatore nel registro dei trasporti.
3. Mantenere le meccaniche specifiche del trasporto dentro l’adattatore o nell’harness del canale.
4. Creare o adattare scenari markdown sotto `qa/scenarios/`.
5. Usare gli helper generici degli scenari per i nuovi scenari.
6. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia eseguendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, tienilo in quell’adattatore o harness del Plugin.
- Se uno scenario richiede una nuova capacità che può essere usata da più di un canale, aggiungi un helper generico invece di un branch specifico per canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico per quel trasporto e rendilo esplicito nel contratto dello scenario.

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
Gli alias di compatibilità esistono per evitare una migrazione in un solo giorno, non come modello per
la creazione di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e costi/instabilità crescenti):

### Unità / integrazione (predefinita)

- Comando: `pnpm test`
- Configurazione: dieci esecuzioni sequenziali a shard (`vitest.full-*.config.ts`) sui progetti Vitest scoped esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth del gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` senza target ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo native root-project. Questo riduce il picco RSS su macchine sotto carico ed evita che il lavoro di auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo di progetti nativo root `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti file/directory attraverso corsie scoped, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse corsie scoped quando la diff tocca solo file sorgente/test instradabili; le modifiche a config/setup tornano comunque alla riesecuzione ampia del progetto root.
  - I test unitari leggeri sulle importazioni da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree di utility pure simili vengono instradati tramite la corsia `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle corsie esistenti.
  - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test sibling espliciti in quelle corsie leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro dell’harness reply più pesante fuori dai test economici di status/chunk/token.
- Nota sull’embedded runner:
  - Quando modifichi gli input di discovery dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per i boundary puri di routing/normalizzazione.
  - Mantieni sane anche le suite di integrazione dell’embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id scoped e il comportamento di Compaction continuino a passare
    attraverso i veri percorsi `run.ts` / `compact.ts`; i test solo helper non sono un
    sostituto sufficiente di questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa `threads` come predefinito.
  - La configurazione Vitest condivisa imposta anche `isolate: false` e usa il runner non isolato per i progetti root, e2e e live.
  - La corsia UI root mantiene la sua configurazione `jsdom` e optimizer, ma ora gira anch’essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontarti con il comportamento V8 standard.
- Nota sull’iterazione locale veloce:
  - `pnpm test:changed` instrada tramite corsie scoped quando i percorsi modificati mappano chiaramente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite di worker più alto.
  - L’auto-scaling locale dei worker è ora intenzionalmente conservativo e riduce anche quando il load average dell’host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
  - La configurazione base di Vitest marca i file project/config come `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi un’unica posizione cache esplicita per il profiling diretto.
- Nota sul debug prestazionale:
  - `pnpm test:perf:imports` abilita il reporting della durata di importazione di Vitest più l’output di breakdown delle importazioni.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso nativo root-project per quella diff committed e stampa wall time più RSS massimo su macOS.
- `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark dell’albero dirty corrente instradando l’elenco dei file modificati tramite `scripts/test-projects.mjs` e la configurazione root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l’overhead di startup e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo file disabilitato.

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Per impostazione predefinita viene eseguito in modalità silenziosa per ridurre l’overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare output console verboso.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Ha più parti in movimento dei test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull’host tramite Docker
  - Crea una sandbox a partire da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` + exec SSH reali
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale e un daemon Docker funzionante
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
  - Intercetta cambiamenti di formato del provider, peculiarità delle chiamate agli strumenti, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live eseguono il source di `~/.profile` per recuperare API key mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di config/auth in una home di test temporanea, così i fixture unit non possono modificare il tuo `~/.openclaw` reale.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway e il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle API key (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr, così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione console di Vitest, così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Se modifichi logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Se tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se stai facendo debug di “il mio bot è giù” / errori specifici del provider / chiamata agli strumenti: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/precondizionato (la suite non installa/esegue/abbina l’app).
  - Validazione `node.invoke` del gateway comando per comando per il Node Android selezionato.
- Pre-setup obbligatorio:
  - App Android già connessa e paired al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti passino.
- Override facoltativi del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Direct model” ci dice se il provider/modello riesce almeno a rispondere con la chiave fornita.
- “Gateway smoke” ci dice se l’intera pipeline gateway+agent funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento direct model (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli individuati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l’allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell’allowlist modern
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep modern esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store profilo e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store profilo
- Perché esiste:
  - Separa “l’API del provider è rotta / la chiave non è valida” da “la pipeline dell’agent del gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: flussi di replay del ragionamento e tool-call OpenAI Responses/Codex Responses)

### Livello 2: smoke Gateway + dev agent (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - che una vera invocazione di strumento funzioni (sonda `read`)
    - sonde strumento extra facoltative (sonda `exec+read`)
    - che i percorsi di regressione OpenAI (solo tool-call → follow-up) continuino a funzionare
- Dettagli delle sonde (così puoi spiegare rapidamente i guasti):
  - sonda `read`: il test scrive un file nonce nel workspace e chiede all’agent di `read` leggerlo e restituire il nonce.
  - sonda `exec+read`: il test chiede all’agent di scrivere tramite `exec` un nonce in un file temporaneo, poi di `read` leggerlo di nuovo.
  - sonda immagine: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell’allowlist modern
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o un elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep modern esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le sonde di strumenti + immagine sono sempre attive in questo test live:
  - sonda `read` + sonda `exec+read` (stress degli strumenti)
  - la sonda immagine viene eseguita quando il modello dichiara supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’embedded agent inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi piccoli errori)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli id esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agent usando un backend CLI locale, senza toccare la configurazione predefinita.
- I predefiniti smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell’extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagine proviene dai metadati del Plugin backend CLI proprietario.
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la sonda predefinita di continuità della stessa sessione Claude Sonnet -> Opus (impostala a `1` per forzarla quando il modello selezionato supporta una destinazione di switch).

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
- Esegue lo smoke live del backend CLI dentro l’immagine Docker del repository come utente `node` non root.
- Risolve i metadati smoke CLI dall’extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` oppure `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile per l’abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Per prima cosa verifica `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env della API key Anthropic. Questa corsia subscription disabilita per impostazione predefinita le sonde Claude MCP/tool e immagine perché Claude attualmente instrada l’uso di applicazioni di terze parti tramite fatturazione extra-usage invece che tramite i normali limiti del piano subscription.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi chiamata allo strumento MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude inoltre modifica la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke di bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso di conversation-bind ACP con un agent ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare in-place una conversazione sintetica di message-channel
  - inviare un normale follow-up su quella stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predefiniti:
  - Agent ACP in Docker: `claude,codex,gemini`
  - Agent ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa corsia usa la superficie `chat.send` del gateway con campi sintetici di originating-route solo admin, così i test possono collegare il contesto del message-channel senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agent integrato del Plugin `acpx` incorporato per l’agent harness ACP selezionato.

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
- Per impostazione predefinita esegue in sequenza lo smoke ACP bind contro tutti gli agent CLI live supportati: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Esegue il source di `~/.profile`, mette in staging nel container il materiale di auth CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` oppure `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così `acpx` mantiene disponibili alla CLI harness figlia le variabili env del provider dal profilo sorgente.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex di proprietà del Plugin tramite il normale
  metodo `agent` del gateway:
  - caricare il Plugin `codex` incorporato
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno gateway agent a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread
    app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando
    del gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Sonda immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex
  rotto non può risultare verde ricadendo silenziosamente su PI.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più eventuali
  `~/.codex/auth.json` e `~/.codex/config.toml` copiati

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
- Esegue il source del `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth
  della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm
  montato e scrivibile, mette in staging l’albero dei sorgenti, poi esegue solo il test live dell’harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine e MCP/tool. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando ti serve un’esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la
  configurazione del test live, così `openai-codex/*` o il fallback PI non possono nascondere una regressione dell’harness Codex.

### Ricette live consigliate

Le allowlist ristrette ed esplicite sono le più veloci e le meno soggette a instabilità:

- Modello singolo, direct (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l’API Gemini (API key).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agent in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama via HTTP l’API Gemini ospitata da Google (API key / auth del profilo); è questo che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario locale `gemini`; ha una propria auth e può comportarsi diversamente (streaming/supporto strumenti/disallineamento di versione).

## Live: matrice dei modelli (cosa copriamo)

Non esiste un “elenco modelli CI” fisso (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (facoltativo: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui il gateway smoke con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per ogni famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile averla):

- xAI: `xai/grok-4` (oppure l’ultima disponibile)
- Mistral: `mistral/`… (scegli un modello con capacità “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varianti OpenAI con supporto vision, ecc.) per esercitare la sonda immagine.

### Aggregatori / gateway alternativi

Se hai le chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/config):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non provare a hardcodare “tutti i modelli” nella documentazione. L’elenco autorevole è qualunque cosa `discoverModels(...)` restituisca sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (non fare mai commit)

I test live scoprono le credenziali nello stesso modo in cui lo fa la CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, fai debug nello stesso modo in cui faresti per `openclaw models list` / selezione del modello.

- Profili auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che nei test live significa “chiavi profilo”)
- Config: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory state legacy: `~/.openclaw/credentials/` (copiata nella home live staged quando presente, ma non è lo store principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la config attiva, i file `auth-profiles.json` per agent, la directory legacy `credentials/` e le directory auth CLI esterne supportate in una home di test temporanea; le home live staged saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le sonde restano fuori dal tuo workspace host reale.

Se vuoi affidarti alle chiavi env (per esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi immagine, video e `music_generate` del comfy incorporato
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche all’invio di workflow comfy, polling, download o registrazione del Plugin

## Live generazione di immagini

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni Plugin provider di generazione immagini registrato
  - Carica da `~/.profile` le variabili env mancanti del provider prima delle sonde
  - Usa per impostazione predefinita API key live/env prima dei profili auth memorizzati, così chiavi di test stale in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue le varianti standard di generazione immagini tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider incorporati attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth da store profilo e ignorare override solo env

## Live generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso del provider di generazione musicale incorporato
  - Attualmente copre Google e MiniMax
  - Carica da `~/.profile` le variabili env del provider prima delle sonde
  - Usa per impostazione predefinita API key live/env prima dei profili auth memorizzati, così chiavi di test stale in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della corsia condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questa sweep condivisa
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth da store profilo e ignorare override solo env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso del provider di generazione video incorporato
  - Carica da `~/.profile` le variabili env del provider prima delle sonde
  - Usa per impostazione predefinita API key live/env prima dei profili auth memorizzati, così chiavi di test stale in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nella sweep condivisa
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nella sweep condivisa
  - Provider `imageToVideo` attualmente dichiarati ma saltati nella sweep condivisa:
    - `vydra` perché il `veo3` incorporato è solo testo e il `kling` incorporato richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una corsia `kling` che usa per impostazione predefinita un fixture con URL immagine remoto
  - Copertura live `videoToVideo` attuale:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nella sweep condivisa:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l’attuale corsia condivisa Gemini/Veo usa input locale basato su buffer e quel percorso non è accettato nella sweep condivisa
    - `openai` perché l’attuale corsia condivisa non garantisce l’accesso specifico per organizzazione a video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth da store profilo e ignorare override solo env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente da `~/.profile` le variabili env mancanti del provider
  - Restringe automaticamente per impostazione predefinita ogni suite ai provider che al momento hanno auth utilizzabile
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (verifiche facoltative “funziona su Linux”)

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiavi profilo dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione locale e il workspace (ed eseguendo il source di `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo così una sweep Docker completa resta pratica:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sostituisci queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una sola volta l’immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due corsie Docker live.
- Runner smoke del container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre in bind solo le home auth CLI necessarie (oppure tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione così OAuth della CLI esterna può aggiornare i token senza modificare lo store auth dell’host:

- Modelli direct: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking del gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge canale MCP (Gateway seeded + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke install + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano inoltre in bind il checkout corrente in sola lettura e
lo mettono in staging in una workdir temporanea dentro il container. Questo mantiene l’immagine runtime
snella pur eseguendo Vitest sul tuo esatto sorgente/config locale.
Il passaggio di staging salta grandi cache solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` o
Gradle locali dell’app, così le esecuzioni live Docker non spendono minuti a copiare
artifact specifici della macchina.
Impostano inoltre `OPENCLAW_SKIP_CHANNELS=1` così le sonde live del gateway non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi fai passare anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live del gateway
da quella corsia Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, esegue il sign-in tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l’immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa corsia richiede una chiave di modello live utilizzabile e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
seeded, avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica discovery della conversazione instradata, letture della trascrizione, metadati degli allegati,
comportamento della coda eventi live, instradamento dell’invio outbound e notifiche in stile Claude di canale +
permessi sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio raw così lo smoke valida ciò che il
bridge emette realmente, non solo ciò che un determinato SDK client espone in superficie.

Smoke manuale ACP plain-language thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione del routing thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata in `/home/node/.profile` ed eseguito il source prima di avviare i test
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file auth CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell’avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni provider ristrette montano solo directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l’esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un’immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dallo store profilo (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag immagine Open WebUI fissato

## Integrità della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling del gateway (mock OpenAI, loop reale gateway + agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del gateway (WS `wizard.start`/`wizard.next`, scrittura config + auth obbligata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell’agent (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell’agent”:

- Mock del tool-calling tramite il vero loop gateway + agent (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando Skills sono elencate nel prompt, l’agent sceglie la skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l’agent legge `SKILL.md` prima dell’uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, riporto della cronologia di sessione e boundary della sandbox.

Le valutazioni future dovrebbero restare deterministiche prima di tutto:

- Un runner di scenari che usi provider mock per verificare chiamate agli strumenti + ordine, letture dei file skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, protette da env) solo dopo che la suite sicura per CI è disponibile.

## Test di contratto (forma di Plugin e channel)

I test di contratto verificano che ogni Plugin e channel registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
verifiche su forma e comportamento. La corsia unitaria predefinita `pnpm test`
salta intenzionalmente questi file shared seam e smoke; esegui esplicitamente
i comandi di contratto quando tocchi superfici condivise di channel o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti channel: `pnpm test:contracts:channels`
- Solo contratti provider: `pnpm test:contracts:plugins`

### Contratti channel

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del Plugin (id, nome, capacità)
- **setup** - Contratto del wizard di setup
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi inbound
- **actions** - Handler delle azioni del channel
- **threading** - Gestione dell’id del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sonde di stato del channel
- **registry** - Forma del registro dei Plugin

### Contratti provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Discovery del Plugin
- **loader** - Caricamento del Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Wizard di setup

### Quando eseguirli

- Dopo aver modificato export o subpath di `plugin-sdk`
- Dopo aver aggiunto o modificato un Plugin channel o provider
- Dopo aver rifattorizzato registrazione o discovery dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono API key reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi, se possibile, una regressione sicura per CI (provider mock/stub, oppure cattura l’esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al layer più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test direct models
  - bug della pipeline session/history/tool del gateway → gateway live smoke o test mock gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campione per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
