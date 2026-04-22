---
read_when:
    - Anda ingin memahami tool apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak tool-tool
    - Anda sedang memutuskan antara tool bawaan, Skills, dan plugin
summary: 'Ikhtisar tool dan plugin OpenClaw: apa yang dapat dilakukan agen dan cara memperluasnya'
title: Tool dan Plugin
x-i18n:
    generated_at: "2026-04-22T09:15:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# Tool dan Plugin

Semua yang dilakukan agen selain menghasilkan teks terjadi melalui **tool**.
Tool adalah cara agen membaca file, menjalankan perintah, menjelajahi web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Tool, Skills, dan plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Tool adalah yang dipanggil agen">
    Tool adalah fungsi bertipe yang dapat dipanggil agen (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyediakan sekumpulan **tool bawaan** dan
    plugin dapat mendaftarkan tool tambahan.

    Agen melihat tool sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajari agen kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke prompt sistem.
    Skills memberi agen konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan tool secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau dikirim di dalam plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya menjadi satu">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kapabilitas apa pun:
    channel, provider model, tool, Skills, speech, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    web fetch, web search, dan lainnya. Beberapa plugin bersifat **inti** (dikirim bersama
    OpenClaw), lainnya bersifat **eksternal** (dipublikasikan di npm oleh komunitas).

    [Pasang dan konfigurasikan plugin](/id/tools/plugin) | [Bangun plugin Anda sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Tool bawaan

Tool ini dikirim bersama OpenClaw dan tersedia tanpa memasang plugin apa pun:

| Tool                                       | Fungsinya                                                             | Halaman                                     |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec)                         |
| `code_execution`                           | Menjalankan analisis Python jarak jauh dalam sandbox                  | [Code Execution](/id/tools/code-execution)     |
| `browser`                                  | Mengendalikan browser Chromium (navigasi, klik, tangkapan layar)      | [Browser](/id/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Menelusuri web, menelusuri postingan X, mengambil konten halaman      | [Web](/id/tools/web)                           |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                             |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/id/tools/apply-patch)           |
| `message`                                  | Mengirim pesan ke semua channel                                       | [Agent Send](/id/tools/agent-send)             |
| `canvas`                                   | Mengoperasikan node Canvas (present, eval, snapshot)                  |                                             |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang dipasangkan                  |                                             |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, mem-patch, memulai ulang, atau memperbarui Gateway |                                             |
| `image` / `image_generate`                 | Menganalisis atau membuat gambar                                      | [Image Generation](/id/tools/image-generation) |
| `music_generate`                           | Membuat trek musik                                                    | [Music Generation](/id/tools/music-generation) |
| `video_generate`                           | Membuat video                                                         | [Video Generation](/id/tools/video-generation) |
| `tts`                                      | Konversi text-to-speech sekali jalan                                  | [TTS](/id/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi subagen                        | [Sub-agents](/id/tools/subagents)              |
| `session_status`                           | Pembacaan ringan bergaya `/status` dan override model sesi            | [Session Tools](/id/concepts/session-tool)     |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lain, konfigurasikan autentikasi/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau provider musik non-default lain, konfigurasikan autentikasi/kunci API provider tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau provider video non-default lain, konfigurasikan autentikasi/kunci API provider tersebut terlebih dahulu.

Untuk pembuatan audio berbasis workflow, gunakan `music_generate` saat plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan text-to-speech.

`session_status` adalah tool status/pembacaan ringan dalam grup sessions.
Tool ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menetapkan override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, tool ini dapat mengisi balik penghitung token/cache yang jarang
dan label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah tool runtime khusus pemilik untuk operasi Gateway:

- `config.schema.lookup` untuk satu subtree config yang dicakup path sebelum pengeditan
- `config.get` untuk snapshot + hash config saat ini
- `config.patch` untuk pembaruan config parsial dengan restart
- `config.apply` hanya untuk penggantian config penuh
- `update.run` untuk self-update + restart eksplisit

Untuk perubahan parsial, utamakan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya jika Anda memang sengaja mengganti seluruh config.
Tool ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama.

### Tool yang disediakan plugin

Plugin dapat mendaftarkan tool tambahan. Beberapa contoh:

- [Diffs](/id/tools/diffs) — penampil dan perender diff
- [LLM Task](/id/tools/llm-task) — langkah LLM hanya-JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime workflow bertipe dengan persetujuan yang dapat dilanjutkan
- [Music Generation](/id/tools/music-generation) — tool `music_generate` bersama dengan provider berbasis workflow
- [OpenProse](/id/prose) — orkestrasi workflow yang mengutamakan markdown
- [Tokenjuice](/id/tools/tokenjuice) — hasil tool `exec` dan `bash` yang ringkas untuk keluaran yang berisik

## Konfigurasi tool

### Daftar izin dan tolak

Kontrol tool mana yang dapat dipanggil agen melalui `tools.allow` / `tools.deny` dalam
config. Penolakan selalu mengalahkan izin.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `allow`/`deny` diterapkan.
Override per agen: `agents.list[].tools.profile`.

| Profil      | Cakupannya                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Tanpa pembatasan (sama seperti tidak disetel)                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Hanya `session_status`                                                                                                                           |

### Grup tool

Gunakan singkatan `group:*` dalam daftar allow/deny:

| Grup               | Tool                                                                                                      |
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
| `group:openclaw`   | Semua tool OpenClaw bawaan (tidak termasuk tool plugin)                                                   |

`sessions_history` mengembalikan tampilan recall terbatas yang difilter demi keamanan. Tool ini menghapus
thinking tag, scaffolding `<relevant-memories>`, payload XML pemanggilan tool dalam teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok pemanggilan tool yang dipotong),
scaffolding pemanggilan tool yang diturunkan, token kontrol model ASCII/full-width yang bocor,
serta XML pemanggilan tool MiniMax yang cacat dari teks asisten, lalu menerapkan
redaksi/pemotongan dan kemungkinan placeholder baris yang terlalu besar alih-alih bertindak
sebagai dump transkrip mentah.

### Pembatasan khusus provider

Gunakan `tools.byProvider` untuk membatasi tool bagi provider tertentu tanpa
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
