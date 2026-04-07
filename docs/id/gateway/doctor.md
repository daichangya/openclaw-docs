---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan config yang breaking
summary: 'Perintah Doctor: pemeriksaan kesehatan, migrasi config, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-07T09:15:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a834dc7aec79c20d17bc23d37fb5f5e99e628d964d55bd8cf24525a7ee57130c
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki
config/state yang usang, memeriksa kesehatan, dan memberikan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomatisasi

```bash
openclaw doctor --yes
```

Terima nilai default tanpa prompt (termasuk langkah restart/service/perbaikan sandbox jika berlaku).

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

Jalankan tanpa prompt dan hanya terapkan migrasi yang aman (normalisasi config + pemindahan state di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia.
Migrasi state legacy berjalan otomatis saat terdeteksi.

```bash
openclaw doctor --deep
```

Pindai service sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukannya (ringkasan)

- Pembaruan pra-penerbangan opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
- Pemeriksaan kesehatan + prompt restart.
- Ringkasan status Skills (layak/hilang/terblokir) dan status plugin.
- Normalisasi config untuk nilai legacy.
- Migrasi config Talk dari field `talk.*` datar legacy ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk config ekstensi Chrome legacy dan kesiapan Chrome MCP.
- Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Pemeriksaan prasyarat OAuth TLS untuk profil OpenAI Codex OAuth.
- Migrasi state di disk legacy (sessions/direktori agent/autentikasi WhatsApp).
- Migrasi kunci kontrak manifest plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan cron legacy (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, `provider` payload, pekerjaan fallback webhook sederhana `notify: true`).
- Inspeksi file lock sesi dan pembersihan lock basi.
- Pemeriksaan integritas state dan izin (sessions, transkrip, direktori state).
- Pemeriksaan izin file config (`chmod 600`) saat berjalan secara lokal.
- Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil auth.
- Deteksi direktori workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi service legacy dan deteksi gateway tambahan.
- Migrasi state legacy saluran Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime gateway (service terinstal tetapi tidak berjalan; label launchd yang di-cache).
- Peringatan status saluran (diprobe dari gateway yang sedang berjalan).
- Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan praktik terbaik runtime gateway (Node vs Bun, path version manager).
- Diagnostik benturan port gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan auth gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config SecretRef token).
- Pemeriksaan `linger` systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API remote, atau biner QMD).
- Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
- Menulis config dan metadata wizard yang diperbarui.

## Perilaku rinci dan alasannya

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan untuk
memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi config

Jika config berisi bentuk nilai legacy (misalnya `messages.ackReaction`
tanpa override khusus saluran), doctor menormalkannya ke
skema saat ini.

Itu termasuk field datar Talk legacy. Config Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke dalam peta penyedia.

### 2) Migrasi kunci config legacy

Saat config berisi kunci yang sudah deprecated, perintah lain menolak untuk berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan kunci legacy mana yang ditemukan.
- Menunjukkan migrasi yang diterapkannya.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format config legacy, sehingga config usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan pekerjaan cron ditangani oleh `openclaw doctor --fix`.

Migrasi saat ini:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` tingkat atas
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
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
- Untuk saluran dengan `accounts` bernama tetapi masih memiliki nilai saluran tingkat atas akun tunggal, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan yang dipilih untuk saluran itu (`accounts.default` untuk sebagian besar saluran; Matrix dapat mempertahankan target bernama/default yang sudah cocok)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi legacy)

Peringatan doctor juga mencakup panduan default akun untuk saluran multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override penyedia OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal itu dapat memaksa model ke API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda
dapat menghapus override dan memulihkan perutean API per model + biaya.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika config browser Anda masih menunjuk ke path ekstensi Chrome yang sudah dihapus, doctor
menormalkannya ke model attach Chrome MCP host-lokal saat ini:

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
masih memerlukan:

- browser berbasis Chromium 144+ pada host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt consent attach pertama di browser

Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan
batas rute Chrome MCP saat ini; rute tingkat lanjut seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan tindakan batch masih memerlukan
browser terkelola atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur
headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat OAuth TLS

Ketika profil OpenAI Codex OAuth dikonfigurasi, doctor mem-probe endpoint otorisasi
OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan kesalahan sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya
biasanya `brew postinstall ca-certificates`. Dengan `--deep`, probe tetap berjalan
meskipun gateway sehat.

### 3) Migrasi state legacy (tata letak disk)

Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

- Penyimpanan sessions + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Direktori agent:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- State auth WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` legacy (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan ketika
masih menyisakan folder legacy sebagai cadangan. Gateway/CLI juga otomatis memigrasikan
sessions legacy + direktori agent saat startup sehingga riwayat/auth/model masuk ke
path per-agent tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi peta provider/provider Talk kini
membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan kunci saja tidak lagi memicu
perubahan `doctor --fix` no-op berulang.

### 3a) Migrasi manifest plugin legacy

Doctor memindai semua manifest plugin yang terinstal untuk kunci kapabilitas tingkat atas yang sudah deprecated
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest di tempat. Migrasi ini idempoten;
jika kunci `contracts` sudah memiliki nilai yang sama, kunci legacy dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan cron legacy

Doctor juga memeriksa penyimpanan pekerjaan cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika dioverride) untuk bentuk pekerjaan lama yang masih diterima
scheduler demi kompatibilitas.

Pembersihan cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` payload → `delivery.channel` eksplisit
- pekerjaan fallback webhook legacy sederhana `notify: true` → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya memigrasikan otomatis pekerjaan `notify: true` saat dapat dilakukan tanpa
mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify legacy dengan mode
delivery non-webhook yang sudah ada, doctor memperingatkan dan membiarkan pekerjaan itu untuk peninjauan manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agent untuk file write-lock basi — file yang tertinggal
ketika sebuah sesi keluar secara tidak normal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah lock tersebut
dianggap basi (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`
doctor menghapus file lock basi secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas state (persistensi sesi, perutean, dan keamanan)

Direktori state adalah batang otak operasional. Jika direktori ini hilang, Anda kehilangan
sessions, kredensial, log, dan config (kecuali Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Izin direktori state**: memverifikasi dapat ditulis; menawarkan untuk memperbaiki izin
  (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
- **Direktori state yang disinkronkan cloud di macOS**: memperingatkan saat state berada di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat
  dan race lock/sinkronisasi.
- **Direktori state Linux di SD atau eMMC**: memperingatkan saat state berada pada sumber mount `mmcblk*`,
  karena I/O acak berbasis SD atau eMMC bisa lebih lambat dan lebih cepat aus
  saat penulisan sesi dan kredensial.
- **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi
  diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file
  transkrip yang hilang.
- **Sesi utama “JSONL 1 baris”**: menandai saat transkrip utama hanya memiliki satu
  baris (riwayat tidak bertambah).
- **Beberapa direktori state**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai
  direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat
  terpecah di antara instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (state berada di sana).
- **Izin file config**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh
  group/dunia dan menawarkan untuk memperketat ke `600`.

### 5) Kesehatan auth model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan saat token
akan kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh-nya bila aman. Jika profil
OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau jalur
setup-token Anthropic.
Prompt refresh hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati upaya refresh.

Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

- cooldown singkat (rate limit/timeout/kegagalan auth)
- penonaktifan yang lebih lama (kegagalan penagihan/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan saat model tidak akan resolve atau tidak diizinkan.

### 7) Perbaikan image sandbox

Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama legacy jika image saat ini hilang.

### 7b) Dependensi runtime plugin bundel

Doctor memverifikasi bahwa dependensi runtime plugin bundel (misalnya paket
runtime plugin Discord) ada di root instalasi OpenClaw.
Jika ada yang hilang, doctor melaporkan paket tersebut dan memasangnya dalam
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrasi service gateway dan petunjuk pembersihan

Doctor mendeteksi service gateway legacy (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta memasang service OpenClaw menggunakan port gateway
saat ini. Doctor juga dapat memindai service tambahan yang menyerupai gateway dan mencetak petunjuk pembersihan.
Service gateway OpenClaw bernama profil dianggap kelas satu dan tidak
ditandai sebagai "tambahan."

### 8b) Migrasi Matrix saat startup

Ketika akun saluran Matrix memiliki migrasi state legacy yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi state Matrix legacy dan persiapan
encrypted-state legacy. Kedua langkah tersebut tidak fatal; kesalahan dicatat dan
startup tetap berlanjut. Dalam mode baca saja (`openclaw doctor` tanpa `--fix`) pemeriksaan
ini dilewati sepenuhnya.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan ketika sebuah penyedia terbuka untuk DM tanpa allowlist, atau
ketika suatu kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) systemd linger (Linux)

Jika berjalan sebagai service pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (skills, plugin, dan direktori legacy)

Doctor mencetak ringkasan status workspace untuk agent default:

- **Status Skills**: menghitung skill yang layak, requirement yang hilang, dan skill yang diblokir allowlist.
- **Direktori workspace legacy**: memperingatkan saat `~/openclaw` atau direktori workspace legacy lain
  ada di samping workspace saat ini.
- **Status plugin**: menghitung plugin yang dimuat/dinonaktifkan/error; mencantumkan ID plugin untuk error
  apa pun; melaporkan kapabilitas plugin bundel.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau kesalahan waktu muat apa pun yang dikeluarkan oleh
  registry plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks tersuntik lainnya) mendekati atau melebihi
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs tersuntik per file, persentase
pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter
tersuntik sebagai fraksi dari total anggaran. Saat file dipotong atau mendekati
batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion terinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola completion dinamis yang lambat
  (`source <(openclaw completion ...)`), doctor meng-upgrade-nya ke varian file cache
  yang lebih cepat.
- Jika completion dikonfigurasi dalam profil tetapi file cache hilang,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan auth gateway (token lokal)

Doctor memeriksa kesiapan auth token gateway lokal.

- Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada SecretRef token yang dikonfigurasi.

### 12b) Perbaikan read-only yang sadar SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef read-only yang sama seperti keluarga perintah status untuk perbaikan config yang ditargetkan.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi bila tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-tetapi-tidak-tersedia dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway ketika terlihat
tidak sehat.

### 13b) Kesiapan pencarian memori

Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap
untuk agent default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

- **Backend QMD**: mem-probe apakah biner `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
- **Penyedia lokal eksplisit**: memeriksa keberadaan file model lokal atau URL model remote/dapat diunduh yang dikenali. Jika hilang, doctor menyarankan beralih ke penyedia remote.
- **Penyedia remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API
  ada di environment atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
- **Penyedia auto**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia remote
  dalam urutan pemilihan otomatis.

Ketika hasil probe gateway tersedia (gateway sehat saat pemeriksaan dilakukan),
doctor membandingkan silang hasilnya dengan config yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status saluran

Jika gateway sehat, doctor menjalankan probe status saluran dan melaporkan
peringatan beserta perbaikan yang disarankan.

### 15) Audit config supervisor + perbaikan

Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi network-online systemd dan
delay restart). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat
menulis ulang file service/task ke default saat ini.

Catatan:

- `openclaw doctor` meminta sebelum menulis ulang config supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa config supervisor kustom.
- Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, jalur install/perbaikan service doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang sudah di-resolve ke metadata environment service supervisor.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, doctor memblokir jalur install/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak diatur, doctor memblokir install/perbaikan sampai mode diatur secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan drift token doctor sekarang mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth service.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime gateway + port

Doctor memeriksa runtime service (PID, status keluar terakhir) dan memperingatkan ketika
service terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Praktik terbaik runtime gateway

Doctor memperingatkan ketika service gateway berjalan di Bun atau pada path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Saluran WhatsApp + Telegram memerlukan Node,
dan path version manager dapat rusak setelah upgrade karena service tidak
memuat inisialisasi shell Anda. Doctor menawarkan untuk bermigrasi ke instalasi Node sistem saat
tersedia (Homebrew/apt/choco).

### 18) Penulisan config + metadata wizard

Doctor menyimpan setiap perubahan config dan memberi cap metadata wizard untuk mencatat
jalannya doctor.

### 19) Tips workspace (backup + sistem memori)

Doctor menyarankan sistem memori workspace saat belum ada dan mencetak tip backup
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan backup git (disarankan GitHub atau GitLab privat).
