---
read_when:
    - Anda perlu memahami mengapa suatu pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Graf pekerjaan CI, gerbang cakupan, dan padanan perintah lokal
title: pipeline CI
x-i18n:
    generated_at: "2026-04-25T13:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan penentuan cakupan cerdas untuk melewati pekerjaan mahal ketika hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow utama yang bercakupan cerdas. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan pack agentic mock GPT-5.4 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini memecah mock parity gate, lane Matrix live, dan lane
Telegram live sebagai pekerjaan paralel. Pekerjaan live menggunakan environment `qa-live-shared`,
dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk
pembersihan duplikat pasca-merge. Secara default workflow ini menggunakan dry-run dan hanya menutup PR yang
secara eksplisit tercantum ketika `apply=true`. Sebelum memodifikasi GitHub, workflow ini memverifikasi bahwa
PR yang sudah masuk telah di-merge dan bahwa setiap duplikat memiliki issue yang dirujuk bersama
atau hunk perubahan yang tumpang tindih.

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis peristiwa untuk menjaga
dokumentasi yang ada tetap selaras dengan perubahan yang baru saja masuk. Workflow ini tidak memiliki jadwal murni:
workflow ini dapat dipicu oleh CI push non-bot yang berhasil di `main`, dan manual dispatch dapat
menjalankannya secara langsung. Pemanggilan workflow-run akan dilewati jika `main` sudah bergerak maju atau jika
run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat workflow ini berjalan, workflow ini
meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga
`main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan `main` yang terakumulasi sejak
pass dokumentasi terakhir.

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis peristiwa
untuk pengujian lambat. Workflow ini tidak memiliki jadwal murni: workflow ini dapat dipicu oleh CI push non-bot yang berhasil di
`main`, tetapi akan dilewati jika pemanggilan workflow-run lain sudah berjalan
atau sedang berjalan pada hari UTC tersebut. Manual dispatch melewati gerbang aktivitas
harian itu. Lane ini membangun laporan performa Vitest yang dikelompokkan untuk full-suite, membiarkan Codex
membuat hanya perbaikan performa pengujian kecil yang tetap menjaga cakupan alih-alih refaktor luas,
lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah pengujian baseline yang lulus. Jika baseline memiliki pengujian yang gagal, Codex
hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum
apa pun di-commit. Ketika `main` bergerak maju sebelum push bot masuk, lane ini
merebase patch yang tervalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba push lagi;
patch lama yang konflik akan dilewati. Workflow ini menggunakan Ubuntu yang di-host GitHub agar action Codex
dapat mempertahankan postur keamanan drop-sudo yang sama seperti docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Ikhtisar pekerjaan

| Pekerjaan                        | Tujuan                                                                                       | Kapan berjalan                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan hanya-docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft    |
| `security-fast`                  | Agregat wajib untuk pekerjaan keamanan cepat                                                 | Selalu pada push dan PR non-draft    |
| `build-artifacts`                | Membangun `dist/`, Control UI, pemeriksaan built artifact, dan artifact downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node   |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node   |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak saluran yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node   |
| `checks-node-extensions`         | Shard pengujian bundled-plugin penuh di seluruh suite extension                              | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane saluran, bundled, kontrak, dan extension     | Perubahan yang relevan dengan Node   |
| `extension-fast`                 | Pengujian terfokus hanya untuk bundled plugin yang berubah                                   | Pull request dengan perubahan extension |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat | Perubahan yang relevan dengan Node   |
| `check-additional`               | Arsitektur, boundary, guard permukaan extension, package-boundary, dan shard gateway-watch   | Perubahan yang relevan dengan Node   |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                     | Perubahan yang relevan dengan Node   |
| `checks`                         | Verifier untuk pengujian saluran built artifact ditambah kompatibilitas Node 22 khusus push  | Perubahan yang relevan dengan Node   |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan tautan rusak                                         | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan built artifact bersama                           | Perubahan yang relevan dengan macOS  |
| `macos-swift`                    | Lint Swift, build, dan pengujian untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS  |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                      | Perubahan yang relevan dengan Android |
| `test-performance-agent`         | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                         | Keberhasilan CI main atau manual dispatch |

## Urutan fail-fast

Pekerjaan diurutkan agar pemeriksaan murah gagal sebelum pekerjaan mahal berjalan:

1. `preflight` menentukan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah step di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu pekerjaan artifact dan matriks platform yang lebih berat.
3. `build-artifacts` tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat lalu dipecah setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Edit workflow CI memvalidasi graf CI Node ditambah lint workflow, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap dibatasi pada perubahan sumber platform.
Edit khusus perutean CI, edit fixture core-test murah tertentu, dan edit helper/test-routing kontrak plugin yang sempit menggunakan jalur manifes Node-only cepat: preflight, security, dan satu tugas `checks-fast-core`. Jalur ini menghindari build artifact, kompatibilitas Node 22, kontrak saluran, shard inti penuh, shard bundled-plugin, dan matriks guard tambahan ketika file yang diubah terbatas pada permukaan perutean atau helper yang langsung diuji oleh tugas cepat tersebut.
Pemeriksaan Node Windows dibatasi pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan test-only yang tidak terkait tetap berada di lane Linux Node sehingga tidak mencadangkan worker Windows 16-vCPU untuk cakupan yang sudah diuji oleh shard test normal.
Workflow `install-smoke` yang terpisah menggunakan kembali script cakupan yang sama melalui pekerjaan `preflight`-nya sendiri. Workflow ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`. Pull request menjalankan jalur cepat untuk permukaan Docker/package, perubahan package/manifest bundled plugin, dan permukaan inti plugin/channel/gateway/Plugin SDK yang diuji oleh pekerjaan Docker smoke. Perubahan bundled plugin yang hanya source, edit test-only, dan edit hanya-docs tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root sekali, memeriksa CLI, menjalankan smoke CLI shared-workspace delete agents, menjalankan e2e container gateway-network, memverifikasi build arg bundled extension, dan menjalankan profil Docker bundled-plugin yang dibatasi dengan batas waktu perintah agregat 240 detik dengan batas terpisah untuk `docker run` setiap skenario. Jalur penuh mempertahankan cakupan install package QR dan Docker/update installer untuk run terjadwal malam hari, manual dispatch, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/package/Docker. Push `main`, termasuk merge commit, tidak memaksa jalur penuh; ketika logika changed-scope akan meminta cakupan penuh pada push, workflow mempertahankan Docker smoke cepat dan menyerahkan install smoke penuh ke validasi malam hari atau rilis. Smoke image-provider install global Bun yang lambat digerbangkan secara terpisah oleh `run_bun_global_install_smoke`; workflow ini berjalan pada jadwal malam hari dan dari workflow pemeriksaan rilis, dan manual dispatch `install-smoke` dapat ikut serta, tetapi pull request dan push `main` tidak menjalankannya. Pengujian Docker QR dan installer mempertahankan Dockerfile berfokus instalasi mereka sendiri. `test:docker:all` lokal melakukan prebuild satu image live-test bersama dan satu image built-app bersama `scripts/e2e/Dockerfile`, lalu menjalankan lane smoke live/E2E dengan scheduler berbobot dan `OPENCLAW_SKIP_DOCKER_BUILD=1`; sesuaikan jumlah slot default main-pool sebesar 10 dengan `OPENCLAW_DOCKER_ALL_PARALLELISM` dan jumlah slot default tail-pool yang sensitif penyedia sebesar 10 dengan `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Batas lane berat secara default adalah `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` agar lane npm install dan multi-service tidak terlalu membebani Docker sementara lane yang lebih ringan tetap mengisi slot yang tersedia. Start lane di-stagger 2 detik secara default untuk menghindari lonjakan create daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` atau nilai milidetik lain. Preflight agregat lokal memeriksa Docker, menghapus container OpenClaw E2E yang kedaluwarsa, menampilkan status lane aktif, menyimpan timing lane untuk pengurutan longest-first, dan mendukung `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk inspeksi scheduler. Secara default, workflow ini berhenti menjadwalkan lane pooled baru setelah kegagalan pertama, dan setiap lane memiliki fallback timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail tertentu menggunakan batas per-lane yang lebih ketat. Workflow live/E2E yang dapat digunakan ulang mencerminkan pola shared-image dengan membangun dan mendorong satu image Docker E2E GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari. Matriks bundled update dibagi menurut target update sehingga pass npm update berulang dan doctor repair dapat di-shard bersama pemeriksaan bundled lainnya.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang lokal itu lebih ketat terhadap batas arsitektur daripada cakupan platform CI yang luas: perubahan produksi inti menjalankan typecheck prod inti ditambah test inti, perubahan hanya test inti hanya menjalankan typecheck/test inti, perubahan produksi extension menjalankan typecheck prod extension ditambah test extension, dan perubahan hanya test extension hanya menjalankan typecheck/test extension. Perubahan Plugin SDK publik atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak inti tersebut. Bump versi yang hanya metadata rilis menjalankan pemeriksaan version/config/root-dependency yang ditargetkan. Perubahan root/config yang tidak diketahui fail-safe ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane test/channel normal.

Keluarga test Node yang paling lambat dibagi atau diseimbangkan agar setiap pekerjaan tetap kecil tanpa mencadangkan runner secara berlebihan: kontrak saluran berjalan sebagai tiga shard berbobot, test bundled plugin diseimbangkan di enam worker extension, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai tiga worker seimbang alih-alih enam worker kecil, dan konfigurasi gateway/plugin agentic disebarkan ke pekerjaan agentic Node source-only yang sudah ada alih-alih menunggu built artifact. Test browser luas, QA, media, dan plugin lain-lain menggunakan konfigurasi Vitest khusus mereka alih-alih catch-all plugin bersama. Pekerjaan shard extension menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar agar batch plugin yang berat pada import tidak menciptakan pekerjaan CI tambahan. Lane agents yang luas menggunakan scheduler file-parallel Vitest bersama karena didominasi import/penjadwalan, bukan dimiliki oleh satu file test lambat. `runtime-config` berjalan bersama shard infra core-runtime agar shard runtime bersama tidak menjadi ekor. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard kecil independennya secara bersamaan di dalam satu pekerjaan. Gateway watch, test channel, dan shard support-boundary inti berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama pemeriksaan lamanya sebagai pekerjaan verifier ringan sambil menghindari dua worker Blacksmith tambahan dan antrean artifact-consumer kedua.
Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor itu dengan flag BuildConfig SMS/call-log, sambil menghindari pekerjaan packaging APK debug duplikat pada setiap push yang relevan dengan Android.
`extension-fast` hanya untuk PR karena run push sudah mengeksekusi shard bundled plugin penuh. Ini menjaga umpan balik plugin yang berubah untuk review tanpa mencadangkan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai pekerjaan yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk pada PR yang sama atau ref `main` yang sama. Perlakukan ini sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak masuk antrean setelah seluruh workflow sudah tergantikan.
Kunci konkurensi CI diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas.

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, pekerjaan dan agregat keamanan cepat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protocol/contract/bundled cepat, pemeriksaan kontrak saluran yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat test Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat masuk antrean lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard test Linux Node, shard test bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematan yang diberikannya; build Docker install-smoke, di mana biaya waktu antrean 32-vCPU lebih besar daripada penghematan yang diberikannya                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

## Padanan lokal

```bash
pnpm changed:lanes   # periksa pengklasifikasi changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gerbang lokal cerdas: changed typecheck/lint/tests menurut lane boundary
pnpm check          # gerbang lokal cepat: production tsgo + lint yang di-shard + fast guard paralel
pnpm check:test-types
pnpm check:timed    # gerbang yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # build dist saat lane artifact/build-smoke CI relevan
node scripts/ci-run-timings.mjs <run-id>      # rangkum wall time, queue time, dan pekerjaan paling lambat
node scripts/ci-run-timings.mjs --recent 10   # bandingkan run CI main sukses terbaru
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Terkait

- [Install overview](/id/install)
- [Release channels](/id/install/development-channels)
