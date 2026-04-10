---
read_when:
    - Mengimplementasikan atau memperbarui klien WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Membuat ulang skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-10T09:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Protokol Gateway (WebSocket)

Protokol WS Gateway adalah **bidang kendali tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, app macOS, node iOS/Android, node headless)
terhubung melalui WebSocket dan mendeklarasikan **peran** + **cakupan** mereka
saat waktu handshake.

## Transport

- WebSocket, frame teks dengan muatan JSON.
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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Saat token perangkat diterbitkan, `hello-ok` juga mencakup:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri
peran terbatas tambahan dalam `deviceTokens`:

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
`scopes: []` dan token operator yang di-handoff tetap dibatasi ke allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan cakupan bootstrap tetap
berawalan peran: entri operator hanya memenuhi permintaan operator, dan peran
non-operator tetap memerlukan cakupan di bawah awalan peran mereka sendiri.

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

- **Permintaan**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Peristiwa**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **kunci idempotensi** (lihat skema).

## Peran + cakupan

### Peran

- `operator` = klien bidang kendali (CLI/UI/otomasi).
- `node` = host kapabilitas (camera/screen/canvas/system.run).

### Cakupan (operator)

Cakupan umum:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` dengan `includeSecrets: true` memerlukan `operator.talk.secrets`
(atau `operator.admin`).

Metode RPC gateway yang didaftarkan plugin dapat meminta cakupan operatornya
sendiri, tetapi awalan admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) selalu diselesaikan ke
`operator.admin`.

Cakupan metode hanyalah gerbang pertama. Beberapa slash command yang dicapai
melalui `chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di
atasnya. Misalnya, penulisan persisten `/config set` dan `/config unset`
memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan cakupan saat persetujuan tambahan
di atas cakupan metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim kapabilitas saat waktu connect:

- `caps`: kategori kapabilitas tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle terperinci (misalnya `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist sisi server.

## Kehadiran

- `system-presence` mengembalikan entri yang dikunci oleh identitas perangkat.
- Entri kehadiran mencakup `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan saat perangkat terhubung sebagai **operator** dan **node**.

## Keluarga metode RPC umum

Halaman ini bukan dump penuh yang dihasilkan, tetapi permukaan WS publik lebih
luas daripada contoh handshake/auth di atas. Ini adalah keluarga metode utama
yang saat ini diekspos Gateway.

`hello-ok.features.methods` adalah daftar penemuan konservatif yang dibangun dari
`src/gateway/server-methods-list.ts` ditambah ekspor metode plugin/channel yang dimuat.
Perlakukan ini sebagai penemuan fitur, bukan sebagai dump yang dihasilkan dari setiap helper
yang dapat dipanggil yang diimplementasikan dalam `src/gateway/server-methods/*.ts`.

### Sistem dan identitas

- `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
- `status` mengembalikan ringkasan gateway gaya `/status`; field sensitif hanya
  disertakan untuk klien operator bercakupan admin.
- `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan
  pairing.
- `system-presence` mengembalikan snapshot kehadiran saat ini untuk perangkat
  operator/node yang terhubung.
- `system-event` menambahkan peristiwa sistem dan dapat memperbarui/menyiarkan konteks
  kehadiran.
- `last-heartbeat` mengembalikan peristiwa heartbeat persisten terbaru.
- `set-heartbeats` mengaktifkan atau menonaktifkan pemrosesan heartbeat pada gateway.

### Model dan penggunaan

- `models.list` mengembalikan katalog model yang diizinkan runtime.
- `usage.status` mengembalikan ringkasan jendela penggunaan/kuota tersisa provider.
- `usage.cost` mengembalikan ringkasan penggunaan biaya agregat untuk suatu rentang tanggal.
- `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk
  workspace agen default aktif.
- `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
- `sessions.usage.timeseries` mengembalikan timeseries penggunaan untuk satu sesi.
- `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.

### Channel dan helper login

- `channels.status` mengembalikan ringkasan status channel/plugin bawaan + bundel.
- `channels.logout` melakukan logout pada channel/akun tertentu jika channel
  mendukung logout.
- `web.login.start` memulai alur login QR/web untuk provider channel web
  saat ini yang mendukung QR.
- `web.login.wait` menunggu hingga alur login QR/web tersebut selesai dan memulai
  channel jika berhasil.
- `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
- `voicewake.get` mengembalikan pemicu wake-word yang tersimpan.
- `voicewake.set` memperbarui pemicu wake-word dan menyiarkan perubahannya.

### Perpesanan dan log

- `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke
  channel/akun/thread di luar chat runner.
- `logs.tail` mengembalikan tail log file gateway yang dikonfigurasi dengan cursor/limit dan
  kontrol byte maksimum.

### Talk dan TTS

- `talk.config` mengembalikan muatan konfigurasi Talk yang efektif; `includeSecrets`
  memerlukan `operator.talk.secrets` (atau `operator.admin`).
- `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien
  WebChat/Control UI.
- `talk.speak` mensintesis ucapan melalui provider ucapan Talk yang aktif.
- `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback,
  dan status konfigurasi provider.
- `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
- `tts.enable` dan `tts.disable` mengaktifkan atau menonaktifkan status preferensi TTS.
- `tts.setProvider` memperbarui provider TTS pilihan.
- `tts.convert` menjalankan konversi teks-ke-ucapan sekali jalan.

### Secrets, config, update, dan wizard

- `secrets.reload` me-resolve ulang SecretRef aktif dan menukar status secret runtime
  hanya jika sepenuhnya berhasil.
- `secrets.resolve` me-resolve penetapan secret target-perintah untuk set perintah/target tertentu.
- `config.get` mengembalikan snapshot config dan hash saat ini.
- `config.set` menulis muatan config yang tervalidasi.
- `config.patch` menggabungkan pembaruan config parsial.
- `config.apply` memvalidasi + mengganti seluruh muatan config.
- `config.schema` mengembalikan muatan skema config live yang digunakan oleh Control UI dan
  tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk
  metadata skema plugin + channel saat runtime dapat memuatnya. Skema
  mencakup metadata field `title` / `description` yang diturunkan dari label yang sama
  dan teks bantuan yang digunakan oleh UI, termasuk object bertingkat, wildcard,
  item array, dan cabang komposisi `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok tersedia.
- `config.schema.lookup` mengembalikan muatan lookup berbatas jalur untuk satu config
  path: jalur ternormalisasi, node skema dangkal, hint + `hintPath` yang cocok, dan
  ringkasan child langsung untuk drill-down UI/CLI.
  - Node skema lookup mempertahankan dokumentasi yang menghadap pengguna dan field validasi umum:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    batas numerik/string/array/object, dan flag boolean seperti
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Ringkasan child mengekspos `key`, `path` ternormalisasi, `type`, `required`,
    `hasChildren`, ditambah `hint` / `hintPath` yang cocok.
- `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya saat
  pembaruan itu sendiri berhasil.
- `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos
  wizard onboarding melalui WS RPC.

### Keluarga utama yang sudah ada

#### Helper agen dan workspace

- `agents.list` mengembalikan entri agen yang dikonfigurasi.
- `agents.create`, `agents.update`, dan `agents.delete` mengelola catatan agen dan
  wiring workspace.
- `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola
  file workspace bootstrap yang diekspos untuk sebuah agen.
- `agent.identity.get` mengembalikan identitas asisten yang efektif untuk agen atau
  sesi.
- `agent.wait` menunggu hingga suatu run selesai dan mengembalikan snapshot terminal saat
  tersedia.

#### Kontrol sesi

- `sessions.list` mengembalikan indeks sesi saat ini.
- `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan atau menonaktifkan langganan peristiwa perubahan sesi
  untuk klien WS saat ini.
- `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan atau menonaktifkan
  langganan peristiwa transkrip/pesan untuk satu sesi.
- `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci
  sesi tertentu.
- `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
- `sessions.create` membuat entri sesi baru.
- `sessions.send` mengirim pesan ke sesi yang sudah ada.
- `sessions.steer` adalah varian interupsi-dan-arahkan untuk sesi aktif.
- `sessions.abort` membatalkan pekerjaan aktif untuk sebuah sesi.
- `sessions.patch` memperbarui metadata/override sesi.
- `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan
  pemeliharaan sesi.
- `sessions.get` mengembalikan baris sesi tersimpan lengkap.
- eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan
  `chat.inject`.
- `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag direktif inline
  dihapus dari teks yang terlihat, muatan XML tool-call teks biasa (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok tool-call yang terpotong) serta token kontrol model ASCII/full-width yang
  bocor dihapus, baris asisten token-senyap murni seperti `NO_REPLY` /
  `no_reply` yang persis sama dihilangkan, dan baris yang terlalu besar dapat
  diganti dengan placeholder.

#### Pairing perangkat dan token perangkat

- `device.pair.list` mengembalikan perangkat yang di-pairing yang tertunda dan disetujui.
- `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola
  catatan pairing perangkat.
- `device.token.rotate` merotasi token perangkat yang di-pairing dalam batas peran
  dan cakupan yang disetujui.
- `device.token.revoke` mencabut token perangkat yang di-pairing.

#### Pairing node, invoke, dan pekerjaan tertunda

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan verifikasi
  bootstrap.
- `node.list` dan `node.describe` mengembalikan status node yang dikenal/terhubung.
- `node.rename` memperbarui label node yang di-pairing.
- `node.invoke` meneruskan perintah ke node yang terhubung.
- `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
- `node.event` membawa peristiwa yang berasal dari node kembali ke gateway.
- `node.canvas.capability.refresh` me-refresh token kapabilitas canvas yang dibatasi cakupan.
- `node.pending.pull` dan `node.pending.ack` adalah API antrean node-terhubung.
- `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama
  untuk node offline/tidak terhubung.

#### Keluarga persetujuan

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan
  `exec.approval.resolve` mencakup permintaan persetujuan exec sekali pakai plus
  lookup/replay persetujuan tertunda.
- `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan
  keputusan final (atau `null` saat timeout).
- `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan
  persetujuan exec gateway.
- `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan exec lokal-node
  melalui perintah relay node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup
  alur persetujuan yang didefinisikan plugin.

#### Keluarga utama lainnya

- otomasi:
  - `wake` menjadwalkan injeksi teks bangun segera atau pada heartbeat berikutnya
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Keluarga peristiwa umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan peristiwa chat khusus transkrip
  lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/aliran-peristiwa untuk sesi
  yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot kehadiran sistem.
- `tick`: peristiwa keepalive / liveness berkala.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan aliran peristiwa heartbeat.
- `cron`: peristiwa perubahan run/pekerjaan cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: siaran permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang di-pairing.
- `voicewake.changed`: konfigurasi pemicu wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup
  persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime bagi sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - `scope` mengontrol permukaan mana yang dituju oleh `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa awalan `/`
    - `native` dan jalur default `both` mengembalikan nama native yang sadar-provider
      jika tersedia
  - `textAliases` membawa alias slash persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar-provider jika ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus
    ketersediaan perintah plugin native.
  - `includeArgs=false` menghilangkan metadata argumen yang diserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime bagi sebuah
  agen. Respons mencakup tool yang dikelompokkan dan metadata provenance:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool efektif-runtime
  bagi sebuah sesi.
  - `sessionKey` wajib diisi.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima
    auth atau konteks pengiriman yang disediakan pemanggil.
  - Respons dibatasi pada sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini,
    termasuk tool core, plugin, dan channel.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris
  skill yang terlihat bagi sebuah agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca workspace agen default.
  - Respons mencakup kelayakan, persyaratan yang hilang, pemeriksaan config, dan
    opsi instalasi yang telah disanitasi tanpa mengekspos nilai secret mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk
  metadata penemuan ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal
    folder skill ke direktori `skills/` workspace agen default.
  - Mode installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug yang dilacak atau semua instalasi ClawHub yang dilacak di
    workspace agen default.
  - Mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan cakupan `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (metadata `argv`/`cwd`/`rawCommand`/sesi kanonis). Permintaan yang tidak memiliki `systemRunPlan` akan ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali
  `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan `system.run` final yang telah disetujui,
  gateway menolak run tersebut alih-alih memercayai muatan yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya-internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi khusus-sesi saat tidak ada rute pengiriman eksternal yang dapat di-resolve (misalnya sesi internal/webchat atau config multi-channel yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Auth gateway shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, tergantung pada mode auth yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau
  `gateway.auth.mode: "trusted-proxy"` non-loopback memenuhi pemeriksaan auth connect dari
  header permintaan alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` sepenuhnya melewati auth connect shared-secret;
  jangan mengekspos mode tersebut pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **token perangkat** yang dibatasi pada
  peran + cakupan koneksi. Token ini dikembalikan dalam `hello-ok.auth.deviceToken` dan
  harus disimpan oleh klien untuk connect berikutnya.
- Klien harus menyimpan `hello-ok.auth.deviceToken` utama setelah setiap
  connect yang berhasil.
- Menghubungkan ulang dengan token perangkat **tersimpan** tersebut juga harus menggunakan kembali set cakupan
  yang telah disetujui dan tersimpan untuk token itu. Ini mempertahankan akses baca/probe/status
  yang sudah diberikan dan menghindari koneksi ulang diam-diam menyusut ke
  cakupan implisit khusus-admin yang lebih sempit.
- Prioritas auth connect normal adalah token/password shared eksplisit terlebih dahulu, lalu
  `deviceToken` eksplisit, lalu token per-perangkat tersimpan, lalu token bootstrap.
- Entri `hello-ok.auth.deviceTokens` tambahan adalah token handoff bootstrap.
  Simpan token ini hanya saat connect menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/pairing lokal.
- Jika klien memberikan `deviceToken` **eksplisit** atau `scopes` eksplisit, set cakupan
  yang diminta pemanggil tersebut tetap otoritatif; cakupan yang di-cache hanya
  digunakan kembali saat klien menggunakan kembali token per-perangkat tersimpan.
- Token perangkat dapat dirotasi/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan cakupan `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada set peran yang disetujui dan dicatat dalam
  entri pairing perangkat tersebut; merotasi token tidak dapat memperluas perangkat ke
  peran yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang di-pairing, pengelolaan perangkat dibatasi pada diri sendiri kecuali
  pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/merotasi
  entri perangkat **milik mereka sendiri**.
- `device.token.rotate` juga memeriksa set cakupan operator yang diminta terhadap
  cakupan sesi pemanggil saat ini. Pemanggil non-admin tidak dapat merotasi token ke
  set cakupan operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth mencakup `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu kali retry terbatas dengan token per-perangkat yang di-cache.
  - Jika retry tersebut gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat stabil (`device.id`) yang diturunkan dari
  fingerprint keypair.
- Gateway menerbitkan token per perangkat + peran.
- Persetujuan pairing diperlukan untuk ID perangkat baru kecuali auto-approval lokal
  diaktifkan.
- Auto-approval pairing berpusat pada koneksi local loopback langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet host yang sama atau LAN tetap diperlakukan sebagai koneksi jarak jauh untuk pairing dan
  memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI dapat menghilangkannya hanya dalam mode berikut:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, penurunan keamanan berat).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan
kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien tidak menyertakan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce yang basi/salah. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Muatan signature tidak cocok dengan muatan v2.     |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Tanda waktu yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi public key gagal.                |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani muatan v2 yang menyertakan nonce server.
- Kirim nonce yang sama dalam `connect.params.device.nonce`.
- Muatan signature yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily`
  selain field device/client/role/scopes/token/nonce.
- Signature `v2` lama tetap diterima untuk kompatibilitas, tetapi pinning metadata
  paired-device tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional melakukan pinning fingerprint sertifikat gateway (lihat config `gateway.tls`
  serta `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway lengkap** (status, channel, model, chat,
agen, sesi, node, persetujuan, dll.). Permukaan persisnya didefinisikan oleh
skema TypeBox di `src/gateway/protocol/schema.ts`.
