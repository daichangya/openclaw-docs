---
read_when:
    - Habilitar texto a voz para respuestas
    - Configurar proveedores o límites de TTS
    - Usar comandos `/tts`
summary: Texto a voz (TTS) para respuestas salientes
title: Texto a voz
x-i18n:
    generated_at: "2026-04-25T13:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw puede convertir respuestas salientes en audio usando ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI o Xiaomi MiMo.
Funciona en cualquier lugar donde OpenClaw pueda enviar audio.

## Servicios compatibles

- **ElevenLabs** (proveedor principal o de respaldo)
- **Google Gemini** (proveedor principal o de respaldo; usa Gemini API TTS)
- **Gradium** (proveedor principal o de respaldo; admite salida de nota de voz y telefonía)
- **Local CLI** (proveedor principal o de respaldo; ejecuta un comando TTS local configurado)
- **Microsoft** (proveedor principal o de respaldo; la implementación incluida actual usa `node-edge-tts`)
- **MiniMax** (proveedor principal o de respaldo; usa la API T2A v2)
- **OpenAI** (proveedor principal o de respaldo; también se usa para resúmenes)
- **Vydra** (proveedor principal o de respaldo; proveedor compartido de imagen, video y voz)
- **xAI** (proveedor principal o de respaldo; usa la API TTS de xAI)
- **Xiaomi MiMo** (proveedor principal o de respaldo; usa MiMo TTS mediante Xiaomi chat completions)

### Notas sobre voz de Microsoft

El proveedor de voz de Microsoft incluido actualmente usa el servicio en línea
de TTS neuronal de Microsoft Edge mediante la biblioteca `node-edge-tts`. Es un servicio alojado (no
local), usa endpoints de Microsoft y no requiere clave de API.
`node-edge-tts` expone opciones de configuración de voz y formatos de salida, pero
no todas las opciones son compatibles con el servicio. La configuración heredada y la entrada de directivas
que usa `edge` siguen funcionando y se normalizan a `microsoft`.

Dado que esta ruta es un servicio web público sin un SLA ni cuota publicados,
trátala como de mejor esfuerzo. Si necesitas límites garantizados y soporte, usa OpenAI
o ElevenLabs.

## Claves opcionales

Si quieres OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI o Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (o `XI_API_KEY`)
- `GEMINI_API_KEY` (o `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS también acepta autenticación de Token Plan mediante
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI y la voz de Microsoft **no** requieren clave de API.

Si hay varios proveedores configurados, primero se usa el proveedor seleccionado y los demás quedan como opciones de respaldo.
El resumen automático usa `summaryModel` configurado (o `agents.defaults.model.primary`),
por lo que ese proveedor también debe estar autenticado si habilitas los resúmenes.

## Enlaces de servicio

- [Guía de texto a voz de OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referencia de la API de audio de OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto a voz de ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticación de ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/es/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Síntesis de voz de Xiaomi MiMo](/es/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de salida de voz de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Texto a voz de xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ¿Está habilitado de forma predeterminada?

No. El TTS automático está **desactivado** de forma predeterminada. Habilítalo en la configuración con
`messages.tts.auto` o localmente con `/tts on`.

Cuando `messages.tts.provider` no está establecido, OpenClaw elige el primer
proveedor de voz configurado en el orden de selección automática del registro.

## Configuración

La configuración de TTS se encuentra en `messages.tts` en `openclaw.json`.
El esquema completo está en [Configuración de Gateway](/es/gateway/configuration).

### Configuración mínima (habilitar + proveedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI principal con ElevenLabs como respaldo

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sin clave de API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

La resolución de autenticación de MiniMax TTS es `messages.tts.providers.minimax.apiKey`, luego
los perfiles OAuth/token almacenados de `minimax-portal`, después las claves de entorno de Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`) y después `MINIMAX_API_KEY`. Cuando no se establece una
`baseUrl` explícita de TTS, OpenClaw puede reutilizar el host OAuth
configurado de `minimax-portal` para voz de Token Plan.

### Google Gemini principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS usa la ruta de clave de API de Gemini. Una clave de API de Google Cloud Console
restringida a Gemini API es válida aquí, y es el mismo tipo de clave usado
por el proveedor integrado de generación de imágenes de Google. El orden de resolución es
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS usa la misma ruta `XAI_API_KEY` que el proveedor integrado de modelos Grok.
El orden de resolución es `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Las voces activas actuales son `ara`, `eve`, `leo`, `rex`, `sal` y `una`; `eve` es
la predeterminada. `language` acepta una etiqueta BCP-47 o `auto`.

### Xiaomi MiMo principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS usa la misma ruta `XIAOMI_API_KEY` que el proveedor integrado de modelos Xiaomi.
El id del proveedor de voz es `xiaomi`; `mimo` se acepta como alias.
El texto objetivo se envía como mensaje del asistente, coincidiendo con el contrato
de TTS de Xiaomi. El `style` opcional se envía como instrucción del usuario y no se pronuncia.

### OpenRouter principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS usa la misma ruta `OPENROUTER_API_KEY` que el proveedor integrado
de modelos OpenRouter. El orden de resolución es
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS ejecuta el comando configurado en el host del gateway. Los marcadores `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` y `{{OutputBase}}` se
expanden en `args`; si no hay ningún marcador `{{Text}}`, OpenClaw escribe el
texto hablado en stdin. `outputFormat` acepta `mp3`, `opus` o `wav`.
Los destinos de nota de voz se transcodifican a Ogg/Opus y la salida de telefonía se
transcodifica a PCM mono sin procesar de 16 kHz con `ffmpeg`. El alias heredado del proveedor
`cli` sigue funcionando, pero la configuración nueva debe usar `tts-local-cli`.

### Gradium principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Deshabilitar voz de Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Límites personalizados + ruta de preferencias

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Responder con audio solo después de un mensaje de voz entrante

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Deshabilitar el resumen automático para respuestas largas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Luego ejecuta:

```
/tts summary off
```

### Notas sobre los campos

- `auto`: modo de TTS automático (`off`, `always`, `inbound`, `tagged`).
  - `inbound` solo envía audio después de un mensaje de voz entrante.
  - `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:key=value]]` o un bloque `[[tts:text]]...[[/tts:text]]`.
- `enabled`: interruptor heredado (doctor migra esto a `auto`).
- `mode`: `"final"` (predeterminado) o `"all"` (incluye respuestas de herramientas/bloques).
- `provider`: id del proveedor de voz como `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` o `"xiaomi"` (la alternativa es automática).
- Si `provider` **no está establecido**, OpenClaw usa el primer proveedor de voz configurado según el orden de selección automática del registro.
- La configuración heredada `provider: "edge"` se repara con `openclaw doctor --fix` y
  se reescribe como `provider: "microsoft"`.
- `summaryModel`: modelo económico opcional para el resumen automático; usa de forma predeterminada `agents.defaults.model.primary`.
  - Acepta `provider/model` o un alias de modelo configurado.
- `modelOverrides`: permite que el modelo emita directivas TTS (activado de forma predeterminada).
  - `allowProvider` usa `false` de forma predeterminada (el cambio de proveedor es opcional).
- `providers.<id>`: configuración propiedad del proveedor, indexada por id del proveedor de voz.
- Los bloques heredados directos del proveedor (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) se reparan con `openclaw doctor --fix`; la configuración confirmada debe usar `messages.tts.providers.<id>`.
- El valor heredado `messages.tts.providers.edge` también se repara con `openclaw doctor --fix`; la configuración confirmada debe usar `messages.tts.providers.microsoft`.
- `maxTextLength`: límite estricto para la entrada de TTS (caracteres). `/tts audio` falla si se supera.
- `timeoutMs`: tiempo de espera de la solicitud (ms).
- `prefsPath`: sobrescribe la ruta local del JSON de preferencias (proveedor/límite/resumen).
- Los valores `apiKey` recurren a variables de entorno (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sobrescribe la URL base de la API de ElevenLabs.
- `providers.openai.baseUrl`: sobrescribe el endpoint TTS de OpenAI.
  - Orden de resolución: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Los valores no predeterminados se tratan como endpoints TTS compatibles con OpenAI, así que se aceptan nombres personalizados de modelo y voz.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (por ejemplo `en`, `de`)
- `providers.elevenlabs.seed`: entero `0..4294967295` (determinismo de mejor esfuerzo)
- `providers.minimax.baseUrl`: sobrescribe la URL base de la API de MiniMax (predeterminada `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo TTS (predeterminado `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (predeterminado `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidad de reproducción `0.5..2.0` (predeterminado 1.0).
- `providers.minimax.vol`: volumen `(0, 10]` (predeterminado 1.0; debe ser mayor que 0).
- `providers.minimax.pitch`: desplazamiento de tono entero `-12..12` (predeterminado 0). Los valores fraccionarios se truncan antes de llamar a MiniMax T2A porque la API rechaza valores de tono no enteros.
- `providers.tts-local-cli.command`: ejecutable local o cadena de comando para CLI TTS.
- `providers.tts-local-cli.args`: argumentos del comando; admite marcadores `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` y `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: formato de salida esperado de la CLI (`mp3`, `opus` o `wav`; predeterminado `mp3` para archivos adjuntos de audio).
- `providers.tts-local-cli.timeoutMs`: tiempo de espera del comando en milisegundos (predeterminado `120000`).
- `providers.tts-local-cli.cwd`: directorio de trabajo opcional del comando.
- `providers.tts-local-cli.env`: sobrescrituras opcionales de entorno de cadena para el comando.
- `providers.google.model`: modelo TTS de Gemini (predeterminado `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nombre de voz predefinida de Gemini (predeterminado `Kore`; también se acepta `voice`).
- `providers.google.audioProfile`: prompt de estilo en lenguaje natural antepuesto antes del texto hablado.
- `providers.google.speakerName`: etiqueta opcional del hablante antepuesta antes del texto hablado cuando tu prompt de TTS usa un hablante con nombre.
- `providers.google.baseUrl`: sobrescribe la URL base de la API de Gemini. Solo se acepta `https://generativelanguage.googleapis.com`.
  - Si se omite `messages.tts.providers.google.apiKey`, TTS puede reutilizar `models.providers.google.apiKey` antes de recurrir al entorno.
- `providers.gradium.baseUrl`: sobrescribe la URL base de la API de Gradium (predeterminada `https://api.gradium.ai`).
- `providers.gradium.voiceId`: identificador de voz de Gradium (predeterminado Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: clave de API TTS de xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: sobrescribe la URL base TTS de xAI (predeterminada `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id de voz de xAI (predeterminado `eve`; voces activas actuales: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: código de idioma BCP-47 o `auto` (predeterminado `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` o `alaw` (predeterminado `mp3`).
- `providers.xai.speed`: sobrescritura de velocidad nativa del proveedor.
- `providers.xiaomi.apiKey`: clave de API de Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: sobrescribe la URL base de la API de Xiaomi MiMo (predeterminada `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: modelo TTS (predeterminado `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; también se admite `mimo-v2-tts`).
- `providers.xiaomi.voice`: id de voz de MiMo (predeterminado `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` o `wav` (predeterminado `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: instrucción opcional de estilo en lenguaje natural enviada como mensaje del usuario; no se pronuncia.
- `providers.openrouter.apiKey`: clave de API de OpenRouter (env: `OPENROUTER_API_KEY`; puede reutilizar `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: sobrescribe la URL base TTS de OpenRouter (predeterminada `https://openrouter.ai/api/v1`; el valor heredado `https://openrouter.ai/v1` se normaliza).
- `providers.openrouter.model`: id del modelo TTS de OpenRouter (predeterminado `hexgrad/kokoro-82m`; también se acepta `modelId`).
- `providers.openrouter.voice`: id de voz específico del proveedor (predeterminado `af_alloy`; también se acepta `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` o `pcm` (predeterminado `mp3`).
- `providers.openrouter.speed`: sobrescritura de velocidad nativa del proveedor.
- `providers.microsoft.enabled`: permite el uso de voz de Microsoft (predeterminado `true`; sin clave de API).
- `providers.microsoft.voice`: nombre de voz neural de Microsoft (por ejemplo `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código de idioma (por ejemplo `en-US`).
- `providers.microsoft.outputFormat`: formato de salida de Microsoft (por ejemplo `audio-24khz-48kbitrate-mono-mp3`).
  - Consulta los formatos de salida de voz de Microsoft para ver valores válidos; no todos los formatos son compatibles con el transporte incluido basado en Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: cadenas de porcentaje (por ejemplo `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: escribe subtítulos JSON junto al archivo de audio.
- `providers.microsoft.proxy`: URL de proxy para solicitudes de voz de Microsoft.
- `providers.microsoft.timeoutMs`: sobrescritura del tiempo de espera de la solicitud (ms).
- `edge.*`: alias heredado para la misma configuración de Microsoft. Ejecuta
  `openclaw doctor --fix` para reescribir la configuración persistida a `providers.microsoft`.

## Sobrescrituras controladas por el modelo (activadas por defecto)

De forma predeterminada, el modelo **puede** emitir directivas TTS para una sola respuesta.
Cuando `messages.tts.auto` es `tagged`, estas directivas son obligatorias para activar el audio.

Cuando está habilitado, el modelo puede emitir directivas `[[tts:...]]` para sobrescribir la voz
de una sola respuesta, además de un bloque opcional `[[tts:text]]...[[/tts:text]]` para
proporcionar etiquetas expresivas (risas, indicaciones de canto, etc.) que solo deben aparecer en
el audio.

Las directivas `provider=...` se ignoran a menos que `modelOverrides.allowProvider: true`.

Ejemplo de carga útil de respuesta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Claves de directiva disponibles (cuando están habilitadas):

- `provider` (id del proveedor de voz registrado, por ejemplo `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` o `xiaomi`; requiere `allowProvider: true`)
- `voice` (voz de OpenAI, Gradium o Xiaomi), `voiceName` / `voice_name` / `google_voice` (voz de Google) o `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (modelo TTS de OpenAI, id de modelo de ElevenLabs, modelo de MiniMax o modelo TTS de Xiaomi MiMo) o `google_model` (modelo TTS de Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volumen de MiniMax, 0-10)
- `pitch` (tono entero de MiniMax, -12 a 12; los valores fraccionarios se truncan antes de la solicitud a MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Deshabilitar todas las sobrescrituras del modelo:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Lista permitida opcional (habilitar el cambio de proveedor manteniendo configurables otros controles):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferencias por usuario

Los comandos de barra escriben sobrescrituras locales en `prefsPath` (predeterminado:
`~/.openclaw/settings/tts.json`, sobrescríbelo con `OPENCLAW_TTS_PREFS` o
`messages.tts.prefsPath`).

Campos almacenados:

- `enabled`
- `provider`
- `maxLength` (umbral de resumen; predeterminado 1500 caracteres)
- `summarize` (predeterminado `true`)

Estos sobrescriben `messages.tts.*` para ese host.

## Formatos de salida (fijos)

- **Feishu / Matrix / Telegram / WhatsApp**: las respuestas de nota de voz prefieren Opus (`opus_48000_64` de ElevenLabs, `opus` de OpenAI).
  - 48 kHz / 64 kbps es un buen equilibrio para mensajes de voz.
- **Feishu**: cuando una respuesta de nota de voz se produce como MP3/WAV/M4A u otro
  archivo probablemente de audio, el Plugin de Feishu la transcodifica a 48 kHz Ogg/Opus con
  `ffmpeg` antes de enviar la burbuja nativa `audio`. Si la conversión falla, Feishu
  recibe el archivo original como adjunto.
- **Otros canales**: MP3 (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI).
  - 44.1 kHz / 128 kbps es el equilibrio predeterminado para la claridad de voz.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32 kHz) para archivos adjuntos de audio normales. Para destinos de nota de voz como Feishu y Telegram, OpenClaw transcodifica el MP3 de MiniMax a Opus de 48 kHz con `ffmpeg` antes de la entrega.
- **Xiaomi MiMo**: MP3 de forma predeterminada, o WAV cuando está configurado. Para destinos de nota de voz como Feishu y Telegram, OpenClaw transcodifica la salida de Xiaomi a Opus de 48 kHz con `ffmpeg` antes de la entrega.
- **Local CLI**: usa el `outputFormat` configurado. Los destinos de nota de voz se
  convierten a Ogg/Opus y la salida de telefonía se convierte a PCM mono sin procesar de 16 kHz
  con `ffmpeg`.
- **Google Gemini**: Gemini API TTS devuelve PCM sin procesar de 24 kHz. OpenClaw lo encapsula como WAV para archivos adjuntos de audio y devuelve PCM directamente para Talk/telefonía. El formato nativo de nota de voz Opus no es compatible con esta ruta.
- **Gradium**: WAV para archivos adjuntos de audio, Opus para destinos de nota de voz y `ulaw_8000` a 8 kHz para telefonía.
- **xAI**: MP3 de forma predeterminada; `responseFormat` puede ser `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa el endpoint REST TTS por lotes de xAI y devuelve un archivo adjunto de audio completo; el WebSocket TTS en streaming de xAI no se usa en esta ruta del proveedor. El formato nativo de nota de voz Opus no es compatible con esta ruta.
- **Microsoft**: usa `microsoft.outputFormat` (predeterminado `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un `outputFormat`, pero no todos los formatos están disponibles en el servicio.
  - Los valores de formato de salida siguen los formatos de salida de Microsoft Speech (incluidos Ogg/WebM Opus).
  - Telegram `sendVoice` acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas
    mensajes de voz Opus garantizados.
  - Si el formato de salida configurado de Microsoft falla, OpenClaw vuelve a intentar con MP3.

Los formatos de salida de OpenAI/ElevenLabs son fijos por canal (consulta arriba).

## Comportamiento de TTS automático

Cuando está habilitado, OpenClaw:

- omite TTS si la respuesta ya contiene medios o una directiva `MEDIA:`.
- omite respuestas muy cortas (< 10 caracteres).
- resume las respuestas largas cuando está habilitado usando `agents.defaults.model.primary` (o `summaryModel`).
- adjunta el audio generado a la respuesta.

Si la respuesta supera `maxLength` y el resumen está desactivado (o no hay clave de API para el
modelo de resumen), se
omite el audio y se envía la respuesta de texto normal.

## Diagrama de flujo

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Uso de comandos de barra

Hay un único comando: `/tts`.
Consulta [Comandos de barra](/es/tools/slash-commands) para detalles de habilitación.

Nota de Discord: `/tts` es un comando integrado de Discord, por lo que OpenClaw registra
`/voice` como el comando nativo allí. El texto `/tts ...` sigue funcionando.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Notas:

- Los comandos requieren un remitente autorizado (siguen aplicándose las reglas de allowlist/propietario).
- Deben estar habilitados `commands.text` o el registro de comandos nativos.
- La configuración `messages.tts.auto` acepta `off|always|inbound|tagged`.
- `/tts on` escribe la preferencia local de TTS en `always`; `/tts off` la escribe en `off`.
- Usa la configuración cuando quieras valores predeterminados `inbound` o `tagged`.
- `limit` y `summary` se almacenan en preferencias locales, no en la configuración principal.
- `/tts audio` genera una respuesta de audio puntual (no activa TTS).
- `/tts status` incluye visibilidad de respaldo para el intento más reciente:
  - respaldo correcto: `Fallback: <primary> -> <used>` más `Attempts: ...`
  - error: `Error: ...` más `Attempts: ...`
  - diagnósticos detallados: `Attempt details: provider:outcome(reasonCode) latency`
- Los fallos de API de OpenAI y ElevenLabs ahora incluyen detalles analizados del error del proveedor e id de solicitud (cuando el proveedor lo devuelve), lo cual aparece en errores/registros de TTS.

## Herramienta del agente

La herramienta `tts` convierte texto en voz y devuelve un archivo adjunto de audio para
la entrega de la respuesta. Cuando el canal es Feishu, Matrix, Telegram o WhatsApp,
el audio se entrega como mensaje de voz en lugar de como archivo adjunto.
Feishu puede transcodificar salida TTS que no sea Opus en esta ruta cuando `ffmpeg` está
disponible.
Acepta campos opcionales `channel` y `timeoutMs`; `timeoutMs` es un
tiempo de espera de solicitud del proveedor por llamada en milisegundos.

## RPC de Gateway

Métodos de Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Relacionado

- [Resumen de medios](/es/tools/media-overview)
- [Generación de música](/es/tools/music-generation)
- [Generación de video](/es/tools/video-generation)
