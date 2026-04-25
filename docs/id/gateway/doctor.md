---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan config yang breaking
summary: 'Perintah doctor: pemeriksaan health, migrasi config, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Perintah ini memperbaiki
config/state yang usang, memeriksa health, dan memberikan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomasi

```bash
openclaw doctor --yes
```

Terima default tanpa prompt (termasuk langkah perbaikan restart/service/sandbox bila berlaku).

```bash
openclaw doctor --repair
```

Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + restart jika aman).

```bash
openclaw doctor --repair --force
```

Terapkan juga perbaikan agresif (menimpa config supervisor kustom).

```bash
openclaw doctor --non-interactive
```

Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan state di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia.
Migrasi state lama berjalan otomatis saat terdeteksi.

```bash
openclaw doctor --deep
```

Pindai service sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Yang dilakukan (ringkasan)

- Update pre-flight opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kebaruan protokol UI (membangun ulang Control UI ketika skema protokol lebih baru).
- Pemeriksaan health + prompt restart.
- Ringkasan status Skills (eligible/missing/blocked) dan status Plugin.
- Normalisasi config untuk nilai lama.
- Migrasi config Talk dari field `talk.*` datar lama ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk config ekstensi Chrome lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
- Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
- Migrasi state lama di disk (sessions/dir agen/auth WhatsApp).
- Migrasi key kontrak manifest Plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi store cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
- Inspeksi file lock sesi dan pembersihan lock usang.
- Pemeriksaan integritas state dan permission (sessions, transcripts, dir state).
- Pemeriksaan permission file config (`chmod 600`) saat berjalan lokal.
- Health auth model: memeriksa kedaluwarsa OAuth, dapat merefresh token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil auth.
- Deteksi direktori workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi service lama dan deteksi gateway tambahan.
- Migrasi state lama channel Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime Gateway (service terinstal tetapi tidak berjalan; label launchd cache).
- Peringatan status channel (diprobe dari gateway yang sedang berjalan).
- Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan best practice runtime Gateway (Node vs Bun, path version-manager).
- Diagnostik benturan port Gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config token SecretRef).
- Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade role/scope yang tertunda, drift cache device-token lokal usang, dan drift auth record paired).
- Pemeriksaan linger systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan truncation/mendekati batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan provider embedding memory search (model lokal, API key remote, atau binary QMD).
- Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, asset UI hilang, binary tsx hilang).
- Menulis config dan metadata wizard yang telah diperbarui.

## Backfill dan reset UI Dreams

Scene Dreams pada Control UI mencakup aksi **Backfill**, **Reset**, dan **Clear Grounded**
untuk alur kerja Dreaming grounded. Aksi-aksi ini menggunakan metode RPC
bergaya doctor gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace
  aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik
  ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek bertipe grounded-only yang di-stage
  yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan
  harian.

Yang **tidak** dilakukan sendiri:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak otomatis men-stage kandidat grounded ke store promosi jangka pendek live
  kecuali Anda secara eksplisit menjalankan jalur CLI stage terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi deep normal,
gunakan alur CLI berikut:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke store Dreaming jangka pendek sambil
menjaga `DREAMS.md` sebagai surface peninjauan.

## Perilaku rinci dan alasannya

### 0) Update opsional (instalasi git)

Jika ini adalah checkout git dan doctor dijalankan secara interaktif, doctor menawarkan untuk
update (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi config

Jika config berisi bentuk nilai lama (misalnya `messages.ackReaction`
tanpa override khusus channel), doctor menormalkannya ke skema saat ini.

Itu termasuk field datar Talk lama. Config Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke map provider.

### 2) Migrasi key config lama

Ketika config berisi key yang deprecated, perintah lain menolak berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan key lama mana yang ditemukan.
- Menampilkan migrasi yang diterapkan.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format config lama, sehingga config usang diperbaiki tanpa intervensi manual.
Migrasi store cron ditangani oleh `openclaw doctor --fix`.

Migrasi saat ini:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` tingkat atas
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` dan `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` dan `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` dan `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` dan `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas single-account, pindahkan nilai bertingkat akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk kebanyakan channel; Matrix dapat mempertahankan target bernama/default yang sudah cocok)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)

Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa fallback routing dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal itu dapat memaksa model ke API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda
dapat menghapus override dan memulihkan routing + biaya API per model.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika config browser Anda masih menunjuk ke jalur ekstensi Chrome yang sudah dihapus, doctor
menormalkannya ke model attach Chrome MCP host-lokal saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil
  auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal
tetap memerlukan:

- browser berbasis Chromium 144+ pada host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt consent attach pertama di browser

Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan
batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan aksi batch tetap memerlukan browser terkelola
atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur
headless lainnya. Alur-alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat OAuth TLS

Ketika profil OAuth OpenAI Codex dikonfigurasi, doctor memprobe endpoint
otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan error sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan yang spesifik platform. Di macOS dengan Node Homebrew, perbaikannya
biasanya adalah `brew postinstall ca-certificates`. Dengan `--deep`, probe tetap dijalankan
meskipun gateway sehat.

### 2c) Override provider OAuth Codex

Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah
`models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur provider
OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat
pengaturan transport lama tersebut berdampingan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang
override transport usang dan mendapatkan kembali perilaku routing/fallback bawaan.
Proxy kustom dan override khusus header tetap didukung dan tidak
memicu peringatan ini.

### 3) Migrasi state lama (layout disk)

Doctor dapat memigrasikan layout lama di disk ke struktur saat ini:

- Store sesi + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Dir agen:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- Status auth WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan ketika
meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan
sesi lama + dir agen saat startup sehingga history/auth/models masuk ke
path per agen tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi Talk provider/provider-map kini
membandingkan dengan kesetaraan struktural, sehingga perbedaan urutan key saja tidak lagi memicu
perubahan no-op `doctor --fix` berulang.

### 3a) Migrasi manifest Plugin lama

Doctor memindai semua manifest Plugin yang terinstal untuk key kapabilitas tingkat atas
yang deprecated (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Jika ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest secara langsung. Migrasi ini idempoten;
jika key `contracts` sudah memiliki nilai yang sama, key lama dihapus
tanpa menduplikasi data.

### 3b) Migrasi store cron lama

Doctor juga memeriksa store job cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika ditimpa) untuk bentuk job lama yang masih
diterima scheduler demi kompatibilitas.

Pembersihan cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias pengiriman `provider` payload → `delivery.channel` eksplisit
- job fallback webhook sederhana lama `notify: true` → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya otomatis memigrasikan job `notify: true` jika dapat melakukannya tanpa
mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode
pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job itu untuk ditinjau manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal
ketika sebuah sesi keluar secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah lock tersebut
dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`
doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas state (persistensi sesi, routing, dan keamanan)

Direktori state adalah batang otak operasional. Jika direktori ini hilang, Anda kehilangan
sesi, kredensial, log, dan config (kecuali Anda memiliki backup di tempat lain).

Doctor memeriksa:

- **Dir state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Permission dir state**: memverifikasi dapat ditulisi; menawarkan untuk memperbaiki permission
  (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan owner/group terdeteksi).
- **Dir state macOS yang disinkronkan cloud**: memperingatkan ketika state diresolusikan di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat
  dan race lock/sinkronisasi.
- **Dir state Linux di SD atau eMMC**: memperingatkan ketika state diresolusikan ke sumber mount `mmcblk*`,
  karena random I/O berbasis SD atau eMMC bisa lebih lambat dan lebih cepat aus akibat penulisan sesi dan kredensial.
- **Dir sesi hilang**: `sessions/` dan direktori store sesi
  diperlukan untuk menyimpan history dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file
  transkrip yang hilang.
- **Sesi utama “JSONL 1 baris”**: menandai ketika transkrip utama hanya memiliki satu
  baris (history tidak terakumulasi).
- **Banyak dir state**: memperingatkan ketika ada beberapa folder `~/.openclaw` di beberapa
  direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (history dapat
  terpecah di antara instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (state berada di sana).
- **Permission file config**: memperingatkan jika `~/.openclaw/openclaw.json`
  dapat dibaca oleh group/world dan menawarkan untuk memperketat ke `600`.

### 5) Health auth model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di auth store, memperingatkan ketika token akan
kedaluwarsa/sudah kedaluwarsa, dan dapat merefreshnya jika aman. Jika profil
OAuth/token Anthropic usang, doctor menyarankan API key Anthropic atau jalur
setup-token Anthropic.
Prompt refresh hanya muncul ketika dijalankan secara interaktif (TTY); `--non-interactive`
melewati upaya refresh.

Ketika refresh OAuth gagal secara permanen (misalnya `refresh_token_reused`,
`invalid_grant`, atau provider meminta Anda login lagi), doctor melaporkan
bahwa re-auth diperlukan dan mencetak perintah `openclaw models auth login --provider ...`
yang tepat untuk dijalankan.

Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

- cooldown singkat (rate limit/timeout/kegagalan auth)
- penonaktifan lebih lama (kegagalan billing/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` disetel, doctor memvalidasi ref model terhadap
katalog dan allowlist serta memperingatkan ketika model tidak dapat diresolusikan atau tidak diizinkan.

### 7) Perbaikan image sandbox

Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama lama jika image saat ini hilang.

### 7b) Dependensi runtime Plugin bundled

Doctor memverifikasi dependensi runtime hanya untuk Plugin bundled yang aktif di
config saat ini atau diaktifkan oleh default manifest bundled, misalnya
`plugins.entries.discord.enabled: true`, bentuk lama
`channels.discord.enabled: true`, atau provider bundled yang aktif secara default. Jika ada
yang hilang, doctor melaporkan paket tersebut dan memasangnya dalam mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap
menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak
memasang dependensi untuk path Plugin arbitrer.

Gateway dan CLI lokal juga dapat memperbaiki dependensi runtime Plugin bundled yang aktif
sesuai kebutuhan sebelum mengimpor Plugin bundled. Instalasi ini
dibatasi pada root instalasi runtime Plugin, dijalankan dengan script dinonaktifkan, tidak
menulis package lock, dan dilindungi oleh install-root lock sehingga start CLI
atau Gateway yang berjalan bersamaan tidak memutasi tree `node_modules` yang sama pada saat yang sama.

### 8) Migrasi service Gateway dan petunjuk pembersihan

Doctor mendeteksi service Gateway lama (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta memasang service OpenClaw menggunakan port Gateway
saat ini. Doctor juga dapat memindai service tambahan yang mirip gateway dan mencetak petunjuk pembersihan.
Service gateway OpenClaw bernama profil dianggap kelas satu dan tidak
ditandai sebagai "tambahan."

### 8b) Migrasi Matrix saat startup

Ketika akun channel Matrix memiliki migrasi state lama yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi state Matrix lama dan persiapan
state terenkripsi lama. Kedua langkah ini tidak fatal; error dicatat dalam log dan
startup tetap berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan ini
dilewati sepenuhnya.

### 8c) Pairing perangkat dan drift auth

Doctor kini memeriksa state pairing perangkat sebagai bagian dari health pass normal.

Yang dilaporkan:

- permintaan pairing pertama kali yang tertunda
- upgrade role yang tertunda untuk perangkat yang sudah dipasangkan
- upgrade scope yang tertunda untuk perangkat yang sudah dipasangkan
- perbaikan ketidakcocokan public-key ketika id perangkat masih cocok tetapi
  identitas perangkat tidak lagi cocok dengan record yang disetujui
- record paired yang tidak memiliki token aktif untuk role yang disetujui
- token paired yang scope-nya menyimpang di luar baseline pairing yang disetujui
- entri cache device-token lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata scope usang

Doctor tidak otomatis menyetujui permintaan pair atau mengotomatiskan rotasi token perangkat. Doctor
mencetak langkah berikutnya yang tepat:

- periksa permintaan tertunda dengan `openclaw devices list`
- setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
- rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
- hapus dan setujui ulang record usang dengan `openclaw devices remove <deviceId>`

Ini menutup celah umum "sudah dipasangkan tetapi masih mendapat pairing required":
doctor kini membedakan pairing pertama kali dari upgrade role/scope
yang tertunda dan dari drift token/identitas perangkat usang.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan ketika sebuah provider terbuka untuk DM tanpa allowlist, atau
ketika kebijakan dikonfigurasi بطريقة berbahaya.

### 10) Linger systemd (Linux)

Jika berjalan sebagai service pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (Skills, Plugin, dan dir lama)

Doctor mencetak ringkasan status workspace untuk agen default:

- **Status Skills**: menghitung Skills eligible, missing-requirements, dan allowlist-blocked.
- **Dir workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya
  ada berdampingan dengan workspace saat ini.
- **Status Plugin**: menghitung Plugin loaded/disabled/errored; mencantumkan id Plugin untuk error apa pun; melaporkan kapabilitas Plugin bundle.
- **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik Plugin**: menampilkan peringatan atau error saat load-time yang dikeluarkan oleh
  registry Plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks terinjeksi lainnya) mendekati atau melewati
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter per file mentah vs terinjeksi, persentase truncation,
penyebab truncation (`max/file` atau `max/total`), dan total karakter yang diinjeksi
sebagai fraksi dari total anggaran. Saat file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion sudah terinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola completion dinamis yang lambat
  (`source <(openclaw completion ...)`), doctor akan meng-upgrade-nya ke varian file cache
  yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache tidak ada,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan auth Gateway (token lokal)

Doctor memeriksa kesiapan auth token gateway lokal.

- Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuat satu.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada token SecretRef yang dikonfigurasi.

### 12b) Perbaikan read-only yang memahami SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef read-only yang sama seperti keluarga perintah status untuk perbaikan config yang ditargetkan.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan health Gateway + restart

Doctor menjalankan pemeriksaan health dan menawarkan untuk me-restart gateway ketika terlihat
tidak sehat.

### 13b) Kesiapan memory search

Doctor memeriksa apakah provider embedding memory search yang dikonfigurasi siap
untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: memprobe apakah binary `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path binary manual.
- **Provider lokal eksplisit**: memeriksa file model lokal atau URL model
  remote/yang dapat diunduh yang dikenali. Jika hilang, doctor menyarankan beralih ke provider remote.
- **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key
  ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
- **Provider auto**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider remote
  sesuai urutan auto-selection.

Ketika hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor membandingkan hasil tersebut dengan config yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status channel

Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan
peringatan dengan perbaikan yang disarankan.

### 15) Audit config supervisor + perbaikan

Doctor memeriksa config supervisor terinstal (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi systemd network-online dan
restart delay). Ketika doctor menemukan ketidakcocokan, doctor merekomendasikan update dan dapat
menulis ulang file service/task ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang config supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa config supervisor kustom.
- Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, jalur install/perbaikan service doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang sudah diresolusikan ke metadata environment service supervisor.
- Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi belum teresolusikan, doctor memblokir jalur install/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir install/perbaikan sampai mode disetel secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth service.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime + port Gateway

Doctor memeriksa runtime service (PID, status exit terakhir) dan memperingatkan ketika
service terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebab (gateway sudah
berjalan, tunnel SSH).

### 17) Best practice runtime Gateway

Doctor memperingatkan ketika service gateway berjalan di Bun atau pada path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node,
dan path version-manager dapat rusak setelah upgrade karena service tidak
memuat init shell Anda. Doctor menawarkan untuk memigrasikan ke instalasi Node sistem ketika
tersedia (Homebrew/apt/choco).

### 18) Penulisan config + metadata wizard

Doctor menyimpan setiap perubahan config dan memberi stempel metadata wizard untuk mencatat
eksekusi doctor.

### 19) Tips workspace (backup + sistem memori)

Doctor menyarankan sistem memori workspace ketika belum ada dan mencetak tip backup
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan backup git (direkomendasikan GitHub atau GitLab privat).

## Terkait

- [Gateway troubleshooting](/id/gateway/troubleshooting)
- [Gateway runbook](/id/gateway)
