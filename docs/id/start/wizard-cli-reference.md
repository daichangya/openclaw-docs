---
read_when:
    - Anda memerlukan perilaku terperinci untuk `openclaw onboard`
    - Anda sedang men-debug hasil onboarding atau mengintegrasikan client onboarding
sidebarTitle: CLI reference
summary: Referensi lengkap untuk alur penyiapan CLI, penyiapan auth/model, output, dan internal
title: Referensi Penyiapan CLI
x-i18n:
    generated_at: "2026-04-23T09:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referensi Penyiapan CLI

Halaman ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk panduan singkat, lihat [Onboarding (CLI)](/id/start/wizard).

## Apa yang dilakukan wizard

Mode lokal (default) memandu Anda melalui:

- Penyiapan model dan auth (OAuth langganan OpenAI Code, Claude CLI atau API key Anthropic, plus opsi MiniMax, GLM, Ollama, Moonshot, StepFun, dan AI Gateway)
- Lokasi workspace dan file bootstrap
- Pengaturan Gateway (port, bind, auth, Tailscale)
- Channel dan provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, dan plugin channel bawaan lainnya)
- Instalasi daemon (LaunchAgent, unit pengguna systemd, atau Scheduled Task Windows native dengan fallback folder Startup)
- Pemeriksaan health
- Penyiapan Skills

Mode remote mengonfigurasi mesin ini agar terhubung ke gateway di tempat lain.
Mode ini tidak menginstal atau mengubah apa pun pada host remote.

## Detail alur lokal

<Steps>
  <Step title="Deteksi konfigurasi yang ada">
    - Jika `~/.openclaw/openclaw.json` ada, pilih Keep, Modify, atau Reset.
    - Menjalankan ulang wizard tidak akan menghapus apa pun kecuali Anda secara eksplisit memilih Reset (atau memberikan `--reset`).
    - CLI `--reset` default ke `config+creds+sessions`; gunakan `--reset-scope full` untuk juga menghapus workspace.
    - Jika konfigurasi tidak valid atau berisi key legacy, wizard akan berhenti dan meminta Anda menjalankan `openclaw doctor` sebelum melanjutkan.
    - Reset menggunakan `trash` dan menawarkan cakupan:
      - Hanya konfigurasi
      - Konfigurasi + kredensial + sesi
      - Reset penuh (juga menghapus workspace)
  </Step>
  <Step title="Model dan auth">
    - Matriks opsi lengkap ada di [Opsi auth dan model](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menanam file workspace yang diperlukan untuk ritual bootstrap saat run pertama.
    - Tata letak workspace: [Workspace agent](/id/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Meminta port, bind, mode auth, dan eksposur Tailscale.
    - Rekomendasi: tetap aktifkan auth token bahkan untuk loopback agar client WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Generate/store plaintext token** (default)
      - **Gunakan SecretRef** (opsional)
    - Dalam mode password, penyiapan interaktif juga mendukung penyimpanan plaintext atau SecretRef.
    - Path SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan env var yang tidak kosong di environment proses onboarding.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan auth hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Bind non-loopback tetap memerlukan auth.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/id/channels/whatsapp): login QR opsional
    - [Telegram](/id/channels/telegram): token bot
    - [Discord](/id/channels/discord): token bot
    - [Google Chat](/id/channels/googlechat): JSON service account + audience Webhook
    - [Mattermost](/id/channels/mattermost): token bot + URL dasar
    - [Signal](/id/channels/signal): instalasi `signal-cli` opsional + konfigurasi akun
    - [BlueBubbles](/id/channels/bluebubbles): disarankan untuk iMessage; URL server + password + Webhook
    - [iMessage](/id/channels/imessage): path CLI `imsg` legacy + akses DB
    - Keamanan DM: default-nya pairing. DM pertama mengirim kode; setujui melalui
      `openclaw pairing approve <channel> <code>` atau gunakan allowlist.
  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang sedang login; untuk headless, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux dan Windows melalui WSL2: unit pengguna systemd
      - Wizard mencoba `loginctl enable-linger <user>` agar gateway tetap aktif setelah logout.
      - Mungkin meminta sudo (menulis `/var/lib/systemd/linger`); pertama-tama mencoba tanpa sudo.
    - Windows native: Scheduled Task terlebih dahulu
      - Jika pembuatan task ditolak, OpenClaw fallback ke item login folder Startup per pengguna dan segera memulai gateway.
      - Scheduled Task tetap lebih diutamakan karena memberikan status supervisor yang lebih baik.
    - Pemilihan runtime: Node (disarankan; diperlukan untuk WhatsApp dan Telegram). Bun tidak direkomendasikan.
  </Step>
  <Step title="Pemeriksaan health">
    - Memulai gateway (jika perlu) dan menjalankan `openclaw health`.
    - `openclaw status --deep` menambahkan probe health gateway live ke output status, termasuk probe channel jika didukung.
  </Step>
  <Step title="Skills">
    - Membaca Skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih node manager: npm, pnpm, atau bun.
    - Menginstal dependensi opsional (sebagian menggunakan Homebrew di macOS).
  </Step>
  <Step title="Selesai">
    - Ringkasan dan langkah berikutnya, termasuk opsi aplikasi iOS, Android, dan macOS.
  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, wizard mencetak instruksi port-forward SSH untuk Control UI alih-alih membuka browser.
Jika aset Control UI tidak ada, wizard mencoba membangunnya; fallback-nya adalah `pnpm ui:build` (menginstal deps UI secara otomatis).
</Note>

## Detail mode remote

Mode remote mengonfigurasi mesin ini agar terhubung ke gateway di tempat lain.

<Info>
Mode remote tidak menginstal atau mengubah apa pun pada host remote.
</Info>

Yang Anda setel:

- URL gateway remote (`ws://...`)
- Token jika auth gateway remote diperlukan (disarankan)

<Note>
- Jika gateway hanya loopback, gunakan SSH tunneling atau tailnet.
- Petunjuk discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opsi auth dan model

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Menggunakan `ANTHROPIC_API_KEY` jika ada atau meminta key, lalu menyimpannya untuk penggunaan daemon.
  </Accordion>
  <Accordion title="Langganan OpenAI Code (OAuth)">
    Alur browser; tempel `code#state`.

    Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.4` saat model belum disetel atau `openai/*`.

  </Accordion>
  <Accordion title="Langganan OpenAI Code (pairing perangkat)">
    Alur pairing browser dengan kode perangkat berumur singkat.

    Menyetel `agents.defaults.model` ke `openai-codex/gpt-5.4` saat model belum disetel atau `openai/*`.

  </Accordion>
  <Accordion title="API key OpenAI">
    Menggunakan `OPENAI_API_KEY` jika ada atau meminta key, lalu menyimpan kredensial di profil auth.

    Menyetel `agents.defaults.model` ke `openai/gpt-5.4` saat model belum disetel, `openai/*`, atau `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Meminta `XAI_API_KEY` dan mengonfigurasi xAI sebagai provider model.
  </Accordion>
  <Accordion title="OpenCode">
    Meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`) dan memungkinkan Anda memilih katalog Zen atau Go.
    URL penyiapan: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generik)">
    Menyimpan key untuk Anda.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Meminta `AI_GATEWAY_API_KEY`.
    Detail lebih lanjut: [Vercel AI Gateway](/id/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Meminta ID akun, ID gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Detail lebih lanjut: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Konfigurasi ditulis otomatis. Default terhosting adalah `MiniMax-M2.7`; penyiapan API key menggunakan
    `minimax/...`, dan penyiapan OAuth menggunakan `minimax-portal/...`.
    Detail lebih lanjut: [MiniMax](/id/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Konfigurasi ditulis otomatis untuk StepFun standar atau Step Plan pada endpoint China atau global.
    Standar saat ini mencakup `step-3.5-flash`, dan Step Plan juga mencakup `step-3.5-flash-2603`.
    Detail lebih lanjut: [StepFun](/id/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
    Meminta `SYNTHETIC_API_KEY`.
    Detail lebih lanjut: [Synthetic](/id/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud dan model terbuka lokal)">
    Pertama-tama meminta `Cloud + Local`, `Cloud only`, atau `Local only`.
    `Cloud only` menggunakan `OLLAMA_API_KEY` dengan `https://ollama.com`.
    Mode yang didukung host meminta URL dasar (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan menyarankan default.
    `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah login untuk akses cloud.
    Detail lebih lanjut: [Ollama](/id/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot dan Kimi Coding">
    Konfigurasi Moonshot (Kimi K2) dan Kimi Coding ditulis otomatis.
    Detail lebih lanjut: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot).
  </Accordion>
  <Accordion title="Provider kustom">
    Bekerja dengan endpoint yang kompatibel dengan OpenAI dan Anthropic.

    Onboarding interaktif mendukung pilihan penyimpanan API key yang sama seperti alur API key provider lainnya:
    - **Tempel API key sekarang** (plaintext)
    - **Gunakan referensi secret** (ref env atau ref provider yang dikonfigurasi, dengan validasi preflight)

    Flag non-interaktif:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opsional; fallback ke `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opsional)
    - `--custom-compatibility <openai|anthropic>` (opsional; default `openai`)

  </Accordion>
  <Accordion title="Lewati">
    Membiarkan auth tidak dikonfigurasi.
  </Accordion>
</AccordionGroup>

Perilaku model:

- Pilih model default dari opsi yang terdeteksi, atau masukkan provider dan model secara manual.
- Saat onboarding dimulai dari pilihan auth provider, pemilih model otomatis lebih mengutamakan
  provider tersebut. Untuk Volcengine dan BytePlus, preferensi yang sama
  juga cocok dengan varian coding-plan mereka (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Jika filter provider yang diprioritaskan itu kosong, pemilih akan fallback ke
  katalog penuh alih-alih tidak menampilkan model.
- Wizard menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth-nya tidak ada.

Path kredensial dan profil:

- Profil auth (API key + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Impor OAuth legacy: `~/.openclaw/credentials/oauth.json`

Mode penyimpanan kredensial:

- Perilaku onboarding default menyimpan API key sebagai nilai plaintext di profil auth.
- `--secret-input-mode ref` mengaktifkan mode referensi alih-alih penyimpanan key plaintext.
  Dalam penyiapan interaktif, Anda dapat memilih salah satu:
  - referensi environment variable (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referensi provider yang dikonfigurasi (`file` atau `exec`) dengan alias provider + id
- Mode referensi interaktif menjalankan validasi preflight cepat sebelum menyimpan.
  - Ref env: memvalidasi nama variabel + nilai tidak kosong di environment onboarding saat ini.
  - Ref provider: memvalidasi konfigurasi provider dan me-resolve id yang diminta.
  - Jika preflight gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.
- Dalam mode non-interaktif, `--secret-input-mode ref` hanya didukung env.
  - Setel env var provider di environment proses onboarding.
  - Flag key inline (misalnya `--openai-api-key`) mengharuskan env var tersebut disetel; jika tidak onboarding akan gagal cepat.
  - Untuk provider kustom, mode `ref` non-interaktif menyimpan `models.providers.<id>.apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dalam kasus provider kustom itu, `--custom-api-key` mengharuskan `CUSTOM_API_KEY` disetel; jika tidak onboarding akan gagal cepat.
- Kredensial auth Gateway mendukung pilihan plaintext dan SecretRef dalam penyiapan interaktif:
  - Mode token: **Generate/store plaintext token** (default) atau **Gunakan SecretRef**.
  - Mode password: plaintext atau SecretRef.
- Path SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
- Penyiapan plaintext yang sudah ada tetap berfungsi tanpa perubahan.

<Note>
Tip headless dan server: selesaikan OAuth di mesin dengan browser, lalu salin
`auth-profiles.json` agent tersebut (misalnya
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau path
`$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
hanya merupakan sumber impor legacy.
</Note>

## Output dan internal

Field umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (jika MiniMax dipilih)
- `tools.profile` (onboarding lokal menetapkan default ini ke `"coding"` saat belum disetel; nilai eksplisit yang sudah ada tetap dipertahankan)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (onboarding lokal menetapkan default ini ke `per-channel-peer` saat belum disetel; nilai eksplisit yang sudah ada tetap dipertahankan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist channel (Slack, Discord, Matrix, Microsoft Teams) saat Anda memilihnya selama prompt (nama di-resolve menjadi ID jika memungkinkan)
- `skills.install.nodeManager`
  - Flag `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menetapkan `skills.install.nodeManager: "yarn"` nanti.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp berada di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi disimpan di bawah `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Beberapa channel dikirim sebagai plugin. Saat dipilih selama penyiapan, wizard
akan meminta untuk menginstal plugin tersebut (npm atau path lokal) sebelum konfigurasi channel.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Client (aplikasi macOS dan Control UI) dapat merender langkah-langkah tanpa mengimplementasikan ulang logika onboarding.

Perilaku penyiapan Signal:

- Mengunduh aset rilis yang sesuai
- Menyimpannya di `~/.openclaw/tools/signal-cli/<version>/`
- Menulis `channels.signal.cliPath` di konfigurasi
- Build JVM memerlukan Java 21
- Build native digunakan saat tersedia
- Windows menggunakan WSL2 dan mengikuti alur Linux `signal-cli` di dalam WSL

## Dokumentasi terkait

- Pusat onboarding: [Onboarding (CLI)](/id/start/wizard)
- Automasi dan skrip: [CLI Automation](/id/start/wizard-cli-automation)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
