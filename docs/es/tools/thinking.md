---
read_when:
    - Ajustar el análisis de directivas de razonamiento, modo rápido o detallado, o sus valores predeterminados
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-04-17T05:13:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de razonamiento (directivas /think)

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex y esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → razonamiento adaptativo gestionado por el proveedor (compatible con Anthropic Claude 4.6 y Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest`, `max` se asignan a `high`.
- Notas del proveedor:
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.
  - Anthropic Claude Opus 4.7 no usa razonamiento adaptativo de forma predeterminada. Su valor predeterminado de esfuerzo de API sigue siendo gestionado por el proveedor a menos que establezcas explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa `thinking: { type: "disabled" }` de forma predeterminada a menos que establezcas explícitamente el razonamiento en los parámetros del modelo o de la solicitud. Esto evita filtraciones de deltas `reasoning_content` del formato de stream no nativo de Anthropic de MiniMax.
  - Z.AI (`zai/*`) solo admite razonamiento binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida al enviar un mensaje que contiene solo una directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Reserva: `adaptive` para modelos Anthropic Claude 4.6, `off` para Anthropic Claude Opus 4.7 salvo que se configure explícitamente, `low` para otros modelos con capacidad de razonamiento, `off` en caso contrario.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Esto se mantiene para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o al restablecerse la sesión por inactividad.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una pista y el estado de la sesión no cambia.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de razonamiento actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al tiempo de ejecución del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que contiene solo la directiva activa una anulación de modo rápido para la sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea o como única directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Reserva: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en las solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene una única opción `/fast` compartida en ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo explícitos de Anthropic `serviceTier` / `service_tier` anulan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base proxy que no sean de Anthropic.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva activa el modo detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una pista sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la interfaz de usuario de sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en caso contrario.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados de herramientas estructurados (Pi, otros agentes JSON) devuelven cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto cada herramienta se inicia (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramientas siguen siendo visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan a menos que el modo detallado sea `on` o `full`.
- Cuando el modo detallado es `full`, las salidas de herramientas también se reenvían al completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva activa la salida de traza de Plugin para la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en caso contrario.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más limitado que `/verbose`: solo expone líneas de traza/depuración propiedad de plugins, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que contiene solo la directiva activa si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento a la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de razonamiento.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego reserva (`off`).

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda Heartbeat es el prompt de heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje heartbeat se aplican como de costumbre (pero evita cambiar valores predeterminados de sesión desde heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz web de chat

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Al seleccionar otro nivel, se escribe de inmediato la anulación de la sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación única `thinkingOnce`.
- La primera opción es siempre `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del modelo activo de la sesión: `adaptive` para Claude 4.6 en Anthropic, `off` para Anthropic Claude Opus 4.7 salvo que se configure, `low` para otros modelos con capacidad de razonamiento, `off` en caso contrario.
- El selector sigue siendo consciente del proveedor:
  - la mayoría de los proveedores muestran `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 muestra `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI muestra binario `off | on`
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas del chat y el selector permanecen sincronizados.
