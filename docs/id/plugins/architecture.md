---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registri
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-07T09:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a48b387152c5a6a9782c5aaa9d6c215c16adb7cb256302d3e85f80b03f9b6898
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/id/tools/plugin) — panduan pengguna
  - [Memulai](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Plugin Channel](/id/plugins/sdk-channel-plugins) — bangun sebuah channel perpesanan
  - [Plugin Provider](/id/plugins/sdk-provider-plugins) — bangun provider model
  - [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin OpenClaw native mendaftar terhadap satu atau lebih jenis kapabilitas:

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

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih sepenuhnya didukung.

### Sikap kompatibilitas eksternal

Model kapabilitas telah hadir di core dan digunakan oleh plugin bundel/native
saat ini, tetapi kompatibilitas plugin eksternal masih memerlukan standar yang
lebih ketat daripada "ini diekspor, jadi ini dibekukan."

Panduan saat ini:

- **plugin eksternal yang sudah ada:** pertahankan integrasi berbasis hook agar
  tetap berfungsi; anggap ini sebagai baseline kompatibilitas
- **plugin bundel/native baru:** utamakan registrasi kapabilitas eksplisit
  daripada jangkauan vendor-spesifik atau desain hook-only baru
- **plugin eksternal yang mengadopsi registrasi kapabilitas:** diperbolehkan,
  tetapi perlakukan surface helper spesifik-kapabilitas sebagai sesuatu yang
  masih berkembang kecuali dokumentasi secara eksplisit menandai kontrak itu
  sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dituju
- hook legacy tetap menjadi jalur paling aman tanpa kerusakan untuk plugin
  eksternal selama transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak sempit
  yang terdokumentasi, bukan ekspor helper yang kebetulan ada

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam suatu bentuk
berdasarkan perilaku registrasi aktualnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu jenis kapabilitas (misalnya
  plugin provider saja seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa
  kapabilitas, alat, perintah, atau layanan
- **non-capability** -- mendaftarkan alat, perintah, layanan, atau route tetapi
  tanpa kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan
rincian kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk
detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin nyata legacy masih bergantung padanya.

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
| **config valid**           | Konfigurasi ter-parse dengan baik dan plugin berhasil di-resolve |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (misalnya `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Konfigurasi tidak valid atau plugin gagal dimuat             |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda
saat ini -- `hook-only` bersifat advisory, dan `before_agent_start` hanya
memicu peringatan. Sinyal-sinyal ini juga muncul di `openclaw status --all`
dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + penemuan**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root
   workspace, root extension global, dan extension bundel. Penemuan membaca
   manifest native `openclaw.plugin.json` serta manifest bundle yang didukung
   terlebih dahulu.
2. **Pengaktifan + validasi**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan,
   diblokir, atau dipilih untuk slot eksklusif seperti memory.
3. **Pemuatan runtime**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registri pusat. Bundle yang kompatibel dinormalisasi menjadi
   catatan registri tanpa mengimpor kode runtime.
4. **Konsumsi surface**
   Bagian lain OpenClaw membaca registri untuk mengekspos alat, channel,
   penyiapan provider, hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk plugin CLI, penemuan perintah root dibagi menjadi dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar pada
  pemanggilan pertama

Itu menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap
memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- penemuan + validasi config seharusnya bekerja dari **metadata
  manifest/schema** tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari jalur `register(api)` modul plugin

Pemisahan ini memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang
hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh
aktif.

### Plugin channel dan alat message bersama

Plugin channel tidak perlu mendaftarkan alat send/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu alat `message` bersama di core,
dan plugin channel memiliki penemuan serta eksekusi spesifik-channel di
belakangnya.

Batas saat ini adalah:

- core memiliki host alat `message` bersama, wiring prompt, pembukuan
  sesi/thread, dan dispatch eksekusi
- plugin channel memiliki penemuan aksi yang diberi scope, penemuan
  kapabilitas, dan fragmen schema spesifik-channel
- plugin channel memiliki tata bahasa percakapan sesi spesifik-provider,
  seperti bagaimana id percakapan mengenkode id thread atau mewarisi dari
  percakapan induk
- plugin channel mengeksekusi aksi akhir melalui action adapter mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan
terpadu itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas,
dan kontribusi schema secara bersama agar bagian-bagian itu tidak saling meleset.

Core meneruskan scope runtime ke langkah penemuan itu. Field penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Ini penting untuk plugin yang peka konteks. Suatu channel dapat menyembunyikan
atau mengekspos aksi message berdasarkan akun aktif, room/thread/message saat
ini, atau identitas peminta tepercaya tanpa mengeraskan percabangan
spesifik-channel di alat `message` core.

Inilah sebabnya perubahan routing embedded-runner masih merupakan pekerjaan
plugin: runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke
batas penemuan plugin agar alat `message` bersama mengekspos surface milik
channel yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundel harus menjaga runtime
eksekusi tetap berada di dalam modul extension milik mereka sendiri. Core tidak
lagi memiliki runtime aksi-message Discord, Slack, Telegram, atau WhatsApp di
bawah `src/agents/tools`. Kami tidak menerbitkan subpath
`plugin-sdk/*-action-runtime` terpisah, dan plugin bundel harus mengimpor kode
runtime lokal mereka sendiri langsung dari modul milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor convenience barrel spesifik-channel untuk Slack, Discord,
Signal, WhatsApp, atau extension serupa. Jika core memerlukan suatu perilaku,
gunakan barrel `api.ts` / `runtime-api.ts` milik plugin bundel itu sendiri
atau promosikan kebutuhan itu menjadi kapabilitas generik yang sempit di SDK
bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang sesuai dengan
  model poll umum
- `actions.handleAction("poll")` adalah jalur yang disukai untuk semantik poll
  spesifik-channel atau parameter poll tambahan

Core kini menunda parsing poll bersama sampai setelah dispatch poll plugin
menolak aksi tersebut, sehingga handler poll milik plugin dapat menerima field
poll spesifik-channel tanpa terlebih dahulu diblokir oleh parser poll generik.

Lihat [Pipeline pemuatan](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah
**perusahaan** atau sebuah **fitur**, bukan sebagai kumpulan acak integrasi
yang tidak terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua surface OpenClaw yang
  berhubungan dengan perusahaan tersebut
- plugin fitur biasanya harus memiliki seluruh surface fitur yang
  diperkenalkannya
- channel harus mengonsumsi kapabilitas core bersama alih-alih
  mengimplementasikan ulang perilaku provider secara ad hoc

Contoh:

- plugin bundel `openai` memiliki perilaku provider model OpenAI dan perilaku
  OpenAI untuk speech + realtime-voice + media-understanding + image-generation
- plugin bundel `elevenlabs` memiliki perilaku speech ElevenLabs
- plugin bundel `microsoft` memiliki perilaku speech Microsoft
- plugin bundel `google` memiliki perilaku provider model Google serta perilaku
  Google untuk media-understanding + image-generation + web-search
- plugin bundel `firecrawl` memiliki perilaku web-fetch Firecrawl
- plugin bundel `minimax`, `mistral`, `moonshot`, dan `zai` memiliki backend
  media-understanding mereka
- plugin `voice-call` adalah plugin fitur: plugin ini memiliki transport
  panggilan, alat, CLI, route, dan bridging media-stream Twilio, tetapi
  mengonsumsi kapabilitas speech bersama serta realtime-transcription dan
  realtime-voice alih-alih mengimpor plugin vendor secara langsung

Kondisi akhir yang dituju adalah:

- OpenAI hidup dalam satu plugin meskipun mencakup model teks, speech, gambar,
  dan video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface mereka sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka
  mengonsumsi kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah pembedaan kuncinya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi
  oleh banyak plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama
bukanlah "provider mana yang harus mengeraskan penanganan video?" Pertanyaan
pertamanya adalah "apa kontrak kapabilitas video core?" Setelah kontrak itu
ada, plugin vendor dapat mendaftar terhadapnya dan plugin channel/fitur dapat
mengonsumsinya.

Jika kapabilitas itu belum ada, langkah yang tepat biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin secara typed
3. hubungkan channel/fitur terhadap kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasi

Ini menjaga kepemilikan tetap eksplisit sekaligus menghindari perilaku core
yang bergantung pada satu vendor atau satu jalur kode spesifik-plugin.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode seharusnya berada:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan
  penggabungan config, semantik pengiriman, dan kontrak typed
- **lapisan plugin vendor**: API spesifik-vendor, auth, katalog model,
  sintesis speech, pembuatan gambar, backend video masa depan, endpoint usage
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menyajikannya di suatu surface

Sebagai contoh, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan
  pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan seharusnya terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, speech, realtime transcription, realtime voice,
media understanding, image generation, video generation, web fetch, dan web search,
sebuah vendor dapat memiliki semua surface-nya dalam satu tempat:

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
      // konfigurasi speech vendor — implementasikan interface SpeechProviderPlugin secara langsung
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

- satu plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- plugin channel dan fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaimnya miliki

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. plugin channel dan fitur mengonsumsi perilaku core bersama alih-alih
   melakukan wiring langsung ke kode vendor

Ini mencegah asumsi video milik satu provider tertanam di core. Plugin memiliki
surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas typed dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Surface API plugin sengaja dibuat typed dan terpusat di `OpenClawPluginApi`.
Kontrak itu mendefinisikan titik registrasi yang didukung dan helper runtime
yang dapat diandalkan oleh plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan id
  provider yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk
  registrasi yang salah bentuk
- pengujian kontrak dapat menegakkan kepemilikan plugin bundel dan mencegah
  pergeseran diam-diam

Ada dua lapisan penegakan:

1. **penegakan registrasi runtime**
   Registri plugin memvalidasi registrasi saat plugin dimuat. Contoh:
   id provider duplikat, id speech provider duplikat, dan registrasi yang salah
   bentuk menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **pengujian kontrak**
   Plugin bundel ditangkap dalam registri kontrak selama test berjalan sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini hal ini
   digunakan untuk provider model, speech provider, web search provider, dan
   kepemilikan registrasi bundel.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang
memiliki surface mana. Ini memungkinkan core dan channel berkomposisi dengan
mulus karena kepemilikan dinyatakan, typed, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- typed
- kecil
- spesifik-kapabilitas
- dimiliki oleh core
- dapat digunakan kembali oleh beberapa plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik-vendor yang disembunyikan di core
- jalur keluar satu kali untuk plugin tertentu yang melewati registri
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan kapabilitas terlebih
dahulu, lalu biarkan plugin terhubung ke sana.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** dengan Gateway. Mereka tidak
disandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses
yang sama dengan kode core.

Implikasinya:

- plugin native dapat mendaftarkan alat, handler jaringan, hook, dan layanan
- bug pada plugin native dapat menyebabkan gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini
memperlakukan mereka sebagai paket metadata/konten. Pada rilis saat ini, itu
sebagian besar berarti Skills yang dibundel.

Gunakan allowlist dan path install/load eksplisit untuk plugin yang bukan
bundel. Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan
default produksi.

Untuk nama package workspace yang dibundel, pertahankan id plugin tertambat
pada nama npm: `@openclaw/<id>` secara default, atau suffix typed yang
disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau
`-media-understanding` ketika package tersebut dengan sengaja mengekspos peran
plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **id plugin**, bukan asal sumber.
- Plugin workspace dengan id yang sama seperti plugin bundel sengaja
  membayangi salinan bundel saat plugin workspace itu diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan convenience implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper yang
bukan kontrak:

- subpath spesifik-helper plugin bundel
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience spesifik-vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bundel masih tetap ada dalam peta ekspor SDK
yang dihasilkan untuk kompatibilitas dan pemeliharaan plugin bundel. Contoh
saat ini mencakup `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan beberapa seam
`plugin-sdk/matrix*`. Perlakukan itu sebagai ekspor detail implementasi yang
dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk plugin pihak
ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw kira-kira melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle yang kompatibel dan metadata package
3. menolak kandidat yang tidak aman
4. menormalisasi config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias legacy)
   dan mengumpulkan registrasi ke registri plugin
8. mengekspos registri ke surface perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundel menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir ketika
entry keluar dari root plugin, path dapat ditulis oleh semua orang, atau
kepemilikan path tampak mencurigakan untuk plugin non-bundel.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/skills/schema config yang dideklarasikan atau kapabilitas
  bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog

Untuk plugin native, modul runtime adalah bagian data-plane. Modul itu
mendaftarkan perilaku aktual seperti hook, alat, perintah, atau alur provider.

### Apa yang di-cache loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil penemuan
- data registri manifest
- registri plugin yang dimuat

Cache ini mengurangi startup yang bursty dan overhead perintah berulang. Aman
untuk memikirkannya sebagai cache performa yang berumur pendek, bukan
persistensi.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registri

Plugin yang dimuat tidak langsung memodifikasi global core acak. Mereka
mendaftar ke registri plugin pusat.

Registri melacak:

- catatan plugin (identitas, sumber, origin, status, diagnostik)
- alat
- hook legacy dan hook typed
- channel
- provider
- handler RPC gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registri itu alih-alih berbicara langsung
dengan modul plugin. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> registrasi registri
- runtime core -> konsumsi registri

Pemisahan itu penting untuk maintainability. Artinya sebagian besar surface core
hanya memerlukan satu titik integrasi: "baca registri", bukan "perlakukan
spesial setiap modul plugin".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika sebuah persetujuan
di-resolve.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah
permintaan bind disetujui atau ditolak:

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

      // Permintaan ditolak; bersihkan state pending lokal apa pun.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding hasil resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, sender id, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Ini tidak mengubah siapa yang diizinkan
untuk mengikat percakapan, dan berjalan setelah penanganan persetujuan core
selesai.

## Hook runtime provider

Plugin provider kini memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup auth env provider murah
  sebelum runtime dimuat, `channelEnvVars` untuk lookup env/setup channel murah
  sebelum runtime dimuat, serta `providerAuthChoices` untuk label
  onboarding/pilihan-auth murah dan metadata flag CLI sebelum runtime dimuat
- hook saat config: `catalog` / legacy `discovery` plus `applyConfigDefaults`
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
kebijakan alat. Hook ini adalah surface extension untuk perilaku
spesifik-provider tanpa memerlukan seluruh transport inferensi kustom.

Gunakan manifest `providerAuthEnvVars` ketika provider memiliki kredensial
berbasis env yang perlu terlihat oleh jalur auth/status/model-picker generik
tanpa memuat runtime plugin. Gunakan manifest `providerAuthChoices` ketika
surface onboarding/pilihan-auth CLI perlu mengetahui id pilihan provider,
label grup, dan wiring auth satu-flag sederhana tanpa memuat runtime provider.
Pertahankan `envVars` runtime provider untuk petunjuk yang menghadap operator
seperti label onboarding atau variabel setup OAuth client-id/client-secret.

Gunakan manifest `channelEnvVars` ketika suatu channel memiliki auth atau setup
berbasis env yang perlu terlihat oleh fallback shell-env generik, pemeriksaan
config/status, atau prompt setup tanpa memuat runtime channel.

### Urutan hook dan penggunaan

Untuk plugin model/provider, OpenClaw memanggil hook kira-kira dalam urutan ini.
Kolom "When to use" adalah panduan keputusan singkat.

| #   | Hook                              | What it does                                                                                                   | When to use                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi provider ke `models.providers` selama pembuatan `models.json`                         | Provider memiliki katalog atau default base URL                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                               |
| --  | _(lookup model bawaan)_           | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalisasi alias model-id legacy atau preview sebelum lookup                                                | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                          |
| 4   | `normalizeTransport`              | Menormalisasi `api` / `baseUrl` keluarga provider sebelum perakitan model generik                             | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                         |
| 5   | `normalizeConfig`                 | Menormalisasi `models.providers.<id>` sebelum runtime/resolusi provider                                        | Provider memerlukan pembersihan config yang sebaiknya berada bersama plugin; helper keluarga Google bundel juga menjadi backstop entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompat penggunaan streaming native ke provider config                               | Provider memerlukan perbaikan metadata penggunaan streaming native yang digerakkan endpoint                                                 |
| 7   | `resolveConfigApiKey`             | Me-resolve auth env-marker untuk provider config sebelum pemuatan auth runtime                                 | Provider memiliki resolusi API key env-marker milik provider; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini       |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                              | Provider dapat beroperasi dengan marker kredensial sintetis/lokal                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Melapisi profil auth eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan ulang kredensial auth eksternal tanpa menyimpan token refresh yang disalin                                            |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config             | Provider menyimpan profil placeholder sintetis yang tidak seharusnya menang dalam prioritas                                                 |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik provider yang belum ada di registri lokal                                | Provider menerima id model upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                      | Provider memerlukan metadata jaringan sebelum me-resolve id yang tidak dikenal                                                              |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model hasil resolve                                  | Provider memerlukan penulisan ulang transport tetapi tetap memakai transport core                                                           |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompat untuk model vendor di balik transport kompatibel lain                                | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                      |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan kekhususan transkrip/keluarga provider                                                                                  |
| 16  | `normalizeToolSchemas`            | Menormalisasi schema alat sebelum embedded runner melihatnya                                                   | Provider memerlukan pembersihan schema keluarga transport                                                                                   |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                               | Provider menginginkan peringatan keyword tanpa mengajari core aturan spesifik-provider                                                      |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Provider memerlukan reasoning/final output bertag alih-alih field native                                                                    |
| 19  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Provider memerlukan default parameter request atau pembersihan parameter per-provider                                                        |
| 20  | `createStreamFn`                  | Sepenuhnya mengganti jalur stream normal dengan transport kustom                                               | Provider memerlukan protokol wire kustom, bukan sekadar wrapper                                                                             |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper header/body/model compat request tanpa transport kustom                                                         |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata per-turn transport native                                                     | Provider ingin transport generik mengirim identitas turn native milik provider                                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                            |
| 24  | `formatApiKey`                    | Formatter profil auth: profil yang disimpan menjadi string `apiKey` runtime                                    | Provider menyimpan metadata auth ekstra dan memerlukan bentuk token runtime kustom                                                          |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                       |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                         |
| 27  | `matchesContextOverflowError`     | Matcher overflow jendela konteks milik provider                                                                | Provider memiliki error overflow mentah yang akan luput dari heuristik generik                                                              |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                            |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache spesifik-proxy                                                                                         |
| 30  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                                 | Provider memerlukan petunjuk pemulihan missing-auth yang spesifik-provider                                                                  |
| 31  | `suppressBuiltInModel`            | Penindasan model upstream basi plus petunjuk error yang menghadap pengguna secara opsional                    | Provider perlu menyembunyikan baris upstream basi atau menggantinya dengan petunjuk vendor                                                  |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/akhir ditambahkan setelah penemuan                                                      | Provider memerlukan baris forward-compat sintetis di `models list` dan picker                                                               |
| 33  | `isBinaryThinking`                | Toggle reasoning on/off untuk provider binary-thinking                                                         | Provider hanya mengekspos reasoning biner on/off                                                                                            |
| 34  | `supportsXHighThinking`           | Dukungan reasoning `xhigh` untuk model tertentu                                                                | Provider menginginkan `xhigh` hanya pada sebagian model                                                                                     |
| 35  | `resolveDefaultThinkingLevel`     | Level `/think` default untuk keluarga model tertentu                                                           | Provider memiliki kebijakan `/think` default untuk suatu keluarga model                                                                     |
| 36  | `isModernModelRef`                | Matcher model modern untuk filter profil live dan pemilihan smoke                                              | Provider memiliki pencocokan model pilihan untuk live/smoke                                                                                 |
| 37  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime yang sebenarnya tepat sebelum inferensi       | Provider memerlukan pertukaran token atau kredensial request berumur pendek                                                                 |
| 38  | `resolveUsageAuth`                | Me-resolve kredensial usage/billing untuk `/usage` dan surface status terkait                                  | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                     |
| 39  | `fetchUsageSnapshot`              | Mengambil dan menormalisasi snapshot usage/kuota spesifik-provider setelah auth di-resolve                     | Provider memerlukan endpoint usage atau parser payload spesifik-provider                                                                    |
| 40  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                                                 | Perilaku embedding memory sebaiknya berada bersama plugin provider                                                                          |
| 41  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya, menghapus blok thinking)                                                          |
| 42  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay spesifik-provider di luar helper kompaksi bersama                                                |
| 43  | `validateReplayTurns`             | Validasi atau pembentukan ulang turn replay akhir sebelum embedded runner                                      | Transport provider memerlukan validasi turn yang lebih ketat setelah sanitasi generik                                                       |
| 44  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider memerlukan telemetri atau state milik provider ketika model menjadi aktif                                                          |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama
memeriksa plugin provider yang cocok, lalu melanjutkan ke plugin provider lain
yang mampu menangani hook sampai salah satunya benar-benar mengubah model id
atau transport/config. Ini menjaga shim provider alias/compat tetap berfungsi
tanpa mengharuskan pemanggil mengetahui plugin bundel mana yang memiliki
penulisan ulang itu. Jika tidak ada hook provider yang menulis ulang entri
config keluarga Google yang didukung, normalizer config Google bundel tetap
menerapkan pembersihan kompatibilitas itu.

Jika provider membutuhkan protokol wire yang sepenuhnya kustom atau eksekutor
request kustom, itu adalah kelas extension yang berbeda. Hook ini ditujukan
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
  dan `wrapStreamFn` karena plugin ini memiliki forward-compat Claude 4.6,
  petunjuk keluarga provider, panduan perbaikan auth, integrasi endpoint usage,
  kelayakan prompt-cache, default config yang sadar auth, kebijakan thinking
  default/adaptif Claude, dan pembentukan stream spesifik Anthropic untuk
  header beta, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream spesifik Claude milik Anthropic tetap berada di seam publik
  `api.ts` / `contract-api.ts` milik plugin bundel tersebut untuk saat ini.
  Surface package itu mengekspor `wrapAnthropicProviderStream`,
  `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
  `resolveAnthropicServiceTier`, dan builder wrapper Anthropic level rendah
  alih-alih memperlebar SDK generik di sekitar aturan beta-header milik satu
  provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, dan `isModernModelRef`
  karena plugin ini memiliki forward-compat GPT-5.4, normalisasi langsung
  OpenAI `openai-completions` -> `openai-responses`, petunjuk auth yang sadar
  Codex, penindasan Spark, baris daftar OpenAI sintetis, dan kebijakan
  thinking / live-model GPT-5; keluarga stream `openai-responses-defaults`
  memiliki wrapper OpenAI Responses native bersama untuk header atribusi,
  `/fast`/`serviceTier`, text verbosity, pencarian web native Codex,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena providernya bersifat pass-through dan mungkin
  mengekspos id model baru sebelum katalog statis OpenClaw diperbarui; plugin
  ini juga menggunakan `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` agar header request, metadata routing, patch reasoning,
  dan kebijakan prompt-cache spesifik-provider tetap berada di luar core.
  Kebijakan replay-nya berasal dari keluarga `passthrough-gemini`, sedangkan
  keluarga stream `openrouter-thinking` memiliki penyisipan reasoning proxy dan
  skip untuk model yang tidak didukung / `auto`.
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
  plugin ini berbagi keluarga stream `openai-responses-defaults` yang sama
  dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena keluarga
  replay `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output
  reasoning bertag, dan pencocokan model modern, sementara keluarga stream
  `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk pemformatan token, parsing token, dan wiring
  endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui keluarga replay
  `anthropic-by-model` sehingga pembersihan replay spesifik Claude tetap
  terbatas pada id Claude, bukan setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveDefaultThinkingLevel` karena plugin ini
  memiliki klasifikasi error throttle/not-ready/context-overflow spesifik
  Bedrock untuk traffic Anthropic-on-Bedrock; kebijakan replay-nya tetap
  berbagi guard `anthropic-by-model` khusus Claude yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan
  `buildReplayPolicy` melalui keluarga replay `passthrough-gemini` karena
  mereka mem-proxy model Gemini melalui transport yang kompatibel dengan
  OpenAI dan memerlukan sanitasi thought-signature Gemini tanpa validasi replay
  Gemini native atau penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui keluarga replay
  `hybrid-anthropic-openai` karena satu provider memiliki semantik pesan
  Anthropic dan kompatibel OpenAI sekaligus; plugin ini mempertahankan
  penghapusan thinking-block khusus Claude di sisi Anthropic sambil
  meng-override mode output reasoning kembali ke native, dan keluarga stream
  `minimax-fast-mode` memiliki penulisan ulang model fast-mode pada jalur
  stream bersama.
- Moonshot menggunakan `catalog` plus `wrapStreamFn` karena masih menggunakan
  transport OpenAI bersama tetapi memerlukan normalisasi payload thinking milik
  provider; keluarga stream `moonshot-thinking` memetakan config plus state
  `/think` ke payload thinking biner native-nya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena memerlukan header request milik provider,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating TTL
  cache Anthropic; keluarga stream `kilocode-thinking` menjaga penyisipan
  thinking Kilo pada jalur stream proxy bersama sambil melewati `kilo/auto` dan
  id model proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena memiliki fallback GLM-5,
  default `tool_stream`, UX thinking biner, pencocokan model modern, serta
  auth usage + pengambilan kuota; keluarga stream `tool-stream-default-on`
  menjaga wrapper `tool_stream` default-on tetap di luar glue tulisan tangan
  per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena memiliki normalisasi transport xAI Responses native, penulisan ulang
  alias Grok fast-mode, default `tool_stream`, pembersihan strict-tool /
  reasoning-payload, penggunaan ulang auth fallback untuk alat milik plugin,
  resolusi model Grok forward-compat, dan patch kompat milik provider seperti
  profil tool-schema xAI, keyword schema yang tidak didukung, `web_search`
  native, dan dekode argumen tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities`
  untuk menjaga kekhususan transkrip/tooling tetap di luar core.
- Provider bundel yang hanya berkatalog seperti `byteplus`,
  `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine`
  hanya menggunakan `catalog`.
- Qwen menggunakan `catalog` untuk provider teksnya plus registrasi
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

- `textToSpeech` mengembalikan payload keluaran TTS core normal untuk surface
  file/voice-note.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan
  resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk voice picker milik
  vendor atau alur setup.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale,
  gender, dan tag personality untuk picker yang sadar provider.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

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
- Input legacy Microsoft `edge` dinormalisasi ke id provider `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu plugin vendor
  dapat memiliki provider teks, speech, gambar, dan media masa depan seiring
  OpenClaw menambahkan kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding typed alih-alih bag key/value generik:

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

Untuk transkripsi audio, plugin dapat menggunakan runtime
media-understanding atau alias STT yang lebih lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opsional ketika MIME tidak dapat diinferensikan secara andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah surface bersama yang disukai untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` ketika tidak ada keluaran transkripsi
  yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias
  kompatibilitas.

Plugin juga dapat meluncurkan eksekusi subagent latar belakang melalui
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

- `provider` dan `model` adalah override per-eksekusi yang opsional, bukan
  perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk eksekusi fallback milik plugin, operator harus ikut serta dengan
  `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin
  tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk
  secara eksplisit mengizinkan target apa pun.
- Eksekusi subagent plugin yang tidak tepercaya tetap berfungsi, tetapi
  permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau wiring alat agen:

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

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik request
  bersama di core.
- Gunakan web-search provider untuk transport pencarian spesifik-vendor.
- `api.runtime.webSearch.*` adalah surface bersama yang disukai untuk plugin
  fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada
  wrapper alat agen.

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

- `generate(...)`: hasilkan gambar menggunakan rantai provider image-generation
  yang dikonfigurasi.
- `listProviders(...)`: daftarkan provider image-generation yang tersedia dan
  kapabilitasnya.

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
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal,
  atau `"plugin"` untuk auth/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti
  pendaftaran route miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` ketika route menangani request.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error
  pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu
  plugin tidak dapat mengganti route milik plugin lain.
- Route yang saling tumpang tindih dengan level `auth` berbeda ditolak.
  Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang
  sama.
- Route `auth: "plugin"` **tidak** menerima scope runtime operator secara
  otomatis. Route ini untuk webhook/verifikasi signature yang dikelola plugin,
  bukan panggilan helper Gateway istimewa.
- Route `auth: "gateway"` berjalan di dalam scope runtime request Gateway,
  tetapi scope itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`)
    menjaga scope runtime plugin-route tetap dipatok ke `operator.write`,
    bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau
    `gateway.auth.mode = "none"` pada ingress privat) menghormati
    `x-openclaw-scopes` hanya ketika header tersebut memang ada
  - jika `x-openclaw-scopes` tidak ada pada request plugin-route yang membawa
    identitas itu, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan menganggap route plugin auth-gateway sebagai surface
  admin implisit. Jika route Anda memerlukan perilaku admin-only, wajibkan mode
  auth yang membawa identitas dan dokumentasikan kontrak header
  `x-openclaw-scopes` secara eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitive registrasi plugin.
- `openclaw/plugin-sdk/core` untuk kontrak generik bersama yang menghadap plugin.
- `openclaw/plugin-sdk/config-schema` untuk ekspor schema Zod root
  `openclaw.json` (`OpenClawSchema`).
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
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring setup/auth/reply/webhook
  bersama. `channel-inbound` adalah rumah bersama untuk debounce, mention matching,
  helper kebijakan mention inbound, formatting envelope inbound, dan helper
  konteks envelope inbound.
  `channel-setup` adalah seam setup instalasi opsional yang sempit.
  `setup-runtime` adalah surface setup yang aman untuk runtime yang digunakan
  oleh `setupEntry` / startup tertunda, termasuk adapter patch setup yang aman
  untuk impor.
  `setup-adapter-runtime` adalah seam adapter setup akun yang sadar env.
  `setup-tools` adalah seam helper kecil CLI/arsip/dok (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpath domain seperti `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `telegram-command-config` adalah seam publik sempit untuk
  normalisasi/validasi perintah kustom Telegram dan tetap tersedia bahkan jika
  surface kontrak Telegram bundel untuk sementara tidak tersedia.
  `text-runtime` adalah seam teks/markdown/logging bersama, termasuk
  penghapusan teks yang terlihat oleh asisten, helper render/chunking markdown,
  helper redaction, helper directive-tag, dan utilitas safe-text.
- Seam channel khusus approval sebaiknya mengutamakan satu kontrak
  `approvalCapability` pada plugin. Core kemudian membaca auth approval,
  pengiriman, render, dan perilaku native-routing melalui satu kapabilitas itu
  alih-alih mencampur perilaku approval ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan tetap ada hanya
  sebagai shim kompatibilitas untuk plugin lama. Kode baru harus mengimpor
  primitive generik yang lebih sempit, dan kode repo tidak boleh menambahkan
  impor baru dari shim tersebut.
- Internal extension bundel tetap privat. Plugin eksternal hanya boleh
  menggunakan subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat
  menggunakan entry point publik repo di bawah root package plugin seperti
  `index.js`, `api.js`, `runtime-api.js`, `setup-entry.js`, dan file yang
  diberi scope sempit seperti `login-qr-api.js`. Jangan pernah mengimpor
  `src/*` package plugin dari core atau dari extension lain.
- Pemisahan entry point repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel hanya-runtime,
  `<plugin-package-root>/index.js` adalah entry plugin bundel,
  dan `<plugin-package-root>/setup-entry.js` adalah entry plugin setup.
- Contoh provider bundel saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream
    Claude seperti `wrapAnthropicProviderStream`, helper beta-header, dan
    parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper model default,
    dan builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder provider plus helper
    onboarding/config, sementara `register.runtime.js` masih dapat
    me-re-export helper generik `plugin-sdk/provider-stream` untuk penggunaan
    lokal repo.
- Entry point publik yang dimuat melalui facade mengutamakan snapshot config
  runtime aktif ketika tersedia, lalu fallback ke file config yang di-resolve
  di disk ketika OpenClaw belum menyajikan snapshot runtime.
- Primitive generik bersama tetap merupakan kontrak SDK publik yang disukai.
  Satu set kompatibilitas kecil yang dicadangkan dari seam helper bermerek
  channel bundel masih ada. Perlakukan itu sebagai seam pemeliharaan bundel /
  kompatibilitas, bukan target impor pihak ketiga baru; kontrak lintas-channel
  baru tetap harus hadir pada subpath `plugin-sdk/*` generik atau barrel lokal
  `api.js` / `runtime-api.js` milik plugin.

Catatan kompatibilitas:

- Hindari root barrel `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitive stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju
  untuk pekerjaan plugin bundel dan eksternal baru.
  Parsing/matching target berada di `openclaw/plugin-sdk/channel-targets`.
  Gerbang aksi message dan helper message-id reaction berada di
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper spesifik extension bundel tidak stabil secara default. Jika
  helper hanya dibutuhkan oleh extension bundel, simpan di balik seam lokal
  `api.js` atau `runtime-api.js` milik extension itu alih-alih
  mempromosikannya ke `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama baru harus generik, bukan bermerek channel. Parsing
  target bersama berada di `openclaw/plugin-sdk/channel-targets`; internal
  spesifik-channel tetap berada di balik seam lokal `api.js` atau
  `runtime-api.js` milik plugin pemiliknya.
- Subpath spesifik-kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundel/native
  menggunakannya saat ini. Kehadirannya sendiri tidak serta-merta berarti
  setiap helper yang diekspor adalah kontrak eksternal jangka panjang yang
  dibekukan.

## Schema alat message

Plugin harus memiliki kontribusi schema `describeMessageTool(...)`
spesifik-channel. Pertahankan field spesifik-provider di plugin, bukan di core
bersama.

Untuk fragmen schema portabel bersama, gunakan kembali helper generik yang
diekspor melalui `openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload gaya grid tombol
- `createMessageToolCardSchema()` untuk payload kartu terstruktur

Jika suatu bentuk schema hanya masuk akal untuk satu provider, definisikan di
source plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel harus memiliki semantik target spesifik-channel. Pertahankan host
outbound bersama tetap generik dan gunakan surface adapter perpesanan untuk
aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang telah
  dinormalisasi harus diperlakukan sebagai `direct`, `group`, atau `channel`
  sebelum lookup directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core
  apakah suatu input harus langsung melewati ke resolusi mirip-id alih-alih
  pencarian directory.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi akhir milik provider setelah normalisasi atau
  setelah directory tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi
  spesifik-provider setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi
  sebelum mencari peer/group.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target
  eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik-provider, bukan
  untuk pencarian directory yang luas.
- Pertahankan id native provider seperti id chat, id thread, JID, handle, dan
  id room di dalam nilai `target` atau parameter spesifik-provider, bukan di
  field SDK generik.

## Directory berbasis config

Plugin yang menurunkan entri directory dari config harus mempertahankan logika
itu di dalam plugin dan menggunakan kembali helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika suatu channel memerlukan peer/group berbasis config seperti:

- peer DM yang didorong allowlist
- peta channel/group yang dikonfigurasi
- fallback directory statis yang diberi scope akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- penyaringan query
- penerapan batas
- helper dedupe/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun spesifik-channel dan normalisasi id harus tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw
ke `models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika plugin memiliki id model spesifik-provider, default
base URL, atau metadata model yang digerakkan auth.

`catalog.order` mengontrol kapan katalog plugin digabungkan relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API key atau env
- `profile`: provider yang muncul ketika profil auth ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah provider implisit lain

Provider yang lebih akhir menang pada tabrakan key, sehingga plugin dapat
dengan sengaja meng-override entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` keduanya didaftarkan, OpenClaw menggunakan
  `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan channel, utamakan mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan
  kredensial telah termaterialisasi sepenuhnya dan dapat gagal cepat ketika
  secret yang diperlukan hilang.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan doctor/config
  repair flow seharusnya tidak perlu mematerialisasi kredensial runtime hanya
  untuk menjelaskan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Hanya mengembalikan state akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field
  sumber yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui
  SecretRef tetapi tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan "configured but unavailable in
this command path" alih-alih crash atau salah melaporkan akun sebagai tidak
dikonfigurasi.

## Package pack

Sebuah direktori plugin dapat menyertakan `package.json` dengan
`openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa extension,
id plugin menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di
direktori itu agar `node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di
dalam direktori plugin setelah resolusi symlink. Entri yang keluar dari
direktori package akan ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin
dengan `npm install --omit=dev --ignore-scripts` (tanpa lifecycle scripts, tanpa dev dependencies saat runtime). Pertahankan pohon dependensi plugin tetap
"pure JS/TS" dan hindari package yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Ketika OpenClaw memerlukan surface setup untuk plugin channel yang
dinonaktifkan, atau ketika plugin channel diaktifkan tetapi masih belum
dikonfigurasi, OpenClaw memuat `setupEntry` alih-alih entri plugin penuh. Ini
menjaga startup dan setup tetap lebih ringan ketika entri plugin utama Anda
juga mewiring alat, hook, atau kode runtime-only lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan plugin channel ke jalur `setupEntry` yang sama selama
fase startup pre-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup surface startup yang
harus ada sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti
entry setup harus mendaftarkan setiap kapabilitas milik channel yang
bergantung pada startup, seperti:

- registrasi channel itu sendiri
- route HTTP apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- gateway method, alat, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup penting apa pun,
jangan aktifkan flag ini. Pertahankan plugin pada perilaku default dan biarkan
OpenClaw memuat entri penuh selama startup.

Channel bundel juga dapat menerbitkan helper surface-kontrak khusus setup yang
dapat dikonsultasikan core sebelum runtime channel penuh dimuat. Surface
promosi setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface itu ketika perlu mempromosikan config channel
single-account legacy ke `channels.<id>.accounts.*` tanpa memuat entri plugin
penuh. Matrix adalah contoh bundel saat ini: plugin ini hanya memindahkan key
auth/bootstrap ke akun hasil promosi yang bernama ketika akun bernama sudah
ada, dan dapat mempertahankan key default-account non-kanonis yang telah
dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch setup tersebut menjaga penemuan surface-kontrak bundel tetap
lazy. Waktu impor tetap ringan; surface promosi hanya dimuat saat pertama kali
digunakan alih-alih masuk kembali ke startup channel bundel saat impor modul.

Ketika surface startup tersebut mencakup gateway RPC method, pertahankan pada
prefix spesifik-plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
di-resolve ke `operator.admin`, bahkan jika plugin meminta scope yang lebih sempit.

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

Plugin channel dapat mengiklankan metadata setup/penemuan melalui
`openclaw.channel` dan petunjuk instal melalui `openclaw.install`. Ini menjaga
data katalog core tetap tanpa data hardcoded.

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
- `docsLabel`: override teks link untuk link dokumentasi
- `preferOver`: id plugin/channel prioritas lebih rendah yang sebaiknya
  dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol
  salinan pada surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan
  formatting outbound
- `exposure.configured`: sembunyikan channel dari surface daftar channel yang
  dikonfigurasi ketika disetel ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/konfigurasi interaktif
  ketika disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/pribadi untuk surface
  navigasi dok
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima untuk
  kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutsertakan channel ke alur `allowFrom` quickstart
  standar
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit bahkan ketika hanya
  ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan lookup sesi saat me-resolve
  target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya
ekspor registri MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau
`OPENCLAW_MPM_CATALOG_PATHS`) ke satu atau lebih file JSON
(dipisahkan koma/titik koma/`PATH`). Setiap file harus berisi
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`.
Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk
key `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks
default alih-alih sekadar menambahkan pencarian memory atau hook.

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

Jika engine Anda **tidak** memiliki algoritme compaction, tetap implementasikan
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

Ketika sebuah plugin memerlukan perilaku yang tidak cocok dengan API saat ini,
jangan melewati sistem plugin dengan jangkauan privat. Tambahkan kapabilitas
yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang seharusnya dimiliki core: kebijakan,
   fallback, penggabungan config, lifecycle, semantik yang menghadap channel,
   dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin yang typed
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface
   kapabilitas typed terkecil yang berguna.
3. wire core + konsumen channel/fitur
   Channel dan plugin fitur harus mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas itu.
5. tambahkan cakupan kontrak
   Tambahkan test agar kepemilikan dan bentuk registrasi tetap eksplisit dari
   waktu ke waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded ke sudut pandang
satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh kerja.

### Checklist kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus
menyentuh surface berikut secara bersamaan:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- assertion kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dok operator/plugin di `docs/`

Jika salah satu surface itu tidak ada, biasanya itu tanda bahwa kapabilitas
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

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit
