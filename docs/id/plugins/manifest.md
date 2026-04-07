---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu merilis skema config plugin atau men-debug error validasi plugin
summary: Manifest plugin + persyaratan skema JSON (validasi config ketat)
title: Manifest Plugin
x-i18n:
    generated_at: "2026-04-07T09:16:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest plugin (openclaw.plugin.json)

Halaman ini hanya untuk **manifest plugin OpenClaw native**.

Untuk tata letak bundle yang kompatibel, lihat [Plugin bundles](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifest yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau tata letak komponen Claude
  default tanpa manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis tata letak bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle plus root
skill yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan hook pack yang didukung saat tata letaknya cocok
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifest ini untuk memvalidasi konfigurasi
**tanpa mengeksekusi kode plugin**. Manifest yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi config.

Lihat panduan lengkap sistem plugin: [Plugins](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Capability model](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat kode
plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi config
- metadata auth dan onboarding yang harus tersedia tanpa menjalankan runtime
  plugin
- metadata alias dan auto-enable yang harus di-resolve sebelum runtime plugin dimuat
- metadata kepemilikan shorthand model-family yang seharusnya mengaktifkan
  plugin secara otomatis sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring kompatibilitas
  bawaan dan cakupan kontrak
- metadata config khusus channel yang harus digabungkan ke permukaan katalog dan validasi
  tanpa memuat runtime
- petunjuk UI config

Jangan gunakan untuk:

- mendaftarkan perilaku runtime
- mendeklarasikan entrypoint kode
- metadata instalasi npm

Hal-hal tersebut milik kode plugin Anda dan `package.json`.

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Kunci API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Kunci API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Kunci API",
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

| Field                               | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                     |
| ----------------------------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Ya       | `string`                         | ID plugin kanonis. Ini adalah ID yang digunakan di `plugins.entries.<id>`.                                                                                                                                 |
| `configSchema`                      | Ya       | `object`                         | JSON Schema inline untuk config plugin ini.                                                                                                                                                                 |
| `enabledByDefault`                  | Tidak    | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan, atau atur ke nilai selain `true`, agar plugin tetap nonaktif secara default.                                                              |
| `legacyPluginIds`                   | Tidak    | `string[]`                       | ID lama yang dinormalisasi ke ID plugin kanonis ini.                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders` | Tidak    | `string[]`                       | ID provider yang seharusnya mengaktifkan plugin ini secara otomatis saat auth, config, atau referensi model menyebutkannya.                                                                                |
| `kind`                              | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                              |
| `channels`                          | Tidak    | `string[]`                       | ID channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi config.                                                                                                                         |
| `providers`                         | Tidak    | `string[]`                       | ID provider yang dimiliki plugin ini.                                                                                                                                                                       |
| `modelSupport`                      | Tidak    | `object`                         | Metadata shorthand model-family milik manifest yang digunakan untuk auto-load plugin sebelum runtime.                                                                                                       |
| `cliBackends`                       | Tidak    | `string[]`                       | ID backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-activation saat startup dari referensi config eksplisit.                                                                           |
| `providerAuthEnvVars`               | Tidak    | `Record<string, string[]>`       | Metadata env auth provider yang ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                              |
| `channelEnvVars`                    | Tidak    | `Record<string, string[]>`       | Metadata env channel yang ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk permukaan penyiapan channel atau auth berbasis env yang harus terlihat oleh helper startup/config generik. |
| `providerAuthChoices`               | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk picker onboarding, resolusi provider pilihan, dan wiring flag CLI sederhana.                                                                                             |
| `contracts`                         | Tidak    | `object`                         | Snapshot kapabilitas bawaan statis untuk speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan tool. |
| `channelConfigs`                    | Tidak    | `Record<string, object>`         | Metadata config channel milik manifest yang digabungkan ke permukaan discovery dan validasi sebelum runtime dimuat.                                                                                        |
| `skills`                            | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif terhadap root plugin.                                                                                                                                           |
| `name`                              | Tidak    | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                                      |
| `description`                       | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di permukaan plugin.                                                                                                                                                     |
| `version`                           | Tidak    | `string`                         | Versi plugin informasional.                                                                                                                                                                                 |
| `uiHints`                           | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field config.                                                                                                                                       |

## Referensi `providerAuthChoices`

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime provider dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | ID provider tempat pilihan ini berada.                                                                  |
| `method`              | Ya       | `string`                                        | ID metode auth untuk dispatch.                                                                          |
| `choiceId`            | Ya       | `string`                                        | ID pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                     |
| `choiceLabel`         | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna. Jika dihilangkan, OpenClaw akan fallback ke `choiceId`.            |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk picker.                                                                      |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal di picker interaktif yang digerakkan asisten.             |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Menyembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.              |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | ID pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                               |
| `groupId`             | Tidak    | `string`                                        | ID grup opsional untuk mengelompokkan pilihan terkait.                                                  |
| `groupLabel`          | Tidak    | `string`                                        | Label yang ditampilkan ke pengguna untuk grup tersebut.                                                 |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                               |
| `optionKey`           | Tidak    | `string`                                        | Kunci opsi internal untuk alur auth satu-flag sederhana.                                                |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                          |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                             |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Permukaan onboarding tempat pilihan ini harus muncul. Jika dihilangkan, default-nya `["text-inference"]`. |

## Referensi `uiHints`

`uiHints` adalah peta dari nama field config ke petunjuk rendering kecil.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Kunci API",
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

| Field                            | Tipe       | Artinya                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID provider speech yang dimiliki plugin ini.                  |
| `realtimeTranscriptionProviders` | `string[]` | ID provider realtime-transcription yang dimiliki plugin ini.  |
| `realtimeVoiceProviders`         | `string[]` | ID provider realtime-voice yang dimiliki plugin ini.          |
| `mediaUnderstandingProviders`    | `string[]` | ID provider media-understanding yang dimiliki plugin ini.     |
| `imageGenerationProviders`       | `string[]` | ID provider image-generation yang dimiliki plugin ini.        |
| `videoGenerationProviders`       | `string[]` | ID provider video-generation yang dimiliki plugin ini.        |
| `webFetchProviders`              | `string[]` | ID provider web-fetch yang dimiliki plugin ini.               |
| `webSearchProviders`             | `string[]` | ID provider web-search yang dimiliki plugin ini.              |
| `tools`                          | `string[]` | Nama tool agen yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

## Referensi `channelConfigs`

Gunakan `channelConfigs` saat plugin channel memerlukan metadata config ringan sebelum
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
| `schema`      | `object`                 | JSON Schema untuk `channels.<id>`. Wajib untuk setiap entri config channel yang dideklarasikan. |
| `uiHints`     | `Record<string, object>` | Label UI/placeholders/petunjuk sensitif opsional untuk bagian config channel tersebut.  |
| `label`       | `string`                 | Label channel yang digabungkan ke permukaan picker dan inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk permukaan inspect dan katalog.                           |
| `preferOver`  | `string[]`               | ID plugin lama atau berprioritas lebih rendah yang harus dikalahkan channel ini di permukaan pemilihan. |

## Referensi `modelSupport`

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin provider Anda dari
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

- referensi eksplisit `provider/model` menggunakan metadata manifest `providers` yang memilikinya
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau config menentukan provider

Field:

| Field           | Tipe       | Artinya                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefix yang dicocokkan dengan `startsWith` terhadap ID model shorthand.        |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap ID model shorthand setelah penghapusan suffix profil. |

Kunci kapabilitas tingkat atas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifest normal აღარ memperlakukan field tingkat atas tersebut sebagai
kepemilikan kapabilitas.

## Manifest versus package.json

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi config, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan                     |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, penyiapan, atau metadata katalog |

Jika Anda tidak yakin metadata tertentu harus ditempatkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field package.json yang memengaruhi discovery

Beberapa metadata plugin pra-runtime memang sengaja ditempatkan di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                                                                                   |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus penyiapan yang digunakan saat onboarding dan startup channel yang ditangguhkan.                                    |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path docs, alias, dan copy pemilihan.                                                       |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa configured-state ringan yang dapat menjawab "apakah penyiapan env-only sudah ada?" tanpa memuat runtime channel penuh. |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa persisted-auth ringan yang dapat menjawab "apakah ada sesuatu yang sudah login?" tanpa memuat runtime channel penuh.   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                          |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih saat tersedia beberapa sumber instalasi.                                                                       |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan batas bawah semver seperti `>=2026.3.22`.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstal plugin bawaan yang sempit saat config tidak valid.                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Memungkinkan permukaan channel khusus penyiapan dimuat sebelum plugin channel penuh saat startup.                                          |

`openclaw.install.minHostVersion` ditegakkan selama instalasi dan pemuatan registry
manifest. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini
tidak membuat config rusak arbitrer menjadi dapat diinstal. Saat ini fitur ini hanya mengizinkan alur instalasi
memulihkan kegagalan peningkatan plugin bawaan usang tertentu, seperti path plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin bawaan yang sama tersebut.
Error config yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul pemeriksa kecil:

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

Gunakan saat alur penyiapan, doctor, atau configured-state memerlukan probe auth ya/tidak yang ringan
sebelum plugin channel penuh dimuat. Export target harus berupa fungsi kecil
yang hanya membaca persisted state; jangan merutekannya melalui barrel runtime
channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan configured
berbasis env yang ringan:

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

Gunakan saat channel dapat menjawab configured-state dari env atau input kecil non-runtime
lainnya. Jika pemeriksaan memerlukan resolusi config penuh atau runtime channel
yang sebenarnya, simpan logika tersebut di hook plugin `config.hasConfiguredState`.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, meskipun tidak menerima config apa pun.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi pada waktu baca/tulis config, bukan saat runtime.

## Perilaku validasi

- Kunci `channels.*` yang tidak dikenal adalah **error**, kecuali ID channel tersebut dideklarasikan oleh
  manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan ID plugin yang **dapat ditemukan**. ID yang tidak dikenal adalah **error**.
- Jika plugin terinstal tetapi memiliki manifest atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin.
- Jika config plugin ada tetapi plugin **dinonaktifkan**, config tetap dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifest ini **wajib untuk plugin OpenClaw native**, termasuk pemuatan dari filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifest hanya untuk
  discovery + validasi.
- Manifest native diparse dengan JSON5, sehingga komentar, trailing comma, dan
  kunci tanpa tanda kutip diterima selama nilai akhirnya tetap berupa object.
- Hanya field manifest yang terdokumentasi yang dibaca oleh manifest loader. Hindari menambahkan
  kunci tingkat atas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe auth, validasi
  penanda env, dan permukaan auth provider serupa yang tidak seharusnya menjalankan runtime
  plugin hanya untuk memeriksa nama env.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env, prompt penyiapan,
  dan permukaan channel serupa yang tidak seharusnya menjalankan runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata ringan untuk picker pilihan auth,
  resolusi `--auth-choice`, pemetaan provider pilihan, dan pendaftaran flag CLI onboarding
  sederhana sebelum runtime provider dimuat. Untuk metadata wizard runtime
  yang memerlukan kode provider, lihat
  [Provider runtime hooks](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak memerlukannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan
  persyaratan allowlist package-manager apa pun (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — memulai dengan plugin
- [Plugin Architecture](/id/plugins/architecture) — arsitektur internal
- [SDK Overview](/id/plugins/sdk-overview) — referensi Plugin SDK
