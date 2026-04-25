---
read_when:
    - Anda menginginkan Gradium untuk text-to-speech
    - Anda memerlukan kunci API Gradium atau konfigurasi suara
summary: Gunakan text-to-speech Gradium di OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium adalah penyedia text-to-speech bawaan untuk OpenClaw. Gradium dapat menghasilkan balasan audio normal, output Opus yang kompatibel dengan pesan suara, dan audio u-law 8 kHz untuk permukaan teleponi.

## Pengaturan

Buat kunci API Gradium, lalu ekspos ke OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Anda juga dapat menyimpan kunci tersebut di config pada `messages.tts.providers.gradium.apiKey`.

## Konfigurasi

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

## Suara

| Nama      | ID Suara           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Suara default: Emma.

## Output

- Balasan file audio menggunakan WAV.
- Balasan pesan suara menggunakan Opus dan ditandai kompatibel dengan suara.
- Sintesis teleponi menggunakan `ulaw_8000` pada 8 kHz.

## Terkait

- [Text-to-Speech](/id/tools/tts)
- [Ikhtisar Media](/id/tools/media-overview)
