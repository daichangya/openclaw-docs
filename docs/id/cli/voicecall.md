---
read_when:
    - Anda menggunakan Plugin voice-call dan menginginkan entrypoint CLI
    - Anda menginginkan contoh cepat untuk `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referensi CLI untuk `openclaw voicecall` (surface perintah Plugin panggilan suara)
title: Voicecall
x-i18n:
    generated_at: "2026-04-25T13:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` adalah perintah yang disediakan Plugin. Perintah ini hanya muncul jika Plugin voice-call terinstal dan diaktifkan.

Dokumentasi utama:

- Plugin voice-call: [Voice Call](/id/plugins/voice-call)

## Perintah umum

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` secara default mencetak pemeriksaan kesiapan yang mudah dibaca manusia. Gunakan `--json` untuk
skrip:

```bash
openclaw voicecall setup --json
```

Untuk provider eksternal (`twilio`, `telnyx`, `plivo`), setup harus me-resolve URL
webhook publik dari `publicUrl`, tunnel, atau eksposur Tailscale. Fallback serve
loopback/pribadi ditolak karena carrier tidak dapat menjangkaunya.

`smoke` menjalankan pemeriksaan kesiapan yang sama. Perintah ini tidak akan menempatkan panggilan telepon nyata
kecuali `--to` dan `--yes` keduanya ada:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # panggilan notify live
```

## Mengekspos webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Catatan keamanan: hanya ekspos endpoint webhook ke jaringan yang Anda percayai. Utamakan Tailscale Serve daripada Funnel jika memungkinkan.

## Terkait

- [CLI reference](/id/cli)
- [Plugin voice-call](/id/plugins/voice-call)
