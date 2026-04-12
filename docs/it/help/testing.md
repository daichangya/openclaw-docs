---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere test di regressione per bug del modello/provider
    - Eseguire il debug del comportamento di Gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-04-12T23:28:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a66ea672c386094ab4a8035a082c8a85d508a14301ad44b628d2a10d9cec3a52
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questo documento è una guida a “come testiamo”:

- Cosa copre ciascuna suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live rilevano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (previsto prima del push): `pnpm build && pnpm check && pnpm test`
- Esecuzione locale più veloce dell’intera suite su una macchina capiente: `pnpm test:max`
- Ciclo di watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di estensioni/canali: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Quando stai iterando su un singolo errore, preferisci prima esecuzioni mirate.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe di strumenti/immagini del Gateway): `pnpm test:live`
- Punta in modo silenzioso a un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Suggerimento: quando ti serve solo un singolo caso che fallisce, preferisci restringere i test live tramite le variabili d’ambiente allowlist descritte di seguito.

## Runner specifici per QA

Questi comandi si affiancano alle principali suite di test quando hai bisogno del realismo di QA-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull’host gli scenari QA supportati dal repository.
  - Per impostazione predefinita esegue in parallelo più scenari selezionati con worker Gateway isolati, fino a 64 worker o al numero di scenari selezionati. Usa `--concurrency <count>` per regolare il numero di worker, oppure `--concurrency 1` per la vecchia corsia seriale.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA all’interno di una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per la VM guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono rimanere sotto la root del repository affinché il guest possa scriverle tramite l’area di lavoro montata.
  - Scrive il normale report + riepilogo QA, oltre ai log Multipass, sotto `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per attività QA in stile operatore.
- `pnpm openclaw qa matrix`
  - Esegue la corsia QA live di Matrix contro un homeserver Tuwunel temporaneo supportato da Docker.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, quindi avvia un processo figlio QA Gateway con il vero Plugin Matrix come trasporto SUT.
  - Per impostazione predefinita usa l’immagine stabile Tuwunel bloccata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sostituiscila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un’immagine diversa.
  - Scrive un report QA Matrix, un riepilogo e un artefatto degli eventi osservati sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la corsia QA live di Telegram contro un gruppo privato reale usando i token del bot driver e del bot SUT dall’ambiente.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id del gruppo deve essere l’id numerico della chat Telegram.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un nome utente Telegram.
  - Per un’osservazione stabile bot-to-bot, abilita la modalità Bot-to-Bot Communication in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artefatto dei messaggi osservati sotto `.artifacts/qa-e2e/...`.

Le corsie di trasporto live condividono un unico contratto standard, così i nuovi trasporti non divergono:

`qa-channel` rimane l’ampia suite QA sintetica e non fa parte della matrice di copertura del trasporto live.

| Corsia   | Canary | Blocco menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------- | ---------------- | ------------------------- | -------------------- | ------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x               | x                | x                         | x                    | x                   | x                     | x                           |              |
| Telegram | x      |                 |                  |                           |                      |                     |                       |                             | x            |

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere un runner QA specifico per canale quando il runner condiviso `qa-lab` può gestire il flusso.

`qa-lab` possiede i meccanismi condivisi:

- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

L’adapter del canale possiede il contratto di trasporto:

- come viene configurato il gateway per quel trasporto
- come viene verificata la disponibilità
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposte le trascrizioni e lo stato del trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come vengono gestiti reset o cleanup specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Implementare l’adapter di trasporto sulla seam condivisa `qa-lab`.
2. Registrare l’adapter nel registro dei trasporti.
3. Mantenere i meccanismi specifici del trasporto all’interno dell’adapter o dell’harness del canale.
4. Scrivere o adattare scenari markdown sotto `qa/scenarios/`.
5. Usare gli helper generici degli scenari per i nuovi scenari.
6. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un singolo trasporto di canale, tienilo in quell’adapter o harness del Plugin.
- Se uno scenario ha bisogno di una nuova capacità utilizzabile da più di un canale, aggiungi un helper generico invece di un ramo specifico per canale in `suite.ts`.
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

Gli alias di compatibilità rimangono disponibili per gli scenari esistenti, inclusi:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Il nuovo lavoro sui canali dovrebbe usare i nomi generici degli helper.
Gli alias di compatibilità esistono per evitare una migrazione in un solo giorno, non come modello per la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e crescente instabilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: dieci esecuzioni sequenziali di shard (`vitest.full-*.config.ts`) sui progetti Vitest con scope già esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test Node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (autenticazione del gateway, routing, strumenti, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` senza target ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico grande processo root-project nativo. Questo riduce il picco di RSS su macchine cariche ed evita che il lavoro di auto-reply/estensioni affami le suite non correlate.
  - `pnpm test --watch` continua a usare il grafo dei progetti del root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso corsie con scope, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del root project.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse corsie con scope quando il diff tocca solo file sorgente/test instradabili; le modifiche a config/setup tornano comunque alla riesecuzione ampia del root-project.
  - I test unitari leggeri in termini di import da agents, commands, plugin, helper di auto-reply, `plugin-sdk` e aree simili di utility pure vengono instradati attraverso la corsia `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file con stato/runtime più pesanti restano sulle corsie esistenti.
  - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test sibling espliciti in quelle corsie leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro più pesante dell’harness di reply fuori dai test economici di status/chunk/token.
- Nota sul runner embedded:
  - Quando modifichi gli input di discovery dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper focalizzate per boundary puri di routing/normalizzazione.
  - Mantieni inoltre in salute le suite di integrazione del runner embedded:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id con scope e il comportamento di compattazione continuino a passare
    attraverso i veri percorsi `run.ts` / `compact.ts`; i soli test helper non sono un
    sostituto sufficiente di questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa per default `threads`.
  - La configurazione Vitest condivisa fissa inoltre `isolate: false` e usa il runner non isolato in root projects, configurazioni e2e e live.
  - La corsia UI root mantiene il proprio setup `jsdom` e optimizer, ma ora gira anch’essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi default `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per default ai processi child Node di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontarlo con il comportamento V8 standard.
- Nota sull’iterazione locale veloce:
  - `pnpm test:changed` instrada attraverso corsie con scope quando i percorsi modificati mappano in modo pulito a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite di worker più alto.
  - L’auto-scaling locale dei worker ora è intenzionalmente conservativo e riduce anche il carico quando il load average dell’host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per default.
  - La configurazione base di Vitest contrassegna i progetti/file di configurazione come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per il profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l’output di scomposizione degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il `test:changed` instradato con il percorso root-project nativo per quel diff committed e stampa wall time più max RSS su macOS.
- `pnpm test:perf:changed:bench -- --worktree` misura l’albero dirty corrente instradando l’elenco dei file modificati attraverso `scripts/test-projects.mjs` e la config root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l’overhead di avvio e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo dei file disabilitato.

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Runtime predefinito:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per default).
  - Per default viene eseguito in modalità silenziosa per ridurre l’overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l’output verboso della console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Ha più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia sull’host un Gateway OpenShell isolato tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` + exec SSH reali
  - Verifica il comportamento del filesystem canonico remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Catturare cambi di formato del provider, particolarità delle tool call, problemi di autenticazione e comportamento dei rate limit
- Aspettative:
  - Per progetto non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - È preferibile eseguire subset ristretti invece di “tutto”
- Le esecuzioni live fanno source di `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per default, le esecuzioni live continuano a isolare `HOME` e copiano il materiale di configurazione/autenticazione in una home di test temporanea così i fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa per default una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra su `~/.profile` e silenzia i log di bootstrap del Gateway / il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle API key (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (ad esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione della console di Vitest così le righe di avanzamento del provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat del gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Se tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se stai facendo debug di “il mio bot non funziona” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/precondizionato (la suite non installa/esegue/accoppia l’app).
  - Validazione `node.invoke` del Gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa e accoppiata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso all’acquisizione concessi per le capacità che ti aspetti passino.
- Override facoltativi del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/it/platforms/android)

## Live: smoke del modello (chiavi del profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Modello diretto” ci dice se il provider/modello può rispondere del tutto con la chiave fornita.
- “Smoke del Gateway” ci dice se l’intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sullo smoke del Gateway
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l’allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per l’allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per default un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per default: store del profilo e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store del profilo
- Perché esiste:
  - Separa “l’API del provider è rotta / la chiave non è valida” da “la pipeline gateway agente è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del ragionamento di OpenAI Responses/Codex Responses + flussi di tool-call)

### Livello 2: smoke Gateway + agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - il funzionamento di una vera invocazione di strumento (probe `read`)
    - probe opzionali di strumenti extra (probe `exec+read`)
    - il corretto funzionamento dei percorsi di regressione OpenAI (solo tool-call → follow-up)
- Dettagli delle probe (così puoi spiegare rapidamente i guasti):
  - probe `read`: il test scrive un file nonce nell’area di lavoro e chiede all’agente di eseguire `read` su di esso e di restituire il nonce.
  - probe `exec+read`: il test chiede all’agente di scrivere tramite `exec` un nonce in un file temporaneo e poi di leggerlo di nuovo tramite `read`.
  - probe immagine: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento di implementazione: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per l’allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per default un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe di strumenti + immagine sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress degli strumenti)
  - la probe immagine viene eseguita quando il modello dichiara il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi piccoli errori)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli esatti id `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- I default smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell’estensione proprietaria.
- Abilitazione:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagine proviene dai metadati del Plugin proprietario del backend CLI.
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando è impostato `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità nella stessa sessione Claude Sonnet -> Opus (impostalo a `1` per forzarla quando il modello selezionato supporta un target di switch).

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
- Risolve i metadati smoke della CLI dall’estensione proprietaria, quindi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile con cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile di sottoscrizione Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env della chiave API Anthropic. Questa corsia subscription disabilita per default le probe Claude MCP/tool e immagine perché Claude attualmente instrada l’uso delle app di terze parti tramite fatturazione extra-usage invece che attraverso i normali limiti del piano di sottoscrizione.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi tool call MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica inoltre la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke di bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso di conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica su canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa corsia usa la superficie gateway `chat.send` con campi di originating-route sintetici solo-admin così i test possono collegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agent integrato del Plugin embedded `acpx` per l’agente harness ACP selezionato.

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
- Per default, esegue in sequenza lo smoke di bind ACP contro tutti gli agenti CLI live supportati: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Esegue il source di `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider dal profilo importato.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex di proprietà del Plugin tramite il normale
  metodo gateway `agent`:
  - caricare il Plugin `codex` incluso
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agent gateway a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread
    dell’app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso
    del comando gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex
  rotto non può passare ricadendo silenziosamente su PI.
- Autenticazione: `OPENAI_API_KEY` dalla shell/profilo, più eventuali
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
- Esegue il source di `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di
  autenticazione della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm
  montato e scrivibile, prepara il tree dei sorgenti, quindi esegue solo il test live dell’harness Codex.
- Docker abilita per default le probe immagine e MCP/tool. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando hai bisogno di un’esecuzione di debug più ristretta.
- Docker esporta inoltre `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la
  configurazione del test live così il fallback `openai-codex/*` o PI non può nascondere una regressione dell’harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più veloci e meno instabili:

- Modello singolo, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, smoke del Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l’API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama via HTTP l’API Gemini ospitata da Google (chiave API / autenticazione del profilo); questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario `gemini` locale; ha una propria autenticazione e può comportarsi in modo diverso (streaming/supporto strumenti/disallineamento di versione).

## Live: matrice dei modelli (cosa copriamo)

Non esiste un “elenco modelli CI” fisso (il live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (facoltativo: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui smoke del Gateway con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (gradita):

- xAI: `xai/grok-4` (oppure l’ultima disponibile)
- Mistral: `mistral/`… (scegli un modello con capacità “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varianti OpenAI con supporto vision, ecc.) per esercitare la probe immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di codificare in modo rigido “tutti i modelli” nella documentazione. L’elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (non committare mai)

I test live rilevano le credenziali nello stesso modo in cui lo fa la CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, esegui il debug nello stesso modo in cui faresti il debug di `openclaw models list` / selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che “chiavi del profilo” significa nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live staged quando presente, ma non nello store principale delle chiavi del profilo)
- Le esecuzioni locali live copiano per default la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory di autenticazione CLI esterne supportate in una home di test temporanea; le home live staged saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dalla tua vera area di lavoro host.

Se vuoi affidarti alle chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media di workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi immagine, video e `music_generate` di comfy incluso
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche all’invio del workflow comfy, al polling, ai download o alla registrazione del Plugin

## Live generazione di immagini

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni Plugin provider di generazione immagini registrato
  - Carica le variabili env provider mancanti dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue le varianti standard di generazione immagini tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider inclusi attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione tramite store del profilo e ignorare gli override solo-env

## Live generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso dei provider inclusi di generazione musicale
  - Attualmente copre Google e MiniMax
  - Carica le variabili env dei provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della corsia condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione tramite store del profilo e ignorare gli override solo-env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso dei provider inclusi di generazione video
  - Carica le variabili env dei provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` incluso è solo testo e `kling` incluso richiede un URL immagine remoto
  - Copertura specifica del provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una corsia `kling` che usa per default un fixture di URL immagine remoto
  - Copertura live attuale di `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l’attuale corsia condivisa Gemini/Veo usa input locale basato su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l’attuale corsia condivisa non garantisce l’accesso specifico dell’organizzazione a video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione tramite store del profilo e ignorare gli override solo-env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente le variabili env provider mancanti da `~/.profile`
  - Restringe automaticamente per default ogni suite ai provider che al momento hanno autenticazione utilizzabile
  - Riutilizza `scripts/test-live.mjs`, così heartbeat e comportamento della modalità silenziosa restano coerenti
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli facoltativi “funziona su Linux”)

Questi runner Docker si dividono in due categorie:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiavi profilo dentro l’immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory di configurazione locale e l’area di lavoro (ed eseguendo il source di `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per default un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa per default `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per default `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sostituisci queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l’immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due corsie Docker live.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre tramite bind solo le home di autenticazione CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione così l’OAuth delle CLI esterne può aggiornare i token senza modificare lo store di autenticazione dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke di bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke dell’harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking del Gateway (due container, autenticazione WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge di canale MCP (Gateway seedato + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano inoltre tramite bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l’immagine runtime
pur eseguendo comunque Vitest contro i tuoi esatti sorgenti/configurazione locali.
Il passaggio di staging salta grandi cache solo-locali e output di build dell’app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output locali dell’app `.build` o
Gradle così le esecuzioni live Docker non passano minuti a copiare
artefatti specifici della macchina.
Impostano inoltre `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura
live del gateway da quella corsia Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, effettua il login tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l’immagine
Open WebUI e Open WebUI potrebbe dover completare il proprio setup a freddo.
Questa corsia si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per default) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non ha bisogno di un
vero account Telegram, Discord o iMessage. Avvia un container Gateway
seedato, ne avvia un secondo che esegue `openclaw mcp serve`, quindi
verifica discovery della conversazione instradata, lettura delle trascrizioni, metadati degli allegati,
comportamento della coda eventi live, routing dell’invio in uscita e notifiche in stile Claude di canale +
permessi sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio raw così lo smoke valida ciò che il
bridge emette realmente, non solo ciò che un particolare SDK client capita di esporre.

Smoke manuale ACP plain-language thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe essere nuovamente necessario per la validazione del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` ed eseguito il source prima di avviare i test
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell’avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l’esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un’immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una nuova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurare che le credenziali provengano dallo store del profilo (non dall’env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag immagine Open WebUI fissato

## Verifica della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli delle intestazioni in pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling del Gateway (OpenAI mock, vero gateway + agent loop): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell’agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell’agente”:

- Tool-calling mock tramite il vero gateway + agent loop (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisione:** quando le Skills sono elencate nel prompt, l’agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Conformità:** l’agente legge `SKILL.md` prima dell’uso e segue i passaggi/argomenti richiesti?
- **Contratti di workflow:** scenari multi-turno che verificano ordine degli strumenti, continuità della cronologia della sessione e boundary della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare tool call + ordine, letture di file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle Skill (usare vs evitare, gating, prompt injection).
- Valutazioni live facoltative (opt-in, controllate da env) solo dopo che la suite sicura per CI è pronta.

## Test di contratto (forma di Plugin e canale)

I test di contratto verificano che ogni Plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i Plugin rilevati ed eseguono una suite di
verifiche di forma e comportamento. La corsia unitaria predefinita `pnpm test`
salta intenzionalmente questi file seam condivisi e smoke; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del Plugin (id, nome, capacità)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell’ID del thread
- **directory** - API di directory/roster
- **group-policy** - Applicazione della group policy

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro dei Plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell’autenticazione
- **catalog** - API del catalogo modelli
- **discovery** - Discovery dei Plugin
- **loader** - Caricamento dei Plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del Plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o sottopercorsi di `plugin-sdk`
- Dopo aver aggiunto o modificato un Plugin di canale o provider
- Dopo il refactoring della registrazione o della discovery dei Plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto nel live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure acquisisci l’esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo-live (rate limit, policy di autenticazione), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug della pipeline sessione/cronologia/strumenti del gateway → smoke live del gateway o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente su id target non classificati così le nuove classi non possono essere saltate in silenzio.
