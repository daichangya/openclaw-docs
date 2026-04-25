---
read_when:
    - Menerapkan mode Talk di macOS/iOS/Android
    - Mengubah perilaku voice/TTS/interrupt
summary: 'Mode Talk: percakapan suara berkelanjutan dengan provider TTS yang dikonfigurasi'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-25T13:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Mode Talk adalah loop percakapan suara berkelanjutan:

1. Mendengarkan ucapan
2. Mengirim transkrip ke model (sesi utama, `chat.send`)
3. Menunggu respons
4. Mengucapkannya melalui provider Talk yang dikonfigurasi (`talk.speak`)

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Listening → Thinking → Speaking**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interrupt saat ada ucapan** (default aktif): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan playback dan mencatat timestamp interupsi untuk prompt berikutnya.

## Directive voice dalam balasan

Asisten dapat memberi prefiks pada balasannya dengan **satu baris JSON** untuk mengontrol voice:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris non-kosong pertama.
- Key yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini.
- Tanpa `once`, voice menjadi default baru untuk mode Talk.
- Baris JSON dihapus sebelum playback TTS.

Key yang didukung:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfigurasi (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Default:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms` di macOS dan Android, `900 ms` di iOS)
- `provider`: memilih provider Talk aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur playback lokal macOS.
- `providers.<provider>.voiceId`: fallback ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` untuk ElevenLabs (atau voice ElevenLabs pertama saat API key tersedia).
- `providers.elevenlabs.modelId`: default ke `eleven_v3` saat tidak disetel.
- `providers.mlx.modelId`: default ke `mlx-community/Soprano-80M-bf16` saat tidak disetel.
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell gateway jika tersedia).
- `outputFormat`: default ke `pcm_44100` di macOS/iOS dan `pcm_24000` di Android (setel `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle menu bar: **Talk**
- Tab konfigurasi: grup **Talk Mode** (voice id + toggle interrupt)
- Overlay:
  - **Listening**: cloud berdenyut dengan level mikrofon
  - **Thinking**: animasi tenggelam
  - **Speaking**: cincin memancar
  - Klik cloud: hentikan berbicara
  - Klik X: keluar dari mode Talk

## Catatan

- Memerlukan izin Speech + Microphone.
- Menggunakan `chat.send` terhadap key sesi `main`.
- Gateway me-resolve playback Talk melalui `talk.speak` menggunakan provider Talk aktif. Android fallback ke TTS sistem lokal hanya ketika RPC tersebut tidak tersedia.
- Playback MLX lokal macOS menggunakan helper `openclaw-mlx-tts` bawaan saat tersedia, atau executable di `PATH`. Setel `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke helper binary kustom selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat disetel.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack berlatensi rendah.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Audio and voice notes](/id/nodes/audio)
- [Media understanding](/id/nodes/media-understanding)
