---
read_when:
    - Anda ingin memahami alat apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak alat
    - Anda sedang memutuskan antara alat bawaan, Skills, dan Plugin
summary: 'Ikhtisar alat dan Plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Alat dan Plugin
x-i18n:
    generated_at: "2026-04-25T13:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Semua yang dilakukan agen di luar menghasilkan teks terjadi melalui **alat**.
Alat adalah cara agen membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Alat, Skills, dan Plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Alat adalah yang dipanggil agen">
    Alat adalah fungsi bertipe yang dapat dipanggil agen (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyediakan sekumpulan **alat bawaan** dan
    Plugin dapat mendaftarkan alat tambahan.

    Agen melihat alat sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajarkan agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disisipkan ke system prompt.
    Skills memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan alat secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau disertakan di dalam Plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat Skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya bersama">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kemampuan apa pun:
    channel, provider model, alat, Skills, speech, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    pengambilan web, pencarian web, dan lainnya. Beberapa Plugin bersifat **core** (disertakan bersama
    OpenClaw), lainnya **external** (dipublikasikan di npm oleh komunitas).

    [Instal dan konfigurasi Plugin](/id/tools/plugin) | [Buat sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Alat bawaan

Alat-alat ini disertakan bersama OpenClaw dan tersedia tanpa menginstal Plugin apa pun:

| Tool                                       | Fungsinya                                                             | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python jarak jauh yang di-sandbox                | [Code Execution](/id/tools/code-execution)                      |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, screenshot)             | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari post X, mengambil konten halaman             | [Web](/id/tools/web), [Web Fetch](/id/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/id/tools/apply-patch)                            |
| `message`                                  | Mengirim pesan ke semua channel                                       | [Agent Send](/id/tools/agent-send)                              |
| `canvas`                                   | Mengendalikan node Canvas (present, eval, snapshot)                   |                                                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipasangkan                  |                                                              |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, mem-patch, memulai ulang, atau memperbarui gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau menghasilkan gambar                                 | [Image Generation](/id/tools/image-generation)                  |
| `music_generate`                           | Menghasilkan trek musik                                               | [Music Generation](/id/tools/music-generation)                  |
| `video_generate`                           | Menghasilkan video                                                    | [Video Generation](/id/tools/video-generation)                  |
| `tts`                                      | Konversi text-to-speech sekali jalan                                  | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agen                       | [Sub-agents](/id/tools/subagents)                               |
| `session_status`                           | Readback ringan bergaya `/status` dan override model per sesi         | [Session Tools](/id/concepts/session-tool)                      |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau penyuntingan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lainnya, konfigurasi auth/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau provider musik non-default lainnya, konfigurasi auth/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau provider video non-default lainnya, konfigurasi auth/kunci API provider tersebut terlebih dahulu.

Untuk pembuatan audio berbasis workflow, gunakan `music_generate` saat Plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan text-to-speech.

`session_status` adalah alat status/readback ringan dalam grup sessions.
Alat ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, alat ini dapat mengisi balik penghitung token/cache yang jarang
serta label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah alat runtime khusus pemilik untuk operasi gateway:

- `config.schema.lookup` untuk satu subtree konfigurasi yang dibatasi path sebelum edit
- `config.get` untuk snapshot konfigurasi saat ini + hash
- `config.patch` untuk pembaruan konfigurasi parsial dengan restart
- `config.apply` hanya untuk penggantian konfigurasi penuh
- `update.run` untuk self-update eksplisit + restart

Untuk perubahan parsial, utamakan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya saat Anda memang ingin mengganti seluruh konfigurasi.
Alat ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Alat yang disediakan Plugin

Plugin dapat mendaftarkan alat tambahan. Beberapa contoh:

- [Diffs](/id/tools/diffs) — penampil dan perender diff
- [LLM Task](/id/tools/llm-task) — langkah LLM khusus JSON untuk keluaran terstruktur
- [Lobster](/id/tools/lobster) — runtime workflow bertipe dengan persetujuan yang dapat dilanjutkan
- [Music Generation](/id/tools/music-generation) — alat `music_generate` bersama dengan provider berbasis workflow
- [OpenProse](/id/prose) — orkestrasi workflow yang mengutamakan markdown
- [Tokenjuice](/id/tools/tokenjuice) — hasil alat `exec` dan `bash` yang ringkas untuk output bising

## Konfigurasi alat

### Daftar izin dan penolakan

Kontrol alat mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` di
konfigurasi. Penolakan selalu mengalahkan izin.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw gagal secara tertutup saat allowlist eksplisit tidak menghasilkan alat yang dapat dipanggil.
Misalnya, `tools.allow: ["query_db"]` hanya berfungsi jika Plugin yang dimuat benar-benar
mendaftarkan `query_db`. Jika tidak ada alat bawaan, Plugin, atau MCP bundle yang cocok dengan
allowlist, eksekusi berhenti sebelum pemanggilan model alih-alih melanjutkan sebagai
eksekusi khusus teks yang dapat menghalusinasi hasil alat.

### Profil alat

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per agen: `agents.list[].tools.profile`.

| Profile     | Yang disertakan                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tanpa pembatasan (sama seperti tidak diatur)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Hanya `session_status`                                                                                                                            |

Profil `coding` dan `messaging` juga mengizinkan alat MCP bundle yang dikonfigurasi
di bawah key Plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` saat Anda
ingin profil mempertahankan alat bawaan normalnya tetapi menyembunyikan semua alat MCP yang dikonfigurasi.
Profil `minimal` tidak menyertakan alat MCP bundle.

### Grup alat

Gunakan singkatan `group:*` dalam daftar allow/deny:

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` diterima sebagai alias untuk `exec`)                                |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Semua alat OpenClaw bawaan (tidak termasuk alat Plugin)                                                   |

`sessions_history` mengembalikan tampilan recall yang dibatasi dan difilter untuk keamanan. Alat ini menghapus
thinking tag, scaffolding `<relevant-memories>`, payload XML pemanggilan alat
dalam teks biasa (termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong),
scaffolding pemanggilan alat yang diturunkan, token kontrol model ASCII/full-width yang bocor,
dan XML pemanggilan alat MiniMax yang cacat dari teks asisten, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris yang terlalu besar alih-alih bertindak
sebagai dump transkrip mentah.

### Pembatasan khusus provider

Gunakan `tools.byProvider` untuk membatasi alat bagi provider tertentu tanpa
mengubah default global:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
