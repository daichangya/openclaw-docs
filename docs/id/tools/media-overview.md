---
read_when:
    - Mencari ikhtisar kemampuan media
    - Menentukan penyedia media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
summary: Halaman arahan terpadu untuk kemampuan pembuatan media, pemahaman media, dan suara
title: Ikhtisar media
x-i18n:
    generated_at: "2026-04-25T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Pembuatan dan Pemahaman Media

OpenClaw membuat gambar, video, dan musik, memahami media masuk (gambar, audio, video), dan membacakan balasan dengan text-to-speech. Semua kemampuan media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan percakapan, dan setiap alat hanya muncul ketika setidaknya satu penyedia pendukung dikonfigurasi.

## Kemampuan sekilas

| Kemampuan            | Alat             | Penyedia                                                                                     | Fungsinya                                                |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Pembuatan gambar     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Membuat atau mengedit gambar dari prompt teks atau referensi |
| Pembuatan video      | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Membuat video dari teks, gambar, atau video yang sudah ada |
| Pembuatan musik      | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Membuat musik atau trek audio dari prompt teks           |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo | Mengubah balasan keluar menjadi audio yang diucapkan     |
| Pemahaman media      | (otomatis)       | Penyedia model apa pun yang mendukung vision/audio, ditambah fallback CLI                    | Merangkum gambar, audio, dan video masuk                 |

## Matriks kemampuan penyedia

Tabel ini menunjukkan penyedia mana yang mendukung kemampuan media tertentu di seluruh platform.

| Penyedia    | Gambar | Video | Musik | TTS | STT / Transkripsi | Suara Realtime | Pemahaman Media |
| ----------- | ------ | ----- | ----- | --- | ----------------- | -------------- | --------------- |
| Alibaba     |        | Yes   |       |     |                   |                |                 |
| BytePlus    |        | Yes   |       |     |                   |                |                 |
| ComfyUI     | Yes    | Yes   | Yes   |     |                   |                |                 |
| Deepgram    |        |       |       |     | Yes               | Yes            |                 |
| ElevenLabs  |        |       |       | Yes | Yes               |                |                 |
| fal         | Yes    | Yes   |       |     |                   |                |                 |
| Google      | Yes    | Yes   | Yes   | Yes |                   | Yes            | Yes             |
| Gradium     |        |       |       | Yes |                   |                |                 |
| Local CLI   |        |       |       | Yes |                   |                |                 |
| Microsoft   |        |       |       | Yes |                   |                |                 |
| MiniMax     | Yes    | Yes   | Yes   | Yes |                   |                |                 |
| Mistral     |        |       |       |     | Yes               |                |                 |
| OpenAI      | Yes    | Yes   |       | Yes | Yes               | Yes            | Yes             |
| Qwen        |        | Yes   |       |     |                   |                |                 |
| Runway      |        | Yes   |       |     |                   |                |                 |
| SenseAudio  |        |       |       |     | Yes               |                |                 |
| Together    |        | Yes   |       |     |                   |                |                 |
| Vydra       | Yes    | Yes   |       | Yes |                   |                |                 |
| xAI         | Yes    | Yes   |       | Yes | Yes               |                | Yes             |
| Xiaomi MiMo | Yes    |       |       | Yes |                   |                | Yes             |

<Note>
Pemahaman media menggunakan model apa pun yang mendukung vision atau audio yang terdaftar dalam konfigurasi penyedia Anda. Tabel di atas menyoroti penyedia dengan dukungan pemahaman media khusus; sebagian besar penyedia LLM dengan model multimodal (Anthropic, Google, OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai model balasan aktif.
</Note>

## Cara kerja pembuatan asinkron

Pembuatan video dan musik berjalan sebagai tugas latar belakang karena pemrosesan oleh penyedia biasanya memerlukan waktu 30 detik hingga beberapa menit. Saat agen memanggil `video_generate` atau `music_generate`, OpenClaw mengirim permintaan ke penyedia, segera mengembalikan ID tugas, dan melacak pekerjaan tersebut dalam ledger tugas. Agen tetap melanjutkan respons ke pesan lain saat pekerjaan berjalan. Saat penyedia selesai, OpenClaw membangunkan agen agar dapat memposting media yang telah selesai kembali ke channel asal. Pembuatan gambar dan TTS bersifat sinkron dan selesai sebaris dengan balasan.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi.
Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT
streaming Voice Call, sehingga audio telepon live dapat diteruskan ke vendor
yang dipilih tanpa menunggu rekaman selesai.

Google dipetakan ke permukaan gambar, video, musik, batch TTS, suara realtime backend,
dan pemahaman media OpenClaw. OpenAI dipetakan ke permukaan gambar,
video, batch TTS, batch STT, STT streaming Voice Call, suara realtime backend,
dan embedding memori OpenClaw. xAI saat ini dipetakan ke permukaan gambar, video,
pencarian, eksekusi kode, batch TTS, batch STT, dan STT streaming Voice Call
OpenClaw. Suara xAI Realtime adalah kemampuan upstream, tetapi belum
didaftarkan di OpenClaw sampai kontrak suara realtime bersama dapat merepresentasikannya.

## Tautan cepat

- [Pembuatan Gambar](/id/tools/image-generation) -- membuat dan mengedit gambar
- [Pembuatan Video](/id/tools/video-generation) -- text-to-video, image-to-video, dan video-to-video
- [Pembuatan Musik](/id/tools/music-generation) -- membuat musik dan trek audio
- [Text-to-Speech](/id/tools/tts) -- mengubah balasan menjadi audio yang diucapkan
- [Pemahaman Media](/id/nodes/media-understanding) -- memahami gambar, audio, dan video masuk

## Terkait

- [Pembuatan gambar](/id/tools/image-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Pembuatan musik](/id/tools/music-generation)
- [Text-to-speech](/id/tools/tts)
