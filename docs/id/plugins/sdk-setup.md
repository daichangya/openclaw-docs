---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah plugin
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan schema konfigurasi plugin atau metadata `openclaw` di `package.json`
sidebarTitle: Setup and Config
summary: Wizard penyiapan, `setup-entry.ts`, schema konfigurasi, dan metadata `package.json`
title: Penyiapan dan Konfigurasi Plugin
x-i18n:
    generated_at: "2026-04-23T09:25:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Penyiapan dan Konfigurasi Plugin

Referensi untuk packaging plugin (metadata `package.json`), manifest
(`openclaw.plugin.json`), setup entry, dan schema konfigurasi.

<Tip>
  **Mencari panduan langkah demi langkah?** Panduan how-to membahas packaging dalam konteks:
  [Channel Plugins](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Provider Plugins](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata package

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem plugin apa
yang disediakan plugin Anda:

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
      "blurb": "Deskripsi singkat channel."
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
tersebut wajib. Snippet publish kanonis berada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Tipe       | Deskripsi                                                                                                                 |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File entry point (relatif terhadap root package)                                                                          |
| `setupEntry` | `string`   | Entry ringan khusus penyiapan (opsional)                                                                                  |
| `channel`    | `object`   | Metadata katalog channel untuk surface penyiapan, picker, quickstart, dan status                                          |
| `providers`  | `string[]` | ID provider yang didaftarkan oleh plugin ini                                                                              |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                                     |

### `openclaw.channel`

`openclaw.channel` adalah metadata package ringan untuk penemuan channel dan surface
penyiapan sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label picker/penyiapan bila harus berbeda dari `label`.                       |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan surface status yang lebih kaya. |
| `docsPath`                             | `string`   | Path docs untuk tautan penyiapan dan pemilihan.                               |
| `docsLabel`                            | `string`   | Override label yang digunakan untuk tautan docs saat harus berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi singkat onboarding/katalog.                                         |
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                          |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                                |
| `preferOver`                           | `string[]` | ID plugin/channel prioritas lebih rendah yang harus dikalahkan channel ini.   |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan docs dalam surface pemilihan.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path docs secara langsung alih-alih tautan docs berlabel dalam copy pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam copy pemilihan.                 |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu markdown untuk keputusan pemformatan keluar.    |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk surface penyiapan, daftar terkonfigurasi, dan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Memilih channel ini ke alur penyiapan quickstart `allowFrom` standar.         |
| `forceAccountBinding`                  | `boolean`  | Mewajibkan binding akun eksplisit bahkan saat hanya ada satu akun.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Lebih mengutamakan lookup sesi saat menyelesaikan target announce untuk channel ini. |

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
      "blurb": "Integrasi chat self-hosted berbasis Webhook.",
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

- `configured`: sertakan channel dalam surface daftar bergaya configured/status
- `setup`: sertakan channel dalam picker penyiapan/konfigurasi interaktif
- `docs`: tandai channel sebagai menghadap publik dalam surface docs/navigasi

`showConfigured` dan `showInSetup` tetap didukung sebagai alias legacy. Sebaiknya gunakan
`exposure`.

### `openclaw.install`

`openclaw.install` adalah metadata package, bukan metadata manifest.

| Field                        | Tipe                 | Artinya                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spec npm kanonis untuk alur install/update.                                      |
| `localPath`                  | `string`             | Path instalasi development lokal atau bawaan.                                    |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang diutamakan saat keduanya tersedia.                         |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang di-pin. |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang plugin bawaan pulih dari kegagalan konfigurasi stale tertentu. |

Onboarding interaktif juga menggunakan `openclaw.install` untuk surface
install-on-demand. Jika plugin Anda mengekspos pilihan auth provider atau metadata
penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan itu, meminta pilihan instalasi npm vs lokal, menginstal atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog tepercaya dengan
`npmSpec` registry; versi exact dan `expectedIntegrity` adalah pin opsional. Jika
`expectedIntegrity` ada, alur install/update menegakkannya. Pertahankan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya"
di `package.json`.

Jika `minHostVersion` disetel, instalasi dan pemuatan manifest-registry sama-sama menegakkannya. Host yang lebih lama melewati plugin; string versi yang tidak valid ditolak.

Untuk instalasi npm yang di-pin, pertahankan versi exact dalam `npmSpec` dan tambahkan
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

`allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi yang rusak. Ini
hanya untuk pemulihan plugin bawaan yang sempit, sehingga instal ulang/penyiapan dapat memperbaiki sisa upgrade yang diketahui
seperti path plugin bawaan yang hilang atau entri `channels.<id>`
yang stale untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi
tetap gagal secara fail-closed dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Penundaan pemuatan penuh

Plugin channel dapat memilih pemuatan tertunda dengan:

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
bahkan untuk channel yang sudah dikonfigurasi. Entry penuh dimuat setelah
Gateway mulai mendengarkan.

<Warning>
  Aktifkan pemuatan tertunda hanya jika `setupEntry` Anda mendaftarkan semua yang
  dibutuhkan Gateway sebelum mulai mendengarkan (registrasi channel, rute HTTP,
  metode Gateway). Jika entry penuh memiliki kapabilitas startup yang wajib, pertahankan
  perilaku default.
</Warning>

Jika setup/full entry Anda mendaftarkan metode Gateway RPC, pertahankan metode itu pada
prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki core dan selalu diselesaikan
ke `operator.admin`.

## Manifest plugin

Setiap plugin native harus mengirim `openclaw.plugin.json` di root package.
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
        "description": "Rahasia verifikasi Webhook"
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

Bahkan plugin tanpa konfigurasi pun harus mengirim schema. Schema kosong itu valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Plugin Manifest](/id/plugins/manifest) untuk referensi schema lengkap.

## Publikasi ClawHub

Untuk package plugin, gunakan perintah ClawHub khusus package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publish legacy khusus skill adalah untuk Skills. Package plugin harus
selalu menggunakan `clawhub package publish`.

## Setup entry

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat OpenClaw saat hanya memerlukan surface penyiapan (onboarding, perbaikan konfigurasi,
pemeriksaan channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime berat (library kripto, registrasi CLI,
layanan latar belakang) selama alur penyiapan.

Channel workspace bawaan yang menyimpan ekspor aman-untuk-penyiapan di modul sidecar dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` alih-alih
`defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor
`runtime` opsional sehingga wiring runtime saat penyiapan dapat tetap ringan dan eksplisit.

**Saat OpenClaw menggunakan `setupEntry` alih-alih entry penuh:**

- Channel dinonaktifkan tetapi memerlukan surface penyiapan/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Yang harus didaftarkan oleh `setupEntry`:**

- Objek plugin channel (melalui `defineSetupPluginEntry`)
- Rute HTTP apa pun yang diperlukan sebelum Gateway listen
- Metode Gateway apa pun yang dibutuhkan selama startup

Metode Gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan
seperti `config.*` atau `update.*`.

**Yang TIDAK boleh disertakan dalam `setupEntry`:**

- Registrasi CLI
- Layanan latar belakang
- Impor runtime berat (kripto, SDK)
- Metode Gateway yang hanya dibutuhkan setelah startup

### Impor helper penyiapan yang sempit

Untuk jalur khusus penyiapan yang panas, sebaiknya gunakan seam helper penyiapan sempit alih-alih umbrella
`plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian surface penyiapan:

| Path impor                         | Gunakan untuk                                                                              | Ekspor kunci                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat penyiapan yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter penyiapan akun yang sadar lingkungan                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                     |
| `plugin-sdk/setup-tools`           | helper CLI/archive/docs untuk penyiapan/instalasi                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                           |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox
penyiapan bersama penuh, termasuk helper patch konfigurasi seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch penyiapan tetap aman untuk import pada jalur panas. Lookup surface kontrak promosi satu-akun bawaan mereka bersifat lazy, sehingga mengimpor
`plugin-sdk/setup-runtime` tidak memuat discovery surface kontrak bawaan secara eager sebelum adapter benar-benar digunakan.

### Promosi satu-akun milik channel

Saat sebuah channel di-upgrade dari konfigurasi tingkat atas satu-akun ke
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai bercakupan akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi itu melalui surface
kontrak penyiapan mereka:

- `singleAccountKeysToMove`: key tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: saat named account sudah ada, hanya key ini yang dipindahkan ke akun yang dipromosikan; key kebijakan/pengiriman bersama tetap berada di root channel
- `resolveSingleAccountPromotionTarget(...)`: memilih akun yang sudah ada mana yang menerima nilai yang dipromosikan

Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada,
atau jika `defaultAccount` menunjuk ke key non-kanonis yang sudah ada
seperti `Ops`, promosi mempertahankan akun itu alih-alih membuat entri
`accounts.default` baru.

## Schema konfigurasi

Konfigurasi plugin divalidasi terhadap JSON Schema dalam manifest Anda. Pengguna
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

Plugin Anda menerima konfigurasi ini sebagai `api.pluginConfig` selama registrasi.

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

### Membangun schema konfigurasi channel

Gunakan `buildChannelConfigSchema` dari `openclaw/plugin-sdk/core` untuk mengonversi
schema Zod menjadi wrapper `ChannelConfigSchema` yang divalidasi OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Wizard penyiapan

Plugin channel dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`.
Wizard ini adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Terhubung",
    unconfiguredLabel: "Belum dikonfigurasi",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Gunakan MY_CHANNEL_BOT_TOKEN dari environment?",
      keepPrompt: "Pertahankan token saat ini?",
      inputPrompt: "Masukkan token bot Anda:",
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
`note -> prompt -> parse -> merge -> patch`, sebaiknya gunakan helper penyiapan bersama
dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status penyiapan channel yang hanya bervariasi pada label, skor, dan baris tambahan opsional, sebaiknya gunakan `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih merakit objek `status` yang sama secara manual di
setiap plugin.

Untuk surface penyiapan opsional yang hanya boleh muncul dalam konteks tertentu, gunakan
`createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Mengembalikan { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah
`createOptionalChannelSetupAdapter(...)` dan
`createOptionalChannelSetupWizard(...)` saat Anda hanya memerlukan salah satu bagian dari
surface instalasi opsional tersebut.

Adapter/wizard opsional yang dihasilkan gagal secara fail-closed pada penulisan konfigurasi nyata. Adapter/wizard ini menggunakan kembali satu pesan wajib-instal di seluruh `validateInput`,
`applyAccountConfig`, dan `finalize`, serta menambahkan tautan docs saat `docsPath`
disetel.

Untuk UI penyiapan yang didukung biner, sebaiknya gunakan helper delegasi bersama alih-alih
menyalin glue biner/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya bervariasi pada label,
  petunjuk, skor, dan deteksi biner
- `createCliPathTextInput(...)` untuk input teks yang didukung path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan secara lazy ke
  wizard penuh yang lebih berat
- `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Publikasi dan instalasi

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu instal:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan otomatis fallback ke npm. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # hanya ClawHub
```

Tidak ada override `npm:` yang cocok. Gunakan spec package npm normal saat Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** tempatkan di bawah tree workspace plugin bawaan dan plugin tersebut akan
ditemukan secara otomatis saat build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle script). Pertahankan tree dependensi plugin
  murni JS/TS dan hindari package yang memerlukan build `postinstall`.
</Info>

Plugin bawaan milik OpenClaw adalah satu-satunya pengecualian perbaikan startup: saat
instalasi paket melihat salah satu plugin tersebut diaktifkan oleh konfigurasi plugin, konfigurasi channel legacy, atau manifest bawaan default-enabled-nya, startup akan menginstal dependensi runtime plugin yang hilang sebelum import. Plugin pihak ketiga tidak boleh bergantung pada instalasi startup; tetap gunakan installer plugin yang eksplisit.

## Terkait

- [SDK Entry Points](/id/plugins/sdk-entrypoints) -- `definePluginEntry` dan `defineChannelPluginEntry`
- [Plugin Manifest](/id/plugins/manifest) -- referensi schema manifest lengkap
- [Building Plugins](/id/plugins/building-plugins) -- panduan memulai langkah demi langkah
