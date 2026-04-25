---
read_when:
    - Buscas una descripción general de las capacidades de medios
    - Decidir qué proveedor de medios configurar
    - Entender cómo funciona la generación asíncrona de medios
summary: Página de destino unificada para capacidades de generación de medios, comprensión y voz
title: Descripción general de medios
x-i18n:
    generated_at: "2026-04-25T13:58:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Generación y comprensión de medios

OpenClaw genera imágenes, videos y música, comprende medios entrantes (imágenes, audio, video) y lee respuestas en voz alta mediante conversión de texto a voz. Todas las capacidades de medios están impulsadas por herramientas: el agente decide cuándo usarlas en función de la conversación, y cada herramienta solo aparece cuando al menos un proveedor de respaldo está configurado.

## Capacidades de un vistazo

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generación de imágenes | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o edita imágenes a partir de prompts de texto o referencias |
| Generación de video     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea videos a partir de texto, imágenes o videos existentes    |
| Generación de música     | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea música o pistas de audio a partir de prompts de texto         |
| Conversión de texto a voz (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo  | Convierte respuestas salientes en audio hablado               |
| Comprensión de medios  | (automático)      | Cualquier proveedor de modelos con capacidad de visión/audio, además de respaldos CLI                                  | Resume imágenes, audio y video entrantes             |

## Matriz de capacidades de proveedores

Esta tabla muestra qué proveedores admiten qué capacidades de medios en toda la plataforma.

| Provider    | Image | Video | Music | TTS | STT / Transcription | Realtime Voice | Media Understanding |
| ----------- | ----- | ----- | ----- | --- | ------------------- | -------------- | ------------------- |
| Alibaba     |       | Sí    |       |     |                     |                |                     |
| BytePlus    |       | Sí    |       |     |                     |                |                     |
| ComfyUI     | Sí    | Sí    | Sí    |     |                     |                |                     |
| Deepgram    |       |       |       |     | Sí                  | Sí             |                     |
| ElevenLabs  |       |       |       | Sí  | Sí                  |                |                     |
| fal         | Sí    | Sí    |       |     |                     |                |                     |
| Google      | Sí    | Sí    | Sí    | Sí  |                     | Sí             | Sí                  |
| Gradium     |       |       |       | Sí  |                     |                |                     |
| Local CLI   |       |       |       | Sí  |                     |                |                     |
| Microsoft   |       |       |       | Sí  |                     |                |                     |
| MiniMax     | Sí    | Sí    | Sí    | Sí  |                     |                |                     |
| Mistral     |       |       |       |     | Sí                  |                |                     |
| OpenAI      | Sí    | Sí    |       | Sí  | Sí                  | Sí             | Sí                  |
| Qwen        |       | Sí    |       |     |                     |                |                     |
| Runway      |       | Sí    |       |     |                     |                |                     |
| SenseAudio  |       |       |       |     | Sí                  |                |                     |
| Together    |       | Sí    |       |     |                     |                |                     |
| Vydra       | Sí    | Sí    |       | Sí  |                     |                |                     |
| xAI         | Sí    | Sí    |       | Sí  | Sí                  |                | Sí                  |
| Xiaomi MiMo | Sí    |       |       | Sí  |                     |                | Sí                  |

<Note>
La comprensión de medios usa cualquier modelo con capacidad de visión o audio registrado en la configuración de tu proveedor. La tabla anterior destaca los proveedores con compatibilidad dedicada para comprensión de medios; la mayoría de los proveedores LLM con modelos multimodales (Anthropic, Google, OpenAI, etc.) también pueden comprender medios entrantes cuando están configurados como modelo de respuesta activo.
</Note>

## Cómo funciona la generación asíncrona

La generación de video y música se ejecuta como tareas en segundo plano porque el procesamiento del proveedor suele tardar entre 30 segundos y varios minutos. Cuando el agente llama a `video_generate` o `music_generate`, OpenClaw envía la solicitud al proveedor, devuelve inmediatamente un ID de tarea y hace seguimiento del trabajo en el registro de tareas. El agente sigue respondiendo a otros mensajes mientras el trabajo se ejecuta. Cuando el proveedor termina, OpenClaw reactiva al agente para que pueda publicar el medio terminado de vuelta en el canal original. La generación de imágenes y TTS son síncronas y se completan en línea con la respuesta.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio y xAI pueden transcribir
audio entrante mediante la ruta por lotes `tools.media.audio` cuando están configurados.
Deepgram, ElevenLabs, Mistral, OpenAI y xAI también registran proveedores STT de
streaming para Voice Call, por lo que el audio telefónico en vivo puede reenviarse al
proveedor seleccionado sin esperar a que se complete una grabación.

Google se asigna a las superficies de OpenClaw para imagen, video, música, TTS por lotes, voz
en tiempo real de backend y comprensión de medios. OpenAI se asigna a las superficies de OpenClaw para imagen,
video, TTS por lotes, STT por lotes, STT de streaming para Voice Call, voz en tiempo real de backend
y incrustaciones de memoria. xAI actualmente se asigna a las superficies de OpenClaw para imagen, video,
búsqueda, ejecución de código, TTS por lotes, STT por lotes y STT de streaming para Voice Call.
La voz Realtime de xAI es una capacidad ascendente, pero no está
registrada en OpenClaw hasta que el contrato compartido de voz en tiempo real pueda representarla.

## Enlaces rápidos

- [Generación de imágenes](/es/tools/image-generation) -- generar y editar imágenes
- [Generación de video](/es/tools/video-generation) -- texto a video, imagen a video y video a video
- [Generación de música](/es/tools/music-generation) -- crear música y pistas de audio
- [Conversión de texto a voz](/es/tools/tts) -- convertir respuestas en audio hablado
- [Comprensión de medios](/es/nodes/media-understanding) -- comprender imágenes, audio y video entrantes

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/es/tools/video-generation)
- [Generación de música](/es/tools/music-generation)
- [Conversión de texto a voz](/es/tools/tts)
