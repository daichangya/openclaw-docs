---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu mengirimkan skema konfigurasi plugin atau men-debug error validasi plugin
summary: Manifest Plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest Plugin (`openclaw.plugin.json`)

Halaman ini hanya untuk **manifest plugin OpenClaw native**.

Untuk layout bundle yang kompatibel, lihat [Plugin bundles](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau layout komponen Claude default
  tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis layout bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus
root Skills yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat layout-nya cocok
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi konfigurasi.

Lihat panduan sistem plugin lengkap: [Plugins](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Capability model](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata auth dan onboarding yang harus tersedia tanpa mem-boot runtime plugin
- petunjuk aktivasi ringan yang dapat diperiksa permukaan control-plane sebelum runtime
  dimuat
- deskriptor penyiapan ringan yang dapat diperiksa permukaan setup/onboarding sebelum
  runtime dimuat
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime plugin dimuat
- metadata kepemilikan keluarga model shorthand yang harus mengaktifkan otomatis
  plugin sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring kompatibilitas bawaan dan cakupan kontrak
- metadata QA runner ringan yang dapat diperiksa host bersama `openclaw qa`
  sebelum runtime plugin dimuat
- metadata konfigurasi khusus channel yang harus digabungkan ke katalog dan permukaan validasi tanpa memuat runtime
- petunjuk UI konfigurasi

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instal npm

Hal-hal tersebut berada di kode plugin Anda dan `package.json`.

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

| Field                               | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                      |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ya       | `string`                         | ID plugin kanonis. Ini adalah ID yang digunakan di `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | Ya       | `object`                         | JSON Schema inline untuk konfigurasi plugin ini.                                                                                                                                                             |
| `enabledByDefault`                  | Tidak    | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan, atau tetapkan nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                                      |
| `legacyPluginIds`                   | Tidak    | `string[]`                       | ID legacy yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Tidak    | `string[]`                       | ID provider yang harus mengaktifkan otomatis plugin ini saat auth, konfigurasi, atau referensi model menyebutkannya.                                                                                       |
| `kind`                              | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                               |
| `channels`                          | Tidak    | `string[]`                       | ID channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                                     |
| `providers`                         | Tidak    | `string[]`                       | ID provider yang dimiliki plugin ini.                                                                                                                                                                        |
| `modelSupport`                      | Tidak    | `object`                         | Metadata shorthand keluarga model milik manifest yang digunakan untuk memuat otomatis plugin sebelum runtime.                                                                                                |
| `providerEndpoints`                 | Tidak    | `object[]`                       | Metadata host/baseUrl endpoint milik manifest untuk rute provider yang harus diklasifikasikan inti sebelum runtime provider dimuat.                                                                         |
| `cliBackends`                       | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-aktivasi saat startup dari referensi konfigurasi eksplisit.                                                                         |
| `syntheticAuthRefs`                 | Tidak    | `string[]`                       | Referensi provider atau backend CLI yang hook auth sintetis milik pluginnya harus diprobe selama discovery model cold sebelum runtime dimuat.                                                               |
| `nonSecretAuthMarkers`              | Tidak    | `string[]`                       | Nilai API key placeholder milik plugin bawaan yang merepresentasikan status kredensial lokal, OAuth, atau ambient yang bukan rahasia.                                                                      |
| `commandAliases`                    | Tidak    | `object[]`                       | Nama perintah yang dimiliki plugin ini yang harus menghasilkan konfigurasi sadar-plugin dan diagnostik CLI sebelum runtime dimuat.                                                                          |
| `providerAuthEnvVars`               | Tidak    | `Record<string, string[]>`       | Metadata env auth provider ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                                    |
| `providerAuthAliases`               | Tidak    | `Record<string, string>`         | ID provider yang harus menggunakan ulang ID provider lain untuk lookup auth, misalnya provider coding yang berbagi API key dan profil auth provider dasar.                                                  |
| `channelEnvVars`                    | Tidak    | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk penyiapan channel berbasis env atau permukaan auth yang harus terlihat oleh helper startup/konfigurasi generik. |
| `providerAuthChoices`               | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk pemilih onboarding, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                            |
| `activation`                        | Tidak    | `object`                         | Petunjuk aktivasi ringan untuk pemuatan yang dipicu provider, perintah, channel, rute, dan kapabilitas. Hanya metadata; runtime plugin tetap memiliki perilaku sebenarnya.                                 |
| `setup`                             | Tidak    | `object`                         | Deskriptor penyiapan/onboarding ringan yang dapat diperiksa permukaan discovery dan setup tanpa memuat runtime plugin.                                                                                      |
| `qaRunners`                         | Tidak    | `object[]`                       | Deskriptor QA runner ringan yang digunakan oleh host bersama `openclaw qa` sebelum runtime plugin dimuat.                                                                                                   |
| `contracts`                         | Tidak    | `object`                         | Snapshot kapabilitas bawaan statis untuk speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `channelConfigs`                    | Tidak    | `Record<string, object>`         | Metadata konfigurasi channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                    |
| `skills`                            | Tidak    | `string[]`                       | Direktori Skills yang dimuat, relatif terhadap root plugin.                                                                                                                                                  |
| `name`                              | Tidak    | `string`                         | Nama plugin yang mudah dibaca manusia.                                                                                                                                                                       |
| `description`                       | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                      |
| `version`                           | Tidak    | `string`                         | Versi plugin informasional.                                                                                                                                                                                  |
| `uiHints`                           | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                                    |

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membaca ini sebelum runtime provider dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                   |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider tempat pilihan ini berada.                                                                    |
| `method`              | Ya       | `string`                                        | ID metode auth tujuan dispatch.                                                                           |
| `choiceId`            | Ya       | `string`                                        | ID auth-choice stabil yang digunakan oleh alur onboarding dan CLI.                                        |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna. Jika dihilangkan, OpenClaw fallback ke `choiceId`.                   |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk pemilih.                                                                       |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam pemilih interaktif yang digerakkan assistant.         |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari pemilih assistant sambil tetap mengizinkan pemilihan CLI manual.                |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan legacy yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                    |
| `groupLabel`          | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna untuk grup tersebut.                                                   |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup.                                                                          |
| `optionKey`           | Tidak    | `string`                                        | Key opsi internal untuk alur auth satu-flag sederhana.                                                    |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                            |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                               |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya adalah `["text-inference"]`. |

## Referensi commandAliases

Gunakan `commandAliases` saat plugin memiliki nama perintah runtime yang mungkin
secara keliru dimasukkan pengguna ke `plugins.allow` atau dicoba dijalankan sebagai perintah CLI root. OpenClaw
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

| Field        | Wajib    | Tipe              | Artinya                                                                 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ya       | `string`          | Nama perintah yang dimiliki plugin ini.                                 |
| `kind`       | Tidak    | `"runtime-slash"` | Menandai alias sebagai perintah slash chat, bukan perintah CLI root.    |
| `cliCommand` | Tidak    | `string`          | Perintah CLI root terkait yang disarankan untuk operasi CLI, jika ada.  |

## Referensi activation

Gunakan `activation` saat plugin dapat mendeklarasikan secara ringan peristiwa control-plane mana
yang nantinya harus mengaktifkannya.

## Referensi qaRunners

Gunakan `qaRunners` saat plugin menyumbangkan satu atau lebih runner transport di bawah
root bersama `openclaw qa`. Pertahankan metadata ini tetap ringan dan statis; runtime plugin
tetap memiliki registrasi CLI sebenarnya melalui permukaan
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

| Field         | Wajib    | Tipe     | Artinya                                                             |
| ------------- | -------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Ya       | `string` | Subperintah yang dipasang di bawah `openclaw qa`, misalnya `matrix`. |
| `description` | Tidak    | `string` | Teks bantuan fallback yang digunakan saat host bersama memerlukan perintah stub. |

Blok ini hanya metadata. Ini tidak mendaftarkan perilaku runtime, dan ini tidak
menggantikan `register(...)`, `setupEntry`, atau entrypoint runtime/plugin lainnya.
Konsumen live saat ini menggunakannya sebagai petunjuk penyempitan sebelum pemuatan plugin yang lebih luas, jadi
metadata activation yang hilang biasanya hanya berdampak pada performa; itu seharusnya tidak
mengubah kebenaran selama fallback kepemilikan manifest legacy masih ada.

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

| Field            | Wajib    | Tipe                                                 | Artinya                                                          |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Tidak    | `string[]`                                           | ID provider yang harus mengaktifkan plugin ini saat diminta.     |
| `onCommands`     | Tidak    | `string[]`                                           | ID perintah yang harus mengaktifkan plugin ini.                  |
| `onChannels`     | Tidak    | `string[]`                                           | ID channel yang harus mengaktifkan plugin ini.                   |
| `onRoutes`       | Tidak    | `string[]`                                           | Jenis rute yang harus mengaktifkan plugin ini.                   |
| `onCapabilities` | Tidak    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Petunjuk kapabilitas luas yang digunakan oleh perencanaan aktivasi control-plane. |

Konsumen live saat ini:

- perencanaan CLI yang dipicu perintah fallback ke legacy
  `commandAliases[].cliCommand` atau `commandAliases[].name`
- perencanaan setup/channel yang dipicu channel fallback ke kepemilikan legacy `channels[]`
  saat metadata aktivasi channel eksplisit tidak ada
- perencanaan setup/runtime yang dipicu provider fallback ke kepemilikan legacy
  `providers[]` dan `cliBackends[]` tingkat atas saat metadata aktivasi provider eksplisit
  tidak ada

## Referensi setup

Gunakan `setup` saat permukaan setup dan onboarding memerlukan metadata ringan milik plugin
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
`setup.cliBackends` adalah permukaan deskriptor khusus setup untuk
alur control-plane/setup yang harus tetap hanya metadata.

Jika ada, `setup.providers` dan `setup.cliBackends` adalah permukaan lookup
berbasis deskriptor yang disukai untuk discovery setup. Jika deskriptor hanya
menyempitkan kandidat plugin dan setup masih membutuhkan hook runtime saat setup yang lebih kaya,
tetapkan `requiresRuntime: true` dan biarkan `setup-api` tetap ada sebagai
path eksekusi fallback.

Karena lookup setup dapat mengeksekusi kode `setup-api` milik plugin, nilai
`setup.providers[].id` dan `setup.cliBackends[]` yang dinormalisasi harus tetap unik di seluruh
plugin yang ditemukan. Kepemilikan ambigu gagal tertutup alih-alih memilih
pemenang berdasarkan urutan discovery.

### Referensi setup.providers

| Field         | Wajib    | Tipe       | Artinya                                                                                 |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------- |
| `id`          | Ya       | `string`   | ID provider yang diekspos selama setup atau onboarding. Pertahankan ID ternormalisasi unik secara global. |
| `authMethods` | Tidak    | `string[]` | ID metode setup/auth yang didukung provider ini tanpa memuat runtime penuh.            |
| `envVars`     | Tidak    | `string[]` | Env vars yang dapat diperiksa permukaan setup/status generik sebelum runtime plugin dimuat. |

### Field setup

| Field              | Wajib    | Tipe       | Artinya                                                                                          |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | Tidak    | `object[]` | Deskriptor setup provider yang diekspos selama setup dan onboarding.                             |
| `cliBackends`      | Tidak    | `string[]` | ID backend saat setup yang digunakan untuk lookup setup berbasis deskriptor. Pertahankan ID ternormalisasi unik secara global. |
| `configMigrations` | Tidak    | `string[]` | ID migrasi konfigurasi yang dimiliki oleh permukaan setup plugin ini.                            |
| `requiresRuntime`  | Tidak    | `boolean`  | Apakah setup masih memerlukan eksekusi `setup-api` setelah lookup deskriptor.                    |

## Referensi uiHints

`uiHints` adalah map dari nama field konfigurasi ke petunjuk rendering kecil.

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

## Referensi contracts

Gunakan `contracts` hanya untuk metadata kepemilikan kapabilitas statis yang dapat
dibaca OpenClaw tanpa mengimpor runtime plugin.

```json
{
  "contracts": {
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

| Field                            | Tipe       | Artinya                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki plugin ini.                |
| `realtimeTranscriptionProviders` | `string[]` | ID provider realtime-transcription yang dimiliki plugin ini. |
| `realtimeVoiceProviders`         | `string[]` | ID provider realtime-voice yang dimiliki plugin ini.        |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki plugin ini.   |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki plugin ini.      |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki plugin ini.      |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki plugin ini.             |
| `webSearchProviders`             | `string[]` | ID provider web search yang dimiliki plugin ini.            |
| `tools`                          | `string[]` | Nama tool agent yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

## Referensi channelConfigs

Gunakan `channelConfigs` saat plugin channel memerlukan metadata konfigurasi ringan sebelum
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
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri konfigurasi channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholder/petunjuk sensitif opsional untuk bagian konfigurasi channel tersebut. |
| `label`       | `string`                 | Label channel yang digabungkan ke pemilih dan permukaan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspect dan katalog.                            |
| `preferOver`  | `string[]`               | ID plugin legacy atau prioritas lebih rendah yang harus dikalahkan channel ini di permukaan pemilihan. |

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin provider Anda dari
id model shorthand seperti `gpt-5.4` atau `claude-sonnet-4.6` sebelum runtime plugin
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

- referensi `provider/model` eksplisit menggunakan metadata manifest `providers` pemilik
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model shorthand.   |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah penghapusan sufiks profil. |

Key kapabilitas tingkat atas legacy sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal tidak lagi memperlakukan field tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifest versus package.json

Kedua file memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata auth-choice, dan petunjuk UI yang harus ada sebelum kode plugin berjalan               |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, pembatas instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin metadata harus ditempatkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instal npm, letakkan di `package.json`

### Field package.json yang memengaruhi discovery

Beberapa metadata plugin pra-runtime sengaja ditempatkan di `package.json` di bawah blok
`openclaw`, bukan `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native. Harus tetap berada di dalam direktori paket plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Mendeklarasikan entrypoint runtime JavaScript hasil build untuk paket yang diinstal. Harus tetap berada di dalam direktori paket plugin.                                          |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan selama onboarding, startup channel tertunda, dan discovery status channel/SecretRef yang hanya-baca. Harus tetap berada di dalam direktori paket plugin. |
| `openclaw.runtimeSetupEntry`                                      | Mendeklarasikan entrypoint setup JavaScript hasil build untuk paket yang diinstal. Harus tetap berada di dalam direktori paket plugin.                                             |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path docs, alias, dan copy pemilihan.                                                                                               |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah penyiapan hanya-env sudah ada?" tanpa memuat runtime channel penuh.                                        |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa auth persisted ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.                                                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instal/update untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                                                                        |
| `openclaw.install.defaultChoice`                                  | Path instalasi yang disukai saat beberapa sumber instal tersedia.                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan path pemulihan reinstalasi plugin bawaan yang sempit saat konfigurasi tidak valid.                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus setup dimuat sebelum plugin channel penuh saat startup.                                                                                      |

`openclaw.install.minHostVersion` diberlakukan selama instalasi dan pemuatan
registri manifest. Nilai yang tidak valid ditolak; nilai yang lebih baru tetapi valid
melewati plugin pada host yang lebih lama.

Plugin channel harus menyediakan `openclaw.setupEntry` saat status, daftar channel,
atau pemindaian SecretRef perlu mengidentifikasi akun yang dikonfigurasi tanpa memuat
runtime penuh. Entri setup harus mengekspos metadata channel ditambah adapter
konfigurasi, status, dan secret yang aman untuk setup; pertahankan klien jaringan, listener gateway, dan
runtime transport di entrypoint extension utama.

Field entrypoint runtime tidak menggantikan pemeriksaan batas paket untuk source
entrypoint fields. Misalnya, `openclaw.runtimeExtensions` tidak dapat membuat
path `openclaw.extensions` yang keluar batas menjadi dapat dimuat.

`openclaw.install.allowInvalidConfigRecovery` sengaja sempit. Ini tidak
membuat konfigurasi rusak sembarang menjadi bisa diinstal. Saat ini ini hanya mengizinkan alur instalasi untuk pulih dari kegagalan upgrade plugin bawaan basi tertentu, seperti
path plugin bawaan yang hilang atau entri `channels.<id>` basi untuk plugin
bawaan yang sama. Error konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
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

Gunakan saat alur setup, doctor, atau configured-state memerlukan probe auth ya/tidak yang ringan
sebelum plugin channel penuh dimuat. Ekspor target harus berupa fungsi kecil
yang hanya membaca status persisted; jangan arahkan melalui barrel runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
hanya-env yang ringan:

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

Gunakan saat sebuah channel dapat menjawab configured-state dari env atau input kecil lain
yang non-runtime. Jika pemeriksaan memerlukan resolusi konfigurasi penuh atau runtime
channel yang sebenarnya, pertahankan logika tersebut di hook plugin `config.hasConfiguredState`.

## Prioritas discovery (ID plugin duplikat)

OpenClaw menemukan plugin dari beberapa root (bawaan, instalasi global, workspace, path yang dipilih secara eksplisit dalam konfigurasi). Jika dua hasil discovery berbagi `id` yang sama, hanya manifest dengan **prioritas tertinggi** yang dipertahankan; duplikat dengan prioritas lebih rendah dibuang alih-alih dimuat berdampingan.

Prioritas, dari tertinggi ke terendah:

1. **Dipilih dalam konfigurasi** — path yang dipin secara eksplisit di `plugins.entries.<id>`
2. **Bawaan** — plugin yang dikirim bersama OpenClaw
3. **Instalasi global** — plugin yang diinstal ke root plugin OpenClaw global
4. **Workspace** — plugin yang ditemukan relatif terhadap workspace saat ini

Implikasi:

- Salinan fork atau basi dari plugin bawaan yang berada di workspace tidak akan membayangi build bawaan.
- Untuk benar-benar menimpa plugin bawaan dengan plugin lokal, pin melalui `plugins.entries.<id>` agar menang berdasarkan prioritas alih-alih mengandalkan discovery workspace.
- Duplikat yang dibuang dicatat ke log agar Doctor dan diagnostik startup dapat menunjuk ke salinan yang dibuang.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi pada waktu baca/tulis konfigurasi, bukan saat runtime.

## Perilaku validasi

- Key `channels.*` yang tidak dikenal adalah **error**, kecuali id channel tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan ID plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **error**.
- Jika plugin diinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin tersebut.
- Jika konfigurasi plugin ada tetapi plugin **dinonaktifkan**, konfigurasi tetap dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Configuration reference](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifest **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya untuk
  discovery + validasi.
- Manifest native di-parse dengan JSON5, sehingga komentar, trailing comma, dan
  key tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifest yang didokumentasikan yang dibaca oleh manifest loader. Hindari menambahkan
  key tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah path metadata ringan untuk probe auth, validasi env-marker,
  dan permukaan auth provider serupa yang tidak boleh mem-boot runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian provider menggunakan ulang env vars auth,
  profil auth, auth berbasis konfigurasi, dan pilihan onboarding API key milik provider lain
  tanpa meng-hardcode hubungan tersebut di inti.
- `providerEndpoints` memungkinkan plugin provider memiliki metadata pencocokan host/baseUrl endpoint
  sederhana. Gunakan hanya untuk kelas endpoint yang sudah didukung inti;
  plugin tetap memiliki perilaku runtime.
- `syntheticAuthRefs` adalah path metadata ringan untuk hook auth sintetis
  milik provider yang harus terlihat oleh discovery model cold sebelum registri
  runtime ada. Hanya cantumkan referensi yang provider runtime atau backend CLI-nya benar-benar
  mengimplementasikan `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` adalah path metadata ringan untuk placeholder API key
  milik plugin bawaan seperti penanda kredensial lokal, OAuth, atau ambient.
  Inti memperlakukan ini sebagai non-rahasia untuk tampilan auth dan audit secret tanpa
  meng-hardcode provider pemiliknya.
- `channelEnvVars` adalah path metadata ringan untuk fallback shell-env, prompt
  setup, dan permukaan channel serupa yang tidak boleh mem-boot runtime plugin
  hanya untuk memeriksa nama env. Nama env adalah metadata, bukan aktivasi
  dengan sendirinya: status, audit, validasi pengiriman Cron, dan permukaan hanya-baca lainnya
  tetap menerapkan kebijakan kepercayaan plugin dan aktivasi efektif sebelum
  memperlakukan env var sebagai channel yang dikonfigurasi.
- `providerAuthChoices` adalah path metadata ringan untuk pemilih auth-choice,
  resolusi `--auth-choice`, pemetaan provider pilihan, dan registrasi flag CLI
  onboarding sederhana sebelum runtime provider dimuat. Untuk metadata wizard
  runtime yang memerlukan kode provider, lihat
  [Provider runtime hooks](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak memerlukannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan
  persyaratan allowlist package-manager (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — memulai dengan plugin
- [Plugin Architecture](/id/plugins/architecture) — arsitektur internal
- [SDK Overview](/id/plugins/sdk-overview) — referensi SDK Plugin
