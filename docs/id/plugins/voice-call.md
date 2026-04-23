---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin voice-call
summary: 'Plugin Voice Call: panggilan keluar + masuk melalui Twilio/Telnyx/Plivo (instalasi Plugin + config + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T09:25:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Panggilan suara untuk OpenClaw melalui sebuah Plugin. Mendukung notifikasi panggilan keluar dan
percakapan multi-giliran dengan kebijakan panggilan masuk.

Provider saat ini:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + speech GetInput)
- `mock` (dev/tanpa jaringan)

Model mental cepat:

- Instal Plugin
- Restart Gateway
- Konfigurasikan di bawah `plugins.entries.voice-call.config`
- Gunakan `openclaw voicecall ...` atau alat `voice_call`

## Tempat ini berjalan (lokal vs remote)

Plugin Voice Call berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway remote, instal/konfigurasikan Plugin di **mesin yang menjalankan Gateway**, lalu restart Gateway untuk memuatnya.

## Instal

### Opsi A: instal dari npm (disarankan)

```bash
openclaw plugins install @openclaw/voice-call
```

Setelah itu restart Gateway.

### Opsi B: instal dari folder lokal (dev, tanpa menyalin)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Setelah itu restart Gateway.

## Config

Setel config di bawah `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // atau "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Kunci publik webhook Telnyx dari Telnyx Mission Control Portal
            // (string Base64; juga dapat disetel melalui TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Keamanan webhook (disarankan untuk tunnel/proxy)
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
            provider: "openai", // opsional; provider transkripsi realtime terdaftar pertama jika tidak disetel
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY disetel
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
        },
      },
    },
  },
}
```

Catatan:

- Twilio/Telnyx memerlukan URL webhook yang **dapat dijangkau secara publik**.
- Plivo memerlukan URL webhook yang **dapat dijangkau secara publik**.
- `mock` adalah provider dev lokal (tanpa panggilan jaringan).
- Jika config lama masih menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI `streaming.*` lama, jalankan `openclaw doctor --fix` untuk menulis ulang.
- Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
- `skipSignatureVerification` hanya untuk pengujian lokal.
- Jika Anda menggunakan ngrok tingkat gratis, setel `publicUrl` ke URL ngrok yang persis; verifikasi signature selalu diberlakukan.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan signature tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Gunakan hanya untuk dev lokal.
- URL ngrok tingkat gratis dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` bergeser, signature Twilio akan gagal. Untuk produksi, pilih domain stabil atau funnel Tailscale.
- Default keamanan streaming:
  - `streaming.preStartTimeoutMs` menutup soket yang tidak pernah mengirim frame `start` yang valid.
- `streaming.maxPendingConnections` membatasi total soket pra-mulai yang belum diautentikasi.
- `streaming.maxPendingConnectionsPerIp` membatasi soket pra-mulai yang belum diautentikasi per IP sumber.
- `streaming.maxConnections` membatasi total soket media stream yang terbuka (pending + aktif).
- Fallback runtime masih menerima kunci voice-call lama untuk saat ini, tetapi jalur penulisan ulangnya adalah `openclaw doctor --fix` dan shim kompatibilitas ini bersifat sementara.

## Transkripsi streaming

`streaming` memilih provider transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak disetel, Voice Call menggunakan provider transkripsi realtime terdaftar pertama.
- Provider transkripsi realtime bawaan mencakup Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI
  (`xai`), yang didaftarkan oleh Plugin provider mereka.
- Config mentah milik provider berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke provider yang tidak terdaftar, atau tidak ada provider
  transkripsi realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan
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
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY disetel
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
                apiKey: "${XAI_API_KEY}", // opsional jika XAI_API_KEY disetel
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

## Pembersih panggilan usang

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima webhook terminal
(misalnya, panggilan mode notify yang tidak pernah selesai). Default-nya adalah `0`
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

Saat proxy atau tunnel berada di depan Gateway, Plugin merekonstruksi
URL publik untuk verifikasi signature. Opsi ini mengontrol header penerusan mana
yang dipercaya.

`webhookSecurity.allowedHosts` meng-allowlist host dari header penerusan.

`webhookSecurity.trustForwardingHeaders` mempercayai header penerusan tanpa allowlist.

`webhookSecurity.trustedProxyIPs` hanya mempercayai header penerusan saat IP remote
permintaan cocok dengan daftar.

Perlindungan replay webhook diaktifkan untuk Twilio dan Plivo. Permintaan webhook valid
yang diputar ulang diakui tetapi dilewati untuk efek samping.

Giliran percakapan Twilio menyertakan token per-giliran dalam callback `<Gather>`, sehingga
callback speech yang usang/diputar ulang tidak dapat memenuhi giliran transkrip yang lebih baru yang masih pending.

Permintaan webhook yang tidak diautentikasi ditolak sebelum pembacaan body saat header signature
wajib milik provider tidak ada.

Webhook voice-call menggunakan profil body pra-auth bersama (64 KB / 5 detik)
plus batas in-flight per-IP sebelum verifikasi signature.

Contoh dengan host publik stabil:

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
speech streaming pada panggilan. Anda dapat menimpanya di bawah config Plugin dengan
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

- Kunci `tts.<provider>` lama di dalam config Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) dimigrasikan otomatis ke `tts.providers.<provider>` saat dimuat. Pilih bentuk `providers` di config yang di-commit.
- **Speech Microsoft diabaikan untuk panggilan suara** (audio telepon memerlukan PCM; transport Microsoft saat ini tidak mengekspos keluaran PCM telepon).
- TTS inti digunakan saat media streaming Twilio diaktifkan; jika tidak, panggilan fallback ke suara native provider.
- Jika media stream Twilio sudah aktif, Voice Call tidak fallback ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam status itu, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telepon fallback ke provider sekunder, Voice Call mencatat peringatan dengan rantai provider (`from`, `to`, `attempts`) untuk debugging.

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

Kebijakan masuk default-nya adalah `disabled`. Untuk mengaktifkan panggilan masuk, setel:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Ada yang bisa saya bantu?",
}
```

`inboundPolicy: "allowlist"` adalah penyaringan caller ID dengan jaminan rendah. Plugin
menormalisasi nilai `From` yang diberikan provider lalu membandingkannya dengan `allowFrom`.
Verifikasi webhook mengautentikasi pengiriman provider dan integritas payload, tetapi
tidak membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan `allowFrom` sebagai
penyaringan caller ID, bukan identitas penelepon yang kuat.

Respons otomatis menggunakan sistem agen. Sesuaikan dengan:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke system prompt:

- `{"spoken":"..."}`

Voice Call lalu mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten reasoning/error.
- Mengurai JSON langsung, JSON berpagar, atau key `"spoken"` inline.
- Fallback ke teks biasa dan menghapus paragraf pembuka yang tampaknya berupa perencanaan/meta.

Ini menjaga pemutaran ucapan tetap berfokus pada teks yang ditujukan ke penelepon dan mencegah kebocoran teks perencanaan ke audio.

### Perilaku startup percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terikat ke status pemutaran live:

- Pembersihan antrean barge-in dan respons otomatis hanya ditekan saat salam awal sedang aktif berbicara.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap berada dalam antrean untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.

### Grace pemutusan stream Twilio

Saat media stream Twilio terputus, Voice Call menunggu `2000ms` sebelum otomatis mengakhiri panggilan:

- Jika stream tersambung kembali selama jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang didaftarkan ulang setelah masa grace, panggilan diakhiri untuk mencegah panggilan aktif yang macet.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari path penyimpanan voice-call default. Gunakan
`--file <path>` untuk menunjuk log yang berbeda dan `--last <n>` untuk membatasi analisis
ke N catatan terakhir (default 200). Output mencakup p50/p90/p99 untuk latensi
giliran dan waktu tunggu listen.

## Alat agen

Nama alat: `voice_call`

Aksi:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Repo ini menyertakan dokumen skill yang cocok di `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
