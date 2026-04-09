---
read_when:
    - Membangun atau men-debug plugin native OpenClaw
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registry
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-09T01:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2575791f835990589219bb06d8ca92e16a8c38b317f0bfe50b421682f253ef18
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Install and use plugins](/id/tools/plugin) — panduan pengguna
  - [Getting Started](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun channel pesan
  - [Provider Plugins](/id/plugins/sdk-provider-plugins) — membangun provider model
  - [SDK Overview](/id/plugins/sdk-overview) — peta impor dan API pendaftaran
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin native OpenClaw mendaftar ke satu atau lebih tipe kapabilitas:

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
layanan adalah plugin **legacy hook-only**. Pola tersebut masih didukung
sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah diterapkan di core dan digunakan oleh plugin
bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih
memerlukan standar yang lebih ketat daripada "ini diekspor, maka ini beku."

Panduan saat ini:

- **plugin eksternal yang sudah ada:** pertahankan integrasi berbasis hook tetap
  berfungsi; anggap ini sebagai baseline kompatibilitas
- **plugin bundled/native baru:** utamakan pendaftaran kapabilitas yang
  eksplisit daripada reach-in spesifik vendor atau desain hook-only baru
- **plugin eksternal yang mengadopsi pendaftaran kapabilitas:** diperbolehkan,
  tetapi anggap surface helper spesifik kapabilitas masih berkembang kecuali
  dokumentasi secara eksplisit menandai kontrak sebagai stabil

Aturan praktis:

- API pendaftaran kapabilitas adalah arah yang dituju
- hook lama tetap menjadi jalur paling aman tanpa kerusakan untuk plugin
  eksternal selama masa transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak sempit
  yang terdokumentasi, bukan ekspor helper insidental

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam suatu bentuk
berdasarkan perilaku pendaftarannya yang sebenarnya (bukan hanya metadata
statis):

- **plain-capability** -- mendaftarkan tepat satu jenis kapabilitas (misalnya
  plugin khusus provider seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa
  kapabilitas, tool, perintah, atau layanan
- **non-capability** -- mendaftarkan tool, perintah, layanan, atau rute tetapi
  tanpa kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [CLI reference](/cli/plugins#inspect) untuk detail.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin dunia nyata lama masih bergantung padanya.

Arah ke depan:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan
  keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`,
Anda mungkin melihat salah satu label berikut:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config berhasil di-parse dan plugin berhasil di-resolve      |
| **compatibility advisory** | Plugin menggunakan pola lama yang masih didukung (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Config tidak valid atau plugin gagal dimuat                  |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat
ini -- `hook-only` bersifat advisory, dan `before_agent_start` hanya memicu
peringatan. Sinyal ini juga muncul di `openclaw status --all` dan
`openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root
   workspace, root ekstensi global, dan ekstensi bundled. Discovery membaca
   manifest native `openclaw.plugin.json` serta manifest bundle yang didukung
   terlebih dahulu.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan,
   diblokir, atau dipilih untuk slot eksklusif seperti memori.
3. **Runtime loading**
   Plugin native OpenClaw dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke dalam registry pusat. Bundle yang kompatibel dinormalisasi
   menjadi record registry tanpa mengimpor kode runtime.
4. **Surface consumption**
   Bagian lain OpenClaw membaca registry untuk mengekspos tool, channel,
   penyiapan provider, hook, rute HTTP, perintah CLI, dan layanan.

Khusus untuk plugin CLI, discovery perintah root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar saat pertama
  kali dipanggil

Ini menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap
memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari jalur `register(api)` modul plugin

Pemisahan ini memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang
hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh
aktif.

### Plugin channel dan tool message bersama

Plugin channel tidak perlu mendaftarkan tool send/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core,
dan plugin channel memiliki discovery dan eksekusi yang spesifik channel di
baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan
  sesi/thread, dan dispatch eksekusi
- plugin channel memiliki discovery aksi terlingkup, discovery kapabilitas, dan
  fragmen schema spesifik channel
- plugin channel memiliki grammar percakapan sesi yang spesifik provider,
  seperti bagaimana id percakapan mengodekan id thread atau mewarisi dari
  percakapan induk
- plugin channel mengeksekusi aksi akhir melalui action adapter mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery
terpadu itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas,
dan kontribusi schema secara bersama-sama agar bagian-bagian tersebut tidak
menyimpang.

Core meneruskan runtime scope ke langkah discovery tersebut. Field penting
mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Ini penting untuk plugin yang peka konteks. Sebuah channel dapat menyembunyikan
atau mengekspos aksi message berdasarkan akun aktif, room/thread/message saat
ini, atau identitas requester tepercaya tanpa hardcode percabangan spesifik
channel di tool `message` core.

Inilah sebabnya perubahan routing embedded-runner tetap merupakan pekerjaan
plugin: runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke
batas discovery plugin agar tool `message` bersama mengekspos surface milik
channel yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundled harus menyimpan runtime
eksekusi di dalam modul ekstensi mereka sendiri. Core tidak lagi memiliki
runtime message-action Discord, Slack, Telegram, atau WhatsApp di bawah
`src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime`
terpisah, dan plugin bundled harus mengimpor kode runtime lokal mereka sendiri
langsung dari modul milik ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor convenience barrel spesifik channel untuk ekstensi Slack,
Discord, Signal, WhatsApp, atau serupa. Jika core memerlukan suatu perilaku,
gunakan barrel `api.ts` / `runtime-api.ts` milik plugin bundled itu sendiri
atau naikkan kebutuhan tersebut menjadi kapabilitas generik yang sempit dalam
SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang cocok dengan
  model poll umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik
  poll spesifik channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll plugin
menolak aksi tersebut, sehingga handler poll milik plugin dapat menerima field
poll spesifik channel tanpa diblokir terlebih dahulu oleh parser poll generik.

Lihat [Load pipeline](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah
**perusahaan** atau sebuah **fitur**, bukan sebagai kumpulan integrasi yang
tidak terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua surface OpenClaw yang
  berhadapan dengan perusahaan tersebut
- plugin fitur biasanya harus memiliki seluruh surface fitur yang diperkenalkannya
- channel harus mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan
  ulang perilaku provider secara ad hoc

Contoh:

- plugin bundled `openai` memiliki perilaku model-provider OpenAI dan perilaku
  OpenAI speech + realtime-voice + media-understanding + image-generation
- plugin bundled `elevenlabs` memiliki perilaku speech ElevenLabs
- plugin bundled `microsoft` memiliki perilaku speech Microsoft
- plugin bundled `google` memiliki perilaku model-provider Google ditambah
  perilaku Google media-understanding + image-generation + web-search
- plugin bundled `firecrawl` memiliki perilaku web-fetch Firecrawl
- plugin bundled `minimax`, `mistral`, `moonshot`, dan `zai` memiliki backend
  media-understanding mereka
- plugin `voice-call` adalah plugin fitur: plugin ini memiliki transport
  panggilan, tool, CLI, rute, dan bridge media-stream Twilio, tetapi mengonsumsi
  kapabilitas speech bersama serta realtime-transcription dan realtime-voice
  alih-alih mengimpor plugin vendor secara langsung

Kondisi akhir yang dituju adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, speech, gambar,
  dan video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface mereka sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka
  mengonsumsi kontrak kapabilitas bersama yang diekspos oleh core

Inilah perbedaan kuncinya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi
  oleh beberapa plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama
bukan "provider mana yang harus melakukan hardcode penanganan video?" Pertanyaan
pertama adalah "apa kontrak kapabilitas video di core?" Setelah kontrak itu
ada, plugin vendor dapat mendaftar terhadapnya dan plugin channel/fitur dapat
mengonsumsinya.

Jika kapabilitasnya belum ada, langkah yang tepat biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin dengan cara yang typed
3. wiring channel/fitur terhadap kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasi

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang
bergantung pada satu vendor atau jalur kode plugin-spesifik sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan tempat kode berada:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan
  merge config, semantik pengiriman, dan kontrak yang typed
- **lapisan plugin vendor**: API spesifik vendor, autentikasi, katalog model,
  sintesis ucapan, pembuatan gambar, backend video masa depan, endpoint usage
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menampilkannya pada suatu surface

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat reply, urutan fallback, preferensi, dan
  pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya diutamakan untuk kapabilitas masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, speech, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, dan
pencarian web, vendor dapat memiliki semua surface mereka di satu tempat:

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

Yang penting bukan nama helper yang persis. Bentuknya yang penting:

- satu plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaimnya miliki

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. channel dan plugin fitur mengonsumsi perilaku core bersama alih-alih
   melakukan wiring langsung ke kode vendor

Ini menghindari asumsi video satu provider tertanam di core. Plugin memiliki
surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas dan helper runtime yang typed, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Surface API plugin sengaja dibuat typed dan terpusat di
`OpenClawPluginApi`. Kontrak tersebut mendefinisikan titik pendaftaran yang
didukung dan helper runtime yang boleh diandalkan plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan duplikat seperti dua plugin yang
  mendaftarkan id provider yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk
  pendaftaran yang salah bentuk
- pengujian kontrak dapat menegakkan kepemilikan plugin bundled dan mencegah
  drift diam-diam

Ada dua lapisan penegakan:

1. **penegakan pendaftaran runtime**
   Registry plugin memvalidasi pendaftaran saat plugin dimuat. Contoh:
   id provider duplikat, id speech provider duplikat, dan pendaftaran yang
   salah bentuk menghasilkan diagnostik plugin alih-alih perilaku tak
   terdefinisi.
2. **pengujian kontrak**
   Plugin bundled ditangkap dalam registry kontrak selama pengujian berjalan
   sehingga OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini
   ini digunakan untuk model provider, speech provider, web search provider,
   dan kepemilikan pendaftaran bundled.

Efek praktisnya adalah bahwa OpenClaw mengetahui, sejak awal, plugin mana yang
memiliki surface mana. Ini memungkinkan core dan channel tersusun mulus karena
kepemilikan dinyatakan, typed, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- typed
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh banyak plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik vendor yang disembunyikan di core
- escape hatch plugin sekali pakai yang melewati registry
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan dulu kapabilitasnya, lalu
biarkan plugin tersambung ke sana.

## Model eksekusi

Plugin native OpenClaw berjalan **in-process** bersama Gateway. Plugin ini
tidak disandbox. Plugin native yang dimuat memiliki batas kepercayaan level
proses yang sama dengan kode core.

Implikasinya:

- plugin native dapat mendaftarkan tool, handler jaringan, hook, dan layanan
- bug plugin native dapat menyebabkan gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini
memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, itu
kebanyakan berarti skills bundled.

Gunakan allowlist dan path install/load yang eksplisit untuk plugin yang tidak
dibundel. Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan
default produksi.

Untuk nama paket workspace bundled plugin, pertahankan id plugin tetap
tertambat pada nama npm: `@openclaw/<id>` secara default, atau akhiran typed
yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau
`-media-understanding` ketika paket memang mengekspos peran plugin yang lebih
sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **id plugin**, bukan asal sumber.
- Plugin workspace dengan id yang sama seperti plugin bundled sengaja
  membayangi salinan bundled ketika plugin workspace tersebut
  diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper yang
bukan kontrak:

- subpath helper spesifik bundled-plugin
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience spesifik vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper bundled-plugin masih tetap ada dalam peta ekspor SDK
yang dihasilkan demi kompatibilitas dan pemeliharaan bundled-plugin. Contoh saat
ini mencakup `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan ini
sebagai ekspor detail implementasi yang dicadangkan, bukan pola SDK yang
direkomendasikan untuk plugin pihak ketiga baru.

## Load pipeline

Saat startup, OpenClaw secara kasar melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle yang kompatibel dan metadata package
3. menolak kandidat yang tidak aman
4. menormalisasi config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias lama)
   dan mengumpulkan pendaftaran ke dalam registry plugin
8. mengekspos registry ke surface perintah/runtime

<Note>
`activate` adalah alias lama untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundled menggunakan `register`; gunakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir ketika
entry keluar dari root plugin, path dapat ditulisi oleh semua orang, atau
kepemilikan path tampak mencurigakan untuk plugin yang tidak dibundel.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan schema config/channel/skills yang dideklarasikan atau kapabilitas
  bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog

Untuk plugin native, modul runtime adalah bagian data-plane. Modul ini
mendaftarkan perilaku aktual seperti hook, tool, perintah, atau alur provider.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil discovery
- data registry manifest
- registry plugin yang dimuat

Cache ini mengurangi startup yang melonjak dan overhead perintah berulang. Cache
ini aman untuk dianggap sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Atur jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak langsung memodifikasi global core acak. Plugin ini
mendaftar ke registry plugin pusat.

Registry melacak:

- record plugin (identitas, sumber, origin, status, diagnostik)
- tool
- hook lama dan typed hook
- channel
- provider
- handler Gateway RPC
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung
dengan modul plugin. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> pendaftaran registry
- runtime core -> konsumsi registry

Pemisahan ini penting untuk kemudahan pemeliharaan. Artinya, sebagian besar
surface core hanya memerlukan satu titik integrasi: "baca registry", bukan
"special-case setiap modul plugin".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika sebuah persetujuan
diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah
permintaan bind disetujui atau ditolak:

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

      // Permintaan ditolak; bersihkan status pending lokal.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding yang telah di-resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang
diizinkan mengikat percakapan, dan berjalan setelah penanganan persetujuan core
selesai.

## Hook runtime provider

Plugin provider sekarang memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup env-auth provider yang
  murah sebelum runtime dimuat, `providerAuthAliases` untuk varian provider yang
  berbagi auth, `channelEnvVars` untuk lookup env/setup channel yang murah
  sebelum runtime dimuat, serta `providerAuthChoices` untuk label pilihan
  onboarding/auth yang murah dan metadata flag CLI sebelum runtime dimuat
- hook waktu config: `catalog` / `discovery` lama plus `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah surface ekstensi untuk perilaku spesifik
provider tanpa memerlukan transport inferensi kustom sepenuhnya.

Gunakan manifest `providerAuthEnvVars` ketika provider memiliki kredensial
berbasis env yang harus dapat dilihat jalur auth/status/model-picker generik
tanpa memuat runtime plugin. Gunakan manifest `providerAuthAliases` ketika satu
id provider harus menggunakan kembali env vars, auth profile, auth berbasis
config, dan pilihan onboarding API-key milik id provider lain. Gunakan manifest
`providerAuthChoices` ketika surface CLI onboarding/pilihan auth harus
mengetahui choice id provider, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime provider. Pertahankan `envVars` runtime provider untuk
petunjuk yang berhadapan dengan operator seperti label onboarding atau var setup
OAuth client-id/client-secret.

Gunakan manifest `channelEnvVars` ketika suatu channel memiliki auth atau setup
yang digerakkan env yang harus dapat dilihat shell-env fallback generik,
pemeriksaan config/status, atau prompt setup tanpa memuat runtime channel.

### Urutan hook dan penggunaannya

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan singkat.

| #   | Hook                              | Fungsi                                                                                                         | Kapan digunakan                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan config provider ke `models.providers` selama pembuatan `models.json`                              | Provider memiliki katalog atau default base URL                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                               |
| --  | _(lookup model bawaan)_           | OpenClaw lebih dulu mencoba jalur registry/katalog normal                                                     | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalisasi alias model-id lama atau pratinjau sebelum lookup                                                | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                          |
| 4   | `normalizeTransport`              | Menormalisasi `api` / `baseUrl` keluarga provider sebelum perakitan model generik                             | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                         |
| 5   | `normalizeConfig`                 | Menormalisasi `models.providers.<id>` sebelum resolusi runtime/provider                                        | Provider memerlukan pembersihan config yang harus berada bersama plugin; helper keluarga Google bundled juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas streaming-usage native ke provider config                            | Provider memerlukan perbaikan metadata streaming usage native yang digerakkan endpoint                                                      |
| 7   | `resolveConfigApiKey`             | Me-resolve auth env-marker untuk provider config sebelum pemuatan auth runtime                                 | Provider memiliki resolusi API-key env-marker milik provider; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini       |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                              | Provider dapat beroperasi dengan marker kredensial sintetis/lokal                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Melapiskan auth profile eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan ulang kredensial auth eksternal tanpa menyimpan refresh token yang disalin                                           |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profile sintetis yang tersimpan di bawah auth berbasis env/config                       | Provider menyimpan profile placeholder sintetis yang seharusnya tidak menang prioritas                                                      |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk model id milik provider yang belum ada di registry lokal                                | Provider menerima model id upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Pemanasan async, lalu `resolveDynamicModel` dijalankan lagi                                                    | Provider memerlukan metadata jaringan sebelum me-resolve id yang tidak dikenal                                                              |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model yang telah di-resolve                          | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                       |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                        | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                      |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan kekhususan transkrip/keluarga provider                                                                                  |
| 16  | `normalizeToolSchemas`            | Menormalisasi schema tool sebelum embedded runner melihatnya                                                   | Provider memerlukan pembersihan schema keluarga transport                                                                                   |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                               | Provider menginginkan peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                                |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak keluaran reasoning native vs tagged                                                            | Provider memerlukan keluaran reasoning/final yang bertag alih-alih field native                                                             |
| 19  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Provider memerlukan default parameter request atau pembersihan parameter per-provider                                                       |
| 20  | `createStreamFn`                  | Menggantikan sepenuhnya jalur stream normal dengan transport kustom                                            | Provider memerlukan wire protocol kustom, bukan hanya wrapper                                                                              |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper kompatibilitas header/body/model request tanpa transport kustom                                                 |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per-giliran                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                            |
| 24  | `formatApiKey`                    | Formatter auth-profile: profile yang disimpan menjadi string `apiKey` runtime                                  | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                        |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                       |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                        |
| 27  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik provider                                                               | Provider memiliki error overflow mentah yang terlewat oleh heuristik generik                                                                |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                            |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache yang spesifik proxy                                                                                    |
| 30  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                                 | Provider memerlukan petunjuk pemulihan missing-auth yang spesifik provider                                                                  |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream usang plus petunjuk error yang opsional untuk pengguna                                | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/akhir yang ditambahkan setelah discovery                                                | Provider memerlukan baris forward-compat sintetis di `models list` dan picker                                                               |
| 33  | `isBinaryThinking`                | Toggle reasoning on/off untuk provider binary-thinking                                                         | Provider hanya mengekspos thinking biner on/off                                                                                             |
| 34  | `supportsXHighThinking`           | Dukungan reasoning `xhigh` untuk model tertentu                                                                | Provider menginginkan `xhigh` hanya pada subset model tertentu                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Level `/think` default untuk keluarga model tertentu                                                           | Provider memiliki kebijakan default `/think` untuk keluarga model                                                                           |
| 36  | `isModernModelRef`                | Pencocok modern-model untuk filter profile live dan pemilihan smoke                                            | Provider memiliki pencocokan preferred-model live/smoke                                                                                     |
| 37  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                | Provider memerlukan pertukaran token atau kredensial request berumur pendek                                                                 |
| 38  | `resolveUsageAuth`                | Me-resolve kredensial usage/billing untuk `/usage` dan surface status terkait                                  | Provider memerlukan parsing token usage/quota kustom atau kredensial usage yang berbeda                                                     |
| 39  | `fetchUsageSnapshot`              | Mengambil dan menormalisasi snapshot usage/quota spesifik provider setelah auth di-resolve                     | Provider memerlukan endpoint usage atau parser payload yang spesifik provider                                                               |
| 40  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                 | Perilaku embedding memori harus berada bersama plugin provider                                                                              |
| 41  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengendalikan penanganan transkrip untuk provider                          | Provider memerlukan kebijakan transkrip kustom (misalnya, menghapus thinking-block)                                                        |
| 42  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay spesifik provider di luar helper compaction bersama                                              |
| 43  | `validateReplayTurns`             | Validasi atau pembentukan ulang replay-turn akhir sebelum embedded runner                                      | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                   |
| 44  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider memerlukan telemetri atau status milik provider saat model menjadi aktif                                                           |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama
memeriksa plugin provider yang cocok, lalu meneruskan ke plugin provider lain
yang mampu melakukan hook sampai salah satu benar-benar mengubah model id atau
transport/config. Ini menjaga shim provider alias/compat tetap berfungsi tanpa
mengharuskan pemanggil mengetahui plugin bundled mana yang memiliki penulisan
ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config
keluarga Google yang didukung, normalizer config Google bundled tetap
menerapkan pembersihan kompatibilitas itu.

Jika provider memerlukan wire protocol yang sepenuhnya kustom atau executor
request kustom, itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan
untuk perilaku provider yang tetap berjalan pada loop inferensi normal OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  dan `wrapStreamFn` karena memiliki forward-compat Claude 4.6,
  petunjuk keluarga provider, panduan perbaikan auth, integrasi endpoint usage,
  kelayakan prompt-cache, default config yang sadar auth, kebijakan thinking
  default/adaptif Claude, dan pembentukan stream spesifik Anthropic untuk
  header beta, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream spesifik Claude milik Anthropic untuk sementara tetap berada di
  seam `api.ts` / `contract-api.ts` publik milik plugin bundled itu sendiri.
  Surface paket itu mengekspor `wrapAnthropicProviderStream`,
  `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic tingkat rendah alih-alih memperluas SDK generik di sekitar aturan
  beta-header satu provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, dan `isModernModelRef`
  karena memiliki forward-compat GPT-5.4, normalisasi langsung
  `openai-completions` -> `openai-responses` untuk OpenAI,
  petunjuk auth yang sadar Codex, penekanan Spark, baris daftar OpenAI sintetis,
  serta kebijakan thinking / live-model GPT-5; keluarga stream
  `openai-responses-defaults` memiliki wrapper Responses OpenAI native bersama
  untuk header atribusi, `/fast`/`serviceTier`, verbositas teks,
  pencarian web native Codex, pembentukan payload reasoning-compat, dan
  manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena provider bersifat pass-through dan dapat
  mengekspos model id baru sebelum katalog statis OpenClaw diperbarui; provider
  ini juga menggunakan `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` untuk menjaga header request spesifik provider,
  metadata routing, patch reasoning, dan kebijakan prompt-cache tetap di luar
  core. Kebijakan replay-nya berasal dari keluarga `passthrough-gemini`,
  sementara keluarga stream `openrouter-thinking` memiliki injection reasoning
  proxy dan skip model yang tidak didukung / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` plus `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena
  memerlukan login perangkat milik provider, perilaku fallback model,
  kekhususan transkrip Claude, pertukaran token GitHub -> token Copilot, dan
  endpoint usage milik provider.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena
  masih berjalan pada transport OpenAI core tetapi memiliki normalisasi
  transport/base URL, kebijakan fallback refresh OAuth, pilihan transport
  default, baris katalog Codex sintetis, dan integrasi endpoint usage ChatGPT;
  provider ini berbagi keluarga stream `openai-responses-defaults` yang sama
  dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena
  keluarga replay `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode keluaran
  reasoning bertag, dan pencocokan modern-model, sementara keluarga stream
  `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk pemformatan token, parsing token, dan wiring
  endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui keluarga replay
  `anthropic-by-model` sehingga pembersihan replay spesifik Claude tetap
  terlingkup pada id Claude, bukan pada setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveDefaultThinkingLevel` karena memiliki
  klasifikasi error throttle/not-ready/context-overflow spesifik Bedrock untuk
  trafik Anthropic-on-Bedrock; kebijakan replay-nya tetap berbagi guard
  `anthropic-by-model` khusus Claude yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui keluarga replay `passthrough-gemini` karena mereka mem-proxy model
  Gemini melalui transport yang kompatibel dengan OpenAI dan memerlukan
  sanitasi thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui keluarga replay
  `hybrid-anthropic-openai` karena satu provider memiliki semantik
  pesan-Anthropic dan kompatibel-OpenAI; provider ini tetap mempertahankan
  penghapusan thinking-block khusus Claude di sisi Anthropic sambil
  meng-override mode keluaran reasoning kembali ke native, dan keluarga stream
  `minimax-fast-mode` memiliki penulisan ulang model fast-mode pada jalur
  stream bersama.
- Moonshot menggunakan `catalog` plus `wrapStreamFn` karena masih menggunakan
  transport OpenAI bersama tetapi membutuhkan normalisasi payload thinking milik
  provider; keluarga stream `moonshot-thinking` memetakan config plus status
  `/think` ke payload thinking biner native.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena memerlukan header request milik provider,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating TTL
  cache Anthropic; keluarga stream `kilocode-thinking` menjaga injection
  Kilo thinking pada jalur stream proxy bersama sambil melewati `kilo/auto`
  dan id model proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena memiliki fallback GLM-5,
  default `tool_stream`, UX thinking biner, pencocokan modern-model, serta
  auth usage + pengambilan kuota; keluarga stream `tool-stream-default-on`
  menjaga wrapper `tool_stream` default-on tetap di luar glue tulisan tangan
  per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena memiliki normalisasi transport xAI Responses native, penulisan ulang
  alias Grok fast-mode, default `tool_stream`, pembersihan strict-tool /
  payload reasoning, penggunaan ulang auth fallback untuk tool milik plugin,
  resolusi model Grok forward-compat, dan patch kompatibilitas milik provider
  seperti profil tool-schema xAI, keyword schema yang tidak didukung,
  `web_search` native, dan decoding argumen tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities`
  untuk menjaga kekhususan transkrip/tooling tetap di luar core.
- Provider bundled khusus katalog seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine`
  hanya menggunakan `catalog`.
- Qwen menggunakan `catalog` untuk provider teksnya plus pendaftaran
  media-understanding dan video-generation bersama untuk surface multimodalnya.
- MiniMax dan Xiaomi menggunakan `catalog` plus hook usage karena perilaku
  `/usage` mereka dimiliki plugin meskipun inferensi tetap berjalan melalui
  transport bersama.

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

- `textToSpeech` mengembalikan payload keluaran TTS core normal untuk surface file/voice-note.
- Menggunakan konfigurasi `messages.tts` core dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk voice picker milik vendor atau alur setup.
- Daftar suara dapat mencakup metadata yang lebih kaya seperti locale, gender, dan tag personality untuk picker yang sadar provider.
- OpenAI dan ElevenLabs saat ini mendukung telephony. Microsoft tidak.

Plugin juga dapat mendaftarkan speech provider melalui
`api.registerSpeechProvider(...)`.

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
- Gunakan speech provider untuk perilaku sintesis milik vendor.
- Input `edge` Microsoft lama dinormalisasi menjadi id provider `microsoft`.
- Model kepemilikan yang diutamakan berorientasi perusahaan: satu plugin vendor
  dapat memiliki provider teks, speech, gambar, dan media masa depan saat
  OpenClaw menambahkan kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding yang typed alih-alih bag key/value generik:

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
- Ekspansi aditif harus tetap typed: metode opsional baru, field hasil opsional
  baru, kapabilitas opsional baru.
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
  // Opsional saat MIME tidak dapat diinferensikan secara andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah surface bersama yang diutamakan
  untuk pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` ketika tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan run subagen latar belakang melalui
`api.runtime.subagent`:

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

- `provider` dan `model` adalah override per-run yang opsional, bukan perubahan sesi yang persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik plugin, operator harus memilih ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagen plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau wiring tool agen:

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

Plugin juga dapat mendaftarkan web-search provider melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik request bersama di core.
- Gunakan web-search provider untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah surface bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: menghasilkan gambar menggunakan rantai provider pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: menampilkan daftar provider pembuatan gambar yang tersedia dan kapabilitasnya.

## Rute HTTP Gateway

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

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan plugin yang sama mengganti pendaftaran rute miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti rute milik plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima runtime scope operator secara otomatis. Rute ini untuk webhook/verifikasi signature yang dikelola plugin, bukan untuk panggilan helper Gateway yang berhak istimewa.
- Rute `auth: "gateway"` berjalan di dalam runtime scope permintaan Gateway, tetapi scope tersebut sengaja konservatif:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) menjaga scope runtime rute-plugin tetap dipatok pada `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut memang ada
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute-plugin yang membawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan berasumsi rute plugin dengan auth gateway adalah surface admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitif pendaftaran plugin.
- `openclaw/plugin-sdk/core` untuk kontrak umum yang berhadapan dengan plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring setup/auth/reply/webhook
  bersama. `channel-inbound` adalah rumah bersama untuk debounce, mention matching,
  helper kebijakan mention inbound, pemformatan envelope, dan helper konteks
  envelope inbound.
  `channel-setup` adalah seam setup optional-install yang sempit.
  `setup-runtime` adalah surface setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup tertunda, termasuk adapter patch setup yang aman untuk import.
  `setup-adapter-runtime` adalah seam adapter account-setup yang sadar env.
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
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi
  perintah kustom Telegram dan tetap tersedia bahkan jika surface kontrak
  Telegram bundled sementara tidak tersedia.
  `text-runtime` adalah seam teks/markdown/logging bersama, termasuk
  penghapusan teks yang terlihat oleh assistant, helper render/chunking markdown,
  helper redaksi, helper directive-tag, dan utilitas teks aman.
- Seam channel spesifik approval harus lebih memilih satu kontrak
  `approvalCapability` pada plugin. Core kemudian membaca auth approval,
  pengiriman, render, native-routing, dan perilaku lazy native-handler melalui
  satu kapabilitas tersebut alih-alih mencampur perilaku approval ke field
  plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan hanya tersisa
  sebagai shim kompatibilitas untuk plugin lama. Kode baru sebaiknya mengimpor
  primitif generik yang lebih sempit, dan kode repo tidak boleh menambahkan
  impor baru dari shim tersebut.
- Internal ekstensi bundled tetap privat. Plugin eksternal sebaiknya hanya
  menggunakan subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat
  menggunakan entry point publik repo di bawah root paket plugin seperti
  `index.js`, `api.js`, `runtime-api.js`, `setup-entry.js`, dan file yang sempit
  seperti `login-qr-api.js`. Jangan pernah mengimpor `src/*` paket plugin dari
  core atau dari ekstensi lain.
- Pemisahan entry point repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel khusus runtime,
  `<plugin-package-root>/index.js` adalah entry plugin bundled,
  dan `<plugin-package-root>/setup-entry.js` adalah entry plugin setup.
- Contoh provider bundled saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper model default, dan builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder provider serta helper
    onboarding/config, sementara `register.runtime.js` masih dapat mengekspor
    ulang helper generik `plugin-sdk/provider-stream` untuk penggunaan lokal repo.
- Entry point publik yang dimuat melalui facade lebih memilih snapshot config
  runtime aktif ketika ada, lalu fallback ke file config yang telah di-resolve
  di disk saat OpenClaw belum menyajikan snapshot runtime.
- Primitif generik bersama tetap menjadi kontrak SDK publik yang diutamakan.
  Sekumpulan kecil seam helper bermerek channel bundled yang dicadangkan masih
  ada. Perlakukan ini sebagai seam pemeliharaan/kompatibilitas bundled, bukan
  target impor pihak ketiga baru; kontrak lintas channel baru tetap harus
  diterapkan pada subpath generik `plugin-sdk/*` atau barrel lokal plugin
  `api.js` / `runtime-api.js`.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitif stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju untuk
  pekerjaan plugin bundled dan eksternal baru.
  Parsing/matching target berada di `openclaw/plugin-sdk/channel-targets`.
  Gerbang aksi message dan helper message-id reaction berada di
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper spesifik ekstensi bundled tidak stabil secara default. Jika
  helper hanya dibutuhkan oleh ekstensi bundled, simpan helper itu di balik
  seam lokal `api.js` atau `runtime-api.js` milik ekstensi tersebut alih-alih
  mempromosikannya ke `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama baru harus generik, bukan bermerek channel. Parsing target
  bersama berada di `openclaw/plugin-sdk/channel-targets`; internal spesifik
  channel tetap berada di balik seam lokal `api.js` atau `runtime-api.js`
  milik plugin tersebut.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native
  menggunakannya saat ini. Keberadaannya tidak dengan sendirinya berarti setiap
  helper yang diekspor adalah kontrak eksternal jangka panjang yang dibekukan.

## Schema tool message

Plugin harus memiliki kontribusi schema `describeMessageTool(...)` yang
spesifik channel. Simpan field spesifik provider di plugin, bukan di core
bersama.

Untuk fragmen schema portabel bersama, gunakan ulang helper generik yang
diekspor melalui `openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload gaya grid tombol
- `createMessageToolCardSchema()` untuk payload card terstruktur

Jika suatu bentuk schema hanya masuk akal untuk satu provider, definisikan di
sumber plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel harus memiliki semantik target spesifik channel. Pertahankan host
outbound bersama tetap generik dan gunakan surface messaging adapter untuk
aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang telah
  dinormalisasi harus diperlakukan sebagai `direct`, `group`, atau `channel`
  sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core
  apakah input harus langsung melewati ke resolusi mirip-id alih-alih pencarian
  direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi akhir milik provider setelah normalisasi atau
  setelah miss pada direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi
  spesifik provider setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi
  sebelum mencari peer/group.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target
  eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan
  untuk pencarian direktori yang luas.
- Pertahankan id native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter spesifik provider, bukan di field
  SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config harus menjaga logika itu di
dalam plugin dan menggunakan kembali helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika suatu channel memerlukan peer/group berbasis config seperti:

- peer DM yang digerakkan allowlist
- peta channel/group yang dikonfigurasi
- fallback direktori statis yang terlingkup akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran query
- penerapan limit
- helper deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi id yang spesifik channel harus tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw
ke `models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika plugin memiliki model id spesifik provider, default
base URL, atau metadata model yang dijaga oleh auth.

`catalog.order` mengontrol kapan katalog plugin digabungkan relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider API-key biasa atau berbasis env
- `profile`: provider yang muncul saat auth profile ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada tabrakan key, sehingga plugin dapat
secara sengaja meng-override entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias lama
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan channel, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi bahwa
  kredensial telah sepenuhnya dimaterialisasi dan dapat gagal cepat ketika
  secret yang diperlukan tidak ada.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur perbaikan
  doctor/config tidak seharusnya perlu mematerialisasi kredensial runtime hanya
  untuk mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field
  sumber yang cocok) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan "configured but unavailable in
this command path" alih-alih crash atau salah melaporkan akun sebagai belum
dikonfigurasi.

## Package pack

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

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa ekstensi,
id plugin menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di
direktori itu agar `node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di
dalam direktori plugin setelah resolusi symlink. Entri yang keluar dari
direktori paket akan ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle scripts, tanpa dependensi dev saat runtime). Pertahankan pohon dependensi plugin tetap "pure JS/TS" dan hindari paket yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Saat OpenClaw memerlukan surface setup untuk plugin channel yang dinonaktifkan,
atau ketika plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw
memuat `setupEntry` alih-alih entri plugin penuh. Ini membuat startup dan setup
lebih ringan ketika entri plugin utama Anda juga melakukan wiring tool, hook,
atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat memilihkan plugin channel ke jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup surface startup yang
harus ada sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti
entri setup harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan
startup, seperti:

- pendaftaran channel itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- method gateway, tool, atau layanan apa pun yang harus ada selama jendela itu

Jika entri penuh Anda masih memiliki kapabilitas startup wajib, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh saat startup.

Channel bundled juga dapat menerbitkan helper surface kontrak khusus setup yang
dapat dikonsultasikan core sebelum runtime channel penuh dimuat. Surface promosi
setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface itu ketika perlu mempromosikan config channel
legacy akun tunggal ke `channels.<id>.accounts.*` tanpa memuat entri plugin
penuh. Matrix adalah contoh bundled saat ini: plugin ini hanya memindahkan key
auth/bootstrap ke akun bernama yang dipromosikan ketika akun bernama sudah ada,
dan dapat mempertahankan key default-account non-kanonis yang telah
dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch setup tersebut menjaga discovery surface kontrak bundled tetap
lazy. Waktu import tetap ringan; surface promosi dimuat hanya saat pertama kali
digunakan alih-alih memasuki kembali startup channel bundled saat import modul.

Ketika surface startup tersebut mencakup method Gateway RPC, pertahankan method
itu pada prefix spesifik plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
di-resolve ke `operator.admin`, bahkan jika plugin meminta scope yang lebih
sempit.

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
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core
tetap bebas data.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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
- `docsLabel`: override teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/channel prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol copy surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan outbound
- `exposure.configured`: sembunyikan channel dari surface daftar channel yang dikonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/private untuk surface navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: memilihkan channel ke alur `allowFrom` quickstart standar
- `forceAccountBinding`: mewajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: lebih memilih lookup sesi saat me-resolve target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor
registry MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk key `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks
default alih-alih hanya menambahkan memory search atau hook.

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

Jika engine Anda **tidak** memiliki algoritma compaction, tetap implementasikan
`compact()` dan delegasikan secara eksplisit:

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

Ketika plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan
melewati sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, merge config,
   lifecycle, semantik yang berhadapan dengan channel, dan bentuk helper runtime.
2. tambahkan surface pendaftaran/runtime plugin yang typed
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface kapabilitas
   typed terkecil yang berguna.
3. wiring core + konsumen channel/fitur
   Channel dan plugin fitur harus mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas itu.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar bentuk kepemilikan dan pendaftaran tetap eksplisit
   seiring waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded ke worldview satu
provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file yang konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
surface-surface ini bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- surface pendaftaran API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- ekspos runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- assertion kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu surface tersebut hilang, biasanya itu pertanda bahwa kapabilitas
belum sepenuhnya terintegrasi.

### Templat kapabilitas

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

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Ini menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit
