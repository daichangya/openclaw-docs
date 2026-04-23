---
read_when:
    - Anda perlu menangkap lalu lintas transport OpenClaw secara lokal untuk debugging
    - Anda ingin memeriksa sesi proxy debug, blob, atau preset kueri bawaan
summary: Referensi CLI untuk `openclaw proxy`, proxy debug lokal dan inspector penangkapan
title: proxy
x-i18n:
    generated_at: "2026-04-23T09:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Jalankan proxy debug eksplisit lokal dan periksa lalu lintas yang ditangkap.

Ini adalah perintah debugging untuk investigasi tingkat transport. Perintah ini dapat memulai proxy lokal, menjalankan perintah anak dengan penangkapan diaktifkan, menampilkan daftar sesi penangkapan, mengueri pola lalu lintas umum, membaca blob yang ditangkap, dan membersihkan data penangkapan lokal.

## Perintah

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Preset kueri

`openclaw proxy query --preset <name>` menerima:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Catatan

- `start` default-nya `127.0.0.1` kecuali `--host` diatur.
- `run` memulai proxy debug lokal lalu menjalankan perintah setelah `--`.
- Hasil tangkapan adalah data debugging lokal; gunakan `openclaw proxy purge` setelah selesai.
