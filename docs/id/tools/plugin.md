---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasi, dan kelola plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-23T09:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin memperluas OpenClaw dengan kapabilitas baru: channel, provider model,
tool, Skills, speech, transkripsi realtime, voice realtime,
pemahaman media, pembuatan gambar, pembuatan video, web fetch, web
search, dan lainnya. Beberapa plugin bersifat **core** (dikirim bersama OpenClaw), yang lain
bersifat **external** (dipublikasikan di npm oleh komunitas).

## Mulai cepat

<Steps>
  <Step title="Lihat apa yang dimuat">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instal plugin">
    ```bash
    # Dari npm
    openclaw plugins install @openclaw/voice-call

    # Dari direktori atau arsip lokal
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` di file config Anda.

  </Step>
</Steps>

Jika Anda lebih suka kontrol native-chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi package polos (ClawHub terlebih dahulu, lalu fallback npm).

Jika config tidak valid, instalasi biasanya gagal tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur instal ulang plugin bawaan yang sempit
untuk plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw yang dipaketkan tidak langsung menginstal seluruh pohon
dependensi runtime setiap plugin bawaan. Ketika plugin milik OpenClaw bawaan aktif dari
config plugin, config channel lama, atau manifest yang aktif secara default, startup
hanya memperbaiki dependensi runtime yang dideklarasikan oleh plugin tersebut sebelum mengimpornya.
Plugin external dan load path kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                   | Contoh                                                 |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi in-process    | Plugin resmi, package npm komunitas                    |
| **Bundle** | Layout yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Plugin Bundles](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dari [Building Plugins](/id/plugins/building-plugins)
dan [Plugin SDK Overview](/id/plugins/sdk-overview).

## Plugin resmi

### Dapat diinstal (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/id/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/id/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/id/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/id/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/id/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/id/plugins/zalouser)   |

### Core (dikirim bersama OpenClaw)

<AccordionGroup>
  <Accordion title="Provider model (aktif secara default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin memori">
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang instal-sesuai-kebutuhan dengan auto-recall/capture (atur `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (aktif secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk tool browser, CLI `openclaw browser`, method Gateway `browser.request`, runtime browser, dan layanan kontrol browser default (aktif secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (nonaktif secara default)
  </Accordion>
</AccordionGroup>

Mencari plugin pihak ketiga? Lihat [Community Plugins](/id/plugins/community).

## Konfigurasi

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                            |
| `allow`          | Allowlist plugin (opsional)                               |
| `deny`           | Denylist plugin (opsional; deny menang)                   |
| `load.paths`     | File/direktori plugin tambahan                            |
| `slots`          | Pemilih slot eksklusif (misalnya `memory`, `contextEngine`) |
| `entries.\<id\>` | Toggle + config per-plugin                                |

Perubahan config **memerlukan restart Gateway**. Jika Gateway berjalan dengan config
watch + restart in-process diaktifkan (jalur default `openclaw gateway`), restart
tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan config selesai.

<Accordion title="Status plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin ada tetapi aturan enablement mematikannya. Config dipertahankan.
  - **Missing**: config merujuk ke ID plugin yang tidak ditemukan oleh discovery.
  - **Invalid**: plugin ada tetapi config-nya tidak cocok dengan schema yang dideklarasikan.
</Accordion>

## Discovery dan precedence

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama menang):

<Steps>
  <Step title="Path config">
    `plugins.load.paths` — file atau path direktori eksplisit.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang aktif secara default (provider model, speech).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

### Aturan enablement

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin yang berasal dari workspace **nonaktif secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-on bawaan kecuali dioverride
- Slot eksklusif dapat memaksa plugin yang dipilih untuk slot tersebut menjadi aktif

## Slot plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif dalam satu waktu):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // atau "none" untuk menonaktifkan
      contextEngine: "legacy", // atau ID plugin
    },
  },
}
```

| Slot            | Apa yang dikontrol      | Default             |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin memori aktif     | `memory-core`       |
| `contextEngine` | Context engine aktif    | `legacy` (bawaan)   |

## Referensi CLI

```bash
openclaw plugins list                       # inventaris ringkas
openclaw plugins list --enabled            # hanya plugin yang dimuat
openclaw plugins list --verbose            # baris detail per-plugin
openclaw plugins list --json               # inventaris yang dapat dibaca mesin
openclaw plugins inspect <id>              # detail mendalam
openclaw plugins inspect <id> --json       # dapat dibaca mesin
openclaw plugins inspect --all             # tabel seluruh armada
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostik

openclaw plugins install <package>         # instal (ClawHub dulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # tautkan (tanpa salin) untuk dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolve yang tepat
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # perbarui satu plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # perbarui semua
openclaw plugins uninstall <id>          # hapus catatan config/instalasi
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang aktif secara default (misalnya
provider model bawaan, provider speech bawaan, dan plugin browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau hook pack yang sudah terinstal di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk upgrade rutin plugin npm
yang dilacak. Opsi ini tidak didukung dengan `--link`, yang menggunakan ulang source path alih-alih
menyalin ke target instalasi terkelola.

`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spesifikasi package npm dengan dist-tag atau versi tepat akan me-resolve nama package
kembali ke catatan plugin yang dilacak dan mencatat spesifikasi baru untuk pembaruan di masa depan.
Memberikan nama package tanpa versi akan memindahkan instalasi exact pinned kembali ke
jalur rilis default registry. Jika plugin npm yang terinstal sudah cocok
dengan versi hasil resolve dan identitas artefak yang tercatat, OpenClaw melewati update
tanpa mengunduh, menginstal ulang, atau menulis ulang config.

`--pin` hanya untuk npm. Opsi ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace, bukan spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Ini memungkinkan instalasi plugin
dan update plugin untuk tetap lanjut melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instal/update plugin. Instalasi dependensi
skill yang didukung Gateway menggunakan override request `dangerouslyForceUnsafeInstall`
yang sesuai, sementara `openclaw skills install` tetap merupakan alur unduh/instal skill ClawHub yang terpisah.

Bundle yang kompatibel ikut serta dalam alur `plugin list`/`inspect`/`enable`/`disable` yang sama.
Dukungan runtime saat ini mencakup Skills bundle, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan `lspServers`
yang dideklarasikan manifest, command-skills Cursor, serta direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundle yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin yang didukung bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, shorthand GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace remote, entri plugin harus tetap berada di dalam
repo marketplace yang dikloning dan hanya menggunakan sumber path relatif.

Lihat referensi CLI [`openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Gambaran API plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin
lama mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi plugin baru sebaiknya
menggunakan `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw memuat objek entri dan memanggil `register(api)` selama aktivasi
plugin. Loader masih fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin external baru sebaiknya memperlakukan `register` sebagai
kontrak publik.

Metode pendaftaran umum:

| Method                                  | Yang didaftarkan            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider model (LLM)        |
| `registerChannel`                       | Channel chat                |
| `registerTool`                          | Tool agent                  |
| `registerHook` / `on(...)`              | Hook siklus hidup           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Voice realtime duplex       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio       |
| `registerImageGenerationProvider`       | Pembuatan gambar            |
| `registerMusicGenerationProvider`       | Pembuatan musik             |
| `registerVideoGenerationProvider`       | Pembuatan video             |
| `registerWebFetchProvider`              | Provider web fetch / scrape |
| `registerWebSearchProvider`             | Pencarian web               |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Perintah CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Layanan latar belakang      |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Untuk perilaku hook bertipe lengkap, lihat [SDK Overview](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Plugin Bundles](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Plugin Manifest](/id/plugins/manifest) — schema manifest
- [Registering Tools](/id/plugins/building-plugins#registering-agent-tools) — tambahkan tool agent dalam plugin
- [Plugin Internals](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Community Plugins](/id/plugins/community) — daftar pihak ketiga
