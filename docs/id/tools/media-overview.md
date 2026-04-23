---
read_when:
    - Mencari ikhtisar kapabilitas media
    - Menentukan provider media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media async
summary: Halaman landing terpadu untuk kapabilitas pembuatan media, pemahaman media, dan ucapan
title: Ikhtisar Media
x-i18n:
    generated_at: "2026-04-23T09:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Pembuatan dan Pemahaman Media

OpenClaw membuat gambar, video, dan musik, memahami media masuk (gambar, audio, video), serta mengucapkan balasan dengan text-to-speech. Semua kapabilitas media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan percakapan, dan setiap alat hanya muncul saat setidaknya satu provider pendukung telah dikonfigurasi.

## Kapabilitas sekilas

| Kapabilitas          | Alat             | Providers                                                                                   | Fungsinya                                              |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Pembuatan gambar     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Membuat atau mengedit gambar dari prompt teks atau referensi |
| Pembuatan video      | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Membuat video dari teks, gambar, atau video yang sudah ada |
| Pembuatan musik      | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Membuat musik atau trek audio dari prompt teks         |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                 | Mengubah balasan keluar menjadi audio lisan            |
| Pemahaman media      | (otomatis)       | Provider model apa pun yang mendukung vision/audio, ditambah fallback CLI                  | Merangkum gambar, audio, dan video masuk               |

## Matriks kapabilitas provider

Tabel ini menunjukkan provider mana yang mendukung kapabilitas media tertentu di seluruh platform.

| Provider   | Gambar | Video | Musik | TTS | STT / Transkripsi | Pemahaman Media |
| ---------- | ------ | ----- | ----- | --- | ----------------- | --------------- |
| Alibaba    |        | Ya    |       |     |                   |                 |
| BytePlus   |        | Ya    |       |     |                   |                 |
| ComfyUI    | Ya     | Ya    | Ya    |     |                   |                 |
| Deepgram   |        |       |       |     | Ya                |                 |
| ElevenLabs |        |       |       | Ya  | Ya                |                 |
| fal        | Ya     | Ya    |       |     |                   |                 |
| Google     | Ya     | Ya    | Ya    |     |                   | Ya              |
| Microsoft  |        |       |       | Ya  |                   |                 |
| MiniMax    | Ya     | Ya    | Ya    | Ya  |                   |                 |
| Mistral    |        |       |       |     | Ya                |                 |
| OpenAI     | Ya     | Ya    |       | Ya  | Ya                | Ya              |
| Qwen       |        | Ya    |       |     |                   |                 |
| Runway     |        | Ya    |       |     |                   |                 |
| Together   |        | Ya    |       |     |                   |                 |
| Vydra      | Ya     | Ya    |       |     |                   |                 |
| xAI        | Ya     | Ya    |       | Ya  | Ya                | Ya              |

<Note>
Pemahaman media menggunakan model vision-capable atau audio-capable apa pun yang terdaftar dalam config provider Anda. Tabel di atas menyoroti provider dengan dukungan pemahaman media khusus; sebagian besar provider LLM dengan model multimodal (Anthropic, Google, OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai model balasan aktif.
</Note>

## Cara kerja pembuatan async

Pembuatan video dan musik berjalan sebagai tugas latar belakang karena pemrosesan provider biasanya memerlukan 30 detik hingga beberapa menit. Saat agen memanggil `video_generate` atau `music_generate`, OpenClaw mengirim permintaan ke provider, segera mengembalikan task ID, dan melacak pekerjaan itu di ledger tugas. Agen tetap dapat merespons pesan lain saat pekerjaan berjalan. Saat provider selesai, OpenClaw membangunkan agen agar agen dapat memposting media yang telah selesai kembali ke saluran asal. Pembuatan gambar dan TTS bersifat sinkron dan selesai inline bersama balasan.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi. Deepgram,
ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan provider STT streaming Voice Call, sehingga audio telepon live dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

OpenAI dipetakan ke permukaan gambar, video, TTS batch, STT batch, STT streaming Voice Call,
suara realtime, dan embedding memori milik OpenClaw. xAI saat ini
dipetakan ke permukaan gambar, video, pencarian, eksekusi kode, TTS batch, STT batch,
dan STT streaming Voice Call milik OpenClaw. Suara Realtime xAI adalah kapabilitas
upstream, tetapi belum didaftarkan di OpenClaw sampai kontrak suara realtime
bersama dapat merepresentasikannya.

## Tautan cepat

- [Pembuatan Gambar](/id/tools/image-generation) -- membuat dan mengedit gambar
- [Pembuatan Video](/id/tools/video-generation) -- text-to-video, image-to-video, dan video-to-video
- [Pembuatan Musik](/id/tools/music-generation) -- membuat musik dan trek audio
- [Text-to-Speech](/id/tools/tts) -- mengubah balasan menjadi audio lisan
- [Pemahaman Media](/id/nodes/media-understanding) -- memahami gambar, audio, dan video masuk
