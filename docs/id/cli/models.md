---
read_when:
    - Anda ingin mengubah model default atau melihat status auth provider
    - Anda ingin memindai model/provider yang tersedia dan men-debug profil auth
summary: Referensi CLI untuk `openclaw models` (`status`/`list`/`set`/`scan`, alias, fallback, auth)
title: models
x-i18n:
    generated_at: "2026-04-23T09:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil auth).

Terkait:

- Provider + model: [Models](/id/providers/models)
- Konsep pemilihan model + slash command `/models`: [konsep Models](/id/concepts/models)
- Penyiapan auth provider: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang di-resolve beserta ringkasan auth.
Saat snapshot penggunaan provider tersedia, bagian status OAuth/API key mencakup
jendela penggunaan provider dan snapshot kuota.
Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus provider
saat tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/API key yang cocok
dari profil auth, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan provider yang sadar env/config/store,
sementara `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe auth live terhadap setiap profil provider yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu rate limit).
Gunakan `--agent <id>` untuk memeriksa status model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak maka
agen default yang dikonfigurasi.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list --all` mencakup baris katalog statis bawaan milik provider bahkan
  saat Anda belum mengautentikasi dengan provider tersebut. Baris tersebut tetap tampil
  sebagai tidak tersedia sampai auth yang cocok dikonfigurasi.
- `models list --provider <id>` memfilter berdasarkan id provider, seperti `moonshot` atau
  `openai-codex`. Ini tidak menerima label tampilan dari pemilih provider interaktif,
  seperti `Moonshot AI`.
- Ref model di-parse dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan provider yang dikonfigurasi dan unik untuk id model persis itu, dan baru setelah itu
  fallback ke provider default yang dikonfigurasi dengan peringatan deprecation.
  Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan
  default provider yang dihapus dan sudah usang.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (exit 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe live untuk profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu provider)
- `--probe-profile <id>` (dapat diulang atau id profil dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen yang dikonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus kode alasan/detail probe yang perlu diharapkan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi
  `auth.order.<provider>` eksplisit menghilangkannya, sehingga probe melaporkan pengecualian itu alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat di-resolve.
- `no_model`: auth provider ada, tetapi OpenClaw tidak dapat me-resolve
  kandidat model yang bisa di-probe untuk provider tersebut.

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

`models auth add` adalah helper auth interaktif. Ini dapat meluncurkan alur auth provider
(OAuth/API key) atau memandu Anda ke penempelan token manual, tergantung pada
provider yang Anda pilih.

`models auth login` menjalankan alur auth plugin provider (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat provider mana yang terinstal.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `setup-token` dan `paste-token` tetap merupakan perintah token generik untuk provider
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode token-auth milik provider
  (default ke metode `setup-token` milik provider tersebut saat ia mengekspos
  satu).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menulis
  ke id profil default `<provider>:manual` kecuali Anda memberikan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan waktu kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai yang disahkan untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.
