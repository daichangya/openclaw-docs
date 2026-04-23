---
read_when:
    - Pusat pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, channel, otomasi, Node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-23T09:21:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah Gateway

Halaman ini adalah runbook mendalam.
Mulai di [/help/troubleshooting](/id/help/troubleshooting) jika Anda ingin alur triase cepat terlebih dahulu.

## Tangga perintah

Jalankan ini terlebih dahulu, dalam urutan ini:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinyal sehat yang diharapkan:

- `openclaw gateway status` menampilkan `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability: ...`.
- `openclaw doctor` melaporkan tidak ada masalah config/service yang memblokir.
- `openclaw channels status --probe` menampilkan status transport live per-akun dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 ekstra penggunaan diperlukan untuk konteks panjang

Gunakan ini saat log/error mencakup:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cari:

- Model Anthropic Opus/Sonnet yang dipilih memiliki `params.context1m: true`.
- Kredensial Anthropic saat ini tidak memenuhi syarat untuk penggunaan konteks panjang.
- Permintaan gagal hanya pada sesi panjang/run model yang memerlukan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar fallback ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke API key Anthropic.
3. Konfigurasikan model fallback agar run tetap berlanjut saat permintaan konteks panjang Anthropic ditolak.

Terkait:

- [/providers/anthropic](/id/providers/anthropic)
- [/reference/token-use](/id/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/id/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal yang kompatibel dengan OpenAI lolos direct probe tetapi run agen gagal

Gunakan ini saat:

- `curl ... /v1/models` berfungsi
- panggilan `/v1/chat/completions` langsung yang kecil berfungsi
- run model OpenClaw gagal hanya pada giliran agen normal

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cari:

- panggilan langsung kecil berhasil, tetapi run OpenClaw gagal hanya pada prompt yang lebih besar
- error backend tentang `messages[].content` yang mengharapkan string
- crash backend yang hanya muncul dengan jumlah token prompt yang lebih besar atau prompt runtime agen penuh

Signature umum:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  menolak bagian konten Chat Completions terstruktur. Perbaikan: setel
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- permintaan langsung kecil berhasil, tetapi run agen OpenClaw gagal dengan crash backend/model
  (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw
  kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agen yang lebih besar.
- kegagalan berkurang setelah menonaktifkan alat tetapi tidak hilang → schema alat adalah
  bagian dari tekanannya, tetapi masalah yang tersisa masih merupakan kapasitas model/server upstream atau bug backend.

Opsi perbaikan:

1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions yang hanya mendukung string.
2. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani
   surface schema alat OpenClaw secara andal.
3. Turunkan tekanan prompt jika memungkinkan: bootstrap workspace yang lebih kecil, riwayat
   sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang yang lebih kuat.
4. Jika permintaan langsung kecil terus berhasil sementara giliran agen OpenClaw masih crash
   di dalam backend, perlakukan ini sebagai keterbatasan server/model upstream dan ajukan
   repro di sana dengan bentuk payload yang diterima.

Terkait:

- [/gateway/local-models](/id/gateway/local-models)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/id/gateway/configuration-reference#openai-compatible-endpoints)

## Tidak ada balasan

Jika channel aktif tetapi tidak ada yang menjawab, periksa routing dan kebijakan sebelum menyambungkan ulang apa pun.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cari:

- Pairing tertunda untuk pengirim DM.
- Pembatasan mention grup (`requireMention`, `mentionPatterns`).
- Ketidakcocokan allowlist channel/grup.

Signature umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/pairing](/id/channels/pairing)
- [/channels/groups](/id/channels/groups)

## Konektivitas dashboard control ui

Saat dashboard/control UI tidak dapat terhubung, validasi URL, mode auth, dan asumsi secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- Probe URL dan dashboard URL yang benar.
- Ketidakcocokan mode/token auth antara klien dan gateway.
- Penggunaan HTTP saat identitas perangkat diperlukan.

Signature umum:

- `device identity required` → konteks tidak aman atau auth perangkat hilang.
- `origin not allowed` → browser `Origin` tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah
  (atau timestamp usang) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu retry tepercaya dengan token perangkat yang di-cache.
- Retry token-cache tersebut menggunakan kembali kumpulan scope cache yang disimpan bersama
  token perangkat yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan
  kumpulan scope yang diminta.
- Di luar jalur retry itu, prioritas auth koneksi adalah
  token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan,
  lalu token bootstrap.
- Pada jalur async Tailscale Serve Control UI, percobaan gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Dua retry bersamaan yang salah dari klien yang sama karena itu dapat menampilkan `retry later`
  pada percobaan kedua alih-alih dua mismatch biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback asal browser
  → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
- `unauthorized` berulang setelah retry itu → drift token bersama/token perangkat; segarkan config token dan setujui ulang/rotasi token perangkat jika diperlukan.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Makna                                                                                                                                                                                      | Tindakan yang disarankan                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diwajibkan.                                                                                                                                        | Tempel/setel token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token auth gateway.                                                                                                                                       | Jika `canRetryWithDeviceToken=true`, izinkan satu retry tepercaya. Retry token-cache menggunakan kembali scope yang telah disetujui dan tersimpan; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [checklist pemulihan drift token](/id/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat cache sudah usang atau dicabut.                                                                                                                                        | Rotasi/setujui ulang token perangkat menggunakan [CLI devices](/id/cli/devices), lalu hubungkan kembali.                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Upgrade scope/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                             |

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung dan verifikasi bahwa klien:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat ke challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tak terduga:

- sesi token perangkat yang dipasangkan hanya dapat mengelola **perangkatnya sendiri** kecuali
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki sesi pemanggil

Terkait:

- [/web/control-ui](/id/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode auth gateway)
- [/gateway/trusted-proxy-auth](/id/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/id/cli/devices)

## Layanan gateway tidak berjalan

Gunakan ini saat layanan terinstal tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga pindai layanan level sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan config layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Signature umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file config tertimpa dan kehilangan `gateway.mode`. Perbaikan: setel `gateway.mode="local"` di config Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menulis ulang config mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path config default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/kata sandi, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks usang atau paralel ada. Sebagian besar penyiapan sebaiknya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, isolasikan port + config/state/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Gateway memulihkan config terakhir-yang-diketahui-baik

Gunakan ini saat Gateway mulai, tetapi log mengatakan bahwa ia memulihkan `openclaw.json`.

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
- File `openclaw.json.clobbered.*` bertimestamp di samping config aktif
- Event sistem agen utama yang dimulai dengan `Config recovery warning`

Yang terjadi:

- Config yang ditolak tidak lolos validasi selama startup atau hot reload.
- OpenClaw mempertahankan payload yang ditolak sebagai `.clobbered.*`.
- Config aktif dipulihkan dari salinan terakhir-yang-diketahui-baik yang terakhir tervalidasi.
- Giliran agen utama berikutnya diperingatkan untuk tidak menulis ulang config yang ditolak secara membabi buta.

Periksa dan perbaiki:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Signature umum:

- `.clobbered.*` ada → edit langsung eksternal atau pembacaan startup dipulihkan.
- `.rejected.*` ada → penulisan config milik OpenClaw gagal dalam pemeriksaan schema atau clobber sebelum commit.
- `Config write rejected:` → penulisan mencoba menghapus bentuk yang diwajibkan, mengecilkan file secara tajam, atau menyimpan config yang tidak valid.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, atau `size-drop-vs-last-good:*` → startup memperlakukan file saat ini sebagai clobbered karena kehilangan field atau ukuran dibanding cadangan terakhir-yang-diketahui-baik.
- `Config last-known-good promotion skipped` → kandidat berisi placeholder rahasia yang telah disamarkan seperti `***`.

Opsi perbaikan:

1. Pertahankan config aktif yang dipulihkan jika itu sudah benar.
2. Salin hanya key yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
3. Jalankan `openclaw config validate` sebelum restart.
4. Jika Anda mengedit dengan tangan, pertahankan config JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.

Terkait:

- [/gateway/configuration#strict-validation](/id/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/id/gateway/configuration#config-hot-reload)
- [/cli/config](/id/cli/config)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi tetap mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` dalam output JSON.
- Apakah peringatan tersebut tentang fallback SSH, beberapa gateway, scope yang hilang, atau ref auth yang tidak dapat di-resolve.

Signature umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateways detected` → lebih dari satu target menjawab. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener usang/duplikat.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi RPC detail dibatasi oleh scope; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway menjawab, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak dapat di-resolve → materi auth tidak tersedia dalam jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/id/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Channel terhubung tetapi pesan tidak mengalir

Jika status channel terhubung tetapi alur pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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

Signature umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- jejak `pairing` / persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin channel.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/whatsapp](/id/channels/whatsapp)
- [/channels/telegram](/id/channels/telegram)
- [/channels/discord](/id/channels/discord)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak mengirim, verifikasi status scheduler terlebih dahulu, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron diaktifkan dan wake berikutnya ada.
- Status riwayat run pekerjaan (`ok`, `skipped`, `error`).
- Alasan skip Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signature umum:

- `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati pemanggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman Heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat di-resolve ke tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per-agen) disetel ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Alat Node berpasangan gagal

Jika sebuah Node sudah dipasangkan tetapi alat gagal, isolasikan status foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan capability yang diharapkan.
- Pemberian izin OS untuk kamera/mikrofon/lokasi/layar.
- Persetujuan exec dan status allowlist.

Signature umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi Node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS hilang.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/id/nodes/troubleshooting)
- [/nodes/index](/id/nodes/index)
- [/tools/exec-approvals](/id/tools/exec-approvals)

## Alat browser gagal

Gunakan ini saat aksi alat browser gagal meskipun gateway sendiri sehat.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cari:

- Apakah `plugins.allow` disetel dan menyertakan `browser`.
- Path executable browser yang valid.
- Keterjangkauan profil CDP.
- Ketersediaan Chrome lokal untuk profil `existing-session` / `user`.

Signature umum:

- `unknown command "browser"` atau `unknown command 'browser'` → plugin browser bawaan dikecualikan oleh `plugins.allow`.
- alat browser hilang / tidak tersedia sementara `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
- `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP belum dapat melampir ke data dir browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status signed-in tidak diperlukan, pilih profil `openclaw` terkelola.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki dependensi runtime `playwright-core` milik plugin browser bawaan; jalankan `openclaw doctor --fix`, lalu restart gateway. Snapshot ARIA dan screenshot halaman dasar tetap dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen dengan pemilih CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan screenshot Chrome MCP / `existing-session` harus menggunakan penangkapan halaman atau snapshot `--ref`, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan ref snapshot, bukan pemilih CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu upload per pemanggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / mode gelap / lokal / offline yang usang pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
- [/tools/browser](/id/tools/browser)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan pasca-upgrade adalah drift config atau default yang lebih ketat yang kini diberlakukan.

### 1) Perilaku override auth dan URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang perlu diperiksa:

- Jika `gateway.mode=remote`, pemanggilan CLI mungkin menargetkan remote sementara service lokal Anda baik-baik saja.
- Pemanggilan `--url` eksplisit tidak fallback ke kredensial yang tersimpan.

Signature umum:

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

- Bind non-loopback (`lan`, `tailnet`, `custom`) memerlukan jalur auth gateway yang valid: auth token/kata sandi bersama, atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar.
- Key lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Signature umum:

- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid.
- `Connectivity probe: failed` saat runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

### 3) Status pairing dan identitas perangkat berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang perlu diperiksa:

- Persetujuan perangkat tertunda untuk dashboard/Node.
- Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

Signature umum:

- `device identity required` → auth perangkat belum terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika config service dan runtime masih tidak cocok setelah pemeriksaan, instal ulang metadata service dari direktori profil/status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)
