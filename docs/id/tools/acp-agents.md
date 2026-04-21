---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat ke percakapan pada channel messaging
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Men-debug backend ACP dan wiring Plugin
    - Mengoperasikan perintah /acp dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agent harness lainnya
title: Agent ACP
x-i18n:
    generated_at: "2026-04-21T09:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agent ACP

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui Plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa biasa untuk "jalankan ini di Codex" atau "mulai Claude Code di thread", OpenClaw harus merutekan permintaan itu ke runtime ACP (bukan runtime sub-agent native). Setiap spawn sesi ACP dilacak sebagai [task latar belakang](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan channel OpenClaw yang ada, gunakan [`openclaw mcp serve`](/cli/mcp)
alih-alih ACP.

## Halaman mana yang saya butuhkan?

Ada tiga permukaan terkait yang mudah tertukar:

| Anda ingin...                                                                     | Gunakan ini                            | Catatan                                                                                                        |
| ---------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: Agent ACP                 | Sesi yang terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, task latar belakang, kontrol runtime |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/cli/acp)             | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                       |
| Menggunakan ulang AI CLI lokal sebagai model fallback hanya-teks                  | [CLI Backends](/id/gateway/cli-backends)  | Bukan ACP. Tanpa tool OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                       |

## Apakah ini langsung berfungsi?

Biasanya, ya.

- Instalasi baru sekarang mengirim Plugin runtime `acpx` bawaan yang aktif secara default.
- Plugin `acpx` bawaan mengutamakan binary `acpx` yang dipin secara lokal di Plugin.
- Saat startup, OpenClaw mem-probe binary tersebut dan memperbaikinya sendiri bila diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan cepat.

Yang masih bisa terjadi pada penggunaan pertama:

- Adapter harness target dapat diambil sesuai permintaan dengan `npx` saat pertama kali Anda menggunakan harness itu.
- Auth vendor tetap harus ada pada host untuk harness tersebut.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adapter saat run pertama dapat gagal sampai cache dipanaskan lebih dulu atau adapter diinstal dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap mem-boot `acpx`, tetapi adapter ACP Codex mungkin masih memerlukan pengambilan pertama.
- `/acp spawn claude`: cerita yang sama untuk adapter ACP Claude, plus auth sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini saat Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan session key itu secara eksplisit).
3. Periksa state runtime:
   - `/acp status`
4. Sesuaikan opsi runtime sesuai kebutuhan:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dorong sesi aktif tanpa mengganti konteks:
   - `/acp steer tighten logging and continue`
6. Hentikan pekerjaan:
   - `/acp cancel` (hentikan giliran saat ini), atau
   - `/acp close` (tutup sesi + hapus binding)

## Mulai cepat untuk manusia

Contoh permintaan natural:

- "Ikat channel Discord ini ke Codex."
- "Mulai sesi Codex persisten di thread di sini dan tetap fokus."
- "Jalankan ini sebagai sesi ACP Claude Code one-shot lalu rangkum hasilnya."
- "Ikat chat iMessage ini ke Codex dan simpan tindak lanjut di workspace yang sama."
- "Gunakan Gemini CLI untuk task ini di thread, lalu simpan tindak lanjut di thread yang sama."

Apa yang harus dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Resolve target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika binding percakapan saat ini diminta dan channel aktif mendukungnya, ikat sesi ACP ke percakapan itu.
4. Jika tidak, bila binding thread diminta dan channel saat ini mendukungnya, ikat sesi ACP ke thread itu.
5. Rutekan pesan lanjutan yang terikat ke sesi ACP yang sama sampai unfocus/closed/expired.

## ACP versus sub-agent

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan sub-agent saat Anda menginginkan run delegasi native OpenClaw.

| Area          | Sesi ACP                              | Run sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agent native OpenClaw  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agents](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. Plugin runtime `acpx` bawaan
3. Adapter ACP Claude
4. Runtime/sesi sisi Claude

Perbedaan penting:

- ACP Claude adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan task latar belakang, dan binding percakapan/thread opsional.
- CLI backend adalah runtime fallback lokal hanya-teks yang terpisah. Lihat [CLI Backends](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan CLI backend

## Sesi terikat

### Bind percakapan saat ini

Gunakan `/acp spawn <harness> --bind here` saat Anda ingin percakapan saat ini menjadi workspace ACP yang tahan lama tanpa membuat child thread.

Perilaku:

- OpenClaw tetap memiliki transport channel, auth, keamanan, dan pengiriman.
- Percakapan saat ini dipin ke session key ACP yang di-spawn.
- Pesan lanjutan dalam percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Apa artinya ini dalam praktik:

- `--bind here` mempertahankan permukaan chat yang sama. Di Discord, channel saat ini tetap channel saat ini.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang me-spawn pekerjaan baru. Binding itu menempelkan sesi tersebut ke percakapan saat ini.
- `--bind here` tidak membuat child thread Discord atau topik Telegram dengan sendirinya.
- Runtime ACP tetap dapat memiliki direktori kerja (`cwd`) atau workspace yang dikelola backend pada disk. Workspace runtime itu terpisah dari permukaan chat dan tidak menyiratkan thread pesan baru.
- Jika Anda spawn ke agent ACP yang berbeda dan tidak meneruskan `--cwd`, OpenClaw mewarisi workspace **agent target** secara default, bukan milik peminta.
- Jika path workspace yang diwarisi itu hilang (`ENOENT`/`ENOTDIR`), OpenClaw fallback ke cwd default backend alih-alih diam-diam menggunakan tree yang salah.
- Jika workspace yang diwarisi ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan error akses yang sebenarnya alih-alih menghilangkan `cwd`.

Model mental:

- permukaan chat: tempat orang terus berbicara (`channel Discord`, `topik Telegram`, `chat iMessage`)
- sesi ACP: state runtime Codex/Claude/Gemini yang tahan lama yang dirutekan OpenClaw
- child thread/topic: permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau lampirkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sesi itu
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat child thread/topic dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Channel chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui path conversation-binding bersama.
- Channel dengan semantik thread/topic kustom tetap dapat menyediakan kanonisasi khusus channel di balik interface bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Bind percakapan saat ini generik menggunakan store binding OpenClaw bersama dan bertahan melewati restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat channel atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here`.
- Jika channel aktif tidak mengekspos binding ACP percakapan saat ini, OpenClaw mengembalikan pesan tidak didukung yang jelas.
- `resume` dan pertanyaan "new session" adalah pertanyaan sesi ACP, bukan pertanyaan channel. Anda dapat menggunakan ulang atau mengganti state runtime tanpa mengubah permukaan chat saat ini.

### Sesi terikat thread

Saat binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan lanjutan di thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/close/archive/idle-timeout atau max-age expiry menghapus binding.

Dukungan binding thread bersifat spesifik adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Flag fitur yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (setel `false` untuk menjeda dispatch ACP)
- Flag spawn thread ACP adapter channel aktif (spesifik adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Adapter channel apa pun yang mengekspos kapabilitas binding sesi/thread.
- Dukungan bawaan saat ini:
  - Thread/channel Discord
  - Topik Telegram (topik forum di grup/supergroup dan topik DM)
- Channel Plugin dapat menambahkan dukungan melalui interface binding yang sama.

## Pengaturan khusus channel

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten dalam entri `bindings[]` level atas.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - Channel atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Utamakan `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - Chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Utamakan `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agent OpenClaw yang memiliki binding.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agent

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP sekali per agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Urutan prioritas override untuk sesi ACP terikat:

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
- Dalam percakapan terikat, `/new` dan `/reset` mereset session key ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur fokus-thread) tetap berlaku saat ada.
- Untuk spawn ACP lintas-agent tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agent target dari config agent.
- Path workspace yang diwarisi tetapi hilang akan fallback ke cwd default backend; kegagalan akses pada path yang tidak hilang muncul sebagai error spawn.

## Memulai sesi ACP (interface)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agent atau tool call.

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

- Default `runtime` adalah `subagent`, jadi setel `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` saat dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` untuk mempertahankan percakapan terikat yang persisten.

Detail interface:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness target ACP. Fallback ke `acp.defaultAgent` jika diatur.
- `thread` (opsional, default `false`): minta alur binding thread saat didukung.
- `mode` (opsional): `run` (one-shot) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten per path runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agent target saat dikonfigurasi; path warisan yang hilang fallback ke default backend, sementara error akses nyata dikembalikan.
- `label` (opsional): label yang terlihat operator yang digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang ada alih-alih membuat yang baru. Agent memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` mengalirkan ringkasan progres run ACP awal kembali ke sesi peminta sebagai system event.
  - Saat tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berscope sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay penuh.

### Melanjutkan sesi yang ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agent memutar ulang riwayat percakapannya melalui `session/load`, sehingga ia melanjutkan dengan konteks penuh dari yang terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop Anda ke ponsel Anda — minta agent Anda melanjutkan dari tempat terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agent Anda
- Lanjutkan pekerjaan yang terhenti oleh restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime sub-agent.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal pada sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
- Agent target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika session ID tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway saat Anda menginginkan pemeriksaan live cepat bahwa spawn ACP
benar-benar bekerja end-to-end, bukan sekadar lolos pengujian unit.

Gate yang direkomendasikan:

1. Verifikasi versi/commit gateway yang dideploy pada host target.
2. Konfirmasikan source yang dideploy mencakup penerimaan lineage ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agent live (misalnya
   `razor(main)` di `jpclawhq`).
4. Minta agent tersebut memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi agent melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada error validator
6. Bersihkan sesi bridge ACPX sementara.

Contoh prompt ke agent live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Catatan:

- Pertahankan smoke test ini pada `mode: "run"` kecuali Anda memang sedang menguji
  sesi ACP persisten yang terikat thread.
- Jangan mewajibkan `streamTo: "parent"` untuk gate dasar. Path itu bergantung pada
  kapabilitas peminta/sesi dan merupakan pemeriksaan integrasi terpisah.
- Perlakukan pengujian `mode: "session"` yang terikat thread sebagai
  pass integrasi kedua yang lebih kaya dari thread Discord atau topik Telegram nyata.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang dipaksa sandbox.

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

Sebagian besar action `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama berpartisipasi pada langkah 2.

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

| Mode   | Perilaku                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Dalam thread aktif: ikat thread itu. Di luar thread: buat/ikat child thread saat didukung.        |
| `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di thread.                          |
| `off`  | Tanpa binding. Sesi dimulai tidak terikat.                                                         |

Catatan:

- Pada permukaan non-thread-binding, perilaku default secara efektif adalah `off`.
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

`/acp status` menampilkan opsi runtime efektif dan, bila tersedia, identifier sesi level runtime maupun level backend.

Beberapa kontrol bergantung pada kapabilitas backend. Jika backend tidak mendukung suatu kontrol, OpenClaw mengembalikan error unsupported-control yang jelas.

## Buku resep perintah ACP

| Command              | Fungsinya                                                | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Buat sesi ACP; bind saat ini atau bind thread opsional.  | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Batalkan giliran in-flight untuk sesi target.            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Kirim instruksi steer ke sesi yang sedang berjalan.      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Tutup sesi dan lepas binding target thread.              | `/acp close`                                                  |
| `/acp status`        | Tampilkan backend, mode, state, opsi runtime, capabilities. | `/acp status`                                              |
| `/acp set-mode`      | Setel mode runtime untuk sesi target.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Setel override direktori kerja runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Setel profil kebijakan approval.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Setel timeout runtime (detik).                           | `/acp timeout 120`                                            |
| `/acp model`         | Setel override model runtime.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Hapus override opsi runtime sesi.                        | `/acp reset-options`                                          |
| `/acp sessions`      | Daftarkan sesi ACP terbaru dari store.                   | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, capabilities, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                      |
| `/acp install`       | Cetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                             |

`/acp sessions` membaca store untuk sesi terikat saat ini atau sesi peminta. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` me-resolve target melalui penemuan sesi gateway, termasuk root `session.store` khusus per-agent.

## Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik.

Operasi yang setara:

- `/acp model <id>` dipetakan ke kunci config runtime `model`.
- `/acp permissions <profile>` dipetakan ke kunci config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke kunci config runtime `timeout`.
- `/acp cwd <path>` memperbarui override cwd runtime secara langsung.
- `/acp set <key> <value>` adalah path generik.
  - Kasus khusus: `key=cwd` menggunakan path override cwd.
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

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agent kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agent `cursor` di config acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan path `agentId` OpenClaw normal).

## Config yang diperlukan

Baseline ACP core:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default true; setel false untuk menjeda dispatch ACP sambil tetap mempertahankan kontrol /acp.
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

Config binding thread bersifat spesifik adapter channel. Contoh untuk Discord:

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

Jika spawn ACP terikat thread tidak berfungsi, verifikasi dulu flag fitur adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bind percakapan saat ini tidak memerlukan pembuatan child-thread. Ini memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru mengirim Plugin runtime `acpx` bawaan yang aktif secara default, sehingga ACP
biasanya berfungsi tanpa langkah instal Plugin manual.

Mulailah dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan path Plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instal workspace lokal saat pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, Plugin backend acpx bawaan (`acpx`) menggunakan binary lokal-Plugin yang dipin:

1. Perintah default ke `node_modules/.bin/acpx` lokal Plugin di dalam package Plugin ACPX.
2. Versi yang diharapkan default ke pin extension.
3. Startup segera mendaftarkan backend ACP sebagai not-ready.
4. Job ensure latar belakang memverifikasi `acpx --version`.
5. Jika binary lokal-Plugin hilang atau tidak cocok, ia menjalankan:
   `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang.

Anda dapat mengoverride perintah/versi di config Plugin:

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
- `expectedVersion: "any"` menonaktifkan pencocokan versi ketat.
- Saat `command` menunjuk ke binary/path kustom, auto-install lokal-Plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/id/tools/plugin).

### Instal dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime
acpx (binary spesifik platform) diinstal otomatis
melalui hook postinstall. Jika instal otomatis gagal, gateway tetap memulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP Plugin tools

Secara default, sesi ACPX **tidak** mengekspos tool yang didaftarkan Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agent ACP seperti Codex atau Claude Code memanggil
tool Plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tool Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan default-off.

Catatan keamanan dan trust:

- Ini memperluas permukaan tool harness ACP.
- Agent ACP hanya mendapatkan akses ke tool Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas trust yang sama seperti membiarkan Plugin tersebut dieksekusi di
  OpenClaw itu sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap bekerja seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan opt-in tambahan, bukan pengganti config server MCP generik.

### Konfigurasi timeout runtime

Plugin `acpx` bawaan menetapkan timeout giliran runtime embedded ke 120 detik
secara default. Ini memberi cukup waktu bagi harness yang lebih lambat seperti Gemini CLI untuk menyelesaikan
startup dan inisialisasi ACP. Override jika host Anda memerlukan
batas runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Restart gateway setelah mengubah nilai ini.

### Konfigurasi agent probe kesehatan

Plugin `acpx` bawaan mem-probe satu agent harness saat memutuskan apakah
backend runtime embedded siap. Default-nya `codex`. Jika deployment Anda
menggunakan agent ACP default yang berbeda, setel probe agent ke id yang sama:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua kunci config yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor CLI-backend seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass level harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agent harness tanpa prompt.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Setujui otomatis pembacaan saja; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                  |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**             |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi yang graceful). |

### Konfigurasi

Atur melalui config Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, penulisan atau exec apa pun yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara graceful alih-alih crash.

## Pemecahan masalah

| Symptom                                                                     | Likely cause                                                                    | Fix                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau dinonaktifkan.                                       | Instal dan aktifkan Plugin backend, lalu jalankan `/acp doctor`.                                                                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                | Setel `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                | Setel `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent tidak ada dalam allowlist.                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                               |
| `Unable to resolve session target: ...`                                     | Token key/id/label salah.                                                       | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang bisa di-bind.               | Pindah ke chat/channel target lalu coba lagi, atau gunakan spawn yang tidak terikat.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.             | Gunakan `/acp spawn ... --thread ...` bila didukung, konfigurasikan `bindings[]` level atas, atau pindah ke channel yang didukung.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                               | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                    | Rebind sebagai pemilik atau gunakan percakapan atau thread yang berbeda.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas binding thread.                              | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.             | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan spawn ACP dari sesi tanpa sandbox.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                  | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi tanpa sandbox.                                        |
| Missing ACP metadata for bound session                                      | Metadata sesi ACP basi/terhapus.                                                | Buat ulang dengan `/acp spawn`, lalu rebind/fokus thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.        | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` lalu restart gateway. Lihat [Konfigurasi izin](#permission-configuration).                  |
| ACP session fails early with little output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.         | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi graceful, setel `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.           | Pantau dengan `ps aux \| grep acpx`; kill proses basi secara manual.                                                                                              |
