---
read_when:
    - Memperbarui perilaku atau default retry provider
    - Men-debug error pengiriman provider atau rate limit
summary: Kebijakan retry untuk panggilan provider keluar
title: Kebijakan Retry
x-i18n:
    generated_at: "2026-04-23T09:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Kebijakan Retry

## Tujuan

- Retry per permintaan HTTP, bukan per alur multi-langkah.
- Mempertahankan urutan dengan me-retry hanya langkah saat ini.
- Menghindari duplikasi operasi non-idempoten.

## Default

- Percobaan: 3
- Batas maksimum delay: 30000 ms
- Jitter: 0.1 (10 persen)
- Default provider:
  - Delay minimum Telegram: 400 ms
  - Delay minimum Discord: 500 ms

## Perilaku

### Provider model

- OpenClaw membiarkan SDK provider menangani retry singkat normal.
- Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, respons yang dapat di-retry
  (`408`, `409`, `429`, dan `5xx`) dapat menyertakan `retry-after-ms` atau
  `retry-after`. Saat waktu tunggu itu lebih lama dari 60 detik, OpenClaw menyuntikkan
  `x-should-retry: false` sehingga SDK langsung menampilkan error dan failover model
  dapat beralih ke profil auth lain atau model fallback.
- Timpa batasnya dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Setel ke `0`, `false`, `off`, `none`, atau `disabled` untuk membiarkan SDK menghormati jeda `Retry-After`
  yang panjang secara internal.

### Discord

- Retry hanya pada error rate limit (HTTP 429).
- Menggunakan Discord `retry_after` jika tersedia, jika tidak menggunakan exponential backoff.

### Telegram

- Retry pada error sementara (429, timeout, connect/reset/closed, sementara tidak tersedia).
- Menggunakan `retry_after` jika tersedia, jika tidak menggunakan exponential backoff.
- Error parse Markdown tidak di-retry; error tersebut fallback ke teks biasa.

## Konfigurasi

Setel kebijakan retry per provider di `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Catatan

- Retry berlaku per permintaan (pengiriman pesan, upload media, reaksi, poll, sticker).
- Alur komposit tidak me-retry langkah yang sudah selesai.
