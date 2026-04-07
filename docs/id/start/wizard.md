---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: penyiapan terpandu untuk gateway, workspace, saluran, dan Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-07T09:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

Onboarding CLI adalah cara **yang direkomendasikan** untuk menyiapkan OpenClaw di macOS,
Linux, atau Windows (melalui WSL2; sangat direkomendasikan).
Ini mengonfigurasi Gateway lokal atau koneksi Gateway jarak jauh, serta saluran, Skills,
dan default workspace dalam satu alur terpandu.

```bash
openclaw onboard
```

<Info>
Cara tercepat untuk chat pertama: buka Control UI (tidak perlu penyiapan saluran). Jalankan
`openclaw dashboard` dan chat di browser. Dokumen: [Dashboard](/web/dashboard).
</Info>

Untuk mengonfigurasi ulang nanti:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode non-interaktif. Untuk skrip, gunakan `--non-interactive`.
</Note>

<Tip>
Onboarding CLI mencakup langkah pencarian web tempat Anda dapat memilih penyedia
seperti Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG, atau Tavily. Beberapa penyedia memerlukan
API key, sementara yang lain tidak. Anda juga dapat mengonfigurasinya nanti dengan
`openclaw configure --section web`. Dokumen: [Web tools](/id/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding dimulai dengan **QuickStart** (default) vs **Advanced** (kontrol penuh).

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal (loopback)
    - Default workspace (atau workspace yang ada)
    - Port Gateway **18789**
    - Auth Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Default kebijakan alat untuk penyiapan lokal baru: `tools.profile: "coding"` (profil eksplisit yang sudah ada dipertahankan)
    - Default isolasi DM: onboarding lokal menulis `session.dmScope: "per-channel-peer"` jika belum diatur. Detail: [CLI Setup Reference](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Nonaktif**
    - DM Telegram + WhatsApp default ke **allowlist** (Anda akan diminta memasukkan nomor telepon Anda)
  </Tab>
  <Tab title="Advanced (kontrol penuh)">
    - Mengekspos setiap langkah (mode, workspace, gateway, saluran, daemon, Skills).
  </Tab>
</Tabs>

## Yang dikonfigurasi oleh onboarding

**Mode lokal (default)** memandu Anda melalui langkah-langkah berikut:

1. **Model/Auth** — pilih alur auth/penyedia yang didukung (API key, OAuth, atau auth manual khusus penyedia), termasuk Custom Provider
   (kompatibel OpenAI, kompatibel Anthropic, atau Unknown auto-detect). Pilih model default.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten webhook/hooks, pilih model generasi terbaru terkuat yang tersedia dan pertahankan kebijakan alat tetap ketat. Tingkat yang lebih lemah/lebih lama lebih mudah terkena prompt injection.
   Untuk run non-interaktif, `--secret-input-mode ref` menyimpan ref berbasis env dalam profil auth alih-alih nilai API key plaintext.
   Dalam mode `ref` non-interaktif, env var penyedia harus disetel; meneruskan flag key inline tanpa env var tersebut akan gagal cepat.
   Dalam run interaktif, memilih mode secret reference memungkinkan Anda menunjuk ke env var atau ref penyedia yang dikonfigurasi (`file` atau `exec`), dengan validasi preflight cepat sebelum menyimpan.
   Untuk Anthropic, onboarding/configure interaktif menawarkan **Anthropic Claude CLI** sebagai jalur lokal yang disarankan dan **Anthropic API key** sebagai jalur produksi yang direkomendasikan. Anthropic setup-token juga tetap tersedia sebagai jalur token-auth yang didukung.
2. **Workspace** — Lokasi untuk file agen (default `~/.openclaw/workspace`). Menanam file bootstrap.
3. **Gateway** — Port, alamat bind, mode auth, eksposur Tailscale.
   Dalam mode token interaktif, pilih penyimpanan token plaintext default atau pilih SecretRef.
   Jalur SecretRef token non-interaktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — saluran chat bawaan dan bundled seperti BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** — Menginstal LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native dengan fallback per-pengguna ke folder Startup.
   Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan token yang di-resolve ke metadata environment layanan supervisor.
   Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
   Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak disetel, instalasi daemon diblokir sampai mode disetel secara eksplisit.
6. **Pemeriksaan kesehatan** — Menjalankan Gateway dan memverifikasi bahwa gateway berjalan.
7. **Skills** — Menginstal Skills yang direkomendasikan dan dependensi opsional.

<Note>
Menjalankan ulang onboarding **tidak** akan menghapus apa pun kecuali Anda secara eksplisit memilih **Reset** (atau meneruskan `--reset`).
`--reset` CLI secara default mencakup config, kredensial, dan sesi; gunakan `--reset-scope full` untuk menyertakan workspace.
Jika config tidak valid atau berisi key lama, onboarding meminta Anda menjalankan `openclaw doctor` terlebih dahulu.
</Note>

**Mode remote** hanya mengonfigurasi klien lokal untuk terhubung ke Gateway di tempat lain.
Mode ini **tidak** menginstal atau mengubah apa pun di host remote.

## Tambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan workspace,
sesi, dan profil auth-nya sendiri. Menjalankan tanpa `--workspace` akan meluncurkan onboarding.

Yang disetel:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (onboarding dapat melakukannya).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk rincian langkah demi langkah yang lebih detail dan output config, lihat
[CLI Setup Reference](/id/start/wizard-cli-reference).
Untuk contoh non-interaktif, lihat [CLI Automation](/id/start/wizard-cli-automation).
Untuk referensi teknis yang lebih mendalam, termasuk detail RPC, lihat
[Onboarding Reference](/id/reference/wizard).

## Dokumen terkait

- Referensi perintah CLI: [`openclaw onboard`](/cli/onboard)
- Ikhtisar onboarding: [Onboarding Overview](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual first-run agen: [Agent Bootstrapping](/id/start/bootstrapping)
