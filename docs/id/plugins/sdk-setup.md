---
read_when:
    - Anda sedang menambahkan wizard setup ke sebuah plugin
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan skema config plugin atau metadata openclaw di `package.json`
sidebarTitle: Setup and Config
summary: Wizard setup, `setup-entry.ts`, skema config, dan metadata `package.json`
title: Setup dan Config Plugin
x-i18n:
    generated_at: "2026-04-21T09:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Setup dan Config Plugin

Referensi untuk packaging plugin (metadata `package.json`), manifes
(`openclaw.plugin.json`), entri setup, dan skema config.

<Tip>
  **Mencari panduan langkah demi langkah?** Panduan how-to membahas packaging dalam konteks:
  [Plugin Channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Plugin Provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

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
tersebut wajib. Cuplikan publish kanonis ada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Type       | Description                                                                                            |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | File entry point (relatif ke root paket)                                                               |
| `setupEntry` | `string`   | Entri ringan khusus setup (opsional)                                                                   |
| `channel`    | `object`   | Metadata katalog channel untuk permukaan setup, picker, quickstart, dan status                         |
| `providers`  | `string[]` | ID provider yang didaftarkan oleh plugin ini                                                           |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                  |

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan channel dan permukaan
setup sebelum runtime dimuat.

| Field                                  | Type       | What it means                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label picker/setup saat perlu berbeda dari `label`.                           |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Path docs untuk setup dan tautan pemilihan.                                   |
| `docsLabel`                            | `string`   | Timpa label yang digunakan untuk tautan docs saat perlu berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi onboarding/katalog singkat.                                         |
| `order`                                | `number`   | Urutan sortir di katalog channel.                                             |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                                |
| `preferOver`                           | `string[]` | ID plugin/channel prioritas lebih rendah yang harus dikalahkan oleh channel ini. |
| `systemImage`                          | `string`   | Nama icon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan docs di permukaan pemilihan.                       |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path docs secara langsung alih-alih tautan docs berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu Markdown untuk keputusan pemformatan outbound.  |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk setup, daftar terkonfigurasi, dan permukaan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Mengikutsertakan channel ini ke alur setup quickstart `allowFrom` standar.    |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit bahkan ketika hanya ada satu akun.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prioritaskan lookup sesi saat me-resolve target announce untuk channel ini.    |

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
      "blurb": "Integrasi obrolan self-hosted berbasis webhook.",
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

- `configured`: sertakan channel di permukaan daftar bergaya configured/status
- `setup`: sertakan channel di picker setup/configure interaktif
- `docs`: tandai channel sebagai berhadapan publik di permukaan docs/navigasi

`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Sebaiknya gunakan
`exposure`.

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Field                        | Type                 | What it means                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spec npm kanonis untuk alur install/update.                                      |
| `localPath`                  | `string`             | Path instalasi lokal pengembangan atau bawaan.                                   |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang dipilih saat keduanya tersedia.                            |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z`.                     |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang plugin bawaan memulihkan kegagalan config usang tertentu. |

Jika `minHostVersion` disetel, instalasi dan pemuatan registri manifes sama-sama menegakkannya.
Host yang lebih lama melewati plugin; string versi yang tidak valid ditolak.

`allowInvalidConfigRecovery` bukan bypass umum untuk config rusak. Ini
hanya untuk pemulihan sempit plugin bawaan, sehingga instal ulang/setup dapat memperbaiki sisa upgrade yang diketahui seperti path plugin bawaan yang hilang atau entri `channels.<id>`
yang usang untuk plugin yang sama. Jika config rusak karena alasan yang tidak terkait, instalasi
tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Muat penuh tertunda

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup
pra-listen, bahkan untuk channel yang sudah terkonfigurasi. Entri penuh dimuat setelah
gateway mulai listen.

<Warning>
  Aktifkan pemuatan tertunda hanya ketika `setupEntry` Anda mendaftarkan semua yang
  dibutuhkan gateway sebelum mulai listen (registrasi channel, rute HTTP,
  metode gateway). Jika entri penuh memiliki capability startup yang diperlukan, pertahankan
  perilaku default.
</Warning>

Jika entri setup/penuh Anda mendaftarkan metode gateway RPC, simpan pada
prefix khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu di-resolve
ke `operator.admin`.

## Manifes plugin

Setiap plugin native harus mengirim `openclaw.plugin.json` di root paket.
OpenClaw menggunakan ini untuk memvalidasi config tanpa mengeksekusi kode plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Menambahkan capability My Plugin ke OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secret verifikasi webhook"
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

Bahkan plugin tanpa config pun harus mengirim skema. Skema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Manifes Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publishing ClawHub

Untuk paket plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publish lama khusus skill diperuntukkan bagi Skills. Paket plugin harus
selalu menggunakan `clawhub package publish`.

## Entri setup

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat OpenClaw ketika hanya memerlukan permukaan setup (onboarding, perbaikan config,
pemeriksaan channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari memuat kode runtime yang berat (library kripto, registrasi CLI,
layanan latar belakang) selama alur setup.

Channel workspace bawaan yang menyimpan ekspor aman-setup di modul sidecar dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` alih-alih
`defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime`
opsional sehingga wiring runtime saat setup tetap ringan dan eksplisit.

**Kapan OpenClaw menggunakan `setupEntry` alih-alih entri penuh:**

- Channel dinonaktifkan tetapi memerlukan permukaan setup/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Apa yang harus didaftarkan `setupEntry`:**

- Objek plugin channel (melalui `defineSetupPluginEntry`)
- Rute HTTP apa pun yang diperlukan sebelum gateway listen
- Metode gateway apa pun yang dibutuhkan selama startup

Metode gateway startup tersebut tetap harus menghindari namespace admin inti
yang dicadangkan seperti `config.*` atau `update.*`.

**Apa yang TIDAK boleh disertakan `setupEntry`:**

- Registrasi CLI
- Layanan latar belakang
- Impor runtime berat (kripto, SDK)
- Metode gateway yang hanya dibutuhkan setelah startup

### Impor helper setup sempit

Untuk jalur khusus setup yang panas, sebaiknya gunakan seam helper setup yang sempit alih-alih umbrella
`plugin-sdk/setup` yang lebih luas ketika Anda hanya memerlukan sebagian dari permukaan setup:

| Import path                        | Use it for                                                                                | Key exports                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptor setup akun yang sadar environment                                                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/arsip/docs untuk setup/install                                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Gunakan seam `plugin-sdk/setup` yang lebih luas ketika Anda menginginkan toolbox
setup bersama lengkap, termasuk helper patch config seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adaptor patch setup tetap aman untuk hot-path saat diimpor. Lookup permukaan kontrak
promosi akun tunggal bawaannya bersifat lazy, sehingga mengimpor
`plugin-sdk/setup-runtime` tidak secara eager memuat discovery permukaan kontrak bawaan
sebelum adaptor benar-benar digunakan.

### Promosi akun tunggal milik channel

Saat sebuah channel meningkatkan config tingkat atas akun tunggal menjadi
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai bercakupan akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi itu melalui permukaan kontrak
setup mereka:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke
  akun yang dipromosikan
- `namedAccountPromotionKeys`: ketika akun bernama sudah ada, hanya kunci ini yang
  dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap di
  root channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang ada mana yang
  menerima nilai yang dipromosikan

Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah
ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang ada seperti
`Ops`, promosi mempertahankan akun itu alih-alih membuat entri baru
`accounts.default`.

## Skema config

Config plugin divalidasi terhadap JSON Schema di manifes Anda. Pengguna
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

Plugin Anda menerima config ini sebagai `api.pluginConfig` selama registrasi.

Untuk config khusus channel, gunakan bagian config channel sebagai gantinya:

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

### Membangun skema config channel

Gunakan `buildChannelConfigSchema` dari `openclaw/plugin-sdk/core` untuk mengubah
skema Zod menjadi wrapper `ChannelConfigSchema` yang divalidasi OpenClaw:

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

## Wizard setup

Plugin channel dapat menyediakan wizard setup interaktif untuk `openclaw onboard`.
Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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
Lihat paket plugin bawaan (misalnya plugin Discord `src/channel.setup.ts`) untuk
contoh lengkap.

Untuk prompt allowlist DM yang hanya memerlukan alur standar
`note -> prompt -> parse -> merge -> patch`, sebaiknya gunakan helper setup
bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status setup channel yang hanya bervariasi menurut label, skor, dan
baris tambahan opsional, sebaiknya gunakan `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di
setiap plugin.

Untuk permukaan setup opsional yang hanya harus muncul dalam konteks tertentu, gunakan
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
`createOptionalChannelSetupWizard(...)` ketika Anda hanya memerlukan separuh dari
permukaan install opsional itu.

Adapter/wizard opsional yang dihasilkan gagal tertutup pada penulisan config nyata. Mereka
menggunakan ulang satu pesan install-required di seluruh `validateInput`,
`applyAccountConfig`, dan `finalize`, serta menambahkan tautan docs ketika `docsPath`
disetel.

Untuk UI setup berbasis binary, sebaiknya gunakan helper delegasi bersama alih-alih
menyalin glue binary/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya bervariasi menurut label,
  petunjuk, skor, dan deteksi binary
- `createCliPathTextInput(...)` untuk input teks berbasis path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` ketika `setupEntry` perlu meneruskan ke
  wizard penuh yang lebih berat secara lazy
- `createDelegatedTextInputShouldPrompt(...)` ketika `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Publishing dan instalasi

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu instal:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan secara otomatis fallback ke npm. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # hanya ClawHub
```

Tidak ada override `npm:` yang cocok. Gunakan spec paket npm normal ketika Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** tempatkan di bawah pohon workspace plugin bawaan dan plugin akan otomatis
ditemukan selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle scripts). Jaga pohon dependensi plugin
  tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

Plugin bawaan milik OpenClaw adalah satu-satunya pengecualian perbaikan startup: ketika instalasi terpaket melihat salah satunya diaktifkan oleh config plugin, config channel lama, atau manifes default-enabled bawaannya, startup akan menginstal dependensi runtime plugin yang hilang sebelum impor. Plugin pihak ketiga tidak boleh bergantung pada instalasi saat startup; tetap gunakan installer plugin eksplisit.

## Terkait

- [SDK Entry Points](/id/plugins/sdk-entrypoints) -- `definePluginEntry` dan `defineChannelPluginEntry`
- [Manifes Plugin](/id/plugins/manifest) -- referensi skema manifes lengkap
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai langkah demi langkah
