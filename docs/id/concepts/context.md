---
read_when:
    - Anda ingin memahami apa arti “konteks” di OpenClaw
    - Anda sedang men-debug mengapa model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-04-07T09:13:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Konteks

“Konteks” adalah **segala sesuatu yang dikirim OpenClaw ke model untuk suatu proses**. Konteks dibatasi oleh **jendela konteks** model (batas token).

Model mental untuk pemula:

- **System prompt** (dibangun OpenClaw): aturan, alat, daftar Skills, waktu/runtime, dan file workspace yang disuntikkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Panggilan/hasil alat + lampiran**: output perintah, pembacaan file, gambar/audio, dan sebagainya.

Konteks _tidak sama_ dengan “memori”: memori dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (memeriksa konteks)

- `/status` → tampilan cepat “seberapa penuh jendela saya?” + pengaturan sesi.
- `/context list` → apa yang disuntikkan + perkiraan ukuran (per file + total).
- `/context detail` → rincian lebih dalam: ukuran per file, ukuran skema per alat, ukuran entri per skill, dan ukuran system prompt.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → ringkas riwayat lama menjadi entri ringkas untuk membebaskan ruang jendela.

Lihat juga: [Perintah slash](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Pemadatan](/id/concepts/compaction).

## Contoh output

Nilai bervariasi menurut model, penyedia, kebijakan alat, dan apa yang ada di workspace Anda.

### `/context list`

```
🧠 Rincian konteks
Workspace: <workspaceDir>
Bootstrap maks/file: 20,000 karakter
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 karakter (~9,603 token) (Project Context 23,901 karakter (~5,976 token))

File workspace yang disuntikkan:
- AGENTS.md: OK | mentah 1,742 karakter (~436 token) | disuntikkan 1,742 karakter (~436 token)
- SOUL.md: OK | mentah 912 karakter (~228 token) | disuntikkan 912 karakter (~228 token)
- TOOLS.md: TRUNCATED | mentah 54,210 karakter (~13,553 token) | disuntikkan 20,962 karakter (~5,241 token)
- IDENTITY.md: OK | mentah 211 karakter (~53 token) | disuntikkan 211 karakter (~53 token)
- USER.md: OK | mentah 388 karakter (~97 token) | disuntikkan 388 karakter (~97 token)
- HEARTBEAT.md: MISSING | mentah 0 | disuntikkan 0
- BOOTSTRAP.md: OK | mentah 0 karakter (~0 token) | disuntikkan 0 karakter (~0 token)

Daftar skills (teks system prompt): 2,184 karakter (~546 token) (12 skills)
Alat: read, edit, write, exec, process, browser, message, sessions_send, …
Daftar alat (teks system prompt): 1,032 karakter (~258 token)
Skema alat (JSON): 31,988 karakter (~7,997 token) (dihitung dalam konteks; tidak ditampilkan sebagai teks)
Alat: (sama seperti di atas)

Token sesi (di-cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Rincian konteks (detail)
…
Skills teratas (ukuran entri prompt):
- frontend-design: 412 karakter (~103 token)
- oracle: 401 karakter (~101 token)
… (+10 skill lainnya)

Alat teratas (ukuran skema):
- browser: 9,812 karakter (~2,453 token)
- exec: 6,240 karakter (~1,560 token)
… (+N alat lainnya)
```

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung, termasuk:

- System prompt (semua bagian).
- Riwayat percakapan.
- Panggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan pemadatan dan artefak pruning.
- “Wrapper” penyedia atau header tersembunyi (tidak terlihat, tetap dihitung).

## Cara OpenClaw membangun system prompt

System prompt adalah milik **OpenClaw** dan dibangun ulang di setiap proses. Isinya meliputi:

- Daftar alat + deskripsi singkat.
- Daftar Skills (metadata saja; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang disuntikkan di bawah **Project Context**.

Rincian lengkap: [System Prompt](/id/concepts/system-prompt).

## File workspace yang disuntikkan (Project Context)

Secara default, OpenClaw menyuntikkan sekumpulan file workspace tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya saat pertama kali dijalankan)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `20000` karakter). OpenClaw juga menerapkan batas total injeksi bootstrap di seluruh file dengan `agents.defaults.bootstrapTotalMaxChars` (default `150000` karakter). `/context` menampilkan ukuran **mentah vs disuntikkan** dan apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menyuntikkan blok peringatan di dalam prompt di bawah Project Context. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: disuntikkan vs dimuat sesuai kebutuhan

System prompt menyertakan **daftar skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan melakukan `read` pada `SKILL.md` milik skill **hanya saat diperlukan**.

## Tools: ada dua biaya

Alat memengaruhi konteks dengan dua cara:

1. **Teks daftar alat** dalam system prompt (yang Anda lihat sebagai “Tooling”).
2. **Skema alat** (JSON). Ini dikirim ke model agar model dapat memanggil alat. Semuanya dihitung dalam konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` merinci skema alat terbesar sehingga Anda dapat melihat apa yang paling mendominasi.

## Perintah, directive, dan "shortcut inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku yang berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Directive**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi directive akan mempertahankan pengaturan sesi.
  - Directive inline di dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Shortcut inline** (hanya pengirim yang diizinkan): token `/...` tertentu di dalam pesan normal dapat langsung dijalankan (contoh: “hey /status”), dan dihapus sebelum model melihat sisa teks.

Detail: [Perintah slash](/id/tools/slash-commands).

## Sesi, pemadatan, dan pruning (apa yang dipertahankan)

Apa yang dipertahankan di antara pesan bergantung pada mekanismenya:

- **Riwayat normal** dipertahankan dalam transkrip sesi sampai dipadatkan/dipruning oleh kebijakan.
- **Pemadatan** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pruning** menghapus hasil alat lama dari prompt _dalam memori_ untuk suatu proses, tetapi tidak menulis ulang transkrip.

Dokumentasi: [Sesi](/id/concepts/session), [Pemadatan](/id/concepts/compaction), [Pruning sesi](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks bawaan `legacy` untuk perakitan dan
pemadatan. Jika Anda memasang plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw akan mendelegasikan perakitan konteks,
`/compact`, dan hook siklus hidup konteks subagent terkait ke
mesin tersebut. `ownsCompaction: false` tidak otomatis fallback ke mesin
legacy; mesin aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Context Engine](/id/concepts/context-engine) untuk
antarmuka pluggable lengkap, hook siklus hidup, dan konfigurasinya.

## Apa yang sebenarnya dilaporkan `/context`

`/context` lebih memilih laporan system prompt **yang dibangun saat proses** terbaru jika tersedia:

- `System prompt (run)` = diambil dari proses embedded terakhir (mampu menggunakan alat) dan dipertahankan di session store.
- `System prompt (estimate)` = dihitung secara dinamis saat tidak ada laporan proses (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan).

Apa pun caranya, perintah ini melaporkan ukuran dan kontributor teratas; perintah ini **tidak** membuang seluruh system prompt atau skema alat.

## Terkait

- [Context Engine](/id/concepts/context-engine) — injeksi konteks kustom melalui plugin
- [Pemadatan](/id/concepts/compaction) — meringkas percakapan panjang
- [System Prompt](/id/concepts/system-prompt) — cara system prompt dibangun
- [Loop Agent](/id/concepts/agent-loop) — siklus eksekusi agent lengkap
