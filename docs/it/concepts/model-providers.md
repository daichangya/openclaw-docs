---
read_when:
    - Hai bisogno di un riferimento per la configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-22T04:22:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provider di modelli

Questa pagina copre i **provider LLM/modelli** (non i canali chat come WhatsApp/Telegram).
Per le regole di selezione dei modelli, vedi [/concepts/models](/it/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- Se imposti `agents.defaults.models`, diventa l'allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Le regole di runtime di fallback, i probe di cooldown e la persistenza degli override di sessione
  sono documentati in [/concepts/model-failover](/it/concepts/model-failover).
- `models.providers.*.models[].contextWindow` è metadato nativo del modello;
  `models.providers.*.models[].contextTokens` è il limite effettivo di runtime.
- I Plugin provider possono iniettare cataloghi di modelli tramite `registerProvider({ catalog })`;
  OpenClaw unisce quell'output in `models.providers` prima di scrivere
  `models.json`.
- I manifest dei provider possono dichiarare `providerAuthEnvVars` e
  `providerAuthAliases` così i probe di autenticazione generici basati su env e le varianti provider
  non devono caricare il runtime del plugin. La mappa rimanente delle variabili env del core ora è
  solo per provider non-plugin/core e alcuni casi di precedenza generica
  come l'onboarding Anthropic con priorità alla chiave API.
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
- Nota: le `capabilities` runtime del provider sono metadati condivisi del runner (famiglia del provider,
  particolarità di transcript/tooling, suggerimenti su transport/cache). Non sono la stessa cosa del [modello di capacità pubblico](/it/plugins/architecture#public-capability-model)
  che descrive cosa registra un plugin (inferenza testuale, voce, ecc.).
- Il provider `codex` incluso è associato all'harness dell'agente Codex incluso.
  Usa `codex/gpt-*` quando vuoi login gestito da Codex, rilevamento dei modelli, ripresa nativa dei thread e esecuzione su app-server. I riferimenti semplici `openai/gpt-*` continuano
  a usare il provider OpenAI e il normale transport provider di OpenClaw.
  I deployment solo Codex possono disabilitare il fallback automatico a PI con
  `agents.defaults.embeddedHarness.fallback: "none"`; vedi
  [Codex Harness](/it/plugins/codex-harness).

## Comportamento del provider gestito dal plugin

I Plugin provider possono ora possedere la maggior parte della logica specifica del provider mentre OpenClaw mantiene
il ciclo di inferenza generico.

Suddivisione tipica:

- `auth[].run` / `auth[].runNonInteractive`: il provider gestisce i flussi di onboarding/login
  per `openclaw onboard`, `openclaw models auth` e la configurazione headless
- `wizard.setup` / `wizard.modelPicker`: il provider gestisce etichette di scelta auth,
  alias legacy, suggerimenti per l'allowlist di onboarding e voci di configurazione nei selettori di onboarding/modello
- `catalog`: il provider appare in `models.providers`
- `normalizeModelId`: il provider normalizza ID modello legacy/preview prima della
  ricerca o canonizzazione
- `normalizeTransport`: il provider normalizza `api` / `baseUrl` della famiglia transport
  prima dell'assemblaggio generico del modello; OpenClaw controlla prima il provider corrispondente,
  poi gli altri Plugin provider in grado di usare hook finché uno non modifica davvero il
  transport
- `normalizeConfig`: il provider normalizza la configurazione `models.providers.<id>` prima che il
  runtime la usi; OpenClaw controlla prima il provider corrispondente, poi gli altri
  Plugin provider in grado di usare hook finché uno non modifica davvero la configurazione. Se nessun
  hook provider riscrive la configurazione, gli helper Google-family inclusi continuano comunque
  a normalizzare le voci provider Google supportate.
- `applyNativeStreamingUsageCompat`: il provider applica riscritture di compatibilità per l'uso dello streaming nativo guidate dall'endpoint per i provider di configurazione
- `resolveConfigApiKey`: il provider risolve l'autenticazione con marker env per i provider di configurazione
  senza forzare il caricamento completo dell'autenticazione runtime. `amazon-bedrock` ha anche un
  resolver integrato per marker env AWS qui, anche se l'autenticazione runtime Bedrock usa
  la catena predefinita dell'SDK AWS.
- `resolveSyntheticAuth`: il provider può esporre disponibilità di autenticazione locale/self-hosted o altra
  autenticazione basata su configurazione senza persistere segreti in chiaro
- `shouldDeferSyntheticProfileAuth`: il provider può contrassegnare placeholder di profili sintetici memorizzati
  come a precedenza più bassa rispetto all'autenticazione basata su env/config
- `resolveDynamicModel`: il provider accetta ID modello non ancora presenti nel catalogo statico
  locale
- `prepareDynamicModel`: il provider richiede un refresh dei metadati prima di ritentare
  la risoluzione dinamica
- `normalizeResolvedModel`: il provider richiede riscritture del transport o del base URL
- `contributeResolvedModelCompat`: il provider contribuisce flag di compatibilità per i suoi
  modelli vendor anche quando arrivano tramite un altro transport compatibile
- `capabilities`: il provider pubblica particolarità di transcript/tooling/famiglia provider
- `normalizeToolSchemas`: il provider pulisce gli schemi degli strumenti prima che il
  runner integrato li veda
- `inspectToolSchemas`: il provider espone avvisi sugli schemi specifici del transport
  dopo la normalizzazione
- `resolveReasoningOutputMode`: il provider sceglie contratti di output del reasoning
  nativi o con tag
- `prepareExtraParams`: il provider imposta valori predefiniti o normalizza parametri di richiesta per modello
- `createStreamFn`: il provider sostituisce il normale percorso di stream con un transport
  completamente personalizzato
- `wrapStreamFn`: il provider applica wrapper di compatibilità per header/body/modello della richiesta
- `resolveTransportTurnState`: il provider fornisce header o metadati nativi del transport
  per turno
- `resolveWebSocketSessionPolicy`: il provider fornisce header nativi della sessione WebSocket
  o policy di cool-down della sessione
- `createEmbeddingProvider`: il provider gestisce il comportamento degli embedding di memoria quando
  appartiene al plugin provider invece che allo switchboard embedding del core
- `formatApiKey`: il provider formatta i profili di autenticazione memorizzati nella stringa
  runtime `apiKey` attesa dal transport
- `refreshOAuth`: il provider gestisce il refresh OAuth quando i refresher condivisi `pi-ai`
  non bastano
- `buildAuthDoctorHint`: il provider aggiunge indicazioni di riparazione quando il refresh OAuth
  fallisce
- `matchesContextOverflowError`: il provider riconosce errori di overflow della finestra di contesto
  specifici del provider che le euristiche generiche non rileverebbero
- `classifyFailoverReason`: il provider mappa errori raw transport/API specifici del provider
  a motivi di failover come rate limit o overload
- `isCacheTtlEligible`: il provider decide quali ID modello upstream supportano il TTL della prompt-cache
- `buildMissingAuthMessage`: il provider sostituisce l'errore generico dell'archivio auth
  con un suggerimento di recupero specifico del provider
- `suppressBuiltInModel`: il provider nasconde righe upstream obsolete e può restituire un
  errore gestito dal vendor per guasti di risoluzione diretta
- `augmentModelCatalog`: il provider aggiunge righe di catalogo sintetiche/finali dopo
  il rilevamento e l'unione della configurazione
- `resolveThinkingProfile`: il provider gestisce l'insieme esatto dei livelli `/think`,
  etichette di visualizzazione facoltative e il livello predefinito per un modello selezionato
- `isBinaryThinking`: hook di compatibilità per UX thinking binaria on/off
- `supportsXHighThinking`: hook di compatibilità per modelli `xhigh` selezionati
- `resolveDefaultThinkingLevel`: hook di compatibilità per la policy predefinita `/think`
- `applyConfigDefaults`: il provider applica valori predefiniti globali specifici del provider
  durante la materializzazione della configurazione in base a modalità auth, env o famiglia modello
- `isModernModelRef`: il provider gestisce la corrispondenza del modello preferito live/smoke
- `prepareRuntimeAuth`: il provider trasforma una credenziale configurata in un token runtime
  a breve durata
- `resolveUsageAuth`: il provider risolve credenziali di utilizzo/quota per `/usage`
  e superfici correlate di stato/reporting
- `fetchUsageSnapshot`: il provider gestisce il recupero/parsing dell'endpoint di utilizzo mentre
  il core continua a gestire shell e formattazione del riepilogo
- `onModelSelected`: il provider esegue effetti collaterali dopo la selezione, come
  telemetria o bookkeeping della sessione gestito dal provider

Esempi inclusi attuali:

- `anthropic`: fallback forward-compat per Claude 4.6, suggerimenti di riparazione auth, recupero dell'endpoint di utilizzo, metadati cache-TTL/famiglia provider e valori predefiniti di configurazione globale consapevoli dell'autenticazione
- `amazon-bedrock`: riconoscimento dell'overflow del contesto gestito dal provider e classificazione dei motivi di failover per errori Bedrock-specifici di throttling/not-ready, oltre alla famiglia di replay condivisa `anthropic-by-model` per guardrail della replay-policy solo-Claude sul traffico Anthropic
- `anthropic-vertex`: guardrail della replay-policy solo-Claude sul traffico dei messaggi Anthropic
- `openrouter`: ID modello pass-through, wrapper delle richieste, hint sulle capacità del provider, sanitizzazione della thought-signature Gemini sul traffico Gemini via proxy, iniezione del reasoning del proxy tramite la famiglia stream `openrouter-thinking`, inoltro dei metadati di routing e policy cache-TTL
- `github-copilot`: onboarding/login del dispositivo, fallback forward-compat del modello, hint del transcript Claude-thinking, scambio del token runtime e recupero dell'endpoint di utilizzo
- `openai`: fallback forward-compat GPT-5.4, normalizzazione diretta del transport OpenAI, hint auth mancanti consapevoli di Codex, soppressione Spark, righe di catalogo sintetiche OpenAI/Codex, policy thinking/live-model, normalizzazione alias dei token di utilizzo (`input` / `output` e famiglie `prompt` / `completion`), la famiglia stream condivisa `openai-responses-defaults` per wrapper nativi OpenAI/Codex, metadati della famiglia provider, registrazione inclusa del provider di generazione immagini per `gpt-image-2` e registrazione inclusa del provider di generazione video per `sora-2`
- `google` e `google-gemini-cli`: fallback forward-compat Gemini 3.1, validazione replay Gemini nativa, sanitizzazione replay bootstrap, modalità di output del reasoning con tag, corrispondenza modern-model, registrazione inclusa del provider di generazione immagini per i modelli Gemini image-preview e registrazione inclusa del provider di generazione video per i modelli Veo; inoltre Gemini CLI OAuth gestisce anche la formattazione del token del profilo auth, il parsing del token di utilizzo e il recupero dell'endpoint quote per le superfici di utilizzo
- `moonshot`: transport condiviso, normalizzazione del payload thinking gestita dal plugin
- `kilocode`: transport condiviso, header di richiesta gestiti dal plugin, normalizzazione del payload reasoning, sanitizzazione della thought-signature Gemini via proxy e policy cache-TTL
- `zai`: fallback forward-compat GLM-5, valori predefiniti `tool_stream`, policy cache-TTL, policy binary-thinking/live-model e autenticazione utilizzo + recupero quota; gli ID sconosciuti `glm-5*` vengono sintetizzati dal template incluso `glm-4.7`
- `xai`: normalizzazione del transport nativo Responses, riscritture alias `/fast` per varianti Grok fast, `tool_stream` predefinito, pulizia di schema strumenti / payload reasoning specifica xAI e registrazione inclusa del provider di generazione video per `grok-imagine-video`
- `mistral`: metadati delle capacità gestiti dal plugin
- `opencode` e `opencode-go`: metadati delle capacità gestiti dal plugin più sanitizzazione della thought-signature Gemini via proxy
- `alibaba`: catalogo di generazione video gestito dal plugin per riferimenti diretti ai modelli Wan come `alibaba/wan2.6-t2v`
- `byteplus`: cataloghi gestiti dal plugin più registrazione inclusa del provider di generazione video per i modelli Seedance text-to-video/image-to-video
- `fal`: registrazione inclusa del provider di generazione video per provider ospitati di terze parti, registrazione del provider di generazione immagini per i modelli immagine FLUX più registrazione inclusa del provider di generazione video per modelli video ospitati di terze parti
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  solo cataloghi gestiti dal plugin
- `qwen`: cataloghi gestiti dal plugin per modelli testuali più registrazioni condivise del provider di comprensione multimediale e generazione video per le sue superfici multimodali; la generazione video Qwen usa gli endpoint video DashScope Standard con modelli Wan inclusi come `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registrazione del provider di generazione video gestita dal plugin per modelli nativi Runway basati su task come `gen4.5`
- `minimax`: cataloghi gestiti dal plugin, registrazione inclusa del provider di generazione video per i modelli video Hailuo, registrazione inclusa del provider di generazione immagini per `image-01`, selezione ibrida della replay-policy Anthropic/OpenAI e logica auth/snapshot di utilizzo
- `together`: cataloghi gestiti dal plugin più registrazione inclusa del provider di generazione video per i modelli video Wan
- `xiaomi`: cataloghi gestiti dal plugin più logica auth/snapshot di utilizzo

Il plugin `openai` incluso ora gestisce entrambi gli ID provider: `openai` e
`openai-codex`.

Questo copre i provider che rientrano ancora nei normali transport di OpenClaw. Un provider
che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione
separata e più profonda.

## Rotazione della chiave API

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, priorità più alta)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad es. `<PROVIDER>_API_KEY_1`)
- Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e deduplica i valori.
- Le richieste vengono ritentate con la chiave successiva solo su risposte di rate limit (per
  esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o messaggi periodici di limite d'uso).
- I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione della chiave.
- Quando tutte le chiavi candidate falliscono, l'errore finale viene restituito dall'ultimo tentativo.

## Provider inclusi (catalogo pi-ai)

OpenClaw viene distribuito con il catalogo pi‑ai. Questi provider non richiedono
alcuna configurazione `models.providers`; basta impostare l'autenticazione + scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singolo override)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (WebSocket-first, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione con priorità OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non
  ai proxy generici compatibili con OpenAI
- I percorsi OpenAI nativi mantengono anche `store` di Responses, hint prompt-cache e
  modellazione del payload di compatibilità reasoning OpenAI; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché l'API OpenAI live lo rifiuta; Spark è trattato come solo Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singolo override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano anche il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione salvo che Anthropic pubblichi una nuova policy.
- Il setup-token Anthropic resta disponibile come percorso token supportato in OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

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
- Il transport predefinito è `auto` (WebSocket-first, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche nelle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) vengono allegati solo al traffico Codex nativo verso
  `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` resta disponibile quando il catalogo OAuth Codex lo espone; dipende dai diritti
- `openai-codex/gpt-5.4` mantiene `contextWindow = 1050000` nativo e un `contextTokens = 272000` runtime predefinito; fai override del limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.

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
- [MiniMax](/it/providers/minimax): accesso MiniMax Coding Plan OAuth o chiave API
- [GLM Models](/it/providers/glm): endpoint Z.AI Coding Plan o API generali

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

### Google Gemini (chiave API)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singolo override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione OpenClaw legacy che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; gli hit della cache Gemini emergono come `cacheRead` in OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth
- Attenzione: Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato limitazioni dell'account Google dopo aver usato client di terze parti. Consulta i termini di Google e usa un account non critico se scegli di procedere.
- Gemini CLI OAuth viene distribuito come parte del plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **non** incolli un client id o un secret in `openclaw.json`. Il flusso di login CLI memorizza
    i token nei profili auth sull'host del Gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway.
  - Le risposte JSON di Gemini CLI vengono parse da `response`; l'utilizzo usa come fallback
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
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL di base: `https://api.kilo.ai/api/gateway/`
- Il catalogo di fallback statico include `kilocode/kilo/auto`; il rilevamento live
  `https://api.kilo.ai/api/gateway/models` può ampliare ulteriormente il catalogo
  runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway,
  non codificato rigidamente in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider inclusi

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelli di esempio: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw applica gli header di attribuzione app documentati da OpenRouter solo quando
  la richiesta punta effettivamente a `openrouter.ai`
- I marker Anthropic `cache_control` specifici di OpenRouter sono analogamente limitati
  ai percorsi OpenRouter verificati, non a URL proxy arbitrari
- OpenRouter resta sul percorso compatibile OpenAI in stile proxy, quindi la modellazione
  della richiesta solo OpenAI nativa (`serviceTier`, `store` di Responses,
  hint prompt-cache, payload di compatibilità reasoning OpenAI) non viene inoltrata
- I riferimenti OpenRouter basati su Gemini mantengono solo la sanitizzazione della thought-signature Gemini via proxy;
  la validazione replay Gemini nativa e le riscritture bootstrap restano disattivate
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modello di esempio: `kilocode/kilo/auto`
- I riferimenti Kilo basati su Gemini mantengono lo stesso percorso di sanitizzazione
  della thought-signature Gemini via proxy; `kilocode/kilo/auto` e altri hint
  proxy-reasoning-non-supportato saltano l'iniezione del reasoning proxy
- MiniMax: `minimax` (chiave API) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`
- Modello di esempio: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- La configurazione di onboarding/chiave API di MiniMax scrive definizioni esplicite del modello M2.7 con
  `input: ["text", "image"]`; il catalogo del provider incluso mantiene i riferimenti chat
  solo testo finché quella configurazione provider non viene materializzata
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
  - I modelli GLM su Cerebras usano gli ID `zai-glm-4.7` e `zai-glm-4.6`.
  - URL di base compatibile OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modello di esempio per Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Vedi [Hugging Face (Inference)](/it/providers/huggingface).

## Provider tramite `models.providers` (personalizzati/base URL)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o
proxy compatibili OpenAI/Anthropic.

Molti dei Plugin provider inclusi qui sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere
URL di base, header o elenco modelli predefiniti.

### Moonshot AI (Kimi)

Moonshot viene distribuito come plugin provider incluso. Usa per impostazione predefinita il provider integrato,
e aggiungi una voce esplicita `models.providers.moonshot` solo quando hai bisogno di sovrascrivere l'URL di base o i metadati del modello:

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

Kimi Coding usa l'endpoint compatibile Anthropic di Moonshot AI:

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

Il legacy `kimi/k2p5` continua a essere accettato come ID modello di compatibilità.

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
viene registrato allo stesso tempo.

Nei selettori modello di onboarding/configurazione, la scelta auth Volcengine preferisce entrambe
le righe `volcengine/*` e `volcengine-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore
vuoto con ambito provider.

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
viene registrato allo stesso tempo.

Nei selettori modello di onboarding/configurazione, la scelta auth BytePlus preferisce entrambe
le righe `byteplus/*` e `byteplus-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore
vuoto con ambito provider.

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

Synthetic fornisce modelli compatibili Anthropic dietro il provider `synthetic`:

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
- Chiave API MiniMax (globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per dettagli di configurazione, opzioni di modello e snippet di configurazione.

Sul percorso di streaming Anthropic-compatible di MiniMax, OpenClaw disabilita il thinking per
impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capacità gestita dal plugin:

- I valori predefiniti testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01` gestita dal plugin su entrambi i percorsi auth MiniMax
- La ricerca web resta sull'ID provider `minimax`

### LM Studio

LM Studio viene distribuito come plugin provider incluso che usa l'API nativa:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL di base predefinito per l'inferenza: `http://localhost:1234/v1`

Poi imposta un modello (sostituisci con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa i percorsi nativi di LM Studio `/api/v1/models` e `/api/v1/models/load`
per rilevamento + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita.
Vedi [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama viene distribuito come plugin provider incluso e usa l'API nativa di Ollama:

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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando abiliti
`OLLAMA_API_KEY`, e il plugin provider incluso aggiunge Ollama direttamente a
`openclaw onboard` e al selettore dei modelli. Vedi [/providers/ollama](/it/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM viene distribuito come plugin provider incluso per server locali/self-hosted
compatibili OpenAI:

- Provider: `vllm`
- Auth: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:8000/v1`

Per abilitare l'auto-rilevamento locale (qualsiasi valore va bene se il tuo server non impone auth):

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

SGLang viene distribuito come plugin provider incluso per server self-hosted
compatibili OpenAI ad alte prestazioni:

- Provider: `sglang`
- Auth: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:30000/v1`

Per abilitare l'auto-rilevamento locale (qualsiasi valore va bene se il tuo server non
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

Esempio (compatibile OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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
            name: "Local Model",
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
  Se omessi, OpenClaw usa questi valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori provider 400 per ruoli `developer` non supportati.
- I percorsi compatibili OpenAI in stile proxy saltano anche la modellazione nativa delle richieste solo OpenAI:
  niente `service_tier`, niente `store` di Responses, niente hint prompt-cache, niente
  modellazione del payload di compatibilità reasoning OpenAI e niente header
  nascosti di attribuzione OpenClaw.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
- Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint non nativi `openai-completions`.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [/gateway/configuration](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Models](/it/concepts/models) — configurazione dei modelli e alias
- [Model Failover](/it/concepts/model-failover) — catene di fallback e comportamento di retry
- [Configuration Reference](/it/gateway/configuration-reference#agent-defaults) — chiavi di configurazione del modello
- [Providers](/it/providers) — guide di configurazione per provider
