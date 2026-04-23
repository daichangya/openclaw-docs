---
read_when:
    - Membangun atau men-debug Plugin OpenClaw native
    - Memahami model kapabilitas Plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan Plugin atau registry
    - Menerapkan hook runtime provider atau Plugin saluran
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-23T09:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan Plugin](/id/tools/plugin) — panduan pengguna
  - [Getting Started](/id/plugins/building-plugins) — tutorial Plugin pertama
  - [Plugin Saluran](/id/plugins/sdk-channel-plugins) — bangun saluran perpesanan
  - [Plugin Provider](/id/plugins/sdk-provider-plugins) — bangun provider model
  - [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem Plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap
Plugin OpenClaw native mendaftar terhadap satu atau lebih jenis kapabilitas:

| Kapabilitas           | Metode registrasi                               | Contoh Plugin                       |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Inference teks        | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend inference CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Ucapan                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Transkripsi realtime  | `api.registerRealtimeTranscriptionProvider(...)`| `openai`                            |
| Suara realtime        | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Pemahaman media       | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Pembuatan gambar      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Pembuatan video       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web fetch             | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Pencarian web         | `api.registerWebSearchProvider(...)`            | `google`                            |
| Saluran / perpesanan  | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, atau
layanan adalah Plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke core dan digunakan oleh Plugin
bawaan/native saat ini, tetapi kompatibilitas Plugin eksternal masih membutuhkan standar yang lebih ketat daripada "ini diekspor, jadi dibekukan."

Panduan saat ini:

- **Plugin eksternal yang ada:** pertahankan integrasi berbasis hook tetap berfungsi; perlakukan
  ini sebagai baseline kompatibilitas
- **Plugin bawaan/native baru:** utamakan registrasi kapabilitas eksplisit daripada
  reach-in spesifik vendor atau desain hook-only baru
- **Plugin eksternal yang mengadopsi registrasi kapabilitas:** diizinkan, tetapi perlakukan
  permukaan helper spesifik kapabilitas sebagai sesuatu yang berkembang kecuali dokumentasi secara eksplisit menandai kontrak sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dimaksud
- hook legacy tetap menjadi jalur paling aman tanpa kerusakan untuk Plugin eksternal selama
  transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak sempit yang didokumentasikan,
  bukan ekspor helper insidental

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap Plugin yang dimuat ke dalam bentuk berdasarkan perilaku
registrasi aktualnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu jenis kapabilitas (misalnya
  Plugin hanya-provider seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inference teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau kustom), tanpa kapabilitas,
  tool, perintah, atau layanan
- **non-capability** -- mendaftarkan tool, perintah, layanan, atau route tetapi tanpa
  kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk Plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
Plugin hook-only. Plugin dunia nyata legacy masih bergantung padanya.

Arah:

- pertahankan tetap berfungsi
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label berikut:

| Sinyal                     | Arti                                                        |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Config berhasil di-parse dan Plugin ter-resolve             |
| **compatibility advisory** | Plugin menggunakan pola lama yang masih didukung (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang deprecated    |
| **hard error**             | Config tidak valid atau Plugin gagal dimuat                 |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak Plugin Anda hari ini --
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini
juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

1. **Manifes + penemuan**
   OpenClaw menemukan kandidat Plugin dari jalur yang dikonfigurasi, root workspace,
   root Plugin global, dan Plugin bawaan. Penemuan membaca manifes native
   `openclaw.plugin.json` ditambah manifes bundle yang didukung terlebih dahulu.
2. **Pengaktifan + validasi**
   Core memutuskan apakah Plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memori.
3. **Pemuatan runtime**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi ke
   record registry tanpa mengimpor kode runtime.
4. **Konsumsi permukaan**
   Sisa OpenClaw membaca registry untuk mengekspos tool, saluran, penyiapan provider,
   hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk CLI Plugin, penemuan perintah root dibagi dalam dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI Plugin yang sesungguhnya dapat tetap lazy dan mendaftar saat pemanggilan pertama

Hal ini menjaga kode CLI milik Plugin tetap berada di dalam Plugin sambil tetap membiarkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- penemuan + validasi config harus bekerja dari **metadata manifes/skema**
  tanpa mengeksekusi kode Plugin
- perilaku runtime native berasal dari jalur `register(api)` modul Plugin

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan Plugin yang hilang/dinonaktifkan, dan
membangun petunjuk UI/skema sebelum runtime penuh aktif.

### Plugin saluran dan tool pesan bersama

Plugin saluran tidak perlu mendaftarkan tool kirim/edit/reaksi terpisah untuk
aksi obrolan normal. OpenClaw mempertahankan satu tool `message` bersama di core, dan
Plugin saluran memiliki penemuan dan eksekusi spesifik saluran di baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan
  sesi/thread, dan dispatch eksekusi
- Plugin saluran memiliki penemuan aksi bercakupan, penemuan kapabilitas, dan fragment skema spesifik saluran
- Plugin saluran memiliki grammar percakapan sesi spesifik provider, seperti
  bagaimana id percakapan mengodekan id thread atau mewarisi dari percakapan induk
- Plugin saluran mengeksekusi aksi akhir melalui adapter aksinya

Untuk Plugin saluran, permukaan SDK adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan terpadu itu memungkinkan sebuah Plugin mengembalikan aksi, kapabilitas, dan kontribusi skema yang terlihat
bersama-sama sehingga potongan-potongan itu tidak saling menjauh.

Ketika param message-tool spesifik saluran membawa sumber media seperti jalur
lokal atau URL media remote, Plugin juga harus mengembalikan
`mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar eksplisit itu untuk menerapkan normalisasi jalur sandbox dan petunjuk akses media keluar
tanpa melakukan hardcode pada nama param milik Plugin.
Utamakan peta bercakupan aksi di sana, bukan satu daftar datar tingkat saluran,
agar param media hanya-profil tidak dinormalisasi pada aksi yang tidak terkait seperti
`send`.

Core meneruskan cakupan runtime ke langkah penemuan tersebut. Field penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk tepercaya

Ini penting untuk Plugin yang peka konteks. Sebuah saluran dapat menyembunyikan atau mengekspos
aksi pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau
identitas peminta tepercaya tanpa melakukan hardcode cabang spesifik saluran di
tool `message` core.

Inilah mengapa perubahan perutean embedded-runner tetap merupakan pekerjaan Plugin: runner
bertanggung jawab untuk meneruskan identitas obrolan/sesi saat ini ke batas
penemuan Plugin agar tool `message` bersama mengekspos permukaan milik saluran yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik saluran, Plugin bawaan harus menyimpan runtime eksekusi
di dalam modul extension mereka sendiri. Core tidak lagi memiliki runtime aksi pesan
Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan
harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik
extension mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor barrel kemudahan spesifik saluran untuk extension
Slack, Discord, Signal, WhatsApp, atau serupa. Jika core membutuhkan perilaku, konsumsi
saja barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau tingkatkan kebutuhan itu menjadi kapabilitas generik yang sempit dalam SDK bersama.

Khusus untuk polling, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk saluran yang cocok dengan model
  polling umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik polling spesifik saluran atau param polling tambahan

Core kini menunda parsing polling bersama sampai setelah dispatch polling Plugin menolak
aksi tersebut, sehingga handler polling milik Plugin dapat menerima field polling
spesifik saluran tanpa terhalang parser polling generik terlebih dahulu.

Lihat [Pipeline pemuatan](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan Plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah
**fitur**, bukan sebagai kumpulan integrasi tak terkait.

Artinya:

- Plugin perusahaan biasanya harus memiliki semua permukaan
  perusahaan tersebut yang menghadap OpenClaw
- Plugin fitur biasanya harus memiliki permukaan penuh fitur yang diperkenalkannya
- saluran harus mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan ulang
  perilaku provider secara ad hoc

Contoh:

- Plugin bawaan `openai` memiliki perilaku model-provider OpenAI serta perilaku
  ucapan + suara realtime + pemahaman media + pembuatan gambar OpenAI
- Plugin bawaan `elevenlabs` memiliki perilaku ucapan ElevenLabs
- Plugin bawaan `microsoft` memiliki perilaku ucapan Microsoft
- Plugin bawaan `google` memiliki perilaku model-provider Google serta perilaku
  pemahaman media + pembuatan gambar + pencarian web Google
- Plugin bawaan `firecrawl` memiliki perilaku web-fetch Firecrawl
- Plugin bawaan `minimax`, `mistral`, `moonshot`, dan `zai` memiliki backend
  pemahaman media mereka
- Plugin `qwen` bawaan memiliki perilaku text-provider Qwen serta
  perilaku pemahaman media dan pembuatan video
- Plugin `voice-call` adalah Plugin fitur: memiliki transport panggilan, tool,
  CLI, route, dan bridge media-stream Twilio, tetapi mengonsumsi kapabilitas
  ucapan bersama serta transkripsi realtime dan suara realtime alih-alih
  mengimpor Plugin vendor secara langsung

Keadaan akhir yang dimaksud adalah:

- OpenAI berada dalam satu Plugin meskipun mencakup model teks, ucapan, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- saluran tidak peduli Plugin vendor mana yang memiliki provider tersebut; mereka mengonsumsi
  kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah perbedaan kuncinya:

- **Plugin** = batas kepemilikan
- **kapabilitas** = kontrak core yang dapat diimplementasikan atau dikonsumsi oleh beberapa Plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan
"provider mana yang harus melakukan hardcode penanganan video?" Pertanyaan pertama adalah "apa
kontrak kapabilitas video core?" Setelah kontrak itu ada, Plugin vendor
dapat mendaftar terhadapnya dan Plugin saluran/fitur dapat mengonsumsinya.

Jika kapabilitas itu belum ada, langkah yang benar biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime Plugin dengan cara yang typed
3. sambungkan saluran/fitur terhadap kapabilitas tersebut
4. biarkan Plugin vendor mendaftarkan implementasi

Hal ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang
bergantung pada satu vendor atau jalur kode spesifik Plugin satu kali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan tempat suatu kode berada:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan merge
  config, semantik pengiriman, dan kontrak typed
- **lapisan Plugin vendor**: API spesifik vendor, auth, katalog model, ucapan
  sintetis, pembuatan gambar, backend video masa depan, endpoint penggunaan
- **lapisan Plugin saluran/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menampilkannya di suatu permukaan

Sebagai contoh, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman saluran
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama seharusnya diutamakan untuk kapabilitas di masa depan.

### Contoh Plugin perusahaan multi-kapabilitas

Sebuah Plugin perusahaan seharusnya terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, ucapan, transkripsi realtime, suara realtime, pemahaman media,
pembuatan gambar, pembuatan video, web fetch, dan pencarian web,
vendor dapat memiliki semua permukaannya di satu tempat:

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

- satu Plugin memiliki permukaan vendor
- core tetap memiliki kontrak kapabilitas
- saluran dan Plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- uji kontrak dapat menegaskan bahwa Plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak pemahaman media
2. Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. saluran dan Plugin fitur mengonsumsi perilaku core bersama alih-alih
   menyambung langsung ke kode vendor

Hal ini menghindari memasukkan asumsi video milik satu provider ke dalam core. Plugin memiliki
permukaan vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas typed dan helper runtime, dan Plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Permukaan API Plugin sengaja dibuat typed dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik registrasi yang didukung dan
helper runtime yang boleh diandalkan oleh Plugin.

Mengapa ini penting:

- pembuat Plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan duplikat seperti dua Plugin yang mendaftarkan id
  provider yang sama
- startup dapat memunculkan diagnostik yang dapat ditindaklanjuti untuk registrasi yang salah bentuk
- uji kontrak dapat menegakkan kepemilikan Plugin bawaan dan mencegah drift diam-diam

Ada dua lapisan penegakan:

1. **penegakan registrasi runtime**
   Registry Plugin memvalidasi registrasi saat Plugin dimuat. Contoh:
   id provider duplikat, id speech provider duplikat, dan registrasi yang salah bentuk menghasilkan diagnostik Plugin alih-alih perilaku tak terdefinisi.
2. **uji kontrak**
   Plugin bawaan ditangkap dalam registry kontrak selama eksekusi pengujian sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk model
   provider, speech provider, web search provider, dan kepemilikan registrasi bawaan.

Efek praktisnya adalah OpenClaw mengetahui, di awal, Plugin mana yang memiliki
permukaan mana. Itu memungkinkan core dan saluran menyusun dengan mulus karena
kepemilikan dinyatakan, typed, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

Kontrak Plugin yang baik adalah:

- typed
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh beberapa Plugin
- dapat dikonsumsi oleh saluran/fitur tanpa pengetahuan vendor

Kontrak Plugin yang buruk adalah:

- kebijakan spesifik vendor yang tersembunyi di core
- escape hatch Plugin satu kali pakai yang mem-bypass registry
- kode saluran yang masuk langsung ke implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan level abstraksinya: definisikan kapabilitas terlebih dahulu, lalu
biarkan Plugin memasukkannya.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** dengan Gateway. Plugin ini tidak
di-sandbox. Plugin native yang dimuat memiliki batas trust level proses yang sama seperti
kode core.

Implikasi:

- Plugin native dapat mendaftarkan tool, handler jaringan, hook, dan layanan
- bug Plugin native dapat merusak atau membuat gateway tidak stabil
- Plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel secara default lebih aman karena OpenClaw saat ini memperlakukannya
sebagai metadata/content pack. Dalam rilis saat ini, itu kebanyakan berarti
Skills yang dibundel.

Gunakan allowlist dan jalur instalasi/muat eksplisit untuk Plugin non-bundled. Perlakukan
Plugin workspace sebagai kode saat pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan id Plugin berjangkar pada nama npm:
`@openclaw/<id>` secara default, atau sufiks typed yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika
paket secara sengaja mengekspos peran Plugin yang lebih sempit.

Catatan trust penting:

- `plugins.allow` mempercayai **id Plugin**, bukan asal sumber.
- Plugin workspace dengan id yang sama seperti Plugin bawaan secara sengaja membayangi
  salinan bawaan saat Plugin workspace itu diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.
- Trust Plugin bawaan di-resolve dari snapshot sumber — manifes dan
  kode di disk saat waktu muat — bukan dari metadata instalasi. Catatan instalasi yang rusak
  atau diganti tidak dapat secara diam-diam memperlebar permukaan trust Plugin bawaan
  melampaui apa yang diklaim sumber aktual.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper spesifik Plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan spesifik vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Beberapa subpath helper Plugin bawaan masih tetap ada dalam peta ekspor SDK yang
dihasilkan demi kompatibilitas dan pemeliharaan Plugin bawaan. Contoh saat ini mencakup
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk
Plugin pihak ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw kira-kira melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes native atau bundle kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan config Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bawaan yang dibangun menggunakan loader native;
   Plugin native yang belum dibangun menggunakan jiti
7. memanggil hook native `register(api)` dan mengumpulkan registrasi ke registry Plugin
8. mengekspos registry ke permukaan perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya di titik yang sama. Semua Plugin bawaan menggunakan `register`; utamakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari root Plugin, jalurnya dapat ditulis dunia, atau
kepemilikan jalur terlihat mencurigakan untuk Plugin non-bundled.

### Perilaku manifest-first

Manifes adalah sumber kebenaran control plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan saluran/Skills/skema config atau kapabilitas bundle yang dideklarasikan
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok manifes `activation` dan `setup` opsional tetap berada di control plane.
Keduanya adalah deskriptor khusus metadata untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama kini menggunakan petunjuk perintah, saluran, dan provider dalam manifes
untuk mempersempit pemuatan Plugin sebelum materialisasi registry yang lebih luas:

- Pemuatan CLI dipersempit ke Plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan/Plugin saluran dipersempit ke Plugin yang memiliki
  id saluran yang diminta
- resolusi penyiapan/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta

Penemuan penyiapan kini mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit kandidat Plugin sebelum fallback ke
`setup-api` untuk Plugin yang masih memerlukan hook runtime saat penyiapan. Jika lebih dari
satu Plugin yang ditemukan mengklaim provider penyiapan ternormalisasi yang sama atau
id backend CLI yang sama, pencarian penyiapan menolak pemilik yang ambigu itu alih-alih mengandalkan urutan penemuan.

### Apa yang di-cache loader

OpenClaw menyimpan cache in-process singkat untuk:

- hasil penemuan
- data registry manifes
- registry Plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead perintah berulang. Cache ini aman untuk dipahami sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Setel `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak secara langsung memutasi global core acak. Mereka mendaftar ke
registry Plugin pusat.

Registry melacak:

- record Plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook legacy dan hook typed
- saluran
- provider
- handler RPC Gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung dengan modul Plugin.
Ini menjaga pemuatan satu arah:

- modul Plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk maintainability. Artinya sebagian besar permukaan core hanya
memerlukan satu titik integrasi: "baca registry", bukan "special-case setiap modul
Plugin".

## Callback binding percakapan

Plugin yang melakukan bind percakapan dapat bereaksi saat sebuah persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah sebuah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding hasil resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang diizinkan melakukan bind suatu
percakapan, dan berjalan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider kini memiliki dua lapisan:

- metadata manifes: `providerAuthEnvVars` untuk lookup auth env provider murah
  sebelum runtime dimuat, `providerAuthAliases` untuk varian provider yang berbagi
  auth, `channelEnvVars` untuk lookup env/penyiapan saluran murah sebelum runtime
  dimuat, plus `providerAuthChoices` untuk label onboarding/pilihan auth murah dan
  metadata flag CLI sebelum runtime dimuat
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah permukaan extension untuk perilaku spesifik provider tanpa
memerlukan transport inference kustom penuh.

Gunakan manifes `providerAuthEnvVars` ketika provider memiliki kredensial berbasis env
yang harus terlihat oleh jalur auth/status/model-picker generik tanpa memuat runtime Plugin. Gunakan manifes `providerAuthAliases` ketika satu id provider harus menggunakan kembali env vars, auth profiles, auth berbasis config, dan pilihan onboarding API-key milik id provider lain. Gunakan manifes `providerAuthChoices` ketika permukaan onboarding/pilihan-auth CLI
harus mengetahui id pilihan provider, label grup, dan wiring auth satu-flag sederhana tanpa memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk yang menghadap operator seperti label onboarding atau env vars penyiapan OAuth
client-id/client-secret.

Gunakan manifes `channelEnvVars` ketika sebuah saluran memiliki auth atau penyiapan berbasis env yang
harus terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt penyiapan
tanpa memuat runtime saluran.

### Urutan hook dan penggunaan

Untuk Plugin model/provider, OpenClaw memanggil hook kira-kira dalam urutan ini.
Kolom "Kapan digunakan" adalah panduan keputusan singkat.

| #   | Hook                              | Apa yang dilakukannya                                                                                          | Kapan digunakan                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan config provider ke `models.providers` selama pembuatan `models.json`                          | Provider memiliki katalog atau default `baseUrl`                                                                                                |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                                  |
| --  | _(lookup model bawaan)_           | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                 | _(bukan hook Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | Menormalkan alias `model-id` legacy atau preview sebelum lookup                                                | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                             |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                               | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                            |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan config yang seharusnya berada bersama Plugin; helper keluarga Google bawaan juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang compat penggunaan streaming native ke provider config                               | Provider memerlukan perbaikan metadata penggunaan streaming native berbasis endpoint                                                             |
| 7   | `resolveConfigApiKey`             | Me-resolve auth penanda-env untuk provider config sebelum pemuatan auth runtime                                | Provider memiliki resolusi API key penanda-env milik provider; `amazon-bedrock` juga memiliki resolver penanda-env AWS bawaan di sini        |
| 8   | `resolveSyntheticAuth`            | Memunculkan auth lokal/self-hosted atau berbasis config tanpa mempersistenkan plaintext                        | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                             |
| 9   | `resolveExternalAuthProfiles`     | Menimpa auth profile eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Provider menggunakan ulang kredensial auth eksternal tanpa mempersistenkan copied refresh token; deklarasikan `contracts.externalAuthProviders` di manifes |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config              | Provider menyimpan auth profile placeholder sintetis yang tidak seharusnya menang dalam prioritas                                              |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik provider yang belum ada di registry lokal                                | Provider menerima id model upstream arbitrer                                                                                                   |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                      | Provider memerlukan metadata jaringan sebelum me-resolve id yang tidak dikenal                                                                 |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum embedded runner menggunakan model yang sudah di-resolve                          | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                           |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag compat untuk model vendor di balik transport kompatibel lain                                | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                         |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan keunikan transkrip/keluarga provider                                                                                       |
| 16  | `normalizeToolSchemas`            | Menormalkan skema tool sebelum embedded runner melihatnya                                                      | Provider memerlukan pembersihan skema keluarga transport                                                                                       |
| 17  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik provider setelah normalisasi                                                | Provider menginginkan peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                                   |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Provider memerlukan output reasoning/final bertag alih-alih field native                                                                       |
| 19  | `prepareExtraParams`              | Normalisasi param permintaan sebelum wrapper opsi stream generik                                               | Provider memerlukan param permintaan default atau pembersihan param per-provider                                                               |
| 20  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                               | Provider memerlukan wire protocol kustom, bukan hanya wrapper                                                                                  |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper compat header/body/model permintaan tanpa transport kustom                                                         |
| 22  | `resolveTransportTurnState`       | Menambahkan header atau metadata transport native per giliran                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                    |
| 23  | `resolveWebSocketSessionPolicy`   | Menambahkan header WebSocket native atau kebijakan cooldown sesi                                               | Provider ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                           |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil tersimpan menjadi string `apiKey` runtime                                       | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                           |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                          |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                            |
| 27  | `matchesContextOverflowError`     | Pencocok overflow context-window milik provider                                                                | Provider memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                              |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                                |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache spesifik proxy                                                                                            |
| 30  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan missing-auth generik                                                           | Provider memerlukan petunjuk pemulihan missing-auth spesifik provider                                                                          |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream usang plus petunjuk error yang opsional dan menghadap pengguna                        | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                    |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Provider memerlukan baris forward-compat sintetis dalam `models list` dan picker                                                               |
| 33  | `resolveThinkingProfile`          | Set level `/think`, label tampilan, dan default yang spesifik model                                            | Provider mengekspos tangga thinking kustom atau label biner untuk model terpilih                                                               |
| 34  | `isBinaryThinking`                | Hook compat toggle reasoning hidup/mati                                                                        | Provider hanya mengekspos thinking biner hidup/mati                                                                                            |
| 35  | `supportsXHighThinking`           | Hook compat dukungan reasoning `xhigh`                                                                         | Provider menginginkan `xhigh` hanya pada sebagian model                                                                                        |
| 36  | `resolveDefaultThinkingLevel`     | Hook compat level `/think` default                                                                             | Provider memiliki kebijakan `/think` default untuk sebuah keluarga model                                                                       |
| 37  | `isModernModelRef`                | Pencocok model-modern untuk filter profil live dan pemilihan smoke                                             | Provider memiliki pencocokan model pilihan live/smoke                                                                                         |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inference                 | Provider memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                |
| 39  | `resolveUsageAuth`                | Me-resolve kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                        | Provider memerlukan parsing token penggunaan/kuota kustom atau kredensial penggunaan yang berbeda                                            |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot penggunaan/kuota spesifik provider setelah auth di-resolve                 | Provider memerlukan endpoint penggunaan atau parser payload spesifik provider                                                                 |
| 41  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memori/pencarian                                              | Perilaku embedding memori berada bersama Plugin provider                                                                                      |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya, menghapus blok thinking)                                                           |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay spesifik provider di luar helper Compaction bersama                                                |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay final sebelum embedded runner                                   | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                     |
| 45  | `onModelSelected`                 | Menjalankan efek samping pascapemilihan milik provider                                                         | Provider memerlukan telemetri atau state milik provider saat sebuah model menjadi aktif                                                      |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin provider yang cocok, lalu melanjutkan ke Plugin provider lain yang mendukung hook
sampai salah satunya benar-benar mengubah id model atau transport/config. Hal ini menjaga shim provider alias/compat tetap berfungsi tanpa mengharuskan pemanggil mengetahui Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config keluarga Google yang didukung, penormalisasi config Google bawaan tetap menerapkan pembersihan kompatibilitas itu.

Jika provider membutuhkan wire protocol yang sepenuhnya kustom atau eksekutor permintaan kustom,
itu adalah kelas extension yang berbeda. Hook ini ditujukan untuk perilaku provider
yang tetap berjalan pada loop inference normal OpenClaw.

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

Plugin provider bawaan menggunakan hook di atas dalam kombinasi yang disesuaikan untuk kebutuhan
katalog, auth, thinking, replay, dan pelacakan penggunaan tiap vendor. Kumpulan hook yang persis
per provider berada bersama sumber Plugin di bawah `extensions/`; perlakukan
itu sebagai daftar yang otoritatif alih-alih mencerminkannya di sini.

Pola ilustratif:

- **Provider katalog pass-through** (OpenRouter, Kilocode, Z.AI, xAI) mendaftarkan
  `catalog` plus `resolveDynamicModel`/`prepareDynamicModel` agar dapat memunculkan
  id model upstream sebelum katalog statis OpenClaw.
- **Provider endpoint OAuth + penggunaan** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) memasangkan `prepareRuntimeAuth` atau `formatApiKey`
  dengan `resolveUsageAuth` + `fetchUsageSnapshot` untuk memiliki pertukaran token dan
  integrasi `/usage`.
- **Pembersihan replay / transkrip** dibagikan melalui keluarga bernama:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Provider melakukan opt-in melalui `buildReplayPolicy`
  alih-alih masing-masing mengimplementasikan pembersihan transkrip.
- **Provider bawaan hanya-katalog** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) hanya mendaftarkan `catalog` dan menggunakan
  loop inference bersama.
- **Helper stream khusus Anthropic** (beta header, `/fast`/`serviceTier`,
  `context1m`) berada di dalam seam publik `api.ts` /
  `contract-api.ts` milik Plugin bawaan Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) alih-alih di
  SDK generik.

## Helper runtime

Plugin dapat mengakses helper core terpilih melalui `api.runtime`. Untuk TTS:

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
- Menggunakan konfigurasi dan pemilihan provider `messages.tts` milik core.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk pemilih suara milik vendor atau alur penyiapan.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk picker yang sadar provider.
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
- Gunakan speech provider untuk perilaku sintesis milik vendor.
- Input legacy Microsoft `edge` dinormalisasi ke id provider `microsoft`.
- Model kepemilikan yang diutamakan berorientasi pada perusahaan: satu Plugin vendor dapat memiliki
  provider teks, ucapan, gambar, dan media masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu provider
pemahaman media typed alih-alih kantong key/value generik:

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

- Pertahankan orkestrasi, fallback, config, dan wiring saluran di core.
- Pertahankan perilaku vendor di Plugin provider.
- Ekspansi aditif harus tetap typed: metode opsional baru, field hasil opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/saluran mengonsumsi `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman media, Plugin dapat memanggil:

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

Untuk transkripsi audio, Plugin dapat menggunakan runtime pemahaman media
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
- Menggunakan konfigurasi audio pemahaman media core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` saat tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan eksekusi subagent latar belakang melalui `api.runtime.subagent`:

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

- `provider` dan `model` adalah override per-eksekusi opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk eksekusi fallback milik Plugin, operator harus melakukan opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent Plugin tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, Plugin dapat mengonsumsi helper runtime bersama alih-alih
masuk ke wiring tool agent:

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

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan web-search provider untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang diutamakan untuk Plugin fitur/saluran yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agent.

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

- `generate(...)`: membuat gambar menggunakan rantai provider pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: mencantumkan provider pembuatan gambar yang tersedia beserta kapabilitasnya.

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

- `path`: jalur route di bawah server HTTP Gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth Gateway normal, atau `"plugin"` untuk auth terkelola Plugin/verifikasi Webhook.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan Plugin yang sama mengganti registrasi route miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat route menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat mengganti route milik Plugin lain.
- Route yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** otomatis menerima cakupan runtime operator. Route ini ditujukan untuk Webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan helper Gateway istimewa.
- Route `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan itu sengaja konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime route-Plugin tetap dikunci ke `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya pembawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut secara eksplisit ada
  - jika `x-openclaw-scopes` tidak ada pada permintaan route-Plugin pembawa identitas itu, cakupan runtime fallback ke `operator.write`
- Aturan praktis: jangan anggap route Plugin dengan auth Gateway adalah permukaan admin implisit. Jika route Anda memerlukan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` eksplisit.

## Jalur impor SDK Plugin

Gunakan subpath SDK sempit alih-alih root barrel monolitik `openclaw/plugin-sdk`
saat menulis Plugin baru. Subpath core:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive registrasi Plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Helper entri/build saluran                         |
| `openclaw/plugin-sdk/core`          | Helper generik bersama dan kontrak payung          |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`)  |

Plugin saluran memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan seharusnya dikonsolidasikan
pada satu kontrak `approvalCapability` alih-alih dicampur di berbagai field
Plugin yang tidak terkait. Lihat [Plugin saluran](/id/plugins/sdk-channel-plugins).

Helper runtime dan config berada di bawah subpath `*-runtime` yang sesuai
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, dll.).

<Info>
`openclaw/plugin-sdk/channel-runtime` sudah deprecated — shim kompatibilitas untuk
Plugin lama. Kode baru harus mengimpor primitive generik yang lebih sempit.
</Info>

Titik masuk internal repo (per root paket Plugin bawaan):

- `index.js` — entri Plugin bawaan
- `api.js` — barrel helper/tipe
- `runtime-api.js` — barrel hanya-runtime
- `setup-entry.js` — entri Plugin penyiapan

Plugin eksternal seharusnya hanya mengimpor subpath `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` dari paket Plugin lain dari core atau dari Plugin lain.
Titik masuk yang dimuat facade mengutamakan snapshot config runtime aktif saat ada,
lalu fallback ke file config yang sudah di-resolve di disk.

Subpath spesifik kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bawaan menggunakannya saat ini. Semuanya tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman referensi SDK yang relevan saat mengandalkannya.

## Skema tool pesan

Plugin seharusnya memiliki kontribusi skema `describeMessageTool(...)` spesifik saluran
untuk primitive non-pesan seperti reaksi, tanda baca, dan polling.
Presentasi kirim bersama seharusnya menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native provider.
Lihat [Message Presentation](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan checklist pembuat Plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native provider dari tool pesan generik.
Helper SDK deprecated untuk skema native legacy tetap diekspor untuk
Plugin pihak ketiga yang ada, tetapi Plugin baru tidak seharusnya menggunakannya.

## Resolusi target saluran

Plugin saluran seharusnya memiliki semantik target spesifik saluran. Pertahankan host outbound
bersama tetap generik dan gunakan permukaan adapter perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang sudah dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah suatu
  input seharusnya langsung masuk ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin ketika
  core membutuhkan resolusi final milik provider setelah normalisasi atau setelah miss
  direktori.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  spesifik provider setelah suatu target di-resolve.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan untuk
  pencarian direktori yang luas.
- Pertahankan id native provider seperti id obrolan, id thread, JID, handle, dan id room
  di dalam nilai `target` atau param spesifik provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config seharusnya mempertahankan logika itu di dalam
Plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika sebuah saluran memerlukan peer/grup berbasis config seperti:

- peer DM berbasis allowlist
- peta saluran/grup yang dikonfigurasi
- fallback direktori statis bercakupan akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan limit
- helper deduplikasi/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun spesifik saluran dan normalisasi id seharusnya tetap berada di
implementasi Plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inference dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika Plugin memiliki id model, default base URL, atau metadata model berbasis auth yang spesifik provider.

`catalog.order` mengontrol kapan katalog Plugin di-merge relatif terhadap provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API key atau env
- `profile`: provider yang muncul saat auth profile ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: langkah terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada tabrakan kunci, sehingga Plugin dapat dengan sengaja menimpa entri provider bawaan dengan id provider yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` keduanya didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi saluran hanya-baca

Jika Plugin Anda mendaftarkan saluran, utamakan implementasi
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi bahwa kredensial
  sudah sepenuhnya dimaterialisasikan dan boleh gagal cepat ketika rahasia yang diperlukan hilang.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur
  doctor/perbaikan config seharusnya tidak perlu mematerialisasikan kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya state akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan hanya-baca. Mengembalikan `tokenStatus: "available"` (dan field sumber
  yang cocok) sudah cukup untuk perintah gaya status.
- Gunakan `configured_unavailable` ketika kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah hanya-baca melaporkan "configured but unavailable in this command
path" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Paket pack

Sebuah direktori Plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah Plugin. Jika pack mencantumkan beberapa extension, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor dependensi npm, instal dependensi itu di direktori tersebut agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dev dependency saat runtime). Pertahankan pohon dependensi Plugin tetap "pure JS/TS" dan hindari paket yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus penyiapan.
Ketika OpenClaw memerlukan permukaan penyiapan untuk Plugin saluran yang dinonaktifkan, atau
ketika Plugin saluran diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini menjaga startup dan penyiapan lebih ringan
ketika entri Plugin utama Anda juga menyambungkan tool, hook, atau kode lain yang hanya-runtime.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat Plugin saluran memilih jalur `setupEntry` yang sama selama fase
startup pra-listen Gateway, bahkan ketika saluran sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai listen. Dalam praktiknya, itu berarti entri penyiapan
harus mendaftarkan setiap kapabilitas milik saluran yang menjadi ketergantungan startup, seperti:

- registrasi saluran itu sendiri
- setiap route HTTP yang harus tersedia sebelum Gateway mulai listen
- setiap metode Gateway, tool, atau layanan yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Saluran bawaan juga dapat menerbitkan helper permukaan-kontrak khusus penyiapan yang dapat
dikonsultasikan core sebelum runtime saluran penuh dimuat. Permukaan promosi penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan tersebut ketika perlu mempromosikan config saluran legacy akun tunggal
ke `channels.<id>.accounts.*` tanpa memuat entri Plugin penuh.
Matrix adalah contoh bawaan saat ini: ia hanya memindahkan kunci auth/bootstrap ke sebuah
akun bernama yang dipromosikan ketika akun bernama sudah ada, dan ia dapat mempertahankan
kunci default-account non-kanonis yang sudah dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch penyiapan tersebut menjaga penemuan permukaan-kontrak bawaan tetap lazy. Waktu impor tetap ringan; permukaan promosi dimuat hanya saat pertama kali digunakan alih-alih masuk kembali ke startup saluran bawaan saat impor modul.

Ketika permukaan startup tersebut mencakup metode RPC Gateway, pertahankan metode itu pada
prefiks spesifik Plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve
ke `operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

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

### Metadata katalog saluran

Plugin saluran dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data-free core catalog.

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

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: menimpa teks tautan untuk tautan dokumen
- `preferOver`: id Plugin/saluran prioritas lebih rendah yang harus dikalahkan entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan permukaan pemilihan
- `markdownCapable`: menandai saluran sebagai mampu Markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan saluran dari permukaan daftar saluran yang dikonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan saluran dari picker penyiapan/konfigurasi interaktif saat disetel ke `false`
- `exposure.docs`: tandai saluran sebagai internal/private untuk permukaan navigasi dokumen
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima demi kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: mengikutsertakan saluran ke alur `allowFrom` quickstart standar
- `forceAccountBinding`: mewajibkan binding akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan lookup sesi saat me-resolve target announce

OpenClaw juga dapat menggabungkan **katalog saluran eksternal** (misalnya, ekspor
registry MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan dengan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk kunci `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, perakitan,
dan Compaction. Daftarkan dari Plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika Plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih hanya menambahkan pencarian memori atau hook.

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

Ketika sebuah Plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan mem-bypass
sistem Plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, merge config,
   lifecycle, semantik yang menghadap saluran, dan bentuk helper runtime.
2. tambahkan permukaan registrasi/runtime Plugin yang typed
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas typed
   terkecil yang berguna.
3. sambungkan konsumen core + saluran/fitur
   Saluran dan Plugin fitur seharusnya mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded pada satu
pandangan dunia provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
permukaan berikut secara bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- permukaan registrasi API Plugin di `src/plugins/types.ts`
- wiring registry Plugin di `src/plugins/registry.ts`
- eksposur runtime Plugin di `src/plugins/runtime/*` ketika Plugin fitur/saluran
  perlu mengonsumsinya
- helper penangkapan/pengujian di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/Plugin di `docs/`

Jika salah satu permukaan itu hilang, biasanya itu pertanda kapabilitas tersebut
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

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime bersama untuk Plugin fitur/saluran
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola uji kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- Plugin vendor memiliki implementasi vendor
- Plugin fitur/saluran mengonsumsi helper runtime
- uji kontrak menjaga kepemilikan tetap eksplisit
