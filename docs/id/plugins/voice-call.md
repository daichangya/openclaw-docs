---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin voice-call
summary: 'Plugin Voice Call: panggilan keluar + masuk melalui Twilio/Telnyx/Plivo (instalasi plugin + konfigurasi + CLI)'
title: Plugin panggilan suara
x-i18n:
    generated_at: "2026-04-25T13:54:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Panggilan suara untuk OpenClaw melalui sebuah Plugin. Mendukung notifikasi keluar dan
percakapan multi-giliran dengan kebijakan panggilan masuk.

Penyedia saat ini:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + ucapan GetInput)
- `mock` (dev/tanpa jaringan)

Model mental cepat:

- Instal Plugin
- Mulai ulang Gateway
- Konfigurasikan di bawah `plugins.entries.voice-call.config`
- Gunakan `openclaw voicecall ...` atau tool `voice_call`

## Tempat menjalankannya (lokal vs remote)

Plugin Voice Call berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway remote, instal/konfigurasikan Plugin di **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway untuk memuatnya.

## Instalasi

### Opsi A: instal dari npm (disarankan)

```bash
openclaw plugins install @openclaw/voice-call
```

Setelah itu, mulai ulang Gateway.

### Opsi B: instal dari folder lokal (dev, tanpa menyalin)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Setelah itu, mulai ulang Gateway.

## Konfigurasi

Atur konfigurasi di bawah `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // atau "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // atau TWILIO_FROM_NUMBER untuk Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Kunci publik webhook Telnyx dari Telnyx Mission Control Portal
            // (string Base64; juga dapat diatur melalui TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Keamanan Webhook (disarankan untuk tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Eksposur publik (pilih satu)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opsional; penyedia transkripsi realtime terdaftar pertama jika tidak diatur
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY diatur
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // opsional; penyedia suara realtime terdaftar pertama jika tidak diatur
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Periksa penyiapan sebelum menguji dengan penyedia nyata:

```bash
openclaw voicecall setup
```

Output default mudah dibaca di log chat dan sesi terminal. Perintah ini memeriksa
apakah Plugin diaktifkan, penyedia dan kredensial tersedia, eksposur webhook
dikonfigurasi, dan hanya satu mode audio yang aktif. Gunakan
`openclaw voicecall setup --json` untuk skrip.

Untuk Twilio, Telnyx, dan Plivo, penyiapan harus dapat menyelesaikan ke URL webhook publik. Jika
`publicUrl`, URL tunnel, URL Tailscale, atau fallback serve yang dikonfigurasi mengarah ke
loopback atau ruang jaringan privat, penyiapan gagal alih-alih memulai penyedia
yang tidak dapat menerima webhook operator nyata.

Untuk uji smoke tanpa kejutan, jalankan:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Perintah kedua tetap merupakan dry run. Tambahkan `--yes` untuk melakukan panggilan
notify keluar singkat:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Catatan:

- Twilio/Telnyx memerlukan URL webhook yang **dapat dijangkau secara publik**.
- Plivo memerlukan URL webhook yang **dapat dijangkau secara publik**.
- `mock` adalah penyedia dev lokal (tanpa panggilan jaringan).
- Jika konfigurasi lama masih menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI `streaming.*` lama, jalankan `openclaw doctor --fix` untuk menulis ulangnya.
- Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
- `skipSignatureVerification` hanya untuk pengujian lokal.
- Jika Anda menggunakan ngrok tingkatan gratis, atur `publicUrl` ke URL ngrok yang persis sama; verifikasi tanda tangan selalu diberlakukan.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Gunakan hanya untuk dev lokal.
- URL ngrok tingkatan gratis dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` bergeser, tanda tangan Twilio akan gagal. Untuk produksi, gunakan domain stabil atau funnel Tailscale.
- `realtime.enabled` memulai percakapan suara-ke-suara penuh; jangan aktifkan bersama `streaming.enabled`.
- Default keamanan streaming:
  - `streaming.preStartTimeoutMs` menutup socket yang tidak pernah mengirim frame `start` yang valid.
- `streaming.maxPendingConnections` membatasi total socket pra-mulai yang belum diautentikasi.
- `streaming.maxPendingConnectionsPerIp` membatasi socket pra-mulai yang belum diautentikasi per IP sumber.
- `streaming.maxConnections` membatasi total socket media stream yang terbuka (tertunda + aktif).
- Fallback runtime masih menerima kunci voice-call lama itu untuk saat ini, tetapi jalur penulisan ulangnya adalah `openclaw doctor --fix` dan shim kompatibilitas ini bersifat sementara.

## Percakapan suara realtime

`realtime` memilih penyedia suara realtime full duplex untuk audio panggilan langsung.
Ini terpisah dari `streaming`, yang hanya meneruskan audio ke penyedia
transkripsi realtime.

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio Media Streams.
- `realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`.
- `realtime.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia
  suara realtime terdaftar pertama.
- Penyedia suara realtime bawaan mencakup Google Gemini Live (`google`) dan
  OpenAI (`openai`), yang didaftarkan oleh plugin penyedianya.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Voice Call mengekspos tool realtime bersama `openclaw_agent_consult` secara
  default. Model realtime dapat memanggilnya ketika penelepon meminta penalaran
  yang lebih mendalam, informasi terkini, atau tool OpenClaw biasa.
- `realtime.toolPolicy` mengontrol eksekusi consult:
  - `safe-read-only`: mengekspos tool consult dan membatasi agen reguler ke
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
    `memory_get`.
  - `owner`: mengekspos tool consult dan membiarkan agen reguler menggunakan kebijakan
    tool agen normal.
  - `none`: jangan mengekspos tool consult. `realtime.tools` kustom tetap
    diteruskan ke penyedia realtime.
- Kunci sesi consult menggunakan kembali sesi suara yang ada saat tersedia, lalu
  kembali menggunakan nomor telepon penelepon/penerima agar panggilan consult lanjutan tetap
  mempertahankan konteks selama panggilan.
- Jika `realtime.provider` menunjuk ke penyedia yang tidak terdaftar, atau sama sekali tidak ada penyedia
  suara realtime yang terdaftar, Voice Call mencatat peringatan dan melewati
  media realtime alih-alih menggagalkan seluruh Plugin.

Default realtime Google Gemini Live:

- API key: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, atau
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Bicaralah singkat. Panggil openclaw_agent_consult sebelum menggunakan tool yang lebih mendalam.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Gunakan OpenAI sebagai gantinya:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Lihat [penyedia Google](/id/providers/google) dan [penyedia OpenAI](/id/providers/openai)
untuk opsi suara realtime khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia
  transkripsi realtime terdaftar pertama.
- Penyedia transkripsi realtime bawaan mencakup Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI
  (`xai`), yang didaftarkan oleh plugin penyedianya.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke penyedia yang tidak terdaftar, atau sama sekali tidak ada penyedia
  transkripsi realtime yang terdaftar, Voice Call mencatat peringatan dan
  melewati streaming media alih-alih menggagalkan seluruh Plugin.

Default transkripsi streaming OpenAI:

- API key: `streaming.providers.openai.apiKey` atau `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Default transkripsi streaming xAI:

- API key: `streaming.providers.xai.apiKey` atau `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY diatur
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Gunakan xAI sebagai gantinya:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opsional jika XAI_API_KEY diatur
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Kunci lama masih dimigrasikan otomatis oleh `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Pembersih panggilan basi

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima webhook terminal
(misalnya, panggilan mode notify yang tidak pernah selesai). Nilai default adalah `0`
(dinonaktifkan).

Rentang yang disarankan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notify.
- Pertahankan nilai ini **lebih tinggi dari `maxDurationSeconds`** agar panggilan normal dapat
  selesai. Titik awal yang baik adalah `maxDurationSeconds + 30–60` detik.

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Keamanan Webhook

Ketika proxy atau tunnel berada di depan Gateway, Plugin membangun ulang
URL publik untuk verifikasi tanda tangan. Opsi ini mengontrol header penerusan
mana yang dipercaya.

`webhookSecurity.allowedHosts` mengizinkan host dari header penerusan melalui allowlist.

`webhookSecurity.trustForwardingHeaders` mempercayai header penerusan tanpa allowlist.

`webhookSecurity.trustedProxyIPs` hanya mempercayai header penerusan ketika IP remote
permintaan cocok dengan daftar.

Perlindungan replay webhook diaktifkan untuk Twilio dan Plivo. Permintaan webhook valid
yang diputar ulang akan diakui tetapi efek sampingnya dilewati.

Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga
callback ucapan yang basi/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.

Permintaan webhook yang tidak diautentikasi ditolak sebelum pembacaan body ketika
header tanda tangan wajib penyedia tidak ada.

Webhook voice-call menggunakan profil body pra-autentikasi bersama (64 KB / 5 detik)
ditambah batas in-flight per-IP sebelum verifikasi tanda tangan.

Contoh dengan host publik yang stabil:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS untuk panggilan

Voice Call menggunakan konfigurasi inti `messages.tts` untuk
streaming ucapan pada panggilan. Anda dapat menimpanya di bawah konfigurasi Plugin dengan
**bentuk yang sama** — ini di-deep-merge dengan `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Catatan:

- Kunci `tts.<provider>` lama di dalam konfigurasi Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang dikomit harus menggunakan `tts.providers.<provider>`.
- **Ucapan Microsoft diabaikan untuk panggilan suara** (audio telepon memerlukan PCM; transport Microsoft saat ini tidak mengekspos output PCM telepon).
- TTS inti digunakan ketika streaming media Twilio diaktifkan; jika tidak, panggilan akan fallback ke suara native penyedia.
- Jika media stream Twilio sudah aktif, Voice Call tidak melakukan fallback ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam keadaan itu, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Ketika TTS telepon fallback ke penyedia sekunder, Voice Call mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk debugging.
- Ketika interupsi Twilio atau teardown stream mengosongkan antrean TTS tertunda, permintaan
  pemutaran yang diantrekan akan diselesaikan alih-alih membuat penelepon yang menunggu penyelesaian
  pemutaran menjadi menggantung.

### Contoh lainnya

Gunakan hanya TTS inti (tanpa override):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Override ke ElevenLabs hanya untuk panggilan (pertahankan default inti di tempat lain):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Override hanya model OpenAI untuk panggilan (contoh deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Panggilan masuk

Kebijakan panggilan masuk default adalah `disabled`. Untuk mengaktifkan panggilan masuk, atur:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Ada yang bisa saya bantu?",
}
```

`inboundPolicy: "allowlist"` adalah penyaringan ID penelepon dengan jaminan rendah. Plugin
menormalkan nilai `From` yang diberikan penyedia dan membandingkannya dengan `allowFrom`.
Verifikasi webhook mengautentikasi pengiriman penyedia dan integritas payload, tetapi
tidak membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan `allowFrom` sebagai
pemfilteran ID penelepon, bukan identitas penelepon yang kuat.

Respons otomatis menggunakan sistem agen. Sesuaikan dengan:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke system prompt:

- `{"spoken":"..."}`

Voice Call lalu mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/error.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Fallback ke teks biasa dan menghapus paragraf pembuka perencanaan/meta yang kemungkinan besar ada.

Ini menjaga agar pemutaran ucapan tetap berfokus pada teks yang ditujukan kepada penelepon dan menghindari kebocoran teks perencanaan ke audio.

### Perilaku saat memulai percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terkait dengan status pemutaran langsung:

- Pengosongan antrean saat interupsi dan respons otomatis ditekan hanya ketika salam awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap diantrekan untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.
- Interupsi membatalkan pemutaran aktif dan mengosongkan entri TTS Twilio yang sudah diantrekan tetapi belum diputar.
  Entri yang dihapus akan selesai sebagai dilewati, sehingga logika respons lanjutan
  dapat berlanjut tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara realtime menggunakan giliran pembukaan milik stream realtime itu sendiri. Voice Call tidak memposting pembaruan TwiML `<Say>` lama untuk pesan awal itu, sehingga sesi `<Connect><Stream>` keluar tetap terpasang.

### Grace disconnect stream Twilio

Ketika media stream Twilio terputus, Voice Call menunggu `2000ms` sebelum otomatis mengakhiri panggilan:

- Jika stream tersambung kembali selama jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang didaftarkan ulang setelah masa grace, panggilan akan diakhiri untuk mencegah panggilan aktif yang macet.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias untuk call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # merangkum latensi giliran dari log
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari jalur penyimpanan default voice-call. Gunakan
`--file <path>` untuk menunjuk ke log yang berbeda dan `--last <n>` untuk membatasi analisis
ke N catatan terakhir (default 200). Output mencakup p50/p90/p99 untuk latensi
giliran dan waktu tunggu mendengarkan.

## Tool agen

Nama tool: `voice_call`

Tindakan:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Repo ini menyediakan dokumen skill yang sesuai di `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Mode talk](/id/nodes/talk)
- [Voice wake](/id/nodes/voicewake)
