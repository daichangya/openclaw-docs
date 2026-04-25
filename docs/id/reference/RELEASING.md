---
read_when:
    - Mencari definisi kanal rilis publik
    - Mencari penamaan versi dan ritme rilis
summary: Kanal rilis publik, penamaan versi, dan ritme rilis
title: Kebijakan rilis
x-i18n:
    generated_at: "2026-04-25T13:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw memiliki tiga jalur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` jika diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head `main` yang terus bergerak

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan gunakan nol di depan untuk bulan atau hari
- `latest` berarti rilis npm stable yang sedang dipromosikan saat ini
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diverifikasi nanti
- Setiap rilis stable OpenClaw mengirimkan paket npm dan aplikasi macOS secara bersamaan;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/package terlebih dahulu, dengan
  build/sign/notarize aplikasi mac dicadangkan untuk stable kecuali diminta secara eksplisit

## Ritme rilis

- Rilis bergerak dengan pendekatan beta-first
- Stable hanya menyusul setelah beta terbaru tervalidasi
- Maintainer biasanya membuat rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi rilis dan perbaikannya tidak menghambat
  pengembangan baru di `main`
- Jika sebuah tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer membuat
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Pemeriksaan awal rilis

- Jalankan `pnpm check:test-types` sebelum pemeriksaan awal rilis agar TypeScript pengujian tetap
  tercakup di luar gate `pnpm check` lokal yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum pemeriksaan awal rilis agar pemeriksaan siklus impor
  dan batas arsitektur yang lebih luas tetap hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar
  artefak rilis `dist/*` yang diharapkan dan bundle Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis kini berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gate paritas mock QA Lab plus jalur QA
  Matrix dan Telegram live sebelum persetujuan rilis. Jalur live menggunakan
  environment `qa-live-shared`; Telegram juga menggunakan sewa kredensial Convex CI.
- Validasi runtime instalasi dan upgrade lintas OS didispatch dari
  workflow pemanggil privat
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  yang memanggil workflow publik reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Pemisahan ini disengaja: menjaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di
  jalurnya sendiri agar tidak memperlambat atau menghambat publikasi
- Pemeriksaan rilis harus didispatch dari ref workflow `main` atau dari
  ref workflow `release/YYYY.M.D` agar logika workflow dan secret tetap
  terkendali
- Workflow tersebut menerima tag rilis yang sudah ada atau SHA commit branch workflow 40 karakter penuh saat ini
- Dalam mode commit-SHA, workflow hanya menerima HEAD branch workflow saat ini; gunakan
  tag rilis untuk commit rilis yang lebih lama
- Pemeriksaan awal validasi saja `OpenClaw NPM Release` juga menerima
  SHA commit branch workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publikasi nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk
  pemeriksaan metadata package; publikasi nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publikasi dan promosi nyata tetap di runner yang di-host GitHub,
  sementara jalur validasi non-mutatif dapat menggunakan
  runner Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Pemeriksaan awal rilis npm tidak lagi menunggu jalur pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publikasi npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry yang dipublikasikan
  dalam temp prefix baru
- Setelah publikasi beta, jalankan `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  untuk memverifikasi onboarding package terinstal, penyiapan Telegram, dan Telegram E2E nyata
  terhadap paket npm yang dipublikasikan menggunakan pool kredensial Telegram sewaan bersama.
  Pengujian sekali jalan maintainer lokal dapat menghilangkan variabel Convex dan meneruskan tiga
  kredensial env `OPENCLAW_QA_TELEGRAM_*` secara langsung.
- Maintainer dapat menjalankan pemeriksaan pascapublikasi yang sama dari GitHub Actions melalui
  workflow manual `NPM Telegram Beta E2E`. Workflow ini sengaja hanya manual dan
  tidak berjalan pada setiap merge.
- Otomasi rilis maintainer kini menggunakan preflight-then-promote:
  - publikasi npm nyata harus lolos `preflight_run_id` npm yang berhasil
  - publikasi npm nyata harus didispatch dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan preflight run yang berhasil
  - rilis npm stable secara default menuju `beta`
  - publikasi npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token kini berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    untuk keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publikasi hanya OIDC
  - `macOS Release` publik hanya untuk validasi
  - publikasi mac privat nyata harus lolos preflight mac privat yang berhasil
    `preflight_run_id` dan `validate_run_id`
  - jalur publikasi nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya
    kembali
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pascapublikasi
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam membuat instalasi global lama tetap pada payload stable dasar
- Pemeriksaan awal rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pascapublikasi juga memeriksa bahwa instalasi registry yang dipublikasikan
  berisi dependency runtime plugin bawaan yang tidak kosong di bawah tata letak root `dist/*`.
  Rilis yang dikirim dengan payload dependency plugin bawaan yang hilang atau kosong
  akan gagal pada verifier pascapublikasi dan tidak dapat dipromosikan
  ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publikasi rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks pengujian extension, regenerasikan dan tinjau keluaran matriks workflow
  `checks-node-extensions` milik planner dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang usang
- Kesiapan rilis stable macOS juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publikasi
  - aplikasi yang telah dipaketkan harus mempertahankan bundle id non-debug, feed
    URL Sparkle yang tidak kosong, dan `CFBundleVersion` yang berada pada atau di atas batas build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa
  SHA commit branch workflow 40 karakter penuh saat ini untuk pemeriksaan awal validasi saja
- `preflight_only`: `true` hanya untuk validasi/build/package, `false` untuk
  jalur publikasi nyata
- `preflight_run_id`: wajib pada jalur publikasi nyata agar workflow menggunakan kembali
  tarball yang telah disiapkan dari preflight run yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publikasi; defaultnya `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: tag rilis yang sudah ada atau SHA commit `main` 40 karakter penuh saat ini
  untuk divalidasi saat didispatch dari `main`; dari release branch, gunakan
  tag rilis yang sudah ada atau SHA commit release-branch 40 karakter penuh saat ini

Aturan:

- Tag stable dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya dapat dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input SHA commit penuh hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` selalu hanya untuk validasi dan juga menerima
  SHA commit branch workflow saat ini
- Mode commit-SHA pemeriksaan rilis juga mengharuskan HEAD branch workflow saat ini
- Jalur publikasi nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan saat preflight;
  workflow memverifikasi metadata tersebut sebelum publikasi dilanjutkan

## Urutan rilis npm stable

Saat membuat rilis npm stable:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch workflow penuh saat ini
     untuk dry run validasi saja dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda memang menginginkan publikasi stable langsung
3. Jalankan `OpenClaw Release Checks` secara terpisah dengan tag yang sama atau
   SHA penuh branch workflow saat ini yang sama saat Anda menginginkan cakupan cache prompt live,
   paritas QA Lab, Matrix, dan Telegram
   - Ini dipisahkan dengan sengaja agar cakupan live tetap tersedia tanpa
     menggabungkan kembali pemeriksaan yang berjalan lama atau flaky ke workflow publikasi
4. Simpan `preflight_run_id` yang berhasil
5. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
6. Jika rilis masuk ke `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stable tersebut dari `beta` ke `latest`
7. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   seharusnya segera mengikuti build stable yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stable tersebut, atau biarkan sinkronisasi self-healing
   terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publikasi hanya OIDC.

Ini menjaga jalur publikasi langsung dan jalur promosi beta-first keduanya tetap
terdokumentasi dan terlihat oleh operator.

Jika maintainer harus beralih ke autentikasi npm lokal, jalankan perintah 1Password
CLI (`op`) apa pun hanya di dalam sesi tmux khusus. Jangan panggil `op`
secara langsung dari shell agen utama; menyimpannya di dalam tmux membuat prompt,
peringatan, dan penanganan OTP dapat diamati serta mencegah peringatan host berulang.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
sebagai runbook yang sebenarnya.

## Terkait

- [Kanal rilis](/id/install/development-channels)
