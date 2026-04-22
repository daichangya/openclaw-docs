---
read_when:
    - Explicar cómo funciona la transmisión o la fragmentación en los canales
    - Cambiar el comportamiento de transmisión por bloques o de fragmentación del canal
    - Depurar respuestas por bloques duplicadas/tempranas o la transmisión de vista previa del canal
summary: Comportamiento de transmisión + fragmentación (respuestas por bloques, transmisión de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-04-22T04:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Transmisión + fragmentación

OpenClaw tiene dos capas de transmisión separadas:

- **Transmisión por bloques (canales):** emite **bloques** completados mientras el asistente escribe. Estos son mensajes normales del canal (no deltas de tokens).
- **Transmisión de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal mientras se genera.

Hoy no existe **transmisión real de deltas de tokens** hacia los mensajes del canal. La transmisión de vista previa se basa en mensajes (enviar + editar/anexar).

## Transmisión por bloques (mensajes del canal)

La transmisión por bloques envía la salida del asistente en fragmentos grandes a medida que están disponibles.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Leyenda:

- `text_delta/events`: eventos del flujo del modelo (pueden ser escasos en modelos sin transmisión).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimo/máximo + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predeterminado: off).
- Reemplazos por canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (combina bloques transmitidos antes de enviarlos).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` es el valor predeterminado; `newline` divide en líneas en blanco —límites de párrafo— antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado: 17) divide respuestas altas para evitar recortes en la UI.

**Semántica de límites:**

- `text_end`: transmite bloques tan pronto como el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida en búfer.

`message_end` sigue usando el fragmentador si el texto en búfer supera `maxChars`, así que puede emitir varios fragmentos al final.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación por bloques se implementa con `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** preferir cortes antes de `maxChars`; si se fuerza, dividir en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte forzado.
- **Bloques de código:** nunca dividir dentro de bloques; cuando se fuerza en `maxChars`, cerrar + reabrir el bloque para mantener Markdown válido.

`maxChars` se ajusta al `textChunkLimit` del canal, así que no puedes exceder los límites por canal.

## Combinación (fusionar bloques transmitidos)

Cuando la transmisión por bloques está habilitada, OpenClaw puede **fusionar fragmentos de bloques consecutivos**
antes de enviarlos. Esto reduce el “spam de líneas individuales” mientras sigue proporcionando
salida progresiva.

- La combinación espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita que se envíen fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay reemplazos por canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El valor predeterminado de combinación para `minChars` se eleva a 1500 en Signal/Slack/Discord salvo que se reemplace.

## Ritmo más humano entre bloques

Cuando la transmisión por bloques está habilitada, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas con varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (reemplazo por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a las **respuestas por bloques**, no a las respuestas finales ni a los resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se asigna a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin transmisión por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota sobre canales:** La transmisión por bloques está **desactivada a menos que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` viven en
`agents.defaults`, no en la configuración raíz.

## Modos de transmisión de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactivar la transmisión de vista previa.
- `partial`: una sola vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al terminar.

### Asignación por canal

| Canal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | se asigna a `partial` |
| Discord    | ✅    | ✅        | ✅      | se asigna a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API nativa de transmisión de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- La transmisión nativa de Slack y el estado de hilo del asistente de Slack requieren un destino de hilo de respuesta; los mensajes directos de nivel superior no muestran esa vista previa estilo hilo.

Migración de claves heredadas:

- Telegram: `streamMode` + booleano `streaming` migran automáticamente a la enumeración `streaming`.
- Discord: `streamMode` + booleano `streaming` migran automáticamente a la enumeración `streaming`.
- Slack: `streamMode` migra automáticamente a `streaming.mode`; el booleano `streaming` migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en runtime

Telegram:

- Usa actualizaciones de vista previa con `sendMessage` + `editMessageText` en mensajes directos y grupos/temas.
- La transmisión de vista previa se omite cuando la transmisión por bloques de Telegram está habilitada explícitamente (para evitar doble transmisión).
- `/reasoning stream` puede escribir razonamiento en la vista previa.

Discord:

- Usa mensajes de vista previa con enviar + editar.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- La transmisión de vista previa se omite cuando la transmisión por bloques de Discord está habilitada explícitamente.
- Las cargas útiles finales de multimedia, error y respuesta explícita cancelan las vistas previas pendientes sin vaciar un nuevo borrador, y luego usan la entrega normal.

Slack:

- `partial` puede usar la transmisión nativa de Slack (`chat.startStream`/`append`/`stop`) cuando esté disponible.
- `block` usa vistas previas de borrador estilo anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Las cargas útiles finales de multimedia/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto pendiente del borrador.

Mattermost:

- Transmite razonamiento, actividad de herramientas y texto parcial de respuesta en una única publicación de vista previa en borrador que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar.
- Recurre a enviar una nueva publicación final si la publicación de vista previa fue eliminada o ya no está disponible al momento de finalizar.
- Las cargas útiles finales de multimedia/error cancelan las actualizaciones pendientes de vista previa antes de la entrega normal en lugar de vaciar una publicación temporal de vista previa.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de multimedia, de error y con desajuste de destino de respuesta cancelan las actualizaciones pendientes de vista previa antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa del progreso de herramientas

La transmisión de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas breves de estado como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras las herramientas se están ejecutando, antes de la respuesta final. Esto mantiene visualmente activos los turnos de herramientas de varios pasos en lugar de dejarlos en silencio entre la primera vista previa de razonamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack** y **Telegram** transmiten el progreso de herramientas en la edición de vista previa en vivo.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa en borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo activo de transmisión de vista previa; se omiten cuando la transmisión de vista previa está en `off` o cuando la transmisión por bloques ya ha tomado control del mensaje.

## Relacionado

- [Mensajes](/es/concepts/messages) — ciclo de vida y entrega de mensajes
- [Retry](/es/concepts/retry) — comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) — compatibilidad de transmisión por canal
