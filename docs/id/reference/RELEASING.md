---
read_when:
    - Mencari definisi channel rilis publik
    - Mencari penamaan versi dan irama rilis
summary: Channel rilis publik, penamaan versi, dan irama rilis
title: Kebijakan Rilis
x-i18n:
    generated_at: "2026-04-23T09:27:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Kebijakan Rilis

OpenClaw memiliki tiga lajur rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` jika diminta secara eksplisit
- beta: tag prerelease yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versi prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Jangan gunakan nol di depan untuk bulan atau hari
- `latest` berarti rilis npm stable yang sedang dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah diverifikasi nanti
- Setiap rilis stable OpenClaw mengirim package npm dan app macOS bersamaan;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/package terlebih dahulu, dengan
  build/sign/notarize app mac dicadangkan untuk stable kecuali diminta secara eksplisit

## Irama rilis

- Rilis bergerak beta-first
- Stable mengikuti hanya setelah beta terbaru tervalidasi
- Maintainer biasanya memotong rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak memblokir
  pengembangan baru di `main`
- Jika tag beta sudah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer memotong
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis rinci, persetujuan, kredensial, dan catatan pemulihan bersifat khusus maintainer

## Preflight rilis

- Jalankan `pnpm check:test-types` sebelum preflight rilis agar TypeScript pengujian tetap
  tercakup di luar gerbang lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum preflight rilis agar pemeriksaan siklus impor
  dan batas arsitektur yang lebih luas tetap hijau di luar gerbang lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar
  artefak rilis `dist/*` yang diharapkan dan bundel Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan dalam workflow manual terpisah:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` juga menjalankan gerbang parity mock QA Lab plus lajur
  QA Matrix dan Telegram live sebelum persetujuan rilis. Lajur live menggunakan
  environment `qa-live-shared`; Telegram juga menggunakan lease kredensial Convex CI.
- Validasi runtime instalasi dan upgrade lintas-OS dikirim dari workflow pemanggil
  privat
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  yang memanggil workflow publik yang dapat digunakan ulang
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap berada di
  lajurnya sendiri agar tidak menunda atau memblokir publish
- Pemeriksaan rilis harus dikirim dari ref workflow `main` atau dari
  ref workflow `release/YYYY.M.D` agar logika workflow dan secret tetap
  terkendali
- Workflow tersebut menerima tag rilis yang sudah ada atau commit SHA branch workflow 40 karakter penuh saat ini
- Dalam mode commit-SHA, workflow hanya menerima HEAD branch workflow saat ini; gunakan
  tag rilis untuk commit rilis yang lebih lama
- Preflight khusus validasi `OpenClaw NPM Release` juga menerima commit SHA branch workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA itu hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA, workflow mensintesis `v<package.json version>` hanya untuk pemeriksaan metadata package; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publish dan promosi nyata pada runner yang di-host GitHub, sementara jalur validasi non-mutasi dapat menggunakan runner Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Preflight rilis npm tidak lagi menunggu lajur pemeriksaan rilis yang terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah publish npm, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam prefiks temp yang baru
- Otomasi rilis maintainer sekarang menggunakan preflight-then-promote:
  - publish npm nyata harus lulus `preflight_run_id` npm yang berhasil
  - publish npm nyata harus dikirim dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan eksekusi preflight yang berhasil
  - rilis npm stable default ke `beta`
  - publish npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara repo
    publik mempertahankan publish hanya dengan OIDC
  - `macOS Release` publik hanya untuk validasi
  - publish mac privat yang nyata harus lulus preflight mac privat yang berhasil
    `preflight_run_id` dan `validate_run_id`
  - jalur publish nyata mempromosikan artefak yang sudah disiapkan alih-alih membangunnya ulang
  - Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pasca-publish
  juga memeriksa jalur upgrade prefiks temp yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  agar koreksi rilis tidak diam-diam membuat instalasi global lama tetap pada
  payload stable dasar
- Preflight rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  agar kita tidak mengirim dashboard browser kosong lagi
- Verifikasi pasca-publish juga memeriksa bahwa instalasi registry yang dipublikasikan
  berisi dependensi runtime Plugin bundled yang tidak kosong di bawah tata letak root `dist/*`.
  Rilis yang dikirim dengan payload dependensi Plugin bundled yang hilang atau kosong akan gagal pada verifier postpublish dan tidak dapat dipromosikan
  ke `latest`.
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada
  tarball pembaruan kandidat, sehingga installer e2e menangkap pembengkakan pack yang tidak disengaja
  sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks pengujian extension, regenerasi dan tinjau keluaran matriks workflow
  `checks-node-extensions` milik planner dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menggambarkan tata letak CI yang usang
- Kesiapan rilis macOS stable juga mencakup permukaan updater:
  - rilis GitHub harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang telah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publish
  - app yang dipaketkan harus mempertahankan bundle id non-debug, feed Sparkle URL
    yang tidak kosong, dan `CFBundleVersion` pada atau di atas lantai build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; saat `preflight_only=true`, ini juga dapat berupa
  commit SHA branch workflow 40 karakter penuh saat ini untuk preflight khusus validasi
- `preflight_only`: `true` untuk validasi/build/package saja, `false` untuk
  jalur publish nyata
- `preflight_run_id`: wajib pada jalur publish nyata agar workflow menggunakan ulang
  tarball yang telah disiapkan dari eksekusi preflight yang berhasil
- `npm_dist_tag`: tag target npm untuk jalur publish; default ke `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: tag rilis yang sudah ada atau commit SHA `main` 40 karakter penuh saat ini
  untuk divalidasi saat dikirim dari `main`; dari branch rilis, gunakan
  tag rilis yang sudah ada atau commit SHA branch rilis 40 karakter penuh saat ini

Aturan:

- Tag stable dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prerelease beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input commit SHA penuh hanya diizinkan saat
  `preflight_only=true`
- `OpenClaw Release Checks` selalu hanya untuk validasi dan juga menerima
  commit SHA branch workflow saat ini
- Mode commit-SHA pemeriksaan rilis juga memerlukan HEAD branch workflow saat ini
- Jalur publish nyata harus menggunakan `npm_dist_tag` yang sama dengan yang digunakan saat preflight;
  workflow memverifikasi metadata tersebut sebelum publish dilanjutkan

## Urutan rilis npm stable

Saat memotong rilis npm stable:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan commit SHA branch workflow penuh saat ini
     untuk dry run validasi dari workflow preflight
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda sengaja menginginkan publish stable langsung
3. Jalankan `OpenClaw Release Checks` secara terpisah dengan tag yang sama atau
   commit SHA branch workflow penuh saat ini ketika Anda menginginkan cakupan live prompt cache,
   parity QA Lab, Matrix, dan Telegram
   - Ini dipisahkan dengan sengaja agar cakupan live tetap tersedia tanpa
     mengaitkan ulang pemeriksaan yang berjalan lama atau flakey ke workflow publish
4. Simpan `preflight_run_id` yang berhasil
5. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
6. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stable tersebut dari `beta` ke `latest`
7. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stable yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stable, atau biarkan sinkronisasi pemulihan diri terjadwal
   memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena masih
memerlukan `NPM_TOKEN`, sementara repo publik mempertahankan publish hanya dengan OIDC.

Ini menjaga jalur publish langsung dan jalur promosi beta-first sama-sama
terdokumentasi dan terlihat oleh operator.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan dokumen rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook yang sebenarnya.
