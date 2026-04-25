---
read_when:
    - Ajustar los valores predeterminados del agente (modelos, thinking, espacio de trabajo, Heartbeat, medios, Skills)
    - Configurar enrutamiento multagente y bindings
    - Ajustar el comportamiento de sesión, entrega de mensajes y modo talk
summary: Valores predeterminados del agente, enrutamiento multagente, sesión, mensajes y configuración de talk
title: Configuración — agentes
x-i18n:
    generated_at: "2026-04-25T13:45:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

Claves de configuración con alcance de agente bajo `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` y `talk.*`. Para canales, herramientas, tiempo de ejecución de Gateway y otras
claves de nivel superior, consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Valores predeterminados del agente

### `agents.defaults.workspace`

Predeterminado: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no está configurada, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos predeterminada opcional de Skills para agentes que no configuran
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Configura `agents.list[].skills: []` para no usar Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos bootstrap del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla cuándo se inyectan los archivos bootstrap del espacio de trabajo en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos seguros de continuación (después de una respuesta completada del asistente) omiten la reinyección del bootstrap del espacio de trabajo, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.
- `"never"`: desactiva la inyección de bootstrap del espacio de trabajo y de archivos de contexto en cada turno. Usa esto solo para agentes que gestionan completamente su propio ciclo de vida del prompt (motores de contexto personalizados, tiempos de ejecución nativos que construyen su propio contexto o flujos especializados sin bootstrap). Los turnos de Heartbeat y recuperación tras Compaction también omiten la inyección.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del espacio de trabajo antes del truncamiento. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados en todos los archivos bootstrap del espacio de trabajo. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el texto de advertencia visible para el agente cuando el contexto bootstrap se trunca.
Predeterminado: `"once"`.

- `"off"`: nunca inyecta texto de advertencia en el prompt del sistema.
- `"once"`: inyecta la advertencia una vez por firma de truncamiento única (recomendado).
- `"always"`: inyecta la advertencia en cada ejecución cuando existe truncamiento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionadamente por subsistema en lugar de pasar todos por una única
configuración genérica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección bootstrap normal del espacio de trabajo.
- `agents.defaults.startupContext.*`:
  preludio de inicio de una sola vez para ejecuciones de `/new` y `/reset`,
  incluidos archivos recientes diarios `memory/*.md`.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos limitados en tiempo de ejecución y bloques inyectados propiedad del entorno de ejecución.
- `memory.qmd.limits.*`:
  tamaño de fragmentos e inyección de búsqueda de memoria indexada.

Usa la sobrescritura por agente correspondiente solo cuando un agente necesite un
presupuesto distinto:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones simples de `/new` y `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valores predeterminados compartidos para superficies de contexto limitadas en tiempo de ejecución.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de añadir metadatos
  de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: límite de resultados de herramientas en vivo usado para resultados persistidos y
  recuperación por desbordamiento.
- `postCompactionMaxChars`: límite de extracto de `AGENTS.md` usado durante la inyección de actualización tras Compaction.

#### `agents.list[].contextLimits`

Sobrescritura por agente para las configuraciones compartidas de `contextLimits`. Los campos omitidos heredan
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Límite global para la lista compacta de Skills inyectada en el prompt del sistema. Esto
no afecta la lectura de archivos `SKILL.md` bajo demanda.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Sobrescritura por agente para el presupuesto del prompt de Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles del lado más largo de la imagen en bloques de imagen de transcripción/herramienta antes de las llamadas al provider.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de la solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos preservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Usa como respaldo la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el prompt del sistema. Predeterminado: `auto` (preferencia del SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parámetros globales predeterminados del provider
      embeddedHarness: {
        runtime: "pi", // pi | auto | id de harness registrado, p. ej. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La forma de cadena establece solo el modelo principal.
  - La forma de objeto establece el principal más los modelos de failover ordenados.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación de imágenes nativa de Gemini, `fal/fal-ai/flux/dev` para fal, o `openai/gpt-image-2` para OpenAI Images.
  - Si seleccionas un provider/model directamente, configura también la autenticación correspondiente del provider (por ejemplo `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` u OAuth de OpenAI Codex para `openai/gpt-image-2`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un valor predeterminado de provider respaldado por autenticación. Primero prueba el provider predeterminado actual y luego los providers restantes de generación de imágenes registrados en orden de ID de provider.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Si se omite, `music_generate` aún puede inferir un valor predeterminado de provider respaldado por autenticación. Primero prueba el provider predeterminado actual y luego los providers restantes de generación de música registrados en orden de ID de provider.
  - Si seleccionas un provider/model directamente, configura también la autenticación/clave API correspondiente del provider.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un valor predeterminado de provider respaldado por autenticación. Primero prueba el provider predeterminado actual y luego los providers restantes de generación de video registrados en orden de ID de provider.
  - Si seleccionas un provider/model directamente, configura también la autenticación/clave API correspondiente del provider.
  - El provider integrado de generación de video Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones a nivel de provider `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la herramienta `pdf` para el enrutamiento del modelo.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `pdfMaxBytesMb`: límite de tamaño PDF predeterminado para la herramienta `pdf` cuando `maxBytesMb` no se pasa en el momento de la llamada.
- `pdfMaxPages`: número máximo predeterminado de páginas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel verbose predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `elevatedDefault`: nivel de salida elevada predeterminado para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo `openai/gpt-5.4` para acceso con clave API u `openai-codex/gpt-5.5` para OAuth de Codex). Si omites el provider, OpenClaw primero prueba un alias, luego una coincidencia única de provider configurado para ese ID exacto de modelo y solo después recurre al provider predeterminado configurado (comportamiento heredado en desuso por compatibilidad, así que prefiere `provider/model` explícito). Si ese provider ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer provider/model configurado en lugar de mostrar un valor predeterminado obsoleto de un provider eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del provider, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`).
  - Ediciones seguras: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas. `config set` rechaza reemplazos que eliminarían entradas existentes de la lista de permitidos a menos que pases `--replace`.
  - Los flujos de configuración/onboarding con alcance de provider fusionan los modelos seleccionados del provider en este mapa y preservan los providers no relacionados que ya estuvieran configurados.
  - Para modelos directos de OpenAI Responses, la Compaction del lado del servidor se habilita automáticamente. Usa `params.responsesServerCompaction: false` para dejar de inyectar `context_management`, o `params.responsesCompactThreshold` para sobrescribir el umbral. Consulta [Compaction del lado del servidor de OpenAI](/es/providers/openai#server-side-compaction-responses-api).
- `params`: parámetros globales predeterminados del provider aplicados a todos los modelos. Se configuran en `agents.defaults.params` (por ejemplo `{ cacheRetention: "long" }`).
- Precedencia de fusión de `params` (configuración): `agents.defaults.params` (base global) es sobrescrito por `agents.defaults.models["provider/model"].params` (por modelo), y luego `agents.list[].params` (ID de agente coincidente) sobrescribe por clave. Consulta [Caché de prompts](/es/reference/prompt-caching) para más detalles.
- `params.extra_body`/`params.extraBody`: JSON avanzado de paso directo fusionado en los cuerpos de solicitud de `api: "openai-completions"` para proxies compatibles con OpenAI. Si colisiona con claves de solicitud generadas, el cuerpo extra prevalece; las rutas de completions no nativas siguen eliminando después `store`, que es exclusivo de OpenAI.
- `embeddedHarness`: política predeterminada de tiempo de ejecución embebido del agente de bajo nivel. Si se omite `runtime`, el valor predeterminado es OpenClaw Pi. Usa `runtime: "pi"` para forzar el harness PI integrado, `runtime: "auto"` para permitir que los harnesses de plugin registrados reclamen modelos compatibles, o un ID de harness registrado como `runtime: "codex"`. Configura `fallback: "none"` para desactivar el respaldo automático a PI. Los tiempos de ejecución explícitos de plugins como `codex` fallan cerrados de forma predeterminada a menos que configures `fallback: "pi"` en el mismo ámbito de sobrescritura. Mantén las referencias de modelo canónicas como `provider/model`; selecciona Codex, Claude CLI, Gemini CLI y otros backends de ejecución mediante configuración de tiempo de ejecución en lugar de prefijos heredados de provider de tiempo de ejecución. Consulta [Tiempos de ejecución del agente](/es/concepts/agent-runtimes) para entender en qué se diferencia esto de la selección de provider/model.
- Los escritores de configuración que mutan estos campos (por ejemplo `/models set`, `/models set-image` y los comandos de añadir/eliminar fallback) guardan la forma de objeto canónica y preservan las listas de fallback existentes cuando es posible.
- `maxConcurrent`: número máximo de ejecuciones paralelas del agente entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qué ejecutor de bajo nivel ejecuta los turnos embebidos del agente.
La mayoría de las implementaciones deberían mantener el tiempo de ejecución predeterminado OpenClaw Pi.
Úsalo cuando un plugin de confianza proporciona un harness nativo, como el
harness integrado app-server de Codex. Para el modelo mental, consulta
[Tiempos de ejecución del agente](/es/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` o un ID de harness de plugin registrado. El plugin integrado de Codex registra `codex`.
- `fallback`: `"pi"` o `"none"`. En `runtime: "auto"`, si se omite `fallback`, el valor predeterminado es `"pi"` para que las configuraciones antiguas puedan seguir usando PI cuando ningún harness de plugin reclame una ejecución. En el modo explícito de tiempo de ejecución de plugin, como `runtime: "codex"`, si se omite `fallback`, el valor predeterminado es `"none"` para que la falta de un harness falle en lugar de usar PI silenciosamente. Las sobrescrituras de tiempo de ejecución no heredan `fallback` de un ámbito más amplio; configura `fallback: "pi"` junto con el tiempo de ejecución explícito cuando quieras intencionalmente ese respaldo de compatibilidad. Los fallos del harness de plugin seleccionado siempre se muestran directamente.
- Sobrescrituras de entorno: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sobrescribe `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` sobrescribe `fallback` para ese proceso.
- Para implementaciones solo de Codex, configura `model: "openai/gpt-5.5"` y `embeddedHarness.runtime: "codex"`. También puedes configurar `embeddedHarness.fallback: "none"` explícitamente por legibilidad; es el valor predeterminado para tiempos de ejecución explícitos de plugin.
- La elección del harness queda fijada por ID de sesión después de la primera ejecución embebida. Los cambios de configuración/entorno afectan a sesiones nuevas o reiniciadas, no a una transcripción existente. Las sesiones heredadas con historial de transcripción pero sin fijación registrada se tratan como fijadas a PI. `/status` informa el tiempo de ejecución efectivo, por ejemplo `Runtime: OpenClaw Pi Default` o `Runtime: OpenAI Codex`.
- Esto solo controla el harness de chat embebido. La generación de medios, visión, PDF, música, video y TTS siguen usando su configuración de provider/model.

**Alias abreviados integrados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` o GPT-5.5 configurado con OAuth de Codex |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Tus alias configurados siempre prevalecen sobre los predeterminados.

Los modelos Z.AI GLM-4.x habilitan automáticamente el modo thinking a menos que configures `--thinking off` o definas tú mismo `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI habilitan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Configura `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Los modelos Anthropic Claude 4.6 usan `adaptive` thinking de forma predeterminada cuando no se establece un nivel explícito de thinking.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útiles como copia de seguridad cuando fallan los providers de API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // O usa systemPromptFileArg cuando la CLI acepta un indicador de archivo de prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI están orientados primero a texto; las herramientas siempre están desactivadas.
- Las sesiones se admiten cuando `sessionArg` está configurado.
- Se admite paso directo de imágenes cuando `imageArg` acepta rutas de archivos.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el prompt del sistema ensamblado por OpenClaw con una cadena fija. Configúralo en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; un valor vacío o solo con espacios se ignora. Es útil para experimentos de prompt controlados.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlays de prompt independientes del provider aplicados por familia de modelos. Los ID de modelos de la familia GPT-5 reciben el contrato de comportamiento compartido entre providers; `personality` controla solo la capa de estilo de interacción amistosa.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (predeterminado) y `"on"` habilitan la capa de estilo de interacción amistosa.
- `"off"` desactiva solo la capa amistosa; el contrato de comportamiento etiquetado de GPT-5 sigue habilitado.
- El valor heredado `plugins.entries.openai.config.personality` sigue leyéndose cuando esta configuración compartida no está establecida.

### `agents.defaults.heartbeat`

Ejecuciones periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desactiva
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predeterminado: true; false omite la sección Heartbeat del prompt del sistema
        lightContext: false, // predeterminado: false; true conserva solo HEARTBEAT.md de los archivos bootstrap del espacio de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada heartbeat en una sesión nueva (sin historial de conversación)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predeterminado) | block
        target: "none", // predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave API) o `1h` (autenticación OAuth). Configúralo en `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto bootstrap. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de error de herramienta durante las ejecuciones de heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno del agente de heartbeat antes de que se aborte. Déjalo sin configurar para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/MD. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de heartbeat usan contexto bootstrap ligero y conservan solo `HEARTBEAT.md` de los archivos bootstrap del espacio de trabajo.
- `isolatedSession`: cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce el costo por heartbeat de ~100K a ~2-5K tokens.
- Por agente: configura `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- Los Heartbeats ejecutan turnos completos del agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un plugin provider de Compaction registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // se usa cuando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desactiva la reinyección
        model: "openrouter/anthropic/claude-sonnet-4-6", // sobrescritura opcional de modelo solo para Compaction
        notifyUser: true, // envía avisos breves cuando comienza y termina la Compaction (predeterminado: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen fragmentado para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin provider de Compaction registrado. Cuando está configurado, se llama al `summarize()` del provider en lugar del resumen LLM integrado. En caso de error, recurre al integrado. Configurar un provider fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de Compaction antes de que OpenClaw la aborte. Predeterminado: `900`.
- `keepRecentTokens`: presupuesto del punto de corte de Pi para conservar literalmente la cola más reciente de la transcripción. El `/compact` manual respeta esto cuando está configurado explícitamente; de lo contrario, la Compaction manual es un punto de control estricto.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone orientación integrada de retención de identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto opcional personalizado de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `qualityGuard`: comprobaciones de reintento ante salida malformada para resúmenes safeguard. Habilitado de forma predeterminada en modo safeguard; configura `enabled: false` para omitir la auditoría.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de `AGENTS.md` para reinyectar después de la Compaction. Predeterminado: `["Session Startup", "Red Lines"]`; configura `[]` para desactivar la reinyección. Cuando no está configurado o se establece explícitamente en ese par predeterminado, también se aceptan como respaldo heredado los encabezados antiguos `Every Session`/`Safety`.
- `model`: sobrescritura opcional `provider/model-id` solo para el resumen de Compaction. Usa esto cuando la sesión principal deba conservar un modelo pero los resúmenes de Compaction deban ejecutarse con otro; si no se configura, Compaction usa el modelo principal de la sesión.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando comienza y cuando termina la Compaction (por ejemplo, "Compacting context..." y "Compaction complete"). Está desactivado de forma predeterminada para mantener la Compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la Compaction automática para almacenar memorias duraderas. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Poda **resultados de herramientas antiguos** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duración (ms/s/m/h), unidad predeterminada: minutos
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita pasadas de poda.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la poda (después del último toque de caché).
- La poda primero recorta suavemente los resultados de herramientas sobredimensionados y luego limpia por completo los resultados más antiguos si es necesario.

**Soft-trim** conserva el principio + el final e inserta `...` en el medio.

**Hard-clear** reemplaza todo el resultado de la herramienta con el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni limpian.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la poda.

</Accordion>

Consulta [Poda de sesión](/es/concepts/session-pruning) para los detalles de comportamiento.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Sobrescrituras por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan por defecto `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500ms. Sobrescritura por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para ver detalles de comportamiento + fragmentación.

### Indicadores de escritura

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Indicadores de escritura](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para el agente embebido. Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // También se admiten SecretRefs / contenido en línea:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalles del sandbox">

**Backend:**

- `docker`: tiempo de ejecución local de Docker (predeterminado)
- `ssh`: tiempo de ejecución remoto genérico respaldado por SSH
- `openshell`: tiempo de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del tiempo de ejecución se mueve a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH con formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por ámbito
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos en línea o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del tiempo de ejecución de secretos antes de que comience la sesión de sandbox

**Comportamiento del backend SSH:**

- siembra el espacio de trabajo remoto una vez después de crear o recrear
- luego mantiene canónico el espacio de trabajo remoto SSH
- enruta `exec`, herramientas de archivos y rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador de sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo de sandbox por ámbito bajo `~/.openclaw/sandboxes`
- `ro`: espacio de trabajo de sandbox en `/workspace`, espacio de trabajo del agente montado en solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado en lectura/escritura en `/workspace`

**Ámbito:**

- `session`: contenedor + espacio de trabajo por sesión
- `agent`: un contenedor + espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional de política de OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: siembra el remoto desde el local antes de exec, sincroniza de vuelta después de exec; el espacio de trabajo local sigue siendo canónico
- `remote`: siembra el remoto una vez cuando se crea el sandbox y luego mantiene canónico el espacio de trabajo remoto

En modo `remote`, las ediciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el sandbox después del paso de siembra.
El transporte es SSH al sandbox de OpenShell, pero el plugin gestiona el ciclo de vida del sandbox y la sincronización opcional en espejo.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan por defecto `network: "none"`**; configúralo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada a menos que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (uso de emergencia).

**Los adjuntos entrantes** se preparan en `media/inbound/*` en el espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; las vinculaciones globales y por agente se fusionan.

**Navegador en sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. La URL de noVNC se inyecta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador por noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) bloquea que las sesiones en sandbox apunten al navegador del host.
- `network` usa por defecto `openclaw-sandbox-browser` (red bridge dedicada). Configúralo en `bridge` solo cuando quieras explícitamente conectividad bridge global.
- `cdpSourceRange` restringe opcionalmente la entrada de CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador de sandbox. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de lanzamiento se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts de contenedores:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado de forma predeterminada)
  - `--disable-3d-apis`, `--disable-software-rasterizer` y `--disable-gpu` están
    habilitados de forma predeterminada y pueden desactivarse con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar las extensiones si tu flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; configura `0` para usar el
    límite de procesos predeterminado de Chromium.
  - más `--no-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen del contenedor; usa una imagen de navegador personalizada con un entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El sandboxing del navegador y `sandbox.docker.binds` son solo para Docker.

Compila las imágenes:

```bash
scripts/sandbox-setup.sh           # imagen principal del sandbox
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

### `agents.list` (sobrescrituras por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // o { primary, fallbacks }
        thinkingDefault: "high", // sobrescritura por agente del nivel de thinking
        reasoningDefault: "on", // sobrescritura por agente de la visibilidad de razonamiento
        fastModeDefault: false, // sobrescritura por agente del modo rápido
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sobrescribe por clave los params de defaults.models coincidentes
        skills: ["docs-search"], // reemplaza agents.defaults.skills cuando se establece
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: ID estable del agente (obligatorio).
- `default`: cuando se establecen varios, gana el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena sobrescribe solo `primary`; la forma de objeto `{ primary, fallbacks }` sobrescribe ambos (`[]` desactiva los fallbacks globales). Los trabajos cron que solo sobrescriben `primary` siguen heredando los fallbacks predeterminados a menos que configures `fallbacks: []`.
- `params`: params de stream por agente fusionados sobre la entrada del modelo seleccionado en `agents.defaults.models`. Usa esto para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de fusionarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel predeterminado opcional de thinking por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna sobrescritura por mensaje o sesión. El perfil del provider/model seleccionado controla qué valores son válidos; para Google Gemini, `adaptive` mantiene el thinking dinámico del provider (`thinkingLevel` omitido en Gemini 3/3.1, `thinkingBudget: -1` en Gemini 2.5).
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Se aplica cuando no se establece ninguna sobrescritura de razonamiento por mensaje o sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no se establece ninguna sobrescritura del modo rápido por mensaje o sesión.
- `embeddedHarness`: sobrescritura opcional por agente de la política del harness de bajo nivel. Usa `{ runtime: "codex" }` para hacer que un agente sea solo Codex mientras otros agentes conservan el fallback predeterminado a PI en modo `auto`.
- `runtime`: descriptor opcional del tiempo de ejecución por agente. Usa `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar por defecto sesiones de harness ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ID de agentes para `sessions_spawn` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea las llamadas a `sessions_spawn` que omitan `agentId` (fuerza selección explícita de perfil; predeterminado: false).

---

## Enrutamiento multagente

Ejecuta varios agentes aislados dentro de un solo Gateway. Consulta [Multagente](/es/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de coincidencia de binding

- `type` (opcional): `route` para enrutamiento normal (si falta, el valor predeterminado es route), `acp` para bindings persistentes de conversaciones ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específicos del canal)
- `acp` (opcional; solo para `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden determinista de coincidencia:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin peer/guild/team)
5. `match.accountId: "*"` (a nivel de canal)
6. Agente predeterminado

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para las entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de binding de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Herramientas + espacio de trabajo de solo lectura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sin acceso al sistema de archivos (solo mensajería)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulta [Sandbox y herramientas multagente](/es/tools/multi-agent-sandbox-tools) para los detalles de precedencia.

---

## Sesión

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // omitir la bifurcación del hilo padre por encima de este recuento de tokens (0 desactiva)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // presupuesto rígido opcional
      highWaterBytes: "400mb", // objetivo opcional después de la limpieza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desvinculación automática predeterminada por inactividad en horas (`0` desactiva)
      maxAgeHours: 0, // edad máxima rígida predeterminada en horas (`0` desactiva)
    },
    mainKey: "main", // heredado (el tiempo de ejecución siempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalles de los campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes en un contexto de canal comparten una sola sesión (úsalo solo cuando se pretenda contexto compartido).
- **`dmScope`**: cómo se agrupan los MD.
  - `main`: todos los MD comparten la sesión principal.
  - `per-peer`: aísla por ID de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna ID canónicos a pares con prefijo de provider para compartir sesiones entre canales.
- **`reset`**: política principal de restablecimiento. `daily` restablece a la `atHour` local; `idle` restablece después de `idleMinutes`. Cuando ambos están configurados, gana el que expire primero.
- **`resetByType`**: sobrescrituras por tipo (`direct`, `group`, `thread`). El heredado `dm` se acepta como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` permitido en la sesión padre al crear una sesión de hilo bifurcada (predeterminado `100000`).
  - Si `totalTokens` del padre está por encima de este valor, OpenClaw inicia una nueva sesión de hilo en lugar de heredar el historial de transcripción del padre.
  - Configura `0` para desactivar esta protección y permitir siempre la bifurcación desde el padre.
- **`mainKey`**: campo heredado. El tiempo de ejecución siempre usa `"main"` para el contenedor principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta entre agentes durante intercambios entre agentes (entero, rango: `0`–`5`). `0` desactiva el encadenamiento de ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. La primera denegación gana.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `warn` emite solo advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`).
  - `rotateBytes`: rota `sessions.json` cuando supera este tamaño (predeterminado `10mb`).
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. Predeterminado: `pruneAfter`; configura `false` para desactivar.
  - `maxDiskBytes`: presupuesto de disco opcional para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. Predeterminado: `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los providers pueden sobrescribirlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desvinculación automática predeterminada por inactividad en horas (`0` desactiva; los providers pueden sobrescribirlo)
  - `maxAgeHours`: edad máxima rígida predeterminada en horas (`0` desactiva; los providers pueden sobrescribirlo)

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // o "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 desactiva
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefijo de respuesta

Sobrescrituras por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (gana la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción            | Ejemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del provider    | `anthropic`                 |
| `{thinkingLevel}` | Nivel actual de thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)          |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de acuse

- Usa por defecto `identity.emoji` del agente activo o, en su defecto, `"👀"`. Configura `""` para desactivar.
- Sobrescrituras por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina el acuse después de responder en Slack, Discord y Telegram.
- `messages.statusReactions.enabled`: habilita reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, si no se configura, las reacciones de estado permanecen habilitadas cuando las reacciones de acuse están activas.
  En Telegram, configúralo explícitamente en `true` para habilitar reacciones de estado del ciclo de vida.

### Debounce de entrada

Agrupa mensajes rápidos de solo texto del mismo remitente en un único turno del agente. Los medios/adjuntos se vacían de inmediato. Los comandos de control omiten el debounce.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controla el modo predeterminado de TTS automático: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede sobrescribir las preferencias locales y `/tts status` muestra el estado efectivo.
- `summaryModel` sobrescribe `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada; `modelOverrides.allowProvider` usa `false` por defecto (opt-in).
- Las claves API usan como respaldo `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- Los providers de voz integrados pertenecen a plugins. Si `plugins.allow` está configurado, incluye cada plugin provider de TTS que quieras usar, por ejemplo `microsoft` para Edge TTS. El ID de provider heredado `edge` se acepta como alias de `microsoft`.
- `providers.openai.baseUrl` sobrescribe el endpoint de TTS de OpenAI. El orden de resolución es configuración, luego `OPENAI_TTS_BASE_URL` y después `https://api.openai.com/v1`.
- Cuando `providers.openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y relaja la validación de modelo/voz.

---

## Talk

Valores predeterminados para el modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios providers de Talk.
- Las claves planas heredadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad y se migran automáticamente a `talk.providers.<provider>`.
- Los ID de voz usan como respaldo `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas en texto plano u objetos `SecretRef`.
- El respaldo `ELEVENLABS_API_KEY` se aplica solo cuando no hay ninguna clave API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres amigables.
- `providers.mlx.modelId` selecciona el repositorio de Hugging Face usado por el helper local MLX de macOS. Si se omite, macOS usa `mlx-community/Soprano-80M-bf16`.
- La reproducción MLX de macOS se ejecuta mediante el helper integrado `openclaw-mlx-tts` cuando está presente, o mediante un ejecutable en `PATH`; `OPENCLAW_MLX_TTS_BIN` sobrescribe la ruta del helper para desarrollo.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk tras el silencio del usuario antes de enviar la transcripción. Si no se configura, se mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — todas las demás claves de configuración
- [Configuración](/es/gateway/configuration) — tareas comunes y configuración rápida
- [Ejemplos de configuración](/es/gateway/configuration-examples)
