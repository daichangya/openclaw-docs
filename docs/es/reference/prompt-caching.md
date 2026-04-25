---
read_when:
    - Quieres reducir los costos de tokens de prompts con retención de caché
    - Necesitas comportamiento de caché por agente en configuraciones con varios agentes
    - Estás ajustando Heartbeat y la depuración de cache-ttl juntos
summary: Controles de almacenamiento en caché de prompts, orden de combinación, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-04-25T13:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

El almacenamiento en caché de prompts significa que el proveedor del modelo puede reutilizar prefijos de prompt sin cambios (normalmente instrucciones de sistema/desarrollador y otro contexto estable) entre turnos en lugar de volver a procesarlos cada vez. OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` cuando la API ascendente expone esos contadores directamente.

Las superficies de estado también pueden recuperar contadores de caché del registro
de uso de la transcripción más reciente cuando la instantánea de la sesión en vivo no los contiene, para que `/status` pueda seguir
mostrando una línea de caché después de una pérdida parcial de metadatos de sesión. Los valores de caché en vivo existentes distintos de cero siguen teniendo prioridad sobre los valores de respaldo de la transcripción.

Por qué esto importa: menor costo de tokens, respuestas más rápidas y rendimiento más predecible para sesiones de larga duración. Sin almacenamiento en caché, los prompts repetidos pagan el costo completo del prompt en cada turno incluso cuando la mayor parte de la entrada no cambió.

Las secciones siguientes cubren cada control relacionado con caché que afecta la reutilización de prompts y el costo de tokens.

Referencias del proveedor:

- Almacenamiento en caché de prompts de Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Almacenamiento en caché de prompts de OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Encabezados de la API de OpenAI e ID de solicitudes: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID de solicitudes y errores de Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principales

### `cacheRetention` (predeterminado global, modelo y por agente)

Establece la retención de caché como valor predeterminado global para todos los modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Sobrescribe por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Sobrescritura por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Orden de combinación de configuración:

1. `agents.defaults.params` (predeterminado global; se aplica a todos los modelos)
2. `agents.defaults.models["provider/model"].params` (sobrescritura por modelo)
3. `agents.list[].params` (id de agente coincidente; sobrescribe por clave)

### `contextPruning.mode: "cache-ttl"`

Depura contexto antiguo de resultados de herramientas después de ventanas TTL de caché para que las solicitudes tras periodos de inactividad no vuelvan a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Depuración de sesiones](/es/concepts/session-pruning) para ver el comportamiento completo.

### Mantener caliente con Heartbeat

Heartbeat puede mantener activas las ventanas de caché y reducir escrituras repetidas de caché después de periodos de inactividad.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Se admite Heartbeat por agente en `agents.list[].heartbeat`.

## Comportamiento del proveedor

### Anthropic (API directa)

- `cacheRetention` es compatible.
- Con perfiles de autenticación por clave de API de Anthropic, OpenClaw inicializa `cacheRetention: "short"` para referencias de modelos Anthropic cuando no está configurado.
- Las respuestas nativas de Anthropic Messages exponen tanto `cache_read_input_tokens` como `cache_creation_input_tokens`, por lo que OpenClaw puede mostrar tanto `cacheRead` como `cacheWrite`.
- Para solicitudes nativas de Anthropic, `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos, y `cacheRetention: "long"` eleva el TTL a 1 hora solo en hosts directos `api.anthropic.com`.

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en modelos recientes compatibles. OpenClaw no necesita inyectar marcadores de caché a nivel de bloque.
- OpenClaw usa `prompt_cache_key` para mantener estable el enrutamiento de caché entre turnos y usa `prompt_cache_retention: "24h"` solo cuando `cacheRetention: "long"` está seleccionado en hosts directos de OpenAI.
- Los proveedores compatibles con OpenAI Completions reciben `prompt_cache_key` solo cuando la configuración de su modelo establece explícitamente `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` sigue suprimiéndolo.
- Las respuestas de OpenAI exponen tokens de prompt almacenados en caché mediante `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` en eventos de Responses API). OpenClaw lo asigna a `cacheRead`.
- OpenAI no expone un contador separado de tokens de escritura de caché, por lo que `cacheWrite` permanece en `0` en rutas de OpenAI incluso cuando el proveedor está calentando una caché.
- OpenAI devuelve encabezados útiles de rastreo y límite de tasa como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`, pero la contabilidad de aciertos de caché debe provenir de la carga útil de uso, no de los encabezados.
- En la práctica, OpenAI suele comportarse más como una caché de prefijo inicial que como la reutilización móvil del historial completo al estilo Anthropic. Los turnos con texto estable y prefijos largos pueden acercarse a una meseta de `4864` tokens almacenados en caché en pruebas en vivo actuales, mientras que las transcripciones intensivas en herramientas o de estilo MCP a menudo se estabilizan cerca de `4608` tokens almacenados en caché incluso en repeticiones exactas.

### Anthropic Vertex

- Los modelos Anthropic en Vertex AI (`anthropic-vertex/*`) admiten `cacheRetention` de la misma manera que Anthropic directo.
- `cacheRetention: "long"` se asigna al TTL real de 1 hora para caché de prompts en endpoints de Vertex AI.
- La retención de caché predeterminada para `anthropic-vertex` coincide con los valores predeterminados directos de Anthropic.
- Las solicitudes de Vertex se enrutan mediante modelado de caché con reconocimiento de límites para que la reutilización de caché permanezca alineada con lo que realmente reciben los proveedores.

### Amazon Bedrock

- Las referencias de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) admiten el paso directo explícito de `cacheRetention`.
- Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.

### Modelos OpenRouter

Para referencias de modelo `openrouter/anthropic/*`, OpenClaw inyecta
`cache_control` de Anthropic en bloques de prompt de sistema/desarrollador para mejorar la
reutilización de la caché de prompts solo cuando la solicitud sigue apuntando a una ruta OpenRouter verificada
(`openrouter` en su endpoint predeterminado, o cualquier proveedor/base URL que se resuelva
a `openrouter.ai`).

Para referencias de modelo `openrouter/deepseek/*`, `openrouter/moonshot*/*` y `openrouter/zai/*`,
se permite `contextPruning.mode: "cache-ttl"` porque OpenRouter
gestiona automáticamente el almacenamiento en caché de prompts del lado del proveedor. OpenClaw no inyecta
marcadores `cache_control` de Anthropic en esas solicitudes.

La construcción de caché de DeepSeek se realiza con el mejor esfuerzo y puede tardar unos segundos. Un
seguimiento inmediato aún puede mostrar `cached_tokens: 0`; verifícalo con una solicitud repetida del mismo prefijo
después de un breve retraso y usa `usage.prompt_tokens_details.cached_tokens`
como señal de acierto de caché.

Si rediriges el modelo a una URL de proxy arbitraria compatible con OpenAI, OpenClaw
deja de inyectar esos marcadores de caché específicos de Anthropic para OpenRouter.

### Otros proveedores

Si el proveedor no admite este modo de caché, `cacheRetention` no tiene efecto.

### API directa de Google Gemini

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa aciertos de caché
  mediante `cachedContentTokenCount` ascendente; OpenClaw lo asigna a `cacheRead`.
- Cuando `cacheRetention` está configurado en un modelo Gemini directo, OpenClaw automáticamente
  crea, reutiliza y actualiza recursos `cachedContents` para prompts del sistema
  en ejecuciones de Google AI Studio. Esto significa que ya no necesitas crear previamente
  un identificador de contenido almacenado en caché manualmente.
- Aun así, puedes pasar un identificador existente de contenido en caché de Gemini como
  `params.cachedContent` (o el heredado `params.cached_content`) en el modelo
  configurado.
- Esto es independiente del almacenamiento en caché de prefijos de prompts de Anthropic/OpenAI. Para Gemini,
  OpenClaw gestiona un recurso `cachedContents` nativo del proveedor en lugar de
  inyectar marcadores de caché en la solicitud.

### Uso JSON de Gemini CLI

- La salida JSON de Gemini CLI también puede mostrar aciertos de caché mediante `stats.cached`;
  OpenClaw lo asigna a `cacheRead`.
- Si el CLI omite un valor directo `stats.input`, OpenClaw deriva los tokens de entrada
  a partir de `stats.input_tokens - stats.cached`.
- Esto es solo normalización de uso. No significa que OpenClaw esté creando
  marcadores de caché de prompts al estilo Anthropic/OpenAI para Gemini CLI.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo volátil**
separados por un límite interno de prefijo de caché. El contenido por encima del
límite (definiciones de herramientas, metadatos de Skills, archivos del espacio de trabajo y otro
contexto relativamente estático) se ordena para que permanezca idéntico byte a byte entre turnos.
El contenido por debajo del límite (por ejemplo `HEARTBEAT.md`, marcas de tiempo de tiempo de ejecución y
otros metadatos por turno) puede cambiar sin invalidar el prefijo
almacenado en caché.

Decisiones de diseño clave:

- Los archivos estables de contexto del proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md` para que
  la variación de Heartbeat no rompa el prefijo estable.
- El límite se aplica en Anthropic-family, OpenAI-family, Google y modelado de transporte CLI
  para que todos los proveedores compatibles se beneficien de la misma estabilidad de prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante
  modelado de caché con reconocimiento de límites para que la reutilización de caché permanezca alineada con lo que
  realmente reciben los proveedores.
- Las huellas del prompt del sistema se normalizan (espacios en blanco, finales de línea,
  contexto añadido por hooks, orden de capacidades de tiempo de ejecución) para que los prompts
  semánticamente sin cambios compartan KV/caché entre turnos.

Si ves picos inesperados de `cacheWrite` después de un cambio de configuración o del espacio de trabajo,
comprueba si el cambio cae por encima o por debajo del límite de caché. Mover
contenido volátil por debajo del límite (o estabilizarlo) suele resolver el
problema.

## Protecciones de estabilidad de caché de OpenClaw

OpenClaw también mantiene deterministas varias formas de carga útil sensibles a caché antes de
que la solicitud llegue al proveedor:

- Los catálogos de herramientas MCP incluidos se ordenan de forma determinista antes del registro
  de herramientas, para que los cambios de orden en `listTools()` no alteren el bloque de herramientas ni
  rompan los prefijos de caché de prompts.
- Las sesiones heredadas con bloques de imagen persistidos conservan intactos los **3 turnos completados más recientes**;
  los bloques de imagen antiguos ya procesados pueden
  reemplazarse por un marcador para que los seguimientos con muchas imágenes no sigan reenviando grandes
  cargas útiles obsoletas.

## Patrones de ajuste

### Tráfico mixto (predeterminado recomendado)

Mantén una base de larga duración en tu agente principal y desactiva el almacenamiento en caché en agentes notificadores con tráfico irregular:

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

### Base centrada en costos

- Establece una base `cacheRetention: "short"`.
- Habilita `contextPruning.mode: "cache-ttl"`.
- Mantén Heartbeat por debajo de tu TTL solo para agentes que se beneficien de cachés calientes.

## Diagnóstico de caché

OpenClaw expone diagnósticos dedicados de rastreo de caché para ejecuciones de agentes integrados.

Para diagnósticos normales orientados al usuario, `/status` y otros resúmenes de uso pueden usar
la entrada de uso más reciente de la transcripción como fuente de respaldo para `cacheRead` /
`cacheWrite` cuando la entrada de sesión en vivo no tenga esos contadores.

## Pruebas de regresión en vivo

OpenClaw mantiene una única puerta combinada de regresión de caché en vivo para prefijos repetidos, turnos con herramientas, turnos con imágenes, transcripciones de herramientas de estilo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecuta la puerta estrecha en vivo con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de base almacena los números observados más recientes en vivo junto con los umbrales mínimos de regresión específicos del proveedor usados por la prueba.
El ejecutor también usa ID de sesión nuevos por ejecución y espacios de nombres de prompts para que el estado previo de caché no contamine la muestra de regresión actual.

Estas pruebas intencionalmente no usan criterios de éxito idénticos entre proveedores.

### Expectativas en vivo de Anthropic

- Espera escrituras explícitas de calentamiento mediante `cacheWrite`.
- Espera reutilización de casi todo el historial en turnos repetidos porque el control de caché de Anthropic avanza el punto de interrupción de caché a través de la conversación.
- Las aserciones actuales en vivo siguen usando umbrales altos de tasa de aciertos para rutas estables, con herramientas y con imágenes.

### Expectativas en vivo de OpenAI

- Espera solo `cacheRead`. `cacheWrite` permanece en `0`.
- Trata la reutilización de caché en turnos repetidos como una meseta específica del proveedor, no como la reutilización móvil de todo el historial al estilo Anthropic.
- Las aserciones actuales en vivo usan verificaciones de mínimos conservadoras derivadas del comportamiento observado en vivo en `gpt-5.4-mini`:
  - prefijo estable: `cacheRead >= 4608`, tasa de aciertos `>= 0.90`
  - transcripción de herramientas: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`
  - transcripción de imágenes: `cacheRead >= 3840`, tasa de aciertos `>= 0.82`
  - transcripción de estilo MCP: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`

La verificación combinada reciente en vivo del 2026-04-04 resultó en:

- prefijo estable: `cacheRead=4864`, tasa de aciertos `0.966`
- transcripción de herramientas: `cacheRead=4608`, tasa de aciertos `0.896`
- transcripción de imágenes: `cacheRead=4864`, tasa de aciertos `0.954`
- transcripción de estilo MCP: `cacheRead=4608`, tasa de aciertos `0.891`

El tiempo reciente de reloj local para la puerta combinada fue de aproximadamente `88s`.

Por qué difieren las aserciones:

- Anthropic expone puntos de interrupción de caché explícitos y reutilización móvil del historial de conversación.
- El almacenamiento en caché de prompts de OpenAI sigue siendo sensible al prefijo exacto, pero el prefijo reutilizable efectivo en tráfico en vivo de Responses puede alcanzar una meseta antes que el prompt completo.
- Por eso, comparar Anthropic y OpenAI con un único umbral porcentual entre proveedores crea regresiones falsas.

### Configuración de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcional
    includeMessages: false # predeterminado true
    includePrompt: false # predeterminado true
    includeSystem: false # predeterminado true
```

Valores predeterminados:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Interruptores de entorno (depuración puntual)

- `OPENCLAW_CACHE_TRACE=1` habilita el rastreo de caché.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sobrescribe la ruta de salida.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` activa o desactiva la captura completa de cargas útiles de mensajes.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` activa o desactiva la captura de texto del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` activa o desactiva la captura del prompt del sistema.

### Qué inspeccionar

- Los eventos de rastreo de caché son JSONL e incluyen instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto por turno de los tokens de caché es visible en las superficies normales de uso mediante `cacheRead` y `cacheWrite` (por ejemplo `/usage full` y resúmenes de uso de sesión).
- En Anthropic, espera tanto `cacheRead` como `cacheWrite` cuando el almacenamiento en caché esté activo.
- En OpenAI, espera `cacheRead` en aciertos de caché y que `cacheWrite` permanezca en `0`; OpenAI no publica un campo separado de tokens de escritura de caché.
- Si necesitas rastreo de solicitudes, registra los ID de solicitud y los encabezados de límite de tasa por separado de las métricas de caché. La salida actual de rastreo de caché de OpenClaw se centra en la forma del prompt/sesión y el uso normalizado de tokens, en lugar de en los encabezados brutos de respuesta del proveedor.

## Solución rápida de problemas

- `cacheWrite` alto en la mayoría de los turnos: revisa si hay entradas volátiles en el prompt del sistema y verifica que el modelo/proveedor admita tu configuración de caché.
- `cacheWrite` alto en Anthropic: a menudo significa que el punto de interrupción de caché está cayendo en contenido que cambia en cada solicitud.
- `cacheRead` bajo en OpenAI: verifica que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice la misma `prompt_cache_key` en los turnos que deben compartir una caché.
- Sin efecto de `cacheRetention`: confirma que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- Solicitudes de Bedrock Nova/Mistral con configuración de caché: es esperable que en tiempo de ejecución se fuerce a `none`.

Documentación relacionada:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Referencia de configuración de Gateway](/es/gateway/configuration-reference)

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso y costos de API](/es/reference/api-usage-costs)
