---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke channel yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan OpenClaw
summary: Ekspos percakapan channel OpenClaw melalui MCP dan kelola definisi server MCP yang tersimpan
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar milik OpenClaw dengan `list`, `show`,
  `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registri
  sisi-klien MCP untuk server MCP lain yang nantinya mungkin digunakan runtime-nya

Gunakan [`openclaw acp`](/id/cli/acp) ketika OpenClaw harus meng-host sesi coding harness
sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah path `openclaw mcp serve`.

## Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` ketika:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan
  percakapan channel yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau remote dengan sesi yang telah dirutekan
- Anda menginginkan satu server MCP yang berfungsi di seluruh backend channel OpenClaw alih-alih
  menjalankan bridge terpisah per channel

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya ketika OpenClaw harus meng-host runtime
coding itu sendiri dan mempertahankan sesi agen di dalam OpenClaw.

## Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses
tersebut. Selama klien mempertahankan sesi stdio itu tetap terbuka, bridge akan terhubung ke
Gateway OpenClaw lokal atau remote melalui WebSocket dan mengekspos percakapan channel
yang dirutekan melalui MCP.

Siklus hidup:

1. klien MCP memunculkan `openclaw mcp serve`
2. bridge terhubung ke Gateway
3. sesi yang dirutekan menjadi percakapan MCP dan tool transkrip/riwayat
4. peristiwa langsung diantrekan di memori selama bridge terhubung
5. jika mode channel Claude diaktifkan, sesi yang sama juga dapat menerima
   notifikasi push khusus Claude

Perilaku penting:

- status antrean langsung dimulai saat bridge terhubung
- riwayat transkrip yang lebih lama dibaca dengan `messages_read`
- notifikasi push Claude hanya ada selama sesi MCP masih hidup
- saat klien terputus, bridge keluar dan antrean langsung hilang
- titik masuk agen sekali jalan seperti `openclaw agent` dan
  `openclaw infer model run` menghentikan runtime MCP bawaan apa pun yang mereka buka ketika
  balasan selesai, sehingga proses skrip berulang tidak menumpuk proses anak MCP stdio
- server MCP stdio yang diluncurkan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dimatikan
  sebagai pohon proses saat shutdown, sehingga subproses anak yang dimulai oleh
  server tidak bertahan setelah klien stdio induk keluar
- menghapus atau mereset sesi akan membuang klien MCP sesi tersebut melalui
  path pembersihan runtime bersama, sehingga tidak ada koneksi stdio yang tertinggal
  yang terikat ke sesi yang dihapus

## Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

- Klien MCP generik: hanya tool MCP standar. Gunakan `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan
  tool persetujuan.
- Claude Code: tool MCP standar ditambah adaptor channel khusus Claude.
  Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.

Saat ini, `auto` berperilaku sama dengan `on`. Belum ada deteksi kemampuan klien.

## Apa yang diekspos oleh `serve`

Bridge menggunakan metadata rute sesi Gateway yang ada untuk mengekspos percakapan
yang didukung channel. Percakapan akan muncul ketika OpenClaw sudah memiliki status sesi
dengan rute yang diketahui seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan yang baru-baru ini dirutekan
- membaca riwayat transkrip terbaru
- menunggu peristiwa masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang tiba saat bridge terhubung

## Penggunaan

```bash
# Gateway lokal
openclaw mcp serve

# Gateway remote
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remote dengan auth password
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Aktifkan log bridge verbose
openclaw mcp serve --verbose

# Nonaktifkan notifikasi push khusus Claude
openclaw mcp serve --claude-channel-mode off
```

## Tool bridge

Bridge saat ini mengekspos tool MCP berikut:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Mencantumkan percakapan terbaru yang didukung sesi yang sudah memiliki metadata rute di
status sesi Gateway.

Filter yang berguna:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Mengembalikan satu percakapan berdasarkan `session_key`.

### `messages_read`

Membaca pesan transkrip terbaru untuk satu percakapan yang didukung sesi.

### `attachments_fetch`

Mengekstrak blok konten pesan non-teks dari satu pesan transkrip. Ini adalah
tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran mandiri yang tahan lama.

### `events_poll`

Membaca peristiwa langsung yang diantrekan sejak kursor numerik.

### `events_wait`

Long-poll sampai peristiwa antrean berikutnya yang cocok tiba atau timeout berakhir.

Gunakan ini saat klien MCP generik memerlukan pengiriman hampir real-time tanpa
protokol push khusus Claude.

### `messages_send`

Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

Perilaku saat ini:

- memerlukan rute percakapan yang sudah ada
- menggunakan channel sesi, penerima, ID akun, dan ID thread
- hanya mengirim teks

### `permissions_list_open`

Mencantumkan permintaan persetujuan exec/plugin yang masih tertunda yang diamati bridge sejak
terhubung ke Gateway.

### `permissions_respond`

Menyelesaikan satu permintaan persetujuan exec/plugin tertunda dengan:

- `allow-once`
- `allow-always`
- `deny`

## Model peristiwa

Bridge menyimpan antrean peristiwa di memori selama terhubung.

Jenis peristiwa saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Batasan penting:

- antrean bersifat live-only; dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway lama
  dengan sendirinya
- backlog tahan lama sebaiknya dibaca dengan `messages_read`

## Notifikasi channel Claude

Bridge juga dapat mengekspos notifikasi channel khusus Claude. Ini adalah
padanan OpenClaw untuk adaptor channel Claude Code: tool MCP standar tetap
tersedia, tetapi pesan masuk langsung juga dapat tiba sebagai notifikasi MCP khusus Claude.

Flag:

- `--claude-channel-mode off`: hanya tool MCP standar
- `--claude-channel-mode on`: aktifkan notifikasi channel Claude
- `--claude-channel-mode auto`: default saat ini; perilaku bridge sama dengan `on`

Saat mode channel Claude diaktifkan, server mengiklankan kemampuan eksperimental Claude
dan dapat memancarkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` masuk diteruskan sebagai
  `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak di memori
- jika percakapan yang tertaut kemudian mengirim `yes abcde` atau `no abcde`, bridge
  mengubahnya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi langsung; jika klien MCP terputus,
  tidak ada target push

Ini sengaja dibuat khusus klien. Klien MCP generik sebaiknya mengandalkan
tool polling standar.

## Konfigurasi klien MCP

Contoh konfigurasi klien stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Untuk sebagian besar klien MCP generik, mulailah dengan permukaan tool standar dan abaikan
mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar memahami
metode notifikasi khusus Claude.

## Opsi

`openclaw mcp serve` mendukung:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: baca token dari file
- `--password <password>`: password Gateway
- `--password-file <path>`: baca password dari file
- `--claude-channel-mode <auto|on|off>`: mode notifikasi Claude
- `-v`, `--verbose`: log verbose di stderr

Utamakan `--token-file` atau `--password-file` dibanding secret inline jika memungkinkan.

## Keamanan dan batas kepercayaan

Bridge tidak menciptakan perutean. Ia hanya mengekspos percakapan yang sudah
diketahui Gateway cara merutekannya.

Artinya:

- allowlist pengirim, pairing, dan kepercayaan tingkat channel tetap menjadi bagian
  dari konfigurasi channel OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya bersifat live/in-memory untuk sesi bridge saat ini
- auth bridge sebaiknya menggunakan kontrol token atau password Gateway yang sama seperti yang Anda
  percayai untuk klien Gateway remote lainnya

Jika percakapan tidak ada di `conversations_list`, penyebab biasanya bukan
konfigurasi MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap di
sesi Gateway yang mendasarinya.

## Pengujian

OpenClaw menyertakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang telah diberi seed
- memulai container kedua yang memunculkan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran,
  perilaku antrean peristiwa langsung, dan perutean pengiriman keluar
- memvalidasi notifikasi channel dan izin bergaya Claude melalui bridge MCP stdio yang nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun
Telegram, Discord, atau iMessage nyata ke proses pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Testing](/id/help/testing).

## Pemecahan masalah

### Tidak ada percakapan yang dikembalikan

Biasanya berarti sesi Gateway belum dapat dirutekan. Pastikan sesi yang
mendasari sudah menyimpan metadata rute channel/provider, penerima, dan
akun/thread opsional.

### `events_poll` atau `events_wait` melewatkan pesan lama

Ini memang diharapkan. Antrean langsung dimulai saat bridge terhubung. Baca riwayat
transkrip lama dengan `messages_read`.

### Notifikasi Claude tidak muncul

Periksa semua hal berikut:

- klien mempertahankan sesi MCP stdio tetap terbuka
- `--claude-channel-mode` adalah `on` atau `auto`
- klien benar-benar memahami metode notifikasi khusus Claude
- pesan masuk terjadi setelah bridge terhubung

### Persetujuan tidak muncul

`permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati saat bridge
terhubung. Ini bukan API riwayat persetujuan yang tahan lama.

## OpenClaw sebagai registri klien MCP

Ini adalah path `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Perintah ini mengelola definisi server MCP
milik OpenClaw di bawah `mcp.servers` dalam konfigurasi OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang akan diluncurkan atau dikonfigurasi OpenClaw
nantinya, seperti Pi tersemat dan adaptor runtime lainnya. OpenClaw menyimpan
definisi tersebut secara terpusat agar runtime tersebut tidak perlu menyimpan daftar server
MCP duplikat mereka sendiri.

Perilaku penting:

- perintah ini hanya membaca atau menulis konfigurasi OpenClaw
- perintah ini tidak terhubung ke server MCP target
- perintah ini tidak memvalidasi apakah perintah, URL, atau transport remote
  dapat dijangkau saat ini
- adaptor runtime memutuskan bentuk transport mana yang benar-benar mereka dukung saat
  waktu eksekusi
- Pi tersemat mengekspos tool MCP yang dikonfigurasi dalam profil tool `coding` dan `messaging`
  normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]`
  menonaktifkannya secara eksplisit
- runtime MCP bawaan berskala sesi dipanen setelah `mcp.sessionIdleTtlMs`
  milidetik waktu idle (default 10 menit; setel `0` untuk menonaktifkan) dan
  proses tersemat sekali jalan membersihkannya saat akhir proses

## Definisi server MCP yang disimpan

OpenClaw juga menyimpan registri server MCP ringan dalam konfigurasi untuk permukaan
yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP terkonfigurasi lengkap.
- `set` mengharapkan satu nilai objek JSON di baris perintah.
- `unset` gagal jika server bernama tersebut tidak ada.

Contoh:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Contoh bentuk konfigurasi:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Meluncurkan proses anak lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Deskripsi                        |
| -------------------------- | -------------------------------- |
| `command`                  | Executable yang akan dijalankan (wajib) |
| `args`                     | Array argumen baris perintah     |
| `env`                      | Variabel lingkungan tambahan     |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses     |

#### Filter keamanan env stdio

OpenClaw menolak key env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, bahkan jika key tersebut muncul di blok `env` milik server. Key yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak key-key ini dengan error konfigurasi sehingga key tersebut tidak dapat menyisipkan prelude implisit, menukar interpreter, atau mengaktifkan debugger terhadap proses stdio. Variabel env kredensial, proxy, dan khusus server biasa (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` kustom, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar memerlukan salah satu variabel yang diblokir, setel variabel tersebut pada proses host gateway alih-alih di bawah `env` server stdio.

### Transport SSE / HTTP

Terhubung ke server MCP remote melalui HTTP Server-Sent Events.

| Field                 | Deskripsi                                                            |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                       |
| `headers`             | Peta key-value opsional dari header HTTP (misalnya token auth)       |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                       |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Nilai sensitif dalam `url` (userinfo) dan `headers` disamarkan dalam log dan
output status.

### Transport Streamable HTTP

`streamable-http` adalah opsi transport tambahan selain `sse` dan `stdio`. Ini menggunakan HTTP streaming untuk komunikasi dua arah dengan server MCP remote.

| Field                 | Deskripsi                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                                              |
| `transport`           | Setel ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
| `headers`             | Peta key-value opsional dari header HTTP (misalnya token auth)                              |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                                              |

Contoh:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Perintah-perintah ini hanya mengelola konfigurasi yang disimpan. Perintah ini tidak memulai bridge channel,
membuka sesi klien MCP langsung, atau membuktikan bahwa server target dapat dijangkau.

## Batasan saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirim hari ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik selain adaptor khusus Claude
- belum ada tool edit pesan atau react
- transport HTTP/SSE/streamable-http terhubung ke satu server remote; belum ada upstream multiplexed
- `permissions_list_open` hanya mencakup persetujuan yang diamati saat bridge
  terhubung

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin](/id/cli/plugins)
