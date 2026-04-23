---
read_when:
    - Menghubungkan Codex, Claude Code, atau klien MCP lain ke channel yang didukung OpenClaw
    - Menjalankan `openclaw mcp serve`
    - Mengelola definisi server MCP yang disimpan oleh OpenClaw
summary: Mengekspos percakapan channel OpenClaw melalui MCP dan mengelola definisi server MCP yang disimpan
title: mcp
x-i18n:
    generated_at: "2026-04-23T09:19:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` memiliki dua tugas:

- menjalankan OpenClaw sebagai server MCP dengan `openclaw mcp serve`
- mengelola definisi server MCP keluar milik OpenClaw dengan `list`, `show`,
  `set`, dan `unset`

Dengan kata lain:

- `serve` adalah OpenClaw yang bertindak sebagai server MCP
- `list` / `show` / `set` / `unset` adalah OpenClaw yang bertindak sebagai registry
  sisi klien MCP untuk server MCP lain yang mungkin digunakan oleh runtime-nya nanti

Gunakan [`openclaw acp`](/id/cli/acp) saat OpenClaw harus meng-host sesi harness
coding itu sendiri dan merutekan runtime tersebut melalui ACP.

## OpenClaw sebagai server MCP

Ini adalah jalur `openclaw mcp serve`.

## Kapan menggunakan `serve`

Gunakan `openclaw mcp serve` saat:

- Codex, Claude Code, atau klien MCP lain harus berbicara langsung dengan
  percakapan channel yang didukung OpenClaw
- Anda sudah memiliki Gateway OpenClaw lokal atau remote dengan sesi yang telah dirutekan
- Anda menginginkan satu server MCP yang bekerja di seluruh backend channel OpenClaw alih-alih
  menjalankan bridge terpisah per channel

Gunakan [`openclaw acp`](/id/cli/acp) sebagai gantinya saat OpenClaw harus meng-host runtime
coding itu sendiri dan menjaga sesi agent tetap berada di dalam OpenClaw.

## Cara kerjanya

`openclaw mcp serve` memulai server MCP stdio. Klien MCP memiliki proses
tersebut. Selama klien menjaga sesi stdio tetap terbuka, bridge terhubung ke
Gateway OpenClaw lokal atau remote melalui WebSocket dan mengekspos percakapan
channel yang telah dirutekan melalui MCP.

Siklus hidup:

1. klien MCP menjalankan `openclaw mcp serve`
2. bridge terhubung ke Gateway
3. sesi yang dirutekan menjadi percakapan MCP dan tool transkrip/riwayat
4. event live diantrikan di memori selama bridge terhubung
5. jika mode channel Claude diaktifkan, sesi yang sama juga dapat menerima
   notifikasi push khusus Claude

Perilaku penting:

- status antrean live dimulai saat bridge terhubung
- riwayat transkrip yang lebih lama dibaca dengan `messages_read`
- notifikasi push Claude hanya ada selama sesi MCP aktif
- saat klien terputus, bridge keluar dan antrean live hilang
- server stdio MCP yang dijalankan oleh OpenClaw (bawaan atau dikonfigurasi pengguna) dihentikan
  sebagai pohon proses saat shutdown, sehingga subprocess turunan yang dimulai oleh
  server tidak bertahan setelah klien stdio induk keluar
- menghapus atau mereset sesi akan membuang klien MCP sesi tersebut melalui
  jalur cleanup runtime bersama, sehingga tidak ada koneksi stdio yang tertinggal
  yang terikat pada sesi yang dihapus

## Pilih mode klien

Gunakan bridge yang sama dengan dua cara berbeda:

- Klien MCP generik: hanya tool MCP standar. Gunakan `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send`, dan tool
  persetujuan.
- Claude Code: tool MCP standar ditambah adaptor channel khusus Claude.
  Aktifkan `--claude-channel-mode on` atau biarkan default `auto`.

Saat ini, `auto` berperilaku sama dengan `on`. Belum ada deteksi kapabilitas
klien.

## Yang diekspos `serve`

Bridge menggunakan metadata rute sesi Gateway yang sudah ada untuk mengekspos
percakapan yang didukung channel. Sebuah percakapan muncul saat OpenClaw sudah
memiliki status sesi dengan rute yang dikenal seperti:

- `channel`
- metadata penerima atau tujuan
- `accountId` opsional
- `threadId` opsional

Ini memberi klien MCP satu tempat untuk:

- mencantumkan percakapan yang baru dirutekan
- membaca riwayat transkrip terbaru
- menunggu event masuk baru
- mengirim balasan kembali melalui rute yang sama
- melihat permintaan persetujuan yang datang saat bridge terhubung

## Penggunaan

```bash
# Gateway lokal
openclaw mcp serve

# Gateway remote
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remote dengan auth kata sandi
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

Mencantumkan percakapan terbaru yang didukung sesi yang sudah memiliki metadata
rute dalam status sesi Gateway.

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
tampilan metadata atas konten transkrip, bukan penyimpanan blob lampiran tahan
lama yang berdiri sendiri.

### `events_poll`

Membaca event live yang diantrikan sejak cursor numerik.

### `events_wait`

Long-poll sampai event yang cocok berikutnya tiba atau timeout berakhir.

Gunakan ini saat klien MCP generik membutuhkan pengiriman hampir real-time tanpa
protokol push khusus Claude.

### `messages_send`

Mengirim teks kembali melalui rute yang sama yang sudah tercatat pada sesi.

Perilaku saat ini:

- memerlukan rute percakapan yang sudah ada
- menggunakan channel, penerima, account id, dan thread id milik sesi
- hanya mengirim teks

### `permissions_list_open`

Mencantumkan permintaan persetujuan exec/plugin yang tertunda yang telah diamati
bridge sejak terhubung ke Gateway.

### `permissions_respond`

Menyelesaikan satu permintaan persetujuan exec/plugin tertunda dengan:

- `allow-once`
- `allow-always`
- `deny`

## Model event

Bridge menyimpan antrean event di memori selama terhubung.

Jenis event saat ini:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Batasan penting:

- antrean hanya live; dimulai saat bridge MCP dimulai
- `events_poll` dan `events_wait` tidak memutar ulang riwayat Gateway yang lebih lama
  dengan sendirinya
- backlog yang tahan lama harus dibaca dengan `messages_read`

## Notifikasi channel Claude

Bridge juga dapat mengekspos notifikasi channel khusus Claude. Ini adalah
padanan OpenClaw untuk adaptor channel Claude Code: tool MCP standar tetap
tersedia, tetapi pesan masuk live juga dapat tiba sebagai notifikasi MCP khusus
Claude.

Flag:

- `--claude-channel-mode off`: hanya tool MCP standar
- `--claude-channel-mode on`: aktifkan notifikasi channel Claude
- `--claude-channel-mode auto`: default saat ini; perilaku bridge sama dengan `on`

Saat mode channel Claude diaktifkan, server mengiklankan kapabilitas eksperimental
Claude dan dapat mengirimkan:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Perilaku bridge saat ini:

- pesan transkrip `user` yang masuk diteruskan sebagai
  `notifications/claude/channel`
- permintaan izin Claude yang diterima melalui MCP dilacak di memori
- jika percakapan yang terhubung kemudian mengirim `yes abcde` atau `no abcde`, bridge
  mengonversinya menjadi `notifications/claude/channel/permission`
- notifikasi ini hanya untuk sesi live; jika klien MCP terputus,
  tidak ada target push

Ini memang sengaja spesifik klien. Klien MCP generik sebaiknya bergantung pada
tool polling standar.

## Config klien MCP

Contoh config klien stdio:

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

Untuk sebagian besar klien MCP generik, mulai dengan surface tool standar dan
abaikan mode Claude. Aktifkan mode Claude hanya untuk klien yang benar-benar
memahami metode notifikasi khusus Claude.

## Opsi

`openclaw mcp serve` mendukung:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: baca token dari file
- `--password <password>`: kata sandi Gateway
- `--password-file <path>`: baca kata sandi dari file
- `--claude-channel-mode <auto|on|off>`: mode notifikasi Claude
- `-v`, `--verbose`: log verbose ke stderr

Sebaiknya gunakan `--token-file` atau `--password-file` daripada secret inline jika memungkinkan.

## Keamanan dan batas kepercayaan

Bridge tidak menciptakan routing. Bridge hanya mengekspos percakapan yang sudah
diketahui Gateway cara merutekannya.

Artinya:

- allowlist pengirim, pairing, dan trust tingkat channel tetap menjadi milik
  konfigurasi channel OpenClaw yang mendasarinya
- `messages_send` hanya dapat membalas melalui rute tersimpan yang sudah ada
- status persetujuan hanya live/di memori untuk sesi bridge saat ini
- auth bridge harus menggunakan kontrol token atau kata sandi Gateway yang sama
  seperti yang akan Anda percaya untuk klien Gateway remote lainnya

Jika sebuah percakapan tidak ada di `conversations_list`, penyebab biasanya bukan
config MCP. Penyebabnya adalah metadata rute yang hilang atau tidak lengkap pada
sesi Gateway yang mendasarinya.

## Pengujian

OpenClaw menyediakan smoke Docker deterministik untuk bridge ini:

```bash
pnpm test:docker:mcp-channels
```

Smoke tersebut:

- memulai container Gateway yang sudah di-seed
- memulai container kedua yang menjalankan `openclaw mcp serve`
- memverifikasi penemuan percakapan, pembacaan transkrip, pembacaan metadata lampiran,
  perilaku antrean event live, dan routing pengiriman keluar
- memvalidasi notifikasi channel dan izin bergaya Claude melalui bridge stdio MCP yang nyata

Ini adalah cara tercepat untuk membuktikan bridge berfungsi tanpa menghubungkan akun
Telegram, Discord, atau iMessage nyata ke dalam pengujian.

Untuk konteks pengujian yang lebih luas, lihat [Testing](/id/help/testing).

## Pemecahan masalah

### Tidak ada percakapan yang dikembalikan

Biasanya berarti sesi Gateway belum dapat dirutekan. Konfirmasikan bahwa sesi
yang mendasarinya telah menyimpan metadata rute channel/provider, penerima, dan
account/thread opsional.

### `events_poll` atau `events_wait` melewatkan pesan lama

Ini sesuai harapan. Antrean live dimulai saat bridge terhubung. Baca riwayat
transkrip yang lebih lama dengan `messages_read`.

### Notifikasi Claude tidak muncul

Periksa semua hal berikut:

- klien menjaga sesi stdio MCP tetap terbuka
- `--claude-channel-mode` bernilai `on` atau `auto`
- klien benar-benar memahami metode notifikasi khusus Claude
- pesan masuk terjadi setelah bridge terhubung

### Persetujuan tidak ada

`permissions_list_open` hanya menampilkan permintaan persetujuan yang diamati
saat bridge terhubung. Ini bukan API riwayat persetujuan yang tahan lama.

## OpenClaw sebagai registry klien MCP

Ini adalah jalur `openclaw mcp list`, `show`, `set`, dan `unset`.

Perintah-perintah ini tidak mengekspos OpenClaw melalui MCP. Mereka mengelola
definisi server MCP milik OpenClaw di bawah `mcp.servers` dalam config OpenClaw.

Definisi yang disimpan tersebut ditujukan untuk runtime yang dijalankan atau
dikonfigurasi OpenClaw nanti, seperti Pi tertanam dan adaptor runtime lainnya.
OpenClaw menyimpan definisi tersebut secara terpusat agar runtime tersebut tidak
perlu menyimpan daftar server MCP duplikat mereka sendiri.

Perilaku penting:

- perintah-perintah ini hanya membaca atau menulis config OpenClaw
- perintah-perintah ini tidak terhubung ke server MCP target
- perintah-perintah ini tidak memvalidasi apakah perintah, URL, atau transport remote
  dapat dijangkau saat ini
- adaptor runtime memutuskan bentuk transport mana yang benar-benar didukung saat
  waktu eksekusi
- Pi tertanam mengekspos tool MCP yang dikonfigurasi dalam profil tool `coding` dan `messaging`
  normal; `minimal` tetap menyembunyikannya, dan `tools.deny: ["bundle-mcp"]`
  menonaktifkannya secara eksplisit

## Definisi server MCP yang disimpan

OpenClaw juga menyimpan registry server MCP ringan dalam config untuk surface
yang menginginkan definisi MCP yang dikelola OpenClaw.

Perintah:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Catatan:

- `list` mengurutkan nama server.
- `show` tanpa nama mencetak objek server MCP yang dikonfigurasi secara penuh.
- `set` mengharapkan satu nilai objek JSON pada command line.
- `unset` gagal jika server bernama tersebut tidak ada.

Contoh:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Contoh bentuk config:

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

Menjalankan child process lokal dan berkomunikasi melalui stdin/stdout.

| Field                      | Description                            |
| -------------------------- | -------------------------------------- |
| `command`                  | Executable yang dijalankan (wajib)     |
| `args`                     | Array argumen command line             |
| `env`                      | Variabel lingkungan tambahan           |
| `cwd` / `workingDirectory` | Direktori kerja untuk proses           |

#### Filter keamanan env stdio

OpenClaw menolak kunci env startup interpreter yang dapat mengubah cara server MCP stdio dimulai sebelum RPC pertama, bahkan jika kunci tersebut muncul di blok `env` milik server. Kunci yang diblokir mencakup `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, dan variabel kontrol runtime serupa. Startup menolak kunci ini dengan error konfigurasi sehingga mereka tidak dapat menyuntikkan prelude implisit, menukar interpreter, atau mengaktifkan debugger terhadap proses stdio. Variabel env kredensial, proxy, dan khusus server yang umum (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` kustom, dll.) tidak terpengaruh.

Jika server MCP Anda benar-benar memerlukan salah satu variabel yang diblokir, atur variabel tersebut pada proses host Gateway, bukan di bawah `env` server stdio.

### Transport SSE / HTTP

Terhubung ke server MCP remote melalui HTTP Server-Sent Events.

| Field                 | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                      |
| `headers`             | Peta key-value opsional dari header HTTP (misalnya token auth)      |
| `connectionTimeoutMs` | Timeout koneksi per server dalam ms (opsional)                      |

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

Nilai sensitif di `url` (userinfo) dan `headers` disamarkan dalam log dan
output status.

### Transport HTTP streamable

`streamable-http` adalah opsi transport tambahan selain `sse` dan `stdio`. Opsi ini menggunakan streaming HTTP untuk komunikasi dua arah dengan server MCP remote.

| Field                 | Description                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP atau HTTPS dari server remote (wajib)                                              |
| `transport`           | Atur ke `"streamable-http"` untuk memilih transport ini; jika dihilangkan, OpenClaw menggunakan `sse` |
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

Perintah-perintah ini hanya mengelola config yang disimpan. Mereka tidak memulai bridge channel,
membuka sesi klien MCP live, atau membuktikan bahwa server target dapat dijangkau.

## Batasan saat ini

Halaman ini mendokumentasikan bridge sebagaimana dikirim saat ini.

Batasan saat ini:

- penemuan percakapan bergantung pada metadata rute sesi Gateway yang sudah ada
- belum ada protokol push generik selain adaptor khusus Claude
- belum ada tool edit pesan atau reaksi
- transport HTTP/SSE/streamable-http terhubung ke satu server remote; belum ada upstream multiplexed
- `permissions_list_open` hanya mencakup persetujuan yang diamati saat bridge
  terhubung
