---
read_when:
    - Anda ingin memicu run agent dari skrip atau command line
    - Anda perlu mengirim balasan agent ke channel chat secara terprogram
summary: Jalankan giliran agent dari CLI dan kirim balasan ke channel secara opsional
title: Pengiriman Agent
x-i18n:
    generated_at: "2026-04-21T09:24:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Pengiriman Agent

`openclaw agent` menjalankan satu giliran agent dari command line tanpa memerlukan
pesan chat masuk. Gunakan untuk alur kerja berskrip, pengujian, dan
pengiriman terprogram.

## Mulai cepat

<Steps>
  <Step title="Jalankan giliran agent sederhana">
    ```bash
    openclaw agent --message "Bagaimana cuaca hari ini?"
    ```

    Ini mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Targetkan agent atau sesi tertentu">
    ```bash
    # Targetkan agent tertentu
    openclaw agent --agent ops --message "Ringkas log"

    # Targetkan nomor telepon (menurunkan session key)
    openclaw agent --to +15555550123 --message "Pembaruan status"

    # Gunakan kembali sesi yang ada
    openclaw agent --session-id abc123 --message "Lanjutkan tugas"
    ```

  </Step>

  <Step title="Kirim balasan ke channel">
    ```bash
    # Kirim ke WhatsApp (channel default)
    openclaw agent --to +15555550123 --message "Laporan siap" --deliver

    # Kirim ke Slack
    openclaw agent --agent ops --message "Buat laporan" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Deskripsi                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Pesan yang akan dikirim (wajib)                             |
| `--to \<dest\>`               | Turunkan session key dari target (telepon, chat id)         |
| `--agent \<id\>`              | Targetkan agent yang dikonfigurasi (menggunakan sesi `main`) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang ada berdasarkan id                |
| `--local`                     | Paksa runtime embedded lokal (lewati Gateway)               |
| `--deliver`                   | Kirim balasan ke channel chat                               |
| `--channel \<name\>`          | Channel pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Override target pengiriman                                  |
| `--reply-channel \<name\>`    | Override channel pengiriman                                 |
| `--reply-account \<id\>`      | Override account id pengiriman                              |
| `--thinking \<level\>`        | Setel level thinking untuk profil model yang dipilih        |
| `--verbose \<on\|full\|off\>` | Setel level verbose                                         |
| `--timeout \<seconds\>`       | Override timeout agent                                      |
| `--json`                      | Output JSON terstruktur                                     |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime embedded pada mesin saat ini.
- Jika Gateway tidak dapat dijangkau, CLI **fallback** ke run embedded lokal.
- Pemilihan sesi: `--to` menurunkan session key (target grup/channel
  mempertahankan isolasi; chat langsung digabung ke `main`).
- Flag thinking dan verbose dipertahankan ke session store.
- Output: teks biasa secara default, atau `--json` untuk payload + metadata terstruktur.

## Contoh

```bash
# Giliran sederhana dengan output JSON
openclaw agent --to +15555550123 --message "Lacak log" --verbose on --json

# Giliran dengan level thinking
openclaw agent --session-id 1234 --message "Ringkas kotak masuk" --thinking medium

# Kirim ke channel yang berbeda dari sesi
openclaw agent --agent ops --message "Peringatan" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

- [Referensi CLI Agent](/cli/agent)
- [Sub-agents](/id/tools/subagents) — pemunculan sub-agent latar belakang
- [Sessions](/id/concepts/session) — cara kerja session key
