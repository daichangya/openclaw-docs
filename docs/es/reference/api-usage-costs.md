---
read_when:
    - Quieres entender qué funciones pueden llamar a APIs de pago
    - Necesitas auditar las claves, los costos y la visibilidad del uso
    - Estás explicando el informe de costos de /status o /usage
summary: Audita qué puede generar costos, qué claves se usan y cómo ver el uso
title: Uso y costos de la API
x-i18n:
    generated_at: "2026-04-25T13:56:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Uso y costos de la API

Este documento enumera las **funciones que pueden invocar claves API** y dónde aparecen sus costos. Se centra en
las funciones de OpenClaw que pueden generar uso de proveedores o llamadas de pago a APIs.

## Dónde aparecen los costos (chat + CLI)

**Instantánea de costo por sesión**

- `/status` muestra el modelo actual de la sesión, el uso de contexto y los tokens de la última respuesta.
- Si el modelo usa **autenticación por clave API**, `/status` también muestra el **costo estimado** de la última respuesta.
- Si los metadatos de la sesión en vivo son escasos, `/status` puede recuperar contadores
  de tokens/caché y la etiqueta activa del modelo de runtime a partir de la entrada de uso
  más reciente del transcript. Los valores en vivo no nulos existentes siguen teniendo prioridad, y los totales del transcript del tamaño del prompt
  pueden prevalecer cuando los totales almacenados faltan o son menores.

**Pie de costo por mensaje**

- `/usage full` agrega un pie de uso a cada respuesta, incluido el **costo estimado** (solo clave API).
- `/usage tokens` muestra solo los tokens; los flujos de suscripción basados en OAuth/token y CLI ocultan el costo en dólares.
- Nota sobre Gemini CLI: cuando la CLI devuelve salida JSON, OpenClaw lee el uso desde
  `stats`, normaliza `stats.cached` en `cacheRead` y deriva los tokens de entrada
  de `stats.input_tokens - stats.cached` cuando es necesario.

Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw
vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como
autorizados para esta integración, a menos que Anthropic publique una nueva política.
Anthropic sigue sin exponer una estimación en dólares por mensaje que OpenClaw pueda
mostrar en `/usage full`.

**Ventanas de uso de CLI (cuotas del proveedor)**

- `openclaw status --usage` y `openclaw channels list` muestran las **ventanas de uso** del proveedor
  (instantáneas de cuota, no costos por mensaje).
- La salida legible se normaliza a `X% left` entre proveedores.
- Proveedores actuales con ventanas de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.
- Nota sobre MiniMax: sus campos sin procesar `usage_percent` / `usagePercent` significan
  cuota restante, por lo que OpenClaw los invierte antes de mostrarlos. Los campos basados en recuento siguen teniendo prioridad
  cuando están presentes. Si el proveedor devuelve `model_remains`, OpenClaw prefiere la
  entrada del modelo de chat, deriva la etiqueta de la ventana a partir de las marcas de tiempo cuando es necesario e
  incluye el nombre del modelo en la etiqueta del plan.
- La autenticación de uso para esas ventanas de cuota proviene de hooks específicos del proveedor cuando
  están disponibles; de lo contrario, OpenClaw recurre a credenciales OAuth/clave API coincidentes
  desde perfiles de autenticación, variables de entorno o configuración.

Consulta [Uso y costos de tokens](/es/reference/token-use) para obtener detalles y ejemplos.

## Cómo se descubren las claves

OpenClaw puede recoger credenciales de:

- **Perfiles de autenticación** (por agente, almacenados en `auth-profiles.json`).
- **Variables de entorno** (por ejemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuración** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), que pueden exportar claves al entorno del proceso de la skill.

## Funciones que pueden consumir claves

### 1) Respuestas del modelo principal (chat + herramientas)

Cada respuesta o llamada de herramienta usa el **proveedor del modelo actual** (OpenAI, Anthropic, etc.). Esta es la
fuente principal de uso y costo.

Esto también incluye proveedores alojados de estilo suscripción que siguen facturando fuera de
la interfaz local de OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** y
la ruta de inicio de sesión Claude de Anthropic de OpenClaw con **Extra Usage** habilitado.

Consulta [Modelos](/es/providers/models) para la configuración de precios y [Uso y costos de tokens](/es/reference/token-use) para la visualización.

### 2) Comprensión de medios (audio/imagen/video)

Los medios entrantes pueden resumirse/transcribirse antes de ejecutar la respuesta. Esto usa APIs de modelos/proveedores.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Imagen: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.A.I.
- Video: Google / Qwen / Moonshot.

Consulta [Comprensión de medios](/es/nodes/media-understanding).

### 3) Generación de imágenes y video

Las capacidades compartidas de generación también pueden consumir claves de proveedores:

- Generación de imágenes: OpenAI / Google / fal / MiniMax
- Generación de video: Qwen

La generación de imágenes puede inferir un proveedor predeterminado respaldado por autenticación cuando
`agents.defaults.imageGenerationModel` no está establecido. Actualmente, la generación de video
requiere un `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulta [Generación de imágenes](/es/tools/image-generation), [Qwen Cloud](/es/providers/qwen)
y [Modelos](/es/concepts/models).

### 4) Embeddings de memoria + búsqueda semántica

La búsqueda semántica en memoria usa **APIs de embeddings** cuando se configura para proveedores remotos:

- `memorySearch.provider = "openai"` → embeddings de OpenAI
- `memorySearch.provider = "gemini"` → embeddings de Gemini
- `memorySearch.provider = "voyage"` → embeddings de Voyage
- `memorySearch.provider = "mistral"` → embeddings de Mistral
- `memorySearch.provider = "lmstudio"` → embeddings de LM Studio (local/autohospedado)
- `memorySearch.provider = "ollama"` → embeddings de Ollama (local/autohospedado; normalmente sin facturación de API alojada)
- Respaldo opcional a un proveedor remoto si fallan los embeddings locales

Puedes mantenerlo local con `memorySearch.provider = "local"` (sin uso de API).

Consulta [Memoria](/es/concepts/memory).

### 5) Herramienta de búsqueda web

`web_search` puede generar cargos por uso según tu proveedor:

- **Brave Search API**: `BRAVE_API_KEY` o `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` o `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` o `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` o `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` o `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sin clave de forma predeterminada, pero requiere un host de Ollama accesible más `ollama signin`; también puede reutilizar la autenticación Bearer normal del proveedor Ollama cuando el host la requiere
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` o `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` o `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: respaldo sin clave (sin facturación de API, pero no oficial y basado en HTML)
- **SearXNG**: `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl` (sin clave/autohospedado; sin facturación de API alojada)

Las rutas heredadas de proveedor `tools.web.search.*` siguen cargándose mediante el shim temporal de compatibilidad, pero ya no son la superficie de configuración recomendada.

**Crédito gratuito de Brave Search:** cada plan de Brave incluye \$5/mes en crédito
gratuito renovable. El plan Search cuesta \$5 por 1.000 solicitudes, así que el crédito cubre
1.000 solicitudes/mes sin cargo. Establece tu límite de uso en el panel de Brave
para evitar cargos inesperados.

Consulta [Herramientas web](/es/tools/web).

### 5) Herramienta de obtención web (Firecrawl)

`web_fetch` puede llamar a **Firecrawl** cuando hay una clave API presente:

- `FIRECRAWL_API_KEY` o `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl no está configurado, la herramienta recurre a fetch directo más el plugin integrado `web-readability` (sin API de pago). Desactiva `plugins.entries.web-readability.enabled` para omitir la extracción local de Readability.

Consulta [Herramientas web](/es/tools/web).

### 6) Instantáneas de uso del proveedor (estado/salud)

Algunos comandos de estado llaman a **endpoints de uso del proveedor** para mostrar ventanas de cuota o el estado de autenticación.
Normalmente son llamadas de bajo volumen, pero aun así acceden a APIs del proveedor:

- `openclaw status --usage`
- `openclaw models status --json`

Consulta [CLI de modelos](/es/cli/models).

### 7) Resumen de protección de Compaction

La protección de Compaction puede resumir el historial de la sesión usando el **modelo actual**, lo que
invoca APIs del proveedor cuando se ejecuta.

Consulta [Gestión de sesiones + compaction](/es/reference/session-management-compaction).

### 8) Escaneo / sondeo de modelos

`openclaw models scan` puede sondear modelos de OpenRouter y usa `OPENROUTER_API_KEY` cuando
el sondeo está habilitado.

Consulta [CLI de modelos](/es/cli/models).

### 9) Talk (voz)

El modo Talk puede invocar **ElevenLabs** cuando está configurado:

- `ELEVENLABS_API_KEY` o `talk.providers.elevenlabs.apiKey`

Consulta [Modo Talk](/es/nodes/talk).

### 10) Skills (APIs de terceros)

Las Skills pueden almacenar `apiKey` en `skills.entries.<name>.apiKey`. Si una skill usa esa clave para APIs externas,
puede generar costos según el proveedor de la skill.

Consulta [Skills](/es/tools/skills).

## Relacionado

- [Uso y costos de tokens](/es/reference/token-use)
- [Caché de prompts](/es/reference/prompt-caching)
- [Seguimiento de uso](/es/concepts/usage-tracking)
