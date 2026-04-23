---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirim balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: agen
x-i18n:
    generated_at: "2026-04-23T09:18:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway (gunakan `--local` untuk embedded).
Gunakan `--agent <id>` untuk langsung menargetkan agen yang sudah dikonfigurasi.

Berikan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Tool kirim agen: [Agent send](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan wajib
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan kunci sesi
- `--session-id <id>`: ID sesi eksplisit
- `--agent <id>`: ID agen; mengoverride binding perutean
- `--thinking <level>`: tingkat thinking agen (`off`, `minimal`, `low`, `medium`, `high`, plus tingkat kustom yang didukung provider seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: persist level verbose untuk sesi
- `--channel <channel>`: channel pengiriman; hilangkan untuk menggunakan channel sesi utama
- `--reply-to <target>`: override target pengiriman
- `--reply-channel <channel>`: override channel pengiriman
- `--reply-account <id>`: override akun pengiriman
- `--local`: jalankan agen embedded secara langsung (setelah preload registri plugin)
- `--deliver`: kirim balasan kembali ke channel/target yang dipilih
- `--timeout <seconds>`: override batas waktu agen (default 600 atau nilai config)
- `--json`: keluarkan JSON

## Contoh

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Catatan

- Mode Gateway melakukan fallback ke agen embedded saat permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi embedded sejak awal.
- `--local` tetap melakukan preload registri plugin terlebih dahulu, sehingga provider, tool, dan channel yang disediakan plugin tetap tersedia selama proses embedded berjalan.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean sesi.
- Saat perintah ini memicu regenerasi `models.json`, kredensial provider yang dikelola SecretRef dipersistensikan sebagai penanda non-rahasia (misalnya nama env var, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan plaintext rahasia yang sudah di-resolve.
- Penulisan penanda bersifat source-authoritative: OpenClaw memersistensikan penanda dari snapshot config sumber yang aktif, bukan dari nilai rahasia runtime yang sudah di-resolve.
