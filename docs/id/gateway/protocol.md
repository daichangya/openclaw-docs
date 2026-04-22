---
read_when:
    - Mengimplementasikan atau memperbarui klien WS Gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol Gateway WebSocket: handshake, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol Gateway (WebSocket)

Protokol WS Gateway adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
headless) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope**
mereka saat handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.

## Handshake (connect)

Gateway → Klien (tantangan pra-koneksi):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Klien → Gateway:

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

Gateway → Klien:

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

Saat tidak ada device token yang diterbitkan, `hello-ok.auth` masih dapat melaporkan
izin yang dinegosiasikan:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Saat device token diterbitkan, `hello-ok` juga menyertakan:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama trusted bootstrap handoff, `hello-ok.auth` juga dapat menyertakan entri role
terbatas tambahan dalam `deviceTokens`:

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

Untuk alur bootstrap node/operator bawaan, token node utama tetap
`scopes: []` dan token operator yang diserahkan tetap dibatasi ke allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berawalan role: entri operator hanya memenuhi permintaan operator, dan role
non-operator tetap memerlukan scope di bawah awalan role mereka sendiri.

### Contoh node

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Method yang memiliki efek samping memerlukan **idempotency key** (lihat skema).

## Role + scope

### Role

- `operator` = klien control plane (CLI/UI/otomasi).
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

Method RPC Gateway yang didaftarkan plugin dapat meminta scope operatornya sendiri, tetapi
awalan admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu diselesaikan ke `operator.admin`.

Scope method hanyalah gerbang pertama. Beberapa perintah slash yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Contohnya,
penulisan persisten `/config set` dan `/config unset` memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope tambahan pada saat persetujuan di atas
scope method dasarnya:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menerapkan allowlist di sisi server.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci oleh identitas perangkat.
- Entri kehadiran menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node** sekaligus.

## Scoping event broadcast

Event broadcast WebSocket yang didorong server dibatasi oleh scope sehingga sesi dengan scope pairing atau sesi khusus node tidak menerima konten sesi secara pasif.

- **Frame chat, agent, dan hasil alat** (termasuk event `agent` yang di-streaming dan hasil pemanggilan alat) memerlukan setidaknya `operator.read`. Sesi tanpa `operator.read` sepenuhnya melewati frame ini.
- **Broadcast `plugin.*` yang didefinisikan plugin** dibatasi ke `operator.write` atau `operator.admin`, bergantung pada cara plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dan sebagainya) tetap tidak dibatasi agar kesehatan transport tetap dapat diamati oleh setiap sesi yang diautentikasi.
- **Keluarga event broadcast yang tidak dikenal** dibatasi oleh scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per-kliennya sendiri sehingga broadcast mempertahankan urutan monoton pada socket tersebut bahkan saat klien yang berbeda melihat subset aliran event yang telah difilter oleh scope yang berbeda.

## Keluarga method RPC umum

Halaman ini bukan dump lengkap hasil generate, tetapi permukaan WS publik lebih luas
daripada contoh handshake/autentikasi di atas. Ini adalah keluarga method utama yang
diekspos Gateway saat ini.

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` plus ekspor method plugin/channel yang dimuat.
Perlakukan ini sebagai penemuan fitur, bukan sebagai dump hasil generate dari setiap helper yang dapat dipanggil
yang diimplementasikan di `src/gateway/server-methods/*.ts`.

### System dan identitas

- `health` mengembalikan snapshot kesehatan gateway yang dicache atau baru diprobe.
- `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya
  disertakan untuk klien operator dengan scope admin.
- `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan
  pairing.
- `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat
  operator/node yang terhubung.
- `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan
  konteks kehadiran.
- `last-heartbeat` mengembalikan event Heartbeat persisten terbaru.
- `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan Heartbeat di gateway.

### Model dan penggunaan

- `models.list` mengembalikan katalog model yang diizinkan saat runtime.
- `usage.status` mengembalikan ringkasan jendela penggunaan provider/kuota tersisa.
- `usage.cost` mengembalikan ringkasan penggunaan biaya agregat untuk rentang tanggal.
- `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk
  workspace agent default aktif.
- `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
- `sessions.usage.timeseries` mengembalikan usage timeseries untuk satu sesi.
- `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

### Channel dan helper login

- `channels.status` mengembalikan ringkasan status channel/plugin bawaan + bundel.
- `channels.logout` melakukan logout untuk channel/akun tertentu saat channel
  mendukung logout.
- `web.login.start` memulai alur login QR/web untuk provider channel web
  berkemampuan QR saat ini.
- `web.login.wait` menunggu hingga alur login QR/web tersebut selesai dan memulai
  channel saat berhasil.
- `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
- `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
- `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahannya.

### Messaging dan log

- `send` adalah RPC pengiriman keluar langsung untuk
  pengiriman yang ditargetkan ke channel/akun/thread di luar runner chat.
- `logs.tail` mengembalikan tail log file gateway yang dikonfigurasi dengan kontrol kursor/limit dan
  batas byte maksimum.

### Talk dan TTS

- `talk.config` mengembalikan payload config Talk efektif; `includeSecrets`
  memerlukan `operator.talk.secrets` (atau `operator.admin`).
- `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
- `talk.speak` mensintesis ucapan melalui provider ucapan Talk aktif.
- `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback,
  dan status config provider.
- `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
- `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
- `tts.setProvider` memperbarui provider TTS pilihan.
- `tts.convert` menjalankan konversi text-to-speech sekali jalan.

### Secrets, config, update, dan wizard

- `secrets.reload` menyelesaikan ulang SecretRef aktif dan menukar status rahasia runtime
  hanya saat seluruh proses berhasil.
- `secrets.resolve` menyelesaikan penetapan secret target perintah untuk himpunan
  perintah/target tertentu.
- `config.get` mengembalikan snapshot config saat ini dan hash-nya.
- `config.set` menulis payload config yang tervalidasi.
- `config.patch` menggabungkan pembaruan config parsial.
- `config.apply` memvalidasi + mengganti seluruh payload config.
- `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan
  tooling CLI: schema, `uiHints`, versi, dan metadata generasi, termasuk
  metadata skema plugin + channel saat runtime dapat memuatnya. Skema
  mencakup metadata field `title` / `description` yang diturunkan dari label yang sama
  dan teks bantuan yang digunakan oleh UI, termasuk object bersarang, wildcard, item array,
  dan cabang komposisi `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok
  tersedia.
- `config.schema.lookup` mengembalikan payload pencarian dengan cakupan path untuk satu path config:
  path yang dinormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan
  ringkasan child langsung untuk penelusuran UI/CLI.
  - Node skema hasil pencarian mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    batas numerik/string/array/object, dan flag boolean seperti
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Ringkasan child mengekspos `key`, `path` yang dinormalisasi, `type`, `required`,
    `hasChildren`, plus `hint` / `hintPath` yang cocok.
- `update.run` menjalankan alur update gateway dan menjadwalkan restart hanya saat
  update itu sendiri berhasil.
- `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos
  wizard onboarding melalui WS RPC.

### Keluarga utama yang sudah ada

#### Agent dan helper workspace

- `agents.list` mengembalikan entri agent yang dikonfigurasi.
- `agents.create`, `agents.update`, dan `agents.delete` mengelola record agent dan
  wiring workspace.
- `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola
  file workspace bootstrap yang diekspos untuk sebuah agent.
- `agent.identity.get` mengembalikan identitas asisten efektif untuk agent atau
  sesi.
- `agent.wait` menunggu hingga suatu run selesai dan mengembalikan snapshot terminal saat
  tersedia.

#### Kontrol sesi

- `sessions.list` mengembalikan indeks sesi saat ini.
- `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan subscription event perubahan sesi
  untuk klien WS saat ini.
- `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan
  subscription event transkrip/pesan untuk satu sesi.
- `sessions.preview` mengembalikan pratinjau transkrip berbatas untuk kunci sesi
  tertentu.
- `sessions.resolve` menyelesaikan atau mengkanonisasi target sesi.
- `sessions.create` membuat entri sesi baru.
- `sessions.send` mengirim pesan ke sesi yang sudah ada.
- `sessions.steer` adalah varian interrupt-and-steer untuk sesi yang aktif.
- `sessions.abort` membatalkan pekerjaan aktif untuk suatu sesi.
- `sessions.patch` memperbarui metadata/override sesi.
- `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan
  pemeliharaan sesi.
- `sessions.get` mengembalikan baris sesi tersimpan lengkap.
- eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan
  `chat.inject`.
- `chat.history` dinormalisasi untuk tampilan klien UI: tag directive inline dihapus
  dari teks yang terlihat, payload XML tool-call teks biasa (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok tool-call terpotong) serta token kontrol model ASCII/full-width yang bocor
  dihapus, baris asisten token-senyap murni seperti `NO_REPLY` /
  `no_reply` yang persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.

#### Pairing perangkat dan device token

- `device.pair.list` mengembalikan perangkat yang di-pairing tertunda dan yang disetujui.
- `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola
  record pairing perangkat.
- `device.token.rotate` merotasi token perangkat yang di-pairing dalam batas role
  dan scope yang disetujui.
- `device.token.revoke` mencabut token perangkat yang di-pairing.

#### Pairing node, invoke, dan pekerjaan tertunda

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan
  verifikasi bootstrap.
- `node.list` dan `node.describe` mengembalikan status node yang dikenal/terhubung.
- `node.rename` memperbarui label node yang di-pairing.
- `node.invoke` meneruskan perintah ke node yang terhubung.
- `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
- `node.event` membawa event yang berasal dari node kembali ke gateway.
- `node.canvas.capability.refresh` menyegarkan token kapabilitas canvas yang dibatasi scope.
- `node.pending.pull` dan `node.pending.ack` adalah API antrean node-terhubung.
- `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda tahan lama
  untuk node offline/terputus.

#### Keluarga persetujuan

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan
  `exec.approval.resolve` mencakup permintaan persetujuan exec sekali pakai plus
  pencarian/pemutaran ulang persetujuan tertunda.
- `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan
  keputusan akhir (atau `null` saat timeout).
- `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan
  persetujuan exec gateway.
- `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec
  lokal node melalui perintah relay node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup
  alur persetujuan yang didefinisikan Plugin.

#### Keluarga utama lainnya

- otomasi:
  - `wake` menjadwalkan injeksi teks bangun segera atau pada Heartbeat berikutnya
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat khusus transkrip
  lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran event untuk sesi yang di-subscribe.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: event keepalive / liveness periodik.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran event Heartbeat.
- `cron`: event perubahan run/job Cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: broadcast permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang di-pairing.
- `voicewake.changed`: config pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup
  persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan Plugin.

### Method helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Method helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris
  perintah runtime untuk sebuah agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - `scope` mengontrol permukaan mana yang ditargetkan `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar-provider
      saat tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar-provider saat tersedia.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus ketersediaan
    perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime untuk sebuah
  agent. Respons mencakup tool yang dikelompokkan dan metadata provenance:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif runtime
  untuk sebuah sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau konteks pengiriman yang disediakan pemanggil.
  - Respons dibatasi ke sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat untuk sebuah agent.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agent default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instalasi yang disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder
    skill ke direktori `skills/` workspace agent default.
  - mode installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di
    workspace agent default.
  - mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Persetujuan exec

- Saat suatu permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan ulang
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil memutasi `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan `system.run` akhir yang disetujui,
  gateway menolak run tersebut alih-alih mempercayai payload yang telah dimutasi.

## Fallback pengiriman agent

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak terselesaikan atau khusus internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` mengizinkan fallback ke eksekusi khusus sesi saat tidak ada rute pengiriman eksternal yang dapat diselesaikan (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default berikut. Nilai-nilai ini
stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout permintaan (per RPC)              | `30_000` md                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` md                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff reconnect awal                    | `1_000` md                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff reconnect maksimum                | `30_000` md                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp percobaan cepat ulang setelah device-token close | `250` md                                   | `src/gateway/client.ts`                                    |
| Grace force-stop sebelum `terminate()`    | `250` md                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout default `stopAndWait()`           | `1_000` md                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Interval tick default (pra `hello-ok`)    | `30_000` md                                           | `src/gateway/client.ts`                                    |
| Penutupan karena tick-timeout             | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` efektif di `hello-ok`; klien harus mematuhi nilai-nilai tersebut
alih-alih default pra-handshake.

## Auth

- Autentikasi gateway shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau
  `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan auth connect dari
  header permintaan alih-alih `connect.params.auth.*`.
- Ingress privat dengan `gateway.auth.mode: "none"` sepenuhnya melewati auth connect shared-secret;
  jangan mengekspos mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **device token** yang dibatasi ke
  role + scope koneksi. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan harus
  dipersistenkan oleh klien untuk koneksi berikutnya.
- Klien harus memersistenkan `hello-ok.auth.deviceToken` utama setelah setiap
  koneksi berhasil.
- Melakukan reconnect dengan device token **tersimpan** tersebut juga harus menggunakan ulang
  himpunan scope yang disetujui dan tersimpan untuk token itu. Ini mempertahankan akses
  baca/probe/status yang sudah diberikan dan menghindari reconnect yang diam-diam
  menyusut ke scope implicit admin-only yang lebih sempit.
- Penyusunan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat diatur.
  - `auth.token` diisi dalam urutan prioritas: shared token eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per-perangkat tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` hanya dikirim saat tidak satu pun dari hal di atas menghasilkan
    `auth.token`. Shared token atau device token apa pun yang berhasil diselesaikan akan menekannya.
  - Auto-promotion device token tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang dipin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri tambahan `hello-ok.auth.deviceTokens` adalah token handoff bootstrap.
  Persistenkan hanya saat koneksi menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/pairing lokal.
- Jika klien memberikan `deviceToken` **eksplisit** atau `scopes` eksplisit, himpunan scope
  yang diminta pemanggil tersebut tetap otoritatif; scope cache hanya digunakan ulang
  saat klien menggunakan ulang token per-perangkat yang tersimpan.
- Device token dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi ke himpunan role yang disetujui yang tercatat di
  entri pairing perangkat tersebut; merotasi token tidak dapat memperluas perangkat ke
  role yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token paired-device, manajemen perangkat dibatasi ke diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **milik mereka sendiri**.
- `device.token.rotate` juga memeriksa himpunan scope operator yang diminta terhadap
  scope sesi saat ini milik pemanggil. Pemanggil non-admin tidak dapat merotasi token ke
  himpunan scope operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan token per-perangkat cache.
  - Jika retry itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk `device.id` baru kecuali auto-approval lokal
  diaktifkan.
- Pairing auto-approval berpusat pada koneksi local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan
  memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI hanya dapat menghilangkannya dalam mode berikut:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan yang parah).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang diberikan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                                |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce basi/salah.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload signature tidak cocok dengan payload v2.    |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi public key gagal.                 |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tandatangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload signature yang disukai adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Signature `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata
  paired-device tetap mengendalikan kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional mem-pin fingerprint sertifikat gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway lengkap** (status, channel, model, chat,
agent, sesi, node, persetujuan, dan sebagainya). Permukaan pastinya ditentukan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.
