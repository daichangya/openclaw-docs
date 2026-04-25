---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat pada percakapan di channel pesan
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP dan wiring plugin
    - Men-debug pengiriman penyelesaian ACP atau loop antaragen
    - Mengoperasikan perintah `/acp` dari chat
summary: Gunakan sesi runtime ACP untuk Claude Code, Cursor, Gemini CLI, fallback ACP Codex eksplisit, OpenClaw ACP, dan agen harness lainnya
title: Agen ACP
x-i18n:
    generated_at: "2026-04-25T13:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui plugin backend ACP.

Jika Anda meminta OpenClaw dengan bahasa biasa untuk mengikat atau mengontrol Codex di percakapan saat ini, OpenClaw harus menggunakan plugin native app-server Codex (`/codex bind`, `/codex threads`, `/codex resume`). Jika Anda meminta `/acp`, ACP, acpx, atau sesi child latar belakang Codex, OpenClaw tetap dapat merutekan Codex melalui ACP. Setiap spawn sesi ACP dilacak sebagai [task latar belakang](/id/automation/tasks).

Jika Anda meminta OpenClaw dengan bahasa biasa untuk "memulai Claude Code di thread" atau menggunakan harness eksternal lain, OpenClaw harus merutekan permintaan tersebut ke runtime ACP (bukan runtime sub-agen native).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung ke percakapan channel OpenClaw yang sudah ada, gunakan [`openclaw mcp serve`](/id/cli/mcp) alih-alih ACP.

## Halaman mana yang saya butuhkan?

Ada tiga surface terkait yang mudah tertukar:

| Anda ingin...                                                                                  | Gunakan ini                           | Catatan                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex di percakapan saat ini                                          | `/codex bind`, `/codex threads`       | Jalur native app-server Codex; mencakup balasan chat terikat, penerusan gambar, model/cepat/perizinan, stop, dan kontrol steer. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, ACP Codex eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agen ACP                 | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, task latar belakang, kontrol runtime                                               |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien                  | [`openclaw acp`](/id/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                    |
| Menggunakan ulang AI CLI lokal sebagai model fallback hanya-teks                               | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP. Tanpa tool OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                                                                   |

## Apakah ini langsung berfungsi?

Biasanya, ya. Instalasi baru dikirim dengan plugin runtime `acpx` bawaan yang aktif secara default, dengan biner `acpx` pinned lokal-plugin yang diprobe dan diperbaiki sendiri oleh OpenClaw saat startup. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

Hal-hal yang perlu diperhatikan saat pertama kali menjalankan:

- Adapter harness target (Codex, Claude, dll.) mungkin diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
- Auth vendor tetap harus ada di host untuk harness tersebut.
- Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter saat pertama kali berjalan akan gagal sampai cache dipanaskan lebih dulu atau adapter dipasang dengan cara lain.

## Runbook operator

Alur cepat `/acp` dari chat:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, atau `/acp spawn codex --bind here` secara eksplisit
2. **Bekerja** di percakapan atau thread yang terikat (atau targetkan session key secara eksplisit).
3. **Periksa status** — `/acp status`
4. **Sesuaikan** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Arahkan** tanpa mengganti konteks — `/acp steer tighten logging and continue`
6. **Berhenti** — `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding)

Pemicu bahasa alami yang harus dirutekan ke plugin native Codex:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

Binding percakapan native Codex adalah jalur kontrol chat default. Tool dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sedangkan tool native Codex seperti shell/apply-patch dieksekusi di dalam Codex. Untuk event tool native Codex, OpenClaw menyuntikkan relay hook native per-giliran agar hook plugin dapat memblokir `before_tool_call`, mengamati `after_tool_call`, dan merutekan event `PermissionRequest` Codex melalui approval OpenClaw. Relay v1 sengaja konservatif: relay ini tidak memodifikasi argumen tool native Codex, menulis ulang catatan thread Codex, atau mengontrol jawaban akhir/hook Stop. Gunakan ACP eksplisit hanya jika Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex tersemat didokumentasikan dalam [kontrak dukungan v1 harness Codex](/id/plugins/codex-harness#v1-support-contract).

Pemicu bahasa alami yang harus dirutekan ke runtime ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw memilih `runtime: "acp"`, menyelesaikan `agentId` harness, mengikat ke percakapan atau thread saat ini jika didukung, dan merutekan tindak lanjut ke sesi tersebut sampai ditutup/kedaluwarsa. Codex hanya mengikuti jalur ini ketika ACP diminta secara eksplisit atau runtime latar belakang yang diminta masih membutuhkan ACP.

## ACP versus sub-agen

Gunakan ACP jika Anda menginginkan runtime harness eksternal. Gunakan native app-server Codex untuk binding/kontrol percakapan Codex. Gunakan sub-agen jika Anda menginginkan eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agen                   |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw    |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Perintah utama | `/acp ...`                           | `/subagents ...`                    |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. plugin runtime `acpx` bawaan
3. adapter ACP Claude
4. mesin runtime/sesi sisi Claude

Perbedaan penting:

- Claude ACP adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan task latar belakang, dan binding percakapan/thread opsional.
- Backend CLI adalah runtime fallback lokal hanya-teks yang terpisah. Lihat [Backend CLI](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang dapat di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan backend CLI

## Sesi terikat

### Binding percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke sesi ACP yang di-spawn — tanpa child thread, surface chat yang sama. OpenClaw tetap memiliki transport, auth, keamanan, dan pengiriman; pesan tindak lanjut dalam percakapan itu dirutekan ke sesi yang sama; `/new` dan `/reset` mereset sesi di tempat; `/acp close` menghapus binding.

Model mental:

- **surface chat** — tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **sesi ACP** — status runtime Codex/Claude/Gemini tahan lama yang dirutekan oleh OpenClaw.
- **child thread/topik** — surface pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **workspace runtime** — lokasi filesystem (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Ini independen dari surface chat.

Contoh:

- `/codex bind` — pertahankan chat ini, spawn atau lampirkan native app-server Codex, rute pesan berikutnya ke sini.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — sesuaikan thread native Codex yang terikat dari chat.
- `/codex stop` atau `/codex steer focus on the failing tests first` — kendalikan giliran native Codex yang aktif.
- `/acp spawn codex --bind here` — fallback ACP eksplisit untuk Codex.
- `/acp spawn codex --thread auto` — OpenClaw dapat membuat child thread/topik dan mengikat di sana.
- `/acp spawn codex --bind here --cwd /workspace/repo` — binding chat yang sama, Codex berjalan di `/workspace/repo`.

Catatan:

- `--bind here` dan `--thread ...` bersifat saling eksklusif.
- `--bind here` hanya berfungsi pada channel yang mengiklankan binding percakapan saat ini; jika tidak, OpenClaw mengembalikan pesan tidak didukung yang jelas. Binding tetap ada setelah restart gateway.
- Di Discord, `spawnAcpSessions` hanya diperlukan ketika OpenClaw perlu membuat child thread untuk `--thread auto|here` — bukan untuk `--bind here`.
- Jika Anda melakukan spawn ke agen ACP berbeda tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Jalur turunan yang hilang (`ENOENT`/`ENOTDIR`) akan fallback ke default backend; error akses lain (misalnya `EACCES`) akan muncul sebagai error spawn.

### Sesi terikat thread

Ketika binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan tindak lanjut di thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/tutup/arsip/timeout idle atau kedaluwarsa usia maksimum menghapus binding.

Dukungan binding thread bersifat spesifik adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan tidak didukung/tidak tersedia yang jelas.

Feature flag yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (set `false` untuk menjeda dispatch ACP)
- Flag spawn thread ACP adapter channel aktif (spesifik adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Adapter channel apa pun yang mengekspos kapabilitas binding sesi/thread.
- Dukungan bawaan saat ini:
  - thread/channel Discord
  - topik Telegram (topik forum di grup/supergrup dan topik DM)
- Plugin channel dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Pengaturan khusus channel

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten dalam entri `bindings[]` tingkat atas.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - channel atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Gunakan `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Gunakan `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agen OpenClaw pemilik.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP sekali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Prioritas override untuk sesi ACP terikat:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. default ACP global (misalnya `acp.backend`)

Contoh:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Perilaku:

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada sebelum digunakan.
- Pesan di channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan yang terikat, `/new` dan `/reset` mereset session key ACP yang sama di tempat.
- Binding runtime sementara (misalnya yang dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari konfigurasi agen.
- Jalur workspace turunan yang hilang akan fallback ke `cwd` default backend; kegagalan akses yang bukan karena hilang akan muncul sebagai error spawn.

## Memulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau panggilan tool.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Catatan:

- `runtime` default-nya adalah `subagent`, jadi set `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` jika dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` untuk mempertahankan percakapan terikat yang persisten.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness ACP target. Fallback ke `acp.defaultAgent` jika disetel.
- `thread` (opsional, default `false`): minta alur binding thread jika didukung.
- `mode` (opsional): `run` (sekali jalan) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten tergantung jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target jika dikonfigurasi; jalur turunan yang hilang akan fallback ke default backend, sedangkan error akses yang nyata akan dikembalikan.
- `label` (opsional): label yang menghadap operator yang digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` men-stream ringkasan progres eksekusi ACP awal kembali ke sesi peminta sebagai event sistem.
  - Jika tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berscope sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.
- `model` (opsional): override model eksplisit untuk sesi child ACP. Dihormati untuk `runtime: "acp"` agar child menggunakan model yang diminta alih-alih diam-diam fallback ke default agen target.

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang milik parent. Jalur pengirimannya bergantung pada bentuk tersebut.

### Sesi ACP interaktif

Sesi interaktif dimaksudkan untuk terus berbicara di surface chat yang terlihat:

- `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
- `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
- `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

Pesan tindak lanjut di percakapan yang terikat dirutekan langsung ke sesi ACP, dan output ACP dikirim kembali ke channel/thread/topik yang sama.

### Sesi ACP sekali jalan milik parent

Sesi ACP sekali jalan yang di-spawn oleh eksekusi agen lain adalah child latar belakang, mirip dengan sub-agen:

- Parent meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Child berjalan di sesi harness ACP-nya sendiri.
- Penyelesaian dilaporkan kembali melalui jalur announce penyelesaian task internal.
- Parent menulis ulang hasil child dalam suara asisten normal ketika balasan yang menghadap pengguna berguna.

Jangan perlakukan jalur ini sebagai chat peer-to-peer antara parent dan child. Child sudah memiliki saluran penyelesaian kembali ke parent.

### `sessions_send` dan pengiriman A2A

`sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A) setelah menyuntikkan pesan:

- tunggu balasan sesi target
- secara opsional biarkan peminta dan target bertukar sejumlah terbatas giliran tindak lanjut
- minta target menghasilkan pesan announce
- kirim announce tersebut ke channel atau thread yang terlihat

Jalur A2A itu adalah fallback untuk pengiriman peer ketika pengirim membutuhkan tindak lanjut yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan `tools.sessions.visibility` yang luas.

OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah parent dari child ACP sekali jalan miliknya sendiri. Dalam kasus itu, menjalankan A2A di atas penyelesaian task dapat membangunkan parent dengan hasil child, meneruskan balasan parent kembali ke child, dan menciptakan loop gema parent/child. Hasil `sessions_send` melaporkan `delivery.status="skipped"` untuk kasus owned-child tersebut karena jalur penyelesaian sudah bertanggung jawab atas hasilnya.

### Melanjutkan sesi yang ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga ia melanjutkan dengan konteks penuh dari apa yang sudah terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop Anda ke ponsel Anda — beri tahu agen Anda untuk melanjutkan dari tempat terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda
- Lanjutkan pekerjaan yang terhenti karena restart gateway atau timeout idle

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime sub-agen.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika session ID tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

<Accordion title="Uji smoke pasca-deploy">

Setelah deploy gateway, jalankan pemeriksaan live end-to-end alih-alih hanya mempercayai unit test:

1. Verifikasi versi gateway dan commit yang di-deploy pada host target.
2. Buka sesi bridge ACPX sementara ke agen live.
3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan task `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifikasi `accepted=yes`, `childSessionKey` nyata, dan tidak ada error validator.
5. Bersihkan sesi bridge sementara.

Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` — jalur `mode: "session"` terikat thread dan stream-relay adalah pass integrasi terpisah yang lebih kaya.

</Accordion>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Keterbatasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda membutuhkan eksekusi yang dipaksakan oleh sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat saat diperlukan.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flag utama:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Lihat [Perintah Slash](/id/tools/slash-commands).

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama ikut serta dalam langkah 2.

Jika tidak ada target yang ter-resolve, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                              |
| ------ | --------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan buat binding percakapan saat ini.                              |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini didukung Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Di thread aktif: ikat thread itu. Di luar thread: buat/ikat child thread jika didukung.             |
| `here` | Wajib ada thread aktif saat ini; gagal jika tidak berada di thread.                                  |
| `off`  | Tanpa binding. Sesi dimulai tanpa terikat.                                                           |

Catatan:

- Pada surface tanpa binding thread, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` jika Anda ingin menyematkan percakapan saat ini tanpa membuat child thread.

## Kontrol ACP

| Perintah             | Fungsinya                                                | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; opsional bind saat ini atau bind thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang sedang berjalan.   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas bind target thread.             | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Menetapkan mode runtime untuk sesi target.               | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menetapkan override direktori kerja runtime.             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menetapkan profil kebijakan approval.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Menetapkan timeout runtime (detik).                      | `/acp timeout 120`                                            |
| `/acp model`         | Menetapkan override model runtime.                       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                    | `/acp reset-options`                                          |
| `/acp sessions`      | Menampilkan daftar sesi ACP terbaru dari penyimpanan.    | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif plus pengenal sesi tingkat runtime dan tingkat backend. Error kontrol yang tidak didukung akan muncul dengan jelas ketika sebuah backend tidak memiliki kapabilitas tersebut. `/acp sessions` membaca penyimpanan untuk sesi terikat saat ini atau sesi peminta; token target (`session-key`, `session-id`, atau `session-label`) di-resolve melalui discovery sesi gateway, termasuk root `session.store` kustom per agen.

## Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik.

Operasi yang ekuivalen:

- `/acp model <id>` dipetakan ke key config runtime `model`.
- `/acp permissions <profile>` dipetakan ke key config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke key config runtime `timeout`.
- `/acp cwd <path>` langsung memperbarui override cwd runtime.
- `/acp set <key> <value>` adalah jalur generik.
  - Kasus khusus: `key=cwd` menggunakan jalur override cwd.
- `/acp reset-options` menghapus semua override runtime untuk sesi target.

## Harness acpx, setup plugin, dan perizinan

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI), bridge MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat [Agen ACP — setup](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                           | Perbaikan                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Plugin backend hilang atau dinonaktifkan.                                      | Instal dan aktifkan plugin backend, lalu jalankan `/acp doctor`.                                                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP dinonaktifkan secara global.                                               | Set `acp.enabled=true`.                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | Dispatch dari pesan thread normal dinonaktifkan.                               | Set `acp.dispatch.enabled=true`.                                                                                                                                          |
| `ACP agent "<id>" is not allowed by policy`                                  | Agen tidak ada dalam allowlist.                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                      | Token key/id/label buruk.                                                      | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation`  | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.             | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa bind.                                                                                               |
| `Conversation bindings are unavailable for <channel>.`                       | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.            | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                                    |
| `--thread here requires running /acp spawn inside an active ... thread`      | `--thread here` digunakan di luar konteks thread.                              | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`                | Pengguna lain memiliki target binding aktif.                                   | Rebind sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                             | Adapter tidak memiliki kapabilitas binding thread.                             | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.            | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan spawn ACP dari sesi yang tidak dalam sandbox.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | `sandbox="require"` diminta untuk runtime ACP.                                 | Gunakan `runtime="subagent"` untuk sandboxing yang diwajibkan, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak dalam sandbox.                          |
| Metadata ACP hilang untuk sesi terikat                                       | Metadata sesi ACP sudah usang/dihapus.                                         | Buat ulang dengan `/acp spawn`, lalu lakukan rebind/fokus thread lagi.                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | `permissionMode` memblokir write/exec di sesi ACP non-interaktif.              | Set `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan restart gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration).      |
| Sesi ACP gagal lebih awal dengan output yang sangat sedikit                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.        | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, set `permissionMode=approve-all`; untuk degradasi yang anggun, set `nonInteractivePermissions=deny`.     |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                   | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.          | Pantau dengan `ps aux \| grep acpx`; matikan proses usang secara manual.                                                                                                  |

## Terkait

- [Sub-agen](/id/tools/subagents)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Agent send](/id/tools/agent-send)
