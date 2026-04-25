---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu mengirim skema config plugin atau men-debug error validasi plugin
summary: Manifest plugin + persyaratan skema JSON (validasi config ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Halaman ini hanya untuk **manifest Plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle Plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus akar
skill yang dideklarasikan, akar perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan paket hook yang didukung saat tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** mengirim file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi config.

Lihat panduan sistem plugin lengkap: [Plugins](/id/tools/plugin).
Untuk model capability native dan panduan kompatibilitas eksternal saat ini:
[Model capability](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw **sebelum memuat
kode plugin Anda**. Semua yang ada di bawah ini harus cukup ringan untuk diperiksa tanpa menjalankan
runtime plugin.

**Gunakan untuk:**

- identitas plugin, validasi config, dan petunjuk UI config
- metadata auth, onboarding, dan setup (alias, auto-enable, provider env vars, pilihan auth)
- petunjuk aktivasi untuk permukaan control-plane
- kepemilikan shorthand keluarga model
- snapshot kepemilikan capability statis (`contracts`)
- metadata runner QA yang dapat diperiksa host bersama `openclaw qa`
- metadata config khusus saluran yang digabungkan ke permukaan katalog dan validasi

**Jangan gunakan untuk:** mendaftarkan perilaku runtime, mendeklarasikan code entrypoint,
atau metadata instalasi npm. Itu termasuk ke kode plugin Anda dan `package.json`.

## Contoh minimal

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Contoh lengkap

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin provider OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "API key OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "API key OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referensi field tingkat atas

| Field                                | Wajib    | Tipe                            | Artinya                                                                                                                                                                                                                           |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya       | `string`                         | Id plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Ya       | `object`                         | JSON Schema inline untuk config plugin ini.                                                                                                                                                                                       |
| `enabledByDefault`                   | Tidak    | `true`                           | Menandai plugin bundled sebagai aktif secara default. Hilangkan, atau atur ke nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                                                            |
| `legacyPluginIds`                    | Tidak    | `string[]`                       | Id lama yang dinormalisasi ke id plugin kanonis ini.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                       | Id provider yang harus mengaktifkan plugin ini secara otomatis saat auth, config, atau referensi model menyebutkannya.                                                                                                           |
| `kind`                               | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                     |
| `channels`                           | Tidak    | `string[]`                       | Id saluran yang dimiliki plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                                               |
| `providers`                          | Tidak    | `string[]`                       | Id provider yang dimiliki plugin ini.                                                                                                                                                                                              |
| `providerDiscoveryEntry`             | Tidak    | `string`                         | Path modul provider-discovery ringan, relatif terhadap root plugin, untuk metadata katalog provider bercakupan manifest yang dapat dimuat tanpa mengaktifkan runtime plugin penuh.                                                |
| `modelSupport`                       | Tidak    | `object`                         | Metadata shorthand keluarga model yang dimiliki manifest dan digunakan untuk memuat plugin secara otomatis sebelum runtime.                                                                                                       |
| `modelCatalog`                       | Tidak    | `object`                         | Metadata katalog model deklaratif untuk provider yang dimiliki plugin ini. Ini adalah kontrak control-plane untuk listing read-only, onboarding, pemilih model, alias, dan penekanan di masa depan tanpa memuat runtime plugin. |
| `providerEndpoints`                  | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint yang dimiliki manifest untuk rute provider yang harus diklasifikasikan inti sebelum runtime provider dimuat.                                                                                       |
| `cliBackends`                        | Tidak    | `string[]`                       | Id backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi config eksplisit.                                                                                                |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                       | Referensi provider atau backend CLI yang hook auth sintetis milik pluginnya harus diprobe selama discovery model dingin sebelum runtime dimuat.                                                                                   |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                       | Nilai placeholder API key milik plugin bundled yang mewakili status kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                                                     |
| `commandAliases`                     | Tidak    | `object[]`                       | Nama perintah yang dimiliki plugin ini yang harus menghasilkan config sadar-plugin dan diagnostik CLI sebelum runtime dimuat.                                                                                                      |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`       | Metadata env kompatibilitas yang deprecated untuk lookup auth/status provider. Pilih `setup.providers[].envVars` untuk plugin baru; OpenClaw masih membacanya selama jendela deprecation.                                          |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`         | Id provider yang harus menggunakan ulang id provider lain untuk lookup auth, misalnya provider coding yang berbagi API key dan profil auth provider dasar.                                                                        |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`       | Metadata env saluran ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk setup saluran atau permukaan auth yang digerakkan env yang perlu dilihat helper startup/config generik.                    |
| `providerAuthChoices`                | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk pemilih onboarding, resolusi provider pilihan, dan pengkabelan flag CLI sederhana.                                                                                                             |
| `activation`                         | Tidak    | `object`                         | Metadata planner aktivasi ringan untuk pemuatan yang dipicu provider, perintah, saluran, rute, dan capability. Hanya metadata; runtime plugin tetap memiliki perilaku nyata.                                                      |
| `setup`                              | Tidak    | `object`                         | Deskriptor setup/onboarding ringan yang dapat diperiksa permukaan discovery dan setup tanpa memuat runtime plugin.                                                                                                                |
| `qaRunners`                          | Tidak    | `object[]`                       | Deskriptor runner QA ringan yang digunakan host `openclaw qa` bersama sebelum runtime plugin dimuat.                                                                                                                              |
| `contracts`                          | Tidak    | `object`                         | Snapshot capability bundled statis untuk hook auth eksternal, speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan musik, pembuatan video, web-fetch, web search, dan kepemilikan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`         | Default pemahaman media ringan untuk id provider yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                                   |
| `channelConfigs`                     | Tidak    | `Record<string, object>`         | Metadata config saluran yang dimiliki manifest dan digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                                         |
| `skills`                             | Tidak    | `string[]`                       | Direktori skill untuk dimuat, relatif terhadap root plugin.                                                                                                                                                                        |
| `name`                               | Tidak    | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                                                             |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                                            |
| `version`                            | Tidak    | `string`                         | Versi plugin informasional.                                                                                                                                                                                                        |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field config.                                                                                                                                                               |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.
Alur setup provider lebih memilih pilihan manifest ini, lalu fallback ke metadata
wizard runtime dan pilihan katalog instalasi demi kompatibilitas.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | Id provider tempat pilihan ini berada.                                                                   |
| `method`              | Ya       | `string`                                        | Id metode auth yang akan didistribusikan.                                                                |
| `choiceId`            | Ya       | `string`                                        | Id pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                      |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang menghadap pengguna. Jika dihilangkan, OpenClaw fallback ke `choiceId`.                       |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                      |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan asisten.          |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Menyembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan CLI manual.              |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                |
| `groupId`             | Tidak    | `string`                                        | Id grup opsional untuk mengelompokkan pilihan terkait.                                                   |
| `groupLabel`          | Tidak    | `string`                                        | Label yang menghadap pengguna untuk grup tersebut.                                                       |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                                |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur auth sederhana dengan satu flag.                                          |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan di bantuan CLI.                                                                 |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah plugin memiliki nama perintah runtime yang
mungkin keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai perintah CLI root. OpenClaw
menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Field        | Wajib    | Tipe              | Artinya                                                                |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki plugin ini.                                |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai slash command chat, bukan perintah CLI root.    |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada. |

## Referensi `activation`

Gunakan `activation` saat plugin dapat secara ringan mendeklarasikan event control-plane mana
yang harus menyertakannya dalam rencana aktivasi/pemuatan.

Blok ini adalah metadata planner, bukan API siklus hidup. Ini tidak mendaftarkan
perilaku runtime, tidak menggantikan `register(...)`, dan tidak menjanjikan bahwa
kode plugin sudah dieksekusi. Planner aktivasi menggunakan field ini untuk
mempersempit kandidat plugin sebelum fallback ke metadata kepemilikan manifest yang sudah ada
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hooks.

Pilih metadata tersempit yang sudah menjelaskan kepemilikan. Gunakan
`providers`, `channels`, `commandAliases`, deskriptor setup, atau `contracts`
saat field tersebut mengekspresikan relasinya. Gunakan `activation` untuk petunjuk planner tambahan
yang tidak dapat direpresentasikan oleh field kepemilikan tersebut.

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, jadi
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; ini seharusnya tidak
mengubah ketepatan selama fallback kepemilikan manifest lama masih ada.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field            | Wajib    | Tipe                                                 | Artinya                                                                                                   |
| ---------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Tidak    | `string[]`                                           | Id provider yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                            |
| `onCommands`     | Tidak    | `string[]`                                           | Id perintah yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                            |
| `onChannels`     | Tidak    | `string[]`                                           | Id saluran yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                             |
| `onRoutes`       | Tidak    | `string[]`                                           | Jenis rute yang harus menyertakan plugin ini dalam rencana aktivasi/pemuatan.                             |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk capability luas yang digunakan oleh perencanaan aktivasi control-plane. Pilih field yang lebih sempit bila memungkinkan. |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan setup/saluran yang dipicu saluran fallback ke kepemilikan
  `channels[]` lama saat metadata aktivasi saluran eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider fallback ke
  kepemilikan `providers[]` dan `cliBackends[]` tingkat atas lama saat metadata
  aktivasi provider eksplisit tidak ada

Diagnostik planner dapat membedakan petunjuk aktivasi eksplisit dari fallback
kepemilikan manifest. Misalnya, `activation-command-hint` berarti
`activation.onCommands` cocok, sedangkan `manifest-command-alias` berarti
planner menggunakan kepemilikan `commandAliases` sebagai gantinya. Label alasan ini
untuk diagnostik dan pengujian host; penulis plugin sebaiknya tetap mendeklarasikan metadata
yang paling menjelaskan kepemilikan.

## Referensi `qaRunners`

Gunakan `qaRunners` saat sebuah plugin menyumbang satu atau lebih transport runner di bawah
root bersama `openclaw qa`. Jaga metadata ini tetap ringan dan statis; runtime plugin
tetap memiliki pendaftaran CLI nyata melalui permukaan
`runtime-api.ts` ringan yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Jalankan lane QA Matrix live berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Field         | Wajib    | Tipe     | Artinya                                                         |
| ------------- | -------- | -------- | ---------------------------------------------------------------- |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

## Referensi `setup`

Gunakan `setup` saat permukaan setup dan onboarding membutuhkan metadata milik plugin yang ringan
sebelum runtime dimuat.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` tingkat atas tetap valid dan terus menjelaskan backend inferensi CLI.
`setup.cliBackends` adalah permukaan deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya metadata.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
berbasis deskriptor yang dipilih untuk discovery setup. Jika deskriptor hanya
mempersempit kandidat plugin dan setup masih memerlukan hook runtime waktu-setup yang lebih kaya,
atur `requiresRuntime: true` dan pertahankan `setup-api` sebagai jalur eksekusi fallback.

OpenClaw juga menyertakan `setup.providers[].envVars` dalam lookup auth provider generik dan
env-var. `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas selama
masa deprecation, tetapi plugin non-bundled yang masih menggunakannya menerima
diagnostik manifest. Plugin baru sebaiknya menaruh metadata env setup/status
di `setup.providers[].envVars`.

OpenClaw juga dapat menurunkan pilihan setup sederhana dari `setup.providers[].authMethods`
saat tidak ada entri setup, atau saat `setup.requiresRuntime: false`
menyatakan runtime setup tidak perlu. Entri `providerAuthChoices` eksplisit tetap
lebih dipilih untuk label kustom, flag CLI, scope onboarding, dan metadata asisten.

Atur `requiresRuntime: false` hanya saat deskriptor tersebut sudah cukup untuk
permukaan setup. OpenClaw memperlakukan `false` eksplisit sebagai kontrak hanya-deskriptor
dan tidak akan mengeksekusi `setup-api` atau `openclaw.setupEntry` untuk lookup setup. Jika
plugin hanya-deskriptor masih mengirim salah satu entri runtime setup tersebut,
OpenClaw melaporkan diagnostik aditif dan tetap mengabaikannya. `requiresRuntime`
yang dihilangkan mempertahankan perilaku fallback lama agar plugin yang ada
yang menambahkan deskriptor tanpa flag tidak rusak.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh plugin yang ditemukan. Kepemilikan ambigu gagal secara fail-closed alih-alih memilih pemenang berdasarkan urutan discovery.

Saat runtime setup memang dieksekusi, diagnostik registry setup melaporkan descriptor
drift jika `setup-api` mendaftarkan provider atau backend CLI yang tidak
dideklarasikan deskriptor manifest, atau jika deskriptor tidak memiliki pendaftaran runtime yang cocok. Diagnostik ini bersifat aditif dan tidak menolak plugin lama.

### Referensi `setup.providers`

| Field         | Wajib    | Tipe       | Artinya                                                                       |
| ------------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `id`          | Ya       | `string`   | Id provider yang diekspos selama setup atau onboarding. Jaga id ternormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | Id metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.   |
| `envVars`     | Tidak    | `string[]` | Env var yang dapat diperiksa permukaan setup/status generik sebelum runtime plugin dimuat. |

### Field `setup`

| Field              | Wajib    | Tipe       | Artinya                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                          |
| `cliBackends`      | Tidak    | `string[]` | Id backend waktu-setup yang digunakan untuk lookup setup berbasis deskriptor terlebih dahulu. Jaga id ternormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | Id migrasi config yang dimiliki permukaan setup plugin ini.                                   |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field config ke petunjuk rendering kecil.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Digunakan untuk permintaan OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Setiap petunjuk field dapat mencakup:

| Field         | Tipe       | Artinya                                  |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Label field yang menghadap pengguna.     |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.         |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan capability statis yang dapat dibaca OpenClaw
tanpa mengimpor runtime plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Setiap daftar bersifat opsional:

| Field                            | Tipe       | Artinya                                                              |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id factory ekstensi server aplikasi Codex, saat ini `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Id runtime tempat plugin bundled dapat mendaftarkan middleware hasil tool. |
| `externalAuthProviders`          | `string[]` | Id provider yang hook profil auth eksternalnya dimiliki plugin ini.  |
| `speechProviders`                | `string[]` | Id provider speech yang dimiliki plugin ini.                         |
| `realtimeTranscriptionProviders` | `string[]` | Id provider transkripsi realtime yang dimiliki plugin ini.           |
| `realtimeVoiceProviders`         | `string[]` | Id provider suara realtime yang dimiliki plugin ini.                 |
| `memoryEmbeddingProviders`       | `string[]` | Id provider embedding memori yang dimiliki plugin ini.               |
| `mediaUnderstandingProviders`    | `string[]` | Id provider pemahaman media yang dimiliki plugin ini.                |
| `imageGenerationProviders`       | `string[]` | Id provider pembuatan gambar yang dimiliki plugin ini.               |
| `videoGenerationProviders`       | `string[]` | Id provider pembuatan video yang dimiliki plugin ini.                |
| `webFetchProviders`              | `string[]` | Id provider web-fetch yang dimiliki plugin ini.                      |
| `webSearchProviders`             | `string[]` | Id provider web search yang dimiliki plugin ini.                     |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini untuk pemeriksaan kontrak bundled. |

`contracts.embeddedExtensionFactories` dipertahankan untuk factory ekstensi
khusus server aplikasi Codex bundled. Transformasi hasil tool bundled harus
mendeklarasikan `contracts.agentToolResultMiddleware` dan mendaftar dengan
`api.registerAgentToolResultMiddleware(...)` sebagai gantinya. Plugin eksternal tidak dapat
mendaftarkan middleware hasil tool karena seam ini dapat menulis ulang output tool
berkepercayaan tinggi sebelum model melihatnya.

Plugin provider yang mengimplementasikan `resolveExternalAuthProfiles` harus mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi ini masih berjalan
melalui fallback kompatibilitas yang deprecated, tetapi fallback tersebut lebih lambat dan
akan dihapus setelah masa migrasi.

Provider embedding memori bundled harus mendeklarasikan
`contracts.memoryEmbeddingProviders` untuk setiap id adapter yang mereka ekspos, termasuk
adapter bawaan seperti `local`. Jalur CLI mandiri menggunakan kontrak manifest ini
untuk memuat hanya plugin pemilik sebelum runtime Gateway penuh
mendaftarkan provider.

## Referensi `mediaUnderstandingProviderMetadata`

Gunakan `mediaUnderstandingProviderMetadata` saat sebuah provider pemahaman media memiliki
model default, prioritas fallback auth otomatis, atau dukungan dokumen native yang
dibutuhkan helper inti generik sebelum runtime dimuat. Kunci juga harus dideklarasikan di
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Setiap entri provider dapat mencakup:

| Field                  | Tipe                                | Artinya                                                                     |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability media yang diekspos provider ini.                                |
| `defaultModels`        | `Record<string, string>`            | Default capability-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback provider otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung provider.                                |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat plugin saluran membutuhkan metadata config ringan sebelum
runtime dimuat. Discovery setup/status saluran read-only dapat menggunakan metadata ini
secara langsung untuk saluran eksternal yang dikonfigurasi saat tidak ada entri setup, atau
saat `setup.requiresRuntime: false` menyatakan runtime setup tidak diperlukan.

Untuk plugin saluran, `configSchema` dan `channelConfigs` menjelaskan path yang berbeda:

- `configSchema` memvalidasi `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` memvalidasi `channels.<channel-id>`

Plugin non-bundled yang mendeklarasikan `channels[]` juga harus mendeklarasikan entri
`channelConfigs` yang cocok. Tanpa itu, OpenClaw tetap dapat memuat plugin, tetapi
permukaan skema config cold-path, setup, dan Control UI tidak dapat mengetahui bentuk
opsi yang dimiliki saluran hingga runtime plugin dieksekusi.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Koneksi homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Setiap entri saluran dapat mencakup:

| Field         | Tipe                     | Artinya                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config saluran yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian config saluran tersebut.   |
| `label`       | `string`                 | Label saluran yang digabungkan ke permukaan picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi singkat saluran untuk permukaan inspect dan katalog.                           |
| `preferOver`  | `string[]`               | Id plugin lama atau prioritas lebih rendah yang harus dikalahkan saluran ini di permukaan pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin provider Anda dari
id model shorthand seperti `gpt-5.5` atau `claude-sonnet-4.6` sebelum runtime plugin
dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan prioritas ini:

- referensi `provider/model` eksplisit menggunakan metadata manifest `providers` milik pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bundled dan satu plugin bundled sama-sama cocok, plugin non-bundled yang menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                     |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model shorthand.    |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah penghapusan sufiks profil. |

## Referensi `modelCatalog`

Gunakan `modelCatalog` saat OpenClaw harus mengetahui metadata model provider sebelum
memuat runtime plugin. Ini adalah sumber yang dimiliki manifest untuk baris katalog
tetap, alias provider, aturan penekanan, dan mode discovery. Refresh runtime
tetap berada di kode runtime provider, tetapi manifest memberi tahu inti kapan runtime
diperlukan.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "tidak tersedia di Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Field tingkat atas:

| Field          | Tipe                                                     | Artinya                                                                                                  |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Baris katalog untuk id provider yang dimiliki plugin ini. Kunci juga harus muncul di `providers` tingkat atas. |
| `aliases`      | `Record<string, object>`                                 | Alias provider yang harus di-resolve ke provider milik sendiri untuk perencanaan katalog atau suppression. |
| `suppressions` | `object[]`                                               | Baris model dari sumber lain yang ditekan plugin ini karena alasan spesifik provider.                    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Apakah katalog provider dapat dibaca dari metadata manifest, di-refresh ke cache, atau memerlukan runtime. |

Field provider:

| Field     | Tipe                     | Artinya                                                              |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL default opsional untuk model di katalog provider ini.       |
| `api`     | `ModelApi`               | Adapter API default opsional untuk model di katalog provider ini.    |
| `headers` | `Record<string, string>` | Header statis opsional yang berlaku untuk katalog provider ini.      |
| `models`  | `object[]`               | Baris model wajib. Baris tanpa `id` akan diabaikan.                 |

Field model:

| Field           | Tipe                                                           | Artinya                                                                    |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id model lokal-provider, tanpa prefiks `provider/`.                        |
| `name`          | `string`                                                       | Nama tampilan opsional.                                                    |
| `api`           | `ModelApi`                                                     | Override API per-model opsional.                                           |
| `baseUrl`       | `string`                                                       | Override base URL per-model opsional.                                      |
| `headers`       | `Record<string, string>`                                       | Header statis per-model opsional.                                          |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalitas yang diterima model.                                             |
| `reasoning`     | `boolean`                                                      | Apakah model mengekspos perilaku reasoning.                                |
| `contextWindow` | `number`                                                       | Jendela konteks native provider.                                           |
| `contextTokens` | `number`                                                       | Batas konteks runtime efektif opsional saat berbeda dari `contextWindow`.  |
| `maxTokens`     | `number`                                                       | Token output maksimum saat diketahui.                                      |
| `cost`          | `object`                                                       | Harga USD per juta token opsional, termasuk `tieredPricing` opsional.      |
| `compat`        | `object`                                                       | Flag kompatibilitas opsional yang cocok dengan kompatibilitas config model OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Status listing. Tekan hanya jika baris benar-benar tidak boleh muncul sama sekali. |
| `statusReason`  | `string`                                                       | Alasan opsional yang ditampilkan bersama status non-available.             |
| `replaces`      | `string[]`                                                     | Id model lokal-provider lama yang digantikan model ini.                    |
| `replacedBy`    | `string`                                                       | Id model lokal-provider pengganti untuk baris deprecated.                  |
| `tags`          | `string[]`                                                     | Tag stabil yang digunakan oleh picker dan filter.                          |

Jangan masukkan data khusus runtime ke `modelCatalog`. Jika sebuah provider memerlukan status akun,
permintaan API, atau discovery proses lokal untuk mengetahui kumpulan model lengkapnya,
deklarasikan provider tersebut sebagai `refreshable` atau `runtime` di `discovery`.

Kunci capability tingkat atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan capability.

## Manifest versus package.json

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin dijalankan               |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, pembatasan instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin sebuah metadata harus diletakkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field package.json yang memengaruhi discovery

Beberapa metadata plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori package plugin.                                                                                   |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk package yang terinstal. Harus tetap berada di dalam direktori package plugin.                                    |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup saluran tertunda, dan discovery status saluran/SecretRef read-only. Harus tetap berada di dalam direktori package plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk package yang terinstal. Harus tetap berada di dalam direktori package plugin.                                       |
| `openclaw.channel`                                                | Metadata katalog saluran ringan seperti label, path dokumen, alias, dan teks pilihan.                                                                                             |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah setup khusus env sudah ada?" tanpa memuat runtime saluran penuh.                                           |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa persisted-auth ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime saluran penuh.                                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bundled dan yang dipublikasikan secara eksternal.                                                                                       |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih saat ada beberapa sumber instalasi.                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                  |
| `openclaw.install.expectedIntegrity`                              | String integrity dist npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstall plugin bundled yang sempit saat config tidak valid.                                                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Mengizinkan permukaan saluran khusus setup dimuat sebelum plugin saluran penuh saat startup.                                                                                      |

Metadata manifest menentukan pilihan provider/saluran/setup mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan plugin tersebut saat pengguna memilih salah satu
opsi itu. Jangan pindahkan petunjuk instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` ditegakkan selama instalasi dan pemuatan
registry manifest. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

Pin versi npm yang tepat sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Entri katalog eksternal resmi
harus memasangkan spesifikasi yang tepat dengan `expectedIntegrity` agar alur pembaruan gagal
secara fail-closed jika artefak npm yang diambil tidak lagi cocok dengan rilis yang di-pin.
Onboarding interaktif tetap menawarkan spesifikasi npm registry tepercaya, termasuk nama
package biasa dan dist-tag, demi kompatibilitas. Diagnostik katalog dapat
membedakan sumber exact, floating, pinned-integrity, missing-integrity, ketidakcocokan
nama package, dan default-choice yang tidak valid. Diagnostik juga memperingatkan ketika
`expectedIntegrity` ada tetapi tidak ada sumber npm valid yang dapat di-pin.
Saat `expectedIntegrity` ada,
alur install/update menegakkannya; saat dihilangkan, resolusi registry
dicatat tanpa pin integrity.

Plugin saluran harus menyediakan `openclaw.setupEntry` saat status, daftar saluran,
atau pemindaian SecretRef perlu mengidentifikasi akun yang dikonfigurasi tanpa memuat
runtime penuh. Entri setup harus mengekspos metadata saluran plus adapter config,
status, dan secrets yang aman untuk setup; simpan klien jaringan, listener gateway, dan
runtime transport di entrypoint ekstensi utama.

Field entrypoint runtime tidak menimpa pemeriksaan batas package untuk field
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini tidak
membuat config rusak sembarang menjadi dapat diinstal. Saat ini hanya mengizinkan alur install
memulihkan dari kegagalan upgrade plugin bundled usang tertentu, seperti path plugin bundled yang hilang atau entri `channels.<id>` usang untuk plugin bundled yang sama. Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul checker
kecil:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Gunakan saat setup, doctor, atau alur configured-state memerlukan probe auth ya/tidak yang ringan
sebelum plugin saluran penuh dimuat. Ekspor target harus berupa fungsi kecil
yang hanya membaca status tersimpan; jangan rutekan melalui barrel runtime saluran penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured khusus env yang ringan:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Gunakan saat suatu saluran dapat menjawab configured-state dari env atau input kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
saluran nyata, simpan logika tersebut di hook plugin `config.hasConfiguredState`.

## Prioritas discovery (id plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bundled, instalasi global, ruang kerja, path yang dipilih secara eksplisit oleh config). Jika dua hasil discovery berbagi `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih config** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bundled** — plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — plugin yang diinstal ke root plugin OpenClaw global
4. **Ruang kerja** — plugin yang ditemukan relatif terhadap ruang kerja saat ini

Implikasi:

- Fork atau salinan usang dari plugin bundled yang ada di ruang kerja tidak akan menimpa build bundled.
- Untuk benar-benar menimpa plugin bundled dengan plugin lokal, pin melalui `plugins.entries.<id>` agar menang berdasarkan prioritas alih-alih mengandalkan discovery ruang kerja.
- Duplikat yang dibuang dicatat agar Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap plugin harus mengirim JSON Schema**, bahkan jika tidak menerima config.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat pembacaan/penulisan config, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali id saluran tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan id plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika plugin terinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin.
- Jika config plugin ada tetapi plugin **dinonaktifkan**, config tersebut tetap disimpan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan filesystem lokal. Runtime tetap memuat modul plugin secara terpisah; manifest hanya untuk discovery + validasi.
- Manifest native di-parse dengan JSON5, sehingga komentar, trailing comma, dan kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifest yang terdokumentasi yang dibaca oleh manifest loader. Hindari kunci tingkat atas kustom.
- `channels`, `providers`, `cliBackends`, dan `skills` semuanya dapat dihilangkan saat plugin tidak memerlukannya.
- `providerDiscoveryEntry` harus tetap ringan dan tidak boleh mengimpor kode runtime yang luas; gunakan untuk metadata katalog provider statis atau deskriptor discovery sempit, bukan eksekusi saat permintaan.
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`: `kind: "memory"` melalui `plugins.slots.memory`, `kind: "context-engine"` melalui `plugins.slots.contextEngine` (default `legacy`).
- Metadata env-var (`setup.providers[].envVars`, `providerAuthEnvVars` yang deprecated, dan `channelEnvVars`) hanya bersifat deklaratif. Status, audit, validasi pengiriman Cron, dan permukaan read-only lainnya tetap menerapkan trust plugin dan kebijakan aktivasi efektif sebelum memperlakukan env var sebagai terkonfigurasi.
- Untuk metadata wizard runtime yang memerlukan kode provider, lihat [Hook runtime provider](/id/plugins/architecture-internals#provider-runtime-hooks).
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist package-manager apa pun (misalnya, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Terkait

<CardGroup cols={3}>
  <Card title="Membangun Plugin" href="/id/plugins/building-plugins" icon="rocket">
    Memulai dengan Plugin.
  </Card>
  <Card title="Arsitektur Plugin" href="/id/plugins/architecture" icon="diagram-project">
    Arsitektur internal dan model capability.
  </Card>
  <Card title="Ikhtisar SDK" href="/id/plugins/sdk-overview" icon="book">
    Referensi Plugin SDK dan impor subpath.
  </Card>
</CardGroup>
