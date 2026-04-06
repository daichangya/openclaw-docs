---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación con suscripción a Codex en lugar de claves API
summary: Usa OpenAI mediante claves API o suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T03:11:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e04db5787f6ed7b1eda04d965c10febae10809fc82ae4d9769e7163234471f5
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI proporciona API para desarrolladores de modelos GPT. Codex admite **inicio de sesión con ChatGPT** para acceso por suscripción
o **inicio de sesión con clave API** para acceso basado en uso. Codex cloud requiere inicio de sesión con ChatGPT.
OpenAI admite explícitamente el uso de OAuth por suscripción en herramientas/flujos de trabajo externos como OpenClaw.

## Estilo de interacción predeterminado

OpenClaw puede agregar una pequeña superposición de prompt específica de OpenAI tanto para ejecuciones `openai/*` como
`openai-codex/*`. De forma predeterminada, la superposición mantiene al asistente activo,
colaborativo, conciso, directo y un poco más expresivo emocionalmente
sin reemplazar el prompt base del sistema de OpenClaw. La superposición amistosa también
permite emojis ocasionales cuando encajan de forma natural, manteniendo al mismo tiempo
la salida general concisa.

Clave de configuración:

`plugins.entries.openai.config.personality`

Valores permitidos:

- `"friendly"`: predeterminado; habilita la superposición específica de OpenAI.
- `"off"`: deshabilita la superposición y usa solo el prompt base de OpenClaw.

Alcance:

- Se aplica a los modelos `openai/*`.
- Se aplica a los modelos `openai-codex/*`.
- No afecta a otros proveedores.

Este comportamiento está activado de forma predeterminada. Mantén `"friendly"` explícitamente si quieres que
sobreviva a futuros cambios locales de configuración:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Deshabilitar la superposición de prompt de OpenAI

Si quieres el prompt base de OpenClaw sin modificar, establece la superposición en `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

También puedes establecerlo directamente con la CLI de configuración:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Opción A: clave API de OpenAI (OpenAI Platform)

**Ideal para:** acceso directo a la API y facturación basada en uso.
Obtén tu clave API desde el panel de OpenAI.

### Configuración por CLI

```bash
openclaw onboard --auth-choice openai-api-key
# o no interactivo
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Fragmento de configuración

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

La documentación actual de modelos de la API de OpenAI enumera `gpt-5.4` y `gpt-5.4-pro` para uso directo
de la API de OpenAI. OpenClaw reenvía ambos mediante la ruta `openai/*` Responses.
OpenClaw suprime intencionalmente la fila obsoleta `openai/gpt-5.3-codex-spark`,
porque las llamadas directas a la API de OpenAI la rechazan en tráfico real.

OpenClaw **no** expone `openai/gpt-5.3-codex-spark` en la ruta directa de la API de OpenAI.
`pi-ai` sigue incluyendo una fila integrada para ese modelo, pero las solicitudes reales a la API de OpenAI
actualmente lo rechazan. Spark se trata como exclusivo de Codex en OpenClaw.

## Generación de imágenes

El plugin integrado `openai` también registra la generación de imágenes mediante la herramienta compartida
`image_generate`.

- Modelo de imagen predeterminado: `openai/gpt-image-1`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, hasta 5 imágenes de referencia
- Admite `size`
- Limitación actual específica de OpenAI: OpenClaw no reenvía hoy sobrescrituras de `aspectRatio` ni
  de `resolution` a la API de imágenes de OpenAI

Para usar OpenAI como proveedor de imágenes predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Consulta [Image Generation](/es/tools/image-generation) para ver los
parámetros de la herramienta compartida, la selección de proveedor y el comportamiento de failover.

## Generación de video

El plugin integrado `openai` también registra la generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `openai/sora-2`
- Modos: texto a video, imagen a video y flujos de referencia/edición con un solo video
- Límites actuales: 1 imagen o 1 entrada de referencia de video
- Limitación actual específica de OpenAI: OpenClaw actualmente solo reenvía sobrescrituras de `size`
  para la generación nativa de video de OpenAI. Las sobrescrituras opcionales no compatibles
  como `aspectRatio`, `resolution`, `audio` y `watermark` se ignoran
  y se devuelven como advertencia de herramienta.

Para usar OpenAI como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Consulta [Video Generation](/tools/video-generation) para ver los
parámetros de la herramienta compartida, la selección de proveedor y el comportamiento de failover.

## Opción B: suscripción a OpenAI Code (Codex)

**Ideal para:** usar acceso por suscripción a ChatGPT/Codex en lugar de una clave API.
Codex cloud requiere inicio de sesión con ChatGPT, mientras que la CLI de Codex admite inicio de sesión con ChatGPT o con clave API.

### Configuración por CLI (OAuth de Codex)

```bash
# Ejecutar OAuth de Codex en el asistente
openclaw onboard --auth-choice openai-codex

# O ejecutar OAuth directamente
openclaw models auth login --provider openai-codex
```

### Fragmento de configuración (suscripción a Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

La documentación actual de Codex de OpenAI enumera `gpt-5.4` como el modelo actual de Codex. OpenClaw
lo asigna a `openai-codex/gpt-5.4` para uso con OAuth de ChatGPT/Codex.

Si la incorporación reutiliza un inicio de sesión existente de la CLI de Codex, esas credenciales siguen
siendo administradas por la CLI de Codex. Cuando caducan, OpenClaw vuelve a leer primero la fuente externa de Codex
y, cuando el proveedor puede actualizarlas, escribe la credencial actualizada
de vuelta en el almacenamiento de Codex en lugar de asumir la propiedad en una copia separada
solo de OpenClaw.

Si tu cuenta de Codex tiene derecho a Codex Spark, OpenClaw también admite:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw trata Codex Spark como exclusivo de Codex. No expone una ruta directa de clave API
`openai/gpt-5.3-codex-spark`.

OpenClaw también conserva `openai-codex/gpt-5.3-codex-spark` cuando `pi-ai`
lo detecta. Trátalo como dependiente de derechos y experimental: Codex Spark es
distinto de GPT-5.4 `/fast`, y la disponibilidad depende de la cuenta de Codex /
ChatGPT que haya iniciado sesión.

### Límite de ventana de contexto de Codex

OpenClaw trata los metadatos del modelo Codex y el límite de contexto en tiempo de ejecución como valores
separados.

Para `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- límite predeterminado de `contextTokens` en tiempo de ejecución: `272000`

Eso mantiene veraces los metadatos del modelo, a la vez que conserva la ventana predeterminada más pequeña en tiempo de ejecución,
que en la práctica ofrece mejores características de latencia y calidad.

Si quieres un límite efectivo distinto, establece `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Usa `contextWindow` solo cuando estés declarando o sobrescribiendo metadatos nativos del modelo.
Usa `contextTokens` cuando quieras limitar el presupuesto de contexto en tiempo de ejecución.

### Transporte predeterminado

OpenClaw usa `pi-ai` para el streaming de modelos. Tanto para `openai/*` como para
`openai-codex/*`, el transporte predeterminado es `"auto"` (primero WebSocket, luego respaldo
con SSE).

En modo `"auto"`, OpenClaw también reintenta un fallo temprano y reintentable de WebSocket
antes de recurrir a SSE. El modo forzado `"websocket"` sigue mostrando los errores
de transporte directamente en lugar de ocultarlos tras el respaldo.

Después de un fallo de conexión o de WebSocket al principio del turno en modo `"auto"`, OpenClaw marca
la ruta de WebSocket de esa sesión como degradada durante unos 60 segundos y envía
los turnos posteriores mediante SSE durante el período de enfriamiento en lugar de alternar
sin parar entre transportes.

Para endpoints nativos de la familia OpenAI (`openai/*`, `openai-codex/*` y Azure
OpenAI Responses), OpenClaw también adjunta estado estable de identidad de sesión y turno
a las solicitudes para que los reintentos, las reconexiones y el respaldo con SSE sigan alineados con la misma
identidad de conversación. En las rutas nativas de la familia OpenAI esto incluye encabezados estables de identidad de solicitud de sesión/turno junto con metadatos de transporte coincidentes.

OpenClaw también normaliza los contadores de uso de OpenAI entre variantes de transporte antes de que
lleguen a las superficies de sesión/estado. El tráfico nativo de OpenAI/Codex Responses puede
informar el uso como `input_tokens` / `output_tokens` o
`prompt_tokens` / `completion_tokens`; OpenClaw los trata como los mismos contadores
de entrada y salida para `/status`, `/usage` y los registros de sesión. Cuando el tráfico nativo por
WebSocket omite `total_tokens` (o informa `0`), OpenClaw usa como respaldo el total normalizado de entrada + salida para que las visualizaciones de sesión/estado sigan mostrando datos.

Puedes establecer `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: forzar SSE
- `"websocket"`: forzar WebSocket
- `"auto"`: probar WebSocket y luego usar SSE como respaldo

Para `openai/*` (API Responses), OpenClaw también habilita por defecto el calentamiento de WebSocket
(`openaiWsWarmup: true`) cuando se usa transporte WebSocket.

Documentación relacionada de OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Calentamiento de WebSocket de OpenAI

La documentación de OpenAI describe el calentamiento como opcional. OpenClaw lo habilita de forma predeterminada para
`openai/*` para reducir la latencia del primer turno cuando se usa transporte WebSocket.

### Deshabilitar el calentamiento

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Habilitar el calentamiento explícitamente

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Procesamiento prioritario en OpenAI y Codex

La API de OpenAI expone el procesamiento prioritario mediante `service_tier=priority`. En
OpenClaw, establece `agents.defaults.models["<provider>/<model>"].params.serviceTier`
para reenviar ese campo en los endpoints nativos de OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Los valores admitidos son `auto`, `default`, `flex` y `priority`.

OpenClaw reenvía `params.serviceTier` tanto a las solicitudes directas de Responses `openai/*`
como a las solicitudes de Codex Responses `openai-codex/*` cuando esos modelos apuntan
a los endpoints nativos de OpenAI/Codex.

Comportamiento importante:

- `openai/*` directo debe apuntar a `api.openai.com`
- `openai-codex/*` debe apuntar a `chatgpt.com/backend-api`
- si enrutas cualquiera de los dos proveedores a través de otra URL base o proxy, OpenClaw deja `service_tier` intacto

### Modo rápido de OpenAI

OpenClaw expone un interruptor compartido de modo rápido tanto para sesiones `openai/*` como
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Configuración: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Cuando el modo rápido está habilitado, OpenClaw lo asigna al procesamiento prioritario de OpenAI:

- las llamadas directas a Responses `openai/*` a `api.openai.com` envían `service_tier = "priority"`
- las llamadas a Responses `openai-codex/*` a `chatgpt.com/backend-api` también envían `service_tier = "priority"`
- los valores existentes de `service_tier` en la carga se conservan
- el modo rápido no reescribe `reasoning` ni `text.verbosity`

Para GPT 5.4 en particular, la configuración más común es:

- enviar `/fast on` en una sesión que use `openai/gpt-5.4` u `openai-codex/gpt-5.4`
- o establecer `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- si también usas OAuth de Codex, establece también `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Ejemplo:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Las sobrescrituras de sesión tienen prioridad sobre la configuración. Borrar la sobrescritura de sesión en la UI de Sessions
devuelve la sesión al valor predeterminado configurado.

### Rutas nativas de OpenAI frente a rutas compatibles con OpenAI

OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma diferente
a los proxies genéricos compatibles con OpenAI `/v1`:

- las rutas nativas `openai/*`, `openai-codex/*` y Azure OpenAI mantienen
  `reasoning: { effort: "none" }` intacto cuando deshabilitas explícitamente el razonamiento
- las rutas nativas de la familia OpenAI usan por defecto esquemas de herramientas en modo estricto
- los encabezados ocultos de atribución de OpenClaw (`originator`, `version` y
  `User-Agent`) solo se adjuntan en hosts nativos verificados de OpenAI
  (`api.openai.com`) y hosts nativos de Codex (`chatgpt.com/backend-api`)
- las rutas nativas de OpenAI/Codex mantienen el modelado de solicitudes exclusivo de OpenAI, como
  `service_tier`, `store` de Responses, cargas de compatibilidad de razonamiento de OpenAI y
  sugerencias de caché de prompt
- las rutas de tipo proxy compatibles con OpenAI conservan el comportamiento de compatibilidad más flexible y no
  fuerzan esquemas estrictos de herramientas, modelado de solicitudes exclusivo nativo ni encabezados ocultos
  de atribución de OpenAI/Codex

Azure OpenAI sigue estando en el grupo de enrutamiento nativo para comportamiento de transporte y compatibilidad,
pero no recibe los encabezados ocultos de atribución de OpenAI/Codex.

Esto preserva el comportamiento actual de OpenAI Responses nativo sin forzar adaptaciones antiguas
compatibles con OpenAI sobre backends `/v1` de terceros.

### Compactación del lado del servidor de OpenAI Responses

Para modelos directos de OpenAI Responses (`openai/*` usando `api: "openai-responses"` con
`baseUrl` en `api.openai.com`), OpenClaw ahora habilita automáticamente las sugerencias de carga de compactación del lado del servidor de OpenAI:

- Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
- Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`

De forma predeterminada, `compact_threshold` es el `70%` de `contextWindow` del modelo (o `80000`
cuando no está disponible).

### Habilitar explícitamente la compactación del lado del servidor

Úsalo cuando quieras forzar la inyección de `context_management` en modelos
compatibles de Responses (por ejemplo, Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Habilitar con un umbral personalizado

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Deshabilitar la compactación del lado del servidor

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` solo controla la inyección de `context_management`.
Los modelos directos de OpenAI Responses siguen forzando `store: true` salvo que la compatibilidad establezca
`supportsStore: false`.

## Notas

- Las referencias de modelos siempre usan `provider/model` (consulta [/concepts/models](/es/concepts/models)).
- Los detalles de autenticación + reglas de reutilización están en [/concepts/oauth](/es/concepts/oauth).
