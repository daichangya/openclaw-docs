---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah plugin
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan skema konfigurasi plugin atau metadata `openclaw` di `package.json`
sidebarTitle: Setup and Config
summary: Wizard penyiapan, `setup-entry.ts`, skema konfigurasi, dan metadata `package.json`
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referensi untuk packaging plugin (metadata `package.json`), manifest
(`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
  **Mencari panduan langkah demi langkah?** Panduan how-to membahas packaging dalam konteks:
  [Plugin Channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Plugin Provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata package

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem plugin apa yang
disediakan plugin Anda:

**Plugin channel:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Deskripsi singkat tentang channel."
    }
  }
}
```

**Plugin provider / baseline publish ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Jika Anda memublikasikan plugin secara eksternal di ClawHub, field `compat` dan `build`
tersebut wajib. Snippet publish kanonis ada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Tipe       | Deskripsi                                                                                                               |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File titik masuk (relatif terhadap root package)                                                                        |
| `setupEntry` | `string`   | Entri ringan khusus penyiapan (opsional)                                                                                |
| `channel`    | `object`   | Metadata katalog channel untuk permukaan setup, picker, quickstart, dan status                                          |
| `providers`  | `string[]` | ID provider yang didaftarkan oleh plugin ini                                                                            |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                                   |

### `openclaw.channel`

`openclaw.channel` adalah metadata package murah untuk penemuan channel dan
permukaan penyiapan sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label picker/setup saat harus berbeda dari `label`.                           |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur dokumen untuk tautan setup dan pemilihan.                               |
| `docsLabel`                            | `string`   | Override label yang digunakan untuk tautan dokumen saat harus berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi onboarding/katalog singkat.                                         |
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                          |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                                |
| `preferOver`                           | `string[]` | ID plugin/channel prioritas lebih rendah yang harus dikalahkan channel ini.   |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan dokumen di permukaan pemilihan.                   |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur dokumen secara langsung alih-alih tautan dokumen berlabel dalam copy pemilihan. |
| `selectionExtras`                      | `string[]` | String singkat tambahan yang ditambahkan dalam copy pemilihan.                |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu markdown untuk keputusan pemformatan keluar.    |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk permukaan setup, daftar terkonfigurasi, dan dokumen. |
| `quickstartAllowFrom`                  | `boolean`  | Membuat channel ini ikut serta dalam alur setup `allowFrom` quickstart standar. |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit bahkan saat hanya ada satu akun.              |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prioritaskan lookup sesi saat me-resolve target pengumuman untuk channel ini. |

Contoh:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Integrasi chat self-hosted berbasis webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Panduan:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` mendukung:

- `configured`: sertakan channel dalam permukaan daftar bergaya configured/status
- `setup`: sertakan channel dalam picker setup/configure interaktif
- `docs`: tandai channel sebagai publik di permukaan dokumen/navigasi

`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Pilih
`exposure`.

### `openclaw.install`

`openclaw.install` adalah metadata package, bukan metadata manifest.

| Field                        | Tipe                 | Artinya                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | npm spec kanonis untuk alur install/update.                                      |
| `localPath`                  | `string`             | Jalur instalasi lokal pengembangan atau bawaan.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi pilihan saat keduanya tersedia.                                 |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang disematkan. |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang plugin bawaan memulihkan kegagalan konfigurasi usang tertentu. |

Onboarding interaktif juga menggunakan `openclaw.install` untuk
permukaan install-on-demand. Jika plugin Anda mengekspos pilihan autentikasi provider atau metadata
penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan
pilihan tersebut, meminta npm vs instalasi lokal, menginstal atau mengaktifkan plugin,
lalu melanjutkan alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog
tepercaya dengan `npmSpec` registri; versi tepat dan `expectedIntegrity` adalah pin opsional. Jika
`expectedIntegrity` ada, alur install/update menegakkannya. Simpan metadata "apa
yang ditampilkan" di `openclaw.plugin.json` dan metadata "bagaimana cara menginstalnya"
di `package.json`.

Jika `minHostVersion` ditetapkan, instalasi dan pemuatan registri manifest sama-sama menegakkannya.
Host yang lebih lama melewati plugin; string versi yang tidak valid ditolak.

Untuk instalasi npm yang disematkan, pertahankan versi tepat di `npmSpec` dan tambahkan
integritas artefak yang diharapkan:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi yang rusak. Field ini
ditujukan hanya untuk pemulihan sempit plugin bawaan, sehingga instal ulang/setup dapat memperbaiki
sisa upgrade yang diketahui seperti jalur plugin bawaan yang hilang atau entri `channels.<id>`
usang untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi
tetap fail-closed dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Penundaan pemuatan penuh

Plugin channel dapat ikut serta dalam pemuatan tertunda dengan:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup pra-listen,
bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah
gateway mulai mendengarkan.

<Warning>
  Aktifkan pemuatan tertunda hanya saat `setupEntry` Anda mendaftarkan semua yang
  dibutuhkan gateway sebelum mulai mendengarkan (pendaftaran channel, rute HTTP,
  gateway method). Jika entri penuh memiliki kapabilitas startup yang diperlukan,
  pertahankan perilaku default.
</Warning>

Jika entri setup/penuh Anda mendaftarkan gateway RPC method, pertahankan method tersebut pada
prefiks khusus plugin. Namespace admin core yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki core dan selalu me-resolve
ke `operator.admin`.

## Manifest plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root package.
OpenClaw menggunakan ini untuk memvalidasi konfigurasi tanpa mengeksekusi kode plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Menambahkan kapabilitas My Plugin ke OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Rahasia verifikasi webhook"
      }
    }
  }
}
```

Untuk plugin channel, tambahkan `kind` dan `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Bahkan plugin tanpa konfigurasi pun harus menyertakan skema. Skema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Manifest Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publishing ClawHub

Untuk package plugin, gunakan perintah ClawHub khusus package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publish lama yang hanya untuk skill ditujukan untuk Skills. Package plugin
harus selalu menggunakan `clawhub package publish`.

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat OpenClaw saat hanya memerlukan permukaan penyiapan (onboarding, perbaikan konfigurasi,
inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (library crypto, pendaftaran CLI,
layanan latar belakang) selama alur penyiapan.

Channel workspace bawaan yang menyimpan ekspor aman-untuk-setup di modul sidecar dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` alih-alih
`defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime`
opsional agar wiring runtime saat penyiapan tetap ringan dan eksplisit.

**Saat OpenClaw menggunakan `setupEntry` alih-alih entri penuh:**

- Channel dinonaktifkan tetapi memerlukan permukaan setup/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Apa yang harus didaftarkan oleh `setupEntry`:**

- Objek plugin channel (melalui `defineSetupPluginEntry`)
- Rute HTTP apa pun yang diperlukan sebelum gateway listen
- Gateway method apa pun yang diperlukan selama startup

Gateway method startup tersebut tetap harus menghindari namespace admin core
yang dicadangkan seperti `config.*` atau `update.*`.

**Apa yang TIDAK boleh disertakan oleh `setupEntry`:**

- Pendaftaran CLI
- Layanan latar belakang
- Import runtime berat (crypto, SDK)
- Gateway method yang hanya diperlukan setelah startup

### Import helper setup sempit

Untuk jalur setup-only yang panas, pilih seam helper setup sempit alih-alih umbrella
`plugin-sdk/setup` yang lebih luas saat Anda hanya memerlukan sebagian dari permukaan setup:

| Jalur import                       | Gunakan untuk                                                                          | Ekspor kunci                                                                                                                                                                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter setup akun yang sadar-lingkungan                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                      |
| `plugin-sdk/setup-tools`           | helper CLI/arsip/dokumen untuk setup/install                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                            |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox setup bersama
lengkap, termasuk helper patch konfigurasi seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch setup tetap aman pada jalur panas saat import. Lookup permukaan kontrak
promosi single-account bawaannya bersifat lazy, sehingga mengimpor
`plugin-sdk/setup-runtime` tidak secara eager memuat penemuan permukaan kontrak bawaan
sebelum adapter benar-benar digunakan.

### Promosi single-account milik channel

Saat sebuah channel di-upgrade dari konfigurasi tingkat atas single-account ke
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai
bercakupan akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau meng-override promosi tersebut melalui permukaan
kontrak setup-nya:

- `singleAccountKeysToMove`: key tingkat atas tambahan yang harus dipindahkan ke
  akun hasil promosi
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya key ini
  yang dipindahkan ke akun hasil promosi; key kebijakan/pengiriman bersama tetap di root
  channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang ada mana yang
  menerima nilai hasil promosi

Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama
sudah ada, atau jika `defaultAccount` menunjuk ke key non-kanonis yang ada
seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri
`accounts.default` baru.

## Skema konfigurasi

Konfigurasi plugin divalidasi terhadap JSON Schema di manifest Anda. Pengguna
mengonfigurasi plugin melalui:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin Anda menerima konfigurasi ini sebagai `api.pluginConfig` selama pendaftaran.

Untuk konfigurasi khusus channel, gunakan bagian konfigurasi channel sebagai gantinya:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Membangun skema konfigurasi channel

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi
wrapper `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Untuk plugin pihak ketiga, kontrak cold-path tetap manifest plugin:
cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar
permukaan skema konfigurasi, setup, dan UI dapat memeriksa `channels.<id>` tanpa
memuat kode runtime.

## Wizard penyiapan

Plugin channel dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`.
Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Tipe `ChannelSetupWizard` mendukung `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya.
Lihat package plugin bawaan (misalnya plugin Discord `src/channel.setup.ts`) untuk
contoh lengkap.

Untuk prompt allowlist DM yang hanya memerlukan alur standar
`note -> prompt -> parse -> merge -> patch`, pilih helper setup bersama
dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status setup channel yang hanya bervariasi berdasarkan label, skor, dan
baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di
setiap plugin.

Untuk permukaan setup opsional yang hanya akan muncul dalam konteks tertentu, gunakan
`createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah
`createOptionalChannelSetupAdapter(...)` dan
`createOptionalChannelSetupWizard(...)` saat Anda hanya memerlukan salah satu bagian
dari permukaan instalasi opsional itu.

Adapter/wizard opsional yang dihasilkan bersifat fail-closed pada penulisan konfigurasi nyata. Keduanya
menggunakan ulang satu pesan install-required di `validateInput`,
`applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen saat `docsPath`
ditetapkan.

Untuk UI setup berbasis biner, pilih helper delegasi bersama alih-alih
menyalin glue biner/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya bervariasi menurut label,
  petunjuk, skor, dan deteksi biner
- `createCliPathTextInput(...)` untuk input teks berbasis path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke
  wizard penuh yang lebih berat secara lazy
- `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Publishing dan instalasi

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu instal:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan otomatis fallback ke npm. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # hanya ClawHub
```

Tidak ada override `npm:` yang setara. Gunakan npm package spec biasa saat Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** letakkan di bawah tree workspace plugin bawaan dan plugin tersebut akan otomatis
ditemukan saat build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle script). Jaga tree dependensi plugin
  tetap JS/TS murni dan hindari package yang memerlukan build `postinstall`.
</Info>

Plugin bawaan milik OpenClaw adalah satu-satunya pengecualian perbaikan startup: saat
instalasi paket melihat salah satunya diaktifkan oleh konfigurasi plugin, konfigurasi channel lama, atau
manifest default-enabled bawaannya, startup menginstal dependensi runtime
plugin yang hilang sebelum import. Plugin pihak ketiga sebaiknya tidak bergantung pada
instalasi saat startup; tetap gunakan installer plugin eksplisit.

## Terkait

- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest lengkap
- [Membangun plugin](/id/plugins/building-plugins) — panduan langkah demi langkah untuk memulai
