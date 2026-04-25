---
read_when:
    - Quieres usar modelos de Google Gemini con OpenClaw
    - Necesitas la clave de API o el flujo de autenticación OAuth
summary: Configuración de Google Gemini (clave de API + OAuth, generación de imágenes, comprensión de medios, TTS, búsqueda web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:55:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

El Plugin de Google proporciona acceso a los modelos Gemini a través de Google AI Studio, además de
generación de imágenes, comprensión de medios (imagen/audio/video), conversión de texto a voz y búsqueda web mediante
Gemini Grounding.

- Proveedor: `google`
- Autenticación: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API de Google Gemini
- Opción de tiempo de ejecución: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  reutiliza OAuth de Gemini CLI mientras mantiene las referencias de modelos canónicas como `google/*`.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API de Gemini a través de Google AI Studio.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Las variables de entorno `GEMINI_API_KEY` y `GOOGLE_API_KEY` son ambas válidas. Usa la que ya tengas configurada.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideal para:** reutilizar un inicio de sesión existente de Gemini CLI mediante PKCE OAuth en lugar de una clave de API independiente.

    <Warning>
    El proveedor `google-gemini-cli` es una integración no oficial. Algunos usuarios
    informan restricciones de cuenta al usar OAuth de esta manera. Úsalo bajo tu propia responsabilidad.
    </Warning>

    <Steps>
      <Step title="Instala Gemini CLI">
        El comando local `gemini` debe estar disponible en `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw admite tanto instalaciones con Homebrew como instalaciones globales con npm, incluidas
        las disposiciones comunes de Windows/npm.
      </Step>
      <Step title="Inicia sesión mediante OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modelo predeterminado: `google/gemini-3.1-pro-preview`
    - Tiempo de ejecución: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Variables de entorno:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (O las variantes `GEMINI_CLI_*`).

    <Note>
    Si las solicitudes OAuth de Gemini CLI fallan después del inicio de sesión, establece `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` en el host de Gateway y vuelve a intentarlo.
    </Note>

    <Note>
    Si el inicio de sesión falla antes de que comience el flujo en el navegador, asegúrate de que el comando local `gemini`
    esté instalado y en `PATH`.
    </Note>

    Las referencias de modelo `google-gemini-cli/*` son alias heredados de compatibilidad. Las nuevas
    configuraciones deben usar referencias de modelo `google/*` más el tiempo de ejecución `google-gemini-cli`
    cuando quieran ejecución local de Gemini CLI.

  </Tab>
</Tabs>

## Capacidades

| Capability             | Supported                     |
| ---------------------- | ----------------------------- |
| Chat completions       | Sí                            |
| Image generation       | Sí                            |
| Music generation       | Sí                            |
| Text-to-speech         | Sí                            |
| Realtime voice         | Sí (Google Live API)          |
| Image understanding    | Sí                            |
| Audio transcription    | Sí                            |
| Video understanding    | Sí                            |
| Web search (Grounding) | Sí                            |
| Thinking/reasoning     | Sí (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4 models         | Sí                            |

<Tip>
Los modelos Gemini 3 usan `thinkingLevel` en lugar de `thinkingBudget`. OpenClaw asigna
los controles de razonamiento de Gemini 3, Gemini 3.1 y del alias `gemini-*-latest` a
`thinkingLevel` para que las ejecuciones predeterminadas o de baja latencia no envíen
valores `thinkingBudget` desactivados.

`/think adaptive` mantiene la semántica de thinking dinámica de Google en lugar de elegir
un nivel fijo de OpenClaw. Gemini 3 y Gemini 3.1 omiten un `thinkingLevel` fijo para que
Google pueda elegir el nivel; Gemini 2.5 envía el valor centinela dinámico de Google
`thinkingBudget: -1`.

Los modelos Gemma 4 (por ejemplo `gemma-4-26b-a4b-it`) admiten modo thinking. OpenClaw
reescribe `thinkingBudget` a un `thinkingLevel` de Google compatible para Gemma 4.
Configurar thinking en `off` mantiene el thinking desactivado en lugar de mapearlo a
`MINIMAL`.
</Tip>

## Generación de imágenes

El proveedor de generación de imágenes `google` incluido usa de forma predeterminada
`google/gemini-3.1-flash-image-preview`.

- También admite `google/gemini-3-pro-image-preview`
- Generación: hasta 4 imágenes por solicitud
- Modo de edición: habilitado, hasta 5 imágenes de entrada
- Controles geométricos: `size`, `aspectRatio` y `resolution`

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

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de video

El Plugin `google` incluido también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `google/veo-3.1-fast-generate-preview`
- Modos: texto a video, imagen a video y flujos de referencia de un solo video
- Admite `aspectRatio`, `resolution` y `audio`
- Límite actual de duración: **de 4 a 8 segundos**

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

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Generación de música

El Plugin `google` incluido también registra generación de música mediante la herramienta compartida
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

<Note>
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

## Conversión de texto a voz

El proveedor de voz `google` incluido usa la ruta TTS de la API de Gemini con
`gemini-3.1-flash-tts-preview`.

- Voz predeterminada: `Kore`
- Autenticación: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Salida: WAV para adjuntos TTS normales, PCM para Talk/telefonía
- Salida nativa de notas de voz: no compatible en esta ruta de la API de Gemini porque la API devuelve PCM en lugar de Opus

Para usar Google como proveedor TTS predeterminado:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

La TTS de la API de Gemini usa prompts en lenguaje natural para controlar el estilo. Establece
`audioProfile` para anteponer un prompt de estilo reutilizable antes del texto hablado. Establece
`speakerName` cuando el texto de tu prompt haga referencia a un hablante con nombre.

La TTS de la API de Gemini también acepta etiquetas de audio expresivas entre corchetes en el texto,
como `[whispers]` o `[laughs]`. Para mantener las etiquetas fuera de la respuesta visible del chat
mientras se envían a TTS, colócalas dentro de un bloque `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una clave de API de Google Cloud Console restringida a la API de Gemini es válida para este
proveedor. Esta no es la ruta independiente de la API de Cloud Text-to-Speech.
</Note>

## Voz en tiempo real

El Plugin `google` incluido registra un proveedor de voz en tiempo real respaldado por la
API Gemini Live para puentes de audio de backend como Voice Call y Google Meet.

| Setting               | Config path                                                         | Default                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voice                 | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (sin establecer)                                                                      |
| VAD start sensitivity | `...google.startSensitivity`                                        | (sin establecer)                                                                      |
| VAD end sensitivity   | `...google.endSensitivity`                                          | (sin establecer)                                                                      |
| Silence duration      | `...google.silenceDurationMs`                                       | (sin establecer)                                                                      |
| API key               | `...google.apiKey`                                                  | Recurre a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`      |

Ejemplo de configuración de Voice Call en tiempo real:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
La API Google Live usa audio bidireccional y llamadas a funciones mediante un WebSocket.
OpenClaw adapta el audio de puentes de telefonía/Meet al flujo PCM de la API Live de Gemini y
mantiene las llamadas a herramientas en el contrato compartido de voz en tiempo real. Deja `temperature`
sin establecer a menos que necesites cambios de muestreo; OpenClaw omite valores no positivos
porque Google Live puede devolver transcripciones sin audio para `temperature: 0`.
La transcripción de la API de Gemini se habilita sin `languageCodes`; el SDK actual de Google
rechaza sugerencias de códigos de idioma en esta ruta de API.
</Note>

<Note>
Las sesiones del navegador de Talk en Control UI siguen requiriendo un proveedor de voz en tiempo real con una
implementación de sesión WebRTC en el navegador. Hoy esa ruta es OpenAI Realtime; el
proveedor de Google es para puentes de backend en tiempo real.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Reutilización directa de caché de Gemini">
    Para ejecuciones directas de la API de Gemini (`api: "google-generative-ai"`), OpenClaw
    pasa un identificador `cachedContent` configurado a las solicitudes de Gemini.

    - Configura parámetros por modelo o globales con
      `cachedContent` o el heredado `cached_content`
    - Si ambos están presentes, `cachedContent` tiene prioridad
    - Valor de ejemplo: `cachedContents/prebuilt-context`
    - El uso de aciertos de caché de Gemini se normaliza en OpenClaw como `cacheRead` a partir del valor
      ascendente `cachedContentTokenCount`

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

  </Accordion>

  <Accordion title="Notas sobre el uso de JSON en Gemini CLI">
    Al usar el proveedor OAuth `google-gemini-cli`, OpenClaw normaliza
    la salida JSON del CLI de la siguiente manera:

    - El texto de respuesta proviene del campo `response` del JSON del CLI.
    - El uso recurre a `stats` cuando el CLI deja `usage` vacío.
    - `stats.cached` se normaliza en OpenClaw como `cacheRead`.
    - Si falta `stats.input`, OpenClaw deriva los tokens de entrada a partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GEMINI_API_KEY`
    esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedores.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedores.
  </Card>
</CardGroup>
