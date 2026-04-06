---
read_when:
    - Generar imágenes a través del agente
    - Configurar proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta image_generate
summary: Generar y editar imágenes usando proveedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-06T03:12:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dde416dd1441a06605db85b5813cf61ccfc525813d6db430b7b7dfa53d6a3134
    source_path: tools/image-generation.md
    workflow: 15
---

# Generación de imágenes

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como adjuntos multimedia en la respuesta del agente.

<Note>
La herramienta solo aparece cuando al menos un proveedor de generación de imágenes está disponible. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel` o establece una clave de API del proveedor.
</Note>

## Inicio rápido

1. Establece una clave de API para al menos un proveedor (por ejemplo `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Opcionalmente, establece tu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Pídele al agente: _"Genera una imagen de una mascota langosta amistosa."_

El agente llama a `image_generate` automáticamente. No hace falta una lista de permitidos de herramientas: está habilitada de forma predeterminada cuando hay un proveedor disponible.

## Proveedores compatibles

| Provider | Modelo predeterminado            | Compatibilidad de edición          | Clave de API                                            |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Sí (hasta 5 imágenes)              | `OPENAI_API_KEY`                                        |
| Google   | `gemini-3.1-flash-image-preview` | Sí                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                     |
| fal      | `fal-ai/flux/dev`                | Sí                                 | `FAL_KEY`                                               |
| MiniMax  | `image-01`                       | Sí (referencia de sujeto)          | `MINIMAX_API_KEY` o OAuth de MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para cloud  |
| Vydra    | `grok-imagine`                   | No                                 | `VYDRA_API_KEY`                                         |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```
/tool image_generate action=list
```

## Parámetros de la herramienta

| Parameter     | Type     | Descripción                                                                          |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt de generación de imágenes (obligatorio para `action: "generate"`)             |
| `action`      | string   | `"generate"` (predeterminado) o `"list"` para inspeccionar proveedores               |
| `model`       | string   | Anulación de proveedor/modelo, por ejemplo `openai/gpt-image-1`                      |
| `image`       | string   | Ruta o URL de una sola imagen de referencia para el modo edición                     |
| `images`      | string[] | Varias imágenes de referencia para el modo edición (hasta 5)                         |
| `size`        | string   | Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string   | Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Sugerencia de resolución: `1K`, `2K` o `4K`                                          |
| `count`       | number   | Número de imágenes a generar (1–4)                                                   |
| `filename`    | string   | Sugerencia de nombre de archivo de salida                                            |

No todos los proveedores admiten todos los parámetros. La herramienta pasa lo que cada proveedor admite, ignora el resto e informa de las anulaciones descartadas en el resultado de la herramienta.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Orden de selección de proveedores

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática** — usa solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes de generación de imágenes registrados, en orden de id de proveedor

Si un proveedor falla (error de autenticación, límite de tasa, etc.), se prueba automáticamente el siguiente candidato. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- La detección automática es consciente de la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw puede autenticar realmente ese proveedor.
- Usa `action: "list"` para inspeccionar los proveedores actualmente registrados, sus modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, Google, fal, MiniMax y ComfyUI admiten edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI y Google admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

La generación de imágenes de MiniMax está disponible a través de ambas rutas integradas de autenticación de MiniMax:

- `minimax/image-01` para configuraciones con clave de API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades del proveedor

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ----- |
| Generar               | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1) |
| Edición/referencia    | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)      | Sí (1 imagen, ref. de sujeto) | Sí (1 imagen, configurada por workflow) | No |
| Control de tamaño     | Sí                   | Sí                   | Sí                  | No                         | No                                 | No |
| Relación de aspecto   | No                   | Sí                   | Sí (solo generar)   | Sí                         | No                                 | No |
| Resolución (1K/2K/4K) | No                   | Sí                   | Sí                  | No                         | No                                 | No |

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [fal](/providers/fal) — configuración del proveedor de imágenes y video de fal
- [ComfyUI](/providers/comfy) — configuración de workflows de ComfyUI local y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/providers/vydra) — configuración de imágenes, video y voz de Vydra
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — configuración `imageGenerationModel`
- [Models](/es/concepts/models) — configuración de modelos y failover
