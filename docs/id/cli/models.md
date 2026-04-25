---
read_when:
    - Anda ingin mengubah model default atau melihat status auth provider
    - Anda ingin memindai model/provider yang tersedia dan men-debug profil auth
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Model-model
x-i18n:
    generated_at: "2026-04-25T13:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil auth).

Terkait:

- Provider + model: [Models](/id/providers/models)
- Konsep pemilihan model + perintah slash `/models`: [Models concept](/id/concepts/models)
- Penyiapan auth provider: [Getting started](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang telah di-resolve beserta ringkasan auth.
Saat snapshot penggunaan provider tersedia, bagian status OAuth/API-key mencakup
window penggunaan provider dan snapshot kuota.
Provider window penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus provider
saat tersedia; jika tidak, OpenClaw menggunakan fallback dengan mencocokkan kredensial OAuth/API-key
dari profil auth, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan provider yang sadar env/config/store,
sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe auth live terhadap setiap profil provider yang dikonfigurasi.
Probe adalah permintaan nyata (dapat menghabiskan token dan memicu rate limit).
Gunakan `--agent <id>` untuk memeriksa status model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak
menggunakan agen default yang dikonfigurasi.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat read-only: perintah ini membaca config, profil auth, status katalog
  yang ada, dan baris katalog milik provider, tetapi tidak menulis ulang
  `models.json`.
- `models list --all` menyertakan baris katalog statis milik provider bawaan bahkan
  saat Anda belum melakukan autentikasi dengan provider tersebut. Baris itu tetap ditampilkan
  sebagai tidak tersedia sampai auth yang cocok dikonfigurasi.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam
  output tabel, `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari context window native; baris JSON menyertakan `contextTokens`
  saat provider mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id provider, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari interactive provider
  picker, seperti `Moonshot AI`.
- Ref model di-parse dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefix provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan provider terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian
  menggunakan fallback ke provider default yang dikonfigurasi dengan peringatan deprecation.
  Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  menggunakan fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan
  default provider yang sudah dihapus dan usang.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### `models scan`

`models scan` membaca katalog publik OpenRouter `:free` dan memberi peringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri bersifat publik, jadi pemindaian metadata-saja tidak memerlukan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model live.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah menggunakan fallback ke output metadata-saja
dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (metadata saja; tanpa lookup config/secret)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (permintaan katalog dan timeout per-probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe live; hasil pemindaian metadata-saja
bersifat informatif dan tidak diterapkan ke config.

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (probe live terhadap profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu provider)
- `--probe-profile <id>` (dapat diulang atau dipisahkan koma untuk beberapa id profil)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen terkonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/kode alasan probe yang dapat diharapkan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi
  `auth.order.<provider>` yang eksplisit menghilangkannya, jadi probe melaporkan pengecualian itu alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat di-resolve.
- `no_model`: auth provider ada, tetapi OpenClaw tidak dapat me-resolve
  kandidat model yang dapat di-probe untuk provider tersebut.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profil auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper auth interaktif. Perintah ini dapat meluncurkan alur auth provider
(OAuth/API key) atau memandu Anda ke penempelan token manual, bergantung pada
provider yang Anda pilih.

`models auth login` menjalankan alur auth Plugin provider (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat provider mana yang terinstal.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `setup-token` dan `paste-token` tetap merupakan perintah token generik untuk provider
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode token-auth provider
  (default ke metode `setup-token` provider tersebut saat tersedia).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomatisasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menulis
  ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai diizinkan untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [CLI reference](/id/cli)
- [Model selection](/id/concepts/model-providers)
- [Model failover](/id/concepts/model-failover)
