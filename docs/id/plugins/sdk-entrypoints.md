---
read_when:
    - Anda memerlukan signature tipe yang tepat untuk definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (penuh vs setup vs metadata CLI)
    - Anda sedang mencari opsi titik entri
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik Entri Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Titik Entri Plugin

Setiap Plugin mengekspor objek entri default. SDK menyediakan tiga helper untuk
membuatnya.

Untuk Plugin yang terpasang, `package.json` harus mengarahkan pemuatan runtime ke
JavaScript hasil build jika tersedia:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` dan `setupEntry` tetap merupakan entri source yang valid untuk
pengembangan workspace dan checkout git. `runtimeExtensions` dan
`runtimeSetupEntry` lebih diprioritaskan saat OpenClaw memuat paket yang
terpasang dan memungkinkan paket npm menghindari kompilasi TypeScript saat
runtime. Jika paket yang terpasang hanya mendeklarasikan entri source
TypeScript, OpenClaw akan menggunakan peer `dist/*.js` hasil build yang cocok
jika ada, lalu menggunakan fallback ke source TypeScript.

Semua path entri harus tetap berada di dalam direktori paket Plugin. Entri
runtime dan peer JavaScript hasil build yang diinferensikan tidak membuat path
source `extensions` atau `setupEntry` yang keluar dari paket menjadi valid.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Channel Plugins](/id/plugins/sdk-channel-plugins)
  atau [Provider Plugins](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk Plugin provider, Plugin tool, Plugin hook, dan apa pun yang **bukan**
channel pesan.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Field          | Type                                                             | Required | Default             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Yes      | —                   |
| `name`         | `string`                                                         | Yes      | —                   |
| `description`  | `string`                                                         | Yes      | —                   |
| `kind`         | `string`                                                         | No       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Yes      | —                   |

- `id` harus cocok dengan manifest `openclaw.plugin.json` Anda.
- `kind` digunakan untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi lazy.
- OpenClaw me-resolve dan me-memoize skema tersebut saat akses pertama, sehingga builder skema
  yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan pengkabelan khusus channel. Secara otomatis memanggil
`api.registerChannel({ plugin })`, mengekspos seam metadata CLI root-help opsional,
dan meng-gate `registerFull` berdasarkan mode pendaftaran.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Field                 | Type                                                             | Required | Default             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Yes      | —                   |
| `name`                | `string`                                                         | Yes      | —                   |
| `description`         | `string`                                                         | Yes      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Yes      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No       | —                   |

- `setRuntime` dipanggil selama pendaftaran sehingga Anda dapat menyimpan referensi runtime
  (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama pengambilan metadata
  CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`
  dan `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk deskriptor CLI milik channel sehingga root help
  tetap tidak mengaktifkan apa pun sementara pendaftaran perintah CLI normal tetap kompatibel
  dengan pemuatan Plugin penuh.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory lazy dan OpenClaw
  me-memoize skema yang sudah di-resolve saat akses pertama.
- Untuk perintah CLI root milik Plugin, pilih `api.registerCli(..., { descriptors: [...] })`
  saat Anda ingin perintah tetap lazy-loaded tanpa menghilang dari parse tree
  CLI root. Untuk channel Plugin, pilih mendaftarkan deskriptor tersebut
  dari `registerCliMetadata(...)` dan pertahankan `registerFull(...)` fokus pada pekerjaan yang hanya runtime.
- Jika `registerFull(...)` juga mendaftarkan metode RPC gateway, pertahankan metode tersebut pada
  prefix khusus Plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Mengembalikan hanya `{ plugin }` tanpa
pengkabelan runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan,
belum dikonfigurasi, atau saat deferred loading diaktifkan. Lihat
[Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk kapan hal ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup
yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman untuk runtime seperti
  adapter patch setup yang aman diimpor, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk permukaan setup instalasi opsional
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/arsip/docs setup/instal

Simpan SDK berat, pendaftaran CLI, dan layanan runtime berumur panjang di entri
penuh.

Channel workspace bawaan yang memisahkan permukaan setup dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract`. Kontrak tersebut memungkinkan
entri setup mempertahankan ekspor plugin/secrets yang aman untuk setup sambil tetap mengekspos
runtime setter:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Gunakan kontrak bawaan tersebut hanya saat alur setup benar-benar memerlukan runtime setter
ringan sebelum entri channel penuh dimuat.

## Mode pendaftaran

`api.registrationMode` memberi tahu Plugin Anda bagaimana Plugin dimuat:

| Mode              | Kapan                              | Yang harus didaftarkan                                                                   |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Startup gateway normal             | Semua                                                                                    |
| `"setup-only"`    | Channel dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran channel                                                                |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran channel plus hanya runtime ringan yang diperlukan sebelum entri penuh dimuat |
| `"cli-metadata"`  | Root help / pengambilan metadata CLI | Hanya deskriptor CLI                                                                     |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` langsung untuk channel, periksa mode sendiri:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Pendaftaran berat yang hanya runtime
  api.registerService(/* ... */);
}
```

Perlakukan `"setup-runtime"` sebagai jendela ketika permukaan startup setup-only harus
ada tanpa masuk kembali ke runtime channel bawaan penuh. Kecocokan yang baik adalah
pendaftaran channel, route HTTP yang aman untuk setup, metode gateway yang aman untuk setup, dan
helper setup terdelegasi. Layanan latar belakang yang berat, registrar CLI, dan bootstrap SDK provider/client tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` saat registrar memiliki satu atau lebih perintah root dan Anda
  ingin OpenClaw me-lazy-load modul CLI yang sebenarnya pada pemanggilan pertama
- pastikan deskriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh
  registrar
- gunakan hanya `commands` untuk jalur kompatibilitas eager

## Bentuk Plugin

OpenClaw mengklasifikasikan Plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Shape                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (misalnya hanya provider)   |
| **hybrid-capability** | Beberapa jenis kapabilitas (misalnya provider + speech) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Tools/perintah/layanan tetapi tanpa kapabilitas    |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk Plugin.

## Terkait

- [SDK Overview](/id/plugins/sdk-overview) — API pendaftaran dan referensi subpath
- [Runtime Helpers](/id/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Setup and Config](/id/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Provider Plugins](/id/plugins/sdk-provider-plugins) — pendaftaran provider dan hook
