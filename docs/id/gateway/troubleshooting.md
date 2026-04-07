---
read_when:
    - Hub pemecahan masalah mengarahkan Anda ke sini untuk diagnosis yang lebih mendalam
    - Anda memerlukan bagian runbook berbasis gejala yang stabil dengan perintah yang tepat
summary: Runbook pemecahan masalah mendalam untuk gateway, saluran, otomatisasi, node, dan browser
title: Pemecahan masalah
x-i18n:
    generated_at: "2026-04-07T09:15:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0202e8858310a0bfc1c994cd37b01c3b2d6c73c8a74740094e92dc3c4c36729
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah gateway

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

- `openclaw gateway status` menampilkan `Runtime: running` dan `RPC probe: ok`.
- `openclaw doctor` melaporkan tidak ada masalah config/service yang memblokir.
- `openclaw channels status --probe` menampilkan status transport per akun yang aktif dan,
  jika didukung, hasil probe/audit seperti `works` atau `audit ok`.

## Anthropic 429 extra usage required for long context

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
- Permintaan gagal hanya pada sesi/proses model panjang yang memerlukan jalur beta 1M.

Opsi perbaikan:

1. Nonaktifkan `context1m` untuk model tersebut agar kembali ke jendela konteks normal.
2. Gunakan kredensial Anthropic yang memenuhi syarat untuk permintaan konteks panjang, atau beralih ke API key Anthropic.
3. Konfigurasikan model fallback agar proses tetap berjalan ketika permintaan konteks panjang Anthropic ditolak.

Terkait:

- [/providers/anthropic](/id/providers/anthropic)
- [/reference/token-use](/id/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/id/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Tidak ada balasan

Jika saluran aktif tetapi tidak ada yang membalas, periksa perutean dan kebijakan sebelum menyambungkan ulang apa pun.

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
- Ketidakcocokan allowlist saluran/grup.

Tanda umum:

- `drop guild message (mention required` → pesan grup diabaikan sampai ada mention.
- `pairing request` → pengirim memerlukan persetujuan.
- `blocked` / `allowlist` → pengirim/saluran difilter oleh kebijakan.

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

- URL probe dan URL dashboard yang benar.
- Ketidakcocokan mode auth/token antara klien dan gateway.
- Penggunaan HTTP ketika identitas perangkat diperlukan.

Tanda umum:

- `device identity required` → non-secure context atau auth perangkat tidak ada.
- `origin not allowed` → `Origin` browser tidak ada di `gateway.controlUi.allowedOrigins`
  (atau Anda terhubung dari origin browser non-loopback tanpa
  allowlist eksplisit).
- `device nonce required` / `device nonce mismatch` → klien tidak menyelesaikan
  alur auth perangkat berbasis challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klien menandatangani payload yang salah
  (atau timestamp lama) untuk handshake saat ini.
- `AUTH_TOKEN_MISMATCH` dengan `canRetryWithDeviceToken=true` → klien dapat melakukan satu percobaan ulang tepercaya dengan token perangkat yang di-cache.
- Percobaan ulang token-cache itu menggunakan kembali kumpulan scope cache yang disimpan bersama
  token perangkat yang telah dipairing. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap memakai
  kumpulan scope yang mereka minta.
- Di jalur async Tailscale Serve Control UI, percobaan yang gagal untuk
  `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan. Oleh karena itu, dua percobaan ulang buruk yang berjalan bersamaan dari klien yang sama dapat memunculkan `retry later`
  pada percobaan kedua alih-alih dua ketidakcocokan biasa.
- `too many failed authentication attempts (retry later)` dari klien loopback browser-origin
  → kegagalan berulang dari `Origin` ternormalisasi yang sama
  dikunci sementara; origin localhost lain memakai bucket terpisah.
- `unauthorized` berulang setelah percobaan ulang itu → drift token bersama/token perangkat; segarkan config token dan setujui ulang/rotasi token perangkat bila perlu.
- `gateway connect failed:` → target host/port/url salah.

### Peta cepat kode detail auth

Gunakan `error.details.code` dari respons `connect` yang gagal untuk menentukan tindakan berikutnya:

| Kode detail                | Arti                                                     | Tindakan yang direkomendasikan                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`       | Klien tidak mengirim token bersama yang diperlukan.      | Tempel/setel token di klien lalu coba lagi. Untuk jalur dashboard: `openclaw config get gateway.auth.token` lalu tempel ke pengaturan Control UI.                                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`      | Token bersama tidak cocok dengan token auth gateway.     | Jika `canRetryWithDeviceToken=true`, izinkan satu percobaan ulang tepercaya. Percobaan ulang token-cache menggunakan kembali scope tersimpan yang telah disetujui; pemanggil `deviceToken` / `scopes` eksplisit mempertahankan scope yang diminta. Jika masih gagal, jalankan [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token per-perangkat yang di-cache sudah lama atau dicabut. | Rotasi/setujui ulang token perangkat menggunakan [devices CLI](/cli/devices), lalu hubungkan kembali.                                                                                                                                                                                 |
| `PAIRING_REQUIRED`         | Identitas perangkat dikenal tetapi belum disetujui untuk peran ini. | Setujui permintaan tertunda: `openclaw devices list` lalu `openclaw devices approve <requestId>`.                                                                                                                                                                                     |

Pemeriksaan migrasi auth perangkat v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jika log menampilkan error nonce/tanda tangan, perbarui klien yang terhubung dan verifikasi bahwa klien:

1. menunggu `connect.challenge`
2. menandatangani payload yang terikat ke challenge
3. mengirim `connect.params.device.nonce` dengan nonce challenge yang sama

Jika `openclaw devices rotate` / `revoke` / `remove` ditolak secara tidak terduga:

- sesi token perangkat yang dipairing hanya dapat mengelola **perangkat mereka sendiri** kecuali
  pemanggil juga memiliki `operator.admin`
- `openclaw devices rotate --scope ...` hanya dapat meminta scope operator yang
  sudah dimiliki oleh sesi pemanggil

Terkait:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/id/gateway/configuration) (mode auth gateway)
- [/gateway/trusted-proxy-auth](/id/gateway/trusted-proxy-auth)
- [/gateway/remote](/id/gateway/remote)
- [/cli/devices](/cli/devices)

## Layanan gateway tidak berjalan

Gunakan ini saat layanan terinstal tetapi proses tidak tetap berjalan.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # juga memindai layanan tingkat sistem
```

Cari:

- `Runtime: stopped` dengan petunjuk exit.
- Ketidakcocokan config layanan (`Config (cli)` vs `Config (service)`).
- Konflik port/listener.
- Instalasi launchd/systemd/schtasks tambahan saat `--deep` digunakan.
- Petunjuk pembersihan `Other gateway-like services detected (best effort)`.

Tanda umum:

- `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway lokal belum diaktifkan, atau file config tertimpa dan kehilangan `gateway.mode`. Perbaikan: setel `gateway.mode="local"` di config Anda, atau jalankan kembali `openclaw onboard --mode local` / `openclaw setup` untuk menulis ulang config mode lokal yang diharapkan. Jika Anda menjalankan OpenClaw melalui Podman, path config default adalah `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
- `another gateway instance is already listening` / `EADDRINUSE` → konflik port.
- `Other gateway-like services detected (best effort)` → unit launchd/systemd/schtasks yang lama atau paralel masih ada. Sebagian besar penyiapan sebaiknya hanya memiliki satu gateway per mesin; jika Anda memang membutuhkan lebih dari satu, isolasikan port + config/state/workspace. Lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

Terkait:

- [/gateway/background-process](/id/gateway/background-process)
- [/gateway/configuration](/id/gateway/configuration)
- [/gateway/doctor](/id/gateway/doctor)

## Peringatan probe gateway

Gunakan ini saat `openclaw gateway probe` mencapai sesuatu, tetapi tetap menampilkan blok peringatan.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cari:

- `warnings[].code` dan `primaryTargetId` di output JSON.
- Apakah peringatannya tentang fallback SSH, beberapa gateway, scope hilang, atau auth ref yang tidak terselesaikan.

Tanda umum:

- `SSH tunnel failed to start; falling back to direct probes.` → penyiapan SSH gagal, tetapi perintah tetap mencoba target terkonfigurasi/loopback langsung.
- `multiple reachable gateways detected` → lebih dari satu target merespons. Biasanya ini berarti penyiapan multi-gateway yang disengaja atau listener lama/duplikat.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → koneksi berhasil, tetapi detail RPC dibatasi scope; pairing identitas perangkat atau gunakan kredensial dengan `operator.read`.
- teks peringatan SecretRef `gateway.auth.*` / `gateway.remote.*` yang tidak terselesaikan → materi auth tidak tersedia pada jalur perintah ini untuk target yang gagal.

Terkait:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host)
- [/gateway/remote](/id/gateway/remote)

## Saluran terhubung tetapi pesan tidak mengalir

Jika status saluran terhubung tetapi aliran pesan mati, fokus pada kebijakan, izin, dan aturan pengiriman khusus saluran.

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
- Izin/scope API saluran yang hilang.

Tanda umum:

- `mention required` → pesan diabaikan oleh kebijakan mention grup.
- `pairing` / jejak persetujuan tertunda → pengirim belum disetujui.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → masalah auth/izin saluran.

Terkait:

- [/channels/troubleshooting](/id/channels/troubleshooting)
- [/channels/whatsapp](/id/channels/whatsapp)
- [/channels/telegram](/id/channels/telegram)
- [/channels/discord](/id/channels/discord)

## Pengiriman cron dan heartbeat

Jika cron atau heartbeat tidak berjalan atau tidak terkirim, verifikasi dulu state scheduler, lalu target pengiriman.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cari:

- Cron diaktifkan dan waktu bangun berikutnya tersedia.
- Status riwayat proses job (`ok`, `skipped`, `error`).
- Alasan heartbeat dilewati (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Tanda umum:

- `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
- `cron: timer tick failed` → tick scheduler gagal; periksa error file/log/runtime.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jendela jam aktif.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi baris kosong / heading markdown, sehingga OpenClaw melewati panggilan model.
- `heartbeat skipped` dengan `reason=no-tasks-due` → `HEARTBEAT.md` berisi blok `tasks:`, tetapi tidak ada tugas yang jatuh tempo pada tick ini.
- `heartbeat: unknown accountId` → id akun tidak valid untuk target pengiriman heartbeat.
- `heartbeat skipped` dengan `reason=dm-blocked` → target heartbeat terurai menjadi tujuan bergaya DM sementara `agents.defaults.heartbeat.directPolicy` (atau override per agen) disetel ke `block`.

Terkait:

- [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/id/automation/cron-jobs)
- [/gateway/heartbeat](/id/gateway/heartbeat)

## Tool node yang dipairing gagal

Jika node sudah dipairing tetapi tool gagal, isolasikan state foreground, izin, dan persetujuan.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cari:

- Node online dengan kapabilitas yang diharapkan.
- Pemberian izin OS untuk camera/mic/location/screen.
- Persetujuan exec dan state allowlist.

Tanda umum:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi node harus berada di foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → izin OS belum diberikan.
- `SYSTEM_RUN_DENIED: approval required` → persetujuan exec tertunda.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh allowlist.

Terkait:

- [/nodes/troubleshooting](/id/nodes/troubleshooting)
- [/nodes/index](/id/nodes/index)
- [/tools/exec-approvals](/id/tools/exec-approvals)

## Tool browser gagal

Gunakan ini saat aksi tool browser gagal meskipun gateway sendiri sehat.

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

- `unknown command "browser"` atau `unknown command 'browser'` → plugin browser bawaan dikecualikan oleh `plugins.allow`.
- tool browser hilang / tidak tersedia saat `browser.enabled=true` → `plugins.allow` mengecualikan `browser`, sehingga plugin tidak pernah dimuat.
- `Failed to start Chrome CDP on port` → proses browser gagal diluncurkan.
- `browser.executablePath not found` → path yang dikonfigurasi tidak valid.
- `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung seperti `file:` atau `ftp:`.
- `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
- `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
- `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host gateway.
- `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target yang dapat dijangkau, atau endpoint HTTP merespons tetapi CDP WebSocket tetap tidak dapat dibuka.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → instalasi gateway saat ini tidak memiliki paket Playwright penuh; snapshot ARIA dan screenshot halaman dasar tetap dapat berfungsi, tetapi navigasi, snapshot AI, screenshot elemen dengan selector CSS, dan ekspor PDF tetap tidak tersedia.
- `fullPage is not supported for element screenshots` → permintaan screenshot mencampurkan `--full-page` dengan `--ref` atau `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → panggilan screenshot Chrome MCP / `existing-session` harus menggunakan penangkapan halaman atau `--ref` dari snapshot, bukan CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook upload Chrome MCP memerlukan snapshot ref, bukan selector CSS.
- `existing-session file uploads currently support one file at a time.` → kirim satu upload per panggilan pada profil Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hook dialog pada profil Chrome MCP tidak mendukung override timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` masih memerlukan browser terkelola atau profil CDP mentah.
- override viewport / dark-mode / locale / offline yang lama pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan state emulasi Playwright/CDP tanpa me-restart seluruh gateway.

Terkait:

- [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
- [/tools/browser](/id/tools/browser)

## Jika Anda melakukan upgrade dan sesuatu tiba-tiba rusak

Sebagian besar kerusakan setelah upgrade adalah drift config atau default yang lebih ketat kini diberlakukan.

### 1) Perilaku override auth dan URL berubah

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Yang perlu diperiksa:

- Jika `gateway.mode=remote`, panggilan CLI mungkin menargetkan remote sementara layanan lokal Anda baik-baik saja.
- Panggilan `--url` eksplisit tidak fallback ke kredensial tersimpan.

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
- `RPC probe: failed` sementara runtime berjalan → gateway hidup tetapi tidak dapat diakses dengan auth/url saat ini.

### 3) State pairing dan identitas perangkat berubah

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Yang perlu diperiksa:

- Persetujuan perangkat tertunda untuk dashboard/node.
- Persetujuan pairing DM tertunda setelah perubahan kebijakan atau identitas.

Tanda umum:

- `device identity required` → auth perangkat tidak terpenuhi.
- `pairing required` → pengirim/perangkat harus disetujui.

Jika config layanan dan runtime masih tidak cocok setelah pemeriksaan, instal ulang metadata layanan dari direktori profile/state yang sama:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Terkait:

- [/gateway/pairing](/id/gateway/pairing)
- [/gateway/authentication](/id/gateway/authentication)
- [/gateway/background-process](/id/gateway/background-process)
