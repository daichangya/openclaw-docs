---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi penyedia atau batasan TTS
    - Menggunakan perintah /tts
summary: Text-to-speech (TTS) untuk balasan keluar
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T13:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw dapat mengubah balasan keluar menjadi audio menggunakan ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, atau Xiaomi MiMo.
Fitur ini berfungsi di mana pun OpenClaw dapat mengirim audio.

## Layanan yang didukung

- **ElevenLabs** (penyedia utama atau fallback)
- **Google Gemini** (penyedia utama atau fallback; menggunakan Gemini API TTS)
- **Gradium** (penyedia utama atau fallback; mendukung keluaran voice-note dan telefoni)
- **Local CLI** (penyedia utama atau fallback; menjalankan perintah TTS lokal yang dikonfigurasi)
- **Microsoft** (penyedia utama atau fallback; implementasi bawaan saat ini menggunakan `node-edge-tts`)
- **MiniMax** (penyedia utama atau fallback; menggunakan API T2A v2)
- **OpenAI** (penyedia utama atau fallback; juga digunakan untuk ringkasan)
- **Vydra** (penyedia utama atau fallback; penyedia bersama untuk gambar, video, dan suara)
- **xAI** (penyedia utama atau fallback; menggunakan xAI TTS API)
- **Xiaomi MiMo** (penyedia utama atau fallback; menggunakan MiMo TTS melalui chat completions Xiaomi)

### Catatan speech Microsoft

Penyedia speech Microsoft bawaan saat ini menggunakan layanan
TTS neural online Microsoft Edge melalui library `node-edge-tts`. Ini adalah layanan terhosting (bukan
lokal), menggunakan endpoint Microsoft, dan tidak memerlukan kunci API.
`node-edge-tts` mengekspos opsi konfigurasi speech dan format keluaran, tetapi
tidak semua opsi didukung oleh layanan. Konfigurasi lama dan input directive
yang menggunakan `edge` tetap berfungsi dan dinormalisasi menjadi `microsoft`.

Karena jalur ini adalah layanan web publik tanpa SLA atau kuota yang dipublikasikan,
anggap ini sebagai best-effort. Jika Anda memerlukan batas dan dukungan yang terjamin, gunakan OpenAI
atau ElevenLabs.

## Kunci opsional

Jika Anda ingin menggunakan OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI, atau Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (atau `XI_API_KEY`)
- `GEMINI_API_KEY` (atau `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS juga menerima autentikasi Token Plan melalui
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, atau
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Speech Local CLI dan Microsoft **tidak** memerlukan kunci API.

Jika beberapa penyedia dikonfigurasi, penyedia yang dipilih digunakan terlebih dahulu dan yang lain menjadi opsi fallback.
Auto-summary menggunakan `summaryModel` yang dikonfigurasi (atau `agents.defaults.model.primary`),
jadi penyedia tersebut juga harus diautentikasi jika Anda mengaktifkan ringkasan.

## Tautan layanan

- [Panduan OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/id/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Sintesis ucapan Xiaomi MiMo](/id/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format keluaran Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Apakah ini aktif secara default?

Tidak. Auto‑TTS **nonaktif** secara default. Aktifkan di konfigurasi dengan
`messages.tts.auto` atau secara lokal dengan `/tts on`.

Saat `messages.tts.provider` tidak diatur, OpenClaw memilih penyedia
speech pertama yang dikonfigurasi dalam urutan auto-select registry.

## Konfigurasi

Konfigurasi TTS berada di bawah `messages.tts` dalam `openclaw.json`.
Skema lengkap ada di [Konfigurasi Gateway](/id/gateway/configuration).

### Konfigurasi minimal (aktifkan + penyedia)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI utama dengan fallback ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft utama (tanpa kunci API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

Resolusi autentikasi MiniMax TTS adalah `messages.tts.providers.minimax.apiKey`, lalu
profil OAuth/token `minimax-portal` yang tersimpan, lalu kunci environment Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), lalu `MINIMAX_API_KEY`. Saat tidak ada `baseUrl`
TTS eksplisit yang diatur, OpenClaw dapat menggunakan kembali host OAuth `minimax-portal`
yang dikonfigurasi untuk speech Token Plan.

### Google Gemini utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS menggunakan jalur kunci API Gemini API. Kunci API Google Cloud Console
yang dibatasi untuk Gemini API valid di sini, dan merupakan gaya kunci yang sama yang digunakan
oleh penyedia pembuatan gambar Google bawaan. Urutan resolusinya adalah
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS menggunakan jalur `XAI_API_KEY` yang sama dengan penyedia model Grok bawaan.
Urutan resolusinya adalah `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Suara live saat ini adalah `ara`, `eve`, `leo`, `rex`, `sal`, dan `una`; `eve` adalah
default. `language` menerima tag BCP-47 atau `auto`.

### Xiaomi MiMo utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS menggunakan jalur `XIAOMI_API_KEY` yang sama dengan penyedia model Xiaomi bawaan.
ID penyedia speech adalah `xiaomi`; `mimo` diterima sebagai alias.
Teks target dikirim sebagai pesan asisten, sesuai dengan kontrak TTS Xiaomi.
`style` opsional dikirim sebagai instruksi pengguna dan tidak diucapkan.

### OpenRouter utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS menggunakan jalur `OPENROUTER_API_KEY` yang sama dengan penyedia model
OpenRouter bawaan. Urutan resolusinya adalah
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS menjalankan perintah yang dikonfigurasi pada host gateway. Placeholder
`{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}`, dan `{{OutputBase}}`
diperluas dalam `args`; jika tidak ada placeholder `{{Text}}`, OpenClaw akan menulis
teks yang diucapkan ke stdin. `outputFormat` menerima `mp3`, `opus`, atau `wav`.
Target voice-note ditranskode ke Ogg/Opus dan keluaran telefoni
ditranskode ke PCM mono 16 kHz mentah dengan `ffmpeg`. Alias penyedia lama
`cli` tetap berfungsi, tetapi konfigurasi baru sebaiknya menggunakan `tts-local-cli`.

### Gradium utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Nonaktifkan speech Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Batas khusus + jalur prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Hanya balas dengan audio setelah pesan suara masuk

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Nonaktifkan auto-summary untuk balasan panjang

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Lalu jalankan:

```
/tts summary off
```

### Catatan tentang field

- `auto`: mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` hanya mengirim audio setelah pesan suara masuk.
  - `tagged` hanya mengirim audio saat balasan menyertakan directive `[[tts:key=value]]` atau blok `[[tts:text]]...[[/tts:text]]`.
- `enabled`: toggle lama (doctor memigrasikan ini ke `auto`).
- `mode`: `"final"` (default) atau `"all"` (termasuk balasan tool/block).
- `provider`: id penyedia speech seperti `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"`, atau `"xiaomi"` (fallback otomatis).
- Jika `provider` **tidak diatur**, OpenClaw menggunakan penyedia speech pertama yang dikonfigurasi dalam urutan auto-select registry.
- Konfigurasi lama `provider: "edge"` diperbaiki oleh `openclaw doctor --fix` dan
  ditulis ulang menjadi `provider: "microsoft"`.
- `summaryModel`: model murah opsional untuk auto-summary; defaultnya `agents.defaults.model.primary`.
  - Menerima `provider/model` atau alias model yang dikonfigurasi.
- `modelOverrides`: memungkinkan model mengeluarkan directive TTS (aktif secara default).
  - `allowProvider` defaultnya `false` (pergantian penyedia harus dipilih secara eksplisit).
- `providers.<id>`: pengaturan milik penyedia yang dikunci oleh id penyedia speech.
- Blok penyedia langsung lama (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang dikomit sebaiknya menggunakan `messages.tts.providers.<id>`.
- `messages.tts.providers.edge` lama juga diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang dikomit sebaiknya menggunakan `messages.tts.providers.microsoft`.
- `maxTextLength`: batas keras untuk input TTS (karakter). `/tts audio` gagal jika melebihi batas.
- `timeoutMs`: batas waktu permintaan (ms).
- `prefsPath`: menimpa jalur JSON prefs lokal (provider/batas/ringkasan).
- Nilai `apiKey` menggunakan fallback ke env var (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: timpa base URL API ElevenLabs.
- `providers.openai.baseUrl`: timpa endpoint OpenAI TTS.
  - Urutan resolusi: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nilai non-default diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan suara kustom diterima.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 2 huruf (misalnya `en`, `de`)
- `providers.elevenlabs.seed`: integer `0..4294967295` (determinisme best-effort)
- `providers.minimax.baseUrl`: timpa base URL API MiniMax (default `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (default `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: pengenal suara (default `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: kecepatan pemutaran `0.5..2.0` (default 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (default 1.0; harus lebih besar dari 0).
- `providers.minimax.pitch`: integer pergeseran pitch `-12..12` (default 0). Nilai pecahan dipotong sebelum memanggil MiniMax T2A karena API menolak nilai pitch non-integer.
- `providers.tts-local-cli.command`: executable lokal atau string perintah untuk CLI TTS.
- `providers.tts-local-cli.args`: argumen perintah; mendukung placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, dan `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: format keluaran CLI yang diharapkan (`mp3`, `opus`, atau `wav`; default `mp3` untuk lampiran audio).
- `providers.tts-local-cli.timeoutMs`: batas waktu perintah dalam milidetik (default `120000`).
- `providers.tts-local-cli.cwd`: direktori kerja perintah opsional.
- `providers.tts-local-cli.env`: override environment string opsional untuk perintah.
- `providers.google.model`: model Gemini TTS (default `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nama suara bawaan Gemini (default `Kore`; `voice` juga diterima).
- `providers.google.audioProfile`: prompt gaya bahasa alami yang ditambahkan sebelum teks yang diucapkan.
- `providers.google.speakerName`: label pembicara opsional yang ditambahkan sebelum teks yang diucapkan saat prompt TTS Anda menggunakan pembicara bernama.
- `providers.google.baseUrl`: timpa base URL Gemini API. Hanya `https://generativelanguage.googleapis.com` yang diterima.
  - Jika `messages.tts.providers.google.apiKey` dihilangkan, TTS dapat menggunakan kembali `models.providers.google.apiKey` sebelum fallback ke env.
- `providers.gradium.baseUrl`: timpa base URL API Gradium (default `https://api.gradium.ai`).
- `providers.gradium.voiceId`: pengenal suara Gradium (default Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: kunci API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: timpa base URL xAI TTS (default `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id suara xAI (default `eve`; suara live saat ini: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: kode bahasa BCP-47 atau `auto` (default `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw` (default `mp3`).
- `providers.xai.speed`: override kecepatan native penyedia.
- `providers.xiaomi.apiKey`: kunci API Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: timpa base URL API Xiaomi MiMo (default `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: model TTS (default `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` juga didukung).
- `providers.xiaomi.voice`: id suara MiMo (default `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` atau `wav` (default `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: instruksi gaya bahasa alami opsional yang dikirim sebagai pesan pengguna; tidak diucapkan.
- `providers.openrouter.apiKey`: kunci API OpenRouter (env: `OPENROUTER_API_KEY`; dapat menggunakan kembali `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: timpa base URL OpenRouter TTS (default `https://openrouter.ai/api/v1`; `https://openrouter.ai/v1` lama dinormalisasi).
- `providers.openrouter.model`: id model OpenRouter TTS (default `hexgrad/kokoro-82m`; `modelId` juga diterima).
- `providers.openrouter.voice`: id suara khusus penyedia (default `af_alloy`; `voiceId` juga diterima).
- `providers.openrouter.responseFormat`: `mp3` atau `pcm` (default `mp3`).
- `providers.openrouter.speed`: override kecepatan native penyedia.
- `providers.microsoft.enabled`: izinkan penggunaan speech Microsoft (default `true`; tanpa kunci API).
- `providers.microsoft.voice`: nama suara neural Microsoft (misalnya `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kode bahasa (misalnya `en-US`).
- `providers.microsoft.outputFormat`: format keluaran Microsoft (misalnya `audio-24khz-48kbitrate-mono-mp3`).
  - Lihat format keluaran Microsoft Speech untuk nilai yang valid; tidak semua format didukung oleh transport berbasis Edge bawaan.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: string persen (misalnya `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: tulis subtitle JSON di samping file audio.
- `providers.microsoft.proxy`: URL proxy untuk permintaan speech Microsoft.
- `providers.microsoft.timeoutMs`: override batas waktu permintaan (ms).
- `edge.*`: alias lama untuk pengaturan Microsoft yang sama. Jalankan
  `openclaw doctor --fix` untuk menulis ulang konfigurasi yang disimpan ke `providers.microsoft`.

## Override berbasis model (aktif secara default)

Secara default, model **dapat** mengeluarkan directive TTS untuk satu balasan.
Saat `messages.tts.auto` adalah `tagged`, directive ini diperlukan untuk memicu audio.

Saat diaktifkan, model dapat mengeluarkan directive `[[tts:...]]` untuk menimpa suara
untuk satu balasan, ditambah blok `[[tts:text]]...[[/tts:text]]` opsional untuk
menyediakan tag ekspresif (tawa, isyarat bernyanyi, dll.) yang seharusnya hanya muncul dalam
audio.

Directive `provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`.

Contoh payload balasan:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Kunci directive yang tersedia (saat diaktifkan):

- `provider` (id penyedia speech yang terdaftar, misalnya `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai`, atau `xiaomi`; memerlukan `allowProvider: true`)
- `voice` (suara OpenAI, Gradium, atau Xiaomi), `voiceName` / `voice_name` / `google_voice` (suara Google), atau `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (model OpenAI TTS, id model ElevenLabs, model MiniMax, atau model Xiaomi MiMo TTS) atau `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch integer MiniMax, -12 hingga 12; nilai pecahan dipotong sebelum permintaan MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Nonaktifkan semua override model:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist opsional (aktifkan pergantian penyedia sambil tetap menjaga knob lain dapat dikonfigurasi):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferensi per pengguna

Perintah slash menulis override lokal ke `prefsPath` (default:
`~/.openclaw/settings/tts.json`, timpa dengan `OPENCLAW_TTS_PREFS` atau
`messages.tts.prefsPath`).

Field yang disimpan:

- `enabled`
- `provider`
- `maxLength` (ambang ringkasan; default 1500 karakter)
- `summarize` (default `true`)

Ini menimpa `messages.tts.*` untuk host tersebut.

## Format keluaran (tetap)

- **Feishu / Matrix / Telegram / WhatsApp**: balasan voice-note lebih memilih Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah kompromi yang baik untuk pesan suara.
- **Feishu**: saat balasan voice-note dihasilkan sebagai MP3/WAV/M4A atau file audio
  lain yang mungkin, plugin Feishu akan mentranskodekannya ke 48kHz Ogg/Opus dengan
  `ffmpeg` sebelum mengirim bubble `audio` native. Jika konversi gagal, Feishu
  menerima file asli sebagai lampiran.
- **Channel lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan suara.
- **MiniMax**: MP3 (model `speech-2.8-hd`, sample rate 32kHz) untuk lampiran audio normal. Untuk target voice-note seperti Feishu dan Telegram, OpenClaw mentranskode MP3 MiniMax ke 48kHz Opus dengan `ffmpeg` sebelum pengiriman.
- **Xiaomi MiMo**: MP3 secara default, atau WAV jika dikonfigurasi. Untuk target voice-note seperti Feishu dan Telegram, OpenClaw mentranskode keluaran Xiaomi ke 48kHz Opus dengan `ffmpeg` sebelum pengiriman.
- **Local CLI**: menggunakan `outputFormat` yang dikonfigurasi. Target voice-note
  dikonversi ke Ogg/Opus dan keluaran telefoni dikonversi ke PCM mono 16 kHz mentah
  dengan `ffmpeg`.
- **Google Gemini**: Gemini API TTS mengembalikan PCM mentah 24kHz. OpenClaw membungkusnya sebagai WAV untuk lampiran audio dan mengembalikan PCM secara langsung untuk Talk/telefoni. Format voice-note Opus native tidak didukung oleh jalur ini.
- **Gradium**: WAV untuk lampiran audio, Opus untuk target voice-note, dan `ulaw_8000` pada 8 kHz untuk telefoni.
- **xAI**: MP3 secara default; `responseFormat` dapat berupa `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw`. OpenClaw menggunakan endpoint batch REST TTS xAI dan mengembalikan lampiran audio lengkap; WebSocket TTS streaming xAI tidak digunakan oleh jalur penyedia ini. Format voice-note Opus native tidak didukung oleh jalur ini.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport bawaan menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format keluaran mengikuti format keluaran Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    pesan suara Opus yang terjamin.
  - Jika format keluaran Microsoft yang dikonfigurasi gagal, OpenClaw mencoba lagi dengan MP3.

Format keluaran OpenAI/ElevenLabs tetap per channel (lihat di atas).

## Perilaku auto-TTS

Saat diaktifkan, OpenClaw:

- melewati TTS jika balasan sudah berisi media atau directive `MEDIA:`.
- melewati balasan yang sangat singkat (< 10 karakter).
- merangkum balasan panjang saat diaktifkan menggunakan `agents.defaults.model.primary` (atau `summaryModel`).
- melampirkan audio yang dihasilkan ke balasan.

Jika balasan melebihi `maxLength` dan ringkasan nonaktif (atau tidak ada kunci API untuk
model ringkasan), audio
akan dilewati dan balasan teks normal dikirim.

## Diagram alur

```
Balasan -> TTS diaktifkan?
  tidak -> kirim teks
  ya    -> ada media / MEDIA: / pendek?
            ya    -> kirim teks
            tidak -> panjang > batas?
                      tidak -> TTS -> lampirkan audio
                      ya    -> ringkasan diaktifkan?
                                tidak -> kirim teks
                                ya    -> ringkas (summaryModel atau agents.defaults.model.primary)
                                          -> TTS -> lampirkan audio
```

## Penggunaan perintah slash

Ada satu perintah: `/tts`.
Lihat [Perintah slash](/id/tools/slash-commands) untuk detail pengaktifannya.

Catatan Discord: `/tts` adalah perintah bawaan Discord, jadi OpenClaw mendaftarkan
`/voice` sebagai perintah native di sana. Teks `/tts ...` tetap berfungsi.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Catatan:

- Perintah memerlukan pengirim yang diizinkan (aturan allowlist/owner tetap berlaku).
- `commands.text` atau pendaftaran perintah native harus diaktifkan.
- Konfigurasi `messages.tts.auto` menerima `off|always|inbound|tagged`.
- `/tts on` menulis preferensi TTS lokal menjadi `always`; `/tts off` menulisnya menjadi `off`.
- Gunakan konfigurasi saat Anda menginginkan default `inbound` atau `tagged`.
- `limit` dan `summary` disimpan dalam prefs lokal, bukan konfigurasi utama.
- `/tts audio` menghasilkan balasan audio sekali pakai (tidak mengaktifkan TTS).
- `/tts status` menyertakan visibilitas fallback untuk upaya terbaru:
  - fallback berhasil: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - gagal: `Error: ...` plus `Attempts: ...`
  - diagnostik rinci: `Attempt details: provider:outcome(reasonCode) latency`
- Kegagalan API OpenAI dan ElevenLabs kini menyertakan detail error penyedia yang telah diurai dan request id (saat dikembalikan oleh penyedia), yang ditampilkan dalam error/log TTS.

## Alat agen

Alat `tts` mengubah teks menjadi ucapan dan mengembalikan lampiran audio untuk
pengiriman balasan. Saat channel adalah Feishu, Matrix, Telegram, atau WhatsApp,
audio dikirim sebagai pesan suara, bukan sebagai lampiran file.
Feishu dapat mentranskode keluaran TTS non-Opus pada jalur ini saat `ffmpeg`
tersedia.
Alat ini menerima field opsional `channel` dan `timeoutMs`; `timeoutMs` adalah
batas waktu permintaan penyedia per panggilan dalam milidetik.

## Gateway RPC

Metode Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Terkait

- [Ikhtisar media](/id/tools/media-overview)
- [Pembuatan musik](/id/tools/music-generation)
- [Pembuatan video](/id/tools/video-generation)
