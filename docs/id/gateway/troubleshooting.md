---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook troubleshooting mendalam untuk Gateway, channel, otomasi, Node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-21T09:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
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
- `openclaw doctor` melaporkan tidak ada masalah config/layanan yang memblokir.
- `openclaw channels status --probe` menampilkan status transport live per-akun dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 membutuhkan penggunaan tambahan untuk konteks panjang

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
- Permintaan gagal hanya pada sesi/jalankan model panjang yang membutuhkan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke kunci API Anthropic.
3. Konfigurasikan model fallback agar run tetap berlanjut saat permintaan konteks panjang Anthropic ditolak.

Terkait:

- [/providers/anthropic](/id/providers/anthropic)
- [/reference/token-use](/id/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/id/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend lokal kompatibel OpenAI lolos probe langsung tetapi run agent gagal

Gunakan ini saat:

- `curl ... /v1/models` berfungsi
- panggilan langsung `/v1/chat/completions` kecil berfungsi
- run model OpenClaw gagal hanya pada giliran agent normal

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
- crash backend yang hanya muncul dengan jumlah token prompt lebih besar atau prompt runtime
  agent penuh

Tanda umum:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  menolak bagian konten Chat Completions terstruktur. Perbaikan: setel
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- permintaan langsung kecil berhasil, tetapi run agent OpenClaw gagal dengan crash
  backend/model (misalnya Gemma pada beberapa build `inferrs`) → transport OpenClaw
  kemungkinan sudah benar; backend gagal pada bentuk prompt runtime agent yang lebih besar.
- kegagalan berkurang setelah menonaktifkan tools tetapi tidak hilang → skema tool adalah
  bagian dari tekanannya, tetapi masalah yang tersisa tetap merupakan keterbatasan model/server upstream
  atau bug backend.

Opsi perbaikan:

1. Setel `compat.requiresStringContent: true` untuk backend Chat Completions khusus string.
2. Setel `compat.supportsTools: false` untuk model/backend yang tidak dapat menangani
   surface skema tool OpenClaw dengan andal.
3. Kurangi tekanan prompt jika memungkinkan: bootstrap workspace yang lebih kecil, riwayat
   sesi yang lebih pendek, model lokal yang lebih ringan, atau backend dengan dukungan konteks panjang
   yang lebih kuat.
4. Jika permintaan langsung kecil tetap berhasil sementara giliran agent OpenClaw masih crash
   di dalam backend, anggap ini sebagai keterbatasan server/model upstream dan kirim
   repro ke sana dengan bentuk payload yang diterima.

Terkait:

- [/gateway/local-models](/id/gateway/local-models)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/id/gateway/configuration-reference#openai-compatible-endpoints)

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
- `pairing request` → pengirim perlu persetujuan.
- `blocked` / `allowlist` → pengirim/channel difilter oleh kebijakan.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/pairing](/id/channels/pairing)
- [/channels/groups](/id/channels/groups)

## Konektivitas ui kontrol Dashboard

Saat UI dashboard/control tidak mau terhubung, validasi asumsi URL, mode auth, dan secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cari:

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode auth/token antara klien dan Gateway.
- Penggunaan HTTP saat identitas perangkat diperlukan.

Tanda umum:

- `device identity required` → non-secure context atau auth perangkat hilang.
- `origin not allowed` → browser `Origin` tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload
  yang salah (atau timestamp usang) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu retry tepercaya dengan token perangkat cache.
- Retry token cache itu menggunakan kembali set scope cache yang disimpan bersama token perangkat berpasangan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan set scope yang diminta.
- Di jalur async Tailscale Serve Control UI, percobaan gagal untuk `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Dua retry bersamaan yang buruk dari klien yang sama karena itu dapat memunculkan `retry later`
  pada percobaan kedua alih-alih dua ketidakcocokan biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback origin-browser → kegagalan berulang dari `Origin` ternormalisasi yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
- `repeated unauthorized` setelah retry itu → drift token bersama/perangkat; segarkan config token dan setujui ulang/rotasi token perangkat bila perlu.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk memilih tindakan berikutnya:

| Kode detail                  | Arti                                                                                                                                                                                     | Tindakan yang direkomendasikan                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Klien tidak mengirim token bersama yang diperlukan.                                                                                                                                      | Tempel/setel token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Token bersama tidak cocok dengan token auth gateway.                                                                                                                                     | Jika `canRetryWithDeviceToken=true`, izinkan satu retry tepercaya. Retry token cache menggunakan kembali scope tersimpan yang disetujui; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [checklist pemulihan drift token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat cache sudah usang atau dicabut.                                                                                                                                      | Rotasi/setujui ulang token perangkat menggunakan [devices CLI](/cli/devices), lalu sambungkan kembali.                                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | Identitas perangkat memerlukan persetujuan. Periksa `error.details.reason` untuk `not-paired`, `scope-upgrade`, `role-upgrade`, atau `metadata-upgrade`, dan gunakan `requestId` / `remediationHint` jika ada. | Setujui permintaan yang tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`. Upgrade scope/peran menggunakan alur yang sama setelah Anda meninjau akses yang diminta.                                                                                      |

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/signature, perbarui klien yang terhubung dan verifikasi bahwa klien:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tak terduga:

- sesi token perangkat berpasangan hanya dapat mengelola **perangkat milik mereka sendiri** kecuali pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki sesi pemanggil

Terkait:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode auth gateway)
- [/gateway/trusted-proxy-auth](/id/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/cli/devices)

## Layanan Gateway tidak berjalan

Gunakan ini saat layanan terinstal tetapi proses tidak tetap aktif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga memindai layanan level sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan config layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Tanda umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal tidak diaktifkan, atau file config tertimpa dan kehilangan `gateway.mode`. Perbaikan: setel `gateway.mode="local"` di config Anda, atau jalankan ulang `openclaw onboard --mode local` / `openclaw setup` untuk menulis ulang config mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path config default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang usang atau paralel masih ada. Sebagian besar penyiapan sebaiknya hanya mempertahankan satu gateway per mesin; jika Anda memang memerlukan lebih dari satu, pisahkan port + config/status/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Gateway memulihkan config last-known-good

Gunakan ini saat Gateway mulai berjalan, tetapi log mengatakan bahwa `openclaw.json` dipulihkan.

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
- Event sistem main-agent yang dimulai dengan `Config recovery warning`

Yang terjadi:

- Config yang ditolak tidak lolos validasi saat startup atau hot reload.
- OpenClaw menyimpan payload yang ditolak sebagai `.clobbered.*`.
- Config aktif dipulihkan dari salinan last-known-good terakhir yang tervalidasi.
- Giliran main-agent berikutnya diperingatkan agar tidak menulis ulang config yang ditolak secara membabi buta.

Periksa dan perbaiki:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Tanda umum:

- `.clobbered.*` ada → edit langsung eksternal atau pembacaan startup dipulihkan.
- `.rejected.*` ada → penulisan config milik OpenClaw gagal pada pemeriksaan schema atau clobber sebelum commit.
- `Config write rejected:` → penulisan mencoba menghapus shape yang diperlukan, menyusutkan file secara tajam, atau menyimpan config yang tidak valid.
- `Config last-known-good promotion skipped` → kandidat berisi placeholder secret yang sudah disamarkan seperti `***`.

Opsi perbaikan:

1. Pertahankan config aktif yang dipulihkan jika sudah benar.
2. Salin hanya kunci yang dimaksud dari `.clobbered.*` atau `.rejected.*`, lalu terapkan dengan `openclaw config set` atau `config.patch`.
3. Jalankan `openclaw config validate` sebelum restart.
4. Jika Anda mengedit secara manual, pertahankan config JSON5 lengkap, bukan hanya objek parsial yang ingin Anda ubah.

Terkait:

- [/gateway/configuration#strict-validation](/id/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/id/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe Gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi tetap mencetak blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` di output JSON.
- Apakah peringatan tersebut tentang fallback SSH, beberapa gateway, scope yang hilang, atau auth ref yang tidak terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target langsung yang dikonfigurasi/loopback.
- `multiple reachable gateways detected` → lebih dari satu target merespons. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener usang/ganda.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi detail RPC dibatasi oleh scope; pasangkan identitas perangkat atau gunakan kredensial dengan `operator.read`.
- `Capability: pairing-pending` atau `gateway closed (1008): pairing required` → gateway merespons, tetapi klien ini masih memerlukan pairing/persetujuan sebelum akses operator normal.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terselesaikan → materi auth tidak tersedia pada jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Channel terhubung tetapi pesan tidak mengalir

Jika status channel terhubung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus channel.

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

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/whatsapp](/id/channels/whatsapp)
- [/channels/telegram](/id/channels/telegram)
- [/channels/discord](/id/channels/discord)

## Pengiriman Cron dan Heartbeat

Jika Cron atau Heartbeat tidak berjalan atau tidak terkirim, verifikasi dulu status scheduler, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron aktif dan waktu bangun berikutnya ada.
- Status riwayat run job (`ok`, `skipped`, `error`).
- Alasan skip Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Tanda umum:

- `cron: scheduler disabled; jobs will not run automatically` → Cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati panggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → account id tidak valid untuk target pengiriman Heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target Heartbeat terurai menjadi tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per-agent) disetel ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Tool Node yang dipasangkan gagal

Jika sebuah Node sudah dipasangkan tetapi tool gagal, isolasikan status foreground, izin, dan persetujuan.

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
- Status persetujuan exec dan allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → app Node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS belum ada.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/id/nodes/troubleshooting)
- [/nodes/index](/id/nodes/index)
- [/tools/exec-approvals](/id/tools/exec-approvals)

## Tool browser gagal

Gunakan ini saat aksi tool browser gagal meskipun gateway itu sendiri sehat.

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
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session belum dapat melekat ke data dir browser yang dipilih. Buka halaman inspect browser, aktifkan remote debugging, biarkan browser tetap terbuka, setujui prompt attach pertama, lalu coba lagi. Jika status sign-in tidak diperlukan, pilih profil terkelola `openclaw`.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP menjawab tetapi WebSocket CDP tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki paket Playwright lengkap; snapshot ARIA dan screenshot halaman dasar masih dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen selector CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampur `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → pemanggilan screenshot Chrome MCP / `existing-session` harus menggunakan tangkapan halaman atau `--ref` dari snapshot, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan ref snapshot, bukan selector CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang usang pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi Playwright/CDP tanpa me-restart seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
- [/tools/browser](/id/tools/browser)

## Jika Anda melakukan upgrade dan tiba-tiba ada yang rusak

Sebagian besar kerusakan setelah upgrade adalah drift config atau default yang lebih ketat yang kini diberlakukan.

### 1) Perilaku override auth dan URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang perlu diperiksa:

- Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
- Panggilan `--url` eksplisit tidak fallback ke kredensial yang tersimpan.

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
- Kunci lama seperti `gateway.token` tidak menggantikan `gateway.auth.token`.

Tanda umum:

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

- Persetujuan perangkat tertunda untuk dashboard/nodes.
- Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

Tanda umum:

- `device identity required` → auth perangkat belum terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika config layanan dan runtime masih tidak selaras setelah pemeriksaan, instal ulang metadata layanan dari direktori profil/status yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)
