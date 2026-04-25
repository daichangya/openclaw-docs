---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, channel, otomatisasi, node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-25T13:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah Gateway

Halaman ini adalah runbook mendalam.
Mulai dari [/help/troubleshooting](/id/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

## Tangga perintah

Jalankan ini terlebih dahulu, dalam urutan berikut:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinyal sehat yang diharapkan:

- `openclaw gateway status` menampilkan `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability: ...`.
- `openclaw doctor` melaporkan tidak ada masalah konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport per akun secara langsung dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 penggunaan tambahan diperlukan untuk konteks panjang

Gunakan ini ketika log/error mencakup:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Anthropic Opus/Sonnet yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi/proses model panjang yang memerlukan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke kunci API Anthropic.
3. Konfigurasikan model fallback agar proses tetap berlanjut ketika permintaan konteks panjang Anthropic ditolak.

Terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Mengapa saya melihat HTTP 429 dari Anthropic?](/id/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal kompatibel OpenAI lolos probe langsung tetapi proses agen gagal

Gunakan ini ketika:

- `curl ... /v1/models` berfungsi
- pemanggilan langsung kecil ke `/v1/chat/completions` berfungsi
- proses model OpenClaw gagal hanya pada giliran agen normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- pemanggilan langsung kecil berhasil, tetapi proses OpenClaw gagal hanya pada prompt yang lebih besar
- error backend tentang `messages[].content` yang mengharapkan string
- crash backend yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agen penuh

Tanda umum:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  menolak bagian konten Chat Completions yang terstruktur. Perbaikan: setel
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- permintaan langsung kecil berhasil, tetapi proses agen OpenClaw gagal dengan crash
  backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw
  kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
- kegagalan berkurang setelah menonaktifkan tool tetapi tidak hilang → skema tool
  merupakan bagian dari tekanan, tetapi masalah yang tersisa masih berupa keterbatasan model/server upstream atau bug backend.

Opsi perbaikan:

1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya mendukung string.
2. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani
   permukaan skema tool OpenClaw secara andal.
3. Kurangi tekanan prompt bila memungkinkan: bootstrap workspace yang lebih kecil, histori
   sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
4. Jika permintaan langsung kecil tetap berhasil sementara giliran agen OpenClaw tetap crash
   di dalam backend, anggap ini sebagai keterbatasan server/model upstream dan ajukan
   repro di sana dengan bentuk payload yang diterima.

Terkait:

- [Model lokal](/id/gateway/local-models)
- [Konfigurasi](/id/gateway/configuration)
- [Endpoint yang kompatibel dengan OpenAI](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika channel aktif tetapi tidak ada yang menjawab, periksa perutean dan kebijakan sebelum menyambungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Pairing tertunda untuk pengirim DM.
- Gating mention grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist channel/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)

## Konektivitas dashboard control ui

Ketika dashboard/control UI tidak mau terhubung, validasi asumsi URL, mode auth, dan secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode auth/token antara klien dan gateway.
- Penggunaan HTTP ketika identitas device diperlukan.

Tanda umum:

- `device identity required` → secure context tidak aman atau auth device hilang.
- `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth device berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah
  (atau timestamp usang) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token device yang di-cache.
- Percobaan ulang token cache tersebut menggunakan kembali kumpulan scope cache yang disimpan bersama
  token device yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan kumpulan scope
  yang diminta sebagai gantinya.
- Di luar jalur percobaan ulang itu, prioritas auth connect adalah
  token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token device tersimpan,
  lalu token bootstrap.
- Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk
  `{scope, ip}` yang sama diserialisasi sebelum limiter mencatat kegagalan. Karena itu, dua percobaan ulang buruk secara bersamaan dari klien yang sama dapat memunculkan `retry later`
  pada percobaan kedua alih-alih dua ketidakcocokan biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback asal browser
  → kegagalan berulang dari `Origin` yang dinormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
- `unauthorized` berulang setelah percobaan ulang itu → token bersama/token device berubah; segarkan konfigurasi token dan setujui ulang/rotasi token device jika diperlukan.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Detail code                  | Arti                                                                                                                                                                                        | Tindakan yang direkomendasikan                                                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                         | Tempel/setel token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token auth gateway.                                                                                                                                        | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token cache menggunakan kembali scope tersimpan yang disetujui; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika tetap gagal, jalankan [daftar periksa pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-device yang di-cache basi atau telah dicabut.                                                                                                                                     | Rotasi/setujui ulang token device menggunakan [devices CLI](/id/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Identitas device memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` bila ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Upgrade scope/role menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                              |

Pemeriksaan migrasi auth device v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung dan verifikasi bahwa klien tersebut:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat pada challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tak terduga:

- sesi token paired-device hanya dapat mengelola **device mereka sendiri** kecuali
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki sesi pemanggil

Terkait:

- [Control UI](/id/web/control-ui)
- [Konfigurasi](/id/gateway/configuration) (mode auth gateway)
- [Trusted proxy auth](/id/gateway/trusted-proxy-auth)
- [Akses remote](/id/gateway/remote)
- [Devices](/id/cli/devices)

## Layanan gateway tidak berjalan

Gunakan ini ketika layanan terpasang tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk keluar.
- Ketidakcocokan konfigurasi layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Tanda umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file konfigurasi tertimpa dan kehilangan `gateway.mode`. Perbaikan: setel `gateway.mode="local"` di konfigurasi Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menuliskan ulang konfigurasi mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path konfigurasi default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → ada unit launchd/systemd/schtasks yang basi atau paralel. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasikan port + konfigurasi/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [Background exec and process tool](/id/gateway/background-process)
- [Configuration](/id/gateway/configuration)
- [Doctor](/id/gateway/doctor)

## Gateway memulihkan konfigurasi last-known-good

Gunakan ini ketika Gateway mulai berjalan, tetapi log mengatakan bahwa `openclaw.json` dipulihkan.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cari:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- File `openclaw.json.clobbered.*` bertimestamp di samping konfigurasi aktif
- Peristiwa sistem agen utama yang dimulai dengan `Config recovery warning`

Apa yang terjadi:

- Konfigurasi yang ditolak tidak lolos validasi saat startup atau hot reload.
- OpenClaw mempertahankan payload yang ditolak sebagai `.clobbered.*`.
- Konfigurasi aktif dipulihkan dari salinan last-known-good terakhir yang tervalidasi.
- Giliran agen utama berikutnya diperingatkan untuk tidak menulis ulang konfigurasi yang ditolak secara membabi buta.
- Jika semua masalah validasi berada di bawah `plugins.entries.<id>...`, OpenClaw
  tidak akan memulihkan seluruh file. Kegagalan lokal Plugin tetap terdengar jelas sementara
  pengaturan pengguna lain yang tidak terkait tetap berada dalam konfigurasi aktif.

Periksa dan perbaiki:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Tanda umum:

- `.clobbered.*` ada → edit langsung eksternal atau pembacaan startup telah dipulihkan.
- `.rejected.*` ada → penulisan konfigurasi milik OpenClaw gagal pada pemeriksaan skema atau clobber sebelum commit.
- `Config write rejected:` → penulisan mencoba menghapus bentuk yang diwajibkan, mengecilkan file secara tajam, atau mempersistenkan konfigurasi yang tidak valid.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → startup memperlakukan file saat ini sebagai clobbered karena kehilangan field atau ukuran dibanding cadangan last-known-good.
- `Config last-known-good promotion skipped` → kandidat berisi placeholder secret tersamarkan seperti `***`.

Opsi perbaikan:

1. Pertahankan konfigurasi aktif yang dipulihkan jika sudah benar.
2. Salin hanya key yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
3. Jalankan `openclaw config validate` sebelum restart.
4. Jika Anda mengedit secara manual, pertahankan konfigurasi JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.

Terkait:

- [Configuration: strict validation](/id/gateway/configuration#strict-validation)
- [Configuration: hot reload](/id/gateway/configuration#config-hot-reload)
- [Config](/id/cli/config)
- [Doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini ketika `openclaw gateway probe` menjangkau sesuatu, tetapi tetap mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatan berkaitan dengan fallback SSH, beberapa gateway, scope yang hilang, atau ref auth yang tidak ter-resolve.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target terkonfigurasi/loopback langsung.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener basi/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect berhasil, tetapi detail RPC dibatasi oleh scope; pair identitas device atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway menjawab, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak ter-resolve → materi auth tidak tersedia di jalur perintah ini untuk target yang gagal.

Terkait:

- [Gateway](/id/cli/gateway)
- [Beberapa gateway pada host yang sama](/id/gateway#multiple-gateways-same-host)
- [Akses remote](/id/gateway/remote)

## Pesan channel tersambung tetapi tidak mengalir

Jika status channel tersambung tetapi alur pesan mati, fokuskan pada kebijakan, izin, dan aturan pengiriman khusus channel.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cari:

- Kebijakan DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist grup dan persyaratan mention.
- Izin/scope API channel yang hilang.

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- jejak `pairing` / persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [Pemecahan masalah channel](/id/channels/troubleshooting)
- [WhatsApp](/id/channels/whatsapp)
- [Telegram](/id/channels/telegram)
- [Discord](/id/channels/discord)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak terkirim, verifikasi status scheduler terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron diaktifkan dan next wake ada.
- Status histori proses job (`ok`, `skipped`, `error`).
- Alasan skip Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Tanda umum:

- `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati pemanggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → account id tidak valid untuk target pengiriman Heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat di-resolve ke tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) disetel ke `block`.

Terkait:

- [Scheduled tasks: troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [Scheduled tasks](/id/automation/cron-jobs)
- [Heartbeat](/id/gateway/heartbeat)

## Tool node yang dipasangkan gagal

Jika sebuah node sudah dipasangkan tetapi tool gagal, pisahkan status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kapabilitas yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan exec dan status allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [Pemecahan masalah node](/id/nodes/troubleshooting)
- [Nodes](/id/nodes/index)
- [Exec approvals](/id/tools/exec-approvals)

## Tool browser gagal

Gunakan ini ketika aksi tool browser gagal meskipun gateway itu sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cari:

- Apakah `plugins.allow` disetel dan mencakup `browser`.
- Path executable browser yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

Tanda umum:

- `unknown command "browser"` atau `unknown command 'browser'` → Plugin browser bawaan dikecualikan oleh `plugins.allow`.
- tool browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga Plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
- `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat menempel ke direktori data browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status signed-in tidak diperlukan, pilih profil terkelola `openclaw`.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime `playwright-core` milik Plugin browser bawaan; jalankan `openclaw doctor --fix`, lalu restart gateway. Snapshot ARIA dan screenshot halaman dasar tetap dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen selector CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan screenshot Chrome MCP / `existing-session` harus menggunakan tangkapan halaman atau snapshot `--ref`, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan ref snapshot, bukan selector CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `existing-session type does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:type` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP ketika timeout kustom diperlukan.
- `existing-session evaluate does not support timeoutMs overrides.` → hilangkan `timeoutMs` untuk `act:evaluate` pada profil `profile="user"` / Chrome MCP existing-session, atau gunakan profil browser terkelola/CDP ketika timeout kustom diperlukan.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang basi pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart seluruh gateway.

Terkait:

- [Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting)
- [Browser (dikelola OpenClaw)](/id/tools/browser)

## Jika Anda memperbarui dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah pembaruan adalah drift konfigurasi atau default yang kini lebih ketat sedang ditegakkan.

### 1) Perilaku override auth dan URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang perlu diperiksa:

- Jika `gateway.mode=remote`, pemanggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
- Pemanggilan `--url` eksplisit tidak fallback ke kredensial yang tersimpan.

Tanda umum:

- `gateway connect failed:` → target URL salah.
- `unauthorized` → endpoint dapat dijangkau tetapi auth salah.

### 2) Guardrail bind dan auth lebih ketat

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Yang perlu diperiksa:

- Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth gateway yang valid: auth token/password bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
- Key lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Tanda umum:

- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid.
- `Connectivity probe: failed` sementara runtime sedang berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

### 3) Status pairing dan identitas device berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang perlu diperiksa:

- Persetujuan device tertunda untuk dashboard/node.
- Persetujuan DM pairing tertunda setelah perubahan kebijakan atau identitas.

Tanda umum:

- `device identity required` → auth device tidak terpenuhi.
- `pairing required` → pengirim/device harus disetujui.

Jika konfigurasi layanan dan runtime masih tidak cocok setelah pemeriksaan, pasang ulang metadata layanan dari profil/direktori status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [Pairing milik Gateway](/id/gateway/pairing)
- [Authentication](/id/gateway/authentication)
- [Background exec and process tool](/id/gateway/background-process)

## Terkait

- [Runbook Gateway](/id/gateway)
- [Doctor](/id/gateway/doctor)
- [FAQ](/id/help/faq)
