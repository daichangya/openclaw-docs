---
read_when:
    - Ajustar el análisis o los valores predeterminados de las directivas de razonamiento, modo rápido o detallado
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-04-21T19:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de razonamiento (directivas `/think`)

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “pensar”
  - low → “pensar intensamente”
  - medium → “pensar más intensamente”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (esfuerzo de GPT-5.2 + modelos Codex y Anthropic Claude Opus 4.7)
  - adaptive → razonamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock y Anthropic Claude Opus 4.7)
  - max → razonamiento máximo del proveedor (actualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de razonamiento están controlados por el perfil del proveedor. Los plugins del proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles incompatibles ya almacenados se reasignan según el rango del perfil del proveedor. `adaptive` vuelve a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` vuelven al mayor nivel compatible distinto de `off` para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de razonamiento explícito.
  - Anthropic Claude Opus 4.7 no usa razonamiento adaptativo de forma predeterminada. El valor predeterminado de esfuerzo de su API sigue siendo propiedad del proveedor, a menos que establezca explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad específica del modelo con `effort` de la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga útil de razonamiento deshabilitado en lugar de enviar un valor no compatible.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }`, a menos que establezca explícitamente el razonamiento en los parámetros del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` del formato de stream no nativo de Anthropic de MiniMax.
  - Z.AI (`zai/*`) solo admite razonamiento binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida al enviar un mensaje que contiene solo la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Alternativa: valor predeterminado declarado por el proveedor cuando está disponible, `low` para otros modelos del catálogo marcados como compatibles con razonamiento y `off` en caso contrario.

## Establecer un valor predeterminado de sesión

- Envíe un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Esto se mantiene para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o al restablecerse la sesión por inactividad.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión no cambia.
- Envíe `/think` (o `/think:`) sin argumento para ver el nivel de razonamiento actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que contiene solo la directiva activa o desactiva una anulación de modo rápido para la sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envíe `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea o como única directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Alternativa: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en las solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene un único conmutador `/fast` compartido entre ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos del modelo Anthropic `serviceTier` / `service_tier` anulan el valor predeterminado del modo rápido cuando ambos están configurados. OpenClaw sigue omitiendo la inyección del nivel de servicio de Anthropic para URL base proxy que no sean de Anthropic.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva activa el modo detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrela mediante la UI de sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envíe `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) envían cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto cada herramienta empieza (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen siendo visibles en modo normal, pero los sufijos con detalles de error sin procesar se ocultan a menos que el modo detallado sea `on` o `full`.
- Cuando el modo detallado es `full`, las salidas de herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si cambia `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetarán la nueva configuración.

## Directivas de rastreo de plugins (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva activa la salida de rastreo de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envíe `/trace` (o `/trace:`) sin argumento para ver el nivel de rastreo actual.
- `/trace` es más específico que `/verbose`: solo expone líneas de rastreo/depuración propiedad del plugin, como los resúmenes de depuración de Active Memory.
- Las líneas de rastreo pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que contiene solo la directiva activa o desactiva si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envíe `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de razonamiento.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y luego alternativa (`off`).

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda de Heartbeat es la indicación de heartbeat configurada (predeterminada: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje de heartbeat se aplican como de costumbre (pero evite cambiar los valores predeterminados de sesión desde heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), configure `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI del chat web

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la anulación de la sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación de un solo uso `thinkingOnce`.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del perfil de razonamiento del proveedor del modelo activo de la sesión.
- El selector usa `thinkingOptions` devuelto por la fila de sesión del gateway. La UI del navegador no mantiene su propia lista regex de proveedores; los plugins son propietarios de los conjuntos de niveles específicos del modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de la sesión, de modo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles del proveedor

- Los plugins del proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles y el valor predeterminado del modelo.
- Cada nivel del perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) siguen existiendo como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas del Gateway exponen `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat representen el mismo perfil que usa la validación en tiempo de ejecución.
