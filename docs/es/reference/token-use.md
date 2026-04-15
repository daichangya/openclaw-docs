---
read_when:
    - Explicación del uso de tokens, costos o ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de Compaction
summary: Cómo OpenClaw crea el contexto del prompt e informa el uso de tokens y los costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-04-15T19:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens y costos

OpenClaw rastrea **tokens**, no caracteres. Los tokens dependen del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token en texto en inglés.

## Cómo se crea el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`).
  El bloque compacto de Skills está limitado por `skills.limits.maxSkillsPromptChars`,
  con una anulación opcional por agente en
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrucciones de autoactualización
- Espacio de trabajo + archivos de arranque (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando es nuevo, además de `MEMORY.md` cuando está presente o `memory.md` como alternativa en minúsculas). Los archivos grandes se truncan con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000), y la inyección total de bootstrap está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). Los archivos diarios `memory/*.md` no forman parte del prompt bootstrap normal; siguen siendo bajo demanda mediante herramientas de memoria en turnos ordinarios, pero `/new` y `/reset` sin argumentos pueden anteponer un bloque de contexto de inicio de una sola vez con la memoria diaria reciente para ese primer turno. Ese preludio de inicio está controlado por `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de Heartbeat
- Metadatos de runtime (host/SO/modelo/pensamiento)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta dentro de la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones listadas arriba)
- Historial de conversación (mensajes del usuario + del asistente)
- Llamadas de herramientas y resultados de herramientas
- Archivos adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de Compaction y artefactos de poda
- Wrappers del proveedor o encabezados de seguridad (no visibles, pero igualmente contados)

Algunas superficies pesadas en runtime tienen sus propios límites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Las anulaciones por agente se encuentran en `agents.list[].contextLimits`. Estos controles
son para extractos limitados de runtime y bloques inyectados que pertenecen al runtime. Están
separados de los límites de bootstrap, los límites del contexto de inicio y los límites
del prompt de Skills.

Para imágenes, OpenClaw reduce la escala de las cargas de imágenes de transcripción/herramientas antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustar esto:

- Los valores más bajos normalmente reducen el uso de vision tokens y el tamaño de la carga.
- Los valores más altos preservan más detalle visual para capturas de pantalla centradas en OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa estos comandos en el chat:

- `/status` → **tarjeta de estado enriquecida con emoji** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **costo estimado** (solo con API key).
- `/usage off|tokens|full` → agrega un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (se almacena como `responseUsage`).
  - La autenticación OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos a partir de los registros de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** se admiten `/status` y `/usage`.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota del proveedor normalizadas (`X% restante`, no costos por respuesta).
  Proveedores actuales de ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para el tráfico de Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, de modo que los nombres de campo específicos del transporte
no cambien `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta proviene de `response`, y
`stats.cached` se asigna a `cacheRead`, con `stats.input_tokens - stats.cached`
usado cuando la CLI omite un campo explícito `stats.input`.
Para el tráfico nativo de Responses de la familia OpenAI, los alias de uso de WebSocket/SSE se
normalizan de la misma manera, y los totales vuelven a usar entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/cache y la etiqueta activa del modelo de runtime a partir del registro de uso
de la transcripción más reciente. Los valores activos no nulos existentes siguen teniendo prioridad
sobre los valores recuperados de la transcripción, y los totales de transcripción más grandes orientados al prompt
pueden prevalecer cuando faltan los totales almacenados o son menores.
La autenticación de uso para las ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando están
disponibles; de lo contrario, OpenClaw recurre a hacer coincidir credenciales OAuth/API key
desde perfiles de autenticación, entorno o configuración.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de tu configuración de precios del modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran costo en dólares.

## Impacto del TTL de caché y la poda

El almacenamiento en caché del prompt del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede
ejecutar opcionalmente **poda por cache-ttl**: poda la sesión una vez que el TTL de caché
ha expirado y luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar el
contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene
más bajos los costos de escritura de caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración del Gateway](/es/gateway/configuration) y consulta los
detalles del comportamiento en [Poda de sesión](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **activa** durante intervalos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de Heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar
volver a almacenar en caché todo el prompt, reduciendo los costos de escritura de caché.

En configuraciones multiagente, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa, control por control, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los
tokens de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los precios
de prompt caching de Anthropic para ver las tarifas más recientes y los multiplicadores de TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener activa una caché de 1h con Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Ejemplo: tráfico mixto con estrategia de caché por agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # referencia predeterminada para la mayoría de los agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantiene activa una caché larga para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evita escrituras de caché para notificaciones en ráfaga
```

`agents.list[].params` se fusiona encima de `params` del modelo seleccionado, por lo que puedes
anular solo `cacheRetention` y heredar sin cambios el resto de los valores predeterminados del modelo.

### Ejemplo: habilitar el encabezado beta de contexto 1M de Anthropic

La ventana de contexto de 1M de Anthropic actualmente está restringida por beta. OpenClaw puede inyectar el
valor `anthropic-beta` requerido cuando habilitas `context1m` en modelos compatibles Opus
o Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Esto se asigna al encabezado beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está establecido en esa entrada de modelo.

Requisito: la credencial debe ser apta para el uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/de suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo exploratorio y verboso.

Consulta [Skills](/es/tools/skills) para ver la fórmula exacta de sobrecarga de la lista de Skills.
