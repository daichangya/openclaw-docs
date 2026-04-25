---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Bagaimana audio masuk/catatan suara diunduh, ditranskripsikan, dan disisipkan ke dalam balasan
title: Audio dan catatan suara
x-i18n:
    generated_at: "2026-04-25T13:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Catatan Suara (2026-01-17)

## Yang berfungsi

- **Pemahaman media (audio)**: Jika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:
  1. Menemukan lampiran audio pertama (path lokal atau URL) dan mengunduhnya jika perlu.
  2. Menerapkan `maxBytes` sebelum mengirim ke setiap entri model.
  3. Menjalankan entri model pertama yang memenuhi syarat sesuai urutan (provider atau CLI).
  4. Jika gagal atau dilewati (ukuran/timeout), OpenClaw mencoba entri berikutnya.
  5. Jika berhasil, OpenClaw mengganti `Body` dengan blok `[Audio]` dan mengatur `{{Transcript}}`.
- **Parsing perintah**: Saat transkripsi berhasil, `CommandBody`/`RawBody` diatur ke transkrip sehingga slash command tetap berfungsi.
- **Logging verbose**: Dalam `--verbose`, kami mencatat kapan transkripsi berjalan dan kapan transkripsi mengganti body.

## Deteksi otomatis (default)

Jika Anda **tidak mengonfigurasi model** dan `tools.media.audio.enabled` **tidak** diatur ke `false`,
OpenClaw mendeteksi otomatis dalam urutan ini dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif** saat providernya mendukung pemahaman audio.
2. **CLI lokal** (jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (dari `whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
3. **Gemini CLI** (`gemini`) menggunakan `read_many_files`
4. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung audio dicoba terlebih dahulu
   - Urutan fallback bawaan: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Untuk menonaktifkan deteksi otomatis, atur `tools.media.audio.enabled: false`.
Untuk menyesuaikan, atur `tools.media.audio.models`.
Catatan: Deteksi binary bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau atur model CLI eksplisit dengan path perintah lengkap.

## Contoh config

### Fallback provider + CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Provider-only dengan pembatasan scope

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Provider-only (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Provider-only (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Provider-only (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Echo transkrip ke chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default adalah false
        echoFormat: '📝 "{transcript}"', // opsional, mendukung {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Catatan & batasan

- Auth provider mengikuti urutan auth model standar (profil auth, env vars, `models.providers.*.apiKey`).
- Detail pengaturan Groq: [Groq](/id/providers/groq).
- Deepgram mengambil `DEEPGRAM_API_KEY` saat `provider: "deepgram"` digunakan.
- Detail pengaturan Deepgram: [Deepgram (transkripsi audio)](/id/providers/deepgram).
- Detail pengaturan Mistral: [Mistral](/id/providers/mistral).
- SenseAudio mengambil `SENSEAUDIO_API_KEY` saat `provider: "senseaudio"` digunakan.
- Detail pengaturan SenseAudio: [SenseAudio](/providers/senseaudio).
- Provider audio dapat menimpa `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran default adalah 20MB (`tools.media.audio.maxBytes`). Audio yang terlalu besar dilewati untuk model tersebut dan entri berikutnya dicoba.
- File audio yang sangat kecil/kosong di bawah 1024 byte dilewati sebelum transkripsi provider/CLI.
- `maxChars` default untuk audio adalah **tidak diatur** (transkrip penuh). Atur `tools.media.audio.maxChars` atau `maxChars` per entri untuk memotong output.
- Default otomatis OpenAI adalah `gpt-4o-mini-transcribe`; atur `model: "gpt-4o-transcribe"` untuk akurasi lebih tinggi.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa catatan suara (`mode: "all"` + `maxAttachments`).
- Transkrip tersedia untuk template sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` nonaktif secara default; aktifkan untuk mengirim konfirmasi transkrip kembali ke chat asal sebelum pemrosesan agen.
- `tools.media.audio.echoFormat` menyesuaikan teks echo (placeholder: `{transcript}`).
- stdout CLI dibatasi (5MB); jaga output CLI tetap ringkas.

### Dukungan environment proxy

Transkripsi audio berbasis provider menghormati env var proxy keluar standar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada env var proxy yang diatur, egress langsung digunakan. Jika config proxy salah format, OpenClaw mencatat peringatan dan fallback ke fetch langsung.

## Deteksi mention di grup

Saat `requireMention: true` diatur untuk chat grup, OpenClaw sekarang mentranskripsikan audio **sebelum** memeriksa mention. Ini memungkinkan catatan suara diproses bahkan ketika berisi mention.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki body teks dan grup memerlukan mention, OpenClaw melakukan transkripsi "preflight".
2. Transkrip diperiksa untuk pola mention (misalnya `@BotName`, pemicu emoji).
3. Jika mention ditemukan, pesan melanjutkan ke pipeline balasan penuh.
4. Transkrip digunakan untuk deteksi mention sehingga catatan suara dapat melewati gerbang mention.

**Perilaku fallback:**

- Jika transkripsi gagal selama preflight (timeout, error API, dll.), pesan diproses berdasarkan deteksi mention hanya-teks.
- Ini memastikan bahwa pesan campuran (teks + audio) tidak pernah salah dibuang.

**Opt-out per grup/topik Telegram:**

- Atur `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan mention transkrip preflight untuk grup tersebut.
- Atur `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk override per topik (`true` untuk melewati, `false` untuk memaksa aktif).
- Default adalah `false` (preflight aktif saat kondisi dengan pembatasan mention cocok).

**Contoh:** Pengguna mengirim catatan suara yang mengatakan "Hai @Claude, bagaimana cuacanya?" di grup Telegram dengan `requireMention: true`. Catatan suara ditranskripsikan, mention terdeteksi, dan agen membalas.

## Hal-hal yang perlu diperhatikan

- Aturan scope menggunakan first-match wins. `chatType` dinormalisasi menjadi `direct`, `group`, atau `room`.
- Pastikan CLI Anda keluar dengan 0 dan mencetak teks biasa; JSON perlu diolah melalui `jq -r .text`.
- Untuk `parakeet-mlx`, jika Anda meneruskan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat `--output-format` adalah `txt` (atau dihilangkan); format output non-`txt` akan fallback ke parsing stdout.
- Jaga timeout tetap wajar (`timeoutSeconds`, default 60d) agar tidak memblokir antrean balasan.
- Transkripsi preflight hanya memproses **lampiran audio pertama** untuk deteksi mention. Audio tambahan diproses selama fase pemahaman media utama.

## Terkait

- [Pemahaman media](/id/nodes/media-understanding)
- [Mode Talk](/id/nodes/talk)
- [Voice wake](/id/nodes/voicewake)
