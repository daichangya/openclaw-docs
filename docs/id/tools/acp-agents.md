---
read_when:
    - Menjalankan coding harness melalui ACP
    - Menyiapkan sesi ACP yang terikat ke percakapan pada channel pesan
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP dan wiring plugin
    - Mengoperasikan perintah /acp dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agent harness lainnya
title: Agent ACP
x-i18n:
    generated_at: "2026-04-07T09:21:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agent ACP

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan coding harness eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui plugin backend ACP.

Jika Anda meminta OpenClaw dengan bahasa biasa untuk "jalankan ini di Codex" atau "mulai Claude Code dalam thread", OpenClaw harus merutekan permintaan tersebut ke runtime ACP (bukan runtime sub-agent native). Setiap spawn sesi ACP dilacak sebagai [background task](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan channel OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/cli/mcp) alih-alih ACP.

## Halaman mana yang saya butuhkan?

Ada tiga permukaan terkait yang mudah tertukar:

| Anda ingin...                                                                     | Gunakan ini                         | Catatan                                                                                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agent ACP              | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background task, kontrol runtime |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/cli/acp)          | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                           |
| Menggunakan ulang AI CLI lokal sebagai model fallback teks saja                    | [CLI Backends](/id/gateway/cli-backends) | Bukan ACP. Tidak ada tool OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                              |

## Apakah ini berfungsi langsung tanpa setup tambahan?

Biasanya, ya.

- Instalasi baru sekarang mengirim plugin runtime `acpx` bawaan dalam keadaan aktif secara default.
- Plugin `acpx` bawaan lebih memilih biner `acpx` yang dipin secara lokal di pluginnya.
- Saat startup, OpenClaw memeriksa biner tersebut dan memperbaikinya sendiri jika diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan yang cepat.

Hal yang masih bisa terjadi pada penggunaan pertama:

- Adapter harness target dapat diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakan harness tersebut.
- Autentikasi vendor tetap harus sudah ada pada host untuk harness itu.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adapter saat pertama kali dijalankan dapat gagal sampai cache dipanaskan sebelumnya atau adapter dipasang dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap untuk bootstrap `acpx`, tetapi adapter ACP Codex mungkin masih perlu diambil saat pertama kali dijalankan.
- `/acp spawn claude`: cerita yang sama untuk adapter ACP Claude, ditambah autentikasi sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini jika Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan session key itu secara eksplisit).
3. Periksa status runtime:
   - `/acp status`
4. Sesuaikan opsi runtime sesuai kebutuhan:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Berikan arahan ke sesi aktif tanpa mengganti konteks:
   - `/acp steer tighten logging and continue`
6. Hentikan pekerjaan:
   - `/acp cancel` (hentikan giliran saat ini), atau
   - `/acp close` (tutup sesi + hapus binding)

## Mulai cepat untuk manusia

Contoh permintaan natural:

- "Ikat channel Discord ini ke Codex."
- "Mulai sesi Codex persisten di thread di sini dan tetap fokus."
- "Jalankan ini sebagai sesi ACP Claude Code one-shot dan rangkum hasilnya."
- "Ikat chat iMessage ini ke Codex dan simpan tindak lanjut di workspace yang sama."
- "Gunakan Gemini CLI untuk tugas ini di thread, lalu simpan tindak lanjut di thread yang sama."

Yang seharusnya dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Resolusikan target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika binding percakapan saat ini diminta dan channel aktif mendukungnya, ikat sesi ACP ke percakapan tersebut.
4. Jika tidak, jika binding thread diminta dan channel saat ini mendukungnya, ikat sesi ACP ke thread tersebut.
5. Rutekan pesan tindak lanjut yang terikat ke sesi ACP yang sama sampai tidak difokuskan/ditutup/kedaluwarsa.

## ACP versus sub-agent

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan sub-agent saat Anda menginginkan eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agent                  |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agent native OpenClaw   |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Perintah utama | `/acp ...`                           | `/subagents ...`                    |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agents](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. plugin runtime `acpx` bawaan
3. adapter ACP Claude
4. mesin runtime/sesi sisi Claude

Pembedaan penting:

- ACP Claude adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan background task, dan binding percakapan/thread opsional.
- CLI backend adalah runtime fallback lokal terpisah yang hanya berbasis teks. Lihat [CLI Backends](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan CLI backends

## Sesi terikat

### Binding percakapan saat ini

Gunakan `/acp spawn <harness> --bind here` saat Anda ingin percakapan saat ini menjadi workspace ACP yang tahan lama tanpa membuat child thread.

Perilaku:

- OpenClaw tetap memiliki transport channel, auth, keamanan, dan delivery.
- Percakapan saat ini dipin ke session key ACP yang di-spawn.
- Pesan tindak lanjut di percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Apa artinya dalam praktik:

- `--bind here` mempertahankan permukaan chat yang sama. Di Discord, channel saat ini tetap channel saat ini.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang men-spawn pekerjaan baru. Binding tersebut menempelkan sesi itu ke percakapan saat ini.
- `--bind here` tidak dengan sendirinya membuat child thread Discord atau topik Telegram.
- Runtime ACP tetap dapat memiliki direktori kerja (`cwd`) sendiri atau workspace yang dikelola backend di disk. Workspace runtime tersebut terpisah dari permukaan chat dan tidak menyiratkan thread pesan baru.
- Jika Anda spawn ke agent ACP yang berbeda dan tidak meneruskan `--cwd`, OpenClaw secara default mewarisi workspace **agent target**, bukan milik peminta.
- Jika path workspace yang diwarisi itu tidak ada (`ENOENT`/`ENOTDIR`), OpenClaw fallback ke cwd default backend alih-alih diam-diam memakai tree yang salah.
- Jika workspace yang diwarisi itu ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan error akses yang sebenarnya alih-alih menghapus `cwd`.

Model mental:

- permukaan chat: tempat orang tetap berbicara (`channel Discord`, `topik Telegram`, `chat iMessage`)
- sesi ACP: status runtime Codex/Claude/Gemini yang tahan lama yang menjadi tujuan routing OpenClaw
- child thread/topik: permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau lampirkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sana
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat child thread/topik dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Channel chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui jalur binding percakapan bersama.
- Channel dengan semantik thread/topik kustom tetap dapat menyediakan kanonisasi khusus channel di balik antarmuka bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Binding percakapan saat ini generik menggunakan penyimpanan binding bersama OpenClaw dan bertahan melalui restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat channel atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here`.
- Jika channel aktif tidak mengekspos binding ACP untuk percakapan saat ini, OpenClaw mengembalikan pesan unsupported yang jelas.
- `resume` dan pertanyaan "sesi baru" adalah pertanyaan sesi ACP, bukan pertanyaan channel. Anda dapat menggunakan ulang atau mengganti status runtime tanpa mengubah permukaan chat saat ini.

### Sesi terikat thread

Ketika binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan tindak lanjut dalam thread tersebut dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Tidak fokus/tutup/arsip/idle-timeout atau kedaluwarsa max-age menghapus binding.

Dukungan binding thread bersifat khusus adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Feature flag yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (set `false` untuk menjeda dispatch ACP)
- Feature flag spawn thread ACP adapter channel aktif (khusus adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Adapter channel apa pun yang mengekspos kemampuan binding sesi/thread.
- Dukungan bawaan saat ini:
  - thread/channel Discord
  - topik Telegram (topik forum di grup/supergrup dan topik DM)
- Channel plugin dapat menambahkan dukungan melalui antarmuka binding yang sama.

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
- `bindings[].agentId` adalah id agent OpenClaw yang memilikinya.
- Override ACP opsional ada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agent

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP satu kali per agent:

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
- Pesan dalam channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset session key ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agent tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agent target dari config agent.
- Path workspace turunan yang hilang fallback ke cwd default backend; kegagalan akses pada path yang tidak hilang ditampilkan sebagai error spawn.

## Memulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agent atau pemanggilan tool.

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

- `runtime` default-nya `subagent`, jadi set `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` jika dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` untuk mempertahankan percakapan terikat yang persisten.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness target ACP. Fallback ke `acp.defaultAgent` jika disetel.
- `thread` (opsional, default `false`): meminta alur binding thread jika didukung.
- `mode` (opsional): `run` (one-shot) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten tergantung jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agent target jika dikonfigurasi; path turunan yang hilang fallback ke default backend, sedangkan error akses yang nyata dikembalikan.
- `label` (opsional): label untuk operator yang digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agent memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` menyalurkan ringkasan progres eksekusi ACP awal kembali ke sesi peminta sebagai event sistem.
  - Jika tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berskala sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk melihat riwayat relay lengkap.

### Melanjutkan sesi yang sudah ada

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

- Serahkan sesi Codex dari laptop Anda ke ponsel Anda — beri tahu agent Anda untuk melanjutkan dari tempat terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang tanpa kepala melalui agent Anda
- Lanjutkan pekerjaan yang terganggu oleh restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime sub-agent.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal pada sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agent target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway jika Anda ingin pemeriksaan live cepat bahwa spawn ACP
benar-benar berfungsi end-to-end, bukan sekadar lolos unit test.

Gate yang direkomendasikan:

1. Verifikasi versi/commit gateway yang dideploy pada host target.
2. Konfirmasikan bahwa source yang dideploy mencakup penerimaan lineage ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agent live (misalnya
   `razor(main)` pada `jpclawhq`).
4. Minta agent tersebut memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi bahwa agent melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada validator error
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
- Jangan mewajibkan `streamTo: "parent"` untuk gate dasar. Jalur itu bergantung pada
  kemampuan requester/sesi dan merupakan pemeriksaan integrasi terpisah.
- Perlakukan pengujian `mode: "session"` yang terikat thread sebagai pass integrasi
  kedua yang lebih kaya dari thread Discord nyata atau topik Telegram.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Batasan saat ini:

- Jika sesi peminta disandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang dipaksakan sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat jika diperlukan.

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

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama ikut serta pada langkah 2.

Jika tidak ada target yang terselesaikan, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                              |
| ------ | --------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan membuat binding percakapan saat ini.                           |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini ditopang oleh Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat child thread saat didukung. |
| `here` | Memerlukan thread aktif saat ini; gagal jika tidak berada di dalam thread.                           |
| `off`  | Tidak ada binding. Sesi dimulai tanpa binding.                                                       |

Catatan:

- Pada permukaan non-thread-binding, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` jika Anda ingin mem-pin percakapan saat ini tanpa membuat child thread.

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

`/acp status` menampilkan opsi runtime yang efektif dan, jika tersedia, identifier sesi tingkat runtime maupun tingkat backend.

Sebagian kontrol bergantung pada kemampuan backend. Jika backend tidak mendukung suatu kontrol, OpenClaw mengembalikan error unsupported-control yang jelas.

## Buku resep perintah ACP

| Perintah             | Fungsinya                                              | Contoh                                                        |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi arah ke sesi yang sedang berjalan.   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.         | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kemampuan. | `/acp status`                                              |
| `/acp set-mode`      | Menyetel mode runtime untuk sesi target.                | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menyetel override direktori kerja runtime.              | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menyetel profil kebijakan persetujuan.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Menyetel timeout runtime (detik).                       | `/acp timeout 120`                                            |
| `/acp model`         | Menyetel override model runtime.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                   | `/acp reset-options`                                          |
| `/acp sessions`      | Mendaftar sesi ACP terbaru dari store.                  | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kemampuan, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                           |
| `/acp install`       | Menampilkan langkah install dan enable yang deterministik. | `/acp install`                                             |

`/acp sessions` membaca store untuk sesi terikat saat ini atau sesi peminta. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` meresolusikan target melalui penemuan sesi gateway, termasuk root `session.store` khusus per agent.

## Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik.

Operasi yang ekuivalen:

- `/acp model <id>` dipetakan ke kunci config runtime `model`.
- `/acp permissions <profile>` dipetakan ke kunci config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke kunci config runtime `timeout`.
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

Saat OpenClaw menggunakan backend acpx, gunakan nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agent kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agent `cursor` dalam config acpx Anda alih-alih mengubah default bawaannya.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw normal).

## Config yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default-nya true; set false untuk menjeda dispatch ACP sambil tetap mempertahankan kontrol /acp.
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

Jika spawn ACP terikat thread tidak berfungsi, verifikasi terlebih dahulu feature flag adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child thread. Mereka memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Configuration Reference](/id/gateway/configuration-reference).

## Setup plugin untuk backend acpx

Instalasi baru mengirim plugin runtime `acpx` bawaan dalam keadaan aktif secara default, jadi ACP
biasanya berfungsi tanpa langkah install plugin manual.

Mulailah dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan jalur plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Install workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, plugin backend acpx bawaan (`acpx`) menggunakan biner yang dipin secara lokal di plugin:

1. Perintah default-nya adalah `node_modules/.bin/acpx` lokal plugin di dalam package plugin ACPX.
2. Versi yang diharapkan default-nya adalah pin extension.
3. Startup langsung mendaftarkan backend ACP sebagai not-ready.
4. Job ensure di background memverifikasi `acpx --version`.
5. Jika biner lokal plugin hilang atau tidak cocok, ia menjalankan:
   `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang.

Anda dapat meng-override perintah/versi di config plugin:

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
- Path relatif diresolusikan dari direktori workspace OpenClaw.
- `expectedVersion: "any"` menonaktifkan pencocokan versi yang ketat.
- Saat `command` menunjuk ke biner/path kustom, auto-install lokal plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/id/tools/plugin).

### Install dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(biner spesifik platform) diinstal secara otomatis
melalui hook postinstall. Jika install otomatis gagal, gateway tetap start
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP tool plugin

Secara default, sesi ACPX **tidak** mengekspos tool yang didaftarkan plugin OpenClaw ke
harness ACP.

Jika Anda ingin agent ACP seperti Codex atau Claude Code memanggil
tool plugin OpenClaw yang terpasang seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tool plugin yang sudah didaftarkan oleh plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan trust:

- Ini memperluas permukaan tool harness ACP.
- Agent ACP hanya mendapat akses ke tool plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas trust yang sama seperti membiarkan plugin tersebut berjalan di
  OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan tambahan yang opt-in, bukan pengganti config server MCP generik.

## Konfigurasi permission

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt permission tulis-file dan eksekusi shell. Plugin acpx menyediakan dua kunci config yang mengontrol bagaimana permission ditangani:

Permission harness ACPX ini terpisah dari approval exec OpenClaw dan terpisah dari flag bypass vendor CLI backend seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah switch break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agent harness tanpa prompt.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Menyetujui otomatis baca saja; tulis dan exec memerlukan prompt. |
| `deny-all`      | Menolak semua prompt permission.                          |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika prompt permission seharusnya ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai | Perilaku                                                          |
| ----- | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**            |
| `deny` | Tolak permission secara diam-diam dan lanjutkan (degradasi yang halus). |

### Konfigurasi

Set melalui config plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt permission dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi permission, set `nonInteractivePermissions` ke `deny` agar sesi menurun dengan halus alih-alih crash.

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                           | Perbaikan                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau nonaktif.                                           | Instal dan aktifkan plugin backend, lalu jalankan `/acp doctor`.                                                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                               | Set `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                               | Set `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent tidak ada di allowlist.                                                  | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                               |
| `Unable to resolve session target: ...`                                     | Token key/id/label buruk.                                                      | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang bisa di-bind.              | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa binding.                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kemampuan binding ACP untuk percakapan saat ini.        | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasi `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                              | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                   | Rebind sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kemampuan binding thread.                               | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta disandbox.                       | Gunakan `runtime="subagent"` dari sesi yang disandbox, atau jalankan spawn ACP dari sesi yang tidak disandbox.                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                 | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak disandbox.                                |
| Missing ACP metadata for bound session                                      | Metadata sesi ACP sudah usang/terhapus.                                        | Buat ulang dengan `/acp spawn`, lalu rebind/fokuskan thread.                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir tulis/exec di sesi ACP non-interaktif.              | Set `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan restart gateway. Lihat [Konfigurasi permission](#konfigurasi-permission).                |
| ACP session fails early with little output                                  | Prompt permission diblokir oleh `permissionMode`/`nonInteractivePermissions`. | Periksa log gateway untuk `AcpRuntimeError`. Untuk permission penuh, set `permissionMode=approve-all`; untuk degradasi halus, set `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proses harness selesai tetapi sesi ACP tidak melaporkan selesai.               | Pantau dengan `ps aux \| grep acpx`; hentikan proses basi secara manual.                                                                                         |
