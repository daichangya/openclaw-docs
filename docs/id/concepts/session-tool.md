---
read_when:
    - Anda ingin memahami tool sesi apa saja yang dimiliki agent
    - Anda ingin mengonfigurasi akses lintas-sesi atau spawn sub-agent
    - Anda ingin memeriksa status atau mengontrol sub-agent yang di-spawn
summary: Tool agent untuk status lintas-sesi, recall, pengiriman pesan, dan orkestrasi sub-agent
title: Tool Sesi
x-i18n:
    generated_at: "2026-04-23T09:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Tool Sesi

OpenClaw memberi agent tool untuk bekerja lintas sesi, memeriksa status, dan
mengorkestrasi sub-agent.

## Tool yang tersedia

| Tool               | Fungsinya                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Menampilkan sesi dengan filter opsional (jenis, label, agent, recency, preview) |
| `sessions_history` | Membaca transkrip sesi tertentu                                            |
| `sessions_send`    | Mengirim pesan ke sesi lain dan secara opsional menunggu                   |
| `sessions_spawn`   | Men-spawn sesi sub-agent terisolasi untuk pekerjaan latar belakang         |
| `sessions_yield`   | Mengakhiri putaran saat ini dan menunggu hasil sub-agent lanjutan          |
| `subagents`        | Menampilkan, mengarahkan, atau mematikan sub-agent yang di-spawn untuk sesi ini |
| `session_status`   | Menampilkan kartu bergaya `/status` dan secara opsional menetapkan override model per sesi |

## Menampilkan dan membaca sesi

`sessions_list` mengembalikan sesi dengan key, agentId, jenis, channel, model,
jumlah token, dan stempel waktu. Filter berdasarkan jenis (`main`, `group`, `cron`, `hook`,
`node`), `label` exact, `agentId` exact, teks pencarian, atau recency
(`activeMinutes`). Saat Anda memerlukan triase bergaya kotak masuk, tool ini juga dapat meminta
judul turunan dengan cakupan visibilitas, cuplikan preview pesan terakhir, atau
pesan terbaru terbatas pada setiap baris. Judul turunan dan preview hanya dihasilkan untuk
sesi yang memang sudah bisa dilihat pemanggil di bawah kebijakan visibilitas tool sesi
yang dikonfigurasi, sehingga sesi yang tidak terkait tetap tersembunyi.

`sessions_history` mengambil transkrip percakapan untuk sesi tertentu.
Secara default, hasil tool tidak disertakan -- berikan `includeTools: true` untuk melihatnya.
Tampilan yang dikembalikan sengaja dibatasi dan difilter demi keamanan:

- teks assistant dinormalisasi sebelum recall:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML tool-call teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan rapi
  - scaffolding tool-call/result yang diturunkan seperti `[Tool Call: ...]`,
    `[Tool Result ...]`, dan `[Historical context ...]` dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lain, dan varian full-width `<｜...｜>` dihapus
  - XML tool-call MiniMax yang malformed seperti `<invoke ...>` /
    `</minimax:tool_call>` dihapus
- teks mirip kredensial/token disunting sebelum dikembalikan
- blok teks panjang dipotong
- riwayat yang sangat besar dapat menghapus baris yang lebih lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- tool ini melaporkan flag ringkasan seperti `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, dan `bytes`

Kedua tool menerima **key sesi** (seperti `"main"`) atau **ID sesi**
dari panggilan list sebelumnya.

Jika Anda memerlukan transkrip byte-for-byte yang exact, periksa file transkrip di
disk alih-alih memperlakukan `sessions_history` sebagai dump mentah.

## Mengirim pesan lintas sesi

`sessions_send` mengirim pesan ke sesi lain dan secara opsional menunggu
respons:

- **Fire-and-forget:** setel `timeoutSeconds: 0` untuk memasukkan ke antrean dan langsung kembali.
- **Tunggu balasan:** setel timeout dan dapatkan respons secara inline.

Setelah target merespons, OpenClaw dapat menjalankan **reply-back loop** di mana
agent saling bertukar pesan (hingga 5 putaran). Agent target dapat membalas
`REPLY_SKIP` untuk berhenti lebih awal.

## Helper status dan orkestrasi

`session_status` adalah tool ringan setara `/status` untuk sesi saat ini
atau sesi lain yang terlihat. Tool ini melaporkan penggunaan, waktu, status model/runtime, dan
konteks tugas latar belakang tertaut jika ada. Seperti `/status`, tool ini dapat mengisi kembali
counter token/cache yang jarang dari entri penggunaan transkrip terbaru, dan
`model=default` menghapus override per sesi.

`sessions_yield` dengan sengaja mengakhiri putaran saat ini agar pesan berikutnya dapat menjadi
peristiwa tindak lanjut yang sedang Anda tunggu. Gunakan setelah men-spawn sub-agent saat
Anda ingin hasil penyelesaian tiba sebagai pesan berikutnya alih-alih membangun loop polling.

`subagents` adalah helper control-plane untuk sub-agent OpenClaw yang sudah
di-spawn. Tool ini mendukung:

- `action: "list"` untuk memeriksa run aktif/baru-baru ini
- `action: "steer"` untuk mengirim panduan lanjutan ke child yang sedang berjalan
- `action: "kill"` untuk menghentikan satu child atau `all`

## Men-spawn sub-agent

`sessions_spawn` membuat sesi terisolasi untuk tugas latar belakang. Tool ini selalu
non-blocking -- tool ini langsung mengembalikan `runId` dan `childSessionKey`.

Opsi utama:

- `runtime: "subagent"` (default) atau `"acp"` untuk agent harness eksternal.
- Override `model` dan `thinking` untuk sesi child.
- `thread: true` untuk mengikat spawn ke thread chat (Discord, Slack, dll.).
- `sandbox: "require"` untuk memaksa sandboxing pada child.

Sub-agent leaf default tidak mendapatkan tool sesi. Saat
`maxSpawnDepth >= 2`, sub-agent orkestrator depth-1 juga menerima
`sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka
dapat mengelola child mereka sendiri. Run leaf tetap tidak mendapatkan
tool orkestrasi rekursif.

Setelah selesai, langkah announce mem-posting hasil ke channel peminta.
Pengiriman penyelesaian mempertahankan perutean thread/topik yang terikat jika tersedia, dan jika
origin penyelesaian hanya mengidentifikasi sebuah channel OpenClaw tetap dapat menggunakan kembali
rute tersimpan sesi peminta (`lastChannel` / `lastTo`) untuk pengiriman langsung.

Untuk perilaku khusus ACP, lihat [ACP Agents](/id/tools/acp-agents).

## Visibilitas

Tool sesi memiliki cakupan untuk membatasi apa yang dapat dilihat agent:

| Tingkat | Cakupan                                  |
| ------- | ---------------------------------------- |
| `self`  | Hanya sesi saat ini                      |
| `tree`  | Sesi saat ini + sub-agent yang di-spawn  |
| `agent` | Semua sesi untuk agent ini               |
| `all`   | Semua sesi (lintas-agent jika dikonfigurasi) |

Default-nya adalah `tree`. Sesi tersandbox dikunci ke `tree` terlepas dari
konfigurasi.

## Bacaan lebih lanjut

- [Session Management](/id/concepts/session) -- perutean, siklus hidup, pemeliharaan
- [ACP Agents](/id/tools/acp-agents) -- spawning harness eksternal
- [Multi-agent](/id/concepts/multi-agent) -- arsitektur multi-agent
- [Gateway Configuration](/id/gateway/configuration) -- knob konfigurasi tool sesi
