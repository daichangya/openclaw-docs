---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku gateway + agent
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan masing-masing pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-25T13:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw memiliki tiga suite Vitest (unit/integration, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "bagaimana kami menguji":

- Apa yang dicakup oleh setiap suite (dan apa yang dengan sengaja _tidak_ dicakup).
- Perintah mana yang harus dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Bagaimana live test menemukan kredensial dan memilih model/provider.
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata.

## Mulai cepat

Hampir setiap hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Menjalankan suite penuh lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run yang ditargetkan terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe tool/gambar gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan satu giliran teks plus probe kecil bergaya baca-file.
    Model yang metadata-nya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E reusable dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard per provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider sinyal-tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan
    pemanggil scheduled/release-nya.
- Smoke native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke perintah rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in belt-and-suspenders untuk permukaan perintah rescue message-channel.
    Ini menjalankan `/crestodian status`, mengantre perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi jalur tulis audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa konfigurasi dengan Claude CLI palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan config terketik yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari state dir OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agent/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Jalur setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` tersetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip assistant menyimpan `usage.cost` yang dinormalisasi.

Tip: saat Anda hanya memerlukan satu kasus gagal, utamakan mempersempit live test melalui env var allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme qa-lab:

CI menjalankan QA Lab di workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan mock provider. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan parity gate mock, lane Matrix live, dan lane Telegram live yang dikelola Convex sebagai job paralel. `OpenClaw Release Checks`
menjalankan lane yang sama sebelum persetujuan rilis.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario yang dipilih secara paralel secara default dengan worker gateway terisolasi. `qa-channel` default ke concurrency 4 (dibatasi oleh jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda menginginkan artefak tanpa exit code gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture dan protocol-mock eksperimental tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    API key provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME` saat ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, memasangnya secara global di
    Docker, menjalankan onboarding non-interaktif OpenAI API key, mengonfigurasi Telegram
    secara default, memverifikasi bahwa mengaktifkan Plugin memasang dependency runtime sesuai kebutuhan,
    menjalankan doctor, dan menjalankan satu giliran agent lokal terhadap endpoint OpenAI yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi paket yang sama dengan Discord.
- `pnpm test:docker:npm-telegram-live`
  - Memasang paket OpenClaw terbitan di Docker, menjalankan onboarding paket terpasang,
    mengonfigurasi Telegram melalui CLI yang terpasang, lalu menggunakan ulang lane QA Telegram live dengan paket terpasang tersebut sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan role secret. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan role secret Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` meng-override
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow tersebut menggunakan
    environment `qa-live-shared` dan lease kredensial Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Mengemas dan memasang build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI terkonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui pengeditan config.
  - Memverifikasi bahwa penemuan setup membiarkan dependency runtime Plugin yang belum dikonfigurasi tetap tidak ada, bahwa Gateway atau doctor pertama yang dikonfigurasi memasang dependency runtime tiap Plugin bawaan sesuai kebutuhan, dan restart kedua tidak memasang ulang dependency yang sudah diaktifkan.
  - Juga memasang baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa
    doctor pasca-pembaruan kandidat memperbaiki dependency runtime channel bawaan tanpa perbaikan postinstall di sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi paket native di seluruh guest Parallels. Setiap
    platform yang dipilih pertama-tama memasang paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` terpasang di guest yang sama dan memverifikasi versi terpasang, status pembaruan, kesiapan gateway, dan satu giliran agent lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per lane.
  - Bungkus run lokal yang panjang dalam timeout host agar stall transport Parallels
    tidak menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar hang.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam doctor pasca-pembaruan/perbaikan dependency runtime pada guest dingin; itu tetap sehat saat log debug npm bertingkat terus berjalan.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat bertabrakan pada
    restore snapshot, penyajian paket, atau state gateway guest.
  - Bukti pasca-pembaruan menjalankan permukaan Plugin bawaan normal karena
    facade capability seperti speech, image generation, dan media
    understanding dimuat melalui API runtime bawaan bahkan saat giliran agent itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk pengujian smoke protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai berbasis Docker.
  - Host QA ini saat ini hanya untuk repo/dev. Instalasi OpenClaw terpaket tidak mengirim
    `qa-lab`, sehingga tidak mengekspos `openclaw qa`.
  - Checkout repo memuat runner bawaan secara langsung; tidak diperlukan langkah
    instalasi Plugin terpisah.
  - Menyediakan tiga pengguna Matrix sementara (`driver`, `sut`, `observer`) plus satu room private, lalu memulai child gateway QA dengan Plugin Matrix nyata sebagai transport SUT.
  - Secara default menggunakan image Tuwunel stabil yang dipin `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Override dengan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` saat Anda perlu menguji image lain.
  - Matrix tidak mengekspos flag sumber kredensial bersama karena lane ini menyediakan pengguna sekali pakai secara lokal.
  - Menulis laporan QA Matrix, ringkasan, artefak observed-events, dan log output gabungan stdout/stderr di bawah `.artifacts/qa-e2e/...`.
  - Memancarkan progres secara default dan memberlakukan timeout run keras dengan `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (default 30 menit). Cleanup dibatasi oleh `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` dan kegagalan menyertakan perintah pemulihan `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup private nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama yang dipool. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk melakukan opt-in ke lease yang dipool.
  - Keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda menginginkan artefak tanpa exit code gagal.
  - Memerlukan dua bot berbeda di grup private yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak melenceng:

`qa-channel` tetap menjadi suite QA sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan level atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help |
| -------- | ------ | ------------------ | --------------- | ------------------ | ------------------------- | ------------------- | -------------- | ---------------- | ------------- |
| Matrix   | x      | x                  | x               | x                  | x                         | x                   | x              | x                |               |
| Telegram | x      |                    |                 |                    |                           |                     |                |                  | x             |

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, mengirim heartbeat
untuk lease tersebut selama lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env var yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk role yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan role kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` jika tidak)

Env var opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan lokal saja.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (add/remove/list pool) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, broker secret,
prefix endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin di skrip dan utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukses: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukses: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (khusus secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Sukses: `{ status: "ok", credential }`
- `POST /admin/remove` (khusus secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Sukses: `{ status: "ok", changed, credential }`
  - Guard lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (khusus secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Sukses: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang malformed.

### Menambahkan saluran ke QA

Menambahkan saluran ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk saluran tersebut.
2. Paket skenario yang menjalankan kontrak saluran.

Jangan tambahkan root perintah QA level atas baru jika host bersama `qa-lab` dapat
memiliki alur tersebut.

`qa-lab` memiliki mekanik host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound disuntikkan
- bagaimana pesan outbound diamati
- bagaimana transkrip dan status transport ternormalisasi diekspos
- bagaimana aksi berbasis transport dieksekusi
- bagaimana reset atau cleanup khusus transport ditangani

Batas adopsi minimum untuk saluran baru adalah:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host bersama `qa-lab`.
3. Pertahankan mekanik khusus transport di dalam Plugin runner atau harness saluran.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan root perintah yang bersaing.
   Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`.
   Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di belakang entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan satu kali di `qa-lab`, tempatkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport saluran, simpan di Plugin runner atau harness Plugin tersebut.
- Jika skenario memerlukan capability baru yang dapat digunakan lebih dari satu saluran, tambahkan helper generik alih-alih cabang khusus saluran di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario itu khusus transport dan buat itu eksplisit dalam kontrak skenario.

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

Pekerjaan saluran baru harus menggunakan nama helper generik.
Alias kompatibilitas ada untuk menghindari migrasi flag day, bukan sebagai model untuk
penulisan skenario baru.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang juga meningkat):

### Unit / integration (default)

- Perintah: `pnpm test`
- Konfigurasi: run yang tidak ditargetkan menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris inti/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian node `ui` yang di-whitelist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth gateway, perutean, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane bercakupan">

    - `pnpm test` yang tidak ditargetkan menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite yang tidak terkait kelaparan.
    - `pnpm test --watch` tetap menggunakan grafik proyek root `vitest.config.ts` native, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane bercakupan terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup penuh proyek root.
    - `pnpm test:changed` memperluas path git yang berubah ke lane bercakupan yang sama saat diff hanya menyentuh file source/test yang dapat dirutekan; edit konfigurasi/setup tetap fallback ke rerun proyek root yang luas.
    - `pnpm check:changed` adalah gate lokal pintar normal untuk pekerjaan sempit. Ini mengklasifikasikan diff menjadi core, core tests, extensions, extension tests, apps, docs, metadata rilis, dan tooling, lalu menjalankan lane typecheck/lint/test yang sesuai. Perubahan SDK Plugin publik dan plugin-contract mencakup satu lintasan validasi extension karena extension bergantung pada kontrak inti tersebut. Version bump yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan alih-alih suite penuh, dengan guard yang menolak perubahan paket di luar field versi level atas.
    - Pengujian unit import-light dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/runtime-heavy tetap di lane yang ada.
    - File source helper `plugin-sdk` dan `commands` terpilih juga memetakan run changed-mode ke pengujian saudara eksplisit dalam lane ringan tersebut, sehingga edit helper menghindari rerun seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki tiga bucket khusus: helper inti level atas, pengujian integrasi `reply.*` level atas, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness balasan terberat tetap jauh dari pengujian status/chunk/token yang murah.

  </Accordion>

  <Accordion title="Cakupan runner tersemat">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime Compaction,
      pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper yang terfokus untuk batas perutean dan normalisasi murni.
    - Jaga suite integrasi runner tersemat tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa scoped id dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` yang nyata; pengujian helper-saja
      bukan pengganti yang cukup untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Pool Vitest dan default isolasi">

    - Konfigurasi dasar Vitest default ke `threads`.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-isolated di seluruh proyek root, konfigurasi e2e, dan live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi berjalan pada
      runner non-isolated bersama juga.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node child Vitest
      secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan
      perilaku V8 bawaan.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menunjukkan lane arsitektural mana yang dipicu oleh suatu diff.
    - Hook pre-commit hanya untuk formatting. Hook ini melakukan restage file yang telah diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      membutuhkan gate lokal pintar. Perubahan SDK Plugin publik dan plugin-contract
      mencakup satu lintasan validasi extension.
    - `pnpm test:changed` merutekan melalui lane bercakupan saat path yang berubah
      dipetakan dengan bersih ke suite yang lebih kecil.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku perutean yang sama,
      hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      saat load average host sudah tinggi, sehingga beberapa run Vitest bersamaan
      secara default mengurangi dampak.
    - Konfigurasi dasar Vitest menandai proyek/file konfigurasi sebagai
      `forceRerunTriggers` sehingga rerun changed-mode tetap benar saat wiring pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada
      host yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda ingin
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi import Vitest plus
      output rincian import.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Saat satu pengujian panas masih menghabiskan sebagian besar waktunya di startup import,
      pertahankan dependency berat di belakang seam lokal sempit `*.runtime.ts` dan
      mock seam tersebut secara langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya ke `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan rute
      `test:changed` dengan path proyek root native untuk diff yang sudah di-commit itu dan mencetak wall time plus max RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` membenchmark worktree kotor saat ini
      dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik diaktifkan secara default
  - Menjalankan churn pesan gateway, memori, dan payload besar sintetis melalui jalur event diagnostik
  - Mengueri `diagnostics.stability` melalui WS RPC Gateway
  - Mencakup helper persistensi stability bundle diagnostik
  - Menegaskan perekam tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali turun ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sama seperti repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi maksimum 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan di pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak daripada pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menjalankan backend OpenShell OpenClaw melalui `sandbox ssh-config` + SSH exec yang nyata
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau wrapper script

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bawaan di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keanehan pemanggilan tool, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Tidak stabil untuk CI secara sengaja (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan biaya / menggunakan rate limit
  - Sebaiknya menjalankan subset yang dipersempit alih-alih “semuanya”
- Run live melakukan source `~/.profile` untuk mengambil API key yang belum ada.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin materi config/auth ke temp test home sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang ingin live test menggunakan direktori home nyata Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: mempertahankan output progres `[live] ...`, tetapi menekan notifikasi tambahan `~/.profile` dan membisukan log bootstrap Gateway/Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi API key (khusus provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian akan retry pada respons rate limit.
- Output progres/heartbeat:
  - Suite live kini memancarkan baris progres ke stderr sehingga panggilan provider yang lama tampak aktif bahkan saat penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir segera selama run live.
  - Sesuaikan heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex,
dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus penanganan kredensial untuk run live — lihat
[Pengujian — suite live](/id/help/testing-live).

## Runner Docker (opsional “berfungsi di Linux”)

Runner Docker ini terbagi menjadi dua bucket:

- Runner model-live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori config dan workspace lokal Anda (serta melakukan source `~/.profile` jika di-mount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  secara eksplisit menginginkan pemindaian besar yang menyeluruh.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk lane Docker live. Ini juga membangun satu image `scripts/e2e/Dockerfile` bersama melalui `test:docker:e2e-build` dan menggunakannya kembali untuk runner smoke kontainer E2E yang menjalankan aplikasi hasil build. Agregat ini menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sedangkan batas resource menjaga lane live berat, npm-install, dan multi-service agar tidak semuanya mulai sekaligus. Default-nya 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki kapasitas lebih. Runner menjalankan preflight Docker secara default, menghapus kontainer E2E OpenClaw yang basi, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane berbobot tanpa membangun atau menjalankan Docker.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau lebih kontainer nyata dan memverifikasi jalur integrasi tingkat tinggi.

Runner Docker model-live juga bind-mount hanya auth home CLI yang diperlukan (atau semua yang didukung saat run tidak dipersempit), lalu menyalinnya ke home kontainer sebelum run sehingga OAuth CLI eksternal dapat me-refresh token tanpa memodifikasi penyimpanan auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan OpenCode ketat melalui `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent tarball npm: `pnpm test:docker:npm-onboard-channel-agent` memasang tarball OpenClaw yang telah dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi doctor memperbaiki dependency runtime Plugin yang diaktifkan, dan menjalankan satu giliran agent OpenAI yang dimock. Gunakan ulang tarball yang telah dibangun dengan `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti saluran dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, memasangnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan alih-alih hang. Gunakan ulang tarball yang telah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang telah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke update default ke npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Pemeriksaan installer non-root menyimpan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm yang duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut saat cakupan `npm install -g` langsung diperlukan.
- Smoke CLI agents delete shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) secara default membangun image Dockerfile root, menanam dua agent dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku retensi workspace. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Regresi minimal reasoning OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang dimock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa provider schema reject dan memeriksa detail mentah muncul di log Gateway.
- Bridge saluran MCP (Gateway yang ditanam + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (server MCP stdio nyata + smoke allow/deny profile Pi tersemat): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (Gateway nyata + teardown child MCP stdio setelah cron terisolasi dan run subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke install + alias `/plugin` + semantik restart bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
- Smoke unchanged update Plugin: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Dependency runtime Plugin bawaan: `pnpm test:docker:bundled-channel-deps` secara default membangun image runner Docker kecil, membangun dan mengemas OpenClaw sekali di host, lalu me-mount tarball tersebut ke setiap skenario instalasi Linux. Gunakan ulang image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang ada dengan `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Agregat Docker penuh memaketkan tarball ini sekali, lalu me-shard pemeriksaan saluran bawaan ke lane independen, termasuk lane update terpisah untuk Telegram, Discord, Slack, Feishu, memory-lancedb, dan ACPX. Gunakan `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` untuk mempersempit matriks saluran saat menjalankan lane bawaan secara langsung, atau `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` untuk mempersempit skenario update. Lane ini juga memverifikasi bahwa `channels.<id>.enabled=false` dan `plugins.entries.<id>.enabled=false` menekan perbaikan doctor/dependency runtime.
- Persempit dependency runtime Plugin bawaan saat mengiterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk prebuild dan menggunakan ulang image built-app bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika image tersebut belum ada secara lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile mereka sendiri karena memvalidasi perilaku paket/instalasi alih-alih runtime built-app bersama.

Runner Docker model-live juga melakukan bind-mount checkout saat ini secara read-only dan
men-stage-nya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` lokal aplikasi atau
Gradle sehingga run live Docker tidak menghabiskan waktu beberapa menit untuk menyalin
artefak khusus mesin.
Runner ini juga menyetel `OPENCLAW_SKIP_CHANNELS=1` sehingga probe live gateway tidak memulai
worker saluran Telegram/Discord/dll. yang nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan
live gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
kontainer gateway OpenClaw dengan endpoint HTTP kompatibel OpenAI diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway tersebut, masuk
melalui Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama dapat terasa jauh lebih lambat karena Docker mungkin perlu menarik
image Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Lane ini mengharapkan live model key yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run Dockerized.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Ini mem-boot kontainer Gateway
yang telah ditanam, memulai kontainer kedua yang memunculkan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, perutean pengiriman outbound, dan notifikasi gaya Claude untuk channel +
permission melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang benar-benar dipancarkan oleh bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan
live model key. Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mewujudkan server tersebut melalui runtime MCP bundle Pi
tersemat, mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan live model
key. Ini memulai Gateway yang telah ditanam dengan server probe MCP stdio nyata, menjalankan
giliran cron terisolasi dan giliran child one-shot `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread plain-language ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan dihapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway bagi smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk meng-override prompt nonce-check yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk meng-override tag image Open WebUI yang dipin

## Kewarasan docs

Jalankan pemeriksaan docs setelah mengedit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (mock OpenAI, gateway nyata + loop agent): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agent (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agent”:

- Pemanggilan tool mock melalui loop Gateway + agent nyata (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skill didaftarkan di prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan tool, carryover riwayat sesi, dan batas sandbox.

Evaluasi di masa depan sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan mock provider untuk menegaskan panggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, injeksi prompt).
- Evaluasi live opsional (opt-in, digate env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan saluran)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan saluran yang terdaftar sesuai dengan
kontrak interfacenya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam dan smoke bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan saluran atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak saluran: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak saluran

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, name, capabilities)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan inbound
- **actions** - Handler aksi saluran
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status saluran
- **registry** - Bentuk registry Plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface Plugin
- **wizard** - Wizard setup

### Kapan dijalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin saluran atau provider
- Setelah merefaktor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan dalam live:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika masalahnya secara inheren hanya live (rate limit, kebijakan auth), pertahankan live test yang sempit dan opt-in melalui env var
- Utamakan menargetkan layer terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau pengujian mock gateway yang aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan ID exec traversal-segment ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` di pengujian tersebut. Pengujian ini sengaja gagal pada target id yang belum diklasifikasikan sehingga kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [CI](/id/ci)
