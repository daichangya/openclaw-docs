---
x-i18n:
    generated_at: "2026-04-25T13:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Desain Impor Tema Kustom Tweakcn

Status: disetujui di terminal pada 2026-04-22

## Ringkasan

Tambahkan tepat satu slot tema kustom Control UI lokal-browser yang dapat diimpor dari tautan berbagi tweakcn. Keluarga tema bawaan yang sudah ada tetap `claw`, `knot`, dan `dash`. Keluarga `custom` yang baru berperilaku seperti keluarga tema OpenClaw normal dan mendukung mode `light`, `dark`, dan `system` ketika payload tweakcn yang diimpor menyertakan set token light dan dark.

Tema yang diimpor disimpan hanya di profil browser saat ini bersama pengaturan Control UI lainnya. Tema ini tidak ditulis ke konfigurasi gateway dan tidak tersinkron di seluruh perangkat atau browser.

## Masalah

Sistem tema Control UI saat ini tertutup pada tiga keluarga tema yang di-hard-code:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Pengguna dapat beralih di antara keluarga bawaan dan varian mode, tetapi mereka tidak dapat membawa tema dari tweakcn tanpa mengedit CSS repo. Hasil yang diminta lebih kecil daripada sistem tema umum: pertahankan tiga tema bawaan dan tambahkan satu slot impor yang dikendalikan pengguna yang dapat diganti dari tautan tweakcn.

## Tujuan

- Pertahankan keluarga tema bawaan yang sudah ada tanpa perubahan.
- Tambahkan tepat satu slot kustom yang diimpor, bukan pustaka tema.
- Terima tautan berbagi tweakcn atau URL langsung `https://tweakcn.com/r/themes/{id}`.
- Simpan tema yang diimpor hanya di penyimpanan lokal browser.
- Buat slot yang diimpor bekerja dengan kontrol mode `light`, `dark`, dan `system` yang ada.
- Jaga agar perilaku kegagalan tetap aman: impor yang buruk tidak pernah merusak tema UI yang aktif.

## Bukan tujuan

- Tidak ada pustaka multi-tema atau daftar impor lokal-browser.
- Tidak ada persistensi sisi gateway atau sinkronisasi lintas perangkat.
- Tidak ada editor CSS arbitrer atau editor JSON tema mentah.
- Tidak ada pemuatan otomatis aset font jarak jauh dari tweakcn.
- Tidak ada upaya untuk mendukung payload tweakcn yang hanya mengekspos satu mode.
- Tidak ada refaktor tema skala repo di luar seam yang diperlukan untuk Control UI.

## Keputusan pengguna yang sudah dibuat

- Pertahankan tiga tema bawaan.
- Tambahkan satu slot impor bertenaga tweakcn.
- Simpan tema yang diimpor di browser, bukan konfigurasi gateway.
- Dukung `light`, `dark`, dan `system` untuk slot yang diimpor.
- Menimpa slot kustom dengan impor berikutnya adalah perilaku yang dimaksudkan.

## Pendekatan yang direkomendasikan

Tambahkan id keluarga tema keempat, `custom`, ke model tema Control UI. Keluarga `custom` menjadi dapat dipilih hanya ketika ada impor tweakcn yang valid. Payload yang diimpor dinormalisasi menjadi record tema kustom khusus OpenClaw dan disimpan di penyimpanan lokal browser bersama pengaturan UI lainnya.

Saat runtime, OpenClaw merender tag `<style>` terkelola yang mendefinisikan blok variabel CSS kustom yang telah diresolusikan:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Ini menjaga variabel tema kustom tetap terlingkup pada keluarga `custom` dan menghindari kebocoran variabel CSS inline ke keluarga bawaan.

## Arsitektur

### Model tema

Perbarui `ui/src/ui/theme.ts`:

- Perluas `ThemeName` agar mencakup `custom`.
- Perluas `ResolvedTheme` agar mencakup `custom` dan `custom-light`.
- Perbarui `VALID_THEME_NAMES`.
- Perbarui `resolveTheme()` agar `custom` mencerminkan perilaku keluarga yang ada:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` atau `custom-light` berdasarkan preferensi OS

Tidak ada alias lama yang ditambahkan untuk `custom`.

### Model persistensi

Perluas persistensi `UiSettings` di `ui/src/ui/storage.ts` dengan satu payload tema kustom opsional:

- `customTheme?: ImportedCustomTheme`

Bentuk penyimpanan yang direkomendasikan:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Catatan:

- `sourceUrl` menyimpan input pengguna asli setelah normalisasi.
- `themeId` adalah id tema tweakcn yang diekstrak dari URL.
- `label` adalah field tweakcn `name` jika ada, jika tidak `Custom`.
- `light` dan `dark` sudah berupa peta token OpenClaw yang dinormalisasi, bukan payload tweakcn mentah.
- Payload yang diimpor berada di samping pengaturan lokal-browser lainnya dan diserialisasi dalam dokumen penyimpanan lokal yang sama.
- Jika data custom-theme yang tersimpan hilang atau tidak valid saat dimuat, abaikan payload tersebut dan fallback ke `theme: "claw"` ketika keluarga yang dipersistenkan adalah `custom`.

### Penerapan runtime

Tambahkan pengelola stylesheet custom-theme yang sempit di runtime Control UI, dimiliki dekat `ui/src/ui/app-settings.ts` dan `ui/src/ui/theme.ts`.

Tanggung jawab:

- Membuat atau memperbarui satu tag `<style id="openclaw-custom-theme">` yang stabil di `document.head`.
- Menghasilkan CSS hanya ketika payload tema kustom yang valid ada.
- Menghapus konten tag style ketika payload dibersihkan.
- Pertahankan CSS keluarga bawaan di `ui/src/styles/base.css`; jangan sisipkan token yang diimpor ke stylesheet yang di-check-in.

Pengelola ini berjalan setiap kali pengaturan dimuat, disimpan, diimpor, atau dibersihkan.

### Selektor mode light

Implementasi sebaiknya memilih `data-theme-mode="light"` untuk styling light lintas keluarga daripada membuat kasus khusus `custom-light`. Jika ada selektor yang ada dipatok ke `data-theme="light"` dan perlu berlaku ke setiap keluarga light, perluas selektor tersebut sebagai bagian dari pekerjaan ini.

## UX impor

Perbarui `ui/src/ui/views/config.ts` di bagian `Appearance`:

- Tambahkan kartu tema `Custom` di samping `Claw`, `Knot`, dan `Dash`.
- Tampilkan kartu sebagai nonaktif ketika belum ada impor custom yang tersedia.
- Tambahkan panel impor di bawah grid tema dengan:
  - satu input teks untuk tautan berbagi tweakcn atau URL `/r/themes/{id}`
  - satu tombol `Import`
  - satu alur `Replace` ketika payload custom sudah ada
  - satu aksi `Clear` ketika payload custom sudah ada
- Tampilkan label tema yang diimpor dan host sumber ketika payload ada.
- Jika tema aktif adalah `custom`, mengimpor pengganti langsung diterapkan.
- Jika tema aktif bukan `custom`, impor hanya menyimpan payload baru sampai pengguna memilih kartu `Custom`.

Pemilih tema pengaturan cepat di `ui/src/ui/views/config-quick.ts` juga harus menampilkan `Custom` hanya ketika payload ada.

## Parsing URL dan fetch jarak jauh

Jalur impor browser menerima:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Implementasi harus menormalisasi kedua bentuk menjadi:

- `https://tweakcn.com/r/themes/{id}`

Browser kemudian melakukan fetch langsung ke endpoint `/r/themes/{id}` yang telah dinormalisasi.

Gunakan validator skema yang sempit untuk payload eksternal. Skema zod lebih disukai karena ini adalah batas eksternal yang tidak tepercaya.

Field jarak jauh yang diperlukan:

- top-level `name` sebagai string opsional
- `cssVars.theme` sebagai objek opsional
- `cssVars.light` sebagai objek
- `cssVars.dark` sebagai objek

Jika `cssVars.light` atau `cssVars.dark` tidak ada, tolak impor. Ini disengaja: perilaku produk yang disetujui adalah dukungan mode penuh, bukan sintesis upaya terbaik dari sisi yang hilang.

## Pemetaan token

Jangan mencerminkan variabel tweakcn secara membabi buta. Normalisasikan subset terbatas ke token OpenClaw dan turunkan sisanya di helper.

### Token yang diimpor langsung

Dari setiap blok mode tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Dari `cssVars.theme` bersama jika ada:

- `font-sans`
- `font-mono`

Jika blok mode menimpa `font-sans`, `font-mono`, atau `radius`, nilai lokal-mode menang.

### Token yang diturunkan untuk OpenClaw

Importer menurunkan variabel khusus OpenClaw dari warna dasar yang diimpor:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Aturan penurunan berada di helper murni sehingga dapat diuji secara independen. Formula pencampuran warna yang tepat adalah detail implementasi, tetapi helper harus memenuhi dua batasan:

- mempertahankan kontras yang dapat dibaca dekat dengan maksud tema yang diimpor
- menghasilkan output yang stabil untuk payload impor yang sama

### Token yang diabaikan di v1

Token tweakcn ini sengaja diabaikan pada versi pertama:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Ini menjaga cakupan pada token yang benar-benar dibutuhkan Control UI saat ini.

### Font

String tumpukan font diimpor jika ada, tetapi OpenClaw tidak memuat aset font jarak jauh pada v1. Jika tumpukan yang diimpor merujuk font yang tidak tersedia di browser, perilaku fallback normal berlaku.

## Perilaku kegagalan

Impor yang buruk harus gagal secara tertutup.

- Format URL tidak valid: tampilkan kesalahan validasi inline, jangan lakukan fetch.
- Host atau bentuk path tidak didukung: tampilkan kesalahan validasi inline, jangan lakukan fetch.
- Kegagalan jaringan, respons non-OK, atau JSON tidak valid: tampilkan kesalahan inline, pertahankan payload tersimpan saat ini tanpa perubahan.
- Kegagalan skema atau blok light/dark yang hilang: tampilkan kesalahan inline, pertahankan payload tersimpan saat ini tanpa perubahan.
- Aksi Clear:
  - menghapus payload custom yang tersimpan
  - menghapus konten tag style custom terkelola
  - jika `custom` aktif, alihkan keluarga tema kembali ke `claw`
- Payload custom tersimpan tidak valid saat pemuatan pertama:
  - abaikan payload yang tersimpan
  - jangan hasilkan CSS kustom
  - jika keluarga tema yang dipersistenkan adalah `custom`, fallback ke `claw`

Pada titik mana pun, impor yang gagal tidak boleh meninggalkan dokumen aktif dengan variabel CSS kustom parsial yang diterapkan.

## File yang diperkirakan berubah dalam implementasi

File utama:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Helper baru yang mungkin:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Tes:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- tes terfokus baru untuk parsing URL dan normalisasi payload

## Pengujian

Cakupan implementasi minimum:

- parse URL share-link menjadi id tema tweakcn
- normalisasikan `/themes/{id}` dan `/r/themes/{id}` menjadi URL fetch
- tolak host yang tidak didukung dan id yang malformed
- validasi bentuk payload tweakcn
- petakan payload tweakcn yang valid menjadi peta token OpenClaw light dan dark yang dinormalisasi
- muat dan simpan payload kustom di pengaturan lokal-browser
- resolusikan `custom` untuk `light`, `dark`, dan `system`
- nonaktifkan pemilihan `Custom` ketika tidak ada payload
- terapkan tema yang diimpor segera ketika `custom` sudah aktif
- fallback ke `claw` ketika tema kustom aktif dibersihkan

Target verifikasi manual:

- impor tema tweakcn yang diketahui dari Settings
- beralih di antara `light`, `dark`, dan `system`
- beralih antara `custom` dan keluarga bawaan
- muat ulang halaman dan konfirmasi tema kustom yang diimpor tetap tersimpan secara lokal

## Catatan rollout

Fitur ini sengaja kecil. Jika pengguna nanti meminta banyak tema yang diimpor, penggantian nama, ekspor, atau sinkronisasi lintas perangkat, perlakukan itu sebagai desain lanjutan. Jangan membangun terlebih dahulu abstraksi pustaka tema dalam implementasi ini.
