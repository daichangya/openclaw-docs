---
read_when:
    - Mengedit teks system prompt, daftar tool, atau bagian waktu/Heartbeat
    - Mengubah perilaku bootstrap workspace atau injeksi Skills
summary: Apa saja isi system prompt OpenClaw dan bagaimana prompt itu dirangkai
title: System prompt
x-i18n:
    generated_at: "2026-04-25T13:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw membangun system prompt kustom untuk setiap agent run. Prompt ini **dimiliki oleh OpenClaw** dan tidak menggunakan prompt default pi-coding-agent.

Prompt dirangkai oleh OpenClaw dan disisipkan ke setiap agent run.

Plugin provider dapat menyumbangkan panduan prompt yang sadar-cache tanpa mengganti
seluruh prompt milik OpenClaw. Runtime provider dapat:

- mengganti sekumpulan kecil bagian inti bernama (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- menyisipkan **prefix stabil** di atas batas cache prompt
- menyisipkan **suffix dinamis** di bawah batas cache prompt

Gunakan kontribusi milik provider untuk penyesuaian khusus keluarga model. Pertahankan
mutasi prompt `before_prompt_build` lama untuk kompatibilitas atau perubahan prompt yang benar-benar global, bukan perilaku provider normal.

Overlay keluarga OpenAI GPT-5 menjaga aturan eksekusi inti tetap kecil dan menambahkan
panduan khusus model untuk persona latching, output ringkas, disiplin tool,
lookup paralel, cakupan hasil kerja, verifikasi, konteks yang hilang, dan
kebersihan terminal-tool.

## Struktur

Prompt ini sengaja ringkas dan menggunakan bagian tetap:

- **Tooling**: pengingat source-of-truth tool terstruktur ditambah panduan penggunaan tool saat runtime.
- **Execution Bias**: panduan tindak lanjut yang ringkas: bertindak dalam giliran yang sama pada
  permintaan yang dapat ditindaklanjuti, lanjutkan hingga selesai atau terblokir, pulihkan dari hasil tool yang lemah,
  periksa status yang dapat berubah secara live, dan verifikasi sebelum memfinalkan.
- **Safety**: pengingat guardrail singkat untuk menghindari perilaku mencari kekuasaan atau melewati pengawasan.
- **Skills** (saat tersedia): memberi tahu model cara memuat instruksi skill sesuai kebutuhan.
- **OpenClaw Self-Update**: cara memeriksa konfigurasi dengan aman menggunakan
  `config.schema.lookup`, menambal konfigurasi dengan `config.patch`, mengganti seluruh
  konfigurasi dengan `config.apply`, dan menjalankan `update.run` hanya atas permintaan eksplisit pengguna. Tool `gateway` yang hanya untuk owner juga menolak menulis ulang
  `tools.exec.ask` / `tools.exec.security`, termasuk alias lama `tools.bash.*`
  yang dinormalisasi ke path exec yang dilindungi tersebut.
- **Workspace**: direktori kerja (`agents.defaults.workspace`).
- **Documentation**: path lokal ke dokumentasi OpenClaw (repo atau paket npm) dan kapan harus membacanya.
- **Workspace Files (injected)**: menunjukkan bahwa file bootstrap disertakan di bawah.
- **Sandbox** (saat diaktifkan): menunjukkan runtime tersandbox, path sandbox, dan apakah exec terangkat tersedia.
- **Current Date & Time**: waktu lokal pengguna, zona waktu, dan format waktu.
- **Reply Tags**: sintaks tag balasan opsional untuk provider yang didukung.
- **Heartbeats**: prompt Heartbeat dan perilaku ack, saat heartbeat diaktifkan untuk agent default.
- **Runtime**: host, OS, node, model, root repo (saat terdeteksi), level berpikir (satu baris).
- **Reasoning**: level visibilitas saat ini + petunjuk toggle /reasoning.

Bagian Tooling juga mencakup panduan runtime untuk pekerjaan yang berjalan lama:

- gunakan cron untuk tindak lanjut di masa depan (`check back later`, pengingat, pekerjaan berulang)
  alih-alih loop sleep `exec`, trik penundaan `yieldMs`, atau polling `process`
  berulang
- gunakan `exec` / `process` hanya untuk perintah yang mulai sekarang dan terus berjalan
  di latar belakang
- saat wake penyelesaian otomatis diaktifkan, mulai perintah sekali dan andalkan
  jalur wake berbasis push saat perintah menghasilkan output atau gagal
- gunakan `process` untuk log, status, input, atau intervensi saat Anda perlu
  memeriksa perintah yang sedang berjalan
- jika tugas lebih besar, utamakan `sessions_spawn`; penyelesaian sub-agent berbasis
  push dan diumumkan otomatis kembali ke peminta
- jangan polling `subagents list` / `sessions_list` dalam loop hanya untuk menunggu
  penyelesaian

Saat tool eksperimental `update_plan` diaktifkan, Tooling juga memberi tahu
model untuk menggunakannya hanya untuk pekerjaan multi-langkah yang tidak sepele, menjaga tepat satu
langkah `in_progress`, dan menghindari mengulang seluruh rencana setelah setiap pembaruan.

Guardrail Safety dalam system prompt bersifat saran. Guardrail ini memandu perilaku model tetapi tidak menegakkan kebijakan. Gunakan kebijakan tool, persetujuan exec, sandboxing, dan allowlist saluran untuk penegakan keras; operator dapat menonaktifkannya secara sengaja.

Pada saluran dengan kartu/tombol persetujuan native, prompt runtime kini memberi tahu
agent untuk mengandalkan UI persetujuan native tersebut terlebih dahulu. Agent hanya boleh menyertakan
perintah manual `/approve` saat hasil tool mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur.

## Mode prompt

OpenClaw dapat merender system prompt yang lebih kecil untuk sub-agent. Runtime menetapkan
`promptMode` untuk setiap run (bukan konfigurasi yang terlihat oleh pengguna):

- `full` (default): menyertakan semua bagian di atas.
- `minimal`: digunakan untuk sub-agent; menghilangkan **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies**, dan **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (saat diketahui), Runtime, dan konteks yang disisipkan
  tetap tersedia.
- `none`: hanya mengembalikan baris identitas dasar.

Saat `promptMode=minimal`, prompt tambahan yang disisipkan diberi label **Subagent
Context** alih-alih **Group Chat Context**.

## Injeksi bootstrap workspace

File bootstrap dipangkas dan ditambahkan di bawah **Project Context** agar model melihat konteks identitas dan profil tanpa perlu pembacaan eksplisit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya pada workspace yang benar-benar baru)
- `MEMORY.md` saat ada

Semua file ini **disisipkan ke dalam context window** pada setiap giliran kecuali
ada gate khusus per file. `HEARTBEAT.md` dihilangkan pada run normal saat
heartbeat dinonaktifkan untuk agent default atau
`agents.defaults.heartbeat.includeSystemPromptSection` bernilai false. Jaga file yang disisipkan tetap ringkas —
terutama `MEMORY.md`, yang dapat bertambah seiring waktu dan menyebabkan
penggunaan konteks yang tak terduga tinggi serta Compaction yang lebih sering.

> **Catatan:** file harian `memory/*.md` **bukan** bagian dari bootstrap normal
> Project Context. Pada giliran biasa file tersebut diakses sesuai kebutuhan melalui tool
> `memory_search` dan `memory_get`, sehingga tidak dihitung terhadap
> context window kecuali model secara eksplisit membacanya. Giliran `/new` dan
> `/reset` biasa adalah pengecualiannya: runtime dapat menambahkan memori harian terbaru
> sebagai blok konteks startup sekali pakai untuk giliran pertama tersebut.

File besar dipotong dengan penanda. Ukuran maksimum per file dikendalikan oleh
`agents.defaults.bootstrapMaxChars` (default: 12000). Total konten bootstrap yang disisipkan
di seluruh file dibatasi oleh `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). File yang hilang menyisipkan penanda file hilang singkat. Saat pemotongan
terjadi, OpenClaw dapat menyisipkan blok peringatan di Project Context; kendalikan ini dengan
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Sesi sub-agent hanya menyisipkan `AGENTS.md` dan `TOOLS.md` (file bootstrap lain
difilter untuk menjaga konteks sub-agent tetap kecil).

Hook internal dapat mencegat langkah ini melalui `agent:bootstrap` untuk memutasi atau mengganti
file bootstrap yang disisipkan (misalnya menukar `SOUL.md` dengan persona alternatif).

Jika Anda ingin agent terdengar kurang generik, mulai dari
[Panduan Kepribadian SOUL.md](/id/concepts/soul).

Untuk memeriksa seberapa besar kontribusi setiap file yang disisipkan (mentah vs disisipkan, pemotongan, ditambah overhead skema tool), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Penanganan waktu

System prompt menyertakan bagian **Current Date & Time** khusus saat
zona waktu pengguna diketahui. Untuk menjaga cache prompt tetap stabil, kini bagian itu hanya menyertakan
**zona waktu** (tanpa jam dinamis atau format waktu).

Gunakan `session_status` saat agent membutuhkan waktu saat ini; kartu status
menyertakan baris timestamp. Tool yang sama juga dapat secara opsional menetapkan override model
per sesi (`model=default` menghapusnya).

Konfigurasikan dengan:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Lihat [Date & Time](/id/date-time) untuk detail perilaku lengkap.

## Skills

Saat ada skill yang memenuhi syarat, OpenClaw menyisipkan **daftar Skills yang tersedia**
yang ringkas (`formatSkillsForPrompt`) yang menyertakan **path file** untuk setiap skill. Prompt
menginstruksikan model untuk menggunakan `read` guna memuat SKILL.md di lokasi yang tercantum
(workspace, managed, atau bawaan). Jika tidak ada skill yang memenuhi syarat, bagian
Skills dihilangkan.

Kelayakan mencakup gate metadata skill, pemeriksaan lingkungan/konfigurasi runtime,
dan allowlist skill agent yang efektif saat `agents.defaults.skills` atau
`agents.list[].skills` dikonfigurasi.

Skill bawaan Plugin hanya memenuhi syarat saat Plugin pemiliknya diaktifkan.
Ini memungkinkan tool Plugin mengekspos panduan operasional yang lebih dalam tanpa menyisipkan semua
panduan tersebut langsung ke setiap deskripsi tool.

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

Anggaran daftar skill dimiliki oleh subsistem Skills:

- Default global: `skills.limits.maxSkillsPromptChars`
- Override per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Cuplikan runtime terbatas generik menggunakan permukaan yang berbeda:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Pemisahan itu menjaga ukuran skill tetap terpisah dari ukuran baca/injeksi runtime
seperti `memory_get`, hasil tool live, dan penyegaran AGENTS.md pasca-Compaction.

## Dokumentasi

System prompt menyertakan bagian **Documentation**. Saat dokumentasi lokal tersedia, bagian ini
menunjuk ke direktori dokumentasi OpenClaw lokal (`docs/` dalam checkout Git atau dokumentasi paket npm
bawaan). Jika dokumentasi lokal tidak tersedia, bagian ini fallback ke
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Bagian yang sama juga menyertakan lokasi source OpenClaw. Checkout Git mengekspos
root source lokal sehingga agent dapat memeriksa kode secara langsung. Instalasi paket menyertakan
URL source GitHub dan memberi tahu agent untuk meninjau source di sana setiap kali dokumentasi tidak lengkap atau
usang. Prompt juga mencatat mirror dokumentasi publik, Discord komunitas, dan ClawHub
([https://clawhub.ai](https://clawhub.ai)) untuk penemuan skill. Prompt memberi tahu model untuk
berkonsultasi dengan dokumentasi terlebih dahulu untuk perilaku, perintah, konfigurasi, atau arsitektur OpenClaw, dan untuk
menjalankan `openclaw status` sendiri bila memungkinkan (hanya bertanya kepada pengguna saat tidak memiliki akses).

## Terkait

- [Runtime agent](/id/concepts/agent)
- [Workspace agent](/id/concepts/agent-workspace)
- [Mesin konteks](/id/concepts/context-engine)
