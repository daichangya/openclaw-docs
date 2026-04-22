---
read_when:
    - Menambahkan atau memodifikasi Skills
    - Mengubah gating Skill atau aturan pemuatan
summary: 'Skills: dikelola vs workspace, aturan gating, dan pengkabelan konfigurasi/env'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw menggunakan folder skill yang kompatibel dengan **[AgentSkills](https://agentskills.io)** untuk mengajari agen cara menggunakan tool. Setiap skill adalah direktori yang berisi `SKILL.md` dengan frontmatter YAML dan instruksi. OpenClaw memuat **skill bawaan** plus override lokal opsional, lalu memfilternya saat waktu muat berdasarkan lingkungan, konfigurasi, dan keberadaan biner.

## Lokasi dan prioritas

OpenClaw memuat Skills dari sumber berikut:

1. **Folder skill tambahan**: dikonfigurasi dengan `skills.load.extraDirs`
2. **Skill bawaan**: dikirim bersama instalasi (paket npm atau OpenClaw.app)
3. **Skill terkelola/lokal**: `~/.openclaw/skills`
4. **Skill agen pribadi**: `~/.agents/skills`
5. **Skill agen proyek**: `<workspace>/.agents/skills`
6. **Skill workspace**: `<workspace>/skills`

Jika nama skill bentrok, urutan prioritasnya adalah:

`<workspace>/skills` (tertinggi) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → skill bawaan → `skills.load.extraDirs` (terendah)

## Skills per agen vs bersama

Dalam penyiapan **multi-agen**, setiap agen memiliki workspace sendiri. Artinya:

- **Skill per agen** berada di `<workspace>/skills` hanya untuk agen tersebut.
- **Skill agen proyek** berada di `<workspace>/.agents/skills` dan berlaku untuk
  workspace tersebut sebelum folder `skills/` workspace normal.
- **Skill agen pribadi** berada di `~/.agents/skills` dan berlaku di seluruh
  workspace pada mesin tersebut.
- **Skill bersama** berada di `~/.openclaw/skills` (terkelola/lokal) dan terlihat
  oleh **semua agen** pada mesin yang sama.
- **Folder bersama** juga dapat ditambahkan melalui `skills.load.extraDirs` (prioritas
  terendah) jika Anda menginginkan paket Skills umum yang digunakan oleh beberapa agen.

Jika nama skill yang sama ada di lebih dari satu tempat, urutan prioritas biasa
berlaku: workspace menang, lalu skill agen proyek, lalu skill agen pribadi,
lalu terkelola/lokal, lalu bawaan, lalu direktori tambahan.

## Allowlist Skill per agen

**Lokasi** skill dan **visibilitas** skill adalah kontrol yang terpisah.

- Lokasi/prioritas menentukan salinan skill bernama sama mana yang menang.
- Allowlist agen menentukan skill yang terlihat mana yang benar-benar dapat digunakan oleh agen.

Gunakan `agents.defaults.skills` untuk baseline bersama, lalu override per agen dengan
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi github, weather
      { id: "docs", skills: ["docs-search"] }, // mengganti default
      { id: "locked-down", skills: [] }, // tanpa Skills
    ],
  },
}
```

Aturan:

- Hilangkan `agents.defaults.skills` untuk Skills tak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi `agents.defaults.skills`.
- Atur `agents.list[].skills: []` untuk tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah himpunan final untuk agen tersebut; daftar itu
  tidak digabung dengan default.

OpenClaw menerapkan himpunan Skill agen yang efektif di seluruh pembangunan prompt,
penemuan slash-command skill, sinkronisasi sandbox, dan snapshot skill.

## Plugin + Skills

Plugin dapat mengirim Skills mereka sendiri dengan mencantumkan direktori `skills` di
`openclaw.plugin.json` (path relatif terhadap root Plugin). Skill Plugin dimuat
saat Plugin diaktifkan. Saat ini direktori tersebut digabung ke path
berprioritas rendah yang sama dengan `skills.load.extraDirs`, sehingga skill bawaan,
terkelola, agen, atau workspace dengan nama yang sama akan menimpanya.
Anda dapat me-gate skill tersebut melalui `metadata.openclaw.requires.config` pada entri konfigurasi Plugin.
Lihat [Plugins](/id/tools/plugin) untuk discovery/konfigurasi dan [Tools](/id/tools) untuk
permukaan tool yang diajarkan skill tersebut.

## Skill Workshop

Plugin Skill Workshop yang opsional dan eksperimental dapat membuat atau memperbarui skill
workspace dari prosedur reusable yang diamati selama pekerjaan agen. Plugin ini nonaktif
secara default dan harus diaktifkan secara eksplisit melalui
`plugins.entries.skill-workshop`.

Skill Workshop hanya menulis ke `<workspace>/skills`, memindai konten yang dihasilkan,
mendukung persetujuan tertunda atau penulisan aman otomatis, mengarantina
proposal yang tidak aman, dan me-refresh snapshot skill setelah penulisan berhasil agar
skill baru dapat tersedia tanpa restart Gateway.

Gunakan saat Anda ingin koreksi seperti “lain kali, verifikasi atribusi GIF” atau
alur kerja yang didapat dengan susah payah seperti checklist QA media menjadi
instruksi prosedural yang tahan lama. Mulailah dengan persetujuan tertunda; gunakan
penulisan otomatis hanya di workspace tepercaya setelah meninjau proposalnya. Panduan lengkap:
[Skill Workshop Plugin](/id/plugins/skill-workshop).

## ClawHub (instal + sinkronisasi)

ClawHub adalah registry skill publik untuk OpenClaw. Jelajahi di
[https://clawhub.ai](https://clawhub.ai). Gunakan perintah native `openclaw skills`
untuk menemukan/menginstal/memperbarui skill, atau CLI `clawhub` terpisah saat
Anda memerlukan alur kerja publish/sinkronisasi.
Panduan lengkap: [ClawHub](/id/tools/clawhub).

Alur umum:

- Instal skill ke workspace Anda:
  - `openclaw skills install <skill-slug>`
- Perbarui semua skill yang terinstal:
  - `openclaw skills update --all`
- Sinkronisasi (pindai + publikasikan pembaruan):
  - `clawhub sync --all`

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. CLI `clawhub` terpisah juga menginstal ke `./skills` di bawah
direktori kerja Anda saat ini (atau menggunakan fallback ke workspace OpenClaw yang dikonfigurasi).
OpenClaw akan mengambilnya sebagai `<workspace>/skills` pada sesi berikutnya.

## Catatan keamanan

- Perlakukan skill pihak ketiga sebagai **kode yang tidak tepercaya**. Baca sebelum mengaktifkannya.
- Pilih run yang di-sandbox untuk input tidak tepercaya dan tool berisiko. Lihat [Sandboxing](/id/gateway/sandboxing).
- Discovery skill workspace dan extra-dir hanya menerima root skill dan file `SKILL.md` yang realpath hasil resolve-nya tetap berada di dalam root yang dikonfigurasi.
- Instal dependensi skill yang didukung Gateway (`skills.install`, onboarding, dan UI pengaturan Skills) menjalankan scanner kode berbahaya bawaan sebelum mengeksekusi metadata installer. Temuan `critical` memblokir secara default kecuali pemanggil secara eksplisit menetapkan override berbahaya; temuan mencurigakan tetap hanya memberi peringatan.
- `openclaw skills install <slug>` berbeda: perintah ini mengunduh folder skill ClawHub ke workspace dan tidak menggunakan path metadata installer di atas.
- `skills.entries.*.env` dan `skills.entries.*.apiKey` menyuntikkan secret ke proses **host**
  untuk giliran agen tersebut (bukan sandbox). Jauhkan secret dari prompt dan log.
- Untuk model ancaman dan checklist yang lebih luas, lihat [Security](/id/gateway/security).

## Format (kompatibel dengan AgentSkills + Pi)

`SKILL.md` minimal harus menyertakan:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Catatan:

- Kami mengikuti spesifikasi AgentSkills untuk layout/tujuan.
- Parser yang digunakan oleh agen tertanam hanya mendukung key frontmatter **satu baris**.
- `metadata` harus berupa **objek JSON satu baris**.
- Gunakan `{baseDir}` dalam instruksi untuk mereferensikan path folder skill.
- Key frontmatter opsional:
  - `homepage` — URL yang ditampilkan sebagai “Website” di UI Skills macOS (juga didukung melalui `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (default: `true`). Jika `true`, skill diekspos sebagai slash command pengguna.
  - `disable-model-invocation` — `true|false` (default: `false`). Jika `true`, skill dikecualikan dari prompt model (tetap tersedia melalui pemanggilan pengguna).
  - `command-dispatch` — `tool` (opsional). Jika diatur ke `tool`, slash command melewati model dan langsung di-dispatch ke tool.
  - `command-tool` — nama tool yang akan dipanggil saat `command-dispatch: tool` diatur.
  - `command-arg-mode` — `raw` (default). Untuk dispatch tool, meneruskan string argumen mentah ke tool (tanpa parsing inti).

    Tool dipanggil dengan parameter:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filter saat waktu muat)

OpenClaw **memfilter skill saat waktu muat** menggunakan `metadata` (JSON satu baris):

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

- `always: true` — selalu sertakan skill (lewati gate lain).
- `emoji` — emoji opsional yang digunakan oleh UI Skills macOS.
- `homepage` — URL opsional yang ditampilkan sebagai “Website” di UI Skills macOS.
- `os` — daftar platform opsional (`darwin`, `linux`, `win32`). Jika diatur, skill hanya memenuhi syarat pada OS tersebut.
- `requires.bins` — daftar; masing-masing harus ada di `PATH`.
- `requires.anyBins` — daftar; setidaknya satu harus ada di `PATH`.
- `requires.env` — daftar; variabel lingkungan harus ada **atau** disediakan dalam konfigurasi.
- `requires.config` — daftar path `openclaw.json` yang harus truthy.
- `primaryEnv` — nama variabel lingkungan yang terkait dengan `skills.entries.<name>.apiKey`.
- `install` — array opsional spesifikasi installer yang digunakan oleh UI Skills macOS (brew/node/go/uv/download).

Catatan tentang sandboxing:

- `requires.bins` diperiksa pada **host** saat waktu muat skill.
- Jika agen di-sandbox, biner juga harus ada **di dalam container**.
  Instal melalui `agents.defaults.sandbox.docker.setupCommand` (atau image kustom).
  `setupCommand` berjalan sekali setelah container dibuat.
  Instal paket juga memerlukan network egress, root FS yang dapat ditulis, dan pengguna root di sandbox.
  Contoh: skill `summarize` (`skills/summarize/SKILL.md`) memerlukan CLI `summarize`
  di dalam container sandbox untuk berjalan di sana.

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

- Jika beberapa installer dicantumkan, gateway memilih **satu** opsi yang diprioritaskan (brew jika tersedia, jika tidak node).
- Jika semua installer adalah `download`, OpenClaw mencantumkan setiap entri agar Anda dapat melihat artefak yang tersedia.
- Spesifikasi installer dapat menyertakan `os: ["darwin"|"linux"|"win32"]` untuk memfilter opsi berdasarkan platform.
- Instal Node mematuhi `skills.install.nodeManager` di `openclaw.json` (default: npm; opsi: npm/pnpm/yarn/bun).
  Ini hanya memengaruhi **instal skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
- Pemilihan installer yang didukung Gateway berbasis preferensi, bukan hanya node:
  saat spesifikasi instal mencampur berbagai jenis, OpenClaw lebih memilih Homebrew saat
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi, lalu fallback lain seperti `go` atau `download`.
- Jika setiap spesifikasi instal adalah `download`, OpenClaw menampilkan semua opsi download
  alih-alih meringkasnya menjadi satu installer pilihan.
- Instal Go: jika `go` tidak ada dan `brew` tersedia, gateway menginstal Go melalui Homebrew terlebih dahulu dan mengatur `GOBIN` ke `bin` milik Homebrew jika memungkinkan.
- Instal download: `url` (wajib), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (default: otomatis saat arsip terdeteksi), `stripComponents`, `targetDir` (default: `~/.openclaw/tools/<skillKey>`).

Jika tidak ada `metadata.openclaw`, skill selalu memenuhi syarat (kecuali
dinonaktifkan dalam konfigurasi atau diblokir oleh `skills.allowBundled` untuk skill bawaan).

## Override konfigurasi (`~/.openclaw/openclaw.json`)

Skill bawaan/terkelola dapat diaktifkan/nonaktifkan dan diberi nilai env:

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

Catatan: jika nama skill mengandung tanda hubung, beri tanda kutip pada key tersebut (JSON5 mengizinkan key yang diberi tanda kutip).

Jika Anda menginginkan generasi/edit gambar bawaan di dalam OpenClaw sendiri, gunakan tool inti
`image_generate` dengan `agents.defaults.imageGenerationModel` alih-alih
skill bawaan. Contoh skill di sini ditujukan untuk alur kerja kustom atau pihak ketiga.

Untuk analisis gambar native, gunakan tool `image` dengan `agents.defaults.imageModel`.
Untuk generasi/edit gambar native, gunakan `image_generate` dengan
`agents.defaults.imageGenerationModel`. Jika Anda memilih `openai/*`, `google/*`,
`fal/*`, atau model gambar khusus provider lainnya, tambahkan juga auth/API key
provider tersebut.

Key konfigurasi secara default cocok dengan **nama skill**. Jika sebuah skill mendefinisikan
`metadata.openclaw.skillKey`, gunakan key tersebut di bawah `skills.entries`.

Aturan:

- `enabled: false` menonaktifkan skill meskipun skill tersebut bawaan/terinstal.
- `env`: disuntikkan **hanya jika** variabel tersebut belum diatur di proses.
- `apiKey`: kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).
- `config`: bag opsional untuk field kustom per-skill; key kustom harus berada di sini.
- `allowBundled`: allowlist opsional hanya untuk skill **bawaan**. Jika diatur, hanya
  skill bawaan dalam daftar yang memenuhi syarat (skill terkelola/workspace tidak terpengaruh).

## Injeksi lingkungan (per run agen)

Saat run agen dimulai, OpenClaw:

1. Membaca metadata skill.
2. Menerapkan `skills.entries.<key>.env` atau `skills.entries.<key>.apiKey` apa pun ke
   `process.env`.
3. Membangun system prompt dengan skill yang **memenuhi syarat**.
4. Memulihkan lingkungan asli setelah run berakhir.

Ini **dicakup ke run agen**, bukan lingkungan shell global.

Untuk backend `claude-cli` bawaan, OpenClaw juga mematerialisasikan snapshot yang sama
yang memenuhi syarat sebagai Plugin Claude Code sementara dan meneruskannya dengan
`--plugin-dir`. Claude Code kemudian dapat menggunakan resolver skill native-nya sementara
OpenClaw tetap memiliki prioritas, allowlist per agen, gating, dan
injeksi env/API key `skills.entries.*`. Backend CLI lain hanya menggunakan
katalog prompt.

## Snapshot sesi (kinerja)

OpenClaw membuat snapshot dari skill yang memenuhi syarat **saat sesi dimulai** dan menggunakan ulang daftar itu untuk giliran berikutnya dalam sesi yang sama. Perubahan pada skill atau konfigurasi berlaku pada sesi baru berikutnya.

Skill juga dapat di-refresh di tengah sesi saat watcher skill diaktifkan atau saat node jarak jauh baru yang memenuhi syarat muncul (lihat di bawah). Anggap ini sebagai **hot reload**: daftar yang diperbarui akan digunakan pada giliran agen berikutnya.

Jika allowlist Skill agen efektif berubah untuk sesi tersebut, OpenClaw
me-refresh snapshot agar skill yang terlihat tetap selaras dengan agen saat ini.

## Node macOS jarak jauh (gateway Linux)

Jika Gateway berjalan di Linux tetapi **node macOS** terhubung **dengan `system.run` diizinkan** (keamanan persetujuan Exec tidak diatur ke `deny`), OpenClaw dapat memperlakukan skill khusus macOS sebagai memenuhi syarat saat biner yang diperlukan ada pada node tersebut. Agen harus mengeksekusi skill tersebut melalui tool `exec` dengan `host=node`.

Ini bergantung pada node yang melaporkan dukungan perintahnya dan pada probe bin melalui `system.run`. Jika node macOS kemudian offline, skill tetap terlihat; pemanggilan mungkin gagal sampai node tersambung kembali.

## Watcher Skills (refresh otomatis)

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

Saat Skills memenuhi syarat, OpenClaw menyuntikkan daftar XML ringkas dari Skills yang tersedia ke dalam system prompt (melalui `formatSkillsForPrompt` di `pi-coding-agent`). Biayanya deterministik:

- **Overhead dasar (hanya saat ≥1 skill):** 195 karakter.
- **Per skill:** 97 karakter + panjang nilai `<name>`, `<description>`, dan `<location>` yang sudah di-escape XML.

Rumus (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Catatan:

- Escape XML memperluas `& < > " '` menjadi entitas (`&amp;`, `&lt;`, dll.), sehingga menambah panjang.
- Jumlah token bervariasi menurut tokenizer model. Estimasi kasar gaya OpenAI adalah ~4 karakter/token, jadi **97 karakter ≈ 24 token** per skill ditambah panjang field Anda yang sebenarnya.

## Siklus hidup skill terkelola

OpenClaw mengirimkan sekumpulan skill dasar sebagai **skill bawaan** sebagai bagian dari
instalasi (paket npm atau OpenClaw.app). `~/.openclaw/skills` ada untuk override lokal
(misalnya, mem-pin/mem-patch skill tanpa mengubah salinan
bawaan). Skill workspace dimiliki pengguna dan menimpa keduanya saat terjadi konflik nama.

## Referensi konfigurasi

Lihat [Skills config](/id/tools/skills-config) untuk skema konfigurasi lengkap.

## Mencari lebih banyak Skills?

Jelajahi [https://clawhub.ai](https://clawhub.ai).

---

## Terkait

- [Creating Skills](/id/tools/creating-skills) — membangun skill kustom
- [Skills Config](/id/tools/skills-config) — referensi konfigurasi skill
- [Slash Commands](/id/tools/slash-commands) — semua slash command yang tersedia
- [Plugins](/id/tools/plugin) — ikhtisar sistem Plugin
