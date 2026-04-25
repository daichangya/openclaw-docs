---
read_when:
    - Explicar cómo funcionan el streaming o la fragmentación en los canales
    - Cambiar el comportamiento del streaming en bloque o de la fragmentación por canal
    - Depurar respuestas en bloque duplicadas/tempranas o streaming de vista previa de canal
summary: Comportamiento de streaming + fragmentación (respuestas en bloque, streaming de vista previa de canal, mapeo de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-04-25T13:45:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming en bloques (canales):** emite **bloques** completados mientras el asistente escribe. Son mensajes normales del canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal mientras se genera.

Hoy **no existe streaming real de deltas de tokens** hacia los mensajes del canal. El streaming de vista previa se basa en mensajes (enviar + editar/anexar).

## Streaming en bloques (mensajes del canal)

El streaming en bloques envía la salida del asistente en fragmentos gruesos a medida que está disponible.

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Leyenda:

- `text_delta/events`: eventos del stream del modelo (pueden ser escasos en modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas en bloque).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (por defecto off).
- Sobrescrituras por canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes de enviarlos).
- Límite estricto por canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación por canal: `*.chunkMode` (`length` por defecto, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (por defecto 17) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques tan pronto como el chunker los emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida acumulada.

`message_end` sigue usando el chunker si el texto acumulado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de multimedia con streaming en bloques

Las directivas `MEDIA:` son metadatos normales de entrega. Cuando el streaming en bloques envía temprano un bloque
multimedia, OpenClaw recuerda esa entrega para el turno. Si el payload final
del asistente repite la misma URL multimedia, la entrega final elimina la
multimedia duplicada en lugar de volver a enviar el adjunto.

Los payloads finales duplicados exactos se suprimen. Si el payload final agrega
texto distinto alrededor de multimedia que ya se transmitió, OpenClaw sigue enviando el
texto nuevo mientras mantiene la multimedia con una sola entrega. Esto evita notas de voz
o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante
el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajos/altos)

La fragmentación por bloques está implementada por `EmbeddedBlockChunker`:

- **Límite bajo:** no emite hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere cortes antes de `maxChars`; si se fuerza, corta en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra + reabre el bloque para mantener Markdown válido.

`maxChars` se ajusta al `textChunkLimit` del canal, así que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming en bloques está habilitado, OpenClaw puede **fusionar fragmentos consecutivos de bloques**
antes de enviarlos. Esto reduce el “spam de una sola línea” y aun así proporciona
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita que se envíen fragmentos minúsculos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras por canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El valor predeterminado de coalescencia `minChars` se eleva a 1500 para Signal/Slack/Discord salvo sobrescritura.

## Ritmo humano entre bloques

Cuando el streaming en bloques está habilitado, puedes agregar una **pausa aleatoria** entre
respuestas en bloque (después del primer bloque). Esto hace que las respuestas en varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescritura por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (por defecto), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas en bloque**, no a respuestas finales ni a resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se corresponde con:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una sola vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming en bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming en bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa live
(`channels.<channel>.streaming`) sin respuestas en bloque.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` viven bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: una sola vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completar.

### Mapeo por canal

| Canal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | se asigna a `partial` |
| Discord    | ✅    | ✅        | ✅      | se asigna a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` activa/desactiva las llamadas a la API nativa de streaming de Slack cuando `channels.slack.streaming.mode="partial"` (por defecto: `true`).
- El streaming nativo de Slack y el estado del hilo del asistente de Slack requieren un destino de hilo de respuesta; los mensajes directos de nivel superior no muestran esa vista previa estilo hilo.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y `streaming` escalar/booleano se detectan y migran mediante doctor/rutas de compatibilidad de configuración a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migran automáticamente a enum `streaming`.
- Slack: `streamMode` migra automáticamente a `streaming.mode`; `streaming` booleano migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en runtime

Telegram:

- Usa actualizaciones de vista previa con `sendMessage` + `editMessageText` en mensajes directos y grupos/temas.
- El streaming de vista previa se omite cuando el streaming en bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en la vista previa.

Discord:

- Usa mensajes de vista previa de enviar + editar.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming en bloques de Discord está habilitado explícitamente.
- Los payloads finales de multimedia, error y respuesta explícita cancelan las vistas previas pendientes sin vaciar un nuevo borrador y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador de estilo append.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- El streaming nativo y de vista previa de borrador suprimen las respuestas en bloque para ese turno, de modo que una respuesta de Slack se transmite solo por una ruta de entrega.
- Los payloads finales de multimedia/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto pendiente del borrador.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de borrador de vista previa que se finaliza in situ cuando la respuesta final es segura para enviarse.
- Recurre al envío de una nueva publicación final si la publicación de vista previa fue eliminada o no está disponible al momento de finalizar.
- Los payloads finales de multimedia/error cancelan las actualizaciones pendientes de vista previa antes de la entrega normal en lugar de vaciar una publicación temporal de vista previa.

Matrix:

- Las vistas previas de borrador se finalizan in situ cuando el texto final puede reutilizar el evento de vista previa.
- Los finales de solo multimedia, error y discordancia de destino de respuesta cancelan las actualizaciones pendientes de vista previa antes de la entrega normal; una vista previa obsoleta ya visible se elimina.

### Actualizaciones de vista previa del progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas** — líneas cortas de estado como "buscando en la web", "leyendo archivo" o "llamando herramienta" — que aparecen en el mismo mensaje de vista previa mientras las herramientas se están ejecutando, antes de la respuesta final. Esto hace que los turnos de herramientas de varios pasos se vean activos en lugar de silenciosos entre la primera vista previa de pensamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack** y **Telegram** transmiten el progreso de herramientas a la edición live de vista previa por defecto cuando el streaming de vista previa está activo.
- Telegram se entrega con las actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento ya lanzado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de borrador de vista previa (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo activo de streaming de vista previa; se omiten cuando el streaming de vista previa está en `off` o cuando el streaming en bloques ya se hizo cargo del mensaje.
- Para conservar el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para desactivar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.

Ejemplo:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Relacionado

- [Mensajes](/es/concepts/messages) — ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) — comportamiento de reintento en caso de fallo de entrega
- [Canales](/es/channels) — compatibilidad de streaming por canal
