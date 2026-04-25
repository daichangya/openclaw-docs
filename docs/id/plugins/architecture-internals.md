---
read_when:
    - Mengimplementasikan hook runtime provider, lifecycle channel, atau package pack
    - Men-debug urutan pemuatan plugin atau state registri
    - Menambahkan kapabilitas plugin baru atau plugin mesin konteks
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registri, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Untuk model kapabilitas publik, bentuk plugin, dan kontrak
kepemilikan/eksekusi, lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanisme internal: pipeline pemuatan, registri, hook runtime,
rute HTTP Gateway, jalur import, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw secara garis besar melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle kompatibel dan metadata package
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan status aktif untuk setiap kandidat
6. memuat modul native yang aktif: modul bawaan yang sudah dibangun menggunakan native loader;
   plugin native yang belum dibangun menggunakan jiti
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke dalam registri plugin
8. mengekspos registri ke permukaan perintah/runtime

<Note>
`activate` adalah alias lama untuk `register` — loader me-resolve yang mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bawaan menggunakan `register`; pilih `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
saat entri keluar dari root plugin, jalurnya dapat ditulis oleh semua orang, atau
kepemilikan jalur tampak mencurigakan untuk plugin non-bawaan.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/Skills/skema konfigurasi yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder UI Kontrol
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang murah tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian data plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok `activation` dan `setup` manifest opsional tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama sekarang menggunakan petunjuk perintah, channel, dan provider dari manifest
untuk mempersempit pemuatan plugin sebelum materialisasi registri yang lebih luas:

- Pemuatan CLI dipersempit ke plugin yang memiliki primary command yang diminta
- Resolusi penyiapan/plugin channel dipersempit ke plugin yang memiliki
  ID channel yang diminta
- Resolusi penyiapan/runtime provider eksplisit dipersempit ke plugin yang memiliki
  ID provider yang diminta

Perencana aktivasi mengekspos API hanya-ID untuk pemanggil yang ada dan
API plan untuk diagnostik baru. Entri plan melaporkan alasan sebuah plugin dipilih,
memisahkan petunjuk perencana eksplisit `activation.*` dari fallback kepemilikan manifest
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk yang luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan penyiapan sekarang lebih memilih ID milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit plugin kandidat sebelum fallback ke
`setup-api` untuk plugin yang masih memerlukan hook runtime saat penyiapan. Alur penyiapan provider
menggunakan `providerAuthChoices` dari manifest terlebih dahulu, lalu fallback ke
wizard pilihan runtime dan pilihan katalog instalasi untuk kompatibilitas. `setup.requiresRuntime: false`
eksplisit adalah cutoff hanya-deskriptor; `requiresRuntime` yang dihilangkan
mempertahankan fallback setup-api lama untuk kompatibilitas. Jika lebih
dari satu plugin yang ditemukan mengklaim ID provider penyiapan atau CLI
backend yang sama setelah dinormalisasi, lookup penyiapan menolak pemilik yang ambigu itu alih-alih mengandalkan
urutan penemuan. Saat runtime penyiapan benar-benar dijalankan, diagnostik registri melaporkan
drift antara `setup.providers` / `setup.cliBackends` dan provider atau CLI
backend yang didaftarkan oleh setup-api tanpa memblokir plugin lama.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache in-process singkat untuk:

- hasil penemuan
- data registri manifest
- registri plugin yang dimuat

Cache ini mengurangi startup yang bursty dan overhead perintah berulang. Cache ini aman
untuk dianggap sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Tetapkan `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Setel jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registri

Plugin yang dimuat tidak secara langsung memodifikasi global core secara acak. Plugin mendaftar ke
registri plugin pusat.

Registri melacak:

- rekaman plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook lama dan hook bertipe
- channel
- provider
- handler RPC gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registri itu alih-alih berbicara dengan modul plugin
secara langsung. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> pendaftaran registri
- runtime core -> konsumsi registri

Pemisahan itu penting untuk keterpeliharaan. Artinya sebagian besar permukaan core hanya
memerlukan satu titik integrasi: "baca registri", bukan "buat kasus khusus untuk setiap modul plugin".

## Callback binding percakapan

Plugin yang mengikat sebuah percakapan dapat bereaksi saat sebuah persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah sebuah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Sebuah binding kini ada untuk plugin + percakapan ini.
        console.log(event.binding?.conversationId);
        return;
      }

      // Permintaan ditolak; hapus state tertunda lokal apa pun.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding hasil resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, ID pengirim, dan
  metadata percakapan

Callback ini hanya-notifikasi. Callback ini tidak mengubah siapa yang diizinkan untuk mengikat sebuah
percakapan, dan berjalan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifest** untuk lookup pra-runtime yang murah:
  `setup.providers[].envVars`, kompatibilitas usang `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook saat konfigurasi**: `catalog` (lama: `discovery`) ditambah
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup autentikasi, resolusi model,
  pembungkusan stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di bawah [Urutan hook dan penggunaan](#hook-order-and-usage).

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah permukaan ekstensi untuk perilaku khusus provider
tanpa memerlukan transport inferensi kustom sepenuhnya.

Gunakan `setup.providers[].envVars` manifest saat provider memiliki
kredensial berbasis env yang perlu dilihat oleh jalur auth/status/model-picker generik tanpa
memuat runtime plugin. `providerAuthEnvVars` yang usang masih dibaca oleh
adapter kompatibilitas selama jendela deprecasi, dan plugin non-bawaan
yang menggunakannya menerima diagnostik manifest. Gunakan manifest `providerAuthAliases`
saat satu ID provider harus menggunakan ulang env vars, profil autentikasi,
autentikasi berbasis config, dan pilihan onboarding API key dari ID provider lain. Gunakan manifest
`providerAuthChoices` saat permukaan onboarding/auth-choice CLI perlu mengetahui
ID pilihan provider, label grup, dan wiring autentikasi satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider
untuk petunjuk yang ditujukan ke operator seperti label onboarding atau variabel penyiapan
client-id/client-secret OAuth.

Gunakan manifest `channelEnvVars` saat sebuah channel memiliki autentikasi atau penyiapan berbasis env yang perlu dilihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt penyiapan tanpa memuat runtime channel.

### Urutan hook dan penggunaan

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan konfigurasi provider ke `models.providers` selama pembuatan `models.json`                     | Provider memiliki katalog atau default `base URL`                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik provider selama materialisasi konfigurasi                          | Default bergantung pada mode autentikasi, env, atau semantik keluarga model provider                                                          |
| --  | _(lookup model bawaan)_           | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias model-id lama atau preview sebelum lookup                                                    | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                            |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                               | Provider memiliki pembersihan transport untuk ID provider kustom dalam keluarga transport yang sama                                           |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan konfigurasi yang sebaiknya hidup bersama plugin; helper keluarga Google bawaan juga menjadi penyangga untuk entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas penggunaan streaming native ke provider konfigurasi                  | Provider memerlukan perbaikan metadata penggunaan streaming native yang digerakkan endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Me-resolve autentikasi penanda env untuk provider konfigurasi sebelum pemuatan autentikasi runtime            | Provider memiliki resolusi API key penanda env milik provider; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini       |
| 8   | `resolveSyntheticAuth`            | Menampilkan autentikasi lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                  | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Menimpa profil autentikasi eksternal milik provider; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Provider menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan refresh token yang disalin; deklarasikan `contracts.externalAuthProviders` di manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan placeholder profil sintetis yang tersimpan di bawah autentikasi berbasis env/konfigurasi          | Provider menyimpan profil placeholder sintetis yang seharusnya tidak menang dalam prioritas                                                   |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk ID model milik provider yang belum ada di registri lokal                                | Provider menerima ID model upstream arbitrer                                                                                                  |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                      | Provider memerlukan metadata jaringan sebelum me-resolve ID yang tidak dikenal                                                                |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum runner tertanam menggunakan model hasil resolve                                  | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                         |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                        | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                        |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan kekhususan transkrip/keluarga provider                                                                                    |
| 16  | `normalizeToolSchemas`            | Menormalkan skema tool sebelum runner tertanam melihatnya                                                      | Provider memerlukan pembersihan skema keluarga transport                                                                                      |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik skema milik provider setelah normalisasi                                                | Provider menginginkan peringatan keyword tanpa mengajarkan aturan khusus provider ke core                                                     |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs tagged                                                              | Provider memerlukan output reasoning/final bertag alih-alih field native                                                                      |
| 19  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                           | Provider memerlukan parameter permintaan default atau pembersihan parameter per provider                                                      |
| 20  | `createStreamFn`                  | Sepenuhnya mengganti jalur stream normal dengan transport kustom                                               | Provider memerlukan wire protocol kustom, bukan sekadar wrapper                                                                               |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper kompatibilitas header/body/model permintaan tanpa transport kustom                                               |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per giliran                                                  | Provider ingin transport generik mengirim identitas giliran native provider                                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                              |
| 24  | `formatApiKey`                    | Formatter profil autentikasi: profil yang disimpan menjadi string `apiKey` runtime                             | Provider menyimpan metadata autentikasi tambahan dan memerlukan bentuk token runtime kustom                                                   |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher bersama `pi-ai`                                                                                         |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan autentikasi milik provider setelah kegagalan refresh                                                   |
| 27  | `matchesContextOverflowError`     | Matcher overflow context window milik provider                                                                 | Provider memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                             |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                              |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating TTL cache khusus proxy                                                                                             |
| 30  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan missing-auth generik                                                           | Provider memerlukan petunjuk pemulihan missing-auth khusus provider                                                                           |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream usang ditambah petunjuk error opsional yang terlihat pengguna                        | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                  |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Provider memerlukan baris forward-compat sintetis di `models list` dan picker                                                                 |
| 33  | `resolveThinkingProfile`          | Kumpulan level `/think`, label tampilan, dan default yang spesifik model                                       | Provider mengekspos tangga thinking kustom atau label biner untuk model yang dipilih                                                          |
| 34  | `isBinaryThinking`                | Hook kompatibilitas toggle reasoning on/off                                                                    | Provider hanya mengekspos thinking biner hidup/mati                                                                                           |
| 35  | `supportsXHighThinking`           | Hook kompatibilitas dukungan reasoning `xhigh`                                                                 | Provider menginginkan `xhigh` hanya pada sebagian model                                                                                       |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatibilitas level `/think` default                                                                     | Provider memiliki kebijakan `/think` default untuk satu keluarga model                                                                        |
| 37  | `isModernModelRef`                | Matcher model modern untuk filter profil live dan pemilihan smoke                                              | Provider memiliki pencocokan model pilihan untuk live/smoke                                                                                   |
| 38  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                | Provider memerlukan pertukaran token atau kredensial permintaan berumur pendek                                                                |
| 39  | `resolveUsageAuth`                | Me-resolve kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                        | Provider memerlukan parsing token penggunaan/kuota kustom atau kredensial penggunaan yang berbeda                                            |
| 40  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot penggunaan/kuota khusus provider setelah autentikasi di-resolve            | Provider memerlukan endpoint penggunaan khusus provider atau parser payload                                                                   |
| 41  | `createEmbeddingProvider`         | Membangun adaptor embedding milik provider untuk memory/search                                                 | Perilaku embedding Memory berada bersama plugin provider                                                                                      |
| 42  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya, penghapusan blok thinking)                                                         |
| 43  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay khusus provider di luar helper Compaction bersama                                                  |
| 44  | `validateReplayTurns`             | Validasi atau pembentukan ulang giliran replay final sebelum runner tertanam                                   | Transport provider memerlukan validasi giliran yang lebih ketat setelah sanitasi generik                                                     |
| 45  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                                        | Provider memerlukan telemetri atau state milik provider saat sebuah model menjadi aktif                                                      |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` terlebih dahulu memeriksa
plugin provider yang cocok, lalu meneruskan ke plugin provider lain yang mendukung hook
sampai salah satu benar-benar mengubah ID model atau transport/konfigurasi. Ini menjaga
shim alias/kompatibilitas provider tetap berfungsi tanpa mengharuskan pemanggil mengetahui
plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider
yang menulis ulang entri konfigurasi keluarga Google yang didukung, normalizer konfigurasi
Google bawaan tetap menerapkan pembersihan kompatibilitas itu.

Jika provider memerlukan wire protocol kustom sepenuhnya atau eksekutor permintaan kustom,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku provider
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

Plugin provider bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan katalog,
autentikasi, thinking, replay, dan penggunaan masing-masing vendor. Kumpulan hook yang otoritatif berada bersama
setiap plugin di bawah `extensions/`; halaman ini menggambarkan bentuknya alih-alih
mencerminkan seluruh daftar.

<AccordionGroup>
  <Accordion title="Provider katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` ditambah
    `resolveDynamicModel` / `prepareDynamicModel` sehingga mereka dapat menampilkan
    ID model upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Provider endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga replay dan pembersihan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan provider untuk ikut serta
    ke dalam kebijakan transkrip melalui `buildReplayPolicy` alih-alih setiap plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Provider hanya-katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam
    seam `api.ts` / `contract-api.ts` publik plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) alih-alih di
    SDK generik.
  </Accordion>
</AccordionGroup>

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

- `textToSpeech` mengembalikan payload output TTS core normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi `messages.tts` core dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk pemilih suara atau alur penyiapan milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk pemilih yang sadar provider.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan provider speech melalui `api.registerSpeechProvider(...)`.

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
- Gunakan provider speech untuk perilaku sintesis milik vendor.
- Input `edge` Microsoft lama dinormalkan ke ID provider `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu plugin vendor dapat memiliki
  provider teks, speech, gambar, dan media masa depan saat OpenClaw menambahkan kontrak
  kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
pemahaman media bertipe alih-alih kantong key/value generik:

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

- Pertahankan orkestrasi, fallback, konfigurasi, dan wiring channel di core.
- Pertahankan perilaku vendor di plugin provider.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel mengonsumsi `api.runtime.videoGeneration.*`

Untuk helper runtime pemahaman media, plugin dapat memanggil:

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

Untuk transkripsi audio, plugin dapat menggunakan runtime pemahaman media
atau alias STT lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opsional saat MIME tidak dapat disimpulkan dengan andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang dipilih untuk
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

- `provider` dan `model` adalah override per eksekusi yang opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk eksekusi fallback milik plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk secara eksplisit mengizinkan target apa pun.
- Eksekusi subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat mengonsumsi helper runtime bersama alih-alih
masuk ke wiring tool agen:

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

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik permintaan bersama di core.
- Gunakan provider web-search untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang dipilih untuk plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: buat gambar menggunakan rantai provider pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: daftar provider pembuatan gambar yang tersedia dan kapabilitasnya.

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

- `path`: jalur rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan autentikasi gateway normal, atau `"plugin"` untuk autentikasi/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti pendaftaran rute miliknya yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti rute plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level autentikasi yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini ditujukan untuk webhook/verifikasi tanda tangan yang dikelola plugin, bukan panggilan helper Gateway berprivilege.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan itu sengaja konservatif:
  - autentikasi bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute plugin tetap disematkan ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada private ingress) menghormati `x-openclaw-scopes` hanya saat header tersebut ada secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute plugin yang membawa identitas tersebut, cakupan runtime fallback ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa rute plugin yang diautentikasi gateway adalah permukaan admin implisit. Jika rute Anda membutuhkan perilaku khusus admin, wajibkan mode autentikasi yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Jalur import SDK Plugin

Gunakan subpath SDK yang sempit alih-alih root barrel monolitik `openclaw/plugin-sdk`
saat menulis plugin baru. Subpath core:

| Subpath                             | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran plugin                        |
| `openclaw/plugin-sdk/channel-core`  | Helper entri/build channel                         |
| `openclaw/plugin-sdk/core`          | Helper bersama generik dan kontrak umbrella        |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`)  |

Plugin channel memilih dari keluarga seam sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability` alih-alih mencampurnya di berbagai
field plugin yang tidak terkait. Lihat [Plugin channel](/id/plugins/sdk-channel-plugins).

Helper runtime dan konfigurasi berada di bawah subpath `*-runtime`
yang sesuai (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, dll.).

<Info>
`openclaw/plugin-sdk/channel-runtime` sudah deprecated — shim kompatibilitas untuk
plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit.
</Info>

Titik masuk internal repo (per root package plugin bawaan):

- `index.js` — entri plugin bawaan
- `api.js` — barrel helper/types
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri plugin penyiapan

Plugin eksternal sebaiknya hanya mengimpor subpath `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` package plugin lain dari core atau dari plugin lain.
Titik masuk yang dimuat via facade memprioritaskan snapshot konfigurasi runtime aktif saat ada,
lalu fallback ke file konfigurasi hasil resolve di disk.

Subpath khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena plugin bawaan menggunakannya saat ini. Ini bukan
kontrak eksternal jangka panjang yang otomatis dibekukan — periksa halaman referensi SDK
yang relevan saat mengandalkannya.

## Skema tool pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus channel
untuk primitif non-pesan seperti reaksi, tanda baca, dan polling.
Presentasi pengiriman bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih field button, component, block, atau card native provider.
Lihat [Message Presentation](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan provider, dan daftar periksa penulis plugin.

Plugin yang mampu mengirim mendeklarasikan apa yang dapat mereka render melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos jalur escape UI native provider dari tool pesan generik.
Helper SDK yang sudah deprecated untuk skema native lama tetap diekspor untuk plugin pihak ketiga yang ada, tetapi plugin baru sebaiknya tidak menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Pertahankan
host keluar bersama tetap generik dan gunakan permukaan adapter pesan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang sudah dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi hasil akhir milik provider setelah normalisasi atau setelah
  direktori gagal menemukan.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus provider setelah target berhasil di-resolve.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai ID target native/eksplisit".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus provider, bukan untuk
  pencarian direktori yang luas.
- Simpan ID native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter khusus provider, bukan di field SDK
  generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi sebaiknya menyimpan logika itu di
plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat sebuah channel memerlukan peer/grup berbasis konfigurasi seperti:

- peer DM yang didorong allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis berbatas akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan limit
- helper dedupe/normalisasi
- membangun `ChannelDirectoryEntry[]`

Pemeriksaan akun khusus channel dan normalisasi id sebaiknya tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat plugin memiliki ID model khusus provider, default base URL,
atau metadata model yang dibatasi autentikasi.

`catalog.order` mengontrol kapan katalog plugin digabungkan relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API key atau env
- `profile`: provider yang muncul saat profil autentikasi ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada tabrakan key, sehingga plugin dapat dengan sengaja menimpa entri provider bawaan dengan ID provider yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama
- jika `catalog` dan `discovery` keduanya terdaftar, OpenClaw menggunakan `catalog`

## Inspeksi channel hanya-baca

Jika plugin Anda mendaftarkan sebuah channel, sebaiknya implementasikan
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi bahwa kredensial
  sudah termaterialisasi sepenuhnya dan dapat gagal cepat saat secret yang diperlukan hilang.
- Jalur perintah hanya-baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/perbaikan
  konfigurasi seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya state akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  hanya-baca. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat sebuah kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah hanya-baca melaporkan "configured but unavailable in this command
path" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

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

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa extension, ID plugin
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Pengaman keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori package akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependensi dev saat runtime). Jaga tree dependensi plugin
tetap "JS/TS murni" dan hindari package yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus penyiapan.
Saat OpenClaw memerlukan permukaan penyiapan untuk plugin channel yang nonaktif, atau
saat plugin channel diaktifkan tetapi belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri plugin penuh. Ini menjaga startup dan penyiapan tetap ringan
saat entri plugin utama Anda juga memasang tool, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat membuat plugin channel ikut serta ke jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan saat channel sudah dikonfigurasi.

Gunakan ini hanya saat `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, ini berarti entri penyiapan
harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan startup, seperti:

- pendaftaran channel itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum gateway mulai mendengarkan
- gateway method, tool, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Channel bawaan juga dapat memublikasikan helper permukaan kontrak khusus penyiapan yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promosi penyiapan saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu saat perlu mempromosikan konfigurasi channel
single-account lama ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh.
Matrix adalah contoh bawaan saat ini: Matrix hanya memindahkan key auth/bootstrap ke
akun hasil promosi bernama saat akun bernama sudah ada, dan dapat mempertahankan
key default-account non-kanonis yang dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adaptor patch penyiapan tersebut menjaga penemuan permukaan kontrak bawaan tetap lazy. Waktu import tetap ringan; permukaan promosi dimuat hanya pada penggunaan pertama alih-alih masuk kembali ke startup channel bawaan saat import modul.

Saat permukaan startup tersebut menyertakan gateway RPC method, pertahankan method itu pada
prefiks khusus plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu me-resolve
ke `operator.admin`, bahkan jika plugin meminta cakupan yang lebih sempit.

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

Plugin channel dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan
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

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: override teks tautan untuk tautan dokumentasi
- `preferOver`: ID plugin/channel dengan prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol copy untuk permukaan pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan channel dari permukaan daftar channel yang telah dikonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan channel dari picker penyiapan/konfigurasi interaktif saat disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/pribadi untuk permukaan navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; pilih `exposure`
- `quickstartAllowFrom`: membuat channel ikut serta dalam alur quickstart `allowFrom` standar
- `forceAccountBinding`: wajibkan binding akun eksplisit bahkan saat hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: prioritaskan lookup sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya ekspor
registri MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisah koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk key `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instalasi provider mengekspos
fakta sumber instalasi yang dinormalisasi di samping blok `openclaw.install` mentah. Fakta
yang dinormalisasi mengidentifikasi apakah npm spec adalah versi tepat atau selector mengambang,
apakah metadata integritas yang diharapkan ada, dan apakah jalur sumber lokal
juga tersedia. Saat identitas katalog/package diketahui, fakta yang dinormalisasi
memperingatkan jika nama package npm yang diurai menyimpang dari identitas tersebut.
Fakta ini juga memperingatkan saat `defaultChoice` tidak valid atau menunjuk ke sumber yang
tidak tersedia, dan saat metadata integritas npm ada tanpa sumber npm yang valid.
Konsumen sebaiknya memperlakukan `installSource` sebagai field opsional aditif sehingga
entri buatan tangan lama dan shim kompatibilitas tidak harus mensintesisnya.
Ini memungkinkan onboarding dan diagnostik menjelaskan state source-plane tanpa
mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya memilih `npmSpec` yang tepat ditambah
`expectedIntegrity`. Nama package polos dan dist-tag tetap berfungsi untuk
kompatibilitas, tetapi menampilkan peringatan source-plane sehingga katalog dapat bergerak
menuju instalasi yang disematkan dan diperiksa integritasnya tanpa merusak plugin yang ada.
Saat onboarding menginstal dari jalur katalog lokal, onboarding mencatat
entri `plugins.installs` dengan `source: "path"` dan `sourcePath` relatif terhadap workspace
jika memungkinkan. Jalur pemuatan operasional absolut tetap berada di
`plugins.load.paths`; catatan instalasi menghindari penduplikasian jalur workstation lokal
ke konfigurasi jangka panjang. Ini menjaga instalasi pengembangan lokal tetap terlihat oleh
diagnostik source-plane tanpa menambahkan permukaan kedua untuk pengungkapan
jalur filesystem mentah.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan Compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih sekadar menambahkan pencarian memory atau hook.

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

Jika engine Anda **tidak** memiliki algoritma Compaction, pertahankan `compact()`
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

Saat sebuah plugin memerlukan perilaku yang tidak sesuai dengan API saat ini, jangan melewati
sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Tentukan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan konfigurasi,
   lifecycle, semantik yang berhadapan dengan channel, dan bentuk helper runtime.
2. tambahkan permukaan pendaftaran/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas
   bertipe yang paling kecil namun berguna.
3. pasang core + konsumen channel/fitur
   Channel dan plugin fitur harus mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar bentuk kepemilikan dan pendaftaran tetap eksplisit seiring waktu.

Beginilah OpenClaw tetap opinionated tanpa menjadi hardcoded pada
pandangan dunia satu provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk daftar periksa file konkret dan contoh yang dikerjakan.

### Daftar periksa kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasi biasanya harus menyentuh
permukaan berikut secara bersama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- permukaan pendaftaran API plugin di `src/plugins/types.ts`
- wiring registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/plugin di `docs/`

Jika salah satu permukaan itu hilang, biasanya itu pertanda bahwa kapabilitas
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

Pola uji kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturan tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- uji kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — model dan bentuk kapabilitas publik
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
