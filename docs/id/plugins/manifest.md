---
read_when:
    - Anda sedang membangun Plugin OpenClaw
    - Anda perlu mengirim schema config Plugin atau men-debug error validasi Plugin
summary: Manifest Plugin + persyaratan schema JSON (validasi config ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-23T09:24:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifest Plugin OpenClaw native**.

Untuk layout bundle yang kompatibel, lihat [Plugin bundles](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau layout komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis layout bundle tersebut, tetapi tidak divalidasi
terhadap schema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat layout-nya cocok
dengan ekspektasi runtime OpenClaw.

Setiap Plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root Plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode Plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error Plugin dan memblokir validasi config.

Lihat panduan sistem Plugin lengkap: [Plugins](/id/tools/plugin).
Untuk model capability native dan panduan kompatibilitas eksternal saat ini:
[Capability model](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode Plugin Anda.

Gunakan untuk:

- identitas Plugin
- validasi config
- metadata auth dan onboarding yang harus tersedia tanpa mem-boot runtime Plugin
- petunjuk aktivasi murah yang dapat diperiksa surface control-plane sebelum runtime
  dimuat
- deskriptor penyiapan murah yang dapat diperiksa surface setup/onboarding sebelum
  runtime dimuat
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime Plugin dimuat
- metadata kepemilikan keluarga model shorthand yang harus mengaktifkan otomatis
  Plugin sebelum runtime dimuat
- snapshot kepemilikan capability statis yang digunakan untuk wiring kompat bawaan dan
  cakupan kontrak
- metadata QA runner murah yang dapat diperiksa host bersama `openclaw qa`
  sebelum runtime Plugin dimuat
- metadata config khusus channel yang harus digabungkan ke surface katalog dan validasi
  tanpa memuat runtime
- hint UI config

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Hal-hal tersebut berada di kode Plugin Anda dan `package.json`.

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

## Referensi field level atas

| Field                                | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                                           |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ya       | `string`                         | id Plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                                        |
| `configSchema`                       | Ya       | `object`                         | JSON Schema inline untuk config Plugin ini.                                                                                                                                                                                        |
| `enabledByDefault`                   | Tidak    | `true`                           | Menandai Plugin bawaan sebagai aktif secara default. Hilangkan field ini, atau setel ke nilai apa pun selain `true`, agar Plugin tetap nonaktif secara default.                                                                 |
| `legacyPluginIds`                    | Tidak    | `string[]`                       | id lama yang dinormalisasi ke id Plugin kanonis ini.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | Tidak    | `string[]`                       | id provider yang harus mengaktifkan otomatis Plugin ini saat auth, config, atau ref model menyebutnya.                                                                                                                            |
| `kind`                               | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis Plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                                                     |
| `channels`                           | Tidak    | `string[]`                       | id channel yang dimiliki oleh Plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                                          |
| `providers`                          | Tidak    | `string[]`                       | id provider yang dimiliki oleh Plugin ini.                                                                                                                                                                                         |
| `modelSupport`                       | Tidak    | `object`                         | Metadata keluarga model shorthand milik manifest yang digunakan untuk memuat otomatis Plugin sebelum runtime.                                                                                                                     |
| `providerEndpoints`                  | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute provider yang harus diklasifikasikan core sebelum runtime provider dimuat.                                                                                              |
| `cliBackends`                        | Tidak    | `string[]`                       | id backend inferensi CLI yang dimiliki oleh Plugin ini. Digunakan untuk auto-aktivasi saat startup dari ref config eksplisit.                                                                                                    |
| `syntheticAuthRefs`                  | Tidak    | `string[]`                       | Ref provider atau backend CLI yang hook auth sintetis milik Plugin-nya harus di-probe selama discovery model dingin sebelum runtime dimuat.                                                                                      |
| `nonSecretAuthMarkers`               | Tidak    | `string[]`                       | Nilai placeholder API key milik Plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                                            |
| `commandAliases`                     | Tidak    | `object[]`                       | Nama perintah yang dimiliki oleh Plugin ini yang harus menghasilkan diagnostik config dan CLI yang sadar Plugin sebelum runtime dimuat.                                                                                           |
| `providerAuthEnvVars`                | Tidak    | `Record<string, string[]>`       | Metadata env auth provider murah yang dapat diperiksa OpenClaw tanpa memuat kode Plugin.                                                                                                                                          |
| `providerAuthAliases`                | Tidak    | `Record<string, string>`         | id provider yang harus menggunakan kembali id provider lain untuk lookup auth, misalnya provider coding yang berbagi API key provider dasar dan profil auth.                                                                      |
| `channelEnvVars`                     | Tidak    | `Record<string, string[]>`       | Metadata env channel murah yang dapat diperiksa OpenClaw tanpa memuat kode Plugin. Gunakan ini untuk surface penyiapan channel atau auth berbasis env yang harus terlihat oleh helper startup/config generik.                  |
| `providerAuthChoices`                | Tidak    | `object[]`                       | Metadata pilihan auth murah untuk picker onboarding, resolusi preferred-provider, dan wiring flag CLI sederhana.                                                                                                                 |
| `activation`                         | Tidak    | `object`                         | Petunjuk aktivasi murah untuk pemuatan yang dipicu provider, perintah, channel, rute, dan capability. Hanya metadata; runtime Plugin tetap memiliki perilaku aktual.                                                            |
| `setup`                              | Tidak    | `object`                         | Deskriptor setup/onboarding murah yang dapat diperiksa surface discovery dan setup tanpa memuat runtime Plugin.                                                                                                                  |
| `qaRunners`                          | Tidak    | `object[]`                       | Deskriptor QA runner murah yang digunakan oleh host bersama `openclaw qa` sebelum runtime Plugin dimuat.                                                                                                                         |
| `contracts`                          | Tidak    | `object`                         | Snapshot capability bawaan statis untuk hook auth eksternal, speech, transkripsi realtime, voice realtime, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan alat. |
| `mediaUnderstandingProviderMetadata` | Tidak    | `Record<string, object>`         | Default media-understanding murah untuk id provider yang dideklarasikan di `contracts.mediaUnderstandingProviders`.                                                                                                              |
| `channelConfigs`                     | Tidak    | `Record<string, object>`         | Metadata config channel milik manifest yang digabungkan ke surface discovery dan validasi sebelum runtime dimuat.                                                                                                                |
| `skills`                             | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root Plugin.                                                                                                                                                                  |
| `name`                               | Tidak    | `string`                         | Nama Plugin yang dapat dibaca manusia.                                                                                                                                                                                             |
| `description`                        | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di surface Plugin.                                                                                                                                                                              |
| `version`                            | Tidak    | `string`                         | Versi Plugin informasional.                                                                                                                                                                                                        |
| `uiHints`                            | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan hint sensitivitas untuk field config.                                                                                                                                                                   |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | id provider tempat pilihan ini berada.                                                                   |
| `method`              | Ya       | `string`                                        | id metode auth yang akan dipanggil.                                                                      |
| `choiceId`            | Ya       | `string`                                        | id pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                      |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang terlihat oleh pengguna. Jika dihilangkan, OpenClaw fallback ke `choiceId`.                   |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk picker.                                                                       |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam picker interaktif yang digerakkan asisten.           |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.                  |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                |
| `groupId`             | Tidak    | `string`                                        | id grup opsional untuk mengelompokkan pilihan terkait.                                                   |
| `groupLabel`          | Tidak    | `string`                                        | Label yang terlihat oleh pengguna untuk grup tersebut.                                                   |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                                |
| `optionKey`           | Tidak    | `string`                                        | key opsi internal untuk alur auth satu-flag sederhana.                                                   |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                              |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Surface onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi `commandAliases`

Gunakan `commandAliases` saat sebuah Plugin memiliki nama perintah runtime yang mungkin
secara keliru dimasukkan pengguna ke `plugins.allow` atau coba dijalankan sebagai perintah CLI root. OpenClaw
menggunakan metadata ini untuk diagnostik tanpa mengimpor kode runtime Plugin.

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

| Field        | Wajib    | Tipe              | Artinya                                                                    |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki oleh Plugin ini.                               |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai slash command chat, bukan perintah CLI root.        |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.     |

## Referensi `activation`

Gunakan `activation` saat Plugin dapat secara murah mendeklarasikan event control-plane mana
yang harus mengaktifkannya nanti.

## Referensi `qaRunners`

Gunakan `qaRunners` saat sebuah Plugin menyumbang satu atau lebih transport runner di bawah
root bersama `openclaw qa`. Pertahankan metadata ini tetap murah dan statis; runtime Plugin
tetap memiliki pendaftaran CLI aktual melalui surface `runtime-api.ts`
ringan yang mengekspor `qaRunnerCliRegistrations`.

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

| Field         | Wajib    | Tipe     | Artinya                                                              |
| ------------- | -------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

Blok ini hanya metadata. Blok ini tidak mendaftarkan perilaku runtime, dan juga tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/Plugin lainnya.
Konsumen live saat ini menggunakannya sebagai hint penyempitan sebelum pemuatan Plugin yang lebih luas, jadi
metadata aktivasi yang hilang biasanya hanya berdampak pada performa; metadata itu seharusnya tidak
mengubah kebenaran selama fallback kepemilikan manifest lama masih ada.

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

| Field            | Wajib    | Tipe                                                 | Artinya                                                         |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Tidak    | `string[]`                                           | id provider yang harus mengaktifkan Plugin ini saat diminta.     |
| `onCommands`     | Tidak    | `string[]`                                           | id perintah yang harus mengaktifkan Plugin ini.                  |
| `onChannels`     | Tidak    | `string[]`                                           | id channel yang harus mengaktifkan Plugin ini.                   |
| `onRoutes`       | Tidak    | `string[]`                                           | jenis rute yang harus mengaktifkan Plugin ini.                   |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Hint capability luas yang digunakan oleh perencanaan aktivasi control-plane. |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah fallback ke
  `commandAliases[].cliCommand` atau `commandAliases[].name` lama
- perencanaan setup/channel yang dipicu channel fallback ke kepemilikan
  `channels[]` lama saat metadata aktivasi channel eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider fallback ke kepemilikan
  `providers[]` dan `cliBackends[]` level atas lama saat metadata aktivasi provider eksplisit tidak ada

## Referensi `setup`

Gunakan `setup` saat surface setup dan onboarding memerlukan metadata milik Plugin yang murah
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

`cliBackends` level atas tetap valid dan terus mendeskripsikan backend inferensi CLI.
`setup.cliBackends` adalah surface deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah
surface lookup descriptor-first yang dipilih untuk discovery setup. Jika deskriptor hanya
mempersempit kandidat Plugin dan setup masih memerlukan hook runtime waktu-setup
yang lebih kaya, setel `requiresRuntime: true` dan pertahankan `setup-api` sebagai
jalur eksekusi fallback.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik Plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
Plugin yang ditemukan. Kepemilikan yang ambigu gagal tertutup alih-alih memilih pemenang
berdasarkan urutan discovery.

### Referensi `setup.providers`

| Field         | Wajib    | Tipe       | Artinya                                                                              |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Ya       | `string`   | id provider yang diekspos selama setup atau onboarding. Jaga id yang dinormalisasi tetap unik secara global. |
| `authMethods` | Tidak    | `string[]` | id metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.          |
| `envVars`     | Tidak    | `string[]` | Env var yang dapat diperiksa surface setup/status generik sebelum runtime Plugin dimuat. |

### Field `setup`

| Field              | Wajib    | Tipe       | Artinya                                                                                         |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                             |
| `cliBackends`      | Tidak    | `string[]` | id backend waktu-setup yang digunakan untuk lookup setup descriptor-first. Jaga id yang dinormalisasi tetap unik secara global. |
| `configMigrations` | Tidak    | `string[]` | id migrasi config yang dimiliki oleh surface setup Plugin ini.                                   |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                   |

## Referensi `uiHints`

`uiHints` adalah map dari nama field config ke hint rendering kecil.

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

Setiap hint field dapat mencakup:

| Field         | Tipe       | Artinya                                |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Label field yang terlihat oleh pengguna. |
| `help`        | `string`   | Teks bantuan singkat.                  |
| `tags`        | `string[]` | Tag UI opsional.                       |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.       |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir. |

## Referensi `contracts`

Gunakan `contracts` hanya untuk metadata kepemilikan capability statis yang dapat
dibaca OpenClaw tanpa mengimpor runtime Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

| Field                            | Tipe       | Artinya                                                          |
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id runtime tersemat yang mungkin didaftarkan factory-nya oleh Plugin bawaan. |
| `externalAuthProviders`          | `string[]` | id provider yang hook profil auth eksternalnya dimiliki oleh Plugin ini. |
| `speechProviders`                | `string[]` | id provider speech yang dimiliki oleh Plugin ini.                |
| `realtimeTranscriptionProviders` | `string[]` | id provider transkripsi realtime yang dimiliki oleh Plugin ini.  |
| `realtimeVoiceProviders`         | `string[]` | id provider voice realtime yang dimiliki oleh Plugin ini.        |
| `mediaUnderstandingProviders`    | `string[]` | id provider media-understanding yang dimiliki oleh Plugin ini.   |
| `imageGenerationProviders`       | `string[]` | id provider image-generation yang dimiliki oleh Plugin ini.      |
| `videoGenerationProviders`       | `string[]` | id provider video-generation yang dimiliki oleh Plugin ini.      |
| `webFetchProviders`              | `string[]` | id provider web-fetch yang dimiliki oleh Plugin ini.             |
| `webSearchProviders`             | `string[]` | id provider web search yang dimiliki oleh Plugin ini.            |
| `tools`                          | `string[]` | Nama alat agen yang dimiliki oleh Plugin ini untuk pemeriksaan kontrak bawaan. |

Plugin provider yang mengimplementasikan `resolveExternalAuthProfiles` harus mendeklarasikan
`contracts.externalAuthProviders`. Plugin tanpa deklarasi tersebut tetap berjalan
melalui fallback kompatibilitas yang deprecated, tetapi fallback itu lebih lambat dan
akan dihapus setelah jendela migrasi.

## Referensi `mediaUnderstandingProviderMetadata`

Gunakan `mediaUnderstandingProviderMetadata` saat sebuah provider media-understanding memiliki
model default, prioritas fallback auto-auth, atau dukungan dokumen native yang
dibutuhkan helper core generik sebelum runtime dimuat. Key juga harus dideklarasikan di
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

| Field                  | Tipe                                | Artinya                                                                    |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capability media yang diekspos oleh provider ini.                          |
| `defaultModels`        | `Record<string, string>`            | Default capability-ke-model yang digunakan saat config tidak menentukan model. |
| `autoPriority`         | `Record<string, number>`            | Angka yang lebih rendah diurutkan lebih awal untuk fallback provider otomatis berbasis kredensial. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input dokumen native yang didukung oleh provider.                          |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat sebuah Plugin channel memerlukan metadata config yang murah sebelum
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

| Field         | Tipe                     | Artinya                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/hint sensitif opsional untuk bagian config channel tersebut.         |
| `label`       | `string`                 | Label channel yang digabungkan ke surface picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk surface inspect dan katalog.                              |
| `preferOver`  | `string[]`               | id Plugin lama atau berprioritas lebih rendah yang harus dikalahkan channel ini di surface pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan Plugin provider Anda dari
id model shorthand seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime Plugin
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

- ref `provider/model` eksplisit menggunakan metadata manifest `providers` pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu Plugin non-bawaan dan satu Plugin bawaan sama-sama cocok, Plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                      |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model shorthand.      |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah penghapusan sufiks profil. |

Key capability level atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field level atas tersebut sebagai
kepemilikan capability.

## Manifest versus package.json

Kedua file ini memiliki tugas yang berbeda:

| File                   | Gunakan untuk                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan auth, dan hint UI yang harus ada sebelum kode Plugin berjalan                     |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin sebuah metadata harus diletakkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode Plugin, letakkan di `openclaw.plugin.json`
- jika itu tentang packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field `package.json` yang memengaruhi discovery

Beberapa metadata Plugin pra-runtime sengaja berada di `package.json` di bawah blok
`openclaw` alih-alih `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint Plugin native. Harus tetap berada di dalam direktori paket Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket Plugin.                                         |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel yang ditunda, dan discovery status channel/SecretRef yang read-only. Harus tetap berada di dalam direktori paket Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk paket yang terinstal. Harus tetap berada di dalam direktori paket Plugin.                                           |
| `openclaw.channel`                                                | Metadata katalog channel murah seperti label, path dokumentasi, alias, dan teks pemilihan.                                                                                         |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab “apakah setup hanya-env sudah ada?” tanpa memuat runtime channel penuh.                                            |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa auth tersimpan yang ringan yang dapat menjawab “apakah sudah ada sesuatu yang signed in?” tanpa memuat runtime channel penuh.                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hint instalasi/pembaruan untuk Plugin bawaan dan Plugin yang dipublikasikan secara eksternal.                                                                                      |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi pilihan saat beberapa sumber instalasi tersedia.                                                                                                                    |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                  |
| `openclaw.install.expectedIntegrity`                              | String integritas dist npm yang diharapkan seperti `sha512-...`; alur instalasi dan pembaruan memverifikasi artefak yang diambil terhadap nilai ini.                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstalasi Plugin bawaan yang sempit saat config tidak valid.                                                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan surface channel khusus setup dimuat sebelum Plugin channel penuh selama startup.                                                                                       |

Metadata manifest menentukan pilihan provider/channel/setup mana yang muncul di
onboarding sebelum runtime dimuat. `package.json#openclaw.install` memberi tahu
onboarding cara mengambil atau mengaktifkan Plugin tersebut saat pengguna memilih salah satu
pilihan itu. Jangan memindahkan hint instalasi ke `openclaw.plugin.json`.

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registry manifest. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid akan melewati
Plugin pada host yang lebih lama.

Pin versi npm yang tepat sudah berada di `npmSpec`, misalnya
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Pasangkan itu dengan
`expectedIntegrity` saat Anda ingin alur pembaruan gagal tertutup jika artefak
npm yang diambil tidak lagi cocok dengan rilis yang dipin. Onboarding interaktif
menawarkan npm spec registry tepercaya, termasuk nama paket biasa dan dist-tag.
Saat `expectedIntegrity` ada, alur instalasi/pembaruan menegakkannya; saat field itu
dihilangkan, resolusi registry dicatat tanpa pin integritas.

Plugin channel harus menyediakan `openclaw.setupEntry` saat status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang sudah dikonfigurasi tanpa memuat runtime
penuh. Entri setup harus mengekspos metadata channel plus adapter config,
status, dan rahasia yang aman untuk setup; pertahankan klien jaringan, listener gateway, dan
runtime transport di entrypoint extension utama.

Field entrypoint runtime tidak menimpa pemeriksaan batas paket untuk source
field entrypoint. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar dari batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` memang sengaja sempit. Field ini
tidak membuat config rusak sembarang menjadi dapat diinstal. Saat ini field itu hanya mengizinkan alur instalasi untuk pulih dari kegagalan upgrade Plugin bawaan usang tertentu, seperti
path Plugin bawaan yang hilang atau entri `channels.<id>` usang untuk Plugin bawaan yang sama tersebut. Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata paket untuk modul checker
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
ya/tidak yang murah sebelum Plugin channel penuh dimuat. Target ekspor harus berupa
fungsi kecil yang hanya membaca status tersimpan; jangan rutekan melalui barrel
runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
hanya-env yang murah:

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

Gunakan ini saat sebuah channel dapat menjawab configured-state dari env atau input
kecil non-runtime lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime
channel yang sebenarnya, pertahankan logika itu di hook Plugin `config.hasConfiguredState`
sebagai gantinya.

## Prioritas discovery (id Plugin duplikat)

OpenClaw menemukan Plugin dari beberapa root (bawaan, instalasi global, workspace, path eksplisit yang dipilih config). Jika dua hasil discovery memiliki `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, tertinggi ke terendah:

1. **Dipilih config** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — Plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — Plugin yang diinstal ke root Plugin global OpenClaw
4. **Workspace** — Plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau usang dari Plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa Plugin bawaan dengan Plugin lokal, pin melalui `plugins.entries.<id>` agar ia menang berdasarkan prioritas, bukan mengandalkan discovery workspace.
- Pembuangan duplikat dicatat dalam log sehingga Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap Plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima config.
- Schema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Schema divalidasi pada saat baca/tulis config, bukan saat runtime.

## Perilaku validasi

- Key `channels.*` yang tidak dikenal adalah **error**, kecuali id channel tersebut dideklarasikan oleh
  manifest Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus merujuk id Plugin yang **dapat ditemukan**. id yang tidak dikenal adalah **error**.
- Jika sebuah Plugin terinstal tetapi memiliki manifest atau schema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error Plugin tersebut.
- Jika config Plugin ada tetapi Plugin tersebut **nonaktif**, config dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Configuration reference](/id/gateway/configuration) untuk schema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk Plugin OpenClaw native**, termasuk pemuatan sistem file lokal.
- Runtime tetap memuat modul Plugin secara terpisah; manifest hanya untuk
  discovery + validasi.
- Manifest native di-parse dengan JSON5, jadi komentar, trailing comma, dan
  key tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifest yang terdokumentasi yang dibaca oleh pemuat manifest. Hindari menambahkan
  key level atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata murah untuk probe auth, validasi
  penanda env, dan surface auth provider serupa yang tidak boleh mem-boot runtime Plugin
  hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan kembali auth
  env vars, profil auth, auth berbasis config, dan pilihan onboarding API key
  milik provider lain tanpa meng-hardcode hubungan tersebut di core.
- `providerEndpoints` memungkinkan Plugin provider memiliki metadata pencocokan
  host/baseUrl endpoint sederhana. Gunakan ini hanya untuk kelas endpoint yang sudah didukung core;
  Plugin tetap memiliki perilaku runtime.
- `syntheticAuthRefs` adalah jalur metadata murah untuk hook auth sintetis milik provider
  yang harus terlihat oleh discovery model dingin sebelum registry runtime
  ada. Hanya daftarkan ref yang provider runtime atau backend CLI-nya benar-benar
  mengimplementasikan `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` adalah jalur metadata murah untuk placeholder API key
  milik Plugin bawaan seperti penanda kredensial lokal, OAuth, atau ambient.
  Core memperlakukan ini sebagai non-rahasia untuk tampilan auth dan audit rahasia tanpa
  meng-hardcode provider pemilik.
- `channelEnvVars` adalah jalur metadata murah untuk fallback shell-env, prompt
  setup, dan surface channel serupa yang tidak boleh mem-boot runtime Plugin
  hanya untuk memeriksa nama env. Nama env adalah metadata, bukan aktivasi
  dengan sendirinya: status, audit, validasi pengiriman Cron, dan surface read-only
  lainnya tetap menerapkan kepercayaan Plugin dan kebijakan aktivasi efektif sebelum
  memperlakukan env var sebagai channel yang dikonfigurasi.
- `providerAuthChoices` adalah jalur metadata murah untuk picker pilihan auth,
  resolusi `--auth-choice`, pemetaan preferred-provider, dan pendaftaran flag CLI onboarding sederhana sebelum runtime provider dimuat. Untuk metadata wizard runtime
  yang memerlukan kode provider, lihat
  [Provider runtime hooks](/id/plugins/architecture#provider-runtime-hooks).
- Jenis Plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat sebuah
  Plugin tidak membutuhkannya.
- Jika Plugin Anda bergantung pada modul native, dokumentasikan langkah build dan semua
  persyaratan allowlist package manager (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — memulai dengan Plugins
- [Plugin Architecture](/id/plugins/architecture) — arsitektur internal
- [SDK Overview](/id/plugins/sdk-overview) — referensi SDK Plugin
