---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah aturan gating atau pemuatan Skills
summary: 'Skills: terkelola vs workspace, aturan gating, dan wiring config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw menggunakan folder skill yang kompatibel dengan **[AgentSkills](https://agentskills.io)** untuk mengajarkan agen cara menggunakan tool. Setiap skill adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat **Skills bawaan** ditambah override lokal opsional, lalu memfilternya saat waktu pemuatan berdasarkan environment, config, dan keberadaan biner.

## Lokasi dan prioritas

OpenClaw memuat Skills dari sumber berikut:

1. **Folder skill tambahan**: dikonfigurasi dengan `skills.load.extraDirs`
2. **Skills bawaan**: dikirim bersama instalasi (package npm atau OpenClaw.app)
3. **Skills terkelola/lokal**: `~/.openclaw/skills`
4. **Skills agen personal**: `~/.agents/skills`
5. **Skills agen proyek**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Jika nama skill bertabrakan, urutan prioritasnya adalah:

`<workspace>/skills` (tertinggi) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills bawaan → `skills.load.extraDirs` (terendah)

## Skills per-agent vs bersama

Dalam penyiapan **multi-agent**, setiap agen memiliki workspace sendiri. Itu berarti:

- **Skills per-agent** berada di `<workspace>/skills` hanya untuk agen tersebut.
- **Skills agen proyek** berada di `<workspace>/.agents/skills` dan berlaku untuk
  workspace tersebut sebelum folder `skills/` workspace normal.
- **Skills agen personal** berada di `~/.agents/skills` dan berlaku di seluruh
  workspace pada mesin tersebut.
- **Skills bersama** berada di `~/.openclaw/skills` (terkelola/lokal) dan terlihat
  oleh **semua agen** pada mesin yang sama.
- **Folder bersama** juga dapat ditambahkan melalui `skills.load.extraDirs` (prioritas
  terendah) jika Anda menginginkan paket skill umum yang digunakan oleh banyak agen.

Jika nama skill yang sama ada di lebih dari satu tempat, prioritas biasa
berlaku: workspace menang, lalu Skills agen proyek, lalu Skills agen personal,
lalu terkelola/lokal, lalu bawaan, lalu extra dirs.

## Allowlist skill agen

**Lokasi** skill dan **visibilitas** skill adalah kontrol yang terpisah.

- Lokasi/prioritas menentukan salinan mana dari skill dengan nama yang sama yang menang.
- Allowlist agen menentukan skill mana yang terlihat yang benar-benar dapat digunakan oleh agen.

Gunakan `agents.defaults.skills` untuk baseline bersama, lalu timpa per agen dengan
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

Aturan:

- Hilangkan `agents.defaults.skills` untuk skill yang tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
- Set `agents.list[].skills: []` untuk tanpa skill.
- Daftar `agents.list[].skills` yang tidak kosong adalah set akhir untuk agen tersebut; itu
  tidak digabung dengan default.

OpenClaw menerapkan set skill agen efektif di seluruh pembangunan prompt, penemuan slash-command skill, sinkronisasi sandbox, dan snapshot skill.

## Plugin + Skills

Plugin dapat mengirim skill mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root Plugin). Skill Plugin dimuat
saat Plugin diaktifkan. Ini adalah tempat yang tepat untuk panduan operasi khusus tool
yang terlalu panjang untuk deskripsi tool tetapi harus tersedia
kapan pun Plugin diinstal; misalnya, plugin browser mengirim skill
`browser-automation` untuk kontrol browser multi-langkah. Saat ini direktori-direktori tersebut digabung ke jalur prioritas rendah yang sama seperti
`skills.load.extraDirs`, sehingga skill bawaan, terkelola, agen, atau workspace
dengan nama yang sama akan menimpanya.
Anda dapat melakukan gating terhadapnya melalui `metadata.openclaw.requires.config` pada entri config Plugin.
Lihat [Plugin](/id/tools/plugin) untuk penemuan/config dan [Tools](/id/tools) untuk
permukaan tool yang diajarkan oleh skill tersebut.

## Skill Workshop

Plugin Skill Workshop yang opsional dan eksperimental dapat membuat atau memperbarui Skills workspace
dari prosedur yang dapat digunakan ulang yang diamati selama pekerjaan agen. Plugin ini nonaktif secara default dan harus diaktifkan secara eksplisit melalui
`plugins.entries.skill-workshop`.

Skill Workshop hanya menulis ke `<workspace>/skills`, memindai konten yang dihasilkan,
mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina
usulan yang tidak aman, dan menyegarkan snapshot skill setelah penulisan berhasil agar skill baru dapat tersedia tanpa restart Gateway.

Gunakan ini saat Anda ingin koreksi seperti “lain kali, verifikasi atribusi GIF” atau
alur kerja yang diperoleh dengan susah payah seperti checklist QA media menjadi instruksi prosedural yang tahan lama. Mulailah dengan persetujuan tertunda; gunakan
penulisan otomatis hanya di workspace tepercaya setelah meninjau usulannya. Panduan lengkap:
[Plugin Skill Workshop](/id/plugins/skill-workshop).

## ClawHub (instal + sinkronisasi)

ClawHub adalah registri Skills publik untuk OpenClaw. Jelajahi di
[https://clawhub.ai](https://clawhub.ai). Gunakan perintah native `openclaw skills`
untuk menemukan/menginstal/memperbarui skill, atau CLI `clawhub` terpisah saat
Anda memerlukan alur kerja publish/sync.
Panduan lengkap: [ClawHub](/id/tools/clawhub).

Alur umum:

- Instal skill ke workspace Anda:
  - `openclaw skills install <skill-slug>`
- Perbarui semua skill yang terinstal:
  - `openclaw skills update --all`
- Sinkronkan (pindai + publikasikan pembaruan):
  - `clawhub sync --all`

`openclaw skills install` native menginstal ke direktori `skills/`
workspace aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah
direktori kerja Anda saat ini (atau fallback ke workspace OpenClaw yang dikonfigurasi).
OpenClaw akan mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.

## Catatan keamanan

- Perlakukan skill pihak ketiga sebagai **kode tidak tepercaya**. Baca sebelum mengaktifkannya.
- Utamakan run tersandbox untuk input tidak tepercaya dan tool berisiko. Lihat [Sandboxing](/id/gateway/sandboxing).
- Penemuan skill workspace dan extra-dir hanya menerima root skill dan file `SKILL.md` yang realpath hasil resolve-nya tetap berada di dalam root yang dikonfigurasi.
- Instalasi dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan pemindai dangerous-code bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menetapkan dangerous override; temuan mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda: ini mengunduh folder skill ClawHub ke workspace dan tidak menggunakan jalur metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke proses **host**
  untuk giliran agen tersebut (bukan sandbox). Jauhkan secret dari prompt dan log.
- Untuk threat model dan checklist yang lebih luas, lihat [Keamanan](/id/gateway/security).

## Format (AgentSkills + kompatibel dengan Pi)

`SKILL.md` setidaknya harus menyertakan:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Catatan:

- Kami mengikuti spesifikasi AgentSkills untuk layout/maksud.
- Parser yang digunakan oleh agen tersemat hanya mendukung key frontmatter **satu baris**.
- `metadata` harus berupa **objek JSON satu baris**.
- Gunakan `{baseDir}` dalam instruksi untuk mereferensikan path folder skill.
- Key frontmatter opsional:
  - `homepage` — URL yang ditampilkan sebagai “Website” di UI Skills macOS (juga didukung melalui `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (default: `true`). Saat `true`, skill diekspos sebagai slash command pengguna.
  - `disable-model-invocation` — `true|false` (default: `false`). Saat `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
  - `command-dispatch` — `tool` (opsional). Saat disetel ke `tool`, slash command melewati model dan langsung dikirim ke tool.
  - `command-tool` — nama tool yang akan dipanggil saat `command-dispatch: tool` disetel.
  - `command-arg-mode` — `raw` (default). Untuk dispatch tool, meneruskan string arg mentah ke tool (tanpa parsing inti).

    Tool dipanggil dengan params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filter saat waktu pemuatan)

OpenClaw **memfilter Skills saat waktu pemuatan** menggunakan `metadata` (JSON satu baris):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Field di bawah `metadata.openclaw`:

- `always: true` — selalu sertakan skill (lewati gating lain).
- `emoji` — emoji opsional yang digunakan oleh UI Skills macOS.
- `homepage` — URL opsional yang ditampilkan sebagai “Website” di UI Skills macOS.
- `os` — daftar platform opsional (`darwin`, `linux`, `win32`). Jika disetel, skill hanya memenuhi syarat pada OS tersebut.
- `requires.bins` — daftar; masing-masing harus ada di `PATH`.
- `requires.anyBins` — daftar; setidaknya satu harus ada di `PATH`.
- `requires.env` — daftar; variabel env harus ada **atau** disediakan dalam config.
- `requires.config` — daftar path `openclaw.json` yang harus truthy.
- `primaryEnv` — nama variabel env yang terkait dengan `skills.entries.<name>.apiKey`.
- `install` — array opsional spesifikasi installer yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).

Blok `metadata.clawdbot` lama masih diterima ketika
`metadata.openclaw` tidak ada, sehingga skill lama yang sudah diinstal tetap mempertahankan
gating dependensi dan petunjuk installer mereka. Skills baru dan yang diperbarui harus menggunakan
`metadata.openclaw`.

Catatan tentang sandboxing:

- `requires.bins` diperiksa pada **host** saat waktu pemuatan skill.
- Jika suatu agen disandbox, binernya juga harus ada **di dalam container**.
  Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom).
  `setupCommand` berjalan sekali setelah container dibuat.
  Instalasi package juga memerlukan network egress, root FS yang dapat ditulis, dan user root di sandbox.
  Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize`
  di dalam container sandbox agar dapat berjalan di sana.

Contoh installer:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Catatan:

- Jika beberapa installer dicantumkan, gateway memilih satu opsi **preferensi** (brew jika tersedia, jika tidak node).
- Jika semua installer adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
- Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi menurut platform.
- Instalasi node menghormati `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
- Pemilihan installer yang didukung Gateway didorong oleh preferensi, bukan hanya node:
  saat spesifikasi install mencampur berbagai jenis, OpenClaw mengutamakan Homebrew saat
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
- Jika setiap spesifikasi install adalah `download`, OpenClaw menampilkan semua opsi unduhan
  alih-alih menciutkannya menjadi satu installer yang dipilih.
- Instalasi Go: jika `go` tidak ada dan `brew` tersedia, gateway akan menginstal Go melalui Homebrew terlebih dahulu dan menyetel `GOBIN` ke `bin` milik Homebrew jika memungkinkan.
- Instalasi unduhan: `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat archive terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali
dinonaktifkan dalam config atau diblokir oleh `skills.allowBundled` untuk Skills bawaan).

## Override config (`~/.openclaw/openclaw.json`)

Skills bawaan/terkelola dapat diaktifkan/dinonaktifkan dan diberi nilai env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Catatan: jika nama skill mengandung tanda hubung, beri tanda kutip pada key tersebut (JSON5 mengizinkan key bertanda kutip).

Jika Anda menginginkan pembuatan/pengeditan gambar bawaan di dalam OpenClaw sendiri, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
skill bawaan. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.

Untuk analisis gambar native, gunakan tool `image` dengan `agents.defaults.imageModel`.
Untuk pembuatan/pengeditan gambar native, gunakan `image_generate` dengan
`agents.defaults.imageGenerationModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus penyedia lainnya, tambahkan auth/API
key penyedia tersebut juga.

Key config cocok dengan **nama skill** secara default. Jika suatu skill mendefinisikan
`metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`.

Aturan:

- `enabled: false` menonaktifkan skill meskipun skill tersebut dibundel/diinstal.
- `env`: disuntikkan **hanya jika** variabel tersebut belum disetel di proses.
- `apiKey`: kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).
- `config`: bag opsional untuk field kustom per-skill; key kustom harus berada di sini.
- `allowBundled`: allowlist opsional hanya untuk **Skills bawaan**. Jika disetel, hanya
  Skills bawaan dalam daftar yang memenuhi syarat (Skills terkelola/workspace tidak terpengaruh).

## Penyuntikan environment (per run agen)

Saat run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` atau `skills.entries.<key>.apiKey` ke
   `process.env`.
3. Membangun prompt sistem dengan Skills yang **memenuhi syarat**.
4. Memulihkan environment asli setelah run berakhir.

Ini **dicakup ke run agen**, bukan environment shell global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mewujudkan snapshot eligible yang sama sebagai Plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya sementara
OpenClaw tetap memiliki prioritas, allowlist per-agent, gating, dan
penyuntikan env/API key `skills.entries.*`. Backend CLI lain hanya menggunakan
katalog prompt.

## Snapshot sesi (performa)

OpenClaw membuat snapshot Skills yang memenuhi syarat **saat sesi dimulai** dan menggunakan ulang daftar itu untuk giliran berikutnya dalam sesi yang sama. Perubahan pada Skills atau config berlaku pada sesi baru berikutnya.

Skills juga dapat disegarkan di tengah sesi saat watcher Skills diaktifkan atau saat node remote baru yang memenuhi syarat muncul (lihat di bawah). Anggap ini sebagai **hot reload**: daftar yang disegarkan akan diambil pada giliran agen berikutnya.

Jika allowlist skill agen efektif berubah untuk sesi tersebut, OpenClaw
menyegarkan snapshot agar Skills yang terlihat tetap selaras dengan agen saat ini.

## Node macOS remote (Gateway Linux)

Jika Gateway berjalan di Linux tetapi **node macOS** terhubung **dengan `system.run` diizinkan** (keamanan Persetujuan exec tidak disetel ke `deny`), OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat saat biner yang diperlukan ada di node tersebut. Agen harus mengeksekusi skill tersebut melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin melalui `system.run`. Jika node macOS kemudian offline, skill tersebut tetap terlihat; pemanggilan dapat gagal sampai node tersambung kembali.

## Watcher Skills (penyegaran otomatis)

Secara default, OpenClaw memantau folder skill dan menaikkan snapshot Skills saat file `SKILL.md` berubah. Konfigurasikan ini di bawah `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Dampak token (daftar Skills)

Saat Skills memenuhi syarat, OpenClaw menyuntikkan daftar XML ringkas dari skill yang tersedia ke prompt sistem (melalui `formatSkillsForPrompt` di `pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar (hanya saat ≥1 skill):** 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang di-escape XML.

Rumus (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Catatan:

- XML escaping memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.), sehingga menambah panjang.
- Jumlah token bervariasi menurut tokenizer model. Perkiraan kasar bergaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per skill ditambah panjang field aktual Anda.

## Siklus hidup Skills terkelola

OpenClaw mengirim set baseline Skills sebagai **Skills bawaan** sebagai bagian dari
instalasi (package npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk override lokal
(misalnya, pinning/patching skill tanpa mengubah salinan bawaan).
Skills workspace dimiliki pengguna dan menimpa keduanya saat terjadi konflik nama.

## Referensi config

Lihat [config Skills](/id/tools/skills-config) untuk skema konfigurasi lengkap.

## Mencari lebih banyak Skills?

Jelajahi [https://clawhub.ai](https://clawhub.ai).

---

## Terkait

- [Membuat Skills](/id/tools/creating-skills) — membangun skill kustom
- [Config Skills](/id/tools/skills-config) — referensi konfigurasi skill
- [Slash Commands](/id/tools/slash-commands) — semua slash command yang tersedia
- [Plugin](/id/tools/plugin) — gambaran umum sistem Plugin
