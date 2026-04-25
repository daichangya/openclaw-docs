---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan saluran, provider, tool, atau capability lain baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin memperluas OpenClaw dengan capability baru: saluran, provider model,
speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar,
pembuatan video, web fetch, web search, tool agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) atau npm dan pengguna menginstalnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
secara otomatis fallback ke npm.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk plugin dalam repo: repositori sudah di-clone dan `pnpm install` sudah dijalankan

## Plugin seperti apa?

<CardGroup cols={3}>
  <Card title="Plugin saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan provider model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin tool / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan tool agen, event hook, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk plugin saluran yang tidak dijamin terinstal saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adapter + wizard setup
yang mengiklankan kebutuhan instalasi dan gagal secara fail-closed pada penulisan config nyata
hingga plugin diinstal.

## Mulai cepat: plugin tool

Panduan ini membuat plugin minimal yang mendaftarkan tool agen. Plugin saluran
dan provider memiliki panduan khusus yang ditautkan di atas.

<Steps>
  <Step title="Buat package dan manifest">
    <CodeGroup>
    ```json package.json
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

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Menambahkan tool kustom ke OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Setiap plugin membutuhkan manifest, bahkan tanpa config. Lihat
    [Manifest](/id/plugins/manifest) untuk skema lengkapnya. Potongan publish ClawHub
    kanonis ada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Tulis entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Menambahkan tool kustom ke OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Lakukan sesuatu",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Diterima: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` digunakan untuk plugin non-saluran. Untuk saluran, gunakan
    `defineChannelPluginEntry` — lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins).
    Untuk opsi entry point lengkap, lihat [Entry Points](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spesifikasi package biasa seperti
    `@myorg/openclaw-my-plugin`.

    **Plugin dalam repo:** letakkan di bawah tree ruang kerja plugin bundled — akan ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capability plugin

Satu plugin dapat mendaftarkan sejumlah capability apa pun melalui objek `api`:

| Capability             | Metode pendaftaran                              | Panduan terperinci                                                               |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Provider](/id/plugins/sdk-provider-plugins)                                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/id/gateway/cli-backends)                                           |
| Saluran / pesan        | `api.registerChannel(...)`                       | [Plugin Saluran](/id/plugins/sdk-channel-plugins)                                  |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web search             | `api.registerWebSearchProvider(...)`             | [Plugin Provider](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Middleware hasil tool  | `api.registerAgentToolResultMiddleware(...)`     | [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api)                          |
| Tool agen              | `api.registerTool(...)`                          | Di bawah                                                                        |
| Perintah kustom        | `api.registerCommand(...)`                       | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Hook plugin            | `api.on(...)`                                    | [Plugin hooks](/id/plugins/hooks)                                                  |
| Hook event internal    | `api.registerHook(...)`                          | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internals](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                           | [Entry Points](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Plugin bundled dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat mereka
memerlukan penulisan ulang hasil tool async sebelum model melihat outputnya. Deklarasikan
runtime yang ditargetkan di `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam plugin bundled tepercaya; plugin
eksternal sebaiknya memilih hook plugin OpenClaw biasa kecuali OpenClaw memperluas
kebijakan kepercayaan yang eksplisit untuk capability ini.

Jika plugin Anda mendaftarkan metode Gateway RPC kustom, simpan di
prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke
`operator.admin`, bahkan jika plugin meminta scope yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di saluran mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.
- `message_received`: pilih field `threadId` yang bertipe saat Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus saluran.
- `message_sending`: pilih field perutean `replyToId` / `threadId` yang bertipe alih-alih kunci metadata khusus saluran.

Perintah `/approve` menangani persetujuan exec dan plugin dengan fallback terbatas: saat id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan plugin. Penerusan persetujuan plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` di config.

Jika pengkabelan persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
pilih `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
alih-alih mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Plugin hooks](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan tool agen

Tool adalah fungsi bertipe yang dapat dipanggil oleh LLM. Tool bisa wajib (selalu
tersedia) atau opsional (opt-in pengguna):

```typescript
register(api) {
  // Tool wajib — selalu tersedia
  api.registerTool({
    name: "my_tool",
    description: "Lakukan sesuatu",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Tool opsional — pengguna harus menambahkannya ke allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Jalankan workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Pengguna mengaktifkan tool opsional di config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama tool tidak boleh bentrok dengan tool inti (konflik akan dilewati)
- Gunakan `optional: true` untuk tool dengan efek samping atau kebutuhan binary tambahan
- Pengguna dapat mengaktifkan semua tool dari plugin dengan menambahkan id plugin ke `tools.allow`

## Konvensi impor

Selalu impor dari path fokus `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Salah: root monolitik (deprecated, akan dihapus)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi subpath lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
impor internal — jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk plugin provider, simpan helper khusus provider di barrel root package tersebut kecuali seam-nya benar-benar generik. Contoh bundled saat ini:

- Anthropic: pembungkus stream Claude dan helper `service_tier` / beta
- OpenAI: builder provider, helper model default, provider realtime
- OpenRouter: builder provider plus helper onboarding/config

Jika sebuah helper hanya berguna di dalam satu package provider bundled, simpan di
seam root package tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan dan kompatibilitas plugin bundled, misalnya
`plugin-sdk/feishu-setup` atau `plugin-sdk/zalo-setup`. Perlakukan ini sebagai
permukaan yang dicadangkan, bukan pola default untuk plugin pihak ketiga baru.

## Checklist pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path fokus `plugin-sdk/<subpath>`</Check>
<Check>Impor internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian Rilis Beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di saluran Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Cantumkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR dan thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomasi. Blocker yang memiliki PR akan di-merge; blocker tanpa PR mungkin tetap dirilis. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendelanya, perbaikan Anda kemungkinan masuk di siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin saluran pesan
  </Card>
  <Card title="Plugin Provider" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin provider model
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran
  </Card>
  <Card title="Helper Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagen melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — pendalaman arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi Plugin SDK
- [Manifest](/id/plugins/manifest) — format manifest plugin
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) — membangun plugin saluran
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun plugin provider
