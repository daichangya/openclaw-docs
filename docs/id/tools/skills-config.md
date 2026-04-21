---
read_when:
    - Menambahkan atau memodifikasi konfigurasi Skills
    - Menyesuaikan allowlist bawaan atau perilaku instalasi
summary: Schema konfigurasi Skills dan contohnya
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-04-21T09:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Konfigurasi Skills

Sebagian besar konfigurasi loader/instalasi Skills berada di bawah `skills` dalam
`~/.openclaw/openclaw.json`. Visibilitas skill khusus agen berada di bawah
`agents.defaults.skills` dan `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway tetap Node; bun tidak direkomendasikan)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Untuk pembuatan/pengeditan gambar bawaan, utamakan `agents.defaults.imageGenerationModel`
ditambah tool inti `image_generate`. `skills.entries.*` hanya untuk alur kerja skill kustom atau
pihak ketiga.

Jika Anda memilih provider/model gambar tertentu, konfigurasikan juga
auth/API key provider tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Konfigurasi gaya Nano Banana native: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Konfigurasi fal native: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist skill agen

Gunakan konfigurasi agen ketika Anda menginginkan root skill mesin/workspace yang sama, tetapi
dengan himpunan skill yang terlihat berbeda per agen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi default -> github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

Aturan:

- `agents.defaults.skills`: baseline allowlist bersama untuk agen yang menghilangkan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
- `agents.list[].skills`: himpunan skill final eksplisit untuk agen tersebut; tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: jangan tampilkan skill apa pun untuk agen tersebut.

## Field

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: allowlist opsional hanya untuk Skills **bawaan**. Saat diatur, hanya
  Skills bawaan dalam daftar yang memenuhi syarat (skill terkelola, agen, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (prioritas terendah).
- `load.watch`: pantau folder skill dan segarkan snapshot Skills (default: true).
- `load.watchDebounceMs`: debounce untuk peristiwa watcher skill dalam milidetik (default: 250).
- `install.preferBrew`: utamakan installer brew saat tersedia (default: true).
- `install.nodeManager`: preferensi installer node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Setel `skills.install.nodeManager: "yarn"` secara manual jika Anda
    menginginkan instalasi skill berbasis Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist skill default opsional yang diwarisi oleh agen
  yang menghilangkan `agents.list[].skills`.
- `agents.list[].skills`: allowlist skill final per agen yang opsional; daftar eksplisit
  menggantikan default turunan alih-alih menggabungkannya.

Field per skill:

- `enabled`: setel `false` untuk menonaktifkan skill meskipun skill itu bawaan/terinstal.
- `env`: variabel lingkungan yang disuntikkan untuk proses agen (hanya jika belum diatur).
- `apiKey`: kemudahan opsional untuk skill yang mendeklarasikan variabel env utama.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Key di bawah `entries` dipetakan ke nama skill secara default. Jika suatu skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key itu sebagai gantinya.
- Prioritas pemuatan adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills bawaan →
  `skills.load.extraDirs`.
- Perubahan pada skill diambil pada giliran agen berikutnya saat watcher diaktifkan.

### Skills tersandbox + variabel env

Saat sebuah sesi **tersandbox**, proses skill berjalan di dalam
backend sandbox yang dikonfigurasi. Sandbox **tidak** mewarisi `process.env` host.

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` untuk backend Docker (atau `agents.list[].sandbox.docker.env` per agen)
- bake env ke image sandbox kustom Anda atau lingkungan sandbox jarak jauh

`env` global dan `skills.entries.<skill>.env/apiKey` hanya berlaku untuk proses **host**.
