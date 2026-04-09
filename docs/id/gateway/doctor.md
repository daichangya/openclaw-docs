---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang breaking
summary: 'Perintah Doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-09T01:28:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d321bd1ad0e16c29f2382e249c51edfc3a8d33b55bdceea39e7dbcd4901fce
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki
konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah
perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomatisasi

```bash
openclaw doctor --yes
```

Terima default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox bila berlaku).

```bash
openclaw doctor --repair
```

Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + restart bila aman).

```bash
openclaw doctor --repair --force
```

Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor kustom).

```bash
openclaw doctor --non-interactive
```

Jalankan tanpa prompt dan hanya terapkan migrasi yang aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia.
Migrasi status lama berjalan otomatis saat terdeteksi.

```bash
openclaw doctor --deep
```

Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukan (ringkasan)

- Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kesegaran protokol UI (membangun ulang Control UI bila skema protokol lebih baru).
- Pemeriksaan kesehatan + prompt restart.
- Ringkasan status Skills (eligible/missing/blocked) dan status plugin.
- Normalisasi konfigurasi untuk nilai lama.
- Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Peringatan shadowing Codex OAuth (`models.providers.openai-codex`).
- Pemeriksaan prasyarat OAuth TLS untuk profil OpenAI Codex OAuth.
- Migrasi status lama di disk (sesi/dir agen/auth WhatsApp).
- Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback webhook `notify: true` sederhana).
- Inspeksi file lock sesi dan pembersihan lock usang.
- Pemeriksaan integritas dan izin status (sessions, transcripts, state dir).
- Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
- Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil auth.
- Deteksi dir workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi layanan lama dan deteksi gateway tambahan.
- Migrasi status lama kanal Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime gateway (layanan terpasang tetapi tidak berjalan; label launchd yang di-cache).
- Peringatan status kanal (diprobe dari gateway yang berjalan).
- Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan best practice runtime gateway (Node vs Bun, path version manager).
- Diagnostik benturan port gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan auth gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
- Pemeriksaan linger systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan provider embedding memory search (model lokal, kunci API jarak jauh, atau biner QMD).
- Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
- Menulis konfigurasi yang diperbarui + metadata wizard.

## Backfill dan reset UI Dreams

Scene Dreams di Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded**
untuk alur grounded dreaming. Tindakan ini menggunakan metode RPC
bergaya gateway doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI
`openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file `memory/YYYY-MM-DD.md` historis di
  workspace aktif, menjalankan pass diary REM grounded, dan menulis entri
  backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged khusus grounded yang
  berasal dari replay historis dan belum mengakumulasi recall live atau dukungan
  harian.

Yang **tidak** dilakukan dengan sendirinya:

- tindakan tersebut tidak mengedit `MEMORY.md`
- tindakan tersebut tidak menjalankan migrasi doctor penuh
- tindakan tersebut tidak otomatis men-stage kandidat grounded ke dalam penyimpanan
  promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane deep promotion
normal, gunakan alur CLI berikut:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Perintah itu men-stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil
tetap menjadikan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku dan alasan terperinci

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan untuk
memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi konfigurasi

Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction`
tanpa override spesifik kanal), doctor menormalisasikannya ke dalam skema
saat ini.

Itu termasuk field datar Talk lama. Konfigurasi Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke dalam peta provider.

### 2) Migrasi kunci konfigurasi lama

Saat konfigurasi berisi kunci yang sudah deprecated, perintah lain menolak berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan kunci lama mana yang ditemukan.
- Menampilkan migrasi yang diterapkannya.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format konfigurasi lama, sehingga konfigurasi usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan pekerjaan cron ditangani oleh `openclaw doctor --fix`.

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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Untuk kanal dengan `accounts` bernama tetapi masih memiliki nilai kanal tingkat atas akun tunggal, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan dan dipilih untuk kanal itu (`accounts.default` untuk sebagian besar kanal; Matrix dapat mempertahankan target bernama/default yang sudah cocok)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)

Peringatan doctor juga mencakup panduan account-default untuk kanal multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa fallback routing dapat memilih akun yang tidak terduga.
- Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu akan menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal itu dapat memaksa model ke API yang salah atau men-nol-kan biaya. Doctor memperingatkan agar Anda
dapat menghapus override dan memulihkan perutean API + biaya per model.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika konfigurasi browser Anda masih menunjuk ke path ekstensi Chrome yang sudah dihapus, doctor
menormalisasikannya ke model attach Chrome MCP host-lokal saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit path Chrome MCP host-lokal saat Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil
  auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan bila di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal
tetap memerlukan:

- browser berbasis Chromium 144+ pada host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt persetujuan attach pertama di browser

Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan
batas route Chrome MCP saat ini; route lanjutan seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan tindakan batch tetap memerlukan browser yang dikelola
atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur
headless lainnya. Semua itu tetap menggunakan CDP mentah.

### 2d) Prasyarat OAuth TLS

Saat profil OpenAI Codex OAuth dikonfigurasi, doctor mem-probe endpoint
otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan kesalahan sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau self-signed cert),
doctor mencetak panduan perbaikan spesifik platform. Di macOS dengan Homebrew Node,
perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, probe berjalan
bahkan jika gateway sehat.

### 2c) Override provider Codex OAuth

Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah
`models.providers.openai-codex`, pengaturan itu dapat membayangi path provider Codex OAuth
bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat
pengaturan transport lama tersebut bersama Codex OAuth agar Anda dapat menghapus atau menulis ulang
override transport usang dan mendapatkan kembali perilaku routing/fallback bawaan.
Proxy kustom dan override hanya-header tetap didukung dan tidak
memicu peringatan ini.

### 3) Migrasi status lama (layout disk)

Doctor dapat memigrasikan layout lama di disk ke struktur saat ini:

- Penyimpanan sesi + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Dir agen:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- Status auth WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat
meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis
sesi lama + dir agen saat startup sehingga riwayat/auth/model berada di
path per-agen tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta provider Talk kini
membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan kunci saja tidak lagi
memicu perubahan no-op `doctor --fix` yang berulang.

### 3a) Migrasi manifest plugin lama

Doctor memindai semua manifest plugin yang terinstal untuk kunci kapabilitas tingkat atas
yang sudah deprecated (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest di tempat. Migrasi ini idempoten;
jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan cron lama

Doctor juga memeriksa penyimpanan pekerjaan cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika di-override) untuk bentuk pekerjaan lama yang masih diterima
scheduler demi kompatibilitas.

Pembersihan cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` pada payload → `delivery.channel` eksplisit
- pekerjaan fallback webhook lama `notify: true` sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya otomatis memigrasikan pekerjaan `notify: true` bila hal itu dapat dilakukan tanpa
mengubah perilaku. Jika suatu pekerjaan menggabungkan fallback notify lama dengan mode
delivery non-webhook yang sudah ada, doctor memperingatkan dan membiarkan pekerjaan tersebut untuk ditinjau manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal
saat suatu sesi keluar secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah lock tersebut
dianggap usang (PID mati atau lebih tua dari 30 menit). Dalam mode `--fix` / `--repair`
doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas status (persistensi sesi, routing, dan keamanan)

Direktori status adalah batang otak operasional. Jika direktori ini hilang, Anda akan kehilangan
sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **State dir hilang**: memperingatkan kehilangan status yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Izin state dir**: memverifikasi dapat ditulis; menawarkan untuk memperbaiki izin
  (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
- **State dir tersinkron cloud di macOS**: memperingatkan saat status ter-resolve di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat
  dan race lock/sinkronisasi.
- **State dir Linux di SD atau eMMC**: memperingatkan saat status ter-resolve ke sumber mount `mmcblk*`,
  karena random I/O yang didukung SD atau eMMC bisa lebih lambat dan lebih cepat aus
  di bawah penulisan sesi dan kredensial.
- **Dir sesi hilang**: `sessions/` dan direktori penyimpanan sesi
  diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file
  transkrip yang hilang.
- **Sesi utama “1-line JSONL”**: menandai saat transkrip utama hanya memiliki satu
  baris (riwayat tidak terakumulasi).
- **Beberapa state dir**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai
  direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat
  terpecah antar instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (status berada di sana).
- **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat
  dibaca group/world dan menawarkan untuk memperketat ke `600`.

### 5) Kesehatan auth model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan saat token akan
kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh token saat aman. Jika profil
OAuth/token Anthropic usang, doctor menyarankan Anthropic API key atau path
setup-token Anthropic.
Prompt refresh hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati upaya refresh.

Saat refresh OAuth gagal permanen (misalnya `refresh_token_reused`,
`invalid_grant`, atau provider memberi tahu Anda untuk sign in lagi), doctor melaporkan
bahwa re-auth diperlukan dan mencetak perintah `openclaw models auth login --provider ...`
yang tepat untuk dijalankan.

Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

- cooldown singkat (rate limit/timeout/kegagalan auth)
- penonaktifan lebih lama (kegagalan billing/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan saat referensi itu tidak akan ter-resolve atau tidak diizinkan.

### 7) Perbaikan image sandbox

Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama lama jika image saat ini hilang.

### 7b) Dependensi runtime plugin bawaan

Doctor memverifikasi bahwa dependensi runtime plugin bawaan (misalnya paket
runtime plugin Discord) ada di root instalasi OpenClaw.
Jika ada yang hilang, doctor melaporkan paket tersebut dan menginstalnya dalam
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrasi layanan gateway dan petunjuk pembersihan

Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway
saat ini. Doctor juga dapat memindai layanan mirip gateway tambahan dan mencetak petunjuk pembersihan.
Layanan gateway OpenClaw bernama profil dianggap first-class dan tidak
ditandai sebagai "tambahan".

### 8b) Migrasi startup Matrix

Saat akun kanal Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi status Matrix lama dan persiapan
status terenkripsi lama. Kedua langkah bersifat non-fatal; kesalahan dicatat dan
startup berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini
dilewati sepenuhnya.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan saat suatu provider terbuka untuk DM tanpa allowlist, atau
saat suatu kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) systemd linger (Linux)

Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (Skills, plugin, dan dir lama)

Doctor mencetak ringkasan status workspace untuk agen default:

- **Status Skills**: menghitung Skills yang eligible, missing-requirements, dan allowlist-blocked.
- **Dir workspace lama**: memperingatkan saat `~/openclaw` atau direktori workspace lama lain
  ada bersama workspace saat ini.
- **Status plugin**: menghitung plugin loaded/disabled/errored; mencantumkan ID plugin untuk
  error apa pun; melaporkan kapabilitas bundle plugin.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau error saat load yang dikeluarkan oleh
  registry plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks injeksi lainnya) mendekati atau melebihi budget karakter
yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. yang diinjeksi per file, persentase
pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter
yang diinjeksi sebagai fraksi dari total budget. Saat file dipotong atau mendekati
batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion terinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola dynamic completion yang lambat
  (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache
  yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache hilang,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan auth gateway (token lokal)

Doctor memeriksa kesiapan auth token gateway lokal.

- Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada token SecretRef yang dikonfigurasi.

### 12b) Perbaikan sadar-SecretRef baca-saja

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast saat runtime.

- `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef baca-saja yang sama seperti keluarga perintah status untuk perbaikan konfigurasi yang terarah.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi bila tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia dalam path perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-tetapi-tidak-tersedia dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk merestart gateway saat terlihat
tidak sehat.

### 13b) Kesiapan memory search

Doctor memeriksa apakah provider embedding memory search yang dikonfigurasi siap
untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: mem-probe apakah biner `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
- **Provider lokal eksplisit**: memeriksa file model lokal atau URL model
  remote/dapat-diunduh yang dikenali. Jika hilang, doctor menyarankan beralih ke provider remote.
- **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key
  ada di environment atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
- **Provider auto**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap
  provider remote dalam urutan auto-selection.

Saat hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor melakukan cross-reference hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status kanal

Jika gateway sehat, doctor menjalankan probe status kanal dan melaporkan
peringatan dengan perbaikan yang disarankan.

### 15) Audit konfigurasi supervisor + perbaikan

Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi systemd network-online dan
restart delay). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat
menulis ulang file/task layanan ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
- Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, install/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata environment layanan supervisor.
- Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi tidak ter-resolve, doctor memblokir path install/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, doctor memblokir install/perbaikan sampai mode diatur secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime + port gateway

Doctor memeriksa runtime layanan (PID, status exit terakhir) dan memperingatkan saat
layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Best practice runtime gateway

Doctor memperingatkan saat layanan gateway berjalan di Bun atau path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node,
dan path version manager dapat rusak setelah upgrade karena layanan tidak
memuat init shell Anda. Doctor menawarkan untuk memigrasikan ke instalasi Node sistem bila
tersedia (Homebrew/apt/choco).

### 18) Penulisan konfigurasi + metadata wizard

Doctor menyimpan setiap perubahan konfigurasi dan memberi cap metadata wizard untuk mencatat
run doctor.

### 19) Tips workspace (cadangan + sistem memori)

Doctor menyarankan sistem memori workspace jika belum ada dan mencetak tip cadangan
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan cadangan git (disarankan GitHub atau GitLab privat).
