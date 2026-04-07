---
read_when:
    - Mencari ikhtisar kapabilitas media
    - Memutuskan provider media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
summary: Halaman arahan terpadu untuk kapabilitas pembuatan media, pemahaman media, dan speech
title: Ikhtisar Media
x-i18n:
    generated_at: "2026-04-07T09:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# Pembuatan dan Pemahaman Media

OpenClaw membuat gambar, video, dan musik, memahami media masuk (gambar, audio, video), dan mengucapkan balasan dengan text-to-speech. Semua kapabilitas media digerakkan oleh tool: agen memutuskan kapan menggunakannya berdasarkan percakapan, dan setiap tool hanya muncul ketika setidaknya satu provider pendukung telah dikonfigurasi.

## Kapabilitas secara ringkas

| Capability           | Tool             | Providers                                                                                    | What it does                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Pembuatan gambar     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra                                                 | Membuat atau mengedit gambar dari prompt teks atau referensi |
| Pembuatan video      | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Membuat video dari teks, gambar, atau video yang sudah ada |
| Pembuatan musik      | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Membuat musik atau trek audio dari prompt teks          |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI                                                       | Mengubah balasan keluar menjadi audio yang diucapkan    |
| Pemahaman media      | (otomatis)       | Provider model apa pun yang mendukung vision/audio, ditambah fallback CLI                    | Merangkum gambar, audio, dan video masuk                |

## Matriks kapabilitas provider

Tabel ini menunjukkan provider mana yang mendukung kapabilitas media tertentu di seluruh platform.

| Provider   | Gambar | Video | Musik | TTS | STT / Transkripsi | Pemahaman Media |
| ---------- | ------ | ----- | ----- | --- | ----------------- | --------------- |
| Alibaba    |        | Ya    |       |     |                   |                 |
| BytePlus   |        | Ya    |       |     |                   |                 |
| ComfyUI    | Ya     | Ya    | Ya    |     |                   |                 |
| Deepgram   |        |       |       |     | Ya                |                 |
| ElevenLabs |        |       |       | Ya  |                   |                 |
| fal        | Ya     | Ya    |       |     |                   |                 |
| Google     | Ya     | Ya    | Ya    |     |                   | Ya              |
| Microsoft  |        |       |       | Ya  |                   |                 |
| MiniMax    | Ya     | Ya    | Ya    | Ya  |                   |                 |
| OpenAI     | Ya     | Ya    |       | Ya  | Ya                | Ya              |
| Qwen       |        | Ya    |       |     |                   |                 |
| Runway     |        | Ya    |       |     |                   |                 |
| Together   |        | Ya    |       |     |                   |                 |
| Vydra      | Ya     | Ya    |       |     |                   |                 |
| xAI        |        | Ya    |       |     |                   |                 |

<Note>
Pemahaman media menggunakan model apa pun yang mendukung vision atau audio yang terdaftar dalam config provider Anda. Tabel di atas menyoroti provider dengan dukungan pemahaman media khusus; sebagian besar provider LLM dengan model multimodal (Anthropic, Google, OpenAI, dll.) juga dapat memahami media masuk ketika dikonfigurasi sebagai model balasan aktif.
</Note>

## Cara kerja pembuatan asinkron

Pembuatan video dan musik berjalan sebagai tugas latar belakang karena pemrosesan provider biasanya memerlukan 30 detik hingga beberapa menit. Saat agen memanggil `video_generate` atau `music_generate`, OpenClaw mengirim permintaan ke provider, segera mengembalikan ID tugas, dan melacak pekerjaan di ledger tugas. Agen tetap dapat merespons pesan lain saat pekerjaan berjalan. Saat provider selesai, OpenClaw membangunkan agen agar dapat memposting media yang sudah selesai kembali ke channel asal. Pembuatan gambar dan TTS bersifat sinkron dan selesai inline bersama balasan.

## Tautan cepat

- [Image Generation](/id/tools/image-generation) -- membuat dan mengedit gambar
- [Video Generation](/id/tools/video-generation) -- teks-ke-video, gambar-ke-video, dan video-ke-video
- [Music Generation](/id/tools/music-generation) -- membuat musik dan trek audio
- [Text-to-Speech](/id/tools/tts) -- mengubah balasan menjadi audio yang diucapkan
- [Media Understanding](/id/nodes/media-understanding) -- memahami gambar, audio, dan video masuk
