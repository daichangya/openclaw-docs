---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasi, dan kelola plugin OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-21T09:24:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugin memperluas OpenClaw dengan kemampuan baru: channel, provider model,
tool, Skills, speech, transkripsi realtime, voice realtime,
media-understanding, pembuatan gambar, pembuatan video, web fetch, web
search, dan lainnya. Beberapa plugin bersifat **core** (dikirim bersama OpenClaw), yang lain
bersifat **eksternal** (dipublikasikan di npm oleh komunitas).

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

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file konfigurasi Anda.

  </Step>
</Steps>

Jika Anda lebih suka kontrol native chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Jalur instalasi menggunakan resolver yang sama seperti CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi package polos (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika konfigurasi tidak valid, instalasi biasanya gagal-tertutup dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur reinstall plugin bawaan yang sempit
untuk plugin yang memilih ikut serta ke
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw dalam bentuk paket tidak secara eager menginstal seluruh pohon dependensi runtime setiap plugin bawaan.
Saat plugin milik OpenClaw bawaan aktif dari konfigurasi plugin, konfigurasi channel lama, atau manifest default-enabled, perbaikan saat startup hanya memperbaiki dependensi runtime yang dideklarasikan plugin tersebut sebelum mengimpornya.
Plugin eksternal dan jalur pemuatan kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                    | Contoh                                                  |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi in-process    | Plugin resmi, package npm komunitas                     |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di `openclaw plugins list`. Lihat [Plugin Bundles](/id/plugins/bundles) untuk detail bundle.

Jika Anda menulis plugin native, mulai dari [Building Plugins](/id/plugins/building-plugins)
dan [Plugin SDK Overview](/id/plugins/sdk-overview).

## Plugin resmi

### Dapat diinstal (npm)

| Plugin          | Package                | Dokumen                              |
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

  <Accordion title="Plugin memory">
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang instal-saat-dibutuhkan dengan auto-recall/capture (setel `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (aktif secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin Browser bawaan untuk tool browser, CLI `openclaw browser`, metode gateway `browser.request`, runtime browser, dan layanan kontrol browser default (aktif secara default; nonaktifkan sebelum menggantinya)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Deskripsi                                                |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Toggle master (default: `true`)                          |
| `allow`          | allowlist plugin (opsional)                              |
| `deny`           | denylist plugin (opsional; deny menang)                  |
| `load.paths`     | File/direktori plugin tambahan                           |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)  |
| `entries.\<id\>` | Toggle per-plugin + konfigurasi                          |

Perubahan konfigurasi **memerlukan restart gateway**. Jika Gateway berjalan dengan config
watch + restart in-process aktif (jalur `openclaw gateway` default), restart
itu biasanya dilakukan otomatis sesaat setelah penulisan konfigurasi selesai.

<Accordion title="Status plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin ada tetapi aturan enablement menonaktifkannya. Konfigurasi tetap dipertahankan.
  - **Missing**: konfigurasi merujuk ke ID plugin yang tidak ditemukan oleh discovery.
  - **Invalid**: plugin ada tetapi konfigurasinya tidak cocok dengan skema yang dideklarasikan.
</Accordion>

## Discovery dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama yang menang):

<Steps>
  <Step title="Path konfigurasi">
    `plugins.load.paths` — path file atau direktori eksplisit.
  </Step>

  <Step title="Workspace extensions">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global extensions">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang aktif secara default (provider model, speech).
    Yang lain memerlukan enablement eksplisit.
  </Step>
</Steps>

### Aturan enablement

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal workspace **nonaktif secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set default-on bawaan kecuali dioverride
- Slot eksklusif dapat memaksa pengaktifan plugin yang dipilih untuk slot tersebut

## Slot plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

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

| Slot            | Yang dikontrol          | Default        |
| --------------- | ----------------------- | -------------- |
| `memory`        | Plugin memory aktif     | `memory-core`  |
| `contextEngine` | Engine konteks aktif    | `legacy` (bawaan) |

## Referensi CLI

```bash
openclaw plugins list                       # inventaris ringkas
openclaw plugins list --enabled            # hanya plugin yang dimuat
openclaw plugins list --verbose            # baris detail per plugin
openclaw plugins list --json               # inventaris yang dapat dibaca mesin
openclaw plugins inspect <id>              # detail mendalam
openclaw plugins inspect <id> --json       # dapat dibaca mesin
openclaw plugins inspect --all             # tabel seluruh armada
openclaw plugins info <id>                 # alias inspect
openclaw plugins doctor                    # diagnostik

openclaw plugins install <package>         # instal (ClawHub terlebih dahulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # link (tanpa copy) untuk dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm hasil resolve yang tepat
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # perbarui satu plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # perbarui semua
openclaw plugins uninstall <id>          # hapus catatan konfigurasi/instalasi
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin bawaan dikirim bersama OpenClaw. Banyak yang aktif secara default (misalnya
provider model bawaan, provider speech bawaan, dan plugin Browser
bawaan). Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau paket hook yang sudah terinstal di tempat.
Opsi ini tidak didukung dengan `--link`, yang menggunakan kembali path sumber alih-alih
menyalin ke target instalasi terkelola.

`--pin` hanya untuk npm. Opsi ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi plugin
dan pembaruan plugin tetap berlanjut melewati temuan `critical` bawaan, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran karena kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai sebagai gantinya, sedangkan `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

Bundle yang kompatibel ikut serta dalam alur list/inspect/enable/disable plugin yang sama.
Dukungan runtime saat ini mencakup skill bundle, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan `lspServers` yang dideklarasikan manifest,
command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kemampuan bundle yang terdeteksi serta entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin yang didukung bundle.

Sumber marketplace dapat berupa nama known-marketplace Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace jarak jauh, entri plugin harus tetap berada di dalam
repo marketplace yang di-clone dan hanya menggunakan sumber path relatif.

Lihat [referensi CLI `openclaw plugins`](/cli/plugins) untuk detail lengkap.

## Ringkasan API plugin

Plugin native mengekspor objek entri yang mengekspos `register(api)`. Plugin yang lebih lama
mungkin masih menggunakan `activate(api)` sebagai alias lama, tetapi plugin baru harus
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
plugin. Loader masih melakukan fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin eksternal baru harus memperlakukan `register` sebagai
kontrak publik.

Metode registrasi umum:

| Method                                  | Yang didaftarkan            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider model (LLM)        |
| `registerChannel`                       | Channel chat                |
| `registerTool`                          | Tool agen                   |
| `registerHook` / `on(...)`              | Hook siklus hidup           |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Voice realtime dupleks      |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio       |
| `registerImageGenerationProvider`       | Pembuatan gambar            |
| `registerMusicGenerationProvider`       | Pembuatan musik             |
| `registerVideoGenerationProvider`       | Pembuatan video             |
| `registerWebFetchProvider`              | Provider fetch / scrape web |
| `registerWebSearchProvider`             | Pencarian web               |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Perintah CLI                |
| `registerContextEngine`                 | Engine konteks              |
| `registerService`                       | Layanan latar belakang      |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok yang lebih awal.
- `before_install`: `{ block: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok yang lebih awal.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler prioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel yang lebih awal.

Untuk perilaku hook bertipe lengkap, lihat [SDK Overview](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Building Plugins](/id/plugins/building-plugins) — buat plugin Anda sendiri
- [Plugin Bundles](/id/plugins/bundles) — kompatibilitas bundle Codex/Claude/Cursor
- [Plugin Manifest](/id/plugins/manifest) — skema manifest
- [Registering Tools](/id/plugins/building-plugins#registering-agent-tools) — tambahkan tool agen dalam plugin
- [Plugin Internals](/id/plugins/architecture) — model kemampuan dan pipeline pemuatan
- [Community Plugins](/id/plugins/community) — daftar pihak ketiga
