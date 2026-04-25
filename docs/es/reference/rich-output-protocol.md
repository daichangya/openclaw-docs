---
read_when:
    - Cambiar el renderizado de la salida del asistente en la interfaz de usuario de Control
    - Depuración de las directivas de presentación `[embed ...]`, `MEDIA:`, reply o audio
summary: Protocolo de shortcodes de salida enriquecida para incrustaciones, medios, indicaciones de audio y respuestas
title: Protocolo de salida enriquecida
x-i18n:
    generated_at: "2026-04-25T13:56:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La salida del asistente puede incluir un pequeño conjunto de directivas de entrega/renderizado:

- `MEDIA:` para la entrega de archivos adjuntos
- `[[audio_as_voice]]` para indicaciones de presentación de audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadatos de respuesta
- `[embed ...]` para renderizado enriquecido en la interfaz de usuario de Control

Estas directivas son independientes. `MEDIA:` y las etiquetas de respuesta/voz siguen siendo metadatos de entrega; `[embed ...]` es la ruta de renderizado enriquecido solo para web.

Cuando el streaming por bloques está habilitado, `MEDIA:` sigue siendo metadato de entrega única para un turno. Si la misma URL de medios se envía en un bloque transmitido y se repite en el payload final del asistente, OpenClaw entrega el archivo adjunto una sola vez y elimina el duplicado del payload final.

## `[embed ...]`

`[embed ...]` es la única sintaxis de renderizado enriquecido orientada al agente para la interfaz de usuario de Control.

Ejemplo autocerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Reglas:

- `[view ...]` ya no es válido para salida nueva.
- Los shortcodes de embed se renderizan solo en la superficie del mensaje del asistente.
- Solo se renderizan los embeds respaldados por URL. Usa `ref="..."` o `url="..."`.
- Los shortcodes de embed en HTML inline con formato de bloque no se renderizan.
- La interfaz web elimina el shortcode del texto visible y renderiza el embed inline.
- `MEDIA:` no es un alias de embed y no debe usarse para renderizado enriquecido de embeds.

## Forma de renderizado almacenada

El bloque de contenido del asistente normalizado/almacenado es un elemento `canvas` estructurado:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Los bloques enriquecidos almacenados/renderizados usan directamente esta forma `canvas`. `present_view` no se reconoce.

## Relacionado

- [Adaptadores RPC](/es/reference/rpc)
- [Typebox](/es/concepts/typebox)
