---
read_when:
    - Mencari langkah atau flag onboarding tertentu
    - Mengotomatisasi onboarding dengan mode non-interaktif
    - Men-debug perilaku onboarding
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan field config'
title: Referensi Onboarding
x-i18n:
    generated_at: "2026-04-23T09:28:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Referensi Onboarding

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran tingkat tinggi, lihat [Onboarding (CLI)](/id/start/wizard).

## Detail alur (mode lokal)

<Steps>
  <Step title="Deteksi config yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih **Keep / Modify / Reset**.
    - Menjalankan onboarding ulang **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih **Reset**
      (atau memberikan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full`
      untuk juga menghapus workspace.
    - Jika config tidak valid atau berisi kunci lama, wizard berhenti dan meminta
      Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` (tidak pernah `rm`) dan menawarkan cakupan:
      - Hanya config
      - Config + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
    - **Anthropic API key**: pilihan assistant Anthropic yang diutamakan dalam onboarding/configure.
    - **Anthropic setup-token**: masih tersedia dalam onboarding/configure, meskipun OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI bila tersedia.
    - **OpenAI Code (Codex) subscription (OAuth)**: alur browser; tempelkan `code#state`.
      - Mengatur `agents.defaults.model` ke `openai-codex/gpt-5.4` saat model tidak diatur atau `openai/*`.
    - **OpenAI Code (Codex) subscription (device pairing)**: alur pairing browser dengan kode perangkat berumur pendek.
      - Mengatur `agents.defaults.model` ke `openai-codex/gpt-5.4` saat model tidak diatur atau `openai/*`.
    - **OpenAI API key**: menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpannya di auth profile.
      - Mengatur `agents.defaults.model` ke `openai/gpt-5.4` saat model tidak diatur, `openai/*`, atau `openai-codex/*`.
    - **xAI (Grok) API key**: meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: terlebih dahulu menawarkan **Cloud + Local**, **Cloud only**, atau **Local only**. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode yang didukung host meminta base URL Ollama, menemukan model lokal yang tersedia, dan otomatis menarik model lokal yang dipilih bila diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah login untuk akses cloud.
    - Detail lebih lanjut: [Ollama](/id/providers/ollama)
    - **API key**: menyimpan key untuk Anda.
    - **Vercel AI Gateway (proxy multi-model)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta Account ID, Gateway ID, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: config ditulis otomatis; default hosted adalah `MiniMax-M2.7`.
      Setup API key menggunakan `minimax/...`, dan setup OAuth menggunakan
      `minimax-portal/...`.
    - Detail lebih lanjut: [MiniMax](/id/providers/minimax)
    - **StepFun**: config ditulis otomatis untuk endpoint standar StepFun atau Step Plan di China maupun global.
    - Standar saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    - Detail lebih lanjut: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel dengan Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail lebih lanjut: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: config ditulis otomatis.
    - **Kimi Coding**: config ditulis otomatis.
    - Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Skip**: belum ada auth yang dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan provider/model secara manual). Untuk kualitas terbaik dan risiko prompt injection yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia dalam stack provider Anda.
    - Onboarding menjalankan pemeriksaan model dan memberi peringatan jika model yang dikonfigurasi tidak dikenal atau tidak memiliki auth.
    - Mode penyimpanan API key default ke nilai auth-profile plaintext. Gunakan `--secret-input-mode ref` untuk menyimpan ref berbasis env sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profile berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API key + OAuth). `~/.openclaw/credentials/oauth.json` adalah sumber impor lama saja.
    - Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)
    <Note>
    Tip headless/server: selesaikan OAuth di mesin yang memiliki browser, lalu salin
    `auth-profiles.json` agent tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host Gateway. `credentials/oauth.json`
    hanyalah sumber impor lama.
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menyemai file workspace yang diperlukan untuk ritual bootstrap agent.
    - Panduan layout + backup workspace lengkap: [Workspace agent](/id/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode auth, eksposur Tailscale.
    - Rekomendasi auth: tetap gunakan **Token** bahkan untuk local loopback agar klien WS lokal harus terautentikasi.
    - Dalam mode token, setup interaktif menawarkan:
      - **Generate/store plaintext token** (default)
      - **Use SecretRef** (opt-in)
      - Quickstart menggunakan ulang SecretRef `gateway.auth.token` yang sudah ada di seluruh provider `env`, `file`, dan `exec` untuk probe onboarding/bootstrap dashboard.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat di-resolve, onboarding gagal lebih awal dengan pesan perbaikan yang jelas alih-alih diam-diam menurunkan auth runtime.
    - Dalam mode kata sandi, setup interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var non-kosong di environment proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya mempercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON service account + audiens Webhook.
    - [Mattermost](/id/channels/mattermost) (plugin): token bot + base URL.
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + config akun.
    - [BlueBubbles](/id/channels/bluebubbles): **direkomendasikan untuk iMessage**; URL server + kata sandi + Webhook.
    - [iMessage](/id/channels/imessage): path CLI `imsg` lama + akses DB.
    - Keamanan DM: default adalah pairing. DM pertama mengirim kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Pencarian web">
    - Pilih provider yang didukung seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Provider berbasis API dapat menggunakan env vars atau config yang ada untuk setup cepat; provider tanpa key menggunakan prasyarat khusus provider mereka sebagai gantinya.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): systemd user unit
      - Onboarding mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis `/var/lib/systemd/linger`); pertama-tama mencoba tanpa sudo.
    - **Pemilihan runtime:** Node (direkomendasikan; wajib untuk WhatsApp/Telegram). Bun **tidak direkomendasikan**.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan nilai token plaintext yang sudah di-resolve ke metadata environment layanan supervisor.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, instalasi daemon diblokir sampai mode diatur secara eksplisit.
  </Step>
  <Step title="Pemeriksaan kesehatan">
    - Memulai Gateway (jika perlu) dan menjalankan `openclaw health`.
    - Tip: `openclaw status --deep` menambahkan probe kesehatan Gateway live ke output status, termasuk probe channel bila didukung (memerlukan Gateway yang dapat dijangkau).
  </Step>
  <Step title="Skills (disarankan)">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih manajer Node: **npm / pnpm** (bun tidak direkomendasikan).
    - Menginstal dependensi opsional (beberapa menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk aplikasi iOS/Android/macOS untuk fitur tambahan.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding mencetak instruksi port-forward SSH untuk Control UI alih-alih membuka browser.
Jika aset Control UI tidak ada, onboarding mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (menginstal dependensi UI secara otomatis).
</Note>

## Mode non-interaktif

Gunakan `--non-interactive` untuk mengotomatisasi atau membuat script onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Tambahkan `--json` untuk ringkasan yang dapat dibaca mesin.

SecretRef token Gateway dalam mode non-interaktif:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.

<Note>
`--json` **tidak** menyiratkan mode non-interaktif. Gunakan `--non-interactive` (dan `--workspace`) untuk script.
</Note>

Contoh perintah khusus provider ada di [CLI Automation](/id/start/wizard-cli-automation#provider-specific-examples).
Gunakan halaman referensi ini untuk semantik flag dan urutan langkah.

### Tambah agent (non-interaktif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC wizard Gateway

Gateway mengekspos alur onboarding melalui RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klien (aplikasi macOS, Control UI) dapat merender langkah-langkah tanpa mengimplementasikan ulang logika onboarding.

## Setup Signal (`signal-cli`)

Onboarding dapat menginstal `signal-cli` dari rilis GitHub:

- Mengunduh aset rilis yang sesuai.
- Menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`.
- Menulis `channels.signal.cliPath` ke config Anda.

Catatan:

- Build JVM memerlukan **Java 21**.
- Build native digunakan bila tersedia.
- Windows menggunakan WSL2; instalasi `signal-cli` mengikuti alur Linux di dalam WSL.

## Apa yang ditulis wizard

Field umum di `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal default ke `"coding"` saat tidak diatur; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (detail perilaku: [Referensi Setup CLI](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack/Discord/Matrix/Microsoft Teams) saat Anda ikut serta selama prompt (nama di-resolve ke ID bila memungkinkan).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Config manual tetap dapat menggunakan `yarn` dengan mengatur `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

Beberapa channel dikirimkan sebagai plugin. Saat Anda memilih salah satunya selama setup, onboarding
akan meminta untuk menginstalnya (npm atau path lokal) sebelum dapat dikonfigurasi.

## Docs terkait

- Gambaran onboarding: [Onboarding (CLI)](/id/start/wizard)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi config: [Konfigurasi Gateway](/id/gateway/configuration)
- Providers: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [BlueBubbles](/id/channels/bluebubbles) (iMessage), [iMessage](/id/channels/imessage) (lama)
- Skills: [Skills](/id/tools/skills), [Config Skills](/id/tools/skills-config)
