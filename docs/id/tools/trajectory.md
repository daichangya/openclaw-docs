---
read_when:
    - Men-debug mengapa agen menjawab, gagal, atau memanggil alat dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, pemanggilan alat, kesalahan runtime, atau metadata penggunaan
    - Menonaktifkan atau memindahkan penangkapan trajectory
summary: Ekspor bundel trajectory yang disunting untuk debugging sesi agen OpenClaw
title: Bundel Trajectory
x-i18n:
    generated_at: "2026-04-23T09:29:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Bundel Trajectory

Penangkapan trajectory adalah perekam penerbangan per sesi milik OpenClaw. Fitur ini mencatat timeline terstruktur untuk setiap eksekusi agen, lalu `/export-trajectory` mengemas sesi saat ini menjadi bundel dukungan yang telah disunting.

Gunakan ini saat Anda perlu menjawab pertanyaan seperti:

- Prompt, system prompt, dan alat apa yang dikirim ke model?
- Pesan transkrip dan pemanggilan alat mana yang menghasilkan jawaban ini?
- Apakah eksekusi mengalami timeout, abort, Compaction, atau kesalahan provider?
- Model, Plugins, Skills, dan pengaturan runtime apa yang aktif?
- Metadata penggunaan dan prompt-cache apa yang dikembalikan provider?

## Mulai cepat

Kirim ini di sesi aktif:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw menulis bundel di bawah workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Anda dapat memilih nama direktori output relatif:

```text
/export-trajectory bug-1234
```

Path kustom diselesaikan di dalam `.openclaw/trajectory-exports/`. Path absolut
dan path `~` ditolak.

## Akses

Ekspor trajectory adalah perintah pemilik. Pengirim harus lulus pemeriksaan
otorisasi perintah normal dan pemeriksaan pemilik untuk saluran tersebut.

## Apa yang direkam

Penangkapan trajectory aktif secara default untuk eksekusi agen OpenClaw.

Peristiwa runtime meliputi:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Peristiwa transkrip juga direkonstruksi dari cabang sesi aktif:

- pesan pengguna
- pesan asisten
- pemanggilan alat
- hasil alat
- Compaction
- perubahan model
- label dan entri sesi kustom

Peristiwa ditulis sebagai JSON Lines dengan penanda schema ini:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File bundel

Bundel yang diekspor dapat berisi:

| File                  | Isi                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema bundel, file sumber, jumlah peristiwa, dan daftar file yang dihasilkan               |
| `events.jsonl`        | Timeline runtime dan transkrip berurutan                                                     |
| `session-branch.json` | Cabang transkrip aktif yang telah disunting dan header sesi                                  |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot config, Plugins, Skills, dan metadata prompt     |
| `artifacts.json`      | Status akhir, kesalahan, penggunaan, prompt cache, jumlah Compaction, teks asisten, dan metadata alat |
| `prompts.json`        | Prompt yang dikirim dan detail build prompt yang dipilih                                     |
| `system-prompt.txt`   | System prompt terkompilasi terbaru, saat ditangkap                                           |
| `tools.json`          | Definisi alat yang dikirim ke model, saat ditangkap                                          |

`manifest.json` mencantumkan file yang ada dalam bundel tersebut. Beberapa file dihilangkan
jika sesi tidak menangkap data runtime yang sesuai.

## Lokasi penangkapan

Secara default, peristiwa trajectory runtime ditulis di sebelah file sesi:

```text
<session>.trajectory.jsonl
```

OpenClaw juga menulis file pointer best-effort di sebelah sesi:

```text
<session>.trajectory-path.json
```

Atur `OPENCLAW_TRAJECTORY_DIR` untuk menyimpan sidecar trajectory runtime di
direktori khusus:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Saat variabel ini diatur, OpenClaw menulis satu file JSONL per ID sesi di direktori tersebut.

## Nonaktifkan penangkapan

Atur `OPENCLAW_TRAJECTORY=0` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan penangkapan trajectory runtime. `/export-trajectory` tetap dapat mengekspor
cabang transkrip, tetapi file khusus runtime seperti konteks terkompilasi,
artefak provider, dan metadata prompt mungkin hilang.

## Privasi dan batas

Bundel trajectory dirancang untuk dukungan dan debugging, bukan untuk diposting secara publik.
OpenClaw menyunting nilai sensitif sebelum menulis file ekspor:

- kredensial dan field payload mirip secret yang dikenal
- data gambar
- path status lokal
- path workspace, diganti dengan `$WORKSPACE_DIR`
- path direktori home, saat terdeteksi

Eksportir juga membatasi ukuran input:

- file sidecar runtime: 50 MiB
- file sesi: 50 MiB
- peristiwa runtime: 200.000
- total peristiwa yang diekspor: 250.000
- baris peristiwa runtime individual dipotong di atas 256 KiB

Tinjau bundel sebelum membagikannya di luar tim Anda. Penyuntingan bersifat best-effort
dan tidak dapat mengetahui setiap secret yang spesifik aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki peristiwa runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- periksa apakah `OPENCLAW_TRAJECTORY_DIR` menunjuk ke direktori yang dapat ditulis
- jalankan satu pesan lagi di sesi tersebut, lalu ekspor lagi
- periksa `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak path output:

- gunakan nama relatif seperti `bug-1234`
- jangan berikan `/tmp/...` atau `~/...`
- pertahankan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal dengan kesalahan ukuran, sesi atau sidecar telah melampaui
batas keamanan ekspor. Mulai sesi baru atau ekspor reproduksi yang lebih kecil.
