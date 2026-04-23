---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Slash commands: teks vs native, konfigurasi, dan perintah yang didukung'
title: Slash Commands
x-i18n:
    generated_at: "2026-04-23T09:29:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Commands

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem yang terkait:

- **Commands**: pesan mandiri `/...`.
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directive dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya directive), directive diperlakukan sebagai “petunjuk inline” dan **tidak** mem-persist pengaturan sesi.
  - Dalam pesan yang hanya berisi directive (pesan hanya berisi directive), directive dipersist ke sesi dan membalas dengan acknowledgement.
  - Directive hanya diterapkan untuk **pengirim yang diotorisasi**. Jika `commands.allowFrom` disetel, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak diotorisasi akan melihat directive diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang diizinkan/diotorisasi): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini berjalan segera, dihapus sebelum model melihatnya, dan teks yang tersisa melanjutkan alur normal.

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
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menetapkan ini ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk override per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **Skills** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan membuat slash command per skill).
  - Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk override per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung ke latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (baca/tulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (baca/tulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (discovery/status plugin plus kontrol install + enable/disable).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override khusus runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus aksi tool restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist pemilik eksplisit untuk permukaan perintah/tool khusus pemilik. Ini terpisah dari `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per-channel (opsional, default `false`) membuat perintah khusus pemilik memerlukan **identitas pemilik** untuk dijalankan pada permukaan itu. Saat `true`, pengirim harus cocok dengan kandidat pemilik yang di-resolve (misalnya entri di `commands.ownerAllowFrom` atau metadata pemilik native provider) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard di channel `allowFrom`, atau daftar kandidat pemilik yang kosong/tidak ter-resolve, **tidak** cukup — perintah khusus pemilik gagal secara tertutup pada channel itu. Biarkan ini nonaktif jika Anda ingin perintah khusus pemilik hanya digate oleh `ownerAllowFrom` dan allowlist perintah standar.
- `commands.ownerDisplay` mengontrol bagaimana ID pemilik muncul dalam system prompt: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per-provider untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  satu-satunya sumber otorisasi untuk perintah dan directive (allowlist/pairing channel dan `commands.useAccessGroups`
  diabaikan). Gunakan `"*"` untuk default global; key khusus provider mengoverride-nya.
- `commands.useAccessGroups` (default `true`) menegakkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.

## Daftar perintah

Sumber kebenaran saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari panggilan plugin `registerCommand()`
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan channel, dan plugin yang terinstal/diaktifkan

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, menghapus ID sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
- `/compact [instructions]` melakukan Compaction pada konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan run saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa thread-binding.
- `/think <level>` menetapkan tingkat berpikir. Opsi berasal dari profil provider model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau `on` biner hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan/menonaktifkan output trace plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau menetapkan fast mode.
- `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan elevated mode. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk suatu provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agent saat ini sekarang juga.
- `/status` menampilkan status runtime, termasuk usage/kuota provider bila tersedia.
- `/tasks` mencantumkan task latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/export-trajectory [path]` mengekspor [bundle trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Alias: `/trajectory`.
- `/whoami` menampilkan ID pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan Skills berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` me-resolve prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa depan. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agent untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus binding saat ini.
- `/agents` mencantumkan agent yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agent yang sedang berjalan.
- `/steer <id|#> <message>` mengirim steering ke sub-agent yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah state plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override konfigurasi khusus runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer usage per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` me-restart OpenClaw saat diaktifkan. Default: aktif; setel `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Khusus pemilik.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa job bash latar belakang.
- `!stop [sessionId]` menghentikan job bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari plugin channel dengan dukungan native-command. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan Dreaming Memory. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola pairing perangkat/alur setup. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` sementara mengaktifkan command Node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi voice Talk. Di Discord, nama perintah native-nya adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Harness Codex](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah Skills dinamis

Skills yang dapat dipanggil pengguna juga diekspos sebagai slash command:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- Skills juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/plugin mendaftarkannya.
- Registrasi perintah Skills native dikendalikan oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada yang cocok, teks diperlakukan sebagai body pesan.
- Untuk rincian usage provider lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` channel.
- Di channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
- `/usage` mengontrol footer usage per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` aktif secara default; setel `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, package npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui konfigurasi plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah thread-binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan thread binding efektif yang diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik plugin dan tetap menonaktifkan chatter tool verbose normal.
- `/fast on|off` mem-persist override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan fallback ke default konfigurasi.
- `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk traffic yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` adalah `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah ini dapat mengungkap reasoning internal, output tool, atau diagnostik plugin yang tidak ingin Anda ekspos. Sebaiknya biarkan nonaktif, terutama di obrolan grup.
- `/model` mem-persist model sesi baru segera.
- Jika agent sedang idle, run berikutnya langsung menggunakannya.
- Jika sebuah run sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya me-restart ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, peralihan tertunda dapat tetap mengantre sampai peluang retry berikutnya atau giliran pengguna berikutnya.
- **Jalur cepat:** pesan khusus-perintah dari pengirim yang di-allowlist ditangani segera (melewati antrean + model).
- **Mention gating grup:** pesan khusus-perintah dari pengirim yang di-allowlist melewati persyaratan mention.
- **Shortcut inline (hanya untuk pengirim yang di-allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
  - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa melanjutkan melalui alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan khusus-perintah yang tidak diotorisasi diabaikan diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah Skills:** Skills `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan diberi sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan Skills berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
  - Secara default, perintah Skills diteruskan ke model sebagai permintaan normal.
  - Skills dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat suatu perintah mendukung pilihan dan Anda menghilangkan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agent ini sekarang juga dalam
percakapan ini**.

- `/tools` default bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan native-command yang mendukung argumen mengekspos sakelar mode yang sama seperti `compact|verbose`.
- Hasil memiliki cakupan sesi, sehingga mengubah agent, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau pada runtime, termasuk tool inti, connected
  tool plugin, dan tool milik channel.

Untuk pengeditan profil dan override, gunakan panel Tools di Control UI atau permukaan config/catalog
alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan usage (apa yang muncul di mana)

- **Usage/kuota provider** (contoh: “Claude tersisa 80%”) muncul di `/status` untuk provider model saat ini ketika pelacakan usage diaktifkan. OpenClaw menormalisasi jendela provider menjadi `% tersisa`; untuk MiniMax, field persentase hanya-tersisa dibalik sebelum ditampilkan, dan respons `model_remains` lebih mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri usage transkrip terbaru saat snapshot sesi live jarang. Nilai live nonzero yang ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total tersimpan tidak ada atau lebih kecil.
- **Token/biaya per respons** dikendalikan oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` berfokus pada **model/auth/endpoint**, bukan usage.

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
- `/model status` menampilkan tampilan detail, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) saat tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **khusus runtime** (memori, bukan disk). Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung berlaku untuk pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.

## Output trace plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris trace/debug plugin dengan cakupan sesi** tanpa menyalakan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan state trace sesi saat ini.
- `/trace on` mengaktifkan baris trace plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan assistant normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi khusus runtime.
- `/trace` tidak menggantikan `/verbose`; output tool/status verbose normal tetap milik `/verbose`.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.config: true`.

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
- Pembaruan `/config` tetap ada setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan/menonaktifkan plugin di konfigurasi. Alur hanya-baca dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan discovery plugin nyata terhadap workspace saat ini plus konfigurasi di disk.
- `/plugins enable|disable` hanya memperbarui konfigurasi plugin; tidak menginstal atau menghapus plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi mereka sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Berbeda dari chat normal:

- menggunakan sesi saat ini sebagai konteks latar belakang,
- berjalan sebagai panggilan sekali jalan **tanpa tool** yang terpisah,
- tidak mengubah konteks sesi di masa depan,
- tidak ditulis ke riwayat transkrip,
- dikirim sebagai hasil sampingan live alih-alih pesan assistant normal.

Itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara sementara
tugas utama tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail UX
client.
