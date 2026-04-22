---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan di kanal perpesanan
    - Mengikat percakapan kanal pesan ke sesi ACP persisten
    - Pemecahan masalah backend ACP dan wiring Plugin
    - Men-debug pengiriman completion ACP atau loop agen-ke-agen
    - Mengoperasikan perintah `/acp` dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agen harness lainnya
title: Agen ACP
x-i18n:
    generated_at: "2026-04-22T04:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agen ACP

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui Plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa biasa untuk "jalankan ini di Codex" atau "mulai Claude Code di sebuah thread", OpenClaw harus merutekan permintaan itu ke runtime ACP (bukan runtime sub-agen native). Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan kanal OpenClaw yang ada, gunakan [`openclaw mcp serve`](/cli/mcp)
alih-alih ACP.

## Halaman mana yang saya butuhkan?

Ada tiga permukaan terkait yang mudah tertukar:

| Anda ingin...                                                                     | Gunakan ini                           | Catatan                                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agen ACP                 | Sesi yang terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                       |
| Menggunakan ulang AI CLI lokal sebagai model fallback hanya-teks                   | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP. Tanpa alat OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                       |

## Apakah ini langsung berfungsi?

Biasanya, ya.

- Instalasi baru kini mengirimkan Plugin runtime `acpx` bawaan yang diaktifkan secara default.
- Plugin `acpx` bawaan mengutamakan binary `acpx` yang dipin secara lokal oleh Plugin.
- Saat startup, OpenClaw memeriksa binary tersebut dan memperbaikinya sendiri bila diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan yang cepat.

Hal yang masih dapat terjadi pada penggunaan pertama:

- Adaptor harness target dapat diambil sesuai permintaan dengan `npx` saat pertama kali Anda menggunakan harness tersebut.
- Auth vendor tetap harus ada pada host untuk harness tersebut.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adaptor pertama dapat gagal sampai cache dipanaskan terlebih dahulu atau adaptor dipasang dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap melakukan bootstrap `acpx`, tetapi adaptor ACP Codex mungkin masih memerlukan pengambilan pertama.
- `/acp spawn claude`: hal yang sama untuk adaptor ACP Claude, ditambah auth sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini saat Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan kunci sesi itu secara eksplisit).
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

- "Ikat kanal Discord ini ke Codex."
- "Mulai sesi Codex persisten di sebuah thread di sini dan tetap fokus."
- "Jalankan ini sebagai sesi ACP Claude Code sekali pakai dan rangkum hasilnya."
- "Ikat chat iMessage ini ke Codex dan simpan tindak lanjut di workspace yang sama."
- "Gunakan Gemini CLI untuk tugas ini di sebuah thread, lalu simpan tindak lanjut di thread yang sama."

Yang harus dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Resolve target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika diminta binding percakapan saat ini dan kanal aktif mendukungnya, ikat sesi ACP ke percakapan tersebut.
4. Jika tidak, jika diminta binding thread dan kanal saat ini mendukungnya, ikat sesi ACP ke thread tersebut.
5. Rutekan pesan tindak lanjut yang terikat ke sesi ACP yang sama sampai difokuskan ulang/ditutup/kedaluwarsa.

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan sub-agen saat Anda menginginkan eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agen                   |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw    |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Perintah utama | `/acp ...`                           | `/subagents ...`                    |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, susunannya adalah:

1. Control plane sesi ACP OpenClaw
2. Plugin runtime `acpx` bawaan
3. Adaptor ACP Claude
4. Runtime/mekanisme sesi sisi Claude

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

- OpenClaw tetap memiliki transport kanal, auth, keamanan, dan pengiriman.
- Percakapan saat ini dipin ke kunci sesi ACP yang di-spawn.
- Pesan tindak lanjut di percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Apa artinya ini dalam praktik:

- `--bind here` mempertahankan permukaan chat yang sama. Di Discord, kanal saat ini tetap kanal saat ini.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang men-spawn pekerjaan baru. Binding tersebut menempelkan sesi itu ke percakapan saat ini.
- `--bind here` tidak membuat child thread Discord atau topik Telegram dengan sendirinya.
- Runtime ACP tetap dapat memiliki direktori kerja (`cwd`) sendiri atau workspace yang dikelola backend di disk. Workspace runtime itu terpisah dari permukaan chat dan tidak menyiratkan thread perpesanan baru.
- Jika Anda men-spawn ke agen ACP yang berbeda dan tidak memberikan `--cwd`, OpenClaw mewarisi workspace **agen target** secara default, bukan milik peminta.
- Jika path workspace yang diwarisi itu hilang (`ENOENT`/`ENOTDIR`), OpenClaw menggunakan fallback ke cwd default backend alih-alih diam-diam memakai tree yang salah.
- Jika workspace yang diwarisi ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan kesalahan akses yang nyata alih-alih membuang `cwd`.

Model mental:

- permukaan chat: tempat orang-orang terus berbicara (`kanal Discord`, `topik Telegram`, `chat iMessage`)
- sesi ACP: state runtime Codex/Claude/Gemini yang tahan lama yang dirutekan oleh OpenClaw
- child thread/topik: permukaan perpesanan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau lampirkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sesi tersebut
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat child thread/topik dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Kanal chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui jalur binding percakapan bersama.
- Kanal dengan semantik thread/topik kustom tetap dapat menyediakan kanonisasi khusus kanal di balik antarmuka bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Binding percakapan saat ini generik menggunakan penyimpanan binding OpenClaw bersama dan bertahan setelah restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat kanal atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here`.
- Jika kanal aktif tidak mengekspos binding ACP percakapan saat ini, OpenClaw mengembalikan pesan unsupported yang jelas.
- `resume` dan pertanyaan "sesi baru" adalah pertanyaan sesi ACP, bukan pertanyaan kanal. Anda dapat menggunakan ulang atau mengganti state runtime tanpa mengubah permukaan chat saat ini.

### Sesi yang terikat thread

Saat binding thread diaktifkan untuk adaptor kanal, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat sebuah thread ke sesi ACP target.
- Pesan tindak lanjut di thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/close/archive/idle-timeout atau kedaluwarsa max-age menghapus binding.

Dukungan binding thread bersifat khusus adaptor. Jika adaptor kanal aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Flag fitur yang diperlukan untuk ACP yang terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (setel `false` untuk menjeda dispatch ACP)
- Flag thread-spawn ACP adaptor kanal diaktifkan (khusus adaptor)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanal yang mendukung thread

- Setiap adaptor kanal yang mengekspos kapabilitas binding sesi/thread.
- Dukungan bawaan saat ini:
  - Thread/kanal Discord
  - Topik Telegram (topik forum di grup/supergroup dan topik DM)
- Kanal Plugin dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Pengaturan khusus kanal

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten di entri `bindings[]` tingkat atas.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - Kanal atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`

    Utamakan `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - Chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`

    Utamakan `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah ID agen OpenClaw pemilik.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP satu kali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID harness, misalnya `codex` atau `claude`)
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
- Pesan di kanal atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan yang terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur thread-focus) tetap berlaku bila ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari config agen.
- Path workspace turunan yang hilang menggunakan fallback ke cwd default backend; kegagalan akses pada path yang tidak hilang muncul sebagai kesalahan spawn.

## Memulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau pemanggilan alat.

```json
{
  "task": "Buka repo dan rangkum pengujian yang gagal",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Catatan:

- `runtime` default ke `subagent`, jadi setel `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` bila dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` untuk mempertahankan percakapan terikat yang persisten.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): ID harness target ACP. Menggunakan fallback ke `acp.defaultAgent` bila disetel.
- `thread` (opsional, default `false`): minta alur binding thread bila didukung.
- `mode` (opsional): `run` (sekali pakai) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten per jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target saat dikonfigurasi; path turunan yang hilang menggunakan fallback ke default backend, sedangkan kesalahan akses nyata dikembalikan.
- `label` (opsional): label yang terlihat operator yang digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` melakukan streaming ringkasan progres eksekusi ACP awal kembali ke sesi peminta sebagai peristiwa sistem.
  - Saat tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berscope sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

### Sesi ACP interaktif

Sesi interaktif dimaksudkan untuk tetap berbicara pada permukaan chat yang terlihat:

- `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
- `/acp spawn ... --thread ...` mengikat thread/topik kanal ke sesi ACP.
- `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

Pesan tindak lanjut dalam percakapan yang terikat dirutekan langsung ke sesi ACP, dan output ACP dikirim kembali ke kanal/thread/topik yang sama.

### Sesi ACP sekali pakai milik induk

Sesi ACP sekali pakai yang di-spawn oleh eksekusi agen lain adalah child latar belakang, mirip dengan sub-agen:

- Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Child berjalan dalam sesi harness ACP-nya sendiri.
- Completion melapor kembali melalui jalur pengumuman penyelesaian tugas internal.
- Induk menulis ulang hasil child dengan suara asisten normal ketika balasan yang terlihat pengguna berguna.

Jangan perlakukan jalur ini sebagai chat peer-to-peer antara induk dan child. Child sudah memiliki kanal completion kembali ke induk.

### `sessions_send` dan pengiriman A2A

`sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A) setelah menyuntikkan pesan:

- tunggu balasan sesi target
- opsional biarkan peminta dan target bertukar sejumlah terbatas giliran tindak lanjut
- minta target menghasilkan pesan pengumuman
- kirim pengumuman itu ke kanal atau thread yang terlihat

Jalur A2A itu adalah fallback untuk pengiriman peer ketika pengirim membutuhkan tindak lanjut yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan `tools.sessions.visibility` yang luas.

OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah induk dari child ACP sekali pakai miliknya sendiri. Dalam kasus itu, menjalankan A2A di atas completion tugas dapat membangunkan induk dengan hasil child, meneruskan balasan induk kembali ke child, dan membuat loop gema induk/child. Hasil `sessions_send` melaporkan `delivery.status="skipped"` untuk kasus child milik sendiri karena jalur completion sudah bertanggung jawab atas hasilnya.

### Melanjutkan sesi yang ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga melanjutkan dengan konteks penuh dari yang telah terjadi sebelumnya.

```json
{
  "task": "Lanjutkan dari tempat terakhir — perbaiki sisa pengujian yang gagal",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop ke ponsel Anda — beri tahu agen Anda untuk melanjutkan dari tempat terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda
- Lanjutkan pekerjaan yang terputus oleh restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan kesalahan jika digunakan dengan runtime sub-agen.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang sedang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika ID sesi tidak ditemukan, spawn gagal dengan kesalahan yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway ketika Anda ingin pemeriksaan live cepat bahwa spawn ACP
benar-benar berfungsi end-to-end, bukan hanya lolos pengujian unit.

Gate yang direkomendasikan:

1. Verifikasi versi/commit gateway yang di-deploy pada host target.
2. Konfirmasikan source yang di-deploy mencakup penerimaan garis keturunan ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agen live (misalnya
   `razor(main)` di `jpclawhq`).
4. Minta agen itu memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi agen melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada kesalahan validator
6. Bersihkan sesi bridge ACPX sementara.

Contoh prompt ke agen live:

```text
Gunakan alat sessions_spawn sekarang dengan runtime: "acp", agentId: "codex", dan mode: "run".
Setel task ke: "Reply with exactly LIVE-ACP-SPAWN-OK".
Lalu laporkan hanya: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Catatan:

- Pertahankan smoke test ini pada `mode: "run"` kecuali Anda memang sedang menguji
  sesi ACP persisten yang terikat thread.
- Jangan mensyaratkan `streamTo: "parent"` untuk gate dasar. Jalur tersebut bergantung pada
  kapabilitas peminta/sesi dan merupakan pemeriksaan integrasi terpisah.
- Perlakukan pengujian `mode: "session"` yang terikat thread sebagai lintasan integrasi
  kedua yang lebih kaya dari thread Discord atau topik Telegram nyata.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir baik untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Kesalahan: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Kesalahan: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang dipaksakan sandbox.

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

Lihat [Slash Commands](/id/tools/slash-commands).

## Resolusi target sesi

Sebagian besar aksi `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini diikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama ikut serta pada langkah 2.

Jika tidak ada target yang berhasil di-resolve, OpenClaw mengembalikan kesalahan yang jelas (`Unable to resolve session target: ...`).

## Mode binding spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                                  |
| ------ | ------------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan buat binding percakapan saat ini.                                  |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan kanal atau chat ini didukung Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada kanal yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | Di thread aktif: ikat thread itu. Di luar thread: buat/ikat child thread saat didukung.              |
| `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di dalam thread.                       |
| `off`  | Tanpa binding. Sesi dimulai tanpa terikat.                                                            |

Catatan:

- Pada permukaan tanpa dukungan binding thread, perilaku default secara efektif adalah `off`.
- Spawn yang terikat thread memerlukan dukungan kebijakan kanal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` saat Anda ingin memin percakapan saat ini tanpa membuat child thread.

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

`/acp status` menampilkan opsi runtime efektif dan, saat tersedia, identifier sesi tingkat runtime maupun tingkat backend.

Beberapa kontrol bergantung pada kapabilitas backend. Jika backend tidak mendukung kontrol tertentu, OpenClaw mengembalikan kesalahan unsupported-control yang jelas.

## Buku resep perintah ACP

| Perintah             | Fungsi                                                       | Contoh                                                        |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; opsional bind saat ini atau bind thread.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target.  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang sedang berjalan.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas target thread.                      | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Menyetel mode runtime untuk sesi target.                     | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menyetel override direktori kerja runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menyetel profil kebijakan persetujuan.                       | `/acp permissions strict`                                     |
| `/acp timeout`       | Menyetel timeout runtime (detik).                            | `/acp timeout 120`                                            |
| `/acp model`         | Menyetel override model runtime.                             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                        | `/acp reset-options`                                          |
| `/acp sessions`      | Menampilkan daftar sesi ACP terbaru dari store.              | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                         |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                              |

`/acp sessions` membaca store untuk sesi yang sedang terikat atau sesi peminta saat ini. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` me-resolve target melalui penemuan sesi gateway, termasuk root `session.store` kustom per agen.

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

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agen `cursor` di config acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adaptor arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw normal).

## Config yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default adalah true; setel false untuk menjeda dispatch ACP sambil tetap mempertahankan kontrol /acp.
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

Config binding thread bersifat khusus adaptor kanal. Contoh untuk Discord:

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

Jika spawn ACP yang terikat thread tidak berfungsi, verifikasi dulu flag fitur adaptor:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child thread. Binding ini memerlukan konteks percakapan aktif dan adaptor kanal yang mengekspos binding percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru mengirimkan Plugin runtime `acpx` bawaan yang diaktifkan secara default, sehingga ACP
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

Secara default, Plugin backend acpx bawaan (`acpx`) menggunakan binary yang dipin secara lokal oleh Plugin:

1. Perintah default ke `node_modules/.bin/acpx` lokal Plugin di dalam package Plugin ACPX.
2. Versi yang diharapkan default ke pin extension.
3. Startup langsung mendaftarkan backend ACP sebagai not-ready.
4. Pekerjaan ensure latar belakang memverifikasi `acpx --version`.
5. Jika binary lokal Plugin hilang atau tidak cocok, Plugin menjalankan:
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
- `expectedVersion: "any"` menonaktifkan pencocokan versi yang ketat.
- Saat `command` menunjuk ke binary/path kustom, auto-install lokal Plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda memasang OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(binary khusus platform) dipasang secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code dapat memanggil alat Plugin OpenClaw yang terpasang
seperti memory recall/store, aktifkan bridge khusus berikut:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap
  sesi ACPX.
- Mengekspos alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terpasang dan aktif.
- Menjaga fitur ini tetap eksplisit dan default-nonaktif.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP hanya mendapat akses ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti saat mengizinkan Plugin tersebut dieksekusi di
  OpenClaw sendiri.
- Tinjau Plugin yang terpasang sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge alat Plugin bawaan ini adalah
kemudahan opt-in tambahan, bukan pengganti config server MCP generik.

### Konfigurasi timeout runtime

Plugin `acpx` bawaan secara default menetapkan timeout 120 detik untuk giliran runtime tertanam.
Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan
startup dan inisialisasi ACP. Override nilai ini jika host Anda memerlukan
batas runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Mulai ulang gateway setelah mengubah nilai ini.

### Konfigurasi agen probe kesehatan

Plugin `acpx` bawaan memeriksa satu agen harness sambil memutuskan apakah
backend runtime tertanam siap. Default-nya adalah `codex`. Jika deployment Anda
menggunakan agen ACP default yang berbeda, setel agen probe ke ID yang sama:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin tulis-file dan shell-exec. Plugin acpx menyediakan dua kunci config yang mengendalikan cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengendalikan operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai          | Perilaku                                                   |
| -------------- | ---------------------------------------------------------- |
| `approve-all`  | Menyetujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Menyetujui otomatis hanya operasi baca; penulisan dan exec memerlukan prompt. |
| `deny-all`     | Menolak semua prompt izin.                                 |

### `nonInteractivePermissions`

Mengendalikan apa yang terjadi ketika prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai  | Perilaku                                                         |
| ------ | ---------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**            |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi anggun).    |

### Konfigurasi

Setel melalui config Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara anggun alih-alih crash.

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                            | Perbaikan                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau dinonaktifkan.                                       | Pasang dan aktifkan Plugin backend, lalu jalankan `/acp doctor`.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                | Setel `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                | Setel `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada di allowlist.                                                    | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                |
| `Unable to resolve session target: ...`                                     | Token key/id/label buruk.                                                       | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.              | Pindah ke chat/kanal target lalu coba lagi, atau gunakan spawn tanpa binding.                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | Adaptor tidak memiliki kapabilitas binding ACP percakapan saat ini.             | Gunakan `/acp spawn ... --thread ...` bila didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke kanal yang didukung.                               |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                               | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                    | Lakukan rebind sebagai pemilik atau gunakan percakapan atau thread yang berbeda.                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adaptor tidak memiliki kapabilitas binding thread.                              | Gunakan `--thread off` atau pindah ke adaptor/kanal yang didukung.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.             | Gunakan `runtime="subagent"` dari sesi yang berada dalam sandbox, atau jalankan spawn ACP dari sesi yang tidak berada dalam sandbox.                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                  | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak berada dalam sandbox.                      |
| Missing ACP metadata for bound session                                      | Metadata sesi ACP usang/dihapus.                                                | Buat ulang dengan `/acp spawn`, lalu lakukan rebind/fokus thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.        | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` lalu mulai ulang gateway. Lihat [Konfigurasi izin](#permission-configuration).               |
| ACP session fails early with little output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.         | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi anggun, setel `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proses harness selesai tetapi sesi ACP tidak melaporkan completion.             | Pantau dengan `ps aux \| grep acpx`; bunuh proses usang secara manual.                                                                                             |
