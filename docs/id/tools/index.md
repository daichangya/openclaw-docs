---
read_when:
    - Anda ingin memahami tool apa saja yang disediakan OpenClaw
    - Anda perlu mengonfigurasi, mengizinkan, atau menolak tool-tool
    - Anda sedang memutuskan antara tool bawaan, Skills, dan Plugin
summary: 'Ikhtisar tool dan Plugin OpenClaw: apa yang dapat dilakukan agent dan cara memperluasnya'
title: Tool dan Plugin
x-i18n:
    generated_at: "2026-04-23T09:28:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Tool dan Plugin

Segala hal yang dilakukan agent selain menghasilkan teks terjadi melalui **tool**.
Tool adalah cara agent membaca file, menjalankan perintah, menjelajah web, mengirim
pesan, dan berinteraksi dengan perangkat.

## Tool, skill, dan Plugin

OpenClaw memiliki tiga lapisan yang bekerja bersama:

<Steps>
  <Step title="Tool adalah yang dipanggil agent">
    Tool adalah fungsi bertipe yang dapat dipanggil agent (misalnya `exec`, `browser`,
    `web_search`, `message`). OpenClaw menyediakan sekumpulan **tool bawaan** dan
    Plugin dapat mendaftarkan tool tambahan.

    Agent melihat tool sebagai definisi fungsi terstruktur yang dikirim ke API model.

  </Step>

  <Step title="Skills mengajarkan kapan dan bagaimana">
    Skill adalah file markdown (`SKILL.md`) yang disuntikkan ke system prompt.
    Skills memberi agent konteks, batasan, dan panduan langkah demi langkah untuk
    menggunakan tool secara efektif. Skills berada di workspace Anda, di folder bersama,
    atau dikirim di dalam Plugin.

    [Referensi Skills](/id/tools/skills) | [Membuat Skills](/id/tools/creating-skills)

  </Step>

  <Step title="Plugin mengemas semuanya menjadi satu">
    Plugin adalah paket yang dapat mendaftarkan kombinasi kapabilitas apa pun:
    saluran, provider model, tool, Skills, ucapan, transkripsi realtime,
    suara realtime, pemahaman media, pembuatan gambar, pembuatan video,
    Web fetch, pencarian web, dan lainnya. Beberapa Plugin adalah **core** (dikirim bersama
    OpenClaw), yang lain adalah **eksternal** (diterbitkan di npm oleh komunitas).

    [Instal dan konfigurasikan Plugin](/id/tools/plugin) | [Bangun sendiri](/id/plugins/building-plugins)

  </Step>
</Steps>

## Tool bawaan

Tool ini dikirim bersama OpenClaw dan tersedia tanpa menginstal Plugin apa pun:

| Tool                                       | Fungsinya                                                             | Halaman                                                      |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Menjalankan perintah shell, mengelola proses latar belakang           | [Exec](/id/tools/exec), [Persetujuan Exec](/id/tools/exec-approvals) |
| `code_execution`                           | Menjalankan analisis Python remote dalam sandbox                      | [Code Execution](/id/tools/code-execution)                      |
| `browser`                                  | Mengontrol browser Chromium (navigasi, klik, screenshot)              | [Browser](/id/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Mencari di web, mencari kiriman X, mengambil konten halaman           | [Web](/id/tools/web), [Web Fetch](/id/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file di workspace                                                 |                                                              |
| `apply_patch`                              | Patch file multi-hunk                                                 | [Apply Patch](/id/tools/apply-patch)                            |
| `message`                                  | Mengirim pesan ke semua saluran                                       | [Agent Send](/id/tools/agent-send)                              |
| `canvas`                                   | Mengendalikan Canvas Node (present, eval, snapshot)                   |                                                              |
| `nodes`                                    | Menemukan dan menargetkan perangkat yang sudah ter-pairing            |                                                              |
| `cron` / `gateway`                         | Mengelola job terjadwal; memeriksa, menambal, memulai ulang, atau memperbarui Gateway |                                                              |
| `image` / `image_generate`                 | Menganalisis atau membuat gambar                                      | [Pembuatan Gambar](/id/tools/image-generation)                  |
| `music_generate`                           | Membuat trek musik                                                    | [Pembuatan Musik](/id/tools/music-generation)                   |
| `video_generate`                           | Membuat video                                                         | [Pembuatan Video](/id/tools/video-generation)                   |
| `tts`                                      | Konversi text-to-speech sekali jalan                                  | [TTS](/id/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Manajemen sesi, status, dan orkestrasi sub-agent                      | [Sub-agent](/id/tools/subagents)                                |
| `session_status`                           | Readback ringan bergaya `/status` dan override model per sesi         | [Tool Sesi](/id/concepts/session-tool)                          |

Untuk pekerjaan gambar, gunakan `image` untuk analisis dan `image_generate` untuk pembuatan atau pengeditan. Jika Anda menargetkan `openai/*`, `google/*`, `fal/*`, atau provider gambar non-default lain, konfigurasikan auth/API key provider tersebut terlebih dahulu.

Untuk pekerjaan musik, gunakan `music_generate`. Jika Anda menargetkan `google/*`, `minimax/*`, atau provider musik non-default lain, konfigurasikan auth/API key provider tersebut terlebih dahulu.

Untuk pekerjaan video, gunakan `video_generate`. Jika Anda menargetkan `qwen/*` atau provider video non-default lain, konfigurasikan auth/API key provider tersebut terlebih dahulu.

Untuk pembuatan audio berbasis alur kerja, gunakan `music_generate` ketika Plugin seperti
ComfyUI mendaftarkannya. Ini terpisah dari `tts`, yang merupakan text-to-speech.

`session_status` adalah tool status/readback ringan dalam grup sesi.
Tool ini menjawab pertanyaan bergaya `/status` tentang sesi saat ini dan dapat
secara opsional menyetel override model per sesi; `model=default` menghapus
override tersebut. Seperti `/status`, tool ini dapat mengisi balik penghitung token/cache yang jarang dan label model runtime aktif dari entri penggunaan transkrip terbaru.

`gateway` adalah tool runtime khusus pemilik untuk operasi Gateway:

- `config.schema.lookup` untuk satu subtree config bercakupan jalur sebelum pengeditan
- `config.get` untuk snapshot + hash config saat ini
- `config.patch` untuk pembaruan config parsial dengan restart
- `config.apply` hanya untuk penggantian config penuh
- `update.run` untuk self-update + restart eksplisit

Untuk perubahan parsial, utamakan `config.schema.lookup` lalu `config.patch`. Gunakan
`config.apply` hanya ketika Anda memang berniat mengganti seluruh config.
Tool ini juga menolak mengubah `tools.exec.ask` atau `tools.exec.security`;
alias legacy `tools.bash.*` dinormalisasi ke jalur exec terlindungi yang sama.

### Tool yang disediakan Plugin

Plugin dapat mendaftarkan tool tambahan. Beberapa contoh:

- [Diffs](/id/tools/diffs) — penampil dan perender diff
- [LLM Task](/id/tools/llm-task) — langkah LLM khusus JSON untuk output terstruktur
- [Lobster](/id/tools/lobster) — runtime alur kerja bertipe dengan persetujuan yang dapat dilanjutkan
- [Pembuatan Musik](/id/tools/music-generation) — tool `music_generate` bersama dengan provider berbasis alur kerja
- [OpenProse](/id/prose) — orkestrasi alur kerja berbasis markdown
- [Tokenjuice](/id/tools/tokenjuice) — memadatkan hasil tool `exec` dan `bash` yang berisik

## Konfigurasi tool

### Daftar izinkan dan tolak

Kontrol tool mana yang dapat dipanggil agent melalui `tools.allow` / `tools.deny` di
config. Tolak selalu menang atas izinkan.

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
Override per agent: `agents.list[].tools.profile`.

| Profil      | Cakupannya                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tanpa pembatasan (sama seperti tidak disetel)                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | hanya `session_status`                                                                                                                            |

Profil `coding` dan `messaging` juga mengizinkan tool MCP bundle yang dikonfigurasi
di bawah kunci Plugin `bundle-mcp`. Tambahkan `tools.deny: ["bundle-mcp"]` ketika Anda
ingin profil mempertahankan tool bawaan normalnya tetapi menyembunyikan semua tool MCP yang dikonfigurasi.
Profil `minimal` tidak mencakup tool MCP bundle.

### Grup tool

Gunakan singkatan `group:*` dalam daftar izinkan/tolak:

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
| `group:openclaw`   | Semua tool bawaan OpenClaw (tidak termasuk tool Plugin)                                                   |

`sessions_history` mengembalikan tampilan recall yang dibatasi dan difilter demi keamanan. Tool ini menghapus tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor,
dan XML tool-call MiniMax yang salah bentuk dari teks assistant, lalu menerapkan
redaksi/truncation dan kemungkinan placeholder baris berukuran terlalu besar alih-alih bertindak
sebagai dump transkrip mentah.

### Pembatasan spesifik provider

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
