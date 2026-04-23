---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi provider TTS atau batasan
    - Menggunakan perintah /tts
summary: Text-to-speech (TTS) untuk balasan keluar
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-23T09:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw dapat mengonversi balasan keluar menjadi audio menggunakan ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI, atau xAI.
Fitur ini berfungsi di mana pun OpenClaw dapat mengirim audio.

## Layanan yang didukung

- **ElevenLabs** (provider utama atau fallback)
- **Google Gemini** (provider utama atau fallback; menggunakan Gemini API TTS)
- **Microsoft** (provider utama atau fallback; implementasi bawaan saat ini menggunakan `node-edge-tts`)
- **MiniMax** (provider utama atau fallback; menggunakan API T2A v2)
- **OpenAI** (provider utama atau fallback; juga digunakan untuk ringkasan)
- **xAI** (provider utama atau fallback; menggunakan API TTS xAI)

### Catatan speech Microsoft

Provider speech Microsoft bawaan saat ini menggunakan layanan TTS neural online Microsoft Edge melalui library `node-edge-tts`. Ini adalah layanan hosted (bukan
lokal), menggunakan endpoint Microsoft, dan tidak memerlukan API key.
`node-edge-tts` mengekspos opsi konfigurasi speech dan format output, tetapi
tidak semua opsi didukung oleh layanan tersebut. Konfigurasi dan input directive legacy
yang menggunakan `edge` tetap berfungsi dan dinormalisasi menjadi `microsoft`.

Karena jalur ini adalah layanan web publik tanpa SLA atau kuota yang dipublikasikan,
perlakukan ini sebagai best-effort. Jika Anda memerlukan batas yang terjamin dan dukungan, gunakan OpenAI
atau ElevenLabs.

## Key opsional

Jika Anda ingin menggunakan OpenAI, ElevenLabs, Google Gemini, MiniMax, atau xAI:

- `ELEVENLABS_API_KEY` (atau `XI_API_KEY`)
- `GEMINI_API_KEY` (atau `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Speech Microsoft **tidak** memerlukan API key.

Jika beberapa provider dikonfigurasi, provider yang dipilih digunakan terlebih dahulu dan yang lain menjadi opsi fallback.
Auto-summary menggunakan `summaryModel` yang dikonfigurasi (atau `agents.defaults.model.primary`),
jadi provider itu juga harus diautentikasi jika Anda mengaktifkan ringkasan.

## Tautan layanan

- [Panduan OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autentikasi ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Apakah aktif secara default?

Tidak. Auto‑TTS **nonaktif** secara default. Aktifkan di konfigurasi dengan
`messages.tts.auto` atau secara lokal dengan `/tts on`.

Saat `messages.tts.provider` tidak disetel, OpenClaw memilih provider
speech terkonfigurasi pertama dalam urutan auto-select registry.

## Konfigurasi

Konfigurasi TTS berada di bawah `messages.tts` di `openclaw.json`.
Schema lengkap ada di [Gateway configuration](/id/gateway/configuration).

### Konfigurasi minimal (aktifkan + provider)

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

### Microsoft utama (tanpa API key)

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

Google Gemini TTS menggunakan jalur API key Gemini. API key Google Cloud Console
yang dibatasi ke Gemini API valid di sini, dan itu adalah gaya key yang sama yang digunakan
oleh provider pembuatan gambar Google bawaan. Urutan resolusinya adalah
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

xAI TTS menggunakan jalur `XAI_API_KEY` yang sama seperti provider model Grok bawaan.
Urutan resolusinya adalah `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Voice live saat ini adalah `ara`, `eve`, `leo`, `rex`, `sal`, dan `una`; `eve` adalah
default. `language` menerima tag BCP-47 atau `auto`.

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

### Batas kustom + path prefs

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
- `enabled`: toggle legacy (doctor memigrasikan ini ke `auto`).
- `mode`: `"final"` (default) atau `"all"` (termasuk balasan tool/block).
- `provider`: ID provider speech seperti `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"`, atau `"openai"` (fallback otomatis).
- Jika `provider` **tidak disetel**, OpenClaw menggunakan provider speech terkonfigurasi pertama dalam urutan auto-select registry.
- Legacy `provider: "edge"` tetap berfungsi dan dinormalisasi menjadi `microsoft`.
- `summaryModel`: model murah opsional untuk auto-summary; default ke `agents.defaults.model.primary`.
  - Menerima `provider/model` atau alias model yang dikonfigurasi.
- `modelOverrides`: memungkinkan model memancarkan directive TTS (aktif secara default).
  - `allowProvider` default ke `false` (peralihan provider bersifat opt-in).
- `providers.<id>`: pengaturan milik provider yang dikunci oleh ID provider speech.
- Blok provider langsung legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) dimigrasikan otomatis ke `messages.tts.providers.<id>` saat dimuat.
- `maxTextLength`: batas keras untuk input TTS (karakter). `/tts audio` gagal jika melebihi.
- `timeoutMs`: timeout permintaan (ms).
- `prefsPath`: menimpa path JSON prefs lokal (provider/batas/ringkasan).
- Nilai `apiKey` fallback ke variabel env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: timpa base URL API ElevenLabs.
- `providers.openai.baseUrl`: timpa endpoint OpenAI TTS.
  - Urutan resolusi: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nilai non-default diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan voice kustom diterima.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 2 huruf (misalnya `en`, `de`)
- `providers.elevenlabs.seed`: integer `0..4294967295` (determinisme best-effort)
- `providers.minimax.baseUrl`: timpa base URL API MiniMax (default `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (default `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identifier voice (default `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: kecepatan playback `0.5..2.0` (default 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (default 1.0; harus lebih besar dari 0).
- `providers.minimax.pitch`: pitch shift `-12..12` (default 0).
- `providers.google.model`: model Gemini TTS (default `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nama voice bawaan Gemini (default `Kore`; `voice` juga diterima).
- `providers.google.baseUrl`: timpa base URL Gemini API. Hanya `https://generativelanguage.googleapis.com` yang diterima.
  - Jika `messages.tts.providers.google.apiKey` dihilangkan, TTS dapat menggunakan kembali `models.providers.google.apiKey` sebelum fallback env.
- `providers.xai.apiKey`: API key xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: timpa base URL xAI TTS (default `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ID voice xAI (default `eve`; voice live saat ini: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: kode bahasa BCP-47 atau `auto` (default `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw` (default `mp3`).
- `providers.xai.speed`: override kecepatan native provider.
- `providers.microsoft.enabled`: izinkan penggunaan speech Microsoft (default `true`; tanpa API key).
- `providers.microsoft.voice`: nama voice neural Microsoft (misalnya `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kode bahasa (misalnya `en-US`).
- `providers.microsoft.outputFormat`: format output Microsoft (misalnya `audio-24khz-48kbitrate-mono-mp3`).
  - Lihat format output Microsoft Speech untuk nilai yang valid; tidak semua format didukung oleh transport bawaan berbasis Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: string persen (misalnya `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: tulis subtitle JSON di samping file audio.
- `providers.microsoft.proxy`: URL proxy untuk permintaan speech Microsoft.
- `providers.microsoft.timeoutMs`: override timeout permintaan (ms).
- `edge.*`: alias legacy untuk pengaturan Microsoft yang sama.

## Override yang digerakkan model (aktif secara default)

Secara default, model **dapat** memancarkan directive TTS untuk satu balasan.
Saat `messages.tts.auto` adalah `tagged`, directive ini wajib untuk memicu audio.

Saat diaktifkan, model dapat memancarkan directive `[[tts:...]]` untuk menimpa voice
untuk satu balasan, ditambah blok `[[tts:text]]...[[/tts:text]]` opsional untuk
menyediakan tag ekspresif (tertawa, isyarat bernyanyi, dll.) yang hanya boleh muncul
dalam audio.

Directive `provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`.

Contoh payload balasan:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Key directive yang tersedia (saat diaktifkan):

- `provider` (ID provider speech terdaftar, misalnya `openai`, `elevenlabs`, `google`, `minimax`, atau `microsoft`; memerlukan `allowProvider: true`)
- `voice` (voice OpenAI), `voiceName` / `voice_name` / `google_voice` (voice Google), atau `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (model OpenAI TTS, ID model ElevenLabs, atau model MiniMax) atau `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch MiniMax, -12 hingga 12)
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

Allowlist opsional (aktifkan peralihan provider sambil tetap menjaga knob lain dapat dikonfigurasi):

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

Slash command menulis override lokal ke `prefsPath` (default:
`~/.openclaw/settings/tts.json`, timpa dengan `OPENCLAW_TTS_PREFS` atau
`messages.tts.prefsPath`).

Field yang disimpan:

- `enabled`
- `provider`
- `maxLength` (ambang ringkasan; default 1500 karakter)
- `summarize` (default `true`)

Ini menimpa `messages.tts.*` untuk host tersebut.

## Format output (tetap)

- **Feishu / Matrix / Telegram / WhatsApp**: voice message Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah kompromi yang baik untuk voice message.
- **Channel lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan speech.
- **MiniMax**: MP3 (model `speech-2.8-hd`, sample rate 32kHz). Format voice-note tidak didukung secara native; gunakan OpenAI atau ElevenLabs untuk voice message Opus yang terjamin.
- **Google Gemini**: Gemini API TTS mengembalikan PCM 24kHz mentah. OpenClaw membungkusnya sebagai WAV untuk lampiran audio dan mengembalikan PCM secara langsung untuk Talk/telepon. Format voice-note Opus native tidak didukung oleh jalur ini.
- **xAI**: MP3 secara default; `responseFormat` dapat berupa `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw`. OpenClaw menggunakan endpoint TTS REST batch xAI dan mengembalikan lampiran audio lengkap; WebSocket TTS streaming xAI tidak digunakan oleh jalur provider ini. Format voice-note Opus native tidak didukung oleh jalur ini.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport bawaan menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format output mengikuti format output Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    voice message Opus yang terjamin.
  - Jika format output Microsoft yang dikonfigurasi gagal, OpenClaw akan me-retry dengan MP3.

Format output OpenAI/ElevenLabs tetap per channel (lihat di atas).

## Perilaku auto-TTS

Saat diaktifkan, OpenClaw:

- melewati TTS jika balasan sudah berisi media atau directive `MEDIA:`.
- melewati balasan yang sangat pendek (< 10 karakter).
- meringkas balasan panjang saat diaktifkan menggunakan `agents.defaults.model.primary` (atau `summaryModel`).
- melampirkan audio yang dihasilkan ke balasan.

Jika balasan melebihi `maxLength` dan ringkasan mati (atau tidak ada API key untuk
model ringkasan), audio
dilewati dan balasan teks normal dikirim.

## Diagram alur

```
Balasan -> TTS aktif?
  tidak -> kirim teks
  ya    -> ada media / MEDIA: / pendek?
             ya    -> kirim teks
             tidak -> panjang > batas?
                        tidak -> TTS -> lampirkan audio
                        ya    -> ringkasan aktif?
                                   tidak -> kirim teks
                                   ya    -> ringkas (summaryModel atau agents.defaults.model.primary)
                                             -> TTS -> lampirkan audio
```

## Penggunaan slash command

Ada satu perintah: `/tts`.
Lihat [Slash commands](/id/tools/slash-commands) untuk detail pengaktifannya.

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

- Perintah memerlukan pengirim yang terotorisasi (aturan allowlist/owner tetap berlaku).
- `commands.text` atau pendaftaran perintah native harus diaktifkan.
- Konfigurasi `messages.tts.auto` menerima `off|always|inbound|tagged`.
- `/tts on` menulis preferensi TTS lokal ke `always`; `/tts off` menulisnya ke `off`.
- Gunakan konfigurasi saat Anda menginginkan default `inbound` atau `tagged`.
- `limit` dan `summary` disimpan di prefs lokal, bukan konfigurasi utama.
- `/tts audio` menghasilkan balasan audio satu kali (tidak mengaktifkan TTS).
- `/tts status` menyertakan visibilitas fallback untuk percobaan terbaru:
  - fallback sukses: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - kegagalan: `Error: ...` plus `Attempts: ...`
  - diagnostik rinci: `Attempt details: provider:outcome(reasonCode) latency`
- Kegagalan API OpenAI dan ElevenLabs kini menyertakan detail error provider yang telah di-parse dan request id (saat dikembalikan oleh provider), yang ditampilkan dalam error/log TTS.

## Tool agent

Tool `tts` mengonversi teks menjadi speech dan mengembalikan lampiran audio untuk
pengiriman balasan. Saat channel-nya adalah Feishu, Matrix, Telegram, atau WhatsApp,
audio dikirim sebagai voice message, bukan lampiran file.

## Gateway RPC

Metode Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
