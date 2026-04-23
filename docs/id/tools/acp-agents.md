---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat ke percakapan pada channel pesan
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Men-debug wiring backend ACP dan Plugin
    - Men-debug pengiriman completion ACP atau loop agen-ke-agen
    - Mengoperasikan perintah `/acp` dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agen harness lainnya
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T09:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui Plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa biasa untuk "jalankan ini di Codex" atau "mulai Claude Code di sebuah thread", OpenClaw harus merutekan permintaan itu ke runtime ACP (bukan runtime sub-agent native). Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan channel OpenClaw yang sudah ada, gunakan [`openclaw mcp serve`](/id/cli/mcp)
alih-alih ACP.

## Halaman mana yang saya perlukan?

Ada tiga surface terdekat yang mudah tertukar:

| Anda ingin...                                                                     | Gunakan ini                          | Catatan                                                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: ACP Agents              | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime     |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/id/cli/acp)           | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                           |
| Menggunakan kembali CLI AI lokal sebagai model fallback hanya-teks                 | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                              |

## Apakah ini berfungsi langsung?

Biasanya, ya.

- Instalasi baru sekarang menyertakan Plugin runtime `acpx` bawaan yang aktif secara default.
- Plugin `acpx` bawaan lebih memilih biner `acpx` pin lokal milik Plugin itu.
- Saat startup, OpenClaw mem-probe biner itu dan memperbaikinya sendiri jika diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan yang cepat.

Hal yang masih dapat terjadi pada penggunaan pertama:

- Adapter harness target dapat diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakan harness tersebut.
- Auth vendor tetap harus ada pada host untuk harness tersebut.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adapter saat pertama kali dapat gagal sampai cache dipanaskan sebelumnya atau adapter diinstal dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap mem-bootstrap `acpx`, tetapi adapter ACP Codex mungkin masih memerlukan pengambilan pertama kali.
- `/acp spawn claude`: cerita yang sama untuk adapter ACP Claude, ditambah auth sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini saat Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan kunci sesi itu secara eksplisit).
3. Periksa status runtime:
   - `/acp status`
4. Sesuaikan opsi runtime sesuai kebutuhan:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Beri dorongan pada sesi aktif tanpa mengganti konteks:
   - `/acp steer tighten logging and continue`
6. Hentikan pekerjaan:
   - `/acp cancel` (hentikan giliran saat ini), atau
   - `/acp close` (tutup sesi + hapus binding)

## Memulai cepat untuk manusia

Contoh permintaan alami:

- "Ikat channel Discord ini ke Codex."
- "Mulai sesi Codex persisten di sebuah thread di sini dan tetap fokus."
- "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan ringkas hasilnya."
- "Ikat chat iMessage ini ke Codex dan simpan tindak lanjut di workspace yang sama."
- "Gunakan Gemini CLI untuk tugas ini di sebuah thread, lalu simpan tindak lanjut di thread yang sama."

Yang harus dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Resolve target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika binding percakapan saat ini diminta dan channel aktif mendukungnya, ikat sesi ACP ke percakapan tersebut.
4. Jika tidak, jika binding thread diminta dan channel saat ini mendukungnya, ikat sesi ACP ke thread tersebut.
5. Rutekan pesan tindak lanjut yang terikat ke sesi ACP yang sama sampai di-unfocus/ditutup/kedaluwarsa.

## ACP versus sub-agent

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan sub-agent saat Anda menginginkan run delegasi native OpenClaw.

| Area          | Sesi ACP                              | Run sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agent native OpenClaw  |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agents](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, susunannya adalah:

1. Control plane sesi ACP OpenClaw
2. Plugin runtime `acpx` bawaan
3. Adapter ACP Claude
4. Mesin runtime/sesi sisi Claude

Perbedaan penting:

- ACP Claude adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan tugas latar belakang, dan binding percakapan/thread opsional.
- Backend CLI adalah runtime fallback lokal hanya-teks yang terpisah. Lihat [Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan backend CLI

## Sesi terikat

### Binding percakapan saat ini

Gunakan `/acp spawn <harness> --bind here` saat Anda ingin percakapan saat ini menjadi workspace ACP yang tahan lama tanpa membuat child thread.

Perilaku:

- OpenClaw tetap memiliki transport channel, auth, keamanan, dan pengiriman.
- Percakapan saat ini dipin ke kunci sesi ACP yang di-spawn.
- Pesan tindak lanjut dalam percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` me-reset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Artinya dalam praktik:

- `--bind here` mempertahankan surface chat yang sama. Di Discord, channel saat ini tetap channel saat ini.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang men-spawn pekerjaan baru. Binding tersebut menempelkan sesi itu ke percakapan saat ini.
- `--bind here` tidak membuat child thread Discord atau topik Telegram dengan sendirinya.
- Runtime ACP tetap dapat memiliki direktori kerja (`cwd`) atau workspace yang dikelola backend di disk. Workspace runtime tersebut terpisah dari surface chat dan tidak menyiratkan thread pesan baru.
- Jika Anda men-spawn ke agen ACP yang berbeda dan tidak memberikan `--cwd`, OpenClaw mewarisi workspace **agen target**, bukan milik peminta.
- Jika path workspace yang diwarisi itu tidak ada (`ENOENT`/`ENOTDIR`), OpenClaw fallback ke `cwd` default backend alih-alih diam-diam menggunakan tree yang salah.
- Jika workspace yang diwarisi ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan error akses yang sebenarnya alih-alih menghapus `cwd`.

Model mental:

- surface chat: tempat orang terus berbicara (`channel Discord`, `topik Telegram`, `chat iMessage`)
- sesi ACP: status runtime Codex/Claude/Gemini yang tahan lama yang dirutekan oleh OpenClaw
- child thread/topik: surface pesan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau lampirkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sesi itu
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat child thread/topik dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Channel chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui jalur conversation-binding bersama.
- Channel dengan semantik thread/topik kustom tetap dapat menyediakan kanonisasi khusus channel di balik antarmuka bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Binding percakapan saat ini generik menggunakan penyimpanan binding OpenClaw bersama dan tetap bertahan setelah restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat channel atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here`.
- Jika channel aktif tidak mengekspos binding ACP percakapan saat ini, OpenClaw mengembalikan pesan unsupported yang jelas.
- `resume` dan pertanyaan "sesi baru" adalah pertanyaan sesi ACP, bukan pertanyaan channel. Anda dapat menggunakan ulang atau mengganti status runtime tanpa mengubah surface chat saat ini.

### Sesi terikat thread

Saat binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat sebuah thread ke sesi ACP target.
- Pesan tindak lanjut di thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/tutup/archive/idle-timeout atau kedaluwarsa max-age menghapus binding.

Dukungan binding thread bersifat khusus adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Feature flag yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (setel `false` untuk menjeda dispatch ACP)
- Feature flag spawn thread ACP adapter channel aktif (khusus adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Adapter channel apa pun yang mengekspos capability binding sesi/thread.
- Dukungan bawaan saat ini:
  - Thread/channel Discord
  - Topik Telegram (topik forum di grup/supergrup dan topik DM)
- Channel Plugin dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Pengaturan khusus channel

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten dalam entri `bindings[]` level atas.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - Channel atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Pilih `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - Chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Pilih `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agen OpenClaw pemilik.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP satu kali per agen:

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
- Pesan dalam channel atau topik itu dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` me-reset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur thread-focus) tetap berlaku jika ada.
- Untuk spawn ACP lintas-agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari config agen.
- Path workspace yang diwarisi tetapi hilang fallback ke `cwd` default backend; kegagalan akses pada path yang ada ditampilkan sebagai error spawn.

## Mulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau pemanggilan alat.

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

- `runtime` default ke `subagent`, jadi setel `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` jika dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` agar percakapan terikat persisten tetap dipertahankan.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness target ACP. Fallback ke `acp.defaultAgent` jika disetel.
- `thread` (opsional, default `false`): minta alur binding thread jika didukung.
- `mode` (opsional): `run` (sekali jalan) atau `session` (persisten).
  - default-nya adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten per jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target saat dikonfigurasi; path turunan yang hilang fallback ke default backend, sementara error akses nyata dikembalikan.
- `label` (opsional): label yang terlihat oleh operator, digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` men-stream ringkasan progres run ACP awal kembali ke sesi peminta sebagai event sistem.
  - Jika tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berskala sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.
- `model` (opsional): override model eksplisit untuk sesi child ACP. Dihormati untuk `runtime: "acp"` sehingga child menggunakan model yang diminta alih-alih diam-diam fallback ke default agen target.

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

### Sesi ACP interaktif

Sesi interaktif dimaksudkan agar tetap berbicara di surface chat yang terlihat:

- `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
- `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
- `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

Pesan tindak lanjut dalam percakapan terikat dirutekan langsung ke sesi ACP, dan output ACP dikirim kembali ke channel/thread/topik yang sama.

### Sesi ACP sekali jalan milik induk

Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah child latar belakang, mirip dengan sub-agent:

- Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Child berjalan dalam sesi harness ACP miliknya sendiri.
- Completion melapor kembali melalui jalur announce penyelesaian tugas internal.
- Induk menulis ulang hasil child dengan suara asisten normal ketika balasan yang terlihat pengguna berguna.

Jangan perlakukan jalur ini sebagai chat peer-to-peer antara induk dan child. Child sudah memiliki channel completion kembali ke induk.

### `sessions_send` dan pengiriman A2A

`sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A) setelah menyuntikkan pesan:

- tunggu balasan sesi target
- secara opsional biarkan peminta dan target bertukar sejumlah giliran tindak lanjut yang dibatasi
- minta target menghasilkan pesan announce
- kirim announce itu ke channel atau thread yang terlihat

Jalur A2A itu adalah fallback untuk pengiriman peer ketika pengirim memerlukan tindak lanjut yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan `tools.sessions.visibility` yang luas.

OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah induk dari child ACP sekali jalan miliknya sendiri. Dalam kasus itu, menjalankan A2A di atas task completion dapat membangunkan induk dengan hasil child, meneruskan balasan induk kembali ke child, dan menciptakan loop gema induk/child. Hasil `sessions_send` melaporkan `delivery.status="skipped"` untuk kasus owned-child tersebut karena jalur completion sudah bertanggung jawab atas hasilnya.

### Lanjutkan sesi yang sudah ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga agen melanjutkan dengan konteks penuh atas apa yang terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop Anda ke ponsel Anda — minta agen Anda melanjutkan dari tempat Anda berhenti
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda
- Lanjutkan pekerjaan yang terganggu oleh restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime sub-agent.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway saat Anda menginginkan pemeriksaan live cepat bahwa spawn ACP
benar-benar berfungsi end-to-end, bukan hanya lolos unit test.

Gerbang yang disarankan:

1. Verifikasi versi/commit gateway yang dideploy pada host target.
2. Konfirmasikan bahwa source yang dideploy mencakup penerimaan lineage ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agen live (misalnya
   `razor(main)` di `jpclawhq`).
4. Minta agen itu memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tugas: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi bahwa agen melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada error validator
6. Bersihkan sesi bridge ACPX sementara.

Contoh prompt ke agen live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Catatan:

- Pertahankan smoke test ini pada `mode: "run"` kecuali Anda memang sedang menguji
  sesi ACP persisten yang terikat thread.
- Jangan mewajibkan `streamTo: "parent"` untuk gerbang dasar. Jalur itu bergantung pada
  capability peminta/sesi dan merupakan pemeriksaan integrasi terpisah.
- Perlakukan pengujian `mode: "session"` yang terikat thread sebagai pass integrasi kedua yang lebih kaya dari thread Discord atau topik Telegram nyata.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Keterbatasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` dan `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang ditegakkan sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat bila diperlukan.

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

Lihat [Slash Commands](/id/tools/slash-commands).

## Resolusi target sesi

Sebagian besar aksi `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama ikut serta pada langkah 2.

Jika tidak ada target yang dapat di-resolve, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan buat binding percakapan saat ini.                                 |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini didukung Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam pemanggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Di thread aktif: ikat thread itu. Di luar thread: buat/ikat child thread saat didukung.          |
| `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di thread.                         |
| `off`  | Tidak ada binding. Sesi dimulai tanpa binding.                                                     |

Catatan:

- Pada surface tanpa binding thread, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` saat Anda ingin mem-pin percakapan saat ini tanpa membuat child thread.

## Kontrol ACP

Keluarga perintah yang tersedia:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` menampilkan opsi runtime yang efektif dan, jika tersedia, pengenal sesi tingkat runtime maupun tingkat backend.

Beberapa kontrol bergantung pada capability backend. Jika sebuah backend tidak mendukung kontrol tertentu, OpenClaw mengembalikan error unsupported-control yang jelas.

## Buku resep perintah ACP

| Perintah             | Fungsinya                                                | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Buat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                 |
| `/acp cancel`        | Batalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Kirim instruksi steer ke sesi yang sedang berjalan.      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Tutup sesi dan lepas binding target thread.              | `/acp close`                                                  |
| `/acp status`        | Tampilkan backend, mode, status, opsi runtime, capability. | `/acp status`                                              |
| `/acp set-mode`      | Setel mode runtime untuk sesi target.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Tulis opsi config runtime generik.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Setel override direktori kerja runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Setel profil kebijakan persetujuan.                      | `/acp permissions strict`                                     |
| `/acp timeout`       | Setel timeout runtime (detik).                           | `/acp timeout 120`                                            |
| `/acp model`         | Setel override model runtime.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Hapus override opsi runtime sesi.                        | `/acp reset-options`                                          |
| `/acp sessions`      | Daftar sesi ACP terbaru dari store.                      | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, capability, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                       |
| `/acp install`       | Cetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                             |

`/acp sessions` membaca store untuk sesi terikat saat ini atau sesi peminta. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` me-resolve target melalui discovery sesi gateway, termasuk root `session.store` khusus per-agen.

## Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik.

Operasi yang setara:

- `/acp model <id>` dipetakan ke key config runtime `model`.
- `/acp permissions <profile>` dipetakan ke key config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke key config runtime `timeout`.
- `/acp cwd <path>` memperbarui override cwd runtime secara langsung.
- `/acp set <key> <value>` adalah jalur generik.
  - Kasus khusus: `key=cwd` menggunakan jalur override cwd.
- `/acp reset-options` menghapus semua override runtime untuk sesi target.

## Dukungan harness acpx (saat ini)

Alias harness bawaan acpx saat ini:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Saat OpenClaw menggunakan backend acpx, pilih nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` di config acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter sewenang-wenang melalui `--agent <command>`, tetapi escape hatch mentah tersebut adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

## Config yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default-nya true; setel false untuk menjeda dispatch ACP sambil mempertahankan kontrol /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Config binding thread bersifat khusus adapter channel. Contoh untuk Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jika spawn ACP terikat thread tidak berfungsi, verifikasi feature flag adapter terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child-thread. Binding ini memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Configuration Reference](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru mengirimkan Plugin runtime `acpx` bawaan yang aktif secara default, jadi ACP
biasanya berfungsi tanpa langkah instalasi Plugin manual.

Mulailah dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan jalur Plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, Plugin backend acpx bawaan (`acpx`) menggunakan biner pin lokal milik Plugin:

1. Perintah default ke `node_modules/.bin/acpx` lokal Plugin di dalam paket Plugin ACPX.
2. Versi yang diharapkan default ke pin extension.
3. Startup mendaftarkan backend ACP segera sebagai belum siap.
4. Sebuah pekerjaan ensure latar belakang memverifikasi `acpx --version`.
5. Jika biner lokal Plugin hilang atau tidak cocok, ia menjalankan:
   `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang.

Anda dapat menimpa perintah/versi di config Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Catatan:

- `command` menerima path absolut, path relatif, atau nama perintah (`acpx`).
- Path relatif di-resolve dari direktori workspace OpenClaw.
- `expectedVersion: "any"` menonaktifkan pencocokan versi yang ketat.
- Saat `command` menunjuk ke biner/path kustom, auto-install lokal Plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(biner khusus platform) diinstal secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat Plugin OpenClaw yang terinstal seperti recall/store memori, aktifkan bridge khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Fungsinya:

- Menginjeksi server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan default-nya mati.

Catatan keamanan dan kepercayaan:

- Ini memperluas surface alat harness ACP.
- Agen ACP hanya mendapatkan akses ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama dengan membiarkan Plugin tersebut dieksekusi di dalam OpenClaw sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah kemudahan tambahan yang bersifat opt-in, bukan pengganti config server MCP generik.

### Bridge MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat OpenClaw bawaan melalui
MCP. Aktifkan bridge alat inti yang terpisah saat agen ACP memerlukan alat
bawaan terpilih seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Fungsinya:

- Menginjeksi server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos alat OpenClaw bawaan terpilih. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti tetap eksplisit dan default-nya mati.

### Konfigurasi timeout runtime

Plugin `acpx` bawaan secara default menetapkan timeout giliran runtime tersemat ke
120 detik. Ini memberi harness yang lebih lambat seperti Gemini CLI waktu yang cukup untuk menyelesaikan
startup dan inisialisasi ACP. Timpa jika host Anda memerlukan batas
runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Restart gateway setelah mengubah nilai ini.

### Konfigurasi agen probe kesehatan

Plugin `acpx` bawaan mem-probe satu agen harness saat memutuskan apakah
backend runtime tersemat siap. Default-nya `codex`. Jika deployment Anda
menggunakan agen ACP default yang berbeda, setel agen probe ke id yang sama:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin tulis-file dan exec-shell. Plugin acpx menyediakan dua key config yang mengontrol cara penanganan izin:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                 |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                 |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu menjadi kasus untuk sesi ACP).

| Nilai  | Perilaku                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**             |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi yang anggun). |

### Konfigurasi

Setel melalui config Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi terdegradasi dengan anggun alih-alih crash.

## Pemecahan masalah

| Gejala                                                                      | Penyebab yang mungkin                                                              | Perbaikan                                                                                                                                                           |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau nonaktif.                                                | Instal dan aktifkan Plugin backend, lalu jalankan `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                    | Setel `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                    | Setel `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam allowlist.                                                     | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                |
| `Unable to resolve session target: ...`                                     | Token key/id/label buruk.                                                           | Jalankan `/acp sessions`, salin key/label yang persis, lalu coba lagi.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                  | Pindah ke chat/channel target lalu coba lagi, atau gunakan spawn tanpa binding.                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki capability binding ACP percakapan saat ini.                  | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` level atas, atau pindah ke channel yang didukung.                                |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                   | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                        | Lakukan rebind sebagai pemilik atau gunakan percakapan atau thread yang berbeda.                                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki capability binding thread.                                   | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                 | Gunakan `runtime="subagent"` dari sesi bersandbox, atau jalankan spawn ACP dari sesi yang tidak bersandbox.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                      | Gunakan `runtime="subagent"` untuk sandboxing yang diwajibkan, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak bersandbox.                       |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP usang/terhapus.                                                   | Buat ulang dengan `/acp spawn`, lalu rebind/fokuskan thread.                                                                                                        |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.            | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` lalu restart gateway. Lihat [Konfigurasi izin](#permission-configuration).                    |
| Sesi ACP gagal lebih awal dengan output yang sedikit                        | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.             | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi yang anggun, setel `nonInteractivePermissions=deny`. |
| Sesi ACP macet tanpa batas setelah pekerjaan selesai                        | Proses harness selesai tetapi sesi ACP tidak melaporkan completion.                 | Pantau dengan `ps aux \| grep acpx`; matikan proses usang secara manual.                                                                                            |
