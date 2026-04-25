---
read_when:
    - Ti serve un riferimento di configurazione dei modelli provider per provider
    - Vuoi esempi di configurazione o comandi di onboarding CLI per i provider di modelli
summary: Panoramica dei provider di modelli con esempi di configurazione e flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-25T13:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Riferimento per i **provider LLM/modelli** (non per i canali chat come WhatsApp/Telegram). Per le regole di selezione del modello, vedi [Modelli](/it/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- `agents.defaults.models` agisce come allowlist quando è impostato.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` è metadato nativo del modello; `contextTokens` è il limite effettivo a runtime.
- Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Failover del modello](/it/concepts/model-failover).
- Le route della famiglia OpenAI sono specifiche per prefisso: `openai/<model>` usa il provider diretto OpenAI con chiave API in PI, `openai-codex/<model>` usa OAuth Codex in PI, e `openai/<model>` più `agents.defaults.embeddedHarness.runtime: "codex"` usa l'harness app-server Codex nativo. Vedi [OpenAI](/it/providers/openai) e [Harness Codex](/it/plugins/codex-harness). Se la distinzione provider/runtime crea confusione, leggi prima [Runtime degli agenti](/it/concepts/agent-runtimes).
- L'auto-enable dei Plugin segue lo stesso confine: `openai-codex/<model>` appartiene al Plugin OpenAI, mentre il Plugin Codex viene abilitato da `embeddedHarness.runtime: "codex"` o dai riferimenti legacy `codex/<model>`.
- I runtime CLI usano la stessa distinzione: scegli riferimenti di modello canonici come `anthropic/claude-*`, `google/gemini-*` o `openai/gpt-*`, poi imposta `agents.defaults.embeddedHarness.runtime` su `claude-cli`, `google-gemini-cli` o `codex-cli` quando vuoi un backend CLI locale. I riferimenti legacy `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` vengono migrati di nuovo ai riferimenti provider canonici con il runtime registrato separatamente.
- GPT-5.5 è disponibile tramite `openai-codex/gpt-5.5` in PI, nell'harness app-server Codex nativo e nell'API pubblica OpenAI quando il catalogo PI incluso espone `openai/gpt-5.5` per la tua installazione.

## Comportamento del provider gestito dal Plugin

La maggior parte della logica specifica del provider si trova nei Plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il ciclo di inferenza generico. I Plugin gestiscono onboarding, cataloghi dei modelli, mappatura delle variabili d'ambiente di autenticazione, normalizzazione di transport/config, pulizia dello schema degli strumenti, classificazione del failover, refresh OAuth, reporting dell'utilizzo, profili di thinking/reasoning e altro.

L'elenco completo degli hook dell'SDK provider e degli esempi di Plugin inclusi si trova in [Plugin provider](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Le `capabilities` del runtime del provider sono metadati condivisi del runner (famiglia provider, peculiarità di transcript/tooling, suggerimenti transport/cache). Non sono la stessa cosa del [modello di capability pubbliche](/it/plugins/architecture#public-capability-model), che descrive ciò che un Plugin registra (inferenza testuale, voce, ecc.).
</Note>

## Rotazione delle chiavi API

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, massima priorità)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, anche `GOOGLE_API_KEY` è incluso come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e deduplica i valori.
- Le richieste vengono ritentate con la chiave successiva solo in caso di risposte di rate limit (ad esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite d'uso).
- I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
- Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Provider inclusi (catalogo pi-ai)

OpenClaw include il catalogo pi-ai. Questi provider non richiedono alcuna configurazione `models.providers`; basta impostare l'autenticazione e scegliere un modello.

### OpenAI

- Provider: `openai`
- Autenticazione: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singolo override)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Il supporto diretto via API per GPT-5.5 dipende dalla versione del catalogo PI incluso nella tua installazione; verifica con `openclaw models list --provider openai` prima di usare `openai/gpt-5.5` senza il runtime app-server Codex.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche `store` di Responses, suggerimenti per la cache del prompt e payload shaping di compatibilità reasoning OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché le richieste live all'API OpenAI lo rifiutano e l'attuale catalogo Codex non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Autenticazione: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singolo override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste pubbliche dirette ad Anthropic supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota su Anthropic: il personale Anthropic ci ha detto che l'uso in stile OpenClaw di Claude CLI è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione, salvo che Anthropic pubblichi una nuova policy.
- Il setup-token Anthropic resta disponibile come percorso token supportato da OpenClaw, ma ora OpenClaw preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Autenticazione: OAuth (ChatGPT)
- Riferimento modello PI: `openai-codex/gpt-5.5`
- Riferimento harness app-server Codex nativo: `openai/gpt-5.5` con `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentazione dell'harness app-server Codex nativo: [Harness Codex](/it/plugins/codex-harness)
- Riferimenti modello legacy: `codex/gpt-*`
- Confine del Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin app-server Codex nativo viene selezionato solo dal runtime dell'harness Codex o dai riferimenti legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche nelle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) vengono allegati solo al traffico Codex nativo verso `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.5` usa il `contextWindow = 400000` nativo del catalogo Codex e il valore predefinito runtime `contextTokens = 272000`; sovrascrivi il limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- Usa `openai-codex/gpt-5.5` quando vuoi la route Codex OAuth/abbonamento; usa `openai/gpt-5.5` quando la tua configurazione con chiave API e il catalogo locale espongono la route API pubblica.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni hosted in stile abbonamento

- [Qwen Cloud](/it/providers/qwen): superficie provider Qwen Cloud più mapping degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/it/providers/minimax): accesso OAuth o API key MiniMax Coding Plan
- [Modelli GLM](/it/providers/glm): endpoint Z.AI Coding Plan o API generiche

### OpenCode

- Autenticazione: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chiave API)

- Provider: `google`
- Autenticazione: `GEMINI_API_KEY`
- Rotazione opzionale: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singolo override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il thinking dinamico di Google. Gemini 3/3.1 omette un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del provider `cachedContents/...`; gli hit della cache Gemini vengono esposti come OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Autenticazione: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth
- Attenzione: OAuth Gemini CLI in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni sugli account Google dopo l'uso di client di terze parti. Controlla i termini di Google e usa un account non critico se scegli di procedere.
- OAuth Gemini CLI viene distribuito come parte del Plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **non** devi incollare un client id o un secret in `openclaw.json`. Il flusso di login CLI memorizza i token nei profili di autenticazione sull'host gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway.
  - Le risposte JSON Gemini CLI vengono analizzate da `response`; l'utilizzo usa `stats` come fallback, con `stats.cached` normalizzato in OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Autenticazione: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati a `zai/*`
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Autenticazione: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Autenticazione: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; il rilevamento live da `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo runtime.
- L'instradamento upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway, non codificato in modo statico in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider inclusi

| Provider                | ID                               | Env di autenticazione                                        | Modello di esempio                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                  |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                           |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                                |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                     |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                                |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                                |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`            |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                             |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-code`                                 |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                           |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                   |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                             |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`  |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                                |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                          |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                              |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                         |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                  |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                                |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`    |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`                |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                     |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                           |

Particolarità da conoscere:

- **OpenRouter** applica gli header di attribuzione dell'app e i marker Anthropic `cache_control` solo sulle route verificate `openrouter.ai`. I riferimenti DeepSeek, Moonshot e ZAI sono idonei al TTL della cache per il prompt caching gestito da OpenRouter, ma non ricevono marker di cache Anthropic. Come percorso in stile proxy compatibile con OpenAI, salta il payload shaping solo nativo OpenAI (`serviceTier`, `store` di Responses, suggerimenti per la cache del prompt, compatibilità reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanitizzazione della thought-signature proxy-Gemini.
- **Kilo Gateway**: i riferimenti basati su Gemini seguono lo stesso percorso di sanitizzazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy senza supporto al reasoning saltano l'iniezione del reasoning proxy.
- **MiniMax**: l'onboarding con chiave API scrive definizioni esplicite del modello chat M2.7 solo testo; la comprensione delle immagini resta sul provider media `MiniMax-VL-01` gestito dal Plugin.
- **xAI** usa il percorso xAI Responses. `/fast` o `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disabilitalo con `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**: i modelli GLM usano `zai-glm-4.7` / `zai-glm-4.6`; l'URL base compatibile con OpenAI è `https://api.cerebras.ai/v1`.

## Provider tramite `models.providers` (custom/URL base)

Usa `models.providers` (o `models.json`) per aggiungere provider **custom** o proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi qui sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere URL base, header o elenco dei modelli predefiniti.

### Moonshot AI (Kimi)

Moonshot è distribuito come Plugin provider incluso. Usa il provider integrato per impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando hai bisogno di sovrascrivere l'URL base o i metadati del modello:

- Provider: `moonshot`
- Autenticazione: `MOONSHOT_API_KEY`
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
- Autenticazione: `KIMI_API_KEY`
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
- Autenticazione: `VOLCANO_ENGINE_API_KEY`
- Modello di esempio: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa come predefinita la superficie coding, ma il catalogo generale `volcengine/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta di autenticazione Volcengine preferisce sia le righe `volcengine/*` sia `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw torna al catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

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

### BytePlus (Internazionale)

BytePlus ARK fornisce accesso agli stessi modelli di Volcano Engine per gli utenti internazionali.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Autenticazione: `BYTEPLUS_API_KEY`
- Modello di esempio: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa come predefinita la superficie coding, ma il catalogo generale `byteplus/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta di autenticazione BytePlus preferisce sia le righe `byteplus/*` sia `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw torna al catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

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
- Autenticazione: `SYNTHETIC_API_KEY`
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

MiniMax è configurato tramite `models.providers` perché usa endpoint personalizzati:

- MiniMax OAuth (Globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (Globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticazione: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` oppure `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il thinking per impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capability gestita dal Plugin:

- I valori predefiniti per testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, gestita dal Plugin, su entrambi i percorsi di autenticazione MiniMax
- La ricerca web resta sul provider ID `minimax`

### LM Studio

LM Studio è distribuito come Plugin provider incluso che usa l'API nativa:

- Provider: `lmstudio`
- Autenticazione: `LM_API_TOKEN`
- URL base di inferenza predefinito: `http://localhost:1234/v1`

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa i percorsi nativi di LM Studio `/api/v1/models` e `/api/v1/models/load` per discovery + auto-load, con `/v1/chat/completions` per l'inferenza per impostazione predefinita.
Vedi [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama è distribuito come Plugin provider incluso e usa l'API nativa di Ollama:

- Provider: `ollama`
- Autenticazione: nessuna richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando fai opt-in con
`OLLAMA_API_KEY`, e il Plugin provider incluso aggiunge Ollama direttamente a
`openclaw onboard` e al selettore dei modelli. Vedi [/providers/ollama](/it/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come Plugin provider incluso per server compatibili con OpenAI locali/self-hosted:

- Provider: `vllm`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per fare opt-in all'auto-discovery in locale (qualsiasi valore funziona se il tuo server non impone autenticazione):

```bash
export VLLM_API_KEY="vllm-local"
```

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang è distribuito come Plugin provider incluso per server compatibili con OpenAI self-hosted ad alte prestazioni:

- Provider: `sglang`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per fare opt-in all'auto-discovery in locale (qualsiasi valore funziona se il tuo server non impone autenticazione):

```bash
export SGLANG_API_KEY="sglang-local"
```

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

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
  Se omessi, OpenClaw usa questi valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider per ruoli `developer` non supportati.
- Le route in stile proxy compatibili con OpenAI saltano anche il payload shaping solo nativo OpenAI: niente `service_tier`, niente `store` di Responses, niente `store` di Completions, niente suggerimenti per la cache del prompt, niente payload shaping di compatibilità reasoning OpenAI e niente header nascosti di attribuzione OpenClaw.
- Per i proxy Completions compatibili con OpenAI che richiedono campi specifici del vendor, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per unire JSON aggiuntivo nel corpo della richiesta in uscita.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento predefinito OpenAI (che viene risolto in `api.openai.com`).
- Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto su endpoint `openai-completions` non nativi.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [Configurazione](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Modelli](/it/concepts/models) — configurazione dei modelli e alias
- [Failover del modello](/it/concepts/model-failover) — catene di fallback e comportamento dei retry
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
- [Provider](/it/providers) — guide di configurazione per singolo provider
