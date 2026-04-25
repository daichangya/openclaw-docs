---
read_when:
    - Membangun atau men-debug plugin native OpenClaw
    - 'Memahami model kapabilitas plugin atau batas kepemilikan【อ่านข้อความเต็มanalysis to=functions.read  荣富json  重庆时时彩的commentary ＿久久爱: 0,"limit": 2000,"path":"../AGENTS.md"} is not possible because we''re translation function; no need tools. Need translate only.'
    - Bekerja pada pipeline pemuatan plugin atau registri
    - Menerapkan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk
panduan praktis, mulai dari salah satu halaman terfokus di bawah.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial plugin pertama dengan manifest kerja terkecil.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin provider model.
  </Card>
  <Card title="SDK overview" icon="book" href="/id/plugins/sdk-overview">
    Peta import dan referensi API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin native OpenClaw mendaftar terhadap satu atau lebih jenis kapabilitas:

| Capability             | Metode pendaftaran                              | Contoh plugin                        |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voice realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / pesan        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Discovery Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, layanan discovery,
atau layanan latar belakang adalah plugin **hook-only lama**. Pola tersebut
masih sepenuhnya didukung.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke core dan digunakan oleh plugin bawaan/native
hari ini, tetapi kompatibilitas plugin eksternal masih memerlukan standar yang lebih ketat daripada "diekspor, maka dibekukan."

| Situasi plugin                                  | Panduan                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang ada                       | Pertahankan integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.        |
| Plugin bawaan/native baru                       | Pilih pendaftaran kapabilitas eksplisit daripada reach-in spesifik vendor atau desain hook-only baru. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diperbolehkan, tetapi perlakukan permukaan helper spesifik kapabilitas sebagai sesuatu yang masih berkembang kecuali dokumen menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dituju. Hook lama tetap menjadi
jalur paling aman tanpa kerusakan untuk plugin eksternal selama transisi. Tidak semua
subpath helper yang diekspor setara — utamakan kontrak terdokumentasi yang sempit daripada ekspor helper insidental.

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam bentuk berdasarkan perilaku
pendaftaran aktualnya (bukan hanya metadata statis):

- **plain-capability**: mendaftarkan tepat satu jenis kapabilitas (misalnya plugin
  hanya-provider seperti `mistral`).
- **hybrid-capability**: mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar).
- **hook-only**: hanya mendaftarkan hook (bertipe atau kustom), tanpa kapabilitas,
  tool, perintah, atau layanan.
- **non-capability**: mendaftarkan tool, perintah, layanan, atau route tetapi tanpa
  kapabilitas.

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin nyata lama masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai lama
- pilih `before_model_resolve` untuk pekerjaan override model/provider
- pilih `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label berikut:

| Signal                     | Arti                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfigurasi ter-parse dengan baik dan plugin berhasil di-resolve |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Konfigurasi tidak valid atau plugin gagal dimuat             |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda hari ini:
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal ini
juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root workspace,
   root plugin global, dan plugin bawaan. Discovery membaca manifest native
   `openclaw.plugin.json` plus manifest bundle yang didukung terlebih dahulu.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memory.
3. **Pemuatan runtime**
   Plugin native OpenClaw dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registri pusat. Bundle yang kompatibel dinormalisasi menjadi
   catatan registri tanpa mengimpor kode runtime.
4. **Konsumsi permukaan**
   Bagian lain OpenClaw membaca registri untuk mengekspos tool, channel, penyiapan provider,
   hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi dalam dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar pada pemanggilan pertama

Itu menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap membiarkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- validasi manifest/konfigurasi harus bekerja dari **metadata manifest/skema**
  tanpa mengeksekusi kode plugin
- discovery kapabilitas native dapat memuat kode entri plugin tepercaya untuk membangun
  snapshot registri non-activating
- perilaku runtime native berasal dari path `register(api)` modul plugin
  dengan `api.registrationMode === "full"`

Pemisahan itu memungkinkan OpenClaw memvalidasi konfigurasi, menjelaskan plugin yang hilang/dinonaktifkan, dan
membangun petunjuk UI/skema sebelum runtime penuh aktif.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Pemanggil dapat bertanya plugin
mana yang relevan dengan perintah, provider, channel, route, harness agen, atau
kapabilitas konkret sebelum memuat registri runtime yang lebih luas.

Planner menjaga perilaku manifest saat ini tetap kompatibel:

- field `activation.*` adalah petunjuk planner eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifest
- API planner khusus-id tetap tersedia untuk pemanggil yang ada
- API plan melaporkan label alasan sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti
`register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Pilih field
kepemilikan ketika field tersebut sudah menjelaskan hubungan; gunakan `activation` hanya untuk petunjuk planner tambahan.

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool kirim/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core, dan
plugin channel memiliki discovery dan eksekusi khusus channel di belakangnya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery action yang dicakup, discovery kapabilitas, dan fragmen skema khusus channel apa pun
- plugin channel memiliki tata bahasa percakapan sesi spesifik provider, seperti
  bagaimana ID percakapan mengodekan ID thread atau mewarisi dari percakapan induk
- plugin channel mengeksekusi action akhir melalui adaptor action mereka

Untuk plugin channel, permukaan SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu
ini memungkinkan plugin mengembalikan action, kapabilitas, dan kontribusi skema
yang terlihat bersama-sama sehingga bagian-bagian tersebut tidak saling menyimpang.

Saat param tool pesan khusus channel membawa sumber media seperti
path lokal atau URL media remote, plugin juga harus mengembalikan
`mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar eksplisit
ini untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar
tanpa meng-hardcode nama param milik plugin.
Pilih peta yang dicakup per action di sana, bukan satu daftar datar seluruh channel, agar
param media yang hanya untuk profil tidak dinormalisasi pada action yang tidak terkait seperti
`send`.

Core meneruskan cakupan runtime ke langkah discovery tersebut. Field penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk tepercaya

Ini penting untuk plugin yang peka konteks. Sebuah channel dapat menyembunyikan atau mengekspos
action pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau
identitas peminta tepercaya tanpa meng-hardcode cabang khusus channel di tool `message`
core.

Inilah sebabnya perubahan perutean embedded-runner tetap merupakan pekerjaan plugin: runner bertanggung jawab
meneruskan identitas chat/sesi saat ini ke batas discovery plugin sehingga tool `message` bersama mengekspos permukaan milik channel yang benar untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bawaan harus mempertahankan runtime eksekusi
di dalam modul ekstensi mereka sendiri. Core tidak lagi memiliki runtime action pesan Discord,
Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan
plugin bawaan harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik
ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak boleh
mengimpor barrel convenience khusus channel untuk ekstensi Slack, Discord, Signal,
WhatsApp, atau serupa. Jika core memerlukan suatu perilaku, konsumsi
`api.ts` / `runtime-api.ts` milik plugin bawaan itu sendiri atau promosikan kebutuhan tersebut
menjadi kapabilitas generik sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang sesuai dengan
  model poll umum
- `actions.handleAction("poll")` adalah jalur yang disarankan untuk semantik poll
  khusus channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll plugin menolak
action tersebut, sehingga handler poll milik plugin dapat menerima field poll khusus channel tanpa diblokir parser poll generik terlebih dahulu.

Lihat [Plugin architecture internals](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah
**fitur**, bukan sebagai kumpulan integrasi yang tidak saling terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua permukaan OpenClaw yang menghadap ke perusahaan tersebut
- plugin fitur biasanya harus memiliki permukaan fitur lengkap yang diperkenalkannya
- channel harus menggunakan kapabilitas core bersama alih-alih mengimplementasikan ulang perilaku provider secara ad hoc

<Accordion title="Contoh pola kepemilikan di seluruh plugin bawaan">
  - **Vendor multi-kapabilitas**: `openai` memiliki inferensi teks, ucapan, voice realtime, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks serta pemahaman media, pembuatan gambar, dan pencarian web. `qwen` memiliki inferensi teks serta pemahaman media dan pembuatan video.
  - **Vendor satu kapabilitas**: `elevenlabs` dan `microsoft` memiliki ucapan;
    `firecrawl` memiliki pengambilan web; `minimax` / `mistral` / `moonshot` / `zai` memiliki
    backend pemahaman media.
  - **Plugin fitur**: `voice-call` memiliki transport panggilan, tool, CLI, route,
    dan bridge media-stream Twilio, tetapi menggunakan kapabilitas ucapan, transkripsi realtime, dan voice realtime bersama alih-alih mengimpor plugin vendor secara langsung.
</Accordion>

Keadaan akhir yang dituju adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, ucapan, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka menggunakan kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah perbedaan utamanya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau digunakan oleh banyak plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan
"provider mana yang harus meng-hardcode penanganan video?" Pertanyaan pertama adalah "apa
kontrak kapabilitas video di core?" Setelah kontrak itu ada, plugin vendor
dapat mendaftar terhadapnya dan plugin channel/fitur dapat menggunakannya.

Jika kapabilitas tersebut belum ada, langkah yang tepat biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin dengan cara bertipe
3. hubungkan channel/fitur terhadap kapabilitas tersebut
4. biarkan plugin vendor mendaftarkan implementasi

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang bergantung pada
satu vendor atau satu jalur kode khusus plugin.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode harus ditempatkan:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan merge konfigurasi, semantik pengiriman, dan kontrak bertipe
- **lapisan plugin vendor**: API khusus vendor, auth, katalog model, sintesis ucapan, pembuatan gambar, backend video masa depan, endpoint penggunaan
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll. yang menggunakan kapabilitas core dan menyajikannya pada suatu permukaan

Sebagai contoh, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` menggunakan helper runtime TTS telephony

Pola yang sama sebaiknya dipilih untuk kapabilitas masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama
untuk model, ucapan, transkripsi realtime, voice realtime, pemahaman media,
pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web,
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
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Yang penting bukan nama helper pastinya. Bentuknya yang penting:

- satu plugin memiliki permukaan vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur menggunakan helper `api.runtime.*`, bukan kode vendor
- contract test dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman image/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak pemahaman media
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. channel dan plugin fitur menggunakan perilaku core bersama alih-alih
   terhubung langsung ke kode vendor

Ini menghindari memasukkan asumsi video satu provider ke dalam core. Plugin memiliki
permukaan vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas bertipe dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh daftar periksa rollout konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Permukaan API plugin sengaja dibuat bertipe dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan
helper runtime yang dapat diandalkan oleh plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan duplikat seperti dua plugin yang mendaftarkan ID provider yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang salah bentuk
- contract test dapat menegakkan kepemilikan plugin bawaan dan mencegah penyimpangan diam-diam

Ada dua lapisan penegakan:

1. **penegakan pendaftaran runtime**
   Registri plugin memvalidasi pendaftaran saat plugin dimuat. Contoh:
   ID provider duplikat, ID provider ucapan duplikat, dan pendaftaran yang salah bentuk menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **contract test**
   Plugin bawaan ditangkap dalam registri kontrak selama proses test sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Hari ini ini digunakan untuk provider model,
   provider ucapan, provider pencarian web, dan kepemilikan pendaftaran bawaan.

Efek praktisnya adalah bahwa OpenClaw mengetahui, sejak awal, plugin mana yang memiliki permukaan mana. Itu memungkinkan core dan channel tersusun dengan mulus karena kepemilikan
dideklarasikan, bertipe, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- bertipe
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan kembali oleh banyak plugin
- dapat digunakan oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan khusus vendor yang tersembunyi di core
- jalur keluar khusus plugin sekali pakai yang melewati registri
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan kapabilitasnya terlebih dahulu, lalu
biarkan plugin terhubung ke sana.

## Model eksekusi

Plugin native OpenClaw berjalan **in-process** bersama Gateway. Plugin ini tidak
disandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan
kode core.

Implikasi:

- plugin native dapat mendaftarkan tool, handler jaringan, hook, dan layanan
- bug plugin native dapat membuat gateway crash atau tidak stabil
- plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw

Bundle yang kompatibel secara default lebih aman karena OpenClaw saat ini memperlakukan bundle tersebut
sebagai paket metadata/konten. Dalam rilis saat ini, itu terutama berarti
Skills yang dibundel.

Gunakan allowlist dan path install/load eksplisit untuk plugin non-bawaan. Perlakukan
plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan ID plugin tetap berakar pada nama npm:
`@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika
paket tersebut memang mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **ID plugin**, bukan asal sumber.
- Plugin workspace dengan ID yang sama seperti plugin bawaan dengan sengaja membayangi
  salinan bawaan saat plugin workspace tersebut diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.
- Kepercayaan plugin bawaan di-resolve dari snapshot sumber — manifest dan
  kode di disk saat waktu muat — bukan dari metadata instalasi. Rekam instalasi yang rusak
  atau diganti tidak dapat secara diam-diam memperluas permukaan kepercayaan plugin bawaan
  melebihi apa yang diklaim oleh sumber yang sebenarnya.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan convenience implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath khusus helper plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience khusus vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bawaan masih tetap ada dalam peta ekspor SDK yang dihasilkan
untuk kompatibilitas dan pemeliharaan plugin bawaan. Contoh saat ini meliputi
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk
plugin pihak ketiga baru.

## Internal dan referensi

Untuk pipeline pemuatan, model registri, hook runtime provider, route HTTP Gateway,
skema tool pesan, resolusi target channel, katalog provider,
plugin context engine, dan panduan menambahkan kapabilitas baru, lihat
[Plugin architecture internals](/id/plugins/architecture-internals).

## Terkait

- [Building plugins](/id/plugins/building-plugins)
- [Plugin SDK setup](/id/plugins/sdk-setup)
- [Plugin manifest](/id/plugins/manifest)
