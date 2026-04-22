---
read_when:
    - Diseñando o refactorizando la comprensión multimedia
    - Ajustando el preprocesamiento entrante de audio/video/imagen
summary: Comprensión de imágenes/audio/video entrantes (opcional) con respaldo del proveedor y de la CLI
title: Comprensión multimedia
x-i18n:
    generated_at: "2026-04-22T04:23:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensión multimedia - Entrante (2026-01-17)

OpenClaw puede **resumir contenido multimedia entrante** (imagen/audio/video) antes de que se ejecute la canalización de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede deshabilitarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URL originales como siempre.

El comportamiento multimedia específico del proveedor se registra mediante plugins de proveedor, mientras que el
núcleo de OpenClaw posee la configuración compartida de `tools.media`, el orden de respaldo y la integración con la
canalización de respuesta.

## Objetivos

- Opcional: predigerir el contenido multimedia entrante en texto breve para un enrutamiento más rápido y un mejor análisis de comandos.
- Conservar siempre la entrega del contenido multimedia original al modelo.
- Compatibilidad con **API de proveedores** y **respaldo por CLI**.
- Permitir varios modelos con respaldo ordenado (error/tamaño/tiempo de espera).

## Comportamiento de alto nivel

1. Recopilar adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidad habilitada (imagen/audio/video), seleccionar adjuntos según la política (predeterminado: **first**).
3. Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
4. Si un modelo falla o el contenido multimedia es demasiado grande, **usar como respaldo la siguiente entrada**.
5. En caso de éxito:
   - `Body` pasa a ser un bloque `[Image]`, `[Audio]` o `[Video]`.
   - Audio establece `{{Transcript}}`; el análisis de comandos usa el texto de la leyenda cuando está presente,
     en caso contrario, la transcripción.
   - Las leyendas se conservan como `User text:` dentro del bloque.

Si la comprensión falla o está deshabilitada, **el flujo de respuesta continúa** con el cuerpo original + adjuntos.

## Resumen de configuración

`tools.media` admite **modelos compartidos** además de anulaciones por capacidad:

- `tools.media.models`: lista de modelos compartida (usa `capabilities` para restringir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - anulaciones de proveedor (`baseUrl`, `headers`, `providerOptions`)
  - opciones de audio Deepgram mediante `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
  - lista opcional de `models` **por capacidad** (preferida antes que los modelos compartidos)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (restricción opcional por canal/chatType/clave de sesión)
- `tools.media.concurrency`: máximo de ejecuciones concurrentes por capacidad (predeterminado **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartida */
      ],
      image: {
        /* anulaciones opcionales */
      },
      audio: {
        /* anulaciones opcionales */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* anulaciones opcionales */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` puede ser de **proveedor** o de **CLI**:

```json5
{
  type: "provider", // predeterminado si se omite
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcional, usado para entradas multimodales
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Las plantillas de CLI también pueden usar:

- `{{MediaDir}}` (directorio que contiene el archivo multimedia)
- `{{OutputDir}}` (directorio temporal creado para esta ejecución)
- `{{OutputBase}}` (ruta base del archivo temporal, sin extensión)

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (breve, apto para comandos)
- `maxChars`: **sin establecer** para audio (transcripción completa salvo que establezcas un límite)
- `maxBytes`:
  - imagen: **10 MB**
  - audio: **20 MB**
  - video: **50 MB**

Reglas:

- Si el contenido multimedia supera `maxBytes`, ese modelo se omite y **se prueba el siguiente modelo**.
- Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI.
- Si el modelo devuelve más de `maxChars`, la salida se recorta.
- `prompt` usa por defecto un simple “Describe the {media}.” más la indicación de `maxChars` (solo imagen/video).
- Si el modelo de imagen primario activo ya admite visión de forma nativa, OpenClaw
  omite el bloque de resumen `[Image]` y en su lugar pasa la imagen original al
  modelo.
- Las solicitudes explícitas `openclaw infer image describe --model <provider/model>`
  son distintas: ejecutan directamente ese proveedor/modelo compatible con imagen, incluidos
  refs de Ollama como `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el
  **modelo de respuesta activo** cuando su proveedor admite esa capacidad.

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está establecido en `false` y no has
configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera
opción funcional**:

1. **Modelo de respuesta activo** cuando su proveedor admite la capacidad.
2. Refs primario/de respaldo de **`agents.defaults.imageModel`** (solo imagen).
3. **CLI locales** (solo audio; si están instalados)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticación del proveedor**
   - Las entradas configuradas `models.providers.*` que admiten la capacidad se
     prueban antes del orden de respaldo incluido.
   - Los proveedores de configuración solo de imagen con un modelo compatible con imagen se autorregistran para
     comprensión multimedia incluso cuando no son un plugin de proveedor incluido.
   - La comprensión de imágenes de Ollama está disponible cuando se selecciona explícitamente, por
     ejemplo mediante `agents.defaults.imageModel` o
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Orden de respaldo incluido:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
     - Imagen: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Para deshabilitar la detección automática, establece:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Nota: La detección de binarios se realiza con el mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`), o establece un modelo CLI explícito con una ruta completa al comando.

### Compatibilidad con entorno de proxy (modelos de proveedor)

Cuando la comprensión multimedia basada en proveedor de **audio** y **video** está habilitada, OpenClaw
respeta las variables de entorno estándar de proxy saliente para las llamadas HTTP del proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no se establece ninguna variable de entorno de proxy, la comprensión multimedia usa salida directa.
Si el valor del proxy está mal formado, OpenClaw registra una advertencia y vuelve a la
obtención directa.

## Capacidades (opcional)

Si estableces `capabilities`, la entrada solo se ejecuta para esos tipos de contenido multimedia. Para las
listas compartidas, OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API de Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo compatible con imagen:
  **image**

Para entradas de CLI, **establece `capabilities` explícitamente** para evitar coincidencias inesperadas.
Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de compatibilidad de proveedores (integraciones de OpenClaw)

| Capacidad | Integración de proveedor                                                               | Notas                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los plugins de proveedor registran compatibilidad de imagen; MiniMax y MiniMax OAuth usan ambos `MiniMax-VL-01`; los proveedores de configuración compatibles con imagen se autorregistran. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transcripción del proveedor (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video      | Google, Qwen, Moonshot                                                                 | Comprensión de video del proveedor mediante plugins de proveedor; la comprensión de video de Qwen usa los endpoints Standard DashScope.                         |

Nota sobre MiniMax:

- La comprensión de imágenes de `minimax` y `minimax-portal` proviene del proveedor multimedia
  `MiniMax-VL-01` propiedad del Plugin.
- El catálogo de texto MiniMax incluido sigue comenzando solo con texto; las entradas explícitas
  `models.providers.minimax` materializan refs de chat M2.7 compatibles con imagen.

## Guía para la selección de modelos

- Prefiere el modelo más potente disponible de la generación más reciente para cada capacidad multimedia cuando la calidad y la seguridad sean importantes.
- Para agentes con herramientas que manejan entradas no confiables, evita modelos multimedia más antiguos o más débiles.
- Mantén al menos un respaldo por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Los respaldos por CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedor no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no está especificado); los formatos que no son `txt` usan `stdout` como respaldo.

## Política de adjuntos

`attachments` por capacidad controla qué adjuntos se procesan:

- `mode`: `first` (predeterminado) o `all`
- `maxAttachments`: límite del número procesado (predeterminado **1**)
- `prefer`: `first`, `last`, `path`, `url`

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportamiento de extracción de adjuntos de archivo:

- El texto extraído del archivo se envuelve como **contenido externo no confiable** antes de
  añadirse al prompt multimedia.
- El bloque inyectado usa marcadores explícitos de límites como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos
  `Source: External`.
- Esta ruta de extracción de adjuntos omite intencionadamente el banner largo
  `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores de
  límite y los metadatos siguen presentes.
- Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
- Si un PDF usa como respaldo imágenes de páginas renderizadas en esta ruta, el prompt multimedia conserva
  el marcador `[PDF content rendered to images; images not forwarded to model]`
  porque este paso de extracción de adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

## Ejemplos de configuración

### 1) Lista de modelos compartida + anulaciones

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Solo audio + video (imagen desactivada)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Comprensión opcional de imágenes

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entrada única multimodal (capacidades explícitas)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Salida de estado

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea breve de resumen:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Esto muestra resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión se realiza con **mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los adjuntos siguen pasándose a los modelos incluso cuando la comprensión está deshabilitada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en mensajes directos).

## Documentación relacionada

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
