---
read_when:
    - È necessaria una guida di riferimento per la configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
summary: Panoramica del provider del modello con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-21T13:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provider di modelli

Questa pagina tratta i **provider di LLM/modelli** (non i canali chat come WhatsApp/Telegram).
Per le regole di selezione del modello, vedi [/concepts/models](/it/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- Se imposti `agents.defaults.models`, questo diventa l'allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Le regole di runtime di fallback, le probe di cooldown e la persistenza delle override di sessione sono
  documentate in [/concepts/model-failover](/it/concepts/model-failover).
- `models.providers.*.models[].contextWindow` sono metadati nativi del modello;
  `models.providers.*.models[].contextTokens` è il limite effettivo del runtime.
- I Plugin provider possono iniettare cataloghi di modelli tramite `registerProvider({ catalog })`;
  OpenClaw unisce questo output in `models.providers` prima di scrivere
  `models.json`.
- I manifest dei provider possono dichiarare `providerAuthEnvVars` e
  `providerAuthAliases` così le probe di autenticazione generiche basate su env e le varianti dei provider
  non devono caricare il runtime del Plugin. La mappa rimanente delle env var nel core ora serve
  solo per i provider non-Plugin/core e per alcuni casi di precedenza generica come
  l'onboarding Anthropic con priorità API key.
- I Plugin provider possono anche possedere il comportamento runtime del provider tramite
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, e
  `onModelSelected`.
- Nota: `capabilities` del runtime del provider sono metadati condivisi del runner (famiglia del provider,
  particolarità di trascrizione/tooling, suggerimenti su transport/cache). Non è la
  stessa cosa del [modello di capability pubblico](/it/plugins/architecture#public-capability-model)
  che descrive ciò che un Plugin registra (inferenza testuale, voce, ecc.).
- Il provider `codex` incluso è abbinato all'harness dell'agente Codex incluso.
  Usa `codex/gpt-*` quando vuoi login gestito da Codex, rilevamento dei modelli,
  ripresa nativa dei thread ed esecuzione app-server. I riferimenti semplici `openai/gpt-*` continuano
  a usare il provider OpenAI e il normale transport provider di OpenClaw.
  Le distribuzioni solo-Codex possono disabilitare il fallback automatico a PI con
  `agents.defaults.embeddedHarness.fallback: "none"`; vedi
  [Codex Harness](/it/plugins/codex-harness).

## Comportamento del provider gestito dal Plugin

I Plugin provider possono ora gestire la maggior parte della logica specifica del provider mentre OpenClaw mantiene
il loop di inferenza generico.

Suddivisione tipica:

- `auth[].run` / `auth[].runNonInteractive`: il provider gestisce i flussi di onboarding/login
  per `openclaw onboard`, `openclaw models auth` e la configurazione headless
- `wizard.setup` / `wizard.modelPicker`: il provider gestisce etichette di scelta auth,
  alias legacy, suggerimenti per l'allowlist di onboarding e voci di configurazione nei selettori di onboarding/modello
- `catalog`: il provider appare in `models.providers`
- `normalizeModelId`: il provider normalizza gli id di modello legacy/preview prima
  della ricerca o della canonicalizzazione
- `normalizeTransport`: il provider normalizza `api` / `baseUrl` della famiglia di transport
  prima dell'assemblaggio generico del modello; OpenClaw controlla prima il provider corrispondente,
  poi altri Plugin provider con hook compatibili finché uno non modifica effettivamente il
  transport
- `normalizeConfig`: il provider normalizza la configurazione `models.providers.<id>` prima
  che il runtime la usi; OpenClaw controlla prima il provider corrispondente, poi altri
  Plugin provider con hook compatibili finché uno non modifica effettivamente la configurazione. Se nessun
  hook del provider riscrive la configurazione, gli helper inclusi della famiglia Google continuano comunque
  a normalizzare le voci supportate dei provider Google.
- `applyNativeStreamingUsageCompat`: il provider applica riscritture di compatibilità per l'uso dello streaming nativo guidate dall'endpoint per i provider di configurazione
- `resolveConfigApiKey`: il provider risolve l'autenticazione con marker env per i provider di configurazione
  senza forzare il caricamento completo dell'autenticazione runtime. `amazon-bedrock` ha anche un
  resolver integrato per marker env AWS qui, anche se l'autenticazione runtime di Bedrock usa
  la catena predefinita dell'AWS SDK.
- `resolveSyntheticAuth`: il provider può esporre la disponibilità di autenticazione locale/self-hosted o di altro tipo
  basata su configurazione senza persistere segreti in chiaro
- `shouldDeferSyntheticProfileAuth`: il provider può contrassegnare i placeholder di profili sintetici archiviati
  come a priorità inferiore rispetto all'autenticazione basata su env/config
- `resolveDynamicModel`: il provider accetta id di modelli non ancora presenti nel catalogo statico
  locale
- `prepareDynamicModel`: il provider richiede un aggiornamento dei metadati prima di ritentare
  la risoluzione dinamica
- `normalizeResolvedModel`: il provider richiede riscritture di transport o base URL
- `contributeResolvedModelCompat`: il provider contribuisce flag di compatibilità per i propri
  modelli vendor anche quando arrivano tramite un altro transport compatibile
- `capabilities`: il provider pubblica particolarità di trascrizione/tooling/famiglia provider
- `normalizeToolSchemas`: il provider pulisce gli schemi degli strumenti prima che il
  runner incorporato li veda
- `inspectToolSchemas`: il provider espone avvisi sugli schemi specifici del transport
  dopo la normalizzazione
- `resolveReasoningOutputMode`: il provider sceglie contratti di output del ragionamento
  nativi o con tag
- `prepareExtraParams`: il provider imposta valori predefiniti o normalizza parametri di richiesta per modello
- `createStreamFn`: il provider sostituisce il normale percorso di stream con un transport
  completamente personalizzato
- `wrapStreamFn`: il provider applica wrapper di compatibilità a header/body/modello della richiesta
- `resolveTransportTurnState`: il provider fornisce header o metadati del transport nativo per turno
- `resolveWebSocketSessionPolicy`: il provider fornisce header di sessione WebSocket nativa
  o una policy di cooldown della sessione
- `createEmbeddingProvider`: il provider gestisce il comportamento degli embedding della memoria quando
  appartiene al Plugin provider invece che allo switchboard embedding del core
- `formatApiKey`: il provider formatta i profili auth archiviati nella stringa
  runtime `apiKey` attesa dal transport
- `refreshOAuth`: il provider gestisce il refresh OAuth quando i refresher condivisi `pi-ai`
  non sono sufficienti
- `buildAuthDoctorHint`: il provider aggiunge indicazioni di riparazione quando il refresh OAuth
  fallisce
- `matchesContextOverflowError`: il provider riconosce errori di overflow della finestra di contesto
  specifici del provider che le euristiche generiche non rileverebbero
- `classifyFailoverReason`: il provider mappa errori raw di transport/API specifici del provider
  a motivi di failover come rate limit o overload
- `isCacheTtlEligible`: il provider decide quali id di modelli upstream supportano il TTL della cache dei prompt
- `buildMissingAuthMessage`: il provider sostituisce l'errore generico dell'archivio auth
  con un suggerimento di recupero specifico del provider
- `suppressBuiltInModel`: il provider nasconde righe upstream obsolete e può restituire un
  errore gestito dal vendor per fallimenti di risoluzione diretta
- `augmentModelCatalog`: il provider aggiunge righe di catalogo sintetiche/finali dopo
  il rilevamento e l'unione della configurazione
- `resolveThinkingProfile`: il provider gestisce l'esatto insieme di livelli `/think`,
  eventuali etichette di visualizzazione e il livello predefinito per un modello selezionato
- `isBinaryThinking`: hook di compatibilità per UX thinking binaria on/off
- `supportsXHighThinking`: hook di compatibilità per modelli `xhigh` selezionati
- `resolveDefaultThinkingLevel`: hook di compatibilità per la policy predefinita di `/think`
- `applyConfigDefaults`: il provider applica valori predefiniti globali specifici del provider
  durante la materializzazione della configurazione in base alla modalità auth, all'env o alla famiglia di modelli
- `isModernModelRef`: il provider gestisce la corrispondenza del modello preferito per live/smoke
- `prepareRuntimeAuth`: il provider trasforma una credenziale configurata in un token runtime
  a breve durata
- `resolveUsageAuth`: il provider risolve le credenziali di uso/quota per `/usage`
  e relative superfici di stato/reporting
- `fetchUsageSnapshot`: il provider gestisce il recupero/parsing dell'endpoint di uso mentre
  il core continua a gestire la shell di riepilogo e la formattazione
- `onModelSelected`: il provider esegue effetti collaterali post-selezione come
  telemetria o bookkeeping di sessione gestito dal provider

Esempi inclusi attuali:

- `anthropic`: fallback forward-compat per Claude 4.6, suggerimenti di riparazione auth, recupero dell'endpoint di utilizzo, metadati cache-TTL/famiglia provider e valori predefiniti globali della configurazione sensibili all'auth
- `amazon-bedrock`: corrispondenza degli overflow di contesto gestita dal provider e classificazione dei motivi di failover per errori specifici di Bedrock come throttle/not-ready, più la famiglia di replay condivisa `anthropic-by-model` per le protezioni della replay-policy solo-Claude sul traffico Anthropic
- `anthropic-vertex`: protezioni della replay-policy solo-Claude sul traffico dei messaggi Anthropic
- `openrouter`: id modello pass-through, wrapper delle richieste, hint sulle capability del provider, sanificazione della thought-signature di Gemini sul traffico Gemini via proxy, iniezione del reasoning via proxy tramite la famiglia di stream `openrouter-thinking`, inoltro dei metadati di routing e policy cache-TTL
- `github-copilot`: onboarding/login del dispositivo, fallback forward-compat del modello, hint di trascrizione Claude-thinking, scambio di token runtime e recupero dell'endpoint di utilizzo
- `openai`: fallback forward-compat per GPT-5.4, normalizzazione diretta del transport OpenAI, hint di auth mancante consapevoli di Codex, soppressione di Spark, righe di catalogo sintetiche OpenAI/Codex, policy di thinking/modelli live, normalizzazione degli alias dei token di utilizzo (`input` / `output` e famiglie `prompt` / `completion`), la famiglia di stream condivisa `openai-responses-defaults` per i wrapper nativi OpenAI/Codex, metadati della famiglia provider, registrazione inclusa del provider di generazione immagini per `gpt-image-1` e registrazione inclusa del provider di generazione video per `sora-2`
- `google` e `google-gemini-cli`: fallback forward-compat per Gemini 3.1, validazione nativa del replay Gemini, sanificazione del bootstrap replay, modalità di output reasoning con tag, corrispondenza dei modelli moderni, registrazione inclusa del provider di generazione immagini per i modelli Gemini image-preview e registrazione inclusa del provider di generazione video per i modelli Veo; inoltre Gemini CLI OAuth gestisce la formattazione dei token del profilo auth, il parsing dei token di utilizzo e il recupero dell'endpoint quota per le superfici di utilizzo
- `moonshot`: transport condiviso, normalizzazione del payload thinking gestita dal Plugin
- `kilocode`: transport condiviso, header di richiesta gestiti dal Plugin, normalizzazione del payload reasoning, sanificazione della thought-signature di Gemini via proxy e policy cache-TTL
- `zai`: fallback forward-compat per GLM-5, valori predefiniti `tool_stream`, policy cache-TTL, policy di binary-thinking/modelli live e auth di utilizzo + recupero quota; gli id sconosciuti `glm-5*` vengono sintetizzati a partire dal template incluso `glm-4.7`
- `xai`: normalizzazione nativa del transport Responses, riscritture degli alias `/fast` per le varianti veloci di Grok, `tool_stream` predefinito, pulizia di tool-schema/payload reasoning specifica di xAI e registrazione inclusa del provider di generazione video per `grok-imagine-video`
- `mistral`: metadati delle capability gestiti dal Plugin
- `opencode` e `opencode-go`: metadati delle capability gestiti dal Plugin più sanificazione della thought-signature di Gemini via proxy
- `alibaba`: catalogo di generazione video gestito dal Plugin per riferimenti diretti ai modelli Wan come `alibaba/wan2.6-t2v`
- `byteplus`: cataloghi gestiti dal Plugin più registrazione inclusa del provider di generazione video per i modelli Seedance text-to-video/image-to-video
- `fal`: registrazione inclusa del provider di generazione video per modelli video di terze parti ospitati, registrazione inclusa del provider di generazione immagini per i modelli immagine FLUX più registrazione inclusa del provider di generazione video per modelli video di terze parti ospitati
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  solo cataloghi gestiti dal Plugin
- `qwen`: cataloghi gestiti dal Plugin per i modelli testuali più registrazioni condivise dei provider di comprensione dei media e generazione video per le sue superfici multimodali; la generazione video Qwen usa gli endpoint video DashScope Standard con modelli Wan inclusi come `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registrazione del provider di generazione video gestita dal Plugin per modelli nativi basati su task di Runway come `gen4.5`
- `minimax`: cataloghi gestiti dal Plugin, registrazione inclusa del provider di generazione video per i modelli video Hailuo, registrazione inclusa del provider di generazione immagini per `image-01`, selezione ibrida della replay-policy Anthropic/OpenAI e logica auth/snapshot di utilizzo
- `together`: cataloghi gestiti dal Plugin più registrazione inclusa del provider di generazione video per i modelli video Wan
- `xiaomi`: cataloghi gestiti dal Plugin più logica auth/snapshot di utilizzo

Il Plugin `openai` incluso ora gestisce entrambi gli id provider: `openai` e
`openai-codex`.

Questo copre i provider che rientrano ancora nei transport normali di OpenClaw. Un provider
che necessita di un esecutore di richieste completamente personalizzato è una superficie di estensione
separata e più profonda.

## Rotazione delle API key

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, priorità massima)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, per esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e deduplica i valori.
- Le richieste vengono ritentate con la chiave successiva solo in caso di risposte con rate limit (per
  esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o messaggi periodici di limite di utilizzo).
- I fallimenti diversi dal rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
- Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Provider integrati (catalogo pi-ai)

OpenClaw viene distribuito con il catalogo pi-ai. Questi provider non richiedono alcuna
configurazione `models.providers`; basta impostare l'auth e scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singolo override)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket di OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece dell'interruttore condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai
  proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche `store` di Responses, hint per la cache dei prompt e
  il shaping del payload di compatibilità reasoning di OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché l'API OpenAI live lo rifiuta; Spark è trattato come solo-Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singolo override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste pubbliche dirette ad Anthropic supportano anche l'interruttore condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con API key e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Il setup-token Anthropic rimane disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Modello di esempio: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche nelle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) vengono allegati solo al traffico Codex nativo verso
  `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso interruttore `/fast` e la configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` rimane disponibile quando il catalogo OAuth di Codex lo espone; dipende dalle autorizzazioni
- `openai-codex/gpt-5.4` mantiene `contextWindow = 1050000` nativo e un `contextTokens = 272000` runtime predefinito; esegui l'override del limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota sulla policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni ospitate in stile abbonamento

- [Qwen Cloud](/it/providers/qwen): superficie provider Qwen Cloud più mappatura degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/it/providers/minimax): accesso MiniMax Coding Plan via OAuth o API key
- [GLM Models](/it/providers/glm): endpoint Z.AI Coding Plan o API generici

### OpenCode

- Auth: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione opzionale: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singolo override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy di OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni dirette Gemini accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; gli hit della cache Gemini vengono esposti come `cacheRead` di OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il suo flusso OAuth
- Attenzione: Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo aver usato client di terze parti. Consulta i termini di Google e usa un account non critico se scegli di procedere.
- Gemini CLI OAuth viene distribuito come parte del Plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **non** incolli un client id o un secret in `openclaw.json`. Il flusso di login CLI archivia
    i token nei profili auth sull'host del gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway.
  - Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'utilizzo usa come fallback
    `stats`, con `stats.cached` normalizzato in `cacheRead` di OpenClaw.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati in `zai/*`
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modello di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- Il catalogo di fallback statico include `kilocode/kilo/auto`; il rilevamento live di
  `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo
  runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway,
  non codificato in modo statico in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider inclusi

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modello di esempio: `openrouter/auto`
- OpenClaw applica gli header di attribuzione dell'app documentati da OpenRouter solo quando
  la richiesta punta effettivamente a `openrouter.ai`
- I marker `cache_control` specifici di Anthropic per OpenRouter sono analogamente limitati
  a route OpenRouter verificate, non a URL proxy arbitrarie
- OpenRouter rimane sul percorso in stile proxy compatibile con OpenAI, quindi il shaping nativo delle richieste solo-OpenAI (`serviceTier`, `store` di Responses,
  hint per la cache dei prompt, payload di compatibilità reasoning di OpenAI) non viene inoltrato
- I ref OpenRouter basati su Gemini mantengono solo la sanificazione della thought-signature di Gemini via proxy;
  la validazione nativa del replay Gemini e le riscritture bootstrap restano disattivate
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modello di esempio: `kilocode/kilo/auto`
- I ref Kilo basati su Gemini mantengono lo stesso percorso di sanificazione della thought-signature di Gemini via proxy; `kilocode/kilo/auto` e altri hint proxy-reasoning-non-supportato
  saltano l'iniezione del reasoning via proxy
- MiniMax: `minimax` (API key) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`
- Modello di esempio: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- La configurazione onboarding/API key di MiniMax scrive definizioni esplicite del modello M2.7 con
  `input: ["text", "image"]`; il catalogo del provider incluso mantiene i ref chat
  solo testo finché quella configurazione del provider non viene materializzata
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modello di esempio: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` o `KIMICODE_API_KEY`)
- Modello di esempio: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modello di esempio: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` o `DASHSCOPE_API_KEY`)
- Modello di esempio: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modello di esempio: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelli di esempio: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modello di esempio: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modello di esempio: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modello di esempio: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modello di esempio: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Le richieste xAI native incluse usano il percorso xAI Responses
  - `/fast` o `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`,
    `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`
  - `tool_stream` è attivo per impostazione predefinita; imposta
    `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
    disabilitarlo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modello di esempio: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - I modelli GLM su Cerebras usano gli id `zai-glm-4.7` e `zai-glm-4.6`.
  - URL base compatibile con OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modello di esempio per Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Vedi [Hugging Face (Inference)](/it/providers/huggingface).

## Provider tramite `models.providers` (URL personalizzato/base)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o
proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi qui sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL base, gli header o l'elenco dei modelli predefinito.

### Moonshot AI (Kimi)

Moonshot viene distribuito come Plugin provider incluso. Usa il provider integrato per
impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando
devi sovrascrivere l'URL base o i metadati del modello:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modello di esempio: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID modello Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding usa l'endpoint compatibile con Anthropic di Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Modello di esempio: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Il legacy `kimi/k2p5` continua a essere accettato come id modello di compatibilità.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornisce accesso a Doubao e ad altri modelli in Cina.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Modello di esempio: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `volcengine/*`
viene registrato nello stesso momento.

Nei selettori di onboarding/configurazione del modello, la scelta auth di Volcengine preferisce sia le righe
`volcengine/*` sia `volcengine-plan/*`. Se questi modelli non sono ancora caricati,
OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore
vuoto limitato al provider.

Modelli disponibili:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelli coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internazionale)

BytePlus ARK fornisce accesso agli stessi modelli di Volcano Engine per gli utenti internazionali.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Modello di esempio: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `byteplus/*`
viene registrato nello stesso momento.

Nei selettori di onboarding/configurazione del modello, la scelta auth di BytePlus preferisce sia le righe
`byteplus/*` sia `byteplus-plan/*`. Se questi modelli non sono ancora caricati,
OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore
vuoto limitato al provider.

Modelli disponibili:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelli coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fornisce modelli compatibili con Anthropic dietro il provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Modello di esempio: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax viene configurato tramite `models.providers` perché usa endpoint personalizzati:

- MiniMax OAuth (globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API key MiniMax (globale): `--auth-choice minimax-global-api`
- API key MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` oppure
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni di modello e gli snippet di configurazione.

Sul percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita thinking per
impostazione predefinita a meno che non lo imposti esplicitamente, e `/fast on` riscrive
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capability gestita dal Plugin:

- I valori predefiniti text/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01` gestita dal Plugin su entrambi i percorsi auth MiniMax
- La ricerca web resta sull'id provider `minimax`

### LM Studio

LM Studio viene distribuito come Plugin provider incluso che usa l'API nativa:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL base predefinito per l'inferenza: `http://localhost:1234/v1`

Poi imposta un modello (sostituisci con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativi di LM Studio
per rilevamento + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita.
Vedi [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama viene distribuito come Plugin provider incluso e usa l'API nativa di Ollama:

- Provider: `ollama`
- Auth: nessuna richiesta (server locale)
- Modello di esempio: `ollama/llama3.3`
- Installazione: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installa Ollama, poi scarica un modello:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando scegli di abilitarlo con
`OLLAMA_API_KEY`, e il Plugin provider incluso aggiunge Ollama direttamente a
`openclaw onboard` e al selettore del modello. Vedi [/providers/ollama](/it/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM viene distribuito come Plugin provider incluso per server locali/self-hosted
compatibili con OpenAI:

- Provider: `vllm`
- Auth: opzionale (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per abilitare il rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non impone auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Poi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang viene distribuito come Plugin provider incluso per server self-hosted veloci
compatibili con OpenAI:

- Provider: `sglang`
- Auth: opzionale (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per abilitare il rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non
impone auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Poi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Vedi [/providers/sglang](/it/providers/sglang) per i dettagli.

### Proxy locali (LM Studio, vLLM, LiteLLM, ecc.)

Esempio (compatibile con OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Locale" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Modello locale",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Note:

- Per i provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono facoltativi.
  Se omessi, OpenClaw usa i valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider dovuti a ruoli `developer` non supportati.
- Le route compatibili con OpenAI in stile proxy saltano anche lo shaping nativo delle richieste solo-OpenAI: niente `service_tier`, niente `store` di Responses, niente hint per la cache dei prompt, niente shaping del payload di compatibilità reasoning di OpenAI e nessun header nascosto di attribuzione OpenClaw.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
- Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [/gateway/configuration](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Models](/it/concepts/models) — configurazione del modello e alias
- [Model Failover](/it/concepts/model-failover) — catene di fallback e comportamento dei retry
- [Configuration Reference](/it/gateway/configuration-reference#agent-defaults) — chiavi di configurazione del modello
- [Providers](/it/providers) — guide di configurazione per provider
