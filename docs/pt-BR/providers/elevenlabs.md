---
read_when:
    - Você quer text-to-speech da ElevenLabs no OpenClaw
    - Você quer speech-to-text ElevenLabs Scribe para anexos de áudio
    - Você quer transcrição em tempo real da ElevenLabs para Voice Call
summary: Use fala da ElevenLabs, Scribe STT e transcrição em tempo real com o OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T05:43:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

O OpenClaw usa ElevenLabs para text-to-speech, speech-to-text em lote com Scribe
v2 e STT em streaming do Voice Call com Scribe v2 Realtime.

| Capacidade | Superfície do OpenClaw | Padrão |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-speech | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| Speech-to-text em lote | `tools.media.audio` | `scribe_v2` |
| Speech-to-text em streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## Autenticação

Defina `ELEVENLABS_API_KEY` no ambiente. `XI_API_KEY` também é aceito para
compatibilidade com ferramentas existentes da ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

Use Scribe v2 para anexos de áudio recebidos e segmentos curtos de voz gravada:

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

O OpenClaw envia áudio multipart para `/v1/speech-to-text` da ElevenLabs com
`model_id: "scribe_v2"`. Dicas de idioma são mapeadas para `language_code` quando presentes.

## STT em streaming do Voice Call

O plugin empacotado `elevenlabs` registra Scribe v2 Realtime para transcrição
em streaming do Voice Call.

| Configuração | Caminho de configuração | Padrão |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa fallback para `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modelo | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| Formato de áudio | `...elevenlabs.audioFormat` | `ulaw_8000` |
| Taxa de amostragem | `...elevenlabs.sampleRate` | `8000` |
| Estratégia de commit | `...elevenlabs.commitStrategy` | `vad` |
| Idioma | `...elevenlabs.languageCode` | (não definido) |

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
O Voice Call recebe mídia do Twilio como G.711 u-law a 8 kHz. O provedor em tempo real
da ElevenLabs usa `ulaw_8000` por padrão, então frames de telefonia podem ser encaminhados sem
transcodificação.
</Note>
