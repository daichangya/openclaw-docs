---
read_when:
    - Anda menginginkan panduan TUI yang ramah untuk pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Terminal UI (TUI): terhubung ke Gateway atau jalankan secara lokal dalam mode embedded'
title: TUI
x-i18n:
    generated_at: "2026-04-25T13:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Mulai cepat

### Mode Gateway

1. Mulai Gateway.

```bash
openclaw gateway
```

2. Buka TUI.

```bash
openclaw tui
```

3. Ketik pesan dan tekan Enter.

Gateway jarak jauh:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gunakan `--password` jika Gateway Anda menggunakan auth kata sandi.

### Mode lokal

Jalankan TUI tanpa Gateway:

```bash
openclaw chat
# atau
openclaw tui --local
```

Catatan:

- `openclaw chat` dan `openclaw terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- Mode lokal menggunakan runtime agent embedded secara langsung. Sebagian besar tool lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.
- `openclaw` dan `openclaw crestodian` juga menggunakan shell TUI ini, dengan Crestodian sebagai backend chat penyiapan dan perbaikan lokal.

## Apa yang Anda lihat

- Header: URL koneksi, agent saat ini, sesi saat ini.
- Log chat: pesan pengguna, balasan asisten, notifikasi sistem, kartu tool.
- Baris status: status koneksi/eksekusi (connecting, running, streaming, idle, error).
- Footer: status koneksi + agent + sesi + model + think/fast/verbose/trace/reasoning + jumlah token + deliver.
- Input: editor teks dengan autocomplete.

## Model mental: agent + sesi

- Agent adalah slug unik (mis. `main`, `research`). Gateway mengekspos daftarnya.
- Sesi milik agent saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda berpindah ke sesi agent itu secara eksplisit.
- Cakupan sesi:
  - `per-sender` (default): setiap agent memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agent + sesi saat ini selalu terlihat di footer.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; delivery ke provider nonaktif secara default.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Settings
  - atau mulai dengan `openclaw tui --deliver`

## Pemilih + overlay

- Pemilih model: daftar model yang tersedia dan atur override sesi.
- Pemilih agent: pilih agent yang berbeda.
- Pemilih sesi: hanya menampilkan sesi untuk agent saat ini.
- Settings: toggle deliver, perluasan output tool, dan visibilitas thinking.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: hentikan eksekusi aktif
- Ctrl+C: kosongkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agent
- Ctrl+P: pemilih sesi
- Ctrl+O: toggle perluasan output tool
- Ctrl+T: toggle visibilitas thinking (memuat ulang riwayat)

## Perintah slash

Inti:

- `/help`
- `/status`
- `/agent <id>` (atau `/agents`)
- `/session <key>` (atau `/sessions`)
- `/model <provider/model>` (atau `/models`)

Kontrol sesi:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Siklus hidup sesi:

- `/new` atau `/reset` (reset sesi)
- `/abort` (hentikan eksekusi aktif)
- `/settings`
- `/exit`

Khusus mode lokal:

- `/auth [provider]` membuka alur auth/login provider di dalam TUI.

Perintah slash Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah slash](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal di host TUI.
- TUI meminta konfirmasi sekali per sesi untuk mengizinkan eksekusi lokal; jika ditolak, `!` tetap nonaktif untuk sesi tersebut.
- Perintah berjalan di shell baru noninteraktif di direktori kerja TUI (tanpa `cd`/env persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di environment-nya.
- `!` tunggal dikirim sebagai pesan biasa; spasi di awal tidak memicu exec lokal.

## Memperbaiki config dari TUI lokal

Gunakan mode lokal saat config saat ini sudah valid dan Anda ingin
agent embedded memeriksanya di mesin yang sama, membandingkannya dengan dokumen,
dan membantu memperbaiki drift tanpa bergantung pada Gateway yang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dulu dengan `openclaw configure`
atau `openclaw doctor --fix`. `openclaw chat` tidak melewati guard config tidak valid.

Alur umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Tanyakan kepada agent apa yang ingin Anda periksa, misalnya:

```text
Bandingkan config auth gateway saya dengan dokumen dan sarankan perbaikan terkecil.
```

3. Gunakan perintah shell lokal untuk bukti dan validasi yang tepat:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Terapkan perubahan sempit dengan `openclaw config set` atau `openclaw configure`, lalu jalankan ulang `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau dan jalankan `!openclaw doctor --fix`.

Tips:

- Utamakan `openclaw config set` atau `openclaw configure` daripada mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks dokumen live dari mesin yang sama.
- `openclaw config validate --json` berguna saat Anda menginginkan error skema dan SecretRef/resolvability yang terstruktur.

## Output tool

- Pemanggilan tool ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O men-toggle antara tampilan terlipat/terbuka.
- Saat tool berjalan, pembaruan parsial di-stream ke kartu yang sama.

## Warna terminal

- TUI menjaga teks isi asisten dalam foreground default terminal Anda agar terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis salah, atur `OPENCLAW_THEME=light` sebelum menjalankan `openclaw tui`.
- Untuk memaksa palet gelap asli, atur `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga difinalisasi.
- TUI juga mendengarkan event tool agent untuk kartu tool yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Reconnect menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agent embedded lokal
- `--url <url>`: URL WebSocket Gateway (default dari config atau `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jika diperlukan)
- `--password <password>`: kata sandi Gateway (jika diperlukan)
- `--session <key>`: kunci sesi (default: `main`, atau `global` saat cakupannya global)
- `--deliver`: Kirim balasan asisten ke provider (default nonaktif)
- `--thinking <level>`: Override level thinking untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: timeout agent dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: jumlah entri riwayat yang dimuat (default `200`)

Catatan: saat Anda mengatur `--url`, TUI tidak menggunakan fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.
Dalam mode lokal, jangan berikan `--url`, `--token`, atau `--password`.

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan idle/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Konfirmasikan agent dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di channel chat, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agent di pemilih: periksa `openclaw agents list` dan config routing Anda.
- Pemilih sesi kosong: Anda mungkin berada di cakupan global atau belum memiliki sesi.

## Terkait

- [UI Kontrol](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Config](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan dan migrasi terpandu
- [Referensi CLI](/id/cli) — referensi lengkap perintah CLI
