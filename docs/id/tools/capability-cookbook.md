---
read_when:
    - Menambahkan kemampuan inti baru dan permukaan pendaftaran Plugin
    - Menentukan apakah kode harus berada di inti, Plugin vendor, atau Plugin fitur
    - Menyambungkan helper runtime baru untuk channel atau tool
sidebarTitle: Adding Capabilities
summary: Panduan kontributor untuk menambahkan kemampuan bersama baru ke sistem Plugin OpenClaw
title: Menambahkan kemampuan (panduan kontributor)
x-i18n:
    generated_at: "2026-04-25T13:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Ini adalah **panduan kontributor** untuk pengembang inti OpenClaw. Jika Anda
  sedang membangun Plugin eksternal, lihat [Building Plugins](/id/plugins/building-plugins)
  sebagai gantinya.
</Info>

Gunakan ini saat OpenClaw memerlukan domain baru seperti pembuatan gambar, video
generation, atau area fitur masa depan lain yang didukung vendor.

Aturannya:

- Plugin = batas kepemilikan
- kemampuan = kontrak inti bersama

Artinya, Anda tidak seharusnya mulai dengan menyambungkan vendor langsung ke channel atau
tool. Mulailah dengan mendefinisikan kemampuannya.

## Kapan membuat kemampuan

Buat kemampuan baru jika semua hal berikut benar:

1. lebih dari satu vendor secara masuk akal dapat mengimplementasikannya
2. channel, tool, atau Plugin fitur harus dapat mengonsumsinya tanpa peduli
   pada vendornya
3. inti perlu memiliki perilaku fallback, kebijakan, config, atau pengiriman

Jika pekerjaan ini hanya khusus vendor dan belum ada kontrak bersama, berhenti dan definisikan
kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti bertipe.
2. Tambahkan pendaftaran Plugin untuk kontrak tersebut.
3. Tambahkan helper runtime bersama.
4. Sambungkan satu Plugin vendor nyata sebagai bukti.
5. Pindahkan konsumen fitur/channel ke helper runtime.
6. Tambahkan uji kontrak.
7. Dokumentasikan config yang menghadap operator dan model kepemilikan.

## Apa ditempatkan di mana

Inti:

- tipe request/response
- registri provider + resolusi
- perilaku fallback
- skema config ditambah metadata docs `title` / `description` yang dipropagasikan pada node objek bertingkat, wildcard, item array, dan komposisi
- permukaan helper runtime

Plugin vendor:

- panggilan API vendor
- penanganan auth vendor
- normalisasi request khusus vendor
- pendaftaran implementasi kemampuan

Plugin fitur/channel:

- memanggil `api.runtime.*` atau helper `plugin-sdk/*-runtime` yang sesuai
- tidak pernah memanggil implementasi vendor secara langsung

## Seams provider dan harness

Gunakan hook provider saat perilaku tersebut termasuk dalam kontrak provider model
alih-alih loop agen generik. Contohnya termasuk param request khusus provider
setelah pemilihan transport, preferensi auth-profile, prompt overlay, dan
perutean fallback lanjutan setelah failover model/profile.

Gunakan hook harness agen saat perilaku tersebut termasuk dalam runtime yang
mengeksekusi suatu turn. Harness dapat mengklasifikasikan hasil upaya yang berhasil tetapi
tidak dapat digunakan, seperti respons kosong, hanya reasoning, atau hanya perencanaan, sehingga kebijakan
fallback model terluar dapat membuat keputusan retry.

Jaga kedua seam tetap sempit:

- inti memiliki kebijakan retry/fallback
- Plugin provider memiliki petunjuk request/auth/perutean khusus provider
- Plugin harness memiliki klasifikasi upaya khusus runtime
- Plugin pihak ketiga mengembalikan petunjuk, bukan mutasi langsung atas state inti

## Daftar file

Untuk kemampuan baru, perkirakan akan menyentuh area berikut:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- satu atau lebih paket Plugin bawaan
- config/docs/tests

## Contoh: pembuatan gambar

Pembuatan gambar mengikuti bentuk standar:

1. inti mendefinisikan `ImageGenerationProvider`
2. inti mengekspos `registerImageGenerationProvider(...)`
3. inti mengekspos `runtime.imageGeneration.generate(...)`
4. Plugin `openai`, `google`, `fal`, dan `minimax` mendaftarkan implementasi yang didukung vendor
5. vendor mendatang dapat mendaftarkan kontrak yang sama tanpa mengubah channel/tool

Key config terpisah dari perutean analisis vision:

- `agents.defaults.imageModel` = menganalisis gambar
- `agents.defaults.imageGenerationModel` = menghasilkan gambar

Pertahankan keduanya terpisah agar fallback dan kebijakan tetap eksplisit.

## Daftar periksa review

Sebelum merilis kemampuan baru, verifikasi:

- tidak ada channel/tool yang mengimpor kode vendor secara langsung
- helper runtime adalah jalur bersama
- setidaknya satu uji kontrak menyatakan kepemilikan bawaan
- docs config menyebutkan key model/config baru
- docs Plugin menjelaskan batas kepemilikan

Jika sebuah PR melewati lapisan kemampuan dan meng-hardcode perilaku vendor ke dalam
channel/tool, kembalikan dan definisikan kontraknya terlebih dahulu.

## Terkait

- [Plugin](/id/tools/plugin)
- [Creating skills](/id/tools/creating-skills)
- [Tools and plugins](/id/tools)
