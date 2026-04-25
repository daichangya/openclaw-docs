---
read_when:
    - Quieres usar texto a voz de ElevenLabs en OpenClaw
    - Quieres usar el reconocimiento de voz a texto Scribe de ElevenLabs para archivos adjuntos de audio
    - Quieres usar la transcripción en tiempo real de ElevenLabs para Voice Call
summary: Usa la voz de ElevenLabs, Scribe STT y la transcripción en tiempo real con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:54:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw usa ElevenLabs para texto a voz, voz a texto por lotes con Scribe
v2 y STT en streaming para Voice Call con Scribe v2 Realtime.

| Capacidad               | Superficie de OpenClaw                         | Predeterminado           |
| ----------------------- | --------------------------------------------- | ------------------------ |
| Texto a voz             | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Voz a texto por lotes   | `tools.media.audio`                           | `scribe_v2`              |
| Voz a texto en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Autenticación

Establece `ELEVENLABS_API_KEY` en el entorno. `XI_API_KEY` también se acepta por
compatibilidad con las herramientas existentes de ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Texto a voz

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Establece `modelId` en `eleven_v3` para usar TTS v3 de ElevenLabs. OpenClaw mantiene
`eleven_multilingual_v2` como valor predeterminado para las instalaciones existentes.

## Voz a texto

Usa Scribe v2 para archivos adjuntos de audio entrantes y segmentos cortos de voz grabada:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw envía audio multiparte a ElevenLabs `/v1/speech-to-text` con
`model_id: "scribe_v2"`. Las sugerencias de idioma se asignan a `language_code` cuando están presentes.

## STT en streaming para Voice Call

El Plugin `elevenlabs` incluido registra Scribe v2 Realtime para la
transcripción en streaming de Voice Call.

| Ajuste            | Ruta de configuración                                                    | Predeterminado                                     |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| Clave API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa `ELEVENLABS_API_KEY` / `XI_API_KEY` como respaldo |
| Modelo            | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                               |
| Formato de audio  | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                        |
| Frecuencia de muestreo | `...elevenlabs.sampleRate`                                          | `8000`                                             |
| Estrategia de confirmación | `...elevenlabs.commitStrategy`                                   | `vad`                                              |
| Idioma            | `...elevenlabs.languageCode`                                             | (sin establecer)                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call recibe medios de Twilio como G.711 u-law de 8 kHz. El proveedor en tiempo real de ElevenLabs
usa `ulaw_8000` de forma predeterminada, por lo que los fotogramas de telefonía pueden reenviarse sin
transcodificación.
</Note>

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Selección de modelo](/es/concepts/model-providers)
