---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang otomasi capability tanpa kepala yang stabil
summary: CLI infer-first untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung provider
title: CLI inferensi
x-i18n:
    generated_at: "2026-04-25T13:43:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` adalah permukaan headless kanonis untuk alur kerja inferensi yang didukung provider.

Perintah ini sengaja mengekspos keluarga capability, bukan nama RPC gateway mentah dan bukan id tool agen mentah.

## Ubah infer menjadi skill

Salin dan tempel ini ke agen:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill berbasis infer yang baik seharusnya:

- memetakan intent pengguna yang umum ke subperintah infer yang benar
- menyertakan beberapa contoh infer kanonis untuk alur kerja yang dicakup
- lebih memilih `openclaw infer ...` dalam contoh dan saran
- menghindari mendokumentasikan ulang seluruh permukaan infer di dalam isi skill

Cakupan skill yang biasanya berfokus pada infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Mengapa menggunakan infer

`openclaw infer` menyediakan satu CLI yang konsisten untuk tugas inferensi yang didukung provider di dalam OpenClaw.

Manfaat:

- Gunakan provider dan model yang sudah dikonfigurasi di OpenClaw alih-alih merangkai wrapper satu kali untuk tiap backend.
- Simpan alur kerja model, gambar, transkripsi audio, TTS, video, web, dan embedding di bawah satu pohon perintah.
- Gunakan bentuk output `--json` yang stabil untuk skrip, otomasi, dan alur kerja yang digerakkan agen.
- Pilih permukaan OpenClaw pihak pertama saat tugasnya pada dasarnya adalah "menjalankan inferensi."
- Gunakan jalur lokal normal tanpa memerlukan gateway untuk sebagian besar perintah infer.

Untuk pemeriksaan provider end-to-end, pilih `openclaw infer ...` setelah pengujian provider tingkat lebih rendah sudah hijau. Ini menguji CLI yang dirilis, pemuatan config, resolusi agen default, aktivasi Plugin bawaan, perbaikan dependensi runtime, dan runtime capability bersama sebelum permintaan provider dibuat.

## Pohon perintah

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tugas umum

Tabel ini memetakan tugas inferensi umum ke perintah infer yang sesuai.

| Tugas                   | Perintah                                                               | Catatan                                               |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Jalankan prompt teks/model | `openclaw infer model run --prompt "..." --json`                    | Menggunakan jalur lokal normal secara default         |
| Buat gambar             | `openclaw infer image generate --prompt "..." --json`                  | Gunakan `image edit` saat memulai dari file yang sudah ada |
| Deskripsikan file gambar | `openclaw infer image describe --file ./image.png --json`             | `--model` harus berupa `<provider/model>` yang mendukung gambar |
| Transkripsikan audio    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` harus berupa `<provider/model>`             |
| Sintesis ucapan         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` berorientasi gateway                     |
| Buat video              | `openclaw infer video generate --prompt "..." --json`                  | Mendukung petunjuk provider seperti `--resolution`    |
| Deskripsikan file video | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` harus berupa `<provider/model>`             |
| Cari di web             | `openclaw infer web search --query "..." --json`                       |                                                       |
| Ambil halaman web       | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Buat embedding          | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Perilaku

- `openclaw infer ...` adalah permukaan CLI utama untuk alur kerja ini.
- Gunakan `--json` saat output akan dikonsumsi oleh perintah atau skrip lain.
- Gunakan `--provider` atau `--model provider/model` saat backend tertentu diperlukan.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan bentuk `<provider/model>`.
- Untuk `image describe`, `--model` eksplisit menjalankan provider/model tersebut secara langsung. Model harus mendukung gambar di katalog model atau config provider. `codex/<model>` menjalankan giliran pemahaman gambar server aplikasi Codex yang dibatasi; `openai-codex/<model>` menggunakan jalur provider OAuth OpenAI Codex.
- Perintah eksekusi stateless default ke lokal.
- Perintah status yang dikelola gateway default ke gateway.
- Jalur lokal normal tidak memerlukan gateway untuk berjalan.
- `model run` adalah one-shot. Server MCP yang dibuka melalui runtime agen untuk perintah itu akan dihentikan setelah balasan untuk eksekusi lokal maupun `--gateway`, sehingga pemanggilan skrip berulang tidak membuat proses anak stdio MCP tetap hidup.

## Model

Gunakan `model` untuk inferensi teks yang didukung provider dan inspeksi model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Catatan:

- `model run` menggunakan ulang runtime agen sehingga override provider/model berperilaku seperti eksekusi agen normal.
- Karena `model run` ditujukan untuk otomasi headless, perintah ini tidak mempertahankan runtime MCP bawaan per sesi setelah perintah selesai.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola status auth provider yang tersimpan.

## Gambar

Gunakan `image` untuk pembuatan, pengeditan, dan deskripsi.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Catatan:

- Gunakan `image edit` saat memulai dari file input yang sudah ada.
- Gunakan `image providers --json` untuk memverifikasi provider gambar bawaan mana yang dapat ditemukan, dikonfigurasi, dipilih, dan capability generate/edit apa yang diekspos tiap provider.
- Gunakan `image generate --model <provider/model> --json` sebagai smoke CLI live yang paling sempit untuk perubahan pembuatan gambar. Contoh:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Respons JSON melaporkan `ok`, `provider`, `model`, `attempts`, dan path output yang ditulis. Saat `--output` diatur, ekstensi akhir dapat mengikuti tipe MIME yang dikembalikan provider.

- Untuk `image describe`, `--model` harus berupa `<provider/model>` yang mendukung gambar.
- Untuk model vision Ollama lokal, tarik model terlebih dahulu dan atur `OLLAMA_API_KEY` ke nilai placeholder apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Gunakan `audio` untuk transkripsi file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Catatan:

- `audio transcribe` untuk transkripsi file, bukan manajemen sesi realtime.
- `--model` harus berupa `<provider/model>`.

## TTS

Gunakan `tts` untuk sintesis ucapan dan status provider TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Catatan:

- `tts status` default ke gateway karena mencerminkan status TTS yang dikelola gateway.
- Gunakan `tts providers`, `tts voices`, dan `tts set-provider` untuk memeriksa dan mengonfigurasi perilaku TTS.

## Video

Gunakan `video` untuk pembuatan dan deskripsi.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Catatan:

- `video generate` menerima `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, dan `--timeout-ms` lalu meneruskannya ke runtime pembuatan video.
- `--model` harus berupa `<provider/model>` untuk `video describe`.

## Web

Gunakan `web` untuk alur kerja pencarian dan pengambilan.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Catatan:

- Gunakan `web providers` untuk memeriksa provider yang tersedia, dikonfigurasi, dan dipilih.

## Embedding

Gunakan `embedding` untuk pembuatan vektor dan inspeksi provider embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

Perintah infer menormalkan output JSON di bawah envelope bersama:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Field tingkat atas bersifat stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Untuk perintah media yang dihasilkan, `outputs` berisi file yang ditulis oleh OpenClaw. Gunakan `path`, `mimeType`, `size`, dan dimensi khusus media apa pun dalam array itu untuk otomasi alih-alih mem-parse stdout yang dapat dibaca manusia.

## Jebakan umum

```bash
# Buruk
openclaw infer media image generate --prompt "friendly lobster"

# Baik
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Buruk
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Baik
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Catatan

- `openclaw capability ...` adalah alias untuk `openclaw infer ...`.

## Terkait

- [Referensi CLI](/id/cli)
- [Models](/id/concepts/models)
