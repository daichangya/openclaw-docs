---
read_when:
    - Metinden konuşmaya için Gradium istiyorsunuz
    - Gradium API anahtarına veya ses yapılandırmasına ihtiyacınız var
summary: OpenClaw'da Gradium metinden konuşmaya özelliğini kullanın
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:56:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium, OpenClaw için paketlenmiş bir metinden konuşmaya sağlayıcısıdır. Normal sesli yanıtlar, sesli notla uyumlu Opus çıktısı ve telefon yüzeyleri için 8 kHz u-law ses üretebilir.

## Kurulum

Bir Gradium API anahtarı oluşturun, ardından bunu OpenClaw'a sunun:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Anahtarı ayrıca `messages.tts.providers.gradium.apiKey` altında yapılandırmada da saklayabilirsiniz.

## Yapılandırma

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

## Sesler

| Ad        | Ses ID'si          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Varsayılan ses: Emma.

## Çıktı

- Ses dosyası yanıtları WAV kullanır.
- Sesli not yanıtları Opus kullanır ve ses uyumlu olarak işaretlenir.
- Telefoni sentezi 8 kHz'de `ulaw_8000` kullanır.

## İlgili

- [Text-to-Speech](/tr/tools/tts)
- [Media Overview](/tr/tools/media-overview)
