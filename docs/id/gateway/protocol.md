---
read_when:
    - Mengimplementasikan atau memperbarui klien WS gateway
    - Men-debug ketidakcocokan protokol atau kegagalan koneksi
    - Meregenerasi skema/model protokol
summary: 'Protokol WebSocket Gateway: handshake, frame, pembuatan versi'
title: Protokol Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Protokol WS Gateway adalah **control plane tunggal + transport node** untuk
OpenClaw. Semua klien (CLI, UI web, aplikasi macOS, node iOS/Android, node
tanpa kepala) terhubung melalui WebSocket dan mendeklarasikan **role** + **scope** mereka saat
handshake.

## Transport

- WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** berupa permintaan `connect`.
- Frame pra-koneksi dibatasi hingga 64 KiB. Setelah handshake berhasil, klien
  harus mengikuti batas `hello-ok.policy.maxPayload` dan
  `hello-ok.policy.maxBufferedBytes`. Dengan diagnostik diaktifkan,
  frame masuk yang terlalu besar dan buffer keluar yang lambat mengeluarkan event `payload.large`
  sebelum gateway menutup atau menjatuhkan frame yang terdampak. Event ini menyimpan
  ukuran, batas, permukaan, dan kode alasan yang aman. Event ini tidak menyimpan body pesan,
  isi lampiran, body frame mentah, token, cookie, atau nilai rahasia.

## Handshake (connect)

Gateway → Klien (challenge pra-koneksi):

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

Saat tidak ada token perangkat yang diterbitkan, `hello-ok.auth` masih dapat melaporkan
izin yang dinegosiasikan:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Saat token perangkat diterbitkan, `hello-ok` juga menyertakan:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Selama handoff bootstrap tepercaya, `hello-ok.auth` juga dapat menyertakan entri role terbatas tambahan di `deviceTokens`:

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
`scopes: []` dan token operator yang diserahkan tetap dibatasi pada allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Pemeriksaan scope bootstrap tetap
berprefiks role: entri operator hanya memenuhi permintaan operator, dan role non-operator
tetap memerlukan scope di bawah prefiks role mereka sendiri.

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
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Metode yang memiliki efek samping memerlukan **idempotency key** (lihat skema).

## Role + scope

### Role

- `operator` = klien control plane (CLI/UI/otomasi).
- `node` = host capability (camera/screen/canvas/system.run).

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

Metode Gateway RPC yang didaftarkan Plugin dapat meminta scope operator mereka sendiri, tetapi
prefiks admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu di-resolve ke `operator.admin`.

Scope metode hanyalah gerbang pertama. Beberapa slash command yang dicapai melalui
`chat.send` menerapkan pemeriksaan tingkat perintah yang lebih ketat di atasnya. Misalnya,
penulisan `/config set` dan `/config unset` persisten memerlukan `operator.admin`.

`node.pair.approve` juga memiliki pemeriksaan scope saat persetujuan tambahan di atas
scope metode dasar:

- permintaan tanpa perintah: `operator.pairing`
- permintaan dengan perintah node non-exec: `operator.pairing` + `operator.write`
- permintaan yang menyertakan `system.run`, `system.run.prepare`, atau `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node mendeklarasikan klaim capability saat connect:

- `caps`: kategori capability tingkat tinggi.
- `commands`: allowlist perintah untuk invoke.
- `permissions`: toggle granular (mis. `screen.record`, `camera.capture`).

Gateway memperlakukan ini sebagai **klaim** dan menegakkan allowlist sisi server.

## Presence

- `system-presence` mengembalikan entri yang dikunci berdasarkan identitas perangkat.
- Entri presence menyertakan `deviceId`, `roles`, dan `scopes` sehingga UI dapat menampilkan satu baris per perangkat
  bahkan ketika perangkat terhubung sebagai **operator** dan **node** sekaligus.

## Pembatasan scope event broadcast

Event broadcast WebSocket yang didorong server dibatasi oleh scope sehingga sesi dengan scope pairing atau node-only tidak secara pasif menerima konten sesi.

- **Frame chat, agent, dan hasil tool** (termasuk event `agent` yang di-stream dan hasil panggilan tool) memerlukan minimal `operator.read`. Sesi tanpa `operator.read` melewati frame ini sepenuhnya.
- **Broadcast `plugin.*` yang didefinisikan Plugin** dibatasi ke `operator.write` atau `operator.admin`, tergantung bagaimana Plugin mendaftarkannya.
- **Event status dan transport** (`heartbeat`, `presence`, `tick`, siklus hidup connect/disconnect, dll.) tetap tidak dibatasi sehingga kesehatan transport tetap dapat diamati oleh setiap sesi yang terautentikasi.
- **Keluarga event broadcast yang tidak dikenal** dibatasi scope secara default (fail-closed) kecuali handler terdaftar secara eksplisit melonggarkannya.

Setiap koneksi klien menyimpan nomor urut per kliennya sendiri sehingga broadcast mempertahankan urutan monoton pada soket tersebut bahkan ketika klien yang berbeda melihat subset stream event yang difilter scope yang berbeda.

## Keluarga metode RPC umum

Permukaan WS publik lebih luas daripada contoh handshake/auth di atas. Ini
bukan dump yang dihasilkan — `hello-ok.features.methods` adalah daftar discovery
konservatif yang dibangun dari `src/gateway/server-methods-list.ts` ditambah ekspor metode Plugin/saluran yang dimuat. Perlakukan ini sebagai discovery fitur, bukan enumerasi penuh `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistem dan identitas">
    - `health` mengembalikan snapshot kesehatan gateway yang di-cache atau baru diprobe.
    - `diagnostics.stability` mengembalikan perekam stabilitas diagnostik terbatas terbaru. Ini menyimpan metadata operasional seperti nama event, jumlah, ukuran byte, pembacaan memori, status antrean/sesi, nama saluran/Plugin, dan id sesi. Ini tidak menyimpan teks chat, body Webhook, output tool, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Diperlukan scope operator read.
    - `status` mengembalikan ringkasan gateway bergaya `/status`; field sensitif hanya disertakan untuk klien operator dengan scope admin.
    - `gateway.identity.get` mengembalikan identitas perangkat gateway yang digunakan oleh alur relay dan pairing.
    - `system-presence` mengembalikan snapshot presence saat ini untuk perangkat operator/node yang terhubung.
    - `system-event` menambahkan event sistem dan dapat memperbarui/menyiarkan konteks presence.
    - `last-heartbeat` mengembalikan event heartbeat tersimpan terbaru.
    - `set-heartbeats` mengaktifkan/menonaktifkan pemrosesan heartbeat pada gateway.
  </Accordion>

  <Accordion title="Model dan penggunaan">
    - `models.list` mengembalikan katalog model yang diizinkan runtime.
    - `usage.status` mengembalikan ringkasan jendela penggunaan/kuota tersisa provider.
    - `usage.cost` mengembalikan ringkasan penggunaan biaya teragregasi untuk rentang tanggal.
    - `doctor.memory.status` mengembalikan kesiapan vector-memory / embedding untuk ruang kerja agen default aktif.
    - `sessions.usage` mengembalikan ringkasan penggunaan per sesi.
    - `sessions.usage.timeseries` mengembalikan penggunaan deret waktu untuk satu sesi.
    - `sessions.usage.logs` mengembalikan entri log penggunaan untuk satu sesi.
  </Accordion>

  <Accordion title="Saluran dan helper login">
    - `channels.status` mengembalikan ringkasan status saluran/Plugin bawaan + bundled.
    - `channels.logout` mengeluarkan logout saluran/akun tertentu ketika saluran mendukung logout.
    - `web.login.start` memulai alur login QR/web untuk provider saluran web berkemampuan QR saat ini.
    - `web.login.wait` menunggu alur login QR/web tersebut selesai dan memulai saluran jika berhasil.
    - `push.test` mengirim push APNs uji ke node iOS yang terdaftar.
    - `voicewake.get` mengembalikan trigger wake-word yang tersimpan.
    - `voicewake.set` memperbarui trigger wake-word dan menyiarkan perubahan.
  </Accordion>

  <Accordion title="Pesan dan log">
    - `send` adalah RPC pengiriman keluar langsung untuk pengiriman yang ditargetkan ke saluran/akun/thread di luar chat runner.
    - `logs.tail` mengembalikan tail log file gateway yang dikonfigurasi dengan kontrol cursor/limit dan byte maksimum.
  </Accordion>

  <Accordion title="Talk dan TTS">
    - `talk.config` mengembalikan payload config Talk yang efektif; `includeSecrets` memerlukan `operator.talk.secrets` (atau `operator.admin`).
    - `talk.mode` menetapkan/menyiarkan status mode Talk saat ini untuk klien WebChat/Control UI.
    - `talk.speak` mensintesis ucapan melalui provider ucapan Talk aktif.
    - `tts.status` mengembalikan status TTS aktif, provider aktif, provider fallback, dan status config provider.
    - `tts.providers` mengembalikan inventaris provider TTS yang terlihat.
    - `tts.enable` dan `tts.disable` mengaktifkan/menonaktifkan status preferensi TTS.
    - `tts.setProvider` memperbarui provider TTS yang dipilih.
    - `tts.convert` menjalankan konversi text-to-speech one-shot.
  </Accordion>

  <Accordion title="Secrets, config, pembaruan, dan wizard">
    - `secrets.reload` me-resolve ulang SecretRef aktif dan menukar status rahasia runtime hanya jika berhasil sepenuhnya.
    - `secrets.resolve` me-resolve penetapan rahasia target perintah untuk kumpulan perintah/target tertentu.
    - `config.get` mengembalikan snapshot config saat ini dan hash-nya.
    - `config.set` menulis payload config yang tervalidasi.
    - `config.patch` menggabungkan pembaruan config parsial.
    - `config.apply` memvalidasi + mengganti seluruh payload config.
    - `config.schema` mengembalikan payload skema config live yang digunakan oleh Control UI dan tooling CLI: skema, `uiHints`, versi, dan metadata generasi, termasuk metadata skema Plugin + saluran saat runtime dapat memuatnya. Skema ini menyertakan metadata field `title` / `description` yang diturunkan dari label dan teks bantuan yang sama dengan yang digunakan UI, termasuk cabang komposisi objek bertingkat, wildcard, item array, dan `anyOf` / `oneOf` / `allOf` saat dokumentasi field yang cocok tersedia.
    - `config.schema.lookup` mengembalikan payload lookup bercakupan path untuk satu path config: path yang dinormalisasi, node skema dangkal, hint yang cocok + `hintPath`, dan ringkasan child langsung untuk drill-down UI/CLI. Node skema lookup mempertahankan dokumen yang menghadap pengguna dan field validasi umum (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, batas numerik/string/array/objek, dan flag seperti `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Ringkasan child mengekspos `key`, `path` yang dinormalisasi, `type`, `required`, `hasChildren`, plus `hint` / `hintPath` yang cocok.
    - `update.run` menjalankan alur pembaruan gateway dan menjadwalkan restart hanya saat pembaruan itu sendiri berhasil.
    - `wizard.start`, `wizard.next`, `wizard.status`, dan `wizard.cancel` mengekspos wizard onboarding melalui WS RPC.
  </Accordion>

  <Accordion title="Helper agen dan ruang kerja">
    - `agents.list` mengembalikan entri agen yang dikonfigurasi.
    - `agents.create`, `agents.update`, dan `agents.delete` mengelola rekaman agen dan pengkabelan ruang kerja.
    - `agents.files.list`, `agents.files.get`, dan `agents.files.set` mengelola file ruang kerja bootstrap yang diekspos untuk agen.
    - `agent.identity.get` mengembalikan identitas asisten efektif untuk agen atau sesi.
    - `agent.wait` menunggu run selesai dan mengembalikan snapshot terminal saat tersedia.
  </Accordion>

  <Accordion title="Kontrol sesi">
    - `sessions.list` mengembalikan indeks sesi saat ini.
    - `sessions.subscribe` dan `sessions.unsubscribe` mengaktifkan/menonaktifkan langganan event perubahan sesi untuk klien WS saat ini.
    - `sessions.messages.subscribe` dan `sessions.messages.unsubscribe` mengaktifkan/menonaktifkan langganan event transkrip/pesan untuk satu sesi.
    - `sessions.preview` mengembalikan pratinjau transkrip terbatas untuk kunci sesi tertentu.
    - `sessions.resolve` me-resolve atau mengkanonisasi target sesi.
    - `sessions.create` membuat entri sesi baru.
    - `sessions.send` mengirim pesan ke sesi yang sudah ada.
    - `sessions.steer` adalah varian interrupt-and-steer untuk sesi aktif.
    - `sessions.abort` membatalkan pekerjaan aktif untuk sesi.
    - `sessions.patch` memperbarui metadata/override sesi.
    - `sessions.reset`, `sessions.delete`, dan `sessions.compact` melakukan pemeliharaan sesi.
    - `sessions.get` mengembalikan baris sesi tersimpan penuh.
    - Eksekusi chat tetap menggunakan `chat.history`, `chat.send`, `chat.abort`, dan `chat.inject`. `chat.history` dinormalisasi untuk tampilan bagi klien UI: tag directive inline dihapus dari teks yang terlihat, payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris assistant token-senyap murni seperti `NO_REPLY` / `no_reply` yang persis sama dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
  </Accordion>

  <Accordion title="Pairing perangkat dan token perangkat">
    - `device.pair.list` mengembalikan perangkat yang dipairing tertunda dan yang disetujui.
    - `device.pair.approve`, `device.pair.reject`, dan `device.pair.remove` mengelola rekaman pairing perangkat.
    - `device.token.rotate` memutar token perangkat yang dipairing dalam batas role dan scope yang disetujui.
    - `device.token.revoke` mencabut token perangkat yang dipairing.
  </Accordion>

  <Accordion title="Pairing node, invoke, dan pekerjaan tertunda">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, dan `node.pair.verify` mencakup pairing node dan verifikasi bootstrap.
    - `node.list` dan `node.describe` mengembalikan status node yang dikenal/terhubung.
    - `node.rename` memperbarui label node yang dipairing.
    - `node.invoke` meneruskan perintah ke node yang terhubung.
    - `node.invoke.result` mengembalikan hasil untuk permintaan invoke.
    - `node.event` membawa event yang berasal dari node kembali ke gateway.
    - `node.canvas.capability.refresh` menyegarkan token canvas-capability bercakupan.
    - `node.pending.pull` dan `node.pending.ack` adalah API antrean node yang terhubung.
    - `node.pending.enqueue` dan `node.pending.drain` mengelola pekerjaan tertunda yang tahan lama untuk node offline/terputus.
  </Accordion>

  <Accordion title="Keluarga persetujuan">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, dan `exec.approval.resolve` mencakup permintaan persetujuan exec one-shot ditambah lookup/replay persetujuan tertunda.
    - `exec.approval.waitDecision` menunggu satu persetujuan exec tertunda dan mengembalikan keputusan final (atau `null` saat timeout).
    - `exec.approvals.get` dan `exec.approvals.set` mengelola snapshot kebijakan persetujuan exec gateway.
    - `exec.approvals.node.get` dan `exec.approvals.node.set` mengelola kebijakan persetujuan exec lokal node melalui perintah relay node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, dan `plugin.approval.resolve` mencakup alur persetujuan yang didefinisikan Plugin.
  </Accordion>

  <Accordion title="Otomasi, Skills, dan tool">
    - Otomasi: `wake` menjadwalkan injeksi teks bangun segera atau pada heartbeat berikutnya; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` mengelola pekerjaan terjadwal.
    - Skills dan tool: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Keluarga event umum

- `chat`: pembaruan chat UI seperti `chat.inject` dan event chat khusus transkrip lainnya.
- `session.message` dan `session.tool`: pembaruan transkrip/event-stream untuk sesi yang dilanggani.
- `sessions.changed`: indeks sesi atau metadata berubah.
- `presence`: pembaruan snapshot presence sistem.
- `tick`: event keepalive / liveness periodik.
- `health`: pembaruan snapshot kesehatan gateway.
- `heartbeat`: pembaruan stream event heartbeat.
- `cron`: event perubahan run/pekerjaan cron.
- `shutdown`: notifikasi shutdown gateway.
- `node.pair.requested` / `node.pair.resolved`: siklus hidup pairing node.
- `node.invoke.request`: broadcast permintaan invoke node.
- `device.pair.requested` / `device.pair.resolved`: siklus hidup perangkat yang dipairing.
- `voicewake.changed`: config trigger wake-word berubah.
- `exec.approval.requested` / `exec.approval.resolved`: siklus hidup persetujuan exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: siklus hidup persetujuan plugin.

### Metode helper node

- Node dapat memanggil `skills.bins` untuk mengambil daftar executable skill saat ini
  untuk pemeriksaan auto-allow.

### Metode helper operator

- Operator dapat memanggil `commands.list` (`operator.read`) untuk mengambil inventaris perintah runtime bagi agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - `scope` mengontrol permukaan mana yang menjadi target `name` utama:
    - `text` mengembalikan token perintah teks utama tanpa `/` di depan
    - `native` dan jalur default `both` mengembalikan nama native yang sadar provider
      saat tersedia
  - `textAliases` membawa alias slash yang persis seperti `/model` dan `/m`.
  - `nativeName` membawa nama perintah native yang sadar provider saat ada.
  - `provider` bersifat opsional dan hanya memengaruhi penamaan native plus ketersediaan perintah Plugin native.
  - `includeArgs=false` menghilangkan metadata argumen terserialisasi dari respons.
- Operator dapat memanggil `tools.catalog` (`operator.read`) untuk mengambil katalog tool runtime bagi agen. Respons menyertakan tool yang dikelompokkan dan metadata asal:
  - `source`: `core` atau `plugin`
  - `pluginId`: pemilik plugin saat `source="plugin"`
  - `optional`: apakah tool plugin bersifat opsional
- Operator dapat memanggil `tools.effective` (`operator.read`) untuk mengambil inventaris tool runtime-efektif bagi sesi.
  - `sessionKey` wajib.
  - Gateway menurunkan konteks runtime tepercaya dari sesi di sisi server alih-alih menerima auth atau konteks pengiriman yang dipasok pemanggil.
  - Respons bercakupan sesi dan mencerminkan apa yang dapat digunakan percakapan aktif saat ini, termasuk tool core, plugin, dan saluran.
- Operator dapat memanggil `skills.status` (`operator.read`) untuk mengambil inventaris skill yang terlihat bagi agen.
  - `agentId` bersifat opsional; hilangkan untuk membaca ruang kerja agen default.
  - Respons menyertakan kelayakan, persyaratan yang hilang, pemeriksaan config, dan opsi instalasi yang disanitasi tanpa mengekspos nilai rahasia mentah.
- Operator dapat memanggil `skills.search` dan `skills.detail` (`operator.read`) untuk metadata discovery ClawHub.
- Operator dapat memanggil `skills.install` (`operator.admin`) dalam dua mode:
  - Mode ClawHub: `{ source: "clawhub", slug, version?, force? }` menginstal folder skill ke direktori `skills/` ruang kerja agen default.
  - Mode installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    menjalankan aksi `metadata.openclaw.install` yang dideklarasikan pada host gateway.
- Operator dapat memanggil `skills.update` (`operator.admin`) dalam dua mode:
  - Mode ClawHub memperbarui satu slug terlacak atau semua instalasi ClawHub terlacak di ruang kerja agen default.
  - Mode config mem-patch nilai `skills.entries.<skillKey>` seperti `enabled`,
    `apiKey`, dan `env`.

## Persetujuan exec

- Saat permintaan exec memerlukan persetujuan, gateway menyiarkan `exec.approval.requested`.
- Klien operator menyelesaikannya dengan memanggil `exec.approval.resolve` (memerlukan scope `operator.approvals`).
- Untuk `host=node`, `exec.approval.request` harus menyertakan `systemRunPlan` (kanonis `argv`/`cwd`/`rawCommand`/metadata sesi). Permintaan yang tidak memiliki `systemRunPlan` akan ditolak.
- Setelah disetujui, panggilan `node.invoke system.run` yang diteruskan menggunakan kembali `systemRunPlan` kanonis tersebut sebagai konteks perintah/cwd/sesi yang otoritatif.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` antara prepare dan penerusan `system.run` final yang disetujui, gateway menolak run tersebut alih-alih mempercayai payload yang telah diubah.

## Fallback pengiriman agen

- Permintaan `agent` dapat menyertakan `deliver=true` untuk meminta pengiriman keluar.
- `bestEffortDeliver=false` mempertahankan perilaku ketat: target pengiriman yang tidak ter-resolve atau hanya-internal mengembalikan `INVALID_REQUEST`.
- `bestEffortDeliver=true` memungkinkan fallback ke eksekusi hanya-sesi saat tidak ada rute luar yang dapat dikirim yang dapat di-resolve (misalnya sesi internal/webchat atau config multi-saluran yang ambigu).

## Pembuatan versi

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/schema/protocol-schemas.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak ketidakcocokan.
- Skema + model dihasilkan dari definisi TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Konstanta klien

Klien referensi di `src/gateway/client.ts` menggunakan default berikut. Nilai-nilai ini stabil di seluruh protokol v3 dan merupakan baseline yang diharapkan untuk klien pihak ketiga.

| Konstanta                                 | Default                                               | Sumber                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout permintaan (per RPC)              | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff reconnect awal                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff reconnect maksimum                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp fast-retry setelah penutupan device-token | `250` ms                                         | `src/gateway/client.ts`                                    |
| Grace force-stop sebelum `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout default `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Interval tick default (pra `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Penutupan karena tick-timeout             | kode `4000` saat senyap melebihi `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Server mengiklankan `policy.tickIntervalMs`, `policy.maxPayload`,
dan `policy.maxBufferedBytes` yang efektif di `hello-ok`; klien harus menghormati nilai tersebut
alih-alih default pra-handshake.

## Auth

- Auth gateway shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth yang dikonfigurasi.
- Mode pembawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi pemeriksaan auth connect dari
  header permintaan alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` sepenuhnya melewati auth connect shared-secret; jangan ekspos mode itu pada ingress publik/tidak tepercaya.
- Setelah pairing, Gateway menerbitkan **device token** yang dibatasi pada role + scope koneksi. Token ini dikembalikan di `hello-ok.auth.deviceToken` dan harus dipersistenkan oleh klien untuk koneksi berikutnya.
- Klien harus mempersistenkan `hello-ok.auth.deviceToken` utama setelah setiap
  koneksi berhasil.
- Reconnect dengan device token yang **tersimpan** tersebut juga harus menggunakan kembali
  kumpulan scope yang disetujui yang tersimpan untuk token tersebut. Ini mempertahankan akses
  read/probe/status yang sudah diberikan dan menghindari penyempitan reconnect secara diam-diam ke
  scope implicit admin-only yang lebih sempit.
- Perakitan auth connect sisi klien (`selectConnectAuth` di
  `src/gateway/client.ts`):
  - `auth.password` bersifat ortogonal dan selalu diteruskan saat diatur.
  - `auth.token` diisi dalam urutan prioritas: shared token eksplisit terlebih dahulu,
    lalu `deviceToken` eksplisit, lalu token per-perangkat yang tersimpan (dikunci oleh
    `deviceId` + `role`).
  - `auth.bootstrapToken` dikirim hanya jika tidak ada yang di atas yang me-resolve
    `auth.token`. Shared token atau device token yang berhasil di-resolve akan menekannya.
  - Auto-promotion device token tersimpan pada retry satu kali
    `AUTH_TOKEN_MISMATCH` dibatasi hanya untuk **endpoint tepercaya** —
    loopback, atau `wss://` dengan `tlsFingerprint` yang di-pin. `wss://` publik
    tanpa pinning tidak memenuhi syarat.
- Entri `hello-ok.auth.deviceTokens` tambahan adalah token handoff bootstrap.
  Persistenkan hanya ketika koneksi menggunakan auth bootstrap pada transport tepercaya
  seperti `wss://` atau loopback/local pairing.
- Jika klien memasok `deviceToken` atau `scopes` **eksplisit**, kumpulan scope yang diminta pemanggil itu tetap menjadi otoritatif; scope cache hanya digunakan kembali saat klien menggunakan ulang token per-perangkat yang tersimpan.
- Device token dapat diputar/dicabut melalui `device.token.rotate` dan
  `device.token.revoke` (memerlukan scope `operator.pairing`).
- Penerbitan/rotasi token tetap dibatasi pada kumpulan role yang disetujui dan dicatat dalam entri pairing perangkat tersebut; memutar token tidak dapat memperluas perangkat ke role yang tidak pernah diberikan oleh persetujuan pairing.
- Untuk sesi token perangkat yang dipairing, pengelolaan perangkat bercakupan mandiri kecuali pemanggil juga memiliki `operator.admin`: pemanggil non-admin hanya dapat menghapus/mencabut/memutar entri perangkat **mereka sendiri**.
- `device.token.rotate` juga memeriksa kumpulan scope operator yang diminta terhadap scope sesi saat ini milik pemanggil. Pemanggil non-admin tidak dapat memutar token ke kumpulan scope operator yang lebih luas daripada yang sudah mereka miliki.
- Kegagalan auth menyertakan `error.details.code` plus petunjuk pemulihan:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Perilaku klien untuk `AUTH_TOKEN_MISMATCH`:
  - Klien tepercaya dapat mencoba satu retry terbatas dengan device token per-perangkat yang di-cache.
  - Jika retry itu gagal, klien harus menghentikan loop reconnect otomatis dan menampilkan panduan tindakan operator.

## Identitas perangkat + pairing

- Node harus menyertakan identitas perangkat yang stabil (`device.id`) yang diturunkan dari fingerprint keypair.
- Gateway menerbitkan token per perangkat + role.
- Persetujuan pairing diperlukan untuk `device.id` baru kecuali auto-approval lokal diaktifkan.
- Auto-approval pairing berpusat pada koneksi loopback lokal langsung.
- OpenClaw juga memiliki jalur self-connect backend/container-local yang sempit untuk alur helper shared-secret tepercaya.
- Koneksi tailnet atau LAN pada host yang sama tetap diperlakukan sebagai remote untuk pairing dan memerlukan persetujuan.
- Semua klien WS harus menyertakan identitas `device` selama `connect` (operator + node).
  Control UI dapat menghilangkannya hanya dalam mode berikut:
  - `gateway.controlUi.allowInsecureAuth=true` untuk kompatibilitas HTTP tidak aman khusus localhost.
  - auth operator Control UI `gateway.auth.mode: "trusted-proxy"` yang berhasil.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (langkah darurat, penurunan keamanan berat).
- Semua koneksi harus menandatangani nonce `connect.challenge` yang disediakan server.

### Diagnostik migrasi auth perangkat

Untuk klien lama yang masih menggunakan perilaku penandatanganan pra-challenge, `connect` sekarang mengembalikan kode detail `DEVICE_AUTH_*` di bawah `error.details.code` dengan `error.details.reason` yang stabil.

Kegagalan migrasi umum:

| Pesan                       | details.code                     | details.reason           | Arti                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Klien menghilangkan `device.nonce` (atau mengirim kosong). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Klien menandatangani dengan nonce lama/salah.      |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload signature tidak cocok dengan payload v2.   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp yang ditandatangani berada di luar skew yang diizinkan. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` tidak cocok dengan fingerprint public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/kanonisasi public key gagal.                |

Target migrasi:

- Selalu tunggu `connect.challenge`.
- Tanda tangani payload v2 yang menyertakan nonce server.
- Kirim nonce yang sama di `connect.params.device.nonce`.
- Payload signature yang disarankan adalah `v3`, yang mengikat `platform` dan `deviceFamily` selain field device/client/role/scopes/token/nonce.
- Signature `v2` lama tetap diterima demi kompatibilitas, tetapi pinning metadata paired-device tetap mengontrol kebijakan perintah saat reconnect.

## TLS + pinning

- TLS didukung untuk koneksi WS.
- Klien dapat secara opsional mem-pin fingerprint sertifikat gateway (lihat config `gateway.tls`
  plus `gateway.remote.tlsFingerprint` atau CLI `--tls-fingerprint`).

## Cakupan

Protokol ini mengekspos **API gateway penuh** (status, saluran, model, chat,
agent, sesi, node, persetujuan, dll.). Permukaan tepatnya ditentukan oleh skema
TypeBox di `src/gateway/protocol/schema.ts`.

## Terkait

- [Protokol bridge](/id/gateway/bridge-protocol)
- [Runbook Gateway](/id/gateway)
