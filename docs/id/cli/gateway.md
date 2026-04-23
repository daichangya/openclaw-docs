---
read_when:
    - Menjalankan Gateway dari CLI (dev atau server)
    - Men-debug auth Gateway, mode bind, dan konektivitas
    - Menemukan gateway melalui Bonjour (local + wide-area DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — jalankan, kueri, dan temukan gateway
title: gateway
x-i18n:
    generated_at: "2026-04-23T09:19:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway adalah server WebSocket OpenClaw (channel, Node, sesi, hook).

Subperintah di halaman ini berada di bawah `openclaw gateway …`.

Dokumentasi terkait:

- [/gateway/bonjour](/id/gateway/bonjour)
- [/gateway/discovery](/id/gateway/discovery)
- [/gateway/configuration](/id/gateway/configuration)

## Jalankan Gateway

Jalankan proses Gateway lokal:

```bash
openclaw gateway
```

Alias foreground:

```bash
openclaw gateway run
```

Catatan:

- Secara default, Gateway menolak untuk memulai kecuali `gateway.mode=local` disetel di `~/.openclaw/openclaw.json`. Gunakan `--allow-unconfigured` untuk run ad-hoc/dev.
- `openclaw onboard --mode local` dan `openclaw setup` diharapkan menulis `gateway.mode=local`. Jika file ada tetapi `gateway.mode` tidak ada, anggap itu sebagai konfigurasi yang rusak atau tertimpa dan perbaiki alih-alih mengasumsikan mode lokal secara implisit.
- Jika file ada dan `gateway.mode` tidak ada, Gateway menganggap itu sebagai kerusakan konfigurasi yang mencurigakan dan menolak untuk “menebak local” untuk Anda.
- Bind di luar loopback tanpa auth diblokir (guardrail keamanan).
- `SIGUSR1` memicu restart dalam proses bila diizinkan (`commands.restart` aktif secara default; setel `commands.restart: false` untuk memblokir restart manual, sementara apply/update tool/config gateway tetap diizinkan).
- Handler `SIGINT`/`SIGTERM` menghentikan proses gateway, tetapi tidak memulihkan custom terminal state apa pun. Jika Anda membungkus CLI dengan TUI atau input mode raw, pulihkan terminal sebelum keluar.

### Opsi

- `--port <port>`: port WebSocket (default berasal dari config/env; biasanya `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: mode bind listener.
- `--auth <token|password>`: override mode auth.
- `--token <token>`: override token (juga menetapkan `OPENCLAW_GATEWAY_TOKEN` untuk proses).
- `--password <password>`: override password. Peringatan: password inline dapat terekspos dalam daftar proses lokal.
- `--password-file <path>`: baca password gateway dari file.
- `--tailscale <off|serve|funnel>`: ekspos Gateway melalui Tailscale.
- `--tailscale-reset-on-exit`: reset konfigurasi serve/funnel Tailscale saat shutdown.
- `--allow-unconfigured`: izinkan gateway dimulai tanpa `gateway.mode=local` di konfigurasi. Ini melewati guard startup hanya untuk bootstrap ad-hoc/dev; ini tidak menulis atau memperbaiki file konfigurasi.
- `--dev`: buat konfigurasi + workspace dev jika belum ada (melewati `BOOTSTRAP.md`).
- `--reset`: reset konfigurasi + kredensial + sesi + workspace dev (memerlukan `--dev`).
- `--force`: matikan listener apa pun yang ada pada port terpilih sebelum memulai.
- `--verbose`: log verbose.
- `--cli-backend-logs`: hanya tampilkan log backend CLI di konsol (dan aktifkan stdout/stderr).
- `--ws-log <auto|full|compact>`: gaya log websocket (default `auto`).
- `--compact`: alias untuk `--ws-log compact`.
- `--raw-stream`: catat event stream model mentah ke jsonl.
- `--raw-stream-path <path>`: path jsonl stream mentah.

Profiling startup:

- Setel `OPENCLAW_GATEWAY_STARTUP_TRACE=1` untuk mencatat timing fase selama startup Gateway.
- Jalankan `pnpm test:startup:gateway -- --runs 5 --warmup 1` untuk benchmark startup Gateway. Benchmark mencatat output proses pertama, `/healthz`, `/readyz`, dan timing trace startup.

## Kueri Gateway yang sedang berjalan

Semua perintah kueri menggunakan WebSocket RPC.

Mode output:

- Default: dapat dibaca manusia (berwarna di TTY).
- `--json`: JSON yang dapat dibaca mesin (tanpa styling/spinner).
- `--no-color` (atau `NO_COLOR=1`): nonaktifkan ANSI sambil tetap mempertahankan tata letak yang ramah manusia.

Opsi bersama (jika didukung):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: password Gateway.
- `--timeout <ms>`: timeout/budget (bervariasi per perintah).
- `--expect-final`: tunggu respons “final” (panggilan agent).

Catatan: saat Anda menetapkan `--url`, CLI tidak akan fallback ke kredensial konfigurasi atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` adalah probe liveness: endpoint ini mengembalikan hasil setelah server dapat menjawab HTTP. Endpoint HTTP `/readyz` lebih ketat dan tetap merah saat sidecar startup, channel, atau hook yang dikonfigurasi masih dalam proses stabil.

### `gateway usage-cost`

Ambil ringkasan usage-cost dari log sesi.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opsi:

- `--days <days>`: jumlah hari yang disertakan (default `30`).

### `gateway stability`

Ambil perekam stabilitas diagnostik terbaru dari Gateway yang sedang berjalan.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opsi:

- `--limit <limit>`: jumlah maksimum event terbaru yang disertakan (default `25`, maks `1000`).
- `--type <type>`: filter berdasarkan jenis event diagnostik, seperti `payload.large` atau `diagnostic.memory.pressure`.
- `--since-seq <seq>`: sertakan hanya event setelah nomor urut diagnostik tertentu.
- `--bundle [path]`: baca bundle stabilitas yang dipersist alih-alih memanggil Gateway yang sedang berjalan. Gunakan `--bundle latest` (atau cukup `--bundle`) untuk bundle terbaru di bawah direktori state, atau berikan path JSON bundle secara langsung.
- `--export`: tulis zip diagnostik dukungan yang dapat dibagikan alih-alih mencetak detail stabilitas.
- `--output <path>`: path output untuk `--export`.

Catatan:

- Rekaman menyimpan metadata operasional: nama event, jumlah, ukuran byte, pembacaan memori, state antrean/sesi, nama channel/plugin, dan ringkasan sesi yang disensor. Rekaman tidak menyimpan teks obrolan, body webhook, output tool, body permintaan atau respons mentah, token, cookie, nilai secret, hostname, atau id sesi mentah. Setel `diagnostics.enabled: false` untuk menonaktifkan perekam sepenuhnya.
- Pada exit Gateway fatal, timeout shutdown, dan kegagalan startup restart, OpenClaw menulis snapshot diagnostik yang sama ke `~/.openclaw/logs/stability/openclaw-stability-*.json` saat perekam memiliki event. Periksa bundle terbaru dengan `openclaw gateway stability --bundle latest`; `--limit`, `--type`, dan `--since-seq` juga berlaku untuk output bundle.

### `gateway diagnostics export`

Tulis zip diagnostik lokal yang dirancang untuk dilampirkan ke laporan bug.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opsi:

- `--output <path>`: path zip output. Default-nya ekspor dukungan di bawah direktori state.
- `--log-lines <count>`: maksimum baris log yang telah disanitasi untuk disertakan (default `5000`).
- `--log-bytes <bytes>`: maksimum byte log yang diperiksa (default `1000000`).
- `--url <url>`: URL WebSocket Gateway untuk snapshot health.
- `--token <token>`: token Gateway untuk snapshot health.
- `--password <password>`: password Gateway untuk snapshot health.
- `--timeout <ms>`: timeout snapshot status/health (default `3000`).
- `--no-stability-bundle`: lewati lookup bundle stabilitas yang dipersist.
- `--json`: cetak path yang ditulis, ukuran, dan manifest sebagai JSON.

Ekspor berisi manifest, ringkasan Markdown, bentuk konfigurasi, detail konfigurasi yang telah disanitasi, ringkasan log yang telah disanitasi, snapshot status/health Gateway yang telah disanitasi, dan bundle stabilitas terbaru bila ada.

Ekspor ini dimaksudkan untuk dibagikan. Ekspor ini menyimpan detail operasional yang membantu debugging, seperti field log OpenClaw yang aman, nama subsistem, kode status, durasi, mode yang dikonfigurasi, port, id plugin, id provider, pengaturan fitur non-rahasia, dan pesan log operasional yang telah disensor. Ekspor ini menghilangkan atau menyensor teks obrolan, body webhook, output tool, kredensial, cookie, identifier akun/pesan, teks prompt/instruksi, hostname, dan nilai secret. Saat pesan bergaya LogTape tampak seperti teks payload pengguna/obrolan/tool, ekspor hanya menyimpan bahwa sebuah pesan dihilangkan beserta jumlah byte-nya.

### `gateway status`

`gateway status` menampilkan layanan Gateway (launchd/systemd/schtasks) ditambah probe opsional untuk kemampuan konektivitas/auth.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opsi:

- `--url <url>`: tambahkan target probe eksplisit. Remote yang dikonfigurasi + localhost tetap diprobe.
- `--token <token>`: auth token untuk probe.
- `--password <password>`: auth password untuk probe.
- `--timeout <ms>`: timeout probe (default `10000`).
- `--no-probe`: lewati probe konektivitas (hanya tampilan layanan).
- `--deep`: pindai juga layanan tingkat sistem.
- `--require-rpc`: tingkatkan probe konektivitas default menjadi probe baca dan keluar non-zero saat probe baca itu gagal. Tidak dapat digabungkan dengan `--no-probe`.

Catatan:

- `gateway status` tetap tersedia untuk diagnostik bahkan saat konfigurasi CLI lokal tidak ada atau tidak valid.
- `gateway status` default membuktikan state layanan, koneksi WebSocket, dan kemampuan auth yang terlihat saat handshake. Ini tidak membuktikan operasi baca/tulis/admin.
- `gateway status` me-resolve SecretRef auth yang dikonfigurasi untuk auth probe bila memungkinkan.
- Jika SecretRef auth yang diperlukan tidak ter-resolve pada jalur perintah ini, `gateway status --json` melaporkan `rpc.authWarning` saat konektivitas/auth probe gagal; berikan `--token`/`--password` secara eksplisit atau resolve sumber secret terlebih dahulu.
- Jika probe berhasil, peringatan auth-ref yang tidak ter-resolve disembunyikan untuk menghindari false positive.
- Gunakan `--require-rpc` dalam skrip dan automasi saat layanan yang mendengarkan saja tidak cukup dan Anda juga membutuhkan panggilan RPC cakupan baca yang sehat.
- `--deep` menambahkan pemindaian best-effort untuk instalasi launchd/systemd/schtasks tambahan. Saat beberapa layanan mirip gateway terdeteksi, output untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa sebagian besar penyiapan seharusnya menjalankan satu gateway per mesin.
- Output untuk manusia menyertakan path log file yang telah di-resolve plus snapshot path/validitas konfigurasi CLI-vs-service untuk membantu mendiagnosis pergeseran profile atau direktori state.
- Pada instalasi Linux systemd, pemeriksaan drift auth layanan membaca nilai `Environment=` dan `EnvironmentFile=` dari unit (termasuk `%h`, path yang diberi kutip, banyak file, dan file opsional `-`).
- Pemeriksaan drift me-resolve SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika auth token tidak aktif secara efektif (mode `gateway.auth.mode` eksplisit `password`/`none`/`trusted-proxy`, atau mode tidak disetel saat password bisa menang dan tidak ada kandidat token yang bisa menang), pemeriksaan drift token melewati resolusi token konfigurasi.

### `gateway probe`

`gateway probe` adalah perintah “debug semuanya”. Perintah ini selalu memprobe:

- gateway remote yang Anda konfigurasi (jika ada), dan
- localhost (loopback) **meskipun remote dikonfigurasi**.

Jika Anda memberikan `--url`, target eksplisit tersebut ditambahkan di depan keduanya. Output untuk manusia memberi label
target sebagai:

- `URL (explicit)`
- `Remote (configured)` atau `Remote (configured, inactive)`
- `Local loopback`

Jika beberapa gateway dapat dijangkau, perintah ini mencetak semuanya. Beberapa gateway didukung saat Anda menggunakan profile/port yang terisolasi (misalnya, rescue bot), tetapi sebagian besar instalasi tetap menjalankan satu gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretasi:

- `Reachable: yes` berarti setidaknya satu target menerima koneksi WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` melaporkan apa yang dapat dibuktikan probe tentang auth. Ini terpisah dari jangkauan.
- `Read probe: ok` berarti panggilan RPC detail cakupan baca (`health`/`status`/`system-presence`/`config.get`) juga berhasil.
- `Read probe: limited - missing scope: operator.read` berarti koneksi berhasil tetapi RPC cakupan baca terbatas. Ini dilaporkan sebagai jangkauan **degraded**, bukan kegagalan penuh.
- Exit code non-zero hanya saat tidak ada target yang diprobe yang dapat dijangkau.

Catatan JSON (`--json`):

- Tingkat atas:
  - `ok`: setidaknya satu target dapat dijangkau.
  - `degraded`: setidaknya satu target memiliki RPC detail yang dibatasi scope.
  - `capability`: capability terbaik yang terlihat di seluruh target yang dapat dijangkau (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, atau `unknown`).
  - `primaryTargetId`: target terbaik untuk diperlakukan sebagai pemenang aktif dalam urutan ini: URL eksplisit, tunnel SSH, remote yang dikonfigurasi, lalu local loopback.
  - `warnings[]`: rekaman peringatan best-effort dengan `code`, `message`, dan `targetIds` opsional.
  - `network`: petunjuk URL local loopback/tailnet yang diturunkan dari konfigurasi saat ini dan jaringan host.
  - `discovery.timeoutMs` dan `discovery.count`: budget/jumlah hasil discovery aktual yang digunakan untuk lintasan probe ini.
- Per target (`targets[].connect`):
  - `ok`: keterjangkauan setelah connect + klasifikasi degraded.
  - `rpcOk`: keberhasilan penuh RPC detail.
  - `scopeLimited`: RPC detail gagal karena tidak adanya scope operator.
- Per target (`targets[].auth`):
  - `role`: peran auth yang dilaporkan di `hello-ok` jika tersedia.
  - `scopes`: scope yang diberikan dan dilaporkan di `hello-ok` jika tersedia.
  - `capability`: klasifikasi capability auth yang ditampilkan untuk target tersebut.

Kode peringatan umum:

- `ssh_tunnel_failed`: penyiapan tunnel SSH gagal; perintah fallback ke probe langsung.
- `multiple_gateways`: lebih dari satu target dapat dijangkau; ini tidak umum kecuali Anda sengaja menjalankan profile terisolasi, seperti rescue bot.
- `auth_secretref_unresolved`: SecretRef auth yang dikonfigurasi tidak dapat di-resolve untuk target yang gagal.
- `probe_scope_limited`: connect WebSocket berhasil, tetapi probe baca dibatasi oleh tidak adanya `operator.read`.

#### Remote melalui SSH (paritas aplikasi Mac)

Mode “Remote over SSH” di aplikasi macOS menggunakan port-forward lokal sehingga gateway remote (yang mungkin hanya bind ke loopback) menjadi dapat dijangkau di `ws://127.0.0.1:<port>`.

Padanan CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opsi:

- `--ssh <target>`: `user@host` atau `user@host:port` (port default `22`).
- `--ssh-identity <path>`: file identitas.
- `--ssh-auto`: pilih host gateway pertama yang ditemukan sebagai target SSH dari endpoint
  discovery yang telah di-resolve (`local.` ditambah domain wide-area yang dikonfigurasi, jika ada). Petunjuk
  hanya-TXT diabaikan.

Konfigurasi (opsional, digunakan sebagai default):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC level rendah.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opsi:

- `--params <json>`: string objek JSON untuk params (default `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Catatan:

- `--params` harus berupa JSON yang valid.
- `--expect-final` terutama untuk RPC bergaya agent yang men-stream event perantara sebelum payload final.

## Kelola layanan Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opsi perintah:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Catatan:

- `gateway install` mendukung `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Saat auth token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, `gateway install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang telah di-resolve ke metadata environment layanan.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, instalasi gagal secara closed alih-alih menyimpan plaintext fallback.
- Untuk auth password pada `gateway run`, utamakan `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, atau `gateway.auth.password` yang didukung SecretRef daripada `--password` inline.
- Dalam mode auth yang diinferensikan, `OPENCLAW_GATEWAY_PASSWORD` yang hanya ada di shell tidak melonggarkan persyaratan token instalasi; gunakan konfigurasi yang tahan lama (`gateway.auth.password` atau config `env`) saat menginstal layanan terkelola.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, instalasi diblokir sampai mode disetel secara eksplisit.
- Perintah lifecycle menerima `--json` untuk scripting.

## Temukan gateway (Bonjour)

`gateway discover` memindai beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): pilih domain (contoh: `openclaw.internal.`) dan siapkan split DNS + server DNS; lihat [/gateway/bonjour](/id/gateway/bonjour)

Hanya gateway dengan discovery Bonjour yang diaktifkan (default) yang mengiklankan beacon.

Rekaman discovery Wide-Area mencakup (TXT):

- `role` (petunjuk peran gateway)
- `transport` (petunjuk transport, misalnya `gateway`)
- `gatewayPort` (port WebSocket, biasanya `18789`)
- `sshPort` (opsional; client default ke target SSH `22` saat ini tidak ada)
- `tailnetDns` (hostname MagicDNS, jika tersedia)
- `gatewayTls` / `gatewayTlsSha256` (TLS diaktifkan + fingerprint sertifikat)
- `cliPath` (petunjuk instalasi remote yang ditulis ke zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Opsi:

- `--timeout <ms>`: timeout per perintah (browse/resolve); default `2000`.
- `--json`: output yang dapat dibaca mesin (juga menonaktifkan styling/spinner).

Contoh:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Catatan:

- CLI memindai `local.` ditambah domain wide-area yang dikonfigurasi saat domain tersebut diaktifkan.
- `wsUrl` dalam output JSON diturunkan dari endpoint layanan yang telah di-resolve, bukan dari petunjuk
  hanya-TXT seperti `lanHost` atau `tailnetDns`.
- Pada mDNS `local.`, `sshPort` dan `cliPath` hanya disiarkan saat
  `discovery.mdns.mode` adalah `full`. Wide-area DNS-SD tetap menulis `cliPath`; `sshPort`
  juga tetap opsional di sana.
