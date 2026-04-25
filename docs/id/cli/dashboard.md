---
read_when:
    - Anda ingin membuka UI Kontrol dengan token Anda saat ini
    - Anda ingin mencetak URL tanpa meluncurkan browser
summary: Referensi CLI untuk `openclaw dashboard` (buka UI Kontrol)
title: Dasbor
x-i18n:
    generated_at: "2026-04-25T13:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Buka UI Kontrol menggunakan autentikasi Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Catatan:

- `dashboard` me-resolve SecretRef `gateway.auth.token` yang dikonfigurasi bila memungkinkan.
- `dashboard` mengikuti `gateway.tls.enabled`: gateway dengan TLS aktif mencetak/membuka URL UI Kontrol `https://` dan terhubung melalui `wss://`.
- Untuk token yang dikelola SecretRef (yang berhasil maupun tidak berhasil di-resolve), `dashboard` mencetak/menyalin/membuka URL tanpa token untuk menghindari pemaparan rahasia eksternal dalam output terminal, riwayat clipboard, atau argumen peluncuran browser.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak berhasil di-resolve pada jalur perintah ini, perintah mencetak URL tanpa token dan panduan perbaikan yang eksplisit, alih-alih menyematkan placeholder token yang tidak valid.

## Terkait

- [Referensi CLI](/id/cli)
- [Dashboard](/id/web/dashboard)
