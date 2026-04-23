---
read_when:
    - Anda ingin UI terminal untuk Gateway (ramah remote)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tersemat lokal tanpa Gateway
    - Anda ingin menggunakan `openclaw chat` atau `openclaw tui --local`
summary: Referensi CLI untuk `openclaw tui` (UI terminal tersemat lokal atau berbasis Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-23T09:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway, atau jalankan dalam
mode tersemat lokal.

Terkait:

- Panduan TUI: [TUI](/id/web/tui)

Catatan:

- `chat` dan `terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- `tui` me-resolve SecretRef auth gateway yang dikonfigurasi untuk auth token/password saat memungkinkan (provider `env`/`file`/`exec`).
- Saat diluncurkan dari dalam direktori workspace agen yang dikonfigurasi, TUI otomatis memilih agen tersebut untuk default kunci sesi (kecuali `--session` secara eksplisit adalah `agent:<id>:...`).
- Mode lokal menggunakan runtime agen tersemat secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` di dalam surface perintah TUI.
- Gerbang persetujuan Plugin tetap berlaku dalam mode lokal. Alat yang memerlukan persetujuan akan meminta keputusan di terminal; tidak ada yang disetujui otomatis secara diam-diam karena Gateway tidak terlibat.

## Contoh

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Loop perbaikan config

Gunakan mode lokal saat config saat ini sudah tervalidasi dan Anda ingin
agen tersemat memeriksanya, membandingkannya dengan dokumentasi, dan membantu memperbaikinya
dari terminal yang sama:

Jika `openclaw config validate` sudah gagal, gunakan `openclaw configure` atau
`openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati guard
config tidak valid.

```bash
openclaw chat
```

Lalu di dalam TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Terapkan perbaikan terarah dengan `openclaw config set` atau `openclaw configure`, lalu
jalankan ulang `openclaw config validate`. Lihat [TUI](/id/web/tui) dan [Config](/id/cli/config).
