---
read_when:
    - Necesitas una referencia de configuración de modelos proveedor por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación de CLI para proveedores de modelos
summary: Descripción general del proveedor de modelos con configuraciones de ejemplo y flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-04-25T13:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Referencia de **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram). Para las reglas de selección de modelos, consulta [Models](/es/concepts/models).

## Reglas rápidas

- Las referencias de modelo usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
- `agents.defaults.models` actúa como lista de permitidos cuando está configurado.
- Helpers de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` es metadato nativo del modelo; `contextTokens` es el límite efectivo de runtime.
- Reglas de respaldo, sondeos de enfriamiento y persistencia de anulaciones por sesión: [Model failover](/es/concepts/model-failover).
- Las rutas de la familia OpenAI son específicas por prefijo: `openai/<model>` usa el proveedor directo con clave API de OpenAI en PI, `openai-codex/<model>` usa OAuth de Codex en PI, y `openai/<model>` más `agents.defaults.embeddedHarness.runtime: "codex"` usa el arnés nativo del servidor de aplicaciones Codex. Consulta [OpenAI](/es/providers/openai) y [Codex harness](/es/plugins/codex-harness). Si la separación entre proveedor y runtime resulta confusa, lee primero [Agent runtimes](/es/concepts/agent-runtimes).
- La autoactivación de Plugins sigue ese mismo límite: `openai-codex/<model>` pertenece al Plugin de OpenAI, mientras que el Plugin de Codex se habilita mediante `embeddedHarness.runtime: "codex"` o referencias heredadas `codex/<model>`.
- Los runtimes de CLI usan la misma separación: elige referencias canónicas de modelo como `anthropic/claude-*`, `google/gemini-*` u `openai/gpt-*`, y luego configura `agents.defaults.embeddedHarness.runtime` en `claude-cli`, `google-gemini-cli` o `codex-cli` cuando quieras un backend local de CLI. Las referencias heredadas `claude-cli/*`, `google-gemini-cli/*` y `codex-cli/*` se migran de vuelta a referencias canónicas de proveedor con el runtime registrado por separado.
- GPT-5.5 está disponible mediante `openai-codex/gpt-5.5` en PI, el arnés nativo del servidor de aplicaciones Codex y la API pública de OpenAI cuando el catálogo PI incluido expone `openai/gpt-5.5` para tu instalación.

## Comportamiento del proveedor gestionado por Plugins

La mayor parte de la lógica específica de proveedores vive en Plugins de proveedor (`registerProvider(...)`), mientras OpenClaw mantiene el bucle genérico de inferencia. Los Plugins se encargan de la incorporación, los catálogos de modelos, el mapeo de variables de entorno de autenticación, la normalización de transporte/configuración, la limpieza de esquemas de herramientas, la clasificación de failover, la renovación de OAuth, los informes de uso, los perfiles de pensamiento/razonamiento y más.

La lista completa de hooks del SDK de proveedores y ejemplos de Plugins incluidos está en [Provider plugins](/es/plugins/sdk-provider-plugins). Un proveedor que necesite un ejecutor de solicitudes totalmente personalizado pertenece a una superficie de extensión distinta y más profunda.

<Note>
Las `capabilities` del runtime del proveedor son metadatos compartidos del ejecutor (familia de proveedor, particularidades de transcripciones/herramientas, sugerencias de transporte/caché). No es lo mismo que el [modelo público de capacidades](/es/plugins/architecture#public-capability-model), que describe qué registra un Plugin (inferencia de texto, voz, etc.).
</Note>

## Rotación de claves API

- Admite rotación genérica de proveedores para proveedores seleccionados.
- Configura varias claves mediante:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (una sola anulación activa, máxima prioridad)
  - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
  - `<PROVIDER>_API_KEY` (clave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)
- Para proveedores de Google, también se incluye `GOOGLE_API_KEY` como respaldo.
- El orden de selección de claves conserva la prioridad y elimina valores duplicados.
- Las solicitudes se reintentan con la siguiente clave solo en respuestas de límite de tasa (por ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
- Los fallos que no son de límite de tasa fallan inmediatamente; no se intenta rotación de claves.
- Cuando fallan todas las claves candidatas, se devuelve el error final del último intento.

## Proveedores integrados (catálogo pi-ai)

OpenClaw incluye el catálogo pi‑ai. Estos proveedores **no** requieren configuración en `models.providers`; solo configura la autenticación y elige un modelo.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, además de `OPENCLAW_LIVE_OPENAI_KEY` (una sola anulación)
- Modelos de ejemplo: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- La compatibilidad directa de la API con GPT-5.5 depende de la versión del catálogo PI incluido en tu instalación; verifícalo con `openclaw models list --provider openai` antes de usar `openai/gpt-5.5` sin el runtime del servidor de aplicaciones Codex.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto` (prioriza WebSocket, con respaldo SSE)
- Anulación por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El precalentamiento de WebSocket de OpenAI Responses está habilitado de forma predeterminada mediante `params.openaiWsWarmup` (`true`/`false`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes directas de Responses `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del selector compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) se aplican solo al tráfico nativo de OpenAI hacia `api.openai.com`, no a proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, sugerencias de caché de prompts y el modelado de carga útil de compatibilidad de razonamiento de OpenAI; las rutas proxy no
- `openai/gpt-5.3-codex-spark` está intencionalmente suprimido en OpenClaw porque las solicitudes activas a la API de OpenAI lo rechazan y el catálogo actual de Codex no lo expone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, además de `OPENCLAW_LIVE_ANTHROPIC_KEY` (una sola anulación)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes directas públicas a Anthropic admiten el selector compartido `/fast` y `params.fastMode`, incluido tráfico autenticado con clave API y OAuth enviado a `api.anthropic.com`; OpenClaw lo asigna a Anthropic `service_tier` (`auto` frente a `standard_only`)
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw vuelve a estar permitido, por lo que OpenClaw considera que reutilizar Claude CLI y el uso de `claude -p` están autorizados para esta integración salvo que Anthropic publique una nueva política.
- El token de configuración de Anthropic sigue disponible como ruta de token compatible en OpenClaw, pero OpenClaw ahora prefiere reutilizar Claude CLI y `claude -p` cuando están disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Proveedor: `openai-codex`
- Autenticación: OAuth (ChatGPT)
- Referencia de modelo PI: `openai-codex/gpt-5.5`
- Referencia del arnés nativo del servidor de aplicaciones Codex: `openai/gpt-5.5` con `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentación del arnés nativo del servidor de aplicaciones Codex: [Codex harness](/es/plugins/codex-harness)
- Referencias de modelo heredadas: `codex/gpt-*`
- Límite de Plugin: `openai-codex/*` carga el Plugin de OpenAI; el Plugin nativo del servidor de aplicaciones Codex se selecciona solo mediante el runtime de Codex harness o referencias heredadas `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- El transporte predeterminado es `auto` (prioriza WebSocket, con respaldo SSE)
- Anulación por modelo PI mediante `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas de Codex Responses (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`, `User-Agent`) solo se adjuntan en tráfico nativo de Codex hacia `chatgpt.com/backend-api`, no a proxies genéricos compatibles con OpenAI
- Comparte el mismo selector `/fast` y la configuración `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai-codex/gpt-5.5` usa el `contextWindow = 400000` nativo del catálogo Codex y el runtime predeterminado `contextTokens = 272000`; anula el límite de runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth es explícitamente compatible para herramientas/flujos de trabajo externos como OpenClaw.
- Usa `openai-codex/gpt-5.5` cuando quieras la ruta de OAuth/suscripción de Codex; usa `openai/gpt-5.5` cuando tu configuración con clave API y tu catálogo local expongan la ruta de la API pública.

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

### Otras opciones alojadas de estilo suscripción

- [Qwen Cloud](/es/providers/qwen): superficie del proveedor Qwen Cloud más mapeo de endpoints de Alibaba DashScope y Coding Plan
- [MiniMax](/es/providers/minimax): acceso con OAuth o clave API de MiniMax Coding Plan
- [GLM models](/es/providers/glm): endpoints de Z.AI Coding Plan o API general

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor del runtime Zen: `opencode`
- Proveedor del runtime Go: `opencode-go`
- Modelos de ejemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clave API)

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY`
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, respaldo `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (una sola anulación)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw que usa `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Pensamiento: `/think adaptive` usa pensamiento dinámico de Google. Gemini 3/3.1 omite un `thinkingLevel` fijo; Gemini 2.5 envía `thinkingBudget: -1`.
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent` (o el heredado `cached_content`) para reenviar un handle nativo del proveedor `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` en OpenClaw

### Google Vertex y Gemini CLI

- Proveedores: `google-vertex`, `google-gemini-cli`
- Autenticación: Vertex usa gcloud ADC; Gemini CLI usa su flujo OAuth
- Precaución: OAuth de Gemini CLI en OpenClaw es una integración no oficial. Algunos usuarios han informado restricciones en cuentas de Google tras usar clientes de terceros. Revisa los términos de Google y usa una cuenta no crítica si decides continuar.
- Gemini CLI OAuth se distribuye como parte del Plugin `google` incluido.
  - Instala primero Gemini CLI:
    - `brew install gemini-cli`
    - o `npm install -g @google/gemini-cli`
  - Habilita: `openclaw plugins enable google`
  - Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo predeterminado: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **no** pegas un client id ni un secret en `openclaw.json`. El flujo de inicio de sesión de CLI almacena tokens en perfiles de autenticación en el host del gateway.
  - Si las solicitudes fallan después de iniciar sesión, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway.
  - Las respuestas JSON de Gemini CLI se analizan desde `response`; el uso recurre a `stats`, con `stats.cached` normalizado como `cacheRead` en OpenClaw.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` y `z-ai/*` se normalizan a `zai/*`
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelos de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Proveedor: `kilocode`
- Autenticación: `KILOCODE_API_KEY`
- Modelo de ejemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- El catálogo estático de respaldo incluye `kilocode/kilo/auto`; el descubrimiento activo en
  `https://api.kilo.ai/api/gateway/models` puede ampliar aún más el catálogo de runtime.
- El enrutamiento exacto aguas arriba detrás de `kilocode/kilo/auto` es propiedad de Kilo Gateway,
  no está codificado de forma fija en OpenClaw.

Consulta [/providers/kilocode](/es/providers/kilocode) para ver los detalles de configuración.

### Otros Plugins de proveedor incluidos

| Provider                | Id                               | Variable de entorno de autenticación                         | Modelo de ejemplo                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Particularidades que conviene conocer:

- **OpenRouter** aplica sus encabezados de atribución de aplicación y los marcadores `cache_control` de Anthropic solo en rutas verificadas de `openrouter.ai`. Las referencias de DeepSeek, Moonshot y ZAI pueden usar TTL de caché para el almacenamiento en caché de prompts administrado por OpenRouter, pero no reciben marcadores de caché de Anthropic. Como ruta estilo proxy compatible con OpenAI, omite el modelado exclusivo de OpenAI nativo (`serviceTier`, `store` de Responses, sugerencias de caché de prompts, compatibilidad de razonamiento de OpenAI). Las referencias respaldadas por Gemini mantienen solo el saneamiento de firmas de pensamiento de proxy-Gemini.
- **Kilo Gateway**: las referencias respaldadas por Gemini siguen la misma ruta de saneamiento de proxy-Gemini; `kilocode/kilo/auto` y otras referencias proxy sin compatibilidad con razonamiento omiten la inyección de razonamiento de proxy.
- **MiniMax**: la incorporación con clave API escribe definiciones explícitas de modelos de chat M2.7 solo de texto; la comprensión de imágenes sigue en el proveedor multimedia `MiniMax-VL-01` gestionado por Plugin.
- **xAI** usa la ruta de xAI Responses. `/fast` o `params.fastMode: true` reescriben `grok-3`, `grok-3-mini`, `grok-4` y `grok-4-0709` a sus variantes `*-fast`. `tool_stream` está activado de forma predeterminada; desactívalo mediante `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**: los modelos GLM usan `zai-glm-4.7` / `zai-glm-4.6`; la URL base compatible con OpenAI es `https://api.cerebras.ai/v1`.

## Proveedores mediante `models.providers` (personalizado/URL base)

Usa `models.providers` (o `models.json`) para añadir proveedores **personalizados** o proxies compatibles con OpenAI/Anthropic.

Muchos de los Plugins de proveedor incluidos a continuación ya publican un catálogo predeterminado.
Usa entradas explícitas `models.providers.<id>` solo cuando quieras sobrescribir la URL base, los encabezados o la lista de modelos predeterminados.

### Moonshot AI (Kimi)

Moonshot se distribuye como Plugin de proveedor incluido. Usa el proveedor integrado de forma predeterminada y añade una entrada explícita `models.providers.moonshot` solo cuando necesites sobrescribir la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

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

Kimi Coding usa el endpoint compatible con Anthropic de Moonshot AI:

- Proveedor: `kimi`
- Autenticación: `KIMI_API_KEY`
- Modelo de ejemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

El ID de modelo heredado `kimi/k2p5` sigue aceptándose por compatibilidad.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) proporciona acceso a Doubao y otros modelos en China.

- Proveedor: `volcengine` (coding: `volcengine-plan`)
- Autenticación: `VOLCANO_ENGINE_API_KEY`
- Modelo de ejemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

La incorporación usa por defecto la superficie de coding, pero el catálogo general `volcengine/*`
se registra al mismo tiempo.

En los selectores de incorporación/configuración de modelos, la opción de autenticación de Volcengine prefiere tanto las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos todavía no están cargados, OpenClaw usa como respaldo el catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

Modelos disponibles:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internacional)

BytePlus ARK proporciona acceso a los mismos modelos que Volcano Engine para usuarios internacionales.

- Proveedor: `byteplus` (coding: `byteplus-plan`)
- Autenticación: `BYTEPLUS_API_KEY`
- Modelo de ejemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

La incorporación usa por defecto la superficie de coding, pero el catálogo general `byteplus/*`
se registra al mismo tiempo.

En los selectores de incorporación/configuración de modelos, la opción de autenticación de BytePlus prefiere tanto las filas `byteplus/*` como `byteplus-plan/*`. Si esos modelos todavía no están cargados, OpenClaw usa como respaldo el catálogo sin filtrar en lugar de mostrar un selector vacío limitado al proveedor.

Modelos disponibles:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic proporciona modelos compatibles con Anthropic detrás del proveedor `synthetic`:

- Proveedor: `synthetic`
- Autenticación: `SYNTHETIC_API_KEY`
- Modelo de ejemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax se configura mediante `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Clave API de MiniMax (global): `--auth-choice minimax-global-api`
- Clave API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para ver detalles de configuración, opciones de modelos y fragmentos de configuración.

En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva el pensamiento de forma predeterminada a menos que lo configures explícitamente, y `/fast on` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.

Separación de capacidades gestionada por Plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M2.7`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes usa `MiniMax-VL-01`, gestionado por Plugin, en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el ID de proveedor `minimax`

### LM Studio

LM Studio se distribuye como un Plugin de proveedor incluido que usa la API nativa:

- Proveedor: `lmstudio`
- Autenticación: `LM_API_TOKEN`
- URL base predeterminada de inferencia: `http://localhost:1234/v1`

Luego configura un modelo (sustituye por uno de los ID devueltos por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` y `/api/v1/models/load` nativos de LM Studio para descubrimiento + carga automática, con `/v1/chat/completions` para inferencia de forma predeterminada.
Consulta [/providers/lmstudio](/es/providers/lmstudio) para ver configuración y solución de problemas.

### Ollama

Ollama se distribuye como un Plugin de proveedor incluido y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: no se requiere (servidor local)
- Modelo de ejemplo: `ollama/llama3.3`
- Instalación: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instala Ollama y luego descarga un modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando habilitas esta opción con `OLLAMA_API_KEY`, y el Plugin de proveedor incluido añade Ollama directamente a `openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama) para ver incorporación, modo local/en la nube y configuración personalizada.

### vLLM

vLLM se distribuye como un Plugin de proveedor incluido para servidores locales/autohospedados compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para habilitar el descubrimiento automático localmente (cualquier valor sirve si tu servidor no exige autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Luego configura un modelo (sustituye por uno de los ID devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para más detalles.

### SGLang

SGLang se distribuye como un Plugin de proveedor incluido para servidores rápidos autohospedados compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para habilitar el descubrimiento automático localmente (cualquier valor sirve si tu servidor no exige autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Luego configura un modelo (sustituye por uno de los ID devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulta [/providers/sglang](/es/providers/sglang) para más detalles.

### Proxies locales (LM Studio, vLLM, LiteLLM, etc.)

Ejemplo (compatible con OpenAI):

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

Notas:

- Para proveedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` y `maxTokens` son opcionales.
  Cuando se omiten, OpenClaw usa de forma predeterminada:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: configura valores explícitos que coincidan con los límites de tu proxy/modelo.
- Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no compatibles.
- Las rutas estilo proxy compatibles con OpenAI también omiten el modelado de solicitudes exclusivo de OpenAI nativo: sin `service_tier`, sin `store` de Responses, sin `store` de Completions, sin sugerencias de caché de prompts, sin modelado de carga útil de compatibilidad de razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
- Para proxies de Completions compatibles con OpenAI que necesiten campos específicos del proveedor, configura `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) para combinar JSON adicional en el cuerpo de la solicitud saliente.
- Si `baseUrl` está vacío o se omite, OpenClaw conserva el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
- Por seguridad, un `compat.supportsDeveloperRole: true` explícito sigue siendo sobrescrito en endpoints no nativos `openai-completions`.

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta también: [Configuration](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Relacionado

- [Models](/es/concepts/models) — configuración de modelos y alias
- [Model failover](/es/concepts/model-failover) — cadenas de respaldo y comportamiento de reintentos
- [Configuration reference](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
- [Providers](/es/providers) — guías de configuración por proveedor
