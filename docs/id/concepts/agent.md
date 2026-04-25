---
read_when:
    - Mengubah runtime agen, bootstrap workspace, atau perilaku sesi
summary: Runtime agen, kontrak workspace, dan bootstrap sesi
title: Runtime agen
x-i18n:
    generated_at: "2026-04-25T13:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw menjalankan **satu runtime agen embedded** — satu proses agen per
Gateway, dengan workspace, file bootstrap, dan session store miliknya sendiri. Halaman ini
mencakup kontrak runtime tersebut: apa yang harus ada di workspace, file mana yang
diinjeksikan, dan bagaimana sesi melakukan bootstrap terhadapnya.

## Workspace (wajib)

OpenClaw menggunakan satu direktori workspace agen (`agents.defaults.workspace`) sebagai **satu-satunya** working directory (`cwd`) agen untuk alat dan konteks.

Disarankan: gunakan `openclaw setup` untuk membuat `~/.openclaw/openclaw.json` jika belum ada dan menginisialisasi file workspace.

Panduan lengkap tata letak workspace + backup: [Agent workspace](/id/concepts/agent-workspace)

Jika `agents.defaults.sandbox` diaktifkan, sesi non-main dapat menimpa ini dengan
workspace per sesi di bawah `agents.defaults.sandbox.workspaceRoot` (lihat
[Gateway configuration](/id/gateway/configuration)).

## File bootstrap (diinjeksikan)

Di dalam `agents.defaults.workspace`, OpenClaw mengharapkan file yang dapat diedit pengguna berikut:

- `AGENTS.md` — instruksi operasi + “memori”
- `SOUL.md` — persona, batasan, nada
- `TOOLS.md` — catatan alat yang dikelola pengguna (misalnya `imsg`, `sag`, konvensi)
- `BOOTSTRAP.md` — ritual pertama kali dijalankan satu kali (dihapus setelah selesai)
- `IDENTITY.md` — nama/gaya/emoji agen
- `USER.md` — profil pengguna + sapaan yang diutamakan

Pada giliran pertama sesi baru, OpenClaw menginjeksikan isi file-file ini langsung ke konteks agen.

File kosong dilewati. File besar dipangkas dan dipotong dengan marker agar prompt tetap ringkas (baca file untuk konten lengkap).

Jika file tidak ada, OpenClaw menginjeksikan satu baris marker “file hilang” (dan `openclaw setup` akan membuat template default yang aman).

`BOOTSTRAP.md` hanya dibuat untuk **workspace yang benar-benar baru** (belum ada file bootstrap lain). Jika Anda menghapusnya setelah menyelesaikan ritual, file ini tidak boleh dibuat ulang pada restart berikutnya.

Untuk menonaktifkan pembuatan file bootstrap sepenuhnya (untuk workspace yang sudah di-seed sebelumnya), setel:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Alat bawaan

Alat inti (read/exec/edit/write dan alat sistem terkait) selalu tersedia,
sesuai dengan kebijakan alat. `apply_patch` bersifat opsional dan dibatasi oleh
`tools.exec.applyPatch`. `TOOLS.md` **tidak** mengontrol alat mana yang ada; file ini adalah
panduan tentang bagaimana _Anda_ ingin alat tersebut digunakan.

## Skills

OpenClaw memuat Skills dari lokasi berikut (prioritas tertinggi lebih dulu):

- Workspace: `<workspace>/skills`
- Skills agen project: `<workspace>/.agents/skills`
- Skills agen pribadi: `~/.agents/skills`
- Terkelola/lokal: `~/.openclaw/skills`
- Bundled (dikirim bersama instalasi)
- Folder skill tambahan: `skills.load.extraDirs`

Skills dapat dibatasi oleh config/env (lihat `skills` di [Gateway configuration](/id/gateway/configuration)).

## Batas runtime

Runtime agen embedded dibangun di atas inti agen Pi (model, alat, dan
pipeline prompt). Manajemen sesi, discovery, wiring alat, dan pengiriman channel
adalah lapisan milik OpenClaw di atas inti tersebut.

## Sesi

Transkrip sesi disimpan sebagai JSONL di:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

ID sesi stabil dan dipilih oleh OpenClaw.
Folder sesi lama dari alat lain tidak dibaca.

## Pengarahan saat streaming

Ketika mode antrean adalah `steer`, pesan masuk diinjeksikan ke eksekusi saat ini.
Pengarahan dalam antrean dikirim **setelah giliran asisten saat ini selesai
mengeksekusi tool call-nya**, sebelum pemanggilan LLM berikutnya. Pengarahan tidak lagi melewati
tool call yang tersisa dari pesan asisten saat ini; pesan dalam antrean diinjeksikan
pada batas model berikutnya.

Ketika mode antrean adalah `followup` atau `collect`, pesan masuk ditahan sampai
giliran saat ini berakhir, lalu giliran agen baru dimulai dengan payload dalam antrean tersebut. Lihat
[Queue](/id/concepts/queue) untuk perilaku mode + debounce/cap.

Streaming blok mengirim blok asisten yang selesai segera setelah selesai; ini
**nonaktif secara default** (`agents.defaults.blockStreamingDefault: "off"`).
Sesuaikan batasnya melalui `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; default ke text_end).
Kontrol chunking blok lunak dengan `agents.defaults.blockStreamingChunk` (default ke
800–1200 karakter; mengutamakan jeda paragraf, lalu baris baru; kalimat terakhir).
Gabungkan chunk yang di-stream dengan `agents.defaults.blockStreamingCoalesce` untuk mengurangi
spam satu baris (penggabungan berbasis idle sebelum kirim). Channel non-Telegram memerlukan
`*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
Ringkasan alat verbose dikeluarkan saat alat dimulai (tanpa debounce); UI Control
men-stream output alat melalui event agen bila tersedia.
Detail lebih lanjut: [Streaming + chunking](/id/concepts/streaming).

## Ref model

Ref model dalam config (misalnya `agents.defaults.model` dan `agents.defaults.models`) diparse dengan memisahkan pada **`/` pertama**.

- Gunakan `provider/model` saat mengonfigurasi model.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), sertakan prefix provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu kecocokan provider yang dikonfigurasi dan unik untuk id model tersebut, dan baru kemudian fallback ke provider default yang dikonfigurasi. Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default provider yang sudah usang dan dihapus.

## Konfigurasi (minimal)

Minimal, setel:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (sangat disarankan)

---

_Berikutnya: [Group Chats](/id/channels/group-messages)_ 🦞

## Terkait

- [Agent workspace](/id/concepts/agent-workspace)
- [Multi-agent routing](/id/concepts/multi-agent)
- [Session management](/id/concepts/session)
