---
read_when:
    - Mencari definisi channel rilis publik
    - Mencari penamaan versi dan cadence
summary: Channel rilis publik, penamaan versi, dan cadence
title: Kebijakan Rilis
x-i18n:
    generated_at: "2026-04-21T09:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Kebijakan Rilis

OpenClaw memiliki tiga lane rilis publik:

- stable: rilis bertag yang dipublikasikan ke npm `beta` secara default, atau ke npm `latest` bila diminta secara eksplisit
- beta: tag prarilis yang dipublikasikan ke npm `beta`
- dev: head bergerak dari `main`

## Penamaan versi

- Versi rilis stable: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Versi rilis koreksi stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- Versi prarilis beta: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- Jangan menambahkan nol di depan bulan atau hari
- `latest` berarti rilis npm stable yang saat ini dipromosikan
- `beta` berarti target instalasi beta saat ini
- Rilis stable dan rilis koreksi stable dipublikasikan ke npm `beta` secara default; operator rilis dapat menargetkan `latest` secara eksplisit, atau mempromosikan build beta yang telah divalidasi nanti
- Setiap rilis stable OpenClaw mengirim paket npm dan aplikasi macOS secara bersamaan;
  rilis beta biasanya memvalidasi dan memublikasikan jalur npm/package terlebih dahulu, dengan
  build/sign/notarize aplikasi mac disiapkan untuk stable kecuali diminta secara eksplisit

## Cadence rilis

- Rilis bergerak beta-first
- Stable menyusul hanya setelah beta terbaru divalidasi
- Maintainer biasanya memotong rilis dari branch `release/YYYY.M.D` yang dibuat
  dari `main` saat ini, sehingga validasi dan perbaikan rilis tidak menghambat
  pengembangan baru di `main`
- Jika tag beta telah di-push atau dipublikasikan dan memerlukan perbaikan, maintainer memotong
  tag `-beta.N` berikutnya alih-alih menghapus atau membuat ulang tag beta lama
- Prosedur rilis terperinci, persetujuan, kredensial, dan catatan pemulihan
  hanya untuk maintainer

## Pra-penerbangan rilis

- Jalankan `pnpm check:test-types` sebelum pra-penerbangan rilis agar TypeScript test tetap
  tercakup di luar gate lokal `pnpm check` yang lebih cepat
- Jalankan `pnpm check:architecture` sebelum pra-penerbangan rilis agar pemeriksaan import
  cycle dan batas arsitektur yang lebih luas tetap hijau di luar gate lokal yang lebih cepat
- Jalankan `pnpm build && pnpm ui:build` sebelum `pnpm release:check` agar
  artefak rilis `dist/*` yang diharapkan dan bundle Control UI tersedia untuk langkah
  validasi pack
- Jalankan `pnpm release:check` sebelum setiap rilis bertag
- Pemeriksaan rilis sekarang berjalan di workflow manual terpisah:
  `OpenClaw Release Checks`
- Validasi runtime instalasi dan upgrade lintas-OS dikirim dari
  workflow pemanggil privat
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  yang memanggil workflow publik yang dapat digunakan ulang
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Pemisahan ini disengaja: jaga jalur rilis npm nyata tetap singkat,
  deterministik, dan berfokus pada artefak, sementara pemeriksaan live yang lebih lambat tetap di
  lane terpisah agar tidak menahan atau memblokir publish
- Pemeriksaan rilis harus dikirim dari ref workflow `main` atau dari
  ref workflow `release/YYYY.M.D` agar logika workflow dan secret tetap
  terkendali
- Workflow tersebut menerima tag rilis yang sudah ada atau commit SHA
  branch-workflow 40 karakter penuh saat ini
- Dalam mode commit-SHA, workflow hanya menerima HEAD branch-workflow saat ini; gunakan
  tag rilis untuk commit rilis yang lebih lama
- Pra-penerbangan validasi-saja `OpenClaw NPM Release` juga menerima SHA commit branch-workflow 40 karakter penuh saat ini tanpa memerlukan tag yang sudah di-push
- Jalur SHA tersebut hanya untuk validasi dan tidak dapat dipromosikan menjadi publish nyata
- Dalam mode SHA workflow menyintesis `v<package.json version>` hanya untuk pemeriksaan metadata paket; publish nyata tetap memerlukan tag rilis nyata
- Kedua workflow menjaga jalur publish dan promosi nyata tetap pada runner yang di-host GitHub, sementara jalur validasi non-mutating dapat menggunakan
  runner Linux Blacksmith yang lebih besar
- Workflow tersebut menjalankan
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  menggunakan secret workflow `OPENAI_API_KEY` dan `ANTHROPIC_API_KEY`
- Pra-penerbangan rilis npm tidak lagi menunggu lane pemeriksaan rilis terpisah
- Jalankan `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (atau tag beta/koreksi yang sesuai) sebelum persetujuan
- Setelah npm publish, jalankan
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (atau versi beta/koreksi yang sesuai) untuk memverifikasi jalur instalasi registry
  yang dipublikasikan dalam temp prefix baru
- Otomasi rilis maintainer sekarang menggunakan preflight-then-promote:
  - publish npm nyata harus lolos dari npm `preflight_run_id` yang berhasil
  - publish npm nyata harus dikirim dari branch `main` atau
    `release/YYYY.M.D` yang sama dengan run pra-penerbangan yang berhasil
  - rilis npm stable default ke `beta`
  - publish npm stable dapat menargetkan `latest` secara eksplisit melalui input workflow
  - mutasi dist-tag npm berbasis token sekarang berada di
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    demi keamanan, karena `npm dist-tag add` masih memerlukan `NPM_TOKEN` sementara
    repo publik tetap menggunakan publish khusus OIDC
  - `macOS Release` publik hanya untuk validasi
  - publish mac privat nyata harus lolos dari private mac
    `preflight_run_id` dan `validate_run_id` yang berhasil
  - jalur publish nyata mempromosikan artefak yang telah disiapkan alih-alih membangunnya ulang
- Untuk rilis koreksi stable seperti `YYYY.M.D-N`, verifier pascapublish
  juga memeriksa jalur upgrade temp-prefix yang sama dari `YYYY.M.D` ke `YYYY.M.D-N`
  sehingga koreksi rilis tidak dapat diam-diam membuat instalasi global lama tetap berada pada
  payload stable dasar
- Pra-penerbangan rilis npm gagal tertutup kecuali tarball menyertakan
  `dist/control-ui/index.html` dan payload `dist/control-ui/assets/` yang tidak kosong
  sehingga kita tidak mengirim dashboard browser kosong lagi
- `pnpm test:install:smoke` juga menegakkan anggaran `unpackedSize` npm pack pada tarball pembaruan kandidat, sehingga e2e installer menangkap pack bloat yang tidak disengaja
  sebelum jalur publish rilis
- Jika pekerjaan rilis menyentuh perencanaan CI, manifest timing extension, atau
  matriks test extension, buat ulang dan tinjau output matriks workflow
  `checks-node-extensions` milik planner dari `.github/workflows/ci.yml`
  sebelum persetujuan agar catatan rilis tidak menjelaskan tata letak CI yang basi
- Kesiapan rilis stable macOS juga mencakup permukaan updater:
  - GitHub release harus berakhir dengan `.zip`, `.dmg`, dan `.dSYM.zip` yang sudah dipaketkan
  - `appcast.xml` di `main` harus menunjuk ke zip stable baru setelah publish
  - aplikasi yang dipaketkan harus mempertahankan bundle id non-debug, feed URL Sparkle yang tidak kosong, dan `CFBundleVersion` yang setara atau di atas batas build Sparkle kanonis
    untuk versi rilis tersebut

## Input workflow NPM

`OpenClaw NPM Release` menerima input yang dikendalikan operator berikut:

- `tag`: tag rilis wajib seperti `v2026.4.2`, `v2026.4.2-1`, atau
  `v2026.4.2-beta.1`; ketika `preflight_only=true`, ini juga dapat berupa
  SHA commit branch-workflow 40 karakter penuh saat ini untuk pra-penerbangan validasi-saja
- `preflight_only`: `true` untuk validasi/build/package saja, `false` untuk
  jalur publish nyata
- `preflight_run_id`: wajib pada jalur publish nyata agar workflow menggunakan ulang
  tarball yang sudah disiapkan dari run pra-penerbangan yang berhasil
- `npm_dist_tag`: target tag npm untuk jalur publish; default ke `beta`

`OpenClaw Release Checks` menerima input yang dikendalikan operator berikut:

- `ref`: tag rilis yang sudah ada atau SHA commit `main` 40 karakter penuh saat ini
  untuk divalidasi ketika dikirim dari `main`; dari branch rilis, gunakan
  tag rilis yang sudah ada atau SHA commit branch rilis 40 karakter penuh saat ini

Aturan:

- Tag stable dan koreksi dapat dipublikasikan ke `beta` atau `latest`
- Tag prarilis beta hanya boleh dipublikasikan ke `beta`
- Untuk `OpenClaw NPM Release`, input full commit SHA hanya diizinkan ketika
  `preflight_only=true`
- `OpenClaw Release Checks` selalu validasi-saja dan juga menerima
  SHA commit branch-workflow saat ini
- Mode commit-SHA pemeriksaan rilis juga memerlukan HEAD branch-workflow saat ini
- Jalur publish nyata harus menggunakan `npm_dist_tag` yang sama yang digunakan selama pra-penerbangan;
  workflow memverifikasi bahwa metadata tersebut tetap berlanjut sebelum publish

## Urutan rilis npm stable

Saat memotong rilis npm stable:

1. Jalankan `OpenClaw NPM Release` dengan `preflight_only=true`
   - Sebelum tag ada, Anda dapat menggunakan SHA commit branch-workflow penuh saat ini
     untuk dry run validasi-saja dari workflow pra-penerbangan
2. Pilih `npm_dist_tag=beta` untuk alur beta-first normal, atau `latest` hanya
   saat Anda sengaja menginginkan publish stable langsung
3. Jalankan `OpenClaw Release Checks` secara terpisah dengan tag yang sama atau
   SHA commit branch-workflow penuh saat ini ketika Anda menginginkan cakupan
   prompt cache live
   - Ini dipisahkan dengan sengaja agar cakupan live tetap tersedia tanpa
     menggabungkan kembali pemeriksaan yang berjalan lama atau flaky ke workflow publish
4. Simpan `preflight_run_id` yang berhasil
5. Jalankan `OpenClaw NPM Release` lagi dengan `preflight_only=false`, `tag`
   yang sama, `npm_dist_tag` yang sama, dan `preflight_run_id` yang disimpan
6. Jika rilis mendarat di `beta`, gunakan workflow privat
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   untuk mempromosikan versi stable tersebut dari `beta` ke `latest`
7. Jika rilis sengaja dipublikasikan langsung ke `latest` dan `beta`
   harus segera mengikuti build stable yang sama, gunakan workflow privat yang sama
   untuk mengarahkan kedua dist-tag ke versi stable tersebut, atau biarkan sinkronisasi self-healing
   terjadwalnya memindahkan `beta` nanti

Mutasi dist-tag berada di repo privat demi keamanan karena ini masih
memerlukan `NPM_TOKEN`, sementara repo publik tetap menggunakan publish khusus OIDC.

Itu menjaga jalur publish langsung dan jalur promosi beta-first sama-sama
terdokumentasi dan terlihat oleh operator.

## Referensi publik

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer menggunakan docs rilis privat di
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
untuk runbook sebenarnya.
