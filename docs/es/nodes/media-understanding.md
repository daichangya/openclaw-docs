---
read_when:
    - Diseñar o refactorizar la comprensión multimedia
    - Ajustar el preprocesamiento entrante de audio/video/imagen
summary: Comprensión entrante de imágenes/audio/video (opcional) con respaldo de proveedor y CLI
title: Comprensión multimedia
x-i18n:
    generated_at: "2026-04-25T13:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Comprensión multimedia - Entrante (2026-01-17)

OpenClaw puede **resumir archivos multimedia entrantes** (imagen/audio/video) antes de que se ejecute el flujo de respuesta. Detecta automáticamente cuándo hay herramientas locales o claves de proveedor disponibles, y puede desactivarse o personalizarse. Si la comprensión está desactivada, los modelos siguen recibiendo los archivos/URL originales como de costumbre.

El comportamiento multimedia específico del proveedor se registra mediante Plugins del proveedor, mientras que el núcleo de OpenClaw gestiona la configuración compartida `tools.media`, el orden de respaldo y la integración con el flujo de respuesta.

## Objetivos

- Opcional: procesar previamente los archivos multimedia entrantes en texto corto para un enrutamiento más rápido y mejor análisis de comandos.
- Conservar siempre la entrega del archivo multimedia original al modelo.
- Admitir **API de proveedores** y **respaldos por CLI**.
- Permitir varios modelos con respaldo ordenado (error/tamaño/timeout).

## Comportamiento de alto nivel

1. Recopilar archivos adjuntos entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidad habilitada (imagen/audio/video), seleccionar archivos adjuntos según la política (predeterminado: **primero**).
3. Elegir la primera entrada de modelo elegible (tamaño + capacidad + autenticación).
4. Si un modelo falla o el archivo multimedia es demasiado grande, **usar como respaldo la siguiente entrada**.
5. En caso de éxito:
   - `Body` pasa a ser un bloque `[Image]`, `[Audio]` o `[Video]`.
   - Audio establece `{{Transcript}}`; el análisis de comandos usa el texto del pie cuando está presente y, en caso contrario, la transcripción.
   - Los pies se conservan como `User text:` dentro del bloque.

Si la comprensión falla o está desactivada, **el flujo de respuesta continúa** con el cuerpo original + los archivos adjuntos.

## Descripción general de la configuración

`tools.media` admite **modelos compartidos** más anulaciones por capacidad:

- `tools.media.models`: lista de modelos compartida (usa `capabilities` para restringir).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - valores predeterminados (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - anulaciones del proveedor (`baseUrl`, `headers`, `providerOptions`)
  - opciones de audio de Deepgram mediante `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcripción de audio (`echoTranscript`, predeterminado `false`; `echoFormat`)
  - lista opcional de `models` **por capacidad** (se prefiere antes que los modelos compartidos)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (restricción opcional por canal/chatType/clave de sesión)
- `tools.media.concurrency`: número máximo de ejecuciones simultáneas por capacidad (predeterminado **2**).

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

Cada entrada `models[]` puede ser de **proveedor** o **CLI**:

```json5
{
  type: "provider", // predeterminado si se omite
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opcional, se usa para entradas multimodales
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

Las plantillas CLI también pueden usar:

- `{{MediaDir}}` (directorio que contiene el archivo multimedia)
- `{{OutputDir}}` (directorio temporal creado para esta ejecución)
- `{{OutputBase}}` (ruta base del archivo temporal, sin extensión)

## Valores predeterminados y límites

Valores predeterminados recomendados:

- `maxChars`: **500** para imagen/video (corto, apto para comandos)
- `maxChars`: **sin configurar** para audio (transcripción completa a menos que establezcas un límite)
- `maxBytes`:
  - imagen: **10MB**
  - audio: **20MB**
  - video: **50MB**

Reglas:

- Si el archivo multimedia supera `maxBytes`, ese modelo se omite y **se prueba el siguiente modelo**.
- Los archivos de audio menores de **1024 bytes** se tratan como vacíos/corruptos y se omiten antes de la transcripción por proveedor/CLI.
- Si el modelo devuelve más de `maxChars`, la salida se recorta.
- `prompt` usa de forma predeterminada una instrucción simple “Describe the {media}.” más la guía de `maxChars` (solo imagen/video).
- Si el modelo de imagen principal activo ya admite visión de forma nativa, OpenClaw omite el bloque de resumen `[Image]` y pasa la imagen original al modelo.
- Si el modelo principal de Gateway/WebChat es solo texto, los archivos adjuntos de imagen se conservan como referencias descargadas `media://inbound/*` para que las herramientas de imagen/PDF o el modelo de imagen configurado aún puedan inspeccionarlos en lugar de perder el archivo adjunto.
- Las solicitudes explícitas `openclaw infer image describe --model <provider/model>` son distintas: ejecutan directamente ese proveedor/modelo compatible con imágenes, incluidas referencias de Ollama como `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` pero no hay modelos configurados, OpenClaw prueba el **modelo de respuesta activo** cuando su proveedor admite la capacidad.

### Detección automática de comprensión multimedia (predeterminada)

Si `tools.media.<capability>.enabled` **no** está configurado en `false` y no has
configurado modelos, OpenClaw detecta automáticamente en este orden y **se detiene en la primera
opción que funcione**:

1. **Modelo de respuesta activo** cuando su proveedor admite la capacidad.
2. Referencias principal/de respaldo de **`agents.defaults.imageModel`** (solo imagen).
3. **CLIs locales** (solo audio; si están instaladas)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticación del proveedor**
   - Las entradas configuradas `models.providers.*` que admiten la capacidad se prueban antes del orden de respaldo incluido.
   - Los proveedores de configuración solo de imagen con un modelo compatible con imágenes se registran automáticamente para comprensión multimedia incluso cuando no son un Plugin de proveedor incluido.
   - La comprensión de imágenes con Ollama está disponible cuando se selecciona explícitamente, por ejemplo mediante `agents.defaults.imageModel` o `openclaw infer image describe --model ollama/<vision-model>`.
   - Orden de respaldo incluido:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Imagen: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Para desactivar la detección automática, configura:

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

Nota: la detección de binarios es de mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`) o configura un modelo CLI explícito con una ruta completa al comando.

### Compatibilidad con entorno proxy (modelos de proveedor)

Cuando la comprensión multimedia basada en **proveedor** para **audio** y **video** está habilitada, OpenClaw respeta las variables de entorno estándar de proxy de salida para las llamadas HTTP al proveedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no se configura ninguna variable de entorno de proxy, la comprensión multimedia usa salida directa.
Si el valor del proxy está mal formado, OpenClaw registra una advertencia y usa como respaldo
la obtención directa.

## Capacidades (opcional)

Si configuras `capabilities`, la entrada solo se ejecuta para esos tipos de multimedia. Para listas compartidas,
OpenClaw puede inferir valores predeterminados:

- `openai`, `anthropic`, `minimax`: **imagen**
- `minimax-portal`: **imagen**
- `moonshot`: **imagen + video**
- `openrouter`: **imagen**
- `google` (API de Gemini): **imagen + audio + video**
- `qwen`: **imagen + video**
- `mistral`: **audio**
- `zai`: **imagen**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Cualquier catálogo `models.providers.<id>.models[]` con un modelo compatible con imágenes:
  **imagen**

Para entradas CLI, **configura `capabilities` explícitamente** para evitar coincidencias inesperadas.
Si omites `capabilities`, la entrada es elegible para la lista en la que aparece.

## Matriz de compatibilidad de proveedores (integraciones de OpenClaw)

| Capability | Integración de proveedor                                                                                                      | Notas                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagen     | OpenAI, OpenAI Codex OAuth, servidor de aplicaciones Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, proveedores de configuración | Los Plugins de proveedor registran la compatibilidad con imágenes; `openai-codex/*` usa la infraestructura del proveedor OAuth; `codex/*` usa un turno limitado del servidor de aplicaciones Codex; MiniMax y MiniMax OAuth usan ambos `MiniMax-VL-01`; los proveedores de configuración compatibles con imágenes se registran automáticamente. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                          | Transcripción mediante proveedor (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                        | Comprensión de video mediante proveedor a través de Plugins del proveedor; la comprensión de video con Qwen usa los endpoints Standard DashScope.                                                                                      |

Nota sobre MiniMax:

- La comprensión de imágenes de `minimax` y `minimax-portal` proviene del proveedor multimedia `MiniMax-VL-01` gestionado por Plugin.
- El catálogo de texto de MiniMax incluido sigue empezando como solo texto; las entradas explícitas `models.providers.minimax` materializan referencias de chat M2.7 compatibles con imágenes.

## Guía de selección de modelos

- Prefiere el modelo más fuerte y de última generación disponible para cada capacidad multimedia cuando importan la calidad y la seguridad.
- Para agentes con herramientas que manejan entradas no confiables, evita modelos multimedia más antiguos o débiles.
- Mantén al menos un respaldo por capacidad para disponibilidad (modelo de calidad + modelo más rápido/barato).
- Los respaldos por CLI (`whisper-cli`, `whisper`, `gemini`) son útiles cuando las API de proveedores no están disponibles.
- Nota sobre `parakeet-mlx`: con `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando el formato de salida es `txt` (o no se especifica); los formatos que no son `txt` usan stdout como respaldo.

## Política de archivos adjuntos

`attachments` por capacidad controla qué archivos adjuntos se procesan:

- `mode`: `first` (predeterminado) o `all`
- `maxAttachments`: límite de cantidad procesada (predeterminado **1**)
- `prefer`: `first`, `last`, `path`, `url`

Cuando `mode: "all"`, las salidas se etiquetan como `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportamiento de extracción de archivos adjuntos:

- El texto extraído de archivos se envuelve como **contenido externo no confiable** antes de añadirse al prompt multimedia.
- El bloque inyectado usa marcadores de límite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos
  `Source: External`.
- Esta ruta de extracción de archivos adjuntos omite intencionadamente el largo banner
  `SECURITY NOTICE:` para evitar inflar el prompt multimedia; los marcadores de
  límite y los metadatos siguen presentes.
- Si un archivo no tiene texto extraíble, OpenClaw inyecta `[No extractable text]`.
- Si un PDF usa como respaldo imágenes de páginas renderizadas en esta ruta, el prompt multimedia conserva
  el marcador `[PDF content rendered to images; images not forwarded to model]`
  porque este paso de extracción de archivos adjuntos reenvía bloques de texto, no las imágenes renderizadas del PDF.

## Ejemplos de configuración

### 1) Lista de modelos compartida + anulaciones

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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

### 3) Comprensión de imagen opcional

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
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

Cuando se ejecuta la comprensión multimedia, `/status` incluye una línea de resumen corta:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Esto muestra los resultados por capacidad y el proveedor/modelo elegido cuando corresponde.

## Notas

- La comprensión es de **mejor esfuerzo**. Los errores no bloquean las respuestas.
- Los archivos adjuntos siguen pasándose a los modelos incluso cuando la comprensión está desactivada.
- Usa `scope` para limitar dónde se ejecuta la comprensión (por ejemplo, solo en mensajes directos).

## Documentación relacionada

- [Configuración](/es/gateway/configuration)
- [Compatibilidad con imágenes y multimedia](/es/nodes/images)
