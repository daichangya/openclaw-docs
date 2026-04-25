---
read_when:
    - Anda sedang men-debug penolakan permintaan penyedia yang terkait dengan bentuk transkrip
    - Anda sedang mengubah logika sanitasi transkrip atau perbaikan tool-call
    - Anda sedang menyelidiki ketidakcocokan ID tool-call di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Higiene transkrip
x-i18n:
    generated_at: "2026-04-25T13:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Dokumen ini menjelaskan **perbaikan khusus penyedia** yang diterapkan pada transkrip sebelum suatu run
(membangun konteks model). Ini adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi
persyaratan penyedia yang ketat. Langkah-langkah higiene ini **tidak** menulis ulang transkrip JSONL yang disimpan
di disk; namun, pass perbaikan file sesi yang terpisah dapat menulis ulang file JSONL yang malformed
dengan membuang baris yang tidak valid sebelum sesi dimuat. Saat perbaikan terjadi, file asli
dicadangkan di samping file sesi.

Cakupannya meliputi:

- Konteks prompt khusus runtime yang tetap berada di luar giliran transkrip yang terlihat oleh pengguna
- Sanitasi ID tool call
- Validasi input tool call
- Perbaikan pemasangan tool result
- Validasi / pengurutan giliran
- Pembersihan thought signature
- Sanitasi payload gambar
- Penandaan provenance input pengguna (untuk prompt yang dirutekan antar-sesi)

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk suatu giliran, tetapi itu
bukan konten yang dibuat oleh pengguna akhir. OpenClaw mempertahankan
body prompt yang menghadap transkrip secara terpisah untuk balasan Gateway, followup yang diantrekan, ACP, CLI, dan run Pi tersemat. Giliran pengguna terlihat yang disimpan menggunakan body transkrip tersebut alih-alih
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan wrapper runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Tempat ini dijalankan

Semua higiene transkrip dipusatkan di runner tersemat:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari higiene transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tersemat)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia karena
batas ukuran (perkecil/kompres ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang didorong oleh gambar untuk model yang mendukung vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).

---

## Aturan global: tool call yang malformed

Blok tool-call asisten yang tidak memiliki `input` maupun `arguments` dibuang
sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari tool call
yang tersimpan sebagian (misalnya, setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` dalam `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: provenance input antar-sesi

Saat suatu agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balasan/pengumuman agent-to-agent), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

Metadata ini ditulis pada saat append transkrip dan tidak mengubah role
(`role: "user"` tetap untuk kompatibilitas penyedia). Pembaca transkrip dapat menggunakan
ini untuk menghindari memperlakukan prompt internal yang dirutekan sebagai instruksi yang dibuat oleh pengguna akhir.

Selama pembangunan ulang konteks, OpenClaw juga menambahkan marker singkat `[Inter-session message]`
ke awal giliran pengguna tersebut di dalam memori agar model dapat membedakannya dari
instruksi pengguna akhir eksternal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang reasoning signature yatim piatu (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan buang reasoning OpenAI yang dapat diputar ulang setelah perpindahan rute model.
- Tidak ada sanitasi ID tool call.
- Perbaikan pemasangan tool result dapat memindahkan output cocok nyata dan mensintesis output `aborted` bergaya Codex untuk tool call yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Output tool keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar cocok dengan normalisasi replay Codex.
- Tidak ada penghapusan thought signature.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi ID tool call: alfanumerik ketat.
- Perbaikan pemasangan tool result dan tool result sintetis.
- Validasi giliran (pergiliran giliran bergaya Gemini).
- Perbaikan pengurutan giliran Google (menambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan thinking signature; buang blok thinking tanpa signature.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan tool result dan tool result sintetis.
- Validasi giliran (gabungkan giliran pengguna yang berurutan untuk memenuhi pergiliran yang ketat).

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi ID tool call: strict9 (alfanumerik dengan panjang 9).

**OpenRouter Gemini**

- Pembersihan thought signature: hapus nilai `thought_signature` yang bukan base64 (pertahankan base64).

**Yang lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan higiene transkrip:

- Sebuah **ekstensi transcript-sanitize** dijalankan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan tool use/result.
  - Menyanitasi ID tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menggandakan pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum penyimpanan.
  - Membuang giliran error asisten yang kosong.
  - Memangkas konten asisten setelah tool call.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan `openai-responses`
`call_id|fc_id`). Pembersihan 2026.1.22 menghapus ekstensi, memusatkan
logika di runner, dan menjadikan OpenAI **tanpa sentuhan** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
