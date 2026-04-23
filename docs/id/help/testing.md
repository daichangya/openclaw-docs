---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku Gateway + agent
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan tiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-23T09:22:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Pengujian

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sejumlah kecil runner Docker.

Doc ini adalah panduan “bagaimana kami menguji”:

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup)
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pre-push, debugging)
- Bagaimana live test menemukan kredensial dan memilih model/provider
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata

## Mulai cepat

Sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Menjalankan suite penuh lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Sebaiknya mulai dengan eksekusi terarah terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh test atau ingin keyakinan tambahan:

- Gate coverage: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (probe model + tool/image Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sapuan model live Docker: `pnpm test:docker:live-models`
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan provider.
  - Untuk rerun CI yang terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider sinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    serta `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan
    pemanggil terjadwal/rilisnya.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` terpasang, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  secara terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi bahwa JSON melaporkan Moonshot/K2.6 dan
  transkrip assistant menyimpan `usage.cost` yang dinormalisasi.

Tip: saat Anda hanya memerlukan satu kasus gagal, sebaiknya persempit live test melalui env var allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme qa-lab:

CI menjalankan QA Lab dalam workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan mock provider. `QA-Lab - All Lanes` berjalan setiap malam pada
`main` dan dari dispatch manual dengan gate paritas mock, lane Matrix live, dan
lane Telegram live yang dikelola Convex sebagai job paralel. `OpenClaw Release Checks`
menjalankan lane yang sama sebelum persetujuan rilis.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA yang didukung repo langsung pada host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    Gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyetel jumlah
    worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
    Anda menginginkan artefak tanpa exit code gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan eksperimental
    fixture dan protocol-mock tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam Linux VM Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path config provider live QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal beserta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding non-interaktif OpenAI API key, mengonfigurasi Telegram
    secara default, memverifikasi bahwa pengaktifan plugin menginstal dependensi runtime sesuai kebutuhan,
    menjalankan doctor, dan menjalankan satu giliran agent lokal terhadap endpoint OpenAI yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi terpaket yang sama
    dengan Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Memaketkan dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI terkonfigurasi, lalu mengaktifkan channel/plugin bawaan melalui edit
    config.
  - Memverifikasi bahwa penemuan setup membiarkan dependensi runtime plugin yang belum dikonfigurasi
    tetap tidak ada, eksekusi Gateway atau doctor pertama yang dikonfigurasi menginstal dependensi runtime
    setiap plugin bawaan sesuai kebutuhan, dan restart kedua tidak menginstal ulang dependensi
    yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa doctor pasca-pembaruan
    kandidat memperbaiki dependensi runtime channel bawaan tanpa perbaikan postinstall
    dari sisi harness.
- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk smoke testing protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA Matrix live terhadap homeserver Tuwunel sekali pakai berbasis Docker.
  - Host QA ini saat ini hanya untuk repo/dev. Instalasi OpenClaw terpaket tidak menyertakan
    `qa-lab`, sehingga tidak mengekspos `openclaw qa`.
  - Checkout repo memuat runner bawaan secara langsung; tidak diperlukan langkah instal plugin terpisah.
  - Memprovisikan tiga pengguna Matrix sementara (`driver`, `sut`, `observer`) plus satu room privat, lalu memulai child Gateway QA dengan plugin Matrix nyata sebagai transport SUT.
  - Secara default menggunakan image Tuwunel stabil yang dipin `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Override dengan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` saat Anda perlu menguji image lain.
  - Matrix tidak mengekspos flag sumber kredensial bersama karena lane tersebut memprovisikan pengguna sekali pakai secara lokal.
  - Menulis laporan QA Matrix, ringkasan, artefak event-teramati, dan log gabungan stdout/stderr di bawah `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA Telegram live terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa string ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama yang dipool. Gunakan mode env secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut serta dalam lease terpool.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa exit code gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan-teramati di bawah `.artifacts/qa-e2e/...`. Skenario yang membalas menyertakan RTT dari request kirim driver hingga balasan SUT yang teramati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak mengalami drift:

`qa-channel` tetap merupakan suite QA sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan top-level | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help |
| -------- | ------ | ------------------ | -------------- | ----------------- | ------------------------- | -------------------- | -------------- | ------------------ | ------------- |
| Matrix   | x      | x                  | x              | x                 | x                         | x                    | x              | x                  |               |
| Telegram | x      |                    |                |                   |                           |                      |                |                    | x             |

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, melakukan Heartbeat
pada lease tersebut selama lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env vars yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` jika tidak)

Env vars opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID penelusuran opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan lokal saja.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (pool add/remove/list) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `--json` untuk output yang dapat dibaca mesin dalam script dan utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Berhasil: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (hanya secret maintainer)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya secret maintainer)
  - Request: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pengaman lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang malformed.

### Menambahkan channel ke QA

Menambahkan channel ke sistem QA Markdown memerlukan tepat dua hal:

1. Adaptor transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan menambahkan root perintah QA top-level baru ketika host `qa-lab` bersama dapat
memiliki alurnya.

`qa-lab` memiliki mekanisme host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` yang lebih lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana Gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event masuk disuntikkan
- bagaimana pesan keluar diamati
- bagaimana transkrip dan status transport yang dinormalisasi diekspos
- bagaimana aksi yang didukung transport dieksekusi
- bagaimana reset atau cleanup khusus transport ditangani

Batas adopsi minimum untuk channel baru adalah:

1. Tetap jadikan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanisme khusus transport di dalam plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan root perintah pesaing.
   Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`.
   Jaga `runtime-api.ts` tetap ringan; eksekusi CLI dan runner lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasikan skenario Markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusan bersifat ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, tempatkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, pertahankan di plugin runner atau harness plugin tersebut.
- Jika skenario memerlukan kapabilitas baru yang dapat digunakan lebih dari satu channel, tambahkan helper generik alih-alih cabang khusus channel di `suite.ts`.
- Jika perilaku hanya bermakna untuk satu transport, pertahankan skenario tersebut khusus transport dan buat itu eksplisit dalam kontrak skenario.

Nama helper generik yang disukai untuk skenario baru adalah:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Alias kompatibilitas tetap tersedia untuk skenario yang ada, termasuk:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Pekerjaan channel baru sebaiknya menggunakan nama helper generik.
Alias kompatibilitas ada untuk menghindari migrasi flag day, bukan sebagai model untuk
penulisan skenario baru.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan ketidakstabilan/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Config: eksekusi tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-project menjadi config per-project untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan test node `ui` yang masuk allowlist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Unit test murni
  - In-process integration test (auth Gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
- Catatan project:
  - `pnpm test` tanpa target sekarang menjalankan dua belas config shard lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native raksasa. Ini mengurangi RSS puncak pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension menghambat suite yang tidak terkait.
  - `pnpm test --watch` tetap menggunakan graph project root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
  - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane yang di-scope terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup project root penuh.
  - `pnpm test:changed` memperluas path git yang berubah ke lane scoped yang sama ketika diff hanya menyentuh file source/test yang dapat dirutekan; edit config/setup tetap fallback ke rerun root-project yang luas.
  - `pnpm check:changed` adalah smart local gate normal untuk pekerjaan sempit. Perintah ini mengklasifikasikan diff ke core, core tests, extensions, extension tests, apps, docs, metadata rilis, dan tooling, lalu menjalankan lane typecheck/lint/test yang cocok. Perubahan Plugin SDK publik dan kontrak plugin menyertakan validasi extension karena extension bergantung pada kontrak inti tersebut. Version bump yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang terarah alih-alih suite penuh, dengan guard yang menolak perubahan package di luar field versi top-level.
  - Unit test yang ringan impor dari agent, command, plugin, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang stateful/berat runtime tetap berada di lane yang ada.
  - File source helper `plugin-sdk` dan `commands` terpilih juga memetakan eksekusi mode changed ke test sibling eksplisit di lane ringan tersebut, sehingga edit helper menghindari rerun suite berat penuh untuk direktori tersebut.
  - `auto-reply` sekarang memiliki tiga bucket khusus: helper inti top-level, integration test `reply.*` top-level, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness reply terberat agar tidak masuk ke test status/chunk/token yang murah.
- Catatan runner tertanam:
  - Saat Anda mengubah input penemuan message-tool atau konteks runtime Compaction,
    pertahankan kedua tingkat cakupan.
  - Tambahkan regresi helper terfokus untuk batas routing/normalisasi murni.
  - Juga pertahankan suite integrasi runner tertanam tetap sehat:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Suite tersebut memverifikasi bahwa ID yang di-scope dan perilaku Compaction tetap mengalir
    melalui jalur `run.ts` / `compact.ts` yang nyata; test khusus helper bukanlah
    pengganti yang memadai untuk jalur integrasi tersebut.
- Catatan pool:
  - Config Vitest dasar sekarang default ke `threads`.
  - Config Vitest bersama juga menetapkan `isolate: false` dan menggunakan runner non-isolated di seluruh config root projects, e2e, dan live.
  - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi sekarang juga berjalan pada runner non-isolated bersama.
  - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari config Vitest bersama.
  - Launcher bersama `scripts/run-vitest.mjs` sekarang juga menambahkan `--no-maglev` untuk child process Node Vitest secara default guna mengurangi churn kompilasi V8 selama eksekusi lokal besar. Atur `OPENCLAW_VITEST_ENABLE_MAGLEV=1` jika Anda perlu membandingkan terhadap perilaku V8 bawaan.
- Catatan iterasi lokal cepat:
  - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh sebuah diff.
  - Hook pre-commit menjalankan `pnpm check:changed --staged` setelah formatting/linting staged, sehingga commit core-only tidak menanggung biaya test extension kecuali menyentuh kontrak publik yang berhadapan dengan extension. Commit yang hanya menyentuh metadata rilis tetap berada di lane versi/config/dependensi root yang terarah.
  - Jika set perubahan staged yang tepat sudah divalidasi dengan gate yang setara atau lebih kuat, gunakan `scripts/committer --fast "<message>" <files...>` untuk melewati hanya rerun hook changed-scope. Format/lint staged tetap berjalan. Sebutkan gate yang telah diselesaikan dalam handoff Anda. Ini juga dapat diterima setelah kegagalan hook flaky yang terisolasi dijalankan ulang dan lolos dengan bukti yang di-scope.
  - `pnpm test:changed` merutekan melalui lane scoped saat path yang berubah terpetakan dengan bersih ke suite yang lebih kecil.
  - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
  - Auto-scaling worker lokal sengaja lebih konservatif sekarang dan juga mundur saat load average host sudah tinggi, sehingga beberapa eksekusi Vitest bersamaan tidak terlalu merusak secara default.
  - Config Vitest dasar menandai file projects/config sebagai `forceRerunTriggers` sehingga rerun mode changed tetap benar saat wiring test berubah.
  - Config menjaga `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung; atur `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan satu lokasi cache eksplisit untuk profiling langsung.
- Catatan debug performa:
  - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest beserta output rincian impor.
  - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan jalur root-project native untuk diff yang sudah di-commit tersebut dan mencetak wall time plus max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` mem-benchmark tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan config Vitest root.
  - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk overhead startup dan transform Vitest/Vite.
  - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

### Stabilitas (Gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway local loopback nyata dengan diagnostik diaktifkan secara default
  - Menggerakkan churn pesan Gateway sintetis, memori, dan payload besar melalui jalur event diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Memastikan recorder tetap bounded, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi turun kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sama seperti bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instance
  - Surface WebSocket/HTTP, pairing Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan di pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak dibanding unit test (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` + eksekusi SSH nyata
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan Gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau script wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan test live plugin bawaan di bawah `extensions/`
- Default: **aktif** oleh `pnpm test:live` (mengatur `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keanehan pemanggilan tool, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Memang tidak stabil untuk CI secara desain (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Memakan biaya / menggunakan rate limit
  - Sebaiknya jalankan subset yang dipersempit, bukan “semuanya”
- Eksekusi live memuat `~/.profile` untuk mengambil API key yang belum ada.
- Secara default, eksekusi live tetap mengisolasi `HOME` dan menyalin materi config/auth ke home test sementara agar fixture unit tidak dapat mengubah `~/.openclaw` asli Anda.
- Atur `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang sengaja perlu live test menggunakan direktori home asli Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan `~/.profile` tambahan dan membisukan log bootstrap Gateway/keramaian Bonjour. Atur `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (khusus provider): atur `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; test akan mencoba ulang pada respons rate limit.
- Output progres/Heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga panggilan provider yang panjang terlihat tetap aktif bahkan saat tangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/Gateway mengalir segera selama eksekusi live.
  - Setel Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Setel Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/test: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Live: sapuan kapabilitas Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh Node Android yang terhubung dan memastikan perilaku kontrak perintah.
- Cakupan:
  - Setup manual/prasyarat (suite ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` Gateway per perintah untuk Node Android yang dipilih.
- Pra-setup yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke Gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail setup Android lengkap: [Android App](/id/platforms/android)

## Live: smoke model (key profil)

Live test dibagi menjadi dua layer agar kita dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kita apakah provider/model dapat menjawab sama sekali dengan key yang diberikan.
- “Smoke Gateway” memberi tahu kita apakah pipeline Gateway+agent penuh berfungsi untuk model tersebut (sesi, riwayat, tools, kebijakan sandbox, dll.).

### Layer 1: penyelesaian model langsung (tanpa Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi terarah bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Atur `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) agar suite ini benar-benar berjalan; jika tidak, suite akan skip agar `pnpm test:live` tetap fokus pada smoke Gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sapuan modern/all default ke batas sinyal tinggi yang dikurasi; atur `OPENCLAW_LIVE_MAX_MODELS=0` untuk sapuan modern yang menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana key berasal:
  - Secara default: profile store dan fallback env
  - Atur `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa **hanya profile store**
- Mengapa ini ada:
  - Memisahkan “API provider rusak / key tidak valid” dari “pipeline agent Gateway rusak”
  - Menampung regresi kecil dan terisolasi (contoh: OpenAI Responses/Codex Responses reasoning replay + alur tool-call)

### Layer 2: smoke Gateway + agent dev (apa yang sebenarnya dilakukan "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan Gateway in-process
  - Membuat/menambal sesi `agent:dev:*` (override model per eksekusi)
  - Mengiterasi model-dengan-key dan memastikan:
    - respons “bermakna” (tanpa tools)
    - pemanggilan tool nyata berfungsi (probe read)
    - probe tool tambahan opsional (probe exec+read)
    - jalur regresi OpenAI (hanya tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: test menulis file nonce di workspace dan meminta agent `read` file itu lalu mengembalikan nonce.
  - Probe `exec+read`: test meminta agent `exec` untuk menulis nonce ke file sementara, lalu `read` kembali.
  - Probe gambar: test melampirkan PNG hasil generate (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau atur `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sapuan Gateway modern/all default ke batas sinyal tinggi yang dikurasi; atur `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sapuan modern yang menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “OpenRouter semuanya”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe tool + gambar selalu aktif pada live test ini:
  - probe `read` + probe `exec+read` (stress tool)
  - probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Test menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mem-parse lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang dapat Anda uji di mesin Anda (dan ID `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agent menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik extension yang memilikinya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku command/args/gambar berasal dari metadata plugin backend CLI yang memilikinya.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen gambar diteruskan saat `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` untuk menonaktifkan probe kontinuitas sesi yang sama default Claude Sonnet -> Opus (atur ke `1` untuk memaksanya aktif saat model yang dipilih mendukung target switch).

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker single-provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini me-resolve metadata smoke CLI dari extension yang memilikinya, lalu menginstal package CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan portabel Claude Code melalui salah satu dari `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Perintah ini pertama-tama membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan env API key Anthropic. Lane langganan ini menonaktifkan probe Claude MCP/tool dan gambar secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan tambahan alih-alih batas paket langganan normal.
- Smoke backend CLI live sekarang menguji alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu pemanggilan tool MCP `cron` yang diverifikasi melalui CLI Gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agent ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan channel pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi bahwa tindak lanjut tersebut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agent ACP di Docker: `claude,codex,gemini`
  - Agent ACP untuk `pnpm test:live ...` langsung: `claude`
  - Channel sintetis: konteks percakapan bergaya Slack DM
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Catatan:
  - Lane ini menggunakan surface `chat.send` Gateway dengan field originating-route sintetis khusus admin sehingga test dapat melampirkan konteks channel pesan tanpa berpura-pura mengirimkannya secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak diatur, test menggunakan registry agent bawaan plugin `acpx` tertanam untuk agent harness ACP yang dipilih.

Contoh:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-acp-bind
```

Resep Docker agent tunggal:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke bind ACP terhadap semua agent CLI live yang didukung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` untuk mempersempit matriks.
- Runner ini memuat `~/.profile`, men-stage materi auth CLI yang cocok ke dalam container, menginstal `acpx` ke prefix npm writable, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) jika belum ada.
- Di dalam Docker, runner mengatur `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` sehingga acpx mempertahankan env var provider dari profile yang dimuat agar tetap tersedia bagi harness CLI child.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik plugin melalui method `agent`
  Gateway normal:
  - memuat plugin `codex` bawaan
  - memilih `OPENCLAW_AGENT_RUNTIME=codex`
  - mengirim giliran agent Gateway pertama ke `codex/gpt-5.4`
  - mengirim giliran kedua ke sesi OpenClaw yang sama dan memverifikasi thread app-server
    dapat dilanjutkan
  - menjalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional menjalankan dua probe shell escalated yang ditinjau Guardian: satu perintah
    jinak yang seharusnya disetujui dan satu unggahan secret palsu yang seharusnya
    ditolak sehingga agent bertanya kembali
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `codex/gpt-5.4`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ini mengatur `OPENCLAW_AGENT_HARNESS_FALLBACK=none` sehingga harness Codex
  yang rusak tidak dapat lolos dengan diam-diam fallback ke Pi.
- Auth: `OPENAI_API_KEY` dari shell/profile, ditambah salinan opsional
  `~/.codex/auth.json` dan `~/.codex/config.toml`

Resep lokal:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner ini memuat `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file auth CLI Codex bila ada, menginstal `@openai/codex` ke prefix npm writable yang di-mount, men-stage source tree, lalu hanya menjalankan live test harness Codex.
- Docker mengaktifkan probe gambar, MCP/tool, dan Guardian secara default. Atur
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda memerlukan eksekusi debug yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sama dengan config live
  test sehingga fallback `openai-codex/*` atau Pi tidak dapat menyembunyikan regresi
  harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak flaky:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agent bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (auth terpisah + keanehan tooling).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API ter-host milik Google melalui HTTP (auth API key / profil); inilah yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan binary `gemini` lokal; ia memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/perbedaan versi).

## Live: matriks model (cakupan yang kami uji)

Tidak ada “daftar model CI” tetap (live bersifat opt-in), tetapi berikut adalah model **yang direkomendasikan** untuk dicakup secara rutin pada mesin dev dengan key.

### Set smoke modern (pemanggilan tool + gambar)

Ini adalah eksekusi “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.4` (opsional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke Gateway dengan tools + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan tool (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.4` (atau `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus untuk dimiliki):

- xAI: `xai/grok-4` (atau versi terbaru yang tersedia)
- Mistral: `mistral/`… (pilih satu model yang mampu `tools` yang Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: pengiriman gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model yang mampu gambar dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI yang mampu vision, dll.) untuk menguji probe gambar.

### Aggregator / gateway alternatif

Jika Anda mengaktifkan key, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mampu tool+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy kompatibel OpenAI/Anthropic apa pun (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba meng-hardcode “semua model” dalam docs. Daftar yang otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda + key apa pun yang tersedia.

## Kredensial (jangan pernah commit)

Live test menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, live test seharusnya menemukan key yang sama.
- Jika live test mengatakan “tidak ada kredensial”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil auth per-agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud “profile keys” dalam live test)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state lama: `~/.openclaw/credentials/` (disalin ke home live staged saat ada, tetapi bukan profile-key store utama)
- Eksekusi live lokal menyalin config aktif, file `auth-profiles.json` per-agent, `credentials/` lama, dan direktori auth CLI eksternal yang didukung ke home test sementara secara default; home live staged melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tetap menjauh dari workspace host asli Anda.

Jika Anda ingin mengandalkan key env (misalnya diekspor di `~/.profile`), jalankan test lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (mereka dapat me-mount `~/.profile` ke dalam container).

## Live Deepgram (transkripsi audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Test: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menguji jalur image, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `models.providers.comfy.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau registrasi plugin

## Live pembuatan gambar

- Test: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap plugin provider pembuatan gambar yang terdaftar
  - Memuat env var provider yang hilang dari login shell Anda (`~/.profile`) sebelum probing
  - Menggunakan API key live/env lebih dahulu daripada auth profile yang disimpan secara default, sehingga key test stale di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Menjalankan varian stock pembuatan gambar melalui kapabilitas runtime bersama:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bawaan saat ini yang dicakup:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Penyempitan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override yang hanya berbasis env

## Live pembuatan musik

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menguji jalur provider pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum probing
  - Menggunakan API key live/env lebih dahulu daripada auth profile yang disimpan secara default, sehingga key test stale di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan bila tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sapuan bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override yang hanya berbasis env

## Live pembuatan video

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur provider pembuatan video bawaan bersama
  - Default ke jalur smoke yang aman untuk rilis: provider non-FAL, satu request text-to-video per provider, prompt lobster satu detik, dan batas operasi per provider dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean sisi provider dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum probing
  - Menggunakan API key live/env lebih dahulu daripada auth profile yang disimpan secara default, sehingga key test stale di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Hanya menjalankan `generate` secara default
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan bila tersedia:
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model terpilih menerima input gambar lokal berbasis buffer dalam sapuan bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model terpilih menerima input video lokal berbasis buffer dalam sapuan bersama
  - Provider `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote
  - Cakupan Vydra khusus provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan `veo3` text-to-video ditambah lane `kling` yang secara default menggunakan fixture URL gambar remote
  - Cakupan live `videoToVideo` saat ini:
    - hanya `runway` saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi remote `http(s)` / MP4
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur itu tidak diterima dalam sapuan bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses inpaint/remix video khusus org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap provider dalam sapuan default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi tiap provider demi eksekusi smoke yang agresif
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override yang hanya berbasis env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var provider yang hilang dari `~/.profile`
  - Mempersempit otomatis setiap suite ke provider yang saat ini memiliki auth yang dapat digunakan secara default
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (opsional, pemeriksaan "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori config dan workspace lokal Anda (serta memuat `~/.profile` jika di-mount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner Docker live secara default menggunakan batas smoke yang lebih kecil agar sapuan Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  memang ingin pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk dua lane Docker live. Perintah ini juga membangun satu image `scripts/e2e/Dockerfile` bersama melalui `test:docker:e2e-build` dan menggunakannya kembali untuk runner smoke container E2E yang menguji aplikasi hasil build.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau lebih container nyata dan memverifikasi jalur integrasi tingkat tinggi.

Runner Docker model live juga hanya melakukan bind-mount pada home auth CLI yang dibutuhkan (atau semua yang didukung saat eksekusi tidak dipersempit), lalu menyalinnya ke home container sebelum eksekusi sehingga OAuth CLI eksternal dapat me-refresh token tanpa mengubah auth store host:

- Model langsung: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi bahwa mengaktifkan plugin menginstal dependensi runtime-nya sesuai kebutuhan, menjalankan doctor, dan menjalankan satu giliran agent OpenAI yang dimock. Gunakan ulang tarball prabuild dengan `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regresi reasoning minimal OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang dimock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa schema provider menolak dan memeriksa bahwa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang sudah di-seed + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Tool bundle MCP Pi (server stdio MCP nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (Gateway nyata + teardown child stdio MCP setelah cron terisolasi dan eksekusi subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke install + alias `/plugin` + semantik restart bundel Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke update plugin tidak berubah: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata reload config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependensi runtime plugin bawaan: `pnpm test:docker:bundled-channel-deps` secara default membangun image runner Docker kecil, membangun dan memaketkan OpenClaw sekali pada host, lalu me-mount tarball tersebut ke setiap skenario instalasi Linux. Gunakan ulang image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang sudah ada dengan `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Persempit dependensi runtime plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk membangun lebih dulu dan menggunakan ulang image built-app bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat diatur. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama remote, script akan menariknya jika belum ada secara lokal. Test Docker QR dan installer tetap mempertahankan Dockerfile mereka sendiri karena mereka memvalidasi perilaku package/installasi, bukan runtime built-app bersama.

Runner Docker model live juga melakukan bind-mount checkout saat ini sebagai read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang tepat.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle sehingga eksekusi live Docker tidak menghabiskan waktu ber menit-menit menyalin
artefak yang spesifik mesin.
Mereka juga mengatur `OPENCLAW_SKIP_CHANNELS=1` sehingga probe live Gateway tidak memulai
worker channel Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
Gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ia memulai
container Gateway OpenClaw dengan endpoint HTTP kompatibel OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap Gateway tersebut, sign in melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
request chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Eksekusi pertama dapat terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan cold-start setup-nya sendiri.
Lane ini mengharapkan key model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam eksekusi yang didockerisasi.
Eksekusi yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ia mem-boot container
Gateway yang sudah di-seed, memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman keluar, serta notifikasi channel +
izin bergaya Claude melalui bridge stdio MCP yang nyata. Pemeriksaan notifikasi
menginspeksi frame stdio MCP mentah secara langsung sehingga smoke memvalidasi apa yang
sebenarnya dipancarkan bridge, bukan hanya apa yang kebetulan diekspos oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan
key model live. Ia membangun image Docker repo, memulai server probe stdio MCP nyata
di dalam container, mematerialisasikan server itu melalui runtime bundle MCP Pi
tertanam, mengeksekusi tool, lalu memverifikasi bahwa `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan key model live.
Ia memulai Gateway yang sudah di-seed dengan server probe stdio MCP nyata, menjalankan
satu giliran Cron terisolasi dan satu giliran child one-shot `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap eksekusi.

Smoke thread plain-language ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan script ini untuk alur kerja regresi/debug. Script ini mungkin dibutuhkan lagi untuk validasi routing thread ACP, jadi jangan dihapus.

Env vars yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan dimuat sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env vars yang dimuat dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount sebagai read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eksekusi provider yang dipersempit hanya me-mount direktori/file yang dibutuhkan yang diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit eksekusi
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada pada rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari profile store (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh Gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Pemeriksaan kewarasan docs

Jalankan pemeriksaan docs setelah edit doc: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (OpenAI dimock, Gateway + loop agent nyata): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth dipaksakan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval keandalan agent (Skills)

Kami sudah memiliki beberapa test aman-CI yang berperilaku seperti “eval keandalan agent”:

- Pemanggilan tool mock melalui loop Gateway + agent nyata (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Decisioning:** ketika Skills terdaftar dalam prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Compliance:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-giliran yang memastikan urutan tool, carryover riwayat sesi, dan batas sandbox.

Eval masa depan sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan mock provider untuk memastikan pemanggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Eval live opsional (opt-in, dibatasi env) hanya setelah suite aman-CI tersedia.

## Test kontrak (bentuk plugin dan channel)

Test kontrak memverifikasi bahwa setiap plugin dan channel yang terdaftar sesuai dengan
kontrak interface-nya. Test ini mengiterasi semua plugin yang ditemukan dan menjalankan satu suite
asersi bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku session binding
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi channel
- **threading** - Penanganan thread ID
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin channel atau provider
- Setelah merefaktor pendaftaran atau penemuan plugin

Test kontrak berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan di live:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (provider yang dimock/di-stub, atau tangkap transformasi bentuk request yang tepat)
- Jika secara inheren hanya live (rate limit, kebijakan auth), pertahankan live test tetap sempit dan opt-in melalui env var
- Sebaiknya targetkan layer terkecil yang menangkap bug:
  - bug konversi/replay request provider → direct models test
  - bug pipeline sesi/riwayat/tool Gateway → smoke Gateway live atau test mock Gateway aman-CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu memastikan exec ID traversal-segment ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test ini sengaja gagal pada target ID yang tidak terklasifikasi sehingga kelas baru tidak dapat dilewati secara diam-diam.
