---
read_when:
    - Anda menginginkan pekerjaan latar belakang/paralel melalui agent
    - Anda sedang mengubah `sessions_spawn` atau kebijakan tool sub-agent
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi sub-agent yang terikat thread
summary: 'Sub-agent: memunculkan run agent terisolasi yang mengumumkan hasil kembali ke chat peminta'
title: Sub-Agent
x-i18n:
    generated_at: "2026-04-22T04:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agent

Sub-agent adalah run agent latar belakang yang dimunculkan dari run agent yang sudah ada. Mereka berjalan di sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan, ketika selesai, **mengumumkan** hasilnya kembali ke channel chat peminta. Setiap run sub-agent dilacak sebagai [tugas latar belakang](/id/automation/tasks).

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengendalikan run sub-agent untuk **sesi saat ini**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrol binding thread:

Perintah-perintah ini berfungsi pada channel yang mendukung binding thread persisten. Lihat **Channel yang mendukung thread** di bawah.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` menampilkan metadata run (status, timestamp, session id, path transkrip, cleanup).
Gunakan `sessions_history` untuk tampilan recall yang dibatasi dan difilter demi keamanan; periksa
path transkrip di disk saat Anda memerlukan transkrip mentah lengkap.

### Perilaku spawn

`/subagents spawn` memulai sub-agent latar belakang sebagai perintah pengguna, bukan relay internal, dan mengirim satu pembaruan penyelesaian final kembali ke chat peminta saat run selesai.

- Perintah spawn bersifat non-blocking; perintah ini segera mengembalikan ID run.
- Saat selesai, sub-agent mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
- Pengiriman penyelesaian berbasis push. Setelah dimunculkan, jangan melakukan polling `/subagents list`,
  `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu hingga
  selesai; periksa status hanya saat diperlukan untuk debugging atau intervensi.
- Saat selesai, OpenClaw dengan upaya terbaik menutup tab/proses browser yang dilacak yang dibuka oleh sesi sub-agent tersebut sebelum alur cleanup announce berlanjut.
- Untuk spawn manual, pengiriman bersifat tangguh:
  - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan idempotency key yang stabil.
  - Jika pengiriman langsung gagal, OpenClaw fallback ke routing antrean.
  - Jika routing antrean masih tidak tersedia, announce akan dicoba ulang dengan backoff eksponensial singkat sebelum akhirnya menyerah.
- Pengiriman penyelesaian mempertahankan route peminta yang telah diselesaikan:
  - route penyelesaian yang terikat thread atau percakapan diutamakan saat tersedia
  - jika origin penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari route yang telah diselesaikan milik sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap berfungsi
- Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan saat runtime (bukan teks yang ditulis pengguna) dan mencakup:
  - `Result` (teks balasan `assistant` terlihat terbaru, atau teks tool/toolResult terbaru yang sudah disanitasi; run gagal terminal tidak menggunakan ulang teks balasan yang ditangkap)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistik runtime/token ringkas
  - instruksi pengiriman yang memberi tahu agent peminta untuk menulis ulang dengan suara asisten normal (bukan meneruskan metadata internal mentah)
- `--model` dan `--thinking` menimpa default untuk run tertentu itu.
- Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
- `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
- Untuk sesi harness ACP (Codex, Claude Code, Gemini CLI), gunakan `sessions_spawn` dengan `runtime: "acp"` dan lihat [ACP Agents](/id/tools/acp-agents), khususnya [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop agent-ke-agent.

Tujuan utama:

- Memparalelkan pekerjaan “riset / tugas panjang / tool lambat” tanpa memblokir run utama.
- Menjaga sub-agent tetap terisolasi secara default (pemisahan sesi + sandbox opsional).
- Menjaga permukaan tool tetap sulit disalahgunakan: sub-agent **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

Catatan biaya: setiap sub-agent memiliki konteks dan penggunaan tokennya **sendiri**. Untuk tugas yang berat atau berulang,
atur model yang lebih murah untuk sub-agent dan pertahankan agent utama Anda pada model berkualitas lebih tinggi.
Anda dapat mengonfigurasi ini melalui `agents.defaults.subagents.model` atau override per-agent.

## Tool

Gunakan `sessions_spawn`:

- Memulai run sub-agent (`deliver: false`, lane global: `subagent`)
- Lalu menjalankan langkah announce dan memposting balasan announce ke channel chat peminta
- Model default: mewarisi pemanggil kecuali Anda mengatur `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per-agent); `sessions_spawn.model` eksplisit tetap menang.
- Thinking default: mewarisi pemanggil kecuali Anda mengatur `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per-agent); `sessions_spawn.thinking` eksplisit tetap menang.
- Timeout run default: jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` saat diatur; jika tidak, fallback ke `0` (tanpa timeout).

Param tool:

- `task` (wajib)
- `label?` (opsional)
- `agentId?` (opsional; spawn di bawah ID agent lain jika diizinkan)
- `model?` (opsional; menimpa model sub-agent; nilai tidak valid dilewati dan sub-agent berjalan pada model default dengan peringatan di hasil tool)
- `thinking?` (opsional; menimpa level thinking untuk run sub-agent)
- `runTimeoutSeconds?` (default ke `agents.defaults.subagents.runTimeoutSeconds` saat diatur, jika tidak `0`; saat diatur, run sub-agent dibatalkan setelah N detik)
- `thread?` (default `false`; saat `true`, meminta binding thread channel untuk sesi sub-agent ini)
- `mode?` (`run|session`)
  - default adalah `run`
  - jika `thread: true` dan `mode` dihilangkan, default menjadi `session`
  - `mode: "session"` memerlukan `thread: true`
- `cleanup?` (`delete|keep`, default `keep`)
- `sandbox?` (`inherit|require`, default `inherit`; `require` menolak spawn kecuali runtime child target disandbox)
- `sessions_spawn` **tidak** menerima param pengiriman channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan `message`/`sessions_send` dari run yang dimunculkan.

## Sesi terikat thread

Saat binding thread diaktifkan untuk suatu channel, sub-agent dapat tetap terikat ke thread sehingga pesan pengguna lanjutan di thread tersebut terus dirutekan ke sesi sub-agent yang sama.

### Channel yang mendukung thread

- Discord (saat ini satu-satunya channel yang didukung): mendukung sesi subagent persisten yang terikat thread (`sessions_spawn` dengan `thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), dan key adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, dan `channels.discord.threadBindings.spawnSubagentSessions`.

Alur cepat:

1. Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"`).
2. OpenClaw membuat atau mengikat thread ke target sesi itu di channel aktif.
3. Balasan dan pesan lanjutan di thread tersebut dirutekan ke sesi yang terikat.
4. Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan `/session max-age` untuk mengontrol batas keras.
5. Gunakan `/unfocus` untuk melepaskan secara manual.

Kontrol manual:

- `/focus <target>` mengikat thread saat ini (atau membuat thread) ke target sub-agent/sesi.
- `/unfocus` menghapus binding untuk thread terikat saat ini.
- `/agents` mencantumkan run aktif dan status binding (`thread:<id>` atau `unbound`).
- `/session idle` dan `/session max-age` hanya berfungsi untuk thread terikat yang sedang fokus.

Sakelar config:

- Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override channel dan key auto-bind spawn bersifat spesifik adapter. Lihat **Channel yang mendukung thread** di atas.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) dan [Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

Allowlist:

- `agents.list[].subagents.allowAgents`: daftar ID agent yang dapat ditargetkan melalui `agentId` (`["*"]` untuk mengizinkan apa pun). Default: hanya agent peminta.
- `agents.defaults.subagents.allowAgents`: allowlist agent target default yang digunakan saat agent peminta tidak mengatur `subagents.allowAgents` sendiri.
- Pengaman pewarisan sandbox: jika sesi peminta disandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: saat true, blokir pemanggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Default: false.

Discovery:

- Gunakan `agents_list` untuk melihat ID agent mana yang saat ini diizinkan untuk `sessions_spawn`.

Auto-archive:

- Sesi sub-agent diarsipkan secara otomatis setelah `agents.defaults.subagents.archiveAfterMinutes` (default: 60).
- Pengarsipan menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` mengarsipkan segera setelah announce (tetap mempertahankan transkrip melalui penggantian nama).
- Auto-archive bersifat best-effort; timer yang tertunda hilang jika gateway di-restart.
- `runTimeoutSeconds` **tidak** melakukan auto-archive; ia hanya menghentikan run. Sesi tetap ada sampai auto-archive.
- Auto-archive berlaku sama untuk sesi depth-1 dan depth-2.
- Cleanup browser terpisah dari cleanup arsip: tab/proses browser yang dilacak ditutup dengan upaya terbaik saat run selesai, bahkan jika record transkrip/sesi dipertahankan.

## Sub-Agent bersarang

Secara default, sub-agent tidak dapat memunculkan sub-agent mereka sendiri (`maxSpawnDepth: 1`). Anda dapat mengaktifkan satu tingkat nesting dengan mengatur `maxSpawnDepth: 2`, yang memungkinkan **pola orkestrator**: main → sub-agent orkestrator → sub-sub-agent pekerja.

### Cara mengaktifkan

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agent memunculkan child (default: 1)
        maxChildrenPerAgent: 5, // child aktif maksimum per sesi agent (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Tingkat depth

| Depth | Bentuk key sesi                             | Peran                                         | Bisa memunculkan?              |
| ----- | ------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0     | `agent:<id>:main`                           | Agent utama                                   | Selalu                         |
| 1     | `agent:<id>:subagent:<uuid>`                | Sub-agent (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (pekerja leaf)                  | Tidak pernah                   |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke induknya (orkestrator depth-1)
2. Orkestrator depth-1 menerima announce, mensintesis hasil, selesai → mengumumkan ke main
3. Agent utama menerima announce dan mengirimkannya ke pengguna

Setiap level hanya melihat announce dari child langsungnya.

Panduan operasional:

- Mulai pekerjaan child satu kali dan tunggu event penyelesaian alih-alih membangun loop polling
  di sekitar `sessions_list`, `sessions_history`, `/subagents list`, atau
  perintah `exec` sleep.
- Jika event penyelesaian child tiba setelah Anda sudah mengirim jawaban final,
  tindak lanjut yang benar adalah token senyap persis `NO_REPLY` / `no_reply`.

### Kebijakan tool berdasarkan depth

- Role dan scope kontrol ditulis ke metadata sesi saat spawn. Ini mencegah key sesi yang datar atau dipulihkan secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`)**: Mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` agar dapat mengelola child-nya. Tool sesi/sistem lainnya tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`)**: Tidak ada tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf)**: Tidak ada tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat memunculkan child lebih lanjut.

### Batas spawn per-agent

Setiap sesi agent (pada kedalaman apa pun) dapat memiliki paling banyak `maxChildrenPerAgent` (default: 5) child aktif pada satu waktu. Ini mencegah fan-out yang lepas kendali dari satu orkestrator.

### Hentikan berantai

Menghentikan orkestrator depth-1 secara otomatis menghentikan semua child depth-2-nya:

- `/stop` di chat utama menghentikan semua agent depth-1 dan meneruskan penghentian ke child depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan meneruskan ke child-nya.
- `/subagents kill all` menghentikan semua sub-agent untuk peminta dan meneruskan penghentian.

## Autentikasi

Auth sub-agent diselesaikan berdasarkan **ID agent**, bukan berdasarkan tipe sesi:

- Key sesi sub-agent adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` milik agent tersebut.
- Profil auth agent utama digabungkan sebagai **fallback**; profil agent menimpa profil utama jika terjadi konflik.

Catatan: merge ini bersifat aditif, sehingga profil utama selalu tersedia sebagai fallback. Auth yang sepenuhnya terisolasi per agent belum didukung.

## Announce

Sub-agent melaporkan kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agent (bukan sesi peminta).
- Jika sub-agent membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap persis `NO_REPLY` / `no_reply`,
  output announce ditekan meskipun sebelumnya ada progres yang terlihat.
- Jika tidak, pengiriman bergantung pada depth peminta:
  - sesi peminta tingkat atas menggunakan panggilan `agent` lanjutan dengan pengiriman eksternal (`deliver=true`)
  - sesi subagent peminta bersarang menerima injeksi lanjutan internal (`deliver=false`) sehingga orkestrator dapat mensintesis hasil child di dalam sesi
  - jika sesi subagent peminta bersarang sudah tidak ada, OpenClaw fallback ke peminta sesi tersebut saat tersedia
- Untuk sesi peminta tingkat atas, pengiriman langsung mode penyelesaian pertama-tama menyelesaikan route percakapan/thread terikat dan hook override, lalu mengisi field target channel yang hilang dari route tersimpan milik sesi peminta. Ini menjaga penyelesaian tetap berada pada chat/topik yang benar bahkan saat origin penyelesaian hanya mengidentifikasi channel.
- Agregasi penyelesaian child dibatasi ke run peminta saat ini saat membangun temuan penyelesaian bersarang, sehingga output child basi dari run sebelumnya tidak bocor ke announce saat ini.
- Balasan announce mempertahankan routing thread/topik saat tersedia pada adapter channel.
- Konteks announce dinormalisasi menjadi blok event internal yang stabil:
  - sumber (`subagent` atau `cron`)
  - key/ID sesi child
  - tipe announce + label tugas
  - baris status yang diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`)
  - konten hasil yang dipilih dari teks asisten terlihat terbaru, atau teks tool/toolResult terbaru yang telah disanitasi; run gagal terminal melaporkan status kegagalan tanpa memutar ulang teks balasan yang ditangkap
  - instruksi lanjutan yang menjelaskan kapan harus membalas vs. tetap diam
- `Status` tidak diinferensikan dari output model; status berasal dari sinyal hasil runtime.
- Saat timeout, jika child hanya sempat melalui tool call, announce dapat merangkum riwayat itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

Payload announce menyertakan baris statistik di bagian akhir (bahkan saat dibungkus):

- Runtime (misalnya, `runtime 5m12s`)
- Penggunaan token (input/output/total)
- Perkiraan biaya saat penetapan harga model dikonfigurasi (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, dan path transkrip (sehingga agent utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk)
- Metadata internal ditujukan hanya untuk orkestrasi; balasan yang menghadap pengguna harus ditulis ulang dengan suara asisten normal.

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- recall asisten dinormalkan terlebih dahulu:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML tool-call teks biasa seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan rapi
  - scaffolding tool-call/result yang diturunkan dan penanda konteks historis dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian full-width `<｜...｜>` dihapus
  - XML tool-call MiniMax yang salah bentuk dihapus
- teks mirip kredensial/token disensor
- blok panjang dapat dipotong
- riwayat yang sangat besar dapat menjatuhkan baris yang lebih lama atau mengganti baris yang terlalu besar dengan
  `[sessions_history omitted: message too large]`
- pemeriksaan transkrip mentah di disk adalah fallback saat Anda memerlukan transkrip byte-for-byte lengkap

## Kebijakan Tool (tool sub-agent)

Secara default, sub-agent mendapatkan **semua tool kecuali tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap merupakan tampilan recall yang dibatasi dan disanitasi di sini juga; ini bukan
dump transkrip mentah.

Saat `maxSpawnDepth >= 2`, sub-agent orkestrator depth-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` agar mereka dapat mengelola child mereka.

Timpa melalui config:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny menang
        deny: ["gateway", "cron"],
        // jika allow diatur, ini menjadi allow-only (deny tetap menang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Konkurensi

Sub-agent menggunakan lane antrean in-process khusus:

- Nama lane: `subagent`
- Konkurensi: `agents.defaults.subagents.maxConcurrent` (default `8`)

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan run sub-agent aktif yang dimunculkan darinya, meneruskan ke child bersarang.
- `/subagents kill <id>` menghentikan sub-agent tertentu dan meneruskan ke child-nya.

## Batasan

- Announce sub-agent bersifat **best-effort**. Jika gateway di-restart, pekerjaan “announce back” yang tertunda akan hilang.
- Sub-agent tetap berbagi sumber daya proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: mengembalikan `{ status: "accepted", runId, childSessionKey }` segera.
- Konteks sub-agent hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk sebagian besar kasus penggunaan.
- `maxChildrenPerAgent` membatasi child aktif per sesi (default: 5, rentang: 1–20).
