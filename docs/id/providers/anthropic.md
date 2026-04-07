---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T09:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic mengembangkan keluarga model **Claude** dan menyediakan akses melalui API dan Claude CLI. Di OpenClaw, kunci API Anthropic dan penggunaan ulang Claude CLI sama-sama didukung. Profil token Anthropic lama yang sudah ada tetap dihormati saat runtime jika sudah dikonfigurasi.

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.

Untuk host gateway yang berjalan lama, kunci API Anthropic tetap menjadi jalur produksi yang paling jelas dan paling dapat diprediksi. Jika Anda sudah menggunakan Claude CLI di host tersebut, OpenClaw dapat langsung menggunakan ulang login itu.

Dokumentasi publik Anthropic saat ini:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Ikhtisar Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Menggunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Menggunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan kunci API Anthropic.
OpenClaw juga mendukung opsi bergaya langganan lainnya, termasuk [OpenAI
Codex](/id/providers/openai), [Qwen Cloud Coding Plan](/id/providers/qwen),
[MiniMax Coding Plan](/id/providers/minimax), dan [Z.AI / GLM Coding
Plan](/id/providers/glm).
</Warning>

## Opsi A: kunci API Anthropic

**Terbaik untuk:** akses API standar dan penagihan berbasis penggunaan.
Buat kunci API Anda di Anthropic Console.

### Penyiapan CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Cuplikan konfigurasi Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Default thinking (Claude 4.6)

- Model Anthropic Claude 4.6 secara default menggunakan thinking `adaptive` di OpenClaw saat tidak ada level thinking eksplisit yang ditetapkan.
- Anda dapat menggantinya per pesan (`/think:<level>`) atau di parameter model:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Dokumentasi Anthropic terkait:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Mode cepat (Anthropic API)

Toggle `/fast` bersama milik OpenClaw juga mendukung trafik Anthropic publik langsung, termasuk permintaan yang diautentikasi dengan kunci API dan OAuth yang dikirim ke `api.anthropic.com`.

- `/fast on` dipetakan ke `service_tier: "auto"`
- `/fast off` dipetakan ke `service_tier: "standard_only"`
- Default konfigurasi:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Batasan penting:

- OpenClaw hanya menyisipkan service tier Anthropic untuk permintaan langsung ke `api.anthropic.com`. Jika Anda merutekan `anthropic/*` melalui proxy atau gateway, `/fast` tidak menyentuh `service_tier`.
- Parameter model Anthropic `serviceTier` atau `service_tier` yang eksplisit akan menimpa default `/fast` saat keduanya ditetapkan.
- Anthropic melaporkan tier efektif pada respons di bawah `usage.service_tier`. Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` mungkin tetap terselesaikan menjadi `standard`.

## Prompt caching (Anthropic API)

OpenClaw mendukung fitur prompt caching milik Anthropic. Ini **khusus API**; autentikasi token Anthropic lama tidak menghormati pengaturan cache.

### Konfigurasi

Gunakan parameter `cacheRetention` dalam konfigurasi model Anda:

| Value   | Durasi Cache | Deskripsi                    |
| ------- | ------------ | ---------------------------- |
| `none`  | Tanpa cache  | Nonaktifkan prompt caching   |
| `short` | 5 menit      | Default untuk autentikasi API Key |
| `long`  | 1 jam        | Cache diperpanjang           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Default

Saat menggunakan autentikasi Anthropic API Key, OpenClaw secara otomatis menerapkan `cacheRetention: "short"` (cache 5 menit) untuk semua model Anthropic. Anda dapat menggantinya dengan secara eksplisit menetapkan `cacheRetention` dalam konfigurasi Anda.

### Override `cacheRetention` per agen

Gunakan parameter tingkat model sebagai baseline Anda, lalu override agen tertentu melalui `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline untuk sebagian besar agen
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override hanya untuk agen ini
    ],
  },
}
```

Urutan penggabungan konfigurasi untuk parameter terkait cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (mencocokkan `id`, menimpa berdasarkan key)

Ini memungkinkan satu agen mempertahankan cache yang bertahan lama sementara agen lain pada model yang sama menonaktifkan caching untuk menghindari biaya penulisan pada trafik yang meledak-ledak/berpenggunaan ulang rendah.

### Catatan Bedrock Claude

- Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
- Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.
- Default cerdas kunci API Anthropic juga mengisi `cacheRetention: "short"` untuk referensi model Claude-on-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

## Jendela konteks 1M (beta Anthropic)

Jendela konteks 1M Anthropic dibatasi oleh beta. Di OpenClaw, aktifkan per model
dengan `params.context1m: true` untuk model Opus/Sonnet yang didukung.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw memetakan ini ke `anthropic-beta: context-1m-2025-08-07` pada permintaan
Anthropic.

Ini hanya aktif saat `params.context1m` secara eksplisit ditetapkan ke `true` untuk
model tersebut.

Persyaratan: Anthropic harus mengizinkan penggunaan konteks panjang pada kredensial tersebut.

Catatan: Anthropic saat ini menolak permintaan beta `context-1m-*` saat menggunakan
autentikasi token Anthropic lama (`sk-ant-oat-*`). Jika Anda mengonfigurasi
`context1m: true` dengan mode autentikasi lama tersebut, OpenClaw mencatat peringatan dan
kembali ke jendela konteks standar dengan melewati header beta context1m
sambil tetap mempertahankan beta OAuth yang diwajibkan.

## Backend Claude CLI

Backend `claude-cli` Anthropic bawaan didukung di OpenClaw.

- Staf Anthropic memberi tahu kami bahwa penggunaan ini kembali diizinkan.
- Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
  hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Kunci API Anthropic tetap menjadi jalur produksi yang paling jelas untuk host gateway
  yang selalu aktif dan kontrol penagihan sisi server yang eksplisit.
- Detail penyiapan dan runtime ada di [/gateway/cli-backends](/id/gateway/cli-backends).

## Catatan

- Dokumentasi publik Claude Code milik Anthropic masih mendokumentasikan penggunaan CLI langsung seperti
  `claude -p`, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
  kembali diizinkan. Kami memperlakukan panduan itu sebagai hal yang sudah pasti kecuali Anthropic
  menerbitkan perubahan kebijakan baru.
- setup-token Anthropic tetap tersedia di OpenClaw sebagai jalur autentikasi token yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
- Detail autentikasi + aturan penggunaan ulang ada di [/concepts/oauth](/id/concepts/oauth).

## Pemecahan masalah

**Kesalahan 401 / token tiba-tiba tidak valid**

- Autentikasi token Anthropic dapat kedaluwarsa atau dicabut.
- Untuk penyiapan baru, migrasikan ke kunci API Anthropic.

**No API key found for provider "anthropic"**

- Autentikasi bersifat **per agen**. Agen baru tidak mewarisi kunci agen utama.
- Jalankan ulang onboarding untuk agen tersebut, atau konfigurasikan kunci API di host gateway
  tersebut, lalu verifikasi dengan `openclaw models status`.

**No credentials found for profile `anthropic:default`**

- Jalankan `openclaw models status` untuk melihat profil autentikasi mana yang aktif.
- Jalankan ulang onboarding, atau konfigurasikan kunci API untuk jalur profil tersebut.

**No available auth profile (all in cooldown/unavailable)**

- Periksa `openclaw models status --json` untuk `auth.unusableProfiles`.
- Cooldown rate limit Anthropic dapat dibatasi per model, jadi model Anthropic
  lain yang setara mungkin masih dapat digunakan meskipun model saat ini sedang cooldown.
- Tambahkan profil Anthropic lain atau tunggu cooldown selesai.

Selengkapnya: [/gateway/troubleshooting](/id/gateway/troubleshooting) dan [/help/faq](/id/help/faq).
