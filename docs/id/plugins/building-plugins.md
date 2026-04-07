---
read_when:
    - Anda ingin membuat plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan plugin
    - Anda sedang menambahkan saluran, penyedia, alat, atau kapabilitas lain baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-04-07T09:15:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Membangun Plugin

Plugin memperluas OpenClaw dengan kapabilitas baru: saluran, penyedia model,
speech, realtime transcription, realtime voice, media understanding, image
generation, video generation, web fetch, web search, agent tools, atau
kombinasi apa pun.

Anda tidak perlu menambahkan plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) atau npm dan pengguna dapat memasangnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
secara otomatis fallback ke npm.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk plugin di dalam repo: repositori sudah di-clone dan `pnpm install` sudah dijalankan

## Plugin jenis apa?

<CardGroup cols={3}>
  <Card title="Plugin saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench">
    Daftarkan agent tools, event hooks, atau service — lanjutkan di bawah
  </Card>
</CardGroup>

Jika plugin saluran bersifat opsional dan mungkin belum terpasang saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Fungsi ini menghasilkan pasangan adapter setup + wizard
yang mengiklankan persyaratan instalasi dan gagal secara tertutup pada penulisan config nyata
sampai plugin dipasang.

## Mulai cepat: plugin alat

Panduan ini membuat plugin minimal yang mendaftarkan agent tool. Plugin saluran
dan penyedia memiliki panduan khusus yang ditautkan di atas.

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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Setiap plugin memerlukan manifest, bahkan tanpa config. Lihat
    [Manifest](/id/plugins/manifest) untuk skema lengkapnya. Snippet publish ClawHub
    kanonis berada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Tulis entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
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

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu pasang:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spesifikasi package polos seperti
    `@myorg/openclaw-my-plugin`.

    **Plugin di dalam repo:** tempatkan di bawah pohon workspace plugin bundel — akan ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kapabilitas plugin

Satu plugin dapat mendaftarkan sejumlah kapabilitas apa pun melalui objek `api`:

| Kapabilitas           | Metode pendaftaran                             | Panduan terperinci                                                              |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)  | `api.registerProvider(...)`                    | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                                |
| Backend inferensi CLI | `api.registerCliBackend(...)`                  | [Backend CLI](/id/gateway/cli-backends)                                            |
| Saluran / pesan       | `api.registerChannel(...)`                     | [Plugin Saluran](/id/plugins/sdk-channel-plugins)                                  |
| Speech (TTS/STT)      | `api.registerSpeechProvider(...)`              | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice        | `api.registerRealtimeVoiceProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Media understanding   | `api.registerMediaUnderstandingProvider(...)`  | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Image generation      | `api.registerImageGenerationProvider(...)`     | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Music generation      | `api.registerMusicGenerationProvider(...)`     | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Video generation      | `api.registerVideoGenerationProvider(...)`     | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web fetch             | `api.registerWebFetchProvider(...)`            | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web search            | `api.registerWebSearchProvider(...)`           | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Agent tools           | `api.registerTool(...)`                        | Di bawah                                                                        |
| Perintah kustom       | `api.registerCommand(...)`                     | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Event hooks           | `api.registerHook(...)`                        | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP             | `api.registerHttpRoute(...)`                   | [Internal](/id/plugins/architecture#gateway-http-routes)                           |
| Subperintah CLI       | `api.registerCli(...)`                         | [Entry Points](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Jika plugin Anda mendaftarkan metode RPC gateway kustom, simpan metode tersebut pada
prefix khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke
`operator.admin`, meskipun plugin meminta cakupan yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agent dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di saluran mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.

Perintah `/approve` menangani persetujuan exec dan plugin dengan fallback terbatas: ketika ID persetujuan exec tidak ditemukan, OpenClaw mencoba ulang ID yang sama melalui persetujuan plugin. Forwarding persetujuan plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` di config.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
gunakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
alih-alih mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Semantik keputusan hook Ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics) untuk detailnya.

## Mendaftarkan agent tools

Tools adalah fungsi bertipe yang dapat dipanggil LLM. Tools dapat bersifat wajib (selalu
tersedia) atau opsional (memerlukan opt-in pengguna):

```typescript
register(api) {
  // Tool wajib — selalu tersedia
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Tool opsional — pengguna harus menambahkannya ke allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
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
- Gunakan `optional: true` untuk tool dengan efek samping atau persyaratan biner tambahan
- Pengguna dapat mengaktifkan semua tool dari sebuah plugin dengan menambahkan ID plugin ke `tools.allow`

## Konvensi import

Selalu import dari path `openclaw/plugin-sdk/<subpath>` yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Salah: root monolitik (deprecated, akan dihapus)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi subpath lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
import internal — jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk plugin penyedia, simpan helper khusus penyedia dalam barrel akar package tersebut
kecuali jika seam-nya benar-benar generik. Contoh bundel saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia plus helper onboarding/config

Jika sebuah helper hanya berguna di dalam satu package penyedia bundel, simpan helper itu pada
seam akar package tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan plugin bundel dan kompatibilitas, misalnya
`plugin-sdk/feishu-setup` atau `plugin-sdk/zalo-setup`. Perlakukan itu sebagai
permukaan yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Checklist sebelum pengiriman

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua import menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Import internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin di dalam repo)</Check>

## Pengujian Rilis Beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum rilis stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di saluran Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi-PR untuk maintainer dan otomasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dirilis. Maintainer memantau thread-thread ini selama pengujian beta.
6. Tidak ada kabar berarti aman. Jika Anda melewatkan jendela itu, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin saluran pesan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Peta import dan referensi API pendaftaran
  </Card>
  <Card title="Helper Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagent melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — penjelasan mendalam arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi Plugin SDK
- [Manifest](/id/plugins/manifest) — format manifest plugin
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) — membangun plugin saluran
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun plugin penyedia
