---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirim balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-04-25T13:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway (gunakan `--local` untuk mode tertanam).
Gunakan `--agent <id>` untuk menargetkan agen yang dikonfigurasi secara langsung.

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
- `--agent <id>`: ID agen; menimpa binding perutean
- `--thinking <level>`: level pemikiran agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah level kustom yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: simpan level verbose untuk sesi
- `--channel <channel>`: channel pengiriman; hilangkan untuk menggunakan channel sesi utama
- `--reply-to <target>`: override target pengiriman
- `--reply-channel <channel>`: override channel pengiriman
- `--reply-account <id>`: override akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah preload registri plugin)
- `--deliver`: kirim balasan kembali ke channel/target yang dipilih
- `--timeout <seconds>`: override timeout agen (default 600 atau nilai konfigurasi)
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

- Mode Gateway akan fallback ke agen tertanam ketika permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tertanam sejak awal.
- `--local` tetap mem-preload registri plugin terlebih dahulu, sehingga penyedia, tool, dan channel yang disediakan plugin tetap tersedia selama eksekusi tertanam.
- Setiap pemanggilan `openclaw agent` diperlakukan sebagai eksekusi sekali jalan. Server MCP bawaan atau yang dikonfigurasi pengguna yang dibuka untuk eksekusi tersebut akan dihentikan setelah balasan, bahkan ketika perintah menggunakan jalur Gateway, sehingga proses anak stdio MCP tidak tetap hidup di antara pemanggilan skrip.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean sesi.
- `--json` menjaga stdout tetap dicadangkan untuk respons JSON. Diagnostik Gateway, plugin, dan fallback tertanam diarahkan ke stderr agar skrip dapat langsung mengurai stdout.
- Saat perintah ini memicu regenerasi `models.json`, kredensial penyedia yang dikelola SecretRef disimpan sebagai penanda non-rahasia (misalnya nama variabel env, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan sebagai plaintext rahasia yang sudah di-resolve.
- Penulisan penanda bersifat otoritatif terhadap sumber: OpenClaw menyimpan penanda dari snapshot konfigurasi sumber yang aktif, bukan dari nilai rahasia runtime yang sudah di-resolve.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
