---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu mengirimkan skema konfigurasi plugin atau men-debug kesalahan validasi plugin
summary: Persyaratan manifes Plugin + skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-04-22T09:14:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifes Plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifes plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Bundle plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifes yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude default
  tanpa manifes
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi tata letak bundle tersebut secara otomatis, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle beserta root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan paket hook yang didukung saat tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
kesalahan plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem plugin: [Plugin](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat kode
plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata auth dan onboarding yang harus tersedia tanpa menjalankan runtime plugin
- petunjuk aktivasi ringan yang dapat diperiksa oleh permukaan control-plane sebelum runtime dimuat
- deskriptor penyiapan ringan yang dapat diperiksa oleh permukaan setup/onboarding sebelum
  runtime dimuat
- metadata alias dan auto-enable yang harus diselesaikan sebelum runtime plugin dimuat
- metadata kepemilikan shorthand model-family yang harus mengaktifkan plugin secara otomatis
  sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring kompatibilitas bundle
  dan cakupan kontrak
- metadata runner QA ringan yang dapat diperiksa oleh host bersama `openclaw qa`
  sebelum runtime plugin dimuat
- metadata konfigurasi khusus channel yang harus digabungkan ke dalam permukaan katalog dan validasi
  tanpa memuat runtime
- petunjuk UI konfigurasi

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Hal-hal tersebut termasuk dalam kode plugin Anda dan `package.json`.

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
  "description": "OpenRouter provider plugin",
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
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

| Field                                | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                      |
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Ya       | `string`                         | ID plugin kanonis. Ini adalah ID yang digunakan dalam `plugins.entries.<id>`.                                                                                                                               |
| `configSchema`                       | Ya       | `object`                         | JSON Schema inline untuk konfigurasi plugin ini.                                                                                                                                                             |
| `enabledByDefault`                   | Tidak    | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan field ini, atau tetapkan nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                            |
| `legacyPluginIds`                    | Tidak    | `string[]`                       | ID lama yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                       | ID provider yang harus otomatis mengaktifkan plugin ini ketika auth, konfigurasi, atau referensi model menyebutkannya.                                                                                     |
| `kind`                               | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                               |
| `channels`                           | Tidak    | `string[]`                       | ID channel yang dimiliki oleh plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                               |
| `providers`                          | Tidak    | `string[]`                       | ID provider yang dimiliki oleh plugin ini.                                                                                                                                                                   |
| `modelSupport`                       | Tidak    | `object`                         | Metadata shorthand model-family milik manifes yang digunakan untuk memuat plugin secara otomatis sebelum runtime.                                                                                           |
| `providerEndpoints`                  | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifes untuk rute provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                          |
| `cliBackends`                        | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki oleh plugin ini. Digunakan untuk aktivasi otomatis saat startup dari referensi konfigurasi eksplisit.                                                               |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                       | Referensi provider atau backend CLI yang hook auth sintetis milik pluginnya harus diperiksa selama discovery model cold sebelum runtime dimuat.                                                            |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                       | Nilai placeholder API key milik plugin bawaan yang merepresentasikan status kredensial non-rahasia lokal, OAuth, atau ambient.                                                                             |
| `commandAliases`                     | Tidak    | `object[]`                       | Nama perintah yang dimiliki oleh plugin ini dan harus menghasilkan diagnostik konfigurasi serta CLI yang sadar-plugin sebelum runtime dimuat.                                                               |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`       | Metadata env auth provider ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                                   |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`         | ID provider yang harus menggunakan ulang ID provider lain untuk pencarian auth, misalnya provider coding yang berbagi API key provider dasar dan profil auth yang sama.                                     |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk permukaan setup atau auth channel berbasis env yang perlu terlihat oleh helper startup/konfigurasi generik. |
| `providerAuthChoices`                | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk pemilih onboarding, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                           |
| `activation`                         | Tidak    | `object`                         | Petunjuk aktivasi ringan untuk pemuatan yang dipicu provider, perintah, channel, rute, dan kapabilitas. Hanya metadata; runtime plugin tetap memiliki perilaku sebenarnya.                                 |
| `setup`                              | Tidak    | `object`                         | Deskriptor setup/onboarding ringan yang dapat diperiksa oleh permukaan discovery dan setup tanpa memuat runtime plugin.                                                                                    |
| `qaRunners`                          | Tidak    | `object[]`                       | Deskriptor runner QA ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime plugin dimuat.                                                                                                  |
| `contracts`                          | Tidak    | `object`                         | Snapshot kapabilitas bawaan statis untuk kepemilikan speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan tool. |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`         | Default media-understanding ringan untuk ID provider yang dideklarasikan dalam `contracts.mediaUnderstandingProviders`.                                                                                     |
| `channelConfigs`                     | Tidak    | `Record<string, object>`         | Metadata konfigurasi channel milik manifes yang digabungkan ke dalam permukaan discovery dan validasi sebelum runtime dimuat.                                                                              |
| `skills`                             | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                            |
| `name`                               | Tidak    | `string`                         | Nama plugin yang mudah dibaca manusia.                                                                                                                                                                       |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                      |
| `version`                            | Tidak    | `string`                         | Versi plugin informatif.                                                                                                                                                                                     |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                                    |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membaca ini sebelum runtime provider dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider yang memiliki pilihan ini.                                                                  |
| `method`              | Ya       | `string`                                        | ID metode auth yang akan digunakan untuk dispatch.                                                      |
| `choiceId`            | Ya       | `string`                                        | ID pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                     |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna. Jika dihilangkan, OpenClaw akan menggunakan `choiceId`.            |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                     |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan oleh asisten.    |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih asisten sambil tetap mengizinkan pemilihan manual melalui CLI.        |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan yang terkait.                                             |
| `groupLabel`          | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna untuk grup tersebut.                                                 |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                               |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur auth satu-flag sederhana.                                                |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                             |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah plugin memiliki nama perintah runtime yang
mungkin keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai
perintah CLI root. OpenClaw menggunakan metadata ini untuk diagnostik tanpa
mengimpor kode runtime plugin.

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

| Field        | Wajib    | Tipe              | Artinya                                                                      |
| ------------ | -------- | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki oleh plugin ini.                                 |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.         |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang dapat disarankan untuk operasi CLI, jika ada. |

## Referensi `activation`

Gunakan `activation` ketika plugin dapat mendeklarasikan secara ringan peristiwa control-plane mana
yang harus mengaktifkannya nanti.

## Referensi `qaRunners`

Gunakan `qaRunners` ketika sebuah plugin menyumbangkan satu atau lebih runner transport di bawah
root bersama `openclaw qa`. Jaga metadata ini tetap ringan dan statis; runtime
plugin tetap memiliki registrasi CLI yang sebenarnya melalui permukaan
`runtime-api.ts` ringan yang mengekspor `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Jalankan lane QA live Matrix berbasis Docker terhadap homeserver sekali pakai"
    }
  ]
}
```

| Field         | Wajib    | Tipe     | Artinya                                                                |
| ------------- | -------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`.   |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, jadi
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; seharusnya tidak
mengubah kebenaran selama fallback kepemilikan manifes lama masih ada.

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

| Field            | Wajib    | Tipe                                                 | Artinya                                                            |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Tidak    | `string[]`                                           | ID provider yang harus mengaktifkan plugin ini saat diminta.       |
| `onCommands`     | Tidak    | `string[]`                                           | ID perintah yang harus mengaktifkan plugin ini.                    |
| `onChannels`     | Tidak    | `string[]`                                           | ID channel yang harus mengaktifkan plugin ini.                     |
| `onRoutes`       | Tidak    | `string[]`                                           | Jenis rute yang harus mengaktifkan plugin ini.                     |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas umum yang digunakan oleh perencanaan aktivasi control-plane. |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah melakukan fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan setup/channel yang dipicu channel melakukan fallback ke kepemilikan
  `channels[]` lama saat metadata aktivasi channel eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider melakukan fallback ke kepemilikan
  `providers[]` dan `cliBackends[]` tingkat atas lama saat metadata aktivasi provider eksplisit
  tidak ada

## Referensi `setup`

Gunakan `setup` ketika permukaan setup dan onboarding memerlukan metadata milik plugin yang ringan
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

`cliBackends` tingkat atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah permukaan deskriptor khusus setup untuk alur
control-plane/setup yang harus tetap hanya metadata.

Saat ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
descriptor-first yang lebih disukai untuk discovery setup. Jika deskriptor hanya
mempersempit kandidat plugin dan setup masih memerlukan hook runtime waktu-setup yang lebih kaya,
tetapkan `requiresRuntime: true` dan biarkan `setup-api` tetap ada sebagai jalur eksekusi fallback.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik plugin, nilai yang dinormalisasi
dari `setup.providers[].id` dan `setup.cliBackends[]` harus tetap unik di seluruh
plugin yang ditemukan. Kepemilikan yang ambigu akan gagal tertutup alih-alih memilih
pemenang berdasarkan urutan discovery.

### Referensi `setup.providers`

| Field         | Wajib    | Tipe       | Artinya                                                                               |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Ya       | `string`   | ID provider yang diekspos selama setup atau onboarding. Jaga ID yang dinormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | ID metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.          |
| `envVars`     | Tidak    | `string[]` | Variabel env yang dapat diperiksa oleh permukaan setup/status generik sebelum runtime plugin dimuat. |

### Field `setup`

| Field              | Wajib    | Tipe       | Artinya                                                                                              |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                                 |
| `cliBackends`      | Tidak    | `string[]` | ID backend waktu-setup yang digunakan untuk lookup setup descriptor-first. Jaga ID yang dinormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | ID migrasi konfigurasi yang dimiliki oleh permukaan setup plugin ini.                                |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                        |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field konfigurasi ke petunjuk rendering kecil.

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
| `label`       | `string`   | Label field yang ditampilkan ke pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                    |
| `tags`        | `string[]` | Tag UI opsional.                         |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.         |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.   |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat
dibaca OpenClaw tanpa mengimpor runtime plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| Field                            | Tipe       | Artinya                                                           |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID runtime tersemat tempat plugin bawaan dapat mendaftarkan factory. |
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki plugin ini.                      |
| `realtimeTranscriptionProviders` | `string[]` | ID provider realtime-transcription yang dimiliki plugin ini.      |
| `realtimeVoiceProviders`         | `string[]` | ID provider realtime-voice yang dimiliki plugin ini.              |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki plugin ini.         |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki plugin ini.            |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki plugin ini.            |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki plugin ini.                   |
| `webSearchProviders`             | `string[]` | ID provider web search yang dimiliki plugin ini.                  |
| `tools`                          | `string[]` | Nama tool agent yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

## Referensi `mediaUnderstandingProviderMetadata`

Gunakan `mediaUnderstandingProviderMetadata` ketika provider media-understanding memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
diperlukan helper generik core sebelum runtime dimuat. Kunci juga harus dideklarasikan di
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

| Field                  | Tipe                                | Artinya                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Kapabilitas media yang diekspos oleh provider ini.                           |
| `defaultModels`        | `Record<string, string>`            | Default kapabilitas-ke-model yang digunakan saat konfigurasi tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback provider otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh provider.                            |

## Referensi `channelConfigs`

Gunakan `channelConfigs` ketika plugin channel memerlukan metadata konfigurasi ringan sebelum
runtime dimuat.

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
          "label": "URL Homeserver",
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

Setiap entri channel dapat mencakup:

| Field         | Tipe                     | Artinya                                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke dalam permukaan pemilih dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspect dan katalog.                           |
| `preferOver`  | `string[]`               | ID plugin lama atau prioritas lebih rendah yang harus dikalahkan channel ini di permukaan pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` ketika OpenClaw harus menyimpulkan plugin provider Anda dari
ID model shorthand seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime plugin
dimuat.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw menerapkan prioritas berikut:

- referensi eksplisit `provider/model` menggunakan metadata manifes `providers` yang memilikinya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap ID model shorthand.       |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model shorthand setelah penghapusan sufiks profil. |

Kunci kapabilitas lama tingkat atas sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifes normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifes versus package.json

Kedua file memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan               |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin metadata harus ditempatkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata plugin pra-runtime memang sengaja ditempatkan di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang diinstal. Harus tetap berada di dalam direktori paket plugin.                                          |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel yang ditunda, dan discovery status channel/SecretRef hanya-baca. Harus tetap berada di dalam direktori paket plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk paket yang diinstal. Harus tetap berada di dalam direktori paket plugin.                                             |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path dokumentasi, alias, dan teks pemilihan.                                                                                        |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah setup hanya-env sudah ada?" tanpa memuat runtime channel penuh.                                             |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa persisted-auth ringan yang dapat menjawab "apakah ada yang sudah login?" tanpa memuat runtime channel penuh.                                                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                                                                  |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi pilihan saat beberapa sumber instalasi tersedia.                                                                                                                    |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstall plugin bawaan yang sempit saat konfigurasi tidak valid.                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh saat startup.                                                                                       |

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan registry
manifes. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

Plugin channel harus menyediakan `openclaw.setupEntry` ketika status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang sudah dikonfigurasi tanpa memuat
runtime penuh. Entri setup harus mengekspos metadata channel beserta adapter konfigurasi,
status, dan secret yang aman untuk setup; simpan klien jaringan, listener Gateway, dan
runtime transport di entrypoint extension utama.

Field entrypoint runtime tidak menggantikan pemeriksaan batas paket untuk field
entrypoint sumber. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini tidak
membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini, ini hanya memungkinkan
alur instalasi memulihkan kegagalan upgrade plugin bawaan usang tertentu, seperti
path plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin bawaan
yang sama. Kesalahan konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata paket untuk modul pemeriksa
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

Gunakan ini saat alur setup, doctor, atau configured-state memerlukan probe auth
ya/tidak yang ringan sebelum plugin channel penuh dimuat. Ekspor target harus berupa
fungsi kecil yang hanya membaca status yang dipersistenkan; jangan arahkan melalui barrel
runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
khusus env yang ringan:

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

Gunakan ini ketika sebuah channel dapat menjawab configured-state dari env atau input kecil
non-runtime lainnya. Jika pemeriksaan memerlukan resolusi konfigurasi penuh atau runtime
channel yang sebenarnya, simpan logika tersebut dalam hook plugin `config.hasConfiguredState`
sebagai gantinya.

## Prioritas discovery (ID plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bawaan, instalasi global, workspace, path eksplisit yang dipilih oleh konfigurasi). Jika dua hasil discovery memiliki `id` yang sama, hanya manifes dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih konfigurasi** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — plugin yang diinstal ke root plugin OpenClaw global
4. **Workspace** — plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan bercabang atau usang dari plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar mengganti plugin bawaan dengan plugin lokal, pin plugin itu melalui `plugins.entries.<id>` agar menang berdasarkan prioritas, bukan mengandalkan discovery workspace.
- Pembuangan duplikat dicatat dalam log agar Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat baca/tulis konfigurasi, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **kesalahan**, kecuali ID channel tersebut dideklarasikan oleh
  manifes plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan ID plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **kesalahan**.
- Jika plugin terinstal tetapi memiliki manifes atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan kesalahan plugin.
- Jika konfigurasi plugin ada tetapi pluginnya **dinonaktifkan**, konfigurasi tetap disimpan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema lengkap `plugins.*`.

## Catatan

- Manifes **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifes hanya untuk
  discovery + validasi.
- Manifes native diurai dengan JSON5, jadi komentar, trailing comma, dan
  kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari menambahkan
  kunci tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe auth, validasi
  penanda env, dan permukaan auth provider serupa yang tidak boleh menyalakan runtime
  plugin hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan ulang variabel env auth,
  profil auth, auth berbasis konfigurasi, dan pilihan onboarding API key provider lain
  tanpa meng-hardcode hubungan tersebut di core.
- `providerEndpoints` memungkinkan plugin provider memiliki metadata pencocokan
  host/baseUrl endpoint sederhana. Gunakan hanya untuk kelas endpoint yang sudah didukung core;
  plugin tetap memiliki perilaku runtime.
- `syntheticAuthRefs` adalah jalur metadata ringan untuk hook auth sintetis milik provider
  yang harus terlihat oleh discovery model cold sebelum registry runtime ada.
  Daftarkan hanya referensi yang provider runtime atau backend CLI-nya benar-benar
  mengimplementasikan `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` adalah jalur metadata ringan untuk placeholder API key milik plugin bawaan
  seperti penanda kredensial lokal, OAuth, atau ambient.
  Core memperlakukan ini sebagai non-rahasia untuk tampilan auth dan audit secret tanpa
  meng-hardcode provider pemiliknya.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env, prompt setup,
  dan permukaan channel serupa yang tidak boleh menyalakan runtime plugin
  hanya untuk memeriksa nama env. Nama env adalah metadata, bukan aktivasi
  dengan sendirinya: status, audit, validasi pengiriman Cron, dan permukaan hanya-baca
  lainnya tetap menerapkan trust plugin dan kebijakan aktivasi efektif sebelum
  mereka memperlakukan variabel env sebagai channel yang dikonfigurasi.
- `providerAuthChoices` adalah jalur metadata ringan untuk pemilih pilihan auth,
  resolusi `--auth-choice`, pemetaan provider pilihan, dan registrasi flag CLI onboarding
  sederhana sebelum runtime provider dimuat. Untuk metadata wizard runtime
  yang memerlukan kode provider, lihat
  [Hook runtime provider](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak membutuhkannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan persyaratan allowlist
  package manager apa pun (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — memulai dengan plugin
- [Arsitektur Plugin](/id/plugins/architecture) — arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
