---
read_when:
    - Quieres usar la conversión de voz a texto de SenseAudio para archivos de audio adjuntos
    - Necesitas la variable de entorno de la API key de SenseAudio o la ruta de configuración de audio
summary: Conversión por lotes de voz a texto de SenseAudio para notas de voz entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:56:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio puede transcribir archivos adjuntos de audio/notas de voz entrantes mediante el pipeline compartido `tools.media.audio` de OpenClaw. OpenClaw envía audio multipart al endpoint de transcripción compatible con OpenAI e inyecta el texto devuelto como `{{Transcript}}` más un bloque `[Audio]`.

| Detalle       | Valor                                            |
| ------------- | ------------------------------------------------ |
| Sitio web     | [senseaudio.cn](https://senseaudio.cn)           |
| Documentación | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Autenticación | `SENSEAUDIO_API_KEY`                             |
| Modelo predeterminado | `senseaudio-asr-pro-1.5-260319`         |
| URL predeterminada | `https://api.senseaudio.cn/v1`               |

## Primeros pasos

<Steps>
  <Step title="Establece tu API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Habilita el proveedor de audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envía una nota de voz">
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw sube el audio a SenseAudio y usa la transcripción en el pipeline de respuesta.
  </Step>
</Steps>

## Opciones

| Opción     | Ruta                                  | Descripción                              |
| ---------- | ------------------------------------- | ---------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID del modelo ASR de SenseAudio          |
| `language` | `tools.media.audio.models[].language` | Sugerencia de idioma opcional            |
| `prompt`   | `tools.media.audio.prompt`            | Prompt de transcripción opcional         |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Sobrescribe la base compatible con OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Encabezados de solicitud adicionales     |

<Note>
SenseAudio es solo STT por lotes en OpenClaw. La transcripción en tiempo real de Voice Call sigue usando proveedores con soporte de STT en streaming.
</Note>
