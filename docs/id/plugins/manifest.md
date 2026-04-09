---
read_when:
    - Anda sedang membangun plugin OpenClaw
    - Anda perlu merilis skema konfigurasi plugin atau men-debug error validasi plugin
summary: Manifes plugin + persyaratan skema JSON (validasi konfigurasi ketat)
title: Manifes Plugin
x-i18n:
    generated_at: "2026-04-09T01:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a7ee4b621a801d2a8f32f8976b0e1d9433c7810eb360aca466031fc0ffb286a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifes plugin (openclaw.plugin.json)

Halaman ini hanya untuk **manifes plugin OpenClaw native**.

Untuk layout bundle yang kompatibel, lihat [Bundle plugin](/id/plugins/bundles).

Format bundle yang kompatibel menggunakan file manifes yang berbeda:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` atau layout komponen Claude default
  tanpa manifes
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw juga mendeteksi otomatis layout bundle tersebut, tetapi tidak divalidasi
terhadap skema `openclaw.plugin.json` yang dijelaskan di sini.

Untuk bundle yang kompatibel, OpenClaw saat ini membaca metadata bundle serta
root Skills yang dideklarasikan, root perintah Claude, default `settings.json` bundle Claude,
default LSP bundle Claude, dan pack hook yang didukung saat layout sesuai
dengan ekspektasi runtime OpenClaw.

Setiap plugin OpenClaw native **harus** menyertakan file `openclaw.plugin.json` di
**root plugin**. OpenClaw menggunakan manifes ini untuk memvalidasi konfigurasi
**tanpa menjalankan kode plugin**. Manifes yang hilang atau tidak valid diperlakukan sebagai
error plugin dan memblokir validasi konfigurasi.

Lihat panduan lengkap sistem plugin: [Plugins](/id/tools/plugin).
Untuk model kapabilitas native dan panduan kompatibilitas eksternal saat ini:
[Model kapabilitas](/id/plugins/architecture#public-capability-model).

## Fungsi file ini

`openclaw.plugin.json` adalah metadata yang dibaca OpenClaw sebelum memuat
kode plugin Anda.

Gunakan untuk:

- identitas plugin
- validasi konfigurasi
- metadata auth dan onboarding yang harus tersedia tanpa mem-boot runtime
  plugin
- metadata alias dan auto-enable yang harus diselesaikan sebelum runtime plugin dimuat
- metadata kepemilikan keluarga model shorthand yang harus mengaktifkan otomatis
  plugin sebelum runtime dimuat
- snapshot kepemilikan kapabilitas statis yang digunakan untuk wiring kompatibilitas bawaan dan
  cakupan kontrak
- metadata konfigurasi khusus channel yang harus digabungkan ke surface katalog dan validasi
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
  "description": "Plugin penyedia OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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

## Referensi field level teratas

| Field                               | Wajib    | Tipe                             | Artinya                                                                                                                                                                                                      |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ya       | `string`                         | Id plugin kanonis. Ini adalah id yang digunakan di `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | Ya       | `object`                         | JSON Schema inline untuk konfigurasi plugin ini.                                                                                                                                                             |
| `enabledByDefault`                  | Tidak    | `true`                           | Menandai plugin bawaan sebagai aktif secara default. Hilangkan field ini, atau setel nilai apa pun selain `true`, agar plugin tetap nonaktif secara default.                                              |
| `legacyPluginIds`                   | Tidak    | `string[]`                       | Id lama yang dinormalisasi ke id plugin kanonis ini.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | Tidak    | `string[]`                       | Id penyedia yang harus mengaktifkan otomatis plugin ini saat auth, konfigurasi, atau referensi model menyebutkannya.                                                                                        |
| `kind`                              | Tidak    | `"memory"` \| `"context-engine"` | Mendeklarasikan jenis plugin eksklusif yang digunakan oleh `plugins.slots.*`.                                                                                                                               |
| `channels`                          | Tidak    | `string[]`                       | Id channel yang dimiliki plugin ini. Digunakan untuk discovery dan validasi konfigurasi.                                                                                                                    |
| `providers`                         | Tidak    | `string[]`                       | Id penyedia yang dimiliki plugin ini.                                                                                                                                                                        |
| `modelSupport`                      | Tidak    | `object`                         | Metadata keluarga model shorthand yang dimiliki manifes dan digunakan untuk memuat otomatis plugin sebelum runtime.                                                                                         |
| `cliBackends`                       | Tidak    | `string[]`                       | Id backend inferensi CLI yang dimiliki plugin ini. Digunakan untuk auto-aktivasi saat startup dari referensi konfigurasi eksplisit.                                                                        |
| `providerAuthEnvVars`               | Tidak    | `Record<string, string[]>`       | Metadata env auth penyedia ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin.                                                                                                                   |
| `providerAuthAliases`               | Tidak    | `Record<string, string>`         | Id penyedia yang harus menggunakan ulang id penyedia lain untuk lookup auth, misalnya penyedia coding yang berbagi kunci API penyedia dasar dan profil auth.                                              |
| `channelEnvVars`                    | Tidak    | `Record<string, string[]>`       | Metadata env channel ringan yang dapat diperiksa OpenClaw tanpa memuat kode plugin. Gunakan ini untuk penyiapan channel berbasis env atau surface auth yang perlu terlihat oleh helper startup/konfigurasi generik. |
| `providerAuthChoices`               | Tidak    | `object[]`                       | Metadata pilihan auth ringan untuk picker onboarding, resolusi preferred-provider, dan wiring flag CLI sederhana.                                                                                           |
| `contracts`                         | Tidak    | `object`                         | Snapshot kapabilitas bawaan statis untuk speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, dan kepemilikan alat. |
| `channelConfigs`                    | Tidak    | `Record<string, object>`         | Metadata konfigurasi channel milik manifes yang digabungkan ke surface discovery dan validasi sebelum runtime dimuat.                                                                                      |
| `skills`                            | Tidak    | `string[]`                       | Direktori Skills yang akan dimuat, relatif ke root plugin.                                                                                                                                                  |
| `name`                              | Tidak    | `string`                         | Nama plugin yang dapat dibaca manusia.                                                                                                                                                                       |
| `description`                       | Tidak    | `string`                         | Ringkasan singkat yang ditampilkan di surface plugin.                                                                                                                                                       |
| `version`                           | Tidak    | `string`                         | Versi plugin informasional.                                                                                                                                                                                  |
| `uiHints`                           | Tidak    | `Record<string, object>`         | Label UI, placeholder, dan petunjuk sensitivitas untuk field konfigurasi.                                                                                                                                   |

## Referensi providerAuthChoices

Setiap entri `providerAuthChoices` menjelaskan satu pilihan onboarding atau auth.
OpenClaw membacanya sebelum runtime penyedia dimuat.

| Field                 | Wajib    | Tipe                                            | Artinya                                                                                                  |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Ya       | `string`                                        | Id penyedia tempat pilihan ini berada.                                                                   |
| `method`              | Ya       | `string`                                        | Id metode auth yang akan digunakan untuk dispatch.                                                       |
| `choiceId`            | Ya       | `string`                                        | Id pilihan auth stabil yang digunakan oleh alur onboarding dan CLI.                                      |
| `choiceLabel`         | Tidak    | `string`                                        | Label untuk pengguna. Jika dihilangkan, OpenClaw menggunakan fallback ke `choiceId`.                    |
| `choiceHint`          | Tidak    | `string`                                        | Teks bantuan singkat untuk picker.                                                                       |
| `assistantPriority`   | Tidak    | `number`                                        | Nilai yang lebih rendah diurutkan lebih awal dalam picker interaktif yang digerakkan asisten.           |
| `assistantVisibility` | Tidak    | `"visible"` \| `"manual-only"`                  | Sembunyikan pilihan dari picker asisten sambil tetap mengizinkan pemilihan CLI manual.                  |
| `deprecatedChoiceIds` | Tidak    | `string[]`                                      | Id pilihan lama yang harus mengarahkan pengguna ke pilihan pengganti ini.                                |
| `groupId`             | Tidak    | `string`                                        | Id grup opsional untuk mengelompokkan pilihan yang terkait.                                              |
| `groupLabel`          | Tidak    | `string`                                        | Label untuk pengguna bagi grup tersebut.                                                                 |
| `groupHint`           | Tidak    | `string`                                        | Teks bantuan singkat untuk grup tersebut.                                                                |
| `optionKey`           | Tidak    | `string`                                        | Key opsi internal untuk alur auth sederhana dengan satu flag.                                            |
| `cliFlag`             | Tidak    | `string`                                        | Nama flag CLI, seperti `--openrouter-api-key`.                                                           |
| `cliOption`           | Tidak    | `string`                                        | Bentuk opsi CLI lengkap, seperti `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Tidak    | `string`                                        | Deskripsi yang digunakan dalam bantuan CLI.                                                              |
| `onboardingScopes`    | Tidak    | `Array<"text-inference" \| "image-generation">` | Surface onboarding tempat pilihan ini harus ditampilkan. Jika dihilangkan, defaultnya adalah `["text-inference"]`. |

## Referensi uiHints

`uiHints` adalah peta dari nama field konfigurasi ke petunjuk rendering kecil.

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

| Field         | Tipe       | Artinya                                 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Label field untuk pengguna.             |
| `help`        | `string`   | Teks bantuan singkat.                   |
| `tags`        | `string[]` | Tag UI opsional.                        |
| `advanced`    | `boolean`  | Menandai field sebagai lanjutan.        |
| `sensitive`   | `boolean`  | Menandai field sebagai rahasia atau sensitif. |
| `placeholder` | `string`   | Teks placeholder untuk input formulir.  |

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

| Field                            | Tipe       | Artinya                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | Id penyedia speech yang dimiliki plugin ini.               |
| `realtimeTranscriptionProviders` | `string[]` | Id penyedia transkripsi realtime yang dimiliki plugin ini. |
| `realtimeVoiceProviders`         | `string[]` | Id penyedia suara realtime yang dimiliki plugin ini.       |
| `mediaUnderstandingProviders`    | `string[]` | Id penyedia pemahaman media yang dimiliki plugin ini.      |
| `imageGenerationProviders`       | `string[]` | Id penyedia pembuatan gambar yang dimiliki plugin ini.     |
| `videoGenerationProviders`       | `string[]` | Id penyedia pembuatan video yang dimiliki plugin ini.      |
| `webFetchProviders`              | `string[]` | Id penyedia pengambilan web yang dimiliki plugin ini.      |
| `webSearchProviders`             | `string[]` | Id penyedia pencarian web yang dimiliki plugin ini.        |
| `tools`                          | `string[]` | Nama alat agen yang dimiliki plugin ini untuk pemeriksaan kontrak bawaan. |

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
| `label`       | `string`                 | Label channel yang digabungkan ke picker dan surface inspect saat metadata runtime belum siap. |
| `description` | `string`                 | Deskripsi channel singkat untuk surface inspect dan katalog.                              |
| `preferOver`  | `string[]`               | Id plugin lama atau prioritas lebih rendah yang harus dikalahkan channel ini di surface pemilihan. |

## Referensi modelSupport

Gunakan `modelSupport` saat OpenClaw harus menyimpulkan plugin penyedia Anda dari
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

OpenClaw menerapkan prioritas berikut:

- referensi `provider/model` eksplisit menggunakan metadata manifes `providers` milik plugin
- `modelPatterns` mengalahkan `modelPrefixes`
- jika satu plugin non-bawaan dan satu plugin bawaan sama-sama cocok, plugin non-bawaan
  yang menang
- ambiguitas yang tersisa diabaikan sampai pengguna atau konfigurasi menentukan penyedia

Field:

| Field           | Tipe       | Artinya                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefiks yang dicocokkan dengan `startsWith` terhadap id model shorthand.        |
| `modelPatterns` | `string[]` | Sumber regex yang dicocokkan terhadap id model shorthand setelah penghapusan sufiks profil. |

Key kapabilitas level teratas lama sudah deprecated. Gunakan `openclaw doctor --fix` untuk
memindahkan `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, dan `webSearchProviders` ke bawah `contracts`; pemuatan
manifes normal tidak lagi memperlakukan field level teratas tersebut sebagai
kepemilikan kapabilitas.

## Manifes versus package.json

Kedua file ini memiliki fungsi yang berbeda:

| File                   | Gunakan untuk                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validasi konfigurasi, metadata pilihan auth, dan petunjuk UI yang harus ada sebelum kode plugin berjalan              |
| `package.json`         | Metadata npm, instalasi dependensi, dan blok `openclaw` yang digunakan untuk entrypoint, gating instalasi, setup, atau metadata katalog |

Jika Anda tidak yakin metadata tertentu harus diletakkan di mana, gunakan aturan ini:

- jika OpenClaw harus mengetahuinya sebelum memuat kode plugin, letakkan di `openclaw.plugin.json`
- jika itu terkait packaging, file entry, atau perilaku instalasi npm, letakkan di `package.json`

### Field package.json yang memengaruhi discovery

Beberapa metadata plugin pra-runtime memang sengaja ditempatkan di `package.json` di bawah blok
`openclaw`, bukan di `openclaw.plugin.json`.

Contoh penting:

| Field                                                             | Artinya                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Mendeklarasikan entrypoint plugin native.                                                                                                    |
| `openclaw.setupEntry`                                             | Entrypoint ringan khusus setup yang digunakan saat onboarding dan startup channel tertunda.                                                  |
| `openclaw.channel`                                                | Metadata katalog channel ringan seperti label, path dokumen, alias, dan copy pemilihan.                                                     |
| `openclaw.channel.configuredState`                                | Metadata pemeriksa status terkonfigurasi ringan yang dapat menjawab "apakah setup khusus-env sudah ada?" tanpa memuat runtime channel penuh. |
| `openclaw.channel.persistedAuthState`                             | Metadata pemeriksa auth tersimpan ringan yang dapat menjawab "apakah sudah ada yang login?" tanpa memuat runtime channel penuh.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Petunjuk instalasi/pembaruan untuk plugin bawaan dan plugin yang dipublikasikan secara eksternal.                                           |
| `openclaw.install.defaultChoice`                                  | Jalur instalasi yang dipilih saat beberapa sumber instalasi tersedia.                                                                        |
| `openclaw.install.minHostVersion`                                 | Versi host OpenClaw minimum yang didukung, menggunakan floor semver seperti `>=2026.3.22`.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Mengizinkan jalur pemulihan reinstalasi plugin bawaan yang sempit saat konfigurasi tidak valid.                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Mengizinkan surface channel khusus setup dimuat sebelum plugin channel penuh saat startup.                                                   |

`openclaw.install.minHostVersion` ditegakkan selama instalasi dan pemuatan registri
manifes. Nilai yang tidak valid ditolak; nilai yang valid tetapi lebih baru akan melewati
plugin pada host yang lebih lama.

`openclaw.install.allowInvalidConfigRecovery` sengaja dibuat sempit. Ini
tidak membuat konfigurasi rusak sembarang menjadi dapat diinstal. Saat ini ini hanya memungkinkan alur instalasi
memulihkan kegagalan upgrade plugin bawaan lama yang spesifik, seperti
path plugin bawaan yang hilang atau entri `channels.<id>` lama untuk plugin bawaan yang sama.
Error konfigurasi yang tidak terkait tetap memblokir instalasi dan mengarahkan operator
ke `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` adalah metadata package untuk modul pemeriksa
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

Gunakan ini saat alur setup, doctor, atau configured-state memerlukan probe auth ya/tidak yang ringan
sebelum plugin channel penuh dimuat. Export target harus berupa fungsi kecil
yang hanya membaca state tersimpan; jangan arahkan melalui barrel runtime channel penuh.

`openclaw.channel.configuredState` mengikuti bentuk yang sama untuk pemeriksaan terkonfigurasi
khusus-env yang ringan:

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
non-runtime kecil lainnya. Jika pemeriksaannya memerlukan resolusi konfigurasi penuh atau runtime
channel yang sesungguhnya, simpan logika itu di hook plugin `config.hasConfiguredState`.

## Persyaratan JSON Schema

- **Setiap plugin harus menyertakan JSON Schema**, bahkan jika tidak menerima konfigurasi.
- Skema kosong dapat diterima (misalnya, `{ "type": "object", "additionalProperties": false }`).
- Skema divalidasi saat pembacaan/penulisan konfigurasi, bukan saat runtime.

## Perilaku validasi

- Key `channels.*` yang tidak dikenal adalah **error**, kecuali id channel tersebut dideklarasikan oleh
  manifes plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, dan `plugins.slots.*`
  harus mereferensikan id plugin yang **dapat ditemukan**. Id yang tidak dikenal adalah **error**.
- Jika plugin terinstal tetapi memiliki manifes atau skema yang rusak atau hilang,
  validasi gagal dan Doctor melaporkan error plugin tersebut.
- Jika konfigurasi plugin ada tetapi plugin tersebut **nonaktif**, konfigurasi tetap dipertahankan dan
  **peringatan** ditampilkan di Doctor + log.

Lihat [Referensi konfigurasi](/id/gateway/configuration) untuk skema `plugins.*` lengkap.

## Catatan

- Manifes ini **wajib untuk plugin OpenClaw native**, termasuk pemuatan filesystem lokal.
- Runtime tetap memuat modul plugin secara terpisah; manifes hanya untuk
  discovery + validasi.
- Manifes native diurai dengan JSON5, jadi komentar, koma penutup, dan
  key tanpa tanda kutip diterima selama nilai akhirnya tetap berupa objek.
- Hanya field manifes yang terdokumentasi yang dibaca oleh pemuat manifes. Hindari menambahkan
  key level teratas kustom di sini.
- `providerAuthEnvVars` adalah jalur metadata ringan untuk probe auth, validasi
  penanda env, dan surface auth penyedia serupa yang tidak seharusnya mem-boot runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthAliases` memungkinkan varian penyedia menggunakan ulang auth
  env vars, profil auth, auth berbasis konfigurasi, dan pilihan onboarding kunci API
  dari penyedia lain tanpa melakukan hardcode hubungan tersebut di core.
- `channelEnvVars` adalah jalur metadata ringan untuk fallback shell-env, prompt setup,
  dan surface channel serupa yang tidak seharusnya mem-boot runtime plugin
  hanya untuk memeriksa nama env.
- `providerAuthChoices` adalah jalur metadata ringan untuk picker pilihan auth,
  resolusi `--auth-choice`, pemetaan preferred-provider, dan pendaftaran flag CLI
  onboarding sederhana sebelum runtime penyedia dimuat. Untuk metadata wizard runtime
  yang memerlukan kode penyedia, lihat
  [Hook runtime penyedia](/id/plugins/architecture#provider-runtime-hooks).
- Jenis plugin eksklusif dipilih melalui `plugins.slots.*`.
  - `kind: "memory"` dipilih oleh `plugins.slots.memory`.
  - `kind: "context-engine"` dipilih oleh `plugins.slots.contextEngine`
    (default: `legacy` bawaan).
- `channels`, `providers`, `cliBackends`, dan `skills` dapat dihilangkan saat
  plugin tidak membutuhkannya.
- Jika plugin Anda bergantung pada modul native, dokumentasikan langkah build dan
  persyaratan allowlist package manager apa pun (misalnya, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — memulai dengan plugin
- [Arsitektur Plugin](/id/plugins/architecture) — arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi Plugin SDK
