---
read_when:
    - Anda sedang men-debug penolakan permintaan provider yang terkait dengan bentuk transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan tool-call
    - Anda sedang menyelidiki ketidakcocokan id tool-call di berbagai provider
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus provider'
title: Kebersihan Transkrip
x-i18n:
    generated_at: "2026-04-23T09:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Kebersihan Transkrip (Perbaikan Provider)

Dokumen ini menjelaskan **perbaikan khusus provider** yang diterapkan pada transkrip sebelum sebuah run
(membangun konteks model). Ini adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi
persyaratan provider yang ketat. Langkah kebersihan ini **tidak** menulis ulang transkrip JSONL tersimpan
di disk; namun, pass perbaikan file sesi yang terpisah dapat menulis ulang file JSONL yang malformed
dengan membuang baris yang tidak valid sebelum sesi dimuat. Saat perbaikan terjadi, file asli
dicadangkan di samping file sesi.

Cakupan meliputi:

- Sanitasi id tool call
- Validasi input tool call
- Perbaikan pairing hasil alat
- Validasi / pengurutan giliran
- Pembersihan signature thought
- Sanitasi payload gambar
- Penandaan provenance input pengguna (untuk prompt yang dirutekan antar-sesi)

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [/reference/session-management-compaction](/id/reference/session-management-compaction)

---

## Tempat ini berjalan

Semua kebersihan transkrip dipusatkan di embedded runner:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang akan diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika perlu) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (embedded runner)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan sisi provider akibat batas ukuran
(downscale/recompress gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model yang mampu vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi maksimum gambar dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).

---

## Aturan global: tool call malformed

Blok tool-call asisten yang tidak memiliki `input` dan `arguments` akan dibuang
sebelum konteks model dibangun. Ini mencegah penolakan provider dari tool call yang
tersimpan sebagian (misalnya, setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` pada `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: provenance input antar-sesi

Saat sebuah agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah reply/announce agen-ke-agen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

Metadata ini ditulis pada saat append transkrip dan tidak mengubah role
(`role: "user"` tetap dipertahankan demi kompatibilitas provider). Pembaca transkrip dapat menggunakan
ini untuk menghindari memperlakukan prompt internal yang dirutekan sebagai instruksi yang ditulis oleh pengguna akhir.

Selama pembangunan ulang konteks, OpenClaw juga menambahkan marker singkat `[Inter-session message]`
ke giliran pengguna tersebut di dalam memori agar model dapat membedakannya dari
instruksi pengguna akhir eksternal.

---

## Matriks provider (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang signature reasoning yatim (item reasoning mandiri tanpa blok konten sesudahnya) untuk transkrip OpenAI Responses/Codex.
- Tidak ada sanitasi id tool call.
- Tidak ada perbaikan pairing hasil alat.
- Tidak ada validasi atau pengurutan ulang giliran.
- Tidak ada hasil alat sintetis.
- Tidak ada penghapusan signature thought.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id tool call: alfanumerik ketat.
- Perbaikan pairing hasil alat dan hasil alat sintetis.
- Validasi giliran (alternasi giliran gaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan signature thinking; buang blok thinking tanpa signature.

**Anthropic / Minimax (kompatibel Anthropic)**

- Perbaikan pairing hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna berurutan agar memenuhi alternasi ketat).

**Mistral (termasuk deteksi berbasis id model)**

- Sanitasi id tool call: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan signature thought: hapus nilai `thought_signature` yang bukan base64 (pertahankan yang base64).

**Semua yang lain**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pairing penggunaan/hasil alat.
  - Menyanitasi id tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus provider, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan provider, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Membuang giliran error asisten yang kosong.
  - Memangkas konten asisten setelah tool call.

Kompleksitas ini menyebabkan regresi lintas provider (terutama pairing
`call_id|fc_id` pada `openai-responses`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan
logika di runner, dan membuat OpenAI **tanpa sentuhan** selain sanitasi gambar.
