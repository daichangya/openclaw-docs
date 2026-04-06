---
read_when:
    - Necesitas una referencia de configuración de modelos proveedor por proveedor
    - Quieres configuraciones de ejemplo o comandos de incorporación por CLI para proveedores de modelos
summary: Descripción general de proveedores de modelos con configuraciones de ejemplo y flujos de CLI
title: Proveedores de modelos
x-i18n:
    generated_at: "2026-04-06T03:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e4b82e07221018a723279d309e245bb4023bc06e64b3c910ef2cae3dfa2599
    source_path: concepts/model-providers.md
    workflow: 15
---

# Proveedores de modelos

Esta página cubre los **proveedores de LLM/modelos** (no canales de chat como WhatsApp/Telegram).
Para las reglas de selección de modelos, consulta [/concepts/models](/es/concepts/models).

## Reglas rápidas

- Las referencias de modelo usan `provider/model` (ejemplo: `opencode/claude-opus-4-6`).
- Si estableces `agents.defaults.models`, se convierte en la lista permitida.
- Ayudantes de CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Las reglas de fallback en tiempo de ejecución, las sondas de enfriamiento y la persistencia de anulaciones por sesión están
  documentadas en [/concepts/model-failover](/es/concepts/model-failover).
- `models.providers.*.models[].contextWindow` son metadatos nativos del modelo;
  `models.providers.*.models[].contextTokens` es el límite efectivo en tiempo de ejecución.
- Los plugins de proveedores pueden inyectar catálogos de modelos mediante `registerProvider({ catalog })`;
  OpenClaw fusiona esa salida en `models.providers` antes de escribir
  `models.json`.
- Los manifiestos de proveedores pueden declarar `providerAuthEnvVars` para que las
  sondas genéricas de autenticación basadas en variables de entorno no necesiten cargar el tiempo de ejecución del plugin. El mapa restante de variables de entorno del núcleo
  ahora es solo para proveedores no basados en plugins/del núcleo y algunos casos de precedencia genérica, como la incorporación de Anthropic con prioridad de clave API.
- Los plugins de proveedores también pueden encargarse del comportamiento del proveedor en tiempo de ejecución mediante
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
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`.
- Nota: `capabilities` del tiempo de ejecución del proveedor son metadatos compartidos del ejecutor (familia del proveedor, peculiaridades de transcripciones/herramientas, sugerencias de transporte/caché). No es lo
  mismo que el [modelo público de capacidades](/es/plugins/architecture#public-capability-model),
  que describe lo que registra un plugin (inferencia de texto, voz, etc.).

## Comportamiento del proveedor gestionado por el plugin

Los plugins de proveedores ahora pueden encargarse de la mayor parte de la lógica específica del proveedor, mientras OpenClaw mantiene
el bucle de inferencia genérico.

División típica:

- `auth[].run` / `auth[].runNonInteractive`: el proveedor se encarga de los flujos de incorporación/inicio de sesión para `openclaw onboard`, `openclaw models auth` y la configuración sin interfaz
- `wizard.setup` / `wizard.modelPicker`: el proveedor se encarga de las etiquetas de elección de autenticación,
  alias heredados, sugerencias de lista permitida para incorporación y entradas de configuración en los selectores de incorporación/modelos
- `catalog`: el proveedor aparece en `models.providers`
- `normalizeModelId`: el proveedor normaliza IDs de modelo heredados/de vista previa antes de
  la búsqueda o canonicalización
- `normalizeTransport`: el proveedor normaliza `api` / `baseUrl` de la familia de transporte
  antes del ensamblaje genérico del modelo; OpenClaw comprueba primero el proveedor coincidente,
  luego otros plugins de proveedor con capacidad de hook hasta que uno realmente cambie el
  transporte
- `normalizeConfig`: el proveedor normaliza la configuración `models.providers.<id>` antes de
  que el tiempo de ejecución la use; OpenClaw comprueba primero el proveedor coincidente, luego otros
  plugins de proveedor con capacidad de hook hasta que uno realmente cambie la configuración. Si ningún
  hook de proveedor reescribe la configuración, los ayudantes incluidos de la familia Google siguen
  normalizando las entradas de proveedor Google compatibles.
- `applyNativeStreamingUsageCompat`: el proveedor aplica reescrituras de compatibilidad de uso de streaming nativo impulsadas por endpoints para proveedores de configuración
- `resolveConfigApiKey`: el proveedor resuelve autenticación con marcadores de entorno para proveedores de configuración
  sin forzar la carga completa de la autenticación en tiempo de ejecución. `amazon-bedrock` también tiene un
  resolvedor integrado de marcadores de entorno de AWS aquí, aunque la autenticación en tiempo de ejecución de Bedrock usa
  la cadena predeterminada del SDK de AWS.
- `resolveSyntheticAuth`: el proveedor puede exponer disponibilidad de autenticación local/autohospedada u otra
  autenticación respaldada por configuración sin persistir secretos en texto plano
- `shouldDeferSyntheticProfileAuth`: el proveedor puede marcar marcadores de posición de perfiles sintéticos almacenados
  como de menor precedencia que la autenticación respaldada por entorno/configuración
- `resolveDynamicModel`: el proveedor acepta IDs de modelo que todavía no están presentes en el
  catálogo estático local
- `prepareDynamicModel`: el proveedor necesita una actualización de metadatos antes de reintentar
  la resolución dinámica
- `normalizeResolvedModel`: el proveedor necesita reescrituras de transporte o URL base
- `contributeResolvedModelCompat`: el proveedor aporta indicadores de compatibilidad para sus
  modelos del proveedor incluso cuando llegan a través de otro transporte compatible
- `capabilities`: el proveedor publica peculiaridades de transcripciones/herramientas/familia de proveedor
- `normalizeToolSchemas`: el proveedor limpia esquemas de herramientas antes de que el
  ejecutor integrado los vea
- `inspectToolSchemas`: el proveedor muestra advertencias de esquema específicas del transporte
  tras la normalización
- `resolveReasoningOutputMode`: el proveedor elige contratos nativos frente a etiquetados
  para la salida de razonamiento
- `prepareExtraParams`: el proveedor aplica valores predeterminados o normaliza parámetros de solicitud por modelo
- `createStreamFn`: el proveedor reemplaza la ruta normal de streaming por un
  transporte completamente personalizado
- `wrapStreamFn`: el proveedor aplica envolturas de compatibilidad de encabezados/cuerpo/modelo a las solicitudes
- `resolveTransportTurnState`: el proveedor suministra encabezados o metadatos
  nativos de transporte por turno
- `resolveWebSocketSessionPolicy`: el proveedor suministra encabezados de sesión WebSocket nativos
  o una política de enfriamiento de sesión
- `createEmbeddingProvider`: el proveedor se encarga del comportamiento de embeddings de memoria cuando
  pertenece al plugin del proveedor en lugar del conmutador central de embeddings del núcleo
- `formatApiKey`: el proveedor da formato a perfiles de autenticación almacenados en la cadena
  `apiKey` esperada por el transporte en tiempo de ejecución
- `refreshOAuth`: el proveedor se encarga de la actualización de OAuth cuando los
  actualizadores compartidos de `pi-ai` no son suficientes
- `buildAuthDoctorHint`: el proveedor añade orientación de reparación cuando falla la actualización de OAuth
- `matchesContextOverflowError`: el proveedor reconoce errores de desbordamiento de ventana de contexto
  específicos del proveedor que las heurísticas genéricas pasarían por alto
- `classifyFailoverReason`: el proveedor asigna errores sin procesar específicos del proveedor de transporte/API
  a motivos de failover como límite de tasa o sobrecarga
- `isCacheTtlEligible`: el proveedor decide qué IDs de modelo upstream admiten TTL de caché de prompts
- `buildMissingAuthMessage`: el proveedor reemplaza el error genérico del almacén de autenticación
  por una sugerencia de recuperación específica del proveedor
- `suppressBuiltInModel`: el proveedor oculta filas upstream obsoletas y puede devolver un
  error gestionado por el proveedor para fallos de resolución directa
- `augmentModelCatalog`: el proveedor añade filas sintéticas/finales al catálogo después
  del descubrimiento y la fusión de configuración
- `isBinaryThinking`: el proveedor se encarga de la experiencia de usuario de thinking binario activado/desactivado
- `supportsXHighThinking`: el proveedor habilita `xhigh` para modelos seleccionados
- `resolveDefaultThinkingLevel`: el proveedor se encarga de la política predeterminada de `/think` para una
  familia de modelos
- `applyConfigDefaults`: el proveedor aplica valores predeterminados globales específicos del proveedor
  durante la materialización de la configuración en función del modo de autenticación, el entorno o la familia de modelos
- `isModernModelRef`: el proveedor se encarga de la coincidencia de modelos preferidos para live/smoke
- `prepareRuntimeAuth`: el proveedor convierte una credencial configurada en un token de tiempo de ejecución
  de corta duración
- `resolveUsageAuth`: el proveedor resuelve credenciales de uso/cuota para `/usage`
  y superficies relacionadas de estado/informes
- `fetchUsageSnapshot`: el proveedor se encarga de obtener/analizar el endpoint de uso mientras
  el núcleo sigue encargándose del contenedor de resumen y el formato
- `onModelSelected`: el proveedor ejecuta efectos secundarios posteriores a la selección, como
  telemetría o contabilidad de sesión gestionada por el proveedor

Ejemplos incluidos actualmente:

- `anthropic`: fallback de compatibilidad futura de Claude 4.6, sugerencias de reparación de autenticación, obtención de datos del endpoint de uso, metadatos de TTL de caché/familia de proveedor y valores predeterminados globales
  conscientes de la autenticación
- `amazon-bedrock`: coincidencia de desbordamiento de contexto gestionada por el proveedor y clasificación de
  motivos de failover para errores específicos de Bedrock de limitación/no listo, además
  de la familia compartida de reproducción `anthropic-by-model` para protecciones
  de política de reproducción solo para Claude en tráfico de Anthropic
- `anthropic-vertex`: protecciones de política de reproducción solo para Claude en tráfico
  de mensajes Anthropic
- `openrouter`: IDs de modelo de paso directo, envolturas de solicitudes, sugerencias de capacidades del proveedor, saneamiento de firmas de pensamiento de Gemini en tráfico proxy de Gemini, inyección de razonamiento por proxy a través de la familia de stream `openrouter-thinking`, reenvío de metadatos de enrutamiento y política de TTL de caché
- `github-copilot`: incorporación/inicio de sesión por dispositivo, fallback de modelo de compatibilidad futura,
  sugerencias de transcripción para thinking de Claude, intercambio de tokens en tiempo de ejecución y obtención del endpoint de uso
- `openai`: fallback de compatibilidad futura de GPT-5.4, normalización directa del transporte OpenAI,
  sugerencias de autenticación faltante conscientes de Codex, supresión de Spark, filas sintéticas del catálogo de OpenAI/Codex, política de thinking/modelo live, normalización de alias de tokens de uso (`input` / `output` y familias `prompt` / `completion`), la familia compartida de stream `openai-responses-defaults` para envolturas nativas de OpenAI/Codex, metadatos de familia de proveedor, registro incluido de proveedor de generación de imágenes para `gpt-image-1` y registro incluido de proveedor de generación de video
  para `sora-2`
- `google`: fallback de compatibilidad futura de Gemini 3.1, validación de reproducción nativa de Gemini, saneamiento de reproducción de bootstrap, modo de salida de razonamiento etiquetado,
  coincidencia de modelos modernos, registro incluido de proveedor de generación de imágenes para
  modelos Gemini image-preview y registro incluido de proveedor de generación de video
  para modelos Veo
- `moonshot`: transporte compartido, normalización de payload de thinking gestionada por el plugin
- `kilocode`: transporte compartido, encabezados de solicitud gestionados por el plugin, normalización de payload
  de razonamiento, saneamiento de firmas de pensamiento de proxy-Gemini y política de TTL de caché
- `zai`: fallback de compatibilidad futura de GLM-5, valores predeterminados de `tool_stream`, política de TTL de caché, política de thinking binario/modelo live y autenticación de uso + obtención de cuota;
  los IDs desconocidos `glm-5*` se sintetizan a partir de la plantilla incluida `glm-4.7`
- `xai`: normalización nativa del transporte Responses, reescrituras de alias `/fast` para
  variantes rápidas de Grok, `tool_stream` predeterminado, limpieza específica de xAI de esquemas de herramientas /
  payload de razonamiento y registro incluido de proveedor de generación de video
  para `grok-imagine-video`
- `mistral`: metadatos de capacidades gestionados por el plugin
- `opencode` y `opencode-go`: metadatos de capacidades gestionados por el plugin más
  saneamiento de firmas de pensamiento de proxy-Gemini
- `alibaba`: catálogo de generación de video gestionado por el plugin para referencias directas de modelos Wan
  como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos gestionados por el plugin más registro incluido de proveedor de generación de video para modelos de Seedance de texto a video/imagen a video
- `fal`: registro incluido de proveedor de generación de video para terceros alojados y registro incluido de proveedor de generación de imágenes para modelos de imagen FLUX más registro incluido
  de proveedor de generación de video para modelos de video alojados de terceros
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` y `volcengine`:
  solo catálogos gestionados por plugins
- `qwen`: catálogos gestionados por plugins para modelos de texto más registros compartidos
  de proveedores de comprensión multimedia y generación de video para sus superficies multimodales; la generación de video de Qwen usa los endpoints de video DashScope Standard con modelos Wan incluidos como `wan2.6-t2v` y `wan2.7-r2v`
- `runway`: registro de proveedor de generación de video gestionado por el plugin para modelos nativos basados en tareas de Runway como `gen4.5`
- `minimax`: catálogos gestionados por el plugin, registro incluido de proveedor de generación de video
  para modelos de video Hailuo, registro incluido de proveedor de generación de imágenes
  para `image-01`, selección híbrida de política de reproducción Anthropic/OpenAI y lógica de autenticación/instantánea de uso
- `together`: catálogos gestionados por el plugin más registro incluido de proveedor de generación de video
  para modelos de video Wan
- `xiaomi`: catálogos gestionados por el plugin más lógica de autenticación/instantánea de uso

El plugin incluido `openai` ahora se encarga de ambos IDs de proveedor: `openai` y
`openai-codex`.

Eso cubre a los proveedores que todavía encajan en los transportes normales de OpenClaw. Un proveedor
que necesite un ejecutor de solicitudes totalmente personalizado pertenece a una superficie de extensión aparte y más profunda.

## Rotación de claves API

- Admite rotación genérica de proveedores para proveedores seleccionados.
- Configura varias claves mediante:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación live única, máxima prioridad)
  - `<PROVIDER>_API_KEYS` (lista separada por comas o punto y coma)
  - `<PROVIDER>_API_KEY` (clave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por ejemplo `<PROVIDER>_API_KEY_1`)
- Para proveedores de Google, `GOOGLE_API_KEY` también se incluye como fallback.
- El orden de selección de claves preserva la prioridad y elimina valores duplicados.
- Las solicitudes se reintentan con la siguiente clave solo en respuestas de límite de tasa (por
  ejemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o mensajes periódicos de límite de uso).
- Los fallos que no sean por límite de tasa fallan de inmediato; no se intenta rotación de claves.
- Cuando todas las claves candidatas fallan, se devuelve el error final del último intento.

## Proveedores integrados (catálogo pi-ai)

OpenClaw incluye el catálogo pi‑ai. Estos proveedores no requieren
configuración en `models.providers`; solo establece la autenticación y elige un modelo.

### OpenAI

- Proveedor: `openai`
- Autenticación: `OPENAI_API_KEY`
- Rotación opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, más `OPENCLAW_LIVE_OPENAI_KEY` (anulación única)
- Modelos de ejemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- El transporte predeterminado es `auto` (primero WebSocket, fallback a SSE)
- Anúlalo por modelo mediante `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- El precalentamiento de WebSocket de OpenAI Responses viene activado de forma predeterminada mediante `params.openaiWsWarmup` (`true`/`false`)
- El procesamiento prioritario de OpenAI puede habilitarse mediante `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` y `params.fastMode` asignan solicitudes directas de Responses `openai/*` a `service_tier=priority` en `api.openai.com`
- Usa `params.serviceTier` cuando quieras un nivel explícito en lugar del interruptor compartido `/fast`
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) se aplican solo en tráfico nativo de OpenAI a `api.openai.com`, no
  en proxies genéricos compatibles con OpenAI
- Las rutas nativas de OpenAI también conservan `store` de Responses, sugerencias de caché de prompts y
  conformación de payload de compatibilidad de razonamiento de OpenAI; las rutas proxy no
- `openai/gpt-5.3-codex-spark` está intencionalmente suprimido en OpenClaw porque la API live de OpenAI lo rechaza; Spark se trata solo como Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Proveedor: `anthropic`
- Autenticación: `ANTHROPIC_API_KEY`
- Rotación opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, más `OPENCLAW_LIVE_ANTHROPIC_KEY` (anulación única)
- Modelo de ejemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Las solicitudes públicas directas de Anthropic admiten también el interruptor compartido `/fast` y `params.fastMode`, incluidas las solicitudes autenticadas con clave API y OAuth enviadas a `api.anthropic.com`; OpenClaw lo asigna a Anthropic `service_tier` (`auto` frente a `standard_only`)
- Nota de facturación: para Anthropic en OpenClaw, la división práctica es **clave API** o **suscripción Claude con Extra Usage**. Anthropic notificó a los usuarios de OpenClaw el **4 de abril de 2026 a las 12:00 PM PT / 8:00 PM BST** que la ruta de inicio de sesión de Claude en **OpenClaw** cuenta como uso de arnés de terceros y requiere **Extra Usage** facturado por separado de la suscripción. Nuestras reproducciones locales también muestran que la cadena de prompt que identifica a OpenClaw no se reproduce en la ruta del SDK de Anthropic + clave API.
- El token de configuración de Anthropic vuelve a estar disponible como ruta heredada/manual de OpenClaw. Úsalo con la expectativa de que Anthropic indicó a los usuarios de OpenClaw que esta ruta requiere **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Proveedor: `openai-codex`
- Autenticación: OAuth (ChatGPT)
- Modelo de ejemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- El transporte predeterminado es `auto` (primero WebSocket, fallback a SSE)
- Anúlalo por modelo mediante `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` también se reenvía en solicitudes nativas de Codex Responses (`chatgpt.com/backend-api`)
- Los encabezados ocultos de atribución de OpenClaw (`originator`, `version`,
  `User-Agent`) solo se adjuntan en tráfico nativo de Codex hacia
  `chatgpt.com/backend-api`, no en proxies genéricos compatibles con OpenAI
- Comparte el mismo interruptor `/fast` y la misma configuración `params.fastMode` que `openai/*` directo; OpenClaw lo asigna a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` sigue disponible cuando el catálogo OAuth de Codex lo expone; depende de la habilitación
- `openai-codex/gpt-5.4` conserva `contextWindow = 1050000` nativo y un valor predeterminado de tiempo de ejecución `contextTokens = 272000`; anula el límite de tiempo de ejecución con `models.providers.openai-codex.models[].contextTokens`
- Nota de política: OpenAI Codex OAuth es compatible explícitamente para herramientas/flujos de trabajo externos como OpenClaw.

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

### Otras opciones alojadas de estilo suscripción

- [Qwen Cloud](/es/providers/qwen): superficie de proveedor de Qwen Cloud más asignación de endpoints de Alibaba DashScope y Coding Plan
- [MiniMax](/es/providers/minimax): acceso por OAuth o clave API a MiniMax Coding Plan
- [GLM Models](/es/providers/glm): Z.AI Coding Plan o endpoints generales de API

### OpenCode

- Autenticación: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Proveedor de tiempo de ejecución Zen: `opencode`
- Proveedor de tiempo de ejecución Go: `opencode-go`
- Modelos de ejemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clave API)

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY`
- Rotación opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback de `GOOGLE_API_KEY` y `OPENCLAW_LIVE_GEMINI_KEY` (anulación única)
- Modelos de ejemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidad: la configuración heredada de OpenClaw con `google/gemini-3.1-flash-preview` se normaliza a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Las ejecuciones directas de Gemini también aceptan `agents.defaults.models["google/<model>"].params.cachedContent`
  (o el heredado `cached_content`) para reenviar un identificador nativo del proveedor
  `cachedContents/...`; los aciertos de caché de Gemini aparecen como `cacheRead` de OpenClaw

### Google Vertex

- Proveedor: `google-vertex`
- Autenticación: gcloud ADC
  - Las respuestas JSON de Gemini CLI se analizan desde `response`; el uso recurre a
    `stats`, con `stats.cached` normalizado a `cacheRead` de OpenClaw.

### Z.AI (GLM)

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- Modelo de ejemplo: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` y `z-ai/*` se normalizan a `zai/*`
  - `zai-api-key` detecta automáticamente el endpoint de Z.AI coincidente; `zai-coding-global`, `zai-coding-cn`, `zai-global` y `zai-cn` fuerzan una superficie específica

### Vercel AI Gateway

- Proveedor: `vercel-ai-gateway`
- Autenticación: `AI_GATEWAY_API_KEY`
- Modelo de ejemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Proveedor: `kilocode`
- Autenticación: `KILOCODE_API_KEY`
- Modelo de ejemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- El catálogo de fallback estático incluye `kilocode/kilo/auto`; el descubrimiento live de
  `https://api.kilo.ai/api/gateway/models` puede ampliar aún más el catálogo
  en tiempo de ejecución.
- El enrutamiento exacto upstream detrás de `kilocode/kilo/auto` es responsabilidad de Kilo Gateway,
  no está codificado de forma rígida en OpenClaw.

Consulta [/providers/kilocode](/es/providers/kilocode) para ver detalles de configuración.

### Otros plugins de proveedores incluidos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de ejemplo: `openrouter/auto`
- OpenClaw aplica los encabezados documentados de atribución de aplicación de OpenRouter solo cuando
  la solicitud realmente se dirige a `openrouter.ai`
- Los marcadores `cache_control` de Anthropic específicos de OpenRouter también están restringidos a
  rutas OpenRouter verificadas, no a URL proxy arbitrarias
- OpenRouter permanece en la ruta de estilo proxy compatible con OpenAI, por lo que la conformación de solicitudes solo nativa de OpenAI (`serviceTier`, `store` de Responses,
  sugerencias de caché de prompts, payloads de compatibilidad de razonamiento de OpenAI) no se reenvía
- Las referencias de OpenRouter respaldadas por Gemini solo conservan el saneamiento de firmas de pensamiento de proxy-Gemini;
  la validación de reproducción nativa de Gemini y las reescrituras de bootstrap permanecen desactivadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de ejemplo: `kilocode/kilo/auto`
- Las referencias Kilo respaldadas por Gemini conservan la misma ruta de saneamiento de firmas de pensamiento
  de proxy-Gemini; `kilocode/kilo/auto` y otras sugerencias de proxy que no admiten razonamiento
  omiten la inyección de razonamiento por proxy
- MiniMax: `minimax` (clave API) y `minimax-portal` (OAuth)
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de ejemplo: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- La configuración de incorporación/clave API de MiniMax escribe definiciones explícitas del modelo M2.7 con
  `input: ["text", "image"]`; el catálogo incluido del proveedor mantiene las referencias de chat
  como solo texto hasta que se materializa esa configuración del proveedor
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de ejemplo: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` o `KIMICODE_API_KEY`)
- Modelo de ejemplo: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modelo de ejemplo: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` o `DASHSCOPE_API_KEY`)
- Modelo de ejemplo: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modelo de ejemplo: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelos de ejemplo: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modelo de ejemplo: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modelo de ejemplo: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modelo de ejemplo: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modelo de ejemplo: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Las solicitudes nativas incluidas de xAI usan la ruta xAI Responses
  - `/fast` o `params.fastMode: true` reescriben `grok-3`, `grok-3-mini`,
    `grok-4` y `grok-4-0709` a sus variantes `*-fast`
  - `tool_stream` está activado de forma predeterminada; establece
    `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
    desactivarlo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de ejemplo: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Los modelos GLM en Cerebras usan los IDs `zai-glm-4.7` y `zai-glm-4.6`.
  - URL base compatible con OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de ejemplo de Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulta [Hugging Face (Inference)](/es/providers/huggingface).

## Proveedores mediante `models.providers` (personalizado/URL base)

Usa `models.providers` (o `models.json`) para añadir proveedores **personalizados** o
proxies compatibles con OpenAI/Anthropic.

Muchos de los plugins de proveedores incluidos a continuación ya publican un catálogo predeterminado.
Usa entradas explícitas `models.providers.<id>` solo cuando quieras anular la
URL base, los encabezados o la lista de modelos predeterminados.

### Moonshot AI (Kimi)

Moonshot se incluye como plugin de proveedor. Usa el proveedor integrado de
forma predeterminada y añade una entrada explícita `models.providers.moonshot` solo cuando
necesites anular la URL base o los metadatos del modelo:

- Proveedor: `moonshot`
- Autenticación: `MOONSHOT_API_KEY`
- Modelo de ejemplo: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
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

El heredado `kimi/k2p5` sigue aceptándose como ID de modelo de compatibilidad.

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

La incorporación usa de forma predeterminada la superficie de coding, pero el catálogo general `volcengine/*`
se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de Volcengine da preferencia tanto
a las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos todavía no se han cargado,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío
limitado al proveedor.

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

La incorporación usa de forma predeterminada la superficie de coding, pero el catálogo general `byteplus/*`
se registra al mismo tiempo.

En los selectores de modelos de incorporación/configuración, la opción de autenticación de BytePlus da preferencia tanto
a las filas `byteplus/*` como `byteplus-plan/*`. Si esos modelos todavía no se han cargado,
OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un selector vacío
limitado al proveedor.

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

- OAuth de MiniMax (global): `--auth-choice minimax-global-oauth`
- OAuth de MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Clave API de MiniMax (global): `--auth-choice minimax-global-api`
- Clave API de MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticación: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` para `minimax-portal`

Consulta [/providers/minimax](/es/providers/minimax) para ver detalles de configuración, opciones de modelo y fragmentos de configuración.

En la ruta de streaming compatible con Anthropic de MiniMax, OpenClaw desactiva thinking de forma predeterminada
a menos que lo establezcas explícitamente, y `/fast on` reescribe
`MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.

División de capacidades gestionada por el plugin:

- Los valores predeterminados de texto/chat permanecen en `minimax/MiniMax-M2.7`
- La generación de imágenes es `minimax/image-01` o `minimax-portal/image-01`
- La comprensión de imágenes es `MiniMax-VL-01` gestionado por el plugin en ambas rutas de autenticación de MiniMax
- La búsqueda web permanece en el ID de proveedor `minimax`

### Ollama

Ollama se incluye como plugin de proveedor y usa la API nativa de Ollama:

- Proveedor: `ollama`
- Autenticación: no requerida (servidor local)
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

Ollama se detecta localmente en `http://127.0.0.1:11434` cuando optas por usarlo con
`OLLAMA_API_KEY`, y el plugin de proveedor incluido añade Ollama directamente a
`openclaw onboard` y al selector de modelos. Consulta [/providers/ollama](/es/providers/ollama)
para incorporación, modo cloud/local y configuración personalizada.

### vLLM

vLLM se incluye como plugin de proveedor para servidores locales/autohospedados
compatibles con OpenAI:

- Proveedor: `vllm`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:8000/v1`

Para activar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no aplica autenticación):

```bash
export VLLM_API_KEY="vllm-local"
```

Luego establece un modelo (sustitúyelo por uno de los IDs devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/es/providers/vllm) para ver detalles.

### SGLang

SGLang se incluye como plugin de proveedor para servidores rápidos autohospedados
compatibles con OpenAI:

- Proveedor: `sglang`
- Autenticación: opcional (depende de tu servidor)
- URL base predeterminada: `http://127.0.0.1:30000/v1`

Para activar el descubrimiento automático localmente (cualquier valor funciona si tu servidor no
aplica autenticación):

```bash
export SGLANG_API_KEY="sglang-local"
```

Luego establece un modelo (sustitúyelo por uno de los IDs devueltos por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulta [/providers/sglang](/es/providers/sglang) para ver detalles.

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
        apiKey: "LMSTUDIO_KEY",
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
  Cuando se omiten, OpenClaw usa estos valores predeterminados:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: establece valores explícitos que coincidan con los límites de tu proxy/modelo.
- Para `api: "openai-completions"` en endpoints no nativos (cualquier `baseUrl` no vacío cuyo host no sea `api.openai.com`), OpenClaw fuerza `compat.supportsDeveloperRole: false` para evitar errores 400 del proveedor por roles `developer` no compatibles.
- Las rutas proxy de estilo compatible con OpenAI también omiten la conformación de solicitudes solo nativa de OpenAI: sin `service_tier`, sin `store` de Responses, sin sugerencias de caché de prompts, sin
  conformación de payload de compatibilidad de razonamiento de OpenAI y sin encabezados ocultos de atribución de OpenClaw.
- Si `baseUrl` está vacío/se omite, OpenClaw mantiene el comportamiento predeterminado de OpenAI (que resuelve a `api.openai.com`).
- Por seguridad, un `compat.supportsDeveloperRole: true` explícito sigue siendo anulado en endpoints no nativos `openai-completions`.

## Ejemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta también: [/gateway/configuration](/es/gateway/configuration) para ver ejemplos completos de configuración.

## Relacionado

- [Models](/es/concepts/models) — configuración de modelos y alias
- [Model Failover](/es/concepts/model-failover) — cadenas de fallback y comportamiento de reintento
- [Configuration Reference](/es/gateway/configuration-reference#agent-defaults) — claves de configuración de modelos
- [Providers](/es/providers) — guías de configuración por proveedor
