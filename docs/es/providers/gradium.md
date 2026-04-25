---
read_when:
    - Quieres usar Gradium para conversión de texto a voz
    - Necesitas una API key de Gradium o configuración de voz
summary: Usa la conversión de texto a voz de Gradium en OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium es un proveedor de conversión de texto a voz incluido en OpenClaw. Puede generar respuestas de audio normales, salida Opus compatible con notas de voz y audio u-law de 8 kHz para superficies de telefonía.

## Configuración

Crea una API key de Gradium y luego expónla a OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

También puedes guardar la clave en la configuración en `messages.tts.providers.gradium.apiKey`.

## Configuración

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Voces

| Nombre    | ID de voz          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voz predeterminada: Emma.

## Salida

- Las respuestas como archivo de audio usan WAV.
- Las respuestas como nota de voz usan Opus y se marcan como compatibles con notas de voz.
- La síntesis para telefonía usa `ulaw_8000` a 8 kHz.

## Relacionado

- [Conversión de texto a voz](/es/tools/tts)
- [Resumen de medios](/es/tools/media-overview)
