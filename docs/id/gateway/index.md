---
read_when:
    - Menjalankan atau men-debug proses gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-25T13:46:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua dari layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah yang presisi dan signature log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berbasis tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen secrets" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/reload.
  </Card>
  <Card title="Kontrak rencana secrets" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang presisi dan perilaku auth-profile khusus ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace dicerminkan ke stdio
openclaw gateway --port 18789 --verbose
# paksa kill listener pada port yang dipilih, lalu mulai
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan yang Anda harapkan. Gunakan `openclaw gateway status --require-rpc` saat Anda membutuhkan bukti RPC read-scope, bukan sekadar keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan saluran">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe saluran live per akun dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI fallback ke ringkasan saluran berbasis konfigurasi saja
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Reload konfigurasi Gateway memantau path file konfigurasi aktif (diselesaikan dari default profile/status, atau `OPENCLAW_CONFIG_PATH` saat disetel).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan pertama berhasil, proses yang sedang berjalan melayani snapshot konfigurasi aktif dalam memori; reload yang berhasil menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses yang selalu aktif untuk perutean, control plane, dan koneksi saluran.
- Satu port termultipleks untuk:
  - control/RPC WebSocket
  - HTTP API, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI kontrol dan hook
- Mode bind default: `loopback`.
- Auth diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan
  reverse-proxy non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Permukaan kompatibilitas dengan leverage tertinggi di OpenClaw sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa himpunan ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat mem-probe `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien agent-native semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` bersifat agent-first: mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agent default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override provider/model backend; jika tidak, penyiapan model dan embedding normal agent yang dipilih tetap mengendalikan.

Semua ini berjalan pada port Gateway utama dan menggunakan batas auth operator tepercaya yang sama seperti seluruh HTTP API Gateway lainnya.

### Prioritas port dan bind

| Setting      | Urutan resolusi                                              |
| ------------ | ------------------------------------------------------------ |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                  |

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Tidak ada reload konfigurasi              |
| `hot`                 | Terapkan hanya perubahan yang hot-safe    |
| `restart`             | Restart saat perubahan memerlukan reload  |
| `hybrid` (default)    | Hot-apply saat aman, restart saat diperlukan |

## Kumpulan perintah operator

```bash
openclaw gateway status
openclaw gateway status --deep   # menambahkan pemindaian layanan tingkat sistem
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ditujukan untuk penemuan layanan tambahan (LaunchDaemons/unit systemd system
/schtasks), bukan probe kesehatan RPC yang lebih dalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agent dan saluran.

Anda hanya membutuhkan beberapa gateway saat memang menginginkan isolasi atau bot penyelamat.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks basi masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu disengaja, isolasikan root port, konfigurasi/status, dan workspace per gateway.

Checklist per instance:

- `gateway.port` unik
- `OPENCLAW_CONFIG_PATH` unik
- `OPENCLAW_STATE_DIR` unik
- `agents.defaults.workspace` unik

Contoh:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Penyiapan terperinci: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Endpoint brain real-time VoiceClaw

OpenClaw mengekspos endpoint WebSocket real-time yang kompatibel dengan VoiceClaw di
`/voiceclaw/realtime`. Gunakan ini saat klien desktop VoiceClaw harus berbicara
langsung ke brain OpenClaw real-time alih-alih melalui proses relay terpisah.

Endpoint ini menggunakan Gemini Live untuk audio real-time dan memanggil OpenClaw sebagai
brain dengan mengekspos tool OpenClaw langsung ke Gemini Live. Panggilan tool mengembalikan hasil
`working` segera agar giliran suara tetap responsif, lalu OpenClaw
mengeksekusi tool yang sebenarnya secara asinkron dan menyisipkan hasilnya kembali ke
sesi live. Setel `GEMINI_API_KEY` di environment proses gateway. Jika
auth gateway diaktifkan, klien desktop mengirim token atau password gateway
dalam pesan `session.config` pertamanya.

Akses brain real-time menjalankan perintah agent OpenClaw yang diotorisasi owner. Batasi
`gateway.auth.mode: "none"` hanya untuk instance uji loopback-only. Koneksi
brain real-time non-lokal memerlukan auth gateway.

Untuk gateway uji yang terisolasi, jalankan instance terpisah dengan port, konfigurasi,
dan status miliknya sendiri:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Lalu konfigurasikan VoiceClaw agar menggunakan:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Akses jarak jauh

Direkomendasikan: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati auth gateway. Untuk auth shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur auth tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan run tersupervisi untuk keandalan setara produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profile bernama). `openclaw doctor` mengaudit dan memperbaiki drift konfigurasi layanan.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Untuk persistensi setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger <user>
```

Contoh manual user-unit saat Anda memerlukan path instalasi kustom:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Startup terkelola Windows native menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profile bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw fallback ke launcher Startup-folder per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (layanan sistem)">

Gunakan system unit untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti user unit, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika binary `openclaw` Anda berada di lokasi lain.

  </Tab>
</Tabs>

## Jalur cepat profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default-nya mencakup status/konfigurasi terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (sudut pandang operator)

- Frame klien pertama harus berupa `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` adalah daftar penemuan konservatif, bukan
  dump hasil generate dari setiap route helper yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/persetujuan, dan `shutdown`.

Run agent terdiri dari dua tahap:

1. ack penerimaan langsung (`status:"accepted"`)
2. respons penyelesaian akhir (`status:"ok"|"error"`), dengan event `agent` yang di-stream di antaranya.

Lihat dokumen protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

## Pemeriksaan operasional

### Liveness

- Buka WS dan kirim `connect`.
- Harapkan respons `hello-ok` dengan snapshot.

### Kesiapan

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Pemulihan gap

Event tidak diputar ulang. Pada gap sequence, segarkan status (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Signature                                                      | Kemungkinan masalah                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                            |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                     |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi disetel ke mode remote, atau cap mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan auth antara klien dan gateway                                     |

Untuk urutan diagnosis lengkap, gunakan [Pemecahan masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal dengan cepat saat Gateway tidak tersedia (tidak ada fallback implisit saluran langsung).
- Frame pertama yang invalid/bukan connect ditolak dan koneksi ditutup.
- Shutdown graceful memancarkan event `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Health](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Autentikasi](/id/gateway/authentication)

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Akses jarak jauh](/id/gateway/remote)
- [Manajemen secrets](/id/gateway/secrets)
