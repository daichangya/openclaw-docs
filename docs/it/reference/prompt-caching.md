---
read_when:
    - Vuoi ridurre i costi dei token del prompt con la cache retention
    - Hai bisogno di un comportamento della cache per agente nelle configurazioni multi-agente
    - Stai regolando insieme la potatura di Heartbeat e di cache-ttl
summary: Controlli del caching dei prompt, ordine di merge, comportamento del provider e modelli di ottimizzazione
title: Caching dei prompt
x-i18n:
    generated_at: "2026-04-25T13:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

La prompt caching significa che il provider del modello può riutilizzare prefissi del prompt invariati (di solito istruzioni di sistema/sviluppatore e altro contesto stabile) tra i turni invece di rielaborarli ogni volta. OpenClaw normalizza l'utilizzo del provider in `cacheRead` e `cacheWrite` quando l'API upstream espone direttamente quei contatori.

Le superfici di stato possono anche recuperare i contatori della cache dal log di utilizzo della trascrizione più recente quando lo snapshot della sessione live non li contiene, così `/status` può continuare a mostrare una riga della cache dopo una perdita parziale dei metadati della sessione. I valori di cache live non nulli esistenti continuano comunque ad avere la precedenza rispetto ai valori di fallback della trascrizione.

Perché è importante: costo in token più basso, risposte più rapide e prestazioni più prevedibili per sessioni di lunga durata. Senza caching, i prompt ripetuti pagano il costo completo del prompt a ogni turno anche quando la maggior parte dell'input non è cambiata.

Le sezioni seguenti coprono ogni impostazione relativa alla cache che influisce sul riutilizzo del prompt e sul costo in token.

Riferimenti dei provider:

- Prompt caching Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API OpenAI e ID richiesta: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID richiesta ed errori Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Impostazioni principali

### `cacheRetention` (predefinito globale, modello e per agente)

Imposta la conservazione della cache come predefinito globale per tutti i modelli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Sovrascrivi per modello:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Sovrascrittura per agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordine di merge della configurazione:

1. `agents.defaults.params` (predefinito globale — si applica a tutti i modelli)
2. `agents.defaults.models["provider/model"].params` (sovrascrittura per modello)
3. `agents.list[].params` (id agente corrispondente; sovrascrive per chiave)

### `contextPruning.mode: "cache-ttl"`

Rimuove il contesto vecchio dei risultati degli strumenti dopo le finestre TTL della cache, così le richieste dopo periodi di inattività non rimettono in cache una cronologia sovradimensionata.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vedi [Session Pruning](/it/concepts/session-pruning) per il comportamento completo.

### Keep-warm Heartbeat

Heartbeat può mantenere calde le finestre della cache e ridurre le riscritture ripetute della cache dopo intervalli di inattività.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agente è supportato in `agents.list[].heartbeat`.

## Comportamento dei provider

### Anthropic (API diretta)

- `cacheRetention` è supportato.
- Con i profili di autenticazione con chiave API Anthropic, OpenClaw inizializza `cacheRetention: "short"` per i riferimenti ai modelli Anthropic quando non è impostato.
- Le risposte native Anthropic Messages espongono sia `cache_read_input_tokens` sia `cache_creation_input_tokens`, quindi OpenClaw può mostrare sia `cacheRead` sia `cacheWrite`.
- Per le richieste Anthropic native, `cacheRetention: "short"` corrisponde alla cache effimera predefinita di 5 minuti, e `cacheRetention: "long"` passa al TTL di 1 ora solo sugli host diretti `api.anthropic.com`.

### OpenAI (API diretta)

- La prompt caching è automatica sui modelli recenti supportati. OpenClaw non deve iniettare marcatori di cache a livello di blocco.
- OpenClaw usa `prompt_cache_key` per mantenere stabile il routing della cache tra i turni e usa `prompt_cache_retention: "24h"` solo quando è selezionato `cacheRetention: "long"` sugli host OpenAI diretti.
- I provider Completions compatibili con OpenAI ricevono `prompt_cache_key` solo quando la configurazione del loro modello imposta esplicitamente `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` continua comunque a sopprimerlo.
- Le risposte OpenAI espongono i token del prompt in cache tramite `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` negli eventi Responses API). OpenClaw li mappa su `cacheRead`.
- OpenAI non espone un contatore separato dei token di scrittura in cache, quindi `cacheWrite` resta `0` sui percorsi OpenAI anche quando il provider sta riscaldando una cache.
- OpenAI restituisce utili header di tracciamento e rate limit come `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, ma il conteggio dei cache hit dovrebbe provenire dal payload di utilizzo, non dagli header.
- In pratica, OpenAI spesso si comporta come una cache del prefisso iniziale anziché come il riutilizzo completo della cronologia in movimento in stile Anthropic. I turni con testo stabile e prefisso lungo possono assestarsi vicino a un plateau di `4864` token in cache nelle sonde live attuali, mentre le trascrizioni ricche di strumenti o in stile MCP spesso si assestano vicino a `4608` token in cache anche su ripetizioni esatte.

### Anthropic Vertex

- I modelli Anthropic su Vertex AI (`anthropic-vertex/*`) supportano `cacheRetention` allo stesso modo di Anthropic diretto.
- `cacheRetention: "long"` corrisponde al reale TTL di 1 ora della prompt-cache sugli endpoint Vertex AI.
- La conservazione della cache predefinita per `anthropic-vertex` corrisponde ai predefiniti Anthropic diretti.
- Le richieste Vertex vengono instradate tramite modellazione della cache consapevole dei confini, così il riutilizzo della cache resta allineato con ciò che i provider ricevono effettivamente.

### Amazon Bedrock

- I riferimenti ai modelli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) supportano il pass-through esplicito di `cacheRetention`.
- I modelli Bedrock non Anthropic vengono forzati a `cacheRetention: "none"` in fase di esecuzione.

### Modelli OpenRouter

Per i riferimenti ai modelli `openrouter/anthropic/*`, OpenClaw inietta `cache_control` Anthropic nei blocchi di prompt di sistema/sviluppatore per migliorare il riutilizzo della prompt-cache solo quando la richiesta punta ancora a un percorso OpenRouter verificato (`openrouter` sul suo endpoint predefinito, oppure qualsiasi provider/base URL che si risolve in `openrouter.ai`).

Per i riferimenti ai modelli `openrouter/deepseek/*`, `openrouter/moonshot*/*` e `openrouter/zai/*`, `contextPruning.mode: "cache-ttl"` è consentito perché OpenRouter gestisce automaticamente il prompt caching lato provider. OpenClaw non inietta marcatori Anthropic `cache_control` in quelle richieste.

La costruzione della cache DeepSeek è best-effort e può richiedere alcuni secondi. Un follow-up immediato può ancora mostrare `cached_tokens: 0`; verifica con una richiesta ripetuta con lo stesso prefisso dopo un breve ritardo e usa `usage.prompt_tokens_details.cached_tokens` come segnale di cache hit.

Se reindirizzi il modello a un URL proxy arbitrario compatibile con OpenAI, OpenClaw smette di iniettare quei marcatori di cache Anthropic specifici di OpenRouter.

### Altri provider

Se il provider non supporta questa modalità di cache, `cacheRetention` non ha effetto.

### API diretta Google Gemini

- Il trasporto Gemini diretto (`api: "google-generative-ai"`) riporta i cache hit tramite `cachedContentTokenCount` upstream; OpenClaw lo mappa su `cacheRead`.
- Quando `cacheRetention` è impostato su un modello Gemini diretto, OpenClaw crea, riutilizza e aggiorna automaticamente risorse `cachedContents` per i prompt di sistema nelle esecuzioni Google AI Studio. Questo significa che non è più necessario precreare manualmente un handle cached-content.
- Puoi comunque passare un handle Gemini cached-content preesistente tramite `params.cachedContent` (o il legacy `params.cached_content`) sul modello configurato.
- Questo è separato dal prompt-prefix caching di Anthropic/OpenAI. Per Gemini, OpenClaw gestisce una risorsa `cachedContents` nativa del provider invece di iniettare marcatori di cache nella richiesta.

### Utilizzo JSON Gemini CLI

- L'output JSON della Gemini CLI può anche mostrare i cache hit tramite `stats.cached`; OpenClaw lo mappa su `cacheRead`.
- Se la CLI omette un valore diretto `stats.input`, OpenClaw deriva i token di input da `stats.input_tokens - stats.cached`.
- Questa è solo normalizzazione dell'utilizzo. Non significa che OpenClaw stia creando marcatori di prompt-cache in stile Anthropic/OpenAI per Gemini CLI.

## Confine della cache del prompt di sistema

OpenClaw divide il prompt di sistema in un **prefisso stabile** e un **suffisso volatile** separati da un confine interno del prefisso della cache. Il contenuto sopra il confine (definizioni degli strumenti, metadati di Skills, file dell'area di lavoro e altro contesto relativamente statico) è ordinato in modo da restare byte-identico tra i turni. Il contenuto sotto il confine (per esempio `HEARTBEAT.md`, timestamp runtime e altri metadati per turno) può cambiare senza invalidare il prefisso in cache.

Scelte progettuali chiave:

- I file stabili del contesto di progetto dell'area di lavoro sono ordinati prima di `HEARTBEAT.md`, così il churn di heartbeat non invalida il prefisso stabile.
- Il confine viene applicato alla modellazione della cache delle famiglie Anthropic, OpenAI, Google e dei trasporti CLI, così tutti i provider supportati beneficiano della stessa stabilità del prefisso.
- Le richieste Codex Responses e Anthropic Vertex vengono instradate tramite modellazione della cache consapevole dei confini, così il riutilizzo della cache resta allineato con ciò che i provider ricevono effettivamente.
- Le impronte del prompt di sistema sono normalizzate (spaziatura, terminatori di riga, contesto aggiunto dagli hook, ordinamento delle capacità runtime) così prompt semanticamente invariati condividono KV/cache tra i turni.

Se noti picchi imprevisti di `cacheWrite` dopo una modifica della configurazione o dell'area di lavoro, controlla se la modifica cade sopra o sotto il confine della cache. Spostare il contenuto volatile sotto il confine (o stabilizzarlo) spesso risolve il problema.

## Protezioni di stabilità della cache in OpenClaw

OpenClaw mantiene anche deterministiche diverse forme di payload sensibili alla cache prima che la richiesta raggiunga il provider:

- I cataloghi degli strumenti MCP bundle sono ordinati in modo deterministico prima della registrazione degli strumenti, così le variazioni nell'ordine di `listTools()` non alterano il blocco degli strumenti né invalidano i prefissi della prompt-cache.
- Le sessioni legacy con blocchi immagine persistiti mantengono intatti i **3 turni completati più recenti**; i blocchi immagine più vecchi già elaborati possono essere sostituiti con un marcatore, così i follow-up ricchi di immagini non continuano a rinviare grandi payload obsoleti.

## Modelli di ottimizzazione

### Traffico misto (predefinito consigliato)

Mantieni una base a lunga durata sul tuo agente principale, disabilita il caching sugli agenti notificatori a raffica:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Base orientata al costo

- Imposta `cacheRetention: "short"` come base.
- Abilita `contextPruning.mode: "cache-ttl"`.
- Mantieni heartbeat sotto il tuo TTL solo per gli agenti che beneficiano di cache calde.

## Diagnostica della cache

OpenClaw espone diagnostica dedicata del trace della cache per le esecuzioni di agenti incorporati.

Per la diagnostica normale rivolta all'utente, `/status` e altri riepiloghi di utilizzo possono usare l'ultima voce di utilizzo della trascrizione come sorgente di fallback per `cacheRead` / `cacheWrite` quando la voce della sessione live non contiene quei contatori.

## Test di regressione live

OpenClaw mantiene un unico gate combinato di regressione live della cache per prefissi ripetuti, turni con strumenti, turni con immagini, trascrizioni di strumenti in stile MCP e un controllo Anthropic senza cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Esegui il gate live ristretto con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Il file baseline memorizza i numeri live osservati più recenti insieme alle soglie di regressione specifiche per provider usate dal test.
Il runner usa anche ID sessione e namespace prompt nuovi per ogni esecuzione, così lo stato della cache precedente non inquina il campione di regressione corrente.

Questi test intenzionalmente non usano criteri di successo identici tra i provider.

### Aspettative live Anthropic

- Attendi scritture esplicite di warmup tramite `cacheWrite`.
- Attendi un riutilizzo quasi completo della cronologia nei turni ripetuti perché il controllo della cache Anthropic fa avanzare il punto di interruzione della cache lungo la conversazione.
- Le asserzioni live correnti continuano a usare soglie elevate di hit-rate per i percorsi stabili, con strumenti e con immagini.

### Aspettative live OpenAI

- Aspettati solo `cacheRead`. `cacheWrite` rimane `0`.
- Considera il riutilizzo della cache nei turni ripetuti come un plateau specifico del provider, non come il riutilizzo completo della cronologia in movimento in stile Anthropic.
- Le asserzioni live correnti usano controlli di soglia conservativi derivati dal comportamento live osservato su `gpt-5.4-mini`:
  - prefisso stabile: `cacheRead >= 4608`, hit rate `>= 0.90`
  - trascrizione con strumenti: `cacheRead >= 4096`, hit rate `>= 0.85`
  - trascrizione con immagini: `cacheRead >= 3840`, hit rate `>= 0.82`
  - trascrizione in stile MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

La nuova verifica live combinata del 2026-04-04 è arrivata a:

- prefisso stabile: `cacheRead=4864`, hit rate `0.966`
- trascrizione con strumenti: `cacheRead=4608`, hit rate `0.896`
- trascrizione con immagini: `cacheRead=4864`, hit rate `0.954`
- trascrizione in stile MCP: `cacheRead=4608`, hit rate `0.891`

Il tempo wall-clock locale recente per il gate combinato è stato di circa `88s`.

Perché le asserzioni differiscono:

- Anthropic espone punti di interruzione della cache espliciti e il riutilizzo in movimento della cronologia della conversazione.
- La prompt caching di OpenAI è ancora sensibile ai prefissi esatti, ma il prefisso effettivamente riutilizzabile nel traffico live Responses può raggiungere un plateau prima del prompt completo.
- Per questo motivo, confrontare Anthropic e OpenAI con una singola soglia percentuale trasversale ai provider crea falsi regressi.

### Configurazione `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facoltativo
    includeMessages: false # predefinito true
    includePrompt: false # predefinito true
    includeSystem: false # predefinito true
```

Predefiniti:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggle env (debug una tantum)

- `OPENCLAW_CACHE_TRACE=1` abilita il tracciamento della cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sovrascrive il percorso di output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` abilita/disabilita l'acquisizione del payload completo dei messaggi.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` abilita/disabilita l'acquisizione del testo del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` abilita/disabilita l'acquisizione del prompt di sistema.

### Cosa ispezionare

- Gli eventi del trace della cache sono in formato JSONL e includono snapshot in fasi come `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- L'impatto per turno dei token di cache è visibile nelle normali superfici di utilizzo tramite `cacheRead` e `cacheWrite` (per esempio `/usage full` e i riepiloghi di utilizzo della sessione).
- Per Anthropic, aspettati sia `cacheRead` sia `cacheWrite` quando la cache è attiva.
- Per OpenAI, aspettati `cacheRead` in caso di cache hit e `cacheWrite` che resta `0`; OpenAI non pubblica un campo separato per i token di scrittura della cache.
- Se hai bisogno del tracciamento delle richieste, registra separatamente gli ID richiesta e gli header di rate limit rispetto alle metriche di cache. L'output attuale del cache-trace di OpenClaw è incentrato sulla forma del prompt/sessione e sull'utilizzo normalizzato dei token, non sugli header grezzi delle risposte del provider.

## Risoluzione rapida dei problemi

- `cacheWrite` alto nella maggior parte dei turni: controlla gli input volatili del prompt di sistema e verifica che il modello/provider supporti le tue impostazioni di cache.
- `cacheWrite` alto su Anthropic: spesso significa che il punto di interruzione della cache cade su contenuti che cambiano a ogni richiesta.
- `cacheRead` basso su OpenAI: verifica che il prefisso stabile sia all'inizio, che il prefisso ripetuto sia di almeno 1024 token e che venga riutilizzato lo stesso `prompt_cache_key` per i turni che dovrebbero condividere una cache.
- Nessun effetto da `cacheRetention`: conferma che la chiave del modello corrisponda a `agents.defaults.models["provider/model"]`.
- Richieste Bedrock Nova/Mistral con impostazioni di cache: previsto il forzamento runtime a `none`.

Documentazione correlata:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Potatura della sessione](/it/concepts/session-pruning)
- [Riferimento della configurazione Gateway](/it/gateway/configuration-reference)

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo API e costi](/it/reference/api-usage-costs)
