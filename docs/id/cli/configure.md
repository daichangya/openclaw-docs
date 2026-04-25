---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-25T13:43:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

Catatan: Bagian **Model** kini menyertakan multi-select untuk allowlist
`agents.defaults.models` (apa yang muncul di `/model` dan pemilih model).
Pilihan penyiapan yang dicakup provider menggabungkan model yang dipilih ke dalam
allowlist yang sudah ada alih-alih menggantikan provider lain yang tidak terkait
yang sudah ada di config.
Menjalankan ulang auth provider dari configure akan mempertahankan
`agents.defaults.model.primary` yang sudah ada; gunakan `openclaw models auth login --provider <id> --set-default`
atau `openclaw models set <model>` saat Anda memang ingin mengubah model default.

Saat configure dimulai dari pilihan auth provider, pemilih model default dan
allowlist akan otomatis memprioritaskan provider tersebut. Untuk provider berpasangan
seperti Volcengine/BytePlus, preferensi yang sama juga cocok dengan varian
coding-plan mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter
preferred-provider menghasilkan daftar kosong, configure akan fallback ke
katalog tanpa filter alih-alih menampilkan pemilih kosong.

Tip: `openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan
`openclaw config get|set|unset` untuk pengeditan non-interaktif.

Untuk web search, `openclaw configure --section web` memungkinkan Anda memilih provider
dan mengonfigurasi kredensialnya. Beberapa provider juga menampilkan prompt lanjutan
khusus provider:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) dan model web-search Kimi default.

Terkait:

- Referensi konfigurasi Gateway: [Configuration](/id/gateway/configuration)
- CLI config: [Config](/id/cli/config)

## Opsi

- `--section <section>`: filter section yang dapat diulang

Section yang tersedia:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Catatan:

- Memilih lokasi Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Continue" tanpa section lain jika hanya itu yang Anda perlukan.
- Layanan berorientasi channel (Slack/Discord/Matrix/Microsoft Teams) meminta allowlist channel/room saat penyiapan. Anda dapat memasukkan nama atau ID; wizard akan me-resolve nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instalasi daemon, auth token memerlukan token, dan `gateway.auth.token` dikelola oleh SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata environment layanan supervisor.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, configure memblokir instalasi daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, configure memblokir instalasi daemon hingga mode ditetapkan secara eksplisit.

## Contoh

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Terkait

- [CLI reference](/id/cli)
- [Configuration](/id/gateway/configuration)
