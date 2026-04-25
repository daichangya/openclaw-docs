---
read_when:
    - Ajustar el thinking, el modo rápido o el análisis de directivas verbose, o sus valores predeterminados
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del reasoning
title: Niveles de thinking
x-i18n:
    generated_at: "2026-04-25T13:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo administrado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7 y thinking dinámico de Google Gemini)
  - max → reasoning máximo del proveedor (actualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de thinking dependen del perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como `on` binario.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles incompatibles almacenados previamente se reasignan según el rango del perfil del proveedor. `adaptive` vuelve a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` vuelven al mayor nivel compatible distinto de `off` para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de thinking explícito.
  - Anthropic Claude Opus 4.7 no usa thinking adaptativo de forma predeterminada. Su esfuerzo predeterminado de API sigue siendo propiedad del proveedor a menos que establezcas explícitamente un nivel de thinking.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a thinking adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de thinking y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga útil de reasoning desactivado en lugar de enviar un valor no compatible.
  - Google Gemini asigna `/think adaptive` al thinking dinámico propiedad del proveedor de Gemini. Las solicitudes Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa por defecto `thinking: { type: "disabled" }` a menos que establezcas explícitamente thinking en los parámetros del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` del formato de flujo Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite thinking binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el thinking está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida enviando un mensaje que solo contiene una directiva).
3. Predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando está disponible; de lo contrario, los modelos compatibles con reasoning se resuelven como `medium` o el nivel compatible más cercano distinto de `off` para ese modelo, y los modelos sin reasoning permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Eso permanece para la sesión actual (por remitente, de forma predeterminada); se borra con `/think:off` o al restablecerse por inactividad de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión permanece sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de thinking actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que solo contiene la directiva alterna una anulación de modo rápido para la sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea/solo directiva
  2. Anulación de sesión
  3. Predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma bandera `service_tier=priority` en Codex Responses. OpenClaw mantiene un único selector `/fast` compartido entre ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo explícitos `serviceTier` / `service_tier` de Anthropic reemplazan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base proxy que no sean de Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas verbose (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva alterna verbose de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación de sesión explícita; bórrala mediante la interfaz de Sessions eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel verbose actual.
- Cuando verbose está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) devuelven cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían tan pronto como cada herramienta se inicia (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramientas siguen visibles en modo normal, pero los sufijos con detalles de error sin procesar se ocultan a menos que verbose sea `on` o `full`.
- Cuando verbose es `full`, las salidas de las herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.

## Directivas de traza de plugins (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva alterna la salida de traza de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel actual de traza.
- `/trace` es más específico que `/verbose`: solo expone líneas de traza/depuración propiedad de plugins, como los resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del reasoning (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva alterna si los bloques de thinking se muestran en las respuestas.
- Cuando está habilitado, el reasoning se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite reasoning en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin reasoning.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de reasoning.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y luego respaldo (`off`).

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda Heartbeat es el prompt Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa por defecto solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz web del chat

- El selector de thinking del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la anulación de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación `thinkingOnce` de una sola vez.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del perfil de thinking del proveedor del modelo activo de la sesión más la misma lógica de respaldo que usan `/status` y `session_status`.
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de la sesión del gateway, con `thinkingOptions` mantenido como lista de etiquetas heredada. La interfaz del navegador no mantiene su propia lista regex de proveedores; los plugins controlan los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas de chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles y el valor predeterminado del modelo.
- Cada nivel del perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) siguen disponibles como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat representen los mismos IDs y etiquetas del perfil que usa la validación del runtime.
