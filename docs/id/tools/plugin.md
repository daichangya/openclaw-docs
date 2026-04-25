---
read_when:
    - Menginstal atau mengonfigurasi plugin
    - Memahami aturan penemuan dan pemuatan plugin
    - Bekerja dengan bundel plugin yang kompatibel dengan Codex/Claude
sidebarTitle: Install and Configure
summary: Instal, konfigurasikan, dan kelola plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-25T13:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugin memperluas OpenClaw dengan kapabilitas baru: channel, provider model,
agent harnesses, tool, Skills, speech, transkripsi realtime, suara realtime,
pemahaman media, pembuatan gambar, pembuatan video, web fetch, web
search, dan lainnya. Sebagian plugin bersifat **core** (dikirim bersama OpenClaw), yang lain
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

    # Dari direktori lokal atau arsip
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    Lalu konfigurasikan di bawah `plugins.entries.\<id\>.config` dalam file config Anda.

  </Step>
</Steps>

Jika Anda lebih suka kontrol native-chat, aktifkan `commands.plugins: true` dan gunakan:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Path instalasi menggunakan resolver yang sama dengan CLI: path/arsip lokal, `clawhub:<pkg>`
eksplisit, atau spesifikasi package polos (ClawHub terlebih dahulu, lalu fallback ke npm).

Jika config tidak valid, instalasi biasanya gagal secara fail-closed dan mengarahkan Anda ke
`openclaw doctor --fix`. Satu-satunya pengecualian pemulihan adalah jalur reinstall plugin bawaan yang sempit
untuk plugin yang ikut serta dalam
`openclaw.install.allowInvalidConfigRecovery`.

Instalasi OpenClaw yang dipaketkan tidak langsung menginstal setiap pohon dependensi runtime
plugin bawaan. Saat plugin bawaan milik OpenClaw aktif dari
config plugin, config channel lama, atau manifest default-enabled, startup
hanya memperbaiki dependensi runtime yang dideklarasikan plugin itu sebelum mengimpornya.
Penonaktifan eksplisit tetap menang: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, dan `channels.<id>.enabled: false`
mencegah perbaikan dependensi runtime bawaan otomatis untuk plugin/channel tersebut.
Plugin external dan path muat kustom tetap harus diinstal melalui
`openclaw plugins install`.

## Jenis plugin

OpenClaw mengenali dua format plugin:

| Format     | Cara kerjanya                                                  | Contoh                                                 |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modul runtime; dieksekusi in-process  | Plugin resmi, package npm komunitas                    |
| **Bundle** | Tata letak yang kompatibel dengan Codex/Claude/Cursor; dipetakan ke fitur OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Keduanya muncul di bawah `openclaw plugins list`. Lihat [Bundel Plugin](/id/plugins/bundles) untuk detail bundel.

Jika Anda menulis plugin native, mulailah dengan [Membangun Plugin](/id/plugins/building-plugins)
dan [Ikhtisar Plugin SDK](/id/plugins/sdk-overview).

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
  <Accordion title="Provider model (diaktifkan secara default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin memori">
    - `memory-core` — pencarian memori bawaan (default melalui `plugins.slots.memory`)
    - `memory-lancedb` — memori jangka panjang install-on-demand dengan auto-recall/capture (atur `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider speech (diaktifkan secara default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Lainnya">
    - `browser` — plugin browser bawaan untuk tool browser, CLI `openclaw browser`, metode Gateway `browser.request`, runtime browser, dan layanan kontrol browser default (diaktifkan secara default; nonaktifkan sebelum menggantinya)
    - `copilot-proxy` — jembatan VS Code Copilot Proxy (dinonaktifkan secara default)
  </Accordion>
</AccordionGroup>

Mencari plugin pihak ketiga? Lihat [Plugin Komunitas](/id/plugins/community).

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

| Field            | Deskripsi                                                |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | Toggle utama (default: `true`)                           |
| `allow`          | Allowlist plugin (opsional)                              |
| `deny`           | Denylist plugin (opsional; deny menang)                  |
| `load.paths`     | File/direktori plugin tambahan                           |
| `slots`          | Pemilih slot eksklusif (mis. `memory`, `contextEngine`)  |
| `entries.\<id\>` | Toggle + config per-plugin                               |

Perubahan config **memerlukan restart gateway**. Jika Gateway berjalan dengan config
watch + restart in-process diaktifkan (jalur default `openclaw gateway`), restart
tersebut biasanya dilakukan secara otomatis sesaat setelah penulisan config selesai.
Tidak ada jalur hot-reload yang didukung untuk kode runtime plugin native atau hook
siklus hidup; mulai ulang proses Gateway yang melayani channel live sebelum
mengharapkan kode `register(api)` yang diperbarui, hook `api.on(...)`, tool, layanan, atau
hook provider/runtime dijalankan.

`openclaw plugins list` adalah snapshot CLI/config lokal. Plugin `loaded` di sana
berarti plugin dapat ditemukan dan dimuat dari config/file yang dilihat oleh
pemanggilan CLI tersebut. Itu tidak membuktikan bahwa child Gateway remote yang sudah berjalan
telah dimulai ulang ke kode plugin yang sama. Pada setup VPS/container dengan proses
wrapper, kirim restart ke proses `openclaw gateway run` yang sebenarnya, atau gunakan
`openclaw gateway restart` terhadap Gateway yang sedang berjalan.

<Accordion title="Status plugin: disabled vs missing vs invalid">
  - **Disabled**: plugin ada tetapi aturan enablement menonaktifkannya. Config tetap dipertahankan.
  - **Missing**: config mereferensikan id plugin yang tidak ditemukan oleh discovery.
  - **Invalid**: plugin ada tetapi config-nya tidak cocok dengan skema yang dideklarasikan.
</Accordion>

## Discovery dan prioritas

OpenClaw memindai plugin dalam urutan ini (kecocokan pertama yang menang):

<Steps>
  <Step title="Path config">
    `plugins.load.paths` — path file atau direktori eksplisit.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` dan `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin global">
    `~/.openclaw/<plugin-root>/*.ts` dan `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin bawaan">
    Dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (provider model, speech).
    Yang lain memerlukan pengaktifan eksplisit.
  </Step>
</Steps>

### Aturan enablement

- `plugins.enabled: false` menonaktifkan semua plugin
- `plugins.deny` selalu menang atas allow
- `plugins.entries.\<id\>.enabled: false` menonaktifkan plugin tersebut
- Plugin asal workspace **dinonaktifkan secara default** (harus diaktifkan secara eksplisit)
- Plugin bawaan mengikuti set bawaan-default-on kecuali dioverride
- Slot eksklusif dapat memaksa mengaktifkan plugin yang dipilih untuk slot tersebut
- Beberapa plugin bawaan opt-in diaktifkan secara otomatis saat config menamai
  permukaan milik plugin, seperti model ref provider, config channel, atau runtime
  harness
- Rute Codex keluarga OpenAI menjaga batas plugin terpisah:
  `openai-codex/*` milik plugin OpenAI, sedangkan plugin app-server Codex bawaan
  dipilih oleh `embeddedHarness.runtime: "codex"` atau model ref lama `codex/*`

## Pemecahan masalah hook runtime

Jika sebuah plugin muncul di `plugins list` tetapi efek samping `register(api)` atau hook
tidak berjalan di trafik chat live, periksa ini terlebih dahulu:

- Jalankan `openclaw gateway status --deep --require-rpc` dan konfirmasikan
  URL Gateway aktif, profil, path config, dan proses adalah yang sedang Anda edit.
- Mulai ulang Gateway live setelah perubahan instalasi/config/kode plugin. Dalam
  container wrapper, PID 1 mungkin hanya supervisor; mulai ulang atau kirim sinyal ke child process
  `openclaw gateway run`.
- Gunakan `openclaw plugins inspect <id> --json` untuk mengonfirmasi registrasi hook dan
  diagnostik. Hook percakapan non-bawaan seperti `llm_input`,
  `llm_output`, dan `agent_end` memerlukan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Untuk pengalihan model, utamakan `before_model_resolve`. Ini berjalan sebelum resolusi
  model untuk giliran agent; `llm_output` hanya berjalan setelah percobaan model
  menghasilkan output asisten.
- Untuk bukti model sesi efektif, gunakan `openclaw sessions` atau
  permukaan sesi/status Gateway dan, saat men-debug payload provider, mulai
  Gateway dengan `--raw-stream --raw-stream-path <path>`.

## Slot plugin (kategori eksklusif)

Beberapa kategori bersifat eksklusif (hanya satu yang aktif pada satu waktu):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // atau "none" untuk menonaktifkan
      contextEngine: "legacy", // atau id plugin
    },
  },
}
```

| Slot            | Yang dikontrol        | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin memori aktif   | `memory-core`       |
| `contextEngine` | Mesin konteks aktif   | `legacy` (bawaan)   |

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

openclaw plugins install <package>         # instal (ClawHub terlebih dahulu, lalu npm)
openclaw plugins install clawhub:<pkg>     # instal hanya dari ClawHub
openclaw plugins install <spec> --force    # timpa instalasi yang ada
openclaw plugins install <path>            # instal dari path lokal
openclaw plugins install -l <path>         # tautkan (tanpa salin) untuk pengembangan
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # catat spesifikasi npm yang diselesaikan secara tepat
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

Plugin bawaan dikirim bersama OpenClaw. Banyak yang diaktifkan secara default (misalnya
provider model bawaan, provider speech bawaan, dan plugin browser bawaan).
Plugin bawaan lainnya tetap memerlukan `openclaw plugins enable <id>`.

`--force` menimpa plugin atau hook pack yang sudah terinstal di tempat. Gunakan
`openclaw plugins update <id-or-npm-spec>` untuk peningkatan rutin plugin npm
yang dilacak. Opsi ini tidak didukung dengan `--link`, yang menggunakan ulang path sumber alih-alih
menyalin ke target instalasi terkelola.

Saat `plugins.allow` sudah diatur, `openclaw plugins install` menambahkan
id plugin yang diinstal ke allowlist tersebut sebelum mengaktifkannya, sehingga instalasi
langsung dapat dimuat setelah restart.

`openclaw plugins update <id-or-npm-spec>` berlaku untuk instalasi yang dilacak. Memberikan
spesifikasi package npm dengan dist-tag atau versi tepat akan menyelesaikan nama package
kembali ke catatan plugin yang dilacak dan mencatat spesifikasi baru untuk pembaruan mendatang.
Memberikan nama package tanpa versi memindahkan instalasi yang dipin tepat kembali ke
jalur rilis default registry. Jika plugin npm yang terinstal sudah cocok
dengan versi yang diselesaikan dan identitas artefak yang tercatat, OpenClaw melewati pembaruan
tanpa mengunduh, menginstal ulang, atau menulis ulang config.

`--pin` hanya untuk npm. Opsi ini tidak didukung dengan `--marketplace`, karena
instalasi marketplace menyimpan metadata sumber marketplace alih-alih spesifikasi npm.

`--dangerously-force-unsafe-install` adalah override break-glass untuk false
positive dari pemindai kode berbahaya bawaan. Opsi ini memungkinkan instalasi plugin
dan pembaruan plugin melanjutkan melewati temuan bawaan `critical`, tetapi tetap
tidak melewati blok kebijakan plugin `before_install` atau pemblokiran kegagalan pemindaian.

Flag CLI ini hanya berlaku untuk alur instalasi/pembaruan plugin. Instalasi dependensi skill
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sedangkan `openclaw skills install` tetap menjadi alur unduh/instal skill ClawHub yang terpisah.

Bundel yang kompatibel berpartisipasi dalam alur list/inspect/enable/disable plugin yang sama.
Dukungan runtime saat ini mencakup bundle skills, command-skills Claude,
default Claude `settings.json`, default Claude `.lsp.json` dan
`lspServers` yang dideklarasikan manifest, command-skills Cursor, dan direktori hook Codex yang kompatibel.

`openclaw plugins inspect <id>` juga melaporkan kapabilitas bundel yang terdeteksi serta
entri server MCP dan LSP yang didukung atau tidak didukung untuk plugin berbasis bundel.

Sumber marketplace dapat berupa nama marketplace yang dikenal Claude dari
`~/.claude/plugins/known_marketplaces.json`, root marketplace lokal atau
path `marketplace.json`, singkatan GitHub seperti `owner/repo`, URL repo GitHub,
atau URL git. Untuk marketplace remote, entri plugin harus tetap berada di dalam
repo marketplace yang di-clone dan hanya menggunakan sumber path relatif.

Lihat [referensi CLI `openclaw plugins`](/id/cli/plugins) untuk detail lengkap.

## Ikhtisar API plugin

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
plugin. Loader masih menggunakan fallback ke `activate(api)` untuk plugin lama,
tetapi plugin bawaan dan plugin external baru harus memperlakukan `register` sebagai
kontrak publik.

`api.registrationMode` memberi tahu plugin mengapa entrinya dimuat:

| Mode            | Arti                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Aktivasi runtime. Daftarkan tool, hook, layanan, perintah, route, dan efek samping live lainnya.                              |
| `discovery`     | Penemuan kapabilitas hanya-baca. Daftarkan provider dan metadata; kode entri plugin tepercaya dapat dimuat, tetapi lewati efek samping live. |
| `setup-only`    | Pemuatan metadata penyiapan channel melalui entri penyiapan ringan.                                                            |
| `setup-runtime` | Pemuatan penyiapan channel yang juga memerlukan entri runtime.                                                                 |
| `cli-metadata`  | Hanya pengumpulan metadata perintah CLI.                                                                                       |

Entri plugin yang membuka socket, database, worker latar belakang, atau klien
berumur panjang harus menjaga efek samping tersebut dengan `api.registrationMode === "full"`.
Pemuatan discovery di-cache secara terpisah dari pemuatan aktivasi dan tidak menggantikan
registry Gateway yang sedang berjalan. Discovery bersifat non-activating, bukan bebas impor:
OpenClaw dapat mengevaluasi entri plugin tepercaya atau modul plugin channel untuk membangun
snapshot. Jaga top level modul tetap ringan dan bebas efek samping, serta pindahkan
klien jaringan, subprocess, listener, pembacaan kredensial, dan startup layanan
ke balik path full-runtime.

Metode pendaftaran umum:

| Method                                  | Yang didaftarkan             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Provider model (LLM)         |
| `registerChannel`                       | Channel chat                 |
| `registerTool`                          | Tool agent                   |
| `registerHook` / `on(...)`              | Hook siklus hidup            |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Suara realtime dupleks       |
| `registerMediaUnderstandingProvider`    | Analisis gambar/audio        |
| `registerImageGenerationProvider`       | Pembuatan gambar             |
| `registerMusicGenerationProvider`       | Pembuatan musik              |
| `registerVideoGenerationProvider`       | Pembuatan video              |
| `registerWebFetchProvider`              | Provider web fetch / scrape  |
| `registerWebSearchProvider`             | Pencarian web                |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Perintah CLI                 |
| `registerContextEngine`                 | Mesin konteks                |
| `registerService`                       | Layanan latar belakang       |

Perilaku guard hook untuk hook siklus hidup bertipe:

- `before_tool_call`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus block yang lebih awal.
- `before_install`: `{ block: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus block yang lebih awal.
- `message_sending`: `{ cancel: true }` bersifat terminal; handler berprioritas lebih rendah dilewati.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel yang lebih awal.

Eksekusi app-server Codex native menjembatani event tool native Codex kembali ke
permukaan hook ini. Plugin dapat memblokir tool native Codex melalui `before_tool_call`,
mengamati hasil melalui `after_tool_call`, dan berpartisipasi dalam persetujuan
`PermissionRequest` Codex. Jembatan ini belum menulis ulang argumen tool native Codex. Batas dukungan runtime Codex yang tepat berada dalam
[kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

Untuk perilaku hook bertipe lengkap, lihat [ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — membuat plugin Anda sendiri
- [Bundel plugin](/id/plugins/bundles) — kompatibilitas bundel Codex/Claude/Cursor
- [Manifest plugin](/id/plugins/manifest) — skema manifest
- [Mendaftarkan tool](/id/plugins/building-plugins#registering-agent-tools) — menambahkan tool agent dalam plugin
- [Internal plugin](/id/plugins/architecture) — model kapabilitas dan pipeline pemuatan
- [Plugin komunitas](/id/plugins/community) — daftar pihak ketiga
