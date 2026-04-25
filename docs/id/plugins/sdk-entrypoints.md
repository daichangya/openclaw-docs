---
read_when:
    - Anda memerlukan signature tipe yang tepat dari definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (full vs setup vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Setiap plugin mengekspor objek entri default. SDK menyediakan tiga helper untuk
membuatnya.

Untuk plugin yang terpasang, `package.json` harus mengarahkan pemuatan runtime ke
JavaScript hasil build saat tersedia:

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

`extensions` dan `setupEntry` tetap valid sebagai entri sumber untuk pengembangan
workspace dan checkout git. `runtimeExtensions` dan `runtimeSetupEntry` lebih disukai
saat OpenClaw memuat paket yang terpasang dan memungkinkan paket npm menghindari
kompilasi TypeScript saat runtime. Jika paket yang terpasang hanya mendeklarasikan entri sumber TypeScript, OpenClaw akan menggunakan peer `dist/*.js` hasil build yang cocok saat ada, lalu fallback ke sumber TypeScript.

Semua path entri harus tetap berada di dalam direktori paket plugin. Entri runtime
dan peer JavaScript hasil build yang diinferensikan tidak membuat path sumber `extensions` atau
`setupEntry` yang keluar dari paket menjadi valid.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Channel Plugins](/id/plugins/sdk-channel-plugins)
  atau [Provider Plugins](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin provider, plugin tool, plugin hook, dan apa pun yang **bukan**
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

| Field          | Type                                                             | Wajib | Default             |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`           | `string`                                                         | Ya    | —                   |
| `name`         | `string`                                                         | Ya    | —                   |
| `description`  | `string`                                                         | Ya    | —                   |
| `kind`         | `string`                                                         | Tidak | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya    | —                   |

- `id` harus cocok dengan manifest `openclaw.plugin.json` Anda.
- `kind` untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi lazy.
- OpenClaw me-resolve dan memoize skema tersebut pada akses pertama, sehingga builder skema yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus channel. Secara otomatis memanggil
`api.registerChannel({ plugin })`, mengekspos seam metadata CLI root-help opsional, dan mem-gate `registerFull` berdasarkan mode pendaftaran.

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

| Field                 | Type                                                             | Wajib | Default             |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`                  | `string`                                                         | Ya    | —                   |
| `name`                | `string`                                                         | Ya    | —                   |
| `description`         | `string`                                                         | Ya    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | —                   |

- `setRuntime` dipanggil selama pendaftaran sehingga Anda dapat menyimpan referensi runtime
  (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama penangkapan metadata CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, dan
  `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonik untuk descriptor CLI milik channel agar root help
  tetap non-activating, snapshot discovery mencakup metadata perintah statis, dan
  pendaftaran perintah CLI normal tetap kompatibel dengan pemuatan plugin penuh.
- Pendaftaran discovery bersifat non-activating, bukan bebas import. OpenClaw dapat
  mengevaluasi entri plugin tepercaya dan modul plugin channel untuk membangun
  snapshot, jadi pertahankan import tingkat atas bebas efek samping dan letakkan socket,
  klien, worker, dan layanan di balik path khusus `"full"`.
- `registerFull` hanya berjalan ketika `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory lazy dan OpenClaw
  memoize skema yang telah di-resolve pada akses pertama.
- Untuk perintah CLI root milik plugin, pilih `api.registerCli(..., { descriptors: [...] })`
  ketika Anda ingin perintah tetap lazy-loaded tanpa menghilang dari
  pohon parse CLI root. Untuk plugin channel, pilih mendaftarkan descriptor tersebut
  dari `registerCliMetadata(...)` dan pertahankan `registerFull(...)` fokus pada pekerjaan khusus runtime.
- Jika `registerFull(...)` juga mendaftarkan metode RPC gateway, pertahankan metode itu pada
  prefiks khusus plugin. Namespace admin core yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Mengembalikan hanya `{ plugin }` tanpa
wiring runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entri penuh ketika channel dinonaktifkan,
belum dikonfigurasi, atau ketika pemuatan tertunda diaktifkan. Lihat
[Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman saat runtime seperti
  adaptor patch setup yang aman untuk import, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk permukaan setup optional-install
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/archive/docs setup/install

Pertahankan SDK berat, pendaftaran CLI, dan layanan runtime jangka panjang di entri penuh.

Channel workspace bawaan yang memisahkan permukaan setup dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak tersebut memungkinkan
entri setup mempertahankan ekspor plugin/secrets yang aman untuk setup sambil tetap mengekspos setter runtime:

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

Gunakan kontrak bawaan itu hanya ketika alur setup benar-benar memerlukan setter runtime yang ringan
sebelum entri channel penuh dimuat.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda bagaimana plugin tersebut dimuat:

| Mode              | Kapan                            | Apa yang harus didaftarkan                                                                                            |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Startup gateway normal           | Semuanya                                                                                                              |
| `"discovery"`     | Discovery kapabilitas hanya-baca | Pendaftaran channel plus descriptor CLI statis; kode entri boleh dimuat, tetapi lewati socket, worker, klien, dan layanan |
| `"setup-only"`    | Channel dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran channel                                                                                     |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran channel plus hanya runtime ringan yang diperlukan sebelum entri penuh dimuat                              |
| `"cli-metadata"`  | Root help / penangkapan metadata CLI | Hanya descriptor CLI                                                                                               |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` langsung untuk sebuah channel, periksa mode sendiri:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Mode discovery membangun snapshot registri non-activating. Mode ini masih dapat mengevaluasi
entri plugin dan objek plugin channel sehingga OpenClaw dapat mendaftarkan kapabilitas channel
dan descriptor CLI statis. Perlakukan evaluasi modul dalam discovery sebagai
tepercaya tetapi ringan: tanpa klien jaringan, subproses, listener, koneksi database,
worker latar belakang, pembacaan kredensial, atau efek samping runtime langsung lainnya di tingkat atas.

Perlakukan `"setup-runtime"` sebagai jendela saat permukaan startup khusus-setup harus
ada tanpa masuk kembali ke runtime channel bawaan penuh. Yang cocok di sini adalah
pendaftaran channel, route HTTP yang aman untuk setup, metode gateway yang aman untuk setup, dan helper setup terdelegasi. Layanan latar belakang berat, registrar CLI, dan bootstrap SDK provider/klien
tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` ketika registrar memiliki satu atau lebih perintah root dan Anda
  ingin OpenClaw lazy-load modul CLI yang sebenarnya pada pemanggilan pertama
- pastikan descriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh
  registrar
- pertahankan nama perintah descriptor hanya berisi huruf, angka, tanda hubung, dan garis bawah,
  dimulai dengan huruf atau angka; OpenClaw menolak nama descriptor di luar
  bentuk tersebut dan menghapus urutan kontrol terminal dari deskripsi sebelum
  merender help
- gunakan `commands` saja hanya untuk jalur kompatibilitas eager

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Shape                 | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (mis. hanya-provider)       |
| **hybrid-capability** | Beberapa jenis kapabilitas (mis. provider + ucapan) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Tool/perintah/layanan tetapi tanpa kapabilitas     |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin.

## Terkait

- [SDK Overview](/id/plugins/sdk-overview) — API pendaftaran dan referensi subpath
- [Runtime Helpers](/id/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Setup and Config](/id/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Provider Plugins](/id/plugins/sdk-provider-plugins) — pendaftaran provider dan hook
