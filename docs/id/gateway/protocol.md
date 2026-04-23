---
read_when:
    - Mengimplementasikan atau memperbarui client WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, versioning'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-23T09:21:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol Gateway (WebSocket)

Protokol WS Gateway adalah **control plane tunggal + transport Node** untuk
OpenClaw. Semua client (CLI, UI web, aplikasi macOS, Node iOS/Android, Node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka pada saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, client
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostics yang diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat akan memunculkan event `payload.large`
  sebelum gateway menutup atau menjatuhkan frame yang terpengaruh. Event ini menyimpan
  ukuran, batas, permukaan, dan kode alasan yang aman. Event ini tidak menyimpan body pesan,
  isi lampiran, body frame mentah, token, cookie, atau nilai secret.

## Handshake (connect)

Gateway → Client (challenge pra-koneksi):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, dan `policy` semuanya wajib menurut skema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` bersifat opsional. `auth`
melaporkan role/scope yang dinegosiasikan saat tersedia, dan menyertakan `deviceToken`
saat gateway menerbitkannya.

Saat tidak ada device token yang diterbitkan, `hello-ok.auth` tetap dapat melaporkan
izin yang dinegosiasikan:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Saat device token diterbitkan, `hello-ok` juga mencakup:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama trusted bootstrap handoff, `hello-ok.auth` juga dapat mencakup entri role
tambahan yang dibatasi dalam `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Untuk alur bootstrap Node/operator bawaan, token Node primary tetap
`scopes: []` dan token operator yang diserahkan tetap dibatasi pada allowlist operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berawalan role: entri operator hanya memenuhi permintaan operator, dan role non-operator
tetap memerlukan scope di bawah prefiks role mereka sendiri.

### Contoh Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **idempotency key** (lihat skema).

## Role + scope

### Role

- `operator` = client control plane (CLI/UI/automasi).
- `node` = host kapabilitas (camera/screen/canvas/system.run).

### Scope (operator)

Scope umum:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets`
(atau `operator.admin`).

Metode RPC gateway yang didaftarkan Plugin dapat meminta scope operator mereka sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu di-resolve ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa slash command yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya, write persisten
`/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope pada saat persetujuan di atas
scope metode dasar:

- permintaan tanpa command: `operator.pairing`
- permintaan dengan command Node non-exec: `operator.pairing` + `operator.write`
- permintaan yang mencakup `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Node mendeklarasikan klaim kapabilitas pada saat koneksi:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist command untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist di sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci oleh identitas perangkat.
- Entri presence mencakup `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat tersebut terhubung sebagai **operator** dan **Node** sekaligus.

## Scoping event broadcast

Event broadcast WebSocket yang didorong server digate dengan scope sehingga sesi dengan scope pairing atau sesi khusus-Node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan hasil tool** (termasuk event `agent` yang di-stream dan hasil panggilan tool) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` sepenuhnya melewati frame ini.
- **Broadcast `plugin.*` yang didefinisikan Plugin** digate ke `operator.write` atau `operator.admin`, bergantung pada cara Plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi yang terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** digate dengan scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi client menyimpan nomor urut per-client-nya sendiri sehingga broadcast mempertahankan urutan monoton pada socket tersebut bahkan ketika client yang berbeda melihat subset stream event yang berbeda karena filtering scope.

## Keluarga metode RPC umum

Halaman ini bukan dump penuh yang dihasilkan, tetapi permukaan WS publik lebih luas
daripada contoh handshake/auth di atas. Berikut adalah keluarga metode utama yang
diekspose Gateway saat ini.

`hello-ok.features.methods` adalah daftar discovery konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode plugin/channel yang dimuat.
Perlakukan ini sebagai discovery fitur, bukan sebagai dump yang dihasilkan dari setiap helper callable
yang diimplementasikan di `src/gateway/server-methods/*.ts`.

### Sistem dan identitas

- `health` mengembalikan snapshot health gateway yang di-cache atau baru diprobe.
- `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas
  terbaru. Perekam ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte,
  pembacaan memori, state antrean/sesi, nama channel/plugin, dan id sesi. Perekam
  ini tidak menyimpan teks obrolan, body webhook, output tool, body permintaan atau
  respons mentah, token, cookie, atau nilai secret. Scope operator read
  diperlukan.
- `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya
  disertakan untuk client operator dengan scope admin.
- `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan
  pairing.
- `system-presence` mengembalikan snapshot presence saat ini untuk perangkat
  operator/Node yang terhubung.
- `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks
  presence.
- `last-heartbeat` mengembalikan event Heartbeat persisten terbaru.
- `set-heartbeats` mengaktifkan/menonaktifkan pemrosesan Heartbeat di gateway.

### Model dan usage

- `models.list` mengembalikan katalog model yang diizinkan pada runtime.
- `usage.status` mengembalikan ringkasan jendela usage/kuota tersisa provider.
- `usage.cost` mengembalikan ringkasan usage biaya teragregasi untuk suatu rentang tanggal.
- `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk
  workspace agent default aktif.
- `sessions.usage` mengembalikan ringkasan usage per sesi.
- `sessions.usage.timeseries` mengembalikan usage timeseries untuk satu sesi.
- `sessions.usage.logs` mengembalikan entri log usage untuk satu sesi.

### Channel dan helper login

- `channels.status` mengembalikan ringkasan status channel/Plugin bawaan + bundled.
- `channels.logout` logout dari channel/akun tertentu saat channel tersebut
  mendukung logout.
- `web.login.start` memulai alur login QR/web untuk provider channel web yang mendukung QR saat ini.
- `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai
  channel jika berhasil.
- `push.test` mengirim APNs push uji ke Node iOS yang terdaftar.
- `voicewake.get` mengembalikan trigger wake-word yang tersimpan.
- `voicewake.set` memperbarui trigger wake-word dan menyiarkan perubahan.

### Pesan dan log

- `send` adalah RPC pengiriman outbound langsung untuk
  pengiriman yang ditargetkan channel/akun/thread di luar chat runner.
- `logs.tail` mengembalikan tail log file gateway yang dikonfigurasi dengan kontrol cursor/limit dan
  byte maksimum.

### Talk dan TTS

- `talk.config` mengembalikan payload konfigurasi Talk yang efektif; `includeSecrets`
  memerlukan `operator.talk.secrets` (atau `operator.admin`).
- `talk.mode` menetapkan/menyiarkan state mode Talk saat ini untuk client WebChat/Control UI.
- `talk.speak` mensintesis ucapan melalui provider speech Talk yang aktif.
- `tts.status` mengembalikan state TTS aktif/nonaktif, provider aktif, provider fallback,
  dan state konfigurasi provider.
- `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
- `tts.enable` dan `tts.disable` mengaktifkan/menonaktifkan state preferensi TTS.
- `tts.setProvider` memperbarui provider TTS yang dipilih.
- `tts.convert` menjalankan konversi text-to-speech sekali jalan.

### Secret, konfigurasi, pembaruan, dan wizard

- `secrets.reload` me-resolve ulang SecretRef aktif dan menukar state secret runtime
  hanya jika sepenuhnya berhasil.
- `secrets.resolve` me-resolve penugasan secret target perintah untuk sekumpulan
  perintah/target tertentu.
- `config.get` mengembalikan snapshot konfigurasi saat ini beserta hash-nya.
- `config.set` menulis payload konfigurasi yang tervalidasi.
- `config.patch` menggabungkan pembaruan konfigurasi parsial.
- `config.apply` memvalidasi + mengganti payload konfigurasi penuh.
- `config.schema` mengembalikan payload skema konfigurasi live yang digunakan oleh Control UI dan
  tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk
  metadata skema plugin + channel saat runtime dapat memuatnya. Skema tersebut
  mencakup metadata field `title` / `description` yang diturunkan dari label yang sama
  dan teks bantuan yang digunakan UI, termasuk object bersarang, wildcard, item array,
  dan cabang komposisi `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok
  tersedia.
- `config.schema.lookup` mengembalikan payload lookup dengan cakupan path untuk satu path konfigurasi:
  path yang dinormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan
  ringkasan child langsung untuk drill-down UI/CLI.
  - Node skema lookup mempertahankan dokumentasi yang terlihat pengguna dan field validasi umum:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    batas numerik/string/array/object, dan flag boolean seperti
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Ringkasan child menampilkan `key`, `path` yang dinormalisasi, `type`, `required`,
    `hasChildren`, beserta `hint` / `hintPath` yang cocok.
- `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya saat
  pembaruan itu sendiri berhasil.
- `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos
  wizard onboarding melalui WS RPC.

### Keluarga utama yang sudah ada

#### Helper agent dan workspace

- `agents.list` mengembalikan entri agent yang dikonfigurasi.
- `agents.create`, `agents.update`, dan `agents.delete` mengelola record agent dan
  wiring workspace.
- `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola
  file workspace bootstrap yang diekspos untuk sebuah agent.
- `agent.identity.get` mengembalikan identitas assistant efektif untuk agent atau
  sesi.
- `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal saat
  tersedia.

#### Kontrol sesi

- `sessions.list` mengembalikan indeks sesi saat ini.
- `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan/menonaktifkan
  langganan event perubahan sesi untuk client WS saat ini.
- `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan/menonaktifkan
  langganan event transkrip/pesan untuk satu sesi.
- `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk key sesi
  tertentu.
- `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
- `sessions.create` membuat entri sesi baru.
- `sessions.send` mengirim pesan ke sesi yang sudah ada.
- `sessions.steer` adalah varian interrupt-and-steer untuk sesi aktif.
- `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi.
- `sessions.patch` memperbarui metadata/override sesi.
- `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan
  pemeliharaan sesi.
- `sessions.get` mengembalikan seluruh baris sesi yang tersimpan.
- Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan
  `chat.inject`.
- `chat.history` dinormalisasi untuk tampilan client UI: tag directive inline dihapus
  dari teks yang terlihat, payload XML tool-call teks biasa (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok tool-call yang terpotong) serta token kontrol model ASCII/full-width yang bocor
  dihapus, baris assistant yang hanya berisi silent-token murni seperti `NO_REPLY` /
  `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

#### Pairing perangkat dan token perangkat

- `device.pair.list` mengembalikan perangkat yang dipasangkan yang tertunda dan disetujui.
- `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola
  record pairing perangkat.
- `device.token.rotate` merotasi token perangkat yang dipasangkan dalam batas role
  dan scope yang telah disetujui.
- `device.token.revoke` mencabut token perangkat yang dipasangkan.

#### Pairing Node, invoke, dan pekerjaan tertunda

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, dan `node.pair.verify` mencakup pairing Node dan verifikasi
  bootstrap.
- `node.list` dan `node.describe` mengembalikan state Node yang diketahui/terhubung.
- `node.rename` memperbarui label Node yang dipasangkan.
- `node.invoke` meneruskan command ke Node yang terhubung.
- `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
- `node.event` membawa event yang berasal dari Node kembali ke gateway.
- `node.canvas.capability.refresh` me-refresh token kapabilitas canvas yang dibatasi scope.
- `node.pending.pull` dan `node.pending.ack` adalah API antrean Node terhubung.
- `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang persisten
  untuk Node offline/terputus.

#### Keluarga persetujuan

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan
  `exec.approval.resolve` mencakup permintaan persetujuan exec sekali jalan beserta lookup/replay
  persetujuan tertunda.
- `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan
  keputusan final (atau `null` saat timeout).
- `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
- `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal-Node
  melalui command relay Node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup
  alur persetujuan yang didefinisikan Plugin.

#### Keluarga utama lainnya

- automasi:
  - `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat khusus-transkrip
  lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/stream event untuk sesi
  yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: event keepalive / liveness berkala.
- `health`: pembaruan snapshot health gateway.
- `heartbeat`: pembaruan stream event Heartbeat.
- `cron`: event perubahan run/job Cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: lifecycle pairing Node.
- `node.invoke.request`: broadcast permintaan invoke Node.
- `device.pair.requested` / `device.pair.resolved`: lifecycle perangkat yang dipasangkan.
- `voicewake.changed`: konfigurasi trigger wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle
  persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle persetujuan plugin.

### Metode helper Node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris command runtime bagi sebuah agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - `scope` mengontrol permukaan mana yang dituju oleh `name` utama:
    - `text` mengembalikan token command teks utama tanpa awalan `/`
    - `native` dan path default `both` mengembalikan nama native yang sadar-provider
      saat tersedia
  - `textAliases` memuat alias slash persis seperti `/model` dan `/m`.
  - `nativeName` memuat nama command native yang sadar-provider saat tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus ketersediaan command plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime bagi sebuah
  agent. Respons mencakup tool yang dikelompokkan dan metadata provenance:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif-runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau konteks pengiriman yang disuplai pemanggil.
  - Respons memiliki cakupan sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  Skills yang terlihat bagi sebuah agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan konfigurasi, dan
    opsi instalasi yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata discovery ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder
    skill ke direktori `skills/` workspace agent default.
  - Mode installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di
    workspace agent default.
  - Mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Client operator me-resolve dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus mencakup `systemRunPlan` (metadata kanonis `argv`/`cwd`/`rawCommand`/sesi). Permintaan yang tidak memiliki `systemRunPlan` akan ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks command/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara persiapan dan penerusan `system.run` final yang disetujui, gateway
  menolak run tersebut alih-alih memercayai payload yang telah diubah.

## Fallback pengiriman agent

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman outbound.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya-internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi hanya-sesi saat tidak ada rute eksternal yang dapat dikirim yang dapat di-resolve (misalnya sesi internal/webchat atau konfigurasi multi-channel yang ambigu).

## Versioning

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Client mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model digenerasikan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta client

Client referensi di `src/gateway/client.ts` menggunakan default berikut. Nilai-nilai ini
stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk client pihak ketiga.

| Constant                                  | Default                                               | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout permintaan (per RPC)              | `30_000` md                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` md                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff reconnect awal                    | `1_000` md                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff reconnect maksimum                | `30_000` md                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp retry-cepat setelah device-token close | `250` md                                           | `src/gateway/client.ts`                                    |
| Grace force-stop sebelum `terminate()`    | `250` md                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout default `stopAndWait()`           | `1_000` md                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Interval tick default (pra `hello-ok`)    | `30_000` md                                           | `src/gateway/client.ts`                                    |
| Penutupan karena timeout tick             | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif di `hello-ok`; client harus menghormati nilai-nilai tersebut
alih-alih default pra-handshake.

## Auth

- Auth gateway shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header permintaan alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` melewati auth connect shared-secret
  sepenuhnya; jangan ekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **device token** dengan scope ke role + scope koneksi.
  Token ini dikembalikan di `hello-ok.auth.deviceToken` dan harus
  dipersist oleh client untuk koneksi berikutnya.
- Client harus mem-persist `hello-ok.auth.deviceToken` primary setelah setiap
  koneksi berhasil.
- Menyambung ulang dengan device token **tersimpan** tersebut juga harus menggunakan kembali
  kumpulan scope yang telah disetujui dan tersimpan untuk token tersebut. Ini mempertahankan
  akses baca/probe/status yang sudah diberikan dan menghindari reconnect diam-diam menyusut ke
  scope implicit admin-only yang lebih sempit.
- Perakitan auth connect sisi client (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat disetel.
  - `auth.token` diisi dalam urutan prioritas: shared token eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per-device yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya saat tidak ada yang di atas yang menghasilkan
    `auth.token`. Shared token atau device token yang berhasil di-resolve akan menekannya.
  - Auto-promotion device token tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` digate hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Persist hanya saat koneksi menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/local pairing.
- Jika sebuah client menyuplai `deviceToken` **eksplisit** atau `scopes` eksplisit, kumpulan scope yang diminta pemanggil tersebut tetap otoritatif; scope cache hanya
  digunakan ulang saat client menggunakan kembali token per-device yang tersimpan.
- Device token dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada kumpulan role yang telah disetujui dan dicatat dalam
  entri pairing perangkat tersebut; merotasi token tidak dapat memperluas perangkat ke
  role yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipasangkan, manajemen perangkat memiliki scope ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **milik mereka sendiri**.
- `device.token.rotate` juga memeriksa kumpulan scope operator yang diminta terhadap
  scope sesi pemanggil saat ini. Pemanggil non-admin tidak dapat merotasi token ke
  kumpulan scope operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth mencakup `error.details.code` beserta petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku client untuk `AUTH_TOKEN_MISMATCH`:
  - Client tepercaya dapat mencoba satu retry terbatas dengan token per-device yang di-cache.
  - Jika retry itu gagal, client harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali auto-approval lokal
  diaktifkan.
- Auto-approval pairing berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Semua client WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI dapat menghilangkannya hanya dalam mode berikut:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan yang berat).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang diberikan server.

### Diagnostik migrasi auth perangkat

Untuk client legacy yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` kini mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client tidak menyertakan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client menandatangani dengan nonce yang stale/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload tanda tangan tidak cocok dengan payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi public key gagal.         |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload tanda tangan yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Tanda tangan `v2` legacy tetap diterima untuk kompatibilitas, tetapi pinning metadata
  perangkat yang dipasangkan tetap mengontrol kebijakan command saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Client dapat secara opsional mem-pin fingerprint sertifikat gateway (lihat konfigurasi `gateway.tls`
  ditambah `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway penuh** (status, channel, model, chat,
agent, sesi, Node, persetujuan, dll.). Permukaan yang tepat ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.
