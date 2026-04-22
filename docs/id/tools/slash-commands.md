---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Slash command: teks vs native, config, dan perintah yang didukung'
title: Slash Commands
x-i18n:
    generated_at: "2026-04-22T04:27:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Commands

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem yang saling terkait:

- **Perintah**: pesan mandiri `/...`.
- **Directive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directive dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat biasa (bukan yang hanya berisi directive), directive diperlakukan sebagai “petunjuk inline” dan **tidak** menyimpan pengaturan sesi.
  - Dalam pesan yang hanya berisi directive (pesan hanya berisi directive), directive disimpan ke sesi dan membalas dengan acknowledgement.
  - Directive hanya diterapkan untuk **pengirim yang diotorisasi**. Jika `commands.allowFrom` diatur, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel plus `commands.useAccessGroups`.
    Pengirim yang tidak diotorisasi akan melihat directive diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang ada di allowlist/terotorisasi): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini berjalan segera, dihapus sebelum model melihat pesan, dan sisa teks melanjutkan alur normal.

## Config

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
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda mengaturnya ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk override per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native bila didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan pembuatan satu slash command per skill).
  - Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk override per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung ke latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis config MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status plugin plus kontrol install + enable/disable).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override hanya runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus aksi tool restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist owner eksplisit untuk permukaan perintah/tool khusus owner. Ini terpisah dari `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per channel (opsional, default `false`) membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada permukaan tersebut. Saat `true`, pengirim harus cocok dengan kandidat owner yang teresolusikan (misalnya entri di `commands.ownerAllowFrom` atau metadata owner native provider) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard di channel `allowFrom`, atau daftar kandidat owner yang kosong/tidak teresolusikan, **tidak** cukup — perintah khusus owner akan gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dibatasi oleh `ownerAllowFrom` dan allowlist perintah standar.
- `commands.ownerDisplay` mengontrol cara id owner muncul di system prompt: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per provider untuk otorisasi perintah. Saat dikonfigurasi, ini menjadi
  satu-satunya sumber otorisasi untuk perintah dan directive (`commands.useAccessGroups`
  serta allowlist/pairing channel diabaikan). Gunakan `"*"` untuk default global; key khusus provider meng-override nilai tersebut.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak diatur.

## Daftar perintah

Sumber kebenaran saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari pemanggilan `registerCommand()` plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag config, permukaan channel, dan plugin yang terinstal/aktif

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan kembali pemuatan startup/system prompt secara langsung.
- `/compact [instructions]` melakukan Compaction konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan run saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa thread-binding.
- `/think <level>` menetapkan tingkat thinking. Opsi berasal dari profil provider model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau `on` biner hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan/menonaktifkan output trace plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
- `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk sebuah provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini.
- `/status` menampilkan status runtime, termasuk penggunaan/kuota provider bila tersedia.
- `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agent untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus binding saat ini.
- `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agent yang sedang berjalan.
- `/steer <id|#> <message>` mengirim steering ke sub-agent yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus owner. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis config server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus owner. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status plugin. `/plugin` adalah alias. Penulisan khusus owner. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override config yang hanya berlaku saat runtime. Khusus owner. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Khusus owner.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
- `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Kumpulan bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan memory Dreaming. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` sementara mengaktifkan perintah Node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola config suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
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
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` ketika skill/plugin mendaftarkannya.
- registrasi perintah-skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional di antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada kecocokan, teks diperlakukan sebagai body pesan.
- Untuk rincian penggunaan provider lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mengikuti `configWrites` channel.
- Di channel multi-akun, `/allowlist --account <id>` yang menargetkan config dan `/config set channels.<provider>.accounts.<id>...` juga mengikuti `configWrites` milik akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` diaktifkan secara default; atur `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, package npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui config plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol channel voice (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah thread-binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan thread binding efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik plugin dan menjaga obrolan tool verbose normal tetap nonaktif.
- `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default config.
- `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sementara permintaan Anthropic publik langsung, termasuk trafik yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan detail hanya disertakan saat `/verbose` bernilai `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah ini dapat mengungkap reasoning internal, output tool, atau diagnostik plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama dalam chat grup.
- `/model` langsung menyimpan model sesi baru.
- Jika agen sedang idle, run berikutnya langsung menggunakannya.
- Jika sebuah run sudah aktif, OpenClaw menandai perpindahan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, perpindahan tertunda dapat tetap antre sampai peluang retry berikutnya atau giliran pengguna berikutnya.
- **Jalur cepat:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist ditangani segera (melewati antrean + model).
- **Pembatasan mention grup:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist melewati persyaratan mention.
- **Shortcut inline (hanya untuk pengirim di allowlist):** perintah tertentu juga berfungsi saat disisipkan dalam pesan normal dan dihapus sebelum model melihat sisa teks.
  - Contoh: `hey /status` memicu balasan status, dan sisa teks melanjutkan alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pihak tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** skill `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maks. 32 karakter); tabrakan mendapat sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna ketika batas perintah native mencegah perintah per skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat sebuah perintah mendukung pilihan dan Anda menghilangkan argumen.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan config: **apa yang dapat digunakan agen ini sekarang juga dalam
percakapan ini**.

- Default `/tools` ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos pengalih mode yang sama seperti `compact|verbose`.
- Hasil dibatasi per sesi, jadi perubahan agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool plugin
  yang terhubung, dan tool milik channel.

Untuk mengedit profil dan override, gunakan panel Tools di Control UI atau permukaan config/katalog
alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota provider** (contoh: “Claude tersisa 80%”) muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% tersisa`; untuk MiniMax, field persentase yang hanya berisi sisa dibalik sebelum ditampilkan, dan respons `model_remains` memilih entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live jarang. Nilai live nonzero yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar ketika total yang tersimpan hilang atau lebih kecil.
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
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan lebih mengutamakan provider saat ini jika memungkinkan).
- `/model status` menampilkan tampilan detail, termasuk endpoint provider terkonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **hanya runtime** (di memori, bukan di disk). Khusus owner. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung berlaku untuk pembacaan config baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke config di disk.

## Output trace plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris trace/debug plugin yang dibatasi per sesi** tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan status trace sesi saat ini.
- `/trace on` mengaktifkan baris trace plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace plugin dapat muncul di `/status` dan sebagai pesan diagnostik tindak lanjut setelah balasan assistant normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override config yang hanya berlaku saat runtime.
- `/trace` tidak menggantikan `/verbose`; output tool/status verbose normal tetap menjadi bagian `/verbose`.

## Pembaruan config

`/config` menulis ke config di disk Anda (`openclaw.json`). Khusus owner. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Config divalidasi sebelum ditulis; perubahan yang tidak valid ditolak.
- Pembaruan `/config` bertahan setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus owner. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan config di config OpenClaw, bukan pengaturan proyek milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan/menonaktifkan plugin di config. Alur read-only dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan penemuan plugin nyata terhadap workspace saat ini plus config di disk.
- `/plugins enable|disable` hanya memperbarui config plugin; tidak menginstal atau menghapus plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi di pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- perintah ini menggunakan sesi saat ini sebagai konteks latar belakang,
- berjalan sebagai panggilan one-shot **tanpa tool** yang terpisah,
- tidak mengubah konteks sesi di masa mendatang,
- tidak ditulis ke riwayat transkrip,
- dikirim sebagai hasil sampingan live alih-alih pesan assistant normal.

Itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara sementara tugas utama tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail UX
klien.
