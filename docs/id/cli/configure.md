---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agent secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: konfigurasi
x-i18n:
    generated_at: "2026-04-23T09:18:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agent.

Catatan: Bagian **Model** sekarang mencakup multi-select untuk allowlist
`agents.defaults.models` (apa yang muncul di `/model` dan pemilih model).
Pilihan penyiapan dengan cakupan provider menggabungkan model yang dipilih ke dalam
allowlist yang ada, alih-alih mengganti provider lain yang tidak terkait yang sudah ada di konfigurasi.

Saat konfigurasi dimulai dari pilihan auth provider, pemilih model default dan
allowlist akan otomatis memprioritaskan provider tersebut. Untuk provider berpasangan seperti
Volcengine/BytePlus, preferensi yang sama juga cocok dengan varian
coding-plan mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter
provider yang diprioritaskan akan menghasilkan daftar kosong, configure akan fallback ke katalog
tanpa filter alih-alih menampilkan pemilih kosong.

Tip: `openclaw config` tanpa subperintah akan membuka wizard yang sama. Gunakan
`openclaw config get|set|unset` untuk edit non-interaktif.

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih provider
dan mengonfigurasi kredensialnya. Beberapa provider juga menampilkan prompt
lanjutan khusus provider:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) dan model pencarian web Kimi default.

Terkait:

- Referensi konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)
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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Continue" tanpa section lain jika hanya itu yang Anda perlukan.
- Layanan berorientasi channel (Slack/Discord/Matrix/Microsoft Teams) meminta allowlist channel/room selama penyiapan. Anda dapat memasukkan nama atau ID; wizard akan me-resolve nama ke ID jika memungkinkan.
- Jika Anda menjalankan langkah instalasi daemon, auth token memerlukan token, dan `gateway.auth.token` dikelola oleh SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata environment service supervisor.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, configure memblokir instalasi daemon dengan panduan remediasi yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, configure memblokir instalasi daemon sampai mode disetel secara eksplisit.

## Contoh

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
