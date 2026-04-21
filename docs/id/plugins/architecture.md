---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - Memahami model kapabilitas plugin atau batas ownership
    - Mengerjakan pipeline pemuatan plugin atau registry
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, ownership, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-21T09:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/id/tools/plugin) — panduan pengguna
  - [Memulai](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Plugin Channel](/id/plugins/sdk-channel-plugins) — bangun channel perpesanan
  - [Plugin Provider](/id/plugins/sdk-provider-plugins) — bangun provider model
  - [Ringkasan SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin OpenClaw native mendaftar terhadap satu atau lebih tipe kapabilitas:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / perpesanan   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke core dan digunakan oleh plugin
bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih
memerlukan standar yang lebih ketat daripada “ini diekspor, jadi dibekukan.”

Panduan saat ini:

- **plugin eksternal yang ada:** pertahankan integrasi berbasis hook tetap berfungsi; perlakukan
  ini sebagai baseline kompatibilitas
- **plugin bundled/native baru:** utamakan registrasi kapabilitas eksplisit daripada
  reach-in khusus vendor atau desain hook-only baru
- **plugin eksternal yang mengadopsi registrasi kapabilitas:** diizinkan, tetapi perlakukan
  surface helper spesifik kapabilitas sebagai sesuatu yang berkembang kecuali dokumentasi secara eksplisit menandai kontrak sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dituju
- hook lama tetap menjadi jalur paling aman tanpa kerusakan untuk plugin eksternal selama
  transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak sempit yang terdokumentasi,
  bukan ekspor helper yang kebetulan ada

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam sebuah bentuk berdasarkan
perilaku registrasi aktualnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu tipe kapabilitas (misalnya plugin
  hanya-provider seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa tipe kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa kapabilitas,
  tool, perintah, atau layanan
- **non-capability** -- mendaftarkan tool, perintah, layanan, atau route tetapi tanpa
  kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk detail.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin dunia nyata lama masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai lama
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label ini:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config ter-parse dengan baik dan plugin berhasil di-resolve  |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Config tidak valid atau plugin gagal dimuat                  |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda hari ini --
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini
juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ringkasan arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root workspace,
   root extension global, dan extension bundled. Discovery terlebih dahulu membaca
   manifest native `openclaw.plugin.json` ditambah manifest bundle yang didukung.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memory.
3. **Runtime loading**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi menjadi
   record registry tanpa mengimpor kode runtime.
4. **Surface consumption**
   Sisa OpenClaw membaca registry untuk mengekspos tool, channel, penyiapan provider,
   hook, HTTP route, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar pada pemanggilan pertama

Itu menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap membiarkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari jalur `register(api)` modul plugin

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang hilang/dinonaktifkan, dan
membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool send/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core, dan
plugin channel memiliki discovery serta eksekusi spesifik channel di belakangnya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery aksi yang dibatasi, discovery kapabilitas, dan
  setiap fragmen schema spesifik channel
- plugin channel memiliki tata bahasa percakapan sesi spesifik provider, seperti
  bagaimana ID percakapan mengodekan thread ID atau mewarisi dari percakapan induk
- plugin channel mengeksekusi aksi akhir melalui adapter aksi mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu
itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas, dan
kontribusi schema secara bersama agar bagian-bagian itu tidak saling melenceng.

Saat sebuah param message-tool spesifik channel membawa sumber media seperti
path lokal atau URL media remote, plugin juga harus mengembalikan
`mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar
eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar
tanpa melakukan hardcode nama param milik plugin.
Utamakan map yang dibatasi aksi di sana, bukan satu daftar datar seluruh channel, sehingga
param media khusus profil tidak dinormalisasi pada aksi yang tidak terkait seperti
`send`.

Core meneruskan scope runtime ke langkah discovery tersebut. Field penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk yang tepercaya

Ini penting untuk plugin yang sadar-konteks. Sebuah channel dapat menyembunyikan atau mengekspos
aksi pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau
identitas requester tepercaya tanpa melakukan hardcode cabang spesifik channel di
tool `message` core.

Inilah mengapa perubahan routing embedded-runner masih merupakan pekerjaan plugin: runner bertanggung
jawab meneruskan identitas chat/sesi saat ini ke batas discovery plugin sehingga tool `message`
bersama mengekspos surface milik channel yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundled harus menjaga runtime eksekusi
tetap berada di dalam modul extension mereka sendiri. Core tidak lagi memiliki runtime aksi pesan
Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan plugin
bundled harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama-provider secara umum: core tidak
boleh mengimpor convenience barrel spesifik channel untuk Slack, Discord, Signal,
WhatsApp, atau extension serupa. Jika core memerlukan suatu perilaku, konsumsilah
`api.ts` / `runtime-api.ts` barrel milik plugin bundled itu sendiri atau promosikan kebutuhan
tersebut menjadi kapabilitas generik sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang sesuai dengan model
  poll umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik poll
  spesifik channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll plugin menolak
aksi tersebut, sehingga handler poll milik plugin dapat menerima field poll spesifik channel tanpa
terhalang oleh parser poll generik terlebih dahulu.

Lihat [Load pipeline](#load-pipeline) untuk urutan startup lengkap.

## Model ownership kapabilitas

OpenClaw memperlakukan plugin native sebagai batas ownership untuk sebuah **perusahaan** atau
sebuah **fitur**, bukan sebagai kumpulan integrasi tak terkait.

Itu berarti:

- plugin perusahaan biasanya harus memiliki semua
  surface yang berhadapan dengan OpenClaw milik perusahaan itu
- plugin fitur biasanya harus memiliki surface fitur penuh yang diperkenalkannya
- channel harus mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan ulang
  perilaku provider secara ad hoc

Contoh:

- plugin `openai` bawaan memiliki perilaku provider model OpenAI dan perilaku OpenAI
  untuk speech + realtime-voice + media-understanding + image-generation
- plugin `elevenlabs` bawaan memiliki perilaku speech ElevenLabs
- plugin `microsoft` bawaan memiliki perilaku speech Microsoft
- plugin `google` bawaan memiliki perilaku provider model Google serta perilaku Google
  untuk media-understanding + image-generation + web-search
- plugin `firecrawl` bawaan memiliki perilaku web-fetch Firecrawl
- plugin `minimax`, `mistral`, `moonshot`, dan `zai` bawaan memiliki backend
  media-understanding mereka
- plugin `qwen` bawaan memiliki perilaku provider teks Qwen serta
  perilaku media-understanding dan video-generation
- plugin `voice-call` adalah plugin fitur: ia memiliki transport panggilan, tool,
  CLI, route, dan bridging media-stream Twilio, tetapi mengonsumsi kapabilitas speech bersama
  plus realtime-transcription dan realtime-voice alih-alih
  mengimpor plugin vendor secara langsung

Keadaan akhir yang dituju adalah:

- OpenAI hidup dalam satu plugin meskipun mencakup model teks, speech, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface miliknya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka mengonsumsi
  kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah perbedaan kuncinya:

- **plugin** = batas ownership
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi oleh beberapa plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan
“provider mana yang harus meng-hardcode penanganan video?” Pertanyaan pertama adalah “apa
kontrak kapabilitas video di core?” Setelah kontrak itu ada, plugin vendor
dapat mendaftar terhadapnya dan plugin channel/fitur dapat mengonsumsinya.

Jika kapabilitas tersebut belum ada, langkah yang biasanya benar adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin secara bertipe
3. hubungkan channel/fitur terhadap kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasinya

Ini menjaga ownership tetap eksplisit sambil menghindari perilaku core yang bergantung pada
satu vendor atau satu jalur kode khusus plugin.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan tempat kode berada:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan merge config,
  semantik pengiriman, dan kontrak bertipe
- **lapisan plugin vendor**: API spesifik vendor, auth, katalog model, speech
  synthesis, image generation, backend video masa depan, endpoint usage
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menyajikannya pada sebuah surface

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi synthesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Sebuah plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama
untuk model, speech, transkripsi realtime, suara realtime, pemahaman media,
pembuatan gambar, pembuatan video, web fetch, dan web search,
sebuah vendor dapat memiliki semua surface miliknya di satu tempat:

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
      // hook auth/katalog model/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // config speech vendor — implementasikan interface SpeechProviderPlugin secara langsung
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

Yang penting bukan nama helper yang tepat. Yang penting adalah bentuknya:

- satu plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- test kontrak dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model ownership yang sama berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. plugin channel dan fitur mengonsumsi perilaku core bersama alih-alih
   menghubungkan langsung ke kode vendor

Ini menghindari menanam asumsi video dari satu provider ke dalam core. Plugin memiliki
surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas bertipe dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan enforcement

Surface API plugin sengaja dibuat bertipe dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik registrasi yang didukung dan
helper runtime yang dapat diandalkan oleh plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak ownership duplikat seperti dua plugin yang mendaftarkan provider id yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk registrasi yang malformed
- test kontrak dapat menegakkan ownership plugin bawaan dan mencegah drift diam-diam

Ada dua lapisan enforcement:

1. **runtime registration enforcement**
   Registry plugin memvalidasi registrasi saat plugin dimuat. Contohnya:
   provider id duplikat, speech provider id duplikat, dan registrasi
   yang malformed menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **test kontrak**
   Plugin bawaan ditangkap dalam registry kontrak selama test berjalan sehingga
   OpenClaw dapat menegaskan ownership secara eksplisit. Saat ini ini digunakan untuk model
   provider, speech provider, web search provider, dan ownership registrasi bawaan.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang memiliki surface mana.
Ini memungkinkan core dan channel tersusun dengan mulus karena ownership
dideklarasikan, bertipe, dan dapat diuji alih-alih implisit.

### Apa yang termasuk dalam sebuah kontrak

Kontrak plugin yang baik adalah:

- bertipe
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh banyak plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik vendor yang disembunyikan di core
- jalur escape plugin one-off yang melewati registry
- kode channel yang menjangkau langsung ke implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan level abstraksinya: definisikan kapabilitasnya dulu, lalu
biarkan plugin memasangnya.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** bersama Gateway. Mereka tidak
di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan level proses yang sama seperti
kode core.

Implikasi:

- plugin native dapat mendaftarkan tool, handler jaringan, hook, dan layanan
- bug pada plugin native dapat menyebabkan gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya
sebagai paket metadata/konten. Pada rilis saat ini, ini terutama berarti
Skills bawaan.

Gunakan allowlist dan jalur instalasi/pemuatan eksplisit untuk plugin non-bawaan. Perlakukan
plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama package workspace bawaan, pertahankan plugin id tetap terkait di nama npm:
`@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` saat
package memang mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **plugin id**, bukan provenance sumber.
- Plugin workspace dengan id yang sama seperti plugin bawaan sengaja membayangi
  salinan bawaan saat plugin workspace tersebut diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan spesifik vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bawaan masih tetap ada di peta ekspor SDK yang dihasilkan
untuk kompatibilitas dan pemeliharaan plugin bawaan. Contoh saat ini termasuk
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan
untuk plugin pihak ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw secara umum melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle yang kompatibel beserta metadata package
3. menolak kandidat yang tidak aman
4. menormalkan config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias lama) dan mengumpulkan registrasi ke dalam registry plugin
8. mengekspos registry ke surface perintah/runtime

<Note>
`activate` adalah alias lama untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bawaan menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
saat entry keluar dari root plugin, path dapat ditulis oleh semua orang, atau
ownership path terlihat mencurigakan untuk plugin non-bawaan.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/Skills/schema config yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog
- mempertahankan descriptor aktivasi dan penyiapan murah tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian data-plane. Ia mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok `activation` dan `setup` manifest opsional tetap berada di control plane.
Mereka adalah descriptor metadata saja untuk perencanaan aktivasi dan discovery penyiapan;
mereka tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi langsung pertama kini menggunakan petunjuk perintah, channel, dan provider dari manifest
untuk mempersempit pemuatan plugin sebelum materialisasi registry yang lebih luas:

- Pemuatan CLI dipersempit ke plugin yang memiliki primary command yang diminta
- Resolusi channel setup/plugin dipersempit ke plugin yang memiliki
  channel id yang diminta
- Resolusi setup/runtime provider eksplisit dipersempit ke plugin yang memiliki
  provider id yang diminta

Discovery penyiapan sekarang mengutamakan ID milik descriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat plugin sebelum fallback ke
`setup-api` untuk plugin yang masih memerlukan hook runtime saat penyiapan. Jika lebih dari
satu plugin yang ditemukan mengklaim provider penyiapan atau CLI backend ID yang telah dinormalisasi yang sama,
lookup penyiapan menolak owner yang ambigu tersebut alih-alih bergantung pada urutan discovery.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache in-process singkat untuk:

- hasil discovery
- data registry manifest
- registry plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead perintah berulang. Aman
untuk dipahami sebagai cache performa berumur pendek, bukan persistence.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak langsung memodifikasi global core acak. Mereka mendaftar ke
registry plugin pusat.

Registry melacak:

- record plugin (identitas, sumber, origin, status, diagnostik)
- tool
- hook lama dan hook bertipe
- channel
- provider
- handler Gateway RPC
- HTTP route
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung dengan modul
plugin. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk maintainability. Itu berarti sebagian besar surface core hanya
membutuhkan satu titik integrasi: “baca registry”, bukan “buat special-case untuk setiap modul plugin”.

## Callback conversation binding

Plugin yang melakukan binding percakapan dapat bereaksi saat persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Sebuah binding sekarang ada untuk plugin + percakapan ini.
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
- `binding`: binding yang di-resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, sender id, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Ia tidak mengubah siapa yang diizinkan untuk melakukan binding
percakapan, dan dijalankan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider kini memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup auth env provider murah
  sebelum runtime dimuat, `providerAuthAliases` untuk varian provider yang berbagi
  auth, `channelEnvVars` untuk lookup env/setup channel murah sebelum runtime
  dimuat, ditambah `providerAuthChoices` untuk label onboarding/auth-choice murah dan
  metadata flag CLI sebelum runtime dimuat
- hook waktu-config: `catalog` / `discovery` lama plus `applyConfigDefaults`
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
tool policy. Hook-hook ini adalah surface extension untuk perilaku spesifik provider tanpa
memerlukan seluruh transport inferensi kustom.

Gunakan manifest `providerAuthEnvVars` saat provider memiliki kredensial berbasis env
yang perlu dilihat jalur auth/status/model-picker generik tanpa memuat runtime plugin.
Gunakan manifest `providerAuthAliases` saat satu provider id harus menggunakan kembali
env vars, auth profile, auth berbasis config, dan pilihan onboarding API-key dari provider id lain.
Gunakan manifest `providerAuthChoices` saat surface CLI onboarding/auth-choice
perlu mengetahui choice id provider, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime provider. Pertahankan runtime provider `envVars` untuk petunjuk yang menghadap operator
seperti label onboarding atau variabel penyiapan OAuth
client-id/client-secret.

Gunakan manifest `channelEnvVars` saat sebuah channel memiliki auth atau setup berbasis env
yang perlu dilihat shell-env fallback generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan hook dan penggunaannya

Untuk plugin model/provider, OpenClaw memanggil hook secara kira-kira dalam urutan ini.
Kolom “Kapan digunakan” adalah panduan keputusan cepat.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan config provider ke `models.providers` saat pembuatan `models.json`                            | Provider memiliki katalog atau default base URL                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider saat materialisasi config                                      | Default bergantung pada mode auth, env, atau semantik model-family provider                                                                 |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalkan alias model-id lama atau pratinjau sebelum lookup                                                  | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                          |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` family-provider sebelum perakitan model generik                                  | Provider memiliki pembersihan transport untuk provider id kustom dalam family transport yang sama                                           |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan config yang seharusnya berada bersama plugin; helper bawaan family Google juga menjadi penyangga untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas native streaming-usage ke config provider                            | Provider memerlukan perbaikan metadata native streaming usage yang didorong endpoint                                                        |
| 7   | `resolveConfigApiKey`             | Me-resolve auth env-marker untuk config provider sebelum pemuatan auth runtime                                 | Provider memiliki resolusi API key env-marker milik provider; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini        |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                              | Provider dapat beroperasi dengan marker kredensial synthetic/lokal                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Menimpa auth profile eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan ulang kredensial auth eksternal tanpa menyimpan refresh token yang disalin                                           |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder synthetic profile yang tersimpan di bawah auth berbasis env/config                      | Provider menyimpan synthetic placeholder profile yang seharusnya tidak menang prioritas                                                     |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk model id milik provider yang belum ada di registry lokal                                | Provider menerima model id upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Warm-up asinkron, lalu `resolveDynamicModel` dijalankan lagi                                                   | Provider memerlukan metadata jaringan sebelum me-resolve ID yang tidak dikenal                                                             |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum embedded runner menggunakan model yang telah di-resolve                          | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                       |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                        | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                      |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan kekhususan transkrip/family provider                                                                                    |
| 16  | `normalizeToolSchemas`            | Menormalkan schema tool sebelum embedded runner melihatnya                                                     | Provider memerlukan pembersihan schema family-transport                                                                                     |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                               | Provider menginginkan peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                                |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs tagged                                                              | Provider memerlukan output reasoning/final yang ditandai alih-alih field native                                                            |
| 19  | `prepareExtraParams`              | Normalisasi param request sebelum wrapper opsi stream generik                                                  | Provider memerlukan param request default atau pembersihan param per-provider                                                               |
| 20  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Provider memerlukan wire protocol kustom, bukan sekadar wrapper                                                                             |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper kompatibilitas header/body/model request tanpa transport kustom                                                 |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport per-giliran native                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                            |
| 24  | `formatApiKey`                    | Formatter auth-profile: profile yang disimpan menjadi string `apiKey` runtime                                  | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                        |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                       |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                         |
| 27  | `matchesContextOverflowError`     | Matcher overflow context-window milik provider                                                                 | Provider memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                           |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                            |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache spesifik proxy                                                                                         |
| 30  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan missing-auth generik                                                           | Provider memerlukan petunjuk pemulihan missing-auth spesifik provider                                                                       |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream usang plus petunjuk error yang menghadap pengguna secara opsional                    | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                 |
| 32  | `augmentModelCatalog`             | Baris katalog synthetic/final ditambahkan setelah discovery                                                    | Provider memerlukan baris forward-compat synthetic di `models list` dan picker                                                              |
| 33  | `resolveThinkingProfile`          | Set level `/think`, label tampilan, dan default yang spesifik model                                            | Provider mengekspos tangga thinking kustom atau label biner untuk model tertentu                                                            |
| 34  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning nyala/mati                                                                | Provider hanya mengekspos thinking biner nyala/mati                                                                                         |
| 35  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                 | Provider menginginkan `xhigh` hanya pada subset model tertentu                                                                              |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                     | Provider memiliki kebijakan `/think` default untuk sebuah family model                                                                      |
| 37  | `isModernModelRef`                | Matcher model modern untuk filter profile live dan pemilihan smoke                                             | Provider memiliki pencocokan model pilihan untuk live/smoke                                                                                |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime yang sebenarnya tepat sebelum inferensi       | Provider memerlukan pertukaran token atau kredensial request yang berumur pendek                                                            |
| 39  | `resolveUsageAuth`                | Me-resolve kredensial usage/billing untuk `/usage` dan surface status terkait                                  | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                     |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot usage/kuota spesifik provider setelah auth di-resolve                      | Provider memerlukan endpoint usage atau parser payload yang spesifik provider                                                               |
| 41  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                 | Perilaku embedding memory seharusnya berada bersama plugin provider                                                                         |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya, penghapusan blok thinking)                                                       |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay spesifik provider di luar helper Compaction bersama                                              |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay final sebelum embedded runner                                   | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                   |
| 45  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider memerlukan telemetri atau status milik provider saat sebuah model menjadi aktif                                                    |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
plugin provider yang cocok, lalu lanjut ke plugin provider lain yang mendukung hook
sampai salah satunya benar-benar mengubah model id atau transport/config. Ini menjaga
shim provider alias/compat tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin
bundled mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang
entri config family Google yang didukung, normalizer config Google bawaan tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika provider memerlukan wire protocol yang sepenuhnya kustom atau executor request kustom,
itu adalah kelas extension yang berbeda. Hook-hook ini ditujukan untuk perilaku provider
yang tetap berjalan pada loop inferensi normal OpenClaw.

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
  petunjuk family provider, panduan perbaikan auth, integrasi endpoint usage,
  kelayakan prompt-cache, default config yang sadar-auth, kebijakan thinking default/adaptif Claude,
  dan pembentukan stream spesifik Anthropic untuk
  header beta, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream khusus Claude milik Anthropic tetap berada di seam
  `api.ts` / `contract-api.ts` publik milik plugin bundled itu sendiri untuk saat ini. Surface package itu
  mengekspor `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic level rendah alih-alih memperlebar SDK generik di sekitar aturan
  beta-header satu provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, dan `isModernModelRef`
  karena ia memiliki forward-compat GPT-5.4, normalisasi langsung OpenAI
  `openai-completions` -> `openai-responses`, petunjuk auth yang sadar Codex,
  penekanan Spark, baris daftar OpenAI synthetic, dan kebijakan thinking /
  live-model GPT-5; family stream `openai-responses-defaults` memiliki
  wrapper Responses OpenAI native bersama untuk header atribusi,
  `/fast`/`serviceTier`, verbositas teks, web search Codex native,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena provider bersifat pass-through dan dapat mengekspos
  model id baru sebelum katalog statis OpenClaw diperbarui; ia juga menggunakan
  `capabilities`, `wrapStreamFn`, dan `isCacheTtlEligible` agar
  header request, metadata routing, patch reasoning, dan
  kebijakan prompt-cache spesifik provider tetap di luar core. Kebijakan replay-nya berasal dari
  family `passthrough-gemini`, sedangkan family stream `openrouter-thinking`
  memiliki injeksi reasoning proxy dan skip untuk model yang tidak didukung / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` plus `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena ia
  memerlukan device login milik provider, perilaku fallback model, kekhususan transkrip Claude,
  pertukaran token GitHub -> token Copilot, dan endpoint usage milik provider.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena ia
  masih berjalan pada transport OpenAI core tetapi memiliki normalisasi transport/base URL,
  kebijakan fallback refresh OAuth, pilihan transport default,
  baris katalog Codex synthetic, dan integrasi endpoint usage ChatGPT; ia
  berbagi family stream `openai-responses-defaults` yang sama dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena
  family replay `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode
  output reasoning bertag, dan pencocokan model modern, sedangkan
  family stream `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk pemformatan token, parsing token, dan wiring
  endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui
  family replay `anthropic-by-model` sehingga pembersihan replay khusus Claude tetap
  dibatasi pada Claude id alih-alih setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveThinkingProfile` karena ia memiliki
  klasifikasi error throttle/not-ready/context-overflow spesifik Bedrock
  untuk lalu lintas Anthropic-on-Bedrock; kebijakan replay-nya tetap berbagi guard
  khusus Claude `anthropic-by-model` yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui family replay `passthrough-gemini` karena mereka mem-proxy model Gemini
  melalui transport yang kompatibel dengan OpenAI dan memerlukan sanitasi
  thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui
  family replay `hybrid-anthropic-openai` karena satu provider memiliki semantik
  pesan Anthropic dan kompatibel OpenAI; ia mempertahankan penghapusan blok thinking khusus Claude
  di sisi Anthropic sambil mengoverride mode output reasoning kembali ke native, dan
  family stream `minimax-fast-mode` memiliki penulisan ulang model fast-mode pada jalur stream bersama.
- Moonshot menggunakan `catalog`, `resolveThinkingProfile`, dan `wrapStreamFn` karena masih menggunakan
  transport OpenAI bersama tetapi memerlukan normalisasi payload thinking milik provider; family
  stream `moonshot-thinking` memetakan config plus status `/think` ke payload
  thinking biner native miliknya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena memerlukan header request milik provider,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating cache-TTL
  Anthropic; family stream `kilocode-thinking` menjaga injeksi thinking Kilo
  tetap pada jalur stream proxy bersama sambil melewati `kilo/auto` dan
  model id proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena ia memiliki fallback GLM-5,
  default `tool_stream`, UX thinking biner, pencocokan model modern, dan baik
  auth usage maupun pengambilan kuota; family stream `tool-stream-default-on` menjaga
  wrapper `tool_stream` default-on tetap di luar glue tulisan tangan per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena ia memiliki normalisasi transport Responses xAI native, penulisan ulang alias
  fast-mode Grok, default `tool_stream`, pembersihan strict-tool / reasoning-payload,
  penggunaan ulang auth fallback untuk tool milik plugin, resolusi model Grok forward-compat,
  dan patch compat milik provider seperti profil tool-schema xAI,
  keyword schema yang tidak didukung, `web_search` native, dan decoding argumen
  tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities`
  untuk menjaga kekhususan transkrip/tooling tetap di luar core.
- Provider bundled khusus katalog seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine` hanya menggunakan
  `catalog`.
- Qwen menggunakan `catalog` untuk provider teksnya plus registrasi shared media-understanding dan
  video-generation untuk surface multimodal-nya.
- MiniMax dan Xiaomi menggunakan `catalog` plus hook usage karena perilaku `/usage`
  mereka dimiliki plugin meskipun inferensi masih berjalan melalui transport bersama.

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

- `textToSpeech` mengembalikan payload output TTS core normal untuk surface file/voice-note.
- Menggunakan konfigurasi dan pemilihan provider `messages.tts` core.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk voice picker atau alur penyiapan milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk picker yang sadar-provider.
- OpenAI dan ElevenLabs saat ini mendukung telephony. Microsoft tidak.

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

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan speech provider untuk perilaku synthesis milik vendor.
- Input `edge` Microsoft lama dinormalisasi ke provider id `microsoft`.
- Model ownership yang disukai berorientasi pada perusahaan: satu plugin vendor dapat memiliki
  provider teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan
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
- Perluasan aditif harus tetap bertipe: metode opsional baru, field hasil
  opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel mengonsumsi `api.runtime.videoGeneration.*`

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
  // Opsional saat MIME tidak dapat diinferensikan dengan andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah surface bersama yang diutamakan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` saat tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

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

- `provider` dan `model` adalah override per-run opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik plugin, operator harus memilih ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk web search, plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau ke wiring tool agent:

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

Plugin juga dapat mendaftarkan provider web-search melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik request bersama di core.
- Gunakan provider web-search untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah surface bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agent.

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

- `generate(...)`: hasilkan gambar menggunakan rantai provider image-generation yang dikonfigurasi.
- `listProviders(...)`: tampilkan provider image-generation yang tersedia dan kapabilitasnya.

## HTTP route Gateway

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
- `auth`: wajib. Gunakan `"gateway"` untuk memerlukan auth gateway normal, atau `"plugin"` untuk auth/webhook verification yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan plugin yang sama mengganti registrasi route miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat route menangani request.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti route milik plugin lain.
- Route yang tumpang tindih dengan level `auth` berbeda akan ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** menerima scope runtime operator secara otomatis. Route ini ditujukan untuk webhook/signature verification yang dikelola plugin, bukan pemanggilan helper Gateway berprivilege.
- Route `auth: "gateway"` berjalan di dalam scope runtime request Gateway, tetapi scope itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga scope runtime route plugin tetap dipatok ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP pembawa identitas tepercaya (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` saat header tersebut hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada request route plugin yang membawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan berasumsi route plugin dengan auth gateway adalah surface admin implisit. Jika route Anda membutuhkan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitif registrasi plugin.
- `openclaw/plugin-sdk/core` untuk kontrak generik bersama yang menghadap plugin.
- `openclaw/plugin-sdk/config-schema` untuk ekspor schema Zod `openclaw.json`
  root (`OpenClawSchema`).
- Primitif channel stabil seperti `openclaw/plugin-sdk/channel-setup`,
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
  setup/auth/balasan/webhook bersama. `channel-inbound` adalah rumah bersama untuk debounce, mention matching,
  helper kebijakan mention masuk, pemformatan envelope, dan helper konteks envelope masuk.
  `channel-setup` adalah seam setup opsional-install yang sempit.
  `setup-runtime` adalah surface setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup tertunda, termasuk adapter patch setup yang aman untuk impor.
  `setup-adapter-runtime` adalah seam adapter account-setup yang sadar-env.
  `setup-tools` adalah seam helper CLI/arsip/dokumen kecil (`formatCliCommand`,
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
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi perintah kustom Telegram dan tetap tersedia meskipun surface kontrak Telegram bundled untuk sementara tidak tersedia.
  `text-runtime` adalah seam bersama untuk teks/Markdown/logging, termasuk
  penghapusan teks yang terlihat oleh asisten, helper render/chunking markdown, helper redaksi,
  helper directive-tag, dan utilitas safe-text.
- Seam channel khusus persetujuan sebaiknya mengutamakan satu kontrak `approvalCapability`
  pada plugin. Core kemudian membaca auth, delivery, render,
  native-routing, dan perilaku native-handler lazy persetujuan melalui satu kapabilitas itu
  alih-alih mencampurkan perilaku persetujuan ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan hanya tersisa sebagai
  shim kompatibilitas untuk plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit,
  dan kode repo tidak boleh menambahkan impor baru dari shim tersebut.
- Internal extension bawaan tetap privat. Plugin eksternal sebaiknya hanya menggunakan
  subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat menggunakan
  entry point publik repo di bawah root package plugin seperti `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, dan file yang dibatasi sempit seperti
  `login-qr-api.js`. Jangan pernah mengimpor `src/*` milik package plugin dari core atau dari extension lain.
- Pemisahan entry point repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel khusus runtime,
  `<plugin-package-root>/index.js` adalah entry plugin bundled,
  dan `<plugin-package-root>/setup-entry.js` adalah entry plugin setup.
- Contoh provider bundled saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper model default, dan
    builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder providernya plus helper onboarding/config,
    sedangkan `register.runtime.js` masih dapat mengekspor ulang helper generik
    `plugin-sdk/provider-stream` untuk penggunaan lokal repo.
- Entry point publik yang dimuat melalui facade mengutamakan snapshot config runtime aktif
  saat tersedia, lalu fallback ke file config yang telah di-resolve di disk saat
  OpenClaw belum menyajikan snapshot runtime.
- Primitif bersama generik tetap menjadi kontrak SDK publik yang diutamakan. Sekelompok kecil
  seam helper bermerek channel bundled yang dicadangkan masih ada. Perlakukan itu sebagai
  seam pemeliharaan bundled/kompatibilitas, bukan target impor pihak ketiga baru; kontrak lintas-channel baru tetap harus masuk ke
  subpath `plugin-sdk/*` generik atau barrel `api.js` /
  `runtime-api.js` lokal plugin.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitif stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju untuk pekerjaan plugin
  bundled dan eksternal yang baru.
  Parsing/pencocokan target berada di `openclaw/plugin-sdk/channel-targets`.
  Gate aksi pesan dan helper message-id reaksi berada di
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper khusus extension bundled tidak stabil secara default. Jika sebuah
  helper hanya dibutuhkan oleh extension bundled, simpan di balik seam
  `api.js` atau `runtime-api.js` lokal milik extension tersebut alih-alih mempromosikannya ke
  `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama yang baru harus generik, bukan bermerek channel. Parsing target bersama
  berada di `openclaw/plugin-sdk/channel-targets`; internal spesifik channel
  tetap berada di balik seam `api.js` atau `runtime-api.js` lokal milik plugin yang bersangkutan.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native
  menggunakannya saat ini. Kehadirannya tidak dengan sendirinya berarti setiap helper yang diekspor adalah
  kontrak eksternal jangka panjang yang dibekukan.

## Schema message tool

Plugin harus memiliki kontribusi schema `describeMessageTool(...)` yang
spesifik channel. Simpan field spesifik provider di plugin, bukan di core bersama.

Untuk fragmen schema portabel bersama, gunakan kembali helper generik yang diekspor melalui
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload gaya grid tombol
- `createMessageToolCardSchema()` untuk payload kartu terstruktur

Jika suatu bentuk schema hanya masuk akal untuk satu provider, definisikan di source
plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel harus memiliki semantik target yang spesifik channel. Pertahankan host
outbound bersama tetap generik dan gunakan surface adapter perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang telah dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin saat
  core memerlukan resolusi final milik provider setelah normalisasi atau setelah direktori gagal.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi
  spesifik provider setelah target berhasil di-resolve.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  pencarian peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan “perlakukan ini sebagai ID target native/eksplisit”.
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan untuk
  pencarian direktori yang luas.
- Pertahankan ID native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau param spesifik provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config harus mempertahankan logika itu di
plugin dan menggunakan kembali helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat sebuah channel memerlukan peer/grup berbasis config seperti:

- peer DM berbasis allowlist
- map channel/grup yang dikonfigurasi
- fallback direktori statis yang dibatasi akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran query
- penerapan limit
- helper dedupe/normalisasi
- pembangunan `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi ID yang spesifik channel harus tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat plugin memiliki model id, default base URL, atau metadata model
yang digating auth dan spesifik provider.

`catalog.order` mengontrol kapan katalog plugin digabung relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider berbasis API key atau env biasa
- `profile`: provider yang muncul saat auth profile ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada tabrakan key, sehingga plugin dapat dengan sengaja mengoverride
entri provider bawaan dengan provider id yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias lama
- jika `catalog` dan `discovery` keduanya didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan sebuah channel, utamakan implementasi
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Ia diizinkan untuk mengasumsikan kredensial
  sudah sepenuhnya dimaterialisasi dan dapat gagal cepat saat secret yang diperlukan hilang.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/config
  repair seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Hanya kembalikan status akun deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber
  yang sesuai) sudah cukup untuk perintah gaya status.
- Gunakan `configured_unavailable` saat sebuah kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan “configured but unavailable in this command
path” alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Package pack

Sebuah direktori plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa extension, plugin id
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori package akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependensi dev saat runtime). Pertahankan pohon dependensi
plugin tetap “JS/TS murni” dan hindari package yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul setup-only yang ringan.
Saat OpenClaw memerlukan surface setup untuk plugin channel yang dinonaktifkan, atau
saat plugin channel diaktifkan tetapi masih belum dikonfigurasi, ia memuat `setupEntry`
alih-alih entry plugin penuh. Ini menjaga startup dan setup lebih ringan
saat entry plugin utama Anda juga menghubungkan tool, hook, atau kode
khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan plugin channel ke jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya saat `setupEntry` sepenuhnya mencakup surface startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti entri setup
harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan startup, seperti:

- registrasi channel itu sendiri
- HTTP route apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- gateway method, tool, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entry penuh Anda masih memiliki kapabilitas startup wajib, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
entry penuh selama startup.

Channel bundled juga dapat menerbitkan helper surface kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Surface promosi setup saat ini
adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface itu saat perlu mempromosikan config channel legacy single-account
ke `channels.<id>.accounts.*` tanpa memuat entry plugin penuh.
Matrix adalah contoh bundled saat ini: ia hanya memindahkan key auth/bootstrap ke
akun promoted bernama saat named account sudah ada, dan ia dapat mempertahankan key default-account
non-kanonis yang sudah dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup itu menjaga discovery surface kontrak bundled tetap lazy. Waktu impor
tetap ringan; surface promosi dimuat hanya pada penggunaan pertama alih-alih
memasuki ulang startup channel bundled saat modul diimpor.

Saat surface startup tersebut mencakup method Gateway RPC, pertahankan pada
prefix khusus plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve
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
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core tetap kosong.

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

- `detailLabel`: label sekunder untuk surface katalog/status yang lebih kaya
- `docsLabel`: override teks tautan untuk tautan dokumen
- `preferOver`: ID plugin/channel prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol copy surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu Markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan channel dari surface daftar configured-channel saat diatur ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat diatur ke `false`
- `exposure.docs`: tandai channel sebagai internal/privat untuk surface navigasi dokumen
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: mengikutsertakan channel ke alur `allowFrom` quickstart standar
- `forceAccountBinding`: mewajibkan binding akun eksplisit bahkan saat hanya satu akun yang ada
- `preferSessionLookupForAnnounceTarget`: mengutamakan lookup sesi saat me-resolve target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registry MPM).
Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk key `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks
default alih-alih hanya menambahkan pencarian memory atau hook.

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

Jika engine Anda **tidak** memiliki algoritme Compaction, pertahankan `compact()`
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

Saat sebuah plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, merge config,
   lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface kapabilitas bertipe
   terkecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur harus mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar ownership dan bentuk registrasi tetap eksplisit seiring waktu.

Begitulah OpenClaw tetap opinionated tanpa menjadi hardcoded pada worldview
satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
surface-surface ini bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- runner/helper runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- assertion ownership/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/plugin di `docs/`

Jika salah satu surface itu hilang, biasanya itu tanda bahwa kapabilitas tersebut
belum sepenuhnya terintegrasi.

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

Pola test kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- test kontrak menjaga ownership tetap eksplisit
