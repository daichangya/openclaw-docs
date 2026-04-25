---
read_when:
    - Generar imágenes mediante el agente
    - Configurar proveedores y modelos de generación de imágenes
    - Entender los parámetros de la herramienta `image_generate`
summary: Genera y edita imágenes usando proveedores configurados (OpenAI, OAuth de OpenAI Codex, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generación de imágenes
x-i18n:
    generated_at: "2026-04-25T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

La herramienta `image_generate` permite al agente crear y editar imágenes usando tus proveedores configurados. Las imágenes generadas se entregan automáticamente como archivos adjuntos multimedia en la respuesta del agente.

<Note>
La herramienta solo aparece cuando al menos un proveedor de generación de imágenes está disponible. Si no ves `image_generate` en las herramientas de tu agente, configura `agents.defaults.imageGenerationModel`, establece una clave API de proveedor o inicia sesión con OAuth de OpenAI Codex.
</Note>

## Inicio rápido

1. Establece una clave API para al menos un proveedor (por ejemplo `OPENAI_API_KEY`, `GEMINI_API_KEY` o `OPENROUTER_API_KEY`) o inicia sesión con OAuth de OpenAI Codex.
2. Opcionalmente, establece tu modelo preferido:

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

OAuth de Codex usa la misma referencia de modelo `openai/gpt-image-2`. Cuando hay
un perfil OAuth de `openai-codex` configurado, OpenClaw enruta las solicitudes de imágenes
a través de ese mismo perfil OAuth en lugar de intentar primero con `OPENAI_API_KEY`.
La configuración explícita y personalizada de imágenes en `models.providers.openai`, como una clave API o
una URL base personalizada/Azure, vuelve a optar por la ruta directa de la API de imágenes de OpenAI.
Para endpoints LAN compatibles con OpenAI como LocalAI, mantén la
`models.providers.openai.baseUrl` personalizada y opta explícitamente con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; los endpoints de imágenes
privados/internos siguen bloqueados de forma predeterminada.

3. Pídele al agente: _"Genera una imagen de una mascota robot amistosa."_

El agente llama a `image_generate` automáticamente. No hace falta una lista de herramientas permitidas: está habilitada de forma predeterminada cuando hay un proveedor disponible.

## Rutas habituales

| Objetivo                                             | Referencia del modelo                               | Auth                                 |
| ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| Generación de imágenes de OpenAI con facturación por API | `openai/gpt-image-2`                             | `OPENAI_API_KEY`                     |
| Generación de imágenes de OpenAI con autenticación por suscripción de Codex | `openai/gpt-image-2`            | OAuth de OpenAI Codex                |
| Generación de imágenes con OpenRouter                | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                 |
| Generación de imágenes con Google Gemini             | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` o `GOOGLE_API_KEY`  |

La misma herramienta `image_generate` gestiona la generación de texto a imagen y la
edición con imágenes de referencia. Usa `image` para una referencia o `images` para múltiples referencias.
Las sugerencias de salida admitidas por el proveedor, como `quality`, `outputFormat` y
`background` específico de OpenAI, se reenvían cuando están disponibles y se informan como ignoradas cuando un proveedor no las admite.

## Proveedores compatibles

| Proveedor  | Modelo predeterminado                    | Compatibilidad de edición            | Auth                                                  |
| ---------- | ---------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | Sí (hasta 4 imágenes)                | `OPENAI_API_KEY` o OAuth de OpenAI Codex              |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Sí (hasta 5 imágenes de entrada)     | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`         | Sí                                   | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| fal        | `fal-ai/flux/dev`                        | Sí                                   | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | Sí (referencia del sujeto)           | `MINIMAX_API_KEY` o OAuth de MiniMax (`minimax-portal`) |
| ComfyUI    | `workflow`                               | Sí (1 imagen, configurada por workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para la nube |
| Vydra      | `grok-imagine`                           | No                                   | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | Sí (hasta 5 imágenes)                | `XAI_API_KEY`                                         |

Usa `action: "list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución:

```text
/tool image_generate action=list
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
Prompt de generación de imágenes. Obligatorio para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` para inspeccionar los proveedores y modelos disponibles en tiempo de ejecución.
</ParamField>

<ParamField path="model" type="string">
Sustitución de proveedor/modelo, por ejemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Ruta o URL de una sola imagen de referencia para el modo de edición.
</ParamField>

<ParamField path="images" type="string[]">
Múltiples imágenes de referencia para el modo de edición (hasta 5).
</ParamField>

<ParamField path="size" type="string">
Sugerencia de tamaño: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Relación de aspecto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Sugerencia de resolución.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Sugerencia de calidad cuando el proveedor la admite.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Sugerencia de formato de salida cuando el proveedor la admite.
</ParamField>

<ParamField path="count" type="number">
Número de imágenes a generar (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Tiempo de espera opcional de la solicitud del proveedor en milisegundos.
</ParamField>

<ParamField path="filename" type="string">
Sugerencia de nombre de archivo de salida.
</ParamField>

<ParamField path="openai" type="object">
Sugerencias solo para OpenAI: `background`, `moderation`, `outputCompression` y `user`.
</ParamField>

No todos los proveedores admiten todos los parámetros. Cuando un proveedor de failover admite una opción de geometría cercana en lugar de la solicitada exactamente, OpenClaw reasigna al tamaño, relación de aspecto o resolución admitidos más cercanos antes del envío. Las sugerencias de salida no admitidas, como `quality` o `outputFormat`, se eliminan para los proveedores que no declaran compatibilidad y se informan en el resultado de la herramienta.

Los resultados de la herramienta informan de los ajustes aplicados. Cuando OpenClaw reasigna la geometría durante el failover de proveedor, los valores devueltos de `size`, `aspectRatio` y `resolution` reflejan lo que realmente se envió, y `details.normalization` captura la traducción de lo solicitado a lo aplicado.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Orden de selección de proveedor

Al generar una imagen, OpenClaw prueba los proveedores en este orden:

1. **Parámetro `model`** de la llamada a la herramienta (si el agente especifica uno)
2. **`imageGenerationModel.primary`** de la configuración
3. **`imageGenerationModel.fallbacks`** en orden
4. **Detección automática**: usa solo valores predeterminados de proveedor respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - después los proveedores de generación de imágenes registrados restantes en orden de id de proveedor

Si un proveedor falla (error de autenticación, límite de tasa, etc.), se prueba automáticamente el siguiente candidato configurado. Si todos fallan, el error incluye detalles de cada intento.

Notas:

- Una sustitución `model` por llamada es exacta: OpenClaw prueba solo ese proveedor/modelo
  y no continúa con proveedores configurados como principal/de failover ni detectados
  automáticamente.
- La detección automática tiene en cuenta la autenticación. Un valor predeterminado de proveedor solo entra en la lista de candidatos
  cuando OpenClaw puede autenticar realmente ese proveedor.
- La detección automática está habilitada de forma predeterminada. Establece
  `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la generación de imágenes
  use solo las entradas explícitas `model`, `primary` y `fallbacks`.
- Usa `action: "list"` para inspeccionar los proveedores actualmente registrados, sus
  modelos predeterminados y las sugerencias de variables de entorno de autenticación.

### Edición de imágenes

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI y xAI admiten editar imágenes de referencia. Pasa una ruta o URL de imagen de referencia:

```text
"Genera una versión en acuarela de esta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google y xAI admiten hasta 5 imágenes de referencia mediante el parámetro `images`. fal, MiniMax y ComfyUI admiten 1.

### Modelos de imágenes de OpenRouter

La generación de imágenes con OpenRouter usa la misma `OPENROUTER_API_KEY` y se enruta mediante la API de imágenes de chat completions de OpenRouter. Selecciona modelos de imágenes de OpenRouter con el prefijo `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw reenvía `prompt`, `count`, imágenes de referencia y sugerencias `aspectRatio` / `resolution` compatibles con Gemini a OpenRouter. Los atajos actuales integrados de modelos de imágenes de OpenRouter incluyen `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` y `openai/gpt-5.4-image-2`; usa `action: "list"` para ver lo que expone tu Plugin configurado.

### OpenAI `gpt-image-2`

La generación de imágenes de OpenAI usa por defecto `openai/gpt-image-2`. Si hay un
perfil OAuth de `openai-codex` configurado, OpenClaw reutiliza ese mismo perfil OAuth
usado por los modelos de chat por suscripción de Codex y envía la solicitud de imagen
mediante el backend de Codex Responses. Las URL base heredadas de Codex, como
`https://chatgpt.com/backend-api`, se canonizan a
`https://chatgpt.com/backend-api/codex` para las solicitudes de imágenes. No
recurre silenciosamente a `OPENAI_API_KEY` para esa solicitud. Para forzar el enrutamiento directo a la
API de imágenes de OpenAI, configura `models.providers.openai` explícitamente con una
clave API, una URL base personalizada o un endpoint de Azure. El modelo antiguo
`openai/gpt-image-1` todavía se puede seleccionar explícitamente, pero las nuevas solicitudes de
generación y edición de imágenes de OpenAI deberían usar `gpt-image-2`.

`gpt-image-2` admite tanto la generación de texto a imagen como la
edición con imágenes de referencia mediante la misma herramienta `image_generate`. OpenClaw reenvía `prompt`,
`count`, `size`, `quality`, `outputFormat` e imágenes de referencia a OpenAI.
OpenAI no recibe `aspectRatio` ni `resolution` directamente; cuando es posible
OpenClaw los asigna a un `size` admitido; de lo contrario, la herramienta los informa como
sustituciones ignoradas.

Las opciones específicas de OpenAI se encuentran bajo el objeto `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` acepta `transparent`, `opaque` o `auto`; las
salidas transparentes requieren `outputFormat` `png` o `webp`. `openai.outputCompression`
se aplica a las salidas JPEG/WebP.

Generar una imagen horizontal 4K:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Generar dos imágenes cuadradas:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Editar una imagen de referencia local:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Editar con múltiples referencias:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para enrutar la generación de imágenes de OpenAI mediante una implementación de Azure OpenAI en lugar
de `api.openai.com`, consulta [Endpoints de Azure OpenAI](/es/providers/openai#azure-openai-endpoints)
en la documentación del proveedor OpenAI.

La generación de imágenes de MiniMax está disponible a través de ambas rutas de autenticación de MiniMax incluidas:

- `minimax/image-01` para configuraciones con clave API
- `minimax-portal/image-01` para configuraciones con OAuth

## Capacidades del proveedor

| Capacidad            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generar              | Sí (hasta 4)         | Sí (hasta 4)         | Sí (hasta 4)        | Sí (hasta 9)               | Sí (salidas definidas por workflow) | Sí (1)  | Sí (hasta 4)         |
| Editar/referencia    | Sí (hasta 5 imágenes) | Sí (hasta 5 imágenes) | Sí (1 imagen)      | Sí (1 imagen, referencia del sujeto) | Sí (1 imagen, configurada por workflow) | No      | Sí (hasta 5 imágenes) |
| Control de tamaño    | Sí (hasta 4K)        | Sí                   | Sí                  | No                         | No                                 | No      | No                   |
| Relación de aspecto  | No                   | Sí                   | Sí (solo generar)   | Sí                         | No                                 | No      | Sí                   |
| Resolución (1K/2K/4K) | No                  | Sí                   | Sí                  | No                         | No                                 | No      | Sí (1K/2K)           |

### xAI `grok-imagine-image`

El proveedor xAI incluido usa `/v1/images/generations` para solicitudes solo de prompt
y `/v1/images/edits` cuando `image` o `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Cantidad: hasta 4
- Referencias: un `image` o hasta cinco `images`
- Relaciones de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluciones: `1K`, `2K`
- Salidas: se devuelven como archivos adjuntos de imagen gestionados por OpenClaw

OpenClaw intencionalmente no expone `quality`, `mask`, `user` nativos de xAI ni
relaciones de aspecto adicionales exclusivas nativas hasta que esos controles existan en el contrato
compartido entre proveedores de `image_generate`.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [fal](/es/providers/fal) — configuración del proveedor de imágenes y video de fal
- [ComfyUI](/es/providers/comfy) — configuración de workflow local de ComfyUI y Comfy Cloud
- [Google (Gemini)](/es/providers/google) — configuración del proveedor de imágenes Gemini
- [MiniMax](/es/providers/minimax) — configuración del proveedor de imágenes MiniMax
- [OpenAI](/es/providers/openai) — configuración del proveedor de OpenAI Images
- [Vydra](/es/providers/vydra) — configuración de imagen, video y voz de Vydra
- [xAI](/es/providers/xai) — configuración de Grok para imagen, video, búsqueda, ejecución de código y TTS
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `imageGenerationModel`
- [Modelos](/es/concepts/models) — configuración de modelos y failover
