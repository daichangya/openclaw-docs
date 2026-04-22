---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - Memahami model kapabilitas plugin atau batasan kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registri
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/id/tools/plugin) — panduan pengguna
  - [Getting Started](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun channel pesan
  - [Provider Plugins](/id/plugins/sdk-provider-plugins) — membangun provider model
  - [Ringkasan SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin OpenClaw native mendaftar pada satu atau lebih tipe kapabilitas:

| Kapabilitas          | Method registrasi                               | Contoh plugin                       |
| -------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferensi teks       | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend inferensi CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`               |
| Ucapan               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Transkripsi realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Suara realtime       | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Pemahaman media      | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Pembuatan gambar     | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik      | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Pembuatan video      | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Pengambilan web      | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Pencarian web        | `api.registerWebSearchProvider(...)`            | `google`                            |
| Channel / pesan      | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah diterapkan di core dan digunakan oleh plugin
bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih memerlukan standar
yang lebih ketat daripada “itu diekspor, berarti sudah dibekukan.”

Panduan saat ini:

- **plugin eksternal yang sudah ada:** pertahankan integrasi berbasis hook tetap berfungsi; perlakukan
  ini sebagai baseline kompatibilitas
- **plugin bundled/native baru:** utamakan registrasi kapabilitas eksplisit daripada reach-in spesifik vendor atau desain hook-only baru
- **plugin eksternal yang mengadopsi registrasi kapabilitas:** diperbolehkan, tetapi perlakukan
  permukaan helper spesifik kapabilitas sebagai sesuatu yang masih berkembang kecuali dokumentasi secara eksplisit menandai kontrak sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dituju
- hook legacy tetap merupakan jalur paling aman tanpa kerusakan untuk plugin eksternal selama
  transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak yang terdokumentasi secara sempit,
  bukan ekspor helper yang kebetulan ada

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam suatu bentuk berdasarkan perilaku
registrasinya yang sebenarnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu tipe kapabilitas (misalnya plugin
  khusus provider seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa tipe kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau kustom), tanpa kapabilitas,
  tool, perintah, atau layanan
- **non-capability** -- mendaftarkan tool, perintah, layanan, atau route tetapi tanpa
  kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin legacy di dunia nyata masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label berikut:

| Sinyal                     | Arti                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config berhasil di-parse dan plugin berhasil diselesaikan    |
| **compatibility advisory** | Plugin menggunakan pola lama yang masih didukung (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Config tidak valid atau plugin gagal dimuat                  |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat ini --
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini
juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ringkasan arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root workspace,
   root extension global, dan extension yang dibundel. Discovery membaca manifest native
   `openclaw.plugin.json` plus manifest bundle yang didukung terlebih dahulu.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memory.
3. **Runtime loading**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registri pusat. Bundle yang kompatibel dinormalisasi menjadi
   record registri tanpa mengimpor kode runtime.
4. **Surface consumption**
   Bagian lain dari OpenClaw membaca registri untuk mengekspos tool, channel, penyiapan provider,
   hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar saat pemanggilan pertama

Ini menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap memungkinkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari jalur `register(api)` modul plugin

Pemisahan ini memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang hilang/dinonaktifkan, dan
membangun hint UI/schema sebelum runtime penuh aktif.

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool kirim/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core, dan
plugin channel memiliki discovery dan eksekusi spesifik channel di baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery aksi terlingkup, discovery kapabilitas, dan fragmen schema
  spesifik channel
- plugin channel memiliki tata bahasa percakapan sesi spesifik provider, seperti
  bagaimana ID percakapan mengodekan ID thread atau mewarisi dari percakapan induk
- plugin channel mengeksekusi aksi final melalui adapter aksinya

Untuk plugin channel, permukaan SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu
itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas, dan kontribusi
schema bersama-sama sehingga bagian-bagian itu tidak saling menyimpang.

Saat parameter message-tool spesifik channel membawa sumber media seperti
path lokal atau URL media jarak jauh, plugin juga harus mengembalikan
`mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar eksplisit
itu untuk menerapkan normalisasi path sandbox dan hint akses media keluar
tanpa melakukan hardcode pada nama parameter milik plugin.
Utamakan peta dengan cakupan aksi di sana, bukan satu daftar datar untuk seluruh channel, sehingga
parameter media khusus profil tidak dinormalisasi pada aksi yang tidak terkait seperti
`send`.

Core meneruskan scope runtime ke langkah discovery tersebut. Field penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk yang tepercaya

Ini penting untuk plugin yang peka konteks. Sebuah channel dapat menyembunyikan atau mengekspos
aksi pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau
identitas peminta yang tepercaya tanpa melakukan hardcode pada cabang spesifik channel di
tool `message` core.

Inilah sebabnya perubahan routing embedded-runner tetap merupakan pekerjaan plugin: runner
bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas discovery plugin
agar tool `message` bersama mengekspos permukaan milik channel yang tepat untuk
giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundled harus menjaga runtime eksekusi
tetap berada di dalam modul extension milik mereka sendiri. Core tidak lagi memiliki runtime aksi pesan
Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan bundled
plugin harus mengimpor kode runtime lokal mereka sendiri langsung dari
modul milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor convenience barrel spesifik channel untuk Slack, Discord, Signal,
WhatsApp, atau extension serupa. Jika core memerlukan suatu perilaku, gunakan saja
barrel `api.ts` / `runtime-api.ts` milik plugin bundel itu sendiri atau promosikan kebutuhan tersebut
menjadi kapabilitas generik sempit di SDK bersama.

Khusus untuk polling, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang sesuai dengan model
  polling umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik polling spesifik channel
  atau parameter polling tambahan

Core sekarang menunda parsing polling bersama sampai setelah dispatch polling plugin menolak
aksi tersebut, sehingga handler polling milik plugin dapat menerima field polling spesifik channel
tanpa terhalang parser polling generik terlebih dahulu.

Lihat [Load pipeline](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah
**fitur**, bukan sebagai kumpulan integrasi tidak terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua
  permukaan OpenClaw yang menghadap perusahaan tersebut
- plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- channel harus menggunakan kapabilitas core bersama alih-alih mengimplementasikan ulang
  perilaku provider secara ad hoc

Contoh:

- plugin `openai` bawaan memiliki perilaku provider model OpenAI dan perilaku
  OpenAI untuk ucapan + suara realtime + pemahaman media + pembuatan gambar
- plugin `elevenlabs` bawaan memiliki perilaku ucapan ElevenLabs
- plugin `microsoft` bawaan memiliki perilaku ucapan Microsoft
- plugin `google` bawaan memiliki perilaku provider model Google plus perilaku
  Google untuk pemahaman media + pembuatan gambar + pencarian web
- plugin `firecrawl` bawaan memiliki perilaku pengambilan web Firecrawl
- plugin `minimax`, `mistral`, `moonshot`, dan `zai` bawaan memiliki backend
  pemahaman media mereka
- plugin `qwen` bawaan memiliki perilaku provider teks Qwen plus
  perilaku pemahaman media dan pembuatan video
- plugin `voice-call` adalah plugin fitur: ia memiliki transport panggilan, tool,
  CLI, route, dan bridging media-stream Twilio, tetapi menggunakan kapabilitas ucapan bersama
  plus transkripsi realtime dan suara realtime alih-alih mengimpor plugin vendor secara langsung

Keadaan akhir yang dimaksud adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, ucapan, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka menggunakan
  kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah perbedaan kuncinya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau digunakan oleh banyak plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan
“provider mana yang harus melakukan hardcode penanganan video?” Pertanyaan pertama adalah
“apa kontrak kapabilitas video di core?” Setelah kontrak itu ada, plugin vendor
dapat mendaftar padanya dan plugin channel/fitur dapat menggunakannya.

Jika kapabilitas itu belum ada, langkah yang tepat biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin dengan cara yang bertipe
3. hubungkan channel/fitur ke kapabilitas tersebut
4. biarkan plugin vendor mendaftarkan implementasinya

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang bergantung pada satu
vendor atau jalur kode spesifik plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode harus ditempatkan:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan merge
  config, semantik pengiriman, dan kontrak bertipe
- **lapisan plugin vendor**: API spesifik vendor, auth, katalog model, sintesis ucapan,
  pembuatan gambar, backend video di masa depan, endpoint penggunaan
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang menggunakan kapabilitas core dan menyajikannya pada suatu permukaan

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, pref, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` menggunakan helper runtime TTS teleponi

Pola yang sama harus diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, ucapan, transkripsi realtime, suara realtime, pemahaman
media, pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web,
sebuah vendor dapat memiliki semua permukaannya di satu tempat:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // config ucapan vendor — implementasikan interface SpeechProviderPlugin secara langsung
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // logika kredensial + fetch
      }),
    );
  },
};

export default plugin;
```

Yang penting bukan nama helper yang persis sama. Bentuknya yang penting:

- satu plugin memiliki permukaan vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur menggunakan helper `api.runtime.*`, bukan kode vendor
- contract test dapat menegaskan bahwa plugin telah mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama juga berlaku di sana:

1. core mendefinisikan kontrak pemahaman media
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` jika berlaku
3. plugin channel dan fitur menggunakan perilaku core bersama alih-alih
   menghubungkan langsung ke kode vendor

Ini menghindari asumsi video milik satu provider tertanam di core. Plugin memiliki
permukaan vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas bertipe dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh daftar periksa rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan enforcement

Permukaan API plugin sengaja dibuat bertipe dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik registrasi yang didukung dan
helper runtime yang dapat diandalkan oleh plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan
  ID provider yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk registrasi yang salah bentuk
- contract test dapat menegakkan kepemilikan plugin bundel dan mencegah drift diam-diam

Ada dua lapisan enforcement:

1. **enforcement registrasi runtime**
   Registri plugin memvalidasi registrasi saat plugin dimuat. Contohnya:
   ID provider duplikat, ID speech provider duplikat, dan registrasi yang salah bentuk
   menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **contract test**
   Plugin bundel ditangkap dalam registri kontrak selama test berjalan sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk model
   provider, speech provider, web search provider, dan kepemilikan registrasi bundel.

Efek praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki permukaan mana.
Ini memungkinkan core dan channel tersusun mulus karena kepemilikan
dideklarasikan, bertipe, dan dapat diuji alih-alih implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- bertipe
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh banyak plugin
- dapat digunakan oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik vendor yang tersembunyi di core
- jalur keluar plugin sekali pakai yang melewati registri
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, tingkatkan level abstraksinya: definisikan kapabilitasnya terlebih dahulu, lalu
biarkan plugin masuk ke dalamnya.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** dengan Gateway. Plugin tidak
disandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama seperti
kode core.

Implikasinya:

- plugin native dapat mendaftarkan tool, handler jaringan, hook, dan layanan
- bug plugin native dapat membuat gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya
sebagai paket metadata/konten. Pada rilis saat ini, itu sebagian besar berarti
skill yang dibundel.

Gunakan allowlist dan path instalasi/pemuatan eksplisit untuk plugin yang tidak dibundel. Perlakukan
plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace bundel, pertahankan ID plugin tetap berakar pada nama npm:
`@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` saat
paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **ID plugin**, bukan provenance sumber.
- Plugin workspace dengan ID yang sama seperti plugin bundel sengaja membayangi
  salinan bundel saat plugin workspace tersebut diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, test patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan convenience implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper spesifik plugin bundel
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience spesifik vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bundel masih tetap ada di peta ekspor SDK yang dihasilkan
untuk kompatibilitas dan pemeliharaan plugin bundel. Contoh saat ini mencakup
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk
plugin pihak ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw secara garis besar melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalisasi config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias legacy) dan mengumpulkan registrasi ke dalam registri plugin
8. mengekspos registri ke permukaan perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader menyelesaikan yang mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundel menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
saat entry keluar dari root plugin, path dapat ditulis oleh siapa saja, atau
kepemilikan path tampak mencurigakan untuk plugin yang tidak dibundel.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/skill/schema config atau kapabilitas bundle yang dideklarasikan
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog
- mempertahankan deskriptor aktivasi dan setup yang murah tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok `activation` dan `setup` manifest opsional tetap berada di control plane.
Itu adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan setup;
mereka tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama kini menggunakan hint perintah, channel, dan provider dari manifest
untuk mempersempit pemuatan plugin sebelum materialisasi registri yang lebih luas:

- Pemuatan CLI dipersempit ke plugin yang memiliki perintah utama yang diminta
- Resolusi setup/plugin channel dipersempit ke plugin yang memiliki
  ID channel yang diminta
- Resolusi setup/runtime provider eksplisit dipersempit ke plugin yang memiliki
  ID provider yang diminta

Discovery setup sekarang lebih mengutamakan ID milik descriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat plugin sebelum fallback ke
`setup-api` untuk plugin yang masih memerlukan hook runtime pada waktu setup. Jika lebih dari
satu plugin yang ditemukan mengklaim ID provider setup atau backend CLI ternormalisasi yang sama,
pencarian setup menolak pemilik yang ambigu tersebut alih-alih bergantung pada urutan discovery.

### Apa yang dicache loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil discovery
- data registri manifest
- registri plugin yang dimuat

Cache ini mengurangi startup yang bursty dan overhead perintah berulang. Aman
untuk menganggapnya sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registri

Plugin yang dimuat tidak langsung memutasi global core secara acak. Mereka mendaftar ke
registri plugin pusat.

Registri melacak:

- record plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook legacy dan hook bertipe
- channel
- provider
- handler RPC Gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registri tersebut alih-alih berbicara ke modul plugin
secara langsung. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> registrasi registri
- runtime core -> konsumsi registri

Pemisahan ini penting untuk kemudahan pemeliharaan. Artinya, sebagian besar permukaan core hanya
memerlukan satu titik integrasi: “baca registri”, bukan “buat kasus khusus untuk setiap modul
plugin”.

## Callback binding percakapan

Plugin yang mengikat percakapan dapat bereaksi saat suatu persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Binding sekarang ada untuk plugin + percakapan ini.
        console.log(event.binding?.conversationId);
        return;
      }

      // Permintaan ditolak; hapus status tertunda lokal apa pun.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, hint detach, ID pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat suatu
percakapan, dan callback berjalan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider kini memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk pencarian env-auth provider yang murah
  sebelum runtime dimuat, `providerAuthAliases` untuk varian provider yang berbagi
  auth, `channelEnvVars` untuk pencarian env/setup channel yang murah sebelum runtime
  dimuat, plus `providerAuthChoices` untuk label onboarding/pilihan auth yang murah dan
  metadata flag CLI sebelum runtime dimuat
- hook waktu config: `catalog` / `discovery` legacy plus `applyConfigDefaults`
- hook runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
kebijakan tool. Hook-hook ini adalah permukaan extension untuk perilaku spesifik provider tanpa
memerlukan transport inferensi kustom sepenuhnya.

Gunakan manifest `providerAuthEnvVars` saat provider memiliki kredensial berbasis env
yang harus terlihat oleh jalur auth/status/model-picker generik tanpa memuat runtime plugin.
Gunakan manifest `providerAuthAliases` saat satu ID provider harus menggunakan ulang
variabel env, profil auth, auth berbasis config, dan pilihan onboarding API-key milik ID provider lain. Gunakan manifest `providerAuthChoices` saat permukaan CLI onboarding/pilihan auth
harus mengetahui choice ID provider, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime provider. Simpan `envVars` runtime provider untuk hint yang menghadap operator
seperti label onboarding atau variabel setup OAuth
client-id/client-secret.

Gunakan manifest `channelEnvVars` saat suatu channel memiliki auth atau setup yang digerakkan oleh env
yang harus terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan hook dan penggunaan

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kira-kira seperti ini.
Kolom “Kapan digunakan” adalah panduan keputusan cepat.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan config provider ke `models.providers` selama pembuatan `models.json`                         | Provider memiliki katalog atau default base URL                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                   | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                              |
| --  | _(built-in model lookup)_         | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalkan alias model-id legacy atau pratinjau sebelum lookup                                               | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                         |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                              | Provider memiliki pembersihan transport untuk ID provider kustom dalam keluarga transport yang sama                                        |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                         | Provider memerlukan pembersihan config yang seharusnya berada bersama plugin; helper keluarga Google bundel juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas native streaming-usage ke provider config                           | Provider memerlukan perbaikan metadata native streaming usage yang didorong endpoint                                                       |
| 7   | `resolveConfigApiKey`             | Menyelesaikan auth penanda-env untuk provider config sebelum pemuatan auth runtime                            | Provider memiliki resolusi API key penanda-env milik provider; `amazon-bedrock` juga memiliki resolver penanda-env AWS bawaan di sini    |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa memersistenkan plaintext                        | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Meng-overlay profil auth eksternal milik provider; `persistence` default adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan ulang kredensial auth eksternal tanpa memersistenkan refresh token yang disalin                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config                       | Provider menyimpan profil placeholder sintetis yang seharusnya tidak menang dalam prioritas                                                |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk model ID milik provider yang belum ada di registri lokal                               | Provider menerima ID model upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                     | Provider memerlukan metadata jaringan sebelum menyelesaikan ID yang tidak dikenal                                                          |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model yang telah diselesaikan                       | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                      |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                       | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                     |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                             | Provider memerlukan keunikan transkrip/keluarga provider                                                                                   |
| 16  | `normalizeToolSchemas`            | Menormalkan schema tool sebelum embedded runner melihatnya                                                    | Provider memerlukan pembersihan schema keluarga transport                                                                                  |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                              | Provider ingin peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                                      |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                             | Provider memerlukan output reasoning/final bertag alih-alih field native                                                                  |
| 19  | `prepareExtraParams`              | Normalisasi param permintaan sebelum wrapper opsi stream generik                                              | Provider memerlukan param permintaan default atau pembersihan param per-provider                                                          |
| 20  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                              | Provider memerlukan wire protocol kustom, bukan sekadar wrapper                                                                            |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                             | Provider memerlukan wrapper kompatibilitas header/body/model permintaan tanpa transport kustom                                            |
| 22  | `resolveTransportTurnState`       | Menambahkan header atau metadata transport native per-giliran                                                 | Provider ingin transport generik mengirim identitas giliran native provider                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Menambahkan header WebSocket native atau kebijakan cooldown sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                          |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil tersimpan menjadi string `apiKey` runtime                                      | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                      |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                         | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                     |
| 26  | `buildAuthDoctorHint`             | Hint perbaikan yang ditambahkan saat refresh OAuth gagal                                                      | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                       |
| 27  | `matchesContextOverflowError`     | Pencocok overflow context-window milik provider                                                               | Provider memiliki kesalahan overflow mentah yang akan terlewat oleh heuristik generik                                                     |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                    | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                           |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                          | Provider memerlukan gating TTL cache spesifik proxy                                                                                        |
| 30  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                                | Provider memerlukan hint pemulihan missing-auth yang spesifik provider                                                                     |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream basi plus hint error opsional yang menghadap pengguna                                | Provider perlu menyembunyikan baris upstream basi atau menggantinya dengan hint vendor                                                    |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                               | Provider memerlukan baris kompatibilitas maju sintetis di `models list` dan picker                                                        |
| 33  | `resolveThinkingProfile`          | Set level `/think`, label tampilan, dan default yang spesifik model                                           | Provider mengekspos tangga thinking kustom atau label biner untuk model yang dipilih                                                      |
| 34  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning on/off                                                                   | Provider hanya mengekspos thinking biner hidup/mati                                                                                        |
| 35  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                | Provider menginginkan `xhigh` hanya pada subset model                                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level default `/think`                                                                    | Provider memiliki kebijakan default `/think` untuk keluarga model                                                                          |
| 37  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                            | Provider memiliki pencocokan model pilihan untuk live/smoke                                                                                |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                | Provider memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                             |
| 39  | `resolveUsageAuth`                | Menyelesaikan kredensial usage/billing untuk `/usage` dan permukaan status terkait                            | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                   |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot usage/kuota spesifik provider setelah auth diselesaikan                    | Provider memerlukan endpoint usage atau parser payload yang spesifik provider                                                               |
| 41  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                | Perilaku embedding memory harus berada bersama plugin provider                                                                             |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                            | Provider memerlukan kebijakan transkrip kustom (misalnya, penghapusan blok thinking)                                                      |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                            | Provider memerlukan penulisan ulang replay spesifik provider di luar helper Compaction bersama                                             |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay final sebelum embedded runner                                  | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                  |
| 45  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                       | Provider memerlukan telemetri atau status milik provider saat model menjadi aktif                                                          |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
plugin provider yang cocok, lalu melanjutkan ke plugin provider lain yang mampu hook
sampai salah satunya benar-benar mengubah model ID atau transport/config. Ini menjaga
shim alias/compat provider tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin bundel mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung,
normalizer config Google bawaan tetap menerapkan pembersihan kompatibilitas itu.

Jika provider memerlukan wire protocol sepenuhnya kustom atau executor permintaan kustom,
itu adalah kelas extension yang berbeda. Hook-hook ini ditujukan untuk perilaku provider
yang masih berjalan pada loop inferensi normal OpenClaw.

### Contoh provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Contoh bawaan

- Anthropic menggunakan `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  dan `wrapStreamFn` karena ia memiliki forward-compat Claude 4.6,
  hint keluarga provider, panduan perbaikan auth, integrasi endpoint usage,
  kelayakan prompt-cache, default config yang sadar auth, kebijakan thinking
  default/adaptif Claude, dan pembentukan stream khusus Anthropic untuk
  beta header, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream khusus Claude milik Anthropic untuk sementara tetap berada di
  seam `api.ts` / `contract-api.ts` publik milik plugin bundel tersebut. Permukaan paket itu
  mengekspor `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic tingkat lebih rendah alih-alih memperluas SDK generik di sekitar aturan
  beta-header satu provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, dan `isModernModelRef`
  karena ia memiliki forward-compat GPT-5.4, normalisasi langsung OpenAI
  `openai-completions` -> `openai-responses`, hint auth yang sadar Codex,
  penekanan Spark, baris daftar OpenAI sintetis, dan kebijakan thinking /
  model live GPT-5; keluarga stream `openai-responses-defaults` memiliki
  wrapper OpenAI Responses native bersama untuk attribution header,
  `/fast`/`serviceTier`, verbosity teks, pencarian web Codex native,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena provider bersifat pass-through dan dapat mengekspos
  model ID baru sebelum katalog statis OpenClaw diperbarui; provider ini juga menggunakan
  `capabilities`, `wrapStreamFn`, dan `isCacheTtlEligible` agar
  request header spesifik provider, metadata routing, patch reasoning, dan
  kebijakan prompt-cache tetap berada di luar core. Kebijakan replay-nya berasal dari
  keluarga `passthrough-gemini`, sedangkan keluarga stream `openrouter-thinking`
  memiliki injeksi reasoning proxy dan skip unsupported-model / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` plus `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena
  ia memerlukan login perangkat milik provider, perilaku fallback model, keunikan
  transkrip Claude, pertukaran token GitHub -> token Copilot, dan endpoint usage milik provider.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena
  ia masih berjalan pada transport OpenAI core tetapi memiliki normalisasi
  transport/base URL, kebijakan fallback refresh OAuth, pilihan transport default,
  baris katalog Codex sintetis, dan integrasi endpoint usage ChatGPT; provider ini
  berbagi keluarga stream `openai-responses-defaults` yang sama dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena
  keluarga replay `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output reasoning
  bertag, dan pencocokan model modern, sedangkan keluarga stream
  `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk pemformatan token, parsing token, dan wiring endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui
  keluarga replay `anthropic-by-model` sehingga pembersihan replay khusus Claude tetap
  dibatasi ke ID Claude alih-alih setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveThinkingProfile` karena ia memiliki
  klasifikasi error throttle/not-ready/context-overflow khusus Bedrock
  untuk traffic Anthropic-on-Bedrock; kebijakan replay-nya tetap berbagi
  guard khusus Claude `anthropic-by-model` yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui keluarga replay `passthrough-gemini` karena mereka mem-proxy model Gemini
  melalui transport yang kompatibel dengan OpenAI dan memerlukan
  sanitasi thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui
  keluarga replay `hybrid-anthropic-openai` karena satu provider memiliki semantik
  pesan Anthropic dan semantik yang kompatibel dengan OpenAI; provider ini menjaga
  pembuangan blok thinking khusus Claude pada sisi Anthropic sambil menimpa mode output reasoning
  kembali ke native, dan keluarga stream `minimax-fast-mode` memiliki penulisan ulang model
  fast-mode pada jalur stream bersama.
- Moonshot menggunakan `catalog`, `resolveThinkingProfile`, dan `wrapStreamFn` karena ia masih menggunakan
  transport OpenAI bersama tetapi memerlukan normalisasi payload thinking milik provider; keluarga stream
  `moonshot-thinking` memetakan config plus status `/think` ke payload
  thinking biner native-nya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena ia memerlukan request header milik provider,
  normalisasi payload reasoning, hint transkrip Gemini, dan gating cache-TTL
  Anthropic; keluarga stream `kilocode-thinking` menjaga injeksi thinking Kilo
  pada jalur stream proxy bersama sambil melewati `kilo/auto` dan
  model ID proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena ia memiliki fallback GLM-5,
  default `tool_stream`, UX thinking biner, pencocokan model modern, serta
  auth usage + pengambilan kuota; keluarga stream `tool-stream-default-on` menjaga
  wrapper `tool_stream` default-on tetap di luar glue tulisan tangan per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena ia memiliki normalisasi transport xAI Responses native, penulisan ulang alias
  fast-mode Grok, default `tool_stream`, pembersihan strict-tool / payload reasoning,
  penggunaan ulang auth fallback untuk tool milik plugin, resolusi model Grok
  forward-compat, dan patch kompatibilitas milik provider seperti profil schema tool xAI,
  keyword schema yang tidak didukung, `web_search` native, dan decoding argumen
  tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go menggunakan `capabilities` saja untuk menjaga
  keunikan transkrip/tooling tetap di luar core.
- Provider bundel khusus katalog seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine` hanya menggunakan
  `catalog`.
- Qwen menggunakan `catalog` untuk provider teksnya plus registrasi pemahaman media dan
  pembuatan video bersama untuk permukaan multimodalnya.
- MiniMax dan Xiaomi menggunakan `catalog` plus hook usage karena perilaku `/usage`
  mereka dimiliki plugin meskipun inferensi tetap berjalan melalui transport bersama.

## Helper runtime

Plugin dapat mengakses helper core tertentu melalui `api.runtime`. Untuk TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Catatan:

- `textToSpeech` mengembalikan payload output TTS core normal untuk permukaan file/voice-note.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk pemilih suara milik vendor atau alur setup.
- Daftar suara dapat mencakup metadata yang lebih kaya seperti locale, gender, dan tag personality untuk pemilih yang sadar-provider.
- OpenAI dan ElevenLabs mendukung teleponi saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan speech provider melalui `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Catatan:

- Simpan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan speech provider untuk perilaku sintesis milik vendor.
- Input Microsoft `edge` legacy dinormalkan ke ID provider `microsoft`.
- Model kepemilikan yang diutamakan berorientasi perusahaan: satu plugin vendor dapat memiliki
  provider teks, ucapan, gambar, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding bertipe alih-alih kantong key/value generik:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Catatan:

- Pertahankan orkestrasi, fallback, config, dan wiring channel di core.
- Pertahankan perilaku vendor di plugin provider.
- Ekspansi aditif harus tetap bertipe: method opsional baru, field hasil opsional
  baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel menggunakan `api.runtime.videoGeneration.*`

Untuk helper runtime media-understanding, plugin dapat memanggil:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Untuk transkripsi audio, plugin dapat menggunakan runtime media-understanding
atau alias STT yang lebih lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opsional saat MIME tidak dapat diinferensikan secara andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang diutamakan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` saat tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan run subagent latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah override per-run yang opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik plugin, operator harus melakukan opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk secara eksplisit mengizinkan target apa pun.
- Run subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat menggunakan helper runtime bersama alih-alih
menjangkau wiring tool agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin juga dapat mendaftarkan provider pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Simpan pemilihan provider, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan provider pencarian web untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: menghasilkan gambar menggunakan rantai provider image-generation yang dikonfigurasi.
- `listProviders(...)`: mencantumkan provider image-generation yang tersedia dan kapabilitasnya.

## Route HTTP Gateway

Plugin dapat mengekspos endpoint HTTP dengan `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Field route:

- `path`: path route di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth terkelola plugin/verifikasi Webhook.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan plugin yang sama mengganti registrasi route miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat route menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang sama ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti route milik plugin lain.
- Route yang tumpang tindih dengan level `auth` berbeda ditolak. Simpan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** otomatis menerima scope runtime operator. Route ini ditujukan untuk Webhook terkelola plugin/verifikasi signature, bukan panggilan helper Gateway yang memiliki hak istimewa.
- Route `auth: "gateway"` berjalan di dalam scope runtime permintaan Gateway, tetapi scope itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga scope runtime route plugin tetap dipatok ke `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` saat header tersebut benar-benar ada
  - jika `x-openclaw-scopes` tidak ada pada permintaan route plugin yang membawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan menganggap route plugin dengan auth gateway sebagai permukaan admin implisit. Jika route Anda memerlukan perilaku admin-only, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitive registrasi plugin.
- `openclaw/plugin-sdk/core` untuk kontrak umum bersama yang menghadap plugin.
- `openclaw/plugin-sdk/config-schema` untuk ekspor schema Zod root `openclaw.json`
  (`OpenClawSchema`).
- Primitive channel stabil seperti `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, dan
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring
  setup/auth/balasan/webhook bersama. `channel-inbound` adalah rumah bersama untuk debounce, pencocokan mention,
  helper kebijakan mention masuk, pemformatan envelope, dan helper konteks
  envelope masuk.
  `channel-setup` adalah seam setup optional-install yang sempit.
  `setup-runtime` adalah permukaan setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup tertunda, termasuk adapter patch setup yang aman untuk impor.
  `setup-adapter-runtime` adalah seam adapter setup akun yang sadar-env.
  `setup-tools` adalah seam helper kecil CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpath domain seperti `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, dan
  `openclaw/plugin-sdk/directory-runtime` untuk helper runtime/config bersama.
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi perintah kustom Telegram dan tetap tersedia meskipun permukaan kontrak Telegram bundel untuk sementara tidak tersedia.
  `text-runtime` adalah seam teks/Markdown/logging bersama, termasuk
  penghapusan teks yang terlihat oleh asisten, helper render/chunking Markdown, helper redaksi,
  helper directive-tag, dan utilitas teks aman.
- Seam channel khusus persetujuan harus mengutamakan satu kontrak `approvalCapability`
  pada plugin. Core kemudian membaca auth, pengiriman, render,
  native-routing, dan perilaku native-handler lazy persetujuan melalui satu kapabilitas itu
  alih-alih mencampurkan perilaku persetujuan ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan hanya tetap ada sebagai
  shim kompatibilitas untuk plugin lama. Kode baru harus mengimpor primitive generik yang lebih sempit sebagai gantinya, dan kode repo tidak boleh menambahkan impor baru dari
  shim tersebut.
- Internal extension bundel tetap privat. Plugin eksternal harus menggunakan hanya
  subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat menggunakan titik masuk publik repo
  di bawah root paket plugin seperti `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, dan file yang dibatasi secara sempit seperti
  `login-qr-api.js`. Jangan pernah mengimpor `src/*` dari paket plugin dari core atau dari
  extension lain.
- Pemisahan titik masuk repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel khusus runtime,
  `<plugin-package-root>/index.js` adalah entri plugin bundel,
  dan `<plugin-package-root>/setup-entry.js` adalah entri plugin setup.
- Contoh provider bundel saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper model default, dan
    builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder providernya plus helper
    onboarding/config, sementara `register.runtime.js` masih dapat mengekspor ulang helper
    `plugin-sdk/provider-stream` generik untuk penggunaan lokal repo.
- Titik masuk publik yang dimuat lewat facade mengutamakan snapshot config runtime aktif
  saat tersedia, lalu fallback ke file config yang diselesaikan di disk saat
  OpenClaw belum menyajikan snapshot runtime.
- Primitive bersama generik tetap menjadi kontrak SDK publik yang diutamakan. Sejumlah kecil seam helper bermerek channel bundel yang dicadangkan masih ada. Perlakukan itu sebagai seam pemeliharaan bundel/kompatibilitas, bukan target impor pihak ketiga yang baru; kontrak lintas-channel baru tetap harus ditempatkan pada subpath `plugin-sdk/*` generik atau barrel `api.js` /
  `runtime-api.js` lokal plugin.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitive stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dimaksud untuk pekerjaan plugin
  bundel dan eksternal yang baru.
  Parsing/pencocokan target berada di `openclaw/plugin-sdk/channel-targets`.
  Gate aksi pesan dan helper message-id reaksi berada di
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper spesifik extension bundel tidak stabil secara default. Jika suatu
  helper hanya diperlukan oleh extension bundel, simpan di balik seam lokal `api.js` atau `runtime-api.js` milik extension tersebut alih-alih mempromosikannya ke
  `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama yang baru harus generik, bukan bermerek channel. Parsing target bersama
  berada di `openclaw/plugin-sdk/channel-targets`; internal spesifik channel
  tetap berada di balik seam `api.js` atau `runtime-api.js` lokal milik plugin yang bersangkutan.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native
  menggunakannya saat ini. Kehadirannya tidak otomatis berarti setiap helper yang diekspor adalah
  kontrak eksternal jangka panjang yang dibekukan.

## Skema tool pesan

Plugin harus memiliki kontribusi schema `describeMessageTool(...)` yang spesifik channel
untuk primitive non-pesan seperti reaksi, read, dan polling.
Presentasi pengiriman bersama harus menggunakan kontrak `MessagePresentation` generik
alih-alih field button, component, block, atau card native provider.
Lihat [Message Presentation](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan daftar periksa penulis plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang dipin

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos jalur keluar UI native provider dari tool pesan generik.
Helper SDK yang sudah deprecated untuk schema native legacy tetap diekspor untuk plugin pihak ketiga
yang sudah ada, tetapi plugin baru tidak boleh menggunakannya.

## Resolusi target channel

Plugin channel harus memiliki semantik target spesifik channel. Pertahankan host outbound bersama tetap generik dan gunakan permukaan adapter messaging untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target ternormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum pencarian direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah suatu
  input harus langsung melompat ke resolusi mirip-ID alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi final milik provider setelah normalisasi atau setelah direktori
  gagal menemukan target.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi spesifik provider
  setelah target berhasil diselesaikan.

Pemisahan yang disarankan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  pencarian peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan “perlakukan ini sebagai ID target eksplisit/native”.
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan untuk
  pencarian direktori yang luas.
- Simpan ID native provider seperti chat ID, thread ID, JID, handle, dan room ID
  di dalam nilai `target` atau param spesifik provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config harus menyimpan logika itu di dalam
plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat suatu channel memerlukan peer/grup berbasis config seperti:

- peer DM yang digerakkan allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis dengan cakupan akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan limit
- helper deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun spesifik channel dan normalisasi ID harus tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat plugin memiliki model ID spesifik provider, default base URL, atau metadata model yang digerakkan auth.

`catalog.order` mengontrol kapan katalog plugin di-merge relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider API-key polos atau yang digerakkan env
- `profile`: provider yang muncul saat profil auth ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada benturan key, sehingga plugin dapat dengan sengaja menimpa entri provider bawaan dengan provider ID yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan suatu channel, utamakan implementasi
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi bahwa kredensial
  sudah dimaterialisasi sepenuhnya dan dapat gagal cepat saat secret yang diperlukan hilang.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/perbaikan config
  seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang disarankan:

- Kembalikan hanya status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat suatu kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan “dikonfigurasi tetapi tidak tersedia pada jalur perintah ini” alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Paket pack

Direktori plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa extension, ID plugin
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Pengaman keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependensi dev saat runtime). Jaga tree dependensi plugin tetap “pure JS/TS” dan hindari paket yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Saat OpenClaw memerlukan permukaan setup untuk plugin channel yang dinonaktifkan, atau
saat plugin channel diaktifkan tetapi masih belum dikonfigurasi, ia memuat `setupEntry`
alih-alih entri plugin penuh. Ini menjaga startup dan setup tetap lebih ringan
saat entri plugin utama Anda juga menghubungkan tool, hook, atau kode khusus runtime
lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat plugin channel memilih jalur `setupEntry` yang sama selama fase startup
pra-listen gateway, bahkan saat channel sudah dikonfigurasi.

Gunakan ini hanya saat `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti entri setup
harus mendaftarkan setiap kapabilitas milik channel yang diandalkan startup, seperti:

- registrasi channel itu sendiri
- route HTTP apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- method Gateway, tool, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup wajib apa pun, jangan aktifkan
flag ini. Pertahankan perilaku default plugin dan biarkan OpenClaw memuat
entri penuh selama startup.

Channel bundel juga dapat menerbitkan helper contract-surface khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promosi setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu saat perlu mempromosikan config channel akun tunggal legacy
ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh.
Matrix adalah contoh bundel saat ini: ia hanya memindahkan kunci auth/bootstrap ke akun bernama yang dipromosikan saat akun bernama sudah ada, dan ia dapat mempertahankan kunci default-account non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup tersebut menjaga discovery contract-surface bundel tetap lazy. Waktu impor tetap ringan; permukaan promosi dimuat hanya saat pertama digunakan alih-alih masuk ulang ke startup channel bundel pada impor modul.

Saat permukaan startup tersebut mencakup method RPC Gateway, simpan pada
awalan khusus plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diselesaikan
ke `operator.admin`, bahkan jika plugin meminta scope yang lebih sempit.

Contoh:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata katalog channel

Plugin channel dapat mengiklankan metadata setup/discovery melalui `openclaw.channel` dan
hint install melalui `openclaw.install`. Ini menjaga data katalog core tetap bebas data.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted melalui bot webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Field `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: menimpa teks tautan untuk tautan dokumentasi
- `preferOver`: ID plugin/channel prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai channel sebagai mampu Markdown untuk keputusan pemformatan keluar
- `exposure.configured`: menyembunyikan channel dari permukaan daftar channel yang dikonfigurasi saat diatur ke `false`
- `exposure.setup`: menyembunyikan channel dari picker setup/configure interaktif saat diatur ke `false`
- `exposure.docs`: menandai channel sebagai internal/privat untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: membuat channel memilih alur `allowFrom` quickstart standar
- `forceAccountBinding`: mewajibkan binding akun eksplisit bahkan saat hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: mengutamakan pencarian sesi saat menyelesaikan target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor
registri MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan dengan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk key `"entries"`.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih hanya menambahkan pencarian memory atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jika engine Anda **tidak** memiliki algoritma compaction, pertahankan `compact()`
tetap diimplementasikan dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan kapabilitas baru

Saat plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang disarankan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, merge config,
   siklus hidup, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime plugin yang bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas bertipe
   terkecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur harus menggunakan kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar kepemilikan dan bentuk registrasi tetap eksplisit dari waktu ke waktu.

Beginilah OpenClaw tetap opinionated tanpa menjadi hardcoded pada
sudut pandang satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk daftar periksa file konkret dan contoh yang sudah dikerjakan.

### Daftar periksa kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh permukaan berikut secara bersamaan:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- permukaan registrasi API plugin di `src/plugins/types.ts`
- wiring registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel
  perlu menggunakannya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu permukaan tersebut hilang, biasanya itu adalah tanda bahwa kapabilitasnya
belum terintegrasi sepenuhnya.

### Template kapabilitas

Pola minimal:

```ts
// kontrak core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime bersama untuk plugin fitur/channel
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola contract test:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel menggunakan helper runtime
- contract test menjaga kepemilikan tetap eksplisit
