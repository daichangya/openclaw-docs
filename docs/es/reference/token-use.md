---
read_when:
    - Explicación del uso de tokens, costos o ventanas de contexto
    - Depuración del crecimiento del contexto o del comportamiento de compactación
summary: Cómo OpenClaw construye el contexto del prompt e informa el uso de tokens + costos
title: Uso de tokens y costos
x-i18n:
    generated_at: "2026-04-12T05:10:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8c856549cd28b8364a640e6fa9ec26aa736895c7a993e96cbe85838e7df2dfb
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens y costos

OpenClaw rastrea **tokens**, no caracteres. Los tokens dependen del modelo, pero la mayoría de los modelos de estilo OpenAI promedian ~4 caracteres por token para texto en inglés.

## Cómo se construye el prompt del sistema

OpenClaw ensambla su propio prompt del sistema en cada ejecución. Incluye:

- Lista de herramientas + descripciones breves
- Lista de Skills (solo metadatos; las instrucciones se cargan bajo demanda con `read`)
- Instrucciones de autoactualización
- Archivos del espacio de trabajo + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` cuando son nuevos, además de `MEMORY.md` cuando está presente o `memory.md` como alternativa en minúsculas). Los archivos grandes se truncan según `agents.defaults.bootstrapMaxChars` (predeterminado: 20000), y la inyección total de bootstrap está limitada por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 150000). Los archivos diarios `memory/*.md` no forman parte del prompt bootstrap normal; permanecen disponibles bajo demanda mediante herramientas de memoria en turnos normales, pero `/new` y `/reset` sin argumentos pueden anteponer un bloque único de contexto de inicio con memoria diaria reciente para ese primer turno. Ese preludio de inicio está controlado por `agents.defaults.startupContext`.
- Hora (UTC + zona horaria del usuario)
- Etiquetas de respuesta + comportamiento de heartbeat
- Metadatos de tiempo de ejecución (host/OS/model/thinking)

Consulta el desglose completo en [Prompt del sistema](/es/concepts/system-prompt).

## Qué cuenta dentro de la ventana de contexto

Todo lo que recibe el modelo cuenta para el límite de contexto:

- Prompt del sistema (todas las secciones enumeradas arriba)
- Historial de conversación (mensajes del usuario + del asistente)
- Llamadas a herramientas y resultados de herramientas
- Adjuntos/transcripciones (imágenes, audio, archivos)
- Resúmenes de compactación y artefactos de poda
- Wrappers del proveedor o encabezados de seguridad (no visibles, pero igualmente contabilizados)

En el caso de imágenes, OpenClaw reduce la escala de las cargas de imágenes de transcripción/herramientas antes de las llamadas al proveedor.
Usa `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`) para ajustarlo:

- Los valores más bajos suelen reducir el uso de vision tokens y el tamaño de la carga.
- Los valores más altos conservan más detalle visual para capturas de pantalla centradas en OCR/UI.

Para un desglose práctico (por archivo inyectado, herramientas, Skills y tamaño del prompt del sistema), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Cómo ver el uso actual de tokens

Usa esto en el chat:

- `/status` → **tarjeta de estado con muchos emojis** con el modelo de la sesión, uso de contexto,
  tokens de entrada/salida de la última respuesta y **costo estimado** (solo con API key).
- `/usage off|tokens|full` → agrega un **pie de uso por respuesta** a cada respuesta.
  - Persiste por sesión (se almacena como `responseUsage`).
  - La autenticación OAuth **oculta el costo** (solo tokens).
- `/usage cost` → muestra un resumen local de costos a partir de los logs de sesión de OpenClaw.

Otras superficies:

- **TUI/Web TUI:** `/status` y `/usage` son compatibles.
- **CLI:** `openclaw status --usage` y `openclaw channels list` muestran
  ventanas de cuota del proveedor normalizadas (`X% left`, no costos por respuesta).
  Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi y z.ai.

Las superficies de uso normalizan alias comunes de campos nativos del proveedor antes de mostrarlos.
Para tráfico de Responses de la familia OpenAI, eso incluye tanto `input_tokens` /
`output_tokens` como `prompt_tokens` / `completion_tokens`, por lo que los nombres
de campos específicos del transporte no cambian `/status`, `/usage` ni los resúmenes de sesión.
El uso JSON de Gemini CLI también se normaliza: el texto de respuesta proviene de `response`, y
`stats.cached` se asigna a `cacheRead`, con `stats.input_tokens - stats.cached`
usado cuando la CLI omite un campo explícito `stats.input`.
Para tráfico nativo de Responses de la familia OpenAI, los alias de uso de WebSocket/SSE se
normalizan de la misma manera, y los totales recurren a entrada + salida normalizadas cuando
`total_tokens` falta o es `0`.
Cuando la instantánea de la sesión actual es escasa, `/status` y `session_status` también pueden
recuperar contadores de tokens/cache y la etiqueta del modelo activo en tiempo de ejecución desde el
log de uso de la transcripción más reciente. Los valores no nulos existentes en vivo siguen teniendo
prioridad sobre los valores recuperados de la transcripción, y los totales orientados al prompt más grandes
de la transcripción pueden prevalecer cuando faltan los totales almacenados o son menores.
La autenticación de uso para ventanas de cuota del proveedor proviene de hooks específicos del proveedor cuando
están disponibles; de lo contrario, OpenClaw recurre a hacer coincidir credenciales OAuth/API key
desde perfiles de autenticación, variables de entorno o configuración.

## Estimación de costos (cuando se muestra)

Los costos se estiman a partir de tu configuración de precios del modelo:

```
models.providers.<provider>.models[].cost
```

Estos son **USD por 1M tokens** para `input`, `output`, `cacheRead` y
`cacheWrite`. Si faltan los precios, OpenClaw muestra solo tokens. Los tokens OAuth
nunca muestran costo en dólares.

## Impacto del TTL de caché y la poda

El almacenamiento en caché de prompts del proveedor solo se aplica dentro de la ventana TTL de caché. OpenClaw puede
ejecutar opcionalmente **poda por cache-ttl**: poda la sesión una vez que el TTL de caché
ha expirado, luego restablece la ventana de caché para que las solicitudes posteriores puedan reutilizar
el contexto recién almacenado en caché en lugar de volver a almacenar en caché todo el historial. Esto mantiene
más bajos los costos de escritura en caché cuando una sesión queda inactiva más allá del TTL.

Configúralo en [Configuración de Gateway](/es/gateway/configuration) y consulta los
detalles del comportamiento en [Poda de sesión](/es/concepts/session-pruning).

Heartbeat puede mantener la caché **caliente** durante periodos de inactividad. Si el TTL de caché de tu modelo
es `1h`, establecer el intervalo de heartbeat justo por debajo de eso (por ejemplo, `55m`) puede evitar
volver a almacenar en caché el prompt completo, reduciendo los costos de escritura en caché.

En configuraciones con varios agentes, puedes mantener una configuración de modelo compartida y ajustar el comportamiento de caché
por agente con `agents.list[].params.cacheRetention`.

Para una guía completa opción por opción, consulta [Prompt Caching](/es/reference/prompt-caching).

Para los precios de la API de Anthropic, las lecturas de caché son significativamente más baratas que los tokens
de entrada, mientras que las escrituras de caché se facturan con un multiplicador más alto. Consulta los precios de caché de prompt de Anthropic para ver las tarifas más recientes y los multiplicadores de TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ejemplo: mantener caliente una caché de 1h con heartbeat

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
          cacheRetention: "long" # línea base predeterminada para la mayoría de los agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantiene caliente la caché larga para sesiones profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evita escrituras de caché para notificaciones intermitentes
```

`agents.list[].params` se fusiona sobre `params` del modelo seleccionado, por lo que puedes
sobrescribir solo `cacheRetention` y heredar sin cambios los demás valores predeterminados del modelo.

### Ejemplo: habilitar el encabezado beta de contexto Anthropic 1M

La ventana de contexto de 1M de Anthropic está actualmente protegida por beta. OpenClaw puede inyectar el
valor `anthropic-beta` requerido cuando habilitas `context1m` en modelos Opus
o Sonnet compatibles.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Esto se asigna al encabezado beta `context-1m-2025-08-07` de Anthropic.

Esto solo se aplica cuando `context1m: true` está configurado en esa entrada del modelo.

Requisito: la credencial debe ser apta para uso de contexto largo. Si no lo es,
Anthropic responde con un error de límite de tasa del lado del proveedor para esa solicitud.

Si autenticas Anthropic con tokens OAuth/de suscripción (`sk-ant-oat-*`),
OpenClaw omite el encabezado beta `context-1m-*` porque Anthropic actualmente
rechaza esa combinación con HTTP 401.

## Consejos para reducir la presión de tokens

- Usa `/compact` para resumir sesiones largas.
- Recorta las salidas grandes de herramientas en tus flujos de trabajo.
- Reduce `agents.defaults.imageMaxDimensionPx` para sesiones con muchas capturas de pantalla.
- Mantén breves las descripciones de Skills (la lista de Skills se inyecta en el prompt).
- Prefiere modelos más pequeños para trabajo detallado y exploratorio.

Consulta [Skills](/es/tools/skills) para la fórmula exacta de sobrecarga de la lista de Skills.
