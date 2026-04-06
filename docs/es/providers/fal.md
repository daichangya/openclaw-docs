---
read_when:
    - Quieres usar la generación de imágenes de fal en OpenClaw
    - Necesitas el flujo de autenticación FAL_KEY
    - Quieres valores predeterminados de fal para image_generate o video_generate
summary: Configuración de generación de imágenes y video de fal en OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-06T03:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1922907d2c8360c5877a56495323d54bd846d47c27a801155e3d11e3f5706fbd
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw incluye un proveedor integrado `fal` para la generación alojada de imágenes y video.

- Proveedor: `fal`
- Autenticación: `FAL_KEY` (canónica; `FAL_API_KEY` también funciona como respaldo)
- API: endpoints de modelos de fal

## Inicio rápido

1. Establece la clave API:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Establece un modelo de imagen predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generación de imágenes

El proveedor integrado de generación de imágenes `fal` usa de forma predeterminada
`fal/fal-ai/flux/dev`.

- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, 1 imagen de referencia
- Admite `size`, `aspectRatio` y `resolution`
- Limitación actual de edición: el endpoint de edición de imágenes de fal **no** admite
  sobrescrituras de `aspectRatio`

Para usar fal como proveedor de imágenes predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generación de video

El proveedor integrado de generación de video `fal` usa de forma predeterminada
`fal/fal-ai/minimax/video-01-live`.

- Modos: flujos de texto a video y de referencia con una sola imagen
- Tiempo de ejecución: flujo de envío/estado/resultado respaldado por cola para trabajos de larga duración

Para usar fal como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## Relacionado

- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/tools/video-generation)
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults)
