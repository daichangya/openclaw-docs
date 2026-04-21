---
read_when:
    - Mengedit teks system prompt, daftar tool, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap workspace atau penyuntikan Skills
summary: Apa saja yang terkandung dalam system prompt OpenClaw dan bagaimana prompt tersebut disusun
title: System Prompt
x-i18n:
    generated_at: "2026-04-21T09:17:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw membangun system prompt kustom untuk setiap agent run. Prompt ini **dimiliki OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirakit oleh OpenClaw dan disuntikkan ke setiap agent run.

Plugin provider dapat menyumbangkan panduan prompt yang sadar cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyuntikkan **stable prefix** di atas batas cache prompt
- menyuntikkan **dynamic suffix** di bawah batas cache prompt

Gunakan kontribusi milik provider untuk penyesuaian spesifik keluarga model. Pertahankan
mutasi prompt lama `before_prompt_build` demi kompatibilitas atau perubahan prompt yang benar-benar global, bukan perilaku provider normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan spesifik model untuk persona latching, keluaran ringkas, disiplin tool,
lookup paralel, cakupan deliverable, verifikasi, konteks yang hilang, dan
kebersihan tool terminal.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source of truth structured-tool plus panduan penggunaan tool saat runtime.
- **Execution Bias**: panduan tindak lanjut yang ringkas: bertindak dalam giliran
  yang sama atas permintaan yang dapat ditindaklanjuti, lanjutkan hingga selesai atau terhambat, pulihkan dari hasil tool yang lemah,
  periksa state yang dapat berubah secara langsung, dan verifikasi sebelum finalisasi.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (bila tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa config dengan aman menggunakan
  `config.schema.lookup`, menambal config dengan `config.patch`, mengganti seluruh
  config dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan
  pengguna yang eksplisit. Tool `gateway` khusus pemilik juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec terlindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan file bootstrap disertakan di bawah.
- **Sandbox** (bila diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec dengan hak lebih tinggi tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat Heartbeat diaktifkan untuk agen default.
- **Runtime**: host, OS, node, root repo (bila terdeteksi), tingkat thinking (satu baris).
- **Reasoning**: tingkat visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- ketika automatic completion wake diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah itu menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi ketika Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, pilih `sessions_spawn`; penyelesaian subagen berbasis
  push dan otomatis diumumkan kembali ke peminta
- jangan mem-poll `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Ketika tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, mempertahankan tepat satu
langkah `in_progress`, dan menghindari mengulang seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam system prompt bersifat anjuran. Mereka memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist channel untuk penegakan keras; operator dapat menonaktifkannya sesuai desain.

Pada channel dengan kartu/tombol persetujuan native, prompt runtime sekarang memberi tahu
agen untuk mengandalkan UI persetujuan native itu terlebih dahulu. Agen hanya boleh menyertakan perintah manual
`/approve` ketika hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender system prompt yang lebih kecil untuk subagen. Runtime menetapkan
`promptMode` untuk setiap run (bukan config yang terlihat pengguna):

- `full` (default): mencakup semua bagian di atas.
- `minimal`: digunakan untuk subagen; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (bila diketahui), Runtime, dan konteks
  yang disuntikkan tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Ketika `promptMode=minimal`, prompt tambahan yang disuntikkan diberi label **Subagent
Context** alih-alih **Group Chat Context**.

## Penyuntikan bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Project Context** agar model melihat konteks identitas dan profil tanpa perlu membaca secara eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` jika ada, jika tidak `memory.md` sebagai fallback huruf kecil

Semua file ini **disuntikkan ke dalam jendela konteks** pada setiap giliran kecuali
berlaku gate khusus file. `HEARTBEAT.md` dihilangkan pada run normal ketika
Heartbeat dinonaktifkan untuk agen default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disuntikkan
tetap ringkas — terutama `MEMORY.md`, yang dapat membesar seiring waktu dan menyebabkan
penggunaan konteks yang tak terduga tinggi serta Compaction lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa, file tersebut diakses sesuai kebutuhan melalui
> tool `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> jendela konteks kecuali model membacanya secara eksplisit. Giliran `/new` dan
> `/reset` tanpa tambahan adalah pengecualian: runtime dapat menambahkan memory harian terbaru di awal
> sebagai blok konteks startup sekali pakai untuk giliran pertama itu.

File besar dipotong dengan marker. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disuntikkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyuntikkan marker file hilang singkat. Ketika pemotongan
terjadi, OpenClaw dapat menyuntikkan blok peringatan di Project Context; kontrol ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi subagen hanya menyuntikkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
disaring agar konteks subagen tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk mengubah atau mengganti
file bootstrap yang disuntikkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin membuat agen terdengar kurang generik, mulai dengan
[SOUL.md Personality Guide](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi tiap file yang disuntikkan (mentah vs disuntikkan, pemotongan, plus overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

System prompt mencakup bagian **Current Date & Time** khusus ketika
zona waktu pengguna diketahui. Untuk menjaga prompt tetap stabil terhadap cache, sekarang prompt hanya mencakup
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agen memerlukan waktu saat ini; kartu status
mencakup baris stempel waktu. Tool yang sama juga dapat secara opsional menetapkan override model
per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/id/date-time) untuk detail perilaku lengkap.

## Skills

Ketika ada skill yang memenuhi syarat, OpenClaw menyuntikkan **daftar skill yang tersedia**
secara ringkas (`formatSkillsForPrompt`) yang mencakup **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang terdaftar
(workspace, terkelola, atau bawaan). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan environment/config runtime,
dan allowlist skill agen yang efektif ketika `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Ini menjaga prompt dasar tetap kecil sambil tetap memungkinkan penggunaan skill yang terarah.

Anggaran daftar skill dimiliki oleh subsistem skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agen: `agents.list[].skillsLimits.maxSkillsPromptChars`

Kutipan runtime generik yang dibatasi menggunakan surface berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran skills terpisah dari ukuran baca/penyuntikan runtime seperti
`memory_get`, hasil tool langsung, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

Ketika tersedia, system prompt mencakup bagian **Documentation** yang menunjuk ke
direktori dokumentasi OpenClaw lokal (`docs/` di workspace repo atau dokumentasi paket npm
yang dibundel) dan juga mencatat mirror publik, repo sumber, Discord komunitas, dan
ClawHub ([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skills. Prompt menginstruksikan model untuk berkonsultasi dengan dokumentasi lokal terlebih dahulu
untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk menjalankan
`openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna ketika tidak memiliki akses).
