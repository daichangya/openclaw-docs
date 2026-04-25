---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug routing atau izin perintah
summary: 'Perintah slash: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah slash
x-i18n:
    generated_at: "2026-04-25T13:58:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem terkait:

- **Perintah**: pesan `/...` mandiri.
- **Directive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directive dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya directive), directive diperlakukan sebagai “petunjuk inline” dan **tidak** menyimpan pengaturan sesi.
  - Dalam pesan yang hanya berisi directive (pesan hanya berisi directive), directive disimpan ke sesi dan membalas dengan pengakuan.
  - Directive hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` diatur, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak berwenang akan melihat directive diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang di-allowlist/berwenang): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini berjalan segera, dihapus sebelum model melihat pesan, dan sisa teks melanjutkan melalui alur normal.

## Konfigurasi

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (default `true`) mengaktifkan parsing `/...` di pesan chat.
  - Pada surface tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi bahkan jika Anda mengaturnya ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk override per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan pembuatan slash command per skill).
  - Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk override per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung dijalankan di latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (discovery/status Plugin serta kontrol instalasi + aktif/nonaktif).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override hanya runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus aksi alat restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist pemilik eksplisit untuk surface perintah/alat yang hanya untuk pemilik. Ini terpisah dari `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per channel (opsional, default `false`) membuat perintah yang hanya untuk pemilik mengharuskan **identitas pemilik** untuk dijalankan di surface tersebut. Saat `true`, pengirim harus cocok dengan kandidat pemilik yang telah di-resolve (misalnya entri di `commands.ownerAllowFrom` atau metadata pemilik native provider) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard di `allowFrom` channel, atau daftar kandidat pemilik yang kosong/tidak dapat di-resolve, **tidak** cukup — perintah yang hanya untuk pemilik gagal secara tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah yang hanya untuk pemilik dibatasi hanya oleh `ownerAllowFrom` dan allowlist perintah standar.
- `commands.ownerDisplay` mengontrol bagaimana ID pemilik muncul di system prompt: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per provider untuk otorisasi perintah. Saat dikonfigurasi, ini menjadi
  satu-satunya sumber otorisasi untuk perintah dan directive (`commands.useAccessGroups` serta allowlist/pairing channel
  diabaikan). Gunakan `"*"` untuk default global; key khusus provider menimpanya.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak diatur.

## Daftar perintah

Source-of-truth saat ini:

- built-in core berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah Plugin berasal dari pemanggilan `registerCommand()` Plugin
- ketersediaan sebenarnya di gateway Anda tetap bergantung pada flag konfigurasi, surface channel, dan Plugin yang diinstal/digunakan

### Perintah bawaan core

Perintah bawaan yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, menghapus ID sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
- `/compact [instructions]` melakukan Compaction pada konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan eksekusi saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola masa berlaku pengikatan thread.
- `/think <level>` menetapkan tingkat thinking. Opsi berasal dari profil provider model yang aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan atau menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan atau menonaktifkan output trace Plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
- `/reasoning [on|off|stream]` mengaktifkan atau menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan atau menonaktifkan mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk suatu provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ditambah opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini.
- `/status` menampilkan status eksekusi/runtime, termasuk label `Execution`/`Runtime` serta penggunaan/kuota provider jika tersedia.
- `/crestodian <request>` menjalankan helper penyiapan dan perbaikan Crestodian dari DM pemilik.
- `/tasks` mencantumkan task latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks disusun.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/export-trajectory [path]` mengekspor [bundle trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Alias: `/trajectory`.
- `/whoami` menampilkan ID pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola eksekusi sub-agen untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus pengikatan saat ini.
- `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
- `/steer <id|#> <message>` mengirim steering ke sub-agen yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Hanya untuk pemilik. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya untuk pemilik. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status Plugin. `/plugin` adalah alias. Penulisan hanya untuk pemilik. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override konfigurasi hanya runtime. Hanya untuk pemilik. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Hanya untuk pemilik.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa job bash latar belakang.
- `!stop [sessionId]` menghentikan job bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari Plugin channel dengan dukungan perintah native. Kumpulan bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mengaktifkan sementara perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Codex Harness](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai slash command:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/Plugin mendaftarkannya.
- pendaftaran perintah-skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
- Untuk rincian penggunaan provider lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mengikuti `configWrites` channel.
- Di channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga mengikuti `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` aktif secara default; atur `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi Plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui konfigurasi Plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (tidak tersedia sebagai teks). `join` memerlukan guild dan voice/stage channel yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
- Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik Plugin dan tetap menonaktifkan keluaran alat verbose normal.
- `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
- `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk trafik yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan alat tetap ditampilkan bila relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: dapat mengungkap reasoning internal, keluaran alat, atau diagnostik Plugin yang tidak ingin Anda tampilkan. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` langsung menyimpan model sesi yang baru.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakannya.
- Jika eksekusi sudah aktif, OpenClaw menandai peralihan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
- Jika aktivitas alat atau keluaran balasan sudah dimulai, peralihan tertunda dapat tetap berada dalam antrean hingga kesempatan retry berikutnya atau giliran pengguna selanjutnya.
- Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke
  Crestodian. Ini terpisah dari mode rescue channel pesan dan tidak
  memberikan otoritas konfigurasi jarak jauh.
- **Fast path:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist ditangani segera (melewati antrean + model).
- **Group mention gating:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist melewati persyaratan mention.
- **Shortcut inline (hanya pengirim yang ada di allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat sisa teks.
  - Contoh: `hey /status` memicu balasan status, dan sisa teks melanjutkan melalui alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pengirim yang tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** skill `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maks. 32 karakter); tabrakan nama akan mendapat sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah adanya perintah per-skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
  - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat suatu perintah mendukung pilihan dan Anda menghilangkan argumennya. Pilihan dinamis di-resolve terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti override `/model` sesi tersebut.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang bisa digunakan agen ini saat ini dalam
percakapan ini**.

- Default `/tools` bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Surface perintah native yang mendukung argumen mengekspos peralihan mode yang sama seperti `compact|verbose`.
- Hasil bersifat per sesi, jadi perubahan agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah keluarannya.
- `/tools` mencakup alat yang benar-benar dapat dijangkau saat runtime, termasuk alat core, alat Plugin yang terhubung, dan alat milik channel.

Untuk mengedit profil dan override, gunakan panel Tools di Control UI atau surface konfigurasi/katalog
alih-alih memperlakukan `/tools` sebagai katalog statis.

## Surface penggunaan (apa yang ditampilkan di mana)

- **Penggunaan/kuota provider** (contoh: “Claude tersisa 80%”) muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% tersisa`; untuk MiniMax, field persentase khusus sisa dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri chat-model plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru saat snapshot sesi live jarang. Nilai live bukan nol yang sudah ada tetap diutamakan, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total yang tersimpan tidak ada atau lebih kecil.
- **Execution vs runtime:** `/status` melaporkan `Execution` untuk path sandbox efektif dan `Runtime` untuk siapa yang benar-benar menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/auth/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai directive.

Contoh:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Catatan:

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model serta langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan provider saat ini bila memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **hanya runtime** (memori, bukan disk). Hanya untuk pemilik. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung diterapkan ke pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.

## Keluaran trace Plugin

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug Plugin per sesi** tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan status trace sesi saat ini.
- `/trace on` mengaktifkan baris trace Plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace Plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi hanya runtime.
- `/trace` tidak menggantikan `/verbose`; keluaran alat/status verbose normal tetap milik `/verbose`.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Hanya untuk pemilik. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Konfigurasi divalidasi sebelum penulisan; perubahan yang tidak valid ditolak.
- Pembaruan `/config` tetap tersimpan setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya untuk pemilik. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan di pengaturan proyek milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan/menonaktifkan dalam konfigurasi. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan discovery Plugin nyata terhadap workspace saat ini ditambah konfigurasi di disk.
- `/plugins enable|disable` hanya memperbarui konfigurasi Plugin; tidak menginstal atau menghapus instalasi Plugin.
- Setelah perubahan aktif/nonaktif, restart gateway untuk menerapkannya.

## Catatan surface

- **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan eksekusi saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah bawaan (dengan nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- menggunakan sesi saat ini sebagai konteks latar belakang,
- berjalan sebagai panggilan sekali jalan **tanpa alat** yang terpisah,
- tidak mengubah konteks sesi di masa mendatang,
- tidak ditulis ke riwayat transkrip,
- dikirim sebagai hasil sampingan live alih-alih pesan asisten normal.

Hal itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara saat
tugas utama tetap berjalan.

Contoh:

```text
/btw what are we doing right now?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail
UX klien.

## Terkait

- [Skills](/id/tools/skills)
- [Konfigurasi Skills](/id/tools/skills-config)
- [Membuat Skills](/id/tools/creating-skills)
