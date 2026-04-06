---
read_when:
    - Quieres usar flujos de trabajo locales de ComfyUI con OpenClaw
    - Quieres usar Comfy Cloud con flujos de trabajo de imagen, video o música
    - Necesitas las claves de configuración del plugin `comfy` incluido
summary: Configuración de generación de imágenes, video y música con flujos de trabajo de ComfyUI en OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-06T03:10:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e645f32efdffdf4cd498684f1924bb953a014d3656b48f4b503d64e38c61ba9c
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw incluye un plugin `comfy` integrado para ejecuciones de ComfyUI basadas en flujos de trabajo.

- Proveedor: `comfy`
- Modelos: `comfy/workflow`
- Superficies compartidas: `image_generate`, `video_generate`, `music_generate`
- Autenticación: ninguna para ComfyUI local; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para Comfy Cloud
- API: ComfyUI `/prompt` / `/history` / `/view` y Comfy Cloud `/api/*`

## Qué admite

- Generación de imágenes a partir de un JSON de flujo de trabajo
- Edición de imágenes con 1 imagen de referencia subida
- Generación de video a partir de un JSON de flujo de trabajo
- Generación de video con 1 imagen de referencia subida
- Generación de música o audio mediante la herramienta compartida `music_generate`
- Descarga de salidas desde un nodo configurado o todos los nodos de salida coincidentes

El plugin integrado está guiado por flujos de trabajo, por lo que OpenClaw no intenta asignar controles genéricos de
`size`, `aspectRatio`, `resolution`, `durationSeconds` o de estilo TTS
a tu grafo.

## Estructura de configuración

Comfy admite ajustes compartidos de conexión de nivel superior más secciones de
flujo de trabajo por capacidad:

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

Claves compartidas:

- `mode`: `local` o `cloud`
- `baseUrl`: por defecto `http://127.0.0.1:8188` para local o `https://cloud.comfy.org` para cloud
- `apiKey`: alternativa opcional de clave en línea a las variables de entorno
- `allowPrivateNetwork`: permite una `baseUrl` privada/LAN en modo cloud

Claves por capacidad bajo `image`, `video` o `music`:

- `workflow` o `workflowPath`: obligatorio
- `promptNodeId`: obligatorio
- `promptInputName`: por defecto `text`
- `outputNodeId`: opcional
- `pollIntervalMs`: opcional
- `timeoutMs`: opcional

Las secciones de imagen y video también admiten:

- `inputImageNodeId`: obligatorio cuando pasas una imagen de referencia
- `inputImageInputName`: por defecto `image`

## Compatibilidad con versiones anteriores

La configuración de imagen existente de nivel superior sigue funcionando:

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

OpenClaw trata esa forma heredada como la configuración del flujo de trabajo de imagen.

## Flujos de trabajo de imagen

Establece el modelo de imagen predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Ejemplo de edición con imagen de referencia:

```json5
{
  models: {
    providers: {
      comfy: {
        image: {
          workflowPath: "./workflows/edit-api.json",
          promptNodeId: "6",
          inputImageNodeId: "7",
          inputImageInputName: "image",
          outputNodeId: "9",
        },
      },
    },
  },
}
```

## Flujos de trabajo de video

Establece el modelo de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Los flujos de trabajo de video de Comfy actualmente admiten texto a video e imagen a video mediante
el grafo configurado. OpenClaw no pasa videos de entrada a los flujos de trabajo de Comfy.

## Flujos de trabajo de música

El plugin integrado registra un proveedor de generación de música para salidas de
audio o música definidas por flujo de trabajo, expuestas mediante la herramienta compartida `music_generate`:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

Usa la sección de configuración `music` para apuntar a tu JSON de flujo de trabajo de audio y al
nodo de salida.

## Comfy Cloud

Usa `mode: "cloud"` más una de estas opciones:

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

El modo cloud sigue usando las mismas secciones de flujo de trabajo `image`, `video` y `music`.

## Pruebas live

Existe cobertura live opcional para el plugin integrado:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

La prueba live omite casos individuales de imagen, video o música a menos que la sección
correspondiente del flujo de trabajo de Comfy esté configurada.

## Relacionado

- [Image Generation](/es/tools/image-generation)
- [Video Generation](/tools/video-generation)
- [Music Generation](/tools/music-generation)
- [Provider Directory](/es/providers/index)
- [Configuration Reference](/es/gateway/configuration-reference#agent-defaults)
