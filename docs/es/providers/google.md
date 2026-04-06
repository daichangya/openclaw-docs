---
read_when:
    - Quieres usar modelos Google Gemini con OpenClaw
    - Necesitas el flujo de autenticación con clave API
summary: Configuración de Google Gemini (clave API, generación de imágenes, comprensión multimedia, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-06T03:10:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358d33a68275b01ebd916a3621dd651619cb9a1d062e2fb6196a7f3c501c015a
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

El plugin de Google proporciona acceso a modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión multimedia (imagen/audio/video) y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API Gemini de Google

## Inicio rápido

1. Establece la clave API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Establece un modelo predeterminado:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Ejemplo no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## Capacidades

| Capacidad              | Compatible        |
| ---------------------- | ----------------- |
| Finalizaciones de chat | Sí                |
| Generación de imágenes | Sí                |
| Generación de música   | Sí                |
| Comprensión de imágenes | Sí               |
| Transcripción de audio | Sí                |
| Comprensión de video   | Sí                |
| Búsqueda web (Grounding) | Sí              |
| Thinking/razonamiento  | Sí (Gemini 3.1+)  |

## Reutilización directa de caché de Gemini

Para ejecuciones directas de la API Gemini (`api: "google-generative-ai"`), OpenClaw ahora
pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

- Configura parámetros por modelo o globales con
  `cachedContent` o el heredado `cached_content`
- Si ambos están presentes, `cachedContent` tiene prioridad
- Valor de ejemplo: `cachedContents/prebuilt-context`
- El uso de aciertos de caché de Gemini se normaliza en `cacheRead` de OpenClaw a partir de
  `cachedContentTokenCount` upstream

Ejemplo:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Generación de imágenes

El proveedor integrado de generación de imágenes `google` usa por defecto
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, hasta 5 imágenes de entrada
- Controles de geometría: `size`, `aspectRatio` y `resolution`

La generación de imágenes, la comprensión multimedia y Gemini Grounding permanecen en el
ID de proveedor `google`.

Para usar Google como proveedor de imágenes predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Consulta [Image Generation](/es/tools/image-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Generación de video

El plugin integrado `google` también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio`, `resolution` y `audio`
- Límite actual de duración: **4 a 8 segundos**

Para usar Google como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Consulta [Video Generation](/tools/video-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Generación de música

El plugin integrado `google` también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `google/lyria-3-clip-preview`
- También admite `google/lyria-3-pro-preview`
- Controles del prompt: `lyrics` e `instrumental`
- Formato de salida: `mp3` de forma predeterminada, además de `wav` en `google/lyria-3-pro-preview`
- Entradas de referencia: hasta 10 imágenes
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

Para usar Google como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

Consulta [Music Generation](/tools/music-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Nota sobre el entorno

Si el gateway se ejecuta como daemon (`launchd/systemd`), asegúrate de que `GEMINI_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
