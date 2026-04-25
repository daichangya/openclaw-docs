---
read_when:
    - Anda menginginkan pekerjaan latar belakang/paralel melalui agen
    - Anda sedang mengubah `sessions_spawn` atau kebijakan tool sub-agen
    - Anda sedang mengimplementasikan atau memecahkan masalah sesi sub-agen yang terikat thread
summary: 'Sub-agen: memulai eksekusi agen terisolasi yang mengumumkan hasil kembali ke chat peminta'
title: Sub-agen
x-i18n:
    generated_at: "2026-04-25T13:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Sub-agen adalah eksekusi agen latar belakang yang di-spawn dari eksekusi agen yang sudah ada. Mereka berjalan di sesi mereka sendiri (`agent:<agentId>:subagent:<uuid>`) dan, ketika selesai, **mengumumkan** hasilnya kembali ke channel chat peminta. Setiap eksekusi sub-agen dilacak sebagai [task latar belakang](/id/automation/tasks).

## Perintah slash

Gunakan `/subagents` untuk memeriksa atau mengontrol eksekusi sub-agen untuk **sesi saat ini**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrol binding thread:

Perintah ini berfungsi pada channel yang mendukung binding thread persisten. Lihat **Channel yang mendukung thread** di bawah.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` menampilkan metadata eksekusi (status, timestamp, session id, path transkrip, cleanup).
Gunakan `sessions_history` untuk tampilan recall yang terbatas dan difilter demi keamanan; periksa
path transkrip di disk saat Anda membutuhkan transkrip mentah lengkap.

### Perilaku spawn

`/subagents spawn` memulai sub-agen latar belakang sebagai perintah pengguna, bukan relay internal, dan mengirim satu pembaruan penyelesaian akhir kembali ke chat peminta saat eksekusi selesai.

- Perintah spawn bersifat non-blocking; perintah ini segera mengembalikan id eksekusi.
- Setelah selesai, sub-agen mengumumkan pesan ringkasan/hasil kembali ke channel chat peminta.
- Pengiriman penyelesaian berbasis push. Setelah di-spawn, jangan polling `/subagents list`,
  `sessions_list`, atau `sessions_history` dalam loop hanya untuk menunggu
  hingga selesai; periksa status hanya sesuai kebutuhan untuk debugging atau intervensi.
- Setelah selesai, OpenClaw sebisa mungkin menutup tab/proses browser terlacak yang dibuka oleh sesi sub-agen tersebut sebelum alur cleanup announce berlanjut.
- Untuk spawn manual, pengiriman bersifat resilien:
  - OpenClaw mencoba pengiriman `agent` langsung terlebih dahulu dengan key idempotensi yang stabil.
  - Jika pengiriman langsung gagal, OpenClaw fallback ke routing antrean.
  - Jika routing antrean masih belum tersedia, announce dicoba ulang dengan exponential backoff singkat sebelum akhirnya menyerah.
- Pengiriman penyelesaian mempertahankan route peminta yang telah di-resolve:
  - route penyelesaian terikat thread atau terikat percakapan menang jika tersedia
  - jika origin penyelesaian hanya menyediakan channel, OpenClaw mengisi target/akun yang hilang dari route hasil-resolve sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap berfungsi
- Handoff penyelesaian ke sesi peminta adalah konteks internal yang dihasilkan runtime (bukan teks buatan pengguna) dan mencakup:
  - `Result` (teks balasan `assistant` terbaru yang terlihat, atau jika tidak ada, teks tool/toolResult terbaru yang sudah disanitasi; eksekusi gagal terminal tidak menggunakan ulang teks balasan yang ditangkap)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistik runtime/token ringkas
  - instruksi pengiriman yang memberitahu agen peminta untuk menulis ulang dalam suara asisten normal (bukan meneruskan metadata internal mentah)
- `--model` dan `--thinking` meng-override default untuk eksekusi spesifik tersebut.
- Gunakan `info`/`log` untuk memeriksa detail dan output setelah selesai.
- `/subagents spawn` adalah mode sekali jalan (`mode: "run"`). Untuk sesi persisten yang terikat thread, gunakan `sessions_spawn` dengan `thread: true` dan `mode: "session"`.
- Untuk sesi harness ACP (Codex, Claude Code, Gemini CLI), gunakan `sessions_spawn` dengan `runtime: "acp"` dan lihat [Agen ACP](/id/tools/acp-agents), terutama [model pengiriman ACP](/id/tools/acp-agents#delivery-model) saat men-debug penyelesaian atau loop antaragen.

Tujuan utama:

- Memparalelkan pekerjaan "riset / tugas panjang / tool lambat" tanpa memblokir eksekusi utama.
- Menjaga sub-agen tetap terisolasi secara default (pemisahan sesi + sandboxing opsional).
- Menjaga surface tool tetap sulit disalahgunakan: sub-agen **tidak** mendapatkan tool sesi secara default.
- Mendukung kedalaman nesting yang dapat dikonfigurasi untuk pola orkestrator.

Catatan biaya: setiap sub-agen memiliki konteks dan penggunaan token **sendiri** secara default. Untuk tugas berat atau
berulang, set model yang lebih murah untuk sub-agen dan pertahankan agen utama Anda pada
model berkualitas lebih tinggi. Anda dapat mengonfigurasinya melalui `agents.defaults.subagents.model` atau override
per agen. Ketika child benar-benar membutuhkan transkrip saat ini milik peminta, agen dapat meminta
`context: "fork"` pada spawn tersebut.

## Mode konteks

Sub-agen native mulai dalam keadaan terisolasi kecuali pemanggil secara eksplisit meminta untuk mem-fork
transkrip saat ini.

| Mode       | Kapan menggunakannya                                                                                                                  | Perilaku                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Riset baru, implementasi independen, pekerjaan tool lambat, atau apa pun yang dapat dijelaskan secara singkat dalam teks task        | Membuat transkrip child yang bersih. Ini adalah default dan menjaga penggunaan token lebih rendah. |
| `fork`     | Pekerjaan yang bergantung pada percakapan saat ini, hasil tool sebelumnya, atau instruksi bernuansa yang sudah ada dalam transkrip peminta | Mencabangkan transkrip peminta ke sesi child sebelum child dimulai. |

Gunakan `fork` secara hemat. Ini untuk delegasi yang sensitif terhadap konteks, bukan pengganti
untuk menulis prompt task yang jelas.

## Tool

Gunakan `sessions_spawn`:

- Memulai eksekusi sub-agen (`deliver: false`, lane global: `subagent`)
- Lalu menjalankan langkah announce dan mem-post balasan announce ke channel chat peminta
- Model default: mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.model` (atau `agents.list[].subagents.model` per agen); `sessions_spawn.model` eksplisit tetap menang.
- Thinking default: mewarisi pemanggil kecuali Anda menyetel `agents.defaults.subagents.thinking` (atau `agents.list[].subagents.thinking` per agen); `sessions_spawn.thinking` eksplisit tetap menang.
- Timeout eksekusi default: jika `sessions_spawn.runTimeoutSeconds` dihilangkan, OpenClaw menggunakan `agents.defaults.subagents.runTimeoutSeconds` jika disetel; jika tidak, fallback ke `0` (tanpa timeout).

Parameter tool:

- `task` (wajib)
- `label?` (opsional)
- `agentId?` (opsional; spawn di bawah id agen lain jika diizinkan)
- `model?` (opsional; meng-override model sub-agen; nilai tidak valid dilewati dan sub-agen berjalan pada model default dengan peringatan dalam hasil tool)
- `thinking?` (opsional; meng-override level thinking untuk eksekusi sub-agen)
- `runTimeoutSeconds?` (default ke `agents.defaults.subagents.runTimeoutSeconds` jika disetel, jika tidak `0`; jika disetel, eksekusi sub-agen dibatalkan setelah N detik)
- `thread?` (default `false`; jika `true`, meminta alur binding thread channel untuk sesi sub-agen ini)
- `mode?` (`run|session`)
  - default adalah `run`
  - jika `thread: true` dan `mode` dihilangkan, default menjadi `session`
  - `mode: "session"` memerlukan `thread: true`
- `cleanup?` (`delete|keep`, default `keep`)
- `sandbox?` (`inherit|require`, default `inherit`; `require` menolak spawn kecuali runtime child target berada dalam sandbox)
- `context?` (`isolated|fork`, default `isolated`; hanya sub-agen native)
  - `isolated` membuat transkrip child yang bersih dan merupakan default.
  - `fork` mencabangkan transkrip saat ini milik peminta ke sesi child sehingga child mulai dengan konteks percakapan yang sama.
  - Gunakan `fork` hanya ketika child membutuhkan transkrip saat ini. Untuk pekerjaan yang terbatas cakupannya, hilangkan `context`.
- `sessions_spawn` **tidak** menerima parameter pengiriman channel (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Untuk pengiriman, gunakan `message`/`sessions_send` dari eksekusi yang di-spawn.

## Sesi terikat thread

Saat binding thread diaktifkan untuk sebuah channel, sub-agen dapat tetap terikat ke thread sehingga pesan tindak lanjut pengguna di thread tersebut terus dirutekan ke sesi sub-agen yang sama.

### Channel yang mendukung thread

- Discord (saat ini satu-satunya channel yang didukung): mendukung sesi subagen persisten yang terikat thread (`sessions_spawn` dengan `thread: true`), kontrol thread manual (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), dan key adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, dan `channels.discord.threadBindings.spawnSubagentSessions`.

Alur cepat:

1. Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"`).
2. OpenClaw membuat atau mengikat thread ke target sesi tersebut di channel aktif.
3. Balasan dan pesan tindak lanjut di thread tersebut dirutekan ke sesi yang terikat.
4. Gunakan `/session idle` untuk memeriksa/memperbarui auto-unfocus karena tidak aktif dan `/session max-age` untuk mengontrol batas keras.
5. Gunakan `/unfocus` untuk melepasnya secara manual.

Kontrol manual:

- `/focus <target>` mengikat thread saat ini (atau membuat satu) ke target sub-agen/sesi.
- `/unfocus` menghapus binding untuk thread terikat saat ini.
- `/agents` menampilkan daftar eksekusi aktif dan state binding (`thread:<id>` atau `unbound`).
- `/session idle` dan `/session max-age` hanya berfungsi untuk thread terikat yang sedang difokuskan.

Sakelar config:

- Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override channel dan key auto-bind spawn bersifat spesifik adapter. Lihat **Channel yang mendukung thread** di atas.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference) dan [Perintah slash](/id/tools/slash-commands) untuk detail adapter saat ini.

Allowlist:

- `agents.list[].subagents.allowAgents`: daftar id agen yang dapat ditargetkan melalui `agentId` (`["*"]` untuk mengizinkan apa pun). Default: hanya agen peminta.
- `agents.defaults.subagents.allowAgents`: allowlist agen target default yang digunakan saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri.
- Guard pewarisan sandbox: jika sesi peminta berada dalam sandbox, `sessions_spawn` menolak target yang akan berjalan di luar sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: jika true, blok panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit). Default: false.

Discovery:

- Gunakan `agents_list` untuk melihat id agen mana yang saat ini diizinkan untuk `sessions_spawn`.

Arsip otomatis:

- Sesi sub-agen secara otomatis diarsipkan setelah `agents.defaults.subagents.archiveAfterMinutes` (default: 60).
- Arsip menggunakan `sessions.delete` dan mengganti nama transkrip menjadi `*.deleted.<timestamp>` (folder yang sama).
- `cleanup: "delete"` langsung mengarsipkan setelah announce (tetap menyimpan transkrip melalui penggantian nama).
- Arsip otomatis bersifat best-effort; timer yang tertunda hilang jika gateway direstart.
- `runTimeoutSeconds` **tidak** mengarsipkan secara otomatis; ini hanya menghentikan eksekusi. Sesi tetap ada sampai arsip otomatis.
- Arsip otomatis berlaku sama untuk sesi depth-1 dan depth-2.
- Cleanup browser terpisah dari cleanup arsip: tab/proses browser terlacak sebisa mungkin ditutup ketika eksekusi selesai, bahkan jika catatan transkrip/sesi tetap disimpan.

## Sub-agen bertingkat

Secara default, sub-agen tidak dapat memulai sub-agen mereka sendiri (`maxSpawnDepth: 1`). Anda dapat mengaktifkan satu tingkat nesting dengan menyetel `maxSpawnDepth: 2`, yang memungkinkan **pola orkestrator**: utama → sub-agen orkestrator → sub-sub-agen pekerja.

### Cara mengaktifkan

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // izinkan sub-agen memulai child (default: 1)
        maxChildrenPerAgent: 5, // maksimum child aktif per sesi agen (default: 5)
        maxConcurrent: 8, // batas lane konkurensi global (default: 8)
        runTimeoutSeconds: 900, // timeout default untuk sessions_spawn saat dihilangkan (0 = tanpa timeout)
      },
    },
  },
}
```

### Tingkat kedalaman

| Kedalaman | Bentuk session key                           | Peran                                         | Bisa spawn?                  |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agen utama                                    | Selalu                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Sub-agen (orkestrator saat depth 2 diizinkan) | Hanya jika `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agen (pekerja leaf)                   | Tidak pernah                 |

### Rantai announce

Hasil mengalir kembali ke atas rantai:

1. Pekerja depth-2 selesai → mengumumkan ke parent-nya (orkestrator depth-1)
2. Orkestrator depth-1 menerima announce, menyintesis hasil, selesai → mengumumkan ke agen utama
3. Agen utama menerima announce dan mengirimkannya ke pengguna

Setiap level hanya melihat announce dari child langsungnya.

Panduan operasional:

- Mulai pekerjaan child sekali dan tunggu event penyelesaian alih-alih membangun loop
  polling di sekitar `sessions_list`, `sessions_history`, `/subagents list`, atau
  perintah `exec` sleep.
- `sessions_list` dan `/subagents list` menjaga relasi child-session tetap fokus
  pada pekerjaan live: child live tetap terlampir, child yang sudah berakhir tetap terlihat untuk
  jendela recent singkat, dan link child lama yang hanya ada di penyimpanan diabaikan setelah
  jendela freshness-nya berakhir. Ini mencegah metadata `spawnedBy` / `parentSessionKey` lama
  membangkitkan ghost child setelah restart.
- Jika event penyelesaian child tiba setelah Anda sudah mengirim jawaban akhir,
  tindak lanjut yang benar adalah token senyap yang tepat `NO_REPLY` / `no_reply`.

### Kebijakan tool berdasarkan kedalaman

- Peran dan cakupan kontrol ditulis ke metadata sesi saat waktu spawn. Ini menjaga session key datar atau yang dipulihkan agar tidak secara tidak sengaja mendapatkan kembali hak istimewa orkestrator.
- **Depth 1 (orkestrator, saat `maxSpawnDepth >= 2`)**: Mendapat `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` sehingga dapat mengelola child-nya. Tool sesi/sistem lainnya tetap ditolak.
- **Depth 1 (leaf, saat `maxSpawnDepth == 1`)**: Tidak ada tool sesi (perilaku default saat ini).
- **Depth 2 (pekerja leaf)**: Tidak ada tool sesi — `sessions_spawn` selalu ditolak pada depth 2. Tidak dapat memulai child lebih lanjut.

### Batas spawn per agen

Setiap sesi agen (pada kedalaman apa pun) dapat memiliki maksimal `maxChildrenPerAgent` (default: 5) child aktif pada satu waktu. Ini mencegah fan-out tak terkendali dari satu orkestrator.

### Penghentian berantai

Menghentikan orkestrator depth-1 secara otomatis juga menghentikan semua child depth-2-nya:

- `/stop` di chat utama menghentikan semua agen depth-1 dan berantai ke child depth-2 mereka.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke child-nya.
- `/subagents kill all` menghentikan semua sub-agen untuk peminta dan berantai.

## Autentikasi

Auth sub-agen di-resolve berdasarkan **id agen**, bukan berdasarkan tipe sesi:

- Session key sub-agen adalah `agent:<agentId>:subagent:<uuid>`.
- Penyimpanan auth dimuat dari `agentDir` milik agen tersebut.
- Profil auth agen utama digabungkan sebagai **fallback**; profil agen menimpa profil utama jika terjadi konflik.

Catatan: penggabungan ini bersifat aditif, sehingga profil utama selalu tersedia sebagai fallback. Auth yang sepenuhnya terisolasi per agen belum didukung.

## Announce

Sub-agen melaporkan kembali melalui langkah announce:

- Langkah announce berjalan di dalam sesi sub-agen (bukan sesi peminta).
- Jika sub-agen membalas tepat `ANNOUNCE_SKIP`, tidak ada yang diposting.
- Jika teks asisten terbaru adalah token senyap yang tepat `NO_REPLY` / `no_reply`,
  output announce ditekan meskipun sebelumnya ada progres yang terlihat.
- Selain itu pengiriman bergantung pada kedalaman peminta:
  - sesi peminta tingkat atas menggunakan panggilan `agent` tindak lanjut dengan pengiriman eksternal (`deliver=true`)
  - sesi subagen peminta bertingkat menerima injeksi tindak lanjut internal (`deliver=false`) agar orkestrator dapat menyintesis hasil child di dalam sesi
  - jika sesi subagen peminta bertingkat sudah hilang, OpenClaw fallback ke peminta sesi tersebut jika tersedia
- Untuk sesi peminta tingkat atas, pengiriman langsung mode-penyelesaian pertama-tama me-resolve setiap route percakapan/thread terikat dan override hook, lalu mengisi field target channel yang hilang dari route tersimpan sesi peminta. Ini menjaga penyelesaian tetap pada chat/topik yang tepat bahkan ketika origin penyelesaian hanya mengidentifikasi channel.
- Agregasi penyelesaian child dibatasi ke eksekusi peminta saat ini saat membangun temuan penyelesaian bertingkat, mencegah output child lama dari eksekusi sebelumnya bocor ke announce saat ini.
- Balasan announce mempertahankan routing thread/topik jika tersedia pada adapter channel.
- Konteks announce dinormalisasi ke blok event internal yang stabil:
  - sumber (`subagent` atau `cron`)
  - child session key/id
  - tipe announce + label task
  - baris status yang diturunkan dari hasil runtime (`success`, `error`, `timeout`, atau `unknown`)
  - konten hasil yang dipilih dari teks asisten terbaru yang terlihat, atau jika tidak ada, teks tool/toolResult terbaru yang sudah disanitasi; eksekusi gagal terminal melaporkan status gagal tanpa memutar ulang teks balasan yang tertangkap
  - instruksi tindak lanjut yang menjelaskan kapan harus membalas vs. tetap diam
- `Status` tidak disimpulkan dari output model; ini berasal dari sinyal hasil runtime.
- Saat timeout, jika child hanya sempat melewati panggilan tool, announce dapat merangkum riwayat tersebut menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

Payload announce menyertakan baris statistik di akhir (bahkan ketika dibungkus):

- Runtime (misalnya, `runtime 5m12s`)
- Penggunaan token (input/output/total)
- Perkiraan biaya ketika harga model dikonfigurasi (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, dan path transkrip (agar agen utama dapat mengambil riwayat melalui `sessions_history` atau memeriksa file di disk)
- Metadata internal dimaksudkan hanya untuk orkestrasi; balasan yang menghadap pengguna harus ditulis ulang dalam suara asisten normal.

`sessions_history` adalah jalur orkestrasi yang lebih aman:

- recall asisten dinormalisasi terlebih dahulu:
  - tag thinking dihapus
  - blok scaffolding `<relevant-memories>` / `<relevant_memories>` dihapus
  - blok payload XML panggilan tool plaintext seperti `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, dan
    `<function_calls>...</function_calls>` dihapus, termasuk payload terpotong
    yang tidak pernah tertutup dengan rapi
  - scaffolding tool-call/result yang diturunkan levelnya dan penanda konteks historis dihapus
  - token kontrol model yang bocor seperti `<|assistant|>`, token ASCII
    `<|...|>` lainnya, dan varian lebar penuh `<｜...｜>` dihapus
  - XML panggilan tool MiniMax yang malformed dihapus
- teks mirip kredensial/token disunting
- blok panjang dapat dipotong
- riwayat yang sangat besar dapat menghapus baris lama atau mengganti satu baris terlalu besar dengan
  `[sessions_history omitted: message too large]`
- pemeriksaan transkrip mentah di disk adalah fallback saat Anda membutuhkan transkrip lengkap byte demi byte

## Kebijakan Tool (tool sub-agen)

Secara default, sub-agen mendapatkan **semua tool kecuali tool sesi** dan tool sistem:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` tetap menjadi tampilan recall yang terbatas dan disanitasi di sini juga; ini bukan
dump transkrip mentah.

Ketika `maxSpawnDepth >= 2`, sub-agen orkestrator depth-1 juga menerima `sessions_spawn`, `subagents`, `sessions_list`, dan `sessions_history` sehingga mereka dapat mengelola child mereka.

Override melalui config:

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Konkurensi

Sub-agen menggunakan lane antrean in-process khusus:

- Nama lane: `subagent`
- Konkurensi: `agents.defaults.subagents.maxConcurrent` (default `8`)

## Keaktifan dan pemulihan

OpenClaw tidak memperlakukan ketiadaan `endedAt` sebagai bukti permanen bahwa sebuah sub-agen
masih hidup. Eksekusi yang belum berakhir dan lebih tua dari jendela stale-run berhenti dihitung sebagai
aktif/tertunda di `/subagents list`, ringkasan status, gating penyelesaian turunan,
dan pemeriksaan konkurensi per sesi.

Setelah restart gateway, eksekusi yang dipulihkan dan stale tetapi belum berakhir akan dipangkas kecuali
sesi child-nya ditandai `abortedLastRun: true`. Sesi child yang diaborsi saat restart
tetap dapat dipulihkan melalui alur pemulihan orphan sub-agen, yang
mengirim pesan resume sintetis sebelum menghapus penanda aborted.

## Menghentikan

- Mengirim `/stop` di chat peminta membatalkan sesi peminta dan menghentikan setiap eksekusi sub-agen aktif yang di-spawn darinya, berantai ke child bertingkat.
- `/subagents kill <id>` menghentikan sub-agen tertentu dan berantai ke child-nya.

## Keterbatasan

- Announce sub-agen bersifat **best-effort**. Jika gateway direstart, pekerjaan "announce kembali" yang tertunda akan hilang.
- Sub-agen tetap berbagi resource proses gateway yang sama; perlakukan `maxConcurrent` sebagai katup pengaman.
- `sessions_spawn` selalu non-blocking: segera mengembalikan `{ status: "accepted", runId, childSessionKey }`.
- Konteks sub-agen hanya menyuntikkan `AGENTS.md` + `TOOLS.md` (tanpa `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, atau `BOOTSTRAP.md`).
- Kedalaman nesting maksimum adalah 5 (rentang `maxSpawnDepth`: 1–5). Depth 2 direkomendasikan untuk kebanyakan kasus penggunaan.
- `maxChildrenPerAgent` membatasi child aktif per sesi (default: 5, rentang: 1–20).

## Terkait

- [Agen ACP](/id/tools/acp-agents)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Agent send](/id/tools/agent-send)
