---
read_when:
    - Vuoi usare Gradium per la sintesi vocale in OpenClaw
    - Ti servono la chiave API di Gradium o la configurazione della voce
summary: Usa la sintesi vocale di Gradium in OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:55:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium è un provider di sintesi vocale incluso per OpenClaw. Può generare normali risposte audio, output Opus compatibile con i messaggi vocali e audio u-law a 8 kHz per le superfici di telefonia.

## Configurazione

Crea una chiave API Gradium, quindi esponila a OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Puoi anche salvare la chiave nella configurazione in `messages.tts.providers.gradium.apiKey`.

## Configurazione

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

## Voci

| Nome      | ID voce            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voce predefinita: Emma.

## Output

- Le risposte come file audio usano WAV.
- Le risposte come messaggi vocali usano Opus e sono contrassegnate come compatibili con i messaggi vocali.
- La sintesi per la telefonia usa `ulaw_8000` a 8 kHz.

## Correlati

- [Sintesi vocale](/it/tools/tts)
- [Panoramica dei media](/it/tools/media-overview)
