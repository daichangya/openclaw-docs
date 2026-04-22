---
read_when:
    - Generar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Comprender los parámetros de la herramienta `image_generate`
summary: Generar y editar imágenes usando proveedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-22T04:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Generación de imágenes

La herramienta `image_generate` permite que el agente cree y edite imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como archivos multimedia adjuntos en la respuesta del agente.

<Note>
La herramienta solo aparece cuando al menos un proveedor de generación de imágenes está disponible. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel` o establece una clave API de proveedor.
</Note>

## Inicio rápido

1. Configura una clave API para al menos un proveedor (por ejemplo `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Opcionalmente configura tu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Pídele al agente: _"Genera una imagen de una amigable mascota langosta."_

El agente llama automáticamente a `image_generate`. No hace falta una allowlist de herramientas: está activada de forma predeterminada cuando hay un proveedor disponible.

## Proveedores compatibles

| Proveedor | Modelo predeterminado             | Compatibilidad de edición          | Clave API                                              |
| --------- | --------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI    | `gpt-image-2`                     | Sí (hasta 5 imágenes)              | `OPENAI_API_KEY`                                       |
| Google    | `gemini-3.1-flash-image-preview`  | Sí                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal       | `fal-ai/flux/dev`                 | Sí                                 | `FAL_KEY`                                              |
| MiniMax   | `image-01`                        | Sí (referencia de sujeto)          | `MINIMAX_API_KEY` o OAuth de MiniMax (`minimax-portal`) |
| ComfyUI   | `workflow`                        | Sí (1 imagen, configurado por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para cloud |
| Vydra     | `grok-imagine`                    | No                                 | `VYDRA_API_KEY`                                        |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```
/tool image_generate action=list
```

## Parámetros de la herramienta

| Parámetro     | Tipo     | Descripción                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt de generación de imagen (obligatorio para `action: "generate"`)            |
| `action`      | string   | `"generate"` (predeterminado) o `"list"` para inspeccionar proveedores            |
| `model`       | string   | Sobrescritura de proveedor/modelo, por ejemplo `openai/gpt-image-2`               |
| `image`       | string   | Ruta o URL de una sola imagen de referencia para el modo edición                   |
| `images`      | string[] | Varias imágenes de referencia para el modo edición (hasta 5)                       |
| `size`        | string   | Indicación de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160` |
| `aspectRatio` | string   | Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Indicación de resolución: `1K`, `2K` o `4K`                                       |
| `count`       | number   | Número de imágenes a generar (1–4)                                                |
| `filename`    | string   | Indicación del nombre del archivo de salida                                        |

No todos los proveedores admiten todos los parámetros. Cuando un proveedor fallback admite una opción de geometría cercana en lugar de la solicitada exactamente, OpenClaw la remapea al tamaño, relación de aspecto o resolución compatible más cercana antes del envío. Las sobrescrituras realmente no compatibles siguen informándose en el resultado de la herramienta.

Los resultados de la herramienta informan la configuración aplicada. Cuando OpenClaw remapea geometría durante el fallback de proveedor, los valores devueltos `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción de solicitado a aplicado.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Orden de selección de proveedores

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. El parámetro **`model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática** — usa solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes registrados de generación de imágenes en orden de id de proveedor

Si un proveedor falla (error de autenticación, límite de tasa, etc.), el siguiente candidato se prueba automáticamente. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- La detección automática reconoce la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos cuando OpenClaw realmente puede autenticar ese proveedor.
- La detección automática está activada de forma predeterminada. Configura `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la generación de imágenes use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Usa `action: "list"` para inspeccionar los proveedores registrados actualmente, sus modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, Google, fal, MiniMax y ComfyUI admiten edición de imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI y Google admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa `openai/gpt-image-2` de forma predeterminada. El modelo anterior `openai/gpt-image-1` todavía puede seleccionarse explícitamente, pero las nuevas solicitudes de generación y edición de imágenes de OpenAI deben usar `gpt-image-2`.

`gpt-image-2` admite tanto generación de texto a imagen como edición de imágenes de referencia mediante la misma herramienta `image_generate`. OpenClaw reenvía `prompt`, `count`, `size` e imágenes de referencia a OpenAI. OpenAI no recibe `aspectRatio` ni `resolution` directamente; cuando es posible, OpenClaw los asigna a un `size` compatible; de lo contrario, la herramienta los informa como sobrescrituras ignoradas.

Generar una imagen horizontal 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Generar dos imágenes cuadradas:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Editar una imagen de referencia local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Editar con varias referencias:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La generación de imágenes de MiniMax está disponible a través de ambas rutas de autenticación incluidas de MiniMax:

- `minimax/image-01` para configuraciones con clave API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades de los proveedores

| Capacidad            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generar              | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1) |
| Editar/referencia    | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)      | Sí (1 imagen, ref. de sujeto) | Sí (1 imagen, configurado por workflow) | No |
| Control de tamaño    | Sí (hasta 4K)        | Sí                   | Sí                  | No                         | No                                 | No      |
| Relación de aspecto  | No                   | Sí                   | Sí (solo generar)   | Sí                         | No                                 | No      |
| Resolución (1K/2K/4K) | No                  | Sí                   | Sí                  | No                         | No                                 | No      |

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas disponibles del agente
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y video fal
- [ComfyUI](/es/providers/comfy) — configuración de workflows de ComfyUI local y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imágenes, video y voz de Vydra
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — configuración `imageGenerationModel`
- [Models](/es/concepts/models) — configuración de modelos y failover
