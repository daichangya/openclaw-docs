---
read_when:
    - Menambahkan atau mengubah konfigurasi Skills
    - Menyesuaikan allowlist bawaan atau perilaku instalasi
summary: Skema konfigurasi Skills dan contoh-contohnya
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-04-23T09:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Konfigurasi Skills

Sebagian besar konfigurasi loader/instalasi skill berada di bawah `skills` di
`~/.openclaw/openclaw.json`. Visibilitas skill khusus agent berada di bawah
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway tetap Node; bun tidak disarankan)
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

Untuk generasi/editing gambar bawaan, pilih `agents.defaults.imageGenerationModel`
plus tool core `image_generate`. `skills.entries.*` hanya untuk alur kerja skill
kustom atau pihak ketiga.

Jika Anda memilih provider/model gambar tertentu, konfigurasikan juga
auth/API key provider tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Penyiapan native bergaya Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Penyiapan fal native: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist skill agent

Gunakan konfigurasi agent saat Anda menginginkan root skill mesin/workspace yang sama, tetapi
set skill terlihat yang berbeda per agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi default -> github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa Skills
    ],
  },
}
```

Aturan:

- `agents.defaults.skills`: baseline allowlist bersama untuk agent yang menghilangkan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` untuk membiarkan skill tidak dibatasi secara default.
- `agents.list[].skills`: set skill akhir eksplisit untuk agent tersebut; tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: jangan tampilkan skill apa pun untuk agent tersebut.

## Field

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: allowlist opsional hanya untuk skill **bawaan**. Saat disetel, hanya
  skill bawaan dalam daftar yang memenuhi syarat (skill terkelola, agent, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (prioritas terendah).
- `load.watch`: pantau folder skill dan segarkan snapshot Skills (default: true).
- `load.watchDebounceMs`: debounce untuk peristiwa watcher skill dalam milidetik (default: 250).
- `install.preferBrew`: pilih installer brew jika tersedia (default: true).
- `install.nodeManager`: preferensi installer node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak disarankan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Tetapkan `skills.install.nodeManager: "yarn"` secara manual jika Anda
    ingin instalasi skill berbasis Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist skill default opsional yang diwarisi oleh agent
  yang menghilangkan `agents.list[].skills`.
- `agents.list[].skills`: allowlist skill akhir per agent yang opsional; daftar
  eksplisit menggantikan default yang diwarisi alih-alih menggabungkannya.

Field per skill:

- `enabled`: tetapkan `false` untuk menonaktifkan skill meskipun skill tersebut bawaan/terinstal.
- `env`: variabel lingkungan yang disuntikkan untuk run agent (hanya jika belum disetel).
- `apiKey`: kemudahan opsional untuk skill yang mendeklarasikan env var utama.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Kunci di bawah `entries` dipetakan ke nama skill secara default. Jika suatu skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan kunci itu sebagai gantinya.
- Prioritas pemuatan adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skill bawaan →
  `skills.load.extraDirs`.
- Perubahan pada skill diambil pada giliran agent berikutnya saat watcher diaktifkan.

### Skill tersandbox + env var

Saat sesi **disandbox**, proses skill berjalan di dalam backend
sandbox yang dikonfigurasi. Sandbox **tidak** mewarisi `process.env` host.

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` untuk backend Docker (atau `agents.list[].sandbox.docker.env` per-agent)
- bake env ke image sandbox kustom atau environment sandbox jarak jauh Anda

`env` global dan `skills.entries.<skill>.env/apiKey` hanya berlaku untuk run **host**.
