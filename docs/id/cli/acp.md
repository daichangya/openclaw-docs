---
read_when:
    - Menyiapkan integrasi IDE berbasis ACP
    - Men-debug routing sesi ACP ke Gateway
summary: Jalankan bridge ACP untuk integrasi IDE
title: acp
x-i18n:
    generated_at: "2026-04-23T09:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Jalankan bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) yang berbicara dengan Gateway OpenClaw.

Perintah ini berbicara ACP melalui stdio untuk IDE dan meneruskan prompt ke Gateway
melalui WebSocket. Perintah ini menjaga sesi ACP tetap dipetakan ke kunci sesi Gateway.

`openclaw acp` adalah bridge ACP berbasis Gateway, bukan runtime editor
native ACP penuh. Fokusnya adalah pada routing sesi, pengiriman prompt, dan pembaruan
streaming dasar.

Jika Anda ingin klien MCP eksternal berbicara langsung ke percakapan channel OpenClaw
alih-alih meng-host sesi harness ACP, gunakan
[`openclaw mcp serve`](/id/cli/mcp).

## Apa yang bukan ini

Halaman ini sering disalahartikan sebagai sesi harness ACP.

`openclaw acp` berarti:

- OpenClaw bertindak sebagai server ACP
- IDE atau klien ACP terhubung ke OpenClaw
- OpenClaw meneruskan pekerjaan itu ke dalam sesi Gateway

Ini berbeda dari [ACP Agents](/id/tools/acp-agents), di mana OpenClaw menjalankan
harness eksternal seperti Codex atau Claude Code melalui `acpx`.

Aturan cepat:

- editor/klien ingin berbicara ACP ke OpenClaw: gunakan `openclaw acp`
- OpenClaw harus meluncurkan Codex/Claude/Gemini sebagai harness ACP: gunakan `/acp spawn` dan [ACP Agents](/id/tools/acp-agents)

## Matriks Kompatibilitas

| Area ACP                                                              | Status      | Catatan                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Diimplementasikan | Alur inti bridge melalui stdio ke chat/send + abort Gateway.                                                                                                                                                                                     |
| `listSessions`, slash command                                         | Diimplementasikan | Daftar sesi bekerja terhadap status sesi Gateway; perintah diiklankan melalui `available_commands_update`.                                                                                                                                       |
| `loadSession`                                                         | Parsial     | Mengikat ulang sesi ACP ke kunci sesi Gateway dan memutar ulang riwayat teks pengguna/asisten yang tersimpan. Riwayat alat/sistem belum direkonstruksi.                                                                                        |
| Konten prompt (`text`, `resource` tersemat, gambar)                   | Parsial     | Teks/resource diratakan ke input chat; gambar menjadi lampiran Gateway.                                                                                                                                                                          |
| Mode sesi                                                             | Parsial     | `session/set_mode` didukung dan bridge mengekspos kontrol sesi awal berbasis Gateway untuk tingkat pemikiran, verbositas alat, reasoning, detail penggunaan, dan tindakan elevated. Surface mode/konfigurasi native ACP yang lebih luas masih di luar cakupan. |
| Info sesi dan pembaruan penggunaan                                    | Parsial     | Bridge memancarkan notifikasi `session_info_update` dan `usage_update` best-effort dari snapshot sesi Gateway yang di-cache. Penggunaan bersifat perkiraan dan hanya dikirim saat total token Gateway ditandai fresh.                            |
| Streaming alat                                                        | Parsial     | Event `tool_call` / `tool_call_update` mencakup I/O mentah, konten teks, dan lokasi file best-effort saat argumen/hasil alat Gateway mengeksposnya. Terminal tersemat dan output native diff yang lebih kaya masih belum diekspos.              |
| Server MCP per-sesi (`mcpServers`)                                    | Tidak didukung | Mode bridge menolak permintaan server MCP per-sesi. Konfigurasikan MCP pada gateway atau agen OpenClaw sebagai gantinya.                                                                                                                         |
| Metode filesystem klien (`fs/read_text_file`, `fs/write_text_file`)   | Tidak didukung | Bridge tidak memanggil metode filesystem klien ACP.                                                                                                                                                                                               |
| Metode terminal klien (`terminal/*`)                                  | Tidak didukung | Bridge tidak membuat terminal klien ACP atau men-stream id terminal melalui pemanggilan alat.                                                                                                                                                    |
| Rencana sesi / streaming pemikiran                                    | Tidak didukung | Bridge saat ini memancarkan teks keluaran dan status alat, bukan pembaruan rencana atau pemikiran ACP.                                                                                                                                          |

## Batasan yang Diketahui

- `loadSession` memutar ulang riwayat teks pengguna dan asisten yang tersimpan, tetapi tidak
  merekonstruksi pemanggilan alat historis, notifikasi sistem, atau jenis event
  native ACP yang lebih kaya.
- Jika beberapa klien ACP berbagi kunci sesi Gateway yang sama, routing event dan cancel
  bersifat best-effort alih-alih terisolasi ketat per klien. Pilih
  sesi `acp:<uuid>` terisolasi default saat Anda membutuhkan giliran
  editor-lokal yang bersih.
- Status berhenti Gateway diterjemahkan ke alasan berhenti ACP, tetapi pemetaan itu
  kurang ekspresif dibanding runtime native ACP sepenuhnya.
- Kontrol sesi awal saat ini mengekspos subset terfokus dari knob Gateway:
  tingkat pemikiran, verbositas alat, reasoning, detail penggunaan, dan tindakan
  elevated. Pemilihan model dan kontrol exec-host belum diekspos sebagai opsi
  konfigurasi ACP.
- `session_info_update` dan `usage_update` diturunkan dari snapshot sesi Gateway,
  bukan accounting runtime native ACP langsung. Penggunaan bersifat perkiraan,
  tidak membawa data biaya, dan hanya dipancarkan saat Gateway menandai data
  total token sebagai fresh.
- Data follow-along alat bersifat best-effort. Bridge dapat menampilkan path file yang
  muncul dalam argumen/hasil alat yang diketahui, tetapi belum memancarkan terminal ACP atau
  diff file terstruktur.

## Penggunaan

```bash
openclaw acp

# Gateway jarak jauh
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway jarak jauh (token dari file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Lampirkan ke kunci sesi yang sudah ada
openclaw acp --session agent:main:main

# Lampirkan berdasarkan label (harus sudah ada)
openclaw acp --session-label "support inbox"

# Reset kunci sesi sebelum prompt pertama
openclaw acp --session agent:main:main --reset-session
```

## Klien ACP (debug)

Gunakan klien ACP bawaan untuk sanity-check bridge tanpa IDE.
Perintah ini meluncurkan bridge ACP dan memungkinkan Anda mengetik prompt secara interaktif.

```bash
openclaw acp client

# Arahkan bridge yang diluncurkan ke Gateway jarak jauh
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Ganti perintah server (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model izin (mode debug klien):

- Persetujuan otomatis berbasis allowlist dan hanya berlaku untuk id alat inti tepercaya.
- Persetujuan otomatis `read` dibatasi ke direktori kerja saat ini (`--cwd` saat disetel).
- ACP hanya menyetujui otomatis kelas read-only yang sempit: pemanggilan `read` yang dibatasi di bawah cwd aktif plus alat pencarian read-only (`search`, `web_search`, `memory_search`). Alat yang tidak dikenal/bukan inti, pembacaan di luar cakupan, alat yang mampu exec, alat control-plane, alat yang memutasi, dan alur interaktif selalu memerlukan persetujuan prompt eksplisit.
- `toolCall.kind` yang diberikan server diperlakukan sebagai metadata yang tidak tepercaya (bukan sumber otorisasi).
- Kebijakan bridge ACP ini terpisah dari izin harness ACPX. Jika Anda menjalankan OpenClaw melalui backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` adalah sakelar break-glass “yolo” untuk sesi harness tersebut.

## Cara menggunakan ini

Gunakan ACP ketika sebuah IDE (atau klien lain) berbicara Agent Client Protocol dan Anda ingin
klien itu mengendalikan sesi Gateway OpenClaw.

1. Pastikan Gateway berjalan (lokal atau jarak jauh).
2. Konfigurasikan target Gateway (konfigurasi atau flag).
3. Arahkan IDE Anda untuk menjalankan `openclaw acp` melalui stdio.

Contoh konfigurasi (persisten):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Contoh menjalankan langsung (tanpa menulis konfigurasi):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# lebih disarankan untuk keamanan proses lokal
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Memilih agen

ACP tidak memilih agen secara langsung. ACP melakukan routing berdasarkan kunci sesi Gateway.

Gunakan kunci sesi berskala agen untuk menargetkan agen tertentu:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Setiap sesi ACP dipetakan ke satu kunci sesi Gateway. Satu agen dapat memiliki banyak
sesi; ACP default ke sesi `acp:<uuid>` terisolasi kecuali Anda menimpa
kunci atau labelnya.

`mcpServers` per-sesi tidak didukung dalam mode bridge. Jika klien ACP
mengirimkannya selama `newSession` atau `loadSession`, bridge mengembalikan error
yang jelas alih-alih mengabaikannya secara diam-diam.

Jika Anda ingin sesi berbasis ACPX melihat alat plugin OpenClaw atau alat
bawaan terpilih seperti `cron`, aktifkan bridge MCP ACPX di sisi gateway
alih-alih mencoba meneruskan `mcpServers` per-sesi. Lihat
[ACP Agents](/id/tools/acp-agents#plugin-tools-mcp-bridge) dan
[OpenClaw tools MCP bridge](/id/tools/acp-agents#openclaw-tools-mcp-bridge).

## Gunakan dari `acpx` (Codex, Claude, klien ACP lainnya)

Jika Anda ingin agen coding seperti Codex atau Claude Code berbicara dengan
bot OpenClaw Anda melalui ACP, gunakan `acpx` dengan target `openclaw`
bawaannya.

Alur yang umum:

1. Jalankan Gateway dan pastikan bridge ACP dapat menjangkaunya.
2. Arahkan `acpx openclaw` ke `openclaw acp`.
3. Targetkan kunci sesi OpenClaw yang ingin digunakan agen coding.

Contoh:

```bash
# Permintaan sekali jalan ke sesi ACP OpenClaw default Anda
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sesi bernama persisten untuk giliran tindak lanjut
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jika Anda ingin `acpx openclaw` menargetkan Gateway dan kunci sesi tertentu setiap
saat, timpa perintah agen `openclaw` di `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Untuk checkout OpenClaw repo-lokal, gunakan entrypoint CLI langsung alih-alih
dev runner agar stream ACP tetap bersih. Contohnya:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Ini adalah cara termudah untuk membiarkan Codex, Claude Code, atau klien sadar-ACP lainnya
menarik informasi kontekstual dari agen OpenClaw tanpa mengikis terminal.

## Penyiapan editor Zed

Tambahkan agen ACP kustom di `~/.config/zed/settings.json` (atau gunakan UI Pengaturan Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Untuk menargetkan Gateway atau agen tertentu:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Di Zed, buka panel Agent dan pilih “OpenClaw ACP” untuk memulai thread.

## Pemetaan sesi

Secara default, sesi ACP mendapatkan kunci sesi Gateway terisolasi dengan prefiks `acp:`.
Untuk menggunakan ulang sesi yang sudah dikenal, berikan kunci sesi atau label:

- `--session <key>`: gunakan kunci sesi Gateway tertentu.
- `--session-label <label>`: resolve sesi yang sudah ada berdasarkan label.
- `--reset-session`: buat id sesi baru untuk kunci tersebut (kunci sama, transkrip baru).

Jika klien ACP Anda mendukung metadata, Anda dapat menimpanya per sesi:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Pelajari lebih lanjut tentang kunci sesi di [/concepts/session](/id/concepts/session).

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token auth Gateway.
- `--token-file <path>`: baca token auth Gateway dari file.
- `--password <password>`: kata sandi auth Gateway.
- `--password-file <path>`: baca kata sandi auth Gateway dari file.
- `--session <key>`: kunci sesi default.
- `--session-label <label>`: label sesi default untuk di-resolve.
- `--require-existing`: gagal jika kunci sesi/label tidak ada.
- `--reset-session`: reset kunci sesi sebelum penggunaan pertama.
- `--no-prefix-cwd`: jangan tambahkan direktori kerja sebagai prefiks pada prompt.
- `--provenance <off|meta|meta+receipt>`: sertakan metadata provenance ACP atau receipt.
- `--verbose, -v`: logging verbose ke stderr.

Catatan keamanan:

- `--token` dan `--password` dapat terlihat di daftar proses lokal pada beberapa sistem.
- Lebih disarankan menggunakan `--token-file`/`--password-file` atau variabel lingkungan (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Resolusi auth Gateway mengikuti kontrak bersama yang digunakan oleh klien Gateway lain:
  - mode lokal: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` hanya saat `gateway.auth.*` tidak disetel (local SecretRefs yang dikonfigurasi tetapi tidak ter-resolve gagal tertutup)
  - mode jarak jauh: `gateway.remote.*` dengan fallback env/config sesuai aturan prioritas jarak jauh
  - `--url` aman untuk override dan tidak menggunakan ulang kredensial config/env implisit; berikan `--token`/`--password` eksplisit (atau varian file)
- Proses anak backend runtime ACP menerima `OPENCLAW_SHELL=acp`, yang dapat digunakan untuk aturan shell/profile khusus konteks.
- `openclaw acp client` menetapkan `OPENCLAW_SHELL=acp-client` pada proses bridge yang diluncurkan.

### Opsi `acp client`

- `--cwd <dir>`: direktori kerja untuk sesi ACP.
- `--server <command>`: perintah server ACP (default: `openclaw`).
- `--server-args <args...>`: argumen tambahan yang diteruskan ke server ACP.
- `--server-verbose`: aktifkan logging verbose pada server ACP.
- `--verbose, -v`: logging klien verbose.
